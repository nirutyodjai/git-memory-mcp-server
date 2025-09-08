/**
 * AI Code Assistant
 * AI Assistant smarter than GitHub Copilot
 * Supports context awareness, project understanding, and multi-model AI
 */

import { EventEmitter } from '../utils/EventEmitter';
import { MultiModelAI, AITaskRequest, AITaskResult, AITaskType } from './MultiModelAI';
import { Logger } from '../utils/Logger';
import { MCPServerRegistry } from './MCPServerRegistry';

// Code Context Types
export interface CodeContext {
  currentFile: {
    path: string;
    content: string;
    language: string;
    cursorPosition: {
      line: number;
      column: number;
    };
    selection?: {
      start: { line: number; column: number };
      end: { line: number; column: number };
    };
  };
  project: {
    name: string;
    type: string; // 'web', 'mobile', 'desktop', 'library', etc.
    framework?: string;
    dependencies: string[];
    structure: ProjectStructure;
  };
  recentFiles: Array<{
    path: string;
    lastModified: Date;
    changesSummary?: string;
  }>;
  gitContext?: {
    branch: string;
    lastCommit: string;
    uncommittedChanges: string[];
  };
}

export interface ProjectStructure {
  directories: string[];
  files: Array<{
    path: string;
    type: string;
    size: number;
    lastModified: Date;
  }>;
  patterns: {
    testFiles: string[];
    configFiles: string[];
    sourceFiles: string[];
  };
}

// Assistant Capabilities
export type AssistantCapability = 
  | 'code-completion'
  | 'code-generation'
  | 'code-explanation'
  | 'code-review'
  | 'bug-detection'
  | 'performance-optimization'
  | 'refactoring'
  | 'test-generation'
  | 'documentation'
  | 'architecture-advice'
  | 'security-analysis'
  | 'dependency-management';

// Assistant Request
export interface AssistantRequest {
  id: string;
  type: AssistantCapability;
  input: string;
  context: CodeContext;
  preferences?: {
    codeStyle?: 'functional' | 'object-oriented' | 'mixed';
    verbosity?: 'minimal' | 'detailed' | 'comprehensive';
    includeExplanations?: boolean;
    includeAlternatives?: boolean;
    maxSuggestions?: number;
  };
  constraints?: {
    maxTime?: number;
    maxCost?: number;
    preferredModels?: string[];
  };
}

// Assistant Response
export interface AssistantResponse {
  id: string;
  requestId: string;
  success: boolean;
  result: {
    primary: {
      content: string;
      explanation?: string;
      confidence: number;
      type: 'code' | 'text' | 'mixed';
    };
    alternatives?: Array<{
      content: string;
      explanation?: string;
      confidence: number;
      pros?: string[];
      cons?: string[];
    }>;
    suggestions?: Array<{
      title: string;
      description: string;
      action: string;
      priority: 'low' | 'medium' | 'high';
    }>;
    relatedFiles?: Array<{
      path: string;
      reason: string;
      suggestedChanges?: string;
    }>;
  };
  metadata: {
    processingTime: number;
    cost: number;
    modelsUsed: string[];
    contextAnalysis: {
      projectComplexity: 'simple' | 'medium' | 'complex';
      codeQuality: number; // 0-1
      testCoverage?: number; // 0-1
      technicalDebt?: number; // 0-1
    };
  };
  followUpQuestions?: string[];
  learningPoints?: string[];
}

// Code Pattern Recognition
interface CodePattern {
  name: string;
  pattern: RegExp;
  language: string;
  category: 'design-pattern' | 'anti-pattern' | 'best-practice' | 'code-smell';
  description: string;
  suggestion?: string;
}

// User Learning Profile
interface UserLearningProfile {
  userId: string;
  skillLevel: {
    overall: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    languages: Record<string, number>; // 0-1 proficiency
    frameworks: Record<string, number>;
    concepts: Record<string, number>;
  };
  preferences: {
    codeStyle: string;
    explanationLevel: 'brief' | 'detailed' | 'comprehensive';
    learningGoals: string[];
  };
  history: {
    commonMistakes: string[];
    improvedAreas: string[];
    recentTopics: string[];
  };
  lastUpdated: Date;
}

