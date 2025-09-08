#!/usr/bin/env node
/**
 * NEXUS IDE - Error Fix AI System
 * ระบบ AI สำหรับตรวจจับและแก้ไขข้อผิดพลาดในโค้ดอัตโนมัติ
 * 
 * Features:
 * - ตรวจจับ syntax errors, runtime errors, logic errors
 * - แนะนำการแก้ไขแบบ step-by-step
 * - สร้าง unit tests สำหรับป้องกัน regression
 * - วิเคราะห์ code quality และ security vulnerabilities
 * - เรียนรู้จาก error patterns ในโปรเจค
 * 
 * Created: 2025-01-06
 * Updated: 2025-01-06
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const WebSocket = require('ws');

class ErrorFixAI extends EventEmitter {
    constructor(options = {}) {
        super();
        this.config = {
            port: options.port || 8087,
            aiModels: {
                primary: 'gpt-4-turbo',
                secondary: 'claude-3-opus',
                fallback: 'llama-3-70b'
            },
            errorTypes: {
                syntax: { priority: 'critical', autoFix: true },
                runtime: { priority: 'high', autoFix: false },
                logic: { priority: 'medium', autoFix: false },
                security: { priority: 'critical', autoFix: false },
                performance: { priority: 'low', autoFix: true }
            },
            analysisDepth: 'deep', // shallow, medium, deep
            learningMode: true,
            autoFixEnabled: true,
            testGeneration: true,
            ...options
        };
        
        this.errorDatabase = new Map();
        this.fixPatterns = new Map();
        this.learningData = [];
        this.activeAnalysis = new Map();
        this.wsServer = null;
        this.clients = new Set();
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadErrorPatterns();
            await this.loadLearningData();
            await this.startWebSocketServer();
            await this.initializeAIModels();
            
            console.log('🔧 Error Fix AI System initialized successfully');
            console.log(`📊 Loaded ${this.fixPatterns.size} fix patterns`);
            console.log(`🧠 Learning database: ${this.learningData.length} entries`);
            
            this.emit('ready');
        } catch (error) {
            console.error('❌ Failed to initialize Error Fix AI:', error);
            this.emit('error', error);
        }
    }
    
    async loadErrorPatterns() {
        const patternsPath = path.join(__dirname, '../data/error-patterns.json');
        try {
            const data = await fs.readFile(patternsPath, 'utf8');
            const patterns = JSON.parse(data);
            
            for (const [key, pattern] of Object.entries(patterns)) {
                this.fixPatterns.set(key, {
                    ...pattern,
                    usage: 0,
                    successRate: 0,
                    lastUsed: null
                });
            }
        } catch (error) {
            // สร้างไฟล์ patterns เริ่มต้น
            await this.createDefaultPatterns();
        }
    }
    
    async createDefaultPatterns() {
        const defaultPatterns = {
            'undefined-variable': {
                type: 'runtime',
                pattern: /ReferenceError: (\w+) is not defined/,
                fixes: [
                    'Declare the variable before using it',
                    'Check for typos in variable name',
                    'Import the required module or function'
                ],
                autoFix: true,
                confidence: 0.9
            },
            'syntax-error': {
                type: 'syntax',
                pattern: /SyntaxError: (.+)/,
                fixes: [
                    'Check for missing brackets, parentheses, or semicolons',
                    'Verify proper indentation',
                    'Check for invalid characters'
                ],
                autoFix: true,
                confidence: 0.95
            },
            'type-error': {
                type: 'runtime',
                pattern: /TypeError: (.+)/,
                fixes: [
                    'Check data types before operations',
                    'Add null/undefined checks',
                    'Verify object properties exist'
                ],
                autoFix: false,
                confidence: 0.8
            },
            'async-await-error': {
                type: 'logic',
                pattern: /await.*not.*async/,
                fixes: [
                    'Add async keyword to function',
                    'Use .then() instead of await',
                    'Wrap in async IIFE'
                ],
                autoFix: true,
                confidence: 0.9
            }
        };
        
        const patternsPath = path.join(__dirname, '../data');
        await fs.mkdir(patternsPath, { recursive: true });
        await fs.writeFile(
            path.join(patternsPath, 'error-patterns.json'),
            JSON.stringify(defaultPatterns, null, 2)
        );
        
        for (const [key, pattern] of Object.entries(defaultPatterns)) {
            this.fixPatterns.set(key, {
                ...pattern,
                usage: 0,
                successRate: 0,
                lastUsed: null
            });
        }
    }
    
    async loadLearningData() {
        const learningPath = path.join(__dirname, '../data/error-learning.json');
        try {
            const data = await fs.readFile(learningPath, 'utf8');
            this.learningData = JSON.parse(data);
        } catch (error) {
            this.learningData = [];
        }
    }
    
    async startWebSocketServer() {
        this.wsServer = new WebSocket.Server({ port: this.config.port });
        
        this.wsServer.on('connection', (ws) => {
            this.clients.add(ws);
            console.log(`🔌 Error Fix AI client connected (${this.clients.size} total)`);
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleClientMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`🔌 Error Fix AI client disconnected (${this.clients.size} total)`);
            });
            
            // ส่งข้อมูลเริ่มต้น
            ws.send(JSON.stringify({
                type: 'connected',
                data: {
                    patterns: this.fixPatterns.size,
                    learningEntries: this.learningData.length,
                    config: this.config
                }
            }));
        });
        
        console.log(`🔧 Error Fix AI WebSocket server running on port ${this.config.port}`);
    }
    
    async handleClientMessage(ws, data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'analyze-error':
                await this.analyzeError(ws, payload);
                break;
                
            case 'fix-error':
                await this.fixError(ws, payload);
                break;
                
            case 'generate-tests':
                await this.generateTests(ws, payload);
                break;
                
            case 'analyze-code-quality':
                await this.analyzeCodeQuality(ws, payload);
                break;
                
            case 'learn-from-fix':
                await this.learnFromFix(ws, payload);
                break;
                
            case 'get-error-stats':
                await this.getErrorStats(ws);
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown message type: ${type}`
                }));
        }
    }
    
    async analyzeError(ws, payload) {
        const { errorMessage, code, filePath, stackTrace } = payload;
        const analysisId = this.generateAnalysisId();
        
        try {
            // เริ่มการวิเคราะห์
            this.activeAnalysis.set(analysisId, {
                startTime: Date.now(),
                status: 'analyzing',
                errorMessage,
                filePath
            });
            
            ws.send(JSON.stringify({
                type: 'analysis-started',
                analysisId,
                message: 'Starting error analysis...'
            }));
            
            // ตรวจจับประเภทของ error
            const errorType = this.detectErrorType(errorMessage, stackTrace);
            
            // หา patterns ที่ตรงกัน
            const matchingPatterns = this.findMatchingPatterns(errorMessage, errorType);
            
            // วิเคราะห์ context ของโค้ด
            const codeContext = await this.analyzeCodeContext(code, filePath);
            
            // ใช้ AI วิเคราะห์เพิ่มเติม
            const aiAnalysis = await this.performAIAnalysis({
                errorMessage,
                code,
                stackTrace,
                errorType,
                patterns: matchingPatterns,
                context: codeContext
            });
            
            const analysis = {
                id: analysisId,
                timestamp: new Date().toISOString(),
                errorType,
                severity: this.calculateSeverity(errorType, errorMessage),
                matchingPatterns,
                codeContext,
                aiAnalysis,
                suggestedFixes: this.generateSuggestedFixes(matchingPatterns, aiAnalysis),
                confidence: this.calculateConfidence(matchingPatterns, aiAnalysis)
            };
            
            this.activeAnalysis.set(analysisId, {
                ...this.activeAnalysis.get(analysisId),
                status: 'completed',
                result: analysis
            });
            
            ws.send(JSON.stringify({
                type: 'analysis-completed',
                analysisId,
                data: analysis
            }));
            
        } catch (error) {
            console.error('Error in analyzeError:', error);
            ws.send(JSON.stringify({
                type: 'analysis-error',
                analysisId,
                error: error.message
            }));
        }
    }
    
    detectErrorType(errorMessage, stackTrace) {
        // ตรวจจับประเภท error จาก message และ stack trace
        if (errorMessage.includes('SyntaxError')) return 'syntax';
        if (errorMessage.includes('ReferenceError')) return 'runtime';
        if (errorMessage.includes('TypeError')) return 'runtime';
        if (errorMessage.includes('SecurityError')) return 'security';
        if (stackTrace && stackTrace.includes('performance')) return 'performance';
        
        return 'logic';
    }
    
    findMatchingPatterns(errorMessage, errorType) {
        const matches = [];
        
        for (const [key, pattern] of this.fixPatterns.entries()) {
            if (pattern.type === errorType || pattern.type === 'all') {
                if (pattern.pattern.test(errorMessage)) {
                    matches.push({
                        key,
                        ...pattern,
                        match: errorMessage.match(pattern.pattern)
                    });
                }
            }
        }
        
        return matches.sort((a, b) => b.confidence - a.confidence);
    }
    
    async analyzeCodeContext(code, filePath) {
        // วิเคราะห์ context ของโค้ด
        const context = {
            language: this.detectLanguage(filePath),
            imports: this.extractImports(code),
            functions: this.extractFunctions(code),
            variables: this.extractVariables(code),
            dependencies: await this.analyzeDependencies(filePath),
            complexity: this.calculateComplexity(code)
        };
        
        return context;
    }
    
    async performAIAnalysis(data) {
        // ใช้ AI models วิเคราะห์ error
        const prompt = this.buildAnalysisPrompt(data);
        
        try {
            // ลองใช้ primary model ก่อน
            const result = await this.callAIModel(this.config.aiModels.primary, prompt);
            return this.parseAIResponse(result);
        } catch (error) {
            console.warn('Primary AI model failed, trying secondary...');
            try {
                const result = await this.callAIModel(this.config.aiModels.secondary, prompt);
                return this.parseAIResponse(result);
            } catch (secondaryError) {
                console.warn('Secondary AI model failed, using fallback...');
                const result = await this.callAIModel(this.config.aiModels.fallback, prompt);
                return this.parseAIResponse(result);
            }
        }
    }
    
    buildAnalysisPrompt(data) {
        return `
Analyze this error and provide detailed insights:

Error Message: ${data.errorMessage}
Error Type: ${data.errorType}
Code Context: ${JSON.stringify(data.context, null, 2)}

Code:
${data.code}

Stack Trace:
${data.stackTrace}

Please provide:
1. Root cause analysis
2. Step-by-step fix instructions
3. Prevention strategies
4. Code quality improvements
5. Security considerations (if applicable)

Format your response as JSON with these fields:
{
  "rootCause": "detailed explanation",
  "fixSteps": ["step1", "step2", ...],
  "prevention": ["strategy1", "strategy2", ...],
  "improvements": ["improvement1", "improvement2", ...],
  "security": ["concern1", "concern2", ...],
  "confidence": 0.95
}
        `;
    }
    
    async callAIModel(model, prompt) {
        // Mock AI call - ในการใช้งานจริงจะเชื่อมต่อกับ AI APIs
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    rootCause: "Variable not declared before use",
                    fixSteps: [
                        "Declare the variable at the top of the function",
                        "Initialize with appropriate default value",
                        "Add type checking if needed"
                    ],
                    prevention: [
                        "Use strict mode",
                        "Enable ESLint rules",
                        "Add TypeScript for type safety"
                    ],
                    improvements: [
                        "Add error handling",
                        "Use const/let instead of var",
                        "Add JSDoc comments"
                    ],
                    security: [],
                    confidence: 0.9
                });
            }, 1000);
        });
    }
    
    parseAIResponse(response) {
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch {
                return { error: 'Failed to parse AI response' };
            }
        }
        return response;
    }
    
    generateSuggestedFixes(patterns, aiAnalysis) {
        const fixes = [];
        
        // เพิ่ม fixes จาก patterns
        patterns.forEach(pattern => {
            fixes.push(...pattern.fixes.map(fix => ({
                type: 'pattern',
                description: fix,
                confidence: pattern.confidence,
                autoFixable: pattern.autoFix
            })));
        });
        
        // เพิ่ม fixes จาก AI
        if (aiAnalysis.fixSteps) {
            fixes.push(...aiAnalysis.fixSteps.map(step => ({
                type: 'ai',
                description: step,
                confidence: aiAnalysis.confidence || 0.8,
                autoFixable: false
            })));
        }
        
        return fixes.sort((a, b) => b.confidence - a.confidence);
    }
    
    calculateSeverity(errorType, errorMessage) {
        const severityMap = {
            syntax: 'critical',
            security: 'critical',
            runtime: 'high',
            logic: 'medium',
            performance: 'low'
        };
        
        return severityMap[errorType] || 'medium';
    }
    
    calculateConfidence(patterns, aiAnalysis) {
        if (patterns.length === 0) return aiAnalysis.confidence || 0.5;
        
        const patternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
        const aiConfidence = aiAnalysis.confidence || 0.5;
        
        return (patternConfidence + aiConfidence) / 2;
    }
    
    async fixError(ws, payload) {
        const { analysisId, fixIndex, autoApply } = payload;
        const analysis = this.activeAnalysis.get(analysisId);
        
        if (!analysis || !analysis.result) {
            ws.send(JSON.stringify({
                type: 'fix-error',
                error: 'Analysis not found'
            }));
            return;
        }
        
        const fix = analysis.result.suggestedFixes[fixIndex];
        if (!fix) {
            ws.send(JSON.stringify({
                type: 'fix-error',
                error: 'Fix not found'
            }));
            return;
        }
        
        try {
            let fixedCode = null;
            
            if (autoApply && fix.autoFixable) {
                fixedCode = await this.applyAutoFix(analysis.result, fix);
            }
            
            ws.send(JSON.stringify({
                type: 'fix-applied',
                data: {
                    fix,
                    fixedCode,
                    applied: autoApply && fix.autoFixable
                }
            }));
            
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'fix-error',
                error: error.message
            }));
        }
    }
    
    async applyAutoFix(analysis, fix) {
        // ใช้ AI สร้างโค้ดที่แก้ไขแล้ว
        const prompt = `
Apply this fix to the code:

Fix: ${fix.description}
Original Code:
${analysis.codeContext}

Return only the fixed code without explanations.
        `;
        
        const result = await this.callAIModel(this.config.aiModels.primary, prompt);
        return result;
    }
    
    async generateTests(ws, payload) {
        const { code, errorType, fixes } = payload;
        
        try {
            const testCases = await this.generateTestCases(code, errorType, fixes);
            
            ws.send(JSON.stringify({
                type: 'tests-generated',
                data: testCases
            }));
            
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'test-generation-error',
                error: error.message
            }));
        }
    }
    
    async generateTestCases(code, errorType, fixes) {
        // สร้าง test cases เพื่อป้องกัน regression
        const prompt = `
Generate comprehensive test cases for this code after applying fixes:

Code: ${code}
Error Type: ${errorType}
Fixes Applied: ${JSON.stringify(fixes)}

Generate:
1. Unit tests to verify the fix works
2. Edge case tests
3. Regression tests
4. Integration tests (if applicable)

Return as JSON array of test objects with: name, description, code, expected
        `;
        
        const result = await this.callAIModel(this.config.aiModels.primary, prompt);
        return this.parseAIResponse(result);
    }
    
    async analyzeCodeQuality(ws, payload) {
        const { code, filePath } = payload;
        
        try {
            const qualityReport = await this.performQualityAnalysis(code, filePath);
            
            ws.send(JSON.stringify({
                type: 'quality-analysis',
                data: qualityReport
            }));
            
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'quality-analysis-error',
                error: error.message
            }));
        }
    }
    
    async performQualityAnalysis(code, filePath) {
        const analysis = {
            complexity: this.calculateComplexity(code),
            maintainability: this.calculateMaintainability(code),
            security: await this.analyzeSecurityIssues(code),
            performance: this.analyzePerformanceIssues(code),
            bestPractices: this.checkBestPractices(code),
            suggestions: []
        };
        
        // สร้างคำแนะนำ
        if (analysis.complexity > 10) {
            analysis.suggestions.push('Consider breaking down complex functions');
        }
        
        if (analysis.security.length > 0) {
            analysis.suggestions.push('Address security vulnerabilities');
        }
        
        return analysis;
    }
    
    async learnFromFix(ws, payload) {
        const { errorPattern, fix, success, feedback } = payload;
        
        // เรียนรู้จากการแก้ไขที่ผู้ใช้ทำ
        const learningEntry = {
            timestamp: new Date().toISOString(),
            errorPattern,
            fix,
            success,
            feedback,
            context: payload.context
        };
        
        this.learningData.push(learningEntry);
        
        // อัปเดต patterns ถ้าการแก้ไขสำเร็จ
        if (success) {
            await this.updatePatterns(errorPattern, fix);
        }
        
        // บันทึกข้อมูลการเรียนรู้
        await this.saveLearningData();
        
        ws.send(JSON.stringify({
            type: 'learning-updated',
            message: 'Thank you for the feedback! I\'ve learned from this fix.'
        }));
    }
    
    async updatePatterns(errorPattern, fix) {
        // อัปเดต patterns จากการเรียนรู้
        const patternKey = this.generatePatternKey(errorPattern);
        
        if (this.fixPatterns.has(patternKey)) {
            const pattern = this.fixPatterns.get(patternKey);
            pattern.usage++;
            pattern.lastUsed = new Date().toISOString();
            
            // เพิ่ม fix ใหม่ถ้ายังไม่มี
            if (!pattern.fixes.includes(fix.description)) {
                pattern.fixes.push(fix.description);
            }
        } else {
            // สร้าง pattern ใหม่
            this.fixPatterns.set(patternKey, {
                type: errorPattern.type,
                pattern: new RegExp(errorPattern.regex),
                fixes: [fix.description],
                autoFix: fix.autoFixable,
                confidence: 0.7,
                usage: 1,
                successRate: 1,
                lastUsed: new Date().toISOString()
            });
        }
        
        await this.savePatterns();
    }
    
    async getErrorStats(ws) {
        const stats = {
            totalPatterns: this.fixPatterns.size,
            totalLearningEntries: this.learningData.length,
            activeAnalyses: this.activeAnalysis.size,
            errorTypeDistribution: this.calculateErrorTypeDistribution(),
            topPatterns: this.getTopPatterns(),
            recentActivity: this.getRecentActivity(),
            systemHealth: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                connections: this.clients.size
            }
        };
        
        ws.send(JSON.stringify({
            type: 'error-stats',
            data: stats
        }));
    }
    
    // Utility methods
    generateAnalysisId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generatePatternKey(errorPattern) {
        return `${errorPattern.type}_${errorPattern.message.replace(/\s+/g, '_').toLowerCase()}`;
    }
    
    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const langMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go'
        };
        return langMap[ext] || 'unknown';
    }
    
    extractImports(code) {
        const imports = [];
        const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"];?/g;
        let match;
        
        while ((match = importRegex.exec(code)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    }
    
    extractFunctions(code) {
        const functions = [];
        const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
        let match;
        
        while ((match = funcRegex.exec(code)) !== null) {
            functions.push({
                name: match[1],
                params: match[2].split(',').map(p => p.trim()).filter(p => p)
            });
        }
        
        return functions;
    }
    
    extractVariables(code) {
        const variables = [];
        const varRegex = /(?:var|let|const)\s+(\w+)/g;
        let match;
        
        while ((match = varRegex.exec(code)) !== null) {
            variables.push(match[1]);
        }
        
        return variables;
    }
    
    async analyzeDependencies(filePath) {
        try {
            const packagePath = path.join(path.dirname(filePath), 'package.json');
            const packageData = await fs.readFile(packagePath, 'utf8');
            const pkg = JSON.parse(packageData);
            
            return {
                dependencies: Object.keys(pkg.dependencies || {}),
                devDependencies: Object.keys(pkg.devDependencies || {})
            };
        } catch {
            return { dependencies: [], devDependencies: [] };
        }
    }
    
    calculateComplexity(code) {
        // Simplified cyclomatic complexity calculation
        const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||'];
        let complexity = 1; // Base complexity
        
        complexityKeywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = code.match(regex);
            if (matches) {
                complexity += matches.length;
            }
        });
        
        return complexity;
    }
    
    calculateMaintainability(code) {
        // Simplified maintainability index
        const lines = code.split('\n').length;
        const complexity = this.calculateComplexity(code);
        const volume = code.length;
        
        // Simplified formula
        return Math.max(0, 171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(lines));
    }
    
    async analyzeSecurityIssues(code) {
        const issues = [];
        
        // Check for common security issues
        if (code.includes('eval(')) {
            issues.push({ type: 'code-injection', severity: 'high', line: this.findLineNumber(code, 'eval(') });
        }
        
        if (code.includes('innerHTML')) {
            issues.push({ type: 'xss-risk', severity: 'medium', line: this.findLineNumber(code, 'innerHTML') });
        }
        
        if (code.includes('document.write')) {
            issues.push({ type: 'xss-risk', severity: 'medium', line: this.findLineNumber(code, 'document.write') });
        }
        
        return issues;
    }
    
    analyzePerformanceIssues(code) {
        const issues = [];
        
        // Check for performance anti-patterns
        if (code.includes('document.getElementById') && code.match(/document\.getElementById/g).length > 3) {
            issues.push({ type: 'dom-query-optimization', severity: 'low' });
        }
        
        if (code.includes('for') && code.includes('innerHTML')) {
            issues.push({ type: 'dom-manipulation-in-loop', severity: 'medium' });
        }
        
        return issues;
    }
    
    checkBestPractices(code) {
        const violations = [];
        
        if (code.includes('var ')) {
            violations.push('Use let/const instead of var');
        }
        
        if (!code.includes('use strict')) {
            violations.push('Consider using strict mode');
        }
        
        return violations;
    }
    
    findLineNumber(code, searchString) {
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(searchString)) {
                return i + 1;
            }
        }
        return 0;
    }
    
    calculateErrorTypeDistribution() {
        const distribution = {};
        
        for (const pattern of this.fixPatterns.values()) {
            distribution[pattern.type] = (distribution[pattern.type] || 0) + pattern.usage;
        }
        
        return distribution;
    }
    
    getTopPatterns() {
        return Array.from(this.fixPatterns.entries())
            .sort(([,a], [,b]) => b.usage - a.usage)
            .slice(0, 10)
            .map(([key, pattern]) => ({ key, usage: pattern.usage, successRate: pattern.successRate }));
    }
    
    getRecentActivity() {
        return this.learningData
            .slice(-10)
            .map(entry => ({
                timestamp: entry.timestamp,
                type: entry.errorPattern?.type,
                success: entry.success
            }));
    }
    
    async savePatterns() {
        const patternsPath = path.join(__dirname, '../data/error-patterns.json');
        const patternsObj = {};
        
        for (const [key, pattern] of this.fixPatterns.entries()) {
            patternsObj[key] = {
                ...pattern,
                pattern: pattern.pattern.source // Convert RegExp to string
            };
        }
        
        await fs.writeFile(patternsPath, JSON.stringify(patternsObj, null, 2));
    }
    
    async saveLearningData() {
        const learningPath = path.join(__dirname, '../data/error-learning.json');
        await fs.writeFile(learningPath, JSON.stringify(this.learningData, null, 2));
    }
    
    async initializeAIModels() {
        // Initialize AI model connections
        console.log('🤖 Initializing AI models...');
        console.log(`Primary: ${this.config.aiModels.primary}`);
        console.log(`Secondary: ${this.config.aiModels.secondary}`);
        console.log(`Fallback: ${this.config.aiModels.fallback}`);
    }
    
    // Public API methods
    async analyzeErrorSync(errorMessage, code, filePath, stackTrace) {
        return new Promise((resolve, reject) => {
            const mockWs = {
                send: (data) => {
                    const parsed = JSON.parse(data);
                    if (parsed.type === 'analysis-completed') {
                        resolve(parsed.data);
                    } else if (parsed.type === 'analysis-error') {
                        reject(new Error(parsed.error));
                    }
                }
            };
            
            this.analyzeError(mockWs, {
                errorMessage,
                code,
                filePath,
                stackTrace
            });
        });
    }
    
    getSystemStatus() {
        return {
            status: 'running',
            uptime: process.uptime(),
            patterns: this.fixPatterns.size,
            learningEntries: this.learningData.length,
            activeAnalyses: this.activeAnalysis.size,
            connectedClients: this.clients.size,
            config: this.config
        };
    }
}

// Export for use as module
module.exports = ErrorFixAI;

// Run as standalone server if called directly
if (require.main === module) {
    const errorFixAI = new ErrorFixAI();
    
    errorFixAI.on('ready', () => {
        console.log('🚀 NEXUS IDE Error Fix AI System is ready!');
        console.log('📊 System Status:', errorFixAI.getSystemStatus());
    });
    
    errorFixAI.on('error', (error) => {
        console.error('💥 Error Fix AI System error:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Error Fix AI System...');
        
        if (errorFixAI.wsServer) {
            errorFixAI.wsServer.close();
        }
        
        await errorFixAI.savePatterns();
        await errorFixAI.saveLearningData();
        
        console.log('✅ Error Fix AI System shut down gracefully');
        process.exit(0);
    });
}