/**
 * 防抖函数
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
  
    return (...args: Parameters<T>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  /**
   * 节流函数
   * @param func - 要节流的函数
   * @param wait - 等待时间（毫秒）
   * @returns 节流后的函数
   */
  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    console.log('throttle');
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), wait);
      }
    };
  }