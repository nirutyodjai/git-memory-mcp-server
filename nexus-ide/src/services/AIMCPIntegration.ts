/**
 * AI-MCP Integration Core
 * Core system that connects MCP Servers with multiple AI Models
 * Supports GPT-4, Claude, Llama, Gemini and other AI Models
 */

import { EventEmitter } from '../utils/EventEmitter';
import { MCPServerRegistry } from './MCPServerRegistry';
import { Logger } from '../utils/Logger';

// AI Model Types
export type AIModelType = 'gpt-4' | 'gpt-4-turbo' | 'claude-3' | 'claude-3.5-sonnet' | 'llama-3' | 'gemini-pro' | 'custom';

// AI Model Configuration
export interface AIModelConfig {
  type: AIModelType;
  name: string;
  apiKey?: string;
  endpoint?: string;
  maxTokens: number;
  temperature: number;
  capabilities: AICapability[];
  priority: number; // Higher number = higher priority
  costPerToken: number;
  responseTime: number; // Average response time in ms
}

// AI Capabilities
export type AICapability = 
  | 'code-generation'
  | 'code-review'
  | 'debugging'
  | 'documentation'
  | 'translation'
  | 'optimization'
  | 'testing'
  | 'refactoring'
  | 'explanation'
  | 'conversation';

// MCP Integration Request
export interface MCPIntegrationRequest {
  id: string;
  type: 'query' | 'command' | 'analysis';
  content: string;
  context?: {
    files?: string[];
    project?: string;
    language?: string;
    framework?: string;
  };
  requiredCapabilities: AICapability[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  maxResponseTime?: number;
  maxCost?: number;
}

// AI Response
export interface AIResponse {
  id: string;
  modelUsed: AIModelType;
  content: string;
  confidence: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  responseTime: number;
  mcpData?: any;
  suggestions?: string[];
  followUpActions?: string[];
}

// Model Selection Strategy
export type ModelSelectionStrategy = 
  | 'best-performance' // เลือกโมเดลที่ดีที่สุด
  | 'cost-effective'   // เลือกโมเดลที่ประหยัดที่สุด
  | 'fastest'          // เลือกโมเดลที่เร็วที่สุด
  | 'balanced'         // สมดุลระหว่างคุณภาพและต้นทุน
  | 'multi-model';     // ใช้หลายโมเดลร่วมกัน

/**
 * AI-MCP Integration Core Class
 * จัดการการเชื่อมต่อระหว่าง AI Models และ MCP Servers
 */
export class AIMCPIntegration extends EventEmitter {
  private static instance: AIMCPIntegration;
  private models: Map<AIModelType, AIModelConfig> = new Map();
  private activeRequests: Map<string, MCPIntegrationRequest> = new Map();
  private modelPerformance: Map<AIModelType, {
    successRate: number;
    averageResponseTime: number;
    averageCost: number;
    totalRequests: number;
  }> = new Map();
  
  private strategy: ModelSelectionStrategy = 'balanced';
  private logger = Logger.getInstance();
  private mcpRegistry = MCPServerRegistry.getInstance();
  
  private constructor() {
    super();
    this.initializeDefaultModels();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): AIMCPIntegration {
    if (!AIMCPIntegration.instance) {
      AIMCPIntegration.instance = new AIMCPIntegration();
    }
    return AIMCPIntegration.instance;
  }

  /**
   * Initialize default AI models
   */
  private initializeDefaultModels(): void {
    // GPT-4 Models
    this.registerModel({
      type: 'gpt-4',
      name: 'GPT-4',
      maxTokens: 8192,
      temperature: 0.7,
      capabilities: ['code-generation', 'code-review', 'debugging', 'documentation', 'conversation'],
      priority: 9,
      costPerToken: 0.00003,
      responseTime: 2000
    });

    this.registerModel({
      type: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      maxTokens: 128000,
      temperature: 0.7,
      capabilities: ['code-generation', 'code-review', 'debugging', 'documentation', 'conversation', 'analysis'],
      priority: 10,
      costPerToken: 0.00001,
      responseTime: 1500
    });

    // Claude Models
    this.registerModel({
      type: 'claude-3.5-sonnet',
      name: 'Claude 3.5 Sonnet',
      maxTokens: 200000,
      temperature: 0.7,
      capabilities: ['code-generation', 'code-review', 'debugging', 'refactoring', 'optimization'],
      priority: 9,
      costPerToken: 0.000015,
      responseTime: 1800
    });

    // Llama Models
    this.registerModel({
      type: 'llama-3',
      name: 'Llama 3',
      maxTokens: 8192,
      temperature: 0.7,
      capabilities: ['code-generation', 'explanation', 'conversation'],
      priority: 7,
      costPerToken: 0.000005,
      responseTime: 3000
    });

    // Gemini Models
    this.registerModel({
      type: 'gemini-pro',
      name: 'Gemini Pro',
      maxTokens: 32768,
      temperature: 0.7,
      capabilities: ['code-generation', 'code-review', 'debugging', 'testing'],
      priority: 8,
      costPerToken: 0.00001,
      responseTime: 2200
    });

    this.logger.info('AI Models initialized', {
      totalModels: this.models.size,
      models: Array.from(this.models.keys())
    });
  }

