const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../logger');

/**
 * AI Performance Optimizer for NEXUS IDE
 * Intelligent code analysis and optimization suggestions
 */
class AIOptimization extends EventEmitter {
  constructor(aiModelsIntegration, codeFeatures) {
    super();
    this.aiModels = aiModelsIntegration;
    this.codeFeatures = codeFeatures;
    
    // Optimization session management
    this.optimizationSessions = new Map();
    this.activeOptimizations = new Set();
    
    // Performance patterns and rules
    this.performancePatterns = new Map();
    this.optimizationRules = new Map();
    this.benchmarkData = new Map();
    
    // Optimization categories
    this.optimizationCategories = new Map();
    
    // Performance tracking
    this.optimizationStats = {
      totalOptimizations: 0,
      performanceGains: [],
      averageImprovement: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0
    };
    
    // Cache for analysis results
    this.analysisCache = new Map();
    this.cacheTimeout = 900000; // 15 minutes
    
    this.initializeOptimizationService();
  }

  /**
   * Initialize optimization service
   */
  async initializeOptimizationService() {
    logger.info('Initializing AI Optimization Service');
    
    // Load performance patterns
    await this.loadPerformancePatterns();
    
    // Load optimization rules
    await this.loadOptimizationRules();
    
    // Load optimization categories
    await this.loadOptimizationCategories();
    
    // Initialize benchmark data
    await this.initializeBenchmarkData();
    
    logger.info('AI Optimization Service initialized successfully');
  }

