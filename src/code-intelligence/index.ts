/**
 * Code Intelligence Module
 * 
 * This module provides comprehensive code analysis, pattern mining, and knowledge management
 * capabilities for the MCP IDE system. It includes:
 * 
 * - Static Analysis: AST parsing, dependency analysis, complexity metrics
 * - Snippet Mining: Frequency analysis, pattern extraction, context-aware suggestions
 * - Function Notebook: Reusable pattern library with versioning and approval workflows
 */
import * as path from 'path';
import { StaticAnalyzer } from './StaticAnalyzer';
import { SnippetMiner } from './SnippetMiner';
import { FunctionNotebook } from './FunctionNotebook';
import {
    AnalysisConfig,
    CodeElement,
    FileAnalysis
} from './StaticAnalyzer';
import {
    CodeSnippet,
    MiningConfig,
    SnippetType
} from './SnippetMiner';
import {
    FunctionPattern,
    NotebookConfig,
    PatternCategory,
    PatternStep,
    ApprovalStatus
} from './FunctionNotebook';

// Core components
export { StaticAnalyzer } from './StaticAnalyzer';
export { SnippetMiner } from './SnippetMiner';
export { FunctionNotebook } from './FunctionNotebook';

// Types and interfaces from StaticAnalyzer
export type {
  CodeElementType,
  CodeElement,
  FileAnalysis,
  CodeHotspot,
  DependencyNode,
  AnalysisConfig
} from './StaticAnalyzer';

// Types and interfaces from SnippetMiner
export {
  SnippetType
} from './SnippetMiner';

export type {
  CodeSnippet,
  SnippetParameter,
  SnippetContext,
  SnippetExample,
  UsagePattern,
  MiningConfig
} from './SnippetMiner';

// Types and interfaces from FunctionNotebook
export {
  PatternCategory,
  PatternComplexity,
  ApprovalStatus
} from './FunctionNotebook';

export type {
  PatternStep,
  FunctionPattern,
  NotebookConfig
} from './FunctionNotebook';

// Default configurations
export const DEFAULT_ANALYSIS_CONFIG: AnalysisConfig = {
  supportedExtensions: ['.ts', '.js', '.py', '.java', '.cpp', '.cs', '.go', '.rs', '.php'],
  excludedPaths: ['node_modules', 'dist', 'build', '.git'],
  maxFileSize: 1024 * 1024, // 1MB
  enableHotspotDetection: true,
  hotspotThreshold: 5,
  complexityThreshold: 10,
  includeTests: true,
  includeNodeModules: false,
  duplicateThreshold: 0.8,
  cacheResults: true,
  cacheTimeout: 3600000 // 1 hour
};

export const DEFAULT_MINING_CONFIG: MiningConfig = {
  maxFileSizeBytes: 1024 * 1024, // 1MB
  maxConcurrentFiles: 10,
  minTokens: 5,
  maxTokens: 100,
  minScore: 0.7,
  minFrequency: 2,
  maxSnippets: 1000,
  contextWindow: 5,
  includeComments: false,
  includeStrings: false,
  minTokenLength: 3,
  maxTokenLength: 50,
  supportedLanguages: ['typescript', 'javascript', 'python', 'java', 'go'],
  snippetTypes: [
    SnippetType.FUNCTION_CALL,
    SnippetType.IMPORT_STATEMENT,
    SnippetType.VARIABLE_DECLARATION,
    SnippetType.CONTROL_STRUCTURE,
    SnippetType.ERROR_HANDLING,
    SnippetType.API_USAGE,
    SnippetType.CONFIGURATION
  ],
  includePatterns: ['**/*.ts', '**/*.js', '**/*.py', '**/*.java', '**/*.go'],
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  qualityThreshold: 0.8,
  diversityWeight: 0.3,
  frequencyWeight: 0.4,
  contextWeight: 0.3
};

export const DEFAULT_NOTEBOOK_CONFIG: NotebookConfig = {
  storagePath: './data/patterns',
  maxPatterns: 1000,
  maxSteps: 20,
  autoSave: true,
  autoSaveInterval: 60000,
  enableVersioning: true,
  defaultApprovalStatus: ApprovalStatus.PENDING
};

/**
 * Code Intelligence Manager
 * 
 * Coordinates all code intelligence components and provides a unified interface
 */
export class CodeIntelligenceManager {
  private staticAnalyzer: StaticAnalyzer;
  private snippetMiner: SnippetMiner;
  private functionNotebook: FunctionNotebook;
  private initialized = false;

