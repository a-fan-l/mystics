# @mystics/ui 中使用 @mystics/libs 集成指南

本指南详细说明了如何在 `@mystics/ui` 子包中使用 `@mystics/libs` 子包的方法和最佳实践。

## 🎯 集成概述

通过 monorepo 的工作区依赖配置，`@mystics/ui` 包可以直接导入和使用 `@mystics/libs` 提供的工具函数。

## 📋 配置清单

### 1. 依赖配置 ✅

在 `packages/ui/package.json` 中已配置工作区依赖：

```json
{
  "dependencies": {
    "@mystics/libs": "workspace:^"
  }
}
```

### 2. 导出配置 ✅

在 `packages/libs/src/utils/index.ts` 中已完整导出：

```typescript
export * from './storage';
export * from './shadcn';
export * from './string';
export * from './date';
```

## 🔧 可用工具函数

### 样式工具

| 函数 | 描述 | 示例 |
|------|------|------|
| `cn()` | 合并 CSS 类名，解决 Tailwind 冲突 | `cn('p-4', 'bg-white', className)` |

### 存储工具

| 函数/对象 | 描述 | 示例 |
|-----------|------|------|
| `storage.set()` | 设置存储数据（支持过期） | `storage.set({key: 'data', value: obj, expire: 1, unit: 'hour'})` |
| `storage.get()` | 获取存储数据（自动过期检查） | `storage.get<T>({key: 'data', isExpired: true})` |
| `storage.remove()` | 删除存储数据 | `storage.remove('data', true)` |
| `storage.clear()` | 清空存储 | `storage.clear(true)` |

### 字符串工具

| 函数 | 描述 | 示例 |
|------|------|------|
| `capitalize()` | 首字母大写 | `capitalize('hello') // 'Hello'` |
| `camelCase()` | 转驼峰命名 | `camelCase('hello world') // 'helloWorld'` |
| `kebabCase()` | 转短横线命名 | `kebabCase('helloWorld') // 'hello-world'` |
| `truncate()` | 截断字符串 | `truncate('long text', 10) // 'long text...'` |
| `randomString()` | 生成随机字符串 | `randomString(8) // 'aBc123Xy'` |

### 日期工具

| 函数 | 描述 | 示例 |
|------|------|------|
| `formatDate()` | 格式化日期 | `formatDate(new Date(), 'YYYY-MM-DD')` |
| `getRelativeTime()` | 相对时间 | `getRelativeTime(date) // '2分钟前'` |
| `isToday()` | 判断是否今天 | `isToday(date) // true/false` |

### TypeScript 类型

| 类型 | 描述 |
|------|------|
| `StorageData<T>` | 存储数据结构 |
| `SetStorageParams<T>` | 设置存储参数 |
| `GetStorageParams` | 获取存储参数 |
| `TimeUnit` | 时间单位类型 |

## 📝 实际使用示例

### 1. 在组件中使用样式工具

```typescript
import React from 'react';
import { cn } from '@mystics/libs';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className,
  ...props 
}) => {
  const buttonClasses = cn(
    // 基础样式
    'font-medium rounded-md transition-colors duration-200',
    // 变体样式
    {
      'bg-blue-600 hover:bg-blue-700 text-white': variant === 'primary',
      'bg-gray-200 hover:bg-gray-300 text-gray-800': variant === 'secondary',
    },
    // 尺寸样式
    {
      'px-2 py-1 text-sm': size === 'sm',
      'px-4 py-2 text-base': size === 'md',
      'px-6 py-3 text-lg': size === 'lg',
    },
    // 深色模式
    variant === 'secondary' && 'dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200',
    // 外部传入的样式
    className
  );

  return <button className={buttonClasses} {...props} />;
};
```

### 2. 在组件中使用存储工具

```typescript
import React, { useState, useEffect } from 'react';
import { storage, type StorageData } from '@mystics/libs';

interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
}

const UserSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'zh-CN'
  });

  // 保存偏好设置
  const savePreferences = (newPrefs: UserPreferences) => {
    storage.set({
      key: 'user-preferences',
      value: newPrefs,
      expire: 30, // 30天过期
      unit: 'day',
      isLocal: true
    });
    setPreferences(newPrefs);
  };

  // 加载偏好设置
  useEffect(() => {
    const stored: StorageData<UserPreferences> | null = storage.get({
      key: 'user-preferences',
      isLocal: true,
      isExpired: true // 自动过期检查
    });

    if (stored?.value) {
      setPreferences(stored.value);
    }
  }, []);

  return (
    <div>
      {/* 设置界面 */}
    </div>
  );
};
```

### 3. 综合使用示例