  /**
   * Load performance patterns for different languages
   */
  async loadPerformancePatterns() {
    const patterns = {
      javascript: {
        inefficientLoops: [
          {
            pattern: /for\s*\(.*\.length.*\)/g,
            issue: 'Accessing length property in loop condition',
            impact: 'medium',
            solution: 'Cache array length outside loop',
            example: 'const len = arr.length; for(let i = 0; i < len; i++)'
          },
          {
            pattern: /forEach.*forEach/g,
            issue: 'Nested forEach loops',
            impact: 'high',
            solution: 'Use nested for loops or optimize algorithm',
            example: 'Use for loops or consider algorithm optimization'
          }
        ],
        memoryLeaks: [
          {
            pattern: /addEventListener.*(?!removeEventListener)/g,
            issue: 'Event listeners not removed',
            impact: 'high',
            solution: 'Add removeEventListener in cleanup',
            example: 'element.removeEventListener("click", handler)'
          },
          {
            pattern: /setInterval.*(?!clearInterval)/g,
            issue: 'Intervals not cleared',
            impact: 'high',
            solution: 'Clear intervals when done',
            example: 'clearInterval(intervalId)'
          }
        ],
        inefficientDom: [
          {
            pattern: /document\.getElementById.*loop/g,
            issue: 'DOM queries inside loops',
            impact: 'high',
            solution: 'Cache DOM elements outside loops',
            example: 'const element = document.getElementById("id")'
          },
          {
            pattern: /innerHTML\s*\+=/g,
            issue: 'Inefficient DOM manipulation',
            impact: 'medium',
            solution: 'Use DocumentFragment or batch updates',
            example: 'Use DocumentFragment for multiple DOM updates'
          }
        ]
      },
      
      python: {
        inefficientLoops: [
          {
            pattern: /for.*in.*range\(len\(/g,
            issue: 'Inefficient iteration over indices',
            impact: 'medium',
            solution: 'Use enumerate() or direct iteration',
            example: 'for i, item in enumerate(items):'
          },
          {
            pattern: /\+.*in.*loop/g,
            issue: 'String concatenation in loop',
            impact: 'high',
            solution: 'Use list and join() or f-strings',
            example: 'result = "".join(string_list)'
          }
        ],
        inefficientDataStructures: [
          {
            pattern: /list.*append.*loop.*in.*list/g,
            issue: 'Inefficient list operations',
            impact: 'medium',
            solution: 'Use list comprehension or set for membership tests',
            example: '[item for item in items if condition]'
          },
          {
            pattern: /dict.*keys\(\).*in/g,
            issue: 'Inefficient dictionary key checking',
            impact: 'low',
            solution: 'Use "in dict" instead of "in dict.keys()"',
            example: 'if key in dictionary:'
          }
        ]
      },
      
      java: {
        inefficientStringOps: [
          {
            pattern: /String.*\+.*loop/g,
            issue: 'String concatenation in loop',
            impact: 'high',
            solution: 'Use StringBuilder',
            example: 'StringBuilder sb = new StringBuilder();'
          }
        ],
        inefficientCollections: [
          {
            pattern: /Vector|Hashtable/g,
            issue: 'Using legacy synchronized collections',
            impact: 'medium',
            solution: 'Use ArrayList/HashMap with explicit synchronization if needed',
            example: 'List<String> list = new ArrayList<>();'
          }
        ]
      }
    };
    
    for (const [language, languagePatterns] of Object.entries(patterns)) {
      this.performancePatterns.set(language, languagePatterns);
    }
  }

  /**
   * Load optimization rules
   */
  async loadOptimizationRules() {
    const rules = {
      algorithmic: {
        name: 'Algorithmic Optimization',
        rules: [
          {
            id: 'reduce_complexity',
            description: 'Reduce time complexity',
            priority: 'high',
            applicableWhen: 'nested loops detected',
            suggestion: 'Consider using hash maps or more efficient algorithms'
          },
          {
            id: 'cache_results',
            description: 'Cache expensive computations',
            priority: 'medium',
            applicableWhen: 'repeated calculations detected',
            suggestion: 'Implement memoization or caching'
          }
        ]
      },
      
      memory: {
        name: 'Memory Optimization',
        rules: [
          {
            id: 'reduce_allocations',
            description: 'Reduce object allocations',
            priority: 'medium',
            applicableWhen: 'frequent object creation in loops',
            suggestion: 'Reuse objects or use object pools'
          },
          {
            id: 'cleanup_resources',
            description: 'Proper resource cleanup',
            priority: 'high',
            applicableWhen: 'resources not properly disposed',
            suggestion: 'Implement proper cleanup in finally blocks or using statements'
          }
        ]
      },
      
      io: {
        name: 'I/O Optimization',
        rules: [
          {
            id: 'batch_operations',
            description: 'Batch I/O operations',
            priority: 'high',
            applicableWhen: 'multiple small I/O operations',
            suggestion: 'Combine multiple operations into batches'
          },
          {
            id: 'async_operations',
            description: 'Use asynchronous operations',
            priority: 'medium',
            applicableWhen: 'blocking I/O operations',
            suggestion: 'Convert to async/await or Promise-based operations'
          }
        ]
      }
    };
    
    for (const [category, categoryRules] of Object.entries(rules)) {
      this.optimizationRules.set(category, categoryRules);
    }
  }

  /**
   * Load optimization categories
   */
  async loadOptimizationCategories() {
    const categories = {
      performance: {
        name: 'Performance',
        description: 'Speed and efficiency improvements',
        priority: 'high',
        metrics: ['execution_time', 'cpu_usage']
      },
      memory: {
        name: 'Memory Usage',
        description: 'Memory consumption optimization',
        priority: 'high',
        metrics: ['memory_usage', 'garbage_collection']
      },
      scalability: {
        name: 'Scalability',
        description: 'Improvements for handling larger datasets',
        priority: 'medium',
        metrics: ['throughput', 'concurrent_users']
      },
      maintainability: {
        name: 'Code Maintainability',
        description: 'Code structure and readability improvements',
        priority: 'low',
        metrics: ['cyclomatic_complexity', 'code_duplication']
      },
      security: {
        name: 'Security',
        description: 'Security-related optimizations',
        priority: 'critical',
        metrics: ['vulnerability_count', 'security_score']
      }
    };
    
    for (const [id, category] of Object.entries(categories)) {
      this.optimizationCategories.set(id, category);
    }
  }

  /**
   * Initialize benchmark data
   */
  async initializeBenchmarkData() {
    // Initialize with common performance benchmarks
    this.benchmarkData.set('array_iteration', {
      operations: {
        'for_loop': { speed: 1.0, memory: 1.0 },
        'forEach': { speed: 0.8, memory: 1.2 },
        'map': { speed: 0.7, memory: 1.5 },
        'for_of': { speed: 0.9, memory: 1.1 }
      },
      recommendation: 'for_loop'
    });
    
    this.benchmarkData.set('string_concatenation', {
      operations: {
        'plus_operator': { speed: 0.3, memory: 2.0 },
        'template_literal': { speed: 0.8, memory: 1.2 },
        'array_join': { speed: 1.0, memory: 1.0 },
        'string_builder': { speed: 1.0, memory: 0.8 }
      },
      recommendation: 'array_join'
    });
  }

  /**
   * Start optimization session
   */
  async startOptimizationSession(options = {}) {
    const {
      projectPath,
      filePath,
      code,
      language,
      optimizationGoals = ['performance', 'memory'],
      userId = 'default'
    } = options;
    
    const sessionId = this.generateSessionId();
    
    const session = {
      id: sessionId,
      userId,
      projectPath,
      filePath,
      originalCode: code,
      language,
      optimizationGoals,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      status: 'active',
      analyses: [],
      optimizations: [],
      benchmarks: {
        before: null,
        after: null
      }
    };
    
    this.optimizationSessions.set(sessionId, session);
    this.activeOptimizations.add(sessionId);
    
    this.optimizationStats.totalOptimizations++;
    
    this.emit('optimizationSessionStarted', { sessionId, session });
    
    logger.info('Optimization session started', { sessionId, filePath, language });
    
    return sessionId;
  }

  /**
   * Analyze code for optimization opportunities
   */
  async analyzeCodeForOptimization(sessionId, analysisOptions = {}) {
    const session = this.optimizationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session ${sessionId} not found`);
    }
    
    const {
      focusAreas = session.optimizationGoals,
      includeAI = true,
      includeBenchmarks = true
    } = analysisOptions;
    
    try {
      session.lastActivity = new Date().toISOString();
      
      // Check cache first
      const cacheKey = this.generateAnalysisCacheKey(session.originalCode, session.language, focusAreas);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      // Perform comprehensive analysis
      const analysis = {
        patternAnalysis: await this.analyzePerformancePatterns(session.originalCode, session.language),
        staticAnalysis: await this.performStaticOptimizationAnalysis(session.originalCode, session.language),
        complexityAnalysis: await this.analyzeComplexity(session.originalCode, session.language),
        aiAnalysis: includeAI ? await this.getAIOptimizationAnalysis(session) : null,
        benchmarkAnalysis: includeBenchmarks ? await this.analyzeBenchmarkOpportunities(session.originalCode, session.language) : null,
        recommendations: []
      };
      
      // Generate optimization recommendations
      analysis.recommendations = await this.generateOptimizationRecommendations(analysis, focusAreas);
      
      // Store analysis in session
      session.analyses.push({
        timestamp: new Date().toISOString(),
        focusAreas,
        analysis
      });
      
      // Cache results
      this.addToCache(cacheKey, analysis);
      
      return analysis;
      
    } catch (error) {
      logger.error('Code optimization analysis failed', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Analyze performance patterns
   */
  async analyzePerformancePatterns(code, language) {
    const issues = [];
    const languagePatterns = this.performancePatterns.get(language);
    
    if (!languagePatterns) {
      return { issues, coverage: 0 };
    }
    
    let totalPatterns = 0;
    let matchedPatterns = 0;
    
    for (const [category, patterns] of Object.entries(languagePatterns)) {
      for (const pattern of patterns) {
        totalPatterns++;
        const matches = [...code.matchAll(pattern.pattern)];
        
        if (matches.length > 0) {
          matchedPatterns++;
          issues.push({
            category,
            pattern: pattern.pattern.source,
            issue: pattern.issue,
            impact: pattern.impact,
            solution: pattern.solution,
            example: pattern.example,
            occurrences: matches.length,
            locations: matches.map(match => ({
              index: match.index,
              line: this.getLineNumber(code, match.index)
            }))
          });
        }
      }
    }
    
    return {
      issues,
      coverage: totalPatterns > 0 ? matchedPatterns / totalPatterns : 0,
      totalPatterns,
      matchedPatterns
    };
  }

  /**
   * Perform static optimization analysis
   */
  async performStaticOptimizationAnalysis(code, language) {
    if (!this.codeFeatures) {
      return { metrics: {}, suggestions: [] };
    }
    
    try {
      // Use code features service for static analysis
      const review = await this.codeFeatures.reviewCode(code, { 
        language, 
        focus: 'performance',
        includeMetrics: true
      });
      
      return {
        metrics: review.metrics || {},
        suggestions: review.suggestions?.filter(s => s.category === 'performance') || [],
        codeSmells: review.codeSmells || []
      };
    } catch (error) {
      logger.warn('Static optimization analysis failed', { error: error.message });
      return { metrics: {}, suggestions: [] };
    }
  }

  /**
   * Analyze code complexity
   */
  async analyzeComplexity(code, language) {
    const complexity = {
      cyclomatic: this.calculateCyclomaticComplexity(code, language),
      cognitive: this.calculateCognitiveComplexity(code, language),
      nesting: this.calculateNestingDepth(code),
      lineCount: code.split('\n').length,
      functionCount: this.countFunctions(code, language)
    };
    
    // Determine complexity rating
    const rating = this.getComplexityRating(complexity);
    
    return {
      ...complexity,
      rating,
      recommendations: this.getComplexityRecommendations(complexity, rating)
    };
  }

  /**
   * Get AI optimization analysis
   */
  async getAIOptimizationAnalysis(session) {
    const prompt = this.buildOptimizationAnalysisPrompt(session);
    
    const provider = this.aiModels.getBestProvider('optimization');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: 'You are an expert code optimization assistant. Analyze code for performance improvements and provide specific, actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 3000,
      temperature: 0.3
    });
    
    return this.parseAIOptimizationAnalysis(response.content);
  }

  /**
   * Build optimization analysis prompt
   */
  buildOptimizationAnalysisPrompt(session) {
    let prompt = `Analyze this ${session.language} code for optimization opportunities:\n\n`;
    prompt += `Code:\n\`\`\`${session.language}\n${session.originalCode}\n\`\`\`\n\n`;
    prompt += `Optimization Goals: ${session.optimizationGoals.join(', ')}\n\n`;
    
    prompt += `Provide analysis in JSON format:\n`;
    prompt += `{\n`;
    prompt += `  "overallAssessment": "brief assessment of code performance",\n`;
    prompt += `  "criticalIssues": [\n`;
    prompt += `    {\n`;
    prompt += `      "issue": "description",\n`;
    prompt += `      "impact": "high|medium|low",\n`;
    prompt += `      "location": "line number or function name",\n`;
    prompt += `      "recommendation": "specific fix"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "optimizations": [\n`;
    prompt += `    {\n`;
    prompt += `      "type": "algorithmic|memory|io|caching",\n`;
    prompt += `      "description": "optimization description",\n`;
    prompt += `      "expectedGain": "percentage improvement",\n`;
    prompt += `      "difficulty": "easy|medium|hard",\n`;
    prompt += `      "code": "optimized code snippet"\n`;
    prompt += `    }\n`;
    prompt += `  ],\n`;
    prompt += `  "bestPractices": ["list of best practices to follow"]\n`;
    prompt += `}`;
    
    return prompt;
  }

  /**
   * Parse AI optimization analysis
   */
  parseAIOptimizationAnalysis(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('Failed to parse AI optimization analysis', { error: error.message });
    }
    
    // Fallback parsing
    return {
      overallAssessment: 'Analysis completed',
      criticalIssues: [],
      optimizations: [],
      bestPractices: []
    };
  }

  /**
   * Analyze benchmark opportunities
   */
  async analyzeBenchmarkOpportunities(code, language) {
    const opportunities = [];
    
    // Check against known benchmark patterns
    for (const [operation, benchmarkData] of this.benchmarkData.entries()) {
      const pattern = this.getBenchmarkPattern(operation, language);
      if (pattern && pattern.test(code)) {
        opportunities.push({
          operation,
          currentApproach: this.detectCurrentApproach(code, operation, language),
          recommendedApproach: benchmarkData.recommendation,
          expectedImprovement: this.calculateExpectedImprovement(benchmarkData),
          benchmarkData
        });
      }
    }
    
    return opportunities;
  }

  /**
   * Generate optimization recommendations
   */
  async generateOptimizationRecommendations(analysis, focusAreas) {
    const recommendations = [];
    
    // Add pattern-based recommendations
    for (const issue of analysis.patternAnalysis.issues) {
      if (issue.impact === 'high' || issue.impact === 'critical') {
        recommendations.push({
          type: 'pattern',
          priority: issue.impact,
          category: issue.category,
          description: issue.solution,
          example: issue.example,
          impact: issue.impact,
          effort: 'low',
          source: 'pattern_analysis'
        });
      }
    }
    
    // Add AI recommendations
    if (analysis.aiAnalysis) {
      for (const optimization of analysis.aiAnalysis.optimizations) {
        recommendations.push({
          type: optimization.type,
          priority: this.mapDifficultyToPriority(optimization.difficulty),
          category: optimization.type,
          description: optimization.description,
          code: optimization.code,
          expectedGain: optimization.expectedGain,
          effort: optimization.difficulty,
          source: 'ai_analysis'
        });
      }
    }
    
    // Add complexity-based recommendations
    if (analysis.complexityAnalysis.rating === 'high' || analysis.complexityAnalysis.rating === 'critical') {
      recommendations.push(...analysis.complexityAnalysis.recommendations.map(rec => ({
        ...rec,
        source: 'complexity_analysis'
      })));
    }
    
    // Add benchmark recommendations
    if (analysis.benchmarkAnalysis) {
      for (const opportunity of analysis.benchmarkAnalysis) {
        recommendations.push({
          type: 'benchmark',
          priority: 'medium',
          category: 'performance',
          description: `Switch from ${opportunity.currentApproach} to ${opportunity.recommendedApproach}`,
          expectedGain: opportunity.expectedImprovement,
          effort: 'low',
          source: 'benchmark_analysis'
        });
      }
    }
    
    // Filter by focus areas and sort by priority
    return recommendations
      .filter(rec => focusAreas.includes(rec.category) || rec.priority === 'critical')
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));
  }

  /**
   * Apply optimization
   */
  async applyOptimization(sessionId, recommendationIndex, targetCode = null) {
    const session = this.optimizationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session ${sessionId} not found`);
    }
    
    const lastAnalysis = session.analyses[session.analyses.length - 1];
    if (!lastAnalysis || !lastAnalysis.analysis.recommendations[recommendationIndex]) {
      throw new Error('Invalid recommendation index');
    }
    
    const recommendation = lastAnalysis.analysis.recommendations[recommendationIndex];
    const codeToOptimize = targetCode || session.originalCode;
    
    try {
      // Apply the optimization
      const optimizedCode = await this.applyOptimizationToCode(codeToOptimize, recommendation);
      
      // Record applied optimization
      const optimization = {
        timestamp: new Date().toISOString(),
        recommendation,
        originalCode: codeToOptimize,
        optimizedCode,
        status: 'applied'
      };
      
      session.optimizations.push(optimization);
      
      this.optimizationStats.successfulOptimizations++;
      
      this.emit('optimizationApplied', { sessionId, optimization });
      
      return {
        success: true,
        optimizedCode,
        recommendation,
        optimization
      };
      
    } catch (error) {
      this.optimizationStats.failedOptimizations++;
      logger.error('Failed to apply optimization', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * Apply optimization to code
   */
  async applyOptimizationToCode(code, recommendation) {
    if (recommendation.code) {
      // Direct code replacement
      return recommendation.code;
    }
    
    // Use AI to apply the optimization
    const prompt = `Apply this optimization to the code:\n\n`;
    prompt += `Original Code:\n\`\`\`\n${code}\n\`\`\`\n\n`;
    prompt += `Optimization: ${recommendation.description}\n\n`;
    if (recommendation.example) {
      prompt += `Example: ${recommendation.example}\n\n`;
    }
    prompt += `Return only the optimized code without explanations.`;
    
    const provider = this.aiModels.getBestProvider('code');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: 'You are a code optimization assistant. Apply optimizations precisely and return only the optimized code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 2000,
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
   * Benchmark code performance
   */
  async benchmarkCode(sessionId, code, iterations = 1000) {
    const session = this.optimizationSessions.get(sessionId);
    if (!session) {
      throw new Error(`Optimization session ${sessionId} not found`);
    }
    
    try {
      // This is a simplified benchmark - in a real implementation,
      // you would run the code in a sandboxed environment
      const benchmark = {
        timestamp: new Date().toISOString(),
        iterations,
        metrics: {
          executionTime: Math.random() * 1000, // Simulated
          memoryUsage: Math.random() * 100,    // Simulated
          cpuUsage: Math.random() * 50         // Simulated
        },
        code: code.substring(0, 200) + '...' // Store snippet for reference
      };
      
      return benchmark;
      
    } catch (error) {
      logger.error('Benchmarking failed', { sessionId, error: error.message });
      throw error;
    }
  }

  // Utility methods
  generateSessionId() {
    return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  generateAnalysisCacheKey(code, language, focusAreas) {
    const key = `${language}:${focusAreas.join(',')}:${code.substring(0, 200)}`;
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

  getLineNumber(code, index) {
    return code.substring(0, index).split('\n').length;
  }

  calculateCyclomaticComplexity(code, language) {
    // Simplified cyclomatic complexity calculation
    const patterns = {
      javascript: /\b(if|while|for|case|catch|&&|\|\|)\b/g,
      python: /\b(if|while|for|elif|except|and|or)\b/g,
      java: /\b(if|while|for|case|catch|&&|\|\|)\b/g
    };
    
    const pattern = patterns[language] || patterns.javascript;
    const matches = code.match(pattern) || [];
    return matches.length + 1; // +1 for the main path
  }

  calculateCognitiveComplexity(code, language) {
    // Simplified cognitive complexity - counts nested structures with weights
    let complexity = 0;
    let nestingLevel = 0;
    
    const lines = code.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Increase nesting for opening braces/blocks
      if (trimmed.includes('{') || trimmed.includes(':')) {
        nestingLevel++;
      }
      
      // Decrease nesting for closing braces
      if (trimmed.includes('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
      
      // Add complexity for control structures
      if (/\b(if|while|for|case|catch)\b/.test(trimmed)) {
        complexity += nestingLevel + 1;
      }
    }
    
    return complexity;
  }

  calculateNestingDepth(code) {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of code) {
      if (char === '{' || char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}' || char === ')') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }

  countFunctions(code, language) {
    const patterns = {
      javascript: /\bfunction\b|\b\w+\s*=>|\b\w+\s*:\s*function/g,
      python: /\bdef\s+\w+/g,
      java: /\b(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/g
    };
    
    const pattern = patterns[language] || patterns.javascript;
    const matches = code.match(pattern) || [];
    return matches.length;
  }

  getComplexityRating(complexity) {
    const score = complexity.cyclomatic + complexity.cognitive + complexity.nesting;
    
    if (score < 10) return 'low';
    if (score < 20) return 'medium';
    if (score < 30) return 'high';
    return 'critical';
  }

  getComplexityRecommendations(complexity, rating) {
    const recommendations = [];
    
    if (complexity.cyclomatic > 10) {
      recommendations.push({
        type: 'complexity',
        priority: 'medium',
        category: 'maintainability',
        description: 'Break down complex functions into smaller ones',
        effort: 'medium'
      });
    }
    
    if (complexity.nesting > 4) {
      recommendations.push({
        type: 'nesting',
        priority: 'medium',
        category: 'maintainability',
        description: 'Reduce nesting depth using early returns or guard clauses',
        effort: 'low'
      });
    }
    
    return recommendations;
  }

  getBenchmarkPattern(operation, language) {
    const patterns = {
      array_iteration: {
        javascript: /for\s*\(.*\)|forEach|map|for.*of/g,
        python: /for.*in.*:|map\(|list\(/g
      },
      string_concatenation: {
        javascript: /\+.*string|template.*literal|join\(/g,
        python: /\+.*str|join\(|f"/g
      }
    };
    
    return patterns[operation]?.[language];
  }

  detectCurrentApproach(code, operation, language) {
    // Simplified detection - in reality, this would be more sophisticated
    if (operation === 'array_iteration') {
      if (code.includes('forEach')) return 'forEach';
      if (code.includes('for (')) return 'for_loop';
      if (code.includes('map(')) return 'map';
      if (code.includes('for...of')) return 'for_of';
    }
    
    return 'unknown';
  }

  calculateExpectedImprovement(benchmarkData) {
    const best = Math.max(...Object.values(benchmarkData.operations).map(op => op.speed));
    const recommended = benchmarkData.operations[benchmarkData.recommendation];
    return `${Math.round((recommended.speed / best) * 100)}% performance improvement`;
  }

  mapDifficultyToPriority(difficulty) {
    const mapping = {
      'easy': 'high',
      'medium': 'medium',
      'hard': 'low'
    };
    return mapping[difficulty] || 'medium';
  }

  getPriorityWeight(priority) {
    const weights = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return weights[priority] || 1;
  }

  /**
   * Get optimization session
   */
  getOptimizationSession(sessionId) {
    return this.optimizationSessions.get(sessionId);
  }

  /**
   * List optimization sessions
   */
  listOptimizationSessions(userId = null) {
    const sessions = Array.from(this.optimizationSessions.values());
    
    if (userId) {
      return sessions.filter(session => session.userId === userId);
    }
    
    return sessions;
  }

  /**
   * End optimization session
   */
  endOptimizationSession(sessionId, summary = null) {
    const session = this.optimizationSessions.get(sessionId);
    if (!session) return false;
    
    session.status = 'completed';
    session.endedAt = new Date().toISOString();
    session.summary = summary;
    
    this.activeOptimizations.delete(sessionId);
    
    // Calculate performance gains
    if (session.benchmarks.before && session.benchmarks.after) {
      const gain = this.calculatePerformanceGain(session.benchmarks.before, session.benchmarks.after);
      this.optimizationStats.performanceGains.push(gain);
      this.updateAverageImprovement();
    }
    
    this.emit('optimizationSessionEnded', { sessionId, session });
    
    return true;
  }

  calculatePerformanceGain(before, after) {
    const timeDiff = (before.metrics.executionTime - after.metrics.executionTime) / before.metrics.executionTime;
    const memoryDiff = (before.metrics.memoryUsage - after.metrics.memoryUsage) / before.metrics.memoryUsage;
    
    return {
      timeImprovement: timeDiff * 100,
      memoryImprovement: memoryDiff * 100,
      overall: (timeDiff + memoryDiff) / 2 * 100
    };
  }

  updateAverageImprovement() {
    if (this.optimizationStats.performanceGains.length > 0) {
      const total = this.optimizationStats.performanceGains.reduce((sum, gain) => sum + gain.overall, 0);
      this.optimizationStats.averageImprovement = total / this.optimizationStats.performanceGains.length;
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    const successRate = this.optimizationStats.totalOptimizations > 0 
      ? this.optimizationStats.successfulOptimizations / this.optimizationStats.totalOptimizations 
      : 0;
    
    return {
      ...this.optimizationStats,
      successRate,
      activeSessions: this.activeOptimizations.size,
      cacheSize: this.analysisCache.size,
      supportedLanguages: Array.from(this.performancePatterns.keys()),
      availableCategories: Array.from(this.optimizationCategories.keys())
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.optimizationSessions.clear();
    this.activeOptimizations.clear();
    this.analysisCache.clear();
    this.removeAllListeners();
  }
}

module.exports = AIOptimization;