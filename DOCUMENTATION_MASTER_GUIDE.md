# MCP Servers - คู่มือหลักฉบับสมบูรณ์

## 📋 สารบัญ

1. [ภาพรวมโครงการ](#ภาพรวมโครงการ)
2. [MCP Servers ที่พร้อมใช้งาน](#mcp-servers-ที่พร้อมใช้งาน)
3. [การติดตั้งและการตั้งค่า](#การติดตั้งและการตั้งค่า)
4. [การใช้งานกับ Trae AI](#การใช้งานกับ-trae-ai)
5. [คู่มือการใช้งานแต่ละเซิร์ฟเวอร์](#คู่มือการใช้งานแต่ละเซิร์ฟเวอร์)
6. [การแก้ไขปัญหา](#การแก้ไขปัญหา)
7. [การพัฒนาและการมีส่วนร่วม](#การพัฒนาและการมีส่วนร่วม)

---

## ภาพรวมโครงการ

โครงการนี้เป็นชุดรวม MCP (Model Context Protocol) Servers ที่ออกแบบมาเพื่อขยายความสามารถของ AI assistants โดยเฉพาะ Trae AI ให้สามารถทำงานได้หลากหลายมากขึ้น

### 🎯 วัตถุประสงค์หลัก
- ให้ AI เข้าถึงและควบคุมเบราว์เซอร์ได้
- จัดการข้อมูลและหน่วยความจำอย่างชาญฉลาด
- ทำงานกับ Git repositories ได้อย่างมีประสิทธิภาพ
- สร้างและจัดการเนื้อหาเว็บ
- ทำงานกับ 3D modeling และ Blender

### 🏗️ สถาปัตยกรรม
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Trae AI       │◄──►│  MCP Protocol    │◄──►│  MCP Servers    │
│   (Client)      │    │  (Communication) │    │  (Tools)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## MCP Servers ที่พร้อมใช้งาน

### 🌐 **3D-SCO Playwright** (`3d-sco-playwright`)
**ความสามารถ:**
- ควบคุมเบราว์เซอร์อัตโนมัติ
- จับภาพหน้าจอ
- ทำงานกับ DOM elements
- รันการทดสอบเว็บ
- จัดการ sessions

**การใช้งาน:**
```javascript
// เปิดเบราว์เซอร์และนำทางไปยังเว็บไซต์
launch_browser({ headless: false })
navigate_to({ url: "https://example.com" })
take_screenshot({ path: "screenshot.png" })
```

### 🔍 **3D-SCO Multi Fetch** (`3d-sco-multifetch`)
**ความสามารถ:**
- ดึงข้อมูลจากเว็บไซต์
- แปลง HTML เป็น Markdown
- จัดการ HTTP requests
- ประมวลผลข้อมูลแบบ batch

**การใช้งาน:**
```javascript
// ดึงเนื้อหาจากเว็บไซต์
fetch({ 
  url: "https://example.com", 
  max_length: 5000,
  raw: false 
})
```

### 🧠 **3D-SCO Memory** (`3d-sco-memory`)
**ความสามารถ:**
- จัดเก็บข้อมูลระยะยาว
- ค้นหาแบบ semantic
- จัดการบริบทการสนทนา
- เชื่อมโยงข้อมูลอัจฉริยะ

### 🎨 **3D-SCO Blender** (`3d-sco-blender`)
**ความสามารถ:**
- สร้างและจัดการ 3D objects
- ควบคุม Blender ผ่าน Python API
- สร้าง animations และ renders

### 📁 **3D-SCO Filesystem** (`3d-sco-filesystem`)
**ความสามารถ:**
- จัดการไฟล์และโฟลเดอร์
- อ่านและเขียนไฟล์
- ค้นหาไฟล์
- จัดการ permissions

### 🔧 **3D-SCO Git** (`3d-sco-git`)
**ความสามารถ:**
- จัดการ Git repositories
- ดู commit history
- จัดการ branches
- สร้าง commits และ merges

### ⏰ **3D-SCO Time** (`3d-sco-time`)
**ความสามารถ:**
- จัดการเวลาและ timezone
- แปลงเวลาระหว่าง timezone
- คำนวณระยะเวลา

### 🎯 **Git Memory MCP Server** (พิเศษ)
**ความสามารถ:**
- รวม Git operations กับ Memory system
- วิเคราะห์ patterns ในโค้ด
- แนะนำ commit messages อัจฉริยะ
- ติดตามการเปลี่ยนแปลงของโปรเจค

---

## การติดตั้งและการตั้งค่า

### 📦 ข้อกำหนดระบบ
- Node.js 18+ 
- Python 3.8+ (สำหรับบางเซิร์ฟเวอร์)
- Git
- Trae AI

### 🚀 การติดตั้งแบบเร็ว

1. **Clone repository:**
```bash
git clone https://github.com/your-repo/servers-main.git
cd servers-main
```

2. **ติดตั้ง dependencies:**
```bash
npm install
```

3. **Build โปรเจค:**
```bash
npm run build
```

4. **คัดลอกการตั้งค่าไปยัง Trae AI:**
```bash
# Windows
copy "trae-mcp.json" "%APPDATA%\Trae\User\mcp.json"

# macOS/Linux
cp trae-mcp.json ~/.config/trae/mcp.json
```

5. **เริ่มเซิร์ฟเวอร์:**
```bash
# เริ่มทั้งหมด
npm run start:all

# หรือเริ่มแต่ละตัว
npm run start:playwright
npm run start:memory
```

### ⚙️ การตั้งค่าขั้นสูง

#### Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์หลัก:
```env
# Figma Integration
FIGMA_API_KEY=your_figma_api_key

# Google Services
GOOGLE_API_KEY=your_google_api_key

# Database
DATABASE_URL=sqlite:./data/memory.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/mcp-servers.log
```

#### การตั้งค่า Trae AI
แก้ไขไฟล์ `mcp.json` ใน Trae AI config directory:
```json
{
  "mcpServers": {
    "3d-sco-playwright": {
      "command": "node",
      "args": ["path/to/servers-main/src/playwright/dist/index.js"],
      "env": {
        "MCP_SERVER_NAME": "3D-SCO Playwright"
      }
    }
  }
}
```

---

## การใช้งานกับ Trae AI

### 🎮 การเริ่มต้นใช้งาน

1. **เปิด Trae AI**
2. **ตรวจสอบการเชื่อมต่อ MCP:**
   ```
   "Show me available MCP servers"
   ```

3. **ทดสอบฟีเจอร์:**
   ```
   "Open a browser and navigate to google.com, then take a screenshot"
   ```

### 💡 ตัวอย่างการใช้งาน

#### การทำงานกับเว็บไซต์
```
"เปิดเบราว์เซอร์ไปที่ https://github.com แล้วค้นหา 'MCP servers' และจับภาพหน้าจอ"
```

#### การจัดการไฟล์
```
"สร้างโฟลเดอร์ใหม่ชื่อ 'project-docs' และสร้างไฟล์ README.md ข้างใน"
```

#### การทำงานกับ Git
```
"ตรวจสอบสถานะ Git repository ปัจจุบัน และแสดง commit history 5 รายการล่าสุด"
```

#### การใช้ Memory System
```
"จำข้อมูลนี้ไว้: โปรเจค X ใช้ React และ TypeScript, deploy บน Vercel"
"ค้นหาข้อมูลเกี่ยวกับโปรเจคที่ใช้ React"
```

---

## คู่มือการใช้งานแต่ละเซิร์ฟเวอร์

### 🌐 Playwright Server

#### การเปิดเบราว์เซอร์
```javascript
// เปิดเบราว์เซอร์แบบมี UI
launch_browser({ headless: false })

// เปิดแบบ headless (เร็วกว่า)
launch_browser({ headless: true })
```

#### การนำทางและการทำงานกับหน้าเว็บ
```javascript
// ไปยัง URL
navigate_to({ url: "https://example.com" })

// รอให้ element ปรากฏ
wait_for_element({ 
  selector: ".login-button",
  timeout: 5000 
})

// คลิกปุ่ม
click_element({ selector: ".login-button" })

// กรอกข้อมูลในฟอร์ม
fill_input({ 
  selector: "#username", 
  text: "myusername" 
})
```

#### การจับภาพหน้าจอ
```javascript
// จับภาพหน้าจอปัจจุบัน
take_screenshot({ 
  path: "screenshot.png",
  fullPage: false 
})

// จับภาพทั้งหน้า
take_screenshot({ 
  path: "fullpage.png",
  fullPage: true 
})
```

### 🔍 Multi Fetch Server

#### การดึงข้อมูลจากเว็บ
```javascript
// ดึงและแปลงเป็น Markdown
fetch({ 
  url: "https://example.com/article",
  max_length: 10000,
  raw: false 
})

// ดึง HTML ดิบ
fetch({ 
  url: "https://api.example.com/data",
  raw: true 
})
```

### 🧠 Memory Server

#### การจัดเก็บข้อมูล
```javascript
// เก็บข้อมูลพร้อม metadata
memory_store({
  key: "project-info",
  content: "โปรเจค ABC ใช้ Next.js และ Tailwind CSS",
  metadata: {
    type: "project",
    technology: ["Next.js", "Tailwind CSS"]
  }
})
```

#### การค้นหาข้อมูล
```javascript
// ค้นหาแบบ semantic
memory_search({
  query: "โปรเจคที่ใช้ React",
  limit: 5
})

// ดึงข้อมูลด้วย key
memory_recall({
  key: "project-info"
})
```

### 🔧 Git Server

#### การตรวจสอบสถานะ
```javascript
// ดูสถานะ repository
git_status({ repo_path: "/path/to/repo" })

// ดู commit history
git_log({ 
  repo_path: "/path/to/repo",
  max_count: 10 
})
```

#### การจัดการ commits
```javascript
// เพิ่มไฟล์เข้า staging
git_add({ 
  repo_path: "/path/to/repo",
  files: ["file1.js", "file2.css"] 
})

// สร้าง commit
git_commit({ 
  repo_path: "/path/to/repo",
  message: "Add new features" 
})
```

---

## การแก้ไขปัญหา

### 🚨 ปัญหาที่พบบ่อย

#### 1. MCP Server ไม่เชื่อมต่อ
**อาการ:** Trae AI ไม่เห็น MCP servers

**วิธีแก้:**
```bash
# ตรวจสอบการตั้งค่า
cat ~/.config/trae/mcp.json

# ตรวจสอบ logs
tail -f ./logs/mcp-servers.log

# รีสตาร์ท Trae AI
```

#### 2. Playwright ไม่สามารถเปิดเบราว์เซอร์ได้
**อาการ:** Error เมื่อเรียก launch_browser

**วิธีแก้:**
```bash
# ติดตั้ง browser dependencies
npx playwright install
npx playwright install-deps

# ตรวจสอบ permissions
chmod +x ./node_modules/.bin/playwright
```

#### 3. Memory Server หน่วยความจำเต็ม
**อาการ:** การค้นหาช้าหรือ error

**วิธีแก้:**
```bash
# ล้างข้อมูลเก่า
rm -rf ./data/memory.db

# รีสตาร์ทเซิร์ฟเวอร์
npm run restart:memory
```

### 🔧 การ Debug

#### เปิด Debug Mode
```bash
# ตั้งค่า environment variable
export DEBUG=mcp:*
export LOG_LEVEL=debug

# รันเซิร์ฟเวอร์
npm run start:debug
```

#### ตรวจสอบ Logs
```bash
# ดู logs แบบ real-time
tail -f ./logs/mcp-servers.log

# ค้นหา errors
grep "ERROR" ./logs/mcp-servers.log

# ดู logs ของเซิร์ฟเวอร์เฉพาะ
grep "playwright" ./logs/mcp-servers.log
```

---

## การพัฒนาและการมีส่วนร่วม

### 🛠️ การพัฒนาเซิร์ฟเวอร์ใหม่

#### โครงสร้างไฟล์
```
src/
├── your-server/
│   ├── index.ts          # Entry point
│   ├── handlers/         # Tool handlers
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── package.json     # Dependencies
│   └── README.md        # Documentation
```

#### Template สำหรับเซิร์ฟเวอร์ใหม่
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'your-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// เพิ่ม tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'your_tool',
        description: 'Description of your tool',
        inputSchema: {
          type: 'object',
          properties: {
            // Define parameters
          },
        },
      },
    ],
  };
});

// เพิ่ม tool handlers
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'your_tool':
      // Implement your tool logic
      return {
        content: [
          {
            type: 'text',
            text: 'Tool result',
          },
        ],
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

### 📝 การเขียนเอกสาร

#### Template สำหรับ README
```markdown
# Your Server Name

## Overview
Brief description of what your server does.

## Installation
Step-by-step installation instructions.

## Usage
Examples of how to use your server.

## API Reference
Detailed documentation of all tools and their parameters.

## Contributing
Guidelines for contributing to your server.
```

### 🧪 การทดสอบ

#### Unit Tests
```typescript
import { describe, it, expect } from 'vitest';
import { YourServer } from '../src/index.js';

describe('YourServer', () => {
  it('should handle tool calls correctly', async () => {
    const server = new YourServer();
    const result = await server.handleTool('your_tool', {});
    expect(result).toBeDefined();
  });
});
```

#### Integration Tests
```bash
# รันการทดสอบ
npm test

# รันการทดสอบแบบ watch mode
npm run test:watch

# รันการทดสอบ coverage
npm run test:coverage
```

### 🚀 การ Deploy

#### การสร้าง Package
```bash
# Build
npm run build

# สร้าง package
npm pack

# Publish to npm
npm publish
```

#### การ Deploy แบบ Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 📚 แหล่งข้อมูลเพิ่มเติม

### 📖 เอกสารอ้างอิง
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Trae AI Documentation](https://trae.ai/docs)

### 🌐 ชุมชนและการสนับสนุน
- **GitHub Issues:** [รายงานปัญหาและขอฟีเจอร์ใหม่](https://github.com/your-repo/issues)
- **Discussions:** [ถาม-ตอบและแชร์ประสบการณ์](https://github.com/your-repo/discussions)
- **Discord:** [เข้าร่วมชุมชน Discord](https://discord.gg/your-server)

### 🎯 Roadmap
- [ ] Web UI สำหรับจัดการ MCP servers
- [ ] การรองรับ plugins เพิ่มเติม
- [ ] การ sync ข้อมูลแบบ real-time
- [ ] การรองรับ multi-language
- [ ] การปรับปรุงประสิทธิภาพ

---

## 📄 License

โครงการนี้อยู่ภายใต้ MIT License - ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)

---

**🎉 ขอบคุณที่ใช้ MCP Servers!**

หากมีคำถามหรือต้องการความช่วยเหลือ อย่าลังเลที่จะติดต่อเราผ่านช่องทางต่างๆ ที่กล่าวมาข้างต้น

*อัปเดตล่าสุด: มกราคม 2025*