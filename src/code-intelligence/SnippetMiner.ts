import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { StaticAnalyzer, CodeElement, CodeElementType, FileAnalysis } from './StaticAnalyzer';

/**
 * Snippet types
 */
export enum SnippetType {
  FUNCTION_CALL = 'function_call',
  CODE_PATTERN = 'code_pattern',
  IMPORT_STATEMENT = 'import_statement',
  VARIABLE_DECLARATION = 'variable_declaration',
  CONTROL_STRUCTURE = 'control_structure',
  ERROR_HANDLING = 'error_handling',
  API_USAGE = 'api_usage',
  CONFIGURATION = 'configuration'
}

/**
 * Code snippet representation
 */
export interface CodeSnippet {
  id: string;
  type: SnippetType;
  name: string;
  description: string;
  template: string;
  parameters: SnippetParameter[];
  language: string;
  tags: string[];
  frequency: number;
  score: number;
  contexts: SnippetContext[];
  examples: SnippetExample[];
  metadata: {
    createdAt: Date;
    lastUsed: Date;
    usageCount: number;
    successRate: number;
    averageRating: number;
    sourceFiles: string[];
    relatedSnippets: string[];
    complexity: number;
    category: string;
  };
}

/**
 * Snippet parameter
 */
export interface SnippetParameter {
  name: string;
  type: string;
  description: string;
  defaultValue?: string;
  required: boolean;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Snippet context (when to suggest this snippet)
 */
export interface SnippetContext {
  filePattern?: string;
  languagePattern?: string;
  codePattern?: string;
  cursorPosition?: 'function' | 'class' | 'import' | 'variable' | 'any';
  precedingCode?: string;
  followingCode?: string;
  weight: number;
}

/**
 * Snippet example
 */
export interface SnippetExample {
  title: string;
  description: string;
  code: string;
  parameters: Record<string, any>;
  output?: string;
}

/**
 * Usage pattern
 */
export interface UsagePattern {
  pattern: string;
  frequency: number;
  contexts: string[];
  variations: string[];
  tfIdfScore: number;
}

/**
 * Mining configuration
 */
export interface MiningConfig {
  maxFileSizeBytes: number;
  maxConcurrentFiles: number;
  minTokens: number;
  maxTokens: number;
  minScore: number;
  minFrequency: number;
  maxSnippets: number;
  contextWindow: number;
  includeComments: boolean;
  includeStrings: boolean;
  minTokenLength: number;
  maxTokenLength: number;
  supportedLanguages: string[];
  snippetTypes: SnippetType[];
  includePatterns: string[];
  ignorePatterns: string[];
  qualityThreshold: number;
  diversityWeight: number;
  frequencyWeight: number;
  contextWeight: number;
  enablePatternMining?: boolean;
  enableTfIdf?: boolean;
  enableContextAnalysis?: boolean;
}

export class SnippetMiner extends EventEmitter {
  private logger: Logger;
  private snippets = new Map<string, CodeSnippet>();
  private usagePatterns = new Map<string, UsagePattern>();
  private documentFrequency = new Map<string, number>();
  private totalDocuments = 0;
  private isMining = false;

  constructor(
    private staticAnalyzer: StaticAnalyzer,
    private config: MiningConfig
  ) {
    super();
    this.logger = new Logger('SnippetMiner');
  }

