# 📧 คู่มือการใช้งานระบบส่งอีเมล Git Memory MCP Server

## 🇹🇭 **ภาษาไทย**

### 📋 **ภาพรวม**
ระบบส่งอีเมลอัตโนมัติสำหรับเผยแพร่ Git Memory MCP Server ไปยังชุมชนนักพัฒนา องค์กร และสื่อทั้งในประเทศไทยและต่างประเทศ

### 🎯 **กลุ่มเป้าหมาย**
- **ชุมชนนักพัฒนาไทย**: 50,000+ คน
- **มหาวิทยาลัยไทย**: 20+ แห่ง
- **บริษัทเทคโนโลยีไทย**: 100+ แห่ง
- **ชุมชนนักพัฒนาสากล**: 500,000+ คน
- **มหาวิทยาลัยสากล**: 50+ แห่ง
- **สื่อเทคโนโลยี**: 20+ แห่ง
- **Content Creators**: 50+ คน

### 🚀 **การติดตั้งและใช้งาน**

#### **ขั้นตอนที่ 1: ติดตั้ง Dependencies**
```bash
# ติดตั้งแพ็คเกจที่จำเป็น
npm install nodemailer dotenv

# หรือใช้ script ที่เตรียมไว้
npm run install-deps
```

#### **ขั้นตอนที่ 2: ตั้งค่า Gmail App Password**
1. เข้า Google Account Settings
2. เปิด 2-Factor Authentication
3. สร้าง App Password สำหรับ "Mail"
4. คัดลอก 16-digit password

#### **ขั้นตอนที่ 3: ตั้งค่า Environment Variables**
```bash
# Windows (PowerShell)
$env:EMAIL_USER="your-email@gmail.com"
$env:EMAIL_PASS="your-16-digit-app-password"

# Linux/Mac
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-16-digit-app-password"

# หรือสร้างไฟล์ .env
echo "EMAIL_USER=your-email@gmail.com" > .env
echo "EMAIL_PASS=your-16-digit-app-password" >> .env
```

#### **ขั้นตอนที่ 4: ทดสอบระบบ**
```bash
# ดูรายชื่อผู้รับทั้งหมด (ไม่ส่งจริง)
node email-distribution.js --dry-run

# ดูรายชื่อกลุ่ม
node email-distribution.js --list

# ดูเทมเพลตอีเมล
node email-distribution.js --templates
```

#### **ขั้นตอนที่ 5: ส่งอีเมลจริง**
```bash
# ส่งอีเมลไปยังทุกกลุ่ม
node email-distribution.js

# หรือใช้ npm script
npm start
```

### 📊 **รายงานผลการส่ง**
หลังจากส่งเสร็จ ระบบจะสร้างไฟล์ `email-distribution-report.json` ที่มี:
- จำนวนอีเมลที่ส่งสำเร็จ
- จำนวนอีเมลที่ส่งไม่สำเร็จ
- อัตราความสำเร็จ
- รายละเอียดการส่งแต่ละอีเมล

### 🛡️ **ข้อควรระวัง**
- **Rate Limiting**: ระบบจะหน่วงเวลา 1 วินาทีระหว่างการส่งแต่ละอีเมล
- **Gmail Limits**: Gmail อนุญาตส่งได้ 500 อีเมล/วัน สำหรับบัญชีฟรี
- **Spam Prevention**: ไม่ควรส่งอีเมลซ้ำไปยังผู้รับเดิมภายใน 24 ชั่วโมง
- **Content Quality**: ตรวจสอบเนื้อหาให้ถูกต้องก่อนส่ง

### 📝 **การปรับแต่งเทมเพลต**
แก้ไขไฟล์ `email-distribution.js` ในส่วน `EMAIL_TEMPLATES`:

```javascript
const EMAIL_TEMPLATES = {
  custom_template: {
    subject: 'หัวข้ออีเมลของคุณ',
    html: `
      <h2>เนื้อหาอีเมล HTML</h2>
      <p>ใช้ [VARIABLE_NAME] สำหรับตัวแปร</p>
    `
  }
};
```

---

## 🌍 **English**

### 📋 **Overview**
Automated email distribution system for promoting Git Memory MCP Server to developer communities, organizations, and media worldwide.

