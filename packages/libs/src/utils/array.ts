/**
 * 数组工具函数
 */

/**
 * 数组去重
 */
export const unique = <T>(arr: T[]): T[] => {
  return Array.from(new Set(arr));
};

/**
 * 数组分组
 */
export const groupBy = <T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return arr.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

/**
 * 数组分块
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * 数组打乱
 */
export const shuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * 数组求交集
 */
export const intersection = <T>(arr1: T[], arr2: T[]): T[] => {
  return arr1.filter(item => arr2.includes(item));
};

/**
 * 数组求差集
 */
export const difference = <T>(arr1: T[], arr2: T[]): T[] => {
  return arr1.filter(item => !arr2.includes(item));
};

/**
 * 数组扁平化
 */
export const flatten = <T extends any>(arr: T[]): T[] => {
  return arr.reduce((flat, item) => {
    if (Array.isArray(item)) {
      return flat.concat(flatten(item));
    }
    return flat.concat(item);
  }, [] as T[]);
};
