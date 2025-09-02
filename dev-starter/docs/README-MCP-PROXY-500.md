# MCP Proxy Server 500

🚀 **Advanced MCP Proxy Server** ที่รองรับการเชื่อมต่อกับ **MCP Servers ภายนอกได้ถึง 500 ตัว** พร้อมระบบ Load Balancing, Health Monitoring และ Auto-reconnection

## ✨ Features

### 🔗 External MCP Server Connectivity
- รองรับการเชื่อมต่อกับ MCP Servers ภายนอกได้ถึง **500 ตัว**
- รองรับทั้ง **HTTP** และ **WebSocket** protocols
- **Dynamic Server Discovery** จาก registries และ endpoints
- **Auto-registration** สำหรับ MCP servers ใหม่

### ⚖️ Load Balancing & Performance
- **Multiple Load Balancing Strategies**: Round Robin, Least Connections, Weighted, Health-based
- **Connection Pooling** เพื่อประสิทธิภาพสูงสุด
- **Request Caching** ด้วย TTL-based cache
- **Performance Metrics** แบบ real-time

### 🏥 Health Monitoring
- **Automatic Health Checks** ทุก 30 วินาที
- **Server Status Tracking** (active, inactive, error)
- **Auto-reconnection** เมื่อ server กลับมาออนไลน์
- **Failover Support** เมื่อ server ล้มเหลว

### 📊 Monitoring & Analytics
- **Real-time Dashboard** ที่ `/dashboard`
- **Metrics API** ที่ `/metrics`
- **Health Check API** ที่ `/health`
- **Detailed Logging** ด้วย Winston

### 🔒 Security & Compliance
- **CORS Support** สำหรับ cross-origin requests
- **Helmet.js** สำหรับ security headers
- **Rate Limiting** ป้องกัน abuse
- **Request Validation** และ sanitization

## 🚀 Quick Start

### 1. Installation

```bash
# Clone หรือ copy ไฟล์ทั้งหมด
# ติดตั้ง dependencies
npm run install-deps

# หรือติดตั้งแบบ manual
npm install ws axios express cors helmet compression morgan winston node-cron
```

### 2. Configuration

แก้ไขไฟล์ `mcp-servers-config.json`:

```json
{
  "discovery": {
    "enabled": true,
    "endpoints": [
      "http://your-mcp-registry.com/api/servers",
      "http://localhost:3001/mcp-servers"
    ]
  },
  "servers": [
    {
      "id": "your-mcp-server-1",
      "name": "Your MCP Server 1",
      "endpoint": "http://localhost:3000/mcp",
      "type": "http",
      "category": "custom",
      "enabled": true
    }
  ]
}
```

### 3. Start Server

```bash
# ใช้ batch script (Windows)
start-mcp-proxy-500.bat

# หรือรันโดยตรง
node mcp-proxy-server-500.js

# หรือใช้ npm script
npm start
```

### 4. Verify Installation

```bash
# ตรวจสอบ health
curl http://localhost:8080/health

# ดู metrics
curl http://localhost:8080/metrics

# เปิด dashboard
# ไปที่ http://localhost:8080/dashboard
```

## 🔧 Configuration Options

### Server Configuration

```javascript
const config = {
  port: 8080,                    // Port สำหรับ proxy server
  maxConnections: 500,           // จำนวน MCP servers สูงสุด
  connectionTimeout: 30000,      // Timeout สำหรับการเชื่อมต่อ (ms)
  healthCheckInterval: 30000,    // ช่วงเวลา health check (ms)
  retryAttempts: 3,             // จำนวนครั้งที่ retry
  loadBalanceStrategy: 'round-robin', // กลยุทธ์ load balancing
  cacheTTL: 300000              // TTL สำหรับ cache (ms)
};
```

### Load Balancing Strategies

- **`round-robin`**: แจกจ่ายแบบหมุนเวียน
- **`least-connections`**: เลือก server ที่มี connection น้อยที่สุด
- **`weighted`**: แจกจ่ายตาม weight ที่กำหนด
- **`health-based`**: เลือก server ที่มี health score สูงสุด
- **`random`**: เลือกแบบสุ่ม

## 📡 API Endpoints

### Health & Status

```bash
# Health check
GET /health
# Response: { "status": "healthy", "servers": 45, "tools": 1200 }

# Detailed metrics
GET /metrics
# Response: { "totalServers": 45, "activeConnections": 42, ... }

# Server status
GET /status
# Response: { "uptime": 3600, "version": "1.0.0", ... }
```

