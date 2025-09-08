# 🚀 NEXUS IDE Deployment Guide

## 📋 Overview

คู่มือนี้จะแนะนำการติดตั้งและใช้งาน NEXUS IDE ในระบบหลัก รวมถึงการตั้งค่าและการจัดการระบบ

## 🎯 Prerequisites

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+)
- **Node.js**: Version 16.0.0 หรือสูงกว่า
- **Memory**: อย่างน้อย 4GB RAM (แนะนำ 8GB+)
- **Storage**: อย่างน้อย 2GB พื้นที่ว่าง
- **Network**: Internet connection สำหรับ AI services

### Required Software

```bash
# ตรวจสอบ Node.js version
node --version  # ต้อง >= 16.0.0
npm --version   # ต้อง >= 7.0.0

# ติดตั้ง Git (ถ้ายังไม่มี)
git --version
```

## 📦 Installation

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/nexus-ide/git-memory-mcp-server.git
cd git-memory-mcp-server

# หรือ download และแตกไฟล์
# จากนั้นเข้าไปในโฟลเดอร์
```

### 2. Install Dependencies

```bash
# ติดตั้ง dependencies
npm install

# หรือใช้ yarn
yarn install

# ตรวจสอบการติดตั้ง
npm list --depth=0
```

### 3. Build Project

```bash
# Build TypeScript files
npm run build

# ตรวจสอบ build
ls -la dist/
```

### 4. Setup Environment

```bash
# สร้าง environment file
cp .env.example .env

# แก้ไขการตั้งค่า
nano .env  # หรือใช้ editor อื่น
```

#### Environment Variables

```bash
# .env file
NODE_ENV=development
PORT=3000
WS_PORT=3001
DEBUG=nexus:*

# AI Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security (optional)
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Database (optional)
DATABASE_URL=sqlite:./data/nexus.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/nexus-ide.log
```

## 🚀 Quick Start

### Method 1: One-Command Start (Recommended)

```bash
# เริ่มต้นระบบทั้งหมดด้วยคำสั่งเดียว
npm run nexus:start

# หรือในโหมด debug
npm run nexus:start:debug

# หรือในโหมด production
npm run nexus:start:prod
```

### Method 2: Manual Start (Advanced)

```bash
# Terminal 1: AI Memory Proxy
node src/ai/memory-proxy.js

# Terminal 2: Git Memory Sharing
node src/services/git-memory-sharing.js

# Terminal 3: API Gateway
node src/api-gateway/gateway.js

# Terminal 4: MCP Server
node nexus-mcp-server.js
```

### Method 3: Individual Services

```bash
# เริ่มต้นแต่ละ service แยกกัน
npm run nexus:init     # NEXUS IDE Integration
npm run nexus:mcp      # MCP Server
npm run nexus:demo     # Demo Mode
```

## 🔧 Configuration

### 1. Basic Configuration

```bash
# แก้ไขไฟล์ configuration
nano nexus-config.json
```

#### Key Configuration Options

```json
{
  "nexus": {
    "api": {
      "port": 3000,
      "cors": { "enabled": true }
    },
    "websocket": {
      "port": 3001,
      "compression": true
    },
    "ai": {
      "providers": {
        "openai": { "enabled": true },
        "anthropic": { "enabled": true }
      }
    }
  }
}
```

### 2. Advanced Configuration

#### Performance Tuning

```json
{
  "performance": {
    "caching": {
      "enabled": true,
      "maxSize": "500MB"
    },
    "scaling": {
      "enabled": true,
      "maxInstances": 5
    }
  }
}
```

#### Security Settings

```json
{
  "security": {
    "authentication": {
      "enabled": true,
      "type": "jwt"
    },
    "rateLimit": {
      "enabled": true,
      "max": 1000
    }
  }
}
```

## 🌐 Access Points

หลังจากเริ่มต้นระบบแล้ว คุณสามารถเข้าถึงได้ที่:

- **API Gateway**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Documentation**: http://localhost:3000/api/docs
- **WebSocket**: ws://localhost:3001
- **Admin Panel**: http://localhost:3000/admin (ถ้าเปิดใช้งาน)

## 🔍 Verification

### 1. Health Check

```bash
# ตรวจสอบสถานะระบบ
curl http://localhost:3000/health

# หรือใช้ npm script
npm run nexus:status
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-07T00:00:00.000Z",
  "uptime": 12345,
  "services": {
    "aiMemoryProxy": "running",
    "gitMemorySharing": "running",
    "apiGateway": "running",
    "mcpServer": "running"
  }
}
```

### 2. API Test

```bash
# ทดสอบ API
curl http://localhost:3000/api/info

