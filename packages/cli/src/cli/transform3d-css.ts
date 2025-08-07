/**
 * Mystics CSS Transform Converter CLI
 * 将传统的 CSS transform 属性转换为 3D 矩阵
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
// import figlet from 'figlet';
import path from 'path';
import fs from 'fs';
import { CssTransformer } from '../utils/css-transformer';
import { CssTransformOptions } from '../types/common';

const program = new Command();
const transformer = new CssTransformer();

// 显示欢迎信息
function showWelcome() {
  console.log(chalk.magenta.bold('\n🎨 Mystics CSS Transform Converter\n'));
  console.log(chalk.gray('  将 CSS transform 转换为 3D 矩阵\n'));
}

// 验证文件路径
function validateFilePath(filePath: string): boolean {
  return fs.existsSync(filePath) && path.extname(filePath) === '.css';
}

// 交互式获取配置
async function getConfigInteractive(): Promise<CssTransformOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'inputFile',
      message: '请输入 CSS 文件路径:',
      validate: (input: string) => {
        if (!input.trim()) {
          return '请输入文件路径';
        }
        if (!fs.existsSync(input)) {
          return '文件不存在';
        }
        if (path.extname(input) !== '.css') {
          return '请输入 CSS 文件 (.css)';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'outputFile',
      message: '请输入输出文件路径 (留空则覆盖原文件):',
      default: '',
      validate: (input: string, answers: any) => {
        if (input.trim() && path.extname(input) !== '.css') {
          return '输出文件必须是 CSS 文件 (.css)';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'backup',
      message: '是否备份原文件?',
      default: true,
      when: (answers: any) => !answers.outputFile
    },
    {
      type: 'confirm',
      name: 'prettify',
      message: '是否美化输出代码?',
      default: true
    }
  ]);

  return {
    inputFile: answers.inputFile.trim(),
    outputFile: answers.outputFile.trim() || undefined,
    backup: answers.backup,
    prettify: answers.prettify
  };
}

// 扫描目录中的 CSS 文件
async function scanCssFiles(dir: string): Promise<string[]> {
  const cssFiles: string[] = [];
  
  function scanDir(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath);
      } else if (stat.isFile() && path.extname(item) === '.css') {
        cssFiles.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return cssFiles;
}

// 批量处理模式
async function batchProcess(directory: string): Promise<void> {
  console.log(chalk.blue(`\n🔍 扫描目录: ${directory}`));
  
  const cssFiles = await scanCssFiles(directory);
  
  if (cssFiles.length === 0) {
    console.log(chalk.yellow('未找到 CSS 文件'));
    return;
  }
  
  console.log(chalk.green(`📁 找到 ${cssFiles.length} 个 CSS 文件`));
  
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `确认处理这 ${cssFiles.length} 个文件?`,
      default: true
    }
  ]);
  
  if (!confirmed) {
    console.log(chalk.yellow('操作已取消'));
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const filePath of cssFiles) {
    console.log(chalk.blue(`\n处理: ${path.relative(process.cwd(), filePath)}`));
    
    const result = await transformer.transform({
      inputFile: filePath,
      backup: true,
      prettify: true
    });
    
    if (result.success) {
      successCount++;
      console.log(chalk.green(`✅ 转换成功 (${result.data?.transformsConverted} 个属性)`));
    } else {
      errorCount++;
      console.log(chalk.red(`❌ 转换失败: ${result.error}`));
    }
  }
  
  console.log(chalk.cyan.bold(`\n📊 批量处理完成:`));
  console.log(chalk.green(`  成功: ${successCount} 个文件`));
  console.log(chalk.red(`  失败: ${errorCount} 个文件`));
}

// 命令行参数配置
program
  .name('mystics-transform-css')
  .description('将 CSS transform 转换为 3D 矩阵')
  .version('1.0.0')
  .argument('[file]', 'CSS 文件路径')
  .option('-o, --output <path>', '输出文件路径')
  .option('-b, --backup', '备份原文件', true)
  .option('--no-backup', '不备份原文件')
  .option('-p, --prettify', '美化输出代码', true)
  .option('--no-prettify', '不美化输出代码')
  .option('-i, --interactive', '交互式模式')
  .option('-d, --directory <dir>', '批量处理目录')
  .option('-v, --verbose', '详细输出')
  .option('-q, --quiet', '静默模式')
  .helpOption('-h, --help', '显示帮助信息');

program.parse();

async function main() {
  const options = program.opts();
  const args = program.args;
  
  // 显示欢迎信息
  if (!options.quiet) {
    showWelcome();
  }

  try {
    // 批量处理模式
    if (options.directory) {
      if (!fs.existsSync(options.directory)) {
        console.error(chalk.red('❌ 目录不存在'));
        process.exit(1);
      }
      
      await batchProcess(options.directory);
      return;
    }

    let config: CssTransformOptions;

    // 交互式模式或缺少必要参数时启用交互式输入
    if (options.interactive || !args[0]) {
      config = await getConfigInteractive();
    } else {
      // 使用命令行参数
      const inputFile = args[0];
      
      if (!validateFilePath(inputFile)) {
        console.error(chalk.red('❌ 文件不存在或不是 CSS 文件'));
        process.exit(1);
      }

      config = {
        inputFile,
        outputFile: options.output,
        backup: options.backup,
        prettify: options.prettify
      };
    }

    // 执行转换
    const result = await transformer.transform(config);
    
    if (result.success) {
      console.log(chalk.green('\n🎉 转换完成!'));
      
      if (options.verbose && result.data) {
        console.log(chalk.blue('\n详细信息:'));
        console.log(chalk.gray(`  输出文件: ${result.data.outputPath}`));
        console.log(chalk.gray(`  处理规则: ${result.data.rulesProcessed}`));
        console.log(chalk.gray(`  转换属性: ${result.data.transformsConverted}`));
      }
      
      process.exit(0);
    } else {
      console.error(chalk.red(`\n❌ ${result.error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('❌ 发生未预期的错误:'));
    console.error(chalk.red(error instanceof Error ? error.message : '未知错误'));
    
    if (options.verbose) {
      console.error(chalk.gray('\n调试信息:'));
      console.error(error);
    }
    
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ 未捕获的异常:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ 未处理的 Promise 拒绝:'), reason);
  process.exit(1);
});

// 启动 CLI
main();