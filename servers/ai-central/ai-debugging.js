const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../logger');

/**
 * AI Debugging Assistant for NEXUS IDE
 * Intelligent bug detection, analysis, and fix suggestions
 */
class AIDebugging extends EventEmitter {
  constructor(aiModelsIntegration, codeFeatures) {
    super();
    this.aiModels = aiModelsIntegration;
    this.codeFeatures = codeFeatures;
    
    // Debugging session management
    this.debuggingSessions = new Map();
    this.activeDebuggingSessions = new Set();
    
    // Error pattern database
    this.errorPatterns = new Map();
    this.commonFixes = new Map();
    this.bugCategories = new Map();
    
    // Performance tracking
    this.debuggingStats = {
      totalSessions: 0,
      bugsFound: 0,
      fixesApplied: 0,
      averageResolutionTime: 0,
      successRate: 0
    };
    
    // Cache for analysis results
    this.analysisCache = new Map();
    this.cacheTimeout = 600000; // 10 minutes
    
    this.initializeDebuggingService();
  }

  /**
   * Initialize debugging service
   */
  async initializeDebuggingService() {
    logger.info('Initializing AI Debugging Service');
    
    // Load error patterns
    await this.loadErrorPatterns();
    
    // Load common fixes
    await this.loadCommonFixes();
    
    // Load bug categories
    await this.loadBugCategories();
    
    logger.info('AI Debugging Service initialized successfully');
  }

  /**
   * Load common error patterns
   */
  async loadErrorPatterns() {
    const patterns = {
      javascript: {
        syntaxErrors: [
          {
            pattern: /Unexpected token/i,
            category: 'syntax',
            severity: 'high',
            description: 'Syntax error - unexpected token',
            commonCauses: ['Missing semicolon', 'Unclosed brackets', 'Invalid syntax']
          },
          {
            pattern: /Cannot read property .* of undefined/i,
            category: 'runtime',
            severity: 'high',
            description: 'Attempting to access property of undefined object',
            commonCauses: ['Null/undefined object', 'Async timing issue', 'Missing initialization']
          },
          {
            pattern: /is not a function/i,
            category: 'runtime',
            severity: 'high',
            description: 'Attempting to call non-function as function',
            commonCauses: ['Wrong variable type', 'Undefined function', 'Scope issue']
          }
        ],
        logicErrors: [
          {
            pattern: /infinite.*loop/i,
            category: 'logic',
            severity: 'critical',
            description: 'Infinite loop detected',
            commonCauses: ['Missing loop termination', 'Wrong condition', 'Counter not updated']
          },
          {
            pattern: /memory.*leak/i,
            category: 'performance',
            severity: 'medium',
            description: 'Potential memory leak',
            commonCauses: ['Event listeners not removed', 'Circular references', 'Large objects not cleared']
          }
        ]
      },
      
      python: {
        syntaxErrors: [
          {
            pattern: /IndentationError/i,
            category: 'syntax',
            severity: 'high',
            description: 'Incorrect indentation',
            commonCauses: ['Mixed tabs and spaces', 'Wrong indentation level', 'Missing colon']
          },
          {
            pattern: /NameError.*not defined/i,
            category: 'runtime',
            severity: 'high',
            description: 'Variable or function not defined',
            commonCauses: ['Typo in variable name', 'Variable not initialized', 'Scope issue']
          },
          {
            pattern: /AttributeError.*no attribute/i,
            category: 'runtime',
            severity: 'medium',
            description: 'Object has no such attribute',
            commonCauses: ['Wrong object type', 'Typo in attribute name', 'Missing import']
          }
        ]
      },
      
      java: {
        syntaxErrors: [
          {
            pattern: /NullPointerException/i,
            category: 'runtime',
            severity: 'high',
            description: 'Null pointer exception',
            commonCauses: ['Null object access', 'Uninitialized variable', 'Missing null check']
          },
          {
            pattern: /ArrayIndexOutOfBoundsException/i,
            category: 'runtime',
            severity: 'high',
            description: 'Array index out of bounds',
            commonCauses: ['Wrong array size', 'Off-by-one error', 'Missing bounds check']
          }
        ]
      }
    };
    
    for (const [language, languagePatterns] of Object.entries(patterns)) {
      this.errorPatterns.set(language, languagePatterns);
    }
  }

