import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { GitMemoryService } from './GitMemoryService';
import { SemanticMemoryService } from './SemanticMemoryService';
import { AIIntegrationLayer } from './AIIntegrationLayer';

export interface LLMRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  context?: any;
  // Git Memory integration
  gitContext?: {
    filePath?: string;
    branch?: string;
    commitHash?: string;
    fileHistory?: any[];
  };
  // Semantic context
  semanticContext?: {
    relatedCode?: string[];
    codePatterns?: any[];
    projectContext?: any;
  };
  // AI enhancement
  aiEnhancement?: {
    useMemory?: boolean;
    useSemanticSearch?: boolean;
    includeCodeContext?: boolean;
    enhancePrompt?: boolean;
  };
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  latency: number;
  // Enhanced response data
  enhancement?: {
    memoryUsed?: boolean;
    semanticMatches?: number;
    codeContextIncluded?: boolean;
    confidenceScore?: number;
  };
  // Git Memory integration
  gitMemoryData?: {
    relatedCommits?: any[];
    fileChanges?: any[];
    branchContext?: string;
  };
}

export interface LLMProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  priority: number;
  config: any;
}

export class LLMProviderService extends EventEmitter {
  private providers: Map<string, LLMProvider> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();
  private config: any;
  private logger: Logger;
  private cache: Map<string, { response: LLMResponse; timestamp: number }> = new Map();
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  
  // AI Integration Services
  private gitMemoryService: GitMemoryService;
  private semanticMemoryService: SemanticMemoryService;
  private aiIntegrationLayer: AIIntegrationLayer;
  
  // Enhanced caching for AI context
  private contextCache: Map<string, any> = new Map();
  private semanticCache: Map<string, any> = new Map();

  constructor(config: any, logger: Logger, gitMemoryService?: GitMemoryService, semanticMemoryService?: SemanticMemoryService) {
    super();
    this.config = config;
    this.logger = logger;
    
    // Initialize AI services
    this.gitMemoryService = gitMemoryService || new GitMemoryService(config.gitMemory || {}, logger);
    this.semanticMemoryService = semanticMemoryService || new SemanticMemoryService(config.semanticMemory || {}, logger);
    // Create a mock SoloAIOrchestrator for now
    const mockOrchestrator = {
      executeTask: async () => ({ success: true, data: null }),
      on: () => {}
    } as any;
    
    this.aiIntegrationLayer = new AIIntegrationLayer(
      this as any, // LLMProviderService
      mockOrchestrator,
      logger
    );
    
    this.initializeProviders();
    this.initializeAIServices();
  }