  /**
   * Register a new AI model
   */
  public registerModel(config: AIModelConfig): void {
    this.models.set(config.type, config);
    this.modelPerformance.set(config.type, {
      successRate: 1.0,
      averageResponseTime: config.responseTime,
      averageCost: config.costPerToken,
      totalRequests: 0
    });
    
    this.emit('modelRegistered', config);
    this.logger.info(`AI Model registered: ${config.name}`);
  }

  /**
   * Set model selection strategy
   */
  public setStrategy(strategy: ModelSelectionStrategy): void {
    this.strategy = strategy;
    this.emit('strategyChanged', strategy);
    this.logger.info(`Model selection strategy changed to: ${strategy}`);
  }

  /**
   * Process AI request with MCP integration
   */
  public async processRequest(request: MCPIntegrationRequest): Promise<AIResponse> {
    this.activeRequests.set(request.id, request);
    
    try {
      // 1. Select appropriate AI model(s)
      const selectedModels = await this.selectModels(request);
      
      // 2. Gather MCP data if needed
      const mcpData = await this.gatherMCPData(request);
      
      // 3. Process with selected model(s)
      const response = await this.processWithModels(request, selectedModels, mcpData);
      
      // 4. Update performance metrics
      this.updatePerformanceMetrics(response.modelUsed, response);
      
      this.emit('requestCompleted', { request, response });
      return response;
      
    } catch (error) {
      this.logger.error('Failed to process AI request', { requestId: request.id, error });
      throw error;
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Select appropriate AI models based on request and strategy
   */
  private async selectModels(request: MCPIntegrationRequest): Promise<AIModelType[]> {
    const availableModels = Array.from(this.models.entries())
      .filter(([_, config]) => 
        request.requiredCapabilities.every(cap => config.capabilities.includes(cap))
      )
      .sort(([_, a], [__, b]) => b.priority - a.priority);

    if (availableModels.length === 0) {
      throw new Error('No suitable AI model found for the request');
    }

    switch (this.strategy) {
      case 'best-performance':
        return [availableModels[0][0]];
        
      case 'cost-effective':
        const cheapest = availableModels.sort(([_, a], [__, b]) => a.costPerToken - b.costPerToken)[0];
        return [cheapest[0]];
        
      case 'fastest':
        const fastest = availableModels.sort(([_, a], [__, b]) => a.responseTime - b.responseTime)[0];
        return [fastest[0]];
        
      case 'balanced':
        // Score based on performance, cost, and speed
        const scored = availableModels.map(([type, config]) => {
          const perf = this.modelPerformance.get(type)!;
          const score = (perf.successRate * 0.4) + 
                       ((1 / config.costPerToken) * 0.3) + 
                       ((1 / config.responseTime) * 0.3);
          return { type, score };
        }).sort((a, b) => b.score - a.score);
        return [scored[0].type];
        
      case 'multi-model':
        // Use top 2-3 models for comparison
        return availableModels.slice(0, Math.min(3, availableModels.length)).map(([type]) => type);
        
      default:
        return [availableModels[0][0]];
    }
  }

  /**
   * Gather relevant data from MCP servers
   */
  private async gatherMCPData(request: MCPIntegrationRequest): Promise<any> {
    if (!request.context) return null;

    try {
      const mcpData: any = {};
      
      // Get project context
      if (request.context.project) {
        mcpData.project = await this.mcpRegistry.getProjectInfo(request.context.project);
      }
      
      // Get file contents
      if (request.context.files) {
        mcpData.files = await Promise.all(
          request.context.files.map(async (file) => {
            return {
              path: file,
              content: await this.mcpRegistry.getFileContent(file),
              metadata: await this.mcpRegistry.getFileMetadata(file)
            };
          })
        );
      }
      
      return mcpData;
    } catch (error) {
      this.logger.warn('Failed to gather MCP data', { error });
      return null;
    }
  }

  /**
   * Process request with selected models
   */
  private async processWithModels(
    request: MCPIntegrationRequest, 
    modelTypes: AIModelType[], 
    mcpData: any
  ): Promise<AIResponse> {
    if (modelTypes.length === 1) {
      return this.processWithSingleModel(request, modelTypes[0], mcpData);
    } else {
      return this.processWithMultipleModels(request, modelTypes, mcpData);
    }
  }

  /**
   * Process with single model
   */
  private async processWithSingleModel(
    request: MCPIntegrationRequest, 
    modelType: AIModelType, 
    mcpData: any
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const model = this.models.get(modelType)!;
    
    // Simulate AI processing (replace with actual AI API calls)
    const response = await this.callAIModel(model, request, mcpData);
    
    const responseTime = Date.now() - startTime;
    
    return {
      id: request.id,
      modelUsed: modelType,
      content: response.content,
      confidence: response.confidence,
      tokens: response.tokens,
      cost: response.tokens.total * model.costPerToken,
      responseTime,
      mcpData,
      suggestions: response.suggestions,
      followUpActions: response.followUpActions
    };
  }

  /**
   * Process with multiple models and combine results
   */
  private async processWithMultipleModels(
    request: MCPIntegrationRequest, 
    modelTypes: AIModelType[], 
    mcpData: any
  ): Promise<AIResponse> {
    const responses = await Promise.all(
      modelTypes.map(type => this.processWithSingleModel(request, type, mcpData))
    );
    
    // Combine responses (simple implementation - can be enhanced)
    const bestResponse = responses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    // Merge suggestions from all models
    const allSuggestions = responses.flatMap(r => r.suggestions || []);
    const uniqueSuggestions = [...new Set(allSuggestions)];
    
    return {
      ...bestResponse,
      suggestions: uniqueSuggestions,
      followUpActions: responses.flatMap(r => r.followUpActions || [])
    };
  }

  /**
   * Call AI model API (placeholder - implement actual API calls)
   */
  private async callAIModel(model: AIModelConfig, request: MCPIntegrationRequest, mcpData: any): Promise<{
    content: string;
    confidence: number;
    tokens: { input: number; output: number; total: number };
    suggestions?: string[];
    followUpActions?: string[];
  }> {
    // This is a placeholder implementation
    // In real implementation, this would call the actual AI model APIs
    
    await new Promise(resolve => setTimeout(resolve, model.responseTime));
    
    return {
      content: `AI response from ${model.name} for: ${request.content}`,
      confidence: 0.85,
      tokens: {
        input: request.content.length / 4, // Rough estimation
        output: 100,
        total: (request.content.length / 4) + 100
      },
      suggestions: ['Consider adding error handling', 'Add unit tests'],
      followUpActions: ['Review code', 'Run tests']
    };
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(modelType: AIModelType, response: AIResponse): void {
    const current = this.modelPerformance.get(modelType)!;
    const total = current.totalRequests + 1;
    
    this.modelPerformance.set(modelType, {
      successRate: (current.successRate * current.totalRequests + 1) / total,
      averageResponseTime: (current.averageResponseTime * current.totalRequests + response.responseTime) / total,
      averageCost: (current.averageCost * current.totalRequests + response.cost) / total,
      totalRequests: total
    });
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.emit('performanceUpdate', {
        models: Object.fromEntries(this.modelPerformance),
        activeRequests: this.activeRequests.size,
        strategy: this.strategy
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Get model performance statistics
   */
  public getPerformanceStats(): Map<AIModelType, any> {
    return new Map(this.modelPerformance);
  }

  /**
   * Get available models
   */
  public getAvailableModels(): AIModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get active requests count
   */
  public getActiveRequestsCount(): number {
    return this.activeRequests.size;
  }
}

// Export singleton instance
export const aiMCPIntegration = AIMCPIntegration.getInstance();