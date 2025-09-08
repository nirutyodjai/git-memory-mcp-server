import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { CodeSnippet, SnippetType } from './SnippetMiner';

/**
 * Function pattern categories
 */
export enum PatternCategory {
  ERROR_HANDLING = 'error_handling',
  TESTING = 'testing',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UTILITIES = 'utilities',
  DATA_PROCESSING = 'data_processing',
  API_INTEGRATION = 'api_integration',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  LOGGING = 'logging',
  VALIDATION = 'validation',
  CACHING = 'caching',
  ASYNC_PATTERNS = 'async_patterns',
  DESIGN_PATTERNS = 'design_patterns',
  OPTIMIZATION = 'optimization'
}

/**
 * Individual step in a pattern
 */
export interface PatternStep {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  order: number;
  optional?: boolean;
  dependencies?: string[]; // IDs of other steps this depends on
  validation?: {
    rules: string[];
    tests?: string[];
  };
}

/**
 * Pattern constraint
 */
export interface PatternConstraint {
  id: string;
  type: 'performance' | 'security' | 'compatibility' | 'resource' | 'business';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

/**
 * Pattern metric
 */
export interface PatternMetric {
  name: string;
  description: string;
  target?: number | string;
  unit?: string;
  measurement?: 'time' | 'count' | 'percentage' | 'size' | 'custom';
  threshold?: {
    min?: number;
    max?: number;
    warning?: number;
    critical?: number;
  };
}

/**
 * Pattern example with context
 */
export interface PatternExample {
  id: string;
  title: string;
  description: string;
  context: {
    scenario: string;
    prerequisites: string[];
    environment?: string;
    dataSize?: string;
  };
  implementation: {
    code: string;
    language: string;
    files?: Array<{
      path: string;
      content: string;
      description?: string;
    }>;
  };
  results: {
    expected: string;
    metrics?: Record<string, any>;
    screenshots?: string[];
    logs?: string[];
  };
  variations?: Array<{
    name: string;
    description: string;
    changes: string[];
    code?: string;
  }>;
}

/**
 * Function pattern (main entity in notebook)
 */
export interface FunctionPattern {
  id: string;
  version: string;
  name: string;
  description: string;
  category: PatternCategory;
  complexity: PatternComplexity;
  tags: string[];
  
  // Core pattern definition
  steps: PatternStep[];
  constraints: PatternConstraint[];
  metrics: PatternMetric[];
  examples: PatternExample[];
  
  // Dependencies and relationships
  dependencies: {
    patterns: string[]; // Other pattern IDs
    libraries: string[];
    tools: string[];
    services: string[];
  };
  relatedPatterns: string[];
  
  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    approvalStatus: ApprovalStatus;
    approvedBy?: string;
    approvedAt?: Date;
    
    // Usage statistics
    usageCount: number;
    successRate: number;
    averageRating: number;
    lastUsed?: Date;
    
    // Quality metrics
    completeness: number; // 0-1
    accuracy: number; // 0-1
    clarity: number; // 0-1
    
    // Source information
    sourceSnippets: string[]; // Snippet IDs that contributed to this pattern
    sourceFiles: string[];
    sourceProjects: string[];
    
    // Versioning
    previousVersions: string[];
    changeLog: Array<{
      version: string;
      date: Date;
      author: string;
      changes: string[];
      reason: string;
    }>;
  };
  
  // AI-specific information
  aiContext: {
    recommendedFor: string[]; // AI agent types or scenarios
    difficulty: number; // 1-10
    estimatedImplementationTime: number; // in minutes
    commonMistakes: string[];
    troubleshooting: Array<{
      issue: string;
      solution: string;
      prevention?: string;
    }>;
  };
}

/**
 * Configuration for the FunctionNotebook
 */
export interface NotebookConfig {
  storagePath: string;
  maxPatterns: number;
  maxSteps: number;
  autoSave: boolean;
  autoSaveInterval: number;
  enableVersioning: boolean;
  defaultApprovalStatus: ApprovalStatus;
}

