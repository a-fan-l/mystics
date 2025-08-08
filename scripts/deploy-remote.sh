#!/bin/bash

# 远程服务器部署自动化脚本
# 根据用户提供的步骤实现完整的团队使用流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Mystics 远程私仓部署脚本${NC}"
echo "=============================================="

# 获取用户输入
get_server_info() {
    echo -e "${YELLOW}📋 请输入服务器信息:${NC}"
    read -p "服务器IP地址: " SERVER_IP
    read -p "SSH用户名 (默认root): " SSH_USER
    SSH_USER=${SSH_USER:-root}
    read -p "SSH端口 (默认22): " SSH_PORT
    SSH_PORT=${SSH_PORT:-22}
    
    echo ""
    echo -e "${BLUE}将使用以下配置:${NC}"
    echo "  服务器: ${SERVER_IP}"
    echo "  用户: ${SSH_USER}"
    echo "  端口: ${SSH_PORT}"
    echo "  注册表地址: http://${SERVER_IP}:4873"
    echo ""
    
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 1
    fi
}

# 测试服务器连接
test_connection() {
    echo -e "${BLUE}🔗 测试服务器连接...${NC}"
    
    if ssh -o ConnectTimeout=10 -p $SSH_PORT $SSH_USER@$SERVER_IP "echo 'Connection successful'" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务器连接成功${NC}"
    else
        echo -e "${RED}❌ 无法连接到服务器${NC}"
        echo "请检查:"
        echo "  1. 服务器IP是否正确"
        echo "  2. SSH密钥是否配置"
        echo "  3. 防火墙设置"
        exit 1
    fi
}

# 在服务器上安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 在服务器上安装依赖...${NC}"
    
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << 'ENDSSH'
# 检查并安装 Docker
if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "✅ Docker 已安装"
fi

# 检查并安装 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose 已安装"
fi

# 检查并安装 Git
if ! command -v git &> /dev/null; then
    echo "安装 Git..."
    if command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y git
    elif command -v yum &> /dev/null; then
        yum install -y git
    fi
else
    echo "✅ Git 已安装"
fi

echo "依赖安装完成"
ENDSSH

    echo -e "${GREEN}✅ 服务器依赖安装完成${NC}"
}

# 部署项目到服务器
deploy_project() {
    echo -e "${BLUE}📂 部署项目到服务器...${NC}"
    
    # 在服务器上克隆或更新项目
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << ENDSSH
# 创建项目目录
mkdir -p /opt/mystics
cd /opt/mystics

# 克隆或更新项目
if [ -d ".git" ]; then
    echo "更新现有项目..."
    git pull origin main
else
    echo "克隆项目..."
    git clone https://github.com/a-fan-l/mystics.git .
fi

echo "项目部署完成"
ENDSSH

    echo -e "${GREEN}✅ 项目部署完成${NC}"
}

# 配置生产环境
configure_production() {
    echo -e "${BLUE}⚙️  配置生产环境...${NC}"
    
    # 创建生产环境配置
    cat > docker-compose.prod.yml << EOF
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
      - VERDACCIO_PUBLIC_URL=http://${SERVER_IP}:4873
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
EOF

    # 上传配置文件
    scp -P $SSH_PORT docker-compose.prod.yml $SSH_USER@$SERVER_IP:/opt/mystics/
    scp -P $SSH_PORT verdaccio-config.yaml $SSH_USER@$SERVER_IP:/opt/mystics/
    
    echo -e "${GREEN}✅ 生产环境配置完成${NC}"
}

# 启动服务
start_service() {
    echo -e "${BLUE}🚀 启动 Verdaccio 服务...${NC}"
    
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << 'ENDSSH'
cd /opt/mystics

# 停止现有服务
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
sleep 10

# 检查服务状态
if docker ps | grep mystics-registry-prod > /dev/null; then
    echo "✅ Verdaccio 服务启动成功"
else
    echo "❌ Verdaccio 服务启动失败"
    docker logs mystics-registry-prod
    exit 1
fi
ENDSSH

    echo -e "${GREEN}✅ 服务启动成功${NC}"
}

