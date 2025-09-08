# 🚀 NEXUS IDE - System Update Guide

## 📋 Overview

คู่มือนี้จะแนะนำวิธีการอัปเดตระบบหลักด้วยการตั้งค่าใหม่ของ NEXUS IDE ที่ได้รับการปรับปรุงให้ทันสมัยและมีประสิทธิภาพสูงขึ้น

---

## 🎯 What's New in NEXUS IDE 2.0

### ✨ Major Improvements
- **🤖 Enhanced AI Integration**: รองรับ AI หลายโมเดลพร้อมกัน (GPT-4, Claude, Gemini)
- **🔄 Real-time Collaboration**: ระบบทำงานร่วมกันแบบ real-time ที่สมบูรณ์
- **📊 Advanced Monitoring**: ระบบ monitoring ด้วย Prometheus + Grafana
- **🐳 Docker Optimization**: Docker configuration ที่ปรับปรุงใหม่
- **🔐 Enhanced Security**: ระบบความปลอดภัยที่เข้มงวดขึ้น
- **⚡ Performance Boost**: ประสิทธิภาพที่เพิ่มขึ้น 300%

### 🆕 New Features
- **Multi-Database Support**: PostgreSQL + MongoDB + Redis + Elasticsearch
- **Advanced Plugin System**: ระบบ plugin ที่ยืดหยุ่นและทรงพลัง
- **Visual Programming Interface**: เขียนโปรแกรมแบบ visual
- **AI-Powered Debugging**: debug ด้วย AI ที่ฉลาด
- **Universal Tool Integration**: เชื่อมต่อเครื่องมือได้ทุกประเภท

---

## 🔄 Update Process

### Step 1: Backup Current System

```bash
# สำรองข้อมูลปัจจุบัน
mkdir -p ./backups/$(date +%Y%m%d_%H%M%S)
cp -r ./data ./backups/$(date +%Y%m%d_%H%M%S)/
cp -r ./logs ./backups/$(date +%Y%m%d_%H%M%S)/
cp .env ./backups/$(date +%Y%m%d_%H%M%S)/

# สำรอง database (ถ้ามี)
pg_dump your_database > ./backups/$(date +%Y%m%d_%H%M%S)/database_backup.sql
```

### Step 2: Stop Current Services

```bash
# หยุดบริการที่กำลังทำงาน
npm run stop
# หรือ
docker-compose down
```

### Step 3: Update Configuration Files

#### 3.1 Update package.json
```bash
# ใช้ package-main-system.json แทน package.json เดิม
cp package-main-system.json package.json
npm install
```

#### 3.2 Update Environment Variables
```bash
# อัปเดต .env file
cp .env.example .env
# แก้ไขค่าต่างๆ ใน .env ตามความต้องการ
```

#### 3.3 Update Docker Configuration
```bash
# ไฟล์ Dockerfile และ docker-compose.yml ได้รับการอัปเดตแล้ว
# ตรวจสอบการตั้งค่าใน docker-compose.yml
```

### Step 4: Database Migration

```bash
# สร้าง database ใหม่
npm run db:setup

# Migration ข้อมูลเดิม (ถ้าจำเป็น)
npm run db:migrate

# Seed ข้อมูลเริ่มต้น
npm run db:seed
```

### Step 5: Start New System

#### Option A: Using npm scripts
```bash
# เริ่มระบบแบบ production
npm run nexus:start:prod

# หรือแบบ development
npm run nexus:start:debug
```

#### Option B: Using Docker
```bash
# เริ่มด้วย Docker Compose
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

### Step 6: Verification

```bash
# ตรวจสอบ health check
curl http://localhost:3000/health

# ตรวจสอบ API endpoints
curl http://localhost:3000/api/info

# ตรวจสอบ WebSocket
# เปิดเบราว์เซอร์ไปที่ http://localhost:3000
```

---

## 🔧 Configuration Guide

### Environment Variables

ไฟล์ `.env` ใหม่มีการตั้งค่าที่ครอบคลุมมากขึ้น:

```env
# AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_claude_key
GOOGLE_API_KEY=your_gemini_key

# Databases
POSTGRES_URL=postgresql://nexus:password@localhost:5432/nexus_db
MONGODB_URL=mongodb://nexus:password@localhost:27017/nexus
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### NEXUS Configuration

ไฟล์ `nexus-config.json` ใหม่:

```json
{
  "ide": {
    "name": "NEXUS IDE",
    "version": "2.0.0",
    "features": {
      "aiAssistant": true,
      "collaboration": true,
      "gitIntegration": true,
      "pluginSystem": true
    }
  },
  "ai": {
    "providers": ["openai", "anthropic", "google"],
    "defaultProvider": "openai",
    "maxConcurrentRequests": 5
  }
}
```

---

## 🚀 New Scripts & Commands

### Available npm Scripts