### 🎯 **Target Audience**
- **Thai Developer Communities**: 50,000+ developers
- **Thai Universities**: 20+ institutions
- **Thai Tech Companies**: 100+ companies
- **International Developer Communities**: 500,000+ developers
- **International Universities**: 50+ institutions
- **Tech Media**: 20+ publications
- **Content Creators**: 50+ influencers

### 🚀 **Installation & Usage**

#### **Step 1: Install Dependencies**
```bash
# Install required packages
npm install nodemailer dotenv

# Or use prepared script
npm run install-deps
```

#### **Step 2: Setup Gmail App Password**
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate App Password for "Mail"
4. Copy the 16-digit password

#### **Step 3: Configure Environment Variables**
```bash
# Windows (PowerShell)
$env:EMAIL_USER="your-email@gmail.com"
$env:EMAIL_PASS="your-16-digit-app-password"

# Linux/Mac
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASS="your-16-digit-app-password"

# Or create .env file
echo "EMAIL_USER=your-email@gmail.com" > .env
echo "EMAIL_PASS=your-16-digit-app-password" >> .env
```

#### **Step 4: Test the System**
```bash
# View all recipients (dry run)
node email-distribution.js --dry-run

# View distribution lists
node email-distribution.js --list

# View email templates
node email-distribution.js --templates
```

#### **Step 5: Send Real Emails**
```bash
# Send emails to all groups
node email-distribution.js

# Or use npm script
npm start
```

### 📊 **Distribution Report**
After completion, the system generates `email-distribution-report.json` containing:
- Number of successfully sent emails
- Number of failed emails
- Success rate percentage
- Detailed sending information

### 🛡️ **Important Considerations**
- **Rate Limiting**: System waits 1 second between each email
- **Gmail Limits**: Gmail allows 500 emails/day for free accounts
- **Spam Prevention**: Avoid sending duplicate emails within 24 hours
- **Content Quality**: Review content before sending

### 📝 **Template Customization**
Edit `email-distribution.js` in the `EMAIL_TEMPLATES` section:

```javascript
const EMAIL_TEMPLATES = {
  custom_template: {
    subject: 'Your Email Subject',
    html: `
      <h2>Your HTML Email Content</h2>
      <p>Use [VARIABLE_NAME] for variables</p>
    `
  }
};
```

---

## 📈 **Expected Results**

### **Phase 1: Developer Communities (Week 1-2)**
- **Target**: 100+ community responses
- **Expected**: 1,000+ GitHub stars
- **Metric**: 20% open rate, 5% click-through rate

### **Phase 2: Universities (Week 3-4)**
- **Target**: 20+ academic partnerships
- **Expected**: Research collaborations
- **Metric**: 15% response rate from professors

### **Phase 3: Enterprise (Week 5-8)**
- **Target**: 50+ enterprise inquiries
- **Expected**: 10+ pilot projects
- **Metric**: 10% meeting booking rate

### **Phase 4: Media Coverage (Week 9-12)**
- **Target**: 5+ major publications
- **Expected**: 100,000+ article views
- **Metric**: 2% media pickup rate

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"Authentication Failed"**
```bash
# Solution: Check Gmail App Password
# 1. Verify 2FA is enabled
# 2. Generate new App Password
# 3. Use 16-digit password (no spaces)
```

#### **"Rate Limit Exceeded"**
```bash
# Solution: Increase delay between emails
# Edit email-distribution.js line:
# await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
```

#### **"Template Not Found"**
```bash
# Solution: Check template names
node email-distribution.js --templates
```

#### **"Distribution List Empty"**
```bash
# Solution: Check list names
node email-distribution.js --list
```

---

## 📞 **Support**

### **Technical Support**
- **GitHub Issues**: [Repository Issues](https://github.com/your-username/git-memory-mcp-server/issues)
- **Email**: support@yourdomain.com
- **Documentation**: [Complete Guide](https://github.com/your-username/git-memory-mcp-server/wiki)

### **Business Inquiries**
- **Partnership**: partnerships@yourdomain.com
- **Enterprise**: enterprise@yourdomain.com
- **Media**: press@yourdomain.com

---

## 📄 **License**
MIT License - Free for commercial and personal use.

## 🤝 **Contributing**
Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

---

**🎉 Happy Distributing! ขอให้การเผยแพร่สำเร็จลุล่วง!**