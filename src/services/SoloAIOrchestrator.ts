import { EventEmitter } from 'events';
import { LLMProviderService, LLMRequest, LLMResponse } from './LLMProviderService';
import { Logger } from '../utils/logger';

export interface AITask {
  id: string;
  type: 'code_analysis' | 'code_generation' | 'debugging' | 'refactoring' | 'documentation';
  prompt: string;
  context?: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeout?: number;
  metadata?: any;
}

export interface AIResult {
  taskId: string;
  success: boolean;
  response?: LLMResponse;
  error?: string;
  executionTime: number;
  timestamp: number;
}

export class SoloAIOrchestrator extends EventEmitter {
  private llmService: LLMProviderService;
  private logger: Logger;
  private taskQueue: AITask[] = [];
  private activeTasks: Map<string, AITask> = new Map();
  private results: Map<string, AIResult> = new Map();
  private isProcessing = false;
  private maxConcurrentTasks = 3;
  private taskHistory: AIResult[] = [];

  constructor(llmService: LLMProviderService, logger: Logger) {
    super();
    this.llmService = llmService;
    this.logger = logger;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.llmService.on('response_generated', (data) => {
      this.emit('llm_response', data);
    });

    this.llmService.on('fallback_success', (data) => {
      this.emit('llm_fallback', data);
    });
  }

  async executeTask(task: AITask): Promise<AIResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Executing AI task: ${task.id} (${task.type})`);
      this.activeTasks.set(task.id, task);
      
      // Prepare LLM request based on task type
      const llmRequest = this.prepareLLMRequest(task);
      
      // Execute with timeout
      const response = await this.executeWithTimeout(llmRequest, task.timeout || 30000);
      
      const result: AIResult = {
        taskId: task.id,
        success: true,
        response,
        executionTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
      this.results.set(task.id, result);
      this.taskHistory.push(result);
      this.activeTasks.delete(task.id);
      
      this.emit('task_completed', result);
      this.logger.info(`Task completed: ${task.id} in ${result.executionTime}ms`);
      
      return result;
      
    } catch (error) {
      const result: AIResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        timestamp: Date.now()
      };
      
      this.results.set(task.id, result);
      this.taskHistory.push(result);
      this.activeTasks.delete(task.id);
      
      this.emit('task_failed', result);
      this.logger.error(`Task failed: ${task.id}`, error);
      
      return result;
    }
  }

  private prepareLLMRequest(task: AITask): LLMRequest {
    let systemPrompt = '';
    let model = 'default';
    
    switch (task.type) {
      case 'code_analysis':
        systemPrompt = 'You are an expert code analyst. Analyze the provided code and identify issues, improvements, and patterns.';
        model = 'code';
        break;
        
      case 'code_generation':
        systemPrompt = 'You are an expert software developer. Generate high-quality, well-documented code based on the requirements.';
        model = 'code';
        break;
        
      case 'debugging':
        systemPrompt = 'You are an expert debugger. Analyze the error and provide a solution with explanation.';
        model = 'smart';
        break;
        
      case 'refactoring':
        systemPrompt = 'You are an expert at code refactoring. Improve the code while maintaining functionality.';
        model = 'code';
        break;
        
      case 'documentation':
        systemPrompt = 'You are a technical writer. Create clear, comprehensive documentation.';
        model = 'fast';
        break;
        
      default:
        systemPrompt = 'You are a helpful AI assistant.';
    }
    
    const fullPrompt = `${systemPrompt}\n\n${task.prompt}`;
    
    return {
      prompt: fullPrompt,
      model,
      context: task.context,
      maxTokens: this.getMaxTokensForTask(task.type),
      temperature: this.getTemperatureForTask(task.type)
    };
  }

  private getMaxTokensForTask(taskType: string): number {
    switch (taskType) {
      case 'code_generation':
      case 'refactoring':
        return 2048;
      case 'code_analysis':
      case 'debugging':
        return 1024;
      case 'documentation':
        return 1536;
      default:
        return 1024;
    }
  }

  private getTemperatureForTask(taskType: string): number {
    switch (taskType) {
      case 'code_generation':
      case 'refactoring':
        return 0.3; // More deterministic for code
      case 'code_analysis':
      case 'debugging':
        return 0.1; // Very deterministic for analysis
      case 'documentation':
        return 0.7; // More creative for documentation
      default:
        return 0.5;
    }
  }

  private async executeWithTimeout(request: LLMRequest, timeout: number): Promise<LLMResponse> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Task timeout after ${timeout}ms`));
      }, timeout);
      
      this.llmService.generateResponse(request)
        .then(response => {
          clearTimeout(timer);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  async queueTask(task: AITask): Promise<string> {
    this.taskQueue.push(task);
    this.logger.info(`Task queued: ${task.id} (${task.type})`);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return task.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.taskQueue.length > 0 && this.activeTasks.size < this.maxConcurrentTasks) {
      const task = this.taskQueue.shift();
      if (task) {
        // Execute task without waiting (fire and forget for queue processing)
        this.executeTask(task).catch(error => {
          this.logger.error(`Queue task execution failed: ${task.id}`, error);
        });
      }
    }
    
    this.isProcessing = false;
    
    // Continue processing if there are more tasks
    if (this.taskQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  getTaskResult(taskId: string): AIResult | null {
    return this.results.get(taskId) || null;
  }

  getActiveTasksCount(): number {
    return this.activeTasks.size;
  }

  getQueueLength(): number {
    return this.taskQueue.length;
  }

  getTaskHistory(limit = 100): AIResult[] {
    return this.taskHistory.slice(-limit);
  }

  getStatistics(): any {
    const history = this.taskHistory;
    const successful = history.filter(r => r.success).length;
    const failed = history.filter(r => !r.success).length;
    const avgExecutionTime = history.length > 0 
      ? history.reduce((sum, r) => sum + r.executionTime, 0) / history.length 
      : 0;
    
    return {
      totalTasks: history.length,
      successful,
      failed,
      successRate: history.length > 0 ? (successful / history.length) * 100 : 0,
      avgExecutionTime: Math.round(avgExecutionTime),
      activeTasks: this.activeTasks.size,
      queueLength: this.taskQueue.length
    };
  }

  clearHistory(): void {
    this.taskHistory = [];
    this.results.clear();
    this.logger.info('Task history cleared');
  }

  setMaxConcurrentTasks(max: number): void {
    this.maxConcurrentTasks = Math.max(1, Math.min(10, max));
    this.logger.info(`Max concurrent tasks set to: ${this.maxConcurrentTasks}`);
  }
}