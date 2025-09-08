#!/usr/bin/env node

/**
 * NEXUS IDE - Real-time Collaboration Server
 * ระบบ Real-time Collaboration ที่ทรงพลังพร้อม WebSocket, Live Sharing, และ Collaborative AI
 * Created: 2025-01-06
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class CollaborationServer extends EventEmitter {
    constructor(port = 3011) {
        super();
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });
        
        // Data structures
        this.collaborationSessions = new Map();
        this.activeUsers = new Map();
        this.sharedDocuments = new Map();
        this.operationalTransforms = new Map();
        this.aiCollaborators = new Map();
        this.voiceChatRooms = new Map();
        this.screenSharingRooms = new Map();
        this.codeReviewSessions = new Map();
        this.pairProgrammingSessions = new Map();
        
        // Performance metrics
        this.metrics = {
            totalSessions: 0,
            activeConnections: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            dataTransferred: 0
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.startPerformanceMonitoring();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
        
        // Error handling
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: Date.now(),
                uptime: process.uptime(),
                metrics: this.metrics,
                activeSessions: this.collaborationSessions.size,
                activeUsers: this.activeUsers.size
            });
        });

        // === Collaboration Session Management ===
        
        // สร้าง collaboration session ใหม่
        this.app.post('/collaboration/sessions', async (req, res) => {
            try {
                const { name, type, settings, createdBy } = req.body;
                
                const session = {
                    id: uuidv4(),
                    name: name || 'Untitled Session',
                    type: type || 'general', // general, coding, review, pair-programming
                    settings: {
                        maxParticipants: 10,
                        allowAnonymous: false,
                        enableVoiceChat: true,
                        enableScreenSharing: true,
                        enableAI: true,
                        permissions: {
                            canEdit: true,
                            canComment: true,
                            canInvite: false
                        },
                        ...settings
                    },
                    createdBy,
                    createdAt: Date.now(),
                    participants: [],
                    documents: [],
                    chatHistory: [],
                    status: 'active',
                    aiCollaborator: null
                };
                
                this.collaborationSessions.set(session.id, session);
                this.metrics.totalSessions++;
                
                // สร้าง AI Collaborator ถ้าเปิดใช้งาน
                if (session.settings.enableAI) {
                    await this.createAICollaborator(session.id);
                }
                
                res.json({ success: true, session });
            } catch (error) {
                console.error('Error creating session:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // รับรายการ sessions
        this.app.get('/collaboration/sessions', (req, res) => {
            const sessions = Array.from(this.collaborationSessions.values())
                .map(session => ({
                    id: session.id,
                    name: session.name,
                    type: session.type,
                    participantCount: session.participants.length,
                    createdAt: session.createdAt,
                    status: session.status
                }));
            
            res.json({ sessions });
        });
        
        // รับข้อมูล session เฉพาะ
        this.app.get('/collaboration/sessions/:id', (req, res) => {
            const session = this.collaborationSessions.get(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            res.json({ session });
        });
        
        // อัปเดต session settings
        this.app.put('/collaboration/sessions/:id', (req, res) => {
            const session = this.collaborationSessions.get(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            Object.assign(session.settings, req.body.settings);
            session.updatedAt = Date.now();
            
            // แจ้งผู้เข้าร่วมทุกคนเกี่ยวกับการเปลี่ยนแปลง
            this.io.to(session.id).emit('sessionUpdated', { session });
            
            res.json({ success: true, session });
        });
        
        // ลบ session
        this.app.delete('/collaboration/sessions/:id', (req, res) => {
            const session = this.collaborationSessions.get(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            // แจ้งผู้เข้าร่วมทุกคน
            this.io.to(session.id).emit('sessionClosed', { sessionId: session.id });
            
            // ลบข้อมูลที่เกี่ยวข้อง
            this.collaborationSessions.delete(session.id);
            this.aiCollaborators.delete(session.id);
            this.voiceChatRooms.delete(session.id);
            this.screenSharingRooms.delete(session.id);
            
            res.json({ success: true });
        });

        // === Document Collaboration ===
        
        // สร้างเอกสารใหม่ในเซสชัน
        this.app.post('/collaboration/sessions/:id/documents', async (req, res) => {
            try {
                const session = this.collaborationSessions.get(req.params.id);
                if (!session) {
                    return res.status(404).json({ error: 'Session not found' });
                }
                
                const { name, content, language, type } = req.body;
                
                const document = {
                    id: uuidv4(),
                    name: name || 'Untitled Document',
                    content: content || '',
                    language: language || 'javascript',
                    type: type || 'code', // code, markdown, text
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    version: 1,
                    operations: [],
                    cursors: new Map(),
                    selections: new Map()
                };
                
                session.documents.push(document);
                this.sharedDocuments.set(document.id, document);
                
                // แจ้งผู้เข้าร่วมทุกคน
                this.io.to(session.id).emit('documentCreated', { document });
                
                res.json({ success: true, document });
            } catch (error) {
                console.error('Error creating document:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // รับรายการเอกสารในเซสชัน
        this.app.get('/collaboration/sessions/:id/documents', (req, res) => {
            const session = this.collaborationSessions.get(req.params.id);
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            res.json({ documents: session.documents });
        });
        
        // รับเอกสารเฉพาะ
        this.app.get('/collaboration/documents/:id', (req, res) => {
            const document = this.sharedDocuments.get(req.params.id);
            if (!document) {
                return res.status(404).json({ error: 'Document not found' });
            }
            
            res.json({ document });
        });

        // === AI Collaboration ===
        
        // ขอความช่วยเหลือจาก AI
        this.app.post('/collaboration/sessions/:id/ai/assist', async (req, res) => {
            try {
                const session = this.collaborationSessions.get(req.params.id);
                if (!session || !session.settings.enableAI) {
                    return res.status(404).json({ error: 'AI not available' });
                }
                
                const { query, context, documentId } = req.body;
                const aiResponse = await this.getAIAssistance(session.id, query, context, documentId);
                
                res.json({ success: true, response: aiResponse });
            } catch (error) {
                console.error('Error getting AI assistance:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // ขอให้ AI ทำ code review
        this.app.post('/collaboration/sessions/:id/ai/review', async (req, res) => {
            try {
                const session = this.collaborationSessions.get(req.params.id);
                if (!session || !session.settings.enableAI) {
                    return res.status(404).json({ error: 'AI not available' });
                }
                
                const { documentId, code } = req.body;
                const review = await this.performAICodeReview(session.id, documentId, code);
                
                res.json({ success: true, review });
            } catch (error) {
                console.error('Error performing AI review:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // === Statistics ===
        
        this.app.get('/collaboration/stats', (req, res) => {
            const stats = {
                ...this.metrics,
                activeSessions: this.collaborationSessions.size,
                activeUsers: this.activeUsers.size,
                sharedDocuments: this.sharedDocuments.size,
                aiCollaborators: this.aiCollaborators.size,
                voiceChatRooms: this.voiceChatRooms.size,
                screenSharingRooms: this.screenSharingRooms.size
            };
            
            res.json({ stats });
        });
    }

    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 User connected: ${socket.id}`);
            this.metrics.activeConnections++;
            
            // === User Management ===
            
            socket.on('joinSession', async (data) => {
                try {
                    const { sessionId, user } = data;
                    const session = this.collaborationSessions.get(sessionId);
                    
                    if (!session) {
                        socket.emit('error', { message: 'Session not found' });
                        return;
                    }
                    
                    // ตรวจสอบสิทธิ์
                    if (session.participants.length >= session.settings.maxParticipants) {
                        socket.emit('error', { message: 'Session is full' });
                        return;
                    }
                    
                    // เพิ่มผู้ใช้เข้าเซสชัน
                    const participant = {
                        id: socket.id,
                        user: user,
                        joinedAt: Date.now(),
                        status: 'active',
                        cursor: null,
                        selection: null
                    };
                    
                    session.participants.push(participant);
                    this.activeUsers.set(socket.id, { ...participant, sessionId });
                    
                    // เข้าร่วม socket room
                    socket.join(sessionId);
                    
                    // แจ้งผู้เข้าร่วมคนอื่น
                    socket.to(sessionId).emit('userJoined', { participant });
                    
                    // ส่งข้อมูลเซสชันให้ผู้ใช้ใหม่
                    socket.emit('sessionJoined', {
                        session,
                        participants: session.participants,
                        documents: session.documents
                    });
                    
                    console.log(`👥 User ${user.name} joined session ${sessionId}`);
                } catch (error) {
                    console.error('Error joining session:', error);
                    socket.emit('error', { message: error.message });
                }
            });
            
            socket.on('leaveSession', (data) => {
                this.handleUserLeave(socket, data?.sessionId);
            });
            
            // === Real-time Document Editing ===
            
            socket.on('documentOperation', async (data) => {
                try {
                    const { documentId, operation, sessionId } = data;
                    const document = this.sharedDocuments.get(documentId);
                    
                    if (!document) {
                        socket.emit('error', { message: 'Document not found' });
                        return;
                    }
                    
                    // ใช้ Operational Transform
                    const transformedOp = await this.applyOperationalTransform(document, operation);
                    
                    // อัปเดตเอกสาร
                    document.operations.push(transformedOp);
                    document.version++;
                    document.updatedAt = Date.now();
                    
                    // ส่งการเปลี่ยนแปลงให้ผู้ใช้คนอื่น
                    socket.to(sessionId).emit('documentChanged', {
                        documentId,
                        operation: transformedOp,
                        version: document.version
                    });
                    
                    // แจ้ง AI Collaborator
                    if (this.aiCollaborators.has(sessionId)) {
                        this.notifyAICollaborator(sessionId, 'documentChanged', {
                            documentId,
                            operation: transformedOp
                        });
                    }
                } catch (error) {
                    console.error('Error handling document operation:', error);
                    socket.emit('error', { message: error.message });
                }
            });
            
            socket.on('cursorMove', (data) => {
                const { documentId, cursor, sessionId } = data;
                const user = this.activeUsers.get(socket.id);
                
                if (user) {
                    user.cursor = cursor;
                    
                    // ส่งตำแหน่ง cursor ให้ผู้ใช้คนอื่น
                    socket.to(sessionId).emit('cursorMoved', {
                        userId: socket.id,
                        documentId,
                        cursor,
                        user: user.user
                    });
                }
            });
            
            socket.on('textSelection', (data) => {
                const { documentId, selection, sessionId } = data;
                const user = this.activeUsers.get(socket.id);
                
                if (user) {
                    user.selection = selection;
                    
                    // ส่งการเลือกข้อความให้ผู้ใช้คนอื่น
                    socket.to(sessionId).emit('selectionChanged', {
                        userId: socket.id,
                        documentId,
                        selection,
                        user: user.user
                    });
                }
            });

            // === Chat & Communication ===
            
            socket.on('chatMessage', (data) => {
                const { sessionId, message } = data;
                const session = this.collaborationSessions.get(sessionId);
                const user = this.activeUsers.get(socket.id);
                
                if (session && user) {
                    const chatMessage = {
                        id: uuidv4(),
                        user: user.user,
                        message,
                        timestamp: Date.now(),
                        type: 'text'
                    };
                    
                    session.chatHistory.push(chatMessage);
                    
                    // ส่งข้อความให้ทุกคนในเซสชัน
                    this.io.to(sessionId).emit('chatMessage', chatMessage);
                }
            });
            
            socket.on('voiceChat', (data) => {
                const { sessionId, action, audioData } = data;
                
                if (action === 'start') {
                    this.startVoiceChat(sessionId, socket.id);
                } else if (action === 'stop') {
                    this.stopVoiceChat(sessionId, socket.id);
                } else if (action === 'audio' && audioData) {
                    // ส่งข้อมูลเสียงให้ผู้ใช้คนอื่นในห้อง
                    socket.to(sessionId).emit('voiceData', {
                        userId: socket.id,
                        audioData
                    });
                }
            });
            
            socket.on('screenShare', (data) => {
                const { sessionId, action, screenData } = data;
                
                if (action === 'start') {
                    this.startScreenSharing(sessionId, socket.id);
                } else if (action === 'stop') {
                    this.stopScreenSharing(sessionId, socket.id);
                } else if (action === 'frame' && screenData) {
                    // ส่งข้อมูลหน้าจอให้ผู้ใช้คนอื่น
                    socket.to(sessionId).emit('screenFrame', {
                        userId: socket.id,
                        screenData
                    });
                }
            });

            // === AI Collaboration ===
            
            socket.on('aiRequest', async (data) => {
                try {
                    const { sessionId, type, payload } = data;
                    const response = await this.handleAIRequest(sessionId, type, payload, socket.id);
                    
                    socket.emit('aiResponse', {
                        type,
                        response,
                        requestId: data.requestId
                    });
                } catch (error) {
                    console.error('Error handling AI request:', error);
                    socket.emit('aiError', {
                        message: error.message,
                        requestId: data.requestId
                    });
                }
            });

            // === Disconnect Handling ===
            
            socket.on('disconnect', () => {
                console.log(`🔌 User disconnected: ${socket.id}`);
                this.metrics.activeConnections--;
                this.handleUserLeave(socket);
            });
        });
    }

    // === AI Collaboration Methods ===
    
    async createAICollaborator(sessionId) {
        const aiCollaborator = {
            id: `ai-${sessionId}`,
            name: 'NEXUS AI Assistant',
            type: 'ai',
            capabilities: [
                'code-completion',
                'code-review',
                'bug-detection',
                'refactoring',
                'documentation',
                'testing',
                'optimization'
            ],
            status: 'active',
            createdAt: Date.now()
        };
        
        this.aiCollaborators.set(sessionId, aiCollaborator);
        
        // แจ้งผู้เข้าร่วมว่า AI เข้าร่วมแล้ว
        this.io.to(sessionId).emit('aiJoined', { aiCollaborator });
        
        return aiCollaborator;
    }
    
    async getAIAssistance(sessionId, query, context, documentId) {
        // จำลองการตอบสนองของ AI
        // ในการใช้งานจริงจะเชื่อมต่อกับ AI models
        
        const responses = {
            'code-completion': 'AI suggests: function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }',
            'code-review': 'AI Review: The code looks good, but consider adding error handling for edge cases.',
            'bug-detection': 'AI found potential issue: Null pointer exception possible at line 42.',
            'refactoring': 'AI suggests: Extract this logic into a separate function for better maintainability.',
            'documentation': 'AI generated documentation: This function calculates the total price of items in a shopping cart.',
            'testing': 'AI suggests test case: expect(calculateTotal([])).toBe(0);',
            'optimization': 'AI optimization: Use Map instead of Array.find() for better performance.'
        };
        
        const responseType = this.detectQueryType(query);
        
        return {
            type: responseType,
            content: responses[responseType] || 'AI is thinking...',
            confidence: 0.85,
            suggestions: [
                'Would you like me to implement this suggestion?',
                'Should I create a test for this code?',
                'Do you want me to explain this in more detail?'
            ],
            timestamp: Date.now()
        };
    }
    
    detectQueryType(query) {
        const keywords = {
            'complete': 'code-completion',
            'review': 'code-review',
            'bug': 'bug-detection',
            'refactor': 'refactoring',
            'document': 'documentation',
            'test': 'testing',
            'optimize': 'optimization'
        };
        
        for (const [keyword, type] of Object.entries(keywords)) {
            if (query.toLowerCase().includes(keyword)) {
                return type;
            }
        }
        
        return 'code-completion';
    }
    
    async performAICodeReview(sessionId, documentId, code) {
        // จำลองการ code review ของ AI
        return {
            overall: 'good',
            score: 8.5,
            issues: [
                {
                    type: 'warning',
                    line: 15,
                    message: 'Consider using const instead of let for immutable variables',
                    severity: 'low'
                },
                {
                    type: 'suggestion',
                    line: 23,
                    message: 'This function could be simplified using array methods',
                    severity: 'medium'
                }
            ],
            suggestions: [
                'Add error handling for network requests',
                'Consider adding unit tests for edge cases',
                'Use TypeScript for better type safety'
            ],
            timestamp: Date.now()
        };
    }
    
    async handleAIRequest(sessionId, type, payload, userId) {
        switch (type) {
            case 'code-completion':
                return await this.getAICodeCompletion(payload);
            case 'code-review':
                return await this.performAICodeReview(sessionId, payload.documentId, payload.code);
            case 'bug-detection':
                return await this.detectBugs(payload.code);
            case 'refactoring':
                return await this.suggestRefactoring(payload.code);
            default:
                throw new Error(`Unknown AI request type: ${type}`);
        }
    }
    
    async getAICodeCompletion(payload) {
        // จำลองการ code completion
        return {
            completions: [
                {
                    text: 'function handleSubmit(event) {',
                    confidence: 0.9
                },
                {
                    text: 'const handleSubmit = (event) => {',
                    confidence: 0.8
                }
            ]
        };
    }
    
    async detectBugs(code) {
        // จำลองการตรวจจับ bugs
        return {
            bugs: [
                {
                    type: 'null-pointer',
                    line: 42,
                    message: 'Potential null pointer exception',
                    severity: 'high'
                }
            ]
        };
    }
    
    async suggestRefactoring(code) {
        // จำลองการแนะนำ refactoring
        return {
            suggestions: [
                {
                    type: 'extract-function',
                    lines: [15, 25],
                    message: 'Extract this logic into a separate function'
                }
            ]
        };
    }
    
    notifyAICollaborator(sessionId, event, data) {
        const aiCollaborator = this.aiCollaborators.get(sessionId);
        if (aiCollaborator) {
            // ส่งข้อมูลให้ AI เพื่อวิเคราะห์และตอบสนอง
            this.processAINotification(sessionId, event, data);
        }
    }
    
    async processAINotification(sessionId, event, data) {
        // ประมวลผลการแจ้งเตือนและตอบสนองอัตโนมัติ
        if (event === 'documentChanged') {
            // AI อาจแนะนำการปรับปรุงโค้ดอัตโนมัติ
            setTimeout(() => {
                this.io.to(sessionId).emit('aiSuggestion', {
                    type: 'auto-suggestion',
                    message: 'AI suggests: Consider adding error handling here',
                    documentId: data.documentId,
                    timestamp: Date.now()
                });
            }, 2000);
        }
    }

    // === Operational Transform Methods ===
    
    async applyOperationalTransform(document, operation) {
        // ใช้ Operational Transform algorithm เพื่อจัดการ concurrent edits
        // นี่เป็นการจำลองแบบง่าย ในการใช้งานจริงต้องใช้ algorithm ที่ซับซ้อนกว่า
        
        const transformedOp = {
            ...operation,
            id: uuidv4(),
            timestamp: Date.now(),
            version: document.version + 1
        };
        
        // ตรวจสอบและแก้ไข conflicts
        if (document.operations.length > 0) {
            const lastOp = document.operations[document.operations.length - 1];
            if (this.hasConflict(lastOp, transformedOp)) {
                transformedOp.position = this.resolveConflict(lastOp, transformedOp);
            }
        }
        
        return transformedOp;
    }
    
    hasConflict(op1, op2) {
        // ตรวจสอบว่ามี conflict หรือไม่
        return Math.abs(op1.position - op2.position) < 10;
    }
    
    resolveConflict(op1, op2) {
        // แก้ไข conflict โดยปรับตำแหน่ง
        return op2.position + op1.length;
    }

    // === Voice Chat Methods ===
    
    startVoiceChat(sessionId, userId) {
        if (!this.voiceChatRooms.has(sessionId)) {
            this.voiceChatRooms.set(sessionId, new Set());
        }
        
        const room = this.voiceChatRooms.get(sessionId);
        room.add(userId);
        
        // แจ้งผู้ใช้คนอื่นว่ามีคนเริ่ม voice chat
        this.io.to(sessionId).emit('voiceChatStarted', {
            userId,
            participants: Array.from(room)
        });
    }
    
    stopVoiceChat(sessionId, userId) {
        const room = this.voiceChatRooms.get(sessionId);
        if (room) {
            room.delete(userId);
            
            // แจ้งผู้ใช้คนอื่น
            this.io.to(sessionId).emit('voiceChatStopped', {
                userId,
                participants: Array.from(room)
            });
            
            // ลบห้องถ้าไม่มีคนแล้ว
            if (room.size === 0) {
                this.voiceChatRooms.delete(sessionId);
            }
        }
    }

    // === Screen Sharing Methods ===
    
    startScreenSharing(sessionId, userId) {
        if (!this.screenSharingRooms.has(sessionId)) {
            this.screenSharingRooms.set(sessionId, new Set());
        }
        
        const room = this.screenSharingRooms.get(sessionId);
        room.add(userId);
        
        // แจ้งผู้ใช้คนอื่น
        this.io.to(sessionId).emit('screenSharingStarted', {
            userId,
            presenters: Array.from(room)
        });
    }
    
    stopScreenSharing(sessionId, userId) {
        const room = this.screenSharingRooms.get(sessionId);
        if (room) {
            room.delete(userId);
            
            // แจ้งผู้ใช้คนอื่น
            this.io.to(sessionId).emit('screenSharingStopped', {
                userId,
                presenters: Array.from(room)
            });
            
            // ลบห้องถ้าไม่มีคนแล้ว
            if (room.size === 0) {
                this.screenSharingRooms.delete(sessionId);
            }
        }
    }

    // === User Management Methods ===
    
    handleUserLeave(socket, sessionId = null) {
        const user = this.activeUsers.get(socket.id);
        if (!user) return;
        
        const targetSessionId = sessionId || user.sessionId;
        const session = this.collaborationSessions.get(targetSessionId);
        
        if (session) {
            // ลบผู้ใช้จากเซสชัน
            session.participants = session.participants.filter(p => p.id !== socket.id);
            
            // แจ้งผู้ใช้คนอื่น
            socket.to(targetSessionId).emit('userLeft', {
                userId: socket.id,
                user: user.user
            });
            
            // ลบจาก voice chat และ screen sharing
            this.stopVoiceChat(targetSessionId, socket.id);
            this.stopScreenSharing(targetSessionId, socket.id);
        }
        
        // ลบจากรายการผู้ใช้ที่ active
        this.activeUsers.delete(socket.id);
    }

    // === Performance Monitoring ===
    
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updateMetrics();
        }, 5000); // อัปเดตทุก 5 วินาที
    }
    
    updateMetrics() {
        const now = Date.now();
        
        // คำนวณ messages per second
        // (ในการใช้งานจริงจะต้องติดตามจำนวนข้อความที่ส่ง)
        
        // คำนวณ average latency
        // (ในการใช้งานจริงจะต้องวัด latency จริง)
        
        this.metrics.messagesPerSecond = Math.floor(Math.random() * 100);
        this.metrics.averageLatency = Math.floor(Math.random() * 50) + 10;
        this.metrics.dataTransferred += Math.floor(Math.random() * 1000);
        
        // Log metrics
        if (this.metrics.activeConnections > 0) {
            console.log(`📊 Metrics - Connections: ${this.metrics.activeConnections}, Sessions: ${this.collaborationSessions.size}, Latency: ${this.metrics.averageLatency}ms`);
        }
    }

    // === Server Management ===
    
    async start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`🤝 Collaboration Server running on port ${this.port}`);
                    resolve();
                }
            });
        });
    }
    
    async stop() {
        return new Promise((resolve) => {
            // แจ้งผู้ใช้ทุกคนว่าเซิร์ฟเวอร์จะปิด
            this.io.emit('serverShutdown', {
                message: 'Server is shutting down',
                timestamp: Date.now()
            });
            
            // ปิด WebSocket connections
            this.io.close();
            
            // ปิด HTTP server
            this.server.close(() => {
                console.log('🤝 Collaboration Server stopped');
                resolve();
            });
        });
    }
    
    getStats() {
        return {
            ...this.metrics,
            activeSessions: this.collaborationSessions.size,
            activeUsers: this.activeUsers.size,
            sharedDocuments: this.sharedDocuments.size,
            aiCollaborators: this.aiCollaborators.size,
            voiceChatRooms: this.voiceChatRooms.size,
            screenSharingRooms: this.screenSharingRooms.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }
}

// เริ่มต้นเซิร์ฟเวอร์
if (require.main === module) {
    const server = new CollaborationServer(3011);
    
    server.start().then(() => {
        console.log('🚀 NEXUS IDE Collaboration Server is ready!');
    }).catch((error) => {
        console.error('💥 Failed to start Collaboration Server:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Collaboration Server...');
        await server.stop();
        process.exit(0);
    });
}

module.exports = CollaborationServer;