/**
 * AI Code Assistant Class
 * Smart AI assistant that understands context
 */
export class AICodeAssistant extends EventEmitter {
  private static instance: AICodeAssistant;
  private multiModelAI: MultiModelAI;
  private mcpRegistry: MCPServerRegistry;
  private logger = Logger.getInstance();
  
  private userProfiles: Map<string, UserLearningProfile> = new Map();
  private codePatterns: CodePattern[] = [];
  private projectCache: Map<string, ProjectStructure> = new Map();
  private contextHistory: Map<string, CodeContext[]> = new Map();
  
  // Configuration
  private maxContextHistory = 10;
  private cacheTimeout = 300000; // 5 minutes
  
  private constructor() {
    super();
    this.multiModelAI = MultiModelAI.getInstance();
    this.mcpRegistry = MCPServerRegistry.getInstance();
    this.initializeCodePatterns();
    this.startContextCleaner();
  }

  public static getInstance(): AICodeAssistant {
    if (!AICodeAssistant.instance) {
      AICodeAssistant.instance = new AICodeAssistant();
    }
    return AICodeAssistant.instance;
  }

  /**
   * Process assistant request
   */
  public async processRequest(request: AssistantRequest): Promise<AssistantResponse> {
    const startTime = Date.now();
    
    try {
      this.emit('requestStarted', request);
      
      // 1. Analyze context
      const contextAnalysis = await this.analyzeContext(request.context);
      
      // 2. Enhance context with project understanding
      const enhancedContext = await this.enhanceContext(request.context);
      
      // 3. Select appropriate AI task configuration
      const taskConfig = this.createTaskConfig(request, contextAnalysis);
      
      // 4. Execute AI task
      const aiResult = await this.multiModelAI.executeTask({
        id: `ai_${request.id}`,
        config: taskConfig,
        input: {
          text: this.formatInputForAI(request, enhancedContext),
          context: {
            files: enhancedContext.recentFiles.map(f => f.path),
            project: enhancedContext.project.name,
            language: enhancedContext.currentFile.language,
            framework: enhancedContext.project.framework
          }
        }
      });
      
      // 5. Process and enhance AI result
      const response = await this.processAIResult(request, aiResult, contextAnalysis);
      
      // 6. Update user learning profile
      await this.updateUserLearning(request, response);
      
      // 7. Store context for future reference
      this.storeContext(request.context);
      
      this.emit('requestCompleted', { request, response });
      return response;
      
    } catch (error) {
      this.logger.error('AI Code Assistant request failed', { requestId: request.id, error });
      
      const errorResponse: AssistantResponse = {
        id: `response_${request.id}`,
        requestId: request.id,
        success: false,
        result: {
          primary: {
            content: 'Sorry, I encountered an error processing your request. Please try again.',
            confidence: 0,
            type: 'text'
          }
        },
        metadata: {
          processingTime: Date.now() - startTime,
          cost: 0,
          modelsUsed: [],
          contextAnalysis: {
            projectComplexity: 'medium',
            codeQuality: 0.5
          }
        }
      };
      
      this.emit('requestFailed', { request, error: errorResponse });
      return errorResponse;
    }
  }

  /**
   * Analyze code context
   */
  private async analyzeContext(context: CodeContext): Promise<{
    projectComplexity: 'simple' | 'medium' | 'complex';
    codeQuality: number;
    testCoverage?: number;
    technicalDebt?: number;
    patterns: CodePattern[];
    suggestions: string[];
  }> {
    // Analyze project complexity
    const fileCount = context.project.structure.files.length;
    const dependencyCount = context.project.dependencies.length;
    
    let projectComplexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (fileCount > 100 || dependencyCount > 20) projectComplexity = 'complex';
    else if (fileCount > 20 || dependencyCount > 5) projectComplexity = 'medium';
    
    // Analyze code quality
    const codeQuality = await this.analyzeCodeQuality(context.currentFile.content);
    
    // Detect patterns
    const patterns = this.detectCodePatterns(context.currentFile.content, context.currentFile.language);
    
    // Generate suggestions
    const suggestions = this.generateContextualSuggestions(context, patterns);
    
    return {
      projectComplexity,
      codeQuality,
      patterns,
      suggestions
    };
  }

