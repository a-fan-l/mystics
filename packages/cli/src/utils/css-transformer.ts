/**
 * CSS Transform 转换器工具类
 * 将传统的 CSS transform 属性转换为 3D 矩阵
 */

import css from 'css';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { CssTransformOptions, TransformResult, TransformProperty, CLIResponse } from '../types/common';

export class CssTransformer {
  private spinner: ora.Ora;

  constructor() {
    this.spinner = ora();
  }

  /**
   * 解析 transform 值并转换为 3D 矩阵
   */
  private parseTransform(transformValue: string): string {
    const transforms = this.extractTransforms(transformValue);
    const matrix = this.calculateMatrix3d(transforms);
    return `matrix3d(${matrix.join(', ')})`;
  }

  /**
   * 提取 transform 函数
   */
  private extractTransforms(value: string): TransformProperty[] {
    const transforms: TransformProperty[] = [];
    const regex = /(\w+)\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(value)) !== null) {
      transforms.push({
        property: match[1],
        value: match[2],
      });
    }

    return transforms;
  }

  /**
   * 计算 3D 矩阵
   */
  private calculateMatrix3d(transforms: TransformProperty[]): number[] {
    // 初始化单位矩阵 4x4
    let matrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];

    for (const transform of transforms) {
      const transformMatrix = this.getTransformMatrix(transform);
      matrix = this.multiplyMatrices(matrix, transformMatrix);
    }

    return matrix;
  }

  /**
   * 获取单个 transform 的矩阵
   */
  private getTransformMatrix(transform: TransformProperty): number[] {
    const { property, value } = transform;
    const values = value.split(',').map(v => parseFloat(v.trim()));

    switch (property) {
      case 'translateX':
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, values[0], 0, 0, 1];
      
      case 'translateY':
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, values[0], 0, 1];
      
      case 'translateZ':
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, values[0], 1];
      
      case 'translate':
        const [tx = 0, ty = 0] = values;
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1];
      
      case 'translate3d':
        const [t3x = 0, t3y = 0, t3z = 0] = values;
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t3x, t3y, t3z, 1];
      
      case 'scaleX':
        return [values[0], 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      
      case 'scaleY':
        return [1, 0, 0, 0, 0, values[0], 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      
      case 'scaleZ':
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, values[0], 0, 0, 0, 0, 1];
      
      case 'scale':
        const [sx = 1, sy = sx] = values;
        return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      
      case 'scale3d':
        const [s3x = 1, s3y = 1, s3z = 1] = values;
        return [s3x, 0, 0, 0, 0, s3y, 0, 0, 0, 0, s3z, 0, 0, 0, 0, 1];
      
      case 'rotateX':
        const angleX = this.degToRad(values[0]);
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        return [1, 0, 0, 0, 0, cosX, -sinX, 0, 0, sinX, cosX, 0, 0, 0, 0, 1];
      
      case 'rotateY':
        const angleY = this.degToRad(values[0]);
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        return [cosY, 0, sinY, 0, 0, 1, 0, 0, -sinY, 0, cosY, 0, 0, 0, 0, 1];
      
      case 'rotateZ':
      case 'rotate':
        const angleZ = this.degToRad(values[0]);
        const cosZ = Math.cos(angleZ);
        const sinZ = Math.sin(angleZ);
        return [cosZ, -sinZ, 0, 0, sinZ, cosZ, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      
      case 'skewX':
        const skewXAngle = this.degToRad(values[0]);
        return [1, Math.tan(skewXAngle), 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      
      case 'skewY':
        const skewYAngle = this.degToRad(values[0]);
        return [1, 0, 0, 0, Math.tan(skewYAngle), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      
      case 'skew':
        const [skX = 0, skY = 0] = values;
        const skewXRad = this.degToRad(skX);
        const skewYRad = this.degToRad(skY);
        return [1, Math.tan(skewXRad), 0, 0, Math.tan(skewYRad), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
      
      default:
        // 返回单位矩阵
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
  }

  /**
   * 角度转弧度
   */
  private degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  /**
   * 矩阵相乘
   */
  private multiplyMatrices(a: number[], b: number[]): number[] {
    const result = new Array(16).fill(0);
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
        }
      }
    }
    
    return result;
  }

  /**
   * 读取 CSS 文件
   */
  async readCssFile(filePath: string): Promise<CLIResponse<string>> {
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `文件不存在: ${filePath}`
        };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return {
        success: true,
        data: content,
        message: '文件读取成功'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件读取失败'
      };
    }
  }

  /**
   * 解析并转换 CSS
   */
  async transformCss(cssContent: string): Promise<CLIResponse<{ content: string; stats: TransformResult }>> {
    this.spinner.start(chalk.blue('正在转换 CSS transform...'));
    
    try {
      const ast = css.parse(cssContent);
      let rulesProcessed = 0;
      let transformsConverted = 0;

      const processRules = (rules: any[]) => {
        rules.forEach(rule => {
          if (rule.type === 'rule' && rule.declarations) {
            rulesProcessed++;
            
            rule.declarations.forEach((decl: any) => {
              if (decl.type === 'declaration' && decl.property === 'transform') {
                if (!decl.value.includes('matrix3d')) {
                  decl.value = this.parseTransform(decl.value);
                  transformsConverted++;
                }
              }
            });
          } else if (rule.type === 'media' && rule.rules) {
            processRules(rule.rules);
          }
        });
      };

      if (ast.stylesheet?.rules) {
        processRules(ast.stylesheet.rules);
      }

      const transformedContent = css.stringify(ast);
      
      this.spinner.succeed(chalk.green('CSS transform 转换完成'));

      return {
        success: true,
        data: {
          content: transformedContent,
          stats: {
            success: true,
            rulesProcessed,
            transformsConverted
          }
        },
        message: '转换完成'
      };
    } catch (error) {
      this.spinner.fail(chalk.red('CSS transform 转换失败'));
      return {
        success: false,
        error: error instanceof Error ? error.message : '转换失败'
      };
    }
  }

  /**
   * 保存转换后的 CSS
   */
  async saveCssFile(content: string, outputPath: string, backup: boolean = true): Promise<CLIResponse<string>> {
    try {
      // 备份原文件
      if (backup && fs.existsSync(outputPath)) {
        const backupPath = outputPath + '.backup';
        fs.copyFileSync(outputPath, backupPath);
        console.log(chalk.yellow(`📋 原文件已备份: ${backupPath}`));
      }

      // 确保输出目录存在
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, content, 'utf8');
      
      return {
        success: true,
        data: outputPath,
        message: `文件已保存到 ${outputPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件保存失败'
      };
    }
  }

  /**
   * 完整的转换流程
   */
  async transform(options: CssTransformOptions): Promise<CLIResponse<TransformResult>> {
    console.log(chalk.cyan.bold('\n🎨 Mystics CSS Transform Converter\n'));
    
    console.log(chalk.blue('配置信息:'));
    console.log(chalk.gray(`  输入文件: ${options.inputFile}`));
    console.log(chalk.gray(`  输出文件: ${options.outputFile || options.inputFile}`));
    console.log(chalk.gray(`  备份原文件: ${options.backup ? '是' : '否'}`));
    console.log('');

    // 1. 读取 CSS 文件
    const readResult = await this.readCssFile(options.inputFile);
    if (!readResult.success) {
      return {
        success: false,
        error: readResult.error
      };
    }

    // 2. 转换 CSS
    const transformResult = await this.transformCss(readResult.data!);
    if (!transformResult.success) {
      return {
        success: false,
        error: transformResult.error
      };
    }

    // 3. 保存文件
    const outputPath = options.outputFile || options.inputFile;
    const saveResult = await this.saveCssFile(
      transformResult.data!.content,
      outputPath,
      options.backup
    );

    if (saveResult.success) {
      const stats = transformResult.data!.stats;
      console.log(chalk.green.bold('\n✅ CSS 转换完成!'));
      console.log(chalk.green(`📁 文件保存位置: ${saveResult.data}`));
      console.log(chalk.blue('\n📊 转换统计:'));
      console.log(chalk.gray(`  处理规则数: ${stats.rulesProcessed}`));
      console.log(chalk.gray(`  转换属性数: ${stats.transformsConverted}`));
      
      return {
        success: true,
        data: {
          ...stats,
          outputPath: saveResult.data
        }
      };
    }

    return {
      success: false,
      error: saveResult.error
    };
  }
}