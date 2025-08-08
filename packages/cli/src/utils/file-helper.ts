/**
 * 文件操作工具函数
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 检查文件是否存在
 */
export const fileExists = (filePath: string): boolean => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

/**
 * 创建目录（递归）
 */
export const ensureDir = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

/**
 * 获取文件名（不含扩展名）
 */
export const getBaseName = (filePath: string): string => {
  return path.basename(filePath, path.extname(filePath));
};

/**
 * 读取 JSON 文件
 */
export const readJsonFile = <T = any>(filePath: string): T | null => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
};

/**
 * 写入 JSON 文件
 */
export const writeJsonFile = (filePath: string, data: any, indent: number = 2): boolean => {
  try {
    const dir = path.dirname(filePath);
    ensureDir(dir);
    fs.writeFileSync(filePath, JSON.stringify(data, null, indent), 'utf8');
    return true;
  } catch {
    return false;
  }
};