  /**
   * Mine snippets from workspace
   */
  async mineWorkspace(workspacePath: string): Promise<{
    snippets: CodeSnippet[];
    patterns: UsagePattern[];
    summary: {
      totalSnippets: number;
      topCategories: Record<string, number>;
      topLanguages: Record<string, number>;
      averageScore: number;
    };
  }> {
    if (this.isMining) {
      throw new Error('Mining already in progress');
    }

    this.isMining = true;
    this.logger.info(`Starting snippet mining: ${workspacePath}`);

    try {
      // Clear previous results
      this.snippets.clear();
      this.usagePatterns.clear();
      this.documentFrequency.clear();
      this.totalDocuments = 0;

      // Get analysis from StaticAnalyzer
      const analysis = await this.staticAnalyzer.analyzeWorkspace(workspacePath);
      this.totalDocuments = analysis.files.length;

      // Mine patterns from code
      if (this.config.enablePatternMining) {
        await this.minePatterns(analysis.files);
      }

      // Calculate TF-IDF scores
      if (this.config.enableTfIdf) {
        this.calculateTfIdfScores();
      }

      // Generate snippets from patterns
      await this.generateSnippets(analysis.files);

      // Analyze contexts
      if (this.config.enableContextAnalysis) {
        await this.analyzeContexts(analysis.files);
      }

      // Filter and rank snippets
      this.filterAndRankSnippets();

      // Generate summary
      const summary = this.generateSummary();

      const snippetsArray = Array.from(this.snippets.values());
      const patternsArray = Array.from(this.usagePatterns.values());

      this.logger.info('Snippet mining completed', {
        totalSnippets: snippetsArray.length,
        totalPatterns: patternsArray.length
      });

      this.emit('mining.completed', {
        snippets: snippetsArray,
        patterns: patternsArray,
        summary
      });

      return {
        snippets: snippetsArray,
        patterns: patternsArray,
        summary
      };
    } finally {
      this.isMining = false;
    }
  }

  /**
   * Get mining statistics
   */
  getStatistics(): {
    totalSnippets: number;
    topCategories: Record<string, number>;
    topLanguages: Record<string, number>;
    averageScore: number;
  } {
    return this.generateSummary();
  }

  /**
   * Export snippets to a JSON file
   */
  async exportSnippets(filePath: string): Promise<void> {
    this.logger.info(`Exporting snippets to ${filePath}`);
    const snippetsArray = Array.from(this.snippets.values());
    const data = {
      snippets: snippetsArray,
      patterns: Array.from(this.usagePatterns.values()),
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    this.logger.info('Snippets exported successfully');
  }

  /**
   * Import snippets from a JSON file
   */
  async importSnippets(filePath: string): Promise<void> {
    this.logger.info(`Importing snippets from ${filePath}`);
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (data.snippets) {
      for (const snippet of data.snippets) {
        this.snippets.set(snippet.id, snippet);
      }
    }

    if (data.patterns) {
      for (const pattern of data.patterns) {
        this.usagePatterns.set(pattern.pattern, pattern);
      }
    }

    this.logger.info(`Imported ${data.snippets?.length || 0} snippets and ${data.patterns?.length || 0} patterns`);
  }

  /**
   * Record usage of a snippet
   */
  recordUsage(snippetId: string, success: boolean, context?: string): void {
    const snippet = this.snippets.get(snippetId);
    if (snippet) {
      if (!snippet.metadata.usageCount) {
        snippet.metadata.usageCount = 0;
      }
      snippet.metadata.usageCount++;
      
      if (!snippet.metadata.lastUsed) {
        snippet.metadata.lastUsed = new Date();
      } else {
        snippet.metadata.lastUsed = new Date();
      }
      
      // Update success rate
      if (!snippet.metadata.successRate) {
        snippet.metadata.successRate = success ? 1 : 0;
      } else {
        const currentSuccesses = snippet.metadata.successRate * (snippet.metadata.usageCount - 1);
        const newSuccesses = currentSuccesses + (success ? 1 : 0);
        snippet.metadata.successRate = newSuccesses / snippet.metadata.usageCount;
      }
      
      this.logger.info(`Recorded usage for snippet ${snippetId}: success=${success}, context=${context}`);
    } else {
      this.logger.warn(`Snippet ${snippetId} not found for usage recording`);
    }
  }

  /**
   * Generate summary of mined snippets
   */
  private generateSummary(): {
    totalSnippets: number;
    topCategories: Record<string, number>;
    topLanguages: Record<string, number>;
    averageScore: number;
  } {
    const snippetsArray = Array.from(this.snippets.values());
    const totalSnippets = snippetsArray.length;

    if (totalSnippets === 0) {
      return {
        totalSnippets: 0,
        topCategories: {},
        topLanguages: {},
        averageScore: 0,
      };
    }

    const topCategories = snippetsArray.reduce((acc, snippet) => {
      const category = snippet.metadata.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLanguages = snippetsArray.reduce((acc, snippet) => {
      const language = snippet.language;
      acc[language] = (acc[language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageScore =
      snippetsArray.reduce((sum, snippet) => sum + snippet.score, 0) / totalSnippets;

    return {
      totalSnippets,
      topCategories,
      topLanguages,
      averageScore,
    };
  }

  /**
   * Mine usage patterns from files
   */
  private async minePatterns(files: FileAnalysis[]): Promise<void> {
    this.logger.info('Mining usage patterns...');

    for (const file of files) {
      try {
        const content = await fs.readFile(file.filePath, 'utf-8');
        await this.extractPatternsFromFile(file.filePath, content, file.language);
      } catch (error) {
        this.logger.warn(`Failed to mine patterns from ${file.filePath}:`, error);
      }
    }
  }

  /**
   * Extract patterns from a single file
   */
  private async extractPatternsFromFile(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const lines = content.split('\n');

    // Extract function calls
    await this.extractFunctionCalls(filePath, content, language);

    // Extract import patterns
    await this.extractImportPatterns(filePath, content, language);

    // Extract variable declarations
    await this.extractVariableDeclarations(filePath, content, language);

    // Extract control structures
    await this.extractControlStructures(filePath, content, language);

    // Extract error handling patterns
    await this.extractErrorHandling(filePath, content, language);

    // Extract API usage patterns
    await this.extractApiUsage(filePath, content, language);

    // Extract configuration patterns
    await this.extractConfigurationPatterns(filePath, content, language);
  }

  /**
   * Extract function call patterns
   */
  private async extractFunctionCalls(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const patterns: RegExp[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        patterns.push(
          /(\w+)\s*\([^)]*\)/g,
          /(\w+\.\w+)\s*\([^)]*\)/g,
          /await\s+(\w+(?:\.\w+)*)\s*\([^)]*\)/g
        );
        break;
      case 'python':
        patterns.push(
          /(\w+)\s*\([^)]*\)/g,
          /(\w+\.\w+)\s*\([^)]*\)/g
        );
        break;
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const functionCall = match[1] || match[0];
        this.recordPattern(functionCall, filePath, SnippetType.FUNCTION_CALL);
      }
    }
  }

  /**
   * Extract import patterns
   */
  private async extractImportPatterns(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const patterns: RegExp[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        patterns.push(
          /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g,
          /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
          /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g
        );
        break;
      case 'python':
        patterns.push(
          /from\s+(\S+)\s+import\s+([^\n]+)/g,
          /import\s+([^\n]+)/g
        );
        break;
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPattern = match[0];
        this.recordPattern(importPattern, filePath, SnippetType.IMPORT_STATEMENT);
      }
    }
  }

