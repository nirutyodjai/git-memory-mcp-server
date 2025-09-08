/**
 * AI-powered Code Intelligence Engine
 * เชื่อมต่อ Git Memory กับ MCP Server ด้วย AI อัจฉริยะ
 * ทำงานร่วมกับ IDE AI โดยไม่ให้ข้อมูลแตกกัน
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { LLMProviderService } from './LLMProviderService';
import { GitMemoryService } from './GitMemoryService';
import { SemanticMemoryService } from './SemanticMemoryService';
import { AIIntegrationLayer } from './AIIntegrationLayer';
import { SmartMemoryManager } from './SmartMemoryManager';

// Interfaces for AI Code Intelligence
interface CodeContext {
  filePath: string;
  language: string;
  content: string;
  cursorPosition?: { line: number; column: number };
  selectedText?: string;
  projectContext?: ProjectContext;
}

interface ProjectContext {
  rootPath: string;
  packageJson?: any;
  dependencies: string[];
  recentFiles: string[];
  gitBranch?: string;
  gitCommits?: GitCommit[];
}

interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

interface AICodeSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'fix' | 'optimize' | 'explain';
  title: string;
  description: string;
  code?: string;
  confidence: number;
  reasoning: string;
  metadata: {
    language: string;
    framework?: string;
    pattern?: string;
    complexity: 'low' | 'medium' | 'high';
  };
}

interface AIInsight {
  id: string;
  type: 'performance' | 'security' | 'maintainability' | 'best-practice';
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion: string;
  location?: {
    file: string;
    line: number;
    column: number;
  };
  autoFixAvailable: boolean;
}

interface CodeIntelligenceConfig {
  enableRealTimeAnalysis: boolean;
  enableContextAwareness: boolean;
  enableGitIntegration: boolean;
  enableSemanticSearch: boolean;
  maxSuggestions: number;
  confidenceThreshold: number;
  cacheTimeout: number;
}

/**
 * AI-powered Code Intelligence Engine
 * ระบบ AI อัจฉริยะสำหรับการวิเคราะห์และช่วยเหลือการเขียนโค้ด
 */
export class AICodeIntelligenceEngine extends EventEmitter {
  private logger: Logger;
  private llmService: LLMProviderService;
  private gitMemory: GitMemoryService;
  private semanticMemory: SemanticMemoryService;
  private aiIntegration: AIIntegrationLayer;
  private smartMemory: SmartMemoryManager;
  private config: CodeIntelligenceConfig;
  private analysisCache: Map<string, any>;
  private contextCache: Map<string, CodeContext>;
  private isInitialized: boolean = false;

  constructor(
    llmService: LLMProviderService,
    gitMemory: GitMemoryService,
    semanticMemory: SemanticMemoryService,
    aiIntegration: AIIntegrationLayer,
    smartMemory: SmartMemoryManager,
    config: Partial<CodeIntelligenceConfig> = {}
  ) {
    super();
    this.logger = new Logger('AICodeIntelligenceEngine');
    this.llmService = llmService;
    this.gitMemory = gitMemory;
    this.semanticMemory = semanticMemory;
    this.aiIntegration = aiIntegration;
    this.smartMemory = smartMemory;
    
    // Default configuration
    this.config = {
      enableRealTimeAnalysis: true,
      enableContextAwareness: true,
      enableGitIntegration: true,
      enableSemanticSearch: true,
      maxSuggestions: 10,
      confidenceThreshold: 0.7,
      cacheTimeout: 300000, // 5 minutes
      ...config
    };

    this.analysisCache = new Map();
    this.contextCache = new Map();
    
    this.setupEventHandlers();
  }

