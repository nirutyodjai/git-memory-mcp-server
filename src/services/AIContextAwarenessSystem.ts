import { EventEmitter } from 'events';
import { GitMemoryService } from './GitMemoryService';
import { SemanticMemoryService } from './SemanticMemoryService';
import { AICodeIntelligenceEngine } from './AICodeIntelligenceEngine';
import { LLMProviderService } from './LLMProviderService';

/**
 * Context Types for AI Awareness
 */
export interface AIContext {
  id: string;
  type: 'code' | 'conversation' | 'project' | 'user' | 'system';
  source: string;
  timestamp: Date;
  data: any;
  confidence: number;
  relationships: string[];
}

export interface ContextualInsight {
  id: string;
  context: AIContext;
  insight: string;
  relevance: number;
  actionable: boolean;
  suggestions: string[];
}

export interface AICollaborationState {
  activeAIs: string[];
  sharedContext: AIContext[];
  conflictResolution: 'merge' | 'priority' | 'user_choice';
  syncStatus: 'synced' | 'syncing' | 'conflict' | 'error';
}

export interface ContextAwarenessConfig {
  maxContextHistory: number;
  contextRetentionDays: number;
  aiCollaborationEnabled: boolean;
  conflictResolutionStrategy: 'merge' | 'priority' | 'user_choice';
  realTimeSync: boolean;
  contextSharingLevel: 'full' | 'filtered' | 'minimal';
}

/**
 * AI Context Awareness System
 * ระบบที่ช่วยให้ AI ต่างๆ เข้าใจบริบทและทำงานร่วมกันได้อย่างมีประสิทธิภาพ
 */
export class AIContextAwarenessSystem extends EventEmitter {
  private contexts: Map<string, AIContext> = new Map();
  private insights: Map<string, ContextualInsight> = new Map();
  private collaborationState: AICollaborationState;
  private config: ContextAwarenessConfig;
  private gitMemoryService?: GitMemoryService;
  private semanticMemoryService?: SemanticMemoryService;
  private codeIntelligenceEngine?: AICodeIntelligenceEngine;
  private llmProviderService?: LLMProviderService;
  private contextHistory: AIContext[] = [];
  private activeConnections: Set<string> = new Set();

  constructor(config: Partial<ContextAwarenessConfig> = {}) {
    super();
    
    this.config = {
      maxContextHistory: 1000,
      contextRetentionDays: 30,
      aiCollaborationEnabled: true,
      conflictResolutionStrategy: 'merge',
      realTimeSync: true,
      contextSharingLevel: 'filtered',
      ...config
    };

    this.collaborationState = {
      activeAIs: [],
      sharedContext: [],
      conflictResolution: this.config.conflictResolutionStrategy,
      syncStatus: 'synced'
    };

    this.initializeSystem();
  }

