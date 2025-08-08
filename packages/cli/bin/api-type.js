#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli/api-type.ts
var import_commander = require("commander");
var import_inquirer = __toESM(require("inquirer"));
var import_chalk2 = __toESM(require("chalk"));

// src/utils/api-generator.ts
var import_quicktype_core = require("quicktype-core");
var import_chalk = __toESM(require("chalk"));
var import_ora = __toESM(require("ora"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var ApiTypeGenerator = class {
  constructor() {
    this.spinner = (0, import_ora.default)();
  }
  /**
   * 从 URL 获取 API 数据
   */
  async fetchApiData(url) {
    this.spinner.start(import_chalk.default.blue("\u6B63\u5728\u83B7\u53D6 API \u6570\u636E..."));
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      this.spinner.succeed(import_chalk.default.green("API \u6570\u636E\u83B7\u53D6\u6210\u529F"));
      return {
        success: true,
        data,
        message: "\u6570\u636E\u83B7\u53D6\u6210\u529F"
      };
    } catch (error) {
      this.spinner.fail(import_chalk.default.red("API \u6570\u636E\u83B7\u53D6\u5931\u8D25"));
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"
      };
    }
  }
  /**
   * 生成 TypeScript 类型定义
   */
  async generateTypes(data, typeName) {
    this.spinner.start(import_chalk.default.blue("\u6B63\u5728\u751F\u6210\u7C7B\u578B\u5B9A\u4E49..."));
    try {
      const jsonInput = (0, import_quicktype_core.jsonInputForTargetLanguage)("typescript");
      await jsonInput.addSource({
        name: typeName,
        samples: [JSON.stringify(data)]
      });
      const inputData = new import_quicktype_core.InputData();
      inputData.addInput(jsonInput);
      const result = await (0, import_quicktype_core.quicktype)({
        inputData,
        lang: "typescript",
        rendererOptions: {
          "just-types": "true",
          "prefer-types": "true",
          "explicit-unions": "true"
        }
      });
      this.spinner.succeed(import_chalk.default.green("\u7C7B\u578B\u5B9A\u4E49\u751F\u6210\u6210\u529F"));
      return {
        success: true,
        data: result.lines.join("\n"),
        message: "\u7C7B\u578B\u5B9A\u4E49\u751F\u6210\u6210\u529F"
      };
    } catch (error) {
      this.spinner.fail(import_chalk.default.red("\u7C7B\u578B\u5B9A\u4E49\u751F\u6210\u5931\u8D25"));
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u7C7B\u578B\u751F\u6210\u5931\u8D25"
      };
    }
  }
  /**
   * 保存类型定义到文件
   */
  async saveToFile(content, outputPath, overwrite = false) {
    try {
      const dir = import_path.default.dirname(outputPath);
      if (!import_fs.default.existsSync(dir)) {
        import_fs.default.mkdirSync(dir, { recursive: true });
      }
      if (import_fs.default.existsSync(outputPath) && !overwrite) {
        return {
          success: false,
          error: `\u6587\u4EF6 ${outputPath} \u5DF2\u5B58\u5728\uFF0C\u4F7F\u7528 --overwrite \u9009\u9879\u8986\u76D6`
        };
      }
      const header = `/**
 * \u81EA\u52A8\u751F\u6210\u7684\u7C7B\u578B\u5B9A\u4E49\u6587\u4EF6
 * \u751F\u6210\u65F6\u95F4: ${(/* @__PURE__ */ new Date()).toLocaleString()}
 * \u8BF7\u52FF\u624B\u52A8\u4FEE\u6539\u6B64\u6587\u4EF6
 */

`;
      import_fs.default.writeFileSync(outputPath, header + content, "utf8");
      return {
        success: true,
        data: outputPath,
        message: `\u7C7B\u578B\u5B9A\u4E49\u5DF2\u4FDD\u5B58\u5230 ${outputPath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "\u6587\u4EF6\u4FDD\u5B58\u5931\u8D25"
      };
    }
  }
  /**
   * 完整的类型生成流程
   */
  async generate(options) {
    console.log(import_chalk.default.cyan.bold("\n\u{1F680} Mystics API Type Generator\n"));
    console.log(import_chalk.default.blue("\u914D\u7F6E\u4FE1\u606F:"));
    console.log(import_chalk.default.gray(`  API URL: ${options.url}`));
    console.log(import_chalk.default.gray(`  \u7C7B\u578B\u540D\u79F0: ${options.typeName}`));
    console.log(import_chalk.default.gray(`  \u8F93\u51FA\u8DEF\u5F84: ${options.outputPath}`));
    console.log("");
    const fetchResult = await this.fetchApiData(options.url);
    if (!fetchResult.success) {
      return fetchResult;
    }
    const typeResult = await this.generateTypes(fetchResult.data, options.typeName);
    if (!typeResult.success) {
      return typeResult;
    }
    const saveResult = await this.saveToFile(
      typeResult.data,
      options.outputPath,
      options.overwrite
    );
    if (saveResult.success) {
      console.log(import_chalk.default.green.bold("\n\u2705 \u7C7B\u578B\u751F\u6210\u5B8C\u6210!"));
      console.log(import_chalk.default.green(`\u{1F4C1} \u6587\u4EF6\u4FDD\u5B58\u4F4D\u7F6E: ${saveResult.data}`));
      console.log(import_chalk.default.blue("\n\u{1F4A1} \u4F7F\u7528\u65B9\u5F0F:"));
      console.log(import_chalk.default.gray(`  import { ${options.typeName} } from './${import_path.default.basename(options.outputPath, ".ts")}';`));
    }
    return saveResult;
  }
  /**
   * 验证 URL 格式
   */
  static validateUrl(url) {
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
  static generateOutputPath(typeName, outputDir = "./types") {
    const fileName = typeName.charAt(0).toLowerCase() + typeName.slice(1) + ".ts";
    return import_path.default.join(outputDir, fileName);
  }
};

// src/cli/api-type.ts
var program = new import_commander.Command();
var generator = new ApiTypeGenerator();
function showWelcome() {
  console.log(import_chalk2.default.cyan.bold("\n\u{1F680} Mystics API Type Generator\n"));
  console.log(import_chalk2.default.gray("  \u4ECE API \u63A5\u53E3\u751F\u6210 TypeScript \u7C7B\u578B\u5B9A\u4E49\n"));
}
async function getConfigInteractive() {
  const answers = await import_inquirer.default.prompt([
    {
      type: "input",
      name: "url",
      message: "\u8BF7\u8F93\u5165 API URL:",
      validate: (input) => {
        if (!input.trim()) {
          return "\u8BF7\u8F93\u5165\u6709\u6548\u7684 URL";
        }
        if (!ApiTypeGenerator.validateUrl(input)) {
          return "\u8BF7\u8F93\u5165\u6709\u6548\u7684 URL \u683C\u5F0F";
        }
        return true;
      }
    },
    {
      type: "input",
      name: "typeName",
      message: "\u8BF7\u8F93\u5165\u7C7B\u578B\u540D\u79F0:",
      default: "ApiResponse",
      validate: (input) => {
        if (!input.trim()) {
          return "\u8BF7\u8F93\u5165\u7C7B\u578B\u540D\u79F0";
        }
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
          return "\u7C7B\u578B\u540D\u79F0\u5FC5\u987B\u4EE5\u5927\u5199\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u548C\u6570\u5B57";
        }
        return true;
      }
    },
    {
      type: "input",
      name: "outputPath",
      message: "\u8BF7\u8F93\u5165\u8F93\u51FA\u6587\u4EF6\u8DEF\u5F84:",
      default: (answers2) => ApiTypeGenerator.generateOutputPath(answers2.typeName),
      validate: (input) => {
        if (!input.trim()) {
          return "\u8BF7\u8F93\u5165\u8F93\u51FA\u8DEF\u5F84";
        }
        return true;
      }
    },
    {
      type: "confirm",
      name: "overwrite",
      message: "\u5982\u679C\u6587\u4EF6\u5DF2\u5B58\u5728\uFF0C\u662F\u5426\u8986\u76D6?",
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
program.name("mystics-api-type").description("\u4ECE API \u63A5\u53E3\u751F\u6210 TypeScript \u7C7B\u578B\u5B9A\u4E49").version("1.0.0").option("-u, --url <url>", "API URL \u5730\u5740").option("-n, --name <name>", "\u751F\u6210\u7684\u7C7B\u578B\u540D\u79F0").option("-p, --path <path>", "\u8F93\u51FA\u6587\u4EF6\u8DEF\u5F84").option("-o, --overwrite", "\u8986\u76D6\u5DF2\u5B58\u5728\u7684\u6587\u4EF6").option("-i, --interactive", "\u4EA4\u4E92\u5F0F\u6A21\u5F0F").option("-v, --verbose", "\u8BE6\u7EC6\u8F93\u51FA").helpOption("-h, --help", "\u663E\u793A\u5E2E\u52A9\u4FE1\u606F");
program.parse();
async function main() {
  const options = program.opts();
  if (!options.quiet) {
    showWelcome();
  }
  let config;
  try {
    if (options.interactive || !options.url || !options.name) {
      config = await getConfigInteractive();
    } else {
      config = {
        url: options.url,
        typeName: options.name,
        outputPath: options.path || ApiTypeGenerator.generateOutputPath(options.name),
        overwrite: options.overwrite || false
      };
      if (!ApiTypeGenerator.validateUrl(config.url)) {
        console.error(import_chalk2.default.red("\u274C \u65E0\u6548\u7684 URL \u683C\u5F0F"));
        process.exit(1);
      }
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(config.typeName)) {
        console.error(import_chalk2.default.red("\u274C \u7C7B\u578B\u540D\u79F0\u5FC5\u987B\u4EE5\u5927\u5199\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u548C\u6570\u5B57"));
        process.exit(1);
      }
    }
    const result = await generator.generate(config);
    if (result.success) {
      console.log(import_chalk2.default.green("\n\u{1F389} \u4EFB\u52A1\u5B8C\u6210!"));
      process.exit(0);
    } else {
      console.error(import_chalk2.default.red(`
\u274C ${result.error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error(import_chalk2.default.red("\u274C \u53D1\u751F\u672A\u9884\u671F\u7684\u9519\u8BEF:"));
    console.error(import_chalk2.default.red(error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF"));
    if (options.verbose) {
      console.error(import_chalk2.default.gray("\n\u8C03\u8BD5\u4FE1\u606F:"));
      console.error(error);
    }
    process.exit(1);
  }
}
process.on("uncaughtException", (error) => {
  console.error(import_chalk2.default.red("\u274C \u672A\u6355\u83B7\u7684\u5F02\u5E38:"), error.message);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error(import_chalk2.default.red("\u274C \u672A\u5904\u7406\u7684 Promise \u62D2\u7EDD:"), reason);
  process.exit(1);
});
main();