  /**
   * Load common fixes for known issues
   */
  async loadCommonFixes() {
    const fixes = {
      'undefined_property': {
        description: 'Fix undefined property access',
        fixes: [
          {
            type: 'null_check',
            template: 'if (${object} && ${object}.${property}) { ... }',
            description: 'Add null check before property access'
          },
          {
            type: 'optional_chaining',
            template: '${object}?.${property}',
            description: 'Use optional chaining (ES2020+)'
          },
          {
            type: 'default_value',
            template: '${object} = ${object} || {};',
            description: 'Provide default value'
          }
        ]
      },
      
      'function_not_defined': {
        description: 'Fix function not defined error',
        fixes: [
          {
            type: 'function_declaration',
            template: 'function ${functionName}() { ... }',
            description: 'Add function declaration'
          },
          {
            type: 'import_statement',
            template: 'import { ${functionName} } from "${module}";',
            description: 'Add import statement'
          },
          {
            type: 'scope_fix',
            template: 'Move function declaration to proper scope',
            description: 'Fix function scope issue'
          }
        ]
      },
      
      'infinite_loop': {
        description: 'Fix infinite loop',
        fixes: [
          {
            type: 'add_termination',
            template: 'Add proper loop termination condition',
            description: 'Ensure loop has exit condition'
          },
          {
            type: 'update_counter',
            template: 'Update loop counter/iterator',
            description: 'Make sure loop variable changes'
          },
          {
            type: 'break_condition',
            template: 'if (${condition}) break;',
            description: 'Add break condition'
          }
        ]
      }
    };
    
    for (const [errorType, fixData] of Object.entries(fixes)) {
      this.commonFixes.set(errorType, fixData);
    }
  }

  /**
   * Load bug categories
   */
  async loadBugCategories() {
    const categories = {
      syntax: {
        name: 'Syntax Errors',
        description: 'Code syntax violations',
        severity: 'high',
        autoFixable: true
      },
      runtime: {
        name: 'Runtime Errors',
        description: 'Errors that occur during execution',
        severity: 'high',
        autoFixable: false
      },
      logic: {
        name: 'Logic Errors',
        description: 'Incorrect program logic',
        severity: 'medium',
        autoFixable: false
      },
      performance: {
        name: 'Performance Issues',
        description: 'Code performance problems',
        severity: 'low',
        autoFixable: true
      },
      security: {
        name: 'Security Vulnerabilities',
        description: 'Security-related issues',
        severity: 'critical',
        autoFixable: false
      },
      style: {
        name: 'Code Style Issues',
        description: 'Code formatting and style problems',
        severity: 'low',
        autoFixable: true
      }
    };
    
    for (const [id, category] of Object.entries(categories)) {
      this.bugCategories.set(id, category);
    }
  }

  /**
   * Start debugging session
   */
  async startDebuggingSession(options = {}) {
    const {
      projectPath,
      filePath,
      errorMessage,
      stackTrace,
      userId = 'default',
      sessionType = 'general'
    } = options;
    
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      userId,
      sessionType,
      projectPath,
      filePath,
      errorMessage,
      stackTrace,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'active',
      findings: [],
      appliedFixes: [],
      context: {
        codeSnippet: null,
        lineNumber: null,
        variables: new Map(),
        callStack: []
      }
    };
    
    this.debuggingSessions.set(sessionId, session);
    this.activeDebuggingSessions.add(sessionId);
    
    this.debuggingStats.totalSessions++;
    
    this.emit('debuggingSessionStarted', { sessionId, session });
    
    logger.info('Debugging session started', { sessionId, filePath, errorMessage });
    
