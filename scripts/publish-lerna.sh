#!/bin/bash

# Lerna 多环境发布脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "Lerna 多环境发布脚本"
    echo ""
    echo "用法: $0 [环境] [选项]"
    echo ""
    echo "环境:"
    echo "  local       发布到本地注册表 (http://localhost:4873)"
    echo "  remote      发布到远程注册表 (http://192.168.1.100:4873)"
    echo "  npm         发布到 npm 公共注册表"
    echo ""
    echo "选项:"
    echo "  -d, --dry-run       预演模式，不实际发布"
    echo "  --skip-version      跳过版本管理，直接发布"
    echo "  --from-package      从 package.json 版本发布"
    echo "  -h, --help          显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 local                    # 发布到本地注册表"
    echo "  $0 remote --dry-run         # 预演发布到远程注册表"
    echo "  $0 npm --from-package       # 从现有版本发布到 npm"
}

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ 请指定发布环境${NC}"
    show_help
    exit 1
fi

ENVIRONMENT=$1
shift

# 默认参数
DRY_RUN=false
SKIP_VERSION=false
FROM_PACKAGE=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-version)
            SKIP_VERSION=true
            shift
            ;;
        --from-package)
            FROM_PACKAGE=true
            shift
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 设置环境配置
case $ENVIRONMENT in
    local)
        REGISTRY="http://localhost:4873"
        CONFIG_FILE="lerna-local.json"
        ENV_NAME="本地"
        ;;
    remote)
        REGISTRY="http://192.168.1.100:4873"
        CONFIG_FILE="lerna-remote.json"
        ENV_NAME="远程"
        ;;
    npm)
        REGISTRY="https://registry.npmjs.org"
        CONFIG_FILE="lerna.json"
        ENV_NAME="NPM 公共"
        ;;
    *)
        echo -e "${RED}❌ 未知环境: $ENVIRONMENT${NC}"
        show_help
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 开始发布到 ${ENV_NAME} 注册表...${NC}"
echo -e "${BLUE}配置信息:${NC}"
echo -e "  环境: ${YELLOW}$ENV_NAME${NC}"
echo -e "  注册表: ${YELLOW}$REGISTRY${NC}"
echo -e "  配置文件: ${YELLOW}$CONFIG_FILE${NC}"
echo -e "  预演模式: ${YELLOW}$DRY_RUN${NC}"
echo ""

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${RED}❌ 配置文件 $CONFIG_FILE 不存在${NC}"
    exit 1
fi

# 构建包
echo -e "${BLUE}🔨 构建所有包...${NC}"
pnpm run build

# 设置注册表
echo -e "${BLUE}⚙️  配置注册表...${NC}"
npm config set registry $REGISTRY

# 检查登录状态
if ! npm whoami --registry $REGISTRY > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  请先登录到注册表:${NC}"
    echo -e "   ${BLUE}npm adduser --registry $REGISTRY${NC}"
    exit 1
fi

current_user=$(npm whoami --registry $REGISTRY)
echo -e "  当前用户: ${GREEN}$current_user${NC}"

# 发布逻辑
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🎭 预演模式 - 不会实际发布${NC}"
    if [ "$FROM_PACKAGE" = true ]; then
        LERNA_CONFIG=$CONFIG_FILE lerna publish from-package --registry $REGISTRY --dry-run
    else
        LERNA_CONFIG=$CONFIG_FILE lerna publish --registry $REGISTRY --dry-run
    fi
else
    echo -e "${YELLOW}⚠️  即将发布所有包到: $REGISTRY${NC}"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ 发布已取消${NC}"
        exit 1
    fi

    if [ "$FROM_PACKAGE" = true ]; then
        echo -e "${BLUE}🚀 从 package.json 版本发布...${NC}"
        LERNA_CONFIG=$CONFIG_FILE lerna publish from-package --registry $REGISTRY --yes
    elif [ "$SKIP_VERSION" = true ]; then
        echo -e "${BLUE}🚀 跳过版本管理，直接发布...${NC}"
        LERNA_CONFIG=$CONFIG_FILE lerna publish from-git --registry $REGISTRY --yes
    else
        echo -e "${BLUE}📋 管理版本并发布...${NC}"
        LERNA_CONFIG=$CONFIG_FILE lerna publish --registry $REGISTRY --yes
    fi
fi

echo -e "${GREEN}🎉 发布完成!${NC}"
echo -e "${BLUE}📋 注册表地址: ${YELLOW}$REGISTRY${NC}"
