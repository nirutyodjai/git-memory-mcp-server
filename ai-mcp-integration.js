/**
 * NEXUS IDE - AI-MCP Integration Core
 * Advanced AI Integration System with Multiple AI Models
 * Supports GPT-4, Claude, Llama, Gemini, and more
 */

const EventEmitter = require('events');
const axios = require('axios');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class AIModelManager {
    constructor() {
        this.models = new Map();
        this.activeConnections = new Map();
        this.modelCapabilities = new Map();
        this.loadBalancer = new LoadBalancer();
        this.contextManager = new ContextManager();
        this.initializeModels();
    }

    async initializeModels() {
        // Initialize GPT-4
        this.models.set('gpt-4', {
            type: 'openai',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            capabilities: ['code-generation', 'code-review', 'debugging', 'explanation', 'refactoring'],
            maxTokens: 128000,
            costPerToken: 0.00003,
            responseTime: 2000
        });

        // Initialize Claude
        this.models.set('claude-3-sonnet', {
            type: 'anthropic',
            endpoint: 'https://api.anthropic.com/v1/messages',
            capabilities: ['code-analysis', 'architecture-design', 'documentation', 'testing'],
            maxTokens: 200000,
            costPerToken: 0.000015,
            responseTime: 1500
        });

        // Initialize Llama (Local)
        this.models.set('llama-3-70b', {
            type: 'local',
            endpoint: 'http://localhost:11434/api/generate',
            capabilities: ['code-completion', 'quick-fixes', 'syntax-checking'],
            maxTokens: 32000,
            costPerToken: 0,
            responseTime: 800
        });

        // Initialize Gemini
        this.models.set('gemini-pro', {
            type: 'google',
            endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
            capabilities: ['multimodal-analysis', 'image-understanding', 'code-visualization'],
            maxTokens: 30720,
            costPerToken: 0.000125,
            responseTime: 1200
        });

        console.log('🤖 AI Models initialized:', Array.from(this.models.keys()));
    }

    async selectBestModel(task, context = {}) {
        const taskRequirements = this.analyzeTaskRequirements(task, context);
        const availableModels = Array.from(this.models.entries())
            .filter(([name, model]) => this.isModelCapable(model, taskRequirements))
            .sort((a, b) => this.scoreModel(b[1], taskRequirements) - this.scoreModel(a[1], taskRequirements));

        if (availableModels.length === 0) {
            throw new Error('No suitable AI model found for this task');
        }

        return availableModels[0][0]; // Return best model name
    }

    analyzeTaskRequirements(task, context) {
        const requirements = {
            complexity: 'medium',
            speed: 'normal',
            accuracy: 'high',
            cost: 'normal',
            capabilities: []
        };

        // Analyze task type
        if (task.includes('debug') || task.includes('fix')) {
            requirements.capabilities.push('debugging');
            requirements.accuracy = 'very-high';
        }
        if (task.includes('generate') || task.includes('create')) {
            requirements.capabilities.push('code-generation');
            requirements.complexity = 'high';
        }
        if (task.includes('explain') || task.includes('document')) {
            requirements.capabilities.push('explanation');
            requirements.speed = 'fast';
        }
        if (task.includes('review') || task.includes('analyze')) {
            requirements.capabilities.push('code-analysis');
            requirements.accuracy = 'very-high';
        }
        if (task.includes('refactor') || task.includes('optimize')) {
            requirements.capabilities.push('refactoring');
            requirements.complexity = 'high';
        }

        // Context analysis
        if (context.fileSize && context.fileSize > 10000) {
            requirements.complexity = 'high';
        }
        if (context.urgent) {
            requirements.speed = 'fast';
            requirements.cost = 'low';
        }
        if (context.critical) {
            requirements.accuracy = 'very-high';
        }

        return requirements;
    }

    isModelCapable(model, requirements) {
        return requirements.capabilities.some(cap => 
            model.capabilities && Array.isArray(model.capabilities) && model.capabilities.includes(cap)
        );
    }

    scoreModel(model, requirements) {
        let score = 0;

        // Capability matching
        const capabilityMatch = requirements.capabilities.filter(cap => 
            model.capabilities && Array.isArray(model.capabilities) && model.capabilities.includes(cap)
        ).length / requirements.capabilities.length;
        score += capabilityMatch * 40;

        // Speed scoring
        if (requirements.speed === 'fast' && model.responseTime < 1000) score += 20;
        if (requirements.speed === 'normal' && model.responseTime < 2000) score += 15;

        // Cost scoring
        if (requirements.cost === 'low' && model.costPerToken === 0) score += 25;
        if (requirements.cost === 'normal' && model.costPerToken < 0.00005) score += 15;

        // Token capacity scoring
        if (requirements.complexity === 'high' && model.maxTokens > 100000) score += 15;

        return score;
    }

    async generateResponse(modelName, prompt, context = {}) {
        const model = this.models.get(modelName);
        if (!model) {
            throw new Error(`Model ${modelName} not found`);
        }

        const enhancedPrompt = await this.contextManager.enhancePrompt(prompt, context);
        
        try {
            switch (model.type) {
                case 'openai':
                    return await this.callOpenAI(model, enhancedPrompt, context);
                case 'anthropic':
                    return await this.callAnthropic(model, enhancedPrompt, context);
                case 'local':
                    return await this.callLocal(model, enhancedPrompt, context);
                case 'google':
                    return await this.callGoogle(model, enhancedPrompt, context);
                default:
                    throw new Error(`Unsupported model type: ${model.type}`);
            }
        } catch (error) {
            console.error(`Error calling ${modelName}:`, error.message);
            // Fallback to alternative model
            return await this.fallbackGeneration(prompt, context, modelName);
        }
    }

    async callOpenAI(model, prompt, context) {
        const response = await axios.post(model.endpoint, {
            model: 'gpt-4',
            messages: [{
                role: 'system',
                content: 'You are an expert AI coding assistant integrated with NEXUS IDE. Provide precise, contextual, and actionable responses.'
            }, {
                role: 'user',
                content: prompt
            }],
            max_tokens: Math.min(4000, model.maxTokens),
            temperature: context.creativity || 0.3,
            stream: context.stream || false
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        return {
            content: response.data.choices[0].message.content,
            model: 'gpt-4',
            tokens: response.data.usage.total_tokens,
            cost: response.data.usage.total_tokens * model.costPerToken
        };
    }

    async callAnthropic(model, prompt, context) {
        const response = await axios.post(model.endpoint, {
            model: 'claude-3-sonnet-20240229',
            max_tokens: Math.min(4000, model.maxTokens),
            messages: [{
                role: 'user',
                content: prompt
            }],
            system: 'You are Claude, an AI assistant integrated with NEXUS IDE. Focus on code quality, best practices, and detailed explanations.'
        }, {
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            timeout: 30000
        });

        return {
            content: response.data.content[0].text,
            model: 'claude-3-sonnet',
            tokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
            cost: (response.data.usage.input_tokens + response.data.usage.output_tokens) * model.costPerToken
        };
    }

    async callLocal(model, prompt, context) {
        const response = await axios.post(model.endpoint, {
            model: 'llama3:70b',
            prompt: prompt,
            stream: false,
            options: {
                temperature: context.creativity || 0.3,
                top_p: 0.9,
                max_tokens: Math.min(2000, model.maxTokens)
            }
        }, {
            timeout: 45000
        });

        return {
            content: response.data.response,
            model: 'llama-3-70b',
            tokens: response.data.eval_count || 0,
            cost: 0 // Local model is free
        };
    }

    async callGoogle(model, prompt, context) {
        const response = await axios.post(`${model.endpoint}?key=${process.env.GOOGLE_API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: context.creativity || 0.3,
                maxOutputTokens: Math.min(2000, model.maxTokens)
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        return {
            content: response.data.candidates[0].content.parts[0].text,
            model: 'gemini-pro',
            tokens: response.data.usageMetadata?.totalTokenCount || 0,
            cost: (response.data.usageMetadata?.totalTokenCount || 0) * model.costPerToken
        };
    }

    async fallbackGeneration(prompt, context, failedModel) {
        console.log(`🔄 Falling back from ${failedModel}`);
        
        // Try local model first as fallback
        if (failedModel !== 'llama-3-70b' && this.models.has('llama-3-70b')) {
            try {
                return await this.generateResponse('llama-3-70b', prompt, context);
            } catch (error) {
                console.log('Local fallback failed, trying GPT-4');
            }
        }

        // Try GPT-4 as final fallback
        if (failedModel !== 'gpt-4' && this.models.has('gpt-4')) {
            return await this.generateResponse('gpt-4', prompt, context);
        }

        throw new Error('All AI models failed to respond');
    }
}

class ContextManager {
    constructor() {
        this.projectContext = new Map();
        this.userPreferences = new Map();
        this.codeHistory = [];
    }

    async enhancePrompt(prompt, context) {
        let enhancedPrompt = prompt;

        // Add project context
        if (context.projectPath) {
            const projectInfo = await this.getProjectContext(context.projectPath);
            enhancedPrompt = `Project Context: ${projectInfo}\n\n${enhancedPrompt}`;
        }

        // Add file context
        if (context.currentFile) {
            const fileInfo = await this.getFileContext(context.currentFile);
            enhancedPrompt = `Current File: ${fileInfo}\n\n${enhancedPrompt}`;
        }

        // Add user preferences
        if (context.userId) {
            const preferences = this.userPreferences.get(context.userId) || {};
            if (Object.keys(preferences).length > 0) {
                enhancedPrompt = `User Preferences: ${JSON.stringify(preferences)}\n\n${enhancedPrompt}`;
            }
        }

        return enhancedPrompt;
    }

    async getProjectContext(projectPath) {
        if (this.projectContext.has(projectPath)) {
            return this.projectContext.get(projectPath);
        }

        try {
            const packageJson = await fs.readFile(path.join(projectPath, 'package.json'), 'utf8');
            const pkg = JSON.parse(packageJson);
            const context = {
                name: pkg.name,
                version: pkg.version,
                dependencies: Object.keys(pkg.dependencies || {}),
                devDependencies: Object.keys(pkg.devDependencies || {}),
                scripts: Object.keys(pkg.scripts || {})
            };
            
            this.projectContext.set(projectPath, context);
            return JSON.stringify(context, null, 2);
        } catch (error) {
            return 'No package.json found or unable to read project context';
        }
    }

    async getFileContext(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');
            const fileInfo = {
                path: filePath,
                extension: path.extname(filePath),
                lines: lines.length,
                size: content.length,
                imports: this.extractImports(content),
                functions: this.extractFunctions(content)
            };
            
            return JSON.stringify(fileInfo, null, 2);
        } catch (error) {
            return `Unable to read file: ${filePath}`;
        }
    }

    extractImports(content) {
        const imports = [];
        const importRegex = /(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }

    extractFunctions(content) {
        const functions = [];
        const functionRegex = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>))/g;
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            functions.push(match[1] || match[2]);
        }
        return functions;
    }

    updateUserPreferences(userId, preferences) {
        this.userPreferences.set(userId, { ...this.userPreferences.get(userId), ...preferences });
    }

    addToCodeHistory(code, context) {
        this.codeHistory.push({
            timestamp: Date.now(),
            code,
            context,
            hash: this.hashCode(code)
        });
        
        // Keep only last 100 entries
        if (this.codeHistory.length > 100) {
            this.codeHistory.shift();
        }
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    }
}

class LoadBalancer {
    constructor() {
        this.modelLoad = new Map();
        this.requestQueue = [];
        this.maxConcurrentRequests = 10;
    }

    async distributeRequest(models, request) {
        // Find model with lowest load
        const availableModels = models.filter(model => 
            (this.modelLoad.get(model) || 0) < this.maxConcurrentRequests
        );

        if (availableModels.length === 0) {
            // Queue request if all models are busy
            return new Promise((resolve, reject) => {
                this.requestQueue.push({ request, resolve, reject });
            });
        }

        const selectedModel = availableModels.reduce((min, model) => 
            (this.modelLoad.get(model) || 0) < (this.modelLoad.get(min) || 0) ? model : min
        );

        this.incrementLoad(selectedModel);
        return selectedModel;
    }

    incrementLoad(model) {
        this.modelLoad.set(model, (this.modelLoad.get(model) || 0) + 1);
    }

    decrementLoad(model) {
        const currentLoad = this.modelLoad.get(model) || 0;
        this.modelLoad.set(model, Math.max(0, currentLoad - 1));
        
        // Process queued requests
        if (this.requestQueue.length > 0) {
            const { request, resolve } = this.requestQueue.shift();
            resolve(this.distributeRequest([model], request));
        }
    }
}

class AIMCPIntegration extends EventEmitter {
    constructor() {
        super();
        this.aiManager = new AIModelManager();
        this.mcpConnections = new Map();
        this.activeRequests = new Map();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            totalCost: 0
        };
    }

    async initialize() {
        console.log('🚀 Initializing AI-MCP Integration Core...');
        
        // Initialize MCP connections
        await this.initializeMCPConnections();
        
        // Start metrics collection
        this.startMetricsCollection();
        
        console.log('✅ AI-MCP Integration Core initialized successfully');
        this.emit('initialized');
    }

    async initializeMCPConnections() {
        // This will be expanded to connect to actual MCP servers
        console.log('🔗 Initializing MCP connections...');
        
        // Placeholder for MCP server connections
        const mcpServers = [
            { name: 'git-memory', port: 3001 },
            { name: 'file-system', port: 3002 },
            { name: 'database', port: 3003 },
            { name: 'api-gateway', port: 3004 }
        ];

        for (const server of mcpServers) {
            try {
                // Simulate MCP connection
                this.mcpConnections.set(server.name, {
                    status: 'connected',
                    port: server.port,
                    lastPing: Date.now()
                });
                console.log(`✅ Connected to MCP server: ${server.name}`);
            } catch (error) {
                console.error(`❌ Failed to connect to MCP server ${server.name}:`, error.message);
            }
        }
    }

    async processAIRequest(request) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        
        this.metrics.totalRequests++;
        this.activeRequests.set(requestId, { startTime, request });

        try {
            // Select best AI model for the task
            const bestModel = await this.aiManager.selectBestModel(request.task, request.context);
            console.log(`🤖 Selected AI model: ${bestModel} for task: ${request.task}`);

            // Generate AI response
            const aiResponse = await this.aiManager.generateResponse(bestModel, request.prompt, request.context);
            
            // Process response through MCP if needed
            const finalResponse = await this.processThroughMCP(aiResponse, request.mcpActions);
            
            // Update metrics
            const responseTime = Date.now() - startTime;
            this.updateMetrics(true, responseTime, aiResponse.cost);
            
            this.activeRequests.delete(requestId);
            
            return {
                id: requestId,
                success: true,
                response: finalResponse,
                model: aiResponse.model,
                tokens: aiResponse.tokens,
                cost: aiResponse.cost,
                responseTime
            };
        } catch (error) {
            console.error(`❌ AI request failed:`, error.message);
            this.updateMetrics(false, Date.now() - startTime, 0);
            this.activeRequests.delete(requestId);
            
            return {
                id: requestId,
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }

    async processThroughMCP(aiResponse, mcpActions = []) {
        if (!mcpActions || mcpActions.length === 0) {
            return aiResponse;
        }

        let processedResponse = aiResponse;
        
        for (const action of mcpActions) {
            try {
                switch (action.type) {
                    case 'save-file':
                        await this.executeMCPAction('file-system', 'saveFile', {
                            path: action.path,
                            content: processedResponse.content
                        });
                        break;
                    case 'git-commit':
                        await this.executeMCPAction('git-memory', 'commit', {
                            message: action.message || 'AI-generated changes'
                        });
                        break;
                    case 'run-tests':
                        const testResults = await this.executeMCPAction('testing', 'runTests', action.params);
                        processedResponse.testResults = testResults;
                        break;
                    default:
                        console.warn(`Unknown MCP action: ${action.type}`);
                }
            } catch (error) {
                console.error(`MCP action failed: ${action.type}`, error.message);
            }
        }

        return processedResponse;
    }

    async executeMCPAction(serverName, action, params) {
        const connection = this.mcpConnections.get(serverName);
        if (!connection || connection.status !== 'connected') {
            throw new Error(`MCP server ${serverName} not available`);
        }

        // Simulate MCP action execution
        console.log(`🔧 Executing MCP action: ${serverName}.${action}`, params);
        
        // This would be replaced with actual MCP protocol communication
        return { success: true, result: 'Action completed' };
    }

    updateMetrics(success, responseTime, cost) {
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        this.metrics.averageResponseTime = (
            (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
            this.metrics.totalRequests
        );
        
        this.metrics.totalCost += cost;
    }

    startMetricsCollection() {
        setInterval(() => {
            this.emit('metrics', {
                ...this.metrics,
                activeRequests: this.activeRequests.size,
                mcpConnections: Array.from(this.mcpConnections.entries()).map(([name, conn]) => ({
                    name,
                    status: conn.status,
                    lastPing: conn.lastPing
                }))
            });
        }, 5000); // Emit metrics every 5 seconds
    }

    generateRequestId() {
        return `ai-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getMetrics() {
        return {
            ...this.metrics,
            activeRequests: this.activeRequests.size,
            successRate: this.metrics.totalRequests > 0 ? 
                (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%' : '0%'
        };
    }

    async shutdown() {
        console.log('🛑 Shutting down AI-MCP Integration Core...');
        
        // Close MCP connections
        for (const [name, connection] of this.mcpConnections) {
            console.log(`Closing connection to ${name}`);
            // Close actual connections here
        }
        
        this.mcpConnections.clear();
        this.activeRequests.clear();
        
        console.log('✅ AI-MCP Integration Core shutdown complete');
    }
}

module.exports = {
    AIMCPIntegration,
    AIModelManager,
    ContextManager,
    LoadBalancer
};

// Example usage
if (require.main === module) {
    const integration = new AIMCPIntegration();
    
    integration.on('initialized', () => {
        console.log('🎉 AI-MCP Integration ready!');
    });
    
    integration.on('metrics', (metrics) => {
        console.log('📊 Metrics:', metrics);
    });
    
    integration.initialize().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await integration.shutdown();
        process.exit(0);
    });
}