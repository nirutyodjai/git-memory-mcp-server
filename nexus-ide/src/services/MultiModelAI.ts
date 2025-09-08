/**
 * Multi-Model AI System
 * Multi-model AI management system that can work together and select appropriate models
 * Supports parallel, sequential, and ensemble processing modes
 */

import { EventEmitter } from '../utils/EventEmitter';
import { AIMCPIntegration, AIModelType, AIModelConfig, AICapability } from './AIMCPIntegration';
import { Logger } from '../utils/Logger';

// Task Types
export type AITaskType = 
  | 'code-completion'
  | 'code-generation'
  | 'code-review'
  | 'bug-detection'
  | 'optimization'
  | 'documentation'
  | 'testing'
  | 'refactoring'
  | 'explanation'
  | 'translation'
  | 'analysis';

// Processing Modes
export type ProcessingMode = 
  | 'single'     // Use single model
  | 'parallel'   // Use multiple models simultaneously
  | 'sequential' // Use models sequentially
  | 'ensemble'   // Combine results from multiple models
  | 'cascade'    // Use models in order until good result
  | 'voting';    // Use voting from multiple models

// AI Task Configuration
export interface AITaskConfig {
  id: string;
  type: AITaskType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  mode: ProcessingMode;
  maxModels?: number;
  minConfidence?: number;
  maxCost?: number;
  maxTime?: number;
  fallbackStrategy?: 'retry' | 'downgrade' | 'fail';
  contextWindow?: number;
}

// AI Task Request
export interface AITaskRequest {
  id: string;
  config: AITaskConfig;
  input: {
    text: string;
    context?: {
      files?: string[];
      project?: string;
      language?: string;
      framework?: string;
      previousResults?: AITaskResult[];
    };
    metadata?: Record<string, any>;
  };
  constraints?: {
    excludeModels?: AIModelType[];
    preferredModels?: AIModelType[];
    requiredCapabilities?: AICapability[];
  };
}

// AI Task Result
export interface AITaskResult {
  id: string;
  taskId: string;
  success: boolean;
  results: {
    primary: {
      content: string;
      confidence: number;
      modelUsed: AIModelType;
      processingTime: number;
      cost: number;
    };
    alternatives?: Array<{
      content: string;
      confidence: number;
      modelUsed: AIModelType;
      processingTime: number;
      cost: number;
    }>;
    consensus?: {
      content: string;
      confidence: number;
      agreementScore: number;
      participatingModels: AIModelType[];
    };
  };
  metadata: {
    totalTime: number;
    totalCost: number;
    modelsUsed: AIModelType[];
    mode: ProcessingMode;
    iterations?: number;
  };
  suggestions?: string[];
  followUpTasks?: AITaskConfig[];
  error?: string;
}

// Model Performance Tracker
interface ModelPerformance {
  taskType: AITaskType;
  modelType: AIModelType;
  successRate: number;
  averageConfidence: number;
  averageTime: number;
  averageCost: number;
  totalTasks: number;
  lastUpdated: Date;
}

/**
 * Multi-Model AI System Class
 * จัดการการทำงานของ AI หลายโมเดลอย่างชาญฉลาด
 */
export class MultiModelAI extends EventEmitter {
  private static instance: MultiModelAI;
  private aiIntegration: AIMCPIntegration;
  private logger = Logger.getInstance();
  
  private activeTasks: Map<string, AITaskRequest> = new Map();
  private taskHistory: Map<string, AITaskResult> = new Map();
  private modelPerformance: Map<string, ModelPerformance> = new Map();
  private taskQueue: AITaskRequest[] = [];
  private processingQueue = false;
  
  // Configuration
  private maxConcurrentTasks = 5;
  private defaultTimeout = 30000; // 30 seconds
  private retryAttempts = 3;
  
  private constructor() {
    super();
    this.aiIntegration = AIMCPIntegration.getInstance();
    this.startTaskProcessor();
    this.startPerformanceAnalysis();
  }

  public static getInstance(): MultiModelAI {
    if (!MultiModelAI.instance) {
      MultiModelAI.instance = new MultiModelAI();
    }
    return MultiModelAI.instance;
  }

