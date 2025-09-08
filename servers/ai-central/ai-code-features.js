const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../../logger');

/**
 * Enhanced AI Code Features Service for NEXUS IDE
 * Provides intelligent code completion, generation, explanation, review,
 * predictive typing, natural language programming, and context-aware suggestions
 */
class AICodeFeatures extends EventEmitter {
  constructor(aiModelsIntegration) {
    super();
    this.aiModels = aiModelsIntegration;
    
    // Enhanced code analysis and intelligence
    this.codePatterns = new Map();
    this.languageConfigs = new Map();
    this.codeTemplates = new Map();
    this.projectContext = new Map();
    this.userCodingStyle = new Map();
    this.semanticIndex = new Map();
    
    // Advanced caching and performance
    this.completionCache = new Map();
    this.semanticCache = new Map();
    this.predictiveCache = new Map();
    this.cacheMaxSize = 2000;
    this.cacheTimeout = 600000; // 10 minutes
    
    // Performance and analytics
    this.completionStats = {
      requests: 0,
      successful: 0,
      averageTime: 0,
      cacheHits: 0,
      predictiveHits: 0,
      naturalLanguageRequests: 0
    };
    
    // Real-time learning and adaptation
    this.learningData = {
      userPatterns: new Map(),
      frequentCompletions: new Map(),
      contextualPreferences: new Map(),
      errorPatterns: new Map()
    };
    
    // Advanced features
    this.predictiveTyping = {
      enabled: true,
      confidence: 0.7,
      maxPredictions: 5
    };
    
    this.naturalLanguageProgramming = {
      enabled: true,
      supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'go'],
      templates: new Map()
    };
    