  constructor(
    analysisConfig: AnalysisConfig = DEFAULT_ANALYSIS_CONFIG,
    miningConfig: MiningConfig = DEFAULT_MINING_CONFIG,
    notebookConfig: NotebookConfig = DEFAULT_NOTEBOOK_CONFIG,
    storagePath?: string
  ) {
    this.staticAnalyzer = new StaticAnalyzer(analysisConfig);
    this.snippetMiner = new SnippetMiner(this.staticAnalyzer, miningConfig);
    this.functionNotebook = new FunctionNotebook(notebookConfig);
  }

  /**
   * Initialize all components
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.functionNotebook.initialize();

    this.initialized = true;
  }

  /**
   * Analyze workspace and mine patterns
   */
  async analyzeWorkspace(workspacePath: string): Promise<{
    analysis: FileAnalysis[];
    snippets: CodeSnippet[];
    recommendations: FunctionPattern[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Perform static analysis
    const analysisResult = await this.staticAnalyzer.analyzeWorkspace(workspacePath);
    const analysis = analysisResult.files;

    // Mine snippets from analysis
    const miningResult = await this.snippetMiner.mineWorkspace(workspacePath);
    const snippets = miningResult.snippets;

    // Get pattern recommendations based on analysis
    // TODO: Implement getRecommendedPatterns method
    // const recommendations = this.functionNotebook.getRecommendedPatterns();

    return {
      analysis,
      snippets,
      recommendations: [] // TODO: Add recommendations when getRecommendedPatterns is implemented
    };
  }

  /**
   * Get context-aware suggestions for current file
   */
  async getContextSuggestions(
    filePath: string,
    cursorPosition?: { line: number; column: number },
    limit: number = 10
  ): Promise<{
    snippets: CodeSnippet[];
    patterns: FunctionPattern[];
  }> {
    // Analyze current file
    const fileAnalysis = await this.staticAnalyzer.analyzeFile(filePath);
    
    // Get relevant snippets
    const snippets = this.snippetMiner.getSnippets({
      language: fileAnalysis.language,
      context: this.extractContext(fileAnalysis, cursorPosition),
      limit
    });

    // Get relevant patterns
    const patterns = this.functionNotebook.searchPatterns(undefined, {
      language: fileAnalysis.language,
      approvalStatus: ApprovalStatus.APPROVED
    }).slice(0, limit);

    return {
      snippets,
      patterns
    };
  }

  /**
   * Create pattern from frequently used snippet
   */
  async promoteSnippetToPattern(
    snippetId: string,
    createdBy: string,
    additionalContext?: {
      category?: PatternCategory;
      description?: string;
      steps?: Omit<PatternStep, 'id'>[];
    }
  ): Promise<FunctionPattern> {
    const snippet = this.snippetMiner.getSnippet(snippetId);
    if (!snippet) {
      throw new Error(`Snippet not found: ${snippetId}`);
    }

    const patternMetadata: Partial<FunctionPattern> = {
      category: additionalContext?.category,
      description: additionalContext?.description
    };
    
    if (additionalContext?.steps) {
      patternMetadata.steps = additionalContext.steps.map((step, index) => ({
        id: `step-${index + 1}`,
        ...step
      }));
    }
    
    const pattern = await this.functionNotebook.generatePatternFromSnippet(snippet, patternMetadata);
    
    // Update the createdBy after pattern creation
    pattern.metadata.createdBy = createdBy;
    pattern.metadata.updatedBy = createdBy;
    
    return pattern;
  }

  /**
   * Update snippet usage and potentially promote to pattern
   */
  async recordSnippetUsage(
    snippetId: string,
    success: boolean,
    context?: string
  ): Promise<void> {
    this.snippetMiner.recordUsage(snippetId, success, context);

    // Check if snippet should be promoted to pattern
    const snippet = this.snippetMiner.getSnippet(snippetId);
    if (snippet && this.shouldPromoteToPattern(snippet)) {
      // Auto-promote high-quality, frequently used snippets
      await this.promoteSnippetToPattern(
        snippetId,
        'system',
        {
          description: `Auto-promoted pattern from frequently used snippet: ${snippet.name}`
        }
      );
    }
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): {
    analysis: any;
    snippets: any;
    patterns: any;
  } {
    return {
      analysis: this.staticAnalyzer.getStatistics(),
      snippets: this.snippetMiner.getStatistics(),
      patterns: this.functionNotebook.getStatistics()
    };
  }

  /**
   * Export all data to JSON files
   */
  async exportData(storagePath: string): Promise<void> {
    await this.snippetMiner.exportSnippets(`${storagePath}/snippets.json`);
    await this.functionNotebook.exportPatterns(`${storagePath}/patterns.json`);
  }

  /**
   * Import data from JSON files
   */
  async importData(storagePath: string): Promise<void> {
    await this.snippetMiner.importSnippets(`${storagePath}/snippets.json`);
    await this.functionNotebook.importPatterns(`${storagePath}/patterns.json`);
  }

  // Getters for individual components
  get analyzer(): StaticAnalyzer {
    return this.staticAnalyzer;
  }

  get miner(): SnippetMiner {
    return this.snippetMiner;
  }

  get notebook(): FunctionNotebook {
    return this.functionNotebook;
  }

  // Private helper methods

  private inferProjectType(analysis: FileAnalysis[]): string {
    const extensions = analysis.map(a => path.extname(a.filePath));
    const fileNames = analysis.map(a => path.basename(a.filePath));
    const hasPackageJson = fileNames.some(name => name === 'package.json');
    const hasPyProject = fileNames.some(name => name === 'pyproject.toml');
    const hasPomXml = fileNames.some(name => name === 'pom.xml');
    
    if (hasPackageJson) {
      if (extensions.includes('.tsx') || extensions.includes('.jsx')) {
        return 'react';
      }
      if (extensions.includes('.vue')) {
        return 'vue';
      }
      return 'nodejs';
    }
    
    if (hasPyProject || extensions.includes('.py')) {
      return 'python';
    }
    
    if (hasPomXml || extensions.includes('.java')) {
      return 'java';
    }
    
    return 'unknown';
  }

  private getMostUsedLanguage(analysis: FileAnalysis[]): string {
    const languageCounts: Record<string, number> = {};
    
    for (const file of analysis) {
      languageCounts[file.language] = (languageCounts[file.language] || 0) + 1;
    }
    
    return Object.entries(languageCounts)
      .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)[0]?.[0] || 'unknown';
  }

  private extractContext(
    fileAnalysis: FileAnalysis,
    cursorPosition?: { line: number; column: number }
  ): string {
    if (!cursorPosition) {
      return fileAnalysis.language;
    }

    // Find the nearest code element to cursor position
    const nearestElement = fileAnalysis.elements
      .filter((el: CodeElement) => el.startLine <= cursorPosition.line && el.endLine >= cursorPosition.line)
      .sort((a: CodeElement, b: CodeElement) => (cursorPosition.line - a.startLine) - (cursorPosition.line - b.startLine))[0];

    if (nearestElement) {
      return `${fileAnalysis.language}:${nearestElement.type}:${nearestElement.name}`;
    }

    return fileAnalysis.language;
  }

  private shouldPromoteToPattern(snippet: CodeSnippet): boolean {
    return snippet.frequency >= 10 && 
           snippet.score >= 0.8 && 
           snippet.contexts.length >= 3;
  }
}

// Utility functions

/**
 * Create a code intelligence manager with default settings
 */
export function createCodeIntelligence(
  workspacePath?: string,
  customConfigs?: {
    analysis?: Partial<AnalysisConfig>;
    mining?: Partial<MiningConfig>;
    notebook?: Partial<NotebookConfig>;
  }
): CodeIntelligenceManager {
  const analysisConfig = { ...DEFAULT_ANALYSIS_CONFIG, ...customConfigs?.analysis };
  const miningConfig = { ...DEFAULT_MINING_CONFIG, ...customConfigs?.mining };
  const notebookConfig = { ...DEFAULT_NOTEBOOK_CONFIG, ...customConfigs?.notebook };

  return new CodeIntelligenceManager(
    analysisConfig,
    miningConfig,
    notebookConfig,
    workspacePath
  );
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.clj': 'clojure',
    '.hs': 'haskell',
    '.ml': 'ocaml',
    '.fs': 'fsharp',
    '.dart': 'dart',
    '.lua': 'lua',
    '.r': 'r',
    '.m': 'matlab',
    '.sh': 'bash',
    '.ps1': 'powershell',
    '.sql': 'sql',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.cfg': 'ini',
    '.conf': 'ini'
  };

  return languageMap[extension.toLowerCase()] || 'unknown';
}

/**
 * Check if file should be analyzed
 */
export function shouldAnalyzeFile(
  filePath: string,
  config: AnalysisConfig
): boolean {
  const extension = filePath.substring(filePath.lastIndexOf('.'));
  
  // Check if extension is supported
  if (!config.supportedExtensions.includes(extension)) {
    return false;
  }

  // Skip node_modules if configured
  if (!config.includeNodeModules && filePath.includes('node_modules')) {
    return false;
  }

  // Skip test files if configured
  if (!config.includeTests && (
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.includes('/test/') ||
    filePath.includes('/tests/') ||
    filePath.includes('/__tests__/')
  )) {
    return false;
  }

  return true;
}

export default CodeIntelligenceManager;