/**
 * NEXUS IDE - Real-time Collaboration Client
 * WebSocket Client Library สำหรับ Frontend เชื่อมต่อกับ Collaboration Server
 * Created: 2025-01-06
 */

class CollaborationClient {
    constructor(serverUrl = 'http://localhost:3011', options = {}) {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.currentSession = null;
        this.currentUser = null;
        this.documents = new Map();
        this.participants = new Map();
        this.cursors = new Map();
        this.selections = new Map();
        
        // Event handlers
        this.eventHandlers = new Map();
        
        // Options
        this.options = {
            autoReconnect: true,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            enableVoiceChat: true,
            enableScreenSharing: true,
            enableAI: true,
            ...options
        };
        
        // Reconnection state
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        
        // Performance tracking
        this.metrics = {
            messagesReceived: 0,
            messagesSent: 0,
            averageLatency: 0,
            connectionTime: null,
            lastPingTime: null
        };
        
        this.initializeSocket();
    }

    // === Connection Management ===
    
    initializeSocket() {
        if (typeof io === 'undefined') {
            console.error('Socket.IO client library not found. Please include socket.io-client.');
            return;
        }
        
        this.socket = io(this.serverUrl, {
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true
        });
        
        this.setupSocketEvents();
    }
    
    setupSocketEvents() {
        // === Connection Events ===
        
        this.socket.on('connect', () => {
            console.log('🔌 Connected to collaboration server');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.metrics.connectionTime = Date.now();
            
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            
            this.emit('connected');
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Disconnected from collaboration server:', reason);
            this.isConnected = false;
            this.emit('disconnected', { reason });
            
            if (this.options.autoReconnect && reason !== 'io client disconnect') {
                this.attemptReconnect();
            }
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('🔌 Connection error:', error);
            this.emit('connectionError', { error });
            
            if (this.options.autoReconnect) {
                this.attemptReconnect();
            }
        });

        // === Session Events ===
        
        this.socket.on('sessionJoined', (data) => {
            console.log('👥 Joined session:', data.session.name);
            this.currentSession = data.session;
            
            // อัปเดตรายการผู้เข้าร่วม
            this.participants.clear();
            data.participants.forEach(participant => {
                this.participants.set(participant.id, participant);
            });
            
            // อัปเดตเอกสาร
            this.documents.clear();
            data.documents.forEach(doc => {
                this.documents.set(doc.id, doc);
            });
            
            this.emit('sessionJoined', data);
        });
        
        this.socket.on('userJoined', (data) => {
            console.log('👤 User joined:', data.participant.user.name);
            this.participants.set(data.participant.id, data.participant);
            this.emit('userJoined', data);
        });
        
        this.socket.on('userLeft', (data) => {
            console.log('👤 User left:', data.user.name);
            this.participants.delete(data.userId);
            this.cursors.delete(data.userId);
            this.selections.delete(data.userId);
            this.emit('userLeft', data);
        });
        
        this.socket.on('sessionUpdated', (data) => {
            this.currentSession = data.session;
            this.emit('sessionUpdated', data);
        });
        
        this.socket.on('sessionClosed', (data) => {
            console.log('🚪 Session closed');
            this.currentSession = null;
            this.participants.clear();
            this.documents.clear();
            this.emit('sessionClosed', data);
        });

        // === Document Events ===
        
        this.socket.on('documentCreated', (data) => {
            console.log('📄 Document created:', data.document.name);
            this.documents.set(data.document.id, data.document);
            this.emit('documentCreated', data);
        });
        
        this.socket.on('documentChanged', (data) => {
            const document = this.documents.get(data.documentId);
            if (document) {
                // อัปเดตเอกสารด้วย operation
                this.applyOperation(document, data.operation);
                document.version = data.version;
                this.emit('documentChanged', data);
            }
        });
        
        this.socket.on('cursorMoved', (data) => {
            this.cursors.set(data.userId, {
                ...data.cursor,
                user: data.user,
                documentId: data.documentId
            });
            this.emit('cursorMoved', data);
        });
        
        this.socket.on('selectionChanged', (data) => {
            this.selections.set(data.userId, {
                ...data.selection,
                user: data.user,
                documentId: data.documentId
            });
            this.emit('selectionChanged', data);
        });

        // === Chat Events ===
        
        this.socket.on('chatMessage', (data) => {
            if (this.currentSession) {
                this.currentSession.chatHistory.push(data);
            }
            this.emit('chatMessage', data);
        });

        // === Voice Chat Events ===
        
        this.socket.on('voiceChatStarted', (data) => {
            this.emit('voiceChatStarted', data);
        });
        
        this.socket.on('voiceChatStopped', (data) => {
            this.emit('voiceChatStopped', data);
        });
        
        this.socket.on('voiceData', (data) => {
            this.emit('voiceData', data);
        });

        // === Screen Sharing Events ===
        
        this.socket.on('screenSharingStarted', (data) => {
            this.emit('screenSharingStarted', data);
        });
        
        this.socket.on('screenSharingStopped', (data) => {
            this.emit('screenSharingStopped', data);
        });
        
        this.socket.on('screenFrame', (data) => {
            this.emit('screenFrame', data);
        });

        // === AI Events ===
        
        this.socket.on('aiJoined', (data) => {
            console.log('🤖 AI Assistant joined the session');
            this.emit('aiJoined', data);
        });
        
        this.socket.on('aiResponse', (data) => {
            this.emit('aiResponse', data);
        });
        
        this.socket.on('aiError', (data) => {
            console.error('🤖 AI Error:', data.message);
            this.emit('aiError', data);
        });
        
        this.socket.on('aiSuggestion', (data) => {
            this.emit('aiSuggestion', data);
        });

        // === Error Events ===
        
        this.socket.on('error', (data) => {
            console.error('❌ Server error:', data.message);
            this.emit('error', data);
        });
        
        this.socket.on('serverShutdown', (data) => {
            console.warn('🛑 Server is shutting down:', data.message);
            this.emit('serverShutdown', data);
        });
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('🔌 Max reconnection attempts reached');
            this.emit('reconnectFailed');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔌 Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
        
        this.reconnectTimer = setTimeout(() => {
            if (!this.isConnected) {
                this.socket.connect();
            }
        }, this.options.reconnectInterval);
    }

