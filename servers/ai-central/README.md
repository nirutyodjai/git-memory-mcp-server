# 🤖 NEXUS IDE - AI Central Server

**Ultimate AI-Powered Development Assistant for NEXUS IDE**

AI Central Server เป็นหัวใจหลักของระบบ AI ใน NEXUS IDE ที่รวมเอาความสามารถของ AI models หลายตัวมาไว้ในที่เดียว เพื่อให้บริการ AI ที่ครอบคลุมและทรงพลังสำหรับการพัฒนาซอฟต์แวร์

## 🌟 ความสามารถหลัก

### 🧠 Multi-AI Model Integration
- **OpenAI GPT-4/GPT-3.5**: สำหรับการเขียนโค้ดและการสนทนา
- **Anthropic Claude**: สำหรับการวิเคราะห์และการให้คำแนะนำ
- **Google Gemini**: สำหรับการประมวลผลข้อมูลขนาดใหญ่
- **Meta Llama**: สำหรับการทำงานแบบ local และความเป็นส่วนตัว
- **Local Models**: รองรับ Ollama และ local AI models

### 💻 Advanced Code Features
- **Intelligent Code Completion**: code completion ที่ฉลาดกว่า GitHub Copilot
- **Natural Language Programming**: เขียนโค้ดด้วยภาษาธรรมชาติ
- **Code Generation**: สร้างโค้ดจาก description
- **Code Explanation**: อธิบายโค้ดที่ซับซ้อน
- **Code Review**: ตรวจสอบและแนะนำการปรับปรุงโค้ด
- **Refactoring Suggestions**: แนะนำการ refactor โค้ด

### 🗣️ Conversational AI
- **Context-Aware Conversations**: เข้าใจ context ของโปรเจคทั้งหมด
- **Project Understanding**: เรียนรู้และเข้าใจโครงสร้างโปรเจค
- **Multi-Language Support**: รองรับการสนทนาหลายภาษา
- **Personality Modes**: AI personalities ที่หลากหลาย
- **Learning from User**: เรียนรู้จาก coding style ของผู้ใช้

### 🐛 AI-Powered Debugging
- **Intelligent Bug Detection**: ตรวจจับ bugs อัตโนมัติ
- **Error Pattern Recognition**: จดจำ error patterns
- **Fix Suggestions**: แนะนำการแก้ไข bugs
- **Root Cause Analysis**: วิเคราะห์สาเหตุของปัญหา
- **Automated Testing**: สร้าง test cases อัตโนมัติ

### ⚡ Performance Optimization
- **Code Performance Analysis**: วิเคราะห์ performance ของโค้ด
- **Optimization Recommendations**: แนะนำการปรับปรุง performance
- **Benchmark Comparisons**: เปรียบเทียบ performance
- **Memory Usage Analysis**: วิเคราะห์การใช้ memory
- **Algorithm Optimization**: ปรับปรุง algorithms

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดระบบ
- Node.js >= 18.0.0
- npm >= 9.0.0
- RAM >= 8GB (แนะนำ 16GB+)
- GPU (ไม่บังคับ แต่จะช่วยเพิ่มประสิทธิภาพ)

### การติดตั้ง

```bash
# Clone repository
git clone https://github.com/nexus-ide/ai-central.git
cd ai-central

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ environment
cp .env.example .env

# แก้ไข configuration
nano .env
```

### การตั้งค่า Environment Variables

```env
# Server Configuration
PORT=4200
NODE_ENV=development
HOST=localhost

# AI Model API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
LLAMA_API_URL=http://localhost:11434

# Database Configuration
MONGO_URI=mongodb://localhost:27017/nexus-ai
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key

# Logging
LOG_LEVEL=info
LOG_FILE=logs/ai-central.log

# Performance
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30000
CACHE_TTL=3600

# Features
ENABLE_CODE_COMPLETION=true
ENABLE_CONVERSATION=true
ENABLE_DEBUGGING=true
ENABLE_OPTIMIZATION=true
```

### การเริ่มต้นใช้งาน

```bash
# Development mode
npm run dev

# Production mode
npm start

# ใช้ PM2 (แนะนำสำหรับ production)
pm2 start ecosystem.config.js

# Docker
docker-compose up -d
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### AI Code Completion
```http
POST /api/v1/code/complete
Content-Type: application/json

{
  "code": "function calculateSum(",
  "language": "javascript",
  "context": {
    "filePath": "/src/utils/math.js",
    "projectType": "nodejs"
  }
}
```

### Code Generation
```http
POST /api/v1/code/generate
Content-Type: application/json

{
  "description": "Create a REST API endpoint for user authentication",
  "language": "javascript",
  "framework": "express",
  "requirements": [
    "JWT authentication",
    "Input validation",
    "Error handling"
  ]
}
```

### AI Conversation
```http
POST /api/v1/conversation/chat
Content-Type: application/json

