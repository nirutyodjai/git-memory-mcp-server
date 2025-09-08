# Multi-System MCP Integration

## 🌟 ภาพรวม

Git Memory MCP Server ได้รับการพัฒนาให้รองรับการทำงานร่วมกับระบบ MCP (Memory-Centric Processing) หลายระบบพร้อมกัน เพื่อให้สามารถจัดการและประมวลผลข้อมูลได้อย่างมีประสิทธิภาพสูงสุด

## 🏗️ สถาปัตยกรรม Multi-System

### Core Components

1. **MCPMultiSystemManager** - จัดการการเชื่อมต่อและประสานงานระหว่างระบบต่างๆ
2. **MCPMultiSystemIntegration** - รวมระบบ Multi-System เข้ากับระบบหลัก
3. **MultiSystemMiddleware** - จัดการ request routing และ load balancing
4. **MultiSystemRoutes** - API endpoints สำหรับการจัดการ multi-system operations

### System Types ที่รองรับ

- **Git Memory System** - ระบบจัดการ Git repositories และ memory
- **Semantic Memory System** - ระบบค้นหาและจัดการข้อมูลแบบ semantic
- **MCP Protocol System** - ระบบสื่อสารผ่าน MCP Protocol
- **External MCP System** - ระบบ MCP ภายนอก
- **Distributed Memory System** - ระบบจัดการ memory แบบกระจาย

## 🚀 การติดตั้งและใช้งาน

### 1. การติดตั้ง

```bash
# Clone repository
git clone <repository-url>
cd git-memory-mcp-server

# Install dependencies
npm install

# Build project
npm run build
```

### 2. การกำหนดค่า

สร้างไฟล์ `src/config/mcp-systems-config.yaml`:

```yaml
global:
  timeout: 30000
  retries: 3
  concurrency: 10
  caching:
    enabled: true
    ttl: 300000
    maxSize: 1000

systems:
  git-memory:
    type: git-memory
    enabled: true
    endpoint: http://localhost:5500
    priority: 1
    healthCheck:
      enabled: true
      interval: 30000
      timeout: 5000
      endpoint: /health

  semantic-memory:
    type: semantic-memory
    enabled: true
    endpoint: http://localhost:5502
    priority: 2
    healthCheck:
      enabled: true
      interval: 30000
      timeout: 5000
      endpoint: /health

loadBalancing:
  strategy: round-robin
  healthCheckRequired: true

monitoring:
  enabled: true
  metricsInterval: 60000
```

### 3. การเริ่มต้นใช้งาน

```bash
# เริ่ม Multi-System Server (Development)
npm run multi:dev

# เริ่ม Multi-System Server (Production)
npm run multi:prod

# เริ่ม Multi-System Server บน port 5501
npm run multi:5501

# เริ่ม Multi-System Server (Test)
npm run multi:test
```

## 📡 API Endpoints

### System Management

- `GET /api/multi-system/systems` - ดูรายการระบบทั้งหมด
- `GET /api/multi-system/systems/:systemId` - ดูข้อมูลระบบเฉพาะ
- `POST /api/multi-system/systems/:systemId/register` - ลงทะเบียนระบบใหม่
- `DELETE /api/multi-system/systems/:systemId` - ยกเลิกการลงทะเบียนระบบ

### Health Monitoring

- `GET /api/multi-system/health` - ตรวจสอบสุขภาพระบบทั้งหมด
- `GET /api/multi-system/systems/:systemId/health` - ตรวจสอบสุขภาพระบบเฉพาะ

### Request Routing

- `POST /api/multi-system/route` - ส่ง request ไปยังระบบที่เหมาะสม
- `POST /api/multi-system/broadcast` - ส่ง request ไปยังหลายระบบ
- `POST /api/multi-system/batch` - ประมวลผล batch requests

### Performance & Metrics

- `GET /api/multi-system/metrics` - ดู metrics ของระบบ
- `GET /api/multi-system/performance` - ดู performance metrics
- `POST /api/multi-system/metrics/reset` - รีเซ็ต metrics

### Configuration

- `GET /api/multi-system/config` - ดูการกำหนดค่าปัจจุบัน
- `POST /api/multi-system/config/reload` - โหลดการกำหนดค่าใหม่

### Load Balancing

- `GET /api/multi-system/load-balancing` - ดูสถานะ load balancing
- `POST /api/multi-system/load-balancing/rebalance` - ปรับสมดุลระบบใหม่

### Cache Management

- `GET /api/multi-system/cache` - ดูสถานะ cache
- `POST /api/multi-system/cache/clear` - ล้าง cache ทั้งหมด
- `POST /api/multi-system/cache/clear/:systemId` - ล้าง cache ของระบบเฉพาะ

### System Discovery

- `GET /api/multi-system/discovery` - ค้นหาระบบที่มีอยู่
- `POST /api/multi-system/discovery/scan` - สแกนหาระบบใหม่

## 🔧 การใช้งาน API

### 1. ลงทะเบียนระบบใหม่

```bash
curl -X POST http://localhost:5501/api/multi-system/systems/new-system/register \
  -H "Content-Type: application/json" \
  -d '{
    "type": "semantic-memory",
    "endpoint": "http://localhost:5502",
    "priority": 2,
    "healthCheck": {
      "enabled": true,
      "interval": 30000,
      "timeout": 5000,
      "endpoint": "/health"
    }
  }'
```

