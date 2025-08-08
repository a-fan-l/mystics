# 团队私仓部署指南

## 🚀 部署选项

### 选项一：云服务器部署 (推荐)

```bash
# 1. 在云服务器上克隆项目
git clone https://github.com/a-fan-l/mystics.git
cd mystics

# 2. 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. 启动私有注册表
pnpm run verdaccio:start

# 4. 配置反向代理 (Nginx)
# 见下方 Nginx 配置
```

### 选项二：内网服务器部署

```bash
# 适用于企业内网环境
# 配置内网 DNS 解析
# 例如：registry.company.com -> 内网IP
```

### 选项三：Docker Swarm 集群

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  verdaccio:
    image: verdaccio/verdaccio:5
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
    ports:
      - "4873:4873"
    volumes:
      - verdaccio_storage:/verdaccio/storage
    networks:
      - registry_network

volumes:
  verdaccio_storage:
    driver: local

networks:
  registry_network:
    external: true
```

## 🔒 安全配置

### 1. HTTPS 配置

```nginx
# /etc/nginx/sites-available/registry
server {
    listen 443 ssl;
    server_name registry.yourcompany.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:4873;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 防火墙配置

```bash
# Ubuntu/Debian
ufw allow 22/tcp    # SSH
ufw allow 443/tcp   # HTTPS
ufw allow 80/tcp    # HTTP (重定向到HTTPS)
ufw deny 4873/tcp   # 禁止直接访问
ufw enable
```

## 👥 用户管理

### 1. 预创建团队用户

```bash
# 创建用户脚本
#!/bin/bash
USERS=(
    "developer1:password1"
    "developer2:password2" 
    "frontend-team:team-pass"
    "backend-team:team-pass"
)

for user_info in "${USERS[@]}"; do
    username=$(echo $user_info | cut -d: -f1)
    password=$(echo $user_info | cut -d: -f2)
    
    # 使用 htpasswd 创建用户
    docker exec mystics-registry htpasswd -bc /verdaccio/storage/htpasswd $username $password
done
```

### 2. 团队权限配置

```yaml
# verdaccio-config.yaml 权限配置
packages:
  '@mystics/*':
    access: frontend-team backend-team developer1 developer2
    publish: frontend-team backend-team
    unpublish: developer1
    
  '@frontend/*':
    access: frontend-team developer1
    publish: frontend-team
    
  '@backend/*':
    access: backend-team developer2
    publish: backend-team
```

## 🔄 CI/CD 集成

### GitHub Actions 示例

```yaml
# .github/workflows/publish.yml
name: Publish to Private Registry

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Build packages
        run: pnpm run build
        
      - name: Setup NPM registry
        run: |
          echo "registry=https://registry.yourcompany.com" >> .npmrc
          echo "//registry.yourcompany.com/:_authToken=${{ secrets.NPM_TOKEN }}" >> .npmrc
          
      - name: Publish packages
        run: pnpm run publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📊 监控和日志

### 1. 日志配置

```yaml
# docker-compose.yml 添加日志配置
services:
  verdaccio:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 2. 监控脚本

```bash
#!/bin/bash
# health-check.sh
curl -f http://localhost:4873/-/ping || exit 1
```

## 🚦 性能优化

### 1. 缓存配置

```yaml
# verdaccio-config.yaml
web:
  enable: true
  title: "Company Private Registry"
  
# 配置缓存策略
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    cache: true
    timeout: 30s
    max_fails: 2
    fail_timeout: 5m
```

### 2. 存储优化

```bash
# 定期清理脚本
#!/bin/bash
# cleanup.sh
docker exec mystics-registry npm cache clean --force
docker system prune -f
```