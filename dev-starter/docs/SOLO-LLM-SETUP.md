# Solo LLM Integration Setup

## Overview

Solo LLM Integration ช่วยให้ Git Memory MCP IDE สามารถเชื่อมต่อและใช้งาน AI providers แบบเดี่ยว (solo) ได้อย่างมีประสิทธิภาพ

## Features

- รองรับ AI providers หลายตัว (OpenAI, Claude, Gemini, Local LLM)
- Automatic fallback เมื่อ provider หลักล่ม
- Rate limiting และ caching
- Task queue และ concurrent execution
- Monitoring และ statistics

## Setup

### 1. Environment Variables

สร้างไฟล์ `.env` และเพิ่ม API keys:

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Configuration

แก้ไขไฟล์ `config/solo-llm-config.json` ตามต้องการ:

```json
{
  "defaultProvider": "openai",
  "providers": {
    "openai": {
      "enabled": true,
      "priority": 1
    }
  }
}
```

### 3. Usage Example

```typescript
import { LLMProviderService } from './services/LLMProviderService';
import { SoloAIOrchestrator } from './services/SoloAIOrchestrator';

// Initialize services
const llmService = new LLMProviderService(config, logger);
const aiOrchestrator = new SoloAIOrchestrator(llmService, logger);

// Execute AI task
const task = {
  id: 'analyze-code-1',
  type: 'code_analysis',
  prompt: 'Analyze this JavaScript function for potential issues',
  priority: 'high'
};

const result = await aiOrchestrator.executeTask(task);
console.log(result.response?.content);
```

## Task Types

- `code_analysis`: วิเคราะห์โค้ด
- `code_generation`: สร้างโค้ด
- `debugging`: แก้ไขบัค
- `refactoring`: ปรับปรุงโค้ด
- `documentation`: สร้างเอกสาร

## Monitoring

ตรวจสอบสถานะผ่าน:

```typescript
// Provider status
const status = llmService.getProviderStatus();

// Task statistics
const stats = aiOrchestrator.getStatistics();
```

## Troubleshooting

### Common Issues

1. **API Key Invalid**: ตรวจสอบ API keys ในไฟล์ `.env`
2. **Rate Limit**: ลดจำนวน requests หรือเพิ่ม rate limit
3. **Timeout**: เพิ่มค่า timeout ในการตั้งค่า
4. **Provider Down**: ระบบจะใช้ fallback provider อัตโนมัติ

### Logs

ตรวจสอบ logs ที่:
- `logs/llm-provider.log`
- `logs/ai-orchestrator.log`