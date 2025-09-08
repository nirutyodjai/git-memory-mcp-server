/**
 * AI Service
 * 
 * Advanced AI service for NEXUS IDE with multi-model support and context-aware capabilities.
 * Handles code completion, generation, analysis, and intelligent suggestions.
 * 
 * Features:
 * - Multi-model AI support (GPT-4, Claude, Llama, etc.)
 * - Context-aware code completion
 * - Natural language programming
 * - Code analysis and optimization
 * - Bug detection and fixes
 * - Documentation generation
 * - Test case generation
 * - Performance optimization
 * - Security vulnerability detection
 * - Code refactoring suggestions
 */

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'meta' | 'local';
  type: 'completion' | 'chat' | 'embedding' | 'multimodal';
  capabilities: string[];
  maxTokens: number;
  costPerToken: number;
  latency: number;
  quality: number;
  isAvailable: boolean;
  endpoint?: string;
  apiKey?: string;
}

export interface CodeContext {
  filePath: string;
  language: string;
  content: string;
  cursorPosition: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  projectInfo: {
    name: string;
    type: string;
    dependencies: string[];
    framework?: string;
    version?: string;
  };
  gitInfo?: {
    branch: string;
    lastCommit: string;
    changes: string[];
  };
  relatedFiles: string[];
  imports: string[];
  functions: string[];
  classes: string[];
  variables: string[];
}

export interface AIRequest {
  id: string;
  type: 'completion' | 'generation' | 'analysis' | 'explanation' | 'optimization' | 'debug' | 'test' | 'refactor';
  prompt: string;
  context: CodeContext;
  model?: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stream?: boolean;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  userId: string;
}

export interface AIResponse {
  id: string;
  requestId: string;
  type: AIRequest['type'];
  content: string;
  confidence: number;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  metadata?: {
    reasoning?: string;
    alternatives?: string[];
    suggestions?: string[];
    warnings?: string[];
  };
  processingTime: number;
  timestamp: number;
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'fix' | 'optimization' | 'refactor' | 'security';
  title: string;
  description: string;
  code: string;
  position: {
    line: number;
    column: number;
  };
  range?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  tags: string[];
  model: string;
  timestamp: number;
}

export interface ProjectAnalysis {
  id: string;
  projectPath: string;
  summary: {
    totalFiles: number;
    totalLines: number;
    languages: { [key: string]: number };
    complexity: 'low' | 'medium' | 'high';
    maintainability: number;
    testCoverage: number;
  };
  issues: {
    bugs: Array<{
      file: string;
      line: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      type: string;
      message: string;
      suggestion?: string;
    }>;
    security: Array<{
      file: string;
      line: number;
      vulnerability: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      fix?: string;
    }>;
    performance: Array<{
      file: string;
      line: number;
      issue: string;
      impact: 'low' | 'medium' | 'high';
      suggestion: string;
    }>;
    codeSmells: Array<{
      file: string;
      line: number;
      smell: string;
      description: string;
      refactoring?: string;
    }>;
  };
  recommendations: {
    architecture: string[];
    dependencies: string[];
    testing: string[];
    documentation: string[];
    performance: string[];
  };
  generatedAt: Date;
}

interface AIServiceEvents {
  'suggestion-generated': (suggestion: CodeSuggestion) => void;
  'analysis-completed': (analysis: ProjectAnalysis) => void;
  'model-changed': (model: AIModel) => void;
  'error': (error: Error, context?: string) => void;
  'usage-updated': (usage: { tokens: number; cost: number }) => void;
}

class AIService {
  private models: Map<string, AIModel> = new Map();
  private activeModel: AIModel | null = null;
  private requestQueue: AIRequest[] = [];
  private responseCache: Map<string, AIResponse> = new Map();
  private eventListeners: Map<keyof AIServiceEvents, Function[]> = new Map();
  private isProcessing = false;
  private contextCache: Map<string, CodeContext> = new Map();
  private projectAnalysisCache: Map<string, ProjectAnalysis> = new Map();
  private usageStats = {
    totalTokens: 0,
    totalCost: 0,
    requestCount: 0,
    averageLatency: 0
  };

  constructor() {
    this.initializeEventListeners();
    this.initializeModels();
    this.startRequestProcessor();
  }

