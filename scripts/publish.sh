#!/bin/bash

# Mystics Monorepo 发布脚本

set -e

echo "🚀 开始构建和发布 Mystics 包..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -r, --registry URL  指定 npm 注册表 URL (默认: http://localhost:4873)"
    echo "  -d, --dry-run       预演模式，不实际发布"
    echo "  -v, --verbose       详细输出"
    echo "  --skip-build        跳过构建步骤"
    echo "  --skip-clean        跳过清理步骤"
    echo ""
    echo "示例:"
    echo "  $0                                    # 发布到本地注册表"
    echo "  $0 -r https://npm.example.com        # 发布到指定注册表"
    echo "  $0 -d                                 # 预演模式"
}

# 默认参数
REGISTRY="http://localhost:4873"
DRY_RUN=false
VERBOSE=false
SKIP_BUILD=false
SKIP_CLEAN=false

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-clean)
            SKIP_CLEAN=true
            shift
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}配置信息:${NC}"
echo -e "  注册表: ${YELLOW}$REGISTRY${NC}"
echo -e "  预演模式: ${YELLOW}$DRY_RUN${NC}"
echo -e "  详细输出: ${YELLOW}$VERBOSE${NC}"
echo ""

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm 未安装，请先安装 pnpm${NC}"
    exit 1
fi

# 检查 lerna 是否安装
if ! command -v lerna &> /dev/null; then
    echo -e "${RED}❌ lerna 未安装，请先安装 lerna${NC}"
    exit 1
fi

# 清理之前的构建
if [ "$SKIP_CLEAN" = false ]; then
    echo -e "${BLUE}🧹 清理之前的构建...${NC}"
    pnpm run clean
else
    echo -e "${YELLOW}⏭️  跳过清理步骤${NC}"
fi

# 安装依赖
echo -e "${BLUE}📦 安装依赖...${NC}"
pnpm install

# 构建所有包
if [ "$SKIP_BUILD" = false ]; then
    echo -e "${BLUE}🔨 构建所有包...${NC}"
    pnpm run build
else
    echo -e "${YELLOW}⏭️  跳过构建步骤${NC}"
fi

# 检查构建结果
echo -e "${BLUE}🔍 检查构建结果...${NC}"
for package in packages/*/; do
    if [ -d "$package" ]; then
        package_name=$(basename "$package")
        if [ ! -d "$package/dist" ]; then
            echo -e "${RED}❌ $package_name 构建失败，dist 目录不存在${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ $package_name 构建成功${NC}"
        fi
    fi
done

# 设置注册表
echo -e "${BLUE}⚙️  配置注册表...${NC}"
npm config set registry $REGISTRY

# 检查是否已登录
if ! npm whoami --registry $REGISTRY > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  请先登录到注册表:${NC}"
    echo -e "   ${BLUE}npm adduser --registry $REGISTRY${NC}"
    read -p "登录完成后按 Enter 继续..."
fi

# 发布前检查
echo -e "${BLUE}🔍 发布前检查...${NC}"
current_user=$(npm whoami --registry $REGISTRY)
echo -e "  当前用户: ${GREEN}$current_user${NC}"

# 如果是预演模式
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🎭 预演模式 - 不会实际发布${NC}"
    lerna version --no-push --no-git-tag-version --yes
    lerna publish from-package --registry $REGISTRY --dry-run
else
    # 确认发布
    echo -e "${YELLOW}⚠️  即将发布所有包到注册表: $REGISTRY${NC}"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ 发布已取消${NC}"
        exit 1
    fi

    # 版本管理和发布
    echo -e "${BLUE}📋 管理版本...${NC}"
    lerna version --conventional-commits --yes

    echo -e "${BLUE}🚀 发布包...${NC}"
    lerna publish from-git --registry $REGISTRY --yes
fi

echo -e "${GREEN}🎉 发布完成!${NC}"
echo -e "${BLUE}📋 查看已发布的包:${NC}"
echo -e "   ${YELLOW}$REGISTRY/-/web/detail/@mystics/ui${NC}"
echo -e "   ${YELLOW}$REGISTRY/-/web/detail/@mystics/hooks${NC}"
echo -e "   ${YELLOW}$REGISTRY/-/web/detail/@mystics/libs${NC}"
echo -e "   ${YELLOW}$REGISTRY/-/web/detail/@mystics/cli${NC}"