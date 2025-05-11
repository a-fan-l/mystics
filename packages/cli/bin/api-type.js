#!/usr/bin/env node
const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const figlet = require('figlet');
const versionStr = figlet.textSync('MYSTICS');
const Printer = require('@darkobits/lolcatjs');
const version = require('../package.json').version;

const ora = require('ora');
const inquirer = require('inquirer');
const chalk = require('chalk');
const shell = require('shelljs');
const transformed = Printer.fromString(
  ` \n   ✨ MYSTICS CLI${version} ✨ \n ${versionStr}`
);

const {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
} = require('quicktype-core');

// 默认路径
const desktopPath = path.join(require('os').homedir(), 'Desktop');
const currentPath = process.cwd();
const hasVSCode = shell.which('code');

/**
 * 生成类型定义
 * @param {string} url - API 的 URL 地址
 * @param {string} typeName - 生成的类型名称
 * @returns {Promise<{ lines: string[] }>} - 返回生成的类型定义行数组
 */
async function generateTypes(url, typeName) {
  const spinner = ora('fetching data...').start();
  try {
    // 1. 从 API 获取 JSON 数据
    const response = await fetch(url);
    // 使用 fetch 请求 API 数据

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.statusText}`);
      // 如果请求失败（状态码非 2xx），抛出错误
    }

    const jsonData = await response.json();
    // 将响应数据解析为 JSON 格式

    spinner.text = 'parsing data...';
    // 更新加载动画的提示信息

    // 2. 处理 JSON 数据
    const sampleData = Array.isArray(jsonData) ? jsonData[0] : jsonData;
    // 如果 API 返回的是数组，取第一个元素作为样本数据；否则直接使用返回的数据

    spinner.text = 'generating types...';
    // 更新加载动画的提示信息

    // 3. 使用 quicktype 生成 TypeScript 类型
    const jsonInput = await jsonInputForTargetLanguage('typescript');
    // 创建一个 TypeScript 语言的 JSON 输入对象

    await jsonInput.addSource({
      name: typeName, // 指定生成的类型名称
      samples: [JSON.stringify(sampleData)], // 将样本数据转换为 JSON 字符串作为输入
    });

    const inputData = new InputData();
    // 创建一个 quicktype 输入数据对象

    inputData.addInput(jsonInput);
    // 将 JSON 输入添加到输入数据对象中

    spinner.text = 'optimizing types...';
    // 更新加载动画的提示信息

    const { lines } = await quicktype({
      lang: 'typescript', // 指定目标语言为 TypeScript
      inputData, // 输入数据
      alphabetizeProperties: true, // 按字母顺序排列属性
      rendererOptions: {
        'just-types': 'true', // 只生成类型定义，不生成其他代码
        'explicit-unions': 'true', // 显式生成联合类型
      },
    });
    // 调用 quicktype 生成类型定义，返回的 lines 是类型定义的行数组

    spinner.succeed(chalk.green('✨ types generated successfully!'));
    // 加载动画成功结束，显示成功信息

    if (!lines || lines.length === 0) {
      throw new Error('⚠️ types are empty, please check the API return data');
      // 如果生成的类型为空，抛出错误
    }

    return { lines };
    // 返回生成的类型定义行数组
  } catch (error) {
    spinner.fail(chalk.red('❌ failed'));
    // 加载动画失败结束，显示失败信息

    throw error;
    // 抛出错误以便上层捕获
  }
}

/**
 * 提示用户输入配置信息
 * @returns {Promise<object>} - 返回用户的输入配置
 */
async function promptUser() {
  console.log(chalk.cyan('\n👋 Welcome to Mystics CLI~\n'));

  const questions = [
    {
      type: 'input', // 输入类型为文本输入
      name: 'url', // 配置项名称
      message: '🌐 Please enter the API URL address:', // 提示信息
      validate: (input) => {
        // 验证输入的 URL 是否有效
        try {
          new URL(input); // 尝试解析 URL
          return true; // 有效则返回 true
        } catch {
          return '❌ URL format is incorrect, please enter a valid URL'; // 无效则返回错误提示
        }
      },
    },
    {
      type: 'input', // 输入类型为文本输入
      name: 'name', // 配置项名称
      message: '📝 Please enter the type name:', // 提示信息
      default: 'ApiTypes', // 默认值
      validate: (input) => {
        // 验证类型名称是否符合规则（以字母开头，只能包含字母和数字）
        if (/^[A-Za-z][A-Za-z0-9]*$/.test(input)) {
          return true; // 有效则返回 true
        }
        return '❌ type name must start with a letter and can only contain letters and numbers'; // 无效则返回错误提示
      },
    },
    {
      type: 'list', // 输入类型为选择列表
      name: 'path', // 配置项名称
      message: '📂 Please select the save location:', // 提示信息
      choices: [
        { name: '💻 Desktop', value: desktopPath }, // 选项：桌面路径
        { name: '📁 Current directory', value: currentPath }, // 选项：当前目录
        { name: '🔍 Custom path', value: 'custom' }, // 选项：自定义路径
      ],
    },
  ];

  const answers = await inquirer.prompt(questions);
  // 使用 inquirer 提示用户输入配置，并等待用户回答

  if (answers.path === 'custom') {
    // 如果用户选择了自定义路径
    const { customPath } = await inquirer.prompt([
      {
        type: 'input', // 输入类型为文本输入
        name: 'customPath', // 配置项名称
        message: '📁 请输入保存路径:', // 提示信息
        default: currentPath, // 默认值为当前目录
        validate: (input) => {
          // 验证路径是否有效（是否存在）
          if (shell.test('-d', input)) {
            return true; // 有效则返回 true
          }
          return '❌ path does not exist, please enter a valid path'; // 无效则返回错误提示
        },
      },
    ]);
    answers.path = customPath; // 将自定义路径存储到配置中
  }

  return answers;
  // 返回用户的输入配置
}

// 配置 commander 命令行工具
program
  .version(transformed) // 设置版本号并显示彩色欢迎信息
  .description('🚀 从API URL生成TypeScript类型定义') // 设置工具描述
  .option('-u, --url <url>', 'API URL地址') // 命令行选项：API URL
  .option('-n, --name <name>', '生成的类型名称') // 命令行选项：类型名称
  .option('-p, --path <path>', '保存路径') // 命令行选项：保存路径
  .action(async (options) => {
    // 定义命令执行时的动作
    try {
      const config = options.url ? options : await promptUser();
      // 如果命令行提供了 URL，则直接使用命令行参数；否则提示用户输入配置

      const { lines } = await generateTypes(config.url, config.name);
      // 调用 generateTypes 函数生成类型定义

      const spinner = ora('💾 正在保存文件...').start();
      // 创建加载动画，提示用户正在保存文件

      // 使用 shelljs 创建目录（如果目录不存在）
      if (!shell.test('-d', config.path)) {
        shell.mkdir('-p', config.path);
        // shell.test('-d', path) 检查路径是否存在，shell.mkdir 创建目录
      }

      const fullPath = path.join(config.path, `${config.name}.ts`);
      // 构造完整的文件保存路径（路径 + 类型名称 + .ts 后缀）

      // 使用 shelljs 写入文件
      shell.ShellString(lines.join('\n')).to(fullPath);
      // 将生成的类型定义行数组合并为字符串，并写入文件

      spinner.succeed(chalk.green('🎉 文件保存成功！'));
      // 加载动画成功结束，显示成功信息

      console.log(chalk.cyan('\n📍 文件保存在:'), fullPath);
      // 打印文件保存路径

      console.log(chalk.yellow('\n👀 类型定义预览:\n'));
      console.log(chalk.gray('✨ ----------------------------------------'));
      console.log(lines.join('\n'));
      console.log(chalk.gray('✨ ----------------------------------------\n'));
      // 打印类型定义的预览内容

      // 如果安装了 VSCode，提供打开选项
      if (hasVSCode) {
        const { openFile } = await inquirer.prompt([
          {
            type: 'confirm', // 输入类型为确认（是/否）
            name: 'openFile', // 配置项名称
            message: '🔍 是否要在VSCode中打开生成的文件？', // 提示信息
            default: false, // 默认值为否
          },
        ]);

        if (openFile) {
          // 如果用户选择打开文件
          const result = shell.exec(`code "${fullPath}"`, { silent: true });
          // 使用 shelljs 执行 'code' 命令打开 VSCode，silent: true 表示不打印命令输出

          if (result.code === 0) {
            console.log(chalk.green('\n📝 已在VSCode中打开文件'));
            // 如果命令执行成功，打印成功信息
          } else {
            console.log(chalk.yellow('\n⚠️  无法自动打开文件，请手动打开查看'));
            // 如果命令执行失败，打印警告信息
          }
        }
      }

      console.log(chalk.green('\n👋 感谢使用，祝您开发愉快！\n'));
      // 打印结束信息
    } catch (error) {
      console.error(chalk.red('\n❌ 错误:'), error.message);
      // 捕获并打印错误信息

      process.exit(1);
      // 退出程序并返回错误状态码 1
    }
});

program.parse(process.argv);
// 解析命令行参数并执行相应动作