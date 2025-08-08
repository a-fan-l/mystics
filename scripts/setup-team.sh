#!/bin/bash

# Mystics 团队私仓设置脚本
# 用于快速配置团队开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Mystics 团队私仓设置向导${NC}"
echo "=================================================="

# 检查必要工具
check_dependencies() {
    echo -e "${BLUE}📋 检查依赖工具...${NC}"
    
    for cmd in docker docker-compose node npm pnpm; do
        if ! command -v $cmd &> /dev/null; then
            echo -e "${RED}❌ $cmd 未安装${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ $cmd 已安装${NC}"
        fi
    done
}

# 配置选择
setup_mode() {
    echo ""
    echo -e "${YELLOW}请选择设置模式:${NC}"
    echo "1) 🏢 服务器部署 (生产环境)"
    echo "2) 💻 本地开发 (开发环境)" 
    echo "3) 👥 团队成员 (使用现有私仓)"
    echo ""
    
    read -p "请输入选择 (1-3): " mode
    
    case $mode in
        1) setup_server ;;
        2) setup_local_dev ;;
        3) setup_team_member ;;
        *) echo -e "${RED}❌ 无效选择${NC}"; exit 1 ;;
    esac
}

# 服务器部署设置
setup_server() {
    echo -e "${BLUE}🏢 服务器部署设置${NC}"
    
    # 获取服务器信息
    read -p "输入服务器域名 (例: registry.company.com): " domain
    read -p "输入服务器IP: " server_ip
    read -p "是否配置 HTTPS? (y/n): " use_https
    
    # 创建生产配置
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
      - VERDACCIO_PUBLIC_URL=https://${domain}
    volumes:
      - "./verdaccio-config.yaml:/verdaccio/conf/config.yaml"
      - "verdaccio_storage:/verdaccio/storage"
      - "./ssl:/verdaccio/ssl"
    networks:
      - registry_network

volumes:
  verdaccio_storage:
    driver: local

networks:
  registry_network:
    driver: bridge
EOF

    # 配置 Nginx
    if [ "$use_https" = "y" ]; then
        cat > nginx.conf << EOF
server {
    listen 80;
    server_name ${domain};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${domain};
    
    ssl_certificate /etc/ssl/certs/registry.crt;
    ssl_certificate_key /etc/ssl/private/registry.key;
    
    location / {
        proxy_pass http://localhost:4873;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 上传大小限制
        client_max_body_size 100M;
    }
}
EOF
        echo -e "${GREEN}✅ Nginx 配置已生成: nginx.conf${NC}"
        echo -e "${YELLOW}⚠️  请配置 SSL 证书${NC}"
    fi
    
    # 启动服务
    echo -e "${BLUE}🚀 启动生产服务...${NC}"
    docker-compose -f docker-compose.prod.yml up -d
    
    echo -e "${GREEN}✅ 服务器部署完成!${NC}"
    echo -e "${YELLOW}📋 后续步骤:${NC}"
    echo "   1. 配置域名解析: ${domain} -> ${server_ip}"
    echo "   2. 配置防火墙规则"
    echo "   3. 设置 SSL 证书 (如果启用)"
    echo "   4. 创建团队用户账号"
}

# 本地开发设置
setup_local_dev() {
    echo -e "${BLUE}💻 本地开发环境设置${NC}"
    
    # 安装依赖
    echo -e "${BLUE}📦 安装依赖...${NC}"
    pnpm install
    
    # 启动本地注册表
    echo -e "${BLUE}🚀 启动本地注册表...${NC}"
    pnpm run verdaccio:start
    
    # 等待服务启动
    sleep 5
    
    # 创建开发用户
    echo -e "${BLUE}👤 创建开发用户...${NC}"
    read -p "输入用户名: " username
    read -s -p "输入密码: " password
    echo ""
    
    # 注册用户
    npm adduser --registry http://localhost:4873 << EOF
${username}
${password}
${username}@localhost
EOF
    
    # 配置本地 .npmrc
    cat > .npmrc.local << EOF
registry=http://localhost:4873
@mystics:registry=http://localhost:4873
EOF
    
    echo -e "${GREEN}✅ 本地开发环境设置完成!${NC}"
    echo -e "${YELLOW}📋 使用说明:${NC}"
    echo "   1. 复制 .npmrc.local 到你的项目目录"
    echo "   2. 运行 'pnpm run build' 构建包"
    echo "   3. 运行 'pnpm run publish' 发布到本地注册表"
    echo "   4. 访问 http://localhost:4873 查看 Web 界面"
}

