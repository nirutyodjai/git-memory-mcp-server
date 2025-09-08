import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/logger';

/**
 * Code element types
 */
export enum CodeElementType {
  FUNCTION = 'function',
  CLASS = 'class',
  INTERFACE = 'interface',
  VARIABLE = 'variable',
  IMPORT = 'import',
  EXPORT = 'export',
  COMMENT = 'comment',
  STRING_LITERAL = 'string_literal',
  CALL_EXPRESSION = 'call_expression'
}

/**
 * Code element representation
 */
export interface CodeElement {
  id: string;
  type: CodeElementType;
  name: string;
  content: string;
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  language: string;
  metadata: {
    complexity?: number;
    dependencies?: string[];
    usageCount?: number;
    lastModified?: Date;
    tags?: string[];
    parameters?: string[];
    returnType?: string;
    visibility?: 'public' | 'private' | 'protected';
  };
}

/**
 * File analysis result
 */
export interface FileAnalysis {
  filePath: string;
  language: string;
  elements: CodeElement[];
  imports: string[];
  exports: string[];
  dependencies: string[];
  complexity: number;
  linesOfCode: number;
  lastModified: Date;
  hotspots: CodeHotspot[];
}

/**
 * Code hotspot (frequently used/modified code)
 */
export interface CodeHotspot {
  element: CodeElement;
  score: number;
  reasons: string[];
  frequency: number;
  lastAccessed: Date;
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  id: string;
  filePath: string;
  dependencies: string[];
  dependents: string[];
  weight: number;
}

/**
 * Analysis configuration
 */
export interface AnalysisConfig {
  supportedExtensions: string[];
  excludedPaths: string[];
  maxFileSize: number;
  enableHotspotDetection: boolean;
  hotspotThreshold: number;
  complexityThreshold: number;
  includeTests: boolean;
  includeNodeModules: boolean;
  duplicateThreshold: number;
  cacheResults: boolean;
  cacheTimeout: number;
}

/**
 * Static code analyzer
 */
export class StaticAnalyzer extends EventEmitter {
  private logger: Logger;
  private analysisCache = new Map<string, FileAnalysis>();
  private dependencyGraph = new Map<string, DependencyNode>();
  private hotspots: CodeHotspot[] = [];
  private isAnalyzing = false;

  constructor(private config: AnalysisConfig) {
    super();
    this.logger = new Logger('StaticAnalyzer');
  }

