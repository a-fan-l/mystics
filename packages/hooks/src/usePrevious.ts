import { useRef, useEffect } from 'react';

/**
 * 获取上一次的值 Hook
 * @param value - 当前值
 * @returns 上一次的值
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(value);
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}