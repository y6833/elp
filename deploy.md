# 部署指南

## 🚀 快速部署

### 本地开发环境

1. **克隆项目**
```bash
git clone https://github.com/y6833/elp.git
cd elp
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm start
```

4. **访问应用**
打开浏览器访问 `http://localhost:3001`

### 生产环境部署

#### 使用 PM2 (推荐)

1. **安装 PM2**
```bash
npm install -g pm2
```

2. **创建 PM2 配置文件**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'frontend-engineering-playground',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80
    }
  }]
};
```

3. **启动应用**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 使用 Docker

1. **创建 Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

2. **构建和运行**
```bash
docker build -t elp .
docker run -p 3001:3001 elp
```

#### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 环境变量

创建 `.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=production

# 数据存储
DATA_DIR=./data

# 日志配置
LOG_LEVEL=info
```

## 📊 监控和维护

### 日志查看
```bash
# PM2 日志
pm2 logs

# Docker 日志
docker logs container_name
```

### 性能监控
```bash
# PM2 监控
pm2 monit

# 系统资源
htop
```

### 备份数据
```bash
# 备份用户进度数据
cp -r data/ backup/data-$(date +%Y%m%d)/
```

## 🛠️ 故障排除

### 常见问题

1. **端口被占用**
   - 修改 `PORT` 环境变量
   - 或者杀死占用端口的进程

2. **依赖安装失败**
   - 清除缓存：`npm cache clean --force`
   - 删除 node_modules 重新安装

3. **权限问题**
   - 确保有写入 data 目录的权限
   - 使用 `chmod 755 data/`

### 性能优化

1. **启用 Gzip 压缩**
2. **配置 CDN 加速静态资源**
3. **使用 Redis 缓存用户数据**
4. **配置负载均衡**

## 📈 扩展建议

1. **数据库集成**
   - 使用 MongoDB 或 PostgreSQL 存储用户数据
   - 实现用户认证系统

2. **实时功能**
   - 使用 WebSocket 实现实时协作
   - 添加在线用户统计

3. **内容管理**
   - 创建管理后台
   - 支持动态添加关卡

4. **社交功能**
   - 用户排行榜
   - 学习小组功能
   - 代码分享