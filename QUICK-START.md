# ⚡ NEXUS IDE - Quick Start Guide

## 🚀 One-Command Installation

```bash
# Clone และเริ่มใช้งานทันที
git clone https://github.com/your-org/nexus-ide.git
cd nexus-ide
npm run update:system
```

**หรือใช้สคริปต์อัตโนมัติ:**

```bash
# อัปเดตระบบอัตโนมัติ (ไม่ต้องตอบคำถาม)
npm run update:auto
```

---

## 🎯 Quick Access

### 📱 Access Points (หลังจากติดตั้งเสร็จ)

| Service | URL | Description |
|---------|-----|-------------|
| **Main App** | http://localhost:3000 | NEXUS IDE หลัก |
| **WebSocket** | ws://localhost:3001 | Real-time collaboration |
| **Health Check** | http://localhost:3000/health | ตรวจสอบสถานะระบบ |
| **API Docs** | http://localhost:3000/docs | API Documentation |
| **Monitoring** | http://localhost:9090 | Prometheus Metrics |
| **Dashboard** | http://localhost:3001 | Grafana Dashboard |

### ⚡ Essential Commands

```bash
# เริ่มระบบ
npm run nexus:start

# ตรวจสอบสถานะ
npm run nexus:status

# ดูการตั้งค่า
npm run nexus:config

# รัน health check
npm run health

# หยุดระบบ
npm run stop
```

---

## 🔧 5-Minute Setup

### Step 1: Prerequisites (1 นาที)

```bash
# ตรวจสอบ Node.js version
node --version  # ต้อง >= 18.0.0
npm --version   # ต้อง >= 9.0.0

# ติดตั้ง Node.js ถ้ายังไม่มี
# Windows: https://nodejs.org/
# macOS: brew install node
# Linux: sudo apt install nodejs npm
```

### Step 2: Clone & Install (2 นาที)

```bash
# Clone repository
git clone https://github.com/your-org/nexus-ide.git
cd nexus-ide

# ติดตั้งและเริ่มระบบ
npm run update:system
```

### Step 3: Configure (1 นาที)

```bash
# สร้าง .env file
cp .env.example .env

# แก้ไข .env (ใส่ API keys)
nano .env  # หรือใช้ editor ที่ชอบ
```

**ตัวอย่าง .env:**
```env
# AI Providers (ใส่อย่างน้อย 1 อัน)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-claude-key

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-char-encryption-key
```

### Step 4: Start & Verify (1 นาที)

```bash
# เริ่มระบบ
npm run nexus:start

# ตรวจสอบ (ในหน้าต่างใหม่)
curl http://localhost:3000/health

# เปิดเบราว์เซอร์
open http://localhost:3000
```

---

## 🎨 First Steps in NEXUS IDE

### 1. 🤖 AI Assistant Setup

1. เปิด NEXUS IDE: http://localhost:3000
2. คลิก **AI Assistant** ในแถบด้านข้าง
3. เลือก AI Provider (OpenAI, Claude, หรือ Gemini)
4. ทดสอบ: พิมพ์ "Hello, can you help me code?"

### 2. 📁 Create Your First Project

```bash
# ใน NEXUS IDE Terminal
mkdir my-first-project
cd my-first-project
npm init -y

# สร้างไฟล์ตัวอย่าง
echo 'console.log("Hello NEXUS IDE!");' > index.js
```

### 3. 🔄 Try Real-time Collaboration

1. เปิด NEXUS IDE ในหลายแท็บ
2. แก้ไขไฟล์เดียวกันในแต่ละแท็บ
3. ดูการเปลี่ยนแปลงแบบ real-time

### 4. 🐛 Test AI Debugging

```javascript
// เขียนโค้ดที่มี bug ใน editor
function buggyFunction() {
    let x = 10;
    let y = 0;
    return x / y; // Division by zero
}

buggyFunction();
```

- AI จะแนะนำการแก้ไขอัตโนมัติ
- คลิก **Fix with AI** เพื่อแก้ไข

---

## 🐳 Docker Quick Start

### Option 1: Docker Compose (แนะนำ)

```bash
# เริ่มทุกอย่างด้วยคำสั่งเดียว
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps

# ดู logs
docker-compose logs -f nexus-ide
```

### Option 2: Development Mode

```bash
# เริ่ม development environment
docker-compose --profile dev up -d

# เข้าไปใน container
docker exec -it nexus-ide-dev bash
```

---

## 🔍 Troubleshooting

### ❌ Common Issues & Quick Fixes

#### Port Already in Use
```bash
# ตรวจสอบ process ที่ใช้ port
netstat -tulpn | grep :3000

# เปลี่ยน port ใน .env
echo "PORT=3002" >> .env
echo "WS_PORT=3003" >> .env
```

#### AI Not Working
```bash
# ตรวจสอบ API keys
npm run nexus:config

# ทดสอบ AI connection
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

#### Database Connection Failed
```bash
# เริ่ม database services
docker-compose up -d postgres mongo redis

# ตรวจสอบ connection
npm run db:test
```

#### Memory Issues
```bash
# เพิ่ม memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# หรือแก้ไขใน .env
echo "NODE_OPTIONS=--max-old-space-size=4096" >> .env
```

---

## 📊 Health Check Commands

```bash
# ตรวจสอบสถานะทั้งหมด
npm run health

# ตรวจสอบแต่ละส่วน
curl http://localhost:3000/health/api      # API Health
curl http://localhost:3000/health/db       # Database Health
curl http://localhost:3000/health/ai       # AI Services Health
curl http://localhost:3000/health/ws       # WebSocket Health

# ดู metrics
curl http://localhost:3000/metrics
```

---

## 🎯 Next Steps

### 📚 Learn More
- **Full Documentation**: `DEPLOYMENT-GUIDE.md`
- **Integration Guide**: `NEXUS-IDE-INTEGRATION.md`
- **Migration Guide**: `SYSTEM-UPDATE-GUIDE.md`
- **API Reference**: http://localhost:3000/docs

### 🔧 Customize
- **Configuration**: Edit `nexus-config.json`
- **Plugins**: Browse `/plugins` directory
- **Themes**: Customize in `/themes`
- **AI Models**: Add more in `nexus-config.json`

### 🚀 Advanced Features
- **Multi-Project Workspace**: File → Open Workspace
- **Team Collaboration**: Settings → Collaboration
- **Custom AI Prompts**: AI → Custom Prompts
- **Plugin Development**: Tools → Plugin SDK

---

## 🆘 Need Help?

### 📞 Quick Support
- **Health Check**: `npm run health`
- **System Status**: `npm run nexus:status`
- **Logs**: `tail -f logs/nexus-ide.log`
- **Reset**: `npm run clean && npm run setup`

### 📖 Documentation
- **GitHub Issues**: [Create Issue](https://github.com/your-org/nexus-ide/issues)
- **Discord Community**: [Join Chat](https://discord.gg/nexus-ide)
- **Email Support**: support@nexus-ide.com

---

## 🎉 Success!

ถ้าคุณเห็นหน้าจอนี้:

```
🚀 NEXUS IDE is running!
📱 Main App: http://localhost:3000
❤️ Health: http://localhost:3000/health
🤖 AI Assistant: Ready
🔄 Collaboration: Active
```

**ยินดีด้วย! คุณพร้อมใช้งาน NEXUS IDE แล้ว** 🎊

---

**⚡ Pro Tip**: บุ๊กมาร์ก http://localhost:3000 และเริ่มต้นการเดินทางสู่การพัฒนาแบบ AI-Native!