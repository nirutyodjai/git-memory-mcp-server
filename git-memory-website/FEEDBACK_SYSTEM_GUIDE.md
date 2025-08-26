# Git Memory MCP Server - Feedback System Guide

## ภาพรวมระบบ

ระบบรับฟีดแบ็กของ Git Memory MCP Server ประกอบด้วยคอมโพเนนต์หลัก 4 ส่วน:

1. **FeedbackWidget** - ปุ่มลอยสำหรับเข้าถึงระบบฟีดแบ็ก
2. **FeedbackForm** - ฟอร์มรับฟีดแบ็กทั่วไป
3. **UserSurvey** - แบบสำรวจความคิดเห็นแบบละเอียด
4. **Admin Dashboard** - หน้าจัดการข้อมูลฟีดแบ็ก

## คอมโพเนนต์และการใช้งาน

### 1. FeedbackWidget

**ตำแหน่ง:** `components/FeedbackWidget.js`

**คุณสมบัติ:**
- ปุ่มลอยที่มุมขวาล่างของหน้าจอ
- สามารถย่อ/ขยายได้
- เปิดฟอร์มฟีดแบ็กหรือแบบสำรวจ
- ติดตาม events ด้วย Google Analytics และ Mixpanel

**การติดตั้ง:**
```jsx
import FeedbackWidget from '../components/FeedbackWidget';

// ใน _app.js
{!router.pathname.startsWith('/admin') && <FeedbackWidget />}
```

### 2. FeedbackForm

**ตำแหน่ง:** `components/FeedbackForm.js`

**ฟิลด์ข้อมูล:**
- ข้อมูลผู้ใช้: ชื่อ, อีเมล, บริษัท, บทบาท
- ประเภทฟีดแบ็ก: Bug Report, Feature Request, General Feedback, Support
- คะแนนความพึงพอใจ (1-5)
- ข้อความฟีดแบ็ก
- คุณสมบัติที่สนใจ
- ข้อเสนอแนะการปรับปรุง
- ความเป็นไปได้ในการแนะนำ (NPS)

**การตรวจสอบข้อมูล:**
- อีเมลต้องมีรูปแบบที่ถูกต้อง
- ข้อความฟีดแบ็กต้องมีอย่างน้อย 10 ตัวอักษร
- คะแนนต้องอยู่ระหว่าง 1-5

### 3. UserSurvey

**ตำแหน่ง:** `components/UserSurvey.js`

**โครงสร้าง:** Multi-step survey (5 ขั้นตอน)

**ขั้นตอนที่ 1: ข้อมูลผู้ใช้**
- ชื่อ, อีเมล, บริษัท, บทบาท
- ประสบการณ์การเขียนโปรแกรม
- ขนาดทีม

**ขั้นตอนที่ 2: เครื่องมือปัจจุบัน**
- IDE ที่ใช้
- AI coding tools ที่ใช้
- ปัญหาที่พบ

**ขั้นตอนที่ 3: ความสนใจใน Git Memory**
- ระดับความสนใจ
- คุณสมบัติที่น่าสนใจ
- ความกังวล

**ขั้นตอนที่ 4: ลำดับความสำคัญ**
- จัดอันดับคุณสมบัติ (drag & drop)
- ความเต็มใจจ่าย
- ปัจจัยการตัดสินใจ

**ขั้นตอนที่ 5: ข้อเสนอแนะ**
- ข้อเสนอแนะเพิ่มเติม
- ความสนใจ beta testing
- การติดต่อกลับ

### 4. Admin Dashboard

**ตำแหน่ง:** `pages/admin/feedback.js`

**คุณสมบัติ:**
- แสดงสถิติรวม (จำนวน feedback, คะแนนเฉลี่ย, NPS)
- กรองข้อมูลตามประเภท, วันที่, คะแนน
- ดูรายละเอียด feedback และ survey
- Export ข้อมูลเป็น JSON
- Responsive design

