# MCP Proxy Server

## 📊 สถานะการติดตั้ง
- ✅ **สถานะ**: ติดตั้งและเริ่มต้นเรียบร้อยแล้ว
- 🚀 **พอร์ต**: 9090
- 📈 **สถานะเซิร์ฟเวอร์**: Healthy
- 🔧 **MCP Servers**: 15 เซิร์ฟเวอร์พร้อมใช้งาน (11 Built-in 3D-SCO + 4 External)

## การเข้าถึง
- **URL หลัก**: http://localhost:9090
- **Health Check**: http://localhost:9090/health
- **Server Status**: http://localhost:9090/servers
- **MCP Endpoints**: http://localhost:9090/mcp/{server-name}

## 📋 MCP Servers รายการ

### 🏗️ Built-in 3D-SCO MCP Servers (TypeScript)
- **Filesystem** (7 tools) - File operations, directory management, path validation
- **Memory** (5 tools) - Data storage, knowledge graph, memory management
- **Sequential Thinking** (4 tools) - Step-by-step thinking, process management, logical reasoning
- **Everything** (10 tools) - Multi-feature comprehensive tools and integrated services
- **Simple Memory** (8 tools) - Simple key-value memory storage with TTL and metadata support
- **Playwright** (8 tools) - Browser automation and web scraping using Playwright
- **Git Memory** (8 tools) - Git repository management with memory capabilities
- **Blender** (2 tools) - Blender 3D modeling and scene creation

### 🐍 Built-in 3D-SCO MCP Servers (Python)
- **Fetch** (4 tools) - Web scraping, API requests, content extraction
- **Git** (8 tools) - Git repository management and version control
- **Time** (4 tools) - Time and date management utilities

### 🌐 External MCP Servers
- **Multifetch** (1 tool) - Multi-source data fetching and aggregation
- **Shadcn UI** (3 tools) - สร้างและจัดการ Shadcn UI components
- **Magic UI** (2 tools) - สร้างและจัดการ Magic UI components
- **Google Workspace** (4 tools) - Gmail, Calendar, Drive, Docs integration

## MCP Servers รายละเอียด

### 🏗️ Built-in 3D-SCO Servers

#### 1. Fetch Server (Python)
- **Endpoint**: http://localhost:9090/mcp/fetch
- **คำอธิบาย**: Web scraping และ API requests
- **Tools**: fetch_url, scrape_content, extract_text, get_headers

#### 2. Git Server (Python)
- **Endpoint**: http://localhost:9090/mcp/git
- **คำอธิบาย**: Git repository management
- **Tools**: git_status, git_add, git_commit, git_push, git_pull, git_branch, git_diff, git_log

#### 3. Time Server (Python)
- **Endpoint**: http://localhost:9090/mcp/time
- **คำอธิบาย**: Time และ date management utilities
- **Tools**: get_current_time, convert_timezone, format_date, calculate_duration

#### 4. Everything Server (TypeScript)
- **Endpoint**: http://localhost:9090/mcp/everything
- **คำอธิบาย**: Multi-feature comprehensive tools
- **Tools**: echo, add, longRunningOperation, printEnv, sampleLLM, getTinyImage, getResource, listResources

### 🌐 External Servers

#### 1. Multifetch Server
- **Endpoint**: http://localhost:9090/mcp/multifetch
- **คำอธิบาย**: Multi-source data fetching
- **Tools**: fetch

## การใช้งาน

### ตรวจสอบสถานะ
```bash
curl http://localhost:9090/health
```

### ดูรายการ MCP Servers
```bash
curl http://localhost:9090/servers
```

### เข้าถึง MCP Server เฉพาะ
```bash
curl http://localhost:9090/mcp/memory
```

## การจัดการ

### เริ่มต้น Proxy Server
```bash
node mcp-proxy-server.js
```

### หยุด Proxy Server
ใช้ `Ctrl+C` ใน terminal ที่รัน server

## คุณสมบัติ
- ✅ HTTP REST API
- ✅ CORS Support
- ✅ Health Monitoring
- ✅ Multiple MCP Server Integration
- ✅ Real-time Status Tracking
- ✅ Request Counting
- ✅ Graceful Shutdown

## Port และ Configuration
- **Port**: 9090
- **Protocol**: HTTP
- **CORS**: Enabled for all origins
- **Content-Type**: application/json

---

**หมายเหตุ**: MCP Proxy Server นี้ทำหน้าที่เป็นตัวกลางในการเชื่อมต่อกับ MCP servers หลายตัว ผ่าน HTTP API เดียว ทำให้สามารถจัดการและเข้าถึง tools ต่างๆ ได้อย่างสะดวก