  /**
   * Initialize available AI models
   */
  private initializeModels(): void {
    const defaultModels: AIModel[] = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        type: 'chat',
        capabilities: ['completion', 'generation', 'analysis', 'explanation'],
        maxTokens: 128000,
        costPerToken: 0.00003,
        latency: 2000,
        quality: 0.95,
        isAvailable: true,
        endpoint: 'https://api.openai.com/v1/chat/completions'
      },
      {
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'anthropic',
        type: 'chat',
        capabilities: ['completion', 'generation', 'analysis', 'explanation', 'refactor'],
        maxTokens: 200000,
        costPerToken: 0.000015,
        latency: 1800,
        quality: 0.93,
        isAvailable: true,
        endpoint: 'https://api.anthropic.com/v1/messages'
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'google',
        type: 'multimodal',
        capabilities: ['completion', 'generation', 'analysis', 'multimodal'],
        maxTokens: 32000,
        costPerToken: 0.0000005,
        latency: 1500,
        quality: 0.88,
        isAvailable: true,
        endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
      },
      {
        id: 'llama-3-70b',
        name: 'Llama 3 70B',
        provider: 'meta',
        type: 'chat',
        capabilities: ['completion', 'generation', 'analysis'],
        maxTokens: 8192,
        costPerToken: 0.0000008,
        latency: 3000,
        quality: 0.85,
        isAvailable: false, // Requires local setup
        endpoint: 'http://localhost:11434/api/generate'
      },
      {
        id: 'codellama-34b',
        name: 'CodeLlama 34B',
        provider: 'meta',
        type: 'completion',
        capabilities: ['completion', 'generation'],
        maxTokens: 16384,
        costPerToken: 0.0000005,
        latency: 2500,
        quality: 0.82,
        isAvailable: false, // Requires local setup
        endpoint: 'http://localhost:11434/api/generate'
      }
    ];

    defaultModels.forEach(model => {
      this.models.set(model.id, model);
    });

    // Set default active model
    this.activeModel = this.models.get('gpt-4-turbo') || null;
  }

  /**
   * Add or update an AI model
   */
  addModel(model: AIModel): void {
    this.models.set(model.id, model);
    
    if (!this.activeModel && model.isAvailable) {
      this.activeModel = model;
      this.emit('model-changed', model);
    }
  }

  /**
   * Set active AI model
   */
  setActiveModel(modelId: string): boolean {
    const model = this.models.get(modelId);
    if (model && model.isAvailable) {
      this.activeModel = model;
      this.emit('model-changed', model);
      return true;
    }
    return false;
  }

  /**
   * Get available models
   */
  getAvailableModels(): AIModel[] {
    return Array.from(this.models.values()).filter(model => model.isAvailable);
  }

  /**
   * Get active model
   */
  getActiveModel(): AIModel | null {
    return this.activeModel;
  }

  /**
   * Generate code completion
   */
  async generateCompletion(context: CodeContext, options?: AIRequest['options']): Promise<AIResponse> {
    const request: AIRequest = {
      id: `completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'completion',
      prompt: this.buildCompletionPrompt(context),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.2,
        maxTokens: 500,
        stream: false,
        ...options
      },
      priority: 'high',
      timestamp: Date.now(),
      userId: 'current-user' // Should be replaced with actual user ID
    };

    return this.processRequest(request);
  }

  /**
   * Generate code from natural language
   */
  async generateCode(description: string, context: CodeContext, options?: AIRequest['options']): Promise<AIResponse> {
    const request: AIRequest = {
      id: `generation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'generation',
      prompt: this.buildGenerationPrompt(description, context),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.3,
        maxTokens: 1000,
        ...options
      },
      priority: 'medium',
      timestamp: Date.now(),
      userId: 'current-user'
    };

    return this.processRequest(request);
  }

  /**
   * Analyze code for issues and improvements
   */
  async analyzeCode(context: CodeContext): Promise<AIResponse> {
    const request: AIRequest = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'analysis',
      prompt: this.buildAnalysisPrompt(context),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.1,
        maxTokens: 1500
      },
      priority: 'medium',
      timestamp: Date.now(),
      userId: 'current-user'
    };

    return this.processRequest(request);
  }

  /**
   * Explain code functionality
   */
  async explainCode(context: CodeContext): Promise<AIResponse> {
    const request: AIRequest = {
      id: `explanation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'explanation',
      prompt: this.buildExplanationPrompt(context),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.2,
        maxTokens: 800
      },
      priority: 'low',
      timestamp: Date.now(),
      userId: 'current-user'
    };

    return this.processRequest(request);
  }

  /**
   * Optimize code performance
   */
  async optimizeCode(context: CodeContext): Promise<AIResponse> {
    const request: AIRequest = {
      id: `optimization-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'optimization',
      prompt: this.buildOptimizationPrompt(context),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.2,
        maxTokens: 1200
      },
      priority: 'medium',
      timestamp: Date.now(),
      userId: 'current-user'
    };

    return this.processRequest(request);
  }

  /**
   * Debug code and suggest fixes
   */
  async debugCode(context: CodeContext, error?: string): Promise<AIResponse> {
    const request: AIRequest = {
      id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'debug',
      prompt: this.buildDebugPrompt(context, error),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.1,
        maxTokens: 1000
      },
      priority: 'high',
      timestamp: Date.now(),
      userId: 'current-user'
    };

    return this.processRequest(request);
  }

  /**
   * Generate test cases
   */
  async generateTests(context: CodeContext): Promise<AIResponse> {
    const request: AIRequest = {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'test',
      prompt: this.buildTestPrompt(context),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.3,
        maxTokens: 1500
      },
      priority: 'low',
      timestamp: Date.now(),
      userId: 'current-user'
    };

    return this.processRequest(request);
  }

  /**
   * Refactor code
   */
  async refactorCode(context: CodeContext, refactorType?: string): Promise<AIResponse> {
    const request: AIRequest = {
      id: `refactor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'refactor',
      prompt: this.buildRefactorPrompt(context, refactorType),
      context,
      model: this.activeModel?.id,
      options: {
        temperature: 0.2,
        maxTokens: 1200
      },
      priority: 'medium',
      timestamp: Date.now(),
      userId: 'current-user'
    };

    return this.processRequest(request);
  }

  /**
   * Analyze entire project
   */
  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    // Check cache first
    const cached = this.projectAnalysisCache.get(projectPath);
    if (cached && Date.now() - cached.generatedAt.getTime() < 3600000) { // 1 hour cache
      return cached;
    }

    try {
      // This would typically involve scanning the project files
      // For now, we'll create a mock analysis
      const analysis: ProjectAnalysis = {
        id: `analysis-${Date.now()}`,
        projectPath,
        summary: {
          totalFiles: 0,
          totalLines: 0,
          languages: {},
          complexity: 'medium',
          maintainability: 0.75,
          testCoverage: 0.60
        },
        issues: {
          bugs: [],
          security: [],
          performance: [],
          codeSmells: []
        },
        recommendations: {
          architecture: [],
          dependencies: [],
          testing: [],
          documentation: [],
          performance: []
        },
        generatedAt: new Date()
      };

      // Cache the analysis
      this.projectAnalysisCache.set(projectPath, analysis);
      this.emit('analysis-completed', analysis);
      
      return analysis;
    } catch (error) {
      console.error('Failed to analyze project:', error);
      this.emit('error', error as Error, 'project-analysis');
      throw error;
    }
  }

  /**
   * Get real-time suggestions for current context
   */
  async getSuggestions(context: CodeContext): Promise<CodeSuggestion[]> {
    try {
      const suggestions: CodeSuggestion[] = [];

      // Generate completion suggestion
      if (context.content.trim()) {
        const completionResponse = await this.generateCompletion(context, { maxTokens: 200 });
        
        if (completionResponse.confidence > 0.7) {
          suggestions.push({
            id: `suggestion-${Date.now()}-1`,
            type: 'completion',
            title: 'Code Completion',
            description: 'AI-suggested code completion',
            code: completionResponse.content,
            position: context.cursorPosition,
            confidence: completionResponse.confidence,
            impact: 'medium',
            category: 'completion',
            tags: ['ai', 'completion'],
            model: completionResponse.model,
            timestamp: Date.now()
          });
        }
      }

      // Analyze for potential issues
      const analysisResponse = await this.analyzeCode(context);
      
      // Parse analysis response for suggestions (simplified)
      if (analysisResponse.content.includes('optimization')) {
        suggestions.push({
          id: `suggestion-${Date.now()}-2`,
          type: 'optimization',
          title: 'Performance Optimization',
          description: 'Potential performance improvement detected',
          code: '', // Would contain optimized code
          position: context.cursorPosition,
          confidence: 0.8,
          impact: 'high',
          category: 'performance',
          tags: ['performance', 'optimization'],
          model: analysisResponse.model,
          timestamp: Date.now()
        });
      }

      suggestions.forEach(suggestion => {
        this.emit('suggestion-generated', suggestion);
      });

      return suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      this.emit('error', error as Error, 'suggestions');
      return [];
    }
  }

  /**
   * Process AI request
   */
  private async processRequest(request: AIRequest): Promise<AIResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
      return cached;
    }

    // Add to queue
    this.requestQueue.push(request);
    
    // Sort queue by priority
    this.requestQueue.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Wait for processing
    return new Promise((resolve, reject) => {
      const checkQueue = () => {
        const response = this.responseCache.get(request.id);
        if (response) {
          resolve(response);
        } else {
          setTimeout(checkQueue, 100);
        }
      };
      
      setTimeout(() => {
        if (!this.responseCache.has(request.id)) {
          reject(new Error('Request timeout'));
        }
      }, 30000); // 30 second timeout
      
      checkQueue();
    });
  }

  /**
   * Start request processor
   */
  private startRequestProcessor(): void {
    const processQueue = async () => {
      if (this.isProcessing || this.requestQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      const request = this.requestQueue.shift()!;

      try {
        const startTime = Date.now();
        const response = await this.callAIModel(request);
        const processingTime = Date.now() - startTime;

        response.processingTime = processingTime;
        response.timestamp = Date.now();

        // Cache response
        const cacheKey = this.generateCacheKey(request);
        this.responseCache.set(cacheKey, response);
        this.responseCache.set(request.id, response);

        // Update usage stats
        this.updateUsageStats(response);

        console.log(`AI request processed: ${request.type} in ${processingTime}ms`);
      } catch (error) {
        console.error('Failed to process AI request:', error);
        this.emit('error', error as Error, 'request-processing');
      } finally {
        this.isProcessing = false;
      }
    };

    // Process queue every 100ms
    setInterval(processQueue, 100);
  }

  /**
   * Call AI model API
   */
  private async callAIModel(request: AIRequest): Promise<AIResponse> {
    if (!this.activeModel) {
      throw new Error('No active AI model');
    }

    const model = this.activeModel;
    
    // Mock API call - in real implementation, this would call the actual AI service
    await new Promise(resolve => setTimeout(resolve, model.latency));

    // Generate mock response based on request type
    const mockContent = this.generateMockResponse(request);
    
    const response: AIResponse = {
      id: `response-${Date.now()}`,
      requestId: request.id,
      type: request.type,
      content: mockContent,
      confidence: 0.85 + Math.random() * 0.1,
      model: model.id,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: Math.floor(mockContent.length / 4),
        totalTokens: Math.floor((request.prompt.length + mockContent.length) / 4),
        cost: Math.floor((request.prompt.length + mockContent.length) / 4) * model.costPerToken
      },
      metadata: {
        reasoning: 'AI-generated response based on context analysis',
        alternatives: [],
        suggestions: [],
        warnings: []
      },
      processingTime: 0,
      timestamp: 0
    };

    return response;
  }

  /**
   * Generate mock response (for demonstration)
   */
  private generateMockResponse(request: AIRequest): string {
    switch (request.type) {
      case 'completion':
        return 'console.log("AI-generated completion");';
      case 'generation':
        return '// AI-generated code based on description\nfunction generatedFunction() {\n  return "Hello from AI";\n}';
      case 'analysis':
        return 'Code analysis: The code looks good overall. Consider adding error handling and improving variable naming.';
      case 'explanation':
        return 'This code defines a function that performs the specified operation. It uses modern JavaScript features and follows best practices.';
      case 'optimization':
        return '// Optimized version\n// Consider using more efficient algorithms or data structures';
      case 'debug':
        return 'Potential issue found: Missing null check. Suggested fix: Add validation before accessing properties.';
      case 'test':
        return 'describe("Test Suite", () => {\n  it("should work correctly", () => {\n    expect(true).toBe(true);\n  });\n});';
      case 'refactor':
        return '// Refactored code with improved structure and readability';
      default:
        return 'AI response generated successfully';
    }
  }

  /**
   * Build prompts for different request types
   */
  private buildCompletionPrompt(context: CodeContext): string {
    return `Complete the following ${context.language} code:\n\nFile: ${context.filePath}\n\nCode:\n${context.content}\n\nCursor position: Line ${context.cursorPosition.line}, Column ${context.cursorPosition.column}\n\nProvide the most likely completion:`;
  }

  private buildGenerationPrompt(description: string, context: CodeContext): string {
    return `Generate ${context.language} code for the following description:\n\n"${description}"\n\nContext:\n- File: ${context.filePath}\n- Project: ${context.projectInfo.name}\n- Framework: ${context.projectInfo.framework || 'None'}\n\nGenerate clean, well-documented code:`;
  }

  private buildAnalysisPrompt(context: CodeContext): string {
    return `Analyze the following ${context.language} code for potential issues, improvements, and best practices:\n\nFile: ${context.filePath}\n\nCode:\n${context.content}\n\nProvide detailed analysis with suggestions:`;
  }

  private buildExplanationPrompt(context: CodeContext): string {
    return `Explain the following ${context.language} code in detail:\n\nFile: ${context.filePath}\n\nCode:\n${context.content}\n\nProvide clear explanation of functionality:`;
  }

  private buildOptimizationPrompt(context: CodeContext): string {
    return `Optimize the following ${context.language} code for better performance:\n\nFile: ${context.filePath}\n\nCode:\n${context.content}\n\nProvide optimized version with explanations:`;
  }

  private buildDebugPrompt(context: CodeContext, error?: string): string {
    let prompt = `Debug the following ${context.language} code:\n\nFile: ${context.filePath}\n\nCode:\n${context.content}`;
    
    if (error) {
      prompt += `\n\nError message:\n${error}`;
    }
    
    prompt += '\n\nIdentify issues and provide fixes:';
    return prompt;
  }

  private buildTestPrompt(context: CodeContext): string {
    return `Generate comprehensive test cases for the following ${context.language} code:\n\nFile: ${context.filePath}\n\nCode:\n${context.content}\n\nGenerate unit tests with good coverage:`;
  }

  private buildRefactorPrompt(context: CodeContext, refactorType?: string): string {
    let prompt = `Refactor the following ${context.language} code`;
    
    if (refactorType) {
      prompt += ` for ${refactorType}`;
    }
    
    prompt += `:\n\nFile: ${context.filePath}\n\nCode:\n${context.content}\n\nProvide refactored version with improvements:`;
    return prompt;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AIRequest): string {
    const contextHash = this.hashString(JSON.stringify(request.context));
    const promptHash = this.hashString(request.prompt);
    return `${request.type}-${contextHash}-${promptHash}-${request.model}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(response: AIResponse): void {
    this.usageStats.totalTokens += response.usage.totalTokens;
    this.usageStats.totalCost += response.usage.cost;
    this.usageStats.requestCount += 1;
    this.usageStats.averageLatency = 
      (this.usageStats.averageLatency * (this.usageStats.requestCount - 1) + response.processingTime) / 
      this.usageStats.requestCount;

    this.emit('usage-updated', {
      tokens: this.usageStats.totalTokens,
      cost: this.usageStats.totalCost
    });
  }

  /**
   * Event handling
   */
  on<K extends keyof AIServiceEvents>(event: K, listener: AIServiceEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  off<K extends keyof AIServiceEvents>(event: K, listener: AIServiceEvents[K]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit<K extends keyof AIServiceEvents>(event: K, ...args: Parameters<AIServiceEvents[K]>): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          (listener as any)(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  private initializeEventListeners(): void {
    const events: (keyof AIServiceEvents)[] = [
      'suggestion-generated',
      'analysis-completed',
      'model-changed',
      'error',
      'usage-updated'
    ];

    events.forEach(event => {
      this.eventListeners.set(event, []);
    });
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return { ...this.usageStats };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.responseCache.clear();
    this.contextCache.clear();
    this.projectAnalysisCache.clear();
  }

  /**
   * Get request queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      cacheSize: this.responseCache.size
    };
  }

  /**
   * Cleanup and destroy the service
   */
  destroy(): void {
    this.requestQueue = [];
    this.responseCache.clear();
    this.contextCache.clear();
    this.projectAnalysisCache.clear();
    this.eventListeners.clear();
    this.isProcessing = false;
    
    console.log('AI service destroyed');
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
export { AIService };