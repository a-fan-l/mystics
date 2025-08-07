import { useState, useCallback } from 'react';

/**
 * 切换状态 Hook
 * @param initialValue - 初始值
 * @returns [value, toggle, setValue] 元组
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  return [value, toggle, setValue];
}