**การเข้าถึง:**
```
http://localhost:3000/admin/feedback
```

## การติดตาม Analytics

### Google Analytics Events

**FeedbackWidget:**
- `feedback_widget_opened`
- `feedback_widget_minimized`
- `feedback_form_opened`
- `user_survey_opened`

**FeedbackForm:**
- `feedback_form_started`
- `feedback_form_submitted`
- `feedback_form_error`

**UserSurvey:**
- `survey_started`
- `survey_step_completed`
- `survey_completed`
- `survey_abandoned`

### Mixpanel Events

**User Properties:**
- Company, Role, Experience Level
- Current Tools, Team Size

**Event Properties:**
- Feedback Type, Rating, NPS Score
- Survey Step, Completion Rate
- Feature Interests, Concerns

## การจัดเก็บข้อมูล

### ปัจจุบัน (Development)
- ใช้ `localStorage` สำหรับจำลองการเก็บข้อมูล
- ข้อมูลจะหายเมื่อล้าง browser cache

### Production (แนะนำ)
```javascript
// Backend API endpoints
POST /api/feedback - ส่งฟีดแบ็ก
POST /api/survey - ส่งแบบสำรวจ
GET /api/admin/feedback - ดึงข้อมูลฟีดแบ็ก
GET /api/admin/survey - ดึงข้อมูลแบบสำรวจ
GET /api/admin/stats - ดึงสถิติ
```

### Database Schema (แนะนำ)