  /**
   * Analyze a workspace or directory
   */
  async analyzeWorkspace(workspacePath: string): Promise<{
    files: FileAnalysis[];
    dependencyGraph: Map<string, DependencyNode>;
    hotspots: CodeHotspot[];
    summary: {
      totalFiles: number;
      totalElements: number;
      totalLinesOfCode: number;
      averageComplexity: number;
      topLanguages: Record<string, number>;
    };
  }> {
    if (this.isAnalyzing) {
      throw new Error('Analysis already in progress');
    }

    this.isAnalyzing = true;
    this.logger.info(`Starting workspace analysis: ${workspacePath}`);

    try {
      // Clear previous results
      this.analysisCache.clear();
      this.dependencyGraph.clear();
      this.hotspots = [];

      // Find all files to analyze
      const files = await this.findFilesToAnalyze(workspacePath);
      this.logger.info(`Found ${files.length} files to analyze`);

      // Analyze files in parallel (with concurrency limit)
      const analyses = await this.analyzeFilesInParallel(files);
      
      // Build dependency graph
      this.buildDependencyGraph(analyses);

      // Detect hotspots
      if (this.config.enableHotspotDetection) {
        this.detectHotspots(analyses);
      }

      // Generate summary
      const summary = this.generateSummary(analyses);

      this.logger.info('Workspace analysis completed', {
        totalFiles: analyses.length,
        totalElements: summary.totalElements,
        hotspots: this.hotspots.length
      });

      this.emit('analysis.completed', {
        files: analyses,
        dependencyGraph: this.dependencyGraph,
        hotspots: this.hotspots,
        summary
      });

      return {
        files: analyses,
        dependencyGraph: this.dependencyGraph,
        hotspots: this.hotspots,
        summary
      };

    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    // Check cache first
    if (this.config.cacheResults && this.analysisCache.has(filePath)) {
      const cached = this.analysisCache.get(filePath)!;
      const fileStats = await fs.stat(filePath);
      
      // Return cached result if file hasn't been modified
      if (cached.lastModified >= fileStats.mtime) {
        return cached;
      }
    }

    this.logger.debug(`Analyzing file: ${filePath}`);

    try {
      const fileStats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);

      // Parse file content
      const elements = await this.parseFileContent(filePath, content, language);
      const imports = this.extractImports(content, language);
      const exports = this.extractExports(content, language);
      const dependencies = this.extractDependencies(content, language);
      const complexity = this.calculateComplexity(elements);
      const linesOfCode = this.countLinesOfCode(content);

      const analysis: FileAnalysis = {
        filePath,
        language,
        elements,
        imports,
        exports,
        dependencies,
        complexity,
        linesOfCode,
        lastModified: fileStats.mtime,
        hotspots: []
      };

      // Cache result
      if (this.config.cacheResults) {
        this.analysisCache.set(filePath, analysis);
      }

      this.emit('file.analyzed', analysis);
      return analysis;

    } catch (error) {
      this.logger.error(`Failed to analyze file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Find files to analyze in workspace
   */
  private async findFilesToAnalyze(workspacePath: string): Promise<string[]> {
    const files: string[] = [];

    const scanDirectory = async (dirPath: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(workspacePath, fullPath);

          // Skip excluded paths
          if (this.isPathExcluded(relativePath)) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (this.config.supportedExtensions.includes(ext)) {
              // Check file size
              const stats = await fs.stat(fullPath);
              if (stats.size <= this.config.maxFileSize) {
                files.push(fullPath);
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to scan directory ${dirPath}:`, error);
      }
    };

