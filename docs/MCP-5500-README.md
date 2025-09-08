# Git Memory MCP Server 5500 - Trae Agent Integration

🚀 **MCP Protocol Server สำหรับการผสานรวมกับ Trae Agent**

## 📋 ภาพรวม

MCP Server 5500 เป็นเซิร์ฟเวอร์พิเศษที่ออกแบบมาเพื่อการผสานรวมกับ Trae Agent โดยใช้ Model Context Protocol (MCP) สำหรับการจัดการ Git repositories และ semantic memory operations

### ✨ คุณสมบัติหลัก

- 🔧 **Git Operations**: Clone, commit, branch management, status checking
- 🧠 **Semantic Memory**: Vector-based memory storage และ retrieval
- 🔍 **Search Capabilities**: Semantic search และ indexing
- 🛡️ **Security**: Bearer token authentication และ rate limiting
- 📊 **Monitoring**: Health checks และ performance metrics
- 🔄 **MCP Protocol**: เข้ากันได้กับ MCP version 1.0.0

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน

### 📋 ความต้องการระบบ

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Operating System**: Windows, macOS, Linux
- **Memory**: >= 2GB RAM
- **Storage**: >= 1GB available space

### 🔧 การติดตั้ง

```bash
# Clone repository
git clone https://github.com/nirutyodjai/git-memory-mcp-server.git
cd git-memory-mcp-server

# Install dependencies
npm install

# Build project (if needed)
npm run build
```

### ▶️ การเริ่มต้นเซิร์ฟเวอร์

#### วิธีที่ 1: ใช้ npm scripts (แนะนำ)

```bash
# Development mode
npm run trae:dev

# Production mode
npm run mcp:5500:prod

# Standard mode
npm run mcp:5500
```

#### วิธีที่ 2: ใช้ Batch file (Windows)

```cmd
# Double-click หรือ run
start-mcp-5500.bat
```

#### วิธีที่ 3: ใช้ Node.js โดยตรง

```bash
# Development
NODE_ENV=development DEBUG=mcp:* node start-mcp-5500.js

# Production
NODE_ENV=production node start-mcp-5500.js
```

---

## 🔧 การกำหนดค่า

### 📄 ไฟล์กำหนดค่าหลัก

- **`trae-mcp-config.yaml`**: การตั้งค่า MCP Protocol และ endpoints
- **`src/services/mcp-server-5500.js`**: โค้ดเซิร์ฟเวอร์หลัก
- **`start-mcp-5500.js`**: Startup script

### 🌍 Environment Variables

```bash
# Server Configuration
PORT=5500                    # เซิร์ฟเวอร์ port
HOST=localhost              # เซิร์ฟเวอร์ host
NODE_ENV=development        # Environment mode

# Authentication
MCP_AUTH_TOKEN=your_token   # Bearer token สำหรับ authentication

# Debug
DEBUG=mcp:*                # Debug logging
```

### ⚙️ การปรับแต่งการตั้งค่า

แก้ไขไฟล์ `trae-mcp-config.yaml`:

```yaml
server:
  name: "Git Memory MCP Server"
  version: "1.2.1"
  host: "localhost"
  port: 5500                 # เปลี่ยน port ตามต้องการ
  protocol: "http"

authentication:
  type: "bearer"
  required: true
  token_header: "Authorization"
```

---

## 📡 API Endpoints

### 🏥 Health Check

```http
GET /health
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.2.1",
  "port": 5500
}
```

### 🔧 Git Operations

#### Git Status
```http
POST /api/v1/git/status
Content-Type: application/json
Authorization: Bearer <token>

{
  "repository_path": "/path/to/repo"
}
```

#### Git Clone
```http
POST /api/v1/git/clone
Content-Type: application/json
Authorization: Bearer <token>

{
  "url": "https://github.com/user/repo.git",
  "destination": "/path/to/clone"
}
```

#### Git Commit
```http
POST /api/v1/git/commit
Content-Type: application/json
Authorization: Bearer <token>

{
  "repository_path": "/path/to/repo",
  "message": "Commit message",
  "files": ["file1.js", "file2.js"]
}
```

### 🧠 Memory Operations

#### Store Memory
```http
POST /api/v1/memory/store
Content-Type: application/json
Authorization: Bearer <token>

{
  "key": "memory_key",
  "content": "Memory content to store",
  "metadata": {
    "type": "code",
    "language": "javascript"
  }
}
```

#### Retrieve Memory
```http
GET /api/v1/memory/retrieve/:key
Authorization: Bearer <token>
```

#### Semantic Search
```http
POST /api/v1/memory/search
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "search query",
  "limit": 10,
  "threshold": 0.7
}
```

---

## 🔐 Authentication

### Bearer Token Authentication

ทุก API request ต้องมี Authorization header:

```http
Authorization: Bearer <your_token>
```

### การสร้าง Token

```javascript
// ตัวอย่างการสร้าง token
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { user_id: 'user123', role: 'admin' },
  'your_secret_key',
  { expiresIn: '24h' }
);
```

---

## 🔍 การตรวจสอบและ Debug

### 📊 Server Statistics

```http
GET /api/v1/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "requests_total": 1250,
  "requests_per_minute": 45,
  "memory_usage": {
    "used": "125.5 MB",
    "total": "512 MB"
  },
  "uptime": "2h 15m 30s",
  "active_connections": 8
}
```

