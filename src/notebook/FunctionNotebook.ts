/**
 * Function Notebook/Playbook System
 * 
 * Manages reusable code patterns, templates, and knowledge for AI agents.
 * Provides versioning, approval workflows, and pattern mining capabilities.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/logger';

export interface NotebookPattern {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  
  // Pattern definition
  template: string;
  parameters: PatternParameter[];
  constraints: PatternConstraint[];
  
  // Usage context
  language: string;
  framework?: string;
  domain: string;
  
  // Metadata
  version: string;
  author: string;
  createdAt: number;
  updatedAt: number;
  
  // Quality metrics
  usage: {
    count: number;
    successRate: number;
    lastUsed: number;
    averageRating: number;
    totalRatings: number;
  };
  
  // Approval status
  status: PatternStatus;
  approvals: PatternApproval[];
  
  // Examples and documentation
  examples: PatternExample[];
  documentation: string;
  relatedPatterns: string[];
  
  // Performance data
  metrics: PatternMetrics;
}

export interface PatternParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    options?: any[];
  };
}

export interface PatternConstraint {
  type: 'prerequisite' | 'dependency' | 'environment' | 'security' | 'performance';
  description: string;
  condition: string;
  severity: 'error' | 'warning' | 'info';
}

export interface PatternExample {
  id: string;
  title: string;
  description: string;
  input: Record<string, any>;
  expectedOutput: string;
  context?: {
    scenario: string;
    prerequisites: string[];
    notes: string;
  };
}

export interface PatternApproval {
  approver: string;
  timestamp: number;
  status: 'approved' | 'rejected' | 'pending';
  comments?: string;
  version: string;
}

export interface PatternMetrics {
  executionTime: {
    average: number;
    min: number;
    max: number;
    samples: number;
  };
  
  complexity: {
    cognitive: number;
    cyclomatic: number;
    lines: number;
  };
  
  reliability: {
    errorRate: number;
    successfulExecutions: number;
    totalExecutions: number;
  };
  
  maintainability: {
    lastUpdated: number;
    updateFrequency: number;
    deprecationRisk: number;
  };
}

export enum PatternStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}

export interface NotebookConfig {
  storage: {
    type: 'file' | 'database' | 'git';
    path: string;
    backup: {
      enabled: boolean;
      interval: number;
      retention: number;
    };
  };
  
  versioning: {
    enabled: boolean;
    strategy: 'semantic' | 'timestamp' | 'incremental';
    autoIncrement: boolean;
  };
  
  approval: {
    required: boolean;
    minApprovers: number;
    approvers: string[];
    autoApprove: {
      minUsage: number;
      minRating: number;
      maxComplexity: number;
    };
  };
  
  mining: {
    enabled: boolean;
    sources: string[];
    frequency: number;
    minOccurrences: number;
    similarity: {
      threshold: number;
      algorithm: 'levenshtein' | 'jaccard' | 'cosine';
    };
  };
  
  ai: {
    enabled: boolean;
    models: {
      classification: string;
      generation: string;
      evaluation: string;
    };
    confidence: {
      threshold: number;
      requireHuman: boolean;
    };
  };
}

export interface PatternSearchQuery {
  query?: string;
  category?: string;
  tags?: string[];
  language?: string;
  framework?: string;
  domain?: string;
  status?: PatternStatus;
  minRating?: number;
  sortBy?: 'relevance' | 'usage' | 'rating' | 'recent';
  limit?: number;
  offset?: number;
}

export interface PatternExecutionContext {
  workspacePath: string;
  currentFile?: string;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
  projectContext?: {
    language: string;
    framework?: string;
    dependencies: string[];
  };
}

export interface PatternExecutionResult {
  success: boolean;
  output: string;
  changes: FileChange[];
  metrics: {
    executionTime: number;
    linesChanged: number;
    filesModified: number;
  };
  error?: string;
  warnings: string[];
}

export interface FileChange {
  file: string;
  type: 'create' | 'modify' | 'delete';
  content?: string;
  diff?: string;
}

export class FunctionNotebook extends EventEmitter {
  private config: NotebookConfig;
  private logger: Logger;
  private patterns: Map<string, NotebookPattern> = new Map();
  private patternIndex: Map<string, Set<string>> = new Map(); // For fast searching
  private isInitialized = false;

  constructor(config: NotebookConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger || new Logger('FunctionNotebook');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Function Notebook...');
    
    try {
      // Load existing patterns
      await this.loadPatterns();
      
      // Build search index
      this.buildSearchIndex();
      
      // Start pattern mining if enabled
      if (this.config.mining.enabled) {
        this.startPatternMining();
      }
      
      // Setup backup if enabled
      if (this.config.storage.backup.enabled) {
        this.setupBackup();
      }
      
      this.isInitialized = true;
      this.logger.info(`Function Notebook initialized with ${this.patterns.size} patterns`);
      this.emit('notebook.initialized', { patternCount: this.patterns.size });
      
    } catch (error) {
      this.logger.error('Failed to initialize Function Notebook:', error);
      throw error;
    }
  }

  private async loadPatterns(): Promise<void> {
    const { storage } = this.config;
    
    switch (storage.type) {
      case 'file':
        await this.loadPatternsFromFile();
        break;
      case 'database':
        await this.loadPatternsFromDatabase();
        break;
      case 'git':
        await this.loadPatternsFromGit();
        break;
      default:
        throw new Error(`Unsupported storage type: ${storage.type}`);
    }
  }

  private async loadPatternsFromFile(): Promise<void> {
    const patternsPath = this.config.storage.path;
    
    try {
      await fs.access(patternsPath);
      const files = await fs.readdir(patternsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(patternsPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const pattern: NotebookPattern = JSON.parse(content);
          
          this.patterns.set(pattern.id, pattern);
        }
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // Directory doesn't exist, create it
        await fs.mkdir(patternsPath, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  private async loadPatternsFromDatabase(): Promise<void> {
    // TODO: Implement database loading
    this.logger.warn('Database storage not yet implemented');
  }

  private async loadPatternsFromGit(): Promise<void> {
    // TODO: Implement Git storage
    this.logger.warn('Git storage not yet implemented');
  }

  private buildSearchIndex(): void {
    this.patternIndex.clear();
    
    for (const pattern of this.patterns.values()) {
      // Index by category
      this.addToIndex('category', pattern.category, pattern.id);
      
      // Index by tags
      for (const tag of pattern.tags) {
        this.addToIndex('tag', tag, pattern.id);
      }
      
      // Index by language
      this.addToIndex('language', pattern.language, pattern.id);
      
      // Index by framework
      if (pattern.framework) {
        this.addToIndex('framework', pattern.framework, pattern.id);
      }
      
      // Index by domain
      this.addToIndex('domain', pattern.domain, pattern.id);
      
      // Index by keywords from name and description
      const keywords = this.extractKeywords(pattern.name + ' ' + pattern.description);
      for (const keyword of keywords) {
        this.addToIndex('keyword', keyword, pattern.id);
      }
    }
  }

  private addToIndex(type: string, value: string, patternId: string): void {
    const key = `${type}:${value.toLowerCase()}`;
    if (!this.patternIndex.has(key)) {
      this.patternIndex.set(key, new Set());
    }
    this.patternIndex.get(key)!.add(patternId);
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word));
  }

  async createPattern(pattern: Omit<NotebookPattern, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'usage' | 'metrics'>): Promise<NotebookPattern> {
    const id = this.generatePatternId();
    const now = Date.now();
    
    const newPattern: NotebookPattern = {
      ...pattern,
      id,
      createdAt: now,
      updatedAt: now,
      version: this.generateVersion('1.0.0'),
      usage: {
        count: 0,
        successRate: 0,
        lastUsed: 0,
        averageRating: 0,
        totalRatings: 0
      },
      metrics: {
        executionTime: { average: 0, min: 0, max: 0, samples: 0 },
        complexity: { cognitive: 0, cyclomatic: 0, lines: 0 },
        reliability: { errorRate: 0, successfulExecutions: 0, totalExecutions: 0 },
        maintainability: { lastUpdated: now, updateFrequency: 0, deprecationRisk: 0 }
      }
    };
    
    // Validate pattern
    this.validatePattern(newPattern);
    
    // Store pattern
    this.patterns.set(id, newPattern);
    await this.savePattern(newPattern);
    
    // Update search index
    this.addPatternToIndex(newPattern);
    
    this.logger.info(`Created pattern: ${newPattern.name} (${id})`);
    this.emit('pattern.created', newPattern);
    
    return newPattern;
  }

  async updatePattern(id: string, updates: Partial<NotebookPattern>): Promise<NotebookPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error(`Pattern ${id} not found`);
    }
    
    // Create new version if versioning is enabled
    const newVersion = this.config.versioning.enabled ? 
      this.incrementVersion(pattern.version) : pattern.version;
    
    const updatedPattern: NotebookPattern = {
      ...pattern,
      ...updates,
      id, // Ensure ID doesn't change
      version: newVersion,
      updatedAt: Date.now()
    };
    
    // Validate updated pattern
    this.validatePattern(updatedPattern);
    
    // Store updated pattern
    this.patterns.set(id, updatedPattern);
    await this.savePattern(updatedPattern);
    
    // Update search index
    this.removePatternFromIndex(pattern);
    this.addPatternToIndex(updatedPattern);
    
    this.logger.info(`Updated pattern: ${updatedPattern.name} (${id})`);
    this.emit('pattern.updated', { old: pattern, new: updatedPattern });
    
    return updatedPattern;
  }

  async deletePattern(id: string): Promise<void> {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error(`Pattern ${id} not found`);
    }
    
    // Remove from memory
    this.patterns.delete(id);
    
    // Remove from storage
    await this.deletePatternFromStorage(id);
    
    // Remove from search index
    this.removePatternFromIndex(pattern);
    
    this.logger.info(`Deleted pattern: ${pattern.name} (${id})`);
    this.emit('pattern.deleted', pattern);
  }

  async searchPatterns(query: PatternSearchQuery): Promise<NotebookPattern[]> {
    let candidateIds: Set<string> | undefined;
    
    // Apply filters to narrow down candidates
    if (query.category) {
      candidateIds = this.intersectSets(candidateIds, this.patternIndex.get(`category:${query.category.toLowerCase()}`));
    }
    
    if (query.language) {
      candidateIds = this.intersectSets(candidateIds, this.patternIndex.get(`language:${query.language.toLowerCase()}`));
    }
    
    if (query.framework) {
      candidateIds = this.intersectSets(candidateIds, this.patternIndex.get(`framework:${query.framework.toLowerCase()}`));
    }
    
    if (query.domain) {
      candidateIds = this.intersectSets(candidateIds, this.patternIndex.get(`domain:${query.domain.toLowerCase()}`));
    }
    
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        candidateIds = this.intersectSets(candidateIds, this.patternIndex.get(`tag:${tag.toLowerCase()}`));
      }
    }
    
    // Text search
    if (query.query) {
      const keywords = this.extractKeywords(query.query);
      for (const keyword of keywords) {
        candidateIds = this.intersectSets(candidateIds, this.patternIndex.get(`keyword:${keyword}`));
      }
    }
    
    // Get patterns from candidate IDs
    const patterns = candidateIds ? 
      Array.from(candidateIds).map(id => this.patterns.get(id)!).filter(Boolean) :
      Array.from(this.patterns.values());
    
    // Apply additional filters
    let filteredPatterns = patterns.filter(pattern => {
      if (query.status && pattern.status !== query.status) return false;
      if (query.minRating && pattern.usage.averageRating < query.minRating) return false;
      return true;
    });
    
    // Sort results
    filteredPatterns = this.sortPatterns(filteredPatterns, query.sortBy || 'relevance', query.query);
    
    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    
    return filteredPatterns.slice(offset, offset + limit);
  }

  private intersectSets(set1: Set<string> | undefined, set2: Set<string> | undefined): Set<string> | undefined {
    if (!set1) return set2;
    if (!set2) return set1;
    
    const intersection = new Set<string>();
    for (const item of set1) {
      if (set2.has(item)) {
        intersection.add(item);
      }
    }
    
    return intersection.size > 0 ? intersection : undefined;
  }

  private sortPatterns(patterns: NotebookPattern[], sortBy: string, query?: string): NotebookPattern[] {
    switch (sortBy) {
      case 'usage':
        return patterns.sort((a, b) => b.usage.count - a.usage.count);
      
      case 'rating':
        return patterns.sort((a, b) => b.usage.averageRating - a.usage.averageRating);
      
      case 'recent':
        return patterns.sort((a, b) => b.updatedAt - a.updatedAt);
      
      case 'relevance':
      default:
        if (query) {
          return patterns.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, query);
            const scoreB = this.calculateRelevanceScore(b, query);
            return scoreB - scoreA;
          });
        }
        return patterns.sort((a, b) => b.usage.count - a.usage.count);
    }
  }

  private calculateRelevanceScore(pattern: NotebookPattern, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    // Name match (highest weight)
    if (pattern.name.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Description match
    if (pattern.description.toLowerCase().includes(queryLower)) {
      score += 5;
    }
    
    // Tag match
    for (const tag of pattern.tags) {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 3;
      }
    }
    
    // Usage boost
    score += Math.log(pattern.usage.count + 1);
    
    // Rating boost
    score += pattern.usage.averageRating;
    
    return score;
  }

  async executePattern(
    patternId: string, 
    parameters: Record<string, any>, 
    context: PatternExecutionContext
  ): Promise<PatternExecutionResult> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern ${patternId} not found`);
    }
    
    const startTime = Date.now();
    
    try {
      // Validate parameters
      this.validateParameters(pattern, parameters);
      
      // Check constraints
      await this.checkConstraints(pattern, context);
      
      // Execute pattern
      const result = await this.executePatternTemplate(pattern, parameters, context);
      
      // Update usage metrics
      await this.updateUsageMetrics(pattern, true, Date.now() - startTime);
      
      this.emit('pattern.executed', { pattern, parameters, result });
      
      return result;
      
    } catch (error) {
      // Update failure metrics
      await this.updateUsageMetrics(pattern, false, Date.now() - startTime);
      
      this.emit('pattern.execution.failed', { pattern, parameters, error });
      
      throw error;
    }
  }

  private async executePatternTemplate(
    pattern: NotebookPattern, 
    parameters: Record<string, any>, 
    context: PatternExecutionContext
  ): Promise<PatternExecutionResult> {
    // Simple template engine - replace {{parameter}} with values
    let output = pattern.template;
    
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      output = output.replace(placeholder, String(value));
    }
    
    // For now, return the processed template as output
    // In a real implementation, this would execute the code/commands
    return {
      success: true,
      output,
      changes: [], // Would contain actual file changes
      metrics: {
        executionTime: 0,
        linesChanged: output.split('\n').length,
        filesModified: 0
      },
      warnings: []
    };
  }

  private validatePattern(pattern: NotebookPattern): void {
    if (!pattern.name || pattern.name.trim().length === 0) {
      throw new Error('Pattern name is required');
    }
    
    if (!pattern.template || pattern.template.trim().length === 0) {
      throw new Error('Pattern template is required');
    }
    
    if (!pattern.language || pattern.language.trim().length === 0) {
      throw new Error('Pattern language is required');
    }
    
    // Validate parameters
    for (const param of pattern.parameters) {
      if (!param.name || param.name.trim().length === 0) {
        throw new Error('Parameter name is required');
      }
    }
  }

  private validateParameters(pattern: NotebookPattern, parameters: Record<string, any>): void {
    for (const param of pattern.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }
      
      if (param.name in parameters) {
        const value = parameters[param.name];
        
        // Type validation
        if (!this.validateParameterType(value, param.type)) {
          throw new Error(`Parameter '${param.name}' must be of type ${param.type}`);
        }
        
        // Additional validation
        if (param.validation) {
          this.validateParameterValue(value, param.validation, param.name);
        }
      }
    }
  }

  private validateParameterType(value: any, type: string): boolean {
    switch (type) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'array': return Array.isArray(value);
      case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value);
      default: return true;
    }
  }

  private validateParameterValue(value: any, validation: any, paramName: string): void {
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Parameter '${paramName}' does not match required pattern`);
      }
    }
    
    if (validation.min !== undefined && typeof value === 'number') {
      if (value < validation.min) {
        throw new Error(`Parameter '${paramName}' must be at least ${validation.min}`);
      }
    }
    
    if (validation.max !== undefined && typeof value === 'number') {
      if (value > validation.max) {
        throw new Error(`Parameter '${paramName}' must be at most ${validation.max}`);
      }
    }
    
    if (validation.options && Array.isArray(validation.options)) {
      if (!validation.options.includes(value)) {
        throw new Error(`Parameter '${paramName}' must be one of: ${validation.options.join(', ')}`);
      }
    }
  }

  private async checkConstraints(pattern: NotebookPattern, context: PatternExecutionContext): Promise<void> {
    for (const constraint of pattern.constraints) {
      const satisfied = await this.evaluateConstraint(constraint, context);
      
      if (!satisfied) {
        const message = `Constraint not satisfied: ${constraint.description}`;
        
        if (constraint.severity === 'error') {
          throw new Error(message);
        } else {
          this.logger.warn(message);
        }
      }
    }
  }

  private async evaluateConstraint(constraint: PatternConstraint, context: PatternExecutionContext): Promise<boolean> {
    // Simple constraint evaluation - in a real implementation, this would be more sophisticated
    switch (constraint.type) {
      case 'prerequisite':
        // Check if required files/dependencies exist
        return true; // Placeholder
      
      case 'dependency':
        // Check if required packages are installed
        return true; // Placeholder
      
      case 'environment':
        // Check environment variables, OS, etc.
        return true; // Placeholder
      
      case 'security':
        // Check security policies
        return true; // Placeholder
      
      case 'performance':
        // Check performance requirements
        return true; // Placeholder
      
      default:
        return true;
    }
  }

  private async updateUsageMetrics(pattern: NotebookPattern, success: boolean, executionTime: number): Promise<void> {
    pattern.usage.count++;
    pattern.usage.lastUsed = Date.now();
    
    // Update execution time metrics
    const execMetrics = pattern.metrics.executionTime;
    execMetrics.samples++;
    execMetrics.average = (execMetrics.average * (execMetrics.samples - 1) + executionTime) / execMetrics.samples;
    
    if (execMetrics.samples === 1) {
      execMetrics.min = execMetrics.max = executionTime;
    } else {
      execMetrics.min = Math.min(execMetrics.min, executionTime);
      execMetrics.max = Math.max(execMetrics.max, executionTime);
    }
    
    // Update reliability metrics
    const reliabilityMetrics = pattern.metrics.reliability;
    reliabilityMetrics.totalExecutions++;
    
    if (success) {
      reliabilityMetrics.successfulExecutions++;
      pattern.usage.successRate = reliabilityMetrics.successfulExecutions / reliabilityMetrics.totalExecutions;
    }
    
    reliabilityMetrics.errorRate = 1 - pattern.usage.successRate;
    
    // Save updated pattern
    await this.savePattern(pattern);
  }

  async ratePattern(patternId: string, rating: number, userId?: string): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern ${patternId} not found`);
    }
    
    // Update rating
    const totalRatings = pattern.usage.totalRatings;
    const currentAverage = pattern.usage.averageRating;
    
    pattern.usage.totalRatings++;
    pattern.usage.averageRating = (currentAverage * totalRatings + rating) / pattern.usage.totalRatings;
    
    await this.savePattern(pattern);
    
    this.emit('pattern.rated', { pattern, rating, userId });
  }

  private async savePattern(pattern: NotebookPattern): Promise<void> {
    const { storage } = this.config;
    
    switch (storage.type) {
      case 'file':
        await this.savePatternToFile(pattern);
        break;
      case 'database':
        await this.savePatternToDatabase(pattern);
        break;
      case 'git':
        await this.savePatternToGit(pattern);
        break;
    }
  }

  private async savePatternToFile(pattern: NotebookPattern): Promise<void> {
    const filePath = path.join(this.config.storage.path, `${pattern.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(pattern, null, 2));
  }

  private async savePatternToDatabase(pattern: NotebookPattern): Promise<void> {
    // TODO: Implement database saving
  }

  private async savePatternToGit(pattern: NotebookPattern): Promise<void> {
    // TODO: Implement Git saving
  }

  private async deletePatternFromStorage(id: string): Promise<void> {
    const { storage } = this.config;
    
    switch (storage.type) {
      case 'file':
        const filePath = path.join(storage.path, `${id}.json`);
        await fs.unlink(filePath);
        break;
      case 'database':
        // TODO: Implement database deletion
        break;
      case 'git':
        // TODO: Implement Git deletion
        break;
    }
  }

  private addPatternToIndex(pattern: NotebookPattern): void {
    // Add to category index
    this.addToIndex('category', pattern.category, pattern.id);
    
    // Add to tag index
    for (const tag of pattern.tags) {
      this.addToIndex('tag', tag, pattern.id);
    }
    
    // Add to language index
    this.addToIndex('language', pattern.language, pattern.id);
    
    // Add to framework index
    if (pattern.framework) {
      this.addToIndex('framework', pattern.framework, pattern.id);
    }
    
    // Add to domain index
    this.addToIndex('domain', pattern.domain, pattern.id);
    
    // Add to keyword index
    const keywords = this.extractKeywords(pattern.name + ' ' + pattern.description);
    for (const keyword of keywords) {
      this.addToIndex('keyword', keyword, pattern.id);
    }
  }

  private removePatternFromIndex(pattern: NotebookPattern): void {
    // Remove from all indices
    for (const [key, patternIds] of this.patternIndex.entries()) {
      patternIds.delete(pattern.id);
      if (patternIds.size === 0) {
        this.patternIndex.delete(key);
      }
    }
  }

  private startPatternMining(): void {
    // TODO: Implement pattern mining from code repositories
    this.logger.info('Pattern mining started');
    
    setInterval(() => {
      this.minePatterns();
    }, this.config.mining.frequency);
  }

  private async minePatterns(): Promise<void> {
    // TODO: Implement actual pattern mining logic
    this.logger.debug('Mining patterns...');
  }

  private setupBackup(): void {
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        this.logger.error('Backup failed:', error);
      }
    }, this.config.storage.backup.interval);
  }

  private async createBackup(): Promise<void> {
    const backupPath = path.join(this.config.storage.path, 'backups');
    await fs.mkdir(backupPath, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `patterns-${timestamp}.json`);
    
    const allPatterns = Array.from(this.patterns.values());
    await fs.writeFile(backupFile, JSON.stringify(allPatterns, null, 2));
    
    this.logger.info(`Backup created: ${backupFile}`);
    
    // Clean old backups
    await this.cleanOldBackups(backupPath);
  }

  private async cleanOldBackups(backupPath: string): Promise<void> {
    const files = await fs.readdir(backupPath);
    const backupFiles = files
      .filter(file => file.startsWith('patterns-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(backupPath, file),
        time: fs.stat(path.join(backupPath, file)).then(stats => stats.mtime.getTime())
      }));
    
    const sortedFiles = await Promise.all(
      backupFiles.map(async file => ({
        ...file,
        time: await file.time
      }))
    );
    
    sortedFiles.sort((a, b) => b.time - a.time);
    
    // Keep only the configured number of backups
    const filesToDelete = sortedFiles.slice(this.config.storage.backup.retention);
    
    for (const file of filesToDelete) {
      await fs.unlink(file.path);
    }
  }

  private generatePatternId(): string {
    return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVersion(baseVersion: string): string {
    if (!this.config.versioning.enabled) {
      return baseVersion;
    }
    
    switch (this.config.versioning.strategy) {
      case 'semantic':
        return baseVersion; // Would implement semantic versioning logic
      case 'timestamp':
        return new Date().toISOString();
      case 'incremental':
        return '1'; // Would implement incremental versioning
      default:
        return baseVersion;
    }
  }

  private incrementVersion(currentVersion: string): string {
    if (!this.config.versioning.enabled) {
      return currentVersion;
    }
    
    switch (this.config.versioning.strategy) {
      case 'semantic':
        // Simple patch increment
        const parts = currentVersion.split('.');
        if (parts.length === 3) {
          parts[2] = String(parseInt(parts[2]) + 1);
          return parts.join('.');
        }
        return currentVersion;
      
      case 'timestamp':
        return new Date().toISOString();
      
      case 'incremental':
        return String(parseInt(currentVersion) + 1);
      
      default:
        return currentVersion;
    }
  }

  // Public API methods
  getPattern(id: string): NotebookPattern | undefined {
    return this.patterns.get(id);
  }

  getAllPatterns(): NotebookPattern[] {
    return Array.from(this.patterns.values());
  }

  getPatternsByCategory(category: string): NotebookPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.category === category);
  }

  getPatternsByTag(tag: string): NotebookPattern[] {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.tags.includes(tag));
  }

  getPopularPatterns(limit = 10): NotebookPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.usage.count - a.usage.count)
      .slice(0, limit);
  }

  getRecentPatterns(limit = 10): NotebookPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  async exportPatterns(format: 'json' | 'yaml' | 'markdown' = 'json'): Promise<string> {
    const patterns = Array.from(this.patterns.values());
    
    switch (format) {
      case 'json':
        return JSON.stringify(patterns, null, 2);
      
      case 'yaml':
        // TODO: Implement YAML export
        throw new Error('YAML export not implemented');
      
      case 'markdown':
        // TODO: Implement Markdown export
        throw new Error('Markdown export not implemented');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  async importPatterns(data: string, format: 'json' | 'yaml' = 'json'): Promise<number> {
    let patterns: NotebookPattern[];
    
    switch (format) {
      case 'json':
        patterns = JSON.parse(data);
        break;
      
      case 'yaml':
        // TODO: Implement YAML import
        throw new Error('YAML import not implemented');
      
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
    
    let importedCount = 0;
    
    for (const pattern of patterns) {
      try {
        // Validate pattern
        this.validatePattern(pattern);
        
        // Check if pattern already exists
        if (this.patterns.has(pattern.id)) {
          this.logger.warn(`Pattern ${pattern.id} already exists, skipping`);
          continue;
        }
        
        // Store pattern
        this.patterns.set(pattern.id, pattern);
        await this.savePattern(pattern);
        this.addPatternToIndex(pattern);
        
        importedCount++;
        
      } catch (error) {
        this.logger.error(`Failed to import pattern ${pattern.id}:`, error);
      }
    }
    
    this.logger.info(`Imported ${importedCount} patterns`);
    this.emit('patterns.imported', { count: importedCount });
    
    return importedCount;
  }

  getStatistics(): any {
    const patterns = Array.from(this.patterns.values());
    
    return {
      totalPatterns: patterns.length,
      byStatus: this.groupBy(patterns, 'status'),
      byCategory: this.groupBy(patterns, 'category'),
      byLanguage: this.groupBy(patterns, 'language'),
      totalUsage: patterns.reduce((sum, p) => sum + p.usage.count, 0),
      averageRating: patterns.reduce((sum, p) => sum + p.usage.averageRating, 0) / patterns.length,
      mostUsed: patterns.sort((a, b) => b.usage.count - a.usage.count).slice(0, 5),
      topRated: patterns.sort((a, b) => b.usage.averageRating - a.usage.averageRating).slice(0, 5)
    };
  }

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Function Notebook...');
    
    // Create final backup
    if (this.config.storage.backup.enabled) {
      await this.createBackup();
    }
    
    this.removeAllListeners();
    this.patterns.clear();
    this.patternIndex.clear();
    
    this.logger.info('Function Notebook shutdown complete');
  }
}

export const DEFAULT_NOTEBOOK_CONFIG: NotebookConfig = {
  storage: {
    type: 'file',
    path: './patterns',
    backup: {
      enabled: true,
      interval: 3600000, // 1 hour
      retention: 10
    }
  },
  
  versioning: {
    enabled: true,
    strategy: 'semantic',
    autoIncrement: true
  },
  
  approval: {
    required: false,
    minApprovers: 1,
    approvers: [],
    autoApprove: {
      minUsage: 10,
      minRating: 4.0,
      maxComplexity: 50
    }
  },
  
  mining: {
    enabled: false,
    sources: [],
    frequency: 86400000, // 24 hours
    minOccurrences: 3,
    similarity: {
      threshold: 0.8,
      algorithm: 'cosine'
    }
  },
  
  ai: {
    enabled: false,
    models: {
      classification: 'gpt-4',
      generation: 'gpt-4',
      evaluation: 'gpt-3.5-turbo'
    },
    confidence: {
      threshold: 0.8,
      requireHuman: true
    }
  }
};

export default FunctionNotebook;