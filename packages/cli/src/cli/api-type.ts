/**
 * Mystics API Type Generator CLI
 * 从 API 接口生成 TypeScript 类型定义
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
// import figlet from 'figlet';
import { ApiTypeGenerator } from '../utils/api-generator';
import { ApiTypeOptions } from '../types/common';

const program = new Command();
const generator = new ApiTypeGenerator();

// 显示欢迎信息
function showWelcome() {
  console.log(chalk.cyan.bold('\n🚀 Mystics API Type Generator\n'));
  console.log(chalk.gray('  从 API 接口生成 TypeScript 类型定义\n'));
}

// 交互式获取配置
async function getConfigInteractive(): Promise<ApiTypeOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'url',
      message: '请输入 API URL:',
      validate: (input: string) => {
        if (!input.trim()) {
          return '请输入有效的 URL';
        }
        if (!ApiTypeGenerator.validateUrl(input)) {
          return '请输入有效的 URL 格式';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'typeName',
      message: '请输入类型名称:',
      default: 'ApiResponse',
      validate: (input: string) => {
        if (!input.trim()) {
          return '请输入类型名称';
        }
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
          return '类型名称必须以大写字母开头，只能包含字母和数字';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'outputPath',
      message: '请输入输出文件路径:',
      default: (answers: any) => ApiTypeGenerator.generateOutputPath(answers.typeName),
      validate: (input: string) => {
        if (!input.trim()) {
          return '请输入输出路径';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'overwrite',
      message: '如果文件已存在，是否覆盖?',
      default: false
    }
  ]);

  return {
    url: answers.url.trim(),
    typeName: answers.typeName.trim(),
    outputPath: answers.outputPath.trim(),
    overwrite: answers.overwrite
  };
}

// 命令行参数配置
program
  .name('mystics-api-type')
  .description('从 API 接口生成 TypeScript 类型定义')
  .version('1.0.0')
  .option('-u, --url <url>', 'API URL 地址')
  .option('-n, --name <name>', '生成的类型名称')
  .option('-p, --path <path>', '输出文件路径')
  .option('-o, --overwrite', '覆盖已存在的文件')
  .option('-i, --interactive', '交互式模式')
  .option('-v, --verbose', '详细输出')
  .helpOption('-h, --help', '显示帮助信息');

program.parse();

async function main() {
  const options = program.opts();
  
  // 显示欢迎信息
  if (!options.quiet) {
    showWelcome();
  }

  let config: ApiTypeOptions;

  try {
    // 交互式模式或缺少必要参数时启用交互式输入
    if (options.interactive || !options.url || !options.name) {
      config = await getConfigInteractive();
    } else {
      // 使用命令行参数
      config = {
        url: options.url,
        typeName: options.name,
        outputPath: options.path || ApiTypeGenerator.generateOutputPath(options.name),
        overwrite: options.overwrite || false
      };

      // 验证 URL
      if (!ApiTypeGenerator.validateUrl(config.url)) {
        console.error(chalk.red('❌ 无效的 URL 格式'));
        process.exit(1);
      }

      // 验证类型名称
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(config.typeName)) {
        console.error(chalk.red('❌ 类型名称必须以大写字母开头，只能包含字母和数字'));
        process.exit(1);
      }
    }

    // 执行类型生成
    const result = await generator.generate(config);
    
    if (result.success) {
      console.log(chalk.green('\n🎉 任务完成!'));
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