**Feedback Table:**
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(100),
  feedback_type VARCHAR(50),
  rating INTEGER,
  message TEXT,
  features_interested TEXT[],
  improvement_suggestions TEXT,
  nps_score INTEGER,
  created_at TIMESTAMP,
  user_agent TEXT,
  ip_address INET
);
```

**Survey Table:**
```sql
CREATE TABLE surveys (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  company VARCHAR(255),
  role VARCHAR(100),
  experience_level VARCHAR(50),
  team_size VARCHAR(50),
  current_ide TEXT[],
  current_ai_tools TEXT[],
  current_problems TEXT[],
  interest_level INTEGER,
  interested_features TEXT[],
  concerns TEXT[],
  feature_priorities JSONB,
  willingness_to_pay VARCHAR(50),
  decision_factors TEXT[],
  additional_feedback TEXT,
  beta_interest BOOLEAN,
  contact_back BOOLEAN,
  completed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## การปรับแต่งและขยายระบบ

### เพิ่มคำถามใหม่

**ใน FeedbackForm:**
```javascript
// เพิ่มใน formData state
const [formData, setFormData] = useState({
  // ... existing fields
  newField: ''
});

// เพิ่ม input field
<input
  type="text"
  value={formData.newField}
  onChange={(e) => setFormData({...formData, newField: e.target.value})}
/>
```

**ใน UserSurvey:**
```javascript
// เพิ่มขั้นตอนใหม่
const steps = [
  // ... existing steps
  {
    title: "New Step",
    questions: [
      {
        id: 'newQuestion',
        type: 'single',
        question: 'New question?',
        options: ['Option 1', 'Option 2']
      }
    ]
  }
];
```

### การปรับแต่ง Styling

**CSS Variables:**
```css
:root {
  --feedback-primary: #3b82f6;
  --feedback-secondary: #64748b;
  --feedback-success: #10b981;
  --feedback-error: #ef4444;
  --feedback-border-radius: 8px;
}
```

**Responsive Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### การเพิ่ม Validation Rules

```javascript
const validateForm = (data) => {
  const errors = {};
  
  // Custom validation rules
  if (!data.email.includes('@')) {
    errors.email = 'Invalid email format';
  }
  
  if (data.message.length < 10) {
    errors.message = 'Message too short';
  }
  
  return errors;
};
```

## การทดสอบ

### Unit Tests
```javascript
// Test form validation
describe('FeedbackForm', () => {
  test('validates email format', () => {
    // Test implementation
  });
  
  test('submits form data correctly', () => {
    // Test implementation
  });
});
```

### Integration Tests
```javascript
// Test complete user flow
describe('Feedback System', () => {
  test('user can complete survey', () => {
    // Test implementation
  });
});
```

## Performance Optimization

### Code Splitting
```javascript
// Lazy load components
const FeedbackForm = dynamic(() => import('./FeedbackForm'), {
  loading: () => <div>Loading...</div>
});
```

### Caching
```javascript
// Cache survey responses
const useSurveyCache = () => {
  const [cache, setCache] = useState({});
  
  const saveStep = (step, data) => {
    setCache(prev => ({ ...prev, [step]: data }));
    localStorage.setItem('survey_cache', JSON.stringify(cache));
  };
  
  return { cache, saveStep };
};
```

## Security Considerations

### Data Sanitization
```javascript
// Sanitize user input
const sanitizeInput = (input) => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
};
```

### Rate Limiting
```javascript
// Prevent spam submissions
const useRateLimit = (limit = 5, window = 60000) => {
  const [submissions, setSubmissions] = useState([]);
  
  const canSubmit = () => {
    const now = Date.now();
    const recent = submissions.filter(time => now - time < window);
    return recent.length < limit;
  };
  
  return { canSubmit };
};
```

## การ Deploy และ Monitoring

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_GA_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_MIXPANEL_TOKEN=MIXPANEL_TOKEN
FEEDBACK_API_URL=https://api.example.com
FEEDBACK_API_KEY=secret_key
```

### Monitoring Metrics
- Feedback submission rate
- Survey completion rate
- User satisfaction scores
- Feature request frequency
- Bug report categories

### Error Tracking
```javascript
// Sentry integration
import * as Sentry from '@sentry/nextjs';

const handleError = (error, context) => {
  Sentry.captureException(error, {
    tags: {
      component: 'feedback-system'
    },
    extra: context
  });
};
```

## การบำรุงรักษา

### Regular Tasks
1. **Weekly:** Review new feedback and surveys
2. **Monthly:** Analyze trends and patterns
3. **Quarterly:** Update survey questions based on insights
4. **Annually:** Review and optimize entire system

### Data Backup
```javascript
// Automated backup script
const backupFeedbackData = async () => {
  const data = await fetchAllFeedback();
  const backup = {
    timestamp: new Date().toISOString(),
    data: data
  };
  
  await saveToCloudStorage(backup);
};
```

## การสนับสนุนและการแก้ไขปัญหา

### Common Issues

**1. ฟอร์มไม่ส่งข้อมูล**
- ตรวจสอบ network connectivity
- ตรวจสอบ validation errors
- ตรวจสอบ console errors

**2. Analytics ไม่ทำงาน**
- ตรวจสอบ GA_ID และ Mixpanel token
- ตรวจสอบ ad blockers
- ตรวจสอบ consent management

**3. Survey ไม่บันทึกความคืบหน้า**
- ตรวจสอบ localStorage availability
- ตรวจสอบ browser compatibility
- ตรวจสอบ private/incognito mode

### Debug Mode
```javascript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

const debugLog = (message, data) => {
  if (DEBUG) {
    console.log(`[Feedback System] ${message}`, data);
  }
};
```

## สรุป

ระบบฟีดแบ็กนี้ออกแบบมาเพื่อ:
- รวบรวมข้อมูลผู้ใช้อย่างครอบคลุม
- ให้ประสบการณ์ผู้ใช้ที่ดี
- ติดตามและวิเคราะห์ข้อมูลได้อย่างมีประสิทธิภาพ
- ขยายและปรับแต่งได้ง่าย
- รักษาความปลอดภัยของข้อมูล

ระบบนี้จะช่วยให้ทีมพัฒนา Git Memory MCP Server เข้าใจความต้องการของผู้ใช้และปรับปรุงผลิตภัณฑ์ได้อย่างต่อเนื่อง