/**
 * Pattern complexity levels
 */
export enum PatternComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  ADVANCED = 'advanced'
}

/**
 * Approval status for patterns
 */
export enum ApprovalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DEPRECATED = 'deprecated'
}

/**
 * Function Notebook class for managing patterns
 */
export class FunctionNotebook extends EventEmitter {
  private patterns: FunctionPattern[] = [];
  private logger: Logger;
  private autoSaveTimer: NodeJS.Timeout | null = null;

  constructor(private config: NotebookConfig) {
    super();
    this.logger = new Logger('FunctionNotebook');
    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Initialize the notebook by loading patterns from storage
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });
      const files = await fs.readdir(this.config.storagePath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.storagePath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const pattern = JSON.parse(content) as FunctionPattern;
          this.patterns.push(pattern);
        }
      }
      this.logger.info(`Loaded ${this.patterns.length} patterns.`);
      this.emit('initialized', { patternCount: this.patterns.length });
    } catch (error) {
      this.logger.error('Failed to initialize notebook:', error);
      throw error;
    }
  }

  /**
   * Delete a pattern by its ID
   */
  async deletePattern(id: string): Promise<void> {
    const index = this.patterns.findIndex(p => p.id === id);
    if (index > -1) {
      this.patterns.splice(index, 1);
      const filePath = path.join(this.config.storagePath, `${id}.json`);
      try {
        await fs.unlink(filePath);
        this.logger.info(`Pattern ${id} deleted.`);
        this.emit('pattern.deleted', { id });
      } catch (error) {
        this.logger.error(`Failed to delete pattern file for ${id}:`, error);
      }
    }
  }

  /**
   * Find patterns based on criteria
   */
  findPatterns(criteria: Partial<FunctionPattern>): FunctionPattern[] {
    return this.patterns.filter(pattern => {
      return Object.keys(criteria).every(key => {
        return pattern[key as keyof FunctionPattern] === criteria[key as keyof FunctionPattern];
      });
    });
  }

  /**
   * Search patterns with filters
   */
  searchPatterns(query?: string, filters?: {
    language?: string;
    category?: PatternCategory;
    complexity?: PatternComplexity;
    approvalStatus?: ApprovalStatus;
    limit?: number;
  }): FunctionPattern[] {
    let results = [...this.patterns];
    
    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(pattern => 
        pattern.name.toLowerCase().includes(queryLower) ||
        pattern.description.toLowerCase().includes(queryLower) ||
        pattern.tags.some(tag => tag.toLowerCase().includes(queryLower))
      );
    }
    
    if (filters?.category) {
      results = results.filter(pattern => pattern.category === filters.category);
    }
    
    if (filters?.complexity) {
      results = results.filter(pattern => pattern.complexity === filters.complexity);
    }
    
    if (filters?.approvalStatus) {
      results = results.filter(pattern => pattern.metadata.approvalStatus === filters.approvalStatus);
    }
    
    // Sort by usage count and rating
    results.sort((a, b) => {
      const scoreA = a.metadata.usageCount * a.metadata.averageRating;
      const scoreB = b.metadata.usageCount * b.metadata.averageRating;
      return scoreB - scoreA;
    });
    
    if (filters?.limit) {
      results = results.slice(0, filters.limit);
    }
    
    return results;
  }

  /**
   * Generate a new pattern from a code snippet
   */
  async generatePatternFromSnippet(snippet: CodeSnippet, metadata: Partial<FunctionPattern>): Promise<FunctionPattern> {
    const newPattern: FunctionPattern = {
      id: `pattern-${Date.now()}`,
      version: '1.0.0',
      name: `New Pattern from ${snippet.metadata.sourceFiles[0] || 'unknown'}`,
      description: `Auto-generated pattern from snippet ${snippet.id}`,
      category: PatternCategory.UTILITIES,
      complexity: PatternComplexity.SIMPLE,
      tags: ['auto-generated', snippet.language],
      steps: [
        {
          id: 'step-1',
          title: 'Initial Implementation',
          description: 'The core logic from the source snippet.',
          code: snippet.template,
          language: snippet.language,
          order: 1
        }
      ],
      constraints: [],
      metrics: [],
      examples: [],
      dependencies: {
        patterns: [],
        libraries: [],
        tools: [],
        services: []
      },
      relatedPatterns: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        updatedBy: 'system',
        approvalStatus: this.config.defaultApprovalStatus,
        usageCount: 0,
        successRate: 1,
        averageRating: 0,
        completeness: 0.5,
        accuracy: 0.5,
        clarity: 0.5,
        sourceSnippets: [snippet.id],
        sourceFiles: snippet.metadata.sourceFiles,
        sourceProjects: [],
        previousVersions: [],
        changeLog: []
      },
      aiContext: {
        recommendedFor: [],
        difficulty: 3,
        estimatedImplementationTime: 15,
        commonMistakes: [],
        troubleshooting: []
      },
      ...metadata
    };

    this.addPattern(newPattern);
    return newPattern;
  }

  /**
   * Evolve a pattern by incorporating a new snippet or feedback
   */
  async evolvePattern(
    patternId: string,
    evolutionSource: { snippet?: CodeSnippet; feedback?: string },
    updatedBy: string
  ): Promise<FunctionPattern> {
    const pattern = this.getPatternById(patternId);
    if (!pattern) {
      throw new Error(`Pattern with id ${patternId} not found.`);
    }

    // Create a new version of the pattern
    const newVersion = this.incrementVersion(pattern.version);
    const evolvedPattern: FunctionPattern = {
      ...pattern,
      version: newVersion,
      metadata: {
        ...pattern.metadata,
        updatedAt: new Date(),
        updatedBy,
        changeLog: [
          ...pattern.metadata.changeLog,
          {
            version: newVersion,
            date: new Date(),
            author: updatedBy,
            changes: evolutionSource.snippet ? ['Incorporated new snippet'] : ['Incorporated feedback'],
            reason: evolutionSource.feedback || `Evolved with snippet ${evolutionSource.snippet?.id}`
          }
        ]
      }
    };

    if (evolutionSource.snippet) {
      // Add new step or modify existing one based on the snippet
      evolvedPattern.steps.push({
        id: `step-${Date.now()}`,
        title: 'Evolution Step',
        description: `Incorporating snippet ${evolutionSource.snippet.id}`,
        code: evolutionSource.snippet.template,
        language: evolutionSource.snippet.language,
        order: evolvedPattern.steps.length
      });
      evolvedPattern.metadata.sourceSnippets.push(evolutionSource.snippet.id);
    }

    if (evolutionSource.feedback) {
      // Add a note or modify description based on feedback
      const feedbackStep: PatternStep = {
        id: `step-feedback-${Date.now()}`,
        title: 'User Feedback Incorporation',
        description: `Feedback: ${evolutionSource.feedback}`,
        code: '// Feedback incorporated into pattern',
        language: 'javascript',
        order: evolvedPattern.steps.length
      };
      evolvedPattern.steps.push(feedbackStep);
    }

    this.updatePattern(evolvedPattern);
    return evolvedPattern;
  }

  /**
   * Increment pattern version (e.g., 1.0.0 -> 1.0.1)
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2]++;
    return parts.join('.');
  }

  /**
   * Get notebook statistics
   */
  getStatistics() {
    const totalPatterns = this.patterns.length;
    const patternsByCategory = this.patterns.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const patternsByComplexity = this.patterns.reduce((acc, p) => {
      acc[p.complexity] = (acc[p.complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalSteps = this.patterns.reduce((sum, p) => sum + p.steps.length, 0);

    return {
      totalPatterns,
      patternsByCategory,
      patternsByComplexity,
      totalSteps,
      averageStepsPerPattern: totalPatterns > 0 ? totalSteps / totalPatterns : 0
    };
  }

  /**
   * Export patterns to a JSON file
   */
  async exportPatterns(filePath: string): Promise<void> {
    try {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        patterns: this.patterns
      };
      
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      this.logger.info(`Exported ${this.patterns.length} patterns to ${filePath}`);
    } catch (error) {
      this.logger.error('Failed to export patterns:', error);
      throw error;
    }
  }

  /**
   * Import patterns from a JSON file
   */
  async importPatterns(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const importData = JSON.parse(content);
      
      if (importData.patterns && Array.isArray(importData.patterns)) {
        this.patterns = importData.patterns;
        this.logger.info(`Imported ${this.patterns.length} patterns from ${filePath}`);
        this.emit('patterns.imported', { count: this.patterns.length });
      } else {
        throw new Error('Invalid import file format');
      }
    } catch (error) {
      this.logger.error('Failed to initialize notebook:', error);
      throw error;
    }
  }

  /**
   * Start auto-saving process
   */
  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(async () => {
      await this.saveAllPatterns();
    }, this.config.autoSaveInterval);
    this.logger.info(`Auto-save enabled every ${this.config.autoSaveInterval / 1000} seconds.`);
  }

  /**
   * Stop auto-saving process
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.logger.info('Auto-save stopped.');
  }

  /**
   * Save all patterns to storage
   */
  private async saveAllPatterns(): Promise<void> {
    for (const pattern of this.patterns) {
      await this.savePattern(pattern);
    }
    this.logger.info('All patterns saved.');
    this.emit('saved');
  }

  /**
   * Save a single pattern to a file
   */
  async savePattern(pattern: FunctionPattern): Promise<void> {
    const filePath = path.join(this.config.storagePath, `${pattern.id}.json`);
    try {
      const content = JSON.stringify(pattern, null, 2);
      await fs.writeFile(filePath, content, 'utf-8');
      this.logger.info(`Pattern ${pattern.id} saved to ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to save pattern ${pattern.id}:`, error);
    }
  }

  /**
   * Add a new pattern to the notebook
   */
  addPattern(pattern: FunctionPattern): void {
    if (this.patterns.length >= this.config.maxPatterns) {
      console.warn(`Pattern limit reached (${this.config.maxPatterns}). Cannot add new pattern.`);
      return;
    }
    this.patterns.push(pattern);
  }

  /**
   * Get a pattern by its ID
   */
  getPatternById(id: string): FunctionPattern | undefined {
    return this.patterns.find(p => p.id === id);
  }

  /**
   * Get all patterns in the notebook
   */
  getAllPatterns(): FunctionPattern[] {
    return [...this.patterns];
  }

  /**
   * Update an existing pattern
   */
  updatePattern(updatedPattern: FunctionPattern): void {
    const index = this.patterns.findIndex(p => p.id === updatedPattern.id);
    if (index === -1) {
      throw new Error(`Pattern with id ${updatedPattern.id} not found.`);
    }

    if (this.config.enableVersioning) {
      const oldPattern = this.patterns[index];
      updatedPattern.metadata.previousVersions.push(oldPattern.version);
      updatedPattern.metadata.changeLog.push({
        version: updatedPattern.version,
        date: new Date(),
        author: updatedPattern.metadata.updatedBy,
        changes: ['Pattern updated'], // Basic change log, can be improved
        reason: 'General update'
      });
    }

    updatedPattern.metadata.updatedAt = new Date();
    this.patterns[index] = updatedPattern;
    this.emit('pattern.updated', updatedPattern);
  }

  /**
   * Get recommended patterns based on context
   */
  getRecommendedPatterns(context?: any): FunctionPattern[] {
    // Return top patterns sorted by usage count and rating
    return this.patterns
      .filter(p => p.metadata.approvalStatus === ApprovalStatus.APPROVED)
      .sort((a, b) => {
        const scoreA = (a.metadata.usageCount * 0.7) + (a.metadata.averageRating * 0.3);
        const scoreB = (b.metadata.usageCount * 0.7) + (b.metadata.averageRating * 0.3);
        return scoreB - scoreA;
      })
      .slice(0, 10); // Return top 10 recommendations
  }
}

export default FunctionNotebook;