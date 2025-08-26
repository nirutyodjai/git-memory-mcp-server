# Simple Memory MCP Server

เซิร์ฟเวอร์ Memory MCP แบบง่ายที่รองรับการจัดเก็บข้อมูลแบบ key-value พร้อมฟีเจอร์ขั้นสูง

## ฟีเจอร์

- ✅ การจัดเก็บข้อมูลแบบ key-value
- ✅ TTL (Time To Live) สำหรับข้อมูลที่หมดอายุอัตโนมัติ
- ✅ Tags และ Metadata สำหรับการจัดหมวดหมู่
- ✅ การค้นหาและ Query ข้อมูล
- ✅ Bulk operations (set, get, delete หลายรายการพร้อมกัน)
- ✅ การนับจำนวนการเข้าถึงข้อมูล
- ✅ การจัดเก็บข้อมูลในไฟล์ JSON

## การติดตั้ง

```bash
cd src/simple-memory
npm install
npm run build
```

## การกำหนดค่าใน trae-mcp.json

```json
{
  "mcpServers": {
    "3d-sco-memory": {
      "command": "node",
      "args": [
        "d:\\servers-main\\servers-main\\src\\simple-memory\\dist\\index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "MCP_SERVER_NAME": "3D-SCO Simple Memory"
      }
    }
  }
}
```

## คำสั่งที่รองรับ

### set
เก็บข้อมูลในหน่วยความจำ
```json
{
  "key": "figma_api_key",
  "value": "your_api_key_here",
  "ttl": 3600,
  "tags": ["figma", "api"],
  "metadata": {"source": "user"}
}
```

### get
ดึงข้อมูลจากหน่วยความจำ
```json
{
  "key": "figma_api_key",
  "defaultValue": "not_found"
}
```

### delete
ลบข้อมูลจากหน่วยความจำ
```json
{
  "key": "figma_api_key"
}
```

### query
ค้นหาข้อมูลด้วย pattern และ tags
```json
{
  "pattern": "figma.*",
  "tags": ["api"],
  "limit": 10,
  "offset": 0
}
```

### search
ค้นหาข้อมูลในเนื้อหา
```json
{
  "query": "api key",
  "fuzzy": false,
  "limit": 50
}
```

### bulk_set
เก็บข้อมูลหลายรายการพร้อมกัน
```json
{
  "entries": [
    {
      "key": "key1",
      "value": "value1",
      "tags": ["tag1"]
    },
    {
      "key": "key2",
      "value": "value2",
      "tags": ["tag2"]
    }
  ]
}
```

### bulk_get
ดึงข้อมูลหลายรายการพร้อมกัน
```json
{
  "keys": ["key1", "key2", "key3"]
}
```

### bulk_delete
ลบข้อมูลหลายรายการพร้อมกัน
```json
{
  "keys": ["key1", "key2"],
  "pattern": "temp_.*"
}
```

## ตัวอย่างการใช้งาน

### เก็บ Figma API Key
```bash
# ใช้ MCP tool
run_mcp("mcp.config.usrlocalmcp.3d-sco-memory", "set", {
  "key": "figma_api_key",
  "value": "figd_T55K1_C02bkJ4e36LuRX0h53O_uSF58m9L53G4sv",
  "tags": ["figma", "api", "configuration"],
  "metadata": {
    "source": "user_provided",
    "date": "2025-08-25",
    "purpose": "figma_integration"
  }
})
```

### ดึง API Key กลับมา
```bash
run_mcp("mcp.config.usrlocalmcp.3d-sco-memory", "get", {
  "key": "figma_api_key"
})
```

### ค้นหาข้อมูลที่เกี่ยวข้องกับ Figma
```bash
run_mcp("mcp.config.usrlocalmcp.3d-sco-memory", "query", {
  "tags": ["figma"]
})
```

## การจัดเก็บข้อมูล

ข้อมูลจะถูกเก็บในไฟล์ `memory-data.json` ในโฟลเดอร์เดียวกับ server

## Environment Variables

- `MEMORY_FILE_PATH`: กำหนดตำแหน่งไฟล์สำหรับเก็บข้อมูล (default: `./memory-data.json`)
- `NODE_ENV`: กำหนด environment (production/development)

## การ Debug

เซิร์ฟเวอร์จะแสดงข้อความ "Simple Memory MCP Server running on stdio" เมื่อเริ่มทำงานสำเร็จ

## License

MIT License