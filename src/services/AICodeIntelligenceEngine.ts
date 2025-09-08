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
      // Note: All services initialize automatically in constructor
      
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
        semanticResults.map(async (result: any) => {
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
  private async buildEnhancedContext(context: CodeContext): Promise<any> {
    const cacheKey = `context_${context.filePath}_${Date.now()}`;
    
    if (this.contextCache.has(cacheKey)) {
      return this.contextCache.get(cacheKey)!;
    }

    const enhanced: any = { ...context };
    
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
      enhanced.aiInsights = await this.aiIntegration.getInsights();
      
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
    try {
      const insights: AIInsight[] = [];
      const code = context.content;
      
      // Check for common performance issues
      if (typeof code === 'string' && code.includes('for (') && code.includes('.length')) {
        insights.push({
          id: `perf_${Date.now()}_1`,
          type: 'performance',
          severity: 'warning',
          message: 'Loop with repeated length calculation detected',
          suggestion: 'Cache array length outside the loop for better performance',
          autoFixAvailable: true
        });
      }
      
      if (typeof code === 'string' && code.includes('document.getElementById') && code.split('document.getElementById').length > 3) {
        insights.push({
          id: `perf_${Date.now()}_2`,
          type: 'performance',
          severity: 'info',
          message: 'Multiple DOM queries detected',
          suggestion: 'Consider caching DOM elements to improve performance',
          autoFixAvailable: false
        });
      }
      
      return insights;
    } catch (error) {
      this.logger.warn('Failed to analyze performance:', error);
      return [];
    }
  }

  /**
   * Analyze security issues
   */
  private async analyzeSecurity(context: any): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      const code = context.content;
      
      // Check for potential security issues
      if (typeof code === 'string' && (code.includes('eval(') || code.includes('Function('))) {
        insights.push({
          id: `sec_${Date.now()}_1`,
          type: 'security',
          severity: 'error',
          message: 'Dangerous eval() or Function() usage detected',
          suggestion: 'Avoid using eval() or Function() constructor as they can execute arbitrary code',
          autoFixAvailable: false
        });
      }
      
      if (typeof code === 'string' && code.includes('innerHTML') && !code.includes('textContent')) {
        insights.push({
          id: `sec_${Date.now()}_2`,
          type: 'security',
          severity: 'warning',
          message: 'Potential XSS vulnerability with innerHTML',
          suggestion: 'Consider using textContent or properly sanitize HTML content',
          autoFixAvailable: false
        });
      }
      
      return insights;
    } catch (error) {
      this.logger.warn('Failed to analyze security:', error);
      return [];
    }
  }

  /**
   * Analyze maintainability issues
   */
  private async analyzeMaintainability(context: any): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      const code = context.content;
      const lines = code.split('\n');
      
      // Check for long functions
      let functionLineCount = 0;
      let inFunction = false;
      
      for (const line of lines) {
        if (typeof line === 'string' && (line.includes('function ') || line.includes('=> {'))) {
          inFunction = true;
          functionLineCount = 1;
        } else if (inFunction) {
          functionLineCount++;
          if (typeof line === 'string' && line.includes('}') && functionLineCount > 50) {
            insights.push({
              id: `maint_${Date.now()}_1`,
              type: 'maintainability',
              severity: 'warning',
              message: 'Function is too long and may be hard to maintain',
              suggestion: 'Consider breaking this function into smaller, more focused functions',
              autoFixAvailable: false
            });
            inFunction = false;
          }
        }
      }
      
      // Check for magic numbers
      const magicNumberRegex = /\b\d{2,}\b/g;
      const magicNumbers = code.match(magicNumberRegex);
      if (magicNumbers && magicNumbers.length > 3) {
        insights.push({
          id: `maint_${Date.now()}_2`,
          type: 'maintainability',
          severity: 'info',
          message: 'Multiple magic numbers detected',
          suggestion: 'Consider extracting magic numbers into named constants',
          autoFixAvailable: false
        });
      }
      
      return insights;
    } catch (error) {
      this.logger.warn('Failed to analyze maintainability:', error);
      return [];
    }
  }

  /**
   * Analyze best practices
   */
  private async analyzeBestPractices(context: any): Promise<AIInsight[]> {
    try {
      const insights: AIInsight[] = [];
      const code = context.content;
      
      // Check for console.log in production code
      if (typeof code === 'string' && code.includes('console.log') && !context.filePath?.includes('test')) {
        insights.push({
          id: `bp_${Date.now()}_1`,
          type: 'best-practice',
          severity: 'info',
          message: 'Console.log statements found in production code',
          suggestion: 'Consider using a proper logging library or removing debug statements',
          autoFixAvailable: true
        });
      }
      
      // Check for var usage instead of let/const
      if (typeof code === 'string' && code.includes('var ')) {
        insights.push({
          id: `bp_${Date.now()}_2`,
          type: 'best-practice',
          severity: 'warning',
          message: 'Usage of var detected',
          suggestion: 'Use let or const instead of var for better scoping',
          autoFixAvailable: true
        });
      }
      
      // Check for missing error handling
      if (typeof code === 'string' && code.includes('async ') && !code.includes('try {') && !code.includes('catch')) {
        insights.push({
          id: `bp_${Date.now()}_3`,
          type: 'best-practice',
          severity: 'warning',
          message: 'Async function without error handling',
          suggestion: 'Add try-catch blocks to handle potential errors in async functions',
          autoFixAvailable: false
        });
      }
      
      return insights;
    } catch (error) {
      this.logger.warn('Failed to analyze best practices:', error);
      return [];
    }
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
    return `Please explain the following ${context.language || 'code'} code:

\`\`\`${context.language || ''}
${code}
\`\`\`

Provide:
1. A clear explanation of what this code does
2. Key concepts and patterns used
3. Complexity assessment (low/medium/high)
4. Related programming concepts
5. Suggestions for improvement

Format your response as JSON with these fields:
- explanation: string
- complexity: 'low' | 'medium' | 'high'
- keyPoints: string[]
- relatedConcepts: string[]
- improvementSuggestions: string[]`;
  }

  /**
   * Parse completion response from AI
   */
  private parseCompletionResponse(response: string, context: any): AICodeSuggestion[] {
    try {
      const suggestions: AICodeSuggestion[] = [];
      const lines = response.split('\n');
      let currentSuggestion: Partial<AICodeSuggestion> = {};
      
      for (const line of lines) {
        if (line.startsWith('SUGGESTION:')) {
          if (currentSuggestion.id) {
            suggestions.push(currentSuggestion as AICodeSuggestion);
          }
          currentSuggestion = {
            id: `completion_${Date.now()}_${Math.random()}`,
            type: 'completion',
            confidence: 0.8
          };
        } else if (line.startsWith('TITLE:')) {
          currentSuggestion.title = line.substring(6).trim();
        } else if (line.startsWith('CODE:')) {
          currentSuggestion.code = line.substring(5).trim();
        } else if (line.startsWith('DESCRIPTION:')) {
          currentSuggestion.description = line.substring(12).trim();
        }
      }
      
      if (currentSuggestion.id) {
        suggestions.push(currentSuggestion as AICodeSuggestion);
      }
      
      return suggestions.map(s => ({
        ...s,
        reasoning: s.reasoning || 'AI-generated code completion',
        metadata: {
          language: context.language || 'unknown',
          complexity: 'medium' as const
        }
      }));
    } catch (error) {
      this.logger.warn('Failed to parse completion response:', error);
      return [];
    }
  }

  /**
   * Parse refactor response from AI
   */
  private parseRefactorResponse(response: string, context: any): AICodeSuggestion[] {
    try {
      const suggestions: AICodeSuggestion[] = [];
      const sections = response.split('---');
      
      sections.forEach((section, index) => {
        if (section.trim()) {
          const lines = section.trim().split('\n');
          const title = lines[0] || `Refactor suggestion ${index + 1}`;
          const description = lines.slice(1, 3).join(' ').trim();
          const code = lines.slice(3).join('\n').trim();
          
          suggestions.push({
            id: `refactor_${Date.now()}_${index}`,
            type: 'refactor',
            title,
            description: description || 'Code refactoring suggestion',
            code,
            confidence: 0.75,
            reasoning: 'AI-suggested refactoring for better code quality',
            metadata: {
              language: context.language || 'unknown',
              complexity: 'medium' as const,
              pattern: 'refactoring'
            }
          });
        }
      });
      
      return suggestions;
    } catch (error) {
      this.logger.warn('Failed to parse refactor response:', error);
      return [];
    }
  }

  /**
   * Parse fix response from AI
   */
  private parseFixResponse(response: string, context: any): AICodeSuggestion[] {
    try {
      const suggestions: AICodeSuggestion[] = [];
      const fixes = response.split('FIX:').filter(f => f.trim());
      
      fixes.forEach((fix, index) => {
        const lines = fix.trim().split('\n');
        const title = lines[0] || `Bug fix ${index + 1}`;
        const description = lines.slice(1, 2).join('').trim();
        const code = lines.slice(2).join('\n').trim();
        
        suggestions.push({
          id: `fix_${Date.now()}_${index}`,
          type: 'fix',
          title,
          description: description || 'AI-suggested bug fix',
          code,
          confidence: 0.85,
          reasoning: 'AI-identified issue with suggested fix',
          metadata: {
            language: context.language || 'unknown',
            complexity: 'low' as const,
            pattern: 'bug-fix'
          }
        });
      });
      
      return suggestions;
    } catch (error) {
      this.logger.warn('Failed to parse fix response:', error);
      return [];
    }
  }

  /**
   * Parse optimization response from AI
   */
  private parseOptimizationResponse(response: string, context: any): AICodeSuggestion[] {
    try {
      const suggestions: AICodeSuggestion[] = [];
      const optimizations = response.split('OPTIMIZE:').filter(o => o.trim());
      
      optimizations.forEach((opt, index) => {
        const lines = opt.trim().split('\n');
        const title = lines[0] || `Performance optimization ${index + 1}`;
        const description = lines.slice(1, 3).join(' ').trim();
        const code = lines.slice(3).join('\n').trim();
        
        suggestions.push({
          id: `optimize_${Date.now()}_${index}`,
          type: 'optimize',
          title,
          description: description || 'AI-suggested performance optimization',
          code,
          confidence: 0.7,
          reasoning: 'AI-identified performance improvement opportunity',
          metadata: {
            language: context.language || 'unknown',
            complexity: 'high' as const,
            pattern: 'optimization'
          }
        });
      });
      
      return suggestions;
    } catch (error) {
      this.logger.warn('Failed to parse optimization response:', error);
      return [];
    }
  }

  /**
   * Parse explanation response from AI
   */
  private parseExplanationResponse(response: string): {
    explanation: string;
    complexity: 'low' | 'medium' | 'high';
    keyPoints: string[];
    relatedConcepts: string[];
    improvementSuggestions: string[];
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        explanation: parsed.explanation || 'No explanation available',
        complexity: parsed.complexity || 'medium',
        keyPoints: parsed.keyPoints || [],
        relatedConcepts: parsed.relatedConcepts || [],
        improvementSuggestions: parsed.improvementSuggestions || []
      };
    } catch (error) {
      // Fallback parsing if JSON fails
      return {
        explanation: response || 'Unable to generate explanation',
        complexity: 'medium' as const,
        keyPoints: [],
        relatedConcepts: [],
        improvementSuggestions: []
      };
    }
  }

  /**
   * Generate search explanation
   */
  private async generateSearchExplanation(query: string, code: string): Promise<string> {
    try {
      const prompt = `Explain why this code is relevant to the search query "${query}":

\`\`\`
${code}
\`\`\`

Provide a brief explanation of the relevance.`;
      
      const response = await this.llmService.generateResponse({
        prompt,
        maxTokens: 200,
        temperature: 0.3
      });
      
      return response.content || 'This code matches your search criteria';
    } catch (error) {
      this.logger.warn('Failed to generate search explanation:', error);
      return 'Relevant code found for your search query';
    }
  }

  /**
   * Get Git history for file
   */
  private async getGitHistory(filePath: string): Promise<GitCommit[]> {
    try {
      if (!this.gitMemory) {
        return [];
      }
      
      const history = await this.gitMemory.getFileHistory(filePath, 10);
      return (history || []).map((commit: any) => ({
        hash: commit.hash || '',
        message: commit.message || '',
        author: commit.author || '',
        date: commit.date || new Date(),
        files: commit.files || []
      }));
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
      const relatedFiles: string[] = [];
      const fileName = filePath.split('/').pop() || '';
      const baseName = fileName.split('.')[0];
      
      // Find files with similar names
      const similarFiles = await this.findFilesByPattern(`*${baseName}*`);
      relatedFiles.push(...similarFiles.slice(0, 5));
      
      // Find files that import this file
      const importingFiles = await this.findImportingFiles(filePath);
      relatedFiles.push(...importingFiles.slice(0, 5));
      
      // Use smart memory to find related files
      try {
        const searchResult = await this.smartMemory.smartSearch({
          query: filePath,
          type: 'semantic',
          limit: 10
        });
        const smartResults = searchResult?.contexts?.map(c => c.id) || [];
        relatedFiles.push(...smartResults);
      } catch (smartError) {
        this.logger.debug('Smart memory search failed:', smartError);
      }
      
      // Remove duplicates and the original file
      return [...new Set(relatedFiles)].filter(f => f !== filePath);
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
      if (!this.semanticMemory) {
        return {};
      }
      
      const context = await this.semanticMemory.analyzeContent(content);
      return {
        concepts: context?.concepts || [],
        patterns: context?.patterns || [],
        dependencies: context?.dependencies || [],
        complexity: context?.complexity || 'medium'
      };
    } catch (error) {
      this.logger.warn('Failed to get semantic context:', error);
      return {};
    }
  }

  /**
   * Find files by pattern
   */
  private async findFilesByPattern(pattern: string): Promise<string[]> {
    try {
      // This would typically use a file system search
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      this.logger.warn('Failed to find files by pattern:', error);
      return [];
    }
  }

  /**
   * Find files that import the given file
   */
  private async findImportingFiles(filePath: string): Promise<string[]> {
    try {
      // This would typically search through project files for import statements
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      this.logger.warn('Failed to find importing files:', error);
      return [];
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