# 团队成员设置
setup_team_member() {
    echo -e "${BLUE}👥 团队成员环境设置${NC}"
    
    # 获取注册表地址
    read -p "输入私有注册表地址 (例: https://registry.company.com): " registry_url
    
    # 配置全局注册表
    echo -e "${BLUE}⚙️  配置注册表...${NC}"
    npm config set registry $registry_url
    npm config set @mystics:registry $registry_url
    
    # 登录
    echo -e "${BLUE}🔐 登录注册表...${NC}"
    npm adduser --registry $registry_url
    
    # 验证登录
    if npm whoami --registry $registry_url > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 登录成功!${NC}"
        current_user=$(npm whoami --registry $registry_url)
        echo -e "${GREEN}当前用户: $current_user${NC}"
    else
        echo -e "${RED}❌ 登录失败${NC}"
        exit 1
    fi
    
    # 创建项目 .npmrc 模板
    cat > .npmrc.template << EOF
# 团队私有注册表配置
registry=${registry_url}
@mystics:registry=${registry_url}

# 公共包仍使用官方注册表
@babel:registry=https://registry.npmjs.org/
@types:registry=https://registry.npmjs.org/
EOF
    
    # 测试安装
    echo -e "${BLUE}🧪 测试安装私有包...${NC}"
    npm info @mystics/ui --registry $registry_url
    
    echo -e "${GREEN}✅ 团队成员环境设置完成!${NC}"
    echo -e "${YELLOW}📋 使用说明:${NC}"
    echo "   1. 复制 .npmrc.template 到你的项目根目录并重命名为 .npmrc"
    echo "   2. 运行 'npm install @mystics/ui @mystics/hooks @mystics/libs' 安装包"
    echo "   3. 查看使用文档: TEAM-USAGE-GUIDE.md"
}

# 创建用户管理脚本
create_user_management() {
    cat > scripts/manage-users.sh << 'EOF'
#!/bin/bash

# 用户管理脚本

CONTAINER_NAME="mystics-registry"

add_user() {
    echo "添加新用户"
    read -p "用户名: " username
    read -s -p "密码: " password
    echo ""
    
    # 使用 htpasswd 添加用户
    docker exec $CONTAINER_NAME htpasswd -bc /verdaccio/storage/htpasswd $username $password
    echo "✅ 用户 $username 已添加"
}

list_users() {
    echo "📋 当前用户列表:"
    docker exec $CONTAINER_NAME cat /verdaccio/storage/htpasswd | cut -d: -f1
}

remove_user() {
    read -p "要删除的用户名: " username
    docker exec $CONTAINER_NAME htpasswd -D /verdaccio/storage/htpasswd $username
    echo "✅ 用户 $username 已删除"
}

case $1 in
    add) add_user ;;
    list) list_users ;;
    remove) remove_user ;;
    *) 
        echo "用法: $0 {add|list|remove}"
        echo "  add    - 添加用户"
        echo "  list   - 列出用户"
        echo "  remove - 删除用户"
        ;;
esac
EOF

    chmod +x scripts/manage-users.sh
    echo -e "${GREEN}✅ 用户管理脚本已创建: scripts/manage-users.sh${NC}"
}

# 主流程
main() {
    check_dependencies
    setup_mode
    create_user_management
    
    echo ""
    echo -e "${GREEN}🎉 设置完成!${NC}"
    echo -e "${BLUE}📚 相关文档:${NC}"
    echo "   - 团队使用指南: TEAM-USAGE-GUIDE.md"
    echo "   - 部署指南: TEAM-DEPLOYMENT.md"
    echo "   - 用户管理: scripts/manage-users.sh"
    echo ""
    echo -e "${YELLOW}💡 需要帮助?${NC}"
    echo "   - 查看 README.md"
    echo "   - 提交 GitHub Issues"
}

# 执行主流程
main "$@"