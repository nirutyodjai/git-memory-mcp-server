/**
 * Auto-Fix Fixer
 * 
 * Generates and applies fixes for detected issues. Works with the Detector
 * to create patches, update tests, and prepare changes for verification.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Logger } from '../3d-sco/lib/monitoring/logging';
import { Issue, IssueType, IssueSeverity, IssueStatus } from './Detector';

// Fix types and strategies
export enum FixType {
  PATCH = 'patch',
  REPLACEMENT = 'replacement',
  INSERTION = 'insertion',
  DELETION = 'deletion',
  REFACTOR = 'refactor',
  CONFIGURATION = 'configuration',
  DEPENDENCY = 'dependency'
}

export enum FixStrategy {
  CONSERVATIVE = 'conservative', // Minimal changes, high confidence
  STANDARD = 'standard',        // Balanced approach
  AGGRESSIVE = 'aggressive'     // More comprehensive fixes
}

export enum FixStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  GENERATED = 'generated',
  APPLYING = 'applying',
  APPLIED = 'applied',
  TESTING = 'testing',
  VERIFIED = 'verified',
  FAILED = 'failed',
  REJECTED = 'rejected'
}

// Core interfaces
export interface FixAction {
  type: FixType;
  file: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
  originalContent?: string;
  newContent: string;
  description: string;
  confidence: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TestUpdate {
  file: string;
  type: 'create' | 'update' | 'delete';
  content?: string;
  description: string;
  reason: string;
}

export interface Fix {
  id: string;
  issueId: string;
  type: FixType;
  strategy: FixStrategy;
  status: FixStatus;
  title: string;
  description: string;
  actions: FixAction[];
  testUpdates: TestUpdate[];
  estimatedImpact: {
    filesChanged: number;
    linesChanged: number;
    testsAffected: number;
    riskScore: number; // 0-1
  };
  metadata: {
    generatedBy: string;
    generatedAt: number;
    appliedAt?: number;
    verifiedAt?: number;
    rollbackInfo?: {
      backupPath: string;
      originalFiles: Record<string, string>;
    };
    aiModel?: string;
    confidence: number;
    reviewRequired: boolean;
  };
  validation: {
    syntaxCheck: boolean;
    testsPassing: boolean;
    lintPassing: boolean;
    securityCheck: boolean;
  };
}

export interface FixerConfig {
  // Strategy settings
  defaultStrategy: FixStrategy;
  
  // AI/LLM settings
  aiProvider: {
    enabled: boolean;
    model: string;
    apiKey?: string;
    endpoint?: string;
    maxTokens: number;
    temperature: number;
  };
  
  // Safety settings
  safety: {
    requireBackup: boolean;
    maxFilesPerFix: number;
    maxLinesPerFix: number;
    allowedFileTypes: string[];
    forbiddenPaths: string[];
    requireReview: {
      [key in IssueSeverity]: boolean;
    };
  };
  
  // Validation settings
  validation: {
    runSyntaxCheck: boolean;
    runTests: boolean;
    runLinter: boolean;
    runSecurityScan: boolean;
    testTimeout: number; // milliseconds
  };
  
  // Performance settings
  concurrency: {
    maxConcurrentFixes: number;
    maxConcurrentValidations: number;
  };
  
  // Template settings
  templates: {
    enabled: boolean;
    customTemplates: Record<string, FixTemplate>;
  };
}

export interface FixTemplate {
  id: string;
  name: string;
  description: string;
  issueTypes: IssueType[];
  pattern: RegExp;
  replacement: string | ((match: RegExpMatchArray, context: any) => string);
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  testTemplate?: string;
}

export interface FixResult {
  fix: Fix;
  success: boolean;
  error?: string;
  warnings: string[];
  metrics: {
    generationTime: number;
    applicationTime: number;
    validationTime: number;
    totalTime: number;
  };
}

/**
 * Auto-Fix Fixer
 * 
 * Generates and applies fixes for detected issues
 */
export class Fixer extends EventEmitter {
  private config: FixerConfig;
  private logger: Logger;
  private fixes: Map<string, Fix> = new Map();
  private activeFixJobs: Map<string, Promise<FixResult>> = new Map();
  private templates: Map<string, FixTemplate> = new Map();
  private statistics = {
    totalGenerated: 0,
    totalApplied: 0,
    totalSuccessful: 0,
    totalFailed: 0,
    averageConfidence: 0,
    averageGenerationTime: 0,
    averageApplicationTime: 0,
    byType: {} as Record<FixType, number>,
    byStrategy: {} as Record<FixStrategy, number>
  };