  /**
   * Initialize the AI Context Awareness System
   */
  private async initializeSystem(): Promise<void> {
    try {
      // Initialize services
      await this.initializeServices();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Start context monitoring
      this.startContextMonitoring();
      
      // Load existing contexts
      await this.loadExistingContexts();
      
      this.emit('system_initialized', {
        timestamp: new Date(),
        config: this.config
      });
    } catch (error) {
      this.emit('system_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }
  }

  /**
   * Initialize connected services
   */
  private async initializeServices(): Promise<void> {
    // Services will be injected or auto-discovered
    // This allows for flexible integration without tight coupling
  }

  /**
   * Setup event listeners for AI collaboration
   */
  private setupEventListeners(): void {
    // Listen for context changes
    this.on('context_added', this.handleContextAdded.bind(this));
    this.on('context_updated', this.handleContextUpdated.bind(this));
    this.on('ai_connected', this.handleAIConnected.bind(this));
    this.on('ai_disconnected', this.handleAIDisconnected.bind(this));
    this.on('conflict_detected', this.handleConflictDetected.bind(this));
  }

  /**
   * Start monitoring context changes
   */
  private startContextMonitoring(): void {
    if (this.config.realTimeSync) {
      setInterval(() => {
        this.syncContexts();
      }, 5000); // Sync every 5 seconds
    }
  }

  /**
   * Load existing contexts from storage
   */
  private async loadExistingContexts(): Promise<void> {
    try {
      if (this.gitMemoryService) {
        // Load contexts from Git Memory
        const storedContexts = await this.gitMemoryService.getMemory('ai_contexts');
        if (storedContexts) {
          this.contextHistory = JSON.parse(storedContexts);
          this.rebuildContextMap();
        }
      }
    } catch (error) {
      console.warn('Failed to load existing contexts:', error);
    }
  }

  /**
   * Add new context to the system
   */
  public async addContext(context: Omit<AIContext, 'id' | 'timestamp'>): Promise<string> {
    const contextId = this.generateContextId();
    const fullContext: AIContext = {
      ...context,
      id: contextId,
      timestamp: new Date()
    };

    this.contexts.set(contextId, fullContext);
    this.contextHistory.push(fullContext);
    
    // Maintain history size limit
    if (this.contextHistory.length > this.config.maxContextHistory) {
      this.contextHistory = this.contextHistory.slice(-this.config.maxContextHistory);
    }

    // Store in persistent memory
    await this.persistContext(fullContext);
    
    // Generate insights
    const insights = await this.generateInsights(fullContext);
    insights.forEach(insight => this.insights.set(insight.id, insight));

    this.emit('context_added', { context: fullContext, insights });
    
    return contextId;
  }

  /**
   * Update existing context
   */
  public async updateContext(contextId: string, updates: Partial<AIContext>): Promise<boolean> {
    const existingContext = this.contexts.get(contextId);
    if (!existingContext) {
      return false;
    }

    const updatedContext = {
      ...existingContext,
      ...updates,
      timestamp: new Date()
    };

    this.contexts.set(contextId, updatedContext);
    await this.persistContext(updatedContext);

    this.emit('context_updated', { 
      contextId, 
      oldContext: existingContext, 
      newContext: updatedContext 
    });

    return true;
  }

  /**
   * Get context by ID
   */
  public getContext(contextId: string): AIContext | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Search contexts by criteria
   */
  public searchContexts(criteria: {
    type?: AIContext['type'];
    source?: string;
    timeRange?: { start: Date; end: Date };
    minConfidence?: number;
    keywords?: string[];
  }): AIContext[] {
    let results = Array.from(this.contexts.values());

    if (criteria.type) {
      results = results.filter(ctx => ctx.type === criteria.type);
    }

    if (criteria.source) {
      results = results.filter(ctx => criteria.source && typeof ctx.source === 'string' && ctx.source.includes(criteria.source));
    }

    if (criteria.timeRange) {
      results = results.filter(ctx => 
        ctx.timestamp >= criteria.timeRange!.start && 
        ctx.timestamp <= criteria.timeRange!.end
      );
    }

    if (criteria.minConfidence) {
      results = results.filter(ctx => ctx.confidence >= criteria.minConfidence!);
    }

    if (criteria.keywords && criteria.keywords.length > 0) {
      results = results.filter(ctx => {
        const contextStr = JSON.stringify(ctx.data).toLowerCase();
        return criteria.keywords!.some(keyword => 
          typeof contextStr === 'string' && contextStr.includes(keyword.toLowerCase())
        );
      });
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get contextual insights
   */
  public getInsights(contextId?: string): ContextualInsight[] {
    if (contextId) {
      return Array.from(this.insights.values())
        .filter(insight => insight.context.id === contextId);
    }
    return Array.from(this.insights.values())
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Register AI connection
   */
  public registerAI(aiId: string, capabilities: string[]): void {
    this.activeConnections.add(aiId);
    
    if (!this.collaborationState.activeAIs.includes(aiId)) {
      this.collaborationState.activeAIs.push(aiId);
    }

    this.emit('ai_connected', { aiId, capabilities, timestamp: new Date() });
  }

  /**
   * Unregister AI connection
   */
  public unregisterAI(aiId: string): void {
    this.activeConnections.delete(aiId);
    this.collaborationState.activeAIs = this.collaborationState.activeAIs
      .filter(id => id !== aiId);

    this.emit('ai_disconnected', { aiId, timestamp: new Date() });
  }

  /**
   * Get collaboration state
   */
  public getCollaborationState(): AICollaborationState {
    return { ...this.collaborationState };
  }

  /**
   * Sync contexts across AIs
   */
  private async syncContexts(): Promise<void> {
    if (!this.config.aiCollaborationEnabled) {
      return;
    }

    try {
      this.collaborationState.syncStatus = 'syncing';
      
      // Get recent contexts for sharing
      const recentContexts = this.getRecentContexts();
      const filteredContexts = this.filterContextsForSharing(recentContexts);
      
      this.collaborationState.sharedContext = filteredContexts;
      this.collaborationState.syncStatus = 'synced';
      
      this.emit('contexts_synced', {
        sharedContexts: filteredContexts.length,
        timestamp: new Date()
      });
    } catch (error) {
      this.collaborationState.syncStatus = 'error';
      this.emit('sync_error', { error, timestamp: new Date() });
    }
  }

  /**
   * Generate insights from context
   */
  private async generateInsights(context: AIContext): Promise<ContextualInsight[]> {
    const insights: ContextualInsight[] = [];

    try {
      // Use AI services to generate insights
      if (this.codeIntelligenceEngine && context.type === 'code') {
        const codeInsights = await this.codeIntelligenceEngine.getCodeInsights(context.data);
        insights.push(...this.convertToContextualInsights(codeInsights, context));
      }

      if (this.semanticMemoryService) {
        const semanticInsights = await this.semanticMemoryService.findSimilar(
          JSON.stringify(context.data), 5
        );
        insights.push(...this.convertSemanticToInsights(semanticInsights, context));
      }

      // Add pattern-based insights
      const patternInsights = this.generatePatternInsights(context);
      insights.push(...patternInsights);

    } catch (error) {
      console.warn('Failed to generate insights:', error);
    }

    return insights;
  }

  /**
   * Handle context added event
   */
  private handleContextAdded(event: { context: AIContext; insights: ContextualInsight[] }): void {
    // Notify other AIs about new context
    if (this.config.aiCollaborationEnabled) {
      this.broadcastContextUpdate('added', event.context);
    }
  }

  /**
   * Handle context updated event
   */
  private handleContextUpdated(event: { contextId: string; oldContext: AIContext; newContext: AIContext }): void {
    // Check for conflicts
    this.detectConflicts(event.newContext);
    
    // Broadcast update
    if (this.config.aiCollaborationEnabled) {
      this.broadcastContextUpdate('updated', event.newContext);
    }
  }

  /**
   * Handle AI connected event
   */
  private handleAIConnected(event: { aiId: string; capabilities: string[] }): void {
    // Share relevant contexts with newly connected AI
    this.shareContextsWithAI(event.aiId);
  }

  /**
   * Handle AI disconnected event
   */
  private handleAIDisconnected(event: { aiId: string }): void {
    // Clean up AI-specific contexts if needed
    this.cleanupAIContexts(event.aiId);
  }

  /**
   * Handle conflict detected event
   */
  private handleConflictDetected(event: { contexts: AIContext[]; resolution: string }): void {
    this.collaborationState.syncStatus = 'conflict';
    
    // Apply conflict resolution strategy
    this.resolveConflicts(event.contexts, event.resolution);
  }

  // Helper methods
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persistContext(context: AIContext): Promise<void> {
    if (this.gitMemoryService) {
      await this.gitMemoryService.storeMemory(
        `ai_contexts`,
        JSON.stringify(this.contextHistory)
      );
    }
  }

  private rebuildContextMap(): void {
    this.contexts.clear();
    this.contextHistory.forEach(context => {
      this.contexts.set(context.id, context);
    });
  }

  private getRecentContexts(): AIContext[] {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
    return this.contextHistory.filter(ctx => ctx.timestamp > cutoff);
  }

  private filterContextsForSharing(contexts: AIContext[]): AIContext[] {
    switch (this.config.contextSharingLevel) {
      case 'full':
        return contexts;
      case 'filtered':
        return contexts.filter(ctx => ctx.confidence > 0.7);
      case 'minimal':
        return contexts.filter(ctx => ctx.confidence > 0.9 && ctx.type !== 'user');
      default:
        return contexts;
    }
  }

  private convertToContextualInsights(codeInsights: any[], context: AIContext): ContextualInsight[] {
    return codeInsights.map((insight, index) => ({
      id: `insight_${context.id}_${index}`,
      context,
      insight: insight.description || insight.message || 'Code insight',
      relevance: insight.confidence || 0.5,
      actionable: insight.actionable || false,
      suggestions: insight.suggestions || []
    }));
  }

  private convertSemanticToInsights(semanticResults: any[], context: AIContext): ContextualInsight[] {
    return semanticResults.map((result, index) => ({
      id: `semantic_${context.id}_${index}`,
      context,
      insight: `Related content found: ${result.content}`,
      relevance: result.similarity || 0.5,
      actionable: true,
      suggestions: [`Consider reviewing: ${result.source}`]
    }));
  }

  private generatePatternInsights(context: AIContext): ContextualInsight[] {
    const insights: ContextualInsight[] = [];
    
    // Add pattern-based insights based on context type and data
    if (context.type === 'code' && context.data.language) {
      insights.push({
        id: `pattern_${context.id}_lang`,
        context,
        insight: `Code written in ${context.data.language}`,
        relevance: 0.6,
        actionable: false,
        suggestions: [`Consider ${context.data.language} best practices`]
      });
    }

    return insights;
  }

  private broadcastContextUpdate(action: 'added' | 'updated', context: AIContext): void {
    this.emit('context_broadcast', {
      action,
      context,
      recipients: this.collaborationState.activeAIs,
      timestamp: new Date()
    });
  }

  private detectConflicts(context: AIContext): void {
    // Simple conflict detection - can be enhanced
    const similarContexts = this.searchContexts({
      type: context.type,
      source: context.source,
      timeRange: {
        start: new Date(Date.now() - 60000), // Last minute
        end: new Date()
      }
    });

    if (similarContexts.length > 1) {
      this.emit('conflict_detected', {
        contexts: similarContexts,
        resolution: this.config.conflictResolutionStrategy
      });
    }
  }

  private shareContextsWithAI(aiId: string): void {
    const relevantContexts = this.getRecentContexts();
    const filteredContexts = this.filterContextsForSharing(relevantContexts);
    
    this.emit('share_contexts', {
      aiId,
      contexts: filteredContexts,
      timestamp: new Date()
    });
  }

  private cleanupAIContexts(aiId: string): void {
    // Remove contexts specific to disconnected AI
    const contextsToRemove = Array.from(this.contexts.values())
      .filter(ctx => ctx.source === aiId);
    
    contextsToRemove.forEach(ctx => {
      this.contexts.delete(ctx.id);
    });
  }

  private resolveConflicts(contexts: AIContext[], strategy: string): void {
    switch (strategy) {
      case 'merge':
        this.mergeConflictingContexts(contexts);
        break;
      case 'priority':
        this.resolvePriorityConflicts(contexts);
        break;
      case 'user_choice':
        this.requestUserResolution(contexts);
        break;
    }
  }

  private mergeConflictingContexts(contexts: AIContext[]): void {
    // Implement context merging logic
    const mergedContext = contexts.reduce((merged, ctx) => ({
      ...merged,
      data: { ...merged.data, ...ctx.data },
      confidence: Math.max(merged.confidence, ctx.confidence),
      relationships: [...new Set([...merged.relationships, ...ctx.relationships])]
    }));

    this.contexts.set(mergedContext.id, mergedContext);
    this.collaborationState.syncStatus = 'synced';
  }

  private resolvePriorityConflicts(contexts: AIContext[]): void {
    // Keep the context with highest confidence
    const priorityContext = contexts.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    );

    contexts.forEach(ctx => {
      if (ctx.id !== priorityContext.id) {
        this.contexts.delete(ctx.id);
      }
    });

    this.collaborationState.syncStatus = 'synced';
  }

  private requestUserResolution(contexts: AIContext[]): void {
    this.emit('user_resolution_required', {
      conflicts: contexts,
      timestamp: new Date()
    });
  }

  /**
   * Inject services for integration
   */
  public injectServices(services: {
    gitMemoryService?: GitMemoryService;
    semanticMemoryService?: SemanticMemoryService;
    codeIntelligenceEngine?: AICodeIntelligenceEngine;
    llmProviderService?: LLMProviderService;
  }): void {
    this.gitMemoryService = services.gitMemoryService;
    this.semanticMemoryService = services.semanticMemoryService;
    this.codeIntelligenceEngine = services.codeIntelligenceEngine;
    this.llmProviderService = services.llmProviderService;
  }

  /**
   * Get system statistics
   */
  public getStatistics(): {
    totalContexts: number;
    totalInsights: number;
    activeAIs: number;
    syncStatus: string;
    memoryUsage: number;
  } {
    return {
      totalContexts: this.contexts.size,
      totalInsights: this.insights.size,
      activeAIs: this.collaborationState.activeAIs.length,
      syncStatus: this.collaborationState.syncStatus,
      memoryUsage: this.contextHistory.length
    };
  }

  /**
   * Cleanup old contexts
   */
  public async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - this.config.contextRetentionDays * 24 * 60 * 60 * 1000);
    
    // Remove old contexts
    const oldContextIds: string[] = [];
    this.contexts.forEach((context, id) => {
      if (context.timestamp < cutoff) {
        oldContextIds.push(id);
      }
    });

    oldContextIds.forEach(id => this.contexts.delete(id));
    
    // Update history
    this.contextHistory = this.contextHistory.filter(ctx => ctx.timestamp >= cutoff);
    
    // Persist changes
    if (this.gitMemoryService) {
      await this.gitMemoryService.storeMemory(
        'ai_contexts',
        JSON.stringify(this.contextHistory)
      );
    }

    this.emit('cleanup_completed', {
      removedContexts: oldContextIds.length,
      timestamp: new Date()
    });
  }
}