const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../../logger');

/**
 * NEXUS IDE AI Conversation Management System
 * Advanced conversation system with long-term memory, deep project understanding,
 * and intelligent context management for enhanced developer experience
 */
class AIConversation extends EventEmitter {
  constructor(aiModelsIntegration, codeFeatures) {
    super();
    this.aiModels = aiModelsIntegration;
    this.codeFeatures = codeFeatures;
    
    // Enhanced conversation management
    this.conversations = new Map();
    this.activeConversations = new Set();
    this.maxConversations = 1000; // Increased for enterprise use
    
    // Advanced context management
    this.projectContext = new Map();
    this.conversationHistory = new Map();
    this.contextWindow = 50; // Increased context window
    this.longTermMemory = new Map(); // Persistent memory across sessions
    this.semanticMemory = new Map(); // Semantic understanding of conversations
    
    // Enhanced AI personalities and modes
    this.aiPersonalities = new Map();
    this.conversationModes = new Map();
    this.userProfiles = new Map(); // User-specific preferences and patterns
    this.teamContext = new Map(); // Team collaboration context
    
    // Advanced analytics and learning
    this.conversationStats = {
      totalConversations: 0,
      activeConversations: 0,
      averageResponseTime: 0,
      totalMessages: 0,
      successfulResponses: 0,
      userSatisfactionScore: 0,
      contextAccuracy: 0,
      learningProgress: 0
    };
    
    // Memory and learning systems
    this.memoryIndex = new Map(); // Indexed memory for fast retrieval
    this.conversationPatterns = new Map(); // Learned conversation patterns
    this.projectInsights = new Map(); // Deep project understanding
    this.codebaseKnowledge = new Map(); // Accumulated codebase knowledge
    
    // Performance optimization
    this.responseCache = new Map();
    this.contextCache = new Map();
    this.predictionCache = new Map();
    
    // Real-time collaboration
    this.collaborationSessions = new Map();
    this.sharedContexts = new Map();
    
    this.initializeConversationService();
  }

  /**
   * Initialize enhanced conversation service
   */
  async initializeConversationService() {
    logger.info('Initializing NEXUS IDE AI Conversation Service');
    
    // Load AI personalities
    await this.loadAIPersonalities();
    
    // Load conversation modes
    await this.loadConversationModes();
    
    // Initialize advanced features
    await this.initializeLongTermMemory();
    await this.loadUserProfiles();
    await this.initializeSemanticMemory();
    await this.loadProjectInsights();
    await this.initializeCollaborationSystem();
    
    // Setup cleanup intervals
    this.setupCleanupIntervals();
    this.startLearningProcesses();
    this.initializePerformanceOptimization();
    
    logger.info('NEXUS IDE AI Conversation Service initialized successfully');
  }

  /**
   * Load different AI personalities
   */
  async loadAIPersonalities() {
    const personalities = {
      assistant: {
        name: 'AI Assistant',
        description: 'Helpful coding assistant',
        systemPrompt: 'You are a helpful AI coding assistant. Provide clear, accurate, and practical help with programming tasks.',
        temperature: 0.7,
        maxTokens: 2000,
        traits: ['helpful', 'precise', 'educational']
      },
      
      mentor: {
        name: 'Code Mentor',
        description: 'Experienced programming mentor',
        systemPrompt: 'You are an experienced programming mentor. Guide users through learning, explain concepts clearly, and encourage best practices.',
        temperature: 0.6,
        maxTokens: 2500,
        traits: ['educational', 'patient', 'encouraging']
      },
      
      reviewer: {
        name: 'Code Reviewer',
        description: 'Senior code reviewer',
        systemPrompt: 'You are a senior code reviewer. Provide constructive feedback, identify issues, and suggest improvements.',
        temperature: 0.4,
        maxTokens: 2000,
        traits: ['critical', 'detailed', 'constructive']
      },
      
      architect: {
        name: 'System Architect',
        description: 'Software architecture expert',
        systemPrompt: 'You are a software architecture expert. Help design systems, choose technologies, and plan implementations.',
        temperature: 0.5,
        maxTokens: 3000,
        traits: ['strategic', 'analytical', 'comprehensive']
      },
      
      debugger: {
        name: 'Debug Expert',
        description: 'Debugging specialist',
        systemPrompt: 'You are a debugging expert. Help identify bugs, analyze error messages, and suggest fixes.',
        temperature: 0.3,
        maxTokens: 2000,
        traits: ['analytical', 'methodical', 'precise']
      },
      
      creative: {
        name: 'Creative Coder',
        description: 'Creative programming assistant',
        systemPrompt: 'You are a creative programming assistant. Help with innovative solutions, creative coding, and experimental approaches.',
        temperature: 0.8,
        maxTokens: 2500,
        traits: ['creative', 'innovative', 'experimental']
      }
    };
    
    for (const [id, personality] of Object.entries(personalities)) {
      this.aiPersonalities.set(id, personality);
    }
  }

  /**
   * Load enhanced conversation modes
   */
  async loadConversationModes() {
    const modes = {
      chat: {
        name: 'Intelligent Chat',
        description: 'Context-aware general conversation',
        systemPrompt: 'You are NEXUS, an advanced AI assistant with deep project understanding.',
        temperature: 0.7,
        maxTokens: 4000,
        contextTypes: ['project', 'file', 'selection'],
        features: ['context_awareness', 'memory_integration', 'predictive_responses']
      },
      
      code_review: {
        name: 'Expert Code Review',
        description: 'Comprehensive code analysis with learning',
        systemPrompt: 'You are an expert code reviewer with deep understanding of best practices, security, and performance.',
        temperature: 0.3,
        maxTokens: 5000,
        contextTypes: ['file', 'selection', 'diff'],
        features: ['static_analysis', 'security_scan', 'performance_insights', 'learning_integration']
      },
      
      debugging: {
        name: 'Advanced Debugging',
        description: 'AI-powered debugging with visual insights',
        systemPrompt: 'You are a debugging expert with access to project context and execution history.',
        temperature: 0.2,
        maxTokens: 4000,
        contextTypes: ['error', 'stacktrace', 'logs', 'file'],
        features: ['execution_analysis', 'visual_debugging', 'predictive_debugging']
      },
      
      learning: {
        name: 'Adaptive Learning',
        description: 'Personalized learning with progress tracking',
        systemPrompt: 'You are an adaptive learning assistant that personalizes explanations based on user knowledge.',
        temperature: 0.5,
        maxTokens: 4000,
        contextTypes: ['concept', 'example', 'tutorial'],
        features: ['knowledge_tracking', 'adaptive_explanations', 'progress_monitoring']
      },
      
      architecture: {
        name: 'System Architecture',
        description: 'Enterprise-grade architecture guidance',
        systemPrompt: 'You are a senior architect with expertise in scalable, secure, and maintainable systems.',
        temperature: 0.4,
        maxTokens: 6000,
        contextTypes: ['project', 'requirements', 'constraints'],
        features: ['pattern_recognition', 'scalability_analysis', 'security_architecture']
      },
      
      pair_programming: {
        name: 'AI Pair Programming',
        description: 'Real-time collaborative coding',
        systemPrompt: 'You are an AI pair programming partner with real-time code understanding.',
        temperature: 0.6,
        maxTokens: 3000,
        contextTypes: ['file', 'selection', 'task'],
        features: ['real_time_collaboration', 'code_prediction', 'context_sharing']
      },
      
      natural_language: {
        name: 'Natural Language Programming',
        description: 'Code generation from natural language',
        systemPrompt: 'You are a natural language programming expert that converts ideas into working code.',
        temperature: 0.4,
        maxTokens: 4000,
        contextTypes: ['intent', 'requirements', 'examples'],
        features: ['nl_to_code', 'intent_understanding', 'code_optimization']
      },
      
      project_assistant: {
        name: 'Project Assistant',
        description: 'Comprehensive project management and guidance',
        systemPrompt: 'You are a project assistant with deep understanding of the entire codebase and project goals.',
        temperature: 0.5,
        maxTokens: 5000,
        contextTypes: ['project', 'tasks', 'timeline'],
        features: ['project_analysis', 'task_planning', 'resource_optimization']
      }
    };
    
    for (const [id, mode] of Object.entries(modes)) {
      this.conversationModes.set(id, mode);
    }
  }