  constructor(config: FixerConfig, logger?: Logger) {
    super();
    this.config = config;
    this.logger = logger || new Logger('Fixer');
    
    // Load built-in templates
    this.loadBuiltInTemplates();
    
    // Load custom templates
    if (config.templates.enabled) {
      this.loadCustomTemplates();
    }
  }

  /**
   * Initialize the fixer
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Auto-Fix Fixer...');
    
    // Validate AI provider configuration
    if (this.config.aiProvider.enabled) {
      await this.validateAIProvider();
    }
    
    this.logger.info('Auto-Fix Fixer initialized successfully');
  }

  /**
   * Generate a fix for an issue
   */
  async generateFix(
    issue: Issue,
    strategy: FixStrategy = this.config.defaultStrategy
  ): Promise<Fix> {
    const startTime = Date.now();
    
    this.logger.info(`Generating fix for issue ${issue.id} using ${strategy} strategy`);
    
    // Check if fix is already being generated
    if (this.activeFixJobs.has(issue.id)) {
      throw new Error(`Fix generation already in progress for issue ${issue.id}`);
    }
    
    // Create fix object
    const fix: Fix = {
      id: `fix_${issue.id}_${Date.now()}`,
      issueId: issue.id,
      type: this.inferFixType(issue),
      strategy,
      status: FixStatus.GENERATING,
      title: `Fix for: ${issue.title}`,
      description: `Auto-generated fix for ${issue.type} in ${issue.location.file}`,
      actions: [],
      testUpdates: [],
      estimatedImpact: {
        filesChanged: 0,
        linesChanged: 0,
        testsAffected: 0,
        riskScore: 0
      },
      metadata: {
        generatedBy: 'auto-fixer',
        generatedAt: Date.now(),
        aiModel: this.config.aiProvider.model,
        confidence: 0,
        reviewRequired: this.config.safety.requireReview[issue.severity]
      },
      validation: {
        syntaxCheck: false,
        testsPassing: false,
        lintPassing: false,
        securityCheck: false
      }
    };
    
    try {
      // Store fix
      this.fixes.set(fix.id, fix);
      
      // Generate fix actions
      const actions = await this.generateFixActions(issue, strategy);
      fix.actions = actions;
      
      // Generate test updates if needed
      const testUpdates = await this.generateTestUpdates(issue, actions);
      fix.testUpdates = testUpdates;
      
      // Calculate estimated impact
      fix.estimatedImpact = this.calculateEstimatedImpact(actions, testUpdates);
      
      // Calculate confidence
      fix.metadata.confidence = this.calculateConfidence(issue, actions);
      
      // Update status
      fix.status = FixStatus.GENERATED;
      
      // Update statistics
      this.updateStatistics(fix, Date.now() - startTime);
      
      this.emit('fix_generated', fix);
      this.logger.info(`Fix generated successfully: ${fix.id}`);
      
      return fix;
      
    } catch (error) {
      fix.status = FixStatus.FAILED;
      this.logger.error(`Failed to generate fix for issue ${issue.id}:`, error);
      throw error;
    }
  }