```typescript
import React, { useState } from 'react';
import { 
  cn, 
  storage, 
  formatDate, 
  randomString, 
  capitalize,
  truncate 
} from '@mystics/libs';

const DataCard: React.FC<{ data: any; onSave: () => void }> = ({ data, onSave }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const cardClasses = cn(
    'p-4 border rounded-lg transition-all duration-200',
    'bg-white dark:bg-gray-800',
    'border-gray-200 dark:border-gray-700',
    'hover:shadow-md'
  );

  const saveToStorage = () => {
    storage.set({
      key: `data-${randomString(6)}`,
      value: {
        ...data,
        id: randomString(8),
        savedAt: new Date().toISOString()
      },
      expire: 1,
      unit: 'hour'
    });
    onSave();
  };

  return (
    <div className={cardClasses}>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
        {capitalize(data.title)}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        {isExpanded ? data.content : truncate(data.content, 100)}
      </p>
      
      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-500">
          {formatDate(data.createdAt, 'MM-DD HH:mm')}
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'text-sm px-2 py-1 rounded',
              'bg-gray-100 hover:bg-gray-200',
              'dark:bg-gray-700 dark:hover:bg-gray-600'
            )}
          >
            {isExpanded ? '收起' : '展开'}
          </button>
          
          <button
            onClick={saveToStorage}
            className={cn(
              'text-sm px-2 py-1 rounded',
              'bg-blue-100 text-blue-700 hover:bg-blue-200',
              'dark:bg-blue-900 dark:text-blue-300'
            )}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🔄 构建流程

### 1. 构建依赖顺序

```bash
# 1. 先构建 libs 包
pnpm run build:libs

# 2. 再构建 ui 包
pnpm run build:ui

# 或者构建所有包
pnpm run build
```

### 2. 开发时的热重载

在开发模式下，如果修改了 `@mystics/libs` 的代码：

```bash
# 重新构建 libs 包
cd packages/libs
pnpm run build

# UI 包会自动使用新的构建产物
```

## 🎨 Storybook 集成

在 Storybook 故事中使用 libs 工具：

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import Component from './Component';

const meta: Meta<typeof Component> = {
  title: 'Components/Component',
  component: Component,
  parameters: {
    docs: {
      description: {
        component: '这个组件展示了如何使用 @mystics/libs 的工具函数。'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLibsTools: Story = {
  args: {
    onSave: action('data-saved'),
    enableStorage: true,
  },
  parameters: {
    docs: {
      description: {
        story: '使用 @mystics/libs 存储工具和样式工具的示例。'
      }
    }
  }
};
```

## 📁 文件结构

```
packages/
├── libs/                    # 工具库包
│   ├── src/
│   │   ├── utils/
│   │   │   ├── index.ts    # 统一导出
│   │   │   ├── storage.ts  # 存储工具
│   │   │   ├── shadcn.ts   # 样式工具
│   │   │   ├── string.ts   # 字符串工具
│   │   │   └── date.ts     # 日期工具
│   │   └── index.ts        # 主入口
│   └── dist/               # 构建输出
│
└── ui/                     # UI 组件包
    ├── src/
    │   ├── components/
    │   │   ├── Mode/       # 示例：使用 cn + storage
    │   │   └── StorageDemo/# 示例：完整的 libs 使用
    │   └── index.ts
    ├── examples/           # 使用示例
    ├── docs/              # 使用文档
    └── dist/              # 构建输出
```

## 🚀 最佳实践

### 1. 导入优化

```typescript
// ✅ 推荐：按需导入
import { cn, storage, formatDate } from '@mystics/libs';

// ❌ 避免：导入整个包
import * as libs from '@mystics/libs';
```

### 2. 类型安全

```typescript
// ✅ 使用提供的类型
import { storage, type StorageData, type SetStorageParams } from '@mystics/libs';

const params: SetStorageParams<UserData> = {
  key: 'user-data',
  value: userData,
  expire: 1,
  unit: 'hour'
};
```

### 3. 错误处理

```typescript
// ✅ 包装存储操作
const safeStorageGet = <T>(key: string): T | null => {
  try {
    const result = storage.get<T>({ key, isExpired: true });
    return result?.value || null;
  } catch (error) {
    console.warn('Storage get failed:', error);
    return null;
  }
};
```

### 4. 性能优化

```typescript
// ✅ 缓存复杂的样式计算
const useButtonClasses = (variant: string, size: string) => {
  return useMemo(() => cn(
    'base-classes',
    variantClasses[variant],
    sizeClasses[size]
  ), [variant, size]);
};
```

## 🧪 测试

组件测试中使用 libs 工具：

```typescript
import { render, screen } from '@testing-library/react';
import { storage } from '@mystics/libs';
import Component from './Component';

describe('Component', () => {
  beforeEach(() => {
    // 清理存储
    storage.clear(true);
  });

  it('should save data to storage', () => {
    render(<Component />);
    
    // 触发保存操作
    fireEvent.click(screen.getByRole('button', { name: /保存/ }));
    
    // 验证数据已保存
    const stored = storage.get({ key: 'test-data' });
    expect(stored?.value).toBeDefined();
  });
});
```

## 📚 相关资源

- [完整使用示例](./packages/ui/examples/using-libs-example.tsx)
- [组件示例：Mode](./packages/ui/src/components/Mode/index.tsx)
- [组件示例：StorageDemo](./packages/ui/src/components/StorageDemo/index.tsx)
- [详细使用指南](./packages/ui/docs/using-libs.md)

通过以上集成方式，`@mystics/ui` 包可以充分利用 `@mystics/libs` 提供的工具函数，提高开发效率和代码质量。