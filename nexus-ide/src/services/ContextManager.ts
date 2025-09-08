/**
 * Context Manager
 * 
 * Advanced context management system for NEXUS IDE.
 * Handles project context, file relationships, and intelligent code understanding.
 * 
 * Features:
 * - Project-wide context analysis
 * - File dependency tracking
 * - Semantic code understanding
 * - Context-aware suggestions
 * - Memory-efficient caching
 * - Real-time context updates
 * - Cross-file reference tracking
 * - Import/export analysis
 * - Symbol resolution
 * - Workspace intelligence
 */

import { EventEmitter } from '../utils/EventEmitter';

export interface FileContext {
  filePath: string;
  absolutePath: string;
  relativePath: string;
  language: string;
  content: string;
  size: number;
  lastModified: Date;
  encoding: string;
  lineCount: number;
  characterCount: number;
  
  // Code structure
  imports: ImportInfo[];
  exports: ExportInfo[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  variables: VariableInfo[];
  types: TypeInfo[];
  constants: ConstantInfo[];
  
  // Dependencies
  dependencies: string[];
  dependents: string[];
  externalDependencies: string[];
  
  // Metadata
  complexity: number;
  maintainabilityIndex: number;
  testCoverage?: number;
  documentation: DocumentationInfo;
  
  // Git info
  gitStatus?: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'clean';
  lastCommit?: string;
  author?: string;
  
  // Analysis
  issues: CodeIssue[];
  suggestions: CodeSuggestion[];
  
  // Cache info
  lastAnalyzed: Date;
  analysisVersion: string;
}

export interface ProjectContext {
  name: string;
  rootPath: string;
  type: 'web' | 'mobile' | 'desktop' | 'library' | 'api' | 'cli' | 'other';
  framework?: string;
  language: string;
  languages: { [key: string]: number }; // Language usage percentage
  
  // Project structure
  files: Map<string, FileContext>;
  directories: string[];
  
  // Dependencies
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'composer' | 'gradle' | 'maven' | 'cargo' | 'go' | 'other';
  dependencies: PackageDependency[];
  devDependencies: PackageDependency[];
  
  // Configuration
  configFiles: ConfigFile[];
  buildTools: string[];
  testFrameworks: string[];
  
  // Git info
  gitRepository?: {
    url: string;
    branch: string;
    lastCommit: string;
    status: 'clean' | 'dirty';
    remotes: string[];
  };
  
  // Statistics
  statistics: {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    complexity: number;
    maintainabilityIndex: number;
    testCoverage: number;
    documentationCoverage: number;
  };
  
  // Analysis
  architecture: ArchitectureInfo;
  patterns: DesignPattern[];
  issues: ProjectIssue[];
  recommendations: Recommendation[];
  
  // Cache info
  lastAnalyzed: Date;
  analysisVersion: string;
}

export interface ImportInfo {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  line: number;
  column: number;
  resolvedPath?: string;
  isExternal: boolean;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'variable' | 'constant' | 'type';
  isDefault: boolean;
  line: number;
  column: number;
  documentation?: string;
}

export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isAsync: boolean;
  isGenerator: boolean;
  visibility: 'public' | 'private' | 'protected';
  line: number;
  column: number;
  endLine: number;
  complexity: number;
  documentation?: string;
  calls: string[]; // Functions this function calls
  calledBy: string[]; // Functions that call this function
}

export interface ClassInfo {
  name: string;
  extends?: string;
  implements: string[];
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  visibility: 'public' | 'private' | 'protected';
  isAbstract: boolean;
  line: number;
  column: number;
  endLine: number;
  documentation?: string;
}

export interface InterfaceInfo {
  name: string;
  extends: string[];
  methods: MethodSignature[];
  properties: PropertySignature[];
  line: number;
  column: number;
  documentation?: string;
}

export interface VariableInfo {
  name: string;
  type?: string;
  isConst: boolean;
  isLet: boolean;
  scope: 'global' | 'function' | 'block' | 'class';
  line: number;
  column: number;
  documentation?: string;
}

export interface TypeInfo {
  name: string;
  definition: string;
  line: number;
  column: number;
  documentation?: string;
}

export interface ConstantInfo {
  name: string;
  value: string;
  type?: string;
  line: number;
  column: number;
  documentation?: string;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
  defaultValue?: string;
  isRest: boolean;
}