  /**
   * Enhance context with additional project information
   */
  private async enhanceContext(context: CodeContext): Promise<CodeContext> {
    // Get additional project information from MCP
    try {
      const projectInfo = await this.mcpRegistry.getProjectInfo(context.project.name);
      const recentChanges = await this.mcpRegistry.getRecentChanges(context.project.name);
      
      return {
        ...context,
        project: {
          ...context.project,
          ...projectInfo
        },
        recentFiles: [
          ...context.recentFiles,
          ...recentChanges.map((change: any) => ({
            path: change.file,
            lastModified: new Date(change.timestamp),
            changesSummary: change.summary
          }))
        ]
      };
    } catch (error) {
      this.logger.warn('Failed to enhance context', { error });
      return context;
    }
  }

  /**
   * Create AI task configuration
   */
  private createTaskConfig(request: AssistantRequest, contextAnalysis: any): {
    id: string;
    type: AITaskType;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    mode: 'single' | 'parallel' | 'sequential' | 'ensemble' | 'cascade' | 'voting';
    maxModels?: number;
    minConfidence?: number;
    maxCost?: number;
    maxTime?: number;
  } {
    // Map assistant capabilities to AI task types
    const taskTypeMap: Record<AssistantCapability, AITaskType> = {
      'code-completion': 'code-completion',
      'code-generation': 'code-generation',
      'code-explanation': 'explanation',
      'code-review': 'code-review',
      'bug-detection': 'bug-detection',
      'performance-optimization': 'optimization',
      'refactoring': 'refactoring',
      'test-generation': 'testing',
      'documentation': 'documentation',
      'architecture-advice': 'analysis',
      'security-analysis': 'analysis',
      'dependency-management': 'analysis'
    };
    
    // Determine processing mode based on request type and complexity
    let mode: 'single' | 'parallel' | 'sequential' | 'ensemble' | 'cascade' | 'voting' = 'single';
    
    if (contextAnalysis.projectComplexity === 'complex') {
      mode = request.preferences?.includeAlternatives ? 'parallel' : 'cascade';
    } else if (request.type === 'code-review' || request.type === 'security-analysis') {
      mode = 'ensemble';
    }
    
    return {
      id: `task_${request.id}`,
      type: taskTypeMap[request.type],
      priority: this.determinePriority(request),
      mode,
      maxModels: request.preferences?.maxSuggestions || 3,
      minConfidence: 0.7,
      maxCost: request.constraints?.maxCost || 0.1,
      maxTime: request.constraints?.maxTime || 30000
    };
  }

  /**
   * Format input for AI processing
   */
  private formatInputForAI(request: AssistantRequest, context: CodeContext): string {
    const parts = [];
    
    // Add request context
    parts.push(`Task: ${request.type}`);
    parts.push(`Input: ${request.input}`);
    
    // Add file context
    parts.push(`\nCurrent File: ${context.currentFile.path}`);
    parts.push(`Language: ${context.currentFile.language}`);
    
    if (context.currentFile.selection) {
      const { start, end } = context.currentFile.selection;
      parts.push(`Selected Code (lines ${start.line}-${end.line}):`);
      const lines = context.currentFile.content.split('\n');
      const selectedLines = lines.slice(start.line - 1, end.line);
      parts.push(selectedLines.join('\n'));
    } else {
      parts.push(`\nCurrent Code:`);
      parts.push(context.currentFile.content);
    }
    
    // Add project context
    parts.push(`\nProject: ${context.project.name} (${context.project.type})`);
    if (context.project.framework) {
      parts.push(`Framework: ${context.project.framework}`);
    }
    
    // Add recent changes context
    if (context.recentFiles.length > 0) {
      parts.push(`\nRecent Changes:`);
      context.recentFiles.slice(0, 3).forEach(file => {
        parts.push(`- ${file.path}: ${file.changesSummary || 'Modified'}`);
      });
    }
    
    // Add preferences
    if (request.preferences) {
      parts.push(`\nPreferences:`);
      if (request.preferences.codeStyle) {
        parts.push(`- Code Style: ${request.preferences.codeStyle}`);
      }
      if (request.preferences.verbosity) {
        parts.push(`- Explanation Level: ${request.preferences.verbosity}`);
      }
    }
    
    return parts.join('\n');
  }

