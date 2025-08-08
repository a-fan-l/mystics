# 团队成员使用指南

## 🎯 快速开始

### 1. 新成员加入流程

```bash
# 步骤1: 设置注册表
npm config set registry https://registry.yourcompany.com

# 步骤2: 注册账号 (管理员提供账号或自行注册)
npm adduser --registry https://registry.yourcompany.com

# 步骤3: 验证登录
npm whoami --registry https://registry.yourcompany.com
```

### 2. 项目配置

在项目根目录创建 `.npmrc` 文件：

```ini
# .npmrc
registry=https://registry.yourcompany.com
@mystics:registry=https://registry.yourcompany.com
@yourcompany:registry=https://registry.yourcompany.com

# 备用公共注册表
@babel:registry=https://registry.npmjs.org/
@types:registry=https://registry.npmjs.org/
```

## 📦 使用私有包

### 安装私有包

```bash
# 安装单个包
npm install @mystics/ui

# 安装多个包
npm install @mystics/ui @mystics/hooks @mystics/libs

# 指定版本
npm install @mystics/ui@^1.2.0
```

### 在项目中使用

```typescript
// React 项目示例
import { Button } from '@mystics/ui';
import { useToggle } from '@mystics/hooks'; 
import { storage, cn } from '@mystics/libs';

function App() {
  const [isOpen, toggleOpen] = useToggle(false);
  
  return (
    <div className={cn('app', { 'is-open': isOpen })}>
      <Button onClick={toggleOpen}>
        Toggle Menu
      </Button>
    </div>
  );
}
```

## 🔧 开发流程

### 1. 功能开发

```bash
# 克隆仓库
git clone https://github.com/a-fan-l/mystics.git
cd mystics

# 安装依赖
pnpm install

# 开发模式
pnpm run dev:ui        # 启动 Storybook
pnpm run build:libs    # 构建 libs 包
pnpm run build:hooks   # 构建 hooks 包
```

### 2. 本地测试

```bash
# 构建所有包
pnpm run build

# 本地预发布测试
pnpm run publish:dry

# 启动本地注册表
pnpm run verdaccio:start
```

### 3. 发布流程

```bash
# 确保所有包构建成功
pnpm run build

# 版本管理
pnpm run version

# 发布到私有注册表
pnpm run publish
```

## 👥 团队协作

### 分支策略

```
main          # 生产分支，自动发布
develop       # 开发分支
feature/*     # 功能分支
hotfix/*      # 热修复分支
```

### 代码审查

```bash
# 创建功能分支
git checkout -b feature/new-component

# 开发完成后推送
git push origin feature/new-component

# 创建 Pull Request
# 代码审查通过后合并到 develop
# 定期将 develop 合并到 main 触发发布
```

### 版本管理规范

```json
{
  "version": "1.2.3",
  "description": "版本号说明: 主版本.次版本.修订版本"
}
```

- **主版本**：不兼容的 API 修改
- **次版本**：向下兼容的功能性新增
- **修订版本**：向下兼容的问题修正

## 🚀 最佳实践

### 1. 包管理

```bash
# 只安装需要的包
npm install @mystics/ui          # ✅ 好的
npm install @mystics/*           # ❌ 避免通配符

# 锁定版本范围
npm install @mystics/ui@~1.2.0   # ✅ 小版本锁定
npm install @mystics/ui@*        # ❌ 避免不确定版本
```

### 2. 缓存管理

```bash
# 清理 npm 缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 3. 问题排查

```bash
# 检查注册表配置
npm config get registry

# 检查包信息
npm info @mystics/ui

# 检查网络连接
curl https://registry.yourcompany.com/-/ping
```

## 📋 常见问题

### Q1: 无法安装私有包？

```bash
# 检查注册表配置
npm config list

# 检查登录状态
npm whoami --registry https://registry.yourcompany.com

# 重新登录
npm logout --registry https://registry.yourcompany.com
npm adduser --registry https://registry.yourcompany.com
```

### Q2: 包版本冲突？

```bash
# 查看依赖树
npm ls @mystics/ui

# 强制安装指定版本
npm install @mystics/ui@1.2.0 --force

# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

### Q3: 发布权限问题？

```bash
# 检查发布权限
npm access list packages --registry https://registry.yourcompany.com

# 联系管理员添加权限
# 或检查 verdaccio-config.yaml 配置
```

## 🔧 工具配置

### VS Code 配置

```json
// .vscode/settings.json
{
  "npm.packageManager": "pnpm",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### 自动补全配置

```typescript
// types/global.d.ts
declare module '@mystics/*' {
  // 自动补全支持
}
```

## 📞 支持和帮助

- **技术文档**: `./packages/*/README.md`
- **API 文档**: Storybook (http://localhost:6006)
- **问题反馈**: GitHub Issues
- **团队交流**: Slack/企业微信群