  /**
   * Apply a generated fix
   */
  async applyFix(fixId: string): Promise<FixResult> {
    const startTime = Date.now();
    const fix = this.fixes.get(fixId);
    
    if (!fix) {
      throw new Error(`Fix not found: ${fixId}`);
    }
    
    if (fix.status !== FixStatus.GENERATED) {
      throw new Error(`Fix ${fixId} is not ready for application (status: ${fix.status})`);
    }
    
    this.logger.info(`Applying fix: ${fixId}`);
    
    const result: FixResult = {
      fix,
      success: false,
      warnings: [],
      metrics: {
        generationTime: 0,
        applicationTime: 0,
        validationTime: 0,
        totalTime: 0
      }
    };
    
    try {
      fix.status = FixStatus.APPLYING;
      
      // Create backup if required
      if (this.config.safety.requireBackup) {
        await this.createBackup(fix);
      }
      
      // Apply fix actions
      const applicationStartTime = Date.now();
      await this.applyFixActions(fix.actions);
      result.metrics.applicationTime = Date.now() - applicationStartTime;
      
      // Apply test updates
      if (fix.testUpdates.length > 0) {
        await this.applyTestUpdates(fix.testUpdates);
      }
      
      fix.status = FixStatus.APPLIED;
      fix.metadata.appliedAt = Date.now();
      
      // Run validation
      const validationStartTime = Date.now();
      const validationResult = await this.validateFix(fix);
      result.metrics.validationTime = Date.now() - validationStartTime;
      
      fix.validation = validationResult;
      
      if (this.isValidationSuccessful(validationResult)) {
        fix.status = FixStatus.VERIFIED;
        fix.metadata.verifiedAt = Date.now();
        result.success = true;
        this.statistics.totalSuccessful++;
      } else {
        fix.status = FixStatus.FAILED;
        result.success = false;
        result.error = 'Validation failed';
        result.warnings.push('Fix validation failed, consider rollback');
        this.statistics.totalFailed++;
      }
      
    } catch (error) {
      fix.status = FixStatus.FAILED;
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      this.statistics.totalFailed++;
      
      // Attempt rollback if backup exists
      if (fix.metadata.rollbackInfo) {
        try {
          await this.rollbackFix(fix);
          result.warnings.push('Fix rolled back due to error');
        } catch (rollbackError) {
          result.warnings.push('Failed to rollback fix');
          this.logger.error('Rollback failed:', rollbackError);
        }
      }
    }
    
    result.metrics.totalTime = Date.now() - startTime;
    this.statistics.totalApplied++;
    
    this.emit('fix_applied', result);
    return result;
  }

  /**
   * Get fix by ID
   */
  getFix(id: string): Fix | undefined {
    return this.fixes.get(id);
  }

  /**
   * Get all fixes with optional filtering
   */
  getFixes(filters?: {
    issueId?: string;
    status?: FixStatus[];
    type?: FixType[];
    strategy?: FixStrategy[];
  }): Fix[] {
    let fixes = Array.from(this.fixes.values());
    
    if (filters) {
      if (filters.issueId) {
        fixes = fixes.filter(fix => fix.issueId === filters.issueId);
      }
      if (filters.status) {
        fixes = fixes.filter(fix => filters.status!.includes(fix.status));
      }
      if (filters.type) {
        fixes = fixes.filter(fix => filters.type!.includes(fix.type));
      }
      if (filters.strategy) {
        fixes = fixes.filter(fix => filters.strategy!.includes(fix.strategy));
      }
    }
    
    return fixes.sort((a, b) => b.metadata.generatedAt - a.metadata.generatedAt);
  }

  /**
   * Rollback a fix
   */
  async rollbackFix(fix: Fix): Promise<void> {
    if (!fix.metadata.rollbackInfo) {
      throw new Error('No rollback information available');
    }
    
    this.logger.info(`Rolling back fix: ${fix.id}`);
    
    // Restore original files
    for (const [filePath, originalContent] of Object.entries(fix.metadata.rollbackInfo.originalFiles)) {
      await fs.writeFile(filePath, originalContent, 'utf8');
    }
    
    fix.status = FixStatus.REJECTED;
    this.emit('fix_rolled_back', fix);
  }

  /**
   * Get fixer statistics
   */
  getStatistics(): typeof this.statistics {
    return { ...this.statistics };
  }

  // Private methods

