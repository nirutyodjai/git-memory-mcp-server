const axios = require('axios');
const EventEmitter = require('events');
const { enhancedLogger: logger } = require('../../logger');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Enhanced AI Models Integration Service for NEXUS IDE
 * Advanced multi-model AI system with intelligent routing and optimization
 * Supports OpenAI, Claude, Gemini, Llama, local models, and custom providers
 * Features: Smart load balancing, context awareness, model specialization
 */
class AIModelsIntegration extends EventEmitter {
  constructor() {
    super();
    
    // AI Model Providers Configuration
    this.providers = {
      openai: {
        name: 'OpenAI GPT-4',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        capabilities: ['chat', 'completion', 'code', 'analysis'],
        status: 'inactive',
        apiKey: process.env.OPENAI_API_KEY
      },
      claude: {
        name: 'Anthropic Claude',
        baseUrl: 'https://api.anthropic.com/v1',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        capabilities: ['chat', 'completion', 'code', 'analysis', 'reasoning'],
        status: 'inactive',
        apiKey: process.env.ANTHROPIC_API_KEY
      },
      gemini: {
        name: 'Google Gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1',
        models: ['gemini-pro', 'gemini-pro-vision'],
        capabilities: ['chat', 'completion', 'code', 'vision'],
        status: 'inactive',
        apiKey: process.env.GOOGLE_API_KEY
      },
      llama: {
        name: 'Meta Llama',
        baseUrl: process.env.LLAMA_API_URL || 'http://localhost:11434',
        models: ['llama2', 'llama2-13b', 'codellama'],
        capabilities: ['chat', 'completion', 'code'],
        status: 'inactive',
        apiKey: null // Local model, no API key needed
      },
      local: {
        name: 'Local Models',
        baseUrl: process.env.LOCAL_AI_URL || 'http://localhost:8080',
        models: ['custom-model-1', 'custom-model-2'],
        capabilities: ['chat', 'completion', 'code'],
        status: 'inactive',
        apiKey: null
      }
    };

    // Request tracking and load balancing
    this.requestCounts = new Map();
    this.responseTimeHistory = new Map();
    this.failureRates = new Map();
    
    // Enhanced features for NEXUS IDE
    this.contextCache = new Map();
    this.modelSpecializations = new Map();
    this.userPreferences = new Map();
    this.conversationHistory = new Map();
    this.maxContextAge = 30 * 60 * 1000; // 30 minutes
    this.maxConversationLength = 50; // messages
    
    // Initialize providers
    this.initializeProviders();
    this.initializeModelSpecializations();
    
    // Health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
    
    // Context cleanup interval
    this.contextCleanupInterval = setInterval(() => {
      this.cleanupExpiredContexts();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Initialize all AI providers with enhanced configurations for NEXUS IDE
   */
  async initializeProviders() {
    logger.info('Initializing AI Models Integration Service for NEXUS IDE');
    
    // Enhanced OpenAI Configuration
    this.providers.openai = {
      ...this.providers.openai,
      models: {
        'gpt-4': { context: 128000, specialties: ['reasoning', 'complex-analysis', 'architecture'] },
        'gpt-4-turbo': { context: 128000, specialties: ['speed', 'general-purpose', 'coding'] },
        'gpt-4o': { context: 128000, specialties: ['multimodal', 'vision', 'latest-features'] },
        'gpt-3.5-turbo': { context: 16385, specialties: ['speed', 'simple-tasks', 'cost-effective'] },
        'o1-preview': { context: 128000, specialties: ['reasoning', 'math', 'science'] },
        'o1-mini': { context: 65536, specialties: ['reasoning', 'coding', 'fast-reasoning'] }
      },
      capabilities: [...this.providers.openai.capabilities, 'vision', 'function-calling'],
      rateLimit: { requests: 3500, window: 60000 },
      pricing: { input: 0.01, output: 0.03 },
      priority: 1
    };

    // Enhanced Claude Configuration
    this.providers.claude = {
      ...this.providers.claude,
      models: {
        'claude-3-opus': { context: 200000, specialties: ['complex-reasoning', 'creative-writing', 'analysis'] },
        'claude-3-sonnet': { context: 200000, specialties: ['balanced', 'coding', 'general-purpose'] },
        'claude-3-haiku': { context: 200000, specialties: ['speed', 'simple-tasks', 'cost-effective'] }
      },
      capabilities: [...this.providers.claude.capabilities, 'long-context', 'safety'],
      rateLimit: { requests: 1000, window: 60000 },
      pricing: { input: 0.015, output: 0.075 },
      priority: 2
    };

    // Enhanced Gemini Configuration
    this.providers.gemini = {
      ...this.providers.gemini,
      models: {
        'gemini-pro': { context: 32000, specialties: ['multimodal', 'reasoning', 'coding'] },
        'gemini-pro-vision': { context: 16000, specialties: ['vision', 'image-analysis', 'multimodal'] }
      },
      capabilities: [...this.providers.gemini.capabilities, 'multimodal', 'free-tier'],
      rateLimit: { requests: 60, window: 60000 },
      pricing: { input: 0.0005, output: 0.0015 },
      priority: 3
    };
    
    for (const [providerId, provider] of Object.entries(this.providers)) {
      try {
        await this.testProviderConnection(providerId);
        logger.info(`AI Provider initialized: ${provider.name}`);
      } catch (error) {
        logger.warn(`Failed to initialize AI Provider: ${provider.name}`, { error: error.message });
      }
    }
  }

  /**
   * Initialize model specializations for NEXUS IDE
   */
  initializeModelSpecializations() {
    // Code-related specializations
    this.modelSpecializations.set('code-generation', {
      preferredModels: ['gpt-4-turbo', 'claude-3-sonnet', 'codellama'],
      prompts: {
        system: 'You are an expert software developer. Generate clean, efficient, and well-documented code.',
        context: 'Focus on best practices, error handling, and maintainability.'
      }
    });

    this.modelSpecializations.set('code-review', {
      preferredModels: ['gpt-4', 'claude-3-opus', 'o1-preview'],
      prompts: {
        system: 'You are a senior code reviewer. Analyze code for bugs, security issues, and improvements.',
        context: 'Provide constructive feedback with specific suggestions.'
      }
    });

    this.modelSpecializations.set('debugging', {
      preferredModels: ['gpt-4', 'o1-preview', 'claude-3-sonnet'],
      prompts: {
        system: 'You are a debugging expert. Help identify and fix code issues.',
        context: 'Analyze error messages, stack traces, and code logic systematically.'
      }
    });

    // Architecture and design
    this.modelSpecializations.set('architecture-design', {
      preferredModels: ['gpt-4', 'claude-3-opus', 'o1-preview'],
      prompts: {
        system: 'You are a software architect. Design scalable and maintainable system architectures.',
        context: 'Consider performance, security, and future extensibility.'
      }
    });

    // Documentation
    this.modelSpecializations.set('documentation', {
      preferredModels: ['claude-3-sonnet', 'gpt-4-turbo', 'gemini-pro'],
      prompts: {
        system: 'You are a technical writer. Create clear, comprehensive documentation.',
        context: 'Make documentation accessible to developers of all skill levels.'
      }
    });

    // Testing
    this.modelSpecializations.set('test-generation', {
      preferredModels: ['gpt-4-turbo', 'claude-3-sonnet', 'o1-mini'],
      prompts: {
        system: 'You are a testing expert. Generate comprehensive test cases and test code.',
        context: 'Cover edge cases, error conditions, and ensure good test coverage.'
      }
    });

    // Performance optimization
    this.modelSpecializations.set('performance-optimization', {
      preferredModels: ['gpt-4', 'o1-preview', 'claude-3-opus'],
      prompts: {
        system: 'You are a performance optimization expert. Analyze and improve code performance.',
        context: 'Focus on algorithmic efficiency, memory usage, and scalability.'
      }
    });

    // Security analysis
    this.modelSpecializations.set('security-analysis', {
      preferredModels: ['gpt-4', 'claude-3-opus', 'o1-preview'],
      prompts: {
        system: 'You are a cybersecurity expert. Identify security vulnerabilities and suggest fixes.',
        context: 'Consider OWASP top 10, secure coding practices, and threat modeling.'
      }
    });

    logger.info('Model specializations initialized for NEXUS IDE');
  }

  /**
   * Test connection to AI provider
   */
  async testProviderConnection(providerId) {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    try {
      let testResult;
      
      switch (providerId) {
        case 'openai':
          testResult = await this.testOpenAI(provider);
          break;
        case 'claude':
          testResult = await this.testClaude(provider);
          break;
        case 'gemini':
          testResult = await this.testGemini(provider);
          break;
        case 'llama':
        case 'local':
          testResult = await this.testLocalModel(provider);
          break;
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }

      provider.status = 'active';
      provider.lastHealthCheck = new Date().toISOString();
      return testResult;
    } catch (error) {
      provider.status = 'error';
      provider.lastError = error.message;
      throw error;
    }
  }

  /**
   * Test OpenAI connection
   */
  async testOpenAI(provider) {
    if (!provider.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await axios.get(`${provider.baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    return { status: 'healthy', models: response.data.data.length };
  }

  /**
   * Test Claude connection
   */
  async testClaude(provider) {
    if (!provider.apiKey) {
      throw new Error('Claude API key not configured');
    }

    // Claude doesn't have a models endpoint, so we test with a simple message
    const response = await axios.post(`${provider.baseUrl}/messages`, {
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }]
    }, {
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 5000
    });

    return { status: 'healthy', response: response.status };
  }

  /**
   * Test Gemini connection
   */
  async testGemini(provider) {
    if (!provider.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await axios.get(`${provider.baseUrl}/models?key=${provider.apiKey}`, {
      timeout: 5000
    });

    return { status: 'healthy', models: response.data.models.length };
  }

  /**
   * Test local model connection
   */
  async testLocalModel(provider) {
    try {
      const response = await axios.get(`${provider.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return { status: 'healthy', models: response.data.models?.length || 0 };
    } catch (error) {
      // Try alternative health check endpoint
      const response = await axios.get(`${provider.baseUrl}/health`, {
        timeout: 5000
      });
      return { status: 'healthy', response: response.status };
    }
  }

  /**
   * Perform health checks on all providers
   */
  async performHealthChecks() {
    for (const [providerId, provider] of Object.entries(this.providers)) {
      if (provider.status === 'active') {
        try {
          await this.testProviderConnection(providerId);
        } catch (error) {
          logger.warn(`Health check failed for ${provider.name}`, { error: error.message });
        }
      }
    }
  }

  /**
   * Get the best available provider for a specific capability with enhanced intelligence
   */
  getBestProvider(capability = 'chat', options = {}) {
    const { taskType, userId, modelPreference, contextSize, priority } = options;
    
    // Get specialized models if task type is specified
    if (taskType && this.modelSpecializations.has(taskType)) {
      const specialization = this.modelSpecializations.get(taskType);
      const preferredModels = specialization.preferredModels;
      
      // Find providers that have the preferred models
      for (const modelName of preferredModels) {
        for (const [providerId, provider] of Object.entries(this.providers)) {
          if (provider.status === 'active' && 
              provider.capabilities.includes(capability) &&
              provider.models && provider.models[modelName]) {
            return { id: providerId, ...provider, recommendedModel: modelName };
          }
        }
      }
    }
    
    // Check user preferences
    if (userId && this.userPreferences.has(userId)) {
      const userPref = this.userPreferences.get(userId);
      if (userPref.preferredProvider && this.providers[userPref.preferredProvider]?.status === 'active') {
        const provider = this.providers[userPref.preferredProvider];
        if (provider.capabilities.includes(capability)) {
          return { id: userPref.preferredProvider, ...provider };
        }
      }
    }

    const availableProviders = Object.entries(this.providers)
      .filter(([id, provider]) => 
        provider.status === 'active' && 
        provider.capabilities.includes(capability)
      )
      .map(([id, provider]) => ({ id, ...provider }));

    if (availableProviders.length === 0) {
      throw new Error(`No available providers for capability: ${capability}`);
    }

    // Enhanced load balancing with multiple factors
    const bestProvider = availableProviders.reduce((best, current) => {
      const currentRequests = this.requestCounts.get(current.id) || 0;
      const bestRequests = this.requestCounts.get(best.id) || 0;
      const currentAvgTime = this.getAverageResponseTime(current.id);
      const bestAvgTime = this.getAverageResponseTime(best.id);
      const currentFailures = this.failureRates.get(current.id) || 0;
      const bestFailures = this.failureRates.get(best.id) || 0;
      
      // Calculate score based on multiple factors
      const currentScore = this.calculateProviderScore(current, {
        requests: currentRequests,
        avgTime: currentAvgTime,
        failures: currentFailures,
        contextSize,
        priority
      });
      
      const bestScore = this.calculateProviderScore(best, {
        requests: bestRequests,
        avgTime: bestAvgTime,
        failures: bestFailures,
        contextSize,
        priority
      });

      return currentScore > bestScore ? current : best;
    });

    return bestProvider;
  }
  
  /**
   * Calculate provider score for intelligent selection
   */
  calculateProviderScore(provider, metrics) {
    let score = 100; // Base score
    
    // Penalize high request count (load balancing)
    score -= (metrics.requests / 100) * 10;
    
    // Penalize slow response times
    score -= (metrics.avgTime / 1000) * 5;
    
    // Penalize failures
    score -= metrics.failures * 2;
    
    // Bonus for priority
    score += (6 - (provider.priority || 5)) * 5;
    
    // Context size consideration
    if (metrics.contextSize && provider.models) {
      const maxContext = Math.max(...Object.values(provider.models).map(m => m.context || 0));
      if (maxContext >= metrics.contextSize) {
        score += 10;
      } else {
        score -= 20; // Heavy penalty for insufficient context
      }
    }
    
    return Math.max(0, score);
  }

  /**
   * Get average response time for a provider
   */
  getAverageResponseTime(providerId) {
    const history = this.responseTimeHistory.get(providerId) || [];
    if (history.length === 0) return 0;
    return history.reduce((sum, time) => sum + time, 0) / history.length;
  }

  /**
   * Record request metrics
   */
  recordRequest(providerId, responseTime, success = true) {
    // Update request count
    const currentCount = this.requestCounts.get(providerId) || 0;
    this.requestCounts.set(providerId, currentCount + 1);

    // Update response time history
    const history = this.responseTimeHistory.get(providerId) || [];
    history.push(responseTime);
    if (history.length > 100) { // Keep only last 100 records
      history.shift();
    }
    this.responseTimeHistory.set(providerId, history);

    // Update failure rate
    if (!success) {
      const failures = this.failureRates.get(providerId) || 0;
      this.failureRates.set(providerId, failures + 1);
    }
  }

  /**
   * Enhanced request method with context awareness and conversation management
   */
  async sendRequest(providerId, request) {
    const provider = this.providers[providerId];
    if (!provider || provider.status !== 'active') {
      throw new Error(`Provider ${providerId} is not available`);
    }

    const startTime = Date.now();
    let success = true;
    
    try {
      // Enhance request with context and conversation history
      const enhancedRequest = await this.enhanceRequestWithContext(request);
      
      // Apply model specialization if specified
      if (request.taskType && this.modelSpecializations.has(request.taskType)) {
        const specialization = this.modelSpecializations.get(request.taskType);
        enhancedRequest.systemPrompt = specialization.prompts.system;
        enhancedRequest.contextPrompt = specialization.prompts.context;
      }
      
      let response;
      
      switch (providerId) {
        case 'openai':
          response = await this.sendOpenAIRequest(provider, enhancedRequest);
          break;
        case 'claude':
          response = await this.sendClaudeRequest(provider, enhancedRequest);
          break;
        case 'gemini':
          response = await this.sendGeminiRequest(provider, enhancedRequest);
          break;
        case 'llama':
        case 'local':
          response = await this.sendLocalModelRequest(provider, enhancedRequest);
          break;
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }
      
      // Store conversation history
      if (request.conversationId) {
        this.updateConversationHistory(request.conversationId, request, response);
      }
      
      // Cache context if needed
      if (request.cacheContext) {
        this.cacheContext(request.contextId || request.conversationId, response);
      }

      return response;
    } catch (error) {
      success = false;
      console.error(`Request failed for provider ${providerId}`, { error: error.message, request: request.messages?.[0]?.content?.substring(0, 100) });
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      this.recordRequest(providerId, responseTime, success);
    }
  }
  
  /**
   * Enhance request with context and conversation history
   */
  async enhanceRequestWithContext(request) {
    const enhanced = { ...request };
    
    // Add conversation history if available
    if (request.conversationId && this.conversationHistory.has(request.conversationId)) {
      const history = this.conversationHistory.get(request.conversationId);
      const recentHistory = history.slice(-10); // Last 10 messages
      
      enhanced.messages = [
        ...(enhanced.systemPrompt ? [{ role: 'system', content: enhanced.systemPrompt }] : []),
        ...recentHistory,
        ...enhanced.messages
      ];
    }
    
    // Add cached context if available
    if (request.contextId && this.contextCache.has(request.contextId)) {
      const context = this.contextCache.get(request.contextId);
      if (Date.now() - context.timestamp < this.maxContextAge) {
        enhanced.contextData = context.data;
      }
    }
    
    return enhanced;
  }
  
  /**
   * Update conversation history
   */
  updateConversationHistory(conversationId, request, response) {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    
    const history = this.conversationHistory.get(conversationId);
    
    // Add user message
    if (request.messages && request.messages.length > 0) {
      const userMessage = request.messages[request.messages.length - 1];
      history.push({
        role: userMessage.role,
        content: userMessage.content,
        timestamp: Date.now()
      });
    }
    
    // Add assistant response
    history.push({
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      provider: response.provider,
      model: response.model
    });
    
    // Limit history length
    if (history.length > this.maxConversationLength) {
      history.splice(0, history.length - this.maxConversationLength);
    }
  }
  
  /**
   * Cache context data
   */
  cacheContext(contextId, data) {
    this.contextCache.set(contextId, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clean up expired contexts
   */
  cleanupExpiredContexts() {
    const now = Date.now();
    for (const [contextId, context] of this.contextCache.entries()) {
      if (now - context.timestamp > this.maxContextAge) {
        this.contextCache.delete(contextId);
      }
    }
    
    logger.debug(`Cleaned up expired contexts. Active contexts: ${this.contextCache.size}`);
  }
  
  /**
   * Set user preferences
   */
  setUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, {
      ...preferences,
      updatedAt: Date.now()
    });
    
    logger.info(`Updated preferences for user ${userId}`);
  }
  
  /**
   * Get user preferences
   */
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || {};
  }
  
  /**
   * Start context cleanup interval
   */
  startContextCleanup() {
    this.contextCleanupInterval = setInterval(() => {
      this.cleanupExpiredContexts();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Send request to OpenAI
   */
  async sendOpenAIRequest(provider, request) {
    const response = await axios.post(`${provider.baseUrl}/chat/completions`, {
      model: request.model || 'gpt-4',
      messages: request.messages,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      ...request.options
    }, {
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return {
      provider: 'openai',
      model: request.model || 'gpt-4',
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      raw: response.data
    };
  }

  /**
   * Send request to Claude
   */
  async sendClaudeRequest(provider, request) {
    const response = await axios.post(`${provider.baseUrl}/messages`, {
      model: request.model || 'claude-3-sonnet-20240229',
      messages: request.messages,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7,
      ...request.options
    }, {
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      timeout: 30000
    });

    return {
      provider: 'claude',
      model: request.model || 'claude-3-sonnet-20240229',
      content: response.data.content[0].text,
      usage: response.data.usage,
      raw: response.data
    };
  }

  /**
   * Send request to Gemini
   */
  async sendGeminiRequest(provider, request) {
    const model = request.model || 'gemini-pro';
    const response = await axios.post(
      `${provider.baseUrl}/models/${model}:generateContent?key=${provider.apiKey}`,
      {
        contents: request.messages.map(msg => ({
          parts: [{ text: msg.content }],
          role: msg.role === 'assistant' ? 'model' : 'user'
        })),
        generationConfig: {
          maxOutputTokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7,
          ...request.options
        }
      },
      {
        timeout: 30000
      }
    );

    return {
      provider: 'gemini',
      model: model,
      content: response.data.candidates[0].content.parts[0].text,
      usage: response.data.usageMetadata,
      raw: response.data
    };
  }

  /**
   * Send request to local model
   */
  async sendLocalModelRequest(provider, request) {
    const response = await axios.post(`${provider.baseUrl}/api/chat`, {
      model: request.model || 'llama2',
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature || 0.7,
        ...request.options
      }
    }, {
      timeout: 60000 // Local models might be slower
    });

    return {
      provider: 'local',
      model: request.model || 'llama2',
      content: response.data.message.content,
      usage: { total_tokens: response.data.eval_count || 0 },
      raw: response.data
    };
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    const stats = {};
    
    for (const [providerId, provider] of Object.entries(this.providers)) {
      stats[providerId] = {
        name: provider.name,
        status: provider.status,
        models: provider.models,
        capabilities: provider.capabilities,
        requestCount: this.requestCounts.get(providerId) || 0,
        averageResponseTime: this.getAverageResponseTime(providerId),
        failureRate: this.failureRates.get(providerId) || 0,
        lastHealthCheck: provider.lastHealthCheck
      };
    }
    
    return stats;
  }

  /**
   * Get intelligent AI response with automatic provider selection
   */
  async getIntelligentResponse(request) {
    const { taskType, userId, priority = 'normal' } = request;
    
    try {
      // Get the best provider for this task
      const bestProvider = this.getBestProvider('chat', {
        taskType,
        userId,
        contextSize: this.estimateContextSize(request),
        priority
      });
      
      // Send request to the selected provider
      const response = await this.sendRequest(bestProvider.id, {
        ...request,
        model: bestProvider.recommendedModel || request.model
      });
      
      // Add metadata about the selection
      response.metadata = {
        selectedProvider: bestProvider.id,
        selectedModel: bestProvider.recommendedModel || request.model,
        taskType,
        selectionReason: this.getSelectionReason(bestProvider, taskType)
      };
      
      return response;
    } catch (error) {
      console.error('Intelligent response failed', { error: error.message, taskType, userId });
      
      // Fallback to any available provider
      const fallbackProvider = this.getBestProvider('chat');
      if (fallbackProvider) {
        logger.info(`Falling back to provider: ${fallbackProvider.id}`);
        return await this.sendRequest(fallbackProvider.id, request);
      }
      
      throw error;
    }
  }
  
  /**
   * Estimate context size from request
   */
  estimateContextSize(request) {
    let size = 0;
    
    if (request.messages) {
      for (const message of request.messages) {
        size += (message.content?.length || 0) * 1.3; // Rough token estimation
      }
    }
    
    if (request.contextData) {
      size += JSON.stringify(request.contextData).length * 1.3;
    }
    
    return Math.ceil(size / 4); // Convert to approximate tokens
  }
  
  /**
   * Get selection reason for transparency
   */
  getSelectionReason(provider, taskType) {
    const reasons = [];
    
    if (taskType && this.modelSpecializations.has(taskType)) {
      reasons.push(`Specialized for ${taskType}`);
    }
    
    if (provider.priority <= 2) {
      reasons.push('High priority provider');
    }
    
    if (provider.recommendedModel) {
      reasons.push(`Recommended model: ${provider.recommendedModel}`);
    }
    
    return reasons.join(', ') || 'Best available provider';
  }
  
  /**
   * Batch process multiple requests efficiently
   */
  async batchProcess(requests) {
    const results = [];
    const providers = new Map();
    
    // Group requests by optimal provider
    for (const request of requests) {
      const bestProvider = this.getBestProvider('chat', {
        taskType: request.taskType,
        userId: request.userId,
        contextSize: this.estimateContextSize(request)
      });
      
      if (!providers.has(bestProvider.id)) {
        providers.set(bestProvider.id, []);
      }
      
      providers.get(bestProvider.id).push({ request, provider: bestProvider });
    }
    
    // Process requests in parallel by provider
    const promises = [];
    for (const [providerId, providerRequests] of providers) {
      const providerPromises = providerRequests.map(async ({ request, provider }) => {
        try {
          return await this.sendRequest(provider.id, request);
        } catch (error) {
          console.error(`Batch request failed for provider ${providerId}`, { error: error.message });
          return { error: error.message, request };
        }
      });
      
      promises.push(...providerPromises);
    }
    
    return await Promise.all(promises);
  }
  
  /**
   * Get comprehensive system status
   */
  getSystemStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      providers: this.getProviderStats(),
      system: {
        activeContexts: this.contextCache.size,
        activeConversations: this.conversationHistory.size,
        userPreferences: this.userPreferences.size,
        modelSpecializations: this.modelSpecializations.size
      },
      performance: {
        totalRequests: Array.from(this.requestCounts.values()).reduce((sum, count) => sum + count, 0),
        averageResponseTime: this.getOverallAverageResponseTime(),
        totalFailures: Array.from(this.failureRates.values()).reduce((sum, failures) => sum + failures, 0)
      }
    };
    
    return status;
  }
  
  /**
   * Get overall average response time
   */
  getOverallAverageResponseTime() {
    const allTimes = [];
    for (const times of this.responseTimeHistory.values()) {
      allTimes.push(...times);
    }
    
    if (allTimes.length === 0) return 0;
    return allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
  }
  
  /**
   * Enhanced cleanup resources
   */
  destroy() {
    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.contextCleanupInterval) {
      clearInterval(this.contextCleanupInterval);
    }
    
    // Clear caches and maps
    this.contextCache.clear();
    this.conversationHistory.clear();
    this.userPreferences.clear();
    this.modelSpecializations.clear();
    this.requestCounts.clear();
    this.responseTimeHistory.clear();
    this.failureRates.clear();
    
    // Remove event listeners
    this.removeAllListeners();
    
    logger.info('AI Models Integration destroyed and cleaned up');
  }
}

module.exports = AIModelsIntegration;