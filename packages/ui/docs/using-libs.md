# 在 @mystics/ui 中使用 @mystics/libs

本文档介绍如何在 `@mystics/ui` 包的组件中使用 `@mystics/libs` 包提供的工具函数。

## 1. 依赖配置

在 `packages/ui/package.json` 中，`@mystics/libs` 已经配置为工作区依赖：

```json
{
  "dependencies": {
    "@mystics/libs": "workspace:^"
  }
}
```

## 2. 导入方式

### 2.1 导入所有工具

```typescript
import { cn, storage, setStorage, getStorage } from '@mystics/libs';
```

### 2.2 按需导入

```typescript
// 只导入样式工具
import { cn } from '@mystics/libs';

// 只导入存储工具
import { storage } from '@mystics/libs';
```

## 3. 样式工具 (cn 函数)

`cn` 函数是基于 `clsx` 和 `tailwind-merge` 的样式合并工具：

### 基本用法

```typescript
import { cn } from '@mystics/libs';

const buttonClasses = cn(
  'px-4 py-2 rounded-md', // 基础样式
  'bg-blue-500 hover:bg-blue-600', // 状态样式
  'transition-colors duration-200', // 动画样式
  className // 外部传入的样式
);

return <button className={buttonClasses}>按钮</button>;
```

### 条件样式

```typescript
const alertClasses = cn(
  'p-4 rounded-md border',
  {
    'bg-red-50 border-red-200 text-red-700': type === 'error',
    'bg-green-50 border-green-200 text-green-700': type === 'success',
    'bg-blue-50 border-blue-200 text-blue-700': type === 'info',
  },
  className
);
```

### 响应式和深色模式

```typescript
const cardClasses = cn(
  'p-6 rounded-lg border',
  'bg-white dark:bg-gray-800',
  'border-gray-200 dark:border-gray-700',
  'text-gray-900 dark:text-gray-100',
  'shadow-sm hover:shadow-md',
  'transition-shadow duration-200',
  className
);
```

## 4. 存储工具

`@mystics/libs` 提供了强大的存储工具，支持过期时间和类型安全：

### 4.1 保存数据

```typescript
import { storage } from '@mystics/libs';

// 保存用户偏好设置
storage.set({
  key: 'user-preferences',
  value: {
    theme: 'dark',
    language: 'zh-CN'
  },
  expire: 30, // 30天过期
  unit: 'day', // 时间单位：'minute' | 'hour' | 'day'
  isLocal: true // 使用 localStorage (默认为 true)
});
```

### 4.2 读取数据

```typescript
// 读取数据并检查过期
const preferences = storage.get<UserPreferences>({
  key: 'user-preferences',
  isLocal: true, // 从 localStorage 读取
  isExpired: true // 检查是否过期，过期则自动删除
});

if (preferences?.value) {
  console.log('用户偏好:', preferences.value);
}
```

### 4.3 删除数据

```typescript
// 删除指定键的数据
storage.remove('user-preferences', true); // true = localStorage

// 清除所有数据
storage.clear(true); // true = localStorage
```

### 4.4 简单存储

```typescript
// 简单的字符串存储
storage.setItem({
  key: 'simple-data',
  value: 'some string value',
  isLocal: true
});

const value = storage.getItem({
  key: 'simple-data',
  isLocal: true
});
```

## 5. 实际使用示例

### 5.1 Mode 组件示例

```typescript
import React, { useEffect } from 'react';
import { cn, storage } from '@mystics/libs';

const ModeToggle: React.FC<ModeToggleProps> = ({ 
  className,
  enableStorage = true,
  storageKey = 'theme-mode'
}) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // 使用 cn 函数合并样式
  const buttonClasses = cn(
    'p-2 rounded-md transition-colors duration-200',
    'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600',
    'text-gray-900 dark:text-gray-100',
    className
  );

  // 切换主题并持久化
  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    
    if (enableStorage) {
      storage.set({
        key: storageKey,
        value: newMode,
        expire: 30,
        unit: 'day'
      });
    }
  };

  // 从存储中恢复主题
  useEffect(() => {
    if (enableStorage) {
      const stored = storage.get<string>({
        key: storageKey,
        isExpired: true
      });
      
      if (stored?.value) {
        setMode(stored.value as 'light' | 'dark');
      }
    }
  }, [enableStorage, storageKey]);

  return (
    <button className={buttonClasses} onClick={toggleMode}>
      {mode === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};
```

