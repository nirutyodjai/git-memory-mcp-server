/**
 * NEXUS IDE - AI Code Assistant
 * Advanced AI-powered code assistant that provides intelligent code completion,
 * analysis, debugging, and optimization suggestions
 */

const { MultiModelAISystem } = require('./multi-model-ai-system');
const { AIMCPIntegration } = require('./ai-mcp-integration');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class AICodeAssistant extends EventEmitter {
    constructor() {
        super();
        this.multiModelAI = new MultiModelAISystem();
        this.codeAnalyzer = new CodeAnalyzer();
        this.contextManager = new CodeContextManager();
        this.suggestionEngine = new IntelligentSuggestionEngine();
        this.debuggingAssistant = new DebuggingAssistant();
        this.optimizationEngine = new CodeOptimizationEngine();
        this.learningSystem = new CodeLearningSystem();
        
        this.activeProjects = new Map();
        this.userPreferences = new Map();
        this.codeHistory = [];
        this.performanceMetrics = {
            totalSuggestions: 0,
            acceptedSuggestions: 0,
            rejectedSuggestions: 0,
            bugsFixed: 0,
            optimizationsApplied: 0
        };
        
        this.initializeAssistant();
    }

    async initializeAssistant() {
        console.log('🤖 Initializing AI Code Assistant...');
        
        await this.loadUserPreferences();
        await this.loadCodePatterns();
        await this.multiModelAI.on('system-ready', () => {
            console.log('✅ AI Code Assistant ready!');
            this.emit('assistant-ready');
        });
    }

    async loadUserPreferences() {
        try {
            const prefsPath = path.join(__dirname, 'data', 'user-preferences.json');
            const prefsData = await fs.readFile(prefsPath, 'utf8');
            const preferences = JSON.parse(prefsData);
            
            for (const [userId, prefs] of Object.entries(preferences)) {
                this.userPreferences.set(userId, prefs);
            }
            
            console.log('👤 Loaded user preferences');
        } catch (error) {
            console.log('👤 No user preferences found, using defaults');
        }
    }

    async loadCodePatterns() {
        try {
            const patternsPath = path.join(__dirname, 'data', 'code-patterns.json');
            const patternsData = await fs.readFile(patternsPath, 'utf8');
            const patterns = JSON.parse(patternsData);
            
            await this.learningSystem.loadPatterns(patterns);
            console.log('🧠 Loaded code patterns');
        } catch (error) {
            console.log('🧠 No code patterns found, starting fresh');
        }
    }

    // Main AI Assistant Methods
    async provideCodeCompletion(request) {
        const { code, cursorPosition, filePath, language, userId } = request;
        
        try {
            // Analyze current context
            const context = await this.contextManager.analyzeContext({
                code,
                cursorPosition,
                filePath,
                language,
                projectPath: this.getProjectPath(filePath)
            });
            
            // Get user preferences
            const userPrefs = this.userPreferences.get(userId) || this.getDefaultPreferences();
            
            // Generate completion suggestions
            const aiRequest = {
                task: 'code-completion',
                prompt: this.buildCompletionPrompt(code, cursorPosition, context, userPrefs),
                context: {
                    language,
                    filePath,
                    userStyle: userPrefs.codingStyle,
                    projectContext: context.projectContext,
                    recentChanges: context.recentChanges
                },
                mcpActions: [
                    { type: 'analyze-project-structure', path: context.projectPath },
                    { type: 'get-similar-code', pattern: context.currentPattern }
                ]
            };
            
            const result = await this.multiModelAI.processRequest(aiRequest);
            
            if (result.success) {
                const suggestions = this.parseCompletionResponse(result.response);
                
                // Rank suggestions based on context and user preferences
                const rankedSuggestions = await this.suggestionEngine.rankSuggestions(
                    suggestions, 
                    context, 
                    userPrefs
                );
                
                this.performanceMetrics.totalSuggestions += rankedSuggestions.length;
                
                return {
                    success: true,
                    suggestions: rankedSuggestions,
                    metadata: {
                        responseTime: result.metadata.responseTime,
                        confidence: result.metadata.confidence,
                        model: result.metadata.models[0],
                        context: context.summary
                    }
                };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('❌ Code completion failed:', error.message);
            return {
                success: false,
                error: error.message,
                suggestions: []
            };
        }
    }

    async analyzeCode(request) {
        const { code, filePath, language, analysisType = 'comprehensive' } = request;
        
        try {
            const analysis = await this.codeAnalyzer.analyze({
                code,
                filePath,
                language,
                type: analysisType
            });
            
            // Get AI insights
            const aiRequest = {
                task: 'code-analysis',
                prompt: this.buildAnalysisPrompt(code, analysis, analysisType),
                context: {
                    language,
                    filePath,
                    staticAnalysis: analysis,
                    analysisType
                }
            };
            
            const result = await this.multiModelAI.processRequest(aiRequest);
            
            if (result.success) {
                const insights = this.parseAnalysisResponse(result.response);
                
                return {
                    success: true,
                    analysis: {
                        static: analysis,
                        ai: insights,
                        summary: this.generateAnalysisSummary(analysis, insights)
                    },
                    recommendations: insights.recommendations || [],
                    metadata: result.metadata
                };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('❌ Code analysis failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async debugCode(request) {
        const { code, error, stackTrace, filePath, language, userId } = request;
        
        try {
            // Analyze the error and code
            const debugContext = await this.debuggingAssistant.analyzeError({
                code,
                error,
                stackTrace,
                filePath,
                language
            });
            
            const aiRequest = {
                task: 'debugging',
                prompt: this.buildDebuggingPrompt(code, error, stackTrace, debugContext),
                context: {
                    language,
                    filePath,
                    errorType: debugContext.errorType,
                    suspectedCauses: debugContext.suspectedCauses,
                    relatedCode: debugContext.relatedCode
                },
                mcpActions: [
                    { type: 'search-similar-errors', error: error },
                    { type: 'get-error-solutions', errorType: debugContext.errorType }
                ]
            };
            
            const result = await this.multiModelAI.processRequest(aiRequest);
            
            if (result.success) {
                const debugSolution = this.parseDebuggingResponse(result.response);
                
                // Validate the solution
                const validatedSolution = await this.debuggingAssistant.validateSolution(
                    debugSolution,
                    debugContext
                );
                
                if (validatedSolution.isValid) {
                    this.performanceMetrics.bugsFixed++;
                }
                
                return {
                    success: true,
                    solution: validatedSolution,
                    explanation: debugSolution.explanation,
                    fixes: debugSolution.fixes,
                    prevention: debugSolution.prevention,
                    metadata: result.metadata
                };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('❌ Code debugging failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async optimizeCode(request) {
        const { code, filePath, language, optimizationType = 'performance' } = request;
        
        try {
            // Analyze current code performance
            const performanceAnalysis = await this.optimizationEngine.analyzePerformance({
                code,
                filePath,
                language
            });
            
            const aiRequest = {
                task: 'optimization',
                prompt: this.buildOptimizationPrompt(code, performanceAnalysis, optimizationType),
                context: {
                    language,
                    filePath,
                    currentPerformance: performanceAnalysis,
                    optimizationType,
                    constraints: request.constraints || {}
                },
                mcpActions: [
                    { type: 'get-optimization-patterns', language },
                    { type: 'benchmark-code', code }
                ]
            };
            
            const result = await this.multiModelAI.processRequest(aiRequest);
            
            if (result.success) {
                const optimizations = this.parseOptimizationResponse(result.response);
                
                // Validate optimizations
                const validatedOptimizations = await this.optimizationEngine.validateOptimizations(
                    optimizations,
                    performanceAnalysis
                );
                
                this.performanceMetrics.optimizationsApplied += validatedOptimizations.length;
                
                return {
                    success: true,
                    optimizations: validatedOptimizations,
                    expectedImprovements: this.calculateExpectedImprovements(validatedOptimizations),
                    metadata: result.metadata
                };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('❌ Code optimization failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateDocumentation(request) {
        const { code, filePath, language, docType = 'comprehensive' } = request;
        
        try {
            const codeStructure = await this.codeAnalyzer.extractStructure(code, language);
            
            const aiRequest = {
                task: 'documentation',
                prompt: this.buildDocumentationPrompt(code, codeStructure, docType),
                context: {
                    language,
                    filePath,
                    structure: codeStructure,
                    docType
                }
            };
            
            const result = await this.multiModelAI.processRequest(aiRequest);
            
            if (result.success) {
                const documentation = this.parseDocumentationResponse(result.response);
                
                return {
                    success: true,
                    documentation,
                    metadata: result.metadata
                };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('❌ Documentation generation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility Methods
    buildCompletionPrompt(code, cursorPosition, context, userPrefs) {
        const beforeCursor = code.substring(0, cursorPosition);
        const afterCursor = code.substring(cursorPosition);
        
        return `Complete the following code based on the context and user preferences:

**Code before cursor:**
\`\`\`${context.language}
${beforeCursor}
\`\`\`

**Code after cursor:**
\`\`\`${context.language}
${afterCursor}
\`\`\`

**Context:**
- File: ${context.filePath}
- Function: ${context.currentFunction || 'global'}
- Class: ${context.currentClass || 'none'}
- Project type: ${context.projectType}

**User preferences:**
- Coding style: ${userPrefs.codingStyle}
- Naming convention: ${userPrefs.namingConvention}
- Comment style: ${userPrefs.commentStyle}

**Recent patterns:**
${context.recentPatterns.join('\n')}

Provide intelligent code completion suggestions that:
1. Follow the user's coding style
2. Are contextually appropriate
3. Include proper error handling
4. Follow best practices
5. Are optimized for performance

Return suggestions in JSON format with confidence scores.`;
    }

    buildAnalysisPrompt(code, staticAnalysis, analysisType) {
        return `Analyze the following code and provide comprehensive insights:

\`\`\`${staticAnalysis.language}
${code}
\`\`\`

**Static Analysis Results:**
- Complexity: ${staticAnalysis.complexity}
- Lines of code: ${staticAnalysis.linesOfCode}
- Functions: ${staticAnalysis.functions.length}
- Classes: ${staticAnalysis.classes.length}
- Issues found: ${staticAnalysis.issues.length}

**Analysis Type:** ${analysisType}

Provide analysis covering:
1. Code quality assessment
2. Security vulnerabilities
3. Performance bottlenecks
4. Maintainability issues
5. Best practice violations
6. Improvement recommendations

Return analysis in structured JSON format.`;
    }

    buildDebuggingPrompt(code, error, stackTrace, debugContext) {
        return `Debug the following code error:

**Error:**
${error}

**Stack Trace:**
${stackTrace}

**Code:**
\`\`\`${debugContext.language}
${code}
\`\`\`

**Debug Context:**
- Error type: ${debugContext.errorType}
- Suspected causes: ${debugContext.suspectedCauses.join(', ')}
- Line number: ${debugContext.lineNumber}

Provide:
1. Root cause analysis
2. Step-by-step fix instructions
3. Corrected code
4. Prevention strategies
5. Related best practices

Return solution in structured JSON format.`;
    }

    buildOptimizationPrompt(code, performanceAnalysis, optimizationType) {
        return `Optimize the following code for ${optimizationType}:

\`\`\`${performanceAnalysis.language}
${code}
\`\`\`

**Current Performance:**
- Time complexity: ${performanceAnalysis.timeComplexity}
- Space complexity: ${performanceAnalysis.spaceComplexity}
- Bottlenecks: ${performanceAnalysis.bottlenecks.join(', ')}

**Optimization Type:** ${optimizationType}

Provide:
1. Optimized code versions
2. Performance improvements
3. Trade-offs analysis
4. Implementation notes
5. Testing recommendations

Return optimizations in structured JSON format.`;
    }

    buildDocumentationPrompt(code, structure, docType) {
        return `Generate ${docType} documentation for the following code:

\`\`\`${structure.language}
${code}
\`\`\`

**Code Structure:**
- Functions: ${structure.functions.map(f => f.name).join(', ')}
- Classes: ${structure.classes.map(c => c.name).join(', ')}
- Exports: ${structure.exports.join(', ')}

Generate documentation including:
1. Overview and purpose
2. Function/method documentation
3. Parameter descriptions
4. Return value descriptions
5. Usage examples
6. Error handling

Return documentation in markdown format.`;
    }

    parseCompletionResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return parsed.suggestions || [];
        } catch (error) {
            // Fallback parsing for non-JSON responses
            return this.extractSuggestionsFromText(response);
        }
    }

    parseAnalysisResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return { analysis: response, recommendations: [] };
        }
    }

    parseDebuggingResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return {
                explanation: response,
                fixes: [],
                prevention: []
            };
        }
    }

    parseOptimizationResponse(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return { optimizations: [], improvements: [] };
        }
    }

    parseDocumentationResponse(response) {
        return response; // Documentation is typically returned as markdown
    }

    extractSuggestionsFromText(text) {
        // Extract code suggestions from plain text response
        const suggestions = [];
        const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
        
        codeBlocks.forEach((block, index) => {
            const code = block.replace(/```\w*\n?|```/g, '').trim();
            suggestions.push({
                code,
                confidence: 0.7,
                description: `Suggestion ${index + 1}`,
                type: 'completion'
            });
        });
        
        return suggestions;
    }

    getProjectPath(filePath) {
        // Extract project root from file path
        const parts = filePath.split(path.sep);
        const projectIndicators = ['package.json', 'pom.xml', 'Cargo.toml', '.git'];
        
        for (let i = parts.length - 1; i >= 0; i--) {
            const currentPath = parts.slice(0, i + 1).join(path.sep);
            // Check if this directory contains project indicators
            // This is a simplified version - in practice, you'd check the filesystem
            if (parts[i].includes('project') || parts[i].includes('src')) {
                return currentPath;
            }
        }
        
        return path.dirname(filePath);
    }

    getDefaultPreferences() {
        return {
            codingStyle: 'standard',
            namingConvention: 'camelCase',
            commentStyle: 'descriptive',
            indentation: 'spaces',
            lineLength: 80,
            errorHandling: 'explicit'
        };
    }

    generateAnalysisSummary(staticAnalysis, aiInsights) {
        return {
            overallScore: this.calculateOverallScore(staticAnalysis, aiInsights),
            mainIssues: aiInsights.issues?.slice(0, 3) || [],
            strengths: aiInsights.strengths || [],
            recommendations: aiInsights.recommendations?.slice(0, 5) || []
        };
    }

    calculateOverallScore(staticAnalysis, aiInsights) {
        let score = 100;
        
        // Deduct points for issues
        score -= (staticAnalysis.issues.length * 5);
        score -= (aiInsights.issues?.length * 3 || 0);
        
        // Deduct points for complexity
        if (staticAnalysis.complexity > 10) score -= 10;
        if (staticAnalysis.complexity > 20) score -= 20;
        
        return Math.max(0, Math.min(100, score));
    }

    calculateExpectedImprovements(optimizations) {
        return optimizations.map(opt => ({
            type: opt.type,
            expectedSpeedup: opt.expectedSpeedup || '10-20%',
            memoryReduction: opt.memoryReduction || '5-15%',
            maintainabilityImprovement: opt.maintainabilityImprovement || 'Medium'
        }));
    }

    // Feedback and Learning
    async recordFeedback(suggestionId, feedback) {
        await this.learningSystem.recordFeedback(suggestionId, feedback);
        
        if (feedback.accepted) {
            this.performanceMetrics.acceptedSuggestions++;
        } else {
            this.performanceMetrics.rejectedSuggestions++;
        }
    }

    getPerformanceMetrics() {
        const acceptanceRate = this.performanceMetrics.totalSuggestions > 0 
            ? (this.performanceMetrics.acceptedSuggestions / this.performanceMetrics.totalSuggestions * 100).toFixed(1)
            : 0;
        
        return {
            ...this.performanceMetrics,
            acceptanceRate: acceptanceRate + '%',
            systemHealth: 'healthy'
        };
    }
}

// Supporting Classes
class CodeAnalyzer {
    async analyze({ code, filePath, language, type }) {
        // Simplified static analysis
        const lines = code.split('\n');
        const functions = this.extractFunctions(code, language);
        const classes = this.extractClasses(code, language);
        const issues = this.findIssues(code, language);
        
        return {
            language,
            linesOfCode: lines.length,
            functions,
            classes,
            issues,
            complexity: this.calculateComplexity(code),
            maintainabilityIndex: this.calculateMaintainabilityIndex(code)
        };
    }

    async extractStructure(code, language) {
        return {
            language,
            functions: this.extractFunctions(code, language),
            classes: this.extractClasses(code, language),
            exports: this.extractExports(code, language),
            imports: this.extractImports(code, language)
        };
    }

    extractFunctions(code, language) {
        const functionRegex = /function\s+(\w+)\s*\(/g;
        const matches = [];
        let match;
        
        while ((match = functionRegex.exec(code)) !== null) {
            matches.push({
                name: match[1],
                line: code.substring(0, match.index).split('\n').length
            });
        }
        
        return matches;
    }

    extractClasses(code, language) {
        const classRegex = /class\s+(\w+)/g;
        const matches = [];
        let match;
        
        while ((match = classRegex.exec(code)) !== null) {
            matches.push({
                name: match[1],
                line: code.substring(0, match.index).split('\n').length
            });
        }
        
        return matches;
    }

    extractExports(code, language) {
        const exportRegex = /export\s+(?:default\s+)?(\w+)/g;
        const matches = [];
        let match;
        
        while ((match = exportRegex.exec(code)) !== null) {
            matches.push(match[1]);
        }
        
        return matches;
    }

    extractImports(code, language) {
        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
        const matches = [];
        let match;
        
        while ((match = importRegex.exec(code)) !== null) {
            matches.push(match[1]);
        }
        
        return matches;
    }

    findIssues(code, language) {
        const issues = [];
        
        // Check for common issues
        if (code.includes('console.log')) {
            issues.push({ type: 'debug-code', severity: 'low', message: 'Debug console.log found' });
        }
        
        if (code.includes('TODO') || code.includes('FIXME')) {
            issues.push({ type: 'todo', severity: 'medium', message: 'TODO/FIXME comments found' });
        }
        
        // Check for long lines
        const lines = code.split('\n');
        lines.forEach((line, index) => {
            if (line.length > 120) {
                issues.push({
                    type: 'long-line',
                    severity: 'low',
                    message: `Line ${index + 1} is too long (${line.length} characters)`,
                    line: index + 1
                });
            }
        });
        
        return issues;
    }

    calculateComplexity(code) {
        // Simplified cyclomatic complexity
        const complexityKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
        let complexity = 1; // Base complexity
        
        for (const keyword of complexityKeywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = code.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        }
        
        return complexity;
    }

    calculateMaintainabilityIndex(code) {
        // Simplified maintainability index
        const linesOfCode = code.split('\n').length;
        const complexity = this.calculateComplexity(code);
        
        // Simplified formula
        return Math.max(0, 100 - (complexity * 2) - (linesOfCode / 10));
    }
}

class CodeContextManager {
    async analyzeContext({ code, cursorPosition, filePath, language, projectPath }) {
        const lines = code.split('\n');
        const currentLine = code.substring(0, cursorPosition).split('\n').length - 1;
        
        return {
            language,
            filePath,
            projectPath,
            currentLine,
            currentFunction: this.getCurrentFunction(code, cursorPosition),
            currentClass: this.getCurrentClass(code, cursorPosition),
            projectType: this.detectProjectType(projectPath),
            recentPatterns: this.extractRecentPatterns(code, cursorPosition),
            projectContext: await this.getProjectContext(projectPath),
            recentChanges: this.getRecentChanges(filePath)
        };
    }

    getCurrentFunction(code, cursorPosition) {
        const beforeCursor = code.substring(0, cursorPosition);
        const functionMatch = beforeCursor.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*$/s);
        return functionMatch ? functionMatch[1] : null;
    }

    getCurrentClass(code, cursorPosition) {
        const beforeCursor = code.substring(0, cursorPosition);
        const classMatch = beforeCursor.match(/class\s+(\w+)[^{]*{[^}]*$/s);
        return classMatch ? classMatch[1] : null;
    }

    detectProjectType(projectPath) {
        // Simplified project type detection
        if (projectPath.includes('node_modules') || projectPath.includes('package.json')) {
            return 'nodejs';
        }
        if (projectPath.includes('src/main/java')) {
            return 'java';
        }
        if (projectPath.includes('src') && projectPath.includes('.py')) {
            return 'python';
        }
        return 'unknown';
    }

    extractRecentPatterns(code, cursorPosition) {
        // Extract patterns from recent code
        const beforeCursor = code.substring(Math.max(0, cursorPosition - 500), cursorPosition);
        const patterns = [];
        
        // Look for variable declarations
        const varMatches = beforeCursor.match(/(?:const|let|var)\s+(\w+)/g);
        if (varMatches) {
            patterns.push(`Recent variables: ${varMatches.join(', ')}`);
        }
        
        // Look for function calls
        const funcMatches = beforeCursor.match(/(\w+)\s*\(/g);
        if (funcMatches) {
            patterns.push(`Recent function calls: ${funcMatches.slice(-3).join(', ')}`);
        }
        
        return patterns;
    }

    async getProjectContext(projectPath) {
        // Simplified project context
        return {
            type: this.detectProjectType(projectPath),
            hasTests: true, // Would check for test files
            hasDocs: true,  // Would check for documentation
            dependencies: [] // Would read package.json or similar
        };
    }

    getRecentChanges(filePath) {
        // Simplified - would integrate with git or file system watching
        return {
            lastModified: Date.now(),
            recentEdits: [],
            changeFrequency: 'medium'
        };
    }
}

class IntelligentSuggestionEngine {
    async rankSuggestions(suggestions, context, userPrefs) {
        return suggestions.map(suggestion => {
            let score = suggestion.confidence || 0.5;
            
            // Boost score based on context relevance
            if (suggestion.code && context.currentFunction && suggestion.code.includes(context.currentFunction)) score += 0.1;
            if (suggestion.code && context.currentClass && suggestion.code.includes(context.currentClass)) score += 0.1;
            
            // Boost score based on user preferences
            if (this.matchesUserStyle(suggestion.code, userPrefs)) score += 0.15;
            
            return {
                ...suggestion,
                score: Math.min(1.0, score),
                ranking: 0 // Will be set after sorting
            };
        }).sort((a, b) => b.score - a.score).map((suggestion, index) => ({
            ...suggestion,
            ranking: index + 1
        }));
    }

    matchesUserStyle(code, userPrefs) {
        // Check if code matches user's coding style
        if (userPrefs.namingConvention === 'camelCase') {
            return /[a-z][A-Za-z0-9]*/.test(code);
        }
        if (userPrefs.namingConvention === 'snake_case') {
            return /[a-z][a-z0-9_]*/.test(code);
        }
        return true;
    }
}

class DebuggingAssistant {
    async analyzeError({ code, error, stackTrace, filePath, language }) {
        const errorType = this.classifyError(error);
        const lineNumber = this.extractLineNumber(stackTrace);
        const suspectedCauses = this.identifySuspectedCauses(error, code);
        
        return {
            language,
            errorType,
            lineNumber,
            suspectedCauses,
            relatedCode: this.extractRelatedCode(code, lineNumber),
            severity: this.assessSeverity(error)
        };
    }

    classifyError(error) {
        if (error.includes('TypeError')) return 'type-error';
        if (error.includes('ReferenceError')) return 'reference-error';
        if (error.includes('SyntaxError')) return 'syntax-error';
        if (error.includes('RangeError')) return 'range-error';
        return 'unknown-error';
    }

    extractLineNumber(stackTrace) {
        const lineMatch = stackTrace.match(/:(\d+):/);;
        return lineMatch ? parseInt(lineMatch[1]) : null;
    }

    identifySuspectedCauses(error, code) {
        const causes = [];
        
        if (error.includes('undefined')) {
            causes.push('Variable not defined or null');
        }
        if (error.includes('is not a function')) {
            causes.push('Calling non-function as function');
        }
        if (error.includes('Cannot read property')) {
            causes.push('Accessing property of null/undefined object');
        }
        
        return causes;
    }

    extractRelatedCode(code, lineNumber) {
        if (!lineNumber) return '';
        
        const lines = code.split('\n');
        const start = Math.max(0, lineNumber - 3);
        const end = Math.min(lines.length, lineNumber + 2);
        
        return lines.slice(start, end).join('\n');
    }

    assessSeverity(error) {
        if (error.includes('SyntaxError')) return 'high';
        if (error.includes('TypeError')) return 'medium';
        return 'low';
    }

    async validateSolution(solution, debugContext) {
        // Simplified validation
        return {
            isValid: solution.fixes && solution.fixes.length > 0,
            confidence: 0.8,
            applicability: 'high'
        };
    }
}

class CodeOptimizationEngine {
    async analyzePerformance({ code, filePath, language }) {
        return {
            language,
            timeComplexity: this.estimateTimeComplexity(code),
            spaceComplexity: this.estimateSpaceComplexity(code),
            bottlenecks: this.identifyBottlenecks(code),
            memoryUsage: this.estimateMemoryUsage(code),
            cpuIntensity: this.estimateCPUIntensity(code)
        };
    }

    estimateTimeComplexity(code) {
        if (code.includes('for') && code.includes('for')) return 'O(n²)';
        if (code.includes('for') || code.includes('while')) return 'O(n)';
        return 'O(1)';
    }

    estimateSpaceComplexity(code) {
        if (code.includes('new Array') || code.includes('[]')) return 'O(n)';
        return 'O(1)';
    }

    identifyBottlenecks(code) {
        const bottlenecks = [];
        
        if (code && typeof code === 'string') {
            if (code.includes('for') && code.includes('for')) {
                bottlenecks.push('Nested loops detected');
            }
            if (code.includes('JSON.parse') || code.includes('JSON.stringify')) {
                bottlenecks.push('JSON operations can be expensive');
            }
            if (code.includes('sort()')) {
                bottlenecks.push('Array sorting operations');
            }
        }
        
        return bottlenecks;
    }

    estimateMemoryUsage(code) {
        // Simplified memory usage estimation
        const arrayCreations = (code.match(/new Array|\[\]/g) || []).length;
        const objectCreations = (code.match(/new Object|\{\}/g) || []).length;
        
        return {
            arrays: arrayCreations,
            objects: objectCreations,
            estimated: 'medium'
        };
    }

    estimateCPUIntensity(code) {
        if (!code || typeof code !== 'string') return 'low';
        
        const loops = (code.match(/for|while/g) || []).length;
        const recursion = code.includes('function') && code.includes('return');
        
        if (loops > 2 || recursion) return 'high';
        if (loops > 0) return 'medium';
        return 'low';
    }

    async validateOptimizations(optimizations, performanceAnalysis) {
        // Simplified validation
        return optimizations.filter(opt => {
            return opt.type && opt.expectedSpeedup;
        });
    }
}

class CodeLearningSystem {
    constructor() {
        this.patterns = new Map();
        this.feedbackData = [];
    }

    async loadPatterns(patterns) {
        for (const [key, value] of Object.entries(patterns)) {
            this.patterns.set(key, value);
        }
    }

    async recordFeedback(suggestionId, feedback) {
        this.feedbackData.push({
            suggestionId,
            feedback,
            timestamp: Date.now()
        });
        
        // Learn from feedback
        await this.updatePatterns(feedback);
    }

    async updatePatterns(feedback) {
        // Update patterns based on user feedback
        if (feedback.accepted) {
            // Reinforce successful patterns
            const pattern = feedback.pattern;
            if (pattern) {
                const current = this.patterns.get(pattern) || { weight: 0, count: 0 };
                current.weight += 1;
                current.count += 1;
                this.patterns.set(pattern, current);
            }
        }
    }

    getPatternWeight(pattern) {
        const data = this.patterns.get(pattern);
        return data ? data.weight / data.count : 0.5;
    }
}

// Add missing methods to AICodeAssistant
AICodeAssistant.prototype.completeCode = async function(request) {
    const { code, language, context } = request;
    
    try {
        const aiRequest = {
            task: 'code-completion',
            prompt: `Complete this ${language} code: ${code}`,
            context: {
                language,
                ...context
            }
        };
        
        const result = await this.multiModelAI.processRequest(aiRequest);
        
        if (result.success) {
            return {
                success: true,
                completion: result.response,
                confidence: result.confidence || 0.8
            };
        }
        
        throw new Error(result.error);
    } catch (error) {
        console.error('❌ Code completion failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

AICodeAssistant.prototype.generateCode = async function(request) {
    const { prompt, language, framework, context } = request;
    
    try {
        const aiRequest = {
            task: 'code-generation',
            prompt: `Generate ${language} code: ${prompt}`,
            context: {
                language,
                framework,
                ...context
            }
        };
        
        const result = await this.multiModelAI.processRequest(aiRequest);
        
        if (result.success) {
            return {
                success: true,
                code: result.response,
                explanation: result.explanation || 'Generated code based on your request',
                metadata: result.metadata
            };
        }
        
        throw new Error(result.error);
    } catch (error) {
        console.error('❌ Code generation failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    AICodeAssistant,
    CodeAnalyzer,
    CodeContextManager,
    IntelligentSuggestionEngine,
    DebuggingAssistant,
    CodeOptimizationEngine,
    CodeLearningSystem
};

// Example usage
if (require.main === module) {
    const assistant = new AICodeAssistant();
    
    assistant.on('assistant-ready', async () => {
        console.log('🎉 AI Code Assistant ready!');
        
        // Example code completion request
        const completionRequest = {
            code: 'function calculateSum(a, b) {\n    return ',
            cursorPosition: 35,
            filePath: './src/utils/math.js',
            language: 'javascript',
            userId: 'user123'
        };
        
        try {
            const result = await assistant.provideCodeCompletion(completionRequest);
            console.log('✅ Code completion result:', result);
            
            console.log('📊 Performance metrics:', assistant.getPerformanceMetrics());
        } catch (error) {
            console.error('❌ Code completion failed:', error.message);
        }
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('🛑 Shutting down AI Code Assistant...');
        process.exit(0);
    });
}