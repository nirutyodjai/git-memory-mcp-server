/**
 * AI Integration Layer
 * เชื่อมต่อระหว่าง Git Memory และ MCP Server ด้วย AI Intelligence
 * รองรับการวิเคราะห์และจัดการข้อมูลแบบอัจฉริยะ
 */

import { EventEmitter } from 'events';
import { LLMProviderService, LLMRequest, LLMResponse } from './LLMProviderService';
import { SoloAIOrchestrator, AITask, AIResult } from './SoloAIOrchestrator';
import { Logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface AIMemoryContext {
  id: string;
  type: 'code' | 'documentation' | 'pattern' | 'insight' | 'analysis';
  content: string;
  metadata: {
    language?: string;
    framework?: string;
    complexity?: 'low' | 'medium' | 'high';
    tags?: string[];
    confidence?: number;
    source?: string;
    timestamp: number;
  };
  relationships: {
    parentId?: string;
    childIds?: string[];
    relatedIds?: string[];
    similarity?: number;
  };
  embedding?: number[];
}

export interface AIInsight {
  id: string;
  type: 'optimization' | 'pattern' | 'bug_detection' | 'improvement' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  recommendations: string[];
  evidence: AIMemoryContext[];
  timestamp: number;
}

export interface SmartMemoryQuery {
  query: string;
  type?: 'semantic' | 'pattern' | 'code' | 'hybrid';
  filters?: {
    language?: string;
    framework?: string;
    complexity?: string;
    tags?: string[];
    dateRange?: { start: Date; end: Date };
  };
  limit?: number;
  threshold?: number;
}

export class AIIntegrationLayer extends EventEmitter {
  private llmService: LLMProviderService;
  private aiOrchestrator: SoloAIOrchestrator;
  private logger: Logger;
  private memoryContexts: Map<string, AIMemoryContext> = new Map();
  private insights: Map<string, AIInsight> = new Map();
  private isInitialized = false;
  private memoryFile: string;
  private insightsFile: string;
  private vocabulary: Map<string, number> = new Map();
  private embeddingDimension = 384; // Standard embedding dimension

  constructor(
    llmService: LLMProviderService,
    aiOrchestrator: SoloAIOrchestrator,
    logger: Logger,
    options: {
      memoryPath?: string;
      embeddingDimension?: number;
    } = {}
  ) {
    super();
    this.llmService = llmService;
    this.aiOrchestrator = aiOrchestrator;
    this.logger = logger;
    
    const memoryPath = options.memoryPath || path.join(process.cwd(), '.ai-memory');
    this.memoryFile = path.join(memoryPath, 'contexts.json');
    this.insightsFile = path.join(memoryPath, 'insights.json');
    this.embeddingDimension = options.embeddingDimension || 384;
    
    this.initialize();
  }

  /**
   * Initialize AI Integration Layer
   */
  private async initialize(): Promise<void> {
    try {
      await this.ensureDirectoryExists();
      await this.loadMemoryContexts();
      await this.loadInsights();
      await this.buildVocabulary();
      this.setupEventHandlers();
      
      this.isInitialized = true;
      this.logger.info('AI Integration Layer initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize AI Integration Layer:', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for AI services
   */
  private setupEventHandlers(): void {
    this.aiOrchestrator.on('task_completed', (result: AIResult) => {
      this.handleAITaskResult(result);
    });

    this.llmService.on('response_generated', (response: LLMResponse) => {
      this.handleLLMResponse(response);
    });
  }

  /**
   * Store memory context with AI enhancement
   */
  async storeMemoryContext(
    content: string,
    type: AIMemoryContext['type'],
    metadata: Partial<AIMemoryContext['metadata']> = {}
  ): Promise<string> {
    const id = randomUUID();
    
    // Generate AI-enhanced metadata
    const enhancedMetadata = await this.enhanceMetadata(content, type, metadata);
    
    // Generate embedding
    const embedding = await this.generateEmbedding(content);
    
    // Find relationships
    const relationships = await this.findRelationships(content, embedding);
    
    const context: AIMemoryContext = {
      id,
      type,
      content,
      metadata: {
        ...enhancedMetadata,
        timestamp: Date.now()
      },
      relationships,
      embedding
    };
    
    this.memoryContexts.set(id, context);
    await this.saveMemoryContexts();
    
    // Generate insights from new context
    await this.generateInsights(context);
    
    this.emit('context_stored', context);
    return id;
  }

  /**
   * Smart memory search with AI
   */
  async searchMemory(query: SmartMemoryQuery): Promise<{
    contexts: AIMemoryContext[];
    insights: AIInsight[];
    suggestions: string[];
  }> {
    const queryEmbedding = await this.generateEmbedding(query.query);
    const contexts: AIMemoryContext[] = [];
    const threshold = query.threshold || 0.7;
    
    // Semantic search
    for (const context of this.memoryContexts.values()) {
      if (!context.embedding) continue;
      
      const similarity = this.calculateCosineSimilarity(queryEmbedding, context.embedding);
      
      if (similarity >= threshold) {
        // Apply filters
        if (this.matchesFilters(context, query.filters)) {
          contexts.push({ ...context, relationships: { ...context.relationships, similarity } });
        }
      }
    }
    
    // Sort by similarity
    contexts.sort((a, b) => (b.relationships.similarity || 0) - (a.relationships.similarity || 0));
    
    // Limit results
    const limitedContexts = contexts.slice(0, query.limit || 10);
    
    // Find related insights
    const relatedInsights = this.findRelatedInsights(limitedContexts);
    
    // Generate search suggestions
    const suggestions = await this.generateSearchSuggestions(query, limitedContexts);
    
    return {
      contexts: limitedContexts,
      insights: relatedInsights,
      suggestions
    };
  }

  /**
   * Generate AI insights from memory context
   */
  private async generateInsights(context: AIMemoryContext): Promise<void> {
    const task: AITask = {
      id: randomUUID(),
      type: 'code_analysis',
      prompt: this.buildInsightPrompt(context),
      context: { memoryContext: context },
      priority: 'medium',
      timeout: 30000
    };
    
    await this.aiOrchestrator.executeTask(task);
  }

  /**
   * Build prompt for insight generation
   */
  private buildInsightPrompt(context: AIMemoryContext): string {
    return `
Analyze the following ${context.type} content and generate actionable insights:

Content: ${context.content}

Metadata: ${JSON.stringify(context.metadata, null, 2)}

Please provide:
1. Key patterns or optimizations
2. Potential improvements
3. Risk assessments
4. Actionable recommendations

Format as JSON with fields: type, title, description, confidence, impact, recommendations.
`;
  }

  /**
   * Handle AI task results
   */
  private async handleAITaskResult(result: AIResult): Promise<void> {
    if (result.success && result.response) {
      try {
        const insightData = JSON.parse(result.response.content);
        
        const insight: AIInsight = {
          id: randomUUID(),
          type: insightData.type || 'analysis',
          title: insightData.title || 'AI Generated Insight',
          description: insightData.description || '',
          confidence: insightData.confidence || 0.5,
          impact: insightData.impact || 'medium',
          actionable: true,
          recommendations: insightData.recommendations || [],
          evidence: [],
          timestamp: Date.now()
        };
        
        this.insights.set(insight.id, insight);
        await this.saveInsights();
        
        this.emit('insight_generated', insight);
      } catch (error) {
        this.logger.error('Failed to parse AI insight:', error);
      }
    }
  }

  /**
   * Handle LLM responses
   */
  private handleLLMResponse(response: LLMResponse): void {
    // Update vocabulary from LLM responses
    this.updateVocabulary(response.content);
    this.emit('llm_response_processed', response);
  }

  /**
   * Generate text embedding (simplified implementation)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // This is a simplified embedding generation
    // In production, you would use a proper embedding model
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const embedding = new Array(this.embeddingDimension).fill(0);
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      const position = hash % this.embeddingDimension;
      embedding[position] += 1 / (index + 1); // TF-IDF like weighting
    });
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? embedding.map(val => val / norm) : embedding;
  }

  /**
   * Calculate cosine similarity between vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Simple hash function for text
   */
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Enhance metadata with AI analysis
   */
  private async enhanceMetadata(
    content: string,
    type: AIMemoryContext['type'],
    metadata: Partial<AIMemoryContext['metadata']>
  ): Promise<AIMemoryContext['metadata']> {
    // Basic metadata enhancement
    const enhanced: AIMemoryContext['metadata'] = {
      ...metadata,
      timestamp: Date.now(),
      confidence: metadata.confidence || 0.8
    };
    
    // Detect language if not provided
    if (!enhanced.language && type === 'code') {
      enhanced.language = this.detectLanguage(content);
    }
    
    // Generate tags if not provided
    if (!enhanced.tags) {
      enhanced.tags = this.generateTags(content, type);
    }
    
    // Assess complexity
    if (!enhanced.complexity) {
      enhanced.complexity = this.assessComplexity(content, type);
    }
    
    return enhanced;
  }

  /**
   * Detect programming language from code content
   */
  private detectLanguage(content: string): string {
    const patterns = {
      javascript: /\b(function|const|let|var|=>|require|import)\b/,
      typescript: /\b(interface|type|enum|implements|extends)\b/,
      python: /\b(def|import|from|class|if __name__)\b/,
      java: /\b(public|private|class|interface|extends|implements)\b/,
      csharp: /\b(using|namespace|class|interface|public|private)\b/,
      go: /\b(package|import|func|type|struct)\b/,
      rust: /\b(fn|let|mut|struct|impl|trait)\b/
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) {
        return lang;
      }
    }
    
    return 'unknown';
  }

  /**
   * Generate tags from content
   */
  private generateTags(content: string, type: AIMemoryContext['type']): string[] {
    const tags: string[] = [];
    const words: string[] = content.toLowerCase().match(/\b\w+\b/g) || [];
    
    // Common programming concepts
    const concepts: string[] = [
      'api', 'database', 'authentication', 'security', 'performance',
      'optimization', 'testing', 'deployment', 'monitoring', 'logging',
      'cache', 'queue', 'async', 'sync', 'error', 'exception'
    ];
    
    concepts.forEach((concept: string) => {
      if (Array.isArray(words) && words.includes(concept)) {
        tags.push(concept);
      }
    });
    
    return tags.slice(0, 5); // Limit to 5 tags
  }

  /**
   * Assess content complexity
   */
  private assessComplexity(
    content: string,
    type: AIMemoryContext['type']
  ): 'low' | 'medium' | 'high' {
    const length = content.length;
    const lines = content.split('\n').length;
    const complexity = content.match(/\b(if|for|while|switch|try|catch|async|await)\b/g)?.length || 0;
    
    if (length < 500 && lines < 20 && complexity < 5) return 'low';
    if (length < 2000 && lines < 100 && complexity < 20) return 'medium';
    return 'high';
  }

  /**
   * Find relationships between contexts
   */
  private async findRelationships(
    content: string,
    embedding: number[]
  ): Promise<AIMemoryContext['relationships']> {
    const relationships: AIMemoryContext['relationships'] = {
      relatedIds: []
    };
    
    // Find similar contexts
    for (const [id, context] of this.memoryContexts.entries()) {
      if (!context.embedding) continue;
      
      const similarity = this.calculateCosineSimilarity(embedding, context.embedding);
      if (similarity > 0.8) {
        relationships.relatedIds?.push(id);
      }
    }
    
    return relationships;
  }

  /**
   * Check if context matches filters
   */
  private matchesFilters(
    context: AIMemoryContext,
    filters?: SmartMemoryQuery['filters']
  ): boolean {
    if (!filters) return true;
    
    if (filters.language && context.metadata.language !== filters.language) {
      return false;
    }
    
    if (filters.framework && context.metadata.framework !== filters.framework) {
      return false;
    }
    
    if (filters.complexity && context.metadata.complexity !== filters.complexity) {
      return false;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      const contextTags = context.metadata.tags || [];
      const hasMatchingTag = filters.tags.some(tag => Array.isArray(contextTags) && contextTags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    if (filters.dateRange) {
      const contextDate = new Date(context.metadata.timestamp);
      if (contextDate < filters.dateRange.start || contextDate > filters.dateRange.end) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Find insights related to contexts
   */
  private findRelatedInsights(contexts: AIMemoryContext[]): AIInsight[] {
    const relatedInsights: AIInsight[] = [];
    const contextIds = new Set(contexts.map(c => c.id));
    
    for (const insight of this.insights.values()) {
      const hasRelatedEvidence = insight.evidence.some(evidence => 
        contextIds.has(evidence.id)
      );
      
      if (hasRelatedEvidence) {
        relatedInsights.push(insight);
      }
    }
    
    return relatedInsights.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate search suggestions
   */
  private async generateSearchSuggestions(
    query: SmartMemoryQuery,
    contexts: AIMemoryContext[]
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Extract common tags from results
    const tagCounts = new Map<string, number>();
    contexts.forEach(context => {
      context.metadata.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    
    // Suggest popular tags
    const popularTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag]) => `Related: ${tag}`);
    
    suggestions.push(...popularTags);
    
    // Suggest refinements
    if (contexts.length > 10) {
      suggestions.push('Try adding filters to narrow results');
    }
    
    if (contexts.length === 0) {
      suggestions.push('Try broader search terms', 'Check spelling', 'Use synonyms');
    }
    
    return suggestions;
  }

  /**
   * Build vocabulary from content
   */
  private async buildVocabulary(): Promise<void> {
    for (const context of this.memoryContexts.values()) {
      this.updateVocabulary(context.content);
    }
  }

  /**
   * Update vocabulary with new content
   */
  private updateVocabulary(content: string): void {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    words.forEach(word => {
      this.vocabulary.set(word, (this.vocabulary.get(word) || 0) + 1);
    });
  }

  /**
   * Ensure memory directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.memoryFile);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Load memory contexts from file
   */
  private async loadMemoryContexts(): Promise<void> {
    try {
      const data = await fs.readFile(this.memoryFile, 'utf-8');
      const contexts = JSON.parse(data);
      this.memoryContexts = new Map(Object.entries(contexts));
    } catch (error) {
      // File doesn't exist or is invalid, start with empty map
      this.memoryContexts = new Map();
    }
  }

  /**
   * Save memory contexts to file
   */
  private async saveMemoryContexts(): Promise<void> {
    const contexts = Object.fromEntries(this.memoryContexts);
    await fs.writeFile(this.memoryFile, JSON.stringify(contexts, null, 2));
  }

  /**
   * Load insights from file
   */
  private async loadInsights(): Promise<void> {
    try {
      const data = await fs.readFile(this.insightsFile, 'utf-8');
      const insights = JSON.parse(data);
      this.insights = new Map(Object.entries(insights));
    } catch (error) {
      // File doesn't exist or is invalid, start with empty map
      this.insights = new Map();
    }
  }

  /**
   * Save insights to file
   */
  private async saveInsights(): Promise<void> {
    const insights = Object.fromEntries(this.insights);
    await fs.writeFile(this.insightsFile, JSON.stringify(insights, null, 2));
  }

  /**
   * Get all memory contexts
   */
  getMemoryContexts(): AIMemoryContext[] {
    return Array.from(this.memoryContexts.values());
  }

  /**
   * Get all insights
   */
  getInsights(): AIInsight[] {
    return Array.from(this.insights.values());
  }

  /**
   * Get memory statistics
   */
  getStatistics(): {
    totalContexts: number;
    totalInsights: number;
    contextsByType: Record<string, number>;
    insightsByType: Record<string, number>;
    vocabularySize: number;
  } {
    const contextsByType: Record<string, number> = {};
    const insightsByType: Record<string, number> = {};
    
    for (const context of this.memoryContexts.values()) {
      contextsByType[context.type] = (contextsByType[context.type] || 0) + 1;
    }
    
    for (const insight of this.insights.values()) {
      insightsByType[insight.type] = (insightsByType[insight.type] || 0) + 1;
    }
    
    return {
      totalContexts: this.memoryContexts.size,
      totalInsights: this.insights.size,
      contextsByType,
      insightsByType,
      vocabularySize: this.vocabulary.size
    };
  }

  /**
   * Clear all memory data
   */
  async clearMemory(): Promise<void> {
    this.memoryContexts.clear();
    this.insights.clear();
    this.vocabulary.clear();
    
    await this.saveMemoryContexts();
    await this.saveInsights();
    
    this.emit('memory_cleared');
  }
}

export default AIIntegrationLayer;