### MCP Protocol

```bash
# List available tools
POST /mcp/tools/list
# Response: { "tools": [...] }

# Call a tool
POST /mcp/tools/call
# Body: { "name": "tool_name", "arguments": {...} }
# Response: { "content": [...] }

# List resources
POST /mcp/resources/list
# Response: { "resources": [...] }
```

### Management

```bash
# Register new server
POST /admin/servers/register
# Body: { "id": "server-id", "endpoint": "http://...", ... }

# Remove server
DELETE /admin/servers/{serverId}

# Update server config
PUT /admin/servers/{serverId}
# Body: { "enabled": false, "weight": 0.5, ... }
```

## 🧪 Testing

### Run Test Suite

```bash
# รัน test suite ทั้งหมด
npm test

# หรือรันโดยตรง
node test-mcp-proxy-500.js
```

### Test Coverage

- ✅ Server Initialization
- ✅ Server Discovery
- ✅ Server Registration
- ✅ Health Checks
- ✅ Tool Execution
- ✅ Load Balancing
- ✅ Error Handling
- ✅ Performance Testing
- ✅ Scalability Testing

### Performance Benchmarks

```
🎯 Target Performance:
- Response Time: < 100ms
- Throughput: > 1000 req/s
- Memory Usage: < 2GB
- CPU Usage: < 80%
- Concurrent Connections: 500
```

## 📊 Monitoring Dashboard

เข้าถึง dashboard ที่: `http://localhost:8080/dashboard`

### Dashboard Features:
- 📈 Real-time metrics graphs
- 🖥️ Server status overview
- 🔧 Tool usage statistics
- ⚡ Performance indicators
- 🚨 Error logs and alerts
- 📋 Connection management

## 🔍 Troubleshooting

### Common Issues

#### 1. Server Discovery ล้มเหลว
```bash
# ตรวจสอบ network connectivity
curl http://your-registry-endpoint.com/api/servers

# ตรวจสอบ config file
cat mcp-servers-config.json
```

#### 2. Connection Timeout
```javascript
// เพิ่ม timeout ใน config
{
  "connectionTimeout": 60000,  // เพิ่มเป็น 60 วินาที
  "retryAttempts": 5           // เพิ่มจำนวน retry
}
```

#### 3. Memory Usage สูง
```javascript
// ปรับ cache settings
{
  "cacheTTL": 60000,          // ลด TTL
  "maxCacheSize": 1000       // จำกัดขนาด cache
}
```

### Debug Mode

```bash
# เปิด debug logging
DEBUG=mcp-proxy:* node mcp-proxy-server-500.js

# หรือตั้งค่า log level
LOG_LEVEL=debug node mcp-proxy-server-500.js
```

## 🔧 Advanced Configuration

### Clustering (Multi-process)

```javascript
// เปิดใช้งาน clustering
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Start MCP Proxy Server
}
```

### Custom Load Balancer

```javascript
class CustomLoadBalancer {
  selectServer(servers, strategy = 'custom') {
    // Custom logic here
    return servers[0];
  }
}
```

### Custom Health Checker

```javascript
class CustomHealthChecker {
  async checkHealth(server) {
    // Custom health check logic
    return true;
  }
}
```

## 📝 Logs

### Log Files
- `logs/mcp-proxy-500.log` - Main application logs
- `logs/error.log` - Error logs only
- `logs/access.log` - HTTP access logs
- `logs/performance.log` - Performance metrics

### Log Levels
- `error` - Errors only
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging
- `trace` - Very detailed tracing

## 🚀 Production Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### Environment Variables

```bash
# Production settings
NODE_ENV=production
PORT=8080
MAX_CONNECTIONS=500
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=30000
```

### Process Management (PM2)

```bash
# ติดตั้ง PM2
npm install -g pm2

# Start with PM2
pm2 start mcp-proxy-server-500.js --name "mcp-proxy-500"

# Monitor
pm2 monit

# Logs
pm2 logs mcp-proxy-500
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- 📧 Email: support@mcp-proxy.com
- 💬 Discord: [MCP Proxy Community](https://discord.gg/mcp-proxy)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/mcp-proxy-server-500/issues)
- 📖 Documentation: [Full Documentation](https://docs.mcp-proxy.com)

---

**MCP Proxy Server 500** - Scaling MCP connectivity to the next level! 🚀