  /**
   * Extract variable declaration patterns
   */
  private async extractVariableDeclarations(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const patterns: RegExp[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        patterns.push(
          /(const|let|var)\s+(\w+)\s*=\s*([^;\n]+)/g
        );
        break;
      case 'python':
        patterns.push(
          /(\w+)\s*=\s*([^\n]+)/g
        );
        break;
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const declaration = match[0];
        this.recordPattern(declaration, filePath, SnippetType.VARIABLE_DECLARATION);
      }
    }
  }

  /**
   * Extract control structure patterns
   */
  private async extractControlStructures(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const patterns: RegExp[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        patterns.push(
          /if\s*\([^)]+\)\s*{/g,
          /for\s*\([^)]+\)\s*{/g,
          /while\s*\([^)]+\)\s*{/g,
          /switch\s*\([^)]+\)\s*{/g
        );
        break;
      case 'python':
        patterns.push(
          /if\s+[^:]+:/g,
          /for\s+[^:]+:/g,
          /while\s+[^:]+:/g
        );
        break;
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const structure = match[0];
        this.recordPattern(structure, filePath, SnippetType.CONTROL_STRUCTURE);
      }
    }
  }

  /**
   * Extract error handling patterns
   */
  private async extractErrorHandling(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const patterns: RegExp[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        patterns.push(
          /try\s*{[^}]*}\s*catch\s*\([^)]*\)\s*{/g,
          /\.catch\s*\([^)]*\)/g,
          /throw\s+new\s+\w+\s*\([^)]*\)/g
        );
        break;
      case 'python':
        patterns.push(
          /try:\s*[^\n]*\s*except\s+[^:]+:/g,
          /raise\s+\w+\s*\([^)]*\)/g
        );
        break;
    }

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const errorHandling = match[0];
        this.recordPattern(errorHandling, filePath, SnippetType.ERROR_HANDLING);
      }
    }
  }

  /**
   * Extract API usage patterns
   */
  private async extractApiUsage(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const apiPatterns = [
      /fetch\s*\([^)]*\)/g,
      /axios\.[a-z]+\s*\([^)]*\)/g,
      /\$\.[a-z]+\s*\([^)]*\)/g, // jQuery
      /requests\.[a-z]+\s*\([^)]*\)/g, // Python requests
      /http\.[a-z]+\s*\([^)]*\)/g
    ];

    for (const pattern of apiPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const apiCall = match[0];
        this.recordPattern(apiCall, filePath, SnippetType.API_USAGE);
      }
    }
  }

  /**
   * Extract configuration patterns
   */
  private async extractConfigurationPatterns(
    filePath: string,
    content: string,
    language: string
  ): Promise<void> {
    const configPatterns = [
      /process\.env\.[A-Z_]+/g,
      /config\.[a-zA-Z_]+/g,
      /settings\.[a-zA-Z_]+/g,
      /os\.environ\[['"][^'"]+['"]/g // Python
    ];

    for (const pattern of configPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const configAccess = match[0];
        this.recordPattern(configAccess, filePath, SnippetType.CONFIGURATION);
      }
    }
  }

  /**
   * Record a pattern occurrence
   */
  private recordPattern(pattern: string, filePath: string, category: string): void {
    // Skip if pattern matches exclude patterns
    if (this.config.ignorePatterns.some((exclude: string) => pattern.includes(exclude))) {
      return;
    }

    // Check if pattern matches include patterns (if specified)
    if (this.config.includePatterns.length > 0 &&
        !this.config.includePatterns.some(include => pattern.includes(include))) {
      return;
    }

    const key = `${pattern}:${category}`;
    
    if (!this.usagePatterns.has(key)) {
      this.usagePatterns.set(key, {
        pattern,
        frequency: 0,
        contexts: [],
        variations: [],
        tfIdfScore: 0
      });
    }

    const usagePattern = this.usagePatterns.get(key)!;
    usagePattern.frequency++;
    
    if (!usagePattern.contexts.includes(filePath)) {
      usagePattern.contexts.push(filePath);
    }

    // Update document frequency
    if (!this.documentFrequency.has(pattern)) {
      this.documentFrequency.set(pattern, 0);
    }
    this.documentFrequency.set(pattern, this.documentFrequency.get(pattern)! + 1);
  }

  /**
   * Calculate TF-IDF scores for patterns
   */
  private calculateTfIdfScores(): void {
    this.logger.info('Calculating TF-IDF scores...');

    for (const [key, pattern] of this.usagePatterns) {
      const tf = pattern.frequency;
      const df = this.documentFrequency.get(pattern.pattern) || 1;
      const idf = Math.log(this.totalDocuments / df);
      pattern.tfIdfScore = tf * idf;
    }
  }

  /**
   * Generate snippets from patterns
   */
  private async generateSnippets(files: any[]): Promise<void> {
    this.logger.info('Generating snippets from patterns...');

    for (const [key, pattern] of this.usagePatterns) {
      if (pattern.frequency < this.config.minFrequency) {
        continue;
      }

      const [patternText, category] = key.split(':');
      const snippet = await this.createSnippetFromPattern(pattern, category as SnippetType);
      
      if (snippet && snippet.score >= this.config.minScore) {
        this.snippets.set(snippet.id, snippet);
      }
    }
  }

  /**
   * Create snippet from usage pattern
   */
  private async createSnippetFromPattern(
    pattern: UsagePattern,
    type: SnippetType
  ): Promise<CodeSnippet | null> {
    try {
      const id = `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const template = this.generateTemplate(pattern.pattern, type);
      const parameters = this.extractParameters(pattern.pattern, type);
      const language = this.detectLanguageFromPattern(pattern.pattern);
      const score = this.calculateSnippetScore(pattern);

      const snippet: CodeSnippet = {
        id,
        type,
        name: this.generateSnippetName(pattern.pattern, type),
        description: this.generateSnippetDescription(pattern.pattern, type),
        template,
        parameters,
        language,
        tags: this.generateTags(pattern.pattern, type),
        frequency: pattern.frequency,
        score,
        contexts: [],
        examples: await this.generateExamples(pattern.pattern, type),
        metadata: {
          createdAt: new Date(),
          lastUsed: new Date(),
          usageCount: pattern.frequency,
          successRate: 1.0,
          averageRating: 0,
          sourceFiles: pattern.contexts,
          relatedSnippets: [],
          complexity: this.calculatePatternComplexity(pattern.pattern),
          category: type
        }
      };

      return snippet;
    } catch (error) {
      this.logger.warn('Failed to create snippet from pattern:', error);
      return null;
    }
  }

  /**
   * Generate template from pattern
   */
  private generateTemplate(pattern: string, type: SnippetType): string {
    let template = pattern;

    // Replace common patterns with placeholders
    switch (type) {
      case SnippetType.FUNCTION_CALL:
        template = template.replace(/\w+/g, '${1:functionName}');
        template = template.replace(/\([^)]*\)/g, '(${2:arguments})');
        break;
      case SnippetType.VARIABLE_DECLARATION:
        template = template.replace(/(const|let|var)\s+(\w+)/, '$1 ${1:variableName}');
        template = template.replace(/=\s*([^;\n]+)/, '= ${2:value}');
        break;
      case SnippetType.IMPORT_STATEMENT:
        template = template.replace(/['"][^'"]+['"]/, '"${1:moduleName}"');
        break;
    }

    return template;
  }

  /**
   * Extract parameters from pattern
   */
  private extractParameters(pattern: string, type: SnippetType): SnippetParameter[] {
    const parameters: SnippetParameter[] = [];

    switch (type) {
      case SnippetType.FUNCTION_CALL:
        parameters.push({
          name: 'functionName',
          type: 'string',
          description: 'Name of the function to call',
          required: true
        });
        parameters.push({
          name: 'arguments',
          type: 'string',
          description: 'Function arguments',
          required: false,
          defaultValue: ''
        });
        break;
      case SnippetType.VARIABLE_DECLARATION:
        parameters.push({
          name: 'variableName',
          type: 'string',
          description: 'Name of the variable',
          required: true
        });
        parameters.push({
          name: 'value',
          type: 'string',
          description: 'Initial value',
          required: true
        });
        break;
      case SnippetType.IMPORT_STATEMENT:
        parameters.push({
          name: 'moduleName',
          type: 'string',
          description: 'Name of the module to import',
          required: true
        });
        break;
    }

    return parameters;
  }

  /**
   * Detect language from pattern
   */
  private detectLanguageFromPattern(pattern: string): string {
    if (pattern.includes('const ') || pattern.includes('let ') || pattern.includes('var ')) {
      return 'javascript';
    }
    if (pattern.includes('import ') && pattern.includes('from ')) {
      return 'javascript';
    }
    if (pattern.includes('def ') || pattern.includes('import ') && !pattern.includes('from ')) {
      return 'python';
    }
    return 'unknown';
  }

  /**
   * Calculate snippet score
   */
  private calculateSnippetScore(pattern: UsagePattern): number {
    let score = 0;

    // Frequency score (0-0.4)
    score += Math.min(pattern.frequency / 100, 0.4);

    // TF-IDF score (0-0.3)
    score += Math.min(pattern.tfIdfScore / 10, 0.3);

    // Context diversity score (0-0.2)
    score += Math.min(pattern.contexts.length / 10, 0.2);

    // Pattern complexity score (0-0.1)
    const complexity = this.calculatePatternComplexity(pattern.pattern);
    score += Math.min(complexity / 10, 0.1);

    return Math.min(score, 1.0);
  }

  /**
   * Calculate pattern complexity
   */
  private calculatePatternComplexity(pattern: string): number {
    let complexity = 0;
    
    // Length factor
    complexity += pattern.length / 100;
    
    // Special characters
    complexity += (pattern.match(/[{}()\[\]]/g) || []).length * 0.1;
    
    // Keywords
    complexity += (pattern.match(/\b(if|for|while|try|catch|function|class)\b/g) || []).length * 0.2;
    
    return complexity;
  }

  /**
   * Generate snippet name
   */
  private generateSnippetName(pattern: string, type: SnippetType): string {
    const typeNames = {
      [SnippetType.FUNCTION_CALL]: 'Function Call',
      [SnippetType.CODE_PATTERN]: 'Code Pattern',
      [SnippetType.IMPORT_STATEMENT]: 'Import Statement',
      [SnippetType.VARIABLE_DECLARATION]: 'Variable Declaration',
      [SnippetType.CONTROL_STRUCTURE]: 'Control Structure',
      [SnippetType.ERROR_HANDLING]: 'Error Handling',
      [SnippetType.API_USAGE]: 'API Usage',
      [SnippetType.CONFIGURATION]: 'Configuration'
    };

    const baseName = typeNames[type] || 'Code Snippet';
    const patternPreview = pattern.substring(0, 30).replace(/\s+/g, ' ').trim();
    
    return `${baseName}: ${patternPreview}${pattern.length > 30 ? '...' : ''}`;
  }

  /**
   * Generate snippet description
   */
  private generateSnippetDescription(pattern: string, type: SnippetType): string {
    const descriptions = {
      [SnippetType.FUNCTION_CALL]: 'Frequently used function call pattern',
      [SnippetType.CODE_PATTERN]: 'Common code pattern found in your codebase',
      [SnippetType.IMPORT_STATEMENT]: 'Commonly used import statement',
      [SnippetType.VARIABLE_DECLARATION]: 'Frequently used variable declaration pattern',
      [SnippetType.CONTROL_STRUCTURE]: 'Common control flow structure',
      [SnippetType.ERROR_HANDLING]: 'Error handling pattern',
      [SnippetType.API_USAGE]: 'API usage pattern',
      [SnippetType.CONFIGURATION]: 'Configuration access pattern'
    };

    return descriptions[type] || 'Code snippet extracted from your codebase';
  }

  /**
   * Generate tags for snippet
   */
  private generateTags(pattern: string, type: SnippetType): string[] {
    const tags: string[] = [type];
    
    // Add language-specific tags
    if (pattern.includes('async') || pattern.includes('await')) {
      tags.push('async');
    }
    if (pattern.includes('Promise')) {
      tags.push('promise');
    }
    if (pattern.includes('try') || pattern.includes('catch')) {
      tags.push('error-handling');
    }
    if (pattern.includes('fetch') || pattern.includes('axios')) {
      tags.push('http');
    }
    
    return tags;
  }

  /**
   * Generate examples for snippet
   */
  private async generateExamples(pattern: string, type: SnippetType): Promise<SnippetExample[]> {
    const examples: SnippetExample[] = [];

    // Generate basic example
    examples.push({
      title: 'Basic Usage',
      description: 'Basic usage of this pattern',
      code: pattern,
      parameters: {}
    });

    return examples;
  }

  /**
   * Analyze contexts for snippets
   */
  private async analyzeContexts(files: any[]): Promise<void> {
    this.logger.info('Analyzing snippet contexts...');

    for (const snippet of this.snippets.values()) {
      snippet.contexts = await this.generateContextsForSnippet(snippet, files);
    }
  }

  /**
   * Generate contexts for a snippet
   */
  private async generateContextsForSnippet(
    snippet: CodeSnippet,
    files: any[]
  ): Promise<SnippetContext[]> {
    const contexts: SnippetContext[] = [];

    // File pattern context
    const fileExtensions = snippet.metadata.sourceFiles
      .map(f => path.extname(f))
      .filter((ext, index, arr) => arr.indexOf(ext) === index);
    
    if (fileExtensions.length > 0) {
      contexts.push({
        filePattern: `*{${fileExtensions.join(',')}}`,
        weight: 0.3
      });
    }

    // Language context
    contexts.push({
      languagePattern: snippet.language,
      weight: 0.4
    });

    // Code pattern context
    contexts.push({
      codePattern: snippet.template,
      weight: 0.3
    });

    return contexts;
  }

  /**
   * Filter and rank snippets
   */
  private filterAndRankSnippets(): void {
    const snippetsArray = Array.from(this.snippets.values());
    
    // Filter by score and frequency
    const filtered = snippetsArray.filter(snippet => 
      snippet.score >= this.config.minScore &&
      snippet.frequency >= this.config.minFrequency
    );

    // Sort by score (descending)
    filtered.sort((a, b) => b.score - a.score);

    // Limit to max snippets
    const limited = filtered.slice(0, this.config.maxSnippets);

    // Update snippets map
    this.snippets.clear();
    for (const snippet of limited) {
      this.snippets.set(snippet.id, snippet);
    }
  }



  /**
   * Get snippets by context
   */
  getSnippetsByContext(context: {
    filePath?: string;
    language?: string;
    cursorPosition?: string;
    precedingCode?: string;
  }): CodeSnippet[] {
    const results: Array<{ snippet: CodeSnippet; score: number }> = [];

    for (const snippet of this.snippets.values()) {
      let contextScore = 0;

      for (const snippetContext of snippet.contexts) {
        // File pattern matching
        if (context.filePath && snippetContext.filePattern) {
          const pattern = snippetContext.filePattern.replace(/\*/g, '.*').replace(/\{([^}]+)\}/g, '($1)');
          if (new RegExp(pattern).test(context.filePath)) {
            contextScore += snippetContext.weight;
          }
        }

        // Language matching
        if (context.language && snippetContext.languagePattern === context.language) {
          contextScore += snippetContext.weight;
        }

        // Preceding code matching
        if (context.precedingCode && snippetContext.precedingCode) {
          if (context.precedingCode.includes(snippetContext.precedingCode)) {
            contextScore += snippetContext.weight;
          }
        }
      }

      if (contextScore > 0) {
        results.push({ snippet, score: contextScore * snippet.score });
      }
    }

    // Sort by context score
    results.sort((a, b) => b.score - a.score);
    
    return results.map(r => r.snippet);
  }

  /**
   * Search snippets
   */
  searchSnippets(query: string, filters?: {
    type?: SnippetType;
    language?: string;
    tags?: string[];
  }): CodeSnippet[] {
    const results: CodeSnippet[] = [];
    const queryLower = query.toLowerCase();

    for (const snippet of this.snippets.values()) {
      // Apply filters
      if (filters?.type && snippet.type !== filters.type) continue;
      if (filters?.language && snippet.language !== filters.language) continue;
      if (filters?.tags && !filters.tags.some(tag => snippet.tags.includes(tag))) continue;

      // Search in name, description, and template
      if (snippet.name.toLowerCase().includes(queryLower) ||
          snippet.description.toLowerCase().includes(queryLower) ||
          snippet.template.toLowerCase().includes(queryLower)) {
        results.push(snippet);
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);
    
    return results;
  }

  /**
   * Get all snippets
   */
  getAllSnippets(): CodeSnippet[] {
    return Array.from(this.snippets.values()).sort((a, b) => b.score - a.score);
  }

  /**
   * Get snippets with filters
   */
  getSnippets(filters?: {
    language?: string;
    context?: string;
    limit?: number;
  }): CodeSnippet[] {
    let results = Array.from(this.snippets.values());
    
    if (filters?.language) {
      results = results.filter(snippet => snippet.language === filters.language);
    }
    
    if (filters?.context) {
      const contextLower = filters.context.toLowerCase();
      results = results.filter(snippet => 
        snippet.template.toLowerCase().includes(contextLower) ||
        snippet.description.toLowerCase().includes(contextLower)
      );
    }
    
    results.sort((a, b) => b.score - a.score);
    
    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }
    
    return results;
  }

  /**
   * Get snippet by ID
   */
  getSnippet(id: string): CodeSnippet | null {
    return this.snippets.get(id) || null;
  }

  /**
   * Update snippet usage
   */
  updateSnippetUsage(id: string, success: boolean, rating?: number): void {
    const snippet = this.snippets.get(id);
    if (!snippet) return;

    snippet.metadata.usageCount++;
    snippet.metadata.lastUsed = new Date();

    if (success) {
      snippet.metadata.successRate = 
        (snippet.metadata.successRate * (snippet.metadata.usageCount - 1) + 1) / snippet.metadata.usageCount;
    } else {
      snippet.metadata.successRate = 
        (snippet.metadata.successRate * (snippet.metadata.usageCount - 1)) / snippet.metadata.usageCount;
    }

    if (rating !== undefined) {
      snippet.metadata.averageRating = 
        (snippet.metadata.averageRating * (snippet.metadata.usageCount - 1) + rating) / snippet.metadata.usageCount;
    }

    this.emit('snippet.used', { snippet, success, rating });
  }

  /**
   * Clear all snippets
   */
  clearSnippets(): void {
    this.snippets.clear();
    this.usagePatterns.clear();
    this.documentFrequency.clear();
    this.totalDocuments = 0;
  }
}

export default SnippetMiner;