### 2. ส่ง Request ไปยังระบบ

```bash
curl -X POST http://localhost:5501/api/multi-system/route \
  -H "Content-Type: application/json" \
  -d '{
    "targetSystem": "git-memory",
    "request": {
      "method": "POST",
      "endpoint": "/api/git/status",
      "data": {
        "repository": "/path/to/repo"
      }
    },
    "options": {
      "timeout": 10000,
      "retries": 2
    }
  }'
```

### 3. Broadcast Request

```bash
curl -X POST http://localhost:5501/api/multi-system/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "request": {
      "method": "GET",
      "endpoint": "/health"
    },
    "targetSystems": ["git-memory", "semantic-memory"],
    "options": {
      "timeout": 5000,
      "failFast": false
    }
  }'
```

### 4. Batch Processing

```bash
curl -X POST http://localhost:5501/api/multi-system/batch \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "targetSystem": "git-memory",
        "request": {
          "method": "POST",
          "endpoint": "/api/git/status",
          "data": {"repository": "/repo1"}
        }
      },
      {
        "targetSystem": "semantic-memory",
        "request": {
          "method": "POST",
          "endpoint": "/api/search",
          "data": {"query": "test"}
        }
      }
    ],
    "options": {
      "concurrency": 5,
      "timeout": 10000
    }
  }'
```

## 📊 Monitoring และ Health Checks

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "integration": {
    "initialized": true,
    "running": true,
    "systemsCount": 3,
    "healthySystems": 3
  },
  "memory": {
    "rss": 52428800,
    "heapTotal": 29360128,
    "heapUsed": 20971520
  }
}
```

### Metrics Response

```json
{
  "integration": {
    "totalRequests": 1500,
    "successfulRequests": 1485,
    "failedRequests": 15,
    "averageResponseTime": 125,
    "successRate": 99.0,
    "uptime": 7200000
  },
  "systems": {
    "totalSystems": 3,
    "healthySystems": 3,
    "systems": {
      "git-memory": {
        "status": "healthy",
        "responseTime": 45,
        "requestCount": 800,
        "errorCount": 5
      }
    }
  }
}
```

## 🔒 Security Features

### 1. Rate Limiting
- จำกัดจำนวน requests ต่อ IP address
- Configurable limits ตาม environment

### 2. Request Validation
- ตรวจสอบ request structure
- Validate system compatibility

### 3. Security Headers
- Helmet.js สำหรับ security headers
- CORS configuration

### 4. Authentication Support
- Bearer token authentication
- System-level authentication

## ⚡ Performance Optimizations

### 1. Connection Pooling
- HTTP connection pooling สำหรับ external systems
- Configurable pool sizes

### 2. Caching
- Response caching สำหรับ GET requests
- TTL-based cache invalidation

### 3. Load Balancing
- Round-robin, least-connections, weighted strategies
- Health-based routing

### 4. Compression
- Response compression
- Configurable compression levels

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing

```bash
npm run test:load
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple server instances
- Load balancer configuration
- Shared cache layer

### Vertical Scaling
- Memory optimization
- CPU utilization
- Connection limits

### Database Scaling
- Read replicas
- Sharding strategies
- Connection pooling

## 🔧 Troubleshooting

### Common Issues

1. **System Registration Failed**
   - ตรวจสอบ endpoint accessibility
   - Verify system configuration
   - Check network connectivity

2. **Health Check Failures**
   - Review health check endpoints
   - Check timeout settings
   - Verify system status

3. **Performance Issues**
   - Monitor system metrics
   - Check connection pool settings
   - Review cache configuration

### Debug Mode

```bash
DEBUG=mcp:* npm run multi:dev
```

### Log Analysis

```bash
# View logs
tail -f logs/multi-system.log

# Filter by level
grep "ERROR" logs/multi-system.log
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5501
CMD ["npm", "run", "multi:prod"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  multi-system-server:
    build: .
    ports:
      - "5501:5501"
    environment:
      - NODE_ENV=production
      - MCP_MULTI_PORT=5501
    volumes:
      - ./config:/app/src/config
      - ./logs:/app/logs
    restart: unless-stopped
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-system-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: multi-system-server
  template:
    metadata:
      labels:
        app: multi-system-server
    spec:
      containers:
      - name: multi-system-server
        image: git-memory-mcp-server:latest
        ports:
        - containerPort: 5501
        env:
        - name: NODE_ENV
          value: "production"
        - name: MCP_MULTI_PORT
          value: "5501"
```

## 📚 Additional Resources

- [MCP Protocol Specification](./docs/mcp-protocol.md)
- [System Integration Guide](./docs/integration-guide.md)
- [Performance Tuning Guide](./docs/performance-tuning.md)
- [Security Best Practices](./docs/security.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 📞 Support

สำหรับการสนับสนุนและคำถาม:
- GitHub Issues
- Documentation
- Community Forums

---

**Git Memory MCP Server with Multi-System Integration** - พัฒนาโดยทีม AI Development เพื่อการจัดการ Git repositories และ Memory processing ที่มีประสิทธิภาพสูงสุด