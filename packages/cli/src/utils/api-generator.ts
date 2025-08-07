/**
 * API 类型生成器工具类
 * 使用 quicktype 从 API 响应生成 TypeScript 类型定义
 */

import { quicktype, InputData, jsonInputForTargetLanguage } from 'quicktype-core';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { ApiTypeOptions, ApiResponse, CLIResponse } from '../types/common';

export class ApiTypeGenerator {
  private spinner: ora.Ora;

  constructor() {
    this.spinner = ora();
  }

  /**
   * 从 URL 获取 API 数据
   */
  async fetchApiData(url: string): Promise<CLIResponse<any>> {
    this.spinner.start(chalk.blue('正在获取 API 数据...'));
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.spinner.succeed(chalk.green('API 数据获取成功'));
      
      return {
        success: true,
        data,
        message: '数据获取成功'
      };
    } catch (error) {
      this.spinner.fail(chalk.red('API 数据获取失败'));
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成 TypeScript 类型定义
   */
  async generateTypes(data: any, typeName: string): Promise<CLIResponse<string>> {
    this.spinner.start(chalk.blue('正在生成类型定义...'));
    
    try {
      const jsonInput = jsonInputForTargetLanguage('typescript');
      await jsonInput.addSource({
        name: typeName,
        samples: [JSON.stringify(data)]
      });

      const inputData = new InputData();
      inputData.addInput(jsonInput);

      const result = await quicktype({
        inputData,
        lang: 'typescript',
        rendererOptions: {
          'just-types': 'true',
          'prefer-types': 'true',
          'explicit-unions': 'true'
        }
      });

      this.spinner.succeed(chalk.green('类型定义生成成功'));
      
      return {
        success: true,
        data: result.lines.join('\n'),
        message: '类型定义生成成功'
      };
    } catch (error) {
      this.spinner.fail(chalk.red('类型定义生成失败'));
      return {
        success: false,
        error: error instanceof Error ? error.message : '类型生成失败'
      };
    }
  }

  /**
   * 保存类型定义到文件
   */
  async saveToFile(content: string, outputPath: string, overwrite: boolean = false): Promise<CLIResponse<string>> {
    try {
      // 确保输出目录存在
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 检查文件是否已存在
      if (fs.existsSync(outputPath) && !overwrite) {
        return {
          success: false,
          error: `文件 ${outputPath} 已存在，使用 --overwrite 选项覆盖`
        };
      }

      // 添加文件头注释
      const header = `/**
 * 自动生成的类型定义文件
 * 生成时间: ${new Date().toLocaleString()}
 * 请勿手动修改此文件
 */

`;

      fs.writeFileSync(outputPath, header + content, 'utf8');
      
      return {
        success: true,
        data: outputPath,
        message: `类型定义已保存到 ${outputPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '文件保存失败'
      };
    }
  }

  /**
   * 完整的类型生成流程
   */
  async generate(options: ApiTypeOptions): Promise<CLIResponse<string>> {
    console.log(chalk.cyan.bold('\n🚀 Mystics API Type Generator\n'));
    
    console.log(chalk.blue('配置信息:'));
    console.log(chalk.gray(`  API URL: ${options.url}`));
    console.log(chalk.gray(`  类型名称: ${options.typeName}`));
    console.log(chalk.gray(`  输出路径: ${options.outputPath}`));
    console.log('');

    // 1. 获取 API 数据
    const fetchResult = await this.fetchApiData(options.url);
    if (!fetchResult.success) {
      return fetchResult;
    }

    // 2. 生成类型定义
    const typeResult = await this.generateTypes(fetchResult.data, options.typeName);
    if (!typeResult.success) {
      return typeResult;
    }

    // 3. 保存到文件
    const saveResult = await this.saveToFile(
      typeResult.data!,
      options.outputPath,
      options.overwrite
    );

    if (saveResult.success) {
      console.log(chalk.green.bold('\n✅ 类型生成完成!'));
      console.log(chalk.green(`📁 文件保存位置: ${saveResult.data}`));
      console.log(chalk.blue('\n💡 使用方式:'));
      console.log(chalk.gray(`  import { ${options.typeName} } from './${path.basename(options.outputPath, '.ts')}';`));
    }

    return saveResult;
  }

  /**
   * 验证 URL 格式
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 生成默认输出路径
   */
  static generateOutputPath(typeName: string, outputDir: string = './types'): string {
    const fileName = typeName.charAt(0).toLowerCase() + typeName.slice(1) + '.ts';
    return path.join(outputDir, fileName);
  }
}