    return sessionId;
  }

  /**
   * Analyze error and provide suggestions
   */
  async analyzeError(sessionId, errorData) {
    const session = this.debuggingSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debugging session ${sessionId} not found`);
    }
    
    const { errorMessage, stackTrace, code, language, lineNumber } = errorData;
    
    try {
      // Update session context
      session.context.codeSnippet = code;
      session.context.lineNumber = lineNumber;
      session.lastActivity = new Date().toISOString();
      
      // Check cache first
      const cacheKey = this.generateAnalysisCacheKey(errorData);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Perform multi-level analysis
      const analysis = {
        patternMatches: await this.matchErrorPatterns(errorMessage, language),
        staticAnalysis: await this.performStaticAnalysis(code, language),
        aiAnalysis: await this.getAIErrorAnalysis(errorData),
        contextAnalysis: await this.analyzeErrorContext(errorData),
        suggestions: []
      };
      
      // Generate comprehensive suggestions
      analysis.suggestions = await this.generateFixSuggestions(analysis, errorData);
      
      // Store findings in session
      session.findings.push({
        timestamp: new Date().toISOString(),
        analysis,
        errorData
      });
      
      // Cache results
      this.addToCache(cacheKey, analysis);
      
      this.debuggingStats.bugsFound++;
      
      return analysis;
      
    } catch (error) {
      logger.error('Error analysis failed', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Match error against known patterns
   */
  async matchErrorPatterns(errorMessage, language) {
    const matches = [];
    const languagePatterns = this.errorPatterns.get(language);
    
    if (!languagePatterns) {
      return matches;
    }
    
    for (const [category, patterns] of Object.entries(languagePatterns)) {
      for (const pattern of patterns) {
        if (pattern.pattern.test(errorMessage)) {
          matches.push({
            category: pattern.category,
            severity: pattern.severity,
            description: pattern.description,
            commonCauses: pattern.commonCauses,
            confidence: 0.9
          });
        }
      }
    }
    
    return matches;
  }

  /**
   * Perform static code analysis
   */
  async performStaticAnalysis(code, language) {
    if (!this.codeFeatures) {
      return { issues: [], metrics: {} };
    }
    
    try {
      // Use code features service for static analysis
      const review = await this.codeFeatures.reviewCode(code, { language, focus: 'errors' });
      return review.staticAnalysis;
    } catch (error) {
      logger.warn('Static analysis failed', { error: error.message });
      return { issues: [], metrics: {} };
    }
  }

  /**
   * Get AI-powered error analysis
   */
  async getAIErrorAnalysis(errorData) {
    const { errorMessage, stackTrace, code, language, lineNumber } = errorData;
    
    const prompt = this.buildErrorAnalysisPrompt({
      errorMessage,
      stackTrace,
      code,
      language,
      lineNumber
    });
    
    const provider = this.aiModels.getBestProvider('debugging');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: 'You are an expert debugging assistant. Analyze errors thoroughly and provide actionable solutions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 2000,
      temperature: 0.2 // Low temperature for precise debugging
    });
    
    return this.parseAIAnalysis(response.content);
  }

  /**
   * Build error analysis prompt
   */
  buildErrorAnalysisPrompt({ errorMessage, stackTrace, code, language, lineNumber }) {
    let prompt = `Analyze this ${language} error:\n\n`;
    prompt += `Error Message: ${errorMessage}\n\n`;
    
    if (stackTrace) {
      prompt += `Stack Trace:\n${stackTrace}\n\n`;
    }
    
    if (code) {
      prompt += `Code Context:\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    }
    
    if (lineNumber) {
      prompt += `Error Line: ${lineNumber}\n\n`;
    }
    
    prompt += `Provide analysis in JSON format:\n`;
    prompt += `{\n`;
    prompt += `  "rootCause": "description of the root cause",\n`;
    prompt += `  "explanation": "detailed explanation",\n`;
    prompt += `  "severity": "low|medium|high|critical",\n`;
    prompt += `  "category": "syntax|runtime|logic|performance|security",\n`;
    prompt += `  "fixes": [\n`;
    prompt += `    {\n`;
    prompt += `      "description": "fix description",\n`;
    prompt += `      "code": "fixed code",\n`;
    prompt += `      "confidence": 0.9\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "prevention": "how to prevent this error in future"\n`;
    prompt += `}`;
    
    return prompt;
  }

  /**
   * Parse AI analysis response
   */
  parseAIAnalysis(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('Failed to parse AI analysis', { error: error.message });
    }
    
    // Fallback parsing
    return {
      rootCause: 'Unable to determine root cause',
      explanation: content,
      severity: 'medium',
      category: 'unknown',
      fixes: [],
      prevention: 'Review code carefully'
    };
  }

  /**
   * Analyze error context
   */
  async analyzeErrorContext(errorData) {
    const { code, lineNumber, language } = errorData;
    
    if (!code || !lineNumber) {
      return { contextLines: [], variables: [], scope: 'unknown' };
    }
    
    const lines = code.split('\n');
    const errorLine = lines[lineNumber - 1] || '';
    
    // Get surrounding context
    const contextStart = Math.max(0, lineNumber - 5);
    const contextEnd = Math.min(lines.length, lineNumber + 5);
    const contextLines = lines.slice(contextStart, contextEnd).map((line, index) => ({
      number: contextStart + index + 1,
      content: line,
      isErrorLine: contextStart + index + 1 === lineNumber
    }));
    
    // Extract variables from context
    const variables = this.extractVariablesFromContext(contextLines, language);
    
    // Determine scope
    const scope = this.determineScope(contextLines, language);
    
    return {
      contextLines,
      variables,
      scope,
      errorLine
    };
  }

  /**
   * Generate fix suggestions
   */
  async generateFixSuggestions(analysis, errorData) {
    const suggestions = [];
    
    // Add pattern-based suggestions
    for (const match of analysis.patternMatches) {
      const fixes = this.commonFixes.get(match.category);
      if (fixes) {
        suggestions.push(...fixes.fixes.map(fix => ({
          ...fix,
          source: 'pattern',
          confidence: match.confidence
        })));
      }
    }
    
    // Add AI suggestions
    if (analysis.aiAnalysis && analysis.aiAnalysis.fixes) {
      suggestions.push(...analysis.aiAnalysis.fixes.map(fix => ({
        ...fix,
        source: 'ai',
        type: 'ai_generated'
      })));
    }
    
    // Add static analysis suggestions
    for (const issue of analysis.staticAnalysis.issues) {
      if (issue.type === 'error') {
        suggestions.push({
          description: `Fix ${issue.pattern}: ${issue.message}`,
          type: 'static_analysis',
          source: 'static',
          confidence: 0.7
        });
      }
    }
    
    // Sort by confidence and relevance
    return suggestions.sort((a, b) => (b.confidence || 0.5) - (a.confidence || 0.5));
  }

  /**
   * Apply suggested fix
   */
  async applySuggestedFix(sessionId, suggestionIndex, targetCode) {
    const session = this.debuggingSessions.get(sessionId);
    if (!session) {
      throw new Error(`Debugging session ${sessionId} not found`);
    }
    
    const lastFinding = session.findings[session.findings.length - 1];
    if (!lastFinding || !lastFinding.analysis.suggestions[suggestionIndex]) {
      throw new Error('Invalid suggestion index');
    }
    
    const suggestion = lastFinding.analysis.suggestions[suggestionIndex];
    
    try {
      // Apply the fix
      const fixedCode = await this.applyFix(targetCode, suggestion);
      
      // Record applied fix
      session.appliedFixes.push({
        timestamp: new Date().toISOString(),
        suggestion,
        originalCode: targetCode,
        fixedCode
      });
      
      this.debuggingStats.fixesApplied++;
      
      this.emit('fixApplied', { sessionId, suggestion, fixedCode });
      
      return {
        success: true,
        fixedCode,
        suggestion
      };
      
    } catch (error) {
      logger.error('Failed to apply fix', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Apply fix to code
   */
  async applyFix(code, suggestion) {
    if (suggestion.code) {
      // Direct code replacement
      return suggestion.code;
    }
    
    if (suggestion.template) {
      // Template-based fix
      return this.applyTemplate(code, suggestion.template, suggestion.variables || {});
    }
    
    // For complex fixes, use AI to apply the suggestion
    return await this.getAIFixApplication(code, suggestion);
  }

  /**
   * Apply template-based fix
   */
  applyTemplate(code, template, variables) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `\${${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  }

  /**
   * Get AI to apply fix
   */
  async getAIFixApplication(code, suggestion) {
    const prompt = `Apply this fix to the code:\n\n`;
    prompt += `Original Code:\n\`\`\`\n${code}\n\`\`\`\n\n`;
    prompt += `Fix Description: ${suggestion.description}\n\n`;
    prompt += `Return only the fixed code without explanations.`;
    
    const provider = this.aiModels.getBestProvider('code');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: 'You are a code fixing assistant. Apply fixes precisely and return only the corrected code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 1500,
      temperature: 0.1
    });
    
    // Extract code from response
    const codeMatch = response.content.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    return response.content.trim();
  }

  /**
   * Get debugging session
   */
  getDebuggingSession(sessionId) {
    return this.debuggingSessions.get(sessionId);
  }

  /**
   * List debugging sessions
   */
  listDebuggingSessions(userId = null) {
    const sessions = Array.from(this.debuggingSessions.values());
    
    if (userId) {
      return sessions.filter(session => session.userId === userId);
    }
    
    return sessions;
  }

  /**
   * End debugging session
   */
  endDebuggingSession(sessionId, resolution = null) {
    const session = this.debuggingSessions.get(sessionId);
    if (!session) return false;
    
    session.status = 'completed';
    session.endedAt = new Date().toISOString();
    session.resolution = resolution;
    
    this.activeDebuggingSessions.delete(sessionId);
    
    // Calculate resolution time
    const startTime = new Date(session.createdAt).getTime();
    const endTime = new Date(session.endedAt).getTime();
    const resolutionTime = endTime - startTime;
    
    this.updateAverageResolutionTime(resolutionTime);
    
    this.emit('debuggingSessionEnded', { sessionId, session });
    
    return true;
  }

  // Utility methods
  generateSessionId() {
    return `debug_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  generateAnalysisCacheKey(errorData) {
    const { errorMessage, code, language } = errorData;
    const key = `${language}:${errorMessage}:${code ? code.substring(0, 100) : ''}`;
    return Buffer.from(key).toString('base64').substring(0, 32);
  }

  getFromCache(key) {
    const cached = this.analysisCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.analysisCache.delete(key);
    return null;
  }

  addToCache(key, data) {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  extractVariablesFromContext(contextLines, language) {
    const variables = [];
    
    // Simple variable extraction based on language
    const patterns = {
      javascript: /(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g,
      python: /([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g,
      java: /(?:int|String|boolean|double|float)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g
    };
    
    const pattern = patterns[language];
    if (!pattern) return variables;
    
    for (const line of contextLines) {
      const matches = [...line.content.matchAll(pattern)];
      for (const match of matches) {
        variables.push({
          name: match[1],
          line: line.number,
          context: line.content.trim()
        });
      }
    }
    
    return variables;
  }

  determineScope(contextLines, language) {
    // Simple scope determination
    for (const line of contextLines) {
      const content = line.content.trim();
      
      if (content.includes('function') || content.includes('def ')) {
        return 'function';
      }
      if (content.includes('class ')) {
        return 'class';
      }
      if (content.includes('{') && !content.includes('}')) {
        return 'block';
      }
    }
    
    return 'global';
  }

  updateAverageResolutionTime(resolutionTime) {
    const completedSessions = this.debuggingStats.totalSessions - this.activeDebuggingSessions.size;
    if (completedSessions > 0) {
      const total = this.debuggingStats.averageResolutionTime * (completedSessions - 1);
      this.debuggingStats.averageResolutionTime = (total + resolutionTime) / completedSessions;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    const completedSessions = this.debuggingStats.totalSessions - this.activeDebuggingSessions.size;
    const successRate = completedSessions > 0 ? this.debuggingStats.fixesApplied / completedSessions : 0;
    
    return {
      ...this.debuggingStats,
      successRate,
      activeSessions: this.activeDebuggingSessions.size,
      completedSessions,
      cacheSize: this.analysisCache.size,
      supportedLanguages: Array.from(this.errorPatterns.keys()),
      availableCategories: Array.from(this.bugCategories.keys())
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.debuggingSessions.clear();
    this.activeDebuggingSessions.clear();
    this.analysisCache.clear();
    this.removeAllListeners();
  }
}

module.exports = AIDebugging;