# 配置防火墙
configure_firewall() {
    echo -e "${BLUE}🔒 配置防火墙...${NC}"
    
    ssh -p $SSH_PORT $SSH_USER@$SERVER_IP << 'ENDSSH'
# 检测防火墙类型并配置
if command -v ufw &> /dev/null; then
    # Ubuntu/Debian
    ufw allow 4873/tcp
    ufw --force enable
    echo "✅ UFW 防火墙已配置"
elif command -v firewall-cmd &> /dev/null; then
    # CentOS/RHEL
    firewall-cmd --permanent --add-port=4873/tcp
    firewall-cmd --reload
    echo "✅ FirewallD 已配置"
else
    echo "⚠️  请手动开放 4873 端口"
fi
ENDSSH

    echo -e "${GREEN}✅ 防火墙配置完成${NC}"
}

# 更新本地配置
update_local_config() {
    echo -e "${BLUE}⚙️  更新本地配置...${NC}"
    
    # 备份原配置
    if [ -f ".npmrc" ]; then
        cp .npmrc .npmrc.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    if [ -f "lerna.json" ]; then
        cp lerna.json lerna.json.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # 更新 .npmrc
    cat > .npmrc << EOF
# 远程私有注册表配置
registry=http://${SERVER_IP}:4873

# 作用域包配置
@mystics:registry=http://${SERVER_IP}:4873
@lf:registry=http://${SERVER_IP}:4873

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

    # 更新 lerna.json
    cat > lerna.json << EOF
{
  "\$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "0.0.0",
  "packages": ["packages/*", "apps/*"],
  "npmClient": "pnpm",
  "ignoreChanges": ["**/node_modules/**", "**/__snapshots__/**"],
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish",
      "registry": "http://${SERVER_IP}:4873",
      "access": "public"
    },
    "version": {
      "allowBranch": ["main", "master"],
      "conventionalCommits": true
    }
  }
}
EOF

    echo -e "${GREEN}✅ 本地配置更新完成${NC}"
}

