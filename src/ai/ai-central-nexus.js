/**
 * NEXUS IDE - AI Central System with MCP Integration
 * ระบบ AI กลางที่เชื่อมต่อกับ MCP servers และรองรับ collaboration
 * Created: 2025-01-13
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class AICentralNexus extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            port: config.port || 4300,
            host: config.host || 'localhost',
            maxConnections: config.maxConnections || 2000,
            ...config
        };
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        // AI Models และ MCP Servers
        this.aiModels = new Map();
        this.mcpServers = new Map();
        this.activeConnections = new Map();
        this.collaborationSessions = new Map();
        this.aiAssistants = new Map();
        
        // Performance และ Analytics
        this.metrics = {
            totalRequests: 0,
            activeUsers: 0,
            averageResponseTime: 0,
            successRate: 0,
            mcpConnections: 0
        };
        
        this.initializeSystem();
    }
    
    async initializeSystem() {
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        await this.initializeAIModels();
        await this.initializeMCPServers();
        this.startServer();
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '100mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '100mb' }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            this.metrics.totalRequests++;
            next();
        });
    }
    
    setupRoutes() {
        // Health Check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: Date.now(),
                metrics: this.metrics,
                aiModels: Array.from(this.aiModels.keys()),
                mcpServers: Array.from(this.mcpServers.keys()),
                activeSessions: this.collaborationSessions.size
            });
        });
        
        // === AI Models Management ===
        
        // รับรายการ AI Models
        this.app.get('/ai/models', (req, res) => {
            const models = Array.from(this.aiModels.entries()).map(([id, model]) => ({
                id,
                name: model.name,
                provider: model.provider,
                capabilities: model.capabilities,
                status: model.status,
                usage: model.usage || 0
            }));
            
            res.json({ models });
        });
        
        // Chat with AI Model
        this.app.post('/ai/chat', async (req, res) => {
            try {
                const { modelId, messages, sessionId, context } = req.body;
                
                if (!this.aiModels.has(modelId)) {
                    return res.status(404).json({ error: 'AI model not found' });
                }
                
                const model = this.aiModels.get(modelId);
                const response = await this.processAIRequest(model, {
                    messages,
                    sessionId,
                    context,
                    type: 'chat'
                });
                
                res.json({ response });
            } catch (error) {
                console.error('AI Chat Error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Code Generation
        this.app.post('/ai/code/generate', async (req, res) => {
            try {
                const { prompt, language, context, modelId } = req.body;
                
                const bestModel = modelId ? this.aiModels.get(modelId) : this.selectBestModelForTask('code-generation');
                
                if (!bestModel) {
                    return res.status(404).json({ error: 'No suitable AI model found' });
                }
                
                const response = await this.processAIRequest(bestModel, {
                    prompt,
                    language,
                    context,
                    type: 'code-generation'
                });
                
                res.json({ code: response, model: bestModel.name });
            } catch (error) {
                console.error('Code Generation Error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Code Analysis
        this.app.post('/ai/code/analyze', async (req, res) => {
            try {
                const { code, language, analysisType, modelId } = req.body;
                
                const bestModel = modelId ? this.aiModels.get(modelId) : this.selectBestModelForTask('code-analysis');
                
                const response = await this.processAIRequest(bestModel, {
                    code,
                    language,
                    analysisType,
                    type: 'code-analysis'
                });
                
                res.json({ analysis: response, model: bestModel.name });
            } catch (error) {
                console.error('Code Analysis Error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // === MCP Servers Management ===
        
        // รับรายการ MCP Servers
        this.app.get('/mcp/servers', (req, res) => {
            const servers = Array.from(this.mcpServers.entries()).map(([id, server]) => ({
                id,
                name: server.name,
                description: server.description,
                tools: server.tools?.map(tool => ({
                    name: tool.name,
                    description: tool.description
                })) || [],
                status: server.status,
                lastPing: server.lastPing
            }));
            
            res.json({ servers });
        });
        
        // Execute MCP Tool
        this.app.post('/mcp/execute', async (req, res) => {
            try {
                const { serverId, toolName, args } = req.body;
                
                if (!this.mcpServers.has(serverId)) {
                    return res.status(404).json({ error: 'MCP server not found' });
                }
                
                const result = await this.executeMCPTool(serverId, toolName, args);
                res.json({ result });
            } catch (error) {
                console.error('MCP Execution Error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // === Collaboration Features ===
        
        // สร้าง Collaboration Session
        this.app.post('/collaboration/sessions', async (req, res) => {
            try {
                const { name, type, participants, aiEnabled } = req.body;
                
                const session = {
                    id: uuidv4(),
                    name: name || 'Untitled Session',
                    type: type || 'general',
                    participants: participants || [],
                    aiEnabled: aiEnabled !== false,
                    createdAt: Date.now(),
                    status: 'active',
                    documents: [],
                    chatHistory: [],
                    aiAssistant: null
                };
                
                if (session.aiEnabled) {
                    session.aiAssistant = await this.createAIAssistant(session.id);
                }
                
                this.collaborationSessions.set(session.id, session);
                
                res.json({ success: true, session });
            } catch (error) {
                console.error('Session Creation Error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // รับรายการ Sessions
        this.app.get('/collaboration/sessions', (req, res) => {
            const sessions = Array.from(this.collaborationSessions.values())
                .map(session => ({
                    id: session.id,
                    name: session.name,
                    type: session.type,
                    participantCount: session.participants.length,
                    aiEnabled: session.aiEnabled,
                    createdAt: session.createdAt,
                    status: session.status
                }));
            
            res.json({ sessions });
        });
    }
    
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            this.metrics.activeUsers++;
            
            // Join Collaboration Session
            socket.on('join-session', async (data) => {
                const { sessionId, userId, userName } = data;
                
                if (this.collaborationSessions.has(sessionId)) {
                    socket.join(sessionId);
                    
                    const session = this.collaborationSessions.get(sessionId);
                    session.participants.push({ userId, userName, socketId: socket.id });
                    
                    // Notify other participants
                    socket.to(sessionId).emit('user-joined', { userId, userName });
                    
                    // Send session data to new participant
                    socket.emit('session-data', {
                        session: {
                            id: session.id,
                            name: session.name,
                            participants: session.participants,
                            documents: session.documents,
                            chatHistory: session.chatHistory.slice(-50) // Last 50 messages
                        }
                    });
                }
            });
            
            // Real-time Code Collaboration
            socket.on('code-change', (data) => {
                const { sessionId, documentId, changes, userId } = data;
                
                // Broadcast changes to other participants
                socket.to(sessionId).emit('code-change', {
                    documentId,
                    changes,
                    userId,
                    timestamp: Date.now()
                });
                
                // Update document in session
                if (this.collaborationSessions.has(sessionId)) {
                    const session = this.collaborationSessions.get(sessionId);
                    const document = session.documents.find(doc => doc.id === documentId);
                    if (document) {
                        document.lastModified = Date.now();
                        document.lastModifiedBy = userId;
                    }
                }
            });
            
            // Chat Messages
            socket.on('chat-message', async (data) => {
                const { sessionId, message, userId, userName } = data;
                
                const chatMessage = {
                    id: uuidv4(),
                    userId,
                    userName,
                    message,
                    timestamp: Date.now(),
                    type: 'user'
                };
                
                // Save to session
                if (this.collaborationSessions.has(sessionId)) {
                    const session = this.collaborationSessions.get(sessionId);
                    session.chatHistory.push(chatMessage);
                    
                    // Broadcast to all participants
                    this.io.to(sessionId).emit('chat-message', chatMessage);
                    
                    // AI Assistant Response
                    if (session.aiEnabled && session.aiAssistant) {
                        const aiResponse = await this.getAIAssistantResponse(session.id, message);
                        if (aiResponse) {
                            const aiMessage = {
                                id: uuidv4(),
                                userId: 'ai-assistant',
                                userName: 'AI Assistant',
                                message: aiResponse,
                                timestamp: Date.now(),
                                type: 'ai'
                            };
                            
                            session.chatHistory.push(aiMessage);
                            this.io.to(sessionId).emit('chat-message', aiMessage);
                        }
                    }
                }
            });
            
            // AI Code Assistance
            socket.on('ai-code-assist', async (data) => {
                try {
                    const { sessionId, code, prompt, language } = data;
                    
                    const bestModel = this.selectBestModelForTask('code-assistance');
                    const response = await this.processAIRequest(bestModel, {
                        code,
                        prompt,
                        language,
                        type: 'code-assistance'
                    });
                    
                    socket.emit('ai-code-response', {
                        response,
                        model: bestModel.name,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    socket.emit('ai-error', { error: error.message });
                }
            });
            
            // MCP Tool Execution
            socket.on('mcp-execute', async (data) => {
                try {
                    const { serverId, toolName, args } = data;
                    const result = await this.executeMCPTool(serverId, toolName, args);
                    
                    socket.emit('mcp-result', {
                        serverId,
                        toolName,
                        result,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    socket.emit('mcp-error', { error: error.message });
                }
            });
            
            // Disconnect
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
                this.metrics.activeUsers--;
                
                // Remove from all sessions
                for (const [sessionId, session] of this.collaborationSessions) {
                    const participantIndex = session.participants.findIndex(p => p.socketId === socket.id);
                    if (participantIndex !== -1) {
                        const participant = session.participants[participantIndex];
                        session.participants.splice(participantIndex, 1);
                        
                        // Notify other participants
                        socket.to(sessionId).emit('user-left', {
                            userId: participant.userId,
                            userName: participant.userName
                        });
                    }
                }
            });
        });
    }
    
    async initializeAIModels() {
        console.log('🤖 Initializing AI Models...');
        
        // OpenAI GPT Models
        if (process.env.OPENAI_API_KEY) {
            this.aiModels.set('gpt-4', {
                id: 'gpt-4',
                name: 'GPT-4',
                provider: 'openai',
                capabilities: ['chat', 'code-generation', 'code-analysis', 'reasoning'],
                status: 'active',
                apiKey: process.env.OPENAI_API_KEY,
                endpoint: 'https://api.openai.com/v1/chat/completions'
            });
            
            this.aiModels.set('gpt-3.5-turbo', {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                capabilities: ['chat', 'code-generation', 'code-analysis'],
                status: 'active',
                apiKey: process.env.OPENAI_API_KEY,
                endpoint: 'https://api.openai.com/v1/chat/completions'
            });
        }
        
        // Claude Models
        if (process.env.ANTHROPIC_API_KEY) {
            this.aiModels.set('claude-3-opus', {
                id: 'claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'anthropic',
                capabilities: ['chat', 'code-generation', 'code-analysis', 'reasoning'],
                status: 'active',
                apiKey: process.env.ANTHROPIC_API_KEY,
                endpoint: 'https://api.anthropic.com/v1/messages'
            });
        }
        
        // Local Models
        this.aiModels.set('local-llama', {
            id: 'local-llama',
            name: 'Local Llama',
            provider: 'local',
            capabilities: ['chat', 'code-generation'],
            status: 'active',
            endpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434'
        });
        
        console.log(`✅ Initialized ${this.aiModels.size} AI models`);
    }
    
    async initializeMCPServers() {
        console.log('🔌 Initializing MCP Servers...');
        
        // MCP Servers Configuration
        const mcpConfigs = [
            {
                id: 'pandoc',
                name: 'Pandoc Converter',
                description: 'Document conversion service',
                endpoint: 'mcp.config.usrlocalmcp.Pandoc'
            },
            {
                id: 'duckduckgo',
                name: 'DuckDuckGo Search',
                description: 'Web search service',
                endpoint: 'mcp.config.usrlocalmcp.DuckDuckGo Search Server'
            },
            {
                id: 'docker',
                name: 'Docker Management',
                description: 'Container management service',
                endpoint: 'mcp.config.usrlocalmcp.Docker'
            },
            {
                id: 'blender',
                name: 'Blender Integration',
                description: '3D modeling and animation service',
                endpoint: 'mcp.config.usrlocalmcp.Blender'
            },
            {
                id: 'ableton',
                name: 'Ableton Live Integration',
                description: 'Music production service',
                endpoint: 'mcp.config.usrlocalmcp.Ableton Live Integration'
            }
        ];
        
        for (const config of mcpConfigs) {
            try {
                const server = {
                    ...config,
                    status: 'active',
                    lastPing: Date.now(),
                    tools: await this.getMCPServerTools(config.endpoint)
                };
                
                this.mcpServers.set(config.id, server);
                this.metrics.mcpConnections++;
                
                console.log(`✅ Connected to MCP server: ${config.name}`);
            } catch (error) {
                console.error(`❌ Failed to connect to MCP server ${config.name}:`, error.message);
            }
        }
        
        console.log(`✅ Initialized ${this.mcpServers.size} MCP servers`);
    }
    
    async getMCPServerTools(endpoint) {
        // Mock implementation - ในการใช้งานจริงจะเชื่อมต่อกับ MCP server จริง
        const toolsMap = {
            'mcp.config.usrlocalmcp.Pandoc': [
                { name: 'convert-contents', description: 'Convert content between formats' }
            ],
            'mcp.config.usrlocalmcp.DuckDuckGo Search Server': [
                { name: 'search', description: 'Search the web' },
                { name: 'fetch_content', description: 'Fetch webpage content' }
            ],
            'mcp.config.usrlocalmcp.Docker': [
                { name: 'create-container', description: 'Create Docker container' },
                { name: 'list-containers', description: 'List Docker containers' }
            ],
            'mcp.config.usrlocalmcp.Blender': [
                { name: 'get_scene_info', description: 'Get Blender scene information' },
                { name: 'execute_blender_code', description: 'Execute Blender Python code' }
            ],
            'mcp.config.usrlocalmcp.Ableton Live Integration': [
                { name: 'get_session_info', description: 'Get Ableton session info' },
                { name: 'create_midi_track', description: 'Create MIDI track' }
            ]
        };
        
        return toolsMap[endpoint] || [];
    }
    
    async processAIRequest(model, request) {
        const startTime = Date.now();
        
        try {
            let response;
            
            switch (model.provider) {
                case 'openai':
                    response = await this.processOpenAIRequest(model, request);
                    break;
                case 'anthropic':
                    response = await this.processAnthropicRequest(model, request);
                    break;
                case 'local':
                    response = await this.processLocalAIRequest(model, request);
                    break;
                default:
                    throw new Error(`Unsupported AI provider: ${model.provider}`);
            }
            
            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateModelMetrics(model.id, responseTime, true);
            
            return response;
        } catch (error) {
            this.updateModelMetrics(model.id, Date.now() - startTime, false);
            throw error;
        }
    }
    
    async processOpenAIRequest(model, request) {
        const { messages, prompt, code, language, type } = request;
        
        let systemPrompt = '';
        let userPrompt = '';
        
        switch (type) {
            case 'chat':
                return await this.callOpenAI(model, messages);
            case 'code-generation':
                systemPrompt = `You are an expert ${language || 'programming'} developer. Generate clean, efficient, and well-documented code.`;
                userPrompt = prompt;
                break;
            case 'code-analysis':
                systemPrompt = `You are a code analysis expert. Analyze the provided code for bugs, performance issues, and improvements.`;
                userPrompt = `Analyze this ${language || 'code'}:\n\n${code}`;
                break;
            case 'code-assistance':
                systemPrompt = `You are an AI coding assistant. Help with code completion, debugging, and optimization.`;
                userPrompt = `${prompt}\n\nCode context:\n${code}`;
                break;
        }
        
        const messages_formatted = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];
        
        return await this.callOpenAI(model, messages_formatted);
    }
    
    async callOpenAI(model, messages) {
        const response = await axios.post(model.endpoint, {
            model: model.id,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${model.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.data.choices[0].message.content;
    }
    
    async processAnthropicRequest(model, request) {
        // Implementation for Anthropic Claude
        // Similar structure to OpenAI but with Claude's API format
        return "Claude response (implementation needed)";
    }
    
    async processLocalAIRequest(model, request) {
        // Implementation for local AI models
        return "Local AI response (implementation needed)";
    }
    
    selectBestModelForTask(taskType) {
        const taskPreferences = {
            'code-generation': ['gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'],
            'code-analysis': ['gpt-4', 'claude-3-opus'],
            'code-assistance': ['gpt-4', 'gpt-3.5-turbo'],
            'chat': ['gpt-4', 'claude-3-opus', 'gpt-3.5-turbo'],
            'reasoning': ['gpt-4', 'claude-3-opus']
        };
        
        const preferences = taskPreferences[taskType] || ['gpt-4'];
        
        for (const modelId of preferences) {
            if (this.aiModels.has(modelId) && this.aiModels.get(modelId).status === 'active') {
                return this.aiModels.get(modelId);
            }
        }
        
        // Fallback to first available model
        for (const [id, model] of this.aiModels) {
            if (model.status === 'active') {
                return model;
            }
        }
        
        return null;
    }
    
    async executeMCPTool(serverId, toolName, args) {
        if (!this.mcpServers.has(serverId)) {
            throw new Error(`MCP server ${serverId} not found`);
        }
        
        const server = this.mcpServers.get(serverId);
        
        // Mock implementation - ในการใช้งานจริงจะเรียก MCP server จริง
        console.log(`Executing MCP tool: ${server.name} -> ${toolName}`, args);
        
        // Simulate tool execution
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
            success: true,
            result: `Mock result from ${toolName}`,
            timestamp: Date.now()
        };
    }
    
    async createAIAssistant(sessionId) {
        const assistant = {
            id: uuidv4(),
            sessionId,
            model: this.selectBestModelForTask('chat'),
            personality: 'helpful-coding-assistant',
            context: [],
            createdAt: Date.now()
        };
        
        this.aiAssistants.set(assistant.id, assistant);
        return assistant;
    }
    
    async getAIAssistantResponse(sessionId, message) {
        const session = this.collaborationSessions.get(sessionId);
        if (!session || !session.aiAssistant) return null;
        
        const assistant = this.aiAssistants.get(session.aiAssistant.id);
        if (!assistant) return null;
        
        try {
            const contextMessages = [
                {
                    role: 'system',
                    content: 'You are a helpful AI coding assistant in a collaborative development environment. Provide concise, helpful responses to questions about code, development, and collaboration.'
                },
                {
                    role: 'user',
                    content: message
                }
            ];
            
            const response = await this.processAIRequest(assistant.model, {
                messages: contextMessages,
                type: 'chat'
            });
            
            return response;
        } catch (error) {
            console.error('AI Assistant Error:', error);
            return null;
        }
    }
    
    updateModelMetrics(modelId, responseTime, success) {
        const model = this.aiModels.get(modelId);
        if (!model) return;
        
        if (!model.metrics) {
            model.metrics = {
                totalRequests: 0,
                successfulRequests: 0,
                averageResponseTime: 0,
                totalResponseTime: 0
            };
        }
        
        model.metrics.totalRequests++;
        model.metrics.totalResponseTime += responseTime;
        model.metrics.averageResponseTime = model.metrics.totalResponseTime / model.metrics.totalRequests;
        
        if (success) {
            model.metrics.successfulRequests++;
        }
        
        model.usage = model.metrics.totalRequests;
    }
    
    startServer() {
        this.server.listen(this.config.port, this.config.host, () => {
            console.log(`🚀 NEXUS AI Central Server running on http://${this.config.host}:${this.config.port}`);
            console.log(`📊 Dashboard: http://${this.config.host}:${this.config.port}/health`);
            console.log(`🤖 AI Models: ${this.aiModels.size}`);
            console.log(`🔌 MCP Servers: ${this.mcpServers.size}`);
        });
    }
    
    async shutdown() {
        console.log('🛑 Shutting down NEXUS AI Central Server...');
        
        // Close all connections
        this.io.close();
        this.server.close();
        
        // Clear intervals
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        
        console.log('✅ Server shutdown complete');
    }
}

// Export และ Auto-start
module.exports = AICentralNexus;

if (require.main === module) {
    const server = new AICentralNexus({
        port: process.env.AI_CENTRAL_PORT || 4300,
        host: process.env.AI_CENTRAL_HOST || 'localhost'
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await server.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await server.shutdown();
        process.exit(0);
    });
}