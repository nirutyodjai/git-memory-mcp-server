# 🚀 Git Memory MCP Server - Admin Dashboard

## 📋 ภาพรวม

Admin Dashboard เป็น Web Interface ที่ทันสมัยและมีประสิทธิภาพสูงสำหรับจัดการและตรวจสอบ Git Memory MCP Server โดยรวมถึง:

- **📊 Real-time Monitoring**: ตรวจสอบ metrics และ performance แบบ real-time
- **⚙️ Configuration Management**: จัดการการตั้งค่า server ได้ง่าย
- **📋 Log Streaming**: ดู logs แบบ real-time พร้อม filtering
- **🎛️ Server Control**: รีสตาร์ท server และจัดการ cache
- **📈 Analytics**: ดูสถิติการใช้งานและ performance trends
- **🔒 Security Monitoring**: ตรวจสอบ security events และ audit logs

## ✨ คุณสมบัติเด่น

### 🎨 Modern UI/UX
- **Glassmorphism Design**: ออกแบบด้วย glassmorphism ที่สวยงาม
- **Dark Theme**: โหมดมืดที่สบายตา
- **Responsive Design**: รองรับทุกขนาดหน้าจอ
- **Real-time Updates**: อัปเดตข้อมูลแบบ real-time ผ่าน WebSocket

### 📊 Real-time Monitoring
- **Performance Metrics**: CPU, Memory, Response Time
- **Connection Statistics**: Active connections, WebSocket status
- **Cache Performance**: Hit rates, memory usage
- **Load Balancing**: Backend health, request distribution

### ⚙️ Management Tools
- **Configuration Editor**: แก้ไขการตั้งค่าแบบ real-time
- **Cache Management**: Clear cache, ดู statistics
- **Log Filtering**: Filter logs ตาม level และ category
- **Server Control**: รีสตาร์ท server, export ข้อมูล

## 🚀 การติดตั้งและใช้งาน

### 1. เข้าถึง Admin Dashboard

เปิดเบราว์เซอร์และไปที่:
```
http://localhost:3000/admin
```

### 2. Authentication (ถ้ามีการตั้งค่า)

ระบบจะเชื่อมต่ออัตโนมัติถ้าไม่มีการตั้งค่า authentication หรือจะเพิ่มการยืนยันตัวตนได้ในอนาคต

### 3. เริ่มใช้งาน Features

#### 📊 ดู Real-time Metrics
- Dashboard แสดง metrics หลักที่ด้านบน
- Charts แสดง trends ของ performance
- Auto-refresh ทุก 30 วินาที

#### ⚙️ จัดการ Configuration
1. ไปที่ส่วน "Server Management"
2. แก้ไขค่าต่างๆ เช่น:
   - Log Level
   - Rate Limit
   - Cache TTL
   - Max Connections
3. คลิก "Apply Changes" เพื่อบันทึก

#### 📋 ดูและจัดการ Logs
- เลือก log level ที่ต้องการดู
- ใช้ auto-scroll เพื่อดู logs ล่าสุด
- คลิก "Clear Logs" เพื่อเคลียร์หน้าจอ

#### 🎛️ Server Controls
- **Refresh Metrics**: อัปเดตข้อมูลล่าสุด
- **Export Data**: ส่งออก metrics เป็น JSON
- **Restart Server**: รีสตาร์ท server (อย่างระมัดระวัง)

## 🔧 การพัฒนาและปรับแต่ง

### เพิ่ม Custom Metrics

```javascript
// ในไฟล์ server.js เพิ่ม metrics ที่ต้องการแสดง
const customMetrics = {
  customCounter: 0,
  customGauge: 0
};

// ส่งไปยัง WebSocket clients
adminWebSocket.broadcast({
  type: 'custom_metrics',
  data: customMetrics
});
```

### เพิ่ม Custom Controls