export interface PropertyInfo {
  name: string;
  type?: string;
  visibility: 'public' | 'private' | 'protected';
  isStatic: boolean;
  isReadonly: boolean;
  line: number;
  column: number;
  documentation?: string;
}

export interface MethodSignature {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isOptional: boolean;
}

export interface PropertySignature {
  name: string;
  type?: string;
  isOptional: boolean;
  isReadonly: boolean;
}

export interface DocumentationInfo {
  hasDocumentation: boolean;
  coverage: number;
  comments: CommentInfo[];
  todos: TodoInfo[];
  fixmes: FixmeInfo[];
}

export interface CommentInfo {
  type: 'line' | 'block' | 'jsdoc';
  content: string;
  line: number;
  column: number;
}

export interface TodoInfo {
  content: string;
  line: number;
  column: number;
  priority: 'low' | 'medium' | 'high';
}

export interface FixmeInfo {
  content: string;
  line: number;
  column: number;
  severity: 'low' | 'medium' | 'high';
}

export interface CodeIssue {
  id: string;
  type: 'error' | 'warning' | 'info' | 'hint';
  category: 'syntax' | 'semantic' | 'style' | 'performance' | 'security' | 'maintainability';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rule?: string;
  fixable: boolean;
  suggestedFix?: string;
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'optimization' | 'fix';
  title: string;
  description: string;
  code: string;
  line: number;
  column: number;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

export interface PackageDependency {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  source: string;
  license?: string;
  vulnerabilities?: SecurityVulnerability[];
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  cve?: string;
}

export interface ConfigFile {
  name: string;
  path: string;
  type: string;
  content: any;
  isValid: boolean;
  errors: string[];
}

export interface ArchitectureInfo {
  pattern: 'mvc' | 'mvp' | 'mvvm' | 'layered' | 'microservices' | 'monolithic' | 'component' | 'other';
  layers: string[];
  modules: ModuleInfo[];
  dependencies: DependencyGraph;
  complexity: number;
  coupling: number;
  cohesion: number;
}

export interface ModuleInfo {
  name: string;
  path: string;
  type: 'component' | 'service' | 'utility' | 'model' | 'controller' | 'view';
  dependencies: string[];
  exports: string[];
  size: number;
  complexity: number;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  cycles: string[][];
  depth: number;
}

export interface DependencyNode {
  id: string;
  name: string;
  type: string;
  level: number;
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'import' | 'require' | 'reference';
  weight: number;
}

export interface DesignPattern {
  name: string;
  type: 'creational' | 'structural' | 'behavioral';
  confidence: number;
  files: string[];
  description: string;
}

export interface ProjectIssue {
  id: string;
  type: 'architecture' | 'dependency' | 'security' | 'performance' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  files: string[];
  recommendation: string;
}

export interface Recommendation {
  id: string;
  category: 'architecture' | 'performance' | 'security' | 'maintainability' | 'testing' | 'documentation';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  benefits: string[];
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

export interface ContextQuery {
  type: 'file' | 'symbol' | 'reference' | 'dependency' | 'usage';
  query: string;
  filters?: {
    language?: string;
    fileType?: string;
    directory?: string;
    modified?: Date;
  };
  limit?: number;
  includeContent?: boolean;
}

export interface ContextResult {
  type: ContextQuery['type'];
  results: ContextMatch[];
  totalCount: number;
  processingTime: number;
}

export interface ContextMatch {
  file: string;
  line: number;
  column: number;
  content: string;
  context: string;
  relevance: number;
  type: string;
}

interface ContextManagerEvents {
  'file-analyzed': (file: FileContext) => void;
  'project-analyzed': (project: ProjectContext) => void;
  'context-updated': (type: string, data: any) => void;
  'error': (error: Error, context?: string) => void;
  'cache-cleared': () => void;
}

class ContextManager extends EventEmitter {
  private projectContext: ProjectContext | null = null;
  private fileContexts: Map<string, FileContext> = new Map();
  private analysisQueue: string[] = [];
  private isAnalyzing = false;
  private watchedFiles: Set<string> = new Set();
  private analysisCache: Map<string, any> = new Map();
  private dependencyGraph: DependencyGraph | null = null;
  
  // Configuration
  private config = {
    maxCacheSize: 1000,
    analysisTimeout: 30000,
    enableRealTimeAnalysis: true,
    enableDependencyTracking: true,
    enableSemanticAnalysis: true,
    cacheExpirationTime: 3600000, // 1 hour
  };