### 🐛 Debug Mode

```bash
# เปิด debug logging
DEBUG=mcp:* npm run trae:dev

# Debug เฉพาะ module
DEBUG=mcp:server,mcp:auth npm run mcp:5500
```

### 📝 Log Files

- **Console Output**: Real-time logging
- **Error Logs**: `logs/error.log` (if configured)
- **Access Logs**: `logs/access.log` (if configured)

---

## 🔗 การผสานรวมกับ Trae Agent

### 📋 ขั้นตอนการผสานรวม

1. **เริ่มต้น MCP Server 5500**
   ```bash
   npm run trae:server
   ```

2. **กำหนดค่า Trae Agent**
   ```json
   {
     "mcp_servers": {
       "git-memory": {
         "command": "node",
         "args": ["start-mcp-5500.js"],
         "env": {
           "PORT": "5500"
         }
       }
     }
   }
   ```

3. **ทดสอบการเชื่อมต่อ**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:5500/health
   ```

### 🛠️ MCP Protocol Capabilities

- **Tools**: Git operations, Memory management
- **Resources**: Repository data, Memory content
- **Prompts**: Code analysis, Memory queries

---

## 🚨 การแก้ไขปัญหา

### ❌ ปัญหาที่พบบ่อย

#### 1. Port Already in Use
```bash
# ตรวจสอบ process ที่ใช้ port 5500
netstat -ano | findstr :5500

# Kill process (Windows)
taskkill /PID <process_id> /F
```

#### 2. Authentication Failed
```bash
# ตรวจสอบ token
curl -H "Authorization: Bearer <token>" http://localhost:5500/health

# ตรวจสอบ configuration
cat trae-mcp-config.yaml
```

#### 3. Module Not Found
```bash
# ติดตั้ง dependencies ใหม่
npm install

# Clear cache
npm cache clean --force
```

#### 4. Memory Issues
```bash
# เพิ่ม memory limit
node --max-old-space-size=4096 start-mcp-5500.js
```

### 🔧 การตรวจสอบระบบ

```bash
# ตรวจสอบ Node.js version
node --version

# ตรวจสอบ npm version
npm --version

# ตรวจสอบ dependencies
npm list

# ตรวจสอบ port availability
telnet localhost 5500
```

---

## 📈 Performance และ Optimization

### ⚡ การปรับแต่งประสิทธิภาพ

1. **Memory Management**
   ```javascript
   // ใน start-mcp-5500.js
   process.env.NODE_OPTIONS = '--max-old-space-size=4096';
   ```

2. **Rate Limiting**
   ```yaml
   # ใน trae-mcp-config.yaml
   rate_limiting:
     requests_per_minute: 100
     burst_limit: 20
   ```

3. **Caching**
   ```yaml
   caching:
     enabled: true
     ttl: 300  # 5 minutes
   ```

### 📊 Monitoring Metrics

- **Response Time**: < 100ms average
- **Memory Usage**: < 80% of available
- **CPU Usage**: < 70% average
- **Error Rate**: < 1%

---

## 🔒 Security Best Practices

### 🛡️ การรักษาความปลอดภัย

1. **Token Management**
   - ใช้ strong tokens (>= 32 characters)
   - Rotate tokens regularly
   - Store tokens securely

2. **Network Security**
   - ใช้ HTTPS ใน production
   - Configure firewall rules
   - Limit access by IP

3. **Input Validation**
   - Validate all inputs
   - Sanitize file paths
   - Check repository URLs

### 🔐 Production Security Checklist

- [ ] HTTPS enabled
- [ ] Strong authentication tokens
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Firewall rules set
- [ ] Regular security updates

---

## 📚 เอกสารเพิ่มเติม

### 🔗 Links ที่เป็นประโยชน์

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Trae Agent Documentation](https://trae.ai/docs)
- [Git Memory MCP Server GitHub](https://github.com/nirutyodjai/git-memory-mcp-server)
- [Node.js Documentation](https://nodejs.org/docs/)

### 📖 API Documentation

- **OpenAPI Spec**: `/api/docs` (when server is running)
- **Postman Collection**: `docs/postman-collection.json`
- **Examples**: `examples/` directory

---

## 🤝 การสนับสนุนและช่วยเหลือ

### 💬 ช่องทางการติดต่อ

- **GitHub Issues**: [Report bugs และ feature requests](https://github.com/nirutyodjai/git-memory-mcp-server/issues)
- **Email**: support@git-memory.dev
- **Documentation**: [Wiki](https://github.com/nirutyodjai/git-memory-mcp-server/wiki)

### 🆘 การขอความช่วยเหลือ

เมื่อรายงานปัญหา กรุณาระบุ:

1. **Environment**: OS, Node.js version, npm version
2. **Configuration**: trae-mcp-config.yaml settings
3. **Error Messages**: Complete error logs
4. **Steps to Reproduce**: ขั้นตอนการทำซ้ำปัญหา
5. **Expected vs Actual**: ผลลัพธ์ที่คาดหวัง vs ที่เกิดขึ้นจริง

---

## 📄 License

MIT License - ดู [LICENSE](LICENSE) file สำหรับรายละเอียด

---

## 🎉 ขอบคุณ

ขอบคุณที่ใช้ Git Memory MCP Server 5500! 🚀

**Happy Coding!** 💻✨