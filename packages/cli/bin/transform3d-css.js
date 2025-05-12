// #!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { program } = require('commander');
const chalk = require('chalk');
const prompts = require('prompts');

// CLI 设置
program
  .name('css-transform-to-matrix3d')
  .description('将 CSS transform 属性转换为 matrix3d 格式')
  .version('1.0.0')
  .argument('<file>', '输入 CSS 文件路径')
  .option('-o, --output <output>', '输出文件路径')
  .option('-v, --verbose', '显示详细转换信息')
  .option('--json', '以 JSON 格式输出详细转换信息')
  .option('--dry-run', '预览更改而不写入磁盘')
  .option('--selector <selector>', '仅转换特定 CSS 选择器的 transform 属性')
  .parse(process.argv);

const options = program.opts();
const filePath = program.args[0];
const outputPath = options.output || filePath.replace(/\.css$/, '.matrix3d.css');
const verbose = options.verbose || false;
const jsonOutput = options.json || false;
const dryRun = options.dryRun || false;
const targetSelector = options.selector || null;

// 数学工具函数
const degToRad = degrees => degrees * Math.PI / 180;

// 变换操作配置
const TRANSFORM_OPERATIONS = {
  translate: {
    params: 2,
    defaults: [0, 0, 0],
    matrix: (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]),
  },
  translateX: { params: 1, defaults: [0], matrix: x => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, 0, 0, 1]) },
  translateY: { params: 1, defaults: [0], matrix: y => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, y, 0, 1]) },
  translateZ: { params: 1, defaults: [0], matrix: z => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]) },
  translate3d: {
    params: 3,
    defaults: [0, 0, 0],
    matrix: (x, y, z) => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]),
  },
  scale: {
    params: 2,
    defaults: [1, 1],
    matrix: (x, y) => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  },
  scaleX: { params: 1, defaults: [1], matrix: x => new Float32Array([x, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) },
  scaleY: { params: 1, defaults: [1], matrix: y => new Float32Array([1, 0, 0, 0, 0, y, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]) },
  scaleZ: { params: 1, defaults: [1], matrix: z => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]) },
  scale3d: {
    params: 3,
    defaults: [1, 1, 1],
    matrix: (x, y, z) => new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]),
  },
  rotate: {
    params: 1,
    defaults: [0],
    matrix: angle => {
      const rad = degToRad(angle);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return new Float32Array([cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    },
  },
  rotateX: {
    params: 1,
    defaults: [0],
    matrix: angle => {
      const rad = degToRad(angle);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return new Float32Array([1, 0, 0, 0, 0, cos, sin, 0, 0, -sin, cos, 0, 0, 0, 0, 1]);
    },
  },
  rotateY: {
    params: 1,
    defaults: [0],
    matrix: angle => {
      const rad = degToRad(angle);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return new Float32Array([cos, 0, -sin, 0, 0, 1, 0, 0, sin, 0, cos, 0, 0, 0, 0, 1]);
    },
  },
  rotateZ: { params: 1, defaults: [0], matrix: angle => TRANSFORM_OPERATIONS.rotate.matrix(angle) },
  skew: {
    params: 2,
    defaults: [0, 0],
    matrix: (x, y) => new Float32Array([1, Math.tan(degToRad(x)), 0, 0, Math.tan(degToRad(y)), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  },
  skewX: {
    params: 1,
    defaults: [0],
    matrix: x => new Float32Array([1, 0, 0, 0, Math.tan(degToRad(x)), 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  },
  skewY: {
    params: 1,
    defaults: [0],
    matrix: y => new Float32Array([1, Math.tan(degToRad(y)), 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
  },
  matrix: {
    params: 6,
    defaults: [1, 0, 0, 1, 0, 0],
    matrix: (a, b, c, d, tx, ty) => new Float32Array([a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1]),
  },
  matrix3d: {
    params: 16,
    defaults: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    matrix: (...values) => new Float32Array(values),
  },
};

// 变换转换器
class TransformConverter {
  constructor() {
    this.logOperations = []; // 记录操作日志
    this.matrixCache = new Map(); // 缓存转换结果
  }

  /**
   * 解析 transform 字符串为操作列表
   * @param {string} transform - CSS transform 字符串
   * @param {string} selector - CSS 选择器，用于错误上下文
   * @returns {Array} 操作对象数组
   */
  parseTransform(transform, selector) {
    const operations = [];
    const regex = /([a-z0-9-]+)\(([^)]+)\)/gi;
    let match;

    while ((match = regex.exec(transform)) !== null) {
      const operation = match[1];
      const valueStr = match[2];
      const values = valueStr.split(',').map(v => v.trim());

      if (!TRANSFORM_OPERATIONS[operation]) {
        console.warn(chalk.yellow(`不支持的变换操作: ${operation} 在选择器 ${selector} 中`));
        continue;
      }

      const { params, defaults } = TRANSFORM_OPERATIONS[operation];
      if (values.length < params) {
        throw new Error(`无效的 ${operation} 参数在选择器 ${selector} 中: ${valueStr} (期望 ${params} 个参数)`);
      }

      const parsedValues = values.slice(0, params).map((v, i) => {
        const num = parseFloat(v);
        if (isNaN(num)) {
          throw new Error(`无效的数值在 ${operation} 中，选择器 ${selector}: ${v}`);
        }
        return num;
      });

      // 应用默认值
      while (parsedValues.length < defaults.length) {
        parsedValues.push(defaults[parsedValues.length]);
      }

      operations.push({ operation, values: parsedValues });
    }

    return operations;
  }

  /**
   * 创建单位矩阵
   * @returns {Float32Array} 4x4 单位矩阵
   */
  createIdentityMatrix() {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  }

  /**
   * 两个 4x4 矩阵相乘
   * @param {Float32Array} matrixA - 第一个矩阵
   * @param {Float32Array} matrixB - 第二个矩阵
   * @returns {Float32Array} 结果矩阵
   */
  multiplyMatrices(matrixA, matrixB) {
    const result = new Float32Array(16);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        for (let i = 0; i < 4; i++) {
          result[row * 4 + col] += matrixA[row * 4 + i] * matrixB[i * 4 + col];
        }
      }
    }
    return result;
  }

  /**
   * 从矩阵创建 matrix3d 字符串
   * @param {Float32Array} matrix - 4x4 矩阵
   * @returns {string} matrix3d CSS 字符串
   */
  createMatrix3dString(matrix) {
    const formattedMatrix = Array.from(matrix).map(val => {
      const rounded = parseFloat(val.toFixed(6));
      return Math.abs(rounded) < 0.000001 ? 0 : rounded;
    });
    return `matrix3d(${formattedMatrix.join(', ')})`;
  }

  /**
   * 将 transform 字符串转换为 matrix3d
   * @param {string} transformValue - CSS transform 字符串
   * @param {string} selector - CSS 选择器，用于错误上下文
   * @returns {Object} { matrix3d: string, operations: string[] }
   */
  convertTransform(transformValue, selector) {
    // 检查缓存
    const cacheKey = `${selector}:${transformValue}`;
    if (this.matrixCache.has(cacheKey)) {
      return this.matrixCache.get(cacheKey);
    }

    this.logOperations = [];
    const operations = this.parseTransform(transformValue, selector);
    let resultMatrix = this.createIdentityMatrix();

    for (const { operation, values } of operations) {
      const config = TRANSFORM_OPERATIONS[operation];
      const operationMatrix = config.matrix(...values);
      resultMatrix = this.multiplyMatrices(resultMatrix, operationMatrix);
      this.logOperations.push(`${operation}(${values.join(', ')})`);
    }

    const result = {
      matrix3d: this.createMatrix3dString(resultMatrix),
      operations: this.logOperations,
    };

    this.matrixCache.set(cacheKey, result);
    return result;
  }
}

/**
 * 处理 CSS 文件并转换 transform 属性
 * @param {string} filePath - 输入 CSS 文件路径
 * @param {string} outputPath - 输出 CSS 文件路径
 * @param {boolean} verbose - 是否启用详细日志
 * @param {boolean} jsonOutput - 是否以 JSON 格式输出详细日志
 * @param {boolean} dryRun - 是否仅预览更改而不写入磁盘
 * @param {string|null} targetSelector - 仅处理特定 CSS 选择器
 */
async function processCssFile(filePath, outputPath, verbose, jsonOutput, dryRun, targetSelector) {
  try {
    // 验证输入文件
    if (!filePath.endsWith('.css')) {
      throw new Error('输入文件必须具有 .css 扩展名');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`输入文件不存在: ${filePath}`);
    }

    // 读取 CSS 文件
    const cssContent = fs.readFileSync(filePath, 'utf8');
    const converter = new TransformConverter();
    let transformCount = 0;
    const verboseLogs = [];

    // 使用 PostCSS 解析 CSS
    const root = postcss.parse(cssContent);

    // 处理 CSS 规则
    root.walkRules(rule => {
      if (targetSelector && !rule.selector.includes(targetSelector)) {
        return;
      }

      rule.walkDecls('transform', decl => {
        try {
          const { matrix3d, operations } = converter.convertTransform(decl.value, rule.selector);
          const logEntry = {
            selector: rule.selector,
            original: decl.value,
            operations,
            converted: matrix3d,
          };

          if (verbose) {
            if (jsonOutput) {
              verboseLogs.push(logEntry);
            } else {
              console.log(chalk.cyan(`选择器: ${rule.selector}`));
              console.log(chalk.gray(`  原始值: transform: ${decl.value}`));
              console.log(chalk.gray(`  操作: ${operations.join(' -> ')}`));
              console.log(chalk.green(`  转换后: transform: ${matrix3d}`));
              console.log('------------------------');
            }
          }

          decl.value = matrix3d;
          transformCount++;
        } catch (error) {
          console.warn(chalk.yellow(`处理选择器 ${rule.selector} 中的 transform 时出错: ${error.message}`));
        }
      });
    });

    // 输出结果
    const outputCss = root.toString();

    if (verbose && jsonOutput) {
      console.log(JSON.stringify(verboseLogs, null, 2));
    }

    if (dryRun) {
      console.log(chalk.blue('试运行: 输出 CSS 预览:'));
      console.log(outputCss);
      console.log(chalk.green(`✅ 将转换 ${transformCount} 个 transform 属性`));
      return;
    }

    // 检查输出文件是否需要覆盖
    if (fs.existsSync(outputPath)) {
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: `输出文件 ${outputPath} 已存在。是否覆盖？`,
        initial: false,
      });

      if (!response.overwrite) {
        console.log(chalk.red('❌ 用户取消操作'));
        process.exit(1);
      }
    }

    // 写入输出文件
    fs.writeFileSync(outputPath, outputCss, 'utf8');

    console.log(chalk.green(`✅ 成功处理 ${filePath}`));
    console.log(chalk.green(`✅ 转换了 ${transformCount} 个 transform 属性`));
    console.log(chalk.green(`✅ 输出已写入 ${outputPath}`));
  } catch (error) {
    console.error(chalk.red(`❌ 处理 CSS 文件时出错: ${error.message}`));
    process.exit(1);
  }
}

// 执行
(async () => {
  await processCssFile(filePath, outputPath, verbose, jsonOutput, dryRun, targetSelector);
})();