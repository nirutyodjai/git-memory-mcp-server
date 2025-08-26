# 📥 Git Memory MCP Server - Download & Installation

🎉 **Git Memory MCP Server พร้อมให้ดาวน์โหลดแล้ว!**

## 📦 ไฟล์ที่พร้อมดาวน์โหลด

### 1. **git-memory-mcp-server-complete.zip** (แนะนำ)
- 📁 **ขนาด**: ~150 KB
- 📋 **เนื้อหา**: โค้ดสมบูรณ์, เอกสาร, ตัวอย่าง, สคริปต์ติดตั้ง
- 🎯 **เหมาะสำหรับ**: ผู้ที่ต้องการไฟล์ครบชุด

### 2. **git-memory-mcp-server-1.0.0.tgz** (npm package)
- 📁 **ขนาด**: ~29 KB
- 📋 **เนื้อหา**: เฉพาะไฟล์ที่จำเป็นสำหรับการใช้งาน
- 🎯 **เหมาะสำหรับ**: การติดตั้งผ่าน npm

## 🚀 วิธีการติดตั้ง

### วิธีที่ 1: ติดตั้งจาก Complete Package (แนะนำ)

1. **ดาวน์โหลด**: `git-memory-mcp-server-complete.zip`
2. **แตกไฟล์**: แตกไฟล์ zip ไปยังโฟลเดอร์ที่ต้องการ
3. **เปิด Terminal/Command Prompt** ในโฟลเดอร์ที่แตกไฟล์
4. **รันสคริปต์ติดตั้ง**:

   **Windows (Command Prompt)**:
   ```cmd
   install.bat
   ```

   **Windows (PowerShell)**:
   ```powershell
   .\install.ps1
   ```

   **Linux/macOS**:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

### วิธีที่ 2: ติดตั้งจาก npm Package

1. **ดาวน์โหลด**: `git-memory-mcp-server-1.0.0.tgz`
2. **ติดตั้ง**:
   ```bash
   npm install -g git-memory-mcp-server-1.0.0.tgz
   ```

### วิธีที่ 3: ติดตั้งจาก npm Registry (ถ้าเผยแพร่แล้ว)

```bash
npm install -g git-memory-mcp-server
```

## ⚙️ การตั้งค่าเบื้องต้น

1. **คัดลอกไฟล์ตัวอย่าง**:
   ```bash
   cp examples/.env.example .env
   ```

2. **แก้ไขการตั้งค่า** ในไฟล์ `.env` ตามต้องการ

3. **เริ่มใช้งาน**:
   ```bash
   git-memory-mcp
   ```

## 📋 ความต้องการของระบบ

- **Node.js**: เวอร์ชัน 18.0.0 ขึ้นไป
- **npm**: เวอร์ชันล่าสุด
- **ระบบปฏิบัติการ**: Windows, macOS, Linux
- **หน่วยความจำ**: อย่างน้อย 512 MB RAM
- **พื้นที่ดิสก์**: อย่างน้อย 100 MB

## 🔍 การตรวจสอบการติดตั้ง

```bash
# ตรวจสอบว่าติดตั้งสำเร็จ
git-memory-mcp --version

# ทดสอบการทำงาน
curl http://localhost:3001/health
```

## 📚 เอกสารประกอบ

หลังจากติดตั้งแล้ว ให้อ่านเอกสารเหล่านี้:

- **README.md** - คู่มือการใช้งานหลัก
- **DEPLOYMENT.md** - คู่มือการติดตั้งและใช้งานขั้นสูง
- **CONTRIBUTING.md** - คู่มือสำหรับนักพัฒนา
- **examples/** - ตัวอย่างการใช้งาน

## 🆘 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย:

1. **Node.js ไม่พบ**:
   - ติดตั้ง Node.js จาก https://nodejs.org/
   - ตรวจสอบ PATH environment variable

2. **Permission denied**:
   - ใช้ `sudo` บน Linux/macOS
   - รัน Command Prompt/PowerShell แบบ Administrator บน Windows

3. **Port ถูกใช้งานแล้ว**:
   - เปลี่ยน PORT ในไฟล์ `.env`
   - หรือหยุดโปรแกรมที่ใช้ port 3001

## 🎯 คุณสมบัติหลัก

✅ **Git Operations**: จัดการ repository, commit, branch, diff
✅ **Memory Management**: จัดเก็บและค้นหาข้อมูลอัจฉริยะ
✅ **Semantic Search**: ค้นหาด้วย AI
✅ **Persistent Storage**: จัดเก็บข้อมูลถาวร
✅ **Smart Integration**: รวมฟีเจอร์ Git และ Memory
✅ **Cross-platform**: รองรับทุกระบบปฏิบัติการ

## 🤝 การสนับสนุน

- 📖 อ่านเอกสารใน README.md
- 🐛 รายงานปัญหาผ่าน GitHub Issues
- 💬 สอบถามผ่าน GitHub Discussions
- 📧 ติดต่อผู้พัฒนา

---

**🎉 ขอบคุณที่ใช้ Git Memory MCP Server!**

หวังว่าเครื่องมือนี้จะช่วยให้การทำงานของคุณมีประสิทธิภาพมากขึ้น! 🚀