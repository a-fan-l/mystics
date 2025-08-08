# 远程服务器部署完整指南

## 🚀 第一步：将 Verdaccio 部署到远程服务器

### 1.1 服务器准备

```bash
# 连接到你的服务器
ssh root@your-server-ip

# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 1.2 上传项目文件到服务器

```bash
# 在本地项目目录执行
# 方法1：使用 git
git clone https://github.com/a-fan-l/mystics.git /opt/mystics

# 方法2：使用 scp 上传
scp -r . root@your-server-ip:/opt/mystics
```

### 1.3 修改 Docker 配置（生产环境）

在服务器上创建 `docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  verdaccio:
    image: verdaccio/verdaccio:5
    container_name: mystics-registry-prod
    restart: unless-stopped
    ports:
      - "4873:4873"
    environment:
      - VERDACCIO_USER_UID=10001
      - VERDACCIO_USER_GID=65533
      # 重要：设置公开访问的 URL
      - VERDACCIO_PUBLIC_URL=http://your-server-ip:4873
    volumes:
      - "./verdaccio-config.yaml:/verdaccio/conf/config.yaml"
      - "verdaccio_storage:/verdaccio/storage"
      - "./logs:/verdaccio/logs"
    networks:
      - verdaccio

volumes:
  verdaccio_storage:
    driver: local

networks:
  verdaccio:
    driver: bridge
```

### 1.4 启动远程服务

```bash
# 在服务器的项目目录
cd /opt/mystics

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 检查服务状态
docker ps
docker logs mystics-registry-prod

# 测试访问
curl http://localhost:4873/-/ping
```

### 1.5 配置防火墙（重要）

```bash
# Ubuntu/Debian
ufw allow 4873/tcp
ufw reload

# CentOS/RHEL
firewall-cmd --permanent --add-port=4873/tcp
firewall-cmd --reload
```

## ⚙️ 第二步：配置 Lerna 使用远程 Registry

### 2.1 更新 .npmrc（全局配置）

```bash
# 在本地项目根目录
cat > .npmrc << EOF
# 全局注册表设置
registry=http://your-server-ip:4873

# 作用域包配置  
@mystics:registry=http://your-server-ip:4873
@lf:registry=http://your-server-ip:4873

# 其他配置
save-prefix=^
save-exact=false
package-lock=true

# 发布配置
access=public
tag-version-prefix=v

# 缓存配置
cache-min=86400
EOF
```

### 2.2 更新 lerna.json

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "0.0.0",
  "packages": ["packages/*", "apps/*"],
  "npmClient": "pnpm",
  "ignoreChanges": ["**/node_modules/**", "**/__snapshots__/**"],
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish",
      "registry": "http://your-server-ip:4873",
      "access": "public"
    },
    "version": {
      "allowBranch": ["main", "master"],
      "conventionalCommits": true
    }
  }
}
```

### 2.3 更新各包的 package.json

需要修改所有包的 `repository` 字段和确保正确的 scope：

```bash
# 批量更新脚本
#!/bin/bash
SERVER_IP="your-server-ip"

for package_json in packages/*/package.json; do
    # 更新 repository URL
    sed -i "s|\"registry\": \".*\"|\"registry\": \"http://${SERVER_IP}:4873\"|g" $package_json
    
    echo "Updated: $package_json"
done
```

## 📦 第三步：清理并重新发布包

### 3.1 清理本地环境

```bash
# 清理构建产物
pnpm run clean

# 清理 node_modules
rm -rf node_modules packages/*/node_modules

# 清理锁文件
rm -f pnpm-lock.yaml packages/*/pnpm-lock.yaml

# 重新安装依赖
pnpm install
```

### 3.2 构建所有包

```bash
# 构建所有包
pnpm run build

# 验证构建结果
find packages -name "dist" -type d
```

### 3.3 配置注册表和登录

```bash
# 设置注册表
npm config set registry http://your-server-ip:4873

# 登录（首次需要创建用户）
npm adduser --registry http://your-server-ip:4873
# 输入用户名、密码、邮箱

# 验证登录
npm whoami --registry http://your-server-ip:4873
```

### 3.4 发布包到远程注册表

```bash
# 方法1：使用我们的发布脚本
./scripts/publish.sh -r http://your-server-ip:4873

# 方法2：使用 Lerna 直接发布
lerna publish --registry http://your-server-ip:4873

# 方法3：手动逐个发布
cd packages/libs && npm publish --registry http://your-server-ip:4873
cd packages/hooks && npm publish --registry http://your-server-ip:4873
cd packages/ui && npm publish --registry http://your-server-ip:4873
cd packages/cli && npm publish --registry http://your-server-ip:4873
```

## 👥 第四步：团队成员配置

### 4.1 团队成员配置客户端

#### 4.1.1 创建或编辑全局 ~/.npmrc

