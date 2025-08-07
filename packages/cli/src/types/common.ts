/**
 * CLI 工具通用类型定义
 */

// API 类型生成器相关类型
export interface ApiTypeOptions {
  /** API URL 地址 */
  url: string;
  /** 生成的类型名称 */
  typeName: string;
  /** 输出路径 */
  outputPath: string;
  /** 是否覆盖已存在的文件 */
  overwrite?: boolean;
  /** 生成的语言 */
  language?: 'typescript' | 'javascript';
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// CSS Transform 相关类型
export interface CssTransformOptions {
  /** 输入 CSS 文件路径 */
  inputFile: string;
  /** 输出文件路径 */
  outputFile?: string;
  /** 是否备份原文件 */
  backup?: boolean;
  /** 是否美化输出 */
  prettify?: boolean;
}

export interface TransformResult {
  /** 是否成功 */
  success: boolean;
  /** 处理的规则数量 */
  rulesProcessed: number;
  /** 转换的属性数量 */
  transformsConverted: number;
  /** 错误信息 */
  error?: string;
  /** 输出文件路径 */
  outputPath?: string;
}

// Transform 属性映射
export interface TransformProperty {
  property: string;
  value: string;
  matrix3d?: string;
}

// 命令行选项
export interface CLIOptions {
  help?: boolean;
  version?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

// 通用响应接口
export interface CLIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 颜色主题
export interface ColorTheme {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  muted: string;
}