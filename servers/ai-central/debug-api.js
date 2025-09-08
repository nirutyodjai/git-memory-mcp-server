/**
 * NEXUS IDE - AI Debugging Assistant API
 * REST API endpoints สำหรับ AI Debugging Assistant
 * Created: 2025-01-06
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const AIDebuggingAssistant = require('./ai-debugging-assistant');

class DebugAPI {
    constructor(port = 3010) {
        this.port = port;
        this.app = express();
        this.server = null;
        this.wss = null;
        this.debugAssistant = new AIDebuggingAssistant();
        this.clients = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupEventHandlers();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`🐛 ${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'AI Debugging Assistant API',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // === Debug Session Management ===
        
        // เริ่ม debug session ใหม่
        this.app.post('/debug/sessions', async (req, res) => {
            try {
                const { language, file, workingDirectory, collaborators } = req.body;
                
                if (!language || !file) {
                    return res.status(400).json({ 
                        error: 'Missing required fields: language, file' 
                    });
                }

                const session = await this.debugAssistant.startDebugSession({
                    language,
                    file,
                    workingDirectory: workingDirectory || process.cwd(),
                    collaborators: collaborators || []
                });

                res.json({ 
                    success: true, 
                    session: {
                        id: session.id,
                        language: session.language,
                        file: session.file,
                        status: session.status,
                        startTime: session.startTime,
                        aiInsights: session.aiInsights
                    }
                });
            } catch (error) {
                res.status(500).json({ 
                    error: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        });

        // ดูข้อมูล debug session
        this.app.get('/debug/sessions/:sessionId', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const sessionInfo = await this.debugAssistant.getSessionInfo(sessionId);
                res.json({ success: true, session: sessionInfo });
            } catch (error) {
                res.status(404).json({ error: error.message });
            }
        });

        // ดูรายการ debug sessions ทั้งหมด
        this.app.get('/debug/sessions', async (req, res) => {
            try {
                const sessions = await this.debugAssistant.getAllSessions();
                res.json({ success: true, sessions });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // หยุด debug session
        this.app.delete('/debug/sessions/:sessionId', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const session = await this.debugAssistant.stopSession(sessionId);
                res.json({ success: true, session });
            } catch (error) {
                res.status(404).json({ error: error.message });
            }
        });

        // === Breakpoint Management ===
        
        // ตั้ง breakpoint
        this.app.post('/debug/sessions/:sessionId/breakpoints', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const { line, column, condition, reason } = req.body;
                
                if (!line) {
                    return res.status(400).json({ error: 'Missing required field: line' });
                }

                const breakpoint = await this.debugAssistant.setBreakpoint(sessionId, {
                    line,
                    column,
                    condition,
                    reason
                });

                res.json({ success: true, breakpoint });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // === Visual Debugging ===
        
        // ดึงข้อมูล visual debugging
        this.app.get('/debug/sessions/:sessionId/visual', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const visualData = await this.debugAssistant.generateVisualDebugData(sessionId);
                res.json({ success: true, visualData });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // === Time-Travel Debugging ===
        
        // สร้าง snapshot
        this.app.post('/debug/sessions/:sessionId/snapshots', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const snapshot = await this.debugAssistant.createSnapshot(sessionId);
                res.json({ success: true, snapshot });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // คืนค่าไปยัง snapshot
        this.app.post('/debug/sessions/:sessionId/snapshots/:snapshotId/restore', async (req, res) => {
            try {
                const { sessionId, snapshotId } = req.params;
                const snapshot = await this.debugAssistant.restoreSnapshot(sessionId, snapshotId);
                res.json({ success: true, snapshot });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // === Collaborative Debugging ===
        
        // สร้าง collaborative session
        this.app.post('/debug/sessions/:sessionId/collaborate', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const { collaborators } = req.body;
                
                if (!collaborators || !Array.isArray(collaborators)) {
                    return res.status(400).json({ error: 'Missing or invalid collaborators array' });
                }

                const collabSession = await this.debugAssistant.createCollaborativeSession(sessionId, collaborators);
                res.json({ success: true, collaborativeSession: collabSession });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // เพิ่ม annotation
        this.app.post('/debug/collaborate/:collabSessionId/annotations', async (req, res) => {
            try {
                const { collabSessionId } = req.params;
                const { userId, line, content, type } = req.body;
                
                if (!userId || !line || !content) {
                    return res.status(400).json({ error: 'Missing required fields: userId, line, content' });
                }

                const annotation = await this.debugAssistant.addAnnotation(collabSessionId, {
                    userId,
                    line,
                    content,
                    type
                });

                res.json({ success: true, annotation });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // === Test Generation ===
        
        // สร้าง test cases อัตโนมัติ
        this.app.post('/debug/sessions/:sessionId/generate-tests', async (req, res) => {
            try {
                const { sessionId } = req.params;
                const testCases = await this.debugAssistant.generateTestCases(sessionId);
                res.json({ success: true, testCases });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // === Statistics ===
        
        // ดูสถิติการใช้งาน
        this.app.get('/debug/stats', async (req, res) => {
            try {
                const stats = await this.debugAssistant.getStats();
                res.json({ success: true, stats });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // === AI Analysis ===
        
        // วิเคราะห์โค้ดด้วย AI
        this.app.post('/debug/analyze', async (req, res) => {
            try {
                const { filePath } = req.body;
                
                if (!filePath) {
                    return res.status(400).json({ error: 'Missing required field: filePath' });
                }

                const analysis = await this.debugAssistant.analyzeCodeWithAI(filePath);
                res.json({ success: true, analysis });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('🐛 API Error:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ 
                error: 'Endpoint not found',
                path: req.path,
                method: req.method
            });
        });
    }

    setupWebSocket() {
        // WebSocket server จะถูกสร้างเมื่อ HTTP server เริ่มทำงาน
    }

    setupEventHandlers() {
        // ฟัง events จาก AI Debugging Assistant
        this.debugAssistant.on('sessionStarted', (session) => {
            this.broadcastToClients('sessionStarted', session);
        });

        this.debugAssistant.on('sessionClosed', (session) => {
            this.broadcastToClients('sessionClosed', session);
        });

        this.debugAssistant.on('breakpointSet', (data) => {
            this.broadcastToClients('breakpointSet', data);
        });

        this.debugAssistant.on('aiInsight', (data) => {
            this.broadcastToClients('aiInsight', data);
        });

        this.debugAssistant.on('snapshotRestored', (data) => {
            this.broadcastToClients('snapshotRestored', data);
        });

        this.debugAssistant.on('collaborativeSessionCreated', (collabSession) => {
            this.broadcastToClients('collaborativeSessionCreated', collabSession);
        });

        this.debugAssistant.on('annotationAdded', (data) => {
            this.broadcastToClients('annotationAdded', data);
        });
    }

    broadcastToClients(event, data) {
        const message = JSON.stringify({ event, data, timestamp: Date.now() });
        
        if (this.wss) {
            this.wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }

    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    console.log(`🐛 AI Debugging Assistant API เริ่มทำงานที่ port ${this.port}`);
                    
                    // สร้าง WebSocket server
                    this.wss = new WebSocket.Server({ server: this.server });
                    
                    this.wss.on('connection', (ws, req) => {
                        const clientId = this.generateClientId();
                        this.clients.set(clientId, ws);
                        
                        console.log(`🔌 WebSocket client เชื่อมต่อ: ${clientId}`);
                        
                        ws.on('message', (message) => {
                            try {
                                const data = JSON.parse(message);
                                this.handleWebSocketMessage(clientId, data);
                            } catch (error) {
                                console.error('WebSocket message error:', error);
                            }
                        });
                        
                        ws.on('close', () => {
                            console.log(`🔌 WebSocket client ตัดการเชื่อมต่อ: ${clientId}`);
                            this.clients.delete(clientId);
                        });
                        
                        // ส่งข้อความต้อนรับ
                        ws.send(JSON.stringify({
                            event: 'connected',
                            clientId,
                            timestamp: Date.now()
                        }));
                    });
                    
                    resolve();
                });
                
                this.server.on('error', reject);
            } catch (error) {
                reject(error);
            }
        });
    }

    handleWebSocketMessage(clientId, data) {
        // จัดการข้อความจาก WebSocket clients
        switch (data.type) {
            case 'subscribe':
                // Subscribe to specific events
                break;
            case 'unsubscribe':
                // Unsubscribe from events
                break;
            case 'ping':
                // Respond to ping
                const client = this.clients.get(clientId);
                if (client) {
                    client.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                }
                break;
        }
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    async stop() {
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(resolve);
            });
        }
        
        await this.debugAssistant.destroy();
        console.log('🐛 AI Debugging Assistant API หยุดการทำงานแล้ว');
    }

    // === Utility Methods ===
    
    getApp() {
        return this.app;
    }
    
    getServer() {
        return this.server;
    }
    
    getWebSocketServer() {
        return this.wss;
    }
    
    getDebugAssistant() {
        return this.debugAssistant;
    }
}

// สำหรับการรันแบบ standalone
if (require.main === module) {
    const debugAPI = new DebugAPI();
    
    debugAPI.start().then(() => {
        console.log('🚀 AI Debugging Assistant API พร้อมใช้งาน!');
    }).catch((error) => {
        console.error('❌ ไม่สามารถเริ่ม AI Debugging Assistant API:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 กำลังปิด AI Debugging Assistant API...');
        await debugAPI.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 กำลังปิด AI Debugging Assistant API...');
        await debugAPI.stop();
        process.exit(0);
    });
}

module.exports = DebugAPI;