    this.initializeCodeFeatures();
  }

  /**
   * Initialize enhanced code features and configurations
   */
  async initializeCodeFeatures() {
    logger.info('Initializing Enhanced AI Code Features Service for NEXUS IDE');
    
    try {
      // Load core configurations
      await this.loadLanguageConfigurations();
      await this.loadCodePatterns();
      await this.loadCodeTemplates();
      
      // Initialize advanced features
      await this.initializeSemanticIndex();
      await this.loadNaturalLanguageTemplates();
      await this.initializePredictiveTyping();
      
      // Load user learning data
      await this.loadUserLearningData();
      
      // Start background processes
      this.startLearningProcess();
      this.startCacheOptimization();
      
      logger.info('Enhanced AI Code Features Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Code Features Service', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Initialize semantic indexing for better context understanding
   */
  async initializeSemanticIndex() {
    // Create semantic mappings for common programming concepts
    const semanticMappings = {
      'data_structures': ['array', 'list', 'map', 'set', 'queue', 'stack', 'tree', 'graph'],
      'algorithms': ['sort', 'search', 'filter', 'reduce', 'map', 'traverse', 'iterate'],
      'patterns': ['singleton', 'factory', 'observer', 'decorator', 'strategy', 'adapter'],
      'async_operations': ['promise', 'async', 'await', 'callback', 'timeout', 'interval'],
      'error_handling': ['try', 'catch', 'throw', 'error', 'exception', 'validate'],
      'testing': ['test', 'spec', 'mock', 'stub', 'assert', 'expect', 'describe', 'it']
    };
    
    for (const [category, keywords] of Object.entries(semanticMappings)) {
      this.semanticIndex.set(category, new Set(keywords));
    }
  }
  
  /**
   * Load natural language programming templates
   */
  async loadNaturalLanguageTemplates() {
    const nlTemplates = {
      'create function': {
        javascript: 'function ${name}(${params}) {\n  ${body}\n}',
        python: 'def ${name}(${params}):\n    ${body}',
        java: 'public ${returnType} ${name}(${params}) {\n    ${body}\n}'
      },
      'create class': {
        javascript: 'class ${name} {\n  constructor(${params}) {\n    ${body}\n  }\n}',
        python: 'class ${name}:\n    def __init__(self, ${params}):\n        ${body}',
        java: 'public class ${name} {\n    public ${name}(${params}) {\n        ${body}\n    }\n}'
      },
      'api call': {
        javascript: 'const ${name} = async (${params}) => {\n  const response = await fetch(${url});\n  return response.json();\n};',
        python: 'async def ${name}(${params}):\n    async with aiohttp.ClientSession() as session:\n        async with session.get(${url}) as response:\n            return await response.json()'
      },
      'error handling': {
        javascript: 'try {\n  ${code}\n} catch (error) {\n  console.error("Error:", error);\n  ${errorHandling}\n}',
        python: 'try:\n    ${code}\nexcept Exception as error:\n    print(f"Error: {error}")\n    ${errorHandling}'
      }
    };
    
    this.naturalLanguageProgramming.templates = new Map(Object.entries(nlTemplates));
  }
  
  /**
   * Initialize predictive typing system
   */
  async initializePredictiveTyping() {
    // Load common code patterns for prediction
    const predictivePatterns = {
      'if_statement': {
        trigger: 'if (',
        predictions: ['condition', 'variable === value', 'array.length > 0', 'object !== null']
      },
      'for_loop': {
        trigger: 'for (',
        predictions: ['let i = 0; i < array.length; i++', 'const item of array', 'const [key, value] of Object.entries']
      },
      'function_call': {
        trigger: '.',
        predictions: ['map(', 'filter(', 'reduce(', 'forEach(', 'find(', 'includes(']
      }
    };
    
    this.predictiveCache.set('patterns', predictivePatterns);
  }
  
  /**
   * Load user learning data from storage
   */
  async loadUserLearningData() {
    try {
      // In a real implementation, this would load from a database
      // For now, we'll initialize with empty data
      logger.info('User learning data initialized');
    } catch (error) {
      logger.warn('Failed to load user learning data', { error: error.message });
    }
  }
  
  /**
   * Start background learning process
   */
  startLearningProcess() {
    // Update learning data every 5 minutes
    setInterval(() => {
      this.updateLearningData();
    }, 300000);
  }
  
  /**
   * Start cache optimization process
   */
  startCacheOptimization() {
    // Optimize caches every 10 minutes
    setInterval(() => {
      this.optimizeCaches();
    }, 600000);
  }

  /**
   * Load language-specific configurations
   */
  async loadLanguageConfigurations() {
    const languages = {
      javascript: {
        extensions: ['.js', '.jsx', '.mjs'],
        keywords: ['function', 'const', 'let', 'var', 'class', 'import', 'export'],
        patterns: {
          function: /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
          class: /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*{/g,
          import: /import\s+.*?from\s+['"]([^'"]+)['"]/g
        },
        completionTriggers: ['.', '(', '{', '['],
        indentSize: 2
      },
      typescript: {
        extensions: ['.ts', '.tsx'],
        keywords: ['interface', 'type', 'enum', 'namespace', 'declare'],
        patterns: {
          interface: /interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*{/g,
          type: /type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g
        },
        completionTriggers: ['.', '(', '{', '[', ':'],
        indentSize: 2
      },
      python: {
        extensions: ['.py', '.pyw'],
        keywords: ['def', 'class', 'import', 'from', 'async', 'await'],
        patterns: {
          function: /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
          class: /class\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[\(:]?/g,
          import: /from\s+([a-zA-Z_][a-zA-Z0-9_.]*)/g
        },
        completionTriggers: ['.', '(', '['],
        indentSize: 4
      },
      java: {
        extensions: ['.java'],
        keywords: ['public', 'private', 'protected', 'class', 'interface', 'enum'],
        patterns: {
          class: /(?:public|private|protected)?\s*class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
          method: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
        },
        completionTriggers: ['.', '('],
        indentSize: 4
      },
      go: {
        extensions: ['.go'],
        keywords: ['func', 'type', 'struct', 'interface', 'package', 'import'],
        patterns: {
          function: /func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
          struct: /type\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+struct/g
        },
        completionTriggers: ['.', '('],
        indentSize: 1
      }
    };
    
    for (const [lang, config] of Object.entries(languages)) {
      this.languageConfigs.set(lang, config);
    }
  }

  /**
   * Load common code patterns for analysis
   */
  async loadCodePatterns() {
    const patterns = {
      // Common anti-patterns
      antiPatterns: {
        longFunction: { threshold: 50, message: 'Function is too long, consider breaking it down' },
        deepNesting: { threshold: 4, message: 'Too many nested levels, consider refactoring' },
        duplicateCode: { threshold: 0.8, message: 'Duplicate code detected, consider extracting to function' },
        magicNumbers: { pattern: /\b\d{2,}\b/g, message: 'Consider using named constants instead of magic numbers' }
      },
      
      // Security patterns
      securityPatterns: {
        sqlInjection: { pattern: /['"]\s*\+\s*\w+\s*\+\s*['"]/, message: 'Potential SQL injection vulnerability' },
        xss: { pattern: /innerHTML\s*=\s*.*\+/, message: 'Potential XSS vulnerability' },
        hardcodedSecrets: { pattern: /(password|secret|key|token)\s*=\s*['"][^'"]+['"]/i, message: 'Hardcoded secret detected' }
      },
      
      // Performance patterns
      performancePatterns: {
        inefficientLoop: { pattern: /for\s*\(.*\.length.*\)/, message: 'Consider caching array length' },
        unnecessaryRegex: { pattern: /new RegExp\(.*\)/, message: 'Consider using regex literal for better performance' }
      }
    };
    
    for (const [category, categoryPatterns] of Object.entries(patterns)) {
      this.codePatterns.set(category, categoryPatterns);
    }
  }

  /**
   * Load code templates for generation
   */
  async loadCodeTemplates() {
    const templates = {
      javascript: {
        function: 'function ${name}(${params}) {\n  ${body}\n}',
        asyncFunction: 'async function ${name}(${params}) {\n  ${body}\n}',
        class: 'class ${name} {\n  constructor(${params}) {\n    ${body}\n  }\n}',
        reactComponent: 'function ${name}(${props}) {\n  return (\n    ${jsx}\n  );\n}',
        apiCall: 'const ${name} = async (${params}) => {\n  try {\n    const response = await fetch(${url});\n    return await response.json();\n  } catch (error) {\n    console.error("Error:", error);\n    throw error;\n  }\n};'
      },
      python: {
        function: 'def ${name}(${params}):\n    """${docstring}"""\n    ${body}',
        class: 'class ${name}:\n    """${docstring}"""\n    \n    def __init__(self, ${params}):\n        ${body}',
        asyncFunction: 'async def ${name}(${params}):\n    """${docstring}"""\n    ${body}',
        decorator: '@${decorator}\ndef ${name}(${params}):\n    ${body}'
      },
      typescript: {
        interface: 'interface ${name} {\n  ${properties}\n}',
        type: 'type ${name} = ${definition};',
        genericFunction: 'function ${name}<${generics}>(${params}): ${returnType} {\n  ${body}\n}'
      }
    };
    
    for (const [lang, langTemplates] of Object.entries(templates)) {
      this.codeTemplates.set(lang, langTemplates);
    }
  }

  /**
   * Enhanced intelligent code completion with predictive typing
   */
  async getCodeCompletion(context) {
    const startTime = Date.now();
    this.completionStats.requests++;
    
    try {
      // Check predictive typing first
      const predictiveResult = await this.getPredictiveCompletion(context);
      if (predictiveResult && predictiveResult.confidence > this.predictiveTyping.confidence) {
        this.completionStats.predictiveHits++;
        return predictiveResult;
      }
      
      // Check cache with enhanced key
      const cacheKey = this.generateEnhancedCacheKey(context);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.completionStats.cacheHits++;
        return await this.enhanceWithUserLearning(cached, context.userId);
      }
      
      // Analyze enhanced context
      const analysis = await this.analyzeEnhancedCodeContext(context);
      
      // Get AI completion with multi-model approach
      const completion = await this.generateEnhancedAICompletion(context, analysis);
      
      // Apply user learning and personalization
      const personalizedCompletion = await this.personalizeCompletion(completion, context.userId);
      
      // Cache result with semantic indexing
      this.addToCache(cacheKey, personalizedCompletion);
      
      // Update learning data
      await this.updateUserLearning(context, personalizedCompletion);
      
      this.completionStats.successful++;
      const responseTime = Date.now() - startTime;
      this.updateAverageTime(responseTime);
      
      return personalizedCompletion;
    } catch (error) {
      logger.error('Enhanced code completion failed', { error: error.message, context });
      throw error;
    }
  }

  /**
   * Get predictive typing suggestions
   */
  async getPredictiveCompletion(context) {
    if (!this.predictiveTyping.enabled) return null;
    
    const { code, position } = context;
    const currentLine = this.getCurrentLine(code, position);
    const patterns = this.predictiveCache.get('patterns');
    
    for (const [patternName, pattern] of Object.entries(patterns)) {
      if (currentLine.includes(pattern.trigger)) {
        const predictions = pattern.predictions.slice(0, this.predictiveTyping.maxPredictions).map(pred => ({
          text: pred,
          kind: 'predictive',
          confidence: 0.9,
          source: 'predictive_typing'
        }));
        
        return {
          completions: predictions,
          confidence: 0.9,
          type: 'predictive',
          provider: 'predictive_typing'
        };
      }
    }
    
    return null;
  }

  /**
   * Process natural language programming request
   */
  async processNaturalLanguageRequest(request, language = 'javascript') {
    if (!this.naturalLanguageProgramming.enabled) {
      throw new Error('Natural language programming is disabled');
    }
    
    if (!this.naturalLanguageProgramming.supportedLanguages.includes(language)) {
      throw new Error(`Language ${language} not supported for natural language programming`);
    }
    
    this.completionStats.naturalLanguageRequests++;
    
    // Parse natural language intent
    const intent = await this.parseNaturalLanguageIntent(request);
    
    // Find matching template
    const template = this.findMatchingTemplate(intent, language);
    
    if (template) {
      // Generate code from template
      return await this.generateCodeFromTemplate(template, intent, language);
    } else {
      // Use AI to generate code
      return await this.generateCodeFromNaturalLanguage(request, language);
    }
  }

  /**
   * Parse natural language intent
   */
  async parseNaturalLanguageIntent(request) {
    const lowerRequest = request.toLowerCase();
    
    // Simple intent recognition
    const intents = {
      'create function': ['create function', 'make function', 'function that', 'function to'],
      'create class': ['create class', 'make class', 'class that', 'class for'],
      'api call': ['api call', 'fetch data', 'http request', 'call api'],
      'error handling': ['error handling', 'try catch', 'handle error', 'catch exception']
    };
    
    for (const [intent, triggers] of Object.entries(intents)) {
      if (triggers.some(trigger => lowerRequest.includes(trigger))) {
        return {
          type: intent,
          originalRequest: request,
          parameters: this.extractParameters(request, intent)
        };
      }
    }
    
    return {
      type: 'general',
      originalRequest: request,
      parameters: {}
    };
  }

  /**
   * Find matching natural language template
   */
  findMatchingTemplate(intent, language) {
    const templates = this.naturalLanguageProgramming.templates.get(intent.type);
    return templates ? templates[language] : null;
  }

  /**
   * Generate code from natural language template
   */
  async generateCodeFromTemplate(template, intent, language) {
    let code = template;
    
    // Replace template variables
    const params = intent.parameters;
    for (const [key, value] of Object.entries(params)) {
      code = code.replace(new RegExp(`\$\{${key}\}`, 'g'), value);
    }
    
    // Fill in default values for remaining placeholders
    code = code.replace(/\$\{name\}/g, 'generatedFunction');
    code = code.replace(/\$\{params\}/g, '');
    code = code.replace(/\$\{body\}/g, '// TODO: Implement');
    
    return {
      code,
      language,
      source: 'template',
      intent: intent.type
    };
  }

  /**
   * Generate code from natural language using AI
   */
  async generateCodeFromNaturalLanguage(request, language) {
    const prompt = `Convert this natural language request to ${language} code: "${request}"

Provide clean, working code with comments.`;
    
    const provider = this.aiModels.getBestProvider('code');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: `You are an expert ${language} developer. Convert natural language requests to clean, efficient code.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 1000,
      temperature: 0.3
    });
    
    return {
      code: this.extractCodeFromResponse(response.content),
      language,
      source: 'ai_generation',
      originalRequest: request
    };
  }

  /**
   * Extract parameters from natural language request
   */
  extractParameters(request, intentType) {
    const params = {};
    
    // Simple parameter extraction based on intent type
    if (intentType === 'create function') {
      const nameMatch = request.match(/function\s+(?:called\s+|named\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/i);
      if (nameMatch) params.name = nameMatch[1];
    }
    
    return params;
  }

  /**
   * Analyze code context for better completion
   */
  async analyzeCodeContext(context) {
    const { code, position, language, filePath } = context;
    
    // Detect language if not provided
    const detectedLanguage = language || this.detectLanguage(filePath);
    const langConfig = this.languageConfigs.get(detectedLanguage);
    
    if (!langConfig) {
      throw new Error(`Unsupported language: ${detectedLanguage}`);
    }
    
    // Extract relevant code around cursor
    const lines = code.split('\n');
    const currentLine = lines[position.line] || '';
    const beforeCursor = currentLine.substring(0, position.character);
    const afterCursor = currentLine.substring(position.character);
    
    // Get surrounding context
    const contextLines = this.getContextLines(lines, position.line, 10);
    
    // Analyze patterns
    const patterns = this.analyzePatterns(contextLines.join('\n'), langConfig);
    
    // Determine completion type
    const completionType = this.determineCompletionType(beforeCursor, langConfig);
    
    return {
      language: detectedLanguage,
      currentLine,
      beforeCursor,
      afterCursor,
      contextLines,
      patterns,
      completionType,
      langConfig
    };
  }

  /**
   * Generate AI-powered completion
   */
  async generateAICompletion(context, analysis) {
    const { code, position } = context;
    const { language, beforeCursor, contextLines, completionType } = analysis;
    
    // Prepare prompt for AI
    const prompt = this.buildCompletionPrompt({
      language,
      code: contextLines.join('\n'),
      beforeCursor,
      completionType
    });
    
    // Get best AI provider for code completion
    const provider = this.aiModels.getBestProvider('code');
    
    // Send request to AI
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: 'You are an expert code completion assistant. Provide accurate, contextual code completions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 500,
      temperature: 0.2 // Lower temperature for more deterministic code
    });
    
    // Parse and format completion
    const completion = this.parseCompletion(response.content, analysis);
    
    return {
      completions: completion.suggestions,
      type: completionType,
      confidence: completion.confidence,
      provider: provider.name,
      responseTime: Date.now() - Date.now()
    };
  }

  /**
   * Build completion prompt for AI
   */
  buildCompletionPrompt({ language, code, beforeCursor, completionType }) {
    return `Complete the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Cursor position: after "${beforeCursor}"
Completion type: ${completionType}

Provide 3-5 relevant completions in JSON format:
{
  "suggestions": [
    {
      "text": "completion text",
      "description": "what this completion does",
      "confidence": 0.9
    }
  ]
}`;
  }

  /**
   * Parse AI completion response
   */
  parseCompletion(content, analysis) {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          suggestions: parsed.suggestions || [],
          confidence: this.calculateOverallConfidence(parsed.suggestions)
        };
      }
    } catch (error) {
      logger.warn('Failed to parse AI completion response', { error: error.message });
    }
    
    // Fallback: treat entire response as single suggestion
    return {
      suggestions: [{
        text: content.trim(),
        description: 'AI generated completion',
        confidence: 0.5
      }],
      confidence: 0.5
    };
  }

  /**
   * Generate code from natural language description
   */
  async generateCode(description, options = {}) {
    const { language = 'javascript', style = 'modern', framework } = options;
    
    const prompt = this.buildCodeGenerationPrompt(description, language, style, framework);
    
    const provider = this.aiModels.getBestProvider('code');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: `You are an expert ${language} developer. Generate clean, efficient, and well-documented code.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 2000,
      temperature: 0.3
    });
    
    return {
      code: this.extractCodeFromResponse(response.content),
      language,
      description,
      provider: provider.name,
      metadata: {
        style,
        framework,
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Explain code functionality
   */
  async explainCode(code, options = {}) {
    const { language, level = 'intermediate' } = options;
    
    const detectedLanguage = language || this.detectLanguageFromCode(code);
    
    const prompt = `Explain the following ${detectedLanguage} code in ${level} level detail:

\`\`\`${detectedLanguage}
${code}
\`\`\`

Provide:
1. Overall purpose
2. Step-by-step breakdown
3. Key concepts used
4. Potential improvements`;
    
    const provider = this.aiModels.getBestProvider('analysis');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: 'You are a code explanation expert. Provide clear, educational explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 1500,
      temperature: 0.4
    });
    
    return {
      explanation: response.content,
      language: detectedLanguage,
      level,
      provider: provider.name
    };
  }

  /**
   * Review code for issues and improvements
   */
  async reviewCode(code, options = {}) {
    const { language, focus = 'all' } = options;
    
    const detectedLanguage = language || this.detectLanguageFromCode(code);
    
    // Perform static analysis
    const staticAnalysis = this.performStaticAnalysis(code, detectedLanguage);
    
    // Get AI review
    const aiReview = await this.getAICodeReview(code, detectedLanguage, focus);
    
    return {
      language: detectedLanguage,
      staticAnalysis,
      aiReview,
      combinedScore: this.calculateCodeQualityScore(staticAnalysis, aiReview),
      recommendations: this.generateRecommendations(staticAnalysis, aiReview)
    };
  }

  /**
   * Perform static code analysis
   */
  performStaticAnalysis(code, language) {
    const issues = [];
    const metrics = {
      linesOfCode: code.split('\n').length,
      complexity: 0,
      maintainabilityIndex: 0
    };
    
    // Check for anti-patterns
    const antiPatterns = this.codePatterns.get('antiPatterns');
    for (const [pattern, config] of Object.entries(antiPatterns)) {
      if (pattern === 'longFunction' && metrics.linesOfCode > config.threshold) {
        issues.push({ type: 'warning', pattern, message: config.message });
      }
      if (config.pattern && config.pattern.test(code)) {
        issues.push({ type: 'warning', pattern, message: config.message });
      }
    }
    
    // Check for security issues
    const securityPatterns = this.codePatterns.get('securityPatterns');
    for (const [pattern, config] of Object.entries(securityPatterns)) {
      if (config.pattern.test(code)) {
        issues.push({ type: 'security', pattern, message: config.message });
      }
    }
    
    return { issues, metrics };
  }

  /**
   * Get AI-powered code review
   */
  async getAICodeReview(code, language, focus) {
    const prompt = `Review the following ${language} code focusing on ${focus}:

\`\`\`${language}
${code}
\`\`\`

Provide a detailed review covering:
1. Code quality and style
2. Performance considerations
3. Security issues
4. Best practices
5. Specific improvements

Format as JSON:
{
  "overallRating": 1-10,
  "issues": [{"type": "error|warning|info", "line": number, "message": "description"}],
  "suggestions": ["improvement suggestions"],
  "positives": ["good practices found"]
}`;
    
    const provider = this.aiModels.getBestProvider('analysis');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: 'You are a senior code reviewer. Provide constructive, detailed feedback.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 1500,
      temperature: 0.3
    });
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logger.warn('Failed to parse AI review response', { error: error.message });
    }
    
    return {
      overallRating: 5,
      issues: [],
      suggestions: [response.content],
      positives: []
    };
  }

  // Utility methods
  detectLanguage(filePath) {
    if (!filePath) return 'javascript';
    
    const ext = path.extname(filePath).toLowerCase();
    for (const [lang, config] of this.languageConfigs.entries()) {
      if (config.extensions.includes(ext)) {
        return lang;
      }
    }
    return 'javascript';
  }

  detectLanguageFromCode(code) {
    // Simple heuristic-based language detection
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('function') || code.includes('=>')) return 'javascript';
    if (code.includes('interface') || code.includes('type ')) return 'typescript';
    if (code.includes('public class')) return 'java';
    if (code.includes('func ') && code.includes('package')) return 'go';
    return 'javascript';
  }

  getContextLines(lines, currentLine, contextSize) {
    const start = Math.max(0, currentLine - contextSize);
    const end = Math.min(lines.length, currentLine + contextSize + 1);
    return lines.slice(start, end);
  }

  determineCompletionType(beforeCursor, langConfig) {
    const trimmed = beforeCursor.trim();
    
    if (trimmed.endsWith('.')) return 'member';
    if (trimmed.endsWith('(')) return 'parameter';
    if (trimmed.endsWith('{')) return 'block';
    if (trimmed.endsWith('[')) return 'index';
    if (langConfig.keywords.some(kw => trimmed.endsWith(kw))) return 'keyword';
    
    return 'general';
  }

  generateCacheKey(context) {
    const { code, position, language } = context;
    const contextStr = code.substring(Math.max(0, position.character - 100), position.character + 100);
    return `${language}:${Buffer.from(contextStr).toString('base64').substring(0, 32)}`;
  }

  /**
   * Generate enhanced cache key with user context and semantic information
   */
  generateEnhancedCacheKey(context) {
    const { code, position, language, userId, projectContext } = context;
    const contextStr = code.substring(Math.max(0, position.character - 200), position.character + 200);
    const userStr = userId || 'anonymous';
    const projectStr = projectContext ? JSON.stringify(projectContext).substring(0, 50) : '';
    
    const combinedContext = `${language}:${contextStr}:${userStr}:${projectStr}`;
    return `enhanced_${crypto.createHash('md5').update(combinedContext).digest('hex')}`;
  }

  /**
   * Analyze enhanced code context with semantic understanding
   */
  async analyzeEnhancedCodeContext(context) {
    const basicAnalysis = await this.analyzeCodeContext(context);
    
    // Add semantic analysis
    const semanticContext = await this.analyzeSemanticContext(context.code, context.position);
    
    // Add project context analysis
    const projectContext = await this.analyzeProjectContext(context.projectContext);
    
    // Add user style analysis
    const userStyle = await this.analyzeUserStyle(context.userId);
    
    return {
      ...basicAnalysis,
      semantic: semanticContext,
      project: projectContext,
      userStyle: userStyle,
      enhanced: true
    };
  }

  /**
   * Analyze semantic context using semantic index
   */
  async analyzeSemanticContext(code, position) {
    const surroundingCode = this.getSurroundingCode(code, position, 500);
    const semanticCategories = [];
    
    for (const [category, keywords] of this.semanticIndex.entries()) {
      for (const keyword of keywords) {
        if (surroundingCode.toLowerCase().includes(keyword)) {
          semanticCategories.push(category);
          break;
        }
      }
    }
    
    return {
      categories: semanticCategories,
      dominantCategory: semanticCategories[0] || 'general',
      complexity: this.calculateSemanticComplexity(surroundingCode)
    };
  }

  /**
   * Analyze project context
   */
  async analyzeProjectContext(projectContext) {
    if (!projectContext) return { type: 'unknown', frameworks: [], patterns: [] };
    
    return {
      type: projectContext.type || 'unknown',
      frameworks: projectContext.frameworks || [],
      patterns: projectContext.patterns || [],
      dependencies: projectContext.dependencies || []
    };
  }

  /**
   * Analyze user coding style
   */
  async analyzeUserStyle(userId) {
    if (!userId) return { preferences: {}, patterns: [] };
    
    const userStyle = this.userCodingStyle.get(userId) || {
      preferences: {
        indentStyle: 'spaces',
        indentSize: 2,
        semicolons: true,
        quotes: 'single'
      },
      patterns: [],
      frequency: new Map()
    };
    
    return userStyle;
  }

  /**
   * Generate enhanced AI completion with multi-model approach
   */
  async generateEnhancedAICompletion(context, analysis) {
    // Select best model based on context
    const selectedModel = this.selectBestModelForContext(analysis);
    
    // Build enhanced prompt with semantic and user context
    const prompt = this.buildEnhancedCompletionPrompt(context, analysis);
    
    const provider = this.aiModels.getBestProvider('code');
    
    const response = await this.aiModels.sendRequest(provider.id, {
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(analysis)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 500,
      temperature: 0.2
    });
    
    return this.parseEnhancedCompletion(response.content, analysis);
  }

  /**
   * Build enhanced completion prompt
   */
  buildEnhancedCompletionPrompt(context, analysis) {
    const { code, position, language } = context;
    const { semantic, project, userStyle } = analysis;
    
    let prompt = `Complete the following ${language} code:\n\n`;
    prompt += `\`\`\`${language}\n${analysis.contextLines.join('\n')}\n\`\`\`\n\n`;
    prompt += `Cursor position: after "${analysis.beforeCursor}"\n`;
    prompt += `Completion type: ${analysis.completionType}\n`;
    
    if (semantic.dominantCategory !== 'general') {
      prompt += `Context category: ${semantic.dominantCategory}\n`;
    }
    
    if (project.frameworks.length > 0) {
      prompt += `Project frameworks: ${project.frameworks.join(', ')}\n`;
    }
    
    if (userStyle.preferences) {
      prompt += `User preferences: ${JSON.stringify(userStyle.preferences)}\n`;
    }
    
    prompt += `\nProvide 3-5 relevant completions in JSON format with confidence scores.`;
    
    return prompt;
  }

  /**
   * Build system prompt based on analysis
   */
  buildSystemPrompt(analysis) {
    let systemPrompt = 'You are an expert code completion assistant. ';
    
    if (analysis.semantic.dominantCategory !== 'general') {
      systemPrompt += `Focus on ${analysis.semantic.dominantCategory} related completions. `;
    }
    
    if (analysis.project.frameworks.length > 0) {
      systemPrompt += `Consider ${analysis.project.frameworks.join(' and ')} best practices. `;
    }
    
    systemPrompt += 'Provide accurate, contextual code completions with confidence scores.';
    
    return systemPrompt;
  }

  /**
   * Parse enhanced completion response
   */
  parseEnhancedCompletion(content, analysis) {
    const basicCompletion = this.parseCompletion(content, analysis);
    
    // Enhance with semantic scoring
    const enhancedSuggestions = basicCompletion.suggestions.map(suggestion => ({
      ...suggestion,
      semanticScore: this.calculateSemanticScore(suggestion.text, analysis.semantic),
      contextRelevance: this.calculateContextRelevance(suggestion.text, analysis)
    }));
    
    // Sort by combined score
    enhancedSuggestions.sort((a, b) => {
      const scoreA = (a.confidence + a.semanticScore + a.contextRelevance) / 3;
      const scoreB = (b.confidence + b.semanticScore + b.contextRelevance) / 3;
      return scoreB - scoreA;
    });
    
    return {
      ...basicCompletion,
      completions: enhancedSuggestions,
      enhanced: true
    };
  }

  /**
   * Personalize completion based on user learning
   */
  async personalizeCompletion(completion, userId) {
    if (!userId) return completion;
    
    const userLearning = this.learningData.userPatterns.get(userId);
    if (!userLearning) return completion;
    
    // Boost completions that match user patterns
    const personalizedCompletions = completion.completions.map(comp => {
      const personalityScore = this.calculatePersonalityScore(comp.text, userLearning);
      return {
        ...comp,
        confidence: Math.min(1.0, comp.confidence + personalityScore * 0.2),
        personalized: personalityScore > 0
      };
    });
    
    // Re-sort by updated confidence
    personalizedCompletions.sort((a, b) => b.confidence - a.confidence);
    
    return {
      ...completion,
      completions: personalizedCompletions,
      personalized: true
    };
  }

  /**
   * Enhance cached result with user learning
   */
  async enhanceWithUserLearning(cached, userId) {
    if (!userId) return cached;
    
    return await this.personalizeCompletion(cached, userId);
  }

  /**
   * Update user learning data
   */
  async updateUserLearning(context, completion) {
    const { userId } = context;
    if (!userId) return;
    
    // Update user patterns
    let userPatterns = this.learningData.userPatterns.get(userId);
    if (!userPatterns) {
      userPatterns = {
        completionHistory: [],
        preferredPatterns: new Map(),
        rejectedPatterns: new Map()
      };
      this.learningData.userPatterns.set(userId, userPatterns);
    }
    
    // Add to completion history
    userPatterns.completionHistory.push({
      context: context.code.substring(Math.max(0, context.position.character - 50), context.position.character + 50),
      completion: completion.completions[0]?.text || '',
      timestamp: Date.now()
    });
    
    // Keep only recent history
    if (userPatterns.completionHistory.length > 1000) {
      userPatterns.completionHistory = userPatterns.completionHistory.slice(-1000);
    }
  }

  /**
   * Update learning data periodically
   */
  updateLearningData() {
    // Analyze completion patterns
    for (const [userId, patterns] of this.learningData.userPatterns.entries()) {
      this.analyzeUserCompletionPatterns(userId, patterns);
    }
    
    // Update frequent completions
    this.updateFrequentCompletions();
    
    // Clean old data
    this.cleanOldLearningData();
  }

  /**
   * Optimize caches periodically
   */
  optimizeCaches() {
    // Remove expired entries
    const now = Date.now();
    
    for (const [key, entry] of this.completionCache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.completionCache.delete(key);
      }
    }
    
    for (const [key, entry] of this.semanticCache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        this.semanticCache.delete(key);
      }
    }
    
    // Optimize cache size
    if (this.completionCache.size > this.cacheMaxSize) {
      const entries = Array.from(this.completionCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, entries.length - this.cacheMaxSize);
      toRemove.forEach(([key]) => this.completionCache.delete(key));
    }
  }

  getFromCache(key) {
    const cached = this.completionCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.completionCache.delete(key);
    return null;
  }

  addToCache(key, data) {
    if (this.completionCache.size >= this.cacheMaxSize) {
      const firstKey = this.completionCache.keys().next().value;
      this.completionCache.delete(firstKey);
    }
    
    this.completionCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  updateAverageTime(responseTime) {
    const total = this.completionStats.averageTime * (this.completionStats.successful - 1);
    this.completionStats.averageTime = (total + responseTime) / this.completionStats.successful;
  }

  calculateOverallConfidence(suggestions) {
    if (!suggestions || suggestions.length === 0) return 0;
    const total = suggestions.reduce((sum, s) => sum + (s.confidence || 0.5), 0);
    return total / suggestions.length;
  }

  /**
   * Get current line from code and position
   */
  getCurrentLine(code, position) {
    const lines = code.split('\n');
    return lines[position.line] || '';
  }

  /**
   * Get surrounding code context
   */
  getSurroundingCode(code, position, contextSize) {
    const start = Math.max(0, position.character - contextSize);
    const end = Math.min(code.length, position.character + contextSize);
    return code.substring(start, end);
  }

  /**
   * Calculate semantic complexity of code
   */
  calculateSemanticComplexity(code) {
    let complexity = 0;
    
    // Count control structures
    const controlStructures = ['if', 'for', 'while', 'switch', 'try', 'catch'];
    controlStructures.forEach(structure => {
      const matches = code.match(new RegExp(`\\b${structure}\\b`, 'g'));
      if (matches) complexity += matches.length;
    });
    
    // Count function definitions
    const functionMatches = code.match(/function\s+\w+|\w+\s*=>|def\s+\w+/g);
    if (functionMatches) complexity += functionMatches.length * 2;
    
    return Math.min(10, complexity); // Cap at 10
  }

  /**
   * Select best model for context
   */
  selectBestModelForContext(analysis) {
    // Simple model selection based on context
    if (analysis.semantic.complexity > 7) {
      return 'advanced'; // Use more powerful model for complex code
    }
    
    if (analysis.semantic.dominantCategory === 'algorithms') {
      return 'specialized'; // Use algorithm-specialized model
    }
    
    return 'standard'; // Default model
  }

  /**
   * Calculate semantic score for suggestion
   */
  calculateSemanticScore(suggestionText, semanticContext) {
    let score = 0.5; // Base score
    
    // Check if suggestion matches semantic category
    const category = semanticContext.dominantCategory;
    if (category !== 'general') {
      const keywords = this.semanticIndex.get(category);
      if (keywords) {
        for (const keyword of keywords) {
          if (suggestionText.toLowerCase().includes(keyword)) {
            score += 0.2;
            break;
          }
        }
      }
    }
    
    return Math.min(1.0, score);
  }

  /**
   * Calculate context relevance score
   */
  calculateContextRelevance(suggestionText, analysis) {
    let relevance = 0.5;
    
    // Check against current patterns
    if (analysis.patterns) {
      for (const [patternType, matches] of Object.entries(analysis.patterns)) {
        if (matches.length > 0 && suggestionText.includes(patternType)) {
          relevance += 0.1;
        }
      }
    }
    
    // Check against project context
    if (analysis.project && analysis.project.frameworks) {
      for (const framework of analysis.project.frameworks) {
        if (suggestionText.toLowerCase().includes(framework.toLowerCase())) {
          relevance += 0.2;
          break;
        }
      }
    }
    
    return Math.min(1.0, relevance);
  }

  /**
   * Calculate personality score based on user patterns
   */
  calculatePersonalityScore(suggestionText, userLearning) {
    let score = 0;
    
    // Check against preferred patterns
    for (const [pattern, frequency] of userLearning.preferredPatterns.entries()) {
      if (suggestionText.includes(pattern)) {
        score += frequency * 0.1;
      }
    }
    
    // Check against rejected patterns
    for (const [pattern, frequency] of userLearning.rejectedPatterns.entries()) {
      if (suggestionText.includes(pattern)) {
        score -= frequency * 0.1;
      }
    }
    
    return Math.max(-0.5, Math.min(0.5, score));
  }

  /**
   * Analyze user completion patterns
   */
  analyzeUserCompletionPatterns(userId, patterns) {
    const recentHistory = patterns.completionHistory.slice(-100); // Last 100 completions
    
    // Count pattern frequencies
    const patternCounts = new Map();
    recentHistory.forEach(entry => {
      const words = entry.completion.split(/\W+/).filter(w => w.length > 2);
      words.forEach(word => {
        patternCounts.set(word, (patternCounts.get(word) || 0) + 1);
      });
    });
    
    // Update preferred patterns
    patterns.preferredPatterns.clear();
    for (const [pattern, count] of patternCounts.entries()) {
      if (count >= 3) { // Pattern used at least 3 times
        patterns.preferredPatterns.set(pattern, count / recentHistory.length);
      }
    }
  }

  /**
   * Update frequent completions across all users
   */
  updateFrequentCompletions() {
    const globalPatterns = new Map();
    
    // Aggregate patterns from all users
    for (const [userId, patterns] of this.learningData.userPatterns.entries()) {
      for (const [pattern, frequency] of patterns.preferredPatterns.entries()) {
        globalPatterns.set(pattern, (globalPatterns.get(pattern) || 0) + frequency);
      }
    }
    
    // Update frequent completions
    this.learningData.frequentCompletions.clear();
    const sortedPatterns = Array.from(globalPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100); // Top 100 patterns
    
    sortedPatterns.forEach(([pattern, frequency]) => {
      this.learningData.frequentCompletions.set(pattern, frequency);
    });
  }

  /**
   * Clean old learning data
   */
  cleanOldLearningData() {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    for (const [userId, patterns] of this.learningData.userPatterns.entries()) {
      patterns.completionHistory = patterns.completionHistory.filter(
        entry => entry.timestamp > cutoffTime
      );
      
      // Remove users with no recent activity
      if (patterns.completionHistory.length === 0) {
        this.learningData.userPatterns.delete(userId);
      }
    }
  }
  
  /**
   * Set project context for better completions
   */
  setProjectContext(projectPath, context) {
    this.projectContext.set(projectPath, {
      ...context,
      timestamp: Date.now()
    });
    
    logger.info('Project context updated', { projectPath, context });
  }
  
  /**
   * Get project context
   */
  getProjectContext(projectPath) {
    return this.projectContext.get(projectPath) || {
      type: 'unknown',
      frameworks: [],
      patterns: [],
      dependencies: []
    };
  }
  
  /**
   * Set user coding preferences
   */
  setUserPreferences(userId, preferences) {
    let userStyle = this.userCodingStyle.get(userId) || {
      preferences: {},
      patterns: [],
      frequency: new Map()
    };
    
    userStyle.preferences = { ...userStyle.preferences, ...preferences };
    userStyle.timestamp = Date.now();
    
    this.userCodingStyle.set(userId, userStyle);
    
    logger.info('User preferences updated', { userId, preferences });
  }
  
  /**
   * Get user coding preferences
   */
  getUserPreferences(userId) {
    const userStyle = this.userCodingStyle.get(userId);
    return userStyle ? userStyle.preferences : {
      indentStyle: 'spaces',
      indentSize: 2,
      semicolons: true,
      quotes: 'single'
    };
  }
  
  /**
   * Extract code from AI response
   */
  extractCodeFromResponse(response) {
    // Try to extract code from markdown code blocks
    const codeBlockMatch = response.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // Try to extract code from single backticks
    const inlineCodeMatch = response.match(/`([^`]+)`/);
    if (inlineCodeMatch) {
      return inlineCodeMatch[1].trim();
    }
    
    // Return the response as-is if no code blocks found
    return response.trim();
  }
  
  /**
   * Cache result with semantic indexing
   */
  async cacheWithSemanticIndex(cacheKey, completion, context) {
    // Store in completion cache
    this.completionCache.set(cacheKey, {
      data: completion,
      timestamp: Date.now()
    });
    
    // Store semantic information
    if (context.semantic) {
      const semanticKey = `semantic_${context.semantic.dominantCategory}`;
      let semanticEntries = this.semanticCache.get(semanticKey) || [];
      semanticEntries.push({
        cacheKey,
        categories: context.semantic.categories,
        timestamp: Date.now()
      });
      
      // Keep only recent entries
      if (semanticEntries.length > 100) {
        semanticEntries = semanticEntries.slice(-100);
      }
      
      this.semanticCache.set(semanticKey, semanticEntries);
    }
  }
  
  /**
   * Update completion statistics
   */
  updateCompletionStats(startTime, completion) {
    const responseTime = Date.now() - startTime;
    
    this.completionStats.totalRequests++;
    this.completionStats.successful++;
    this.completionStats.averageResponseTime = 
      (this.completionStats.averageResponseTime + responseTime) / 2;
    
    if (completion.enhanced) {
      this.completionStats.enhancedRequests++;
    }
    
    if (completion.personalized) {
      this.completionStats.personalizedRequests++;
    }
  }
  
  /**
   * Update user learning from completion selection
   */
  async updateUserLearningFromCompletion(completion, userId) {
    if (!userId || !completion.completions) return;
    
    // This would be called when user selects a completion
    // For now, we'll just log the completion for learning
    const selectedCompletion = completion.completions[0]; // Assume first is selected
    
    let userPatterns = this.learningData.userPatterns.get(userId);
    if (!userPatterns) {
      userPatterns = {
        completionHistory: [],
        preferredPatterns: new Map(),
        rejectedPatterns: new Map()
      };
      this.learningData.userPatterns.set(userId, userPatterns);
    }
    
    // Extract patterns from selected completion
    const patterns = this.extractPatternsFromCompletion(selectedCompletion.text);
    patterns.forEach(pattern => {
      const current = userPatterns.preferredPatterns.get(pattern) || 0;
      userPatterns.preferredPatterns.set(pattern, current + 1);
    });
  }
  
  /**
   * Extract patterns from completion text
   */
  extractPatternsFromCompletion(completionText) {
    const patterns = [];
    
    // Extract function calls
    const functionCalls = completionText.match(/\w+\(/g);
    if (functionCalls) {
      patterns.push(...functionCalls.map(call => call.slice(0, -1)));
    }
    
    // Extract keywords
    const keywords = completionText.match(/\b(const|let|var|function|class|if|for|while|return|async|await)\b/g);
    if (keywords) {
      patterns.push(...keywords);
    }
    
    // Extract operators
    const operators = completionText.match(/[=+\-*/<>!&|]+/g);
    if (operators) {
      patterns.push(...operators);
    }
    
    return [...new Set(patterns)]; // Remove duplicates
  }
  
  /**
   * Semantic search in code completions
   */
  async semanticSearch(query, context) {
    const results = [];
    
    // Search in semantic index
    for (const [category, entries] of this.semanticIndex.entries()) {
      if (category.toLowerCase().includes(query.toLowerCase())) {
        results.push(...entries.map(entry => ({
          ...entry,
          relevance: this.calculateSemanticRelevance(query, entry),
          category
        })));
      }
    }
    
    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);
    
    return results.slice(0, 10); // Return top 10 results
  }
  
  /**
   * Calculate semantic relevance score
   */
  calculateSemanticRelevance(query, entry) {
    let score = 0;
    const queryWords = query.toLowerCase().split(' ');
    const entryText = (entry.code + ' ' + entry.description).toLowerCase();
    
    queryWords.forEach(word => {
      if (entryText.includes(word)) {
        score += 1;
      }
    });
    
    // Boost score for exact matches
    if (entryText.includes(query.toLowerCase())) {
      score += 5;
    }
    
    return score;
  }
  
  /**
   * Get intelligent code suggestions based on context
   */
  async getIntelligentSuggestions(context) {
    const suggestions = [];
    
    // Get suggestions from semantic index
    const semanticSuggestions = await this.semanticSearch(context.currentWord || '', context);
    suggestions.push(...semanticSuggestions);
    
    // Get suggestions from user patterns
    if (context.userId) {
      const userPatterns = this.learningData.userPatterns.get(context.userId);
      if (userPatterns) {
        const patternSuggestions = this.getSuggestionsFromUserPatterns(userPatterns, context);
        suggestions.push(...patternSuggestions);
      }
    }
    
    // Get suggestions from project context
    if (context.projectPath) {
      const projectContext = this.getProjectContext(context.projectPath);
      const projectSuggestions = this.getSuggestionsFromProjectContext(projectContext, context);
      suggestions.push(...projectSuggestions);
    }
    
    // Remove duplicates and sort by relevance
    const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
    return uniqueSuggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
  }
  
  /**
   * Get suggestions from user patterns
   */
  getSuggestionsFromUserPatterns(userPatterns, context) {
    const suggestions = [];
    
    for (const [pattern, frequency] of userPatterns.preferredPatterns.entries()) {
      if (pattern.toLowerCase().includes(context.currentWord?.toLowerCase() || '')) {
        suggestions.push({
          text: pattern,
          type: 'user_pattern',
          relevance: frequency * 2, // User patterns get higher relevance
          description: `Frequently used pattern (${frequency} times)`
        });
      }
    }
    
    return suggestions;
  }
  
  /**
   * Get suggestions from project context
   */
  getSuggestionsFromProjectContext(projectContext, context) {
    const suggestions = [];
    
    // Suggest framework-specific patterns
    projectContext.frameworks.forEach(framework => {
      const frameworkPatterns = this.getFrameworkPatterns(framework);
      frameworkPatterns.forEach(pattern => {
        if (pattern.toLowerCase().includes(context.currentWord?.toLowerCase() || '')) {
          suggestions.push({
            text: pattern,
            type: 'framework_pattern',
            relevance: 3,
            description: `${framework} pattern`,
            framework
          });
        }
      });
    });
    
    // Suggest project-specific patterns
    projectContext.patterns.forEach(pattern => {
      if (pattern.toLowerCase().includes(context.currentWord?.toLowerCase() || '')) {
        suggestions.push({
          text: pattern,
          type: 'project_pattern',
          relevance: 4,
          description: 'Project-specific pattern'
        });
      }
    });
    
    return suggestions;
  }
  
  /**
   * Get framework-specific patterns
   */
  getFrameworkPatterns(framework) {
    const patterns = {
      'react': ['useState', 'useEffect', 'useContext', 'useCallback', 'useMemo', 'jsx', 'props', 'state'],
      'vue': ['ref', 'reactive', 'computed', 'watch', 'onMounted', 'onUnmounted', 'props', 'emit'],
      'angular': ['Component', 'Injectable', 'Input', 'Output', 'EventEmitter', 'OnInit', 'OnDestroy'],
      'express': ['app.get', 'app.post', 'req', 'res', 'next', 'middleware', 'router'],
      'django': ['models', 'views', 'urls', 'forms', 'templates', 'admin'],
      'spring': ['@Controller', '@Service', '@Repository', '@Autowired', '@RequestMapping']
    };
    
    return patterns[framework.toLowerCase()] || [];
  }
  
  /**
   * Remove duplicate suggestions
   */
  removeDuplicateSuggestions(suggestions) {
    const seen = new Set();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.text}_${suggestion.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Advanced cache optimization
   */
  optimizeCache() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    // Clean completion cache
    for (const [key, entry] of this.completionCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.completionCache.delete(key);
      }
    }
    
    // Clean semantic cache
    for (const [key, entries] of this.semanticCache.entries()) {
      const validEntries = entries.filter(entry => now - entry.timestamp <= maxAge);
      if (validEntries.length === 0) {
        this.semanticCache.delete(key);
      } else {
        this.semanticCache.set(key, validEntries);
      }
    }
    
    // Clean predictive cache
    for (const [key, entry] of this.predictiveCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.predictiveCache.delete(key);
      }
    }
    
    logger.info('Cache optimization completed', {
      completionCacheSize: this.completionCache.size,
      semanticCacheSize: this.semanticCache.size,
      predictiveCacheSize: this.predictiveCache.size
    });
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      completionCache: {
        size: this.completionCache.size,
        hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
      },
      semanticCache: {
        size: this.semanticCache.size,
        categories: this.semanticCache.size
      },
      predictiveCache: {
        size: this.predictiveCache.size
      },
      totalHits: this.cacheStats.hits,
      totalMisses: this.cacheStats.misses
    };
  }

  calculateCodeQualityScore(staticAnalysis, aiReview) {
    const staticScore = Math.max(0, 10 - staticAnalysis.issues.length);
    const aiScore = aiReview.overallRating || 5;
    return (staticScore + aiScore) / 2;
  }

  generateRecommendations(staticAnalysis, aiReview) {
    const recommendations = [];
    
    // Add static analysis recommendations
    staticAnalysis.issues.forEach(issue => {
      recommendations.push({
        type: 'static',
        priority: issue.type === 'security' ? 'high' : 'medium',
        message: issue.message
      });
    });
    
    // Add AI recommendations
    if (aiReview.suggestions) {
      aiReview.suggestions.forEach(suggestion => {
        recommendations.push({
          type: 'ai',
          priority: 'medium',
          message: suggestion
        });
      });
    }
    
    return recommendations;
  }

  buildCodeGenerationPrompt(description, language, style, framework) {
    let prompt = `Generate ${language} code for: ${description}\n\n`;
    prompt += `Requirements:\n- Language: ${language}\n- Style: ${style}\n`;
    
    if (framework) {
      prompt += `- Framework: ${framework}\n`;
    }
    
    prompt += `\nGenerate clean, well-documented, and efficient code. Include comments explaining key parts.`;
    
    return prompt;
  }

  extractCodeFromResponse(content) {
    // Extract code blocks from AI response
    const codeBlockMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // If no code block, return the content as is
    return content.trim();
  }

  analyzePatterns(code, langConfig) {
    const patterns = {};
    
    for (const [patternName, pattern] of Object.entries(langConfig.patterns)) {
      const matches = [...code.matchAll(pattern)];
      patterns[patternName] = matches.map(match => ({
        match: match[0],
        name: match[1],
        index: match.index
      }));
    }
    
    return patterns;
  }

  /**
   * Get enhanced service statistics
   */
  getStats() {
    return {
      completionStats: this.completionStats,
      cacheStats: {
        completionCache: {
          size: this.completionCache.size,
          maxSize: this.cacheMaxSize,
          hitRate: this.completionStats.requests > 0 ? 
            this.completionStats.cacheHits / this.completionStats.requests : 0
        },
        semanticCache: {
          size: this.semanticCache.size,
          hitRate: 0 // TODO: Track semantic cache hits
        },
        predictiveCache: {
          size: this.predictiveCache.size,
          hitRate: this.completionStats.requests > 0 ?
            this.completionStats.predictiveHits / this.completionStats.requests : 0
        }
      },
      supportedLanguages: Array.from(this.languageConfigs.keys()),
      loadedPatterns: Array.from(this.codePatterns.keys()),
      loadedTemplates: Array.from(this.codeTemplates.keys()),
      semanticCategories: Array.from(this.semanticIndex.keys()),
      learningStats: {
        totalUsers: this.learningData.userPatterns.size,
        frequentPatterns: this.learningData.frequentCompletions.size,
        contextualPreferences: this.learningData.contextualPreferences.size
      },
      predictiveTyping: {
        enabled: this.predictiveTyping.enabled,
        confidence: this.predictiveTyping.confidence,
        maxPredictions: this.predictiveTyping.maxPredictions
      },
      naturalLanguageProgramming: {
        enabled: this.naturalLanguageProgramming.enabled,
        supportedLanguages: this.naturalLanguageProgramming.supportedLanguages,
        totalRequests: this.completionStats.naturalLanguageRequests,
        availableTemplates: this.naturalLanguageProgramming.templates.size
      }
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Clear all caches
    this.completionCache.clear();
    this.semanticCache.clear();
    this.predictiveCache.clear();
    
    // Clear learning data
    this.learningData.userPatterns.clear();
    this.learningData.frequentCompletions.clear();
    this.learningData.contextualPreferences.clear();
    this.learningData.errorPatterns.clear();
    
    // Clear configuration data
    this.codePatterns.clear();
    this.languageConfigs.clear();
    this.codeTemplates.clear();
    this.projectContext.clear();
    this.userCodingStyle.clear();
    this.semanticIndex.clear();
    
    // Clear natural language templates
    this.naturalLanguageProgramming.templates.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    logger.info('Enhanced AI Code Features Service destroyed and cleaned up');
  }
}

module.exports = AICodeFeatures;