  private loadBuiltInTemplates(): void {
    // Load common fix templates
    const builtInTemplates: FixTemplate[] = [
      {
        id: 'missing_semicolon',
        name: 'Missing Semicolon',
        description: 'Add missing semicolon at end of statement',
        issueTypes: [IssueType.SYNTAX_ERROR, IssueType.LINT_ERROR],
        pattern: /(.+)(?<!;)\s*$/,
        replacement: '$1;',
        confidence: 0.9,
        riskLevel: 'low'
      },
      {
        id: 'unused_import',
        name: 'Remove Unused Import',
        description: 'Remove unused import statement',
        issueTypes: [IssueType.LINT_WARNING],
        pattern: /^import\s+.*?\s+from\s+['"].*?['"];?\s*$/m,
        replacement: '',
        confidence: 0.8,
        riskLevel: 'low'
      },
      {
        id: 'missing_return_type',
        name: 'Add Return Type',
        description: 'Add explicit return type to function',
        issueTypes: [IssueType.TYPE_ERROR, IssueType.LINT_WARNING],
        pattern: /function\s+(\w+)\s*\([^)]*\)\s*{/,
        replacement: 'function $1(): void {',
        confidence: 0.7,
        riskLevel: 'medium'
      }
    ];
    
    for (const template of builtInTemplates) {
      this.templates.set(template.id, template);
    }
  }

  private loadCustomTemplates(): void {
    for (const [id, template] of Object.entries(this.config.templates.customTemplates)) {
      this.templates.set(id, template);
    }
  }

  private async validateAIProvider(): Promise<void> {
    if (!this.config.aiProvider.apiKey && !this.config.aiProvider.endpoint) {
      throw new Error('AI provider requires either API key or endpoint');
    }
    
    // TODO: Test AI provider connection
    this.logger.debug('AI provider validation passed');
  }

  private inferFixType(issue: Issue): FixType {
    switch (issue.type) {
      case IssueType.SYNTAX_ERROR:
      case IssueType.LINT_ERROR:
      case IssueType.TYPE_ERROR:
        return FixType.PATCH;
      case IssueType.TEST_FAILURE:
        return FixType.REFACTOR;
      case IssueType.DEPENDENCY_ISSUE:
        return FixType.DEPENDENCY;
      case IssueType.SECURITY_VULNERABILITY:
        return FixType.REPLACEMENT;
      default:
        return FixType.PATCH;
    }
  }

  private async generateFixActions(
    issue: Issue,
    strategy: FixStrategy
  ): Promise<FixAction[]> {
    const actions: FixAction[] = [];
    
    // Try template-based fixes first
    const templateAction = await this.tryTemplateFix(issue);
    if (templateAction) {
      actions.push(templateAction);
      return actions;
    }
    
    // Use AI-based fix generation if enabled
    if (this.config.aiProvider.enabled) {
      const aiActions = await this.generateAIFix(issue, strategy);
      actions.push(...aiActions);
    }
    
    // Fallback to heuristic-based fixes
    if (actions.length === 0) {
      const heuristicActions = await this.generateHeuristicFix(issue, strategy);
      actions.push(...heuristicActions);
    }
    
    return actions;
  }

  private async tryTemplateFix(issue: Issue): Promise<FixAction | null> {
    for (const template of this.templates.values()) {
      if (!template.issueTypes.includes(issue.type)) {
        continue;
      }
      
      // Read file content
      const fileContent = await fs.readFile(issue.location.file, 'utf8');
      const lines = fileContent.split('\n');
      
      if (issue.location.line && issue.location.line <= lines.length) {
        const line = lines[issue.location.line - 1];
        const match = line.match(template.pattern);
        
        if (match) {
          const replacement = typeof template.replacement === 'function'
            ? template.replacement(match, { issue, line, lines })
            : line.replace(template.pattern, template.replacement);
          
          return {
            type: FixType.REPLACEMENT,
            file: issue.location.file,
            startLine: issue.location.line,
            endLine: issue.location.line,
            originalContent: line,
            newContent: replacement,
            description: template.description,
            confidence: template.confidence,
            riskLevel: template.riskLevel
          };
        }
      }
    }
    
    return null;
  }

  private async generateAIFix(
    issue: Issue,
    strategy: FixStrategy
  ): Promise<FixAction[]> {
    // TODO: Implement AI-based fix generation
    // This would call the configured AI provider with the issue context
    // and generate appropriate fix actions
    
    this.logger.debug(`AI fix generation not implemented yet for issue ${issue.id}`);
    return [];
  }

  private async generateHeuristicFix(
    issue: Issue,
    strategy: FixStrategy
  ): Promise<FixAction[]> {
    const actions: FixAction[] = [];
    
    // Simple heuristic fixes based on issue type
    switch (issue.type) {
      case IssueType.LINT_ERROR:
        // Try common lint fixes
        if (issue.title.includes('semicolon')) {
          actions.push(await this.createSemicolonFix(issue));
        }
        break;
        
      case IssueType.SYNTAX_ERROR:
        // Try common syntax fixes
        if (issue.title.includes('bracket') || issue.title.includes('brace')) {
          actions.push(await this.createBracketFix(issue));
        }
        break;
    }
    
    return actions;
  }

  private async createSemicolonFix(issue: Issue): Promise<FixAction> {
    const fileContent = await fs.readFile(issue.location.file, 'utf8');
    const lines = fileContent.split('\n');
    const lineIndex = (issue.location.line || 1) - 1;
    const line = lines[lineIndex];
    
    return {
      type: FixType.REPLACEMENT,
      file: issue.location.file,
      startLine: issue.location.line,
      endLine: issue.location.line,
      originalContent: line,
      newContent: line.trimEnd() + ';',
      description: 'Add missing semicolon',
      confidence: 0.9,
      riskLevel: 'low'
    };
  }

  private async createBracketFix(issue: Issue): Promise<FixAction> {
    // TODO: Implement bracket/brace fixing logic
    throw new Error('Bracket fix not implemented');
  }

  private async generateTestUpdates(
    issue: Issue,
    actions: FixAction[]
  ): Promise<TestUpdate[]> {
    const updates: TestUpdate[] = [];
    
    // TODO: Implement test update generation
    // This would analyze the fix actions and determine if tests need to be updated
    
    return updates;
  }

  private calculateEstimatedImpact(
    actions: FixAction[],
    testUpdates: TestUpdate[]
  ): Fix['estimatedImpact'] {
    const filesChanged = new Set([...actions.map(a => a.file), ...testUpdates.map(t => t.file)]).size;
    const linesChanged = actions.reduce((sum, action) => {
      const startLine = action.startLine || 1;
      const endLine = action.endLine || startLine;
      return sum + (endLine - startLine + 1);
    }, 0);
    
    const testsAffected = testUpdates.length;
    
    // Calculate risk score based on various factors
    const riskScore = Math.min(1, (
      (filesChanged * 0.1) +
      (linesChanged * 0.01) +
      (testsAffected * 0.2) +
      (actions.some(a => a.riskLevel === 'high') ? 0.5 : 0) +
      (actions.some(a => a.riskLevel === 'medium') ? 0.2 : 0)
    ));
    
    return {
      filesChanged,
      linesChanged,
      testsAffected,
      riskScore
    };
  }

  private calculateConfidence(issue: Issue, actions: FixAction[]): number {
    if (actions.length === 0) return 0;
    
    const avgConfidence = actions.reduce((sum, action) => sum + action.confidence, 0) / actions.length;
    
    // Adjust confidence based on issue complexity
    let adjustment = 1;
    if (issue.severity === IssueSeverity.CRITICAL) adjustment *= 0.8;
    if (issue.type === IssueType.SECURITY_VULNERABILITY) adjustment *= 0.7;
    if (actions.some(a => a.riskLevel === 'high')) adjustment *= 0.8;
    
    return Math.min(1, avgConfidence * adjustment);
  }

  private async createBackup(fix: Fix): Promise<void> {
    const backupDir = path.join(process.cwd(), '.auto-fix-backups', fix.id);
    await fs.mkdir(backupDir, { recursive: true });
    
    const originalFiles: Record<string, string> = {};
    
    for (const action of fix.actions) {
      if (!originalFiles[action.file]) {
        const content = await fs.readFile(action.file, 'utf8');
        originalFiles[action.file] = content;
        
        // Save backup file
        const backupFile = path.join(backupDir, path.basename(action.file));
        await fs.writeFile(backupFile, content, 'utf8');
      }
    }
    
    fix.metadata.rollbackInfo = {
      backupPath: backupDir,
      originalFiles
    };
  }

  private async applyFixActions(actions: FixAction[]): Promise<void> {
    // Group actions by file
    const actionsByFile = new Map<string, FixAction[]>();
    for (const action of actions) {
      if (!actionsByFile.has(action.file)) {
        actionsByFile.set(action.file, []);
      }
      actionsByFile.get(action.file)!.push(action);
    }
    
    // Apply actions file by file
    for (const [filePath, fileActions] of actionsByFile) {
      await this.applyFileActions(filePath, fileActions);
    }
  }

  private async applyFileActions(filePath: string, actions: FixAction[]): Promise<void> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Sort actions by line number (descending) to avoid line number shifts
    const sortedActions = actions.sort((a, b) => (b.startLine || 0) - (a.startLine || 0));
    
    for (const action of sortedActions) {
      switch (action.type) {
        case FixType.REPLACEMENT:
          if (action.startLine && action.endLine) {
            const startIdx = action.startLine - 1;
            const endIdx = action.endLine - 1;
            lines.splice(startIdx, endIdx - startIdx + 1, action.newContent);
          }
          break;
          
        case FixType.INSERTION:
          if (action.startLine) {
            lines.splice(action.startLine - 1, 0, action.newContent);
          }
          break;
          
        case FixType.DELETION:
          if (action.startLine && action.endLine) {
            const startIdx = action.startLine - 1;
            const endIdx = action.endLine - 1;
            lines.splice(startIdx, endIdx - startIdx + 1);
          }
          break;
      }
    }
    
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
  }