    await scanDirectory(workspacePath);
    return files;
  }

  /**
   * Check if path should be excluded
   */
  private isPathExcluded(relativePath: string): boolean {
    return this.config.excludedPaths.some(excluded => 
      relativePath.includes(excluded) || relativePath.startsWith(excluded)
    );
  }

  /**
   * Analyze files in parallel with concurrency control
   */
  private async analyzeFilesInParallel(files: string[]): Promise<FileAnalysis[]> {
    const concurrency = 5; // Limit concurrent file analysis
    const results: FileAnalysis[] = [];
    
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(file => this.analyzeFile(file))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.warn('File analysis failed:', result.reason);
        }
      }

      // Emit progress
      this.emit('analysis.progress', {
        completed: Math.min(i + concurrency, files.length),
        total: files.length,
        percentage: Math.round((Math.min(i + concurrency, files.length) / files.length) * 100)
      });
    }

    return results;
  }

  /**
   * Parse file content to extract code elements
   */
  private async parseFileContent(
    filePath: string,
    content: string,
    language: string
  ): Promise<CodeElement[]> {
    const elements: CodeElement[] = [];
    const lines = content.split('\n');

    // Simple regex-based parsing (in production, use proper AST parsers)
    switch (language) {
      case 'typescript':
      case 'javascript':
        elements.push(...this.parseJavaScriptTypeScript(filePath, content, lines, language));
        break;
      case 'python':
        elements.push(...this.parsePython(filePath, content, lines));
        break;
      case 'java':
        elements.push(...this.parseJava(filePath, content, lines));
        break;
      default:
        // Generic parsing for other languages
        elements.push(...this.parseGeneric(filePath, content, lines, language));
    }

    return elements;
  }

  /**
   * Parse JavaScript/TypeScript files
   */
  private parseJavaScriptTypeScript(
    filePath: string,
    content: string,
    lines: string[],
    language: string
  ): CodeElement[] {
    const elements: CodeElement[] = [];

    // Function declarations
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        id: `${filePath}:${match[1]}:${lineNumber}`,
        type: CodeElementType.FUNCTION,
        name: match[1],
        content: match[0],
        filePath,
        startLine: lineNumber,
        endLine: lineNumber,
        startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
        endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
        language,
        metadata: {
          parameters: this.extractParameters(match[0]),
          visibility: match[0].includes('export') ? 'public' : 'private'
        }
      });
    }

    // Class declarations
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        id: `${filePath}:${match[1]}:${lineNumber}`,
        type: CodeElementType.CLASS,
        name: match[1],
        content: match[0],
        filePath,
        startLine: lineNumber,
        endLine: lineNumber,
        startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
        endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
        language,
        metadata: {
          visibility: match[0].includes('export') ? 'public' : 'private'
        }
      });
    }

    // Interface declarations (TypeScript)
    if (language === 'typescript') {
      const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
      while ((match = interfaceRegex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        elements.push({
          id: `${filePath}:${match[1]}:${lineNumber}`,
          type: CodeElementType.INTERFACE,
          name: match[1],
          content: match[0],
          filePath,
          startLine: lineNumber,
          endLine: lineNumber,
          startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
          endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
          language,
          metadata: {
            visibility: match[0].includes('export') ? 'public' : 'private'
          }
        });
      }
    }

    return elements;
  }

  /**
   * Parse Python files
   */
  private parsePython(filePath: string, content: string, lines: string[]): CodeElement[] {
    const elements: CodeElement[] = [];

    // Function definitions
    const functionRegex = /def\s+(\w+)\s*\([^)]*\):/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        id: `${filePath}:${match[1]}:${lineNumber}`,
        type: CodeElementType.FUNCTION,
        name: match[1],
        content: match[0],
        filePath,
        startLine: lineNumber,
        endLine: lineNumber,
        startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
        endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
        language: 'python',
        metadata: {
          parameters: this.extractParameters(match[0])
        }
      });
    }

    // Class definitions
    const classRegex = /class\s+(\w+)(?:\([^)]*\))?:/g;
    while ((match = classRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        id: `${filePath}:${match[1]}:${lineNumber}`,
        type: CodeElementType.CLASS,
        name: match[1],
        content: match[0],
        filePath,
        startLine: lineNumber,
        endLine: lineNumber,
        startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
        endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
        language: 'python',
        metadata: {}
      });
    }

    return elements;
  }

  /**
   * Parse Java files
   */
  private parseJava(filePath: string, content: string, lines: string[]): CodeElement[] {
    const elements: CodeElement[] = [];

    // Method declarations
    const methodRegex = /(public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        id: `${filePath}:${match[2]}:${lineNumber}`,
        type: CodeElementType.FUNCTION,
        name: match[2],
        content: match[0],
        filePath,
        startLine: lineNumber,
        endLine: lineNumber,
        startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
        endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
        language: 'java',
        metadata: {
          visibility: match[1] as 'public' | 'private' | 'protected' || 'public',
          parameters: this.extractParameters(match[0])
        }
      });
    }

    // Class declarations
    const classRegex = /(public|private|protected)?\s*class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        id: `${filePath}:${match[2]}:${lineNumber}`,
        type: CodeElementType.CLASS,
        name: match[2],
        content: match[0],
        filePath,
        startLine: lineNumber,
        endLine: lineNumber,
        startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
        endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
        language: 'java',
        metadata: {
          visibility: match[1] as 'public' | 'private' | 'protected' || 'public'
        }
      });
    }

    return elements;
  }

  /**
   * Generic parsing for other languages
   */
  private parseGeneric(filePath: string, content: string, lines: string[], language: string): CodeElement[] {
    const elements: CodeElement[] = [];

    // Extract function-like patterns
    const functionPatterns = [
      /function\s+(\w+)/g,
      /def\s+(\w+)/g,
      /(\w+)\s*\(/g
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const name = match[1] || match[0].split('(')[0].trim();
        
        if (name && name.length > 1) {
          elements.push({
            id: `${filePath}:${name}:${lineNumber}`,
            type: CodeElementType.FUNCTION,
            name,
            content: match[0],
            filePath,
            startLine: lineNumber,
            endLine: lineNumber,
            startColumn: match.index - content.lastIndexOf('\n', match.index) - 1,
            endColumn: match.index + match[0].length - content.lastIndexOf('\n', match.index) - 1,
            language,
            metadata: {}
          });
        }
      }
    }

    return elements;
  }

  /**
   * Extract parameters from function signature
   */
  private extractParameters(signature: string): string[] {
    const paramMatch = signature.match(/\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1]) return [];
    
    return paramMatch[1]
      .split(',')
      .map(param => param.trim().split(/[:\s]/)[0])
      .filter(param => param.length > 0);
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala'
    };
    
    return languageMap[ext] || 'unknown';
  }

  /**
   * Extract imports from file content
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        const jsImportRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        
        let match;
        while ((match = jsImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        while ((match = requireRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
        
      case 'python':
        const pyImportRegex = /(?:from\s+(\S+)\s+)?import\s+([^\n]+)/g;
        while ((match = pyImportRegex.exec(content)) !== null) {
          if (match[1]) {
            imports.push(match[1]);
          } else {
            imports.push(match[2].split(',')[0].trim());
          }
        }
        break;
        
      case 'java':
        const javaImportRegex = /import\s+([^;]+);/g;
        while ((match = javaImportRegex.exec(content)) !== null) {
          imports.push(match[1]);
        }
        break;
    }
    
    return imports;
  }

  /**
   * Extract exports from file content
   */
  private extractExports(content: string, language: string): string[] {
    const exports: string[] = [];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g;
        let match;
        while ((match = exportRegex.exec(content)) !== null) {
          exports.push(match[1]);
        }
        break;
    }
    
    return exports;
  }

  /**
   * Extract dependencies from file content
   */
  private extractDependencies(content: string, language: string): string[] {
    // For now, dependencies are the same as imports
    // In a more sophisticated implementation, this could include
    // runtime dependencies, API calls, etc.
    return this.extractImports(content, language);
  }

  /**
   * Calculate code complexity
   */
  private calculateComplexity(elements: CodeElement[]): number {
    // Simple complexity calculation based on number of functions and classes
    let complexity = 0;
    
    for (const element of elements) {
      switch (element.type) {
        case CodeElementType.FUNCTION:
          complexity += 2;
          break;
        case CodeElementType.CLASS:
          complexity += 3;
          break;
        case CodeElementType.INTERFACE:
          complexity += 1;
          break;
        default:
          complexity += 0.5;
      }
    }
    
    return complexity;
  }

  /**
   * Count lines of code (excluding comments and empty lines)
   */
  private countLinesOfCode(content: string): number {
    const lines = content.split('\n');
    let loc = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
        loc++;
      }
    }
    
    return loc;
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(analyses: FileAnalysis[]): void {
    this.dependencyGraph.clear();
    
    // Create nodes
    for (const analysis of analyses) {
      const node: DependencyNode = {
        id: analysis.filePath,
        filePath: analysis.filePath,
        dependencies: analysis.dependencies,
        dependents: [],
        weight: analysis.complexity
      };
      this.dependencyGraph.set(analysis.filePath, node);
    }
    
    // Build relationships
    for (const [filePath, node] of this.dependencyGraph) {
      for (const dep of node.dependencies) {
        // Find matching files (simplified - in production, resolve imports properly)
        for (const [otherPath, otherNode] of this.dependencyGraph) {
          if (otherPath.includes(dep) || dep.includes(path.basename(otherPath, path.extname(otherPath)))) {
            otherNode.dependents.push(filePath);
          }
        }
      }
    }
  }

  /**
   * Detect code hotspots
   */
  private detectHotspots(analyses: FileAnalysis[]): void {
    this.hotspots = [];
    
    for (const analysis of analyses) {
      for (const element of analysis.elements) {
        let score = 0;
        const reasons: string[] = [];
        
        // High complexity
        if (analysis.complexity > this.config.complexityThreshold) {
          score += 0.3;
          reasons.push('High complexity');
        }
        
        // Many dependencies
        if (analysis.dependencies.length > 5) {
          score += 0.2;
          reasons.push('Many dependencies');
        }
        
        // Large file
        if (analysis.linesOfCode > 500) {
          score += 0.2;
          reasons.push('Large file');
        }
        
        // Function with many parameters
        if (element.metadata.parameters && element.metadata.parameters.length > 5) {
          score += 0.1;
          reasons.push('Many parameters');
        }
        
        // Recently modified (placeholder - would need Git integration)
        score += 0.2;
        reasons.push('Recently modified');
        
        if (score >= this.config.hotspotThreshold) {
          this.hotspots.push({
            element,
            score,
            reasons,
            frequency: Math.floor(score * 10), // Placeholder
            lastAccessed: new Date()
          });
        }
      }
    }
    
    // Sort by score
    this.hotspots.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(analyses: FileAnalysis[]): {
    totalFiles: number;
    totalElements: number;
    totalLinesOfCode: number;
    averageComplexity: number;
    topLanguages: Record<string, number>;
  } {
    const totalFiles = analyses.length;
    const totalElements = analyses.reduce((sum, a) => sum + a.elements.length, 0);
    const totalLinesOfCode = analyses.reduce((sum, a) => sum + a.linesOfCode, 0);
    const averageComplexity = analyses.reduce((sum, a) => sum + a.complexity, 0) / totalFiles;
    
    const languageCounts: Record<string, number> = {};
    for (const analysis of analyses) {
      languageCounts[analysis.language] = (languageCounts[analysis.language] || 0) + 1;
    }
    
    return {
      totalFiles,
      totalElements,
      totalLinesOfCode,
      averageComplexity,
      topLanguages: languageCounts
    };
  }

  /**
   * Get cached analysis for file
   */
  getCachedAnalysis(filePath: string): FileAnalysis | null {
    return this.analysisCache.get(filePath) || null;
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Get current hotspots
   */
  getHotspots(): CodeHotspot[] {
    return [...this.hotspots];
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Map<string, DependencyNode> {
    return new Map(this.dependencyGraph);
  }

  /**
   * Search code elements
   */
  searchElements(query: string, filters?: {
    type?: CodeElementType;
    language?: string;
    filePath?: string;
  }): CodeElement[] {
    const results: CodeElement[] = [];
    
    for (const analysis of this.analysisCache.values()) {
      if (filters?.language && analysis.language !== filters.language) continue;
      if (filters?.filePath && !analysis.filePath.includes(filters.filePath)) continue;
      
      for (const element of analysis.elements) {
        if (filters?.type && element.type !== filters.type) continue;
        
        if (element.name.toLowerCase().includes(query.toLowerCase()) ||
            element.content.toLowerCase().includes(query.toLowerCase())) {
          results.push(element);
        }
      }
    }
    
    return results;
  }

  /**
   * Get analysis statistics
   */
  getStatistics(): {
    totalFiles: number;
    totalElements: number;
    totalHotspots: number;
    cacheSize: number;
    dependencyNodes: number;
  } {
    const totalFiles = this.analysisCache.size;
    const totalElements = Array.from(this.analysisCache.values())
      .reduce((sum, analysis) => sum + analysis.elements.length, 0);
    
    return {
      totalFiles,
      totalElements,
      totalHotspots: this.hotspots.length,
      cacheSize: this.analysisCache.size,
      dependencyNodes: this.dependencyGraph.size
    };
  }
}

export default StaticAnalyzer;