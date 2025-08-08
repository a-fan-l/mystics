/**
 * 字符串工具函数
 */

/**
 * 首字母大写
 */
export const capitalize = (str: string): string => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * 驼峰命名转换
 */
export const camelCase = (str: string): string => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

/**
 * 短横线命名转换  
 */
export const kebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

/**
 * 截断字符串
 */
export const truncate = (str: string, length: number, suffix: string = '...'): string => {
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
};

/**
 * 生成随机字符串
 */
export const randomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
