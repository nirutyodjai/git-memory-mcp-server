/**
 * NEXUS IDE - AI Central API Server
 * ระบบ AI กลางที่รองรับ AI models หลายตัวและมีฟีเจอร์ครบครัน
 * 
 * Features:
 * - Multi AI Model Support (OpenAI, Claude, Llama, Gemini, Local Models)
 * - Code Completion & Generation
 * - Conversational AI with Project Context
 * - AI Debugging Assistant
 * - Performance Optimization
 * - Real-time Collaboration AI
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

// AI Model Integrations
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AICentralAPI extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            port: config.port || 4200,
            host: config.host || 'localhost',
            maxConnections: config.maxConnections || 1000,
            rateLimitWindow: config.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
            rateLimitMax: config.rateLimitMax || 1000,
            ...config
        };
        
        this.app = express();
        this.server = null;
        this.wsServer = null;
        this.clients = new Map();
        this.aiModels = new Map();
        this.projectContexts = new Map();
        this.conversationHistory = new Map();
        
        this.initializeAIModels();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    /**
     * Initialize AI Models
     */
    async initializeAIModels() {
        try {
            // OpenAI GPT Models
            if (process.env.OPENAI_API_KEY) {
                this.aiModels.set('openai', new OpenAI({
                    apiKey: process.env.OPENAI_API_KEY
                }));
                console.log('✅ OpenAI GPT models initialized');
            }
            
            // Anthropic Claude Models
            if (process.env.ANTHROPIC_API_KEY) {
                this.aiModels.set('anthropic', new Anthropic({
                    apiKey: process.env.ANTHROPIC_API_KEY
                }));
                console.log('✅ Anthropic Claude models initialized');
            }
            
            // Google Gemini Models
            if (process.env.GOOGLE_AI_API_KEY) {
                this.aiModels.set('google', new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY));
                console.log('✅ Google Gemini models initialized');
            }
            
            // Local Models (Ollama, etc.)
            this.aiModels.set('local', {
                endpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434',
                models: ['llama2', 'codellama', 'mistral']
            });
            console.log('✅ Local AI models configured');
            
        } catch (error) {
            console.error('❌ Error initializing AI models:', error);
        }
    }
    
    /**
     * Setup Express Middleware
     */
    setupMiddleware() {
        // Security
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));
        
        // Rate Limiting
        const limiter = rateLimit({
            windowMs: this.config.rateLimitWindow,
            max: this.config.rateLimitMax,
            message: { error: 'Too many requests, please try again later.' }
        });
        this.app.use('/api/', limiter);
        
        // Body Parsing
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Request Logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    
    /**
     * Setup API Routes
     */
    setupRoutes() {
        // Health Check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'AI Central API',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                models: Array.from(this.aiModels.keys()),
                activeConnections: this.clients.size
            });
        });
        
        // AI Chat Completion
        this.app.post('/api/chat/completion', async (req, res) => {
            try {
                const { model, messages, options = {} } = req.body;
                const result = await this.generateChatCompletion(model, messages, options);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Code Completion
        this.app.post('/api/code/completion', async (req, res) => {
            try {
                const { code, language, context, cursor } = req.body;
                const result = await this.generateCodeCompletion(code, language, context, cursor);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Code Generation
        this.app.post('/api/code/generate', async (req, res) => {
            try {
                const { prompt, language, framework, style } = req.body;
                const result = await this.generateCode(prompt, language, framework, style);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Code Explanation
        this.app.post('/api/code/explain', async (req, res) => {
            try {
                const { code, language, level } = req.body;
                const result = await this.explainCode(code, language, level);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Code Review
        this.app.post('/api/code/review', async (req, res) => {
            try {
                const { code, language, guidelines } = req.body;
                const result = await this.reviewCode(code, language, guidelines);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Bug Detection
        this.app.post('/api/debug/detect', async (req, res) => {
            try {
                const { code, language, error, context } = req.body;
                const result = await this.detectBugs(code, language, error, context);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Performance Optimization
        this.app.post('/api/optimize/performance', async (req, res) => {
            try {
                const { code, language, metrics, target } = req.body;
                const result = await this.optimizePerformance(code, language, metrics, target);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Project Context Management
        this.app.post('/api/context/update', async (req, res) => {
            try {
                const { projectId, context } = req.body;
                await this.updateProjectContext(projectId, context);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get Available Models
        this.app.get('/api/models', (req, res) => {
            const models = {
                openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
                anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
                google: ['gemini-pro', 'gemini-pro-vision'],
                local: this.aiModels.get('local')?.models || []
            };
            res.json(models);
        });
    }
    
    /**
     * Setup WebSocket for Real-time Communication
     */
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ noServer: true });
        
        this.wsServer.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            this.clients.set(clientId, {
                ws,
                id: clientId,
                projectId: req.url.split('?projectId=')[1] || 'default',
                connectedAt: new Date()
            });
            
            console.log(`🔗 Client ${clientId} connected`);
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(clientId, message);
                } catch (error) {
                    ws.send(JSON.stringify({ error: error.message }));
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(clientId);
                console.log(`🔌 Client ${clientId} disconnected`);
            });
        });
    }
    
    /**
     * Generate Chat Completion
     */
    async generateChatCompletion(modelProvider, messages, options = {}) {
        const provider = this.aiModels.get(modelProvider);
        if (!provider) {
            throw new Error(`AI model provider '${modelProvider}' not available`);
        }
        
        switch (modelProvider) {
            case 'openai':
                return await this.openaiChatCompletion(provider, messages, options);
            case 'anthropic':
                return await this.anthropicChatCompletion(provider, messages, options);
            case 'google':
                return await this.googleChatCompletion(provider, messages, options);
            case 'local':
                return await this.localChatCompletion(provider, messages, options);
            default:
                throw new Error(`Unsupported model provider: ${modelProvider}`);
        }
    }
    
    /**
     * OpenAI Chat Completion
     */
    async openaiChatCompletion(client, messages, options) {
        const response = await client.chat.completions.create({
            model: options.model || 'gpt-4',
            messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
            stream: options.stream || false
        });
        
        return {
            provider: 'openai',
            model: response.model,
            content: response.choices[0].message.content,
            usage: response.usage,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Anthropic Chat Completion
     */
    async anthropicChatCompletion(client, messages, options) {
        const response = await client.messages.create({
            model: options.model || 'claude-3-sonnet-20240229',
            messages,
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7
        });
        
        return {
            provider: 'anthropic',
            model: response.model,
            content: response.content[0].text,
            usage: response.usage,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Start the AI Central API Server
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.config.port, this.config.host, () => {
                console.log(`🚀 AI Central API Server started on ${this.config.host}:${this.config.port}`);
                console.log(`📊 Health check: http://${this.config.host}:${this.config.port}/health`);
                console.log(`🤖 Available AI models: ${Array.from(this.aiModels.keys()).join(', ')}`);
                resolve();
            });
            
            this.server.on('upgrade', (request, socket, head) => {
                this.wsServer.handleUpgrade(request, socket, head, (ws) => {
                    this.wsServer.emit('connection', ws, request);
                });
            });
            
            this.server.on('error', reject);
        });
    }
    
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export for use as module
module.exports = AICentralAPI;

// Start server if run directly
if (require.main === module) {
    const server = new AICentralAPI({
        port: process.env.AI_CENTRAL_PORT || 4200
    });
    
    server.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🛑 Shutting down AI Central API Server...');
        server.server?.close();
        process.exit(0);
    });
}