  /**
   * Process AI result and enhance response
   */
  private async processAIResult(
    request: AssistantRequest, 
    aiResult: AITaskResult, 
    contextAnalysis: any
  ): Promise<AssistantResponse> {
    const response: AssistantResponse = {
      id: `response_${request.id}`,
      requestId: request.id,
      success: aiResult.success,
      result: {
        primary: {
          content: aiResult.results.primary.content,
          confidence: aiResult.results.primary.confidence,
          type: this.determineContentType(aiResult.results.primary.content)
        }
      },
      metadata: {
        processingTime: aiResult.metadata.totalTime,
        cost: aiResult.metadata.totalCost,
        modelsUsed: aiResult.metadata.modelsUsed,
        contextAnalysis
      }
    };
    
    // Add explanation if requested
    if (request.preferences?.includeExplanations) {
      response.result.primary.explanation = await this.generateExplanation(
        request, aiResult.results.primary.content
      );
    }
    
    // Add alternatives if available and requested
    if (aiResult.results.alternatives && request.preferences?.includeAlternatives) {
      response.result.alternatives = aiResult.results.alternatives.map(alt => ({
        content: alt.content,
        confidence: alt.confidence,
        pros: this.generateProsAndCons(alt.content, request).pros,
        cons: this.generateProsAndCons(alt.content, request).cons
      }));
    }
    
    // Generate contextual suggestions
    response.result.suggestions = this.generateSuggestions(request, aiResult, contextAnalysis);
    
    // Find related files
    response.result.relatedFiles = await this.findRelatedFiles(request, aiResult);
    
    // Generate follow-up questions
    response.followUpQuestions = this.generateFollowUpQuestions(request, aiResult);
    
    // Generate learning points
    response.learningPoints = this.generateLearningPoints(request, aiResult);
    
    return response;
  }

