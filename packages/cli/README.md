# @mystics/cli

Mystics CLI 工具集，提供 API 类型生成和 CSS Transform 转换功能。

## 📦 安装

```bash
# 通过 npm 安装
npm install -g @mystics/cli

# 通过 pnpm 安装 (推荐)
pnpm add -g @mystics/cli

# 在项目中安装
pnpm add -D @mystics/cli
```

## 🚀 工具介绍

### 1. API 类型生成器 (mystics-api-type)

从 API 接口自动生成 TypeScript 类型定义，基于 quicktype 引擎。

#### 特性
- ✅ 支持任意 JSON API 接口
- ✅ 自动生成 TypeScript 类型定义
- ✅ 交互式配置或命令行参数
- ✅ 智能类型推断和优化
- ✅ 文件备份和覆盖保护

#### 使用方法

**交互式模式（推荐）:**
```bash
mystics-api-type -i
```

**命令行模式:**
```bash
# 基本用法
mystics-api-type -u https://api.example.com/users -n UserData -p ./types/user.ts

# 覆盖已存在的文件
mystics-api-type -u https://api.example.com/users -n UserData -p ./types/user.ts -o

# 详细输出
mystics-api-type -u https://api.example.com/users -n UserData -p ./types/user.ts -v
```

**参数说明:**
- `-u, --url <url>` - API URL 地址
- `-n, --name <name>` - 生成的类型名称
- `-p, --path <path>` - 输出文件路径
- `-o, --overwrite` - 覆盖已存在的文件
- `-i, --interactive` - 交互式模式
- `-v, --verbose` - 详细输出
- `-h, --help` - 显示帮助信息

**示例:**
```bash
# 从用户 API 生成类型
mystics-api-type -u http://localhost:4111/api/users -n UserData -p ./types/user.ts

# 从产品 API 生成类型
mystics-api-type -u https://api.shop.com/products -n ProductData -p ./types/product.ts
```

### 2. CSS Transform 转换器 (mystics-transform-css)

将传统的 CSS transform 属性转换为 3D 矩阵形式，提升性能和兼容性。

#### 特性
- ✅ 支持所有常见 transform 函数
- ✅ 自动计算 3D 矩阵
- ✅ 批量处理多个文件
- ✅ 文件备份保护
- ✅ 代码美化输出

#### 支持的 Transform 函数
- `translate()`, `translateX()`, `translateY()`, `translateZ()`, `translate3d()`
- `scale()`, `scaleX()`, `scaleY()`, `scaleZ()`, `scale3d()`
- `rotate()`, `rotateX()`, `rotateY()`, `rotateZ()`
- `skew()`, `skewX()`, `skewY()`

#### 使用方法

**交互式模式（推荐）:**
```bash
mystics-transform-css -i
```

**单文件处理:**
```bash
# 转换单个文件（覆盖原文件）
mystics-transform-css styles.css

# 转换到新文件
mystics-transform-css styles.css -o styles-3d.css

# 不备份原文件
mystics-transform-css styles.css --no-backup
```

**批量处理:**
```bash
# 处理整个目录
mystics-transform-css -d ./src/styles

# 处理当前目录
mystics-transform-css -d .
```

**参数说明:**
- `[file]` - CSS 文件路径
- `-o, --output <path>` - 输出文件路径
- `-b, --backup` - 备份原文件（默认：true）
- `--no-backup` - 不备份原文件
- `-p, --prettify` - 美化输出代码（默认：true）
- `--no-prettify` - 不美化输出代码
- `-i, --interactive` - 交互式模式
- `-d, --directory <dir>` - 批量处理目录
- `-v, --verbose` - 详细输出
- `-q, --quiet` - 静默模式

#### 转换示例

**转换前:**
```css
.element {
  transform: translate(100px, 50px) rotate(45deg) scale(1.2);
}
```

**转换后:**
```css
.element {
  transform: matrix3d(0.848, 0.848, 0, 120, -0.848, 0.848, 0, 60, 0, 0, 1.2, 0, 0, 0, 0, 1);
}
```

## 🛠️ 开发

### 构建

```bash
# 构建库和 CLI 工具
pnpm run build

# 只构建库
pnpm run build:lib

# 只构建 CLI 工具
pnpm run build:bin

# 开发模式（监听文件变化）
pnpm run dev
```

### 测试

```bash
# 测试 API 类型生成
node bin/api-type.js -u https://jsonplaceholder.typicode.com/users/1 -n User -p ./test-user.ts

# 测试 CSS 转换
echo ".test { transform: translate(10px, 20px); }" > test.css
node bin/transform3d-css.js test.css
```

### 项目结构

```
packages/cli/
├── src/
│   ├── cli/                 # CLI 入口文件
│   │   ├── api-type.ts     # API 类型生成 CLI
│   │   └── transform3d-css.ts # CSS 转换 CLI
│   ├── utils/              # 工具类
│   │   ├── api-generator.ts    # API 类型生成器
│   │   └── css-transformer.ts # CSS 转换器
│   ├── types/              # 类型定义
│   │   └── common.ts       # 通用类型
│   └── index.ts            # 主入口文件
├── bin/                    # 编译后的 CLI 工具
├── dist/                   # 编译后的库文件
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 使用场景

### API 类型生成器适用场景
- 🔗 集成第三方 API 时快速生成类型定义
- 🏗️ 前后端分离项目的类型同步
- 📋 API 文档驱动的开发流程
- 🔄 自动化 CI/CD 中的类型生成

### CSS Transform 转换器适用场景
- ⚡ 优化 CSS 动画性能
- 🎯 提升浏览器兼容性
- 🏭 大型项目的批量 CSS 重构
- 🎨 现代化 CSS 代码风格升级

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License