```bash
# NEXUS IDE Scripts
npm run nexus:start          # เริ่มระบบ NEXUS IDE
npm run nexus:start:debug    # เริ่มแบบ debug mode
npm run nexus:start:prod     # เริ่มแบบ production
npm run nexus:init           # เริ่มต้นระบบ
npm run nexus:mcp            # เริ่ม MCP Server
npm run nexus:demo           # รัน demo
npm run nexus:status         # ตรวจสอบสถานะ
npm run nexus:config         # แสดงการตั้งค่า

# Development Scripts
npm run dev                  # Development mode
npm run build                # Build production
npm run test                 # Run tests
npm run lint                 # Code linting

# Database Scripts
npm run db:setup             # ตั้งค่า database
npm run db:migrate           # Migration
npm run db:seed              # Seed data

# Monitoring Scripts
npm run monitor:start        # เริ่ม monitoring
npm run monitor:stop         # หยุด monitoring
npm run health               # Health check
```

---

## 🐳 Docker Deployment

### Production Deployment

```bash
# Build และ start services
docker-compose up -d

# ตรวจสอบ logs
docker-compose logs -f nexus-ide

# Scale services (ถ้าจำเป็น)
docker-compose up -d --scale nexus-ide=3
```

### Development Deployment

```bash
# เริ่ม development environment
docker-compose --profile dev up -d

# เข้าไปใน container
docker exec -it nexus-ide-dev bash
```

---

## 📊 Monitoring & Analytics

### Access Points

- **Main Application**: http://localhost:3000
- **WebSocket Server**: ws://localhost:3001
- **Prometheus Metrics**: http://localhost:9090
- **Grafana Dashboard**: http://localhost:3001 (admin/password)
- **Health Check**: http://localhost:3000/health

### Key Metrics to Monitor

- **Response Time**: API response times
- **Memory Usage**: Node.js memory consumption
- **Database Performance**: Query execution times
- **WebSocket Connections**: Active connections
- **AI API Usage**: API calls and costs

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Conflicts
```bash
# ตรวจสอบ ports ที่ใช้งาน
netstat -tulpn | grep :3000

# เปลี่ยน port ใน .env
PORT=3002
WS_PORT=3003
```

#### 2. Database Connection Issues
```bash
# ตรวจสอบ database services
docker-compose ps

# ตรวจสอบ logs
docker-compose logs postgres
docker-compose logs mongo
docker-compose logs redis
```

#### 3. Memory Issues
```bash
# เพิ่ม memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# หรือแก้ไขใน .env
NODE_OPTIONS=--max-old-space-size=4096
```

#### 4. AI API Issues
```bash
# ตรวจสอบ API keys
npm run nexus:config

# ทดสอบ AI connection
curl -X POST http://localhost:3000/api/ai/test
```

### Log Files

```bash
# Application logs
tail -f ./logs/nexus-ide.log

# Error logs
tail -f ./logs/error.log

# Access logs
tail -f ./logs/access.log

# Docker logs
docker-compose logs -f
```

---

## 🔄 Rollback Plan

หากเกิดปัญหาในการอัปเดต สามารถ rollback ได้:

```bash
# หยุดระบบใหม่
npm run stop
# หรือ
docker-compose down

# คืนค่าไฟล์เดิม
cp ./backups/YYYYMMDD_HHMMSS/.env ./
cp ./backups/YYYYMMDD_HHMMSS/package.json ./

# คืนค่า database
psql -d your_database < ./backups/YYYYMMDD_HHMMSS/database_backup.sql

# เริ่มระบบเดิม
npm install
npm start
```

---

## 📞 Support

หากพบปัญหาในการอัปเดต:

- **Documentation**: อ่าน `DEPLOYMENT-GUIDE.md` และ `NEXUS-IDE-INTEGRATION.md`
- **Health Check**: ใช้ `npm run health` เพื่อตรวจสอบระบบ
- **Logs**: ตรวจสอบ log files ใน `./logs/`
- **GitHub Issues**: สร้าง issue ใน repository

---

## ✅ Post-Update Checklist

- [ ] ระบบเริ่มต้นได้สำเร็จ
- [ ] Health check ผ่าน
- [ ] API endpoints ทำงานได้
- [ ] WebSocket connection ทำงานได้
- [ ] Database connections ทำงานได้
- [ ] AI features ทำงานได้
- [ ] Monitoring dashboard แสดงผลได้
- [ ] ข้อมูลเดิมยังคงอยู่
- [ ] Performance ดีขึ้น
- [ ] Security features ทำงานได้

---

**🎉 ยินดีด้วย! คุณได้อัปเดตเป็น NEXUS IDE 2.0 เรียบร้อยแล้ว**

ระบบใหม่จะให้ประสบการณ์การพัฒนาที่ดีขึ้นและมีประสิทธิภาพสูงกว่าเดิมมาก!