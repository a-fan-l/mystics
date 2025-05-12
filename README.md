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

### 项目管理
本项目使用：
- pnpm workspaces 进行包管理
- Lerna 进行 monorepo 管理