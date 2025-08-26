# Figma MCP Server Installation Guide

## ภาพรวม
Figma MCP Server ช่วยให้ AI สามารถเข้าถึงและทำงานกับ Figma designs ได้ โดยใช้ Figma API เพื่อดึงข้อมูลการออกแบบและแปลงเป็นบริบทที่ AI เข้าใจได้

## การติดตั้ง

### 1. ติดตั้ง Figma MCP Server
```bash
npm install -g figma-developer-mcp
```

### 2. ตั้งค่า Figma API Key
1. ไปที่ [Figma Settings](https://www.figma.com/settings)
2. เลือก **Account** > **Personal access tokens**
3. คลิก **Generate new token**
4. ตั้งชื่อ token และเลือก scope ที่ต้องการ
5. คัดลอก token ที่ได้

### 3. สร้างไฟล์ Environment
```bash
cp .env.figma.example .env.figma
```

แก้ไขไฟล์ `.env.figma`:
```env
FIGMA_API_KEY=your_actual_figma_api_key_here
```

### 4. อัปเดตการกำหนดค่าใน trae-mcp.json
Figma MCP Server ได้ถูกเพิ่มลงในไฟล์ `trae-mcp.json` แล้ว:

```json
"figma-developer-mcp": {
  "command": "npx",
  "args": [
    "-y",
    "figma-developer-mcp",
    "--figma-api-key=YOUR_FIGMA_API_KEY",
    "--stdio"
  ],
  "env": {
    "MCP_SERVER_NAME": "Figma Developer MCP - Design Context Provider"
  }
}
```

**หมายเหตุ:** แทนที่ `YOUR_FIGMA_API_KEY` ด้วย API key จริงของคุณ

## การใช้งาน

### คำสั่งที่มีให้ใช้งาน
- `--figma-api-key`: Figma API key (Personal Access Token)
- `--figma-oauth-token`: Figma OAuth Bearer token
- `--env`: Path ไปยังไฟล์ .env สำหรับโหลด environment variables
- `--port`: Port สำหรับรัน server
- `--json`: Output ข้อมูลในรูปแบบ JSON แทน YAML
- `--skip-image-downloads`: ไม่ลงทะเบียน download_figma_images tool

### ตัวอย่างการรัน
```bash
# รันด้วย API key
npx figma-developer-mcp --figma-api-key=your_api_key --stdio

# รันด้วยไฟล์ .env
npx figma-developer-mcp --env=.env.figma --stdio

# รันบน port เฉพาะ
npx figma-developer-mcp --figma-api-key=your_api_key --port=3333
```

## การทดสอบ
ทดสอบว่า server ทำงานได้:
```bash
npx figma-developer-mcp --help
```

## คุณสมบัติ
- เข้าถึง Figma files และ projects
- ดึงข้อมูล design components
- แปลง design เป็นบริบทที่ AI เข้าใจได้
- รองรับการดาวน์โหลดรูปภาพจาก Figma
- รองรับทั้ง Personal Access Token และ OAuth

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **API Key ไม่ถูกต้อง**: ตรวจสอบว่า API key ถูกต้องและมี permissions ที่เหมาะสม
2. **Network Issues**: ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
3. **Rate Limiting**: Figma API มีข้อจำกัดการเรียกใช้ ให้รอสักครู่แล้วลองใหม่

### การตรวจสอบ Logs
ใช้คำสั่งนี้เพื่อดู logs:
```bash
npx figma-developer-mcp --figma-api-key=your_api_key --stdio --verbose
```

## ข้อมูลเพิ่มเติม
- [Figma API Documentation](https://www.figma.com/developers/api)
- [GLips/Figma-Context-MCP GitHub](https://github.com/GLips/Figma-Context-MCP)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)