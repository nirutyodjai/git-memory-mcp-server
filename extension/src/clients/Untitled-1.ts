// ในไฟล์ src/index.ts หรือไฟล์หลักอื่นๆ
import { LLMProviderService } from './services/LLMProviderService';
import { SoloAIOrchestrator } from './services/SoloAIOrchestrator';

// Initialize LLM services
const llmService = new LLMProviderService(config, logger);
const aiOrchestrator = new SoloAIOrchestrator(llmService, logger);

// Use in your application
const result = await aiOrchestrator.executeTask({
  id: 'my-task',
  type: 'code_analysis',
  prompt: 'Your prompt here',
  priority: 'high'
});