  private initializeProviders(): void {
    for (const [id, providerConfig] of Object.entries(this.config.providers)) {
      const provider = providerConfig as LLMProvider;
      this.providers.set(id, provider);
      
      if (provider.enabled && provider.type === 'rest-api') {
        const client = axios.create({
          baseURL: provider.config.baseURL,
          timeout: provider.config.timeout || 30000,
          headers: {
            'Authorization': `Bearer ${provider.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        this.clients.set(id, client);
      }
    }
    
    this.logger.info(`Initialized ${this.providers.size} LLM providers`);
  }

  private async initializeAIServices(): Promise<void> {
    try {
      // Initialize Git Memory Service
      await this.gitMemoryService.init();
      
      // Initialize Semantic Memory Service
      await this.semanticMemoryService.init();
      
      // Initialize AI Integration Layer
      // AIIntegrationLayer initializes automatically in constructor
      
      this.logger.info('AI services initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AI services:', error);
      throw error;
    }
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Enhance request with AI context if enabled
    const enhancedRequest = await this.enhanceRequestWithAI(request);
    
    // Check cache first (including AI-enhanced cache)
    if (this.config.cache?.enabled) {
      const cacheKey = this.getCacheKey(enhancedRequest);
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.config.cache.ttl) {
        this.emit('cache_hit', { cacheKey, request: enhancedRequest });
        return cached.response;
      }
    }

    // Get active provider
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No active LLM provider available');
    }

    // Check rate limits
    if (!this.checkRateLimit(provider.id)) {
      throw new Error(`Rate limit exceeded for provider ${provider.id}`);
    }

    try {
      const response = await this.callProvider(provider, enhancedRequest);
      response.latency = Date.now() - startTime;
      
      // Enhance response with AI insights
      const enhancedResponse = await this.enhanceResponseWithAI(response, enhancedRequest);
      
      // Cache response
      if (this.config.cache?.enabled) {
        const cacheKey = this.getCacheKey(enhancedRequest);
        this.cache.set(cacheKey, { response: enhancedResponse, timestamp: Date.now() });
        
        // Clean old cache entries
        if (this.cache.size > this.config.cache.maxSize) {
          this.cleanCache();
        }
      }

      this.emit('response_generated', { provider: provider.id, request: enhancedRequest, response: enhancedResponse });
      return enhancedResponse;
      
    } catch (error) {
      this.logger.error(`LLM request failed for provider ${provider.id}:`, error);
      
      // Try fallback providers
      if (this.config.fallback?.enabled) {
        return this.tryFallbackProviders(enhancedRequest, provider.id, startTime);
      }
      
      throw error;
    }
  }

  private async callProvider(provider: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const client = this.clients.get(provider.id);
    if (!client) {
      throw new Error(`No client available for provider ${provider.id}`);
    }

    const model = request.model || provider.config.models.default;
    const maxTokens = request.maxTokens || provider.config.maxTokens;
    const temperature = request.temperature || provider.config.temperature;

    let requestBody: any;
    let endpoint: string;

    switch (provider.id) {
      case 'openai':
        endpoint = '/chat/completions';
        requestBody = {
          model,
          messages: [{ role: 'user', content: request.prompt }],
          max_tokens: maxTokens,
          temperature
        };
        break;
        
      case 'claude':
        endpoint = '/messages';
        requestBody = {
          model,
          messages: [{ role: 'user', content: request.prompt }],
          max_tokens: maxTokens,
          temperature
        };
        break;
        
      case 'gemini':
        endpoint = `/models/${model}:generateContent`;
        requestBody = {
          contents: [{ parts: [{ text: request.prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature
          }
        };
        break;
        
      default:
        throw new Error(`Unsupported provider: ${provider.id}`);
    }

    const response = await client.post(endpoint, requestBody);
    return this.parseProviderResponse(provider.id, response.data, model);
  }

  private parseProviderResponse(providerId: string, data: any, model: string): LLMResponse {
    let content: string;
    let usage: any;

    switch (providerId) {
      case 'openai':
        content = data.choices[0].message.content;
        usage = data.usage;
        break;
        
      case 'claude':
        content = data.content[0].text;
        usage = data.usage;
        break;
        
      case 'gemini':
        content = data.candidates[0].content.parts[0].text;
        usage = {
          promptTokens: data.usageMetadata?.promptTokenCount || 0,
          completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data.usageMetadata?.totalTokenCount || 0
        };
        break;
        
      default:
        throw new Error(`Unknown provider response format: ${providerId}`);
    }

    return {
      content,
      usage: {
        promptTokens: usage?.promptTokens || usage?.prompt_tokens || 0,
        completionTokens: usage?.completionTokens || usage?.completion_tokens || 0,
        totalTokens: usage?.totalTokens || usage?.total_tokens || 0
      },
      model,
      provider: providerId,
      latency: 0 // Will be set by caller
    };
  }

  private getActiveProvider(): LLMProvider | null {
    const enabledProviders = Array.from(this.providers.values())
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
    
    return enabledProviders[0] || null;
  }

  private async tryFallbackProviders(request: LLMRequest, failedProviderId: string, startTime: number): Promise<LLMResponse> {
    const fallbackOrder = this.config.fallback.order.filter((id: string) => 
      id !== failedProviderId && this.providers.get(id)?.enabled
    );

    for (const providerId of fallbackOrder) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      try {
        this.logger.info(`Trying fallback provider: ${providerId}`);
        const response = await this.callProvider(provider, request);
        response.latency = Date.now() - startTime;
        
        this.emit('fallback_success', { provider: providerId, request, response });
        return response;
        
      } catch (error) {
        this.logger.warn(`Fallback provider ${providerId} also failed:`, error);
        continue;
      }
    }

    throw new Error('All LLM providers failed');
  }

  private checkRateLimit(providerId: string): boolean {
    if (!this.config.rateLimit?.enabled) return true;

    const now = Date.now();
    const limit = this.rateLimiter.get(providerId);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimiter.set(providerId, {
        count: 1,
        resetTime: now + 60000 // 1 minute
      });
      return true;
    }

    if (limit.count >= this.config.rateLimit.requestsPerMinute) {
      return false;
    }

    limit.count++;
    return true;
  }

  private getCacheKey(request: LLMRequest): string {
    return Buffer.from(JSON.stringify({
      prompt: request.prompt,
      model: request.model,
      maxTokens: request.maxTokens,
      temperature: request.temperature
    })).toString('base64');
  }

  private cleanCache(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toDelete = entries.slice(0, Math.floor(this.cache.size * 0.2));
    toDelete.forEach(([key]) => this.cache.delete(key));
  }

  getProviderStatus(): { [key: string]: any } {
    const status: { [key: string]: any } = {};
    
    for (const [id, provider] of this.providers) {
      status[id] = {
        enabled: provider.enabled,
        priority: provider.priority,
        hasClient: this.clients.has(id),
        rateLimit: this.rateLimiter.get(id)
      };
    }
    
    return status;
  }

  enableProvider(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.enabled = true;
      this.logger.info(`Enabled LLM provider: ${providerId}`);
    }
  }

  disableProvider(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.enabled = false;
      this.logger.info(`Disabled LLM provider: ${providerId}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.contextCache.clear();
    this.semanticCache.clear();
    this.logger.info('All caches cleared');
  }

  // AI Enhancement Methods
  private async enhanceRequestWithAI(request: LLMRequest): Promise<LLMRequest> {
    const enhancedRequest = { ...request };
    
    try {
      // Skip enhancement if not enabled
      if (!request.aiEnhancement?.useMemory && !request.aiEnhancement?.useSemanticSearch) {
        return enhancedRequest;
      }

      // Get Git context if requested
      if (request.aiEnhancement?.useMemory && request.gitContext) {
        const gitMemoryData = await this.getGitMemoryContext(request.gitContext);
        enhancedRequest.context = {
          ...enhancedRequest.context,
          gitMemory: gitMemoryData
        };
      }

      // Get semantic context if requested
      if (request.aiEnhancement?.useSemanticSearch) {
        const semanticData = await this.getSemanticContext(request.prompt, request.semanticContext);
        enhancedRequest.context = {
          ...enhancedRequest.context,
          semantic: semanticData
        };
      }

      // Enhance prompt with AI insights
      if (request.aiEnhancement?.enhancePrompt) {
        enhancedRequest.prompt = await this.enhancePromptWithContext(request.prompt, enhancedRequest.context);
      }

      return enhancedRequest;
    } catch (error) {
      this.logger.error('Failed to enhance request with AI:', error);
      return enhancedRequest; // Return original request on error
    }
  }

  private async enhanceResponseWithAI(response: LLMResponse, request: LLMRequest): Promise<LLMResponse> {
    const enhancedResponse = { ...response };
    
    try {
      // Add enhancement metadata
      enhancedResponse.enhancement = {
        memoryUsed: !!request.aiEnhancement?.useMemory,
        semanticMatches: request.context?.semantic?.matches?.length || 0,
        codeContextIncluded: !!request.aiEnhancement?.includeCodeContext,
        confidenceScore: this.calculateConfidenceScore(request, response)
      };

      // Add Git memory data if available
      if (request.context?.gitMemory) {
        enhancedResponse.gitMemoryData = {
          relatedCommits: request.context.gitMemory.commits || [],
          fileChanges: request.context.gitMemory.changes || [],
          branchContext: request.context.gitMemory.branch || 'main'
        };
      }

      // Store response in AI memory for future use
      if (request.aiEnhancement?.useMemory) {
        await this.storeResponseInMemory(request, enhancedResponse);
      }

      return enhancedResponse;
    } catch (error) {
      this.logger.error('Failed to enhance response with AI:', error);
      return enhancedResponse; // Return original response on error
    }
  }

  private async getGitMemoryContext(gitContext: any): Promise<any> {
    const cacheKey = `git_${JSON.stringify(gitContext)}`;
    
    // Check context cache first
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey);
    }

    try {
      const memoryData = await this.aiIntegrationLayer.getMemoryContexts();

      // Cache the result
      this.contextCache.set(cacheKey, memoryData);
      
      // Clean cache if too large
      if (this.contextCache.size > 500) {
        const firstKey = this.contextCache.keys().next().value;
        if (firstKey) {
          this.contextCache.delete(firstKey);
        }
      }

      return memoryData;
    } catch (error) {
      this.logger.error('Failed to get Git memory context:', error);
      return {};
    }
  }

  private async getSemanticContext(prompt: string, semanticContext?: any): Promise<any> {
    const cacheKey = `semantic_${prompt.substring(0, 100)}`;
    
    // Check semantic cache first
    if (this.semanticCache.has(cacheKey)) {
      return this.semanticCache.get(cacheKey);
    }

    try {
      const searchResults = await this.aiIntegrationLayer.searchMemory({
        query: prompt,
        limit: 5,
        type: 'hybrid'
      });

      const semanticData = {
        matches: searchResults,
        relatedCode: semanticContext?.relatedCode || [],
        patterns: semanticContext?.codePatterns || []
      };

      // Cache the result
      this.semanticCache.set(cacheKey, semanticData);
      
      // Clean cache if too large
      if (this.semanticCache.size > 500) {
        const firstKey = this.semanticCache.keys().next().value;
        if (firstKey) {
          this.semanticCache.delete(firstKey);
        }
      }

      return semanticData;
    } catch (error) {
      this.logger.error('Failed to get semantic context:', error);
      return { matches: [], relatedCode: [], patterns: [] };
    }
  }

  private async enhancePromptWithContext(prompt: string, context: any): Promise<string> {
    try {
      let enhancedPrompt = prompt;

      // Add Git context if available
      if (context?.gitMemory?.commits?.length > 0) {
        enhancedPrompt += '\n\n**Related Git History:**\n';
        context.gitMemory.commits.slice(0, 3).forEach((commit: any) => {
          enhancedPrompt += `- ${commit.message} (${commit.hash?.substring(0, 8)})\n`;
        });
      }

      // Add semantic matches if available
      if (context?.semantic?.matches?.length > 0) {
        enhancedPrompt += '\n\n**Related Code Context:**\n';
        context.semantic.matches.slice(0, 2).forEach((match: any) => {
          enhancedPrompt += `- ${match.summary || match.content?.substring(0, 100)}...\n`;
        });
      }

      return enhancedPrompt;
    } catch (error) {
      this.logger.error('Failed to enhance prompt with context:', error);
      return prompt; // Return original prompt on error
    }
  }

  private calculateConfidenceScore(request: LLMRequest, response: LLMResponse): number {
    let score = 0.5; // Base score

    // Increase score based on context availability
    if (request.context?.gitMemory?.commits?.length > 0) score += 0.2;
    if (request.context?.semantic?.matches?.length > 0) score += 0.2;
    if (response.usage?.totalTokens > 100) score += 0.1;

    return Math.min(score, 1.0);
  }

  private async storeResponseInMemory(request: LLMRequest, response: LLMResponse): Promise<void> {
    try {
      await this.aiIntegrationLayer.storeMemoryContext(
        JSON.stringify({
          prompt: request.prompt,
          response: response.content,
          model: response.model,
          timestamp: new Date().toISOString(),
          context: request.context
        }),
        'code',
        {
          tags: ['llm_interaction'],
          confidence: response.enhancement?.confidenceScore || 0.5,
          source: response.provider,
          timestamp: Date.now()
        }
      );
    } catch (error) {
      this.logger.error('Failed to store response in memory:', error);
    }
  }

  // Public methods for AI integration
  async getAIInsights(query: string): Promise<any> {
    try {
      const result = await this.aiIntegrationLayer.searchMemory({
        query,
        type: 'hybrid',
        limit: 10
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to get AI insights:', error);
      return null;
    }
  }

  async searchMemoryContext(query: string, options?: any): Promise<any> {
    try {
      return await this.aiIntegrationLayer.searchMemory({
        query,
        ...options
      });
    } catch (error) {
      this.logger.error('Failed to search memory context:', error);
      return [];
    }
  }
}