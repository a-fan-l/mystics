/**
 * @mystics/cli - Mystics CLI 工具库
 * 提供 API 类型生成和 CSS Transform 转换功能
 */

console.log('New CLI feature added');

export * from './utils';
export * from './types';

// 版本信息
export const version = '1.0.0';

// CLI 工具信息
export const tools = {
  apiType: {
    name: 'mystics-api-type',
    description: '从 API 接口生成 TypeScript 类型定义',
    command: 'mystics-api-type'
  },
  transform3d: {
    name: 'mystics-transform-css',
    description: '将 CSS transform 转换为 3D 矩阵',
    command: 'mystics-transform-css'
  }
} as const;// 测试注释 - 2025年 8月 8日 星期五 16时42分46秒 CST
// 新功能测试
// 简单测试修改 - 2025年 8月 8日 星期五 16时55分33秒 CST