  private async applyTestUpdates(updates: TestUpdate[]): Promise<void> {
    for (const update of updates) {
      switch (update.type) {
        case 'create':
          if (update.content) {
            await fs.writeFile(update.file, update.content, 'utf8');
          }
          break;
          
        case 'update':
          if (update.content) {
            await fs.writeFile(update.file, update.content, 'utf8');
          }
          break;
          
        case 'delete':
          await fs.unlink(update.file);
          break;
      }
    }
  }

  private async validateFix(fix: Fix): Promise<Fix['validation']> {
    const validation: Fix['validation'] = {
      syntaxCheck: false,
      testsPassing: false,
      lintPassing: false,
      securityCheck: false
    };
    
    try {
      // Run syntax check
      if (this.config.validation.runSyntaxCheck) {
        validation.syntaxCheck = await this.runSyntaxCheck(fix);
      }
      
      // Run tests
      if (this.config.validation.runTests) {
        validation.testsPassing = await this.runTests(fix);
      }
      
      // Run linter
      if (this.config.validation.runLinter) {
        validation.lintPassing = await this.runLinter(fix);
      }
      
      // Run security scan
      if (this.config.validation.runSecurityScan) {
        validation.securityCheck = await this.runSecurityScan(fix);
      }
      
    } catch (error) {
      this.logger.error('Validation error:', error);
    }
    
    return validation;
  }

