# Git Memory MCP Server - คู่มือการใช้งาน

## 🚀 เริ่มต้นใช้งาน

### การติดตั้ง

#### วิธีที่ 1: ติดตั้งจาก NPM
```bash
npm install -g git-memory-mcp-server
```

#### วิธีที่ 2: ดาวน์โหลดและติดตั้งเอง
```bash
# Clone repository
git clone https://github.com/your-username/git-memory-mcp-server.git
cd git-memory-mcp-server

# ติดตั้ง dependencies
npm install

# Build project
npm run build
```

### การเริ่มต้นเซิร์ฟเวอร์

```bash
# เริ่มเซิร์ฟเวอร์
node dist/index.js

# หรือใช้ npm script
npm start
```

## 🛠️ การใช้งาน Tools

### 📊 Git Operations

#### 1. git_status - ตรวจสอบสถานะ Git
```json
{
  "name": "git_status",
  "arguments": {}
}
```

#### 2. git_log - ดูประวัติ commit
```json
{
  "name": "git_log",
  "arguments": {
    "limit": 10,
    "format": "oneline"
  }
}
```

#### 3. git_diff - แสดงความแตกต่าง
```json
{
  "name": "git_diff",
  "arguments": {
    "target": "HEAD~1",
    "source": "HEAD"
  }
}
```

#### 4. git_commit - สร้าง commit
```json
{
  "name": "git_commit",
  "arguments": {
    "message": "Add new feature",
    "add_all": true
  }
}
```

#### 5. git_branch - จัดการ branches
```json
{
  "name": "git_branch",
  "arguments": {
    "action": "list"
  }
}
```

### 💾 Memory System

#### 6. memory_store - จัดเก็บข้อมูล
```json
{
  "name": "memory_store",
  "arguments": {
    "key": "project_notes",
    "content": "บันทึกสำคัญเกี่ยวกับโปรเจกต์",
    "metadata": {
      "type": "note",
      "priority": "high"
    }
  }
}
```

#### 7. memory_search - ค้นหาข้อมูล
```json
{
  "name": "memory_search",
  "arguments": {
    "query": "โปรเจกต์",
    "limit": 5
  }
}
```

#### 8. memory_recall - เรียกคืนข้อมูล
```json
{
  "name": "memory_recall",
  "arguments": {
    "key": "project_notes"
  }
}
```

### 🧠 AI-Enhanced Features

#### 9. smart_commit - Commit อัจฉริยะ
```json
{
  "name": "smart_commit",
  "arguments": {
    "message": "Implement user authentication",
    "context": "Adding login and registration features"
  }
}
```

#### 10. context_search - ค้นหาแบบรวม
```json
{
  "name": "context_search",
  "arguments": {
    "query": "authentication",
    "include_git": true,
    "include_memory": true,
    "limit": 10
  }
}
```

#### 11. pattern_analysis - วิเคราะห์รูปแบบ
```json
{
  "name": "pattern_analysis",
  "arguments": {
    "analysis_type": "commit_patterns",
    "timeframe": "1 month"
  }
}
```

## 🔧 การตั้งค่า

### ไฟล์ Configuration

สร้างไฟล์ `.git-memory-config.json` ในโฟลเดอร์โปรเจกต์:

```json
{
  "memory": {
    "database_path": "./git-memory.db",
    "auto_store_commits": true,
    "semantic_search": true
  },
  "git": {
    "auto_track_changes": true,
    "ignore_patterns": [".git", "node_modules", "*.log"]
  },
  "ai": {
    "enable_smart_commit": true,
    "commit_message_style": "conventional"
  }
}
```

### Environment Variables

```bash
# ตั้งค่าเส้นทาง database
export GIT_MEMORY_DB_PATH="./custom-memory.db"

# เปิด/ปิด debug mode
export GIT_MEMORY_DEBUG=true

# ตั้งค่า Git repository path
export GIT_MEMORY_REPO_PATH="/path/to/your/repo"
```

## 📱 การใช้งานกับ AI Assistants

### Claude Desktop

1. เพิ่มใน `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "git-memory": {
      "command": "node",
      "args": ["/path/to/git-memory-mcp-server/dist/index.js"],
      "env": {
        "GIT_MEMORY_REPO_PATH": "/path/to/your/project"
      }
    }
  }
}
```

### Cursor IDE

1. ติดตั้ง MCP extension
2. เพิ่ม server configuration
3. เริ่มใช้งานผ่าน AI chat

### VS Code

1. ติดตั้ง MCP extension
2. Configure server settings
3. ใช้งานผ่าน command palette

## 🎯 Use Cases

### สำหรับนักพัฒนา

#### 1. จดจำบริบทการทำงาน
```json
{
  "name": "memory_store",
  "arguments": {
    "key": "current_task",
    "content": "กำลังพัฒนา API สำหรับ user management",
    "metadata": {
      "status": "in_progress",
      "priority": "high"
    }
  }
}
```

#### 2. ค้นหาประวัติการแก้ไข
```json
{
  "name": "context_search",
  "arguments": {
    "query": "bug fix authentication",
    "include_git": true,
    "include_memory": true
  }
}
```

#### 3. วิเคราะห์รูปแบบการทำงาน
```json
{
  "name": "pattern_analysis",
  "arguments": {
    "analysis_type": "productivity_patterns",
    "timeframe": "2 weeks"
  }
}
```

### สำหรับทีมงาน

#### 1. แชร์ความรู้
```json
{
  "name": "memory_store",
  "arguments": {
    "key": "team_guidelines",
    "content": "แนวทางการ code review และ testing",
    "metadata": {
      "type": "guideline",
      "team": "frontend"
    }
  }
}
```

#### 2. ติดตามความคืบหน้า
```json
{
  "name": "memory_search",
  "arguments": {
    "query": "sprint progress",
    "limit": 10
  }
}
```

## 🔍 Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. Server ไม่เริ่มต้น
```bash
# ตรวจสอบ Node.js version
node --version  # ต้อง >= 16.0.0

# ตรวจสอบ dependencies
npm install

# Build project ใหม่
npm run build
```

#### 2. Git operations ล้มเหลว
```bash
# ตรวจสอบว่าอยู่ใน Git repository
git status

# ตั้งค่า Git repository path
export GIT_MEMORY_REPO_PATH="$(pwd)"
```

#### 3. Memory database ไม่ทำงาน
```bash
# ตรวจสอบสิทธิ์การเขียนไฟล์
ls -la git-memory.db

# ลบ database และสร้างใหม่
rm git-memory.db
```

### Debug Mode

```bash
# เปิด debug logging
export GIT_MEMORY_DEBUG=true
node dist/index.js
```

## 📚 API Reference

### MCP Protocol

Server ใช้ MCP (Model Context Protocol) version 2024-11-05

#### Initialize Request
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {}
    },
    "clientInfo": {
      "name": "your-client",
      "version": "1.0.0"
    }
  }
}
```

#### Tools List Request
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

#### Tool Call Request
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

## 🤝 การสนับสนุน

### Community
- **GitHub Issues:** [Report bugs และ feature requests](https://github.com/your-username/git-memory-mcp-server/issues)
- **Discussions:** [ถาม-ตอบ และแชร์ประสบการณ์](https://github.com/your-username/git-memory-mcp-server/discussions)

### Documentation
- **API Docs:** [รายละเอียด API ทั้งหมด](./docs/api.md)
- **Examples:** [ตัวอย่างการใช้งาน](./examples/)
- **Changelog:** [ประวัติการอัปเดต](./CHANGELOG.md)

---

**🎉 ขอให้สนุกกับการใช้งาน Git Memory MCP Server!**