```javascript
// เพิ่มปุ่มควบคุมใหม่ใน HTML
<button class="btn btn-primary" onclick="customAction()">
  Custom Action
</button>

// เพิ่มฟังก์ชันใน JavaScript
function customAction() {
  // เรียก API หรือส่ง WebSocket message
}
```

### ปรับแต่ง Styling

แก้ไขไฟล์ `enhanced-styles.js` เพื่อปรับแต่ง appearance:

```javascript
const customStyles = `
  .custom-element {
    background: your-custom-gradient;
    border-radius: 12px;
  }
`;
```

## 🔒 Security Considerations

### Production Deployment

1. **Enable Authentication**: เพิ่มระบบ login สำหรับ admin access
2. **HTTPS Only**: ใช้ HTTPS ใน production environment
3. **Rate Limiting**: จำกัดการเข้าถึง admin endpoints
4. **Audit Logging**: บันทึกทุกการกระทำใน admin panel

### Environment Variables

```bash
# Admin dashboard configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure-password-here
ADMIN_SESSION_TIMEOUT=3600000  # 1 hour
ADMIN_RATE_LIMIT=100  # requests per minute
```

## 📱 Mobile Support

Admin Dashboard รองรับการใช้งานบน mobile devices:

- **Responsive Layout**: ปรับขนาดตามหน้าจอ
- **Touch-Friendly**: ปุ่มและ controls ที่ใช้งานง่ายบน touch screen
- **Optimized Performance**: โหลดเร็วแม้บน mobile networks

## 🔧 API Reference

### WebSocket Events

#### Client → Server
```javascript
// Subscribe to updates
{
  "type": "subscribe",
  "data": { "type": "metrics" }
}

// Unsubscribe
{
  "type": "unsubscribe",
  "data": { "type": "logs" }
}

// Request data
{
  "type": "get_metrics"
}
```

#### Server → Client
```javascript
// Metrics update
{
  "type": "metrics",
  "metrics": { ... },
  "timestamp": "2024-01-01T00:00:00Z"
}

// Log entry
{
  "type": "log",
  "log": {
    "timestamp": "2024-01-01T00:00:00Z",
    "level": "info",
    "message": "Server started"
  }
}

// Alert notification
{
  "type": "alert",
  "message": "High memory usage detected",
  "level": "warning"
}
```

### REST API Endpoints

#### GET /admin/api/status
ข้อมูลสถานะโดยรวมของ server

#### GET /admin/api/metrics
metrics และ statistics ล่าสุด

#### GET /admin/api/logs
audit logs พร้อม filtering

#### POST /admin/api/config
อัปเดต server configuration

#### POST /admin/api/cache/clear
เคลียร์ cache

## 🛠️ Troubleshooting

### Common Issues

#### WebSocket Connection Failed
- ตรวจสอบว่า server รันอยู่ที่ port 3000
- ตรวจสอบ firewall และ network settings
- ลอง refresh หน้าเว็บ

#### Metrics ไม่แสดง
- ตรวจสอบว่า services ถู้อินิชัลไลซ์แล้ว
- ตรวจสอบ console สำหรับ error messages
- ลองคลิก "Refresh Metrics"

#### Configuration ไม่เปลี่ยน
- ตรวจสอบว่า API endpoint ทำงานปกติ
- ตรวจสอบ network connectivity
- ดู logs สำหรับ error messages

### Debug Mode

เปิด debug mode โดยเพิ่มใน URL:
```
http://localhost:3000/admin?debug=true
```

## 📞 Support

สำหรับปัญหาหรือคำถามเกี่ยวกับ Admin Dashboard:

1. ตรวจสอบ logs ในส่วน "Real-time Logs"
2. ดู metrics สำหรับ performance issues
3. Export ข้อมูลสำหรับการวิเคราะห์เพิ่มเติม
4. ติดต่อทีมพัฒนา

---

**Admin Dashboard พร้อมใช้งานแล้ว! 🎉**

เริ่มต้นใช้งานได้ทันทีที่ `http://localhost:3000/admin` หลังจาก start server แล้ว
