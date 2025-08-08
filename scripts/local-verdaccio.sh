#!/bin/bash

# 本地 Verdaccio 私有 npm 注册表启动脚本

echo "🚀 开始启动本地 Verdaccio 私有 npm 注册表..."

# 检查 verdaccio 是否已安装
if ! command -v verdaccio &> /dev/null; then
    echo "❌ Verdaccio 未安装，请先安装："
    echo "   pnpm add -g verdaccio"
    exit 1
fi

# 创建必要的目录
mkdir -p storage
mkdir -p plugins

# 设置配置文件路径
CONFIG_PATH="./verdaccio-config.yaml"

# 检查配置文件是否存在
if [ ! -f "$CONFIG_PATH" ]; then
    echo "❌ 配置文件 $CONFIG_PATH 不存在"
    exit 1
fi

echo "📦 启动 Verdaccio 服务..."
echo "📋 配置文件: $CONFIG_PATH"
echo "🌐 服务地址: http://localhost:4873"
echo ""
echo "💡 使用说明:"
echo "   1. 注册用户: npm adduser --registry http://localhost:4873"
echo "   2. 设置注册表: npm config set registry http://localhost:4873"
echo "   3. 发布包: npm publish --registry http://localhost:4873"
echo "   4. 停止服务: Ctrl+C"
echo ""
echo "✅ Verdaccio 正在启动，请保持此终端窗口打开..."

# 启动 verdaccio
verdaccio --config "$CONFIG_PATH"
