# 🚀 NEXUS IDE Integration

## 📋 Overview

NEXUS IDE Integration เป็นระบบที่เชื่อมต่อ Git Memory MCP Server กับ NEXUS IDE เพื่อสร้างประสบการณ์การพัฒนาที่ทรงพลังและมีประสิทธิภาพสูงสุด

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      NEXUS IDE Frontend                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 NEXUS MCP Server Integration                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │   MCP SDK   │ │  Tool       │ │      Event              │   │
│  │ Integration │ │ Handlers    │ │    Management           │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 NEXUS IDE Integration Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │ AI Memory   │ │ Git Memory  │ │      API Gateway        │   │
│  │   Proxy     │ │  Sharing    │ │      Manager            │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Git Memory MCP Server Cluster                     │
│                    (Running on Port 3000)                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. เริ่มต้นระบบ

```bash
# เริ่มต้น NEXUS IDE Integration
npm run nexus:init

# เริ่มต้น MCP Server สำหรับ NEXUS IDE
npm run nexus:mcp

# ทดสอบการทำงาน
npm run nexus:demo
```

### 2. ตรวจสอบสถานะ

```bash
# ตรวจสอบสถานะระบบ
npm run nexus:status

# ดูการตั้งค่า
npm run nexus:config
```

## 🔧 Configuration

### Environment Variables

```bash
# NEXUS IDE Configuration
NEXUS_IDE_MODE=true
NEXUS_API_PORT=3000
NEXUS_WEBSOCKET_PORT=3001
NEXUS_DEBUG_MODE=false

# AI Configuration
AI_MEMORY_ENABLED=true
AI_COMPLETION_ENABLED=true
AI_DEBUG_ENABLED=true

# Git Memory Configuration
GIT_MEMORY_SHARING=true
GIT_MEMORY_CACHE_SIZE=1000
GIT_MEMORY_AUTO_SYNC=true
```

### Configuration File (nexus-config.json)

```json
{
  "nexus": {
    "ide": {
      "mode": "development",
      "features": {
        "aiCompletion": true,
        "smartSearch": true,
        "debugAssist": true,
        "codeSharing": true,
        "memoryStorage": true
      }
    },
    "api": {
      "port": 3000,
      "cors": true,
      "rateLimit": {
        "enabled": true,
        "max": 1000,
        "windowMs": 60000
      }
    },
    "websocket": {
      "port": 3001,
      "compression": true,
      "heartbeat": 30000
    }
  }
}
```

## 🛠️ Available Tools

### MCP Tools for NEXUS IDE

1. **nexus_init** - เริ่มต้นระบบ NEXUS IDE
2. **nexus_status** - ตรวจสอบสถานะระบบ
3. **nexus_config** - จัดการการตั้งค่า
4. **ai_completion** - AI Code Completion
5. **smart_search** - ค้นหาแบบ Semantic
6. **debug_assist** - ช่วยเหลือในการ Debug
7. **code_sharing** - แชร์โค้ดแบบ Real-time
8. **memory_storage** - จัดเก็บข้อมูลในหน่วยความจำ
9. **nexus_restart** - รีสตาร์ทระบบ

## 📡 API Endpoints

### REST API

```
GET    /health              - Health Check
GET    /api/info            - API Information
GET    /api/config          - Configuration
POST   /api/config          - Update Configuration

# Memory API
GET    /api/memory          - Get Memory Data
POST   /api/memory          - Store Memory Data
DELETE /api/memory/:id      - Delete Memory Data

# Sharing API
GET    /api/shares          - Get Shared Files
POST   /api/shares          - Create Share
GET    /api/shares/:id      - Get Share Details
DELETE /api/shares/:id      - Delete Share
```

### WebSocket Events

```javascript
// Client Events
socket.emit('subscribe', { shareId: 'share-123' });
socket.emit('unsubscribe', { shareId: 'share-123' });
socket.emit('code-change', { file: 'app.js', content: '...' });

// Server Events
socket.on('share-updated', (data) => { /* handle update */ });
socket.on('user-joined', (data) => { /* handle user join */ });
socket.on('user-left', (data) => { /* handle user leave */ });
```

## 🔍 Usage Examples

### 1. AI Code Completion