  private async runSyntaxCheck(fix: Fix): Promise<boolean> {
    // TODO: Implement syntax checking for affected files
    return true;
  }

  private async runTests(fix: Fix): Promise<boolean> {
    // TODO: Implement test running
    return true;
  }

  private async runLinter(fix: Fix): Promise<boolean> {
    // TODO: Implement linting
    return true;
  }

  private async runSecurityScan(fix: Fix): Promise<boolean> {
    // TODO: Implement security scanning
    return true;
  }

  private isValidationSuccessful(validation: Fix['validation']): boolean {
    return validation.syntaxCheck && 
           validation.testsPassing && 
           validation.lintPassing && 
           validation.securityCheck;
  }

  private updateStatistics(fix: Fix, generationTime: number): void {
    this.statistics.totalGenerated++;
    this.statistics.byType[fix.type] = (this.statistics.byType[fix.type] || 0) + 1;
    this.statistics.byStrategy[fix.strategy] = (this.statistics.byStrategy[fix.strategy] || 0) + 1;
    
    // Update averages
    const total = this.statistics.totalGenerated;
    this.statistics.averageConfidence = (
      (this.statistics.averageConfidence * (total - 1)) + fix.metadata.confidence
    ) / total;
    
    this.statistics.averageGenerationTime = (
      (this.statistics.averageGenerationTime * (total - 1)) + generationTime
    ) / total;
  }
}

// Default configuration
export const DEFAULT_FIXER_CONFIG: FixerConfig = {
  defaultStrategy: FixStrategy.STANDARD,
  
  aiProvider: {
    enabled: false,
    model: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.1
  },
  
  safety: {
    requireBackup: true,
    maxFilesPerFix: 10,
    maxLinesPerFix: 100,
    allowedFileTypes: ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.cs'],
    forbiddenPaths: ['node_modules', '.git', 'dist', 'build'],
    requireReview: {
      [IssueSeverity.CRITICAL]: true,
      [IssueSeverity.HIGH]: true,
      [IssueSeverity.MEDIUM]: false,
      [IssueSeverity.LOW]: false,
      [IssueSeverity.INFO]: false
    }
  },
  
  validation: {
    runSyntaxCheck: true,
    runTests: true,
    runLinter: true,
    runSecurityScan: false,
    testTimeout: 30000 // 30 seconds
  },
  
  concurrency: {
    maxConcurrentFixes: 3,
    maxConcurrentValidations: 2
  },
  
  templates: {
    enabled: true,
    customTemplates: {}
  }
};

export default Fixer;