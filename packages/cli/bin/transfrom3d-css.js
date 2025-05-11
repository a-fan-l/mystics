#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { parse, stringify } = require('css');
const { program } = require('commander');

// 设置CLI选项
program
  .name('css-transform-to-matrix3d')
  .description('将CSS中的传统transform属性转换为matrix3d格式')
  .version('1.0.0')
  .argument('<file>', 'CSS文件路径')
  .option('-o, --output <output>', '输出文件路径')
  .option('-v, --verbose', '显示详细转换信息')
  .parse(process.argv);

const options = program.opts();
const filePath = program.args[0];
const outputPath = options.output || filePath.replace(/\.css$/, '.matrix3d.css');
const verbose = options.verbose || false;

// 数学工具函数
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

// 转换器
class TransformConverter {
  constructor() {
    this.logOperations = [];
  }

  // 解析transform字符串为各个变换操作
  parseTransform(transform) {
    const operations = [];
    const regex = /([a-z0-9-]+)\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(transform)) !== null) {
      const operation = match[1];
      const valueStr = match[2];
      const values = valueStr.split(',').map(v => v.trim());
      operations.push({ operation, values });
    }

    return operations;
  }

  // 创建单位矩阵
  createIdentityMatrix() {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  }

  // 矩阵乘法
  multiplyMatrices(matrixA, matrixB) {
    const result = new Array(16).fill(0);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        for (let i = 0; i < 4; i++) {
          result[row * 4 + col] +=
            matrixA[row * 4 + i] * matrixB[i * 4 + col];
        }
      }
    }

    return result;
  }

  // 处理translate变换
  handleTranslate(x, y, z = 0) {
    x = parseFloat(x);
    y = parseFloat(y);
    z = parseFloat(z);

    const matrix = this.createIdentityMatrix();
    matrix[12] = x;
    matrix[13] = y;
    matrix[14] = z;

    this.logOperations.push(`translate(${x}, ${y}, ${z})`);
    return matrix;
  }

  // 处理scale变换
  handleScale(x, y, z = 1) {
    x = parseFloat(x);
    y = typeof y !== 'undefined' ? parseFloat(y) : x;
    z = parseFloat(z);

    const matrix = this.createIdentityMatrix();
    matrix[0] = x;
    matrix[5] = y;
    matrix[10] = z;

    this.logOperations.push(`scale(${x}, ${y}, ${z})`);
    return matrix;
  }

  // 处理rotate变换 (围绕Z轴)
  handleRotate(angle) {
    // 移除单位
    angle = parseFloat(angle);
    const rad = degToRad(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const matrix = this.createIdentityMatrix();
    matrix[0] = cos;
    matrix[1] = sin;
    matrix[4] = -sin;
    matrix[5] = cos;

    this.logOperations.push(`rotate(${angle}deg)`);
    return matrix;
  }

  // 处理rotateX变换
  handleRotateX(angle) {
    angle = parseFloat(angle);
    const rad = degToRad(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const matrix = this.createIdentityMatrix();
    matrix[5] = cos;
    matrix[6] = sin;
    matrix[9] = -sin;
    matrix[10] = cos;

    this.logOperations.push(`rotateX(${angle}deg)`);
    return matrix;
  }

  // 处理rotateY变换
  handleRotateY(angle) {
    angle = parseFloat(angle);
    const rad = degToRad(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const matrix = this.createIdentityMatrix();
    matrix[0] = cos;
    matrix[2] = -sin;
    matrix[8] = sin;
    matrix[10] = cos;

    this.logOperations.push(`rotateY(${angle}deg)`);
    return matrix;
  }

  // 处理rotateZ变换 (等同于rotate)
  handleRotateZ(angle) {
    return this.handleRotate(angle);
  }

  // 处理skew变换
  handleSkew(angleX, angleY = 0) {
    angleX = parseFloat(angleX);
    angleY = parseFloat(angleY);
    const radX = degToRad(angleX);
    const radY = degToRad(angleY);
    const tanX = Math.tan(radX);
    const tanY = Math.tan(radY);

    const matrix = this.createIdentityMatrix();
    matrix[4] = tanY;
    matrix[1] = tanX;

    this.logOperations.push(`skew(${angleX}deg, ${angleY}deg)`);
    return matrix;
  }

  // 处理skewX变换
  handleSkewX(angle) {
    angle = parseFloat(angle);
    const rad = degToRad(angle);
    const tan = Math.tan(rad);

    const matrix = this.createIdentityMatrix();
    matrix[4] = tan;

    this.logOperations.push(`skewX(${angle}deg)`);
    return matrix;
  }

  // 处理skewY变换
  handleSkewY(angle) {
    angle = parseFloat(angle);
    const rad = degToRad(angle);
    const tan = Math.tan(rad);

    const matrix = this.createIdentityMatrix();
    matrix[1] = tan;

    this.logOperations.push(`skewY(${angle}deg)`);
    return matrix;
  }

  // 处理已有的矩阵
  handleMatrix(a, b, c, d, tx, ty) {
    // 将2D矩阵转换为3D矩阵
    const matrix = this.createIdentityMatrix();
    matrix[0] = parseFloat(a);
    matrix[1] = parseFloat(b);
    matrix[4] = parseFloat(c);
    matrix[5] = parseFloat(d);
    matrix[12] = parseFloat(tx);
    matrix[13] = parseFloat(ty);

    this.logOperations.push(`matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`);
    return matrix;
  }

  // 处理已有的3D矩阵
  handleMatrix3d(values) {
    return values.map(v => parseFloat(v));
  }

  // 创建Matrix3D字符串
  createMatrix3dString(matrix) {
    // 对于非常小的值（接近于0）将它们设置为0，以改善可读性
    matrix = matrix.map(val => Math.abs(val) < 0.000001 ? 0 : val);
    
    // 格式化为最多6位小数
    const formattedMatrix = matrix.map(val => {
      const rounded = parseFloat(val.toFixed(6));
      // 如果是整数，不显示小数点
      return rounded === Math.floor(rounded) ? rounded : rounded.toFixed(6);
    });
    
    return `matrix3d(${formattedMatrix.join(', ')})`;
  }

  // 转换完整的transform属性
  convertTransform(transformValue) {
    this.logOperations = [];
    const operations = this.parseTransform(transformValue);
    let resultMatrix = this.createIdentityMatrix();

    for (const { operation, values } of operations) {
      let operationMatrix;

      switch (operation) {
        case 'translate':
          operationMatrix = this.handleTranslate(values[0], values[1] || 0);
          break;
        case 'translateX':
          operationMatrix = this.handleTranslate(values[0], 0);
          break;
        case 'translateY':
          operationMatrix = this.handleTranslate(0, values[0]);
          break;
        case 'translateZ':
          operationMatrix = this.handleTranslate(0, 0, values[0]);
          break;
        case 'translate3d':
          operationMatrix = this.handleTranslate(values[0], values[1], values[2]);
          break;
        case 'scale':
          operationMatrix = this.handleScale(values[0], values[1]);
          break;
        case 'scaleX':
          operationMatrix = this.handleScale(values[0], 1);
          break;
        case 'scaleY':
          operationMatrix = this.handleScale(1, values[0]);
          break;
        case 'scaleZ':
          operationMatrix = this.handleScale(1, 1, values[0]);
          break;
        case 'scale3d':
          operationMatrix = this.handleScale(values[0], values[1], values[2]);
          break;
        case 'rotate':
          operationMatrix = this.handleRotate(values[0]);
          break;
        case 'rotateX':
          operationMatrix = this.handleRotateX(values[0]);
          break;
        case 'rotateY':
          operationMatrix = this.handleRotateY(values[0]);
          break;
        case 'rotateZ':
          operationMatrix = this.handleRotateZ(values[0]);
          break;
        case 'skew':
          operationMatrix = this.handleSkew(values[0], values[1]);
          break;
        case 'skewX':
          operationMatrix = this.handleSkewX(values[0]);
          break;
        case 'skewY':
          operationMatrix = this.handleSkewY(values[0]);
          break;
        case 'matrix':
          operationMatrix = this.handleMatrix(...values);
          break;
        case 'matrix3d':
          operationMatrix = this.handleMatrix3d(values);
          break;
        default:
          console.warn(`不支持的变换操作: ${operation}`);
          continue;
      }

      resultMatrix = this.multiplyMatrices(resultMatrix, operationMatrix);
    }

    return {
      matrix3d: this.createMatrix3dString(resultMatrix),
      operations: this.logOperations
    };
  }
}

// 处理CSS文件
function processCssFile(filePath, outputPath, verbose) {
  try {
    // 读取CSS文件
    const cssContent = fs.readFileSync(filePath, 'utf8');
    const converter = new TransformConverter();
    let transformCount = 0;
    
    // 解析CSS
    const ast = parse(cssContent);
    
    // 遍历并修改CSS规则
    ast.stylesheet.rules.forEach(rule => {
      if (rule.type !== 'rule') return;
      
      // 处理每个声明
      rule.declarations.forEach(declaration => {
        if (declaration.type !== 'declaration') return;
        
        // 查找transform属性
        if (declaration.property === 'transform' && declaration.value) {
          const { matrix3d, operations } = converter.convertTransform(declaration.value);
          
          // 记录原始值并替换为matrix3d
          if (verbose) {
            console.log(`转换: ${rule.selectors.join(', ')}`);
            console.log(`  原始: transform: ${declaration.value}`);
            console.log(`  操作: ${operations.join(' -> ')}`);
            console.log(`  转换后: transform: ${matrix3d}`);
            console.log('------------------------');
          }
          
          declaration.value = matrix3d;
          transformCount++;
        }
      });
    });
    
    // 将修改后的CSS写入输出文件
    const outputCss = stringify(ast);
    fs.writeFileSync(outputPath, outputCss, 'utf8');
    
    console.log(`✅ 成功处理 ${filePath}`);
    console.log(`✅ 转换了 ${transformCount} 个transform属性`);
    console.log(`✅ 输出到 ${outputPath}`);
    
  } catch (error) {
    console.error('❌ 处理CSS文件时出错:', error.message);
    process.exit(1);
  }
}

// 执行转换
if (!fs.existsSync(filePath)) {
  console.error(`❌ 文件不存在: ${filePath}`);
  process.exit(1);
}

processCssFile(filePath, outputPath, verbose);