    // === Session Management ===
    
    async createSession(sessionData) {
        try {
            const response = await fetch(`${this.serverUrl}/collaboration/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sessionData)
            });
            
            const result = await response.json();
            if (result.success) {
                return result.session;
            } else {
                throw new Error(result.error || 'Failed to create session');
            }
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }
    
    async joinSession(sessionId, user) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }
        
        this.currentUser = user;
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Join session timeout'));
            }, 10000);
            
            this.once('sessionJoined', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });
            
            this.once('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(error.message));
            });
            
            this.socket.emit('joinSession', { sessionId, user });
        });
    }
    
    leaveSession() {
        if (this.currentSession) {
            this.socket.emit('leaveSession', { sessionId: this.currentSession.id });
            this.currentSession = null;
            this.participants.clear();
            this.documents.clear();
            this.cursors.clear();
            this.selections.clear();
        }
    }
    
    async getSessions() {
        try {
            const response = await fetch(`${this.serverUrl}/collaboration/sessions`);
            const result = await response.json();
            return result.sessions;
        } catch (error) {
            console.error('Error getting sessions:', error);
            throw error;
        }
    }

    // === Document Management ===
    
    async createDocument(documentData) {
        if (!this.currentSession) {
            throw new Error('Not in a session');
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/collaboration/sessions/${this.currentSession.id}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(documentData)
            });
            
            const result = await response.json();
            if (result.success) {
                return result.document;
            } else {
                throw new Error(result.error || 'Failed to create document');
            }
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }
    
    sendDocumentOperation(documentId, operation) {
        if (!this.currentSession) {
            throw new Error('Not in a session');
        }
        
        this.socket.emit('documentOperation', {
            documentId,
            operation,
            sessionId: this.currentSession.id
        });
        
        this.metrics.messagesSent++;
    }
    
    sendCursorMove(documentId, cursor) {
        if (!this.currentSession) return;
        
        this.socket.emit('cursorMove', {
            documentId,
            cursor,
            sessionId: this.currentSession.id
        });
    }
    
    sendTextSelection(documentId, selection) {
        if (!this.currentSession) return;
        
        this.socket.emit('textSelection', {
            documentId,
            selection,
            sessionId: this.currentSession.id
        });
    }
    
    applyOperation(document, operation) {
        // ใช้ operation กับเอกสาร
        // นี่เป็นการจำลองแบบง่าย ในการใช้งานจริงต้องใช้ Operational Transform
        
        switch (operation.type) {
            case 'insert':
                document.content = 
                    document.content.slice(0, operation.position) +
                    operation.text +
                    document.content.slice(operation.position);
                break;
                
            case 'delete':
                document.content = 
                    document.content.slice(0, operation.position) +
                    document.content.slice(operation.position + operation.length);
                break;
                
            case 'replace':
                document.content = 
                    document.content.slice(0, operation.position) +
                    operation.text +
                    document.content.slice(operation.position + operation.length);
                break;
        }
        
        document.updatedAt = Date.now();
    }

    // === Chat ===
    
    sendChatMessage(message) {
        if (!this.currentSession) {
            throw new Error('Not in a session');
        }
        
        this.socket.emit('chatMessage', {
            sessionId: this.currentSession.id,
            message
        });
        
        this.metrics.messagesSent++;
    }

    // === Voice Chat ===
    
    startVoiceChat() {
        if (!this.currentSession || !this.options.enableVoiceChat) {
            throw new Error('Voice chat not available');
        }
        
        this.socket.emit('voiceChat', {
            sessionId: this.currentSession.id,
            action: 'start'
        });
    }
    
    stopVoiceChat() {
        if (!this.currentSession) return;
        
        this.socket.emit('voiceChat', {
            sessionId: this.currentSession.id,
            action: 'stop'
        });
    }
    
    sendVoiceData(audioData) {
        if (!this.currentSession) return;
        
        this.socket.emit('voiceChat', {
            sessionId: this.currentSession.id,
            action: 'audio',
            audioData
        });
    }

    // === Screen Sharing ===
    
    startScreenSharing() {
        if (!this.currentSession || !this.options.enableScreenSharing) {
            throw new Error('Screen sharing not available');
        }
        
        this.socket.emit('screenShare', {
            sessionId: this.currentSession.id,
            action: 'start'
        });
    }
    
    stopScreenSharing() {
        if (!this.currentSession) return;
        
        this.socket.emit('screenShare', {
            sessionId: this.currentSession.id,
            action: 'stop'
        });
    }
    
    sendScreenFrame(screenData) {
        if (!this.currentSession) return;
        
        this.socket.emit('screenShare', {
            sessionId: this.currentSession.id,
            action: 'frame',
            screenData
        });
    }

    // === AI Collaboration ===
    
    async requestAIAssistance(query, context = {}, documentId = null) {
        if (!this.currentSession || !this.options.enableAI) {
            throw new Error('AI assistance not available');
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/collaboration/sessions/${this.currentSession.id}/ai/assist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query, context, documentId })
            });
            
            const result = await response.json();
            if (result.success) {
                return result.response;
            } else {
                throw new Error(result.error || 'AI request failed');
            }
        } catch (error) {
            console.error('Error requesting AI assistance:', error);
            throw error;
        }
    }
    
    async requestAICodeReview(documentId, code) {
        if (!this.currentSession || !this.options.enableAI) {
            throw new Error('AI code review not available');
        }
        
        try {
            const response = await fetch(`${this.serverUrl}/collaboration/sessions/${this.currentSession.id}/ai/review`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ documentId, code })
            });
            
            const result = await response.json();
            if (result.success) {
                return result.review;
            } else {
                throw new Error(result.error || 'AI code review failed');
            }
        } catch (error) {
            console.error('Error requesting AI code review:', error);
            throw error;
        }
    }
    
    sendAIRequest(type, payload) {
        if (!this.currentSession || !this.options.enableAI) {
            throw new Error('AI not available');
        }
        
        const requestId = Date.now().toString();
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('AI request timeout'));
            }, 30000);
            
            const handleResponse = (data) => {
                if (data.requestId === requestId) {
                    clearTimeout(timeout);
                    this.off('aiResponse', handleResponse);
                    this.off('aiError', handleError);
                    resolve(data.response);
                }
            };
            
            const handleError = (data) => {
                if (data.requestId === requestId) {
                    clearTimeout(timeout);
                    this.off('aiResponse', handleResponse);
                    this.off('aiError', handleError);
                    reject(new Error(data.message));
                }
            };
            
            this.on('aiResponse', handleResponse);
            this.on('aiError', handleError);
            
            this.socket.emit('aiRequest', {
                sessionId: this.currentSession.id,
                type,
                payload,
                requestId
            });
        });
    }

    // === Event Management ===
    
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    once(event, handler) {
        const onceHandler = (...args) => {
            handler(...args);
            this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
        
        this.metrics.messagesReceived++;
    }

    // === Utility Methods ===
    
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            currentSession: this.currentSession?.id || null,
            participantCount: this.participants.size,
            documentCount: this.documents.size
        };
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.metrics.connectionTime ? Date.now() - this.metrics.connectionTime : 0
        };
    }
    
    getParticipants() {
        return Array.from(this.participants.values());
    }
    
    getDocuments() {
        return Array.from(this.documents.values());
    }
    
    getCursors() {
        return Array.from(this.cursors.entries()).map(([userId, cursor]) => ({
            userId,
            ...cursor
        }));
    }
    
    getSelections() {
        return Array.from(this.selections.entries()).map(([userId, selection]) => ({
            userId,
            ...selection
        }));
    }
    
    // === Cleanup ===
    
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        if (this.socket) {
            this.socket.disconnect();
        }
        
        this.isConnected = false;
        this.currentSession = null;
        this.currentUser = null;
        this.participants.clear();
        this.documents.clear();
        this.cursors.clear();
        this.selections.clear();
        this.eventHandlers.clear();
    }
}

// === Helper Functions ===

// สร้าง operation สำหรับการแก้ไขข้อความ
function createTextOperation(type, position, text = '', length = 0) {
    return {
        type, // 'insert', 'delete', 'replace'
        position,
        text,
        length,
        timestamp: Date.now(),
        userId: null // จะถูกกำหนดโดย server
    };
}

// สร้าง cursor object
function createCursor(line, column, documentId) {
    return {
        line,
        column,
        documentId,
        timestamp: Date.now()
    };
}

// สร้าง selection object
function createSelection(startLine, startColumn, endLine, endColumn, documentId) {
    return {
        start: { line: startLine, column: startColumn },
        end: { line: endLine, column: endColumn },
        documentId,
        timestamp: Date.now()
    };
}

// Export สำหรับใช้ใน Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CollaborationClient,
        createTextOperation,
        createCursor,
        createSelection
    };
}

// Export สำหรับใช้ใน Browser
if (typeof window !== 'undefined') {
    window.CollaborationClient = CollaborationClient;
    window.createTextOperation = createTextOperation;
    window.createCursor = createCursor;
    window.createSelection = createSelection;
}