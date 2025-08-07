#!/bin/bash

# Mystics Monorepo 快速设置脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Mystics Monorepo 快速设置${NC}"
echo -e "${YELLOW}==============================${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm 未安装，正在安装...${NC}"
    npm install -g pnpm
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker 未安装，Verdaccio 私有注册表功能将不可用${NC}"
    echo -e "${BLUE}💡 请访问 https://docs.docker.com/get-docker/ 安装 Docker${NC}"
fi

# 安装依赖
echo -e "${BLUE}📦 安装项目依赖...${NC}"
pnpm install

# 构建所有包
echo -e "${BLUE}🔨 构建所有包...${NC}"
pnpm run build

# 检查构建结果
echo -e "${BLUE}🔍 验证构建结果...${NC}"
success_count=0
total_packages=4

for package in packages/*/; do
    if [ -d "$package" ]; then
        package_name=$(basename "$package")
        if [ -d "$package/dist" ]; then
            echo -e "${GREEN}✅ $package_name 构建成功${NC}"
            ((success_count++))
        else
            echo -e "${RED}❌ $package_name 构建失败${NC}"
        fi
    fi
done

echo ""
echo -e "${BLUE}📊 构建结果: ${GREEN}$success_count${NC}/${BLUE}$total_packages${NC} 包构建成功"
echo ""

if [ $success_count -eq $total_packages ]; then
    echo -e "${GREEN}🎉 项目设置完成！${NC}"
    echo ""
    echo -e "${BLUE}📋 可用命令:${NC}"
    echo -e "  ${YELLOW}pnpm run dev:ui${NC}          # 启动 Storybook 开发环境"
    echo -e "  ${YELLOW}pnpm run build${NC}           # 构建所有包"
    echo -e "  ${YELLOW}pnpm run verdaccio:start${NC} # 启动私有注册表"
    echo -e "  ${YELLOW}pnpm run publish:dry${NC}     # 预演发布"
    echo -e "  ${YELLOW}pnpm run publish${NC}         # 发布到私有注册表"
    echo ""
    echo -e "${BLUE}🌐 Web 界面:${NC}"
    echo -e "  Storybook: ${YELLOW}http://localhost:6006${NC}"
    echo -e "  Verdaccio: ${YELLOW}http://localhost:4873${NC}"
else
    echo -e "${RED}❌ 某些包构建失败，请检查错误信息${NC}"
    exit 1
fi