  /**
   * Analyze code quality
   */
  private async analyzeCodeQuality(code: string): Promise<number> {
    // Simple code quality analysis
    let score = 1.0;
    
    // Check for common issues
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // Long lines penalty
    const longLines = nonEmptyLines.filter(line => line.length > 120);
    score -= (longLines.length / nonEmptyLines.length) * 0.2;
    
    // Complex functions penalty (simple heuristic)
    const functionMatches = code.match(/function\s+\w+|\w+\s*=>|def\s+\w+/g) || [];
    const braceMatches = code.match(/{/g) || [];
    if (functionMatches.length > 0) {
      const avgComplexity = braceMatches.length / functionMatches.length;
      if (avgComplexity > 5) score -= 0.1;
    }
    
    // Comments bonus
    const commentLines = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('#') || 
      line.trim().startsWith('/*')
    );
    const commentRatio = commentLines.length / nonEmptyLines.length;
    if (commentRatio > 0.1) score += 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Detect code patterns
   */
  private detectCodePatterns(code: string, language: string): CodePattern[] {
    return this.codePatterns.filter(pattern => 
      pattern.language === language && pattern.pattern.test(code)
    );
  }

  /**
   * Generate contextual suggestions
   */
  private generateContextualSuggestions(context: CodeContext, patterns: CodePattern[]): string[] {
    const suggestions: string[] = [];
    
    // Pattern-based suggestions
    patterns.forEach(pattern => {
      if (pattern.suggestion) {
        suggestions.push(pattern.suggestion);
      }
    });
    
    // Project-based suggestions
    if (context.project.dependencies.includes('react') && !context.project.dependencies.includes('@testing-library/react')) {
      suggestions.push('Consider adding React Testing Library for better component testing');
    }
    
    if (context.project.dependencies.includes('express') && !context.project.dependencies.includes('helmet')) {
      suggestions.push('Consider adding Helmet for security headers in Express apps');
    }
    
    return suggestions;
  }

  /**
   * Initialize code patterns
   */
  private initializeCodePatterns(): void {
    this.codePatterns = [
      {
        name: 'Long Function',
        pattern: /function\s+\w+[^}]{200,}/,
        language: 'javascript',
        category: 'code-smell',
        description: 'Function is too long and should be broken down',
        suggestion: 'Consider breaking this function into smaller, more focused functions'
      },
      {
        name: 'Missing Error Handling',
        pattern: /await\s+\w+\([^)]*\)(?!\s*\.catch)(?![^}]*catch)/,
        language: 'javascript',
        category: 'best-practice',
        description: 'Async operation without error handling',
        suggestion: 'Add try-catch block or .catch() for error handling'
      },
      {
        name: 'Hardcoded Values',
        pattern: /["'](?:localhost|127\.0\.0\.1|password|secret|key)["']/i,
        language: 'javascript',
        category: 'anti-pattern',
        description: 'Hardcoded sensitive values detected',
        suggestion: 'Move sensitive values to environment variables'
      }
      // Add more patterns as needed
    ];
  }

  /**
   * Determine content type
   */
  private determineContentType(content: string): 'code' | 'text' | 'mixed' {
    const codeIndicators = ['function', 'class', 'import', 'export', 'const', 'let', 'var', '{', '}', ';'];
    const codeCount = codeIndicators.reduce((count, indicator) => 
      count + (content.match(new RegExp(indicator, 'g')) || []).length, 0
    );
    
    if (codeCount > 5) return 'code';
    if (codeCount > 0) return 'mixed';
    return 'text';
  }

  /**
   * Generate explanation
   */
  private async generateExplanation(request: AssistantRequest, content: string): Promise<string> {
    // Simple explanation generation - in practice, this would use AI
    switch (request.type) {
      case 'code-generation':
        return 'This code was generated based on your requirements and project context.';
      case 'code-review':
        return 'This review considers code quality, best practices, and potential issues.';
      case 'refactoring':
        return 'This refactoring improves code structure while maintaining functionality.';
      default:
        return 'This response was generated using advanced AI analysis of your code and context.';
    }
  }

  /**
   * Generate pros and cons
   */
  private generateProsAndCons(content: string, request: AssistantRequest): { pros: string[]; cons: string[] } {
    // Simple implementation - would be more sophisticated in practice
    return {
      pros: ['Clean and readable', 'Follows best practices'],
      cons: ['May need additional error handling', 'Could benefit from more comments']
    };
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(request: AssistantRequest, aiResult: AITaskResult, contextAnalysis: any): Array<{
    title: string;
    description: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const suggestions = [];
    
    if (contextAnalysis.codeQuality < 0.7) {
      suggestions.push({
        title: 'Improve Code Quality',
        description: 'Your code quality score is below optimal',
        action: 'Run code analysis and fix identified issues',
        priority: 'medium' as const
      });
    }
    
    if (request.type === 'code-generation') {
      suggestions.push({
        title: 'Add Tests',
        description: 'Generated code should be tested',
        action: 'Create unit tests for the generated code',
        priority: 'high' as const
      });
    }
    
    return suggestions;
  }

  /**
   * Find related files
   */
  private async findRelatedFiles(request: AssistantRequest, aiResult: AITaskResult): Promise<Array<{
    path: string;
    reason: string;
    suggestedChanges?: string;
  }>> {
    // Simple implementation - would use more sophisticated analysis
    return [
      {
        path: 'tests/' + request.context.currentFile.path.replace('.js', '.test.js'),
        reason: 'Test file for current module',
        suggestedChanges: 'Add or update tests for new functionality'
      }
    ];
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(request: AssistantRequest, aiResult: AITaskResult): string[] {
    const questions = [];
    
    if (request.type === 'code-generation') {
      questions.push('Would you like me to generate tests for this code?');
      questions.push('Should I explain how this code works?');
    }
    
    if (request.type === 'code-review') {
      questions.push('Would you like suggestions for refactoring?');
      questions.push('Should I check for security vulnerabilities?');
    }
    
    return questions;
  }

  /**
   * Generate learning points
   */
  private generateLearningPoints(request: AssistantRequest, aiResult: AITaskResult): string[] {
    const points = [];
    
    if (request.type === 'code-generation') {
      points.push('Understanding the generated code pattern will help you write similar code in the future');
    }
    
    if (request.type === 'bug-detection') {
      points.push('Learning to identify these patterns will help prevent similar bugs');
    }
    
    return points;
  }

  /**
   * Determine priority
   */
  private determinePriority(request: AssistantRequest): 'low' | 'medium' | 'high' | 'urgent' {
    if (request.type === 'bug-detection' || request.type === 'security-analysis') {
      return 'high';
    }
    if (request.type === 'code-completion') {
      return 'urgent';
    }
    return 'medium';
  }

  /**
   * Update user learning profile
   */
  private async updateUserLearning(request: AssistantRequest, response: AssistantResponse): Promise<void> {
    // Simple implementation - would be more sophisticated
    const userId = 'default'; // Would get from session
    
    let profile = this.userProfiles.get(userId);
    if (!profile) {
      profile = {
        userId,
        skillLevel: {
          overall: 'intermediate',
          languages: {},
          frameworks: {},
          concepts: {}
        },
        preferences: {
          codeStyle: 'mixed',
          explanationLevel: 'detailed',
          learningGoals: []
        },
        history: {
          commonMistakes: [],
          improvedAreas: [],
          recentTopics: []
        },
        lastUpdated: new Date()
      };
    }
    
    // Update recent topics
    profile.history.recentTopics.unshift(request.type);
    profile.history.recentTopics = profile.history.recentTopics.slice(0, 10);
    
    // Update language proficiency
    const language = request.context.currentFile.language;
    if (language) {
      profile.skillLevel.languages[language] = 
        (profile.skillLevel.languages[language] || 0.5) + 0.01;
    }
    
    profile.lastUpdated = new Date();
    this.userProfiles.set(userId, profile);
  }

  /**
   * Store context for future reference
   */
  private storeContext(context: CodeContext): void {
    const projectKey = context.project.name;
    let history = this.contextHistory.get(projectKey) || [];
    
    history.unshift(context);
    history = history.slice(0, this.maxContextHistory);
    
    this.contextHistory.set(projectKey, history);
  }

  /**
   * Start context cleaner
   */
  private startContextCleaner(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean old project cache
      for (const [key, structure] of this.projectCache.entries()) {
        // Simple cleanup - would check actual timestamps in practice
        if (Math.random() < 0.1) { // Randomly clean 10% of entries
          this.projectCache.delete(key);
        }
      }
      
      this.emit('contextCleaned', {
        projectCacheSize: this.projectCache.size,
        contextHistorySize: this.contextHistory.size
      });
    }, this.cacheTimeout);
  }

  /**
   * Get user learning profile
   */
  public getUserProfile(userId: string = 'default'): UserLearningProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get assistant statistics
   */
  public getStatistics(): {
    userProfiles: number;
    codePatterns: number;
    projectCache: number;
    contextHistory: number;
  } {
    return {
      userProfiles: this.userProfiles.size,
      codePatterns: this.codePatterns.length,
      projectCache: this.projectCache.size,
      contextHistory: this.contextHistory.size
    };
  }
}

// Export singleton instance
export const aiCodeAssistant = AICodeAssistant.getInstance();