```bash
# 在团队成员的本地机器上
cat > ~/.npmrc << EOF
# 公司私有注册表
registry=http://your-server-ip:4873

# 作用域包配置
@mystics:registry=http://your-server-ip:4873
@lf:registry=http://your-server-ip:4873

# 公共包仍使用官方源（可选）
@babel:registry=https://registry.npmjs.org/
@types:registry=https://registry.npmjs.org/
@react:registry=https://registry.npmjs.org/
EOF
```

#### 4.1.2 用户认证登录

```bash
# 登录私有注册表
npm login --registry=http://your-server-ip:4873

# 输入管理员提供的用户名和密码
# Username: team-member-1
# Password: ********
# Email: member1@company.com

# 验证登录状态
npm whoami --registry=http://your-server-ip:4873
```

### 4.2 安装私有包

#### 4.2.1 在新项目中安装

```bash
# 创建新项目
mkdir my-project && cd my-project
npm init -y

# 安装私有包
pnpm add @mystics/libs --registry=http://your-server-ip:4873
pnpm add @mystics/hooks --registry=http://your-server-ip:4873
pnpm add @mystics/ui --registry=http://your-server-ip:4873

# 或者一次性安装多个
pnpm add @mystics/libs @mystics/hooks @mystics/ui --registry=http://your-server-ip:4873
```

#### 4.2.2 在现有项目中使用

```bash
# 在现有项目根目录创建 .npmrc
cat > .npmrc << EOF
registry=http://your-server-ip:4873
@mystics:registry=http://your-server-ip:4873
EOF

# 安装依赖
pnpm install
```

### 4.3 验证安装

#### 4.3.1 查看包信息

```bash
# 验证包信息
npm view @mystics/libs --registry=http://your-server-ip:4873
npm view @mystics/hooks --registry=http://your-server-ip:4873
npm view @mystics/ui --registry=http://your-server-ip:4873

# 查看版本历史
npm view @mystics/libs versions --json --registry=http://your-server-ip:4873
```

#### 4.3.2 在代码中使用

```typescript
// test-private-packages.ts
import { storage, cn, formatDate } from '@mystics/libs';
import { useToggle, useDebounce } from '@mystics/hooks';
import { Button } from '@mystics/ui';

// 测试 libs
console.log('Storage test:', storage);
console.log('CN function:', cn('test', 'class'));
console.log('Date format:', formatDate(new Date(), 'YYYY-MM-DD'));

// 在 React 组件中使用
function TestComponent() {
  const [isOpen, toggleOpen] = useToggle(false);
  const debouncedValue = useDebounce('test', 300);
  
  return (
    <div className={cn('container', { 'is-open': isOpen })}>
      <Button onClick={toggleOpen}>
        Toggle: {isOpen ? 'Open' : 'Closed'}
      </Button>
      <p>Debounced: {debouncedValue}</p>
    </div>
  );
}
```

#### 4.3.3 验证网络连接

```bash
# 测试注册表连接
curl http://your-server-ip:4873/-/ping

# 查看注册表信息
curl http://your-server-ip:4873/-/whoami

# 浏览器访问 Web 界面
# http://your-server-ip:4873
```

## 🔧 故障排查

### 常见问题及解决方案

#### 1. 无法访问远程注册表

```bash
# 检查服务器防火墙
telnet your-server-ip 4873

# 检查服务状态
ssh root@your-server-ip "docker ps | grep verdaccio"

# 检查日志
ssh root@your-server-ip "docker logs mystics-registry-prod"
```

#### 2. 发布权限问题

```bash
# 检查用户权限
npm access list packages --registry=http://your-server-ip:4873

# 重新登录
npm logout --registry=http://your-server-ip:4873
npm login --registry=http://your-server-ip:4873
```

#### 3. 包安装失败

```bash
# 清理缓存
npm cache clean --force

# 检查注册表配置
npm config get registry
npm config list

# 强制从指定注册表安装
npm install @mystics/libs --registry=http://your-server-ip:4873 --force
```

## 📋 完成检查清单

- [ ] ✅ 服务器安装 Docker 和 Docker Compose
- [ ] ✅ 上传项目文件到服务器
- [ ] ✅ 配置并启动 Verdaccio 服务
- [ ] ✅ 配置防火墙开放 4873 端口
- [ ] ✅ 更新本地 .npmrc 配置
- [ ] ✅ 更新 lerna.json 配置
- [ ] ✅ 清理并重新构建包
- [ ] ✅ 登录远程注册表
- [ ] ✅ 发布包到远程注册表
- [ ] ✅ 团队成员配置 ~/.npmrc
- [ ] ✅ 团队成员登录注册表
- [ ] ✅ 验证包安装和使用
- [ ] ✅ 测试 Web 界面访问

完成所有步骤后，你的团队就可以正常使用私有包了！🎉