# 清理并重新发布
republish_packages() {
    echo -e "${BLUE}📦 清理并重新发布包...${NC}"
    
    # 清理环境
    echo "清理构建产物..."
    pnpm run clean 2>/dev/null || true
    
    echo "重新安装依赖..."
    rm -rf node_modules packages/*/node_modules 2>/dev/null || true
    pnpm install
    
    echo "构建所有包..."
    pnpm run build
    
    # 设置注册表
    npm config set registry http://${SERVER_IP}:4873
    
    echo -e "${YELLOW}🔐 请登录到远程注册表...${NC}"
    echo "如果是首次使用，系统会提示创建新用户"
    npm adduser --registry http://${SERVER_IP}:4873
    
    # 验证登录
    if npm whoami --registry http://${SERVER_IP}:4873 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 登录成功${NC}"
        
        echo "发布包到远程注册表..."
        ./scripts/publish.sh -r http://${SERVER_IP}:4873
        
        echo -e "${GREEN}✅ 包发布完成${NC}"
    else
        echo -e "${RED}❌ 登录失败，请检查用户名密码${NC}"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    echo -e "${BLUE}🧪 验证部署...${NC}"
    
    # 测试服务访问
    echo "测试服务连接..."
    if curl -f http://${SERVER_IP}:4873/-/ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 注册表服务正常${NC}"
    else
        echo -e "${RED}❌ 无法访问注册表服务${NC}"
        return 1
    fi
    
    # 测试包信息
    echo "验证包信息..."
    for package in ui libs hooks cli; do
        if npm view @mystics/${package} --registry http://${SERVER_IP}:4873 > /dev/null 2>&1; then
            echo -e "${GREEN}✅ @mystics/${package} 可访问${NC}"
        else
            echo -e "${YELLOW}⚠️  @mystics/${package} 未找到${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ 部署验证完成${NC}"
}

# 生成团队使用指南
generate_team_guide() {
    echo -e "${BLUE}📚 生成团队使用指南...${NC}"
    
    cat > TEAM-ACCESS-GUIDE.md << EOF
# 团队访问指南

## 🌐 注册表信息
- **注册表地址**: http://${SERVER_IP}:4873
- **Web界面**: http://${SERVER_IP}:4873
- **管理员**: $(npm whoami --registry http://${SERVER_IP}:4873 2>/dev/null || echo "请联系管理员")

## 👥 团队成员配置

### 1. 配置全局 ~/.npmrc
\`\`\`bash
cat > ~/.npmrc << 'EOF'
registry=http://${SERVER_IP}:4873
@mystics:registry=http://${SERVER_IP}:4873
@lf:registry=http://${SERVER_IP}:4873
EOF
\`\`\`

### 2. 登录注册表
\`\`\`bash
npm login --registry=http://${SERVER_IP}:4873
\`\`\`

### 3. 安装私有包
\`\`\`bash
# 安装单个包
pnpm add @mystics/libs --registry=http://${SERVER_IP}:4873

# 安装多个包
pnpm add @mystics/ui @mystics/hooks @mystics/libs --registry=http://${SERVER_IP}:4873
\`\`\`

### 4. 验证安装
\`\`\`bash
npm view @mystics/libs --registry=http://${SERVER_IP}:4873
\`\`\`

## 📋 可用包列表
- \`@mystics/ui\` - UI 组件库
- \`@mystics/hooks\` - React Hooks
- \`@mystics/libs\` - 工具库  
- \`@mystics/cli\` - 命令行工具

## 🔧 使用示例
\`\`\`typescript
import { Button } from '@mystics/ui';
import { useToggle } from '@mystics/hooks';
import { storage, cn } from '@mystics/libs';

function App() {
  const [isOpen, toggle] = useToggle(false);
  
  return (
    <div className={cn('app', { 'open': isOpen })}>
      <Button onClick={toggle}>Toggle</Button>
    </div>
  );
}
\`\`\`

## 📞 技术支持
- 遇到问题请联系管理员
- 查看完整文档: TEAM-USAGE-GUIDE.md
EOF

    echo -e "${GREEN}✅ 团队使用指南已生成: TEAM-ACCESS-GUIDE.md${NC}"
}

# 主流程
main() {
    echo -e "${BLUE}开始远程部署流程...${NC}"
    
    get_server_info
    test_connection
    install_dependencies
    deploy_project
    configure_production
    start_service
    configure_firewall
    
    echo ""
    echo -e "${YELLOW}远程服务器部署完成！现在配置本地环境...${NC}"
    
    update_local_config
    republish_packages
    verify_deployment
    generate_team_guide
    
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📋 部署摘要:${NC}"
    echo "   🌐 注册表地址: http://${SERVER_IP}:4873"
    echo "   📱 Web界面: http://${SERVER_IP}:4873"
    echo "   📄 团队指南: TEAM-ACCESS-GUIDE.md"
    echo ""
    echo -e "${YELLOW}📤 下一步操作:${NC}"
    echo "   1. 分享注册表地址给团队成员"
    echo "   2. 为团队成员创建登录账号"
    echo "   3. 分享 TEAM-ACCESS-GUIDE.md 给团队"
    echo ""
    echo -e "${BLUE}🔧 管理命令:${NC}"
    echo "   用户管理: ./scripts/manage-users.sh"
    echo "   查看日志: ssh ${SSH_USER}@${SERVER_IP} 'docker logs mystics-registry-prod'"
    echo "   重启服务: ssh ${SSH_USER}@${SERVER_IP} 'cd /opt/mystics && docker-compose -f docker-compose.prod.yml restart'"
}

# 执行主流程
main "$@"