  /**
   * Execute AI task with multi-model approach
   */
  public async executeTask(request: AITaskRequest): Promise<AITaskResult> {
    this.activeTasks.set(request.id, request);
    
    try {
      this.emit('taskStarted', request);
      
      const result = await this.processTask(request);
      
      // Store result and update performance
      this.taskHistory.set(request.id, result);
      this.updateModelPerformance(request, result);
      
      this.emit('taskCompleted', { request, result });
      return result;
      
    } catch (error) {
      const errorResult: AITaskResult = {
        id: `result_${request.id}`,
        taskId: request.id,
        success: false,
        results: {
          primary: {
            content: '',
            confidence: 0,
            modelUsed: 'gpt-4',
            processingTime: 0,
            cost: 0
          }
        },
        metadata: {
          totalTime: 0,
          totalCost: 0,
          modelsUsed: [],
          mode: request.config.mode
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.emit('taskFailed', { request, error: errorResult });
      return errorResult;
      
    } finally {
      this.activeTasks.delete(request.id);
    }
  }

  /**
   * Process task based on configured mode
   */
  private async processTask(request: AITaskRequest): Promise<AITaskResult> {
    const startTime = Date.now();
    
    switch (request.config.mode) {
      case 'single':
        return this.processSingleModel(request, startTime);
      case 'parallel':
        return this.processParallel(request, startTime);
      case 'sequential':
        return this.processSequential(request, startTime);
      case 'ensemble':
        return this.processEnsemble(request, startTime);
      case 'cascade':
        return this.processCascade(request, startTime);
      case 'voting':
        return this.processVoting(request, startTime);
      default:
        throw new Error(`Unsupported processing mode: ${request.config.mode}`);
    }
  }

  /**
   * Process with single best model
   */
  private async processSingleModel(request: AITaskRequest, startTime: number): Promise<AITaskResult> {
    const bestModel = this.selectBestModel(request);
    
    const mcpRequest = {
      id: `mcp_${request.id}`,
      type: 'query' as const,
      content: request.input.text,
      context: request.input.context,
      requiredCapabilities: this.getRequiredCapabilities(request.config.type),
      priority: request.config.priority
    };
    
    const response = await this.aiIntegration.processRequest(mcpRequest);
    
    return {
      id: `result_${request.id}`,
      taskId: request.id,
      success: true,
      results: {
        primary: {
          content: response.content,
          confidence: response.confidence,
          modelUsed: response.modelUsed,
          processingTime: response.responseTime,
          cost: response.cost
        }
      },
      metadata: {
        totalTime: Date.now() - startTime,
        totalCost: response.cost,
        modelsUsed: [response.modelUsed],
        mode: 'single'
      },
      suggestions: response.suggestions,
      followUpTasks: this.generateFollowUpTasks(request, response)
    };
  }

  /**
   * Process with multiple models in parallel
   */
  private async processParallel(request: AITaskRequest, startTime: number): Promise<AITaskResult> {
    const models = this.selectMultipleModels(request);
    const maxModels = Math.min(models.length, request.config.maxModels || 3);
    
    const promises = models.slice(0, maxModels).map(async (modelType) => {
      const mcpRequest = {
        id: `mcp_${request.id}_${modelType}`,
        type: 'query' as const,
        content: request.input.text,
        context: request.input.context,
        requiredCapabilities: this.getRequiredCapabilities(request.config.type),
        priority: request.config.priority
      };
      
      try {
        return await this.aiIntegration.processRequest(mcpRequest);
      } catch (error) {
        this.logger.warn(`Model ${modelType} failed for task ${request.id}`, { error });
        return null;
      }
    });
    
    const responses = (await Promise.all(promises)).filter(r => r !== null);
    
    if (responses.length === 0) {
      throw new Error('All models failed to process the request');
    }
    
    // Select best response
    const bestResponse = responses.reduce((best, current) => 
      current!.confidence > best!.confidence ? current : best
    )!;
    
    // Prepare alternatives
    const alternatives = responses
      .filter(r => r !== bestResponse)
      .map(r => ({
        content: r!.content,
        confidence: r!.confidence,
        modelUsed: r!.modelUsed,
        processingTime: r!.responseTime,
        cost: r!.cost
      }));
    
    return {
      id: `result_${request.id}`,
      taskId: request.id,
      success: true,
      results: {
        primary: {
          content: bestResponse.content,
          confidence: bestResponse.confidence,
          modelUsed: bestResponse.modelUsed,
          processingTime: bestResponse.responseTime,
          cost: bestResponse.cost
        },
        alternatives
      },
      metadata: {
        totalTime: Date.now() - startTime,
        totalCost: responses.reduce((sum, r) => sum + r!.cost, 0),
        modelsUsed: responses.map(r => r!.modelUsed),
        mode: 'parallel'
      }
    };
  }

  /**
   * Process with models sequentially
   */
  private async processSequential(request: AITaskRequest, startTime: number): Promise<AITaskResult> {
    const models = this.selectMultipleModels(request);
    const results: any[] = [];
    let currentInput = request.input.text;
    let totalCost = 0;
    
    for (const modelType of models) {
      const mcpRequest = {
        id: `mcp_${request.id}_${modelType}_${results.length}`,
        type: 'query' as const,
        content: currentInput,
        context: {
          ...request.input.context,
          previousResults: results
        },
        requiredCapabilities: this.getRequiredCapabilities(request.config.type),
        priority: request.config.priority
      };
      
      try {
        const response = await this.aiIntegration.processRequest(mcpRequest);
        results.push(response);
        totalCost += response.cost;
        
        // Use output as input for next model
        currentInput = response.content;
        
        // Stop if we have high confidence
        if (response.confidence >= (request.config.minConfidence || 0.9)) {
          break;
        }
      } catch (error) {
        this.logger.warn(`Sequential model ${modelType} failed`, { error });
        continue;
      }
    }
    
    if (results.length === 0) {
      throw new Error('All sequential models failed');
    }
    
    const finalResult = results[results.length - 1];
    
    return {
      id: `result_${request.id}`,
      taskId: request.id,
      success: true,
      results: {
        primary: {
          content: finalResult.content,
          confidence: finalResult.confidence,
          modelUsed: finalResult.modelUsed,
          processingTime: finalResult.responseTime,
          cost: finalResult.cost
        }
      },
      metadata: {
        totalTime: Date.now() - startTime,
        totalCost,
        modelsUsed: results.map(r => r.modelUsed),
        mode: 'sequential',
        iterations: results.length
      }
    };
  }

  /**
   * Process with ensemble approach
   */
  private async processEnsemble(request: AITaskRequest, startTime: number): Promise<AITaskResult> {
    // Similar to parallel but combines results intelligently
    const parallelResult = await this.processParallel(request, startTime);
    
    if (!parallelResult.results.alternatives || parallelResult.results.alternatives.length === 0) {
      return parallelResult;
    }
    
    // Combine results using weighted average based on confidence
    const allResults = [parallelResult.results.primary, ...parallelResult.results.alternatives];
    const totalWeight = allResults.reduce((sum, r) => sum + r.confidence, 0);
    
    // Simple ensemble - in practice, this would be more sophisticated
    const ensembleContent = this.combineResults(allResults);
    const ensembleConfidence = totalWeight / allResults.length;
    
    return {
      ...parallelResult,
      results: {
        ...parallelResult.results,
        consensus: {
          content: ensembleContent,
          confidence: ensembleConfidence,
          agreementScore: this.calculateAgreementScore(allResults),
          participatingModels: allResults.map(r => r.modelUsed)
        }
      },
      metadata: {
        ...parallelResult.metadata,
        mode: 'ensemble'
      }
    };
  }

  /**
   * Process with cascade approach
   */
  private async processCascade(request: AITaskRequest, startTime: number): Promise<AITaskResult> {
    const models = this.selectMultipleModels(request).sort((a, b) => {
      const perfA = this.getModelPerformance(request.config.type, a);
      const perfB = this.getModelPerformance(request.config.type, b);
      return perfB.successRate - perfA.successRate;
    });
    
    for (const modelType of models) {
      try {
        const mcpRequest = {
          id: `mcp_${request.id}_${modelType}`,
          type: 'query' as const,
          content: request.input.text,
          context: request.input.context,
          requiredCapabilities: this.getRequiredCapabilities(request.config.type),
          priority: request.config.priority
        };
        
        const response = await this.aiIntegration.processRequest(mcpRequest);
        
        // If confidence is high enough, use this result
        if (response.confidence >= (request.config.minConfidence || 0.8)) {
          return {
            id: `result_${request.id}`,
            taskId: request.id,
            success: true,
            results: {
              primary: {
                content: response.content,
                confidence: response.confidence,
                modelUsed: response.modelUsed,
                processingTime: response.responseTime,
                cost: response.cost
              }
            },
            metadata: {
              totalTime: Date.now() - startTime,
              totalCost: response.cost,
              modelsUsed: [response.modelUsed],
              mode: 'cascade'
            }
          };
        }
      } catch (error) {
        this.logger.warn(`Cascade model ${modelType} failed`, { error });
        continue;
      }
    }
    
    throw new Error('All cascade models failed to meet confidence threshold');
  }

  /**
   * Process with voting approach
   */
  private async processVoting(request: AITaskRequest, startTime: number): Promise<AITaskResult> {
    const parallelResult = await this.processParallel(request, startTime);
    
    if (!parallelResult.results.alternatives) {
      return parallelResult;
    }
    
    // Implement voting logic
    const allResults = [parallelResult.results.primary, ...parallelResult.results.alternatives];
    const votingResult = this.performVoting(allResults);
    
    return {
      ...parallelResult,
      results: {
        ...parallelResult.results,
        primary: votingResult
      },
      metadata: {
        ...parallelResult.metadata,
        mode: 'voting'
      }
    };
  }

  /**
   * Select best model for task
   */
  private selectBestModel(request: AITaskRequest): AIModelType {
    const availableModels = this.aiIntegration.getAvailableModels();
    const requiredCapabilities = this.getRequiredCapabilities(request.config.type);
    
    const suitableModels = availableModels.filter(model => 
      requiredCapabilities.every(cap => model.capabilities.includes(cap))
    );
    
    if (suitableModels.length === 0) {
      throw new Error('No suitable models found for task');
    }
    
    // Score models based on performance for this task type
    const scoredModels = suitableModels.map(model => {
      const performance = this.getModelPerformance(request.config.type, model.type);
      const score = performance.successRate * 0.4 + 
                   performance.averageConfidence * 0.3 + 
                   (1 / performance.averageTime) * 0.2 + 
                   (1 / performance.averageCost) * 0.1;
      return { model, score };
    });
    
    return scoredModels.sort((a, b) => b.score - a.score)[0].model.type;
  }

  /**
   * Select multiple models for task
   */
  private selectMultipleModels(request: AITaskRequest): AIModelType[] {
    const availableModels = this.aiIntegration.getAvailableModels();
    const requiredCapabilities = this.getRequiredCapabilities(request.config.type);
    
    return availableModels
      .filter(model => requiredCapabilities.every(cap => model.capabilities.includes(cap)))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, request.config.maxModels || 3)
      .map(model => model.type);
  }

  /**
   * Get required capabilities for task type
   */
  private getRequiredCapabilities(taskType: AITaskType): AICapability[] {
    const capabilityMap: Record<AITaskType, AICapability[]> = {
      'code-completion': ['code-generation'],
      'code-generation': ['code-generation'],
      'code-review': ['code-review'],
      'bug-detection': ['debugging'],
      'optimization': ['optimization'],
      'documentation': ['documentation'],
      'testing': ['testing'],
      'refactoring': ['refactoring'],
      'explanation': ['explanation'],
      'translation': ['translation'],
      'analysis': ['code-review', 'debugging']
    };
    
    return capabilityMap[taskType] || ['conversation'];
  }

  /**
   * Get model performance for specific task type
   */
  private getModelPerformance(taskType: AITaskType, modelType: AIModelType): ModelPerformance {
    const key = `${taskType}_${modelType}`;
    return this.modelPerformance.get(key) || {
      taskType,
      modelType,
      successRate: 0.8,
      averageConfidence: 0.7,
      averageTime: 2000,
      averageCost: 0.01,
      totalTasks: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Update model performance metrics
   */
  private updateModelPerformance(request: AITaskRequest, result: AITaskResult): void {
    const key = `${request.config.type}_${result.results.primary.modelUsed}`;
    const current = this.getModelPerformance(request.config.type, result.results.primary.modelUsed);
    const total = current.totalTasks + 1;
    
    this.modelPerformance.set(key, {
      ...current,
      successRate: (current.successRate * current.totalTasks + (result.success ? 1 : 0)) / total,
      averageConfidence: (current.averageConfidence * current.totalTasks + result.results.primary.confidence) / total,
      averageTime: (current.averageTime * current.totalTasks + result.results.primary.processingTime) / total,
      averageCost: (current.averageCost * current.totalTasks + result.results.primary.cost) / total,
      totalTasks: total,
      lastUpdated: new Date()
    });
  }

  /**
   * Combine results from multiple models
   */
  private combineResults(results: Array<{ content: string; confidence: number; modelUsed: AIModelType }>): string {
    // Simple implementation - in practice, this would use more sophisticated NLP techniques
    const weightedResults = results.map(r => ({ ...r, weight: r.confidence }));
    const totalWeight = weightedResults.reduce((sum, r) => sum + r.weight, 0);
    
    // For now, just return the highest confidence result
    return weightedResults.sort((a, b) => b.confidence - a.confidence)[0].content;
  }

  /**
   * Calculate agreement score between results
   */
  private calculateAgreementScore(results: Array<{ content: string; confidence: number }>): number {
    // Simple implementation - could use semantic similarity
    if (results.length < 2) return 1.0;
    
    // For now, just return average confidence
    return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  }

  /**
   * Perform voting on results
   */
  private performVoting(results: Array<{ content: string; confidence: number; modelUsed: AIModelType }>): {
    content: string;
    confidence: number;
    modelUsed: AIModelType;
    processingTime: number;
    cost: number;
  } {
    // Simple voting - return result with highest confidence
    const winner = results.sort((a, b) => b.confidence - a.confidence)[0];
    return {
      content: winner.content,
      confidence: winner.confidence,
      modelUsed: winner.modelUsed,
      processingTime: 0,
      cost: 0
    };
  }

  /**
   * Generate follow-up tasks
   */
  private generateFollowUpTasks(request: AITaskRequest, response: any): AITaskConfig[] {
    const followUps: AITaskConfig[] = [];
    
    // Example follow-up task generation
    if (request.config.type === 'code-generation') {
      followUps.push({
        id: `followup_${request.id}_review`,
        type: 'code-review',
        priority: 'medium',
        mode: 'single'
      });
    }
    
    return followUps;
  }

  /**
   * Start task processor
   */
  private startTaskProcessor(): void {
    setInterval(async () => {
      if (this.processingQueue || this.taskQueue.length === 0) return;
      if (this.activeTasks.size >= this.maxConcurrentTasks) return;
      
      this.processingQueue = true;
      
      try {
        const task = this.taskQueue.shift();
        if (task) {
          await this.executeTask(task);
        }
      } catch (error) {
        this.logger.error('Task processor error', { error });
      } finally {
        this.processingQueue = false;
      }
    }, 1000);
  }

  /**
   * Start performance analysis
   */
  private startPerformanceAnalysis(): void {
    setInterval(() => {
      this.emit('performanceAnalysis', {
        activeTasks: this.activeTasks.size,
        queuedTasks: this.taskQueue.length,
        modelPerformance: Object.fromEntries(this.modelPerformance),
        recentTasks: Array.from(this.taskHistory.values()).slice(-10)
      });
    }, 60000); // Every minute
  }

  /**
   * Add task to queue
   */
  public queueTask(request: AITaskRequest): void {
    this.taskQueue.push(request);
    this.emit('taskQueued', request);
  }

  /**
   * Get task status
   */
  public getTaskStatus(taskId: string): 'queued' | 'active' | 'completed' | 'not_found' {
    if (this.taskQueue.some(t => t.id === taskId)) return 'queued';
    if (this.activeTasks.has(taskId)) return 'active';
    if (this.taskHistory.has(taskId)) return 'completed';
    return 'not_found';
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    activeTasks: number;
    queuedTasks: number;
    completedTasks: number;
    modelPerformance: Record<string, ModelPerformance>;
  } {
    return {
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.taskHistory.size,
      modelPerformance: Object.fromEntries(this.modelPerformance)
    };
  }
}

// Export singleton instance
export const multiModelAI = MultiModelAI.getInstance();