# ทดสอบ Memory API
curl -X POST http://localhost:3000/api/memory \
  -H "Content-Type: application/json" \
  -d '{"key": "test", "value": "hello world"}'

# ทดสอบ Sharing API
curl http://localhost:3000/api/shares
```

### 3. WebSocket Test

```javascript
// ทดสอบ WebSocket connection
const io = require('socket.io-client');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to NEXUS IDE WebSocket');
  socket.emit('test', { message: 'Hello NEXUS!' });
});

socket.on('test-response', (data) => {
  console.log('Received:', data);
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# ค้นหา process ที่ใช้ port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# หยุด process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux

# หรือเปลี่ยน port
node start-nexus-ide.js --port 8080
```

#### 2. Memory Issues

```bash
# เพิ่ม memory limit
node --max-old-space-size=4096 start-nexus-ide.js

# หรือตั้งค่าใน environment
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### 3. Permission Issues

```bash
# Linux/macOS: ให้สิทธิ์ execute
chmod +x start-nexus-ide.js
chmod +x nexus-ide-integration.js

# Windows: รันใน Administrator mode
```

#### 4. Dependencies Issues

```bash
# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install

# หรือใช้ npm ci สำหรับ clean install
npm ci
```

### Debug Mode

```bash
# เปิด debug mode
DEBUG=nexus:* npm run nexus:start

# หรือ
npm run nexus:start:debug

# ดู logs แบบ real-time
tail -f logs/nexus-ide.log
```

### Log Analysis

```bash
# ดู error logs
grep "ERROR" logs/nexus-ide.log

# ดู performance metrics
grep "PERF" logs/nexus-ide.log

# ดู API requests
grep "API" logs/nexus-ide.log
```

## 🔄 Updates

### 1. Update System

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Rebuild
npm run build

# Restart system
npm run nexus:start
```

### 2. Configuration Updates

```bash
# Backup current config
cp nexus-config.json nexus-config.json.backup

# Update config
nano nexus-config.json

# Validate config
npm run nexus:config

# Restart to apply changes
```

## 🚀 Production Deployment

### 1. Production Setup

```bash
# Set production environment
export NODE_ENV=production

# Use production config
cp nexus-config.production.json nexus-config.json

# Start in production mode
npm run nexus:start:prod
```

### 2. Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'nexus-ide',
    script: 'start-nexus-ide.js',
    args: '--production',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs nexus-ide
```

### 3. Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/nexus-ide
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL/HTTPS Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring

### 1. System Monitoring

```bash
# CPU and Memory usage
top -p $(pgrep -f "nexus-ide")

# Disk usage
df -h

# Network connections
netstat -tulpn | grep :3000
```

### 2. Application Monitoring

```bash
# Health check script
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "NEXUS IDE is healthy"
else
    echo "NEXUS IDE is unhealthy (HTTP $RESPONSE)"
    # Send alert or restart service
fi
```

### 3. Log Monitoring

```bash
# Setup log rotation
sudo nano /etc/logrotate.d/nexus-ide

# Content:
/path/to/nexus-ide/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
```

## 🔒 Security

### 1. Firewall Setup

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### 2. Security Headers

```javascript
// Add to nexus-config.json
{
  "security": {
    "headers": {
      "contentSecurityPolicy": true,
      "hsts": true,
      "noSniff": true,
      "xssFilter": true
    }
  }
}
```

### 3. Rate Limiting

```javascript
{
  "rateLimit": {
    "enabled": true,
    "windowMs": 900000,  // 15 minutes
    "max": 100,          // limit each IP to 100 requests per windowMs
    "message": "Too many requests from this IP"
  }
}
```

## 📚 Additional Resources

- [API Documentation](./docs/api-reference.md)
- [MCP Tools Guide](./docs/mcp-tools.md)
- [Configuration Reference](./docs/configuration.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)
- [Performance Tuning](./docs/performance.md)
- [Security Best Practices](./docs/security.md)

## 🆘 Support

- **Documentation**: https://docs.nexus-ide.com
- **Issues**: https://github.com/nexus-ide/git-memory-mcp-server/issues
- **Discussions**: https://github.com/nexus-ide/git-memory-mcp-server/discussions
- **Email**: support@nexus-ide.com
- **Discord**: https://discord.gg/nexus-ide

---

**🚀 Happy coding with NEXUS IDE!**