  /**
   * Initialize long-term memory system
   */
  async initializeLongTermMemory() {
    try {
      // Initialize memory categories
      this.longTermMemory.set('user_preferences', new Map());
      this.longTermMemory.set('project_knowledge', new Map());
      this.longTermMemory.set('conversation_patterns', new Map());
      this.longTermMemory.set('code_patterns', new Map());
      this.longTermMemory.set('learning_progress', new Map());
      
      // Load existing memory from storage
      await this.loadMemoryFromStorage();
      
      logger.info('Long-term memory system initialized');
    } catch (error) {
      logger.warn('Failed to initialize long-term memory', { error: error.message });
    }
  }

  /**
   * Load memory from persistent storage
   */
  async loadMemoryFromStorage() {
    try {
      const memoryPath = path.join(__dirname, '../../data/memory');
      
      // Ensure memory directory exists
      try {
        await fs.access(memoryPath);
      } catch {
        await fs.mkdir(memoryPath, { recursive: true });
        return;
      }
      
      // Load memory files
      const memoryFiles = await fs.readdir(memoryPath);
      
      for (const file of memoryFiles) {
        if (file.endsWith('.json')) {
          const category = file.replace('.json', '');
          const filePath = path.join(memoryPath, file);
          
          try {
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            const memoryMap = new Map(Object.entries(data));
            this.longTermMemory.set(category, memoryMap);
          } catch (error) {
            logger.warn(`Failed to load memory file: ${file}`, { error: error.message });
          }
        }
      }
      
      logger.info('Memory loaded from storage', { categories: this.longTermMemory.size });
    } catch (error) {
      logger.warn('Failed to load memory from storage', { error: error.message });
    }
  }

  /**
   * Save memory to persistent storage
   */
  async saveMemoryToStorage() {
    try {
      const memoryPath = path.join(__dirname, '../../data/memory');
      await fs.mkdir(memoryPath, { recursive: true });
      
      for (const [category, memoryMap] of this.longTermMemory.entries()) {
        const filePath = path.join(memoryPath, `${category}.json`);
        const data = Object.fromEntries(memoryMap.entries());
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      }
      
      logger.debug('Memory saved to storage');
    } catch (error) {
      logger.warn('Failed to save memory to storage', { error: error.message });
    }
  }

  /**
   * Initialize semantic memory system
   */
  async initializeSemanticMemory() {
    try {
      this.semanticMemory.set('concepts', new Map());
      this.semanticMemory.set('relationships', new Map());
      this.semanticMemory.set('contexts', new Map());
      this.semanticMemory.set('patterns', new Map());
      
      logger.info('Semantic memory system initialized');
    } catch (error) {
      logger.warn('Failed to initialize semantic memory', { error: error.message });
    }
  }

  /**
   * Load user profiles
   */
  async loadUserProfiles() {
    try {
      const profilesPath = path.join(__dirname, '../../data/user-profiles.json');
      
      try {
        const data = JSON.parse(await fs.readFile(profilesPath, 'utf8'));
        this.userProfiles = new Map(Object.entries(data));
      } catch {
        // File doesn't exist, start with empty profiles
        logger.info('No existing user profiles found, starting fresh');
      }
      
      logger.info('User profiles loaded', { count: this.userProfiles.size });
    } catch (error) {
      logger.warn('Failed to load user profiles', { error: error.message });
    }
  }

  /**
   * Load project insights
   */
  async loadProjectInsights() {
    try {
      this.projectInsights.set('architecture_patterns', new Map());
      this.projectInsights.set('code_quality_trends', new Map());
      this.projectInsights.set('performance_metrics', new Map());
      this.projectInsights.set('security_insights', new Map());
      this.projectInsights.set('team_patterns', new Map());
      
      logger.info('Project insights system initialized');
    } catch (error) {
      logger.warn('Failed to initialize project insights', { error: error.message });
    }
  }

  /**
   * Initialize collaboration system
   */
  async initializeCollaborationSystem() {
    try {
      this.collaborationSessions.set('active_sessions', new Map());
      this.collaborationSessions.set('shared_contexts', new Map());
      this.collaborationSessions.set('team_knowledge', new Map());
      
      logger.info('Collaboration system initialized');
    } catch (error) {
      logger.warn('Failed to initialize collaboration system', { error: error.message });
    }
  }

  /**
   * Start learning processes
   */
  startLearningProcesses() {
    // Pattern learning process
    setInterval(() => {
      this.analyzeConversationPatterns();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Memory consolidation process
    setInterval(() => {
      this.consolidateMemory();
    }, 15 * 60 * 1000); // Every 15 minutes
    
    // Save memory periodically
    setInterval(() => {
      this.saveMemoryToStorage();
    }, 30 * 60 * 1000); // Every 30 minutes
    
    logger.info('Learning processes started');
  }

  /**
   * Initialize performance optimization
   */
  initializePerformanceOptimization() {
    // Cache optimization
    setInterval(() => {
      this.optimizeCaches();
    }, 10 * 60 * 1000); // Every 10 minutes
    
    // Performance monitoring
    setInterval(() => {
      this.monitorPerformance();
    }, 60 * 1000); // Every minute
    
    logger.info('Performance optimization initialized');
  }

  /**
   * Analyze conversation patterns for learning
   */
  analyzeConversationPatterns() {
    try {
      const patterns = this.longTermMemory.get('conversation_patterns');
      
      for (const conversation of this.conversations.values()) {
        if (conversation.messages.length < 2) continue;
        
        // Analyze user interaction patterns
        const userMessages = conversation.messages.filter(m => m.role === 'user');
        const pattern = {
          messageCount: userMessages.length,
          averageLength: userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length,
          topics: this.extractTopics(userMessages),
          timestamp: Date.now()
        };
        
        patterns.set(`${conversation.userId}_${conversation.mode}`, pattern);
      }
      
      logger.debug('Conversation patterns analyzed');
    } catch (error) {
      logger.warn('Failed to analyze conversation patterns', { error: error.message });
    }
  }

  /**
   * Consolidate memory for better retrieval
   */
  consolidateMemory() {
    try {
      // Consolidate frequently accessed memories
      for (const [category, memoryMap] of this.longTermMemory.entries()) {
        const consolidatedMemory = new Map();
        
        for (const [key, value] of memoryMap.entries()) {
          if (value.accessCount > 5) {
            consolidatedMemory.set(key, {
              ...value,
              consolidated: true,
              consolidatedAt: Date.now()
            });
          }
        }
        
        // Update memory with consolidated entries
        for (const [key, value] of consolidatedMemory.entries()) {
          memoryMap.set(key, value);
        }
      }
      
      logger.debug('Memory consolidated');
    } catch (error) {
      logger.warn('Failed to consolidate memory', { error: error.message });
    }
  }

  /**
   * Optimize caches for better performance
   */
  optimizeCaches() {
    try {
      const maxCacheSize = 1000;
      
      // Optimize response cache
      if (this.responseCache.size > maxCacheSize) {
        const entries = Array.from(this.responseCache.entries());
        entries.sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);
        
        this.responseCache.clear();
        entries.slice(0, maxCacheSize * 0.8).forEach(([key, value]) => {
          this.responseCache.set(key, value);
        });
      }
      
      // Optimize context cache
      if (this.contextCache.size > maxCacheSize) {
        const entries = Array.from(this.contextCache.entries());
        entries.sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);
        
        this.contextCache.clear();
        entries.slice(0, maxCacheSize * 0.8).forEach(([key, value]) => {
          this.contextCache.set(key, value);
        });
      }
      
      logger.debug('Caches optimized');
    } catch (error) {
      logger.warn('Failed to optimize caches', { error: error.message });
    }
  }