{
  "message": "How can I optimize this React component?",
  "context": {
    "code": "const MyComponent = () => { ... }",
    "projectContext": { ... }
  },
  "conversationId": "conv_123"
}
```

### Code Review
```http
POST /api/v1/code/review
Content-Type: application/json

{
  "code": "your code here",
  "language": "python",
  "reviewType": "security", // security, performance, style, all
  "strictness": "medium" // low, medium, high
}
```

### Performance Analysis
```http
POST /api/v1/optimization/analyze
Content-Type: application/json

{
  "code": "your code here",
  "language": "javascript",
  "optimizationGoals": ["performance", "memory"],
  "projectPath": "/path/to/project"
}
```

### Debugging Assistant
```http
POST /api/v1/debug/analyze
Content-Type: application/json

{
  "error": {
    "message": "TypeError: Cannot read property 'length' of undefined",
    "stack": "...",
    "line": 42
  },
  "code": "problematic code",
  "context": { ... }
}
```

## 🔧 การตั้งค่าขั้นสูง

### Load Balancing
```javascript
// config/load-balancer.js
module.exports = {
  strategy: 'round-robin', // round-robin, least-connections, weighted
  healthCheck: {
    interval: 30000,
    timeout: 5000,
    retries: 3
  },
  providers: {
    openai: { weight: 3, maxConcurrent: 50 },
    claude: { weight: 2, maxConcurrent: 30 },
    gemini: { weight: 2, maxConcurrent: 40 },
    llama: { weight: 1, maxConcurrent: 20 }
  }
};
```

### Caching Strategy
```javascript
// config/cache.js
module.exports = {
  redis: {
    host: 'localhost',
    port: 6379,
    ttl: 3600 // 1 hour
  },
  memory: {
    max: 1000,
    ttl: 300 // 5 minutes
  },
  strategies: {
    codeCompletion: 'memory',
    conversation: 'redis',
    analysis: 'redis'
  }
};
```

### Security Configuration
```javascript
// config/security.js
module.exports = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // requests per window
  },
  cors: {
    origin: ['http://localhost:3000', 'https://nexus-ide.com'],
    credentials: true
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"]
      }
    }
  }
};
```

## 📊 Monitoring และ Analytics

### Metrics Dashboard
- **Request Volume**: จำนวน requests ต่อวินาที
- **Response Time**: เวลาตอบสนองเฉลี่ย
- **Error Rate**: อัตราการเกิด errors
- **AI Model Usage**: การใช้งาน AI models แต่ละตัว
- **Cache Hit Rate**: อัตราการ hit ของ cache
- **Resource Usage**: การใช้ CPU, Memory, GPU

### Logging
```javascript
// ตัวอย่าง log format
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "ai-central",
  "requestId": "req_123456",
  "userId": "user_789",
  "action": "code_completion",
  "model": "gpt-4",
  "responseTime": 1250,
  "tokensUsed": 150,
  "cacheHit": false
}
```

### Alerts
- **High Error Rate**: เมื่อ error rate > 5%
- **Slow Response**: เมื่อ response time > 5 วินาที
- **API Quota**: เมื่อใกล้หมด API quota
- **Resource Usage**: เมื่อ CPU/Memory > 80%
- **Model Downtime**: เมื่อ AI model ไม่สามารถใช้งานได้

## 🧪 การทดสอบ

### Unit Tests
```bash
# รัน unit tests
npm test

# รัน tests พร้อม coverage
npm run test:coverage

# รัน tests แบบ watch mode
npm run test:watch
```

### Integration Tests
```bash
# รัน integration tests
npm run test:integration

# รัน end-to-end tests
npm run test:e2e
```

### Performance Tests
```bash
# รัน load tests
npm run test:load

# รัน stress tests
npm run test:stress

# รัน benchmark tests
npm run benchmark
```

### API Testing
```bash
# ใช้ Artillery สำหรับ load testing
artillery run tests/load/api-load-test.yml

# ใช้ k6 สำหรับ performance testing
k6 run tests/performance/api-performance.js
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 4200

USER node

CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  ai-central:
    build: .
    ports:
      - "4200:4200"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/nexus-ai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - ai-central
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
```

## ☸️ Kubernetes Deployment

### Deployment YAML
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-central
  labels:
    app: ai-central
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-central
  template:
    metadata:
      labels:
        app: ai-central
    spec:
      containers:
      - name: ai-central
        image: nexus-ide/ai-central:latest
        ports:
        - containerPort: 4200
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: ai-central-secrets
              key: mongo-uri
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4200
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4200
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🔒 Security Best Practices

### API Security
- **Authentication**: JWT tokens สำหรับ authentication
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: ป้องกัน abuse และ DDoS
- **Input Validation**: ตรวจสอบ input ทุกตัว
- **Output Sanitization**: ทำความสะอาด output
- **HTTPS Only**: บังคับใช้ HTTPS
- **CORS Policy**: ตั้งค่า CORS อย่างเหมาะสม

### Data Security
- **Encryption at Rest**: เข้ารหัสข้อมูลในฐานข้อมูล
- **Encryption in Transit**: ใช้ TLS 1.3
- **API Key Management**: จัดการ API keys อย่างปลอดภัย
- **Secrets Management**: ใช้ HashiCorp Vault หรือ AWS Secrets Manager
- **Audit Logging**: บันทึก audit logs ทุกการกระทำ
- **Data Anonymization**: ทำให้ข้อมูลเป็นนิรนาม

### Infrastructure Security
- **Container Security**: สแกน vulnerabilities ใน Docker images
- **Network Security**: ใช้ VPC และ security groups
- **Firewall Rules**: ตั้งค่า firewall อย่างเข้มงวด
- **Regular Updates**: อัปเดต dependencies เป็นประจำ
- **Vulnerability Scanning**: สแกน vulnerabilities อัตโนมัติ
- **Penetration Testing**: ทดสอบความปลอดภัยเป็นประจำ

## 📈 Performance Optimization

### Code Optimization
- **Async/Await**: ใช้ async programming
- **Connection Pooling**: ใช้ connection pools
- **Caching Strategy**: ใช้ multi-level caching
- **Lazy Loading**: โหลดข้อมูลเมื่อจำเป็น
- **Code Splitting**: แบ่งโค้ดเป็นส่วนๆ
- **Tree Shaking**: ลบโค้ดที่ไม่ใช้

### Database Optimization
- **Indexing**: สร้าง indexes ที่เหมาะสม
- **Query Optimization**: ปรับปรุง database queries
- **Connection Pooling**: ใช้ connection pools
- **Read Replicas**: ใช้ read replicas สำหรับ read operations
- **Sharding**: แบ่งข้อมูลออกเป็นส่วนๆ
- **Caching**: ใช้ Redis สำหรับ caching

### Infrastructure Optimization
- **Load Balancing**: กระจาย load อย่างเหมาะสม
- **Auto Scaling**: ปรับขนาดอัตโนมัติ
- **CDN**: ใช้ Content Delivery Network
- **Compression**: บีบอัดข้อมูลก่อนส่ง
- **HTTP/2**: ใช้ HTTP/2 protocol
- **Keep-Alive**: ใช้ persistent connections

## 🤝 การมีส่วนร่วม

### Development Workflow
1. Fork repository
2. สร้าง feature branch
3. เขียนโค้ดและ tests
4. รัน linting และ tests
5. สร้าง pull request
6. Code review
7. Merge เมื่อผ่าน review

### Coding Standards
- ใช้ ESLint และ Prettier
- เขียน JSDoc สำหรับ functions
- Test coverage >= 80%
- ใช้ conventional commits
- ใช้ semantic versioning

### Issue Reporting
- ใช้ GitHub Issues
- ใส่ labels ที่เหมาะสม
- ใส่ข้อมูลครบถ้วน
- ใส่ steps to reproduce
- ใส่ expected vs actual behavior

## 📚 Documentation

### API Documentation
- **Swagger/OpenAPI**: API documentation อัตโนมัติ
- **Postman Collection**: collection สำหรับทดสอบ API
- **Code Examples**: ตัวอย่างการใช้งาน
- **SDK Documentation**: คู่มือการใช้ SDK

### Developer Guide
- **Getting Started**: คู่มือเริ่มต้น
- **Architecture Guide**: คู่มือสถาปัตยกรรม
- **Best Practices**: แนวทางปฏิบัติที่ดี
- **Troubleshooting**: คู่มือแก้ไขปัญหา

## 🆘 Support

### Community
- **Discord Server**: https://discord.gg/nexus-ide
- **GitHub Discussions**: https://github.com/nexus-ide/ai-central/discussions
- **Stack Overflow**: tag `nexus-ide`
- **Reddit**: r/NexusIDE

### Commercial Support
- **Enterprise Support**: 24/7 support สำหรับ enterprise
- **Professional Services**: consulting และ custom development
- **Training**: training courses และ workshops
- **SLA**: Service Level Agreements

## 📄 License

MIT License - ดู [LICENSE](LICENSE) file สำหรับรายละเอียด

## 🙏 Acknowledgments

- OpenAI สำหรับ GPT models
- Anthropic สำหรับ Claude
- Google สำหรับ Gemini
- Meta สำหรับ Llama
- Open source community
- Contributors และ maintainers

---

**Made with ❤️ by NEXUS IDE Team**

*"Empowering developers with the ultimate AI-powered IDE"*