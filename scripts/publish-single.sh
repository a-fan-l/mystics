#!/bin/bash

# 单包发布脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "单包发布脚本"
    echo ""
    echo "用法: $0 [包名] [注册表]"
    echo ""
    echo "包名:"
    echo "  libs        发布 @mystics/libs"
    echo "  ui          发布 @mystics/ui"
    echo "  hooks       发布 @mystics/hooks"
    echo "  cli         发布 @mystics/cli"
    echo ""
    echo "注册表 (可选):"
    echo "  local       本地注册表 (默认)"
    echo "  remote      远程注册表"
    echo "  npm         npm 公共注册表"
    echo ""
    echo "示例:"
    echo "  $0 libs                 # 发布 libs 到本地注册表"
    echo "  $0 ui remote            # 发布 ui 到远程注册表"
    echo "  $0 hooks npm            # 发布 hooks 到 npm"
}

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ 请指定要发布的包名${NC}"
    show_help
    exit 1
fi

PACKAGE=$1
REGISTRY_TYPE=${2:-local}

# 设置包路径和名称
case $PACKAGE in
    libs)
        PACKAGE_PATH="packages/libs"
        PACKAGE_NAME="@mystics/libs"
        ;;
    ui)
        PACKAGE_PATH="packages/ui"
        PACKAGE_NAME="@mystics/ui"
        ;;
    hooks)
        PACKAGE_PATH="packages/hooks"
        PACKAGE_NAME="@mystics/hooks"
        ;;
    cli)
        PACKAGE_PATH="packages/cli"
        PACKAGE_NAME="@mystics/cli"
        ;;
    *)
        echo -e "${RED}❌ 未知包名: $PACKAGE${NC}"
        show_help
        exit 1
        ;;
esac

# 设置注册表
case $REGISTRY_TYPE in
    local)
        REGISTRY="http://localhost:4873"
        ;;
    remote)
        REGISTRY="http://192.168.1.100:4873"
        ;;
    npm)
        REGISTRY="https://registry.npmjs.org"
        ;;
    *)
        echo -e "${RED}❌ 未知注册表类型: $REGISTRY_TYPE${NC}"
        show_help
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 准备发布单个包...${NC}"
echo -e "${BLUE}包名: ${YELLOW}$PACKAGE_NAME${NC}"
echo -e "${BLUE}路径: ${YELLOW}$PACKAGE_PATH${NC}"
echo -e "${BLUE}注册表: ${YELLOW}$REGISTRY${NC}"
echo ""

# 检查包路径是否存在
if [ ! -d "$PACKAGE_PATH" ]; then
    echo -e "${RED}❌ 包路径不存在: $PACKAGE_PATH${NC}"
    exit 1
fi

# 构建包
echo -e "${BLUE}🔨 构建包...${NC}"
cd "$PACKAGE_PATH"
npm run build

# 检查登录状态
if ! npm whoami --registry $REGISTRY > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  请先登录到注册表:${NC}"
    echo -e "   ${BLUE}npm adduser --registry $REGISTRY${NC}"
    exit 1
fi

current_user=$(npm whoami --registry $REGISTRY)
echo -e "  当前用户: ${GREEN}$current_user${NC}"

# 确认发布
echo -e "${YELLOW}⚠️  即将发布 $PACKAGE_NAME 到: $REGISTRY${NC}"
read -p "确认继续? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ 发布已取消${NC}"
    exit 1
fi

# 发布
echo -e "${BLUE}🚀 发布包...${NC}"
npm publish --registry $REGISTRY

echo -e "${GREEN}🎉 发布完成!${NC}"
echo -e "${BLUE}📋 包信息: ${YELLOW}$PACKAGE_NAME${NC}"
echo -e "${BLUE}📋 注册表: ${YELLOW}$REGISTRY${NC}"