  /**
   * Monitor system performance
   */
  monitorPerformance() {
    try {
      const memoryUsage = process.memoryUsage();
      const performanceMetrics = {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        activeConversations: this.activeConversations.size,
        totalConversations: this.conversations.size,
        cacheSize: this.responseCache.size + this.contextCache.size,
        timestamp: Date.now()
      };
      
      // Store performance metrics
      const metrics = this.projectInsights.get('performance_metrics');
      metrics.set('current', performanceMetrics);
      
      // Alert if memory usage is high
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        logger.warn('High memory usage detected', { heapUsed: memoryUsage.heapUsed });
      }
      
    } catch (error) {
      logger.warn('Failed to monitor performance', { error: error.message });
    }
  }

  /**
   * Extract topics from messages
   */
  extractTopics(messages) {
    const topics = new Set();
    
    for (const message of messages) {
      const words = message.content.toLowerCase().split(/\s+/);
      const codeKeywords = ['function', 'class', 'variable', 'method', 'api', 'database', 'error', 'bug', 'test'];
      
      for (const word of words) {
        if (codeKeywords.includes(word)) {
          topics.add(word);
        }
      }
    }
    
    return Array.from(topics);
  }

  /**
   * Start a new conversation
   */
  async startConversation(options = {}) {
    const {
      personality = 'assistant',
      mode = 'chat',
      projectPath,
      userId = 'default',
      title
    } = options;
    
    const conversationId = this.generateConversationId();
    
    const conversation = {
      id: conversationId,
      userId,
      title: title || `Conversation ${conversationId.substring(0, 8)}`,
      personality,
      mode,
      projectPath,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messages: [],
      context: {
        project: null,
        files: [],
        selection: null,
        variables: new Map()
      },
      settings: {
        temperature: this.aiPersonalities.get(personality)?.temperature || 0.7,
        maxTokens: this.aiPersonalities.get(personality)?.maxTokens || 2000,
        contextWindow: this.contextWindow
      }
    };
    
    // Load project context if provided
    if (projectPath) {
      conversation.context.project = await this.loadProjectContext(projectPath);
    }
    
    this.conversations.set(conversationId, conversation);
    this.activeConversations.add(conversationId);
    
    this.conversationStats.totalConversations++;
    this.conversationStats.activeConversations++;
    
    this.emit('conversationStarted', { conversationId, conversation });
    
    logger.info('New conversation started', { conversationId, personality, mode });
    
    return conversationId;
  }

  /**
   * Enhanced message sending with advanced AI capabilities
   */
  async sendMessage(conversationId, message, options = {}) {
    const startTime = Date.now();
    
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    
    try {
      // Update conversation activity
      conversation.lastActivity = new Date().toISOString();
      this.activeConversations.add(conversationId);
      
      // Enhanced context analysis
      const enhancedContext = await this.analyzeEnhancedContext(conversation, message, options.context || {});
      
      // Check for cached responses
      const cacheKey = this.generateCacheKey(message, enhancedContext);
      const cachedResponse = this.responseCache.get(cacheKey);
      
      if (cachedResponse && this.isCacheValid(cachedResponse)) {
        cachedResponse.lastAccessed = Date.now();
        return this.formatCachedResponse(cachedResponse, conversationId);
      }
      
      // Add user message with enhanced metadata
      const userMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        context: enhancedContext,
        intent: await this.analyzeIntent(message),
        sentiment: await this.analyzeSentiment(message),
        complexity: this.analyzeComplexity(message)
      };
      
      conversation.messages.push(userMessage);
      
      // Update long-term memory
      await this.updateLongTermMemory(conversation.userId, userMessage);
      
      // Update context if provided
      if (options.context) {
        await this.updateConversationContext(conversationId, enhancedContext);
      }
      
      // Prepare enhanced AI request
      const aiRequest = await this.prepareEnhancedAIRequest(conversation, message, enhancedContext);
      
      // Get AI response with multi-model support
      const aiResponse = await this.getEnhancedAIResponse(conversation, aiRequest);
      
      // Add AI message with enhanced metadata
      const aiMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        metadata: {
          provider: aiResponse.provider,
          model: aiResponse.model,
          responseTime: Date.now() - startTime,
          tokensUsed: aiResponse.tokensUsed,
          confidence: aiResponse.confidence || 0.8,
          reasoning: aiResponse.reasoning,
          suggestions: aiResponse.suggestions || []
        }
      };
      
      conversation.messages.push(aiMessage);
      
      // Cache the response
      this.cacheResponse(cacheKey, aiMessage);
      
      // Update statistics and learning
      const responseTime = Date.now() - startTime;
      this.conversationStats.totalMessages += 2;
      this.conversationStats.successfulResponses++;
      this.updateAverageResponseTime(responseTime);
      
      // Learn from interaction
      await this.learnFromInteraction(conversation, userMessage, aiMessage);
      
      // Update user profile
      await this.updateUserProfile(conversation.userId, userMessage, aiMessage);
      
      // Trim conversation history if needed
      this.trimConversationHistory(conversation);
      
      this.emit('messageReceived', { 
        conversationId, 
        userMessage, 
        aiMessage, 
        context: enhancedContext 
      });
      
      return {
        messageId: aiMessage.id,
        content: aiMessage.content,
        metadata: aiMessage.metadata,
        context: enhancedContext,
        suggestions: aiMessage.metadata.suggestions
      };
      
    } catch (error) {
      logger.error('Failed to send message', { conversationId, error: error.message });
      
      // Add error message
      const errorMessage = {
        id: this.generateMessageId(),
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      conversation.messages.push(errorMessage);
      
      throw error;
    }
  }

  /**
   * Prepare AI request with context
   */
  async prepareAIRequest(conversation, message, options) {
    const personality = this.aiPersonalities.get(conversation.personality);
    const mode = this.conversationModes.get(conversation.mode);
    
    // Build system prompt
    let systemPrompt = personality.systemPrompt;
    
    // Add project context to system prompt
    if (conversation.context.project) {
      systemPrompt += `\n\nProject Context:\n${this.formatProjectContext(conversation.context.project)}`;
    }
    
    // Add mode-specific instructions
    if (mode) {
      systemPrompt += `\n\nConversation Mode: ${mode.name}\n${mode.description}`;
    }
    
    // Build conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add recent conversation history
    const recentMessages = conversation.messages.slice(-conversation.settings.contextWindow);
    messages.push(...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    return {
      messages,
      temperature: conversation.settings.temperature,
      maxTokens: conversation.settings.maxTokens,
      personality: conversation.personality,
      mode: conversation.mode
    };
  }

  /**
   * Get enhanced AI response with multi-model support
   */
  async getEnhancedAIResponse(conversation, request) {
    // Choose best AI provider based on conversation mode
    const provider = this.selectBestProvider(conversation.mode, conversation.personality);
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: request.messages,
      temperature: request.temperature,
      maxTokens: request.maxTokens
    });
    
    return {
      content: response.content,
      provider: provider.name,
      model: provider.model,
      tokensUsed: response.usage?.totalTokens || 0,
      confidence: response.confidence || 0.8,
      reasoning: response.reasoning || null,
      suggestions: response.suggestions || []
    };
  }

  /**
   * Analyze enhanced context for better AI understanding
   */
  async analyzeEnhancedContext(conversation, message, context) {
    const enhanced = { ...context };
    
    // Add conversation history context
    enhanced.recentMessages = conversation.messages.slice(-5);
    
    // Add project context if available
    if (conversation.context.project) {
      enhanced.projectInfo = {
        name: conversation.context.project.name,
        technologies: conversation.context.project.technologies,
        structure: conversation.context.project.structure
      };
    }
    
    // Add user profile context
    const userProfile = this.userProfiles.get(conversation.userId);
    if (userProfile) {
      enhanced.userPreferences = userProfile.preferences;
      enhanced.skillLevel = userProfile.skillLevel;
    }
    
    return enhanced;
  }

  /**
   * Prepare enhanced AI request with better context
   */
  async prepareEnhancedAIRequest(conversation, message, context) {
    const personality = this.aiPersonalities.get(conversation.personality);
    const mode = this.conversationModes.get(conversation.mode);
    
    // Build enhanced system prompt
    let systemPrompt = personality.systemPrompt;
    
    // Add project context to system prompt
    if (conversation.context.project) {
      systemPrompt += `\n\nProject Context:\n${this.formatProjectContext(conversation.context.project)}`;
    }
    
    // Add mode-specific instructions
    if (mode) {
      systemPrompt += `\n\nConversation Mode: ${mode.name}\n${mode.description}`;
    }
    
    // Add user context
    if (context.userPreferences) {
      systemPrompt += `\n\nUser Preferences: ${JSON.stringify(context.userPreferences)}`;
    }
    
    // Build conversation history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add recent conversation history
    const recentMessages = conversation.messages.slice(-conversation.settings.contextWindow);
    messages.push(...recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    return {
      messages,
      temperature: conversation.settings.temperature,
      maxTokens: conversation.settings.maxTokens,
      personality: conversation.personality,
      mode: conversation.mode,
      context
    };
  }

  /**
   * Select best AI provider for conversation
   */
  selectBestProvider(mode, personality) {
    // Provider selection logic based on mode and personality
    const providerPreferences = {
      chat: ['gpt-4', 'claude', 'llama'],
      code_review: ['claude', 'gpt-4', 'codellama'],
      debugging: ['gpt-4', 'claude', 'codellama'],
      learning: ['claude', 'gpt-4', 'llama'],
      architecture: ['gpt-4', 'claude', 'llama'],
      pair_programming: ['gpt-4', 'codellama', 'claude']
    };
    
    const preferences = providerPreferences[mode] || ['gpt-4', 'claude', 'llama'];
    
    // Get available providers
    const availableProviders = this.aiModels.getAvailableProviders();
    
    // Find best match
    for (const preferred of preferences) {
      const provider = availableProviders.find(p => 
        p.name.toLowerCase().includes(preferred) && p.status === 'active'
      );
      if (provider) {
        return provider;
      }
    }
    
    // Fallback to any available provider
    return availableProviders.find(p => p.status === 'active') || availableProviders[0];
  }

  /**
   * Load project context
   */
  async loadProjectContext(projectPath) {
    try {
      const context = {
        path: projectPath,
        name: path.basename(projectPath),
        structure: await this.analyzeProjectStructure(projectPath),
        technologies: await this.detectTechnologies(projectPath),
        dependencies: await this.loadDependencies(projectPath),
        readme: await this.loadReadme(projectPath),
        gitInfo: await this.loadGitInfo(projectPath)
      };
      
      this.projectContext.set(projectPath, context);
      return context;
    } catch (error) {
      logger.warn('Failed to load project context', { projectPath, error: error.message });
      return null;
    }
  }

  /**
   * Analyze project structure
   */
  async analyzeProjectStructure(projectPath) {
    try {
      const structure = {
        directories: [],
        files: [],
        totalFiles: 0,
        codeFiles: 0
      };
      
      const items = await fs.readdir(projectPath, { withFileTypes: true });
      
      for (const item of items) {
        if (item.name.startsWith('.') && !item.name.startsWith('.git')) continue;
        
        const itemPath = path.join(projectPath, item.name);
        
        if (item.isDirectory()) {
          structure.directories.push({
            name: item.name,
            path: itemPath
          });
        } else {
          const ext = path.extname(item.name);
          const isCodeFile = this.isCodeFile(ext);
          
          structure.files.push({
            name: item.name,
            path: itemPath,
            extension: ext,
            isCode: isCodeFile
          });
          
          structure.totalFiles++;
          if (isCodeFile) structure.codeFiles++;
        }
      }
      
      return structure;
    } catch (error) {
      logger.warn('Failed to analyze project structure', { error: error.message });
      return null;
    }
  }

  /**
   * Detect project technologies
   */
  async detectTechnologies(projectPath) {
    const technologies = [];
    
    try {
      // Check for common config files
      const configFiles = {
        'package.json': 'Node.js/JavaScript',
        'requirements.txt': 'Python',
        'Cargo.toml': 'Rust',
        'go.mod': 'Go',
        'pom.xml': 'Java/Maven',
        'build.gradle': 'Java/Gradle',
        'Gemfile': 'Ruby',
        'composer.json': 'PHP',
        'pubspec.yaml': 'Dart/Flutter',
        'CMakeLists.txt': 'C/C++'
      };
      
      for (const [file, tech] of Object.entries(configFiles)) {
        try {
          await fs.access(path.join(projectPath, file));
          technologies.push(tech);
        } catch {}
      }
      
      return technologies;
    } catch (error) {
      logger.warn('Failed to detect technologies', { error: error.message });
      return [];
    }
  }

  /**
   * Load project dependencies
   */
  async loadDependencies(projectPath) {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {}
      };
    } catch {
      return null;
    }
  }

  /**
   * Load README content
   */
  async loadReadme(projectPath) {
    const readmeFiles = ['README.md', 'README.txt', 'README', 'readme.md'];
    
    for (const filename of readmeFiles) {
      try {
        const content = await fs.readFile(path.join(projectPath, filename), 'utf8');
        return { filename, content: content.substring(0, 2000) }; // Limit size
      } catch {}
    }
    
    return null;
  }

  /**
   * Load Git information
   */
  async loadGitInfo(projectPath) {
    try {
      const gitPath = path.join(projectPath, '.git');
      await fs.access(gitPath);
      
      return {
        isGitRepo: true,
        // Could add more git info like current branch, recent commits, etc.
      };
    } catch {
      return { isGitRepo: false };
    }
  }

  /**
   * Update conversation context
   */
  async updateConversationContext(conversationId, context) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return;
    
    if (context.file) {
      conversation.context.files.push(context.file);
    }
    
    if (context.selection) {
      conversation.context.selection = context.selection;
    }
    
    if (context.variables) {
      for (const [key, value] of Object.entries(context.variables)) {
        conversation.context.variables.set(key, value);
      }
    }
  }

  /**
   * Format project context for AI
   */
  formatProjectContext(project) {
    let context = `Project: ${project.name}\n`;
    
    if (project.technologies.length > 0) {
      context += `Technologies: ${project.technologies.join(', ')}\n`;
    }
    
    if (project.structure) {
      context += `Files: ${project.structure.totalFiles} total, ${project.structure.codeFiles} code files\n`;
    }
    
    if (project.readme) {
      context += `README: ${project.readme.content.substring(0, 500)}...\n`;
    }
    
    return context;
  }

  /**
   * Get conversation
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  /**
   * List conversations
   */
  listConversations(userId = null) {
    const conversations = Array.from(this.conversations.values());
    
    if (userId) {
      return conversations.filter(conv => conv.userId === userId);
    }
    
    return conversations;
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return false;
    
    this.conversations.delete(conversationId);
    this.activeConversations.delete(conversationId);
    
    if (this.activeConversations.has(conversationId)) {
      this.conversationStats.activeConversations--;
    }
    
    this.emit('conversationDeleted', { conversationId });
    
    return true;
  }

  /**
   * Trim conversation history
   */
  trimConversationHistory(conversation) {
    const maxMessages = conversation.settings.contextWindow * 2; // Keep more for context
    
    if (conversation.messages.length > maxMessages) {
      const toRemove = conversation.messages.length - maxMessages;
      conversation.messages.splice(0, toRemove);
    }
  }

  /**
   * Setup cleanup intervals
   */
  setupCleanupIntervals() {
    // Clean up inactive conversations every hour
    setInterval(() => {
      this.cleanupInactiveConversations();
    }, 60 * 60 * 1000);
    
    // Clean up project context cache every 30 minutes
    setInterval(() => {
      this.cleanupProjectContextCache();
    }, 30 * 60 * 1000);
  }

  /**
   * Cleanup inactive conversations
   */
  cleanupInactiveConversations() {
    const now = Date.now();
    const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [id, conversation] of this.conversations.entries()) {
      const lastActivity = new Date(conversation.lastActivity).getTime();
      
      if (now - lastActivity > maxInactiveTime) {
        this.deleteConversation(id);
        logger.info('Cleaned up inactive conversation', { conversationId: id });
      }
    }
  }

  /**
   * Cleanup project context cache
   */
  cleanupProjectContextCache() {
    // Remove unused project contexts
    const usedProjects = new Set();
    
    for (const conversation of this.conversations.values()) {
      if (conversation.projectPath) {
        usedProjects.add(conversation.projectPath);
      }
    }
    
    for (const projectPath of this.projectContext.keys()) {
      if (!usedProjects.has(projectPath)) {
        this.projectContext.delete(projectPath);
      }
    }
  }

  // Utility methods
  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  isCodeFile(extension) {
    const codeExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs', '.cpp', '.c',
      '.h', '.hpp', '.cs', '.php', '.rb', '.swift', '.kt', '.scala', '.clj',
      '.hs', '.ml', '.fs', '.elm', '.dart', '.lua', '.r', '.m', '.pl', '.sh'
    ];
    
    return codeExtensions.includes(extension.toLowerCase());
  }

  updateAverageResponseTime(responseTime) {
    const total = this.conversationStats.averageResponseTime * (this.conversationStats.successfulResponses - 1);
    this.conversationStats.averageResponseTime = (total + responseTime) / this.conversationStats.successfulResponses;
  }

  /**
   * Analyze user intent from message
   */
  async analyzeIntent(message) {
    const intents = {
      question: /\?|how|what|why|when|where|who/i,
      request: /please|can you|could you|would you/i,
      command: /create|generate|build|make|write/i,
      debug: /error|bug|issue|problem|fix/i,
      explain: /explain|describe|tell me about/i,
      review: /review|check|look at|analyze/i
    };
    
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(message)) {
        return intent;
      }
    }
    
    return 'general';
  }

  /**
   * Analyze message sentiment
   */
  async analyzeSentiment(message) {
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'awesome', 'thanks'];
    const negativeWords = ['bad', 'terrible', 'awful', 'wrong', 'error', 'problem'];
    
    const words = message.toLowerCase().split(/\s+/);
    let score = 0;
    
    for (const word of words) {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    }
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Analyze message complexity
   */
  analyzeComplexity(message) {
    const length = message.length;
    const words = message.split(/\s+/).length;
    const sentences = message.split(/[.!?]+/).length;
    
    let complexity = 'simple';
    
    if (length > 500 || words > 100 || sentences > 10) {
      complexity = 'complex';
    } else if (length > 200 || words > 40 || sentences > 5) {
      complexity = 'medium';
    }
    
    return complexity;
  }

  /**
   * Generate cache key for responses
   */
  generateCacheKey(message, context) {
    const contextStr = JSON.stringify(context);
    return crypto.createHash('md5').update(message + contextStr).digest('hex');
  }

  /**
   * Check if cached response is still valid
   */
  isCacheValid(cachedResponse) {
    const maxAge = 30 * 60 * 1000; // 30 minutes
    return Date.now() - cachedResponse.timestamp < maxAge;
  }

  /**
   * Format cached response
   */
  formatCachedResponse(cachedResponse, conversationId) {
    return {
      messageId: cachedResponse.id,
      content: cachedResponse.content,
      metadata: {
        ...cachedResponse.metadata,
        cached: true,
        originalTimestamp: cachedResponse.timestamp
      },
      cached: true
    };
  }

  /**
   * Cache AI response
   */
  cacheResponse(cacheKey, aiMessage) {
    this.responseCache.set(cacheKey, {
      ...aiMessage,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  /**
   * Update long-term memory with user interaction
   */
  async updateLongTermMemory(userId, userMessage) {
    try {
      const userMemory = this.longTermMemory.get('user_preferences');
      
      if (!userMemory.has(userId)) {
        userMemory.set(userId, {
          messageCount: 0,
          topics: new Set(),
          patterns: [],
          preferences: {}
        });
      }
      
      const memory = userMemory.get(userId);
      memory.messageCount++;
      
      // Extract topics from message
      const topics = this.extractTopics([userMessage]);
      topics.forEach(topic => memory.topics.add(topic));
      
      // Update access count
      memory.accessCount = (memory.accessCount || 0) + 1;
      memory.lastAccessed = Date.now();
      
      userMemory.set(userId, memory);
    } catch (error) {
      logger.warn('Failed to update long-term memory', { error: error.message });
    }
  }

  /**
   * Learn from user-AI interaction
   */
  async learnFromInteraction(conversation, userMessage, aiMessage) {
    try {
      const patterns = this.longTermMemory.get('conversation_patterns');
      const patternKey = `${conversation.userId}_${conversation.mode}_${userMessage.intent}`;
      
      if (!patterns.has(patternKey)) {
        patterns.set(patternKey, {
          count: 0,
          successRate: 0,
          averageResponseTime: 0,
          topics: new Set()
        });
      }
      
      const pattern = patterns.get(patternKey);
      pattern.count++;
      pattern.topics.add(userMessage.intent);
      
      // Update success rate based on response quality
      const responseTime = aiMessage.metadata.responseTime;
      pattern.averageResponseTime = (pattern.averageResponseTime + responseTime) / 2;
      
      patterns.set(patternKey, pattern);
    } catch (error) {
      logger.warn('Failed to learn from interaction', { error: error.message });
    }
  }

  /**
   * Update user profile based on interactions
   */
  async updateUserProfile(userId, userMessage, aiMessage) {
    try {
      if (!this.userProfiles.has(userId)) {
        this.userProfiles.set(userId, {
          messageCount: 0,
          skillLevel: 'beginner',
          preferences: {
            responseStyle: 'detailed',
            codeExamples: true,
            explanationLevel: 'intermediate'
          },
          topics: new Set(),
          lastActive: Date.now()
        });
      }
      
      const profile = this.userProfiles.get(userId);
      profile.messageCount++;
      profile.lastActive = Date.now();
      
      // Analyze skill level based on message complexity
      if (userMessage.complexity === 'complex') {
        if (profile.skillLevel === 'beginner') {
          profile.skillLevel = 'intermediate';
        } else if (profile.skillLevel === 'intermediate') {
          profile.skillLevel = 'advanced';
        }
      }
      
      // Update topics of interest
      const topics = this.extractTopics([userMessage]);
      topics.forEach(topic => profile.topics.add(topic));
      
      this.userProfiles.set(userId, profile);
    } catch (error) {
      logger.warn('Failed to update user profile', { error: error.message });
    }
  }

  /**
   * Semantic memory management
   */
  async addToSemanticMemory(content, metadata = {}) {
    try {
      const embedding = await this.generateEmbedding(content);
      const memoryItem = {
        id: this.generateMessageId(),
        content,
        embedding,
        metadata: {
          ...metadata,
          timestamp: Date.now(),
          accessCount: 0,
          relevanceScore: 1.0
        }
      };
      
      const semanticItems = this.semanticMemory.get('concepts') || new Map();
      semanticItems.set(memoryItem.id, memoryItem);
      this.semanticMemory.set('concepts', semanticItems);
      
      // Update semantic index
      await this.updateSemanticIndex(memoryItem);
      
      return memoryItem.id;
    } catch (error) {
      logger.error('Error adding to semantic memory:', error);
      throw error;
    }
  }

  async searchSemanticMemory(query, limit = 10, threshold = 0.7) {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const results = [];
      const semanticItems = this.semanticMemory.get('concepts') || new Map();
      
      for (const [id, item] of semanticItems) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, item.embedding);
        if (similarity >= threshold) {
          results.push({
            id,
            content: item.content,
            metadata: item.metadata,
            similarity
          });
        }
      }
      
      // Sort by similarity and limit results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error searching semantic memory:', error);
      return [];
    }
  }

  async generateEmbedding(text) {
    // Placeholder for embedding generation
    // In real implementation, use OpenAI embeddings or similar
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return Array.from({length: 384}, (_, i) => 
      parseInt(hash.substr(i % hash.length, 2), 16) / 255
    );
  }

  calculateCosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async updateSemanticIndex(memoryItem) {
    // Update semantic clustering and indexing
    const clusters = this.semanticClusters || new Map();
    const cluster = this.findBestCluster(memoryItem.embedding, clusters);
    
    if (cluster) {
      cluster.items.push(memoryItem.id);
      cluster.centroid = this.updateCentroid(cluster.centroid, memoryItem.embedding);
    } else {
      // Create new cluster
      const newCluster = {
        id: this.generateMessageId(),
        centroid: [...memoryItem.embedding],
        items: [memoryItem.id],
        metadata: {
          created: Date.now(),
          topic: await this.extractTopic(memoryItem.content)
        }
      };
      clusters.set(newCluster.id, newCluster);
    }
    
    this.semanticClusters = clusters;
  }

  findBestCluster(embedding, clusters, threshold = 0.8) {
    let bestCluster = null;
    let bestSimilarity = 0;
    
    for (const cluster of clusters.values()) {
      const similarity = this.calculateCosineSimilarity(embedding, cluster.centroid);
      if (similarity > bestSimilarity && similarity >= threshold) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }
    
    return bestCluster;
  }

  updateCentroid(currentCentroid, newEmbedding) {
    return currentCentroid.map((val, i) => (val + newEmbedding[i]) / 2);
  }

  async extractTopic(content) {
    // Simple topic extraction - in real implementation use NLP
    const words = content.toLowerCase().split(/\W+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const keywords = words.filter(word => word.length > 3 && !commonWords.includes(word));
    return keywords.slice(0, 3).join(' ');
  }

  /**
   * Collaboration features
   */
  async createCollaborationSession(options = {}) {
    const {
      sessionName,
      participants = [],
      projectPath,
      permissions = {}
    } = options;
    
    const sessionId = this.generateConversationId();
    const session = {
      id: sessionId,
      name: sessionName || `Collaboration ${sessionId.substring(0, 8)}`,
      participants: new Set(participants),
      projectPath,
      permissions,
      sharedContext: new Map(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      conversations: new Set()
    };
    
    const activeSessions = this.collaborationSessions.get('active_sessions');
    activeSessions.set(sessionId, session);
    
    logger.info('Collaboration session created', { sessionId, participants: participants.length });
    
    return sessionId;
  }

  async joinCollaborationSession(sessionId, userId, permissions = {}) {
    const activeSessions = this.collaborationSessions.get('active_sessions');
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error('Collaboration session not found');
    }
    
    session.participants.add(userId);
    session.permissions[userId] = permissions;
    session.lastActivity = Date.now();
    
    this.emit('userJoinedCollaboration', { sessionId, userId });
    
    return session;
  }

  async shareContextInSession(sessionId, contextData) {
        const activeSessions = this.collaborationSessions.get('active_sessions');
        const session = activeSessions.get(sessionId);
        
        if (!session) {
            throw new Error('Collaboration session not found');
        }
        
        const contextId = this.generateMessageId();
        session.sharedContext.set(contextId, {
            ...contextData,
            timestamp: Date.now(),
            id: contextId
        });
        
        this.emit('contextShared', { sessionId, contextId, contextData });
        
        return contextId;
    }

    async getCollaborationInsights(sessionId) {
        const activeSessions = this.collaborationSessions.get('active_sessions');
        const session = activeSessions.get(sessionId);
        
        if (!session) {
            throw new Error('Collaboration session not found');
        }
        
        const insights = {
            participantActivity: {},
            sharedContextSummary: [],
            conversationTopics: [],
            productivityMetrics: {}
        };
        
        // Analyze participant activity
        for (const participantId of session.participants) {
            const profile = this.userProfiles.get(participantId);
            if (profile) {
                insights.participantActivity[participantId] = {
                    messagesCount: profile.stats.totalMessages || 0,
                    lastActivity: profile.lastActivity,
                    expertise: profile.expertise || [],
                    contributions: profile.contributions || []
                };
            }
        }
        
        // Summarize shared context
        for (const [contextId, context] of session.sharedContext) {
            insights.sharedContextSummary.push({
                id: contextId,
                type: context.type || 'unknown',
                timestamp: context.timestamp,
                summary: context.summary || context.content?.substring(0, 100)
            });
        }
        
        return insights;
    }

    /**
     * Team context management
     */
    async updateTeamContext(teamId, contextData) {
        const teamContexts = this.teamContext.get('teams') || new Map();
        const existingContext = teamContexts.get(teamId) || {
            id: teamId,
            members: new Set(),
            sharedKnowledge: new Map(),
            workingPatterns: {},
            codeStandards: {},
            projectHistory: [],
            createdAt: Date.now()
        };
        
        // Update context with new data
        Object.assign(existingContext, {
            ...contextData,
            lastUpdated: Date.now()
        });
        
        teamContexts.set(teamId, existingContext);
        this.teamContext.set('teams', teamContexts);
        
        logger.info('Team context updated', { teamId, membersCount: existingContext.members.size });
        
        return existingContext;
    }

    async getTeamContext(teamId) {
        const teamContexts = this.teamContext.get('teams') || new Map();
        return teamContexts.get(teamId);
    }

    async addTeamMember(teamId, userId, role = 'member') {
        const teamContext = await this.getTeamContext(teamId);
        if (!teamContext) {
            throw new Error('Team context not found');
        }
        
        teamContext.members.add(userId);
        teamContext.memberRoles = teamContext.memberRoles || {};
        teamContext.memberRoles[userId] = role;
        
        await this.updateTeamContext(teamId, teamContext);
        
        return teamContext;
    }

    async shareTeamKnowledge(teamId, knowledge) {
        const teamContext = await this.getTeamContext(teamId);
        if (!teamContext) {
            throw new Error('Team context not found');
        }
        
        const knowledgeId = this.generateMessageId();
        teamContext.sharedKnowledge.set(knowledgeId, {
            ...knowledge,
            id: knowledgeId,
            timestamp: Date.now(),
            accessCount: 0
        });
        
        await this.updateTeamContext(teamId, teamContext);
        
        return knowledgeId;
    }

    /**
     * Advanced user learning system
     */
    async analyzeUserLearningProgress(userId) {
        const profile = this.userProfiles.get(userId);
        if (!profile) {
            return null;
        }
        
        const learningAnalysis = {
            skillProgression: {},
            learningVelocity: 0,
            knowledgeGaps: [],
            recommendedTopics: [],
            masteryLevel: {}
        };
        
        // Analyze skill progression
        const interactions = profile.interactions || [];
        const recentInteractions = interactions.filter(i => 
            Date.now() - i.timestamp < 30 * 24 * 60 * 60 * 1000 // Last 30 days
        );
        
        // Calculate learning velocity
        if (recentInteractions.length > 0) {
            const oldestInteraction = Math.min(...recentInteractions.map(i => i.timestamp));
            const timeSpan = Date.now() - oldestInteraction;
            learningAnalysis.learningVelocity = recentInteractions.length / (timeSpan / (24 * 60 * 60 * 1000));
        }
        
        // Identify knowledge gaps
        const topicFrequency = {};
        recentInteractions.forEach(interaction => {
            if (interaction.topics) {
                interaction.topics.forEach(topic => {
                    topicFrequency[topic] = (topicFrequency[topic] || 0) + 1;
                });
            }
        });
        
        // Find topics with low frequency but high error rate
        Object.entries(topicFrequency).forEach(([topic, frequency]) => {
            const topicInteractions = recentInteractions.filter(i => 
                i.topics && i.topics.includes(topic)
            );
            const errorRate = topicInteractions.filter(i => i.hadErrors).length / topicInteractions.length;
            
            if (errorRate > 0.3 && frequency < 5) {
                learningAnalysis.knowledgeGaps.push({
                    topic,
                    errorRate,
                    frequency,
                    priority: errorRate * (1 / frequency)
                });
            }
        });
        
        // Sort knowledge gaps by priority
        learningAnalysis.knowledgeGaps.sort((a, b) => b.priority - a.priority);
        
        return learningAnalysis;
    }

    async generatePersonalizedRecommendations(userId) {
        const profile = this.userProfiles.get(userId);
        const learningProgress = await this.analyzeUserLearningProgress(userId);
        
        if (!profile || !learningProgress) {
            return [];
        }
        
        const recommendations = [];
        
        // Recommend based on knowledge gaps
        learningProgress.knowledgeGaps.slice(0, 3).forEach(gap => {
            recommendations.push({
                type: 'knowledge_gap',
                topic: gap.topic,
                priority: 'high',
                description: `Improve understanding of ${gap.topic}`,
                suggestedActions: [
                    `Practice ${gap.topic} concepts`,
                    `Review ${gap.topic} documentation`,
                    `Work on ${gap.topic} projects`
                ]
            });
        });
        
        // Recommend based on interests
        if (profile.interests && profile.interests.length > 0) {
            profile.interests.slice(0, 2).forEach(interest => {
                recommendations.push({
                    type: 'interest_based',
                    topic: interest,
                    priority: 'medium',
                    description: `Explore advanced ${interest} topics`,
                    suggestedActions: [
                        `Try advanced ${interest} techniques`,
                        `Join ${interest} communities`,
                        `Contribute to ${interest} projects`
                    ]
                });
            });
        }
        
        return recommendations;
    }

    async updateUserSkillLevel(userId, skill, level, evidence = {}) {
        const profile = this.userProfiles.get(userId) || this.createUserProfile(userId);
        
        profile.skills = profile.skills || {};
        profile.skills[skill] = {
            level,
            lastUpdated: Date.now(),
            evidence,
            progression: profile.skills[skill]?.progression || []
        };
        
        // Track skill progression
        profile.skills[skill].progression.push({
            level,
            timestamp: Date.now(),
            evidence
        });
        
        // Keep only last 10 progression entries
        if (profile.skills[skill].progression.length > 10) {
            profile.skills[skill].progression = profile.skills[skill].progression.slice(-10);
        }
        
        this.userProfiles.set(userId, profile);
        
        logger.info('User skill level updated', { userId, skill, level });
        
        return profile.skills[skill];
    }

    /**
     * Performance optimization methods
     */
    async optimizeMemoryUsage() {
        const startTime = Date.now();
        let optimizedItems = 0;
        
        try {
            // Optimize semantic memory
            const semanticItems = this.semanticMemory.get('concepts') || new Map();
            const cutoffTime = Date.now() - (90 * 24 * 60 * 60 * 1000); // 90 days
            
            for (const [id, item] of semanticItems) {
                if (item.metadata.timestamp < cutoffTime && item.metadata.accessCount < 5) {
                    semanticItems.delete(id);
                    optimizedItems++;
                }
            }
            
            // Optimize user profiles
            for (const [userId, profile] of this.userProfiles) {
                if (profile.lastActivity < cutoffTime) {
                    // Archive old interactions
                    if (profile.interactions && profile.interactions.length > 100) {
                        profile.interactions = profile.interactions.slice(-50);
                        optimizedItems++;
                    }
                }
            }
            
            // Optimize conversation history
            for (const [conversationId, conversation] of this.conversations) {
                if (conversation.lastActivity < cutoffTime) {
                    // Trim old conversation history
                    if (conversation.messages && conversation.messages.length > 200) {
                        conversation.messages = conversation.messages.slice(-100);
                        optimizedItems++;
                    }
                }
            }
            
            // Optimize semantic clusters
            if (this.semanticClusters) {
                for (const [clusterId, cluster] of this.semanticClusters) {
                    if (cluster.items.length === 0) {
                        this.semanticClusters.delete(clusterId);
                        optimizedItems++;
                    }
                }
            }
            
            const optimizationTime = Date.now() - startTime;
            logger.info('Memory optimization completed', { 
                optimizedItems, 
                optimizationTime,
                memoryUsage: process.memoryUsage()
            });
            
            return {
                optimizedItems,
                optimizationTime,
                memoryUsage: process.memoryUsage()
            };
        } catch (error) {
            logger.error('Memory optimization failed:', error);
            throw error;
        }
    }

    async performanceAnalysis() {
        const analysis = {
            memoryUsage: process.memoryUsage(),
            conversationMetrics: {
                active: this.activeConversations.size,
                total: this.conversations.size,
                averageResponseTime: this.conversationStats.averageResponseTime || 0,
                totalMessages: this.conversationStats.totalMessages || 0
            },
            systemMetrics: {
                semanticMemorySize: this.semanticMemory.get('concepts')?.size || 0,
                userProfilesCount: this.userProfiles.size,
                collaborationSessionsCount: this.collaborationSessions.get('active_sessions')?.size || 0,
                projectContextsCount: this.projectContext.size
            },
            recommendations: []
        };
        
        // Generate performance recommendations
        if (analysis.memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
            analysis.recommendations.push({
                type: 'memory',
                priority: 'high',
                message: 'High memory usage detected. Consider running memory optimization.'
            });
        }
        
        if (analysis.conversationMetrics.averageResponseTime > 2000) { // 2 seconds
            analysis.recommendations.push({
                type: 'performance',
                priority: 'medium',
                message: 'Slow response times detected. Consider optimizing AI provider selection.'
            });
        }
        
        if (analysis.systemMetrics.semanticMemorySize > 10000) {
            analysis.recommendations.push({
                type: 'storage',
                priority: 'medium',
                message: 'Large semantic memory detected. Consider archiving old entries.'
            });
        }
        
        return analysis;
    }

    async cacheWarmup() {
        logger.info('Starting cache warmup...');
        
        try {
            // Preload frequently used AI personalities
            const popularPersonalities = ['assistant', 'mentor', 'architect'];
            for (const personality of popularPersonalities) {
                if (this.aiPersonalities.has(personality)) {
                    // Simulate loading personality context
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            // Preload common conversation modes
            const commonModes = ['chat', 'code_review', 'debugging'];
            for (const mode of commonModes) {
                if (this.conversationModes.has(mode)) {
                    // Simulate loading mode context
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            
            // Preload semantic memory clusters
            if (this.semanticClusters && this.semanticClusters.size > 0) {
                // Simulate cluster indexing
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            logger.info('Cache warmup completed successfully');
            return true;
        } catch (error) {
            logger.error('Cache warmup failed:', error);
            return false;
        }
    }

    /**
     * Advanced cleanup and maintenance
     */
    async performMaintenance() {
        logger.info('Starting system maintenance...');
        
        const maintenanceResults = {
            memoryOptimization: null,
            cacheCleanup: null,
            indexRebuild: null,
            performanceAnalysis: null
        };
        
        try {
            // Memory optimization
            maintenanceResults.memoryOptimization = await this.optimizeMemoryUsage();
            
            // Cache cleanup
            maintenanceResults.cacheCleanup = await this.cleanupExpiredCache();
            
            // Rebuild semantic indexes
            maintenanceResults.indexRebuild = await this.rebuildSemanticIndexes();
            
            // Performance analysis
            maintenanceResults.performanceAnalysis = await this.performanceAnalysis();
            
            // Update maintenance timestamp
            this.lastMaintenanceTime = Date.now();
            
            logger.info('System maintenance completed', maintenanceResults);
            
            return maintenanceResults;
        } catch (error) {
            logger.error('System maintenance failed:', error);
            throw error;
        }
    }

    async cleanupExpiredCache() {
        const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        let cleanedItems = 0;
        
        // Clean conversation cache
        for (const [conversationId, conversation] of this.conversations) {
            if (conversation.lastActivity < cutoffTime && !this.activeConversations.has(conversationId)) {
                // Archive conversation instead of deleting
                conversation.archived = true;
                cleanedItems++;
            }
        }
        
        // Clean project context cache
        for (const [projectPath, context] of this.projectContext) {
            if (context.lastAccessed < cutoffTime) {
                this.projectContext.delete(projectPath);
                cleanedItems++;
            }
        }
        
        logger.info('Cache cleanup completed', { cleanedItems });
        
        return { cleanedItems };
    }

    async rebuildSemanticIndexes() {
        logger.info('Rebuilding semantic indexes...');
        
        try {
            const semanticItems = this.semanticMemory.get('concepts') || new Map();
            const newClusters = new Map();
            
            // Rebuild clusters from scratch
            for (const [id, item] of semanticItems) {
                const cluster = this.findBestCluster(item.embedding, newClusters, 0.7);
                
                if (cluster) {
                    cluster.items.push(id);
                    cluster.centroid = this.updateCentroid(cluster.centroid, item.embedding);
                } else {
                    const newCluster = {
                        id: this.generateMessageId(),
                        centroid: [...item.embedding],
                        items: [id],
                        metadata: {
                            created: Date.now(),
                            topic: await this.extractTopic(item.content)
                        }
                    };
                    newClusters.set(newCluster.id, newCluster);
                }
            }
            
            this.semanticClusters = newClusters;
            
            logger.info('Semantic indexes rebuilt', { 
                clustersCount: newClusters.size,
                itemsCount: semanticItems.size
            });
            
            return {
                clustersCount: newClusters.size,
                itemsCount: semanticItems.size
            };
        } catch (error) {
            logger.error('Failed to rebuild semantic indexes:', error);
            throw error;
        }
    }

  /**
   * Get comprehensive service statistics
   */
  getStats() {
    const memoryUsage = process.memoryUsage();
    
    return {
      // Core metrics
      conversationStats: this.conversationStats,
      activeConversations: this.activeConversations.size,
      totalConversations: this.conversations.size,
      
      // AI capabilities
      availablePersonalities: Array.from(this.aiPersonalities.keys()),
      availableModes: Array.from(this.conversationModes.keys()),
      
      // Context and memory
      projectContexts: this.projectContext.size,
      semanticMemorySize: this.semanticMemory.get('concepts')?.size || 0,
      semanticClustersCount: this.semanticClusters?.size || 0,
      
      // Collaboration
      collaborationSessions: this.collaborationSessions.get('active_sessions')?.size || 0,
      userProfiles: this.userProfiles.size,
      teamContexts: this.teamContext.get('teams')?.size || 0,
      
      // Performance
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      
      // System health
      uptime: process.uptime(),
      lastMaintenance: this.lastMaintenanceTime || null,
      systemHealth: this.getSystemHealth()
    };
  }

  getSystemHealth() {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    let health = 'excellent';
    const issues = [];
    
    if (heapUsedMB > 1000) {
      health = 'poor';
      issues.push('High memory usage');
    } else if (heapUsedMB > 500) {
      health = 'fair';
      issues.push('Moderate memory usage');
    }
    
    const avgResponseTime = this.conversationStats.averageResponseTime || 0;
    if (avgResponseTime > 3000) {
      health = 'poor';
      issues.push('Slow response times');
    } else if (avgResponseTime > 1500) {
      health = health === 'excellent' ? 'good' : health;
      issues.push('Moderate response times');
    }
    
    if (this.activeConversations.size > 100) {
      health = health === 'excellent' ? 'good' : health;
      issues.push('High conversation load');
    }
    
    return {
      status: health,
      issues: issues.length > 0 ? issues : ['No issues detected']
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.conversations.clear();
    this.activeConversations.clear();
    this.projectContext.clear();
    this.conversationHistory.clear();
    this.removeAllListeners();
  }
}

module.exports = AIConversation;