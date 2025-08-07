#!/bin/bash

# Verdaccio 私有 npm 注册表部署脚本

echo "🚀 开始部署 Verdaccio 私有 npm 注册表..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建必要的目录
mkdir -p storage
mkdir -p plugins

# 启动 Verdaccio 服务
echo "📦 启动 Verdaccio 容器..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待 Verdaccio 服务启动..."
sleep 10

# 检查服务状态
if curl -f http://localhost:4873 > /dev/null 2>&1; then
    echo "✅ Verdaccio 服务启动成功!"
    echo "🌐 Web界面: http://localhost:4873"
    echo "📋 注册表地址: http://localhost:4873"
    echo ""
    echo "💡 使用说明:"
    echo "   1. 注册用户: npm adduser --registry http://localhost:4873"
    echo "   2. 设置注册表: npm config set registry http://localhost:4873"
    echo "   3. 发布包: npm publish --registry http://localhost:4873"
else
    echo "❌ Verdaccio 服务启动失败"
    docker-compose logs verdaccio
    exit 1
fi