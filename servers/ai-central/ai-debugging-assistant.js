/**
 * NEXUS IDE - AI Debugging Assistant
 * ระบบ AI ช่วยในการ debug ที่ฉลาดและทรงพลัง
 * Created: 2025-01-06
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const { spawn, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class AIDebuggingAssistant extends EventEmitter {
    constructor() {
        super();
        this.debugSessions = new Map();
        this.breakpoints = new Map();
        this.watchExpressions = new Map();
        this.callStacks = new Map();
        this.variables = new Map();
        this.debugHistory = [];
        this.aiModels = new Map();
        this.codeAnalysis = new Map();
        this.performanceMetrics = new Map();
        this.testCases = new Map();
        this.visualDebugData = new Map();
        this.collaborativeSessions = new Map();
        this.timeTravelSnapshots = new Map();
        
        this.init();
    }

    async init() {
        console.log('🐛 AI Debugging Assistant เริ่มทำงาน...');
        await this.initializeAIModels();
        await this.setupDebugEnvironment();
        this.startPerformanceMonitoring();
    }

    async initializeAIModels() {
        // เชื่อมต่อกับ AI models สำหรับการวิเคราะห์โค้ด
        this.aiModels.set('code-analyzer', {
            model: 'gpt-4-turbo',
            endpoint: 'http://localhost:3001/ai/analyze',
            capabilities: ['bug-detection', 'code-explanation', 'optimization']
        });
        
        this.aiModels.set('error-predictor', {
            model: 'claude-3-sonnet',
            endpoint: 'http://localhost:3002/ai/predict',
            capabilities: ['error-prediction', 'runtime-analysis', 'memory-leak-detection']
        });
        
        this.aiModels.set('test-generator', {
            model: 'llama-3-70b',
            endpoint: 'http://localhost:3003/ai/generate',
            capabilities: ['test-generation', 'edge-case-detection', 'coverage-analysis']
        });
    }

    async setupDebugEnvironment() {
        // ตั้งค่าสภาพแวดล้อมสำหรับ debugging
        this.debugConfig = {
            supportedLanguages: [
                'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
                'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'dart'
            ],
            debuggers: {
                javascript: { command: 'node', args: ['--inspect-brk'] },
                typescript: { command: 'ts-node', args: ['--inspect-brk'] },
                python: { command: 'python', args: ['-m', 'pdb'] },
                java: { command: 'jdb', args: [] },
                cpp: { command: 'gdb', args: [] },
                csharp: { command: 'dotnet', args: ['run', '--debug'] }
            },
            visualizers: {
                dataStructures: true,
                memoryLayout: true,
                executionFlow: true,
                performanceGraphs: true
            }
        };
    }

    // === Core Debugging Methods ===

    async startDebugSession(options) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            language: options.language,
            file: options.file,
            workingDirectory: options.workingDirectory,
            debugger: null,
            status: 'initializing',
            startTime: Date.now(),
            breakpoints: [],
            variables: {},
            callStack: [],
            output: [],
            aiInsights: [],
            collaborators: options.collaborators || []
        };

        this.debugSessions.set(sessionId, session);

        try {
            // เริ่ม debugger process
            await this.launchDebugger(session);
            
            // วิเคราะห์โค้ดด้วย AI
            const analysis = await this.analyzeCodeWithAI(options.file);
            session.aiInsights.push(analysis);
            
            // ตั้งค่า breakpoints อัตโนมัติ
            await this.setSmartBreakpoints(session, analysis);
            
            session.status = 'active';
            this.emit('sessionStarted', session);
            
            return session;
        } catch (error) {
            session.status = 'error';
            session.error = error.message;
            throw error;
        }
    }

    async launchDebugger(session) {
        const config = this.debugConfig.debuggers[session.language];
        if (!config) {
            throw new Error(`Debugger not supported for ${session.language}`);
        }

        const args = [...config.args, session.file];
        const debugProcess = spawn(config.command, args, {
            cwd: session.workingDirectory,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        session.debugProcess = debugProcess;

        // จัดการ output
        debugProcess.stdout.on('data', (data) => {
            const output = data.toString();
            session.output.push({ type: 'stdout', content: output, timestamp: Date.now() });
            this.analyzeDebugOutput(session, output);
        });

        debugProcess.stderr.on('data', (data) => {
            const output = data.toString();
            session.output.push({ type: 'stderr', content: output, timestamp: Date.now() });
            this.analyzeErrorOutput(session, output);
        });

        debugProcess.on('close', (code) => {
            session.status = 'closed';
            session.exitCode = code;
            this.emit('sessionClosed', session);
        });
    }

    async analyzeCodeWithAI(filePath) {
        try {
            const code = await fs.readFile(filePath, 'utf8');
            const analyzer = this.aiModels.get('code-analyzer');
            
            const response = await fetch(analyzer.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    task: 'analyze-for-debugging',
                    language: path.extname(filePath).slice(1)
                })
            });

            const analysis = await response.json();
            
            return {
                potentialBugs: analysis.bugs || [],
                complexityHotspots: analysis.complexity || [],
                performanceIssues: analysis.performance || [],
                securityVulnerabilities: analysis.security || [],
                suggestions: analysis.suggestions || [],
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('AI Code Analysis Error:', error);
            return { error: error.message };
        }
    }

    async setSmartBreakpoints(session, analysis) {
        const smartBreakpoints = [];
        
        // ตั้ง breakpoints ที่จุดที่ AI คิดว่าน่าจะมีปัญหา
        if (analysis.potentialBugs) {
            for (const bug of analysis.potentialBugs) {
                if (bug.line) {
                    smartBreakpoints.push({
                        line: bug.line,
                        condition: bug.condition,
                        reason: `Potential bug: ${bug.description}`,
                        type: 'smart-bug'
                    });
                }
            }
        }

        // ตั้ง breakpoints ที่จุดที่มี complexity สูง
        if (analysis.complexityHotspots) {
            for (const hotspot of analysis.complexityHotspots) {
                if (hotspot.line) {
                    smartBreakpoints.push({
                        line: hotspot.line,
                        reason: `Complexity hotspot: ${hotspot.description}`,
                        type: 'smart-complexity'
                    });
                }
            }
        }

        // ตั้ง breakpoints
        for (const bp of smartBreakpoints) {
            await this.setBreakpoint(session.id, bp);
        }

        return smartBreakpoints;
    }

    async setBreakpoint(sessionId, breakpoint) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        const bp = {
            id: this.generateBreakpointId(),
            line: breakpoint.line,
            column: breakpoint.column || 0,
            condition: breakpoint.condition,
            hitCount: 0,
            enabled: true,
            reason: breakpoint.reason,
            type: breakpoint.type || 'manual',
            timestamp: Date.now()
        };

        session.breakpoints.push(bp);
        this.breakpoints.set(bp.id, bp);

        // ส่งคำสั่งไปยัง debugger
        if (session.debugProcess) {
            const command = this.buildBreakpointCommand(session.language, bp);
            session.debugProcess.stdin.write(command + '\n');
        }

        this.emit('breakpointSet', { sessionId, breakpoint: bp });
        return bp;
    }

    buildBreakpointCommand(language, breakpoint) {
        switch (language) {
            case 'javascript':
            case 'typescript':
                return `sb(${breakpoint.line})`;
            case 'python':
                return `b ${breakpoint.line}`;
            case 'java':
                return `stop at ${breakpoint.line}`;
            case 'cpp':
                return `break ${breakpoint.line}`;
            default:
                return `break ${breakpoint.line}`;
        }
    }

    // === AI-Powered Debugging Features ===

    async analyzeDebugOutput(session, output) {
        // วิเคราะห์ output ด้วย AI เพื่อหาปัญหา
        const patterns = {
            errors: /error|exception|failed|crash/i,
            warnings: /warning|warn|deprecated/i,
            performance: /slow|timeout|memory|leak/i,
            security: /unauthorized|forbidden|injection|xss/i
        };

        const insights = [];
        
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(output)) {
                const insight = await this.getAIInsight(output, type);
                insights.push(insight);
            }
        }

        if (insights.length > 0) {
            session.aiInsights.push(...insights);
            this.emit('aiInsight', { sessionId: session.id, insights });
        }
    }

    async getAIInsight(output, type) {
        try {
            const analyzer = this.aiModels.get('error-predictor');
            
            const response = await fetch(analyzer.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    output,
                    type,
                    task: 'analyze-debug-output'
                })
            });

            const result = await response.json();
            
            return {
                type,
                severity: result.severity || 'medium',
                description: result.description,
                solution: result.solution,
                confidence: result.confidence || 0.8,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                type,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // === Visual Debugging ===

    async generateVisualDebugData(sessionId) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        const visualData = {
            executionFlow: await this.generateExecutionFlowGraph(session),
            memoryLayout: await this.generateMemoryVisualization(session),
            dataStructures: await this.visualizeDataStructures(session),
            performanceMetrics: await this.generatePerformanceGraphs(session),
            callStackTree: await this.generateCallStackTree(session)
        };

        this.visualDebugData.set(sessionId, visualData);
        return visualData;
    }

    async generateExecutionFlowGraph(session) {
        // สร้างกราฟแสดงการไหลของการทำงาน
        const nodes = [];
        const edges = [];
        
        // วิเคราะห์จาก breakpoints และ call stack
        for (const bp of session.breakpoints) {
            nodes.push({
                id: `bp_${bp.id}`,
                label: `Line ${bp.line}`,
                type: 'breakpoint',
                data: bp
            });
        }

        return { nodes, edges };
    }

    async generateMemoryVisualization(session) {
        // สร้างการแสดงผลหน่วยความจำ
        return {
            heap: await this.analyzeHeapUsage(session),
            stack: await this.analyzeStackUsage(session),
            variables: await this.analyzeVariableMemory(session)
        };
    }

    // === Time-Travel Debugging ===

    async createSnapshot(sessionId) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        const snapshot = {
            id: this.generateSnapshotId(),
            sessionId,
            timestamp: Date.now(),
            variables: { ...session.variables },
            callStack: [...session.callStack],
            breakpoints: [...session.breakpoints],
            output: [...session.output],
            memoryState: await this.captureMemoryState(session)
        };

        if (!this.timeTravelSnapshots.has(sessionId)) {
            this.timeTravelSnapshots.set(sessionId, []);
        }
        
        this.timeTravelSnapshots.get(sessionId).push(snapshot);
        return snapshot;
    }

    async restoreSnapshot(sessionId, snapshotId) {
        const snapshots = this.timeTravelSnapshots.get(sessionId);
        if (!snapshots) {
            throw new Error('No snapshots found for session');
        }

        const snapshot = snapshots.find(s => s.id === snapshotId);
        if (!snapshot) {
            throw new Error('Snapshot not found');
        }

        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        // คืนค่าสถานะ
        session.variables = { ...snapshot.variables };
        session.callStack = [...snapshot.callStack];
        
        // ส่งคำสั่งไปยัง debugger เพื่อคืนค่าสถานะ
        await this.restoreDebuggerState(session, snapshot);
        
        this.emit('snapshotRestored', { sessionId, snapshotId });
        return snapshot;
    }

    // === Collaborative Debugging ===

    async createCollaborativeSession(sessionId, collaborators) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        const collabSession = {
            id: this.generateCollabId(),
            debugSessionId: sessionId,
            collaborators: collaborators.map(c => ({
                id: c.id,
                name: c.name,
                role: c.role || 'viewer',
                joinedAt: Date.now(),
                cursor: null,
                activeBreakpoints: []
            })),
            sharedState: {
                breakpoints: session.breakpoints,
                variables: session.variables,
                callStack: session.callStack
            },
            chat: [],
            annotations: []
        };

        this.collaborativeSessions.set(collabSession.id, collabSession);
        session.collaborators = collaborators;
        
        this.emit('collaborativeSessionCreated', collabSession);
        return collabSession;
    }

    async addAnnotation(collabSessionId, annotation) {
        const collabSession = this.collaborativeSessions.get(collabSessionId);
        if (!collabSession) {
            throw new Error('Collaborative session not found');
        }

        const annotationData = {
            id: this.generateAnnotationId(),
            userId: annotation.userId,
            line: annotation.line,
            content: annotation.content,
            type: annotation.type || 'comment',
            timestamp: Date.now()
        };

        collabSession.annotations.push(annotationData);
        this.emit('annotationAdded', { collabSessionId, annotation: annotationData });
        
        return annotationData;
    }

    // === Automated Test Generation ===

    async generateTestCases(sessionId) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        try {
            const code = await fs.readFile(session.file, 'utf8');
            const testGenerator = this.aiModels.get('test-generator');
            
            const response = await fetch(testGenerator.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    language: session.language,
                    debugSession: {
                        breakpoints: session.breakpoints,
                        errors: session.output.filter(o => o.type === 'stderr'),
                        insights: session.aiInsights
                    },
                    task: 'generate-test-cases'
                })
            });

            const result = await response.json();
            
            const testCases = {
                unitTests: result.unitTests || [],
                integrationTests: result.integrationTests || [],
                edgeCases: result.edgeCases || [],
                performanceTests: result.performanceTests || [],
                generatedAt: Date.now()
            };

            this.testCases.set(sessionId, testCases);
            return testCases;
        } catch (error) {
            throw new Error(`Test generation failed: ${error.message}`);
        }
    }

    // === Performance Monitoring ===

    startPerformanceMonitoring() {
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 5000); // ทุก 5 วินาที
    }

    async collectPerformanceMetrics() {
        for (const [sessionId, session] of this.debugSessions) {
            if (session.status === 'active' && session.debugProcess) {
                const metrics = {
                    timestamp: Date.now(),
                    memoryUsage: process.memoryUsage(),
                    cpuUsage: process.cpuUsage(),
                    sessionDuration: Date.now() - session.startTime,
                    breakpointHits: session.breakpoints.reduce((sum, bp) => sum + bp.hitCount, 0),
                    outputLines: session.output.length
                };

                if (!this.performanceMetrics.has(sessionId)) {
                    this.performanceMetrics.set(sessionId, []);
                }
                
                this.performanceMetrics.get(sessionId).push(metrics);
            }
        }
    }

    // === Utility Methods ===

    generateSessionId() {
        return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    generateBreakpointId() {
        return `bp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    generateSnapshotId() {
        return `snap_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    generateCollabId() {
        return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    generateAnnotationId() {
        return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // === API Methods ===

    async getSessionInfo(sessionId) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        return {
            ...session,
            performance: this.performanceMetrics.get(sessionId) || [],
            visualData: this.visualDebugData.get(sessionId),
            testCases: this.testCases.get(sessionId),
            snapshots: this.timeTravelSnapshots.get(sessionId) || []
        };
    }

    async getAllSessions() {
        const sessions = [];
        for (const [id, session] of this.debugSessions) {
            sessions.push({
                id,
                language: session.language,
                file: session.file,
                status: session.status,
                startTime: session.startTime,
                collaborators: session.collaborators.length
            });
        }
        return sessions;
    }

    async getStats() {
        return {
            activeSessions: Array.from(this.debugSessions.values()).filter(s => s.status === 'active').length,
            totalSessions: this.debugSessions.size,
            totalBreakpoints: this.breakpoints.size,
            collaborativeSessions: this.collaborativeSessions.size,
            supportedLanguages: this.debugConfig.supportedLanguages.length,
            aiModels: this.aiModels.size,
            performanceMetrics: {
                averageSessionDuration: this.calculateAverageSessionDuration(),
                totalBreakpointHits: this.calculateTotalBreakpointHits(),
                aiInsightsGenerated: this.calculateTotalAIInsights()
            }
        };
    }

    calculateAverageSessionDuration() {
        const sessions = Array.from(this.debugSessions.values());
        if (sessions.length === 0) return 0;
        
        const totalDuration = sessions.reduce((sum, session) => {
            const duration = session.status === 'active' 
                ? Date.now() - session.startTime
                : (session.endTime || Date.now()) - session.startTime;
            return sum + duration;
        }, 0);
        
        return Math.round(totalDuration / sessions.length);
    }

    calculateTotalBreakpointHits() {
        let total = 0;
        for (const bp of this.breakpoints.values()) {
            total += bp.hitCount;
        }
        return total;
    }

    calculateTotalAIInsights() {
        let total = 0;
        for (const session of this.debugSessions.values()) {
            total += session.aiInsights.length;
        }
        return total;
    }

    async stopSession(sessionId) {
        const session = this.debugSessions.get(sessionId);
        if (!session) {
            throw new Error('Debug session not found');
        }

        if (session.debugProcess) {
            session.debugProcess.kill();
        }

        session.status = 'stopped';
        session.endTime = Date.now();
        
        this.emit('sessionStopped', session);
        return session;
    }

    async destroy() {
        // ปิดทุก debug sessions
        for (const [sessionId] of this.debugSessions) {
            await this.stopSession(sessionId);
        }
        
        // ล้างข้อมูล
        this.debugSessions.clear();
        this.breakpoints.clear();
        this.watchExpressions.clear();
        this.callStacks.clear();
        this.variables.clear();
        this.performanceMetrics.clear();
        this.visualDebugData.clear();
        this.collaborativeSessions.clear();
        this.timeTravelSnapshots.clear();
        
        console.log('🐛 AI Debugging Assistant ปิดการทำงานแล้ว');
    }
}

module.exports = AIDebuggingAssistant;