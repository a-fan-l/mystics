/**
 * 日期工具函数
 */
import dayjs from 'dayjs';

/**
 * 格式化日期
 */
export const formatDate = (date: Date | string | number, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
  console.log('formatDate');
};

/**
 * 获取相对时间
 */
export const getRelativeTime = (date: Date | string | number): string => {
  const now = dayjs();
  const target = dayjs(date);
  
  const diffMinutes = now.diff(target, 'minute');
  const diffHours = now.diff(target, 'hour');
  const diffDays = now.diff(target, 'day');
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatDate(date, 'MM-DD');
};

/**
 * 判断是否为今天
 */
export const isToday = (date: Date | string | number): boolean => {
  return dayjs(date).isSame(dayjs(), 'day');
};