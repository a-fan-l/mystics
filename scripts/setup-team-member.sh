#!/bin/bash

# 团队成员配置脚本
# 帮助新团队成员快速配置开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置
DEFAULT_REGISTRY=""
REGISTRY_URL=""
MEMBER_NAME=""
MEMBER_EMAIL=""

echo -e "${BLUE}🎯 Mystics 团队成员配置脚本${NC}"
echo "=============================================="

# 获取注册表地址
get_registry_info() {
    echo -e "${YELLOW}📋 请输入注册表信息:${NC}"
    read -p "服务器IP地址或域名: " SERVER_INPUT
    
    if [[ $SERVER_INPUT =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        REGISTRY_URL="http://${SERVER_INPUT}:4873"
    elif [[ $SERVER_INPUT =~ ^https?:// ]]; then
        REGISTRY_URL="$SERVER_INPUT"
    else
        REGISTRY_URL="https://${SERVER_INPUT}"
    fi
    
    echo -e "${BLUE}注册表地址: ${REGISTRY_URL}${NC}"
}

# 获取成员信息
get_member_info() {
    echo -e "${YELLOW}👤 请输入个人信息:${NC}"
    read -p "姓名: " MEMBER_NAME
    read -p "邮箱: " MEMBER_EMAIL
    
    echo -e "${BLUE}成员信息:${NC}"
    echo "  姓名: ${MEMBER_NAME}"
    echo "  邮箱: ${MEMBER_EMAIL}"
}

# 测试注册表连接
test_registry() {
    echo -e "${BLUE}🔗 测试注册表连接...${NC}"
    
    if curl -f "${REGISTRY_URL}/-/ping" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 注册表连接成功${NC}"
    else
        echo -e "${RED}❌ 无法连接到注册表${NC}"
        echo "请检查:"
        echo "  1. 服务器地址是否正确"
        echo "  2. 网络连接是否正常"
        echo "  3. 防火墙设置"
        read -p "是否继续配置? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 配置 npm
configure_npm() {
    echo -e "${BLUE}⚙️  配置 NPM...${NC}"
    
    # 备份现有配置
    if [ -f ~/.npmrc ]; then
        cp ~/.npmrc ~/.npmrc.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${YELLOW}已备份现有 ~/.npmrc${NC}"
    fi
    
    # 创建新配置
    cat > ~/.npmrc << EOF
# Mystics 团队私有 NPM 注册表配置
registry=${REGISTRY_URL}

# 作用域包配置
@mystics:registry=${REGISTRY_URL}
@lf:registry=${REGISTRY_URL}

# 公共包回退配置
@babel:registry=https://registry.npmjs.org/
@types:registry=https://registry.npmjs.org/
@testing-library:registry=https://registry.npmjs.org/

# 其他配置
save-prefix=^
save-exact=false
package-lock=true
engine-strict=true

# 发布配置
access=public
tag-version-prefix=v

# 缓存配置
cache-min=86400

# 网络配置
fetch-retries=3
fetch-retry-factor=10
fetch-retry-mintimeout=10000
fetch-retry-maxtimeout=60000

# 用户信息
init-author-name=${MEMBER_NAME}
init-author-email=${MEMBER_EMAIL}
init-license=MIT
EOF

    echo -e "${GREEN}✅ NPM 配置完成${NC}"
}

# 配置 Git
configure_git() {
    echo -e "${BLUE}🔧 配置 Git...${NC}"
    
    if [ -n "$MEMBER_NAME" ]; then
        git config --global user.name "$MEMBER_NAME"
        echo -e "${GREEN}✅ Git 用户名设置为: $MEMBER_NAME${NC}"
    fi
    
    if [ -n "$MEMBER_EMAIL" ]; then
        git config --global user.email "$MEMBER_EMAIL"
        echo -e "${GREEN}✅ Git 邮箱设置为: $MEMBER_EMAIL${NC}"
    fi
}

# 登录注册表
login_registry() {
    echo -e "${BLUE}🔐 登录到注册表...${NC}"
    echo -e "${YELLOW}请输入您的账号信息 (如果没有账号，系统会提示创建)${NC}"
    
    npm adduser --registry ${REGISTRY_URL}
    
    # 验证登录
    if npm whoami --registry ${REGISTRY_URL} > /dev/null 2>&1; then
        USERNAME=$(npm whoami --registry ${REGISTRY_URL})
        echo -e "${GREEN}✅ 登录成功，用户名: ${USERNAME}${NC}"
    else
        echo -e "${RED}❌ 登录失败${NC}"
        return 1
    fi
}

# 验证配置
verify_setup() {
    echo -e "${BLUE}🧪 验证配置...${NC}"
    
    # 检查注册表配置
    CURRENT_REGISTRY=$(npm config get registry)
    if [ "$CURRENT_REGISTRY" = "$REGISTRY_URL" ]; then
        echo -e "${GREEN}✅ 注册表配置正确${NC}"
    else
        echo -e "${RED}❌ 注册表配置不正确${NC}"
        return 1
    fi
    
    # 检查登录状态
    if npm whoami --registry ${REGISTRY_URL} > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 已登录注册表${NC}"
    else
        echo -e "${RED}❌ 未登录注册表${NC}"
        return 1
    fi
    
    # 测试包访问
    echo "测试包访问..."
    for package in ui libs hooks cli; do
        if npm view @mystics/${package} --registry ${REGISTRY_URL} > /dev/null 2>&1; then
            echo -e "${GREEN}✅ @mystics/${package} 可访问${NC}"
        else
            echo -e "${YELLOW}⚠️  @mystics/${package} 未找到 (可能尚未发布)${NC}"
        fi
    done
}

# 创建使用指南
create_usage_guide() {
    echo -e "${BLUE}📚 创建个人使用指南...${NC}"
    
    cat > ~/mystics-team-guide.md << EOF
# Mystics 团队使用指南

## 🔧 已配置信息
- **注册表**: ${REGISTRY_URL}
- **用户名**: $(npm whoami --registry ${REGISTRY_URL} 2>/dev/null || echo "请先登录")
- **配置时间**: $(date)

## 📦 安装私有包

\`\`\`bash
# 安装单个包
pnpm add @mystics/libs

# 安装多个包
pnpm add @mystics/ui @mystics/hooks @mystics/libs

# 指定版本
pnpm add @mystics/ui@latest
\`\`\`

## 🔍 常用命令

\`\`\`bash
# 查看当前用户
npm whoami --registry ${REGISTRY_URL}

# 查看包信息
npm view @mystics/libs --registry ${REGISTRY_URL}

# 搜索包
npm search mystics --registry ${REGISTRY_URL}

# 清理缓存
npm cache clean --force
\`\`\`

## 🚀 使用示例

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
- 注册表地址: ${REGISTRY_URL}
- Web界面: ${REGISTRY_URL}
EOF

    echo -e "${GREEN}✅ 使用指南已保存到: ~/mystics-team-guide.md${NC}"
}

# 安装开发工具
install_dev_tools() {
    echo -e "${BLUE}🛠️  安装开发工具...${NC}"
    
    # 检查并安装 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "安装 pnpm..."
        npm install -g pnpm
        echo -e "${GREEN}✅ pnpm 安装完成${NC}"
    else
        echo -e "${GREEN}✅ pnpm 已安装${NC}"
    fi
    
    # 检查并安装 lerna
    if ! command -v lerna &> /dev/null; then
        echo "安装 lerna..."
        npm install -g lerna
        echo -e "${GREEN}✅ lerna 安装完成${NC}"
    else
        echo -e "${GREEN}✅ lerna 已安装${NC}"
    fi
}

# 主流程
main() {
    echo -e "${BLUE}开始团队成员配置...${NC}"
    
    get_registry_info
    get_member_info
    test_registry
    configure_npm
    configure_git
    install_dev_tools
    login_registry
    verify_setup
    create_usage_guide
    
    echo ""
    echo -e "${GREEN}🎉 配置完成！${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📋 配置摘要:${NC}"
    echo "   🌐 注册表: ${REGISTRY_URL}"
    echo "   👤 用户: $(npm whoami --registry ${REGISTRY_URL} 2>/dev/null || echo '请重新登录')"
    echo "   📄 指南: ~/mystics-team-guide.md"
    echo ""
    echo -e "${YELLOW}🚀 下一步:${NC}"
    echo "   1. 阅读使用指南: cat ~/mystics-team-guide.md"
    echo "   2. 安装第一个包: pnpm add @mystics/libs"
    echo "   3. 查看包文档: ${REGISTRY_URL}"
    echo ""
    echo -e "${BLUE}💡 提示:${NC}"
    echo "   如需帮助，请联系团队管理员"
}

# 执行主流程
main "$@"