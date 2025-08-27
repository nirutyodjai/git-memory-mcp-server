@echo off
chcp 65001 >nul
color 0A
cls

echo.
echo ████████████████████████████████████████████████████████
echo █                                                      █
echo █  🚀 MCP Lightweight Mode - Single User Optimized    █
echo █                                                      █
echo ████████████████████████████████████████████████████████
echo.
echo 💻 เหมาะสำหรับ: คอมสเปคต่ำ, การใช้งานคนเดียว
echo ⚡ ประหยัดทรัพยากร: RAM ^< 2GB, CPU ^< 50%%
echo 🔧 เซิร์ฟเวอร์: 3 ตัวหลักที่จำเป็น
echo 🌐 พอร์ต: 9090
echo.
echo ════════════════════════════════════════════════════════
echo.

REM ตรวจสอบว่ามี Node.js หรือไม่
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ไม่พบ Node.js!
    echo 💡 กรุณาติดตั้ง Node.js จาก https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM แสดงเวอร์ชัน Node.js
echo 📦 Node.js version:
node --version
echo.

REM ตรวจสอบว่ามีไฟล์ mcp-proxy-lightweight.js หรือไม่
if not exist "mcp-proxy-lightweight.js" (
    echo ❌ ไม่พบไฟล์ mcp-proxy-lightweight.js!
    echo 💡 กรุณาตรวจสอบว่าไฟล์อยู่ในโฟลเดอร์เดียวกัน
    echo.
    pause
    exit /b 1
)

REM ตรวจสอบ dependencies
echo 🔍 ตรวจสอบ dependencies...
if not exist "node_modules\express" (
    echo 📦 กำลังติดตั้ง dependencies...
    npm install express cors
    if errorlevel 1 (
        echo ❌ ติดตั้ง dependencies ไม่สำเร็จ!
        pause
        exit /b 1
    )
    echo ✅ ติดตั้ง dependencies สำเร็จ!
    echo.
)

REM แสดงข้อมูลระบบ
echo 📊 ข้อมูลระบบ:
echo    💾 RAM: 
wmic computersystem get TotalPhysicalMemory /format:value | findstr "="
echo    🖥️  CPU: 
wmic cpu get name /format:value | findstr "="
echo.

REM เริ่มเซิร์ฟเวอร์
echo 🚀 กำลังเริ่มเซิร์ฟเวอร์...
echo ⏰ รอสักครู่...
echo.
echo ════════════════════════════════════════════════════════
echo.

REM เริ่ม MCP Proxy Server แบบ Lightweight
node mcp-proxy-lightweight.js

REM ถ้าเซิร์ฟเวอร์หยุดทำงาน
echo.
echo ════════════════════════════════════════════════════════
echo.
echo 🛑 เซิร์ฟเวอร์หยุดทำงานแล้ว
echo.
echo 💡 เคล็ดลับ:
echo    - กด Ctrl+C เพื่อหยุดเซิร์ฟเวอร์
echo    - ตรวจสอบ http://localhost:9090/health
echo    - ใช้ http://localhost:9090/performance สำหรับดูประสิทธิภาพ
echo.
echo 📞 ต้องการความช่วยเหลือ?
echo    - ดูไฟล์ LIGHTWEIGHT_SETUP_GUIDE.md
echo    - ตรวจสอบ logs ด้านบน
echo.
echo กด Enter เพื่อปิดหน้าต่าง...
pause >nul