  /**
   * Initialize the AI Code Intelligence Engine
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing AI Code Intelligence Engine...');
      
      // Initialize all services
      await this.aiIntegration.initialize();
      await this.smartMemory.initialize();
      
      // Setup cache cleanup
      this.setupCacheCleanup();
      
      this.isInitialized = true;
      this.logger.info('AI Code Intelligence Engine initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      this.logger.error('Failed to initialize AI Code Intelligence Engine:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered code suggestions
   */
  async getCodeSuggestions(
    context: CodeContext,
    requestType: 'completion' | 'refactor' | 'fix' | 'optimize' | 'all' = 'all'
  ): Promise<AICodeSuggestion[]> {
    if (!this.isInitialized) {
      throw new Error('AI Code Intelligence Engine not initialized');
    }

    try {
      this.logger.debug(`Getting code suggestions for ${context.filePath}`);
      
      // Build comprehensive context
      const enhancedContext = await this.buildEnhancedContext(context);
      
      // Get suggestions from different sources
      const suggestions: AICodeSuggestion[] = [];
      
      if (requestType === 'completion' || requestType === 'all') {
        const completions = await this.getCompletionSuggestions(enhancedContext);
        suggestions.push(...completions);
      }
      
      if (requestType === 'refactor' || requestType === 'all') {
        const refactors = await this.getRefactorSuggestions(enhancedContext);
        suggestions.push(...refactors);
      }
      
      if (requestType === 'fix' || requestType === 'all') {
        const fixes = await this.getFixSuggestions(enhancedContext);
        suggestions.push(...fixes);
      }
      
      if (requestType === 'optimize' || requestType === 'all') {
        const optimizations = await this.getOptimizationSuggestions(enhancedContext);
        suggestions.push(...optimizations);
      }
      
      // Filter by confidence and limit
      const filteredSuggestions = suggestions
        .filter(s => s.confidence >= this.config.confidenceThreshold)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, this.config.maxSuggestions);
      
      this.emit('suggestions-generated', {
        context: context.filePath,
        count: filteredSuggestions.length,
        type: requestType
      });
      
      return filteredSuggestions;
      
    } catch (error) {
      this.logger.error('Failed to get code suggestions:', error);
      throw error;
    }
  }

  /**
   * Get AI insights about code quality and issues
   */
  async getCodeInsights(context: CodeContext): Promise<AIInsight[]> {
    if (!this.isInitialized) {
      throw new Error('AI Code Intelligence Engine not initialized');
    }

    try {
      this.logger.debug(`Getting code insights for ${context.filePath}`);
      
      const enhancedContext = await this.buildEnhancedContext(context);
      const insights: AIInsight[] = [];
      
      // Performance analysis
      const performanceInsights = await this.analyzePerformance(enhancedContext);
      insights.push(...performanceInsights);
      
      // Security analysis
      const securityInsights = await this.analyzeSecurity(enhancedContext);
      insights.push(...securityInsights);
      
      // Maintainability analysis
      const maintainabilityInsights = await this.analyzeMaintainability(enhancedContext);
      insights.push(...maintainabilityInsights);
      
      // Best practices analysis
      const bestPracticeInsights = await this.analyzeBestPractices(enhancedContext);
      insights.push(...bestPracticeInsights);
      
      this.emit('insights-generated', {
        context: context.filePath,
        count: insights.length
      });
      
      return insights;
      
    } catch (error) {
      this.logger.error('Failed to get code insights:', error);
      throw error;
    }
  }

  /**
   * Explain code functionality using AI
   */
  async explainCode(
    context: CodeContext,
    selectedCode?: string
  ): Promise<{
    explanation: string;
    complexity: 'low' | 'medium' | 'high';
    keyPoints: string[];
    relatedConcepts: string[];
    improvementSuggestions: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error('AI Code Intelligence Engine not initialized');
    }

    try {
      const codeToExplain = selectedCode || context.content;
      const enhancedContext = await this.buildEnhancedContext(context);
      
      const prompt = this.buildExplanationPrompt(codeToExplain, enhancedContext);
      const response = await this.llmService.generateResponse({
        prompt,
        maxTokens: 1000,
        temperature: 0.3
      });
      
      // Parse AI response
      const explanation = this.parseExplanationResponse(response.content);
      
      this.emit('code-explained', {
        context: context.filePath,
        complexity: explanation.complexity
      });
      
      return explanation;
      
    } catch (error) {
      this.logger.error('Failed to explain code:', error);
      throw error;
    }
  }

  /**
   * Search code semantically using AI
   */
  async searchCode(
    query: string,
    projectPath: string,
    options: {
      includeTests?: boolean;
      language?: string;
      maxResults?: number;
    } = {}
  ): Promise<{
    results: {
      file: string;
      line: number;
      code: string;
      relevance: number;
      explanation: string;
    }[];
    totalFound: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('AI Code Intelligence Engine not initialized');
    }

    try {
      this.logger.debug(`Searching code with query: ${query}`);
      
      // Use semantic memory for intelligent search
      const semanticResults = await this.semanticMemory.searchSimilar(query, {
        threshold: 0.6,
        limit: options.maxResults || 20
      });
      
      // Enhance results with AI explanations
      const enhancedResults = await Promise.all(
        semanticResults.map(async (result) => {
          const explanation = await this.generateSearchExplanation(query, result.content);
          return {
            file: result.metadata?.file || 'unknown',
            line: result.metadata?.line || 0,
            code: result.content,
            relevance: result.similarity,
            explanation
          };
        })
      );
      
      this.emit('code-searched', {
        query,
        resultsCount: enhancedResults.length
      });
      
      return {
        results: enhancedResults,
        totalFound: semanticResults.length
      };
      
    } catch (error) {
      this.logger.error('Failed to search code:', error);
      throw error;
    }
  }

  /**
   * Build enhanced context with AI integration
   */
  private async buildEnhancedContext(context: CodeContext): Promise<CodeContext & {
    gitHistory?: GitCommit[];
    relatedFiles?: string[];
    dependencies?: string[];
    semanticContext?: any;
    aiInsights?: any;
  }> {
    const cacheKey = `context_${context.filePath}_${Date.now()}`;
    
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    const enhanced = { ...context };
    
    try {
      // Get Git history if enabled
      if (this.config.enableGitIntegration) {
        enhanced.gitHistory = await this.getGitHistory(context.filePath);
      }
      
      // Get related files
      enhanced.relatedFiles = await this.findRelatedFiles(context.filePath);
      
      // Get semantic context
      if (this.config.enableSemanticSearch) {
        enhanced.semanticContext = await this.getSemanticContext(context.content);
      }
      
      // Get AI insights from integration layer
      enhanced.aiInsights = await this.aiIntegration.generateInsights({
        content: context.content,
        language: context.metadata?.language
      });
      
      // Cache the enhanced context
      this.contextCache.set(cacheKey, enhanced);
      
      return enhanced;
      
    } catch (error) {
      this.logger.warn('Failed to build enhanced context:', error);
      return enhanced;
    }
  }

  /**
   * Get completion suggestions using AI
   */
  private async getCompletionSuggestions(context: any): Promise<AICodeSuggestion[]> {
    const prompt = this.buildCompletionPrompt(context);
    const response = await this.llmService.generateResponse({
      prompt,
      maxTokens: 500,
      temperature: 0.4
    });
    
    return this.parseCompletionResponse(response.content, context);
  }

  /**
   * Get refactoring suggestions using AI
   */
  private async getRefactorSuggestions(context: any): Promise<AICodeSuggestion[]> {
    const prompt = this.buildRefactorPrompt(context);
    const response = await this.llmService.generateResponse({
      prompt,
      maxTokens: 800,
      temperature: 0.3
    });
    
    return this.parseRefactorResponse(response.content, context);
  }

  /**
   * Get fix suggestions using AI
   */
  private async getFixSuggestions(context: any): Promise<AICodeSuggestion[]> {
    const prompt = this.buildFixPrompt(context);
    const response = await this.llmService.generateResponse({
      prompt,
      maxTokens: 600,
      temperature: 0.2
    });
    
    return this.parseFixResponse(response.content, context);
  }

  /**
   * Get optimization suggestions using AI
   */
  private async getOptimizationSuggestions(context: any): Promise<AICodeSuggestion[]> {
    const prompt = this.buildOptimizationPrompt(context);
    const response = await this.llmService.generateResponse({
      prompt,
      maxTokens: 700,
      temperature: 0.3
    });
    
    return this.parseOptimizationResponse(response.content, context);
  }

  /**
   * Analyze performance issues
   */
  private async analyzePerformance(context: any): Promise<AIInsight[]> {
    // Implementation for performance analysis
    return [];
  }

  /**
   * Analyze security issues
   */
  private async analyzeSecurity(context: any): Promise<AIInsight[]> {
    // Implementation for security analysis
    return [];
  }

  /**
   * Analyze maintainability issues
   */
  private async analyzeMaintainability(context: any): Promise<AIInsight[]> {
    // Implementation for maintainability analysis
    return [];
  }

  /**
   * Analyze best practices
   */
  private async analyzeBestPractices(context: any): Promise<AIInsight[]> {
    // Implementation for best practices analysis
    return [];
  }

  /**
   * Build prompt for code completion
   */
  private buildCompletionPrompt(context: any): string {
    return `Complete the following ${context.language} code:\n\n${context.content}`;
  }

  /**
   * Build prompt for refactoring
   */
  private buildRefactorPrompt(context: any): string {
    return `Suggest refactoring improvements for this ${context.language} code:\n\n${context.content}`;
  }

  /**
   * Build prompt for fixes
   */
  private buildFixPrompt(context: any): string {
    return `Identify and suggest fixes for issues in this ${context.language} code:\n\n${context.content}`;
  }

  /**
   * Build prompt for optimization
   */
  private buildOptimizationPrompt(context: any): string {
    return `Suggest performance optimizations for this ${context.language} code:\n\n${context.content}`;
  }

  /**
   * Build prompt for code explanation
   */
  private buildExplanationPrompt(code: string, context: any): string {
    return `Explain this ${context.language} code in detail:\n\n${code}`;
  }

  /**
   * Parse completion response from AI
   */
  private parseCompletionResponse(response: string, context: any): AICodeSuggestion[] {
    // Implementation for parsing completion response
    return [];
  }

  /**
   * Parse refactor response from AI
   */
  private parseRefactorResponse(response: string, context: any): AICodeSuggestion[] {
    // Implementation for parsing refactor response
    return [];
  }

  /**
   * Parse fix response from AI
   */
  private parseFixResponse(response: string, context: any): AICodeSuggestion[] {
    // Implementation for parsing fix response
    return [];
  }

  /**
   * Parse optimization response from AI
   */
  private parseOptimizationResponse(response: string, context: any): AICodeSuggestion[] {
    // Implementation for parsing optimization response
    return [];
  }

  /**
   * Parse explanation response from AI
   */
  private parseExplanationResponse(response: string): any {
    // Implementation for parsing explanation response
    return {
      explanation: response,
      complexity: 'medium',
      keyPoints: [],
      relatedConcepts: [],
      improvementSuggestions: []
    };
  }

  /**
   * Generate search explanation
   */
  private async generateSearchExplanation(query: string, code: string): Promise<string> {
    const prompt = `Explain why this code is relevant to the search query "${query}":\n\n${code}`;
    const response = await this.llmService.generateResponse({
      prompt,
      maxTokens: 200,
      temperature: 0.3
    });
    
    return response.content;
  }

  /**
   * Get Git history for file
   */
  private async getGitHistory(filePath: string): Promise<GitCommit[]> {
    try {
      const history = await this.gitMemory.getFileHistory(filePath, 10);
      return history || [];
    } catch (error) {
      this.logger.warn('Failed to get Git history:', error);
      return [];
    }
  }

  /**
   * Find related files
   */
  private async findRelatedFiles(filePath: string): Promise<string[]> {
    try {
      // Use smart memory to find related files
      const searchResult = await this.smartMemory.smartSearch({
       query: filePath,
       type: 'file',
       limit: 10
     });
       return searchResult.results?.map(r => r.id) || [];
    } catch (error) {
      this.logger.warn('Failed to find related files:', error);
      return [];
    }
  }

  /**
   * Get semantic context
   */
  private async getSemanticContext(content: string): Promise<any> {
    try {
      const context = await this.semanticMemory.analyzeContent(content);
      return context;
    } catch (error) {
      this.logger.warn('Failed to get semantic context:', error);
      return null;
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.on('suggestions-generated', (data) => {
      this.logger.debug(`Generated ${data.count} suggestions for ${data.context}`);
    });
    
    this.on('insights-generated', (data) => {
      this.logger.debug(`Generated ${data.count} insights for ${data.context}`);
    });
    
    this.on('code-explained', (data) => {
      this.logger.debug(`Explained code in ${data.context} with ${data.complexity} complexity`);
    });
    
    this.on('code-searched', (data) => {
      this.logger.debug(`Search "${data.query}" returned ${data.resultsCount} results`);
    });
  }

  /**
   * Setup cache cleanup
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean analysis cache
      for (const [key, value] of this.analysisCache.entries()) {
        if (now - value.timestamp > this.config.cacheTimeout) {
          this.analysisCache.delete(key);
        }
      }
      
      // Clean context cache
      for (const [key] of this.contextCache.entries()) {
        const timestamp = parseInt(key.split('_').pop() || '0');
        if (now - timestamp > this.config.cacheTimeout) {
          this.contextCache.delete(key);
        }
      }
      
    }, this.config.cacheTimeout);
  }

  /**
   * Get engine statistics
   */
  getStatistics(): {
    cacheSize: number;
    contextCacheSize: number;
    isInitialized: boolean;
    config: CodeIntelligenceConfig;
  } {
    return {
      cacheSize: this.analysisCache.size,
      contextCacheSize: this.contextCache.size,
      isInitialized: this.isInitialized,
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CodeIntelligenceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuration updated:', newConfig);
    this.emit('config-updated', this.config);
  }

  /**
   * Shutdown the engine
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down AI Code Intelligence Engine...');
    
    // Clear caches
    this.analysisCache.clear();
    this.contextCache.clear();
    
    // Remove all listeners
    this.removeAllListeners();
    
    this.isInitialized = false;
    this.logger.info('AI Code Intelligence Engine shut down successfully');
  }
}

export default AICodeIntelligenceEngine;