```javascript
const { NexusMCPServer } = require('./nexus-mcp-server');

const server = new NexusMCPServer();
server.start();

// ใช้ AI Completion
const completion = await server.handleAICompletion({
  code: 'function calculateSum(',
  language: 'javascript',
  context: 'math utility functions'
});
```

### 2. Smart Search

```javascript
// ค้นหาแบบ Semantic
const results = await server.handleSmartSearch({
  query: 'authentication middleware',
  type: 'semantic',
  filters: ['javascript', 'express']
});
```

### 3. Real-time Code Sharing

```javascript
// แชร์โค้ดแบบ Real-time
const share = await server.handleCodeSharing({
  action: 'create',
  files: ['src/app.js', 'src/utils.js'],
  permissions: ['read', 'write']
});
```

## 🚀 Advanced Features

### 1. Multi-AI Integration

```javascript
const aiConfig = {
  models: [
    { name: 'gpt-4', priority: 1, tasks: ['completion', 'explanation'] },
    { name: 'claude-3', priority: 2, tasks: ['analysis', 'refactoring'] },
    { name: 'llama-2', priority: 3, tasks: ['translation', 'documentation'] }
  ],
  fallback: true,
  loadBalancing: 'round-robin'
};
```

### 2. Performance Monitoring

```javascript
const monitor = {
  metrics: {
    responseTime: true,
    memoryUsage: true,
    cpuUsage: true,
    activeConnections: true
  },
  alerts: {
    highLatency: { threshold: 1000, action: 'notify' },
    memoryLeak: { threshold: '80%', action: 'restart' }
  }
};
```

### 3. Auto-scaling

```javascript
const scaling = {
  enabled: true,
  minInstances: 2,
  maxInstances: 10,
  metrics: {
    cpu: { threshold: 70, scaleUp: 2, scaleDown: 1 },
    memory: { threshold: 80, scaleUp: 2, scaleDown: 1 },
    connections: { threshold: 1000, scaleUp: 3, scaleDown: 1 }
  }
};
```

## 🔒 Security

### Authentication & Authorization

```javascript
const security = {
  authentication: {
    type: 'jwt',
    secret: process.env.JWT_SECRET,
    expiresIn: '24h'
  },
  authorization: {
    roles: ['admin', 'developer', 'viewer'],
    permissions: {
      admin: ['*'],
      developer: ['read', 'write', 'share'],
      viewer: ['read']
    }
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
  }
};
```

## 📊 Monitoring & Analytics

### Health Checks

```bash
# ตรวจสอบสถานะระบบ
curl http://localhost:3000/health

# ตรวจสอบ metrics
curl http://localhost:3000/metrics

# ตรวจสอบ logs
curl http://localhost:3000/logs?level=error&limit=100
```

### Performance Metrics

```javascript
const metrics = {
  system: {
    uptime: '24h 15m 30s',
    memoryUsage: '2.1GB / 8GB',
    cpuUsage: '45%',
    diskUsage: '120GB / 500GB'
  },
  api: {
    totalRequests: 125430,
    averageResponseTime: '150ms',
    errorRate: '0.02%',
    activeConnections: 245
  },
  ai: {
    completionRequests: 8920,
    averageCompletionTime: '800ms',
    successRate: '99.8%',
    modelsUsed: ['gpt-4', 'claude-3', 'llama-2']
  }
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # ค้นหา process ที่ใช้ port
   netstat -ano | findstr :3000
   
   # หยุด process
   taskkill /PID <PID> /F
   ```

2. **Memory Issues**
   ```bash
   # เพิ่ม memory limit
   node --max-old-space-size=8192 nexus-ide-integration.js
   ```

3. **Connection Issues**
   ```bash
   # ตรวจสอบ firewall
   netsh advfirewall firewall show rule name="NEXUS IDE"
   ```

### Debug Mode

```bash
# เปิด debug mode
DEBUG=nexus:* npm run nexus:init

# ดู detailed logs
NEXUS_LOG_LEVEL=debug npm run nexus:mcp
```

## 📚 Documentation

- [API Reference](./docs/api-reference.md)
- [MCP Tools Guide](./docs/mcp-tools.md)
- [Configuration Guide](./docs/configuration.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NEXUS IDE Team
- MCP Server Community
- Git Memory Contributors
- AI Integration Partners

---

**Made with ❤️ for NEXUS IDE**