### 5.2 表单组件示例

```typescript
import React from 'react';
import { cn } from '@mystics/libs';

interface InputProps {
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

const Input: React.FC<InputProps> = ({ error, disabled, className, ...props }) => {
  const inputClasses = cn(
    // 基础样式
    'w-full px-3 py-2 border rounded-md',
    'transition-colors duration-200',
    // 正常状态
    'border-gray-300 bg-white text-gray-900',
    'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    // 深色模式
    'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100',
    'dark:focus:ring-blue-400',
    // 错误状态
    {
      'border-red-500 focus:ring-red-500': error,
      'dark:border-red-400 dark:focus:ring-red-400': error,
    },
    // 禁用状态
    {
      'opacity-50 cursor-not-allowed': disabled,
      'bg-gray-50 dark:bg-gray-800': disabled,
    },
    className
  );

  return <input className={inputClasses} disabled={disabled} {...props} />;
};
```

## 6. 类型安全

### 6.1 存储类型定义

```typescript
interface UserSettings {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

// 类型安全的存储
storage.set<UserSettings>({
  key: 'user-settings',
  value: {
    theme: 'dark',
    language: 'zh-CN',
    notifications: true
  },
  expire: 7,
  unit: 'day'
});

// 类型安全的读取
const settings = storage.get<UserSettings>({
  key: 'user-settings',
  isExpired: true
});

if (settings?.value) {
  // settings.value 是 UserSettings 类型
  console.log(settings.value.theme); // TypeScript 会有智能提示
}
```

## 7. 最佳实践

### 7.1 样式组织

```typescript
// 将常用样式抽取为常量
const baseButtonStyles = 'px-4 py-2 rounded-md font-medium transition-colors duration-200';
const primaryButtonStyles = 'bg-blue-600 hover:bg-blue-700 text-white';
const secondaryButtonStyles = 'bg-gray-200 hover:bg-gray-300 text-gray-800';

const Button = ({ variant = 'primary', className, ...props }) => {
  const buttonClasses = cn(
    baseButtonStyles,
    {
      [primaryButtonStyles]: variant === 'primary',
      [secondaryButtonStyles]: variant === 'secondary',
    },
    className
  );

  return <button className={buttonClasses} {...props} />;
};
```

### 7.2 存储键管理

```typescript
// 统一管理存储键
export const STORAGE_KEYS = {
  USER_THEME: 'user-theme',
  USER_PREFERENCES: 'user-preferences',
  CACHE_DATA: 'cache-data',
} as const;

// 使用常量
storage.set({
  key: STORAGE_KEYS.USER_THEME,
  value: 'dark',
  expire: 30,
  unit: 'day'
});
```

### 7.3 错误处理

```typescript
const getUserData = () => {
  try {
    const data = storage.get<UserData>({
      key: 'user-data',
      isExpired: true
    });
    
    return data?.value || null;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
};
```

## 8. 注意事项

1. **服务端渲染 (SSR)**：存储工具依赖 `window` 对象，在 SSR 环境中需要进行客户端检查
2. **存储限制**：localStorage 和 sessionStorage 有大小限制，通常为 5-10MB
3. **类型安全**：始终为存储的数据定义 TypeScript 类型
4. **过期检查**：建议在读取数据时启用过期检查 (`isExpired: true`)
5. **样式冲突**：使用 `cn` 函数可以自动解决 Tailwind CSS 类名冲突问题

通过以上方式，你可以在 `@mystics/ui` 组件中充分利用 `@mystics/libs` 提供的工具函数，提高代码复用性和开发效率。