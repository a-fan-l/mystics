# Mystics

[English](#english) | [中文](#chinese)

## English

### Overview
Mystics is a monorepo project built with modern JavaScript/TypeScript tooling. It uses pnpm workspaces and Lerna for managing multiple packages.

### Project Structure
The project is organized as a monorepo with the following packages:
- `packages/ui`: UI components library
- `packages/hooks`: Custom React hooks
- `packages/libs`: Shared utilities and libraries
- `packages/cli`: Command-line interface tools

### Prerequisites
- Node.js (Latest LTS version recommended)
- pnpm (Latest version)

### Installation
```bash
# Install dependencies
pnpm install
```

### Development
```bash
# Install dependencies for all packages
pnpm install

# Run tests
pnpm test
```

### CLI Usage
The CLI tool provides two main commands:

1. **Generate TypeScript types from API**:
```bash
# Interactive mode
pnpm exec mystics-api-type

# Command line mode
pnpm exec mystics-api-type -u <API_URL> -n <TYPE_NAME> -p <SAVE_PATH>

# Example
pnpm exec mystics-api-type -u http://localhost:4111/api/agents -n AgentsData -p ./types
```

2. **Transform CSS to matrix3d**:
```bash
# Interactive mode
pnpm exec mystics-transform-css

# Command line mode
pnpm exec mystics-transform-css <CSS_FILE> -o <OUTPUT_FILE>
```

### Project Management
This project uses:
- pnpm workspaces for package management
- Lerna for monorepo management

## Chinese

### 概述
Mystics 是一个使用现代 JavaScript/TypeScript 工具构建的 monorepo 项目。它使用 pnpm workspaces 和 Lerna 来管理多个包。

### 项目结构
该项目组织为一个 monorepo，包含以下包：
- `packages/ui`: UI 组件库
- `packages/hooks`: 自定义 React Hooks
- `packages/libs`: 共享工具和库
- `packages/cli`: 命令行工具

### 环境要求
- Node.js（推荐使用最新的 LTS 版本）
- pnpm（最新版本）

### 安装
```bash
# 安装依赖
pnpm install
```

### 开发
```bash
# 为所有包安装依赖
pnpm install

# 运行测试
pnpm test
```

### CLI 使用说明
CLI 工具提供了两个主要命令：

1. **从 API 生成 TypeScript 类型**:
```bash
# 交互式模式
pnpm exec mystics-api-type

# 命令行模式
pnpm exec mystics-api-type -u <API地址> -n <类型名称> -p <保存路径>

# 示例
pnpm exec mystics-api-type -u http://localhost:4111/api/agents -n UserData -p ./types
```

2. **CSS transform 转换**:
```bash
# 交互式模式
pnpm exec mystics-transform-css

# 命令行模式
pnpm exec mystics-transform-css <CSS文件> -o <输出文件>
```

### 项目管理
本项目使用：
- pnpm workspaces 进行包管理
- Lerna 进行 monorepo 管理

### 完整的开发和发布流程

#### 1. 安装依赖
```bash
pnpm install
```

#### 2. 构建所有包
```bash
pnpm run build
```

#### 3. 启动 Storybook 开发环境
```bash
pnpm run dev:ui
# 或者
pnpm run storybook
```

#### 4. 部署 Verdaccio 私有注册表
```bash
# 启动私有注册表
pnpm run verdaccio:start

# 停止私有注册表
pnpm run verdaccio:stop
```

#### 5. 发布包到私有注册表
```bash
# 预演发布（不实际发布）
pnpm run publish:dry

# 正式发布
pnpm run publish
```

#### 6. 使用私有注册表
```bash
# 设置注册表
npm config set registry http://localhost:4873

# 注册用户
npm adduser --registry http://localhost:4873

# 安装私有包
npm install @mystics/ui @mystics/hooks @mystics/libs @mystics/cli
```

#### 7. 使用 CLI 工具
```bash
# 全局安装 CLI 工具
npm install -g @mystics/cli

# 生成 API 类型定义
mystics-api-type -u https://api.example.com/users -n UserData -p ./types/user.ts

# 转换 CSS Transform 为 3D 矩阵
mystics-transform-css styles.css -o styles-optimized.css
```

### 包说明

- **@mystics/ui**: React UI 组件库，使用 Rollup 构建，包含 Storybook 文档
- **@mystics/hooks**: 自定义 React Hooks，使用 Microbundle 构建  
- **@mystics/libs**: 共享工具库，使用 Microbundle 构建
- **@mystics/cli**: 命令行工具集，包含 API 类型生成和 CSS Transform 转换功能

### 目录结构
```
mystics/
├── packages/           # 所有包
│   ├── ui/            # UI 组件库
│   ├── hooks/         # React Hooks
│   ├── libs/          # 工具库
│   └── cli/           # CLI 工具
├── scripts/           # 构建和部署脚本
├── verdaccio-config.yaml  # Verdaccio 配置
├── docker-compose.yml     # Docker 编排文件
└── .npmrc            # npm 配置