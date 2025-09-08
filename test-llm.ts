import { LLMProviderService } from './src/services/LLMProviderService';
// ... โค้ด TypeScript อื่นๆimport { LLMProviderService } from './src/services/LLMProviderService';
import { SoloAIOrchestrator } from './src/services/SoloAIOrchestrator';
import { Logger } from './src/utils/logger';
import fs from 'fs';

// โหลดการตั้งค่า
const config = JSON.parse(fs.readFileSync('./config/solo-llm-config.json', 'utf8'));
const logger = new Logger('TestLLM'); // เพิ่ม component name

// สร้าง services
const llmService = new LLMProviderService(config, logger);
const aiOrchestrator = new SoloAIOrchestrator(llmService, logger);

async function testLLMIntegration() {
  console.log('🧪 Testing Solo LLM Integration...');
  
  try {
    // 1. ทดสอบ Provider Status
    console.log('\n📊 Provider Status:');
    const status = llmService.getProviderStatus();
    console.log(JSON.stringify(status, null, 2));
    
    // 2. ทดสอบ Simple LLM Request
    console.log('\n🤖 Testing Simple LLM Request...');
    const response = await llmService.generateResponse({
      prompt: 'Hello! Please respond with "LLM Integration Working!"',
      maxTokens: 50,
      temperature: 0.1
    });
    console.log('Response:', response.content);
    console.log('Provider:', response.provider);
    console.log('Latency:', response.latency + 'ms');
    
    // 3. ทดสอบ Code Analysis Task
    console.log('\n🔍 Testing Code Analysis Task...');
    const analysisTask = {
      id: 'test-analysis-' + Date.now(),
      type: 'code_analysis' as const,
      prompt: 'Analyze this JavaScript function: function add(a, b) { return a + b; }',
      priority: 'medium' as const
    };
    
    const analysisResult = await aiOrchestrator.executeTask(analysisTask);
    console.log('Analysis Success:', analysisResult.success);
    if (analysisResult.response) {
      console.log('Analysis Result:', analysisResult.response.content.substring(0, 200) + '...');
    }
    
    // 4. ทดสอบ Code Generation Task
    console.log('\n⚡ Testing Code Generation Task...');
    const generationTask = {
      id: 'test-generation-' + Date.now(),
      type: 'code_generation' as const,
      prompt: 'Generate a simple TypeScript function that calculates factorial',
      priority: 'high' as const
    };
    
    const generationResult = await aiOrchestrator.executeTask(generationTask);
    console.log('Generation Success:', generationResult.success);
    if (generationResult.response) {
      console.log('Generated Code:', generationResult.response.content.substring(0, 300) + '...');
    }
    
    // 5. ทดสอบ AI Orchestrator Statistics
    console.log('\n📈 AI Orchestrator Statistics:');
    const stats = aiOrchestrator.getStatistics();
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// รันการทดสอบ
testLLMIntegration();