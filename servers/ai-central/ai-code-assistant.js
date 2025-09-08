/**
 * NEXUS IDE - AI Code Assistant
 * ระบบ AI ที่เชี่ยวชาญด้านการเขียนโค้ด วิเคราะห์ และปรับปรุงโค้ด
 * 
 * Features:
 * - Intelligent Code Completion
 * - Code Generation from Natural Language
 * - Code Explanation & Documentation
 * - Code Review & Quality Analysis
 * - Refactoring Suggestions
 * - Performance Optimization
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class AICodeAssistant extends EventEmitter {
    constructor(aiModels) {
        super();
        this.aiModels = aiModels;
        this.codePatterns = new Map();
        this.languageConfigs = new Map();
        this.projectStyles = new Map();
        
        this.initializeLanguageConfigs();
        this.loadCodePatterns();
    }
    
    /**
     * Initialize language-specific configurations
     */
    initializeLanguageConfigs() {
        const configs = {
            javascript: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                frameworks: ['react', 'vue', 'angular', 'node', 'express'],
                linters: ['eslint', 'jshint'],
                formatters: ['prettier'],
                testFrameworks: ['jest', 'mocha', 'cypress']
            },
            python: {
                extensions: ['.py', '.pyw'],
                frameworks: ['django', 'flask', 'fastapi', 'pytorch', 'tensorflow'],
                linters: ['pylint', 'flake8', 'black'],
                formatters: ['black', 'autopep8'],
                testFrameworks: ['pytest', 'unittest']
            },
            java: {
                extensions: ['.java'],
                frameworks: ['spring', 'hibernate', 'junit'],
                linters: ['checkstyle', 'spotbugs'],
                formatters: ['google-java-format'],
                testFrameworks: ['junit', 'testng']
            },
            csharp: {
                extensions: ['.cs'],
                frameworks: ['.net', 'asp.net', 'blazor', 'xamarin'],
                linters: ['roslyn'],
                formatters: ['dotnet-format'],
                testFrameworks: ['nunit', 'xunit', 'mstest']
            },
            go: {
                extensions: ['.go'],
                frameworks: ['gin', 'echo', 'fiber'],
                linters: ['golint', 'go vet'],
                formatters: ['gofmt'],
                testFrameworks: ['testing']
            },
            rust: {
                extensions: ['.rs'],
                frameworks: ['actix', 'rocket', 'warp'],
                linters: ['clippy'],
                formatters: ['rustfmt'],
                testFrameworks: ['cargo test']
            }
        };
        
        for (const [lang, config] of Object.entries(configs)) {
            this.languageConfigs.set(lang, config);
        }
    }
    
    /**
     * Load common code patterns and best practices
     */
    async loadCodePatterns() {
        const patterns = {
            security: {
                'sql-injection': {
                    pattern: /(?:SELECT|INSERT|UPDATE|DELETE).*(?:WHERE|SET).*['"].*\+.*['"]|(?:SELECT|INSERT|UPDATE|DELETE).*(?:WHERE|SET).*\$\{.*\}/gi,
                    severity: 'high',
                    message: 'Potential SQL injection vulnerability detected'
                },
                'xss-vulnerability': {
                    pattern: /innerHTML\s*=\s*[^;]*\+|document\.write\s*\([^)]*\+/gi,
                    severity: 'high',
                    message: 'Potential XSS vulnerability detected'
                },
                'hardcoded-secrets': {
                    pattern: /(password|secret|key|token)\s*[=:]\s*['"][^'"]{8,}['"]/gi,
                    severity: 'critical',
                    message: 'Hardcoded secret detected'
                }
            },
            performance: {
                'inefficient-loop': {
                    pattern: /for\s*\([^)]*\)\s*\{[^}]*for\s*\([^)]*\)\s*\{[^}]*for\s*\(/gi,
                    severity: 'medium',
                    message: 'Nested loops detected - consider optimization'
                },
                'memory-leak': {
                    pattern: /setInterval\s*\((?!.*clearInterval)|setTimeout\s*\((?!.*clearTimeout)/gi,
                    severity: 'medium',
                    message: 'Potential memory leak - missing cleanup'
                }
            },
            maintainability: {
                'long-function': {
                    check: (code) => {
                        const lines = code.split('\n').length;
                        return lines > 50;
                    },
                    severity: 'low',
                    message: 'Function is too long - consider breaking it down'
                },
                'magic-numbers': {
                    pattern: /(?<!\.)\b(?!0|1)\d{2,}\b(?!\.)/g,
                    severity: 'low',
                    message: 'Magic number detected - consider using constants'
                }
            }
        };
        
        this.codePatterns = new Map(Object.entries(patterns));
    }
    
    /**
     * Generate intelligent code completion
     */
    async generateCodeCompletion(code, language, context = {}, cursorPosition = 0) {
        try {
            const { projectContext, recentFiles, imports } = context;
            
            // Analyze current code context
            const codeContext = this.analyzeCodeContext(code, language, cursorPosition);
            
            // Prepare prompt for AI
            const prompt = this.buildCompletionPrompt(code, language, codeContext, projectContext);
            
            // Get completion from best available AI model
            const completion = await this.getBestCompletion(prompt, language);
            
            // Post-process and validate completion
            const processedCompletion = this.processCompletion(completion, language, codeContext);
            
            return {
                success: true,
                completion: processedCompletion,
                confidence: this.calculateConfidence(processedCompletion, codeContext),
                alternatives: await this.generateAlternatives(prompt, language, 3),
                metadata: {
                    language,
                    context: codeContext,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                fallback: this.generateFallbackCompletion(code, language, cursorPosition)
            };
        }
    }
    
    /**
     * Generate code from natural language description
     */
    async generateCode(prompt, language, framework = null, style = 'clean') {
        try {
            const languageConfig = this.languageConfigs.get(language.toLowerCase());
            if (!languageConfig) {
                throw new Error(`Unsupported language: ${language}`);
            }
            
            // Build comprehensive prompt
            const fullPrompt = this.buildGenerationPrompt(prompt, language, framework, style, languageConfig);
            
            // Generate code using multiple AI models for comparison
            const generations = await Promise.all([
                this.generateWithModel('openai', fullPrompt, language),
                this.generateWithModel('anthropic', fullPrompt, language),
                this.generateWithModel('google', fullPrompt, language)
            ]);
            
            // Select best generation
            const bestGeneration = this.selectBestGeneration(generations, language);
            
            // Analyze and improve the generated code
            const analyzedCode = await this.analyzeGeneratedCode(bestGeneration.code, language);
            const improvedCode = await this.improveCode(analyzedCode, language, style);
            
            return {
                success: true,
                code: improvedCode.code,
                explanation: bestGeneration.explanation,
                analysis: analyzedCode,
                improvements: improvedCode.improvements,
                tests: await this.generateTests(improvedCode.code, language),
                documentation: await this.generateDocumentation(improvedCode.code, language),
                metadata: {
                    language,
                    framework,
                    style,
                    model: bestGeneration.model,
                    confidence: bestGeneration.confidence,
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Explain code in natural language
     */
    async explainCode(code, language, level = 'intermediate') {
        try {
            // Analyze code structure
            const structure = this.analyzeCodeStructure(code, language);
            
            // Generate explanation based on level
            const explanation = await this.generateExplanation(code, language, level, structure);
            
            // Generate visual diagrams if applicable
            const diagrams = await this.generateDiagrams(code, language, structure);
            
            return {
                success: true,
                explanation: explanation.text,
                summary: explanation.summary,
                keyPoints: explanation.keyPoints,
                structure,
                diagrams,
                examples: await this.generateExamples(code, language),
                relatedConcepts: this.getRelatedConcepts(code, language),
                metadata: {
                    language,
                    level,
                    complexity: this.calculateComplexity(code, language),
                    timestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Perform comprehensive code review
     */
    async reviewCode(code, language, guidelines = {}) {
        try {
            const review = {
                issues: [],
                suggestions: [],
                metrics: {},
                score: 0
            };
            
            // Security analysis
            const securityIssues = this.analyzeSecurityIssues(code, language);
            review.issues.push(...securityIssues);
            
            // Performance analysis
            const performanceIssues = this.analyzePerformanceIssues(code, language);
            review.issues.push(...performanceIssues);
            
            // Code quality analysis
            const qualityIssues = this.analyzeCodeQuality(code, language);
            review.issues.push(...qualityIssues);
            
            // Best practices check
            const bestPracticesIssues = this.checkBestPractices(code, language, guidelines);
            review.issues.push(...bestPracticesIssues);
            
            // Generate improvement suggestions
            review.suggestions = await this.generateImprovementSuggestions(code, language, review.issues);
            
            // Calculate metrics
            review.metrics = this.calculateCodeMetrics(code, language);
            
            // Calculate overall score
            review.score = this.calculateReviewScore(review.issues, review.metrics);
            
            // AI-powered detailed review
            const aiReview = await this.getAIReview(code, language, review);
            
            return {
                success: true,
                ...review,
                aiInsights: aiReview,
                refactoredCode: await this.suggestRefactoring(code, language, review.issues),
                metadata: {
                    language,
                    reviewedAt: new Date().toISOString(),
                    guidelines: Object.keys(guidelines)
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Analyze code context around cursor position
     */
    analyzeCodeContext(code, language, cursorPosition) {
        const lines = code.split('\n');
        let currentLine = 0;
        let currentChar = 0;
        
        // Find cursor line and character
        for (let i = 0; i < cursorPosition; i++) {
            if (code[i] === '\n') {
                currentLine++;
                currentChar = 0;
            } else {
                currentChar++;
            }
        }
        
        const context = {
            line: currentLine,
            character: currentChar,
            currentLineText: lines[currentLine] || '',
            previousLines: lines.slice(Math.max(0, currentLine - 5), currentLine),
            nextLines: lines.slice(currentLine + 1, currentLine + 6),
            indentation: this.getIndentation(lines[currentLine] || ''),
            scope: this.analyzeScope(code, cursorPosition, language),
            imports: this.extractImports(code, language),
            functions: this.extractFunctions(code, language),
            variables: this.extractVariables(code, language, cursorPosition)
        };
        
        return context;
    }
    
    /**
     * Build completion prompt for AI
     */
    buildCompletionPrompt(code, language, context, projectContext) {
        return `Complete the following ${language} code:

` +
               `Context: ${JSON.stringify(context, null, 2)}\n\n` +
               `Code:\n${code}\n\n` +
               `Project Context: ${projectContext ? JSON.stringify(projectContext, null, 2) : 'None'}\n\n` +
               `Please provide intelligent code completion that follows best practices and maintains consistency with the existing code style.`;
    }
    
    /**
     * Get best completion from available AI models
     */
    async getBestCompletion(prompt, language) {
        const models = ['openai', 'anthropic', 'google'];
        const completions = [];
        
        for (const model of models) {
            if (this.aiModels.has(model)) {
                try {
                    const completion = await this.generateWithModel(model, prompt, language);
                    completions.push({ model, ...completion });
                } catch (error) {
                    console.warn(`Failed to get completion from ${model}:`, error.message);
                }
            }
        }
        
        // Select best completion based on confidence and quality
        return this.selectBestCompletion(completions, language);
    }
    
    /**
     * Generate with specific AI model
     */
    async generateWithModel(modelName, prompt, language) {
        const model = this.aiModels.get(modelName);
        if (!model) {
            throw new Error(`Model ${modelName} not available`);
        }
        
        // Implementation depends on model type
        // This is a simplified version
        return {
            code: '// Generated code placeholder',
            explanation: 'Code explanation',
            confidence: 0.8
        };
    }
    
    /**
     * Analyze security issues in code
     */
    analyzeSecurityIssues(code, language) {
        const issues = [];
        const securityPatterns = this.codePatterns.get('security');
        
        for (const [name, pattern] of Object.entries(securityPatterns)) {
            if (pattern.pattern && pattern.pattern.test(code)) {
                issues.push({
                    type: 'security',
                    severity: pattern.severity,
                    message: pattern.message,
                    rule: name,
                    line: this.findPatternLine(code, pattern.pattern)
                });
            }
        }
        
        return issues;
    }
    
    /**
     * Calculate code metrics
     */
    calculateCodeMetrics(code, language) {
        const lines = code.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        const commentLines = lines.filter(line => this.isCommentLine(line, language));
        
        return {
            totalLines: lines.length,
            codeLines: nonEmptyLines.length - commentLines.length,
            commentLines: commentLines.length,
            complexity: this.calculateCyclomaticComplexity(code, language),
            maintainabilityIndex: this.calculateMaintainabilityIndex(code, language),
            duplicateLines: this.findDuplicateLines(lines),
            functionCount: this.countFunctions(code, language),
            classCount: this.countClasses(code, language)
        };
    }
}

module.exports = AICodeAssistant;