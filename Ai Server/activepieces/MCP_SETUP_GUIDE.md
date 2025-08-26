# คู่มือการตั้งค่า MCP Servers

ไฟล์นี้จะแนะนำวิธีการตั้งค่า MCP servers ที่ยังไม่ได้เชื่อมต่อ

## สถานะปัจจุบัน

### ✅ MCP Servers ที่พร้อมใช้งาน:
- **nx-mcp** - ใช้งานได้ (URL: http://localhost:9536/sse)
- **filesystem-mcp** - ใช้งานได้
- **git-mcp** - ใช้งานได้
- **sqlite-mcp** - ใช้งานได้
- **puppeteer-mcp** - ใช้งานได้
- **memory-mcp** - ใช้งานได้
- **fetch-mcp** - ใช้งานได้
- **replicate-flux-mcp** - ใช้งานได้ (มี API token แล้ว)

### ⚠️ MCP Servers ที่ต้องการ API Keys:

## 1. Figma MCP Server
**สถานะ:** ต้องการ API Token

### วิธีการตั้งค่า:
1. ไปที่ https://www.figma.com/developers/api#access-tokens
2. สร้าง Personal Access Token
3. แทนที่ `your_figma_token_here` ในไฟล์ `.env` ด้วย token ที่ได้

```bash
FIGMA_ACCESS_TOKEN=YOUR_FIGMA_TOKEN_HERE
FIGMA_TOKEN=YOUR_FIGMA_TOKEN_HERE
```

## 2. PostgreSQL MCP Server
**สถานะ:** ต้องการ Connection String

### วิธีการตั้งค่า:
1. ตรวจสอบว่ามี PostgreSQL server ทำงานอยู่
2. แทนที่ connection string ในไฟล์ `.env`:

```bash
POSTGRES_CONNECTION_STRING=postgresql://username:password@host:port/database
```

**ตัวอย่าง:**
```bash
POSTGRES_CONNECTION_STRING=postgresql://postgres:mypassword@localhost:5432/activepieces
```

## 3. GitHub MCP Server
**สถานะ:** ต้องการ Personal Access Token

### วิธีการตั้งค่า:
1. ไปที่ https://github.com/settings/tokens
2. สร้าง Personal Access Token (Classic)
3. เลือก scopes ที่ต้องการ (repo, user, etc.)
4. แทนที่ token ในไฟล์ `.env`:

```bash
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 4. Brave Search MCP Server
**สถานะ:** ต้องการ API Key

### วิธีการตั้งค่า:
1. ไปที่ https://api.search.brave.com/
2. สมัครสมาชิกและรับ API key
3. แทนที่ API key ในไฟล์ `.env`:

```bash
BRAVE_API_KEY=BSA_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 5. Google Drive MCP Server
**สถานะ:** ต้องการ OAuth Credentials

### วิธีการตั้งค่า:
1. ไปที่ https://console.cloud.google.com/
2. สร้างโปรเจกต์ใหม่หรือเลือกโปรเจกต์ที่มีอยู่
3. เปิดใช้งาน Google Drive API
4. สร้าง OAuth 2.0 credentials
5. แทนที่ credentials ในไฟล์ `.env`:

```bash
GOOGLE_DRIVE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 6. Slack MCP Server
**สถานะ:** ต้องการ Bot Token และ Team ID

### วิธีการตั้งค่า:
1. ไปที่ https://api.slack.com/apps
2. สร้าง Slack app ใหม่
3. เพิ่ม Bot Token Scopes ที่ต้องการ
4. ติดตั้ง app ใน workspace
5. คัดลอก Bot User OAuth Token และ Team ID
6. แทนที่ values ในไฟล์ `.env`:

```bash
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxxxxxxxxxxxxxxx
SLACK_TEAM_ID=T0xxxxxxxxx
```

## การทดสอบการเชื่อมต่อ

หลังจากตั้งค่า environment variables แล้ว:

1. รีสตาร์ท IDE หรือ MCP client
2. ตรวจสอบ logs เพื่อดูว่า MCP servers เชื่อมต่อสำเร็จหรือไม่
3. ทดสอบการใช้งานฟีเจอร์ต่างๆ

## หมายเหตุความปลอดภัย

- **ห้าม** commit ไฟล์ `.env` ไปยัง version control
- เก็บ API keys และ tokens ไว้อย่างปลอดภัย
- ใช้ environment variables หรือ secret management systems ใน production
- ตรวจสอบ permissions และ scopes ของ tokens ให้เหมาะสม

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

1. **MCP server ไม่เชื่อมต่อ**
   - ตรวจสอบ API key/token ว่าถูกต้อง
   - ตรวจสอบ network connectivity
   - ดู error logs

2. **Permission denied**
   - ตรวจสอบ scopes/permissions ของ API key
   - ตรวจสอบว่า API key ยังไม่หมดอายุ

3. **Rate limiting**
   - ตรวจสอบ API usage limits
   - รอสักครู่แล้วลองใหม่

สำหรับปัญหาอื่นๆ โปรดตรวจสอบ documentation ของแต่ละ MCP server