  constructor() {
    super();
    this.initializeAnalysisProcessor();
  }

  /**
   * Initialize project context
   */
  async initializeProject(rootPath: string): Promise<ProjectContext> {
    try {
      console.log(`Initializing project context for: ${rootPath}`);
      
      const projectContext: ProjectContext = {
        name: path.basename(rootPath),
        rootPath,
        type: 'other',
        language: 'javascript',
        languages: {},
        files: new Map(),
        directories: [],
        packageManager: 'npm',
        dependencies: [],
        devDependencies: [],
        configFiles: [],
        buildTools: [],
        testFrameworks: [],
        statistics: {
          totalFiles: 0,
          totalLines: 0,
          totalSize: 0,
          complexity: 0,
          maintainabilityIndex: 0,
          testCoverage: 0,
          documentationCoverage: 0
        },
        architecture: {
          pattern: 'other',
          layers: [],
          modules: [],
          dependencies: {
            nodes: [],
            edges: [],
            cycles: [],
            depth: 0
          },
          complexity: 0,
          coupling: 0,
          cohesion: 0
        },
        patterns: [],
        issues: [],
        recommendations: [],
        lastAnalyzed: new Date(),
        analysisVersion: '1.0.0'
      };

      // Detect project type and configuration
      await this.detectProjectType(projectContext);
      await this.loadProjectConfiguration(projectContext);
      await this.scanProjectStructure(projectContext);
      
      this.projectContext = projectContext;
      this.emit('project-analyzed', projectContext);
      
      console.log(`Project context initialized: ${projectContext.name}`);
      return projectContext;
    } catch (error) {
      console.error('Failed to initialize project context:', error);
      this.emit('error', error as Error, 'project-initialization');
      throw error;
    }
  }

  /**
   * Analyze file and create context
   */
  async analyzeFile(filePath: string, content?: string): Promise<FileContext> {
    try {
      const absolutePath = path.resolve(filePath);
      const relativePath = this.projectContext ? 
        path.relative(this.projectContext.rootPath, absolutePath) : filePath;
      
      // Check cache first
      const cached = this.fileContexts.get(absolutePath);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      console.log(`Analyzing file: ${relativePath}`);
      
      // Read content if not provided
      if (!content) {
        // In a real implementation, this would read from file system
        content = ''; // Mock content
      }

      const fileContext: FileContext = {
        filePath: relativePath,
        absolutePath,
        relativePath,
        language: this.detectLanguage(filePath),
        content,
        size: content.length,
        lastModified: new Date(),
        encoding: 'utf-8',
        lineCount: content.split('\n').length,
        characterCount: content.length,
        
        imports: [],
        exports: [],
        functions: [],
        classes: [],
        interfaces: [],
        variables: [],
        types: [],
        constants: [],
        
        dependencies: [],
        dependents: [],
        externalDependencies: [],
        
        complexity: 0,
        maintainabilityIndex: 0,
        documentation: {
          hasDocumentation: false,
          coverage: 0,
          comments: [],
          todos: [],
          fixmes: []
        },
        
        issues: [],
        suggestions: [],
        
        lastAnalyzed: new Date(),
        analysisVersion: '1.0.0'
      };

      // Perform detailed analysis
      await this.analyzeCodeStructure(fileContext);
      await this.analyzeDependencies(fileContext);
      await this.analyzeComplexity(fileContext);
      await this.analyzeDocumentation(fileContext);
      await this.detectIssues(fileContext);
      
      // Cache the result
      this.fileContexts.set(absolutePath, fileContext);
      
      // Update project context if available
      if (this.projectContext) {
        this.projectContext.files.set(absolutePath, fileContext);
        this.updateProjectStatistics();
      }
      
      this.emit('file-analyzed', fileContext);
      
      console.log(`File analysis completed: ${relativePath}`);
      return fileContext;
    } catch (error) {
      console.error(`Failed to analyze file ${filePath}:`, error);
      this.emit('error', error as Error, 'file-analysis');
      throw error;
    }
  }

  /**
   * Get file context
   */
  getFileContext(filePath: string): FileContext | null {
    const absolutePath = path.resolve(filePath);
    return this.fileContexts.get(absolutePath) || null;
  }

  /**
   * Get project context
   */
  getProjectContext(): ProjectContext | null {
    return this.projectContext;
  }

  /**
   * Search context
   */
  async searchContext(query: ContextQuery): Promise<ContextResult> {
    const startTime = Date.now();
    const results: ContextMatch[] = [];
    
    try {
      switch (query.type) {
        case 'file':
          results.push(...await this.searchFiles(query));
          break;
        case 'symbol':
          results.push(...await this.searchSymbols(query));
          break;
        case 'reference':
          results.push(...await this.searchReferences(query));
          break;
        case 'dependency':
          results.push(...await this.searchDependencies(query));
          break;
        case 'usage':
          results.push(...await this.searchUsage(query));
          break;
      }
      
      // Apply filters
      const filteredResults = this.applyFilters(results, query.filters);
      
      // Limit results
      const limitedResults = query.limit ? 
        filteredResults.slice(0, query.limit) : filteredResults;
      
      return {
        type: query.type,
        results: limitedResults,
        totalCount: filteredResults.length,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Context search failed:', error);
      this.emit('error', error as Error, 'context-search');
      throw error;
    }
  }

  /**
   * Get related files
   */
  getRelatedFiles(filePath: string, maxResults = 10): string[] {
    const fileContext = this.getFileContext(filePath);
    if (!fileContext) {
      return [];
    }

    const related = new Set<string>();
    
    // Add dependencies
    fileContext.dependencies.forEach(dep => related.add(dep));
    
    // Add dependents
    fileContext.dependents.forEach(dep => related.add(dep));
    
    // Add files with similar imports
    this.fileContexts.forEach((context, path) => {
      if (path !== fileContext.absolutePath) {
        const commonImports = context.imports.filter(imp => 
          fileContext.imports.some(fImp => fImp.source === imp.source)
        );
        
        if (commonImports.length > 0) {
          related.add(path);
        }
      }
    });
    
    return Array.from(related).slice(0, maxResults);
  }

  /**
   * Get symbol definition
   */
  getSymbolDefinition(symbol: string, filePath?: string): ContextMatch[] {
    const results: ContextMatch[] = [];
    
    this.fileContexts.forEach((context, path) => {
      // Skip if file filter is specified and doesn't match
      if (filePath && path !== path.resolve(filePath)) {
        return;
      }
      
      // Search in functions
      context.functions.forEach(func => {
        if (func.name === symbol) {
          results.push({
            file: context.relativePath,
            line: func.line,
            column: func.column,
            content: `function ${func.name}`,
            context: 'function definition',
            relevance: 1.0,
            type: 'function'
          });
        }
      });
      
      // Search in classes
      context.classes.forEach(cls => {
        if (cls.name === symbol) {
          results.push({
            file: context.relativePath,
            line: cls.line,
            column: cls.column,
            content: `class ${cls.name}`,
            context: 'class definition',
            relevance: 1.0,
            type: 'class'
          });
        }
      });
      
      // Search in variables
      context.variables.forEach(variable => {
        if (variable.name === symbol) {
          results.push({
            file: context.relativePath,
            line: variable.line,
            column: variable.column,
            content: `${variable.isConst ? 'const' : variable.isLet ? 'let' : 'var'} ${variable.name}`,
            context: 'variable definition',
            relevance: 0.8,
            type: 'variable'
          });
        }
      });
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get symbol references
   */
  getSymbolReferences(symbol: string, filePath?: string): ContextMatch[] {
    const results: ContextMatch[] = [];
    
    this.fileContexts.forEach((context, path) => {
      // Skip if file filter is specified and doesn't match
      if (filePath && path !== path.resolve(filePath)) {
        return;
      }
      
      // Simple text search for references (in a real implementation, this would use AST)
      const lines = context.content.split('\n');
      lines.forEach((line, index) => {
        const regex = new RegExp(`\\b${symbol}\\b`, 'g');
        let match;
        
        while ((match = regex.exec(line)) !== null) {
          results.push({
            file: context.relativePath,
            line: index + 1,
            column: match.index + 1,
            content: line.trim(),
            context: 'symbol reference',
            relevance: 0.7,
            type: 'reference'
          });
        }
      });
    });
    
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Update file context
   */
  async updateFileContext(filePath: string, content: string): Promise<void> {
    try {
      await this.analyzeFile(filePath, content);
      
      // Update dependency graph if enabled
      if (this.config.enableDependencyTracking) {
        await this.updateDependencyGraph();
      }
      
      this.emit('context-updated', 'file', filePath);
    } catch (error) {
      console.error(`Failed to update file context for ${filePath}:`, error);
      this.emit('error', error as Error, 'context-update');
    }
  }

  /**
   * Remove file context
   */
  removeFileContext(filePath: string): void {
    const absolutePath = path.resolve(filePath);
    
    if (this.fileContexts.has(absolutePath)) {
      this.fileContexts.delete(absolutePath);
      
      if (this.projectContext) {
        this.projectContext.files.delete(absolutePath);
        this.updateProjectStatistics();
      }
      
      this.emit('context-updated', 'file-removed', filePath);
    }
  }

  /**
   * Clear all contexts
   */
  clearContexts(): void {
    this.fileContexts.clear();
    this.projectContext = null;
    this.analysisCache.clear();
    this.dependencyGraph = null;
    
    this.emit('cache-cleared');
  }

  /**
   * Get context statistics
   */
  getStatistics() {
    return {
      fileContexts: this.fileContexts.size,
      analysisQueue: this.analysisQueue.length,
      cacheSize: this.analysisCache.size,
      isAnalyzing: this.isAnalyzing,
      projectContext: !!this.projectContext
    };
  }

  // Private methods

  private initializeAnalysisProcessor(): void {
    const processQueue = async () => {
      if (this.isAnalyzing || this.analysisQueue.length === 0) {
        return;
      }

      this.isAnalyzing = true;
      const filePath = this.analysisQueue.shift()!;

      try {
        await this.analyzeFile(filePath);
      } catch (error) {
        console.error(`Failed to process analysis queue for ${filePath}:`, error);
      } finally {
        this.isAnalyzing = false;
      }
    };

    // Process queue every 500ms
    setInterval(processQueue, 500);
  }

  private async detectProjectType(project: ProjectContext): Promise<void> {
    // Mock implementation - in real scenario, this would check package.json, etc.
    project.type = 'web';
    project.framework = 'react';
    project.language = 'typescript';
  }

  private async loadProjectConfiguration(project: ProjectContext): Promise<void> {
    // Mock implementation - would load actual config files
    project.packageManager = 'npm';
    project.buildTools = ['vite', 'typescript'];
    project.testFrameworks = ['jest', 'vitest'];
  }

  private async scanProjectStructure(project: ProjectContext): Promise<void> {
    // Mock implementation - would scan actual directory structure
    project.directories = ['src', 'public', 'tests'];
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.sql': 'sql'
    };
    
    return languageMap[ext] || 'text';
  }

  private async analyzeCodeStructure(fileContext: FileContext): Promise<void> {
    // Mock implementation - in real scenario, this would use AST parsing
    // For demonstration, we'll add some mock data
    
    if (fileContext.language === 'typescript' || fileContext.language === 'javascript') {
      // Mock function detection
      const functionRegex = /function\s+(\w+)\s*\(/g;
      let match;
      
      while ((match = functionRegex.exec(fileContext.content)) !== null) {
        const line = fileContext.content.substring(0, match.index).split('\n').length;
        
        fileContext.functions.push({
          name: match[1],
          parameters: [],
          isAsync: false,
          isGenerator: false,
          visibility: 'public',
          line,
          column: match.index - fileContext.content.lastIndexOf('\n', match.index),
          endLine: line + 5, // Mock
          complexity: 1,
          calls: [],
          calledBy: []
        });
      }
      
      // Mock import detection
      const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
      
      while ((match = importRegex.exec(fileContext.content)) !== null) {
        const line = fileContext.content.substring(0, match.index).split('\n').length;
        
        fileContext.imports.push({
          source: match[1],
          specifiers: [],
          isDefault: false,
          isNamespace: false,
          line,
          column: match.index - fileContext.content.lastIndexOf('\n', match.index),
          isExternal: !match[1].startsWith('.') && !match[1].startsWith('/')
        });
      }
    }
  }

  private async analyzeDependencies(fileContext: FileContext): Promise<void> {
    // Extract dependencies from imports
    fileContext.dependencies = fileContext.imports
      .filter(imp => !imp.isExternal)
      .map(imp => imp.resolvedPath || imp.source);
    
    fileContext.externalDependencies = fileContext.imports
      .filter(imp => imp.isExternal)
      .map(imp => imp.source);
  }

  private async analyzeComplexity(fileContext: FileContext): Promise<void> {
    // Simple complexity calculation based on functions and control structures
    let complexity = 1; // Base complexity
    
    // Add complexity for each function
    complexity += fileContext.functions.length;
    
    // Add complexity for control structures (mock)
    const controlStructures = ['if', 'for', 'while', 'switch', 'try'];
    controlStructures.forEach(structure => {
      const regex = new RegExp(`\\b${structure}\\b`, 'g');
      const matches = fileContext.content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    fileContext.complexity = complexity;
    fileContext.maintainabilityIndex = Math.max(0, 100 - complexity * 2);
  }

  private async analyzeDocumentation(fileContext: FileContext): Promise<void> {
    // Analyze comments and documentation
    const commentRegex = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;
    const comments = fileContext.content.match(commentRegex) || [];
    
    fileContext.documentation.comments = comments.map((comment, index) => ({
      type: comment.startsWith('//') ? 'line' : 'block',
      content: comment,
      line: index + 1, // Mock line number
      column: 1
    }));
    
    fileContext.documentation.hasDocumentation = comments.length > 0;
    fileContext.documentation.coverage = Math.min(100, (comments.length / fileContext.functions.length) * 100) || 0;
    
    // Find TODOs and FIXMEs
    const todoRegex = /\/\/\s*TODO:?\s*(.+)$/gim;
    const fixmeRegex = /\/\/\s*FIXME:?\s*(.+)$/gim;
    
    let match;
    while ((match = todoRegex.exec(fileContext.content)) !== null) {
      const line = fileContext.content.substring(0, match.index).split('\n').length;
      fileContext.documentation.todos.push({
        content: match[1],
        line,
        column: match.index - fileContext.content.lastIndexOf('\n', match.index),
        priority: 'medium'
      });
    }
    
    while ((match = fixmeRegex.exec(fileContext.content)) !== null) {
      const line = fileContext.content.substring(0, match.index).split('\n').length;
      fileContext.documentation.fixmes.push({
        content: match[1],
        line,
        column: match.index - fileContext.content.lastIndexOf('\n', match.index),
        severity: 'medium'
      });
    }
  }

  private async detectIssues(fileContext: FileContext): Promise<void> {
    // Mock issue detection
    const issues: CodeIssue[] = [];
    
    // Check for long functions
    fileContext.functions.forEach(func => {
      if (func.endLine - func.line > 50) {
        issues.push({
          id: `long-function-${func.name}`,
          type: 'warning',
          category: 'maintainability',
          message: `Function '${func.name}' is too long (${func.endLine - func.line} lines)`,
          line: func.line,
          column: func.column,
          severity: 'medium',
          fixable: false,
          suggestedFix: 'Consider breaking this function into smaller functions'
        });
      }
    });
    
    // Check for missing documentation
    if (fileContext.documentation.coverage < 50) {
      issues.push({
        id: 'low-documentation',
        type: 'info',
        category: 'maintainability',
        message: `Low documentation coverage (${fileContext.documentation.coverage.toFixed(1)}%)`,
        line: 1,
        column: 1,
        severity: 'low',
        fixable: false,
        suggestedFix: 'Add documentation comments to functions and classes'
      });
    }
    
    fileContext.issues = issues;
  }

  private updateProjectStatistics(): void {
    if (!this.projectContext) return;
    
    const stats = this.projectContext.statistics;
    stats.totalFiles = this.fileContexts.size;
    stats.totalLines = Array.from(this.fileContexts.values())
      .reduce((sum, context) => sum + context.lineCount, 0);
    stats.totalSize = Array.from(this.fileContexts.values())
      .reduce((sum, context) => sum + context.size, 0);
    stats.complexity = Array.from(this.fileContexts.values())
      .reduce((sum, context) => sum + context.complexity, 0) / this.fileContexts.size;
    stats.maintainabilityIndex = Array.from(this.fileContexts.values())
      .reduce((sum, context) => sum + context.maintainabilityIndex, 0) / this.fileContexts.size;
    
    // Update language statistics
    const languages: { [key: string]: number } = {};
    this.fileContexts.forEach(context => {
      languages[context.language] = (languages[context.language] || 0) + 1;
    });
    
    const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
    Object.keys(languages).forEach(lang => {
      this.projectContext!.languages[lang] = (languages[lang] / total) * 100;
    });
  }

  private async updateDependencyGraph(): Promise<void> {
    if (!this.projectContext) return;
    
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];
    
    // Build dependency graph from file contexts
    this.fileContexts.forEach((context, filePath) => {
      nodes.push({
        id: filePath,
        name: context.relativePath,
        type: 'file',
        level: 0 // Will be calculated
      });
      
      context.dependencies.forEach(dep => {
        edges.push({
          from: filePath,
          to: dep,
          type: 'import',
          weight: 1
        });
      });
    });
    
    this.dependencyGraph = {
      nodes,
      edges,
      cycles: [], // Would detect cycles in real implementation
      depth: 0 // Would calculate max depth
    };
    
    this.projectContext.architecture.dependencies = this.dependencyGraph;
  }

  private isCacheValid(context: FileContext): boolean {
    const now = Date.now();
    const cacheAge = now - context.lastAnalyzed.getTime();
    return cacheAge < this.config.cacheExpirationTime;
  }

  private async searchFiles(query: ContextQuery): Promise<ContextMatch[]> {
    const results: ContextMatch[] = [];
    
    this.fileContexts.forEach((context, filePath) => {
      if (context.relativePath.toLowerCase().includes(query.query.toLowerCase())) {
        results.push({
          file: context.relativePath,
          line: 1,
          column: 1,
          content: context.relativePath,
          context: 'file name',
          relevance: 1.0,
          type: 'file'
        });
      }
    });
    
    return results;
  }

  private async searchSymbols(query: ContextQuery): Promise<ContextMatch[]> {
    const results: ContextMatch[] = [];
    
    this.fileContexts.forEach((context, filePath) => {
      // Search functions
      context.functions.forEach(func => {
        if (func.name.toLowerCase().includes(query.query.toLowerCase())) {
          results.push({
            file: context.relativePath,
            line: func.line,
            column: func.column,
            content: `function ${func.name}`,
            context: 'function definition',
            relevance: 0.9,
            type: 'function'
          });
        }
      });
      
      // Search classes
      context.classes.forEach(cls => {
        if (cls.name.toLowerCase().includes(query.query.toLowerCase())) {
          results.push({
            file: context.relativePath,
            line: cls.line,
            column: cls.column,
            content: `class ${cls.name}`,
            context: 'class definition',
            relevance: 0.9,
            type: 'class'
          });
        }
      });
    });
    
    return results;
  }

  private async searchReferences(query: ContextQuery): Promise<ContextMatch[]> {
    return this.getSymbolReferences(query.query);
  }

  private async searchDependencies(query: ContextQuery): Promise<ContextMatch[]> {
    const results: ContextMatch[] = [];
    
    this.fileContexts.forEach((context, filePath) => {
      context.imports.forEach(imp => {
        if (imp.source.toLowerCase().includes(query.query.toLowerCase())) {
          results.push({
            file: context.relativePath,
            line: imp.line,
            column: imp.column,
            content: `import ... from '${imp.source}'`,
            context: 'import statement',
            relevance: 0.8,
            type: 'import'
          });
        }
      });
    });
    
    return results;
  }

  private async searchUsage(query: ContextQuery): Promise<ContextMatch[]> {
    const results: ContextMatch[] = [];
    
    this.fileContexts.forEach((context, filePath) => {
      const lines = context.content.split('\n');
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.query.toLowerCase())) {
          results.push({
            file: context.relativePath,
            line: index + 1,
            column: line.toLowerCase().indexOf(query.query.toLowerCase()) + 1,
            content: line.trim(),
            context: 'code usage',
            relevance: 0.6,
            type: 'usage'
          });
        }
      });
    });
    
    return results;
  }

  private applyFilters(results: ContextMatch[], filters?: ContextQuery['filters']): ContextMatch[] {
    if (!filters) return results;
    
    return results.filter(result => {
      if (filters.language) {
        const fileContext = this.getFileContext(result.file);
        if (fileContext && fileContext.language !== filters.language) {
          return false;
        }
      }
      
      if (filters.fileType) {
        const ext = path.extname(result.file);
        if (ext !== filters.fileType) {
          return false;
        }
      }
      
      if (filters.directory) {
        if (!result.file.startsWith(filters.directory)) {
          return false;
        }
      }
      
      return true;
    });
  }
}

// Create singleton instance
const contextManager = new ContextManager();

export default contextManager;
export { ContextManager };