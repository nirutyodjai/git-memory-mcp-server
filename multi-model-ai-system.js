/**
 * NEXUS IDE - Multi-Model AI System
 * Advanced AI orchestration system that manages multiple AI models
 * and intelligently routes requests to the most suitable model
 */

const EventEmitter = require('events');
const { AIMCPIntegration } = require('./ai-mcp-integration');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class MultiModelAISystem extends EventEmitter {
    constructor() {
        super();
        this.models = new Map();
        this.modelPerformance = new Map();
        this.taskHistory = [];
        this.learningEngine = new ModelLearningEngine();
        this.routingEngine = new IntelligentRoutingEngine();
        this.ensembleEngine = new EnsembleEngine();
        this.aiIntegration = new AIMCPIntegration();
        this.initializeSystem();
    }

    async initializeSystem() {
        console.log('🧠 Initializing Multi-Model AI System...');
        
        await this.loadModelConfigurations();
        await this.initializePerformanceTracking();
        await this.aiIntegration.initialize();
        
        console.log('✅ Multi-Model AI System initialized');
        this.emit('system-ready');
    }

    async loadModelConfigurations() {
        const modelConfigs = {
            'gpt-4-turbo': {
                provider: 'openai',
                strengths: ['complex-reasoning', 'code-generation', 'architecture-design'],
                weaknesses: ['cost', 'speed'],
                optimalTasks: ['system-design', 'complex-debugging', 'code-review'],
                costPerToken: 0.00003,
                avgResponseTime: 2500,
                maxTokens: 128000,
                reliability: 0.98
            },
            'claude-3-opus': {
                provider: 'anthropic',
                strengths: ['code-analysis', 'documentation', 'refactoring'],
                weaknesses: ['speed', 'availability'],
                optimalTasks: ['code-analysis', 'documentation-generation', 'test-writing'],
                costPerToken: 0.000015,
                avgResponseTime: 1800,
                maxTokens: 200000,
                reliability: 0.96
            },
            'llama-3-70b': {
                provider: 'local',
                strengths: ['speed', 'privacy', 'cost'],
                weaknesses: ['reasoning', 'knowledge-cutoff'],
                optimalTasks: ['code-completion', 'syntax-checking', 'quick-fixes'],
                costPerToken: 0,
                avgResponseTime: 800,
                maxTokens: 32000,
                reliability: 0.92
            },
            'gemini-pro': {
                provider: 'google',
                strengths: ['multimodal', 'speed', 'cost'],
                weaknesses: ['code-quality', 'consistency'],
                optimalTasks: ['image-analysis', 'quick-questions', 'brainstorming'],
                costPerToken: 0.000125,
                avgResponseTime: 1200,
                maxTokens: 30720,
                reliability: 0.94
            },
            'codellama-34b': {
                provider: 'local',
                strengths: ['code-specific', 'speed', 'privacy'],
                weaknesses: ['general-knowledge', 'reasoning'],
                optimalTasks: ['code-completion', 'bug-fixing', 'code-explanation'],
                costPerToken: 0,
                avgResponseTime: 600,
                maxTokens: 16000,
                reliability: 0.90
            },
            'deepseek-coder': {
                provider: 'local',
                strengths: ['code-generation', 'performance', 'accuracy'],
                weaknesses: ['general-tasks', 'documentation'],
                optimalTasks: ['algorithm-implementation', 'optimization', 'code-translation'],
                costPerToken: 0,
                avgResponseTime: 700,
                maxTokens: 16000,
                reliability: 0.93
            }
        };

        for (const [modelName, config] of Object.entries(modelConfigs)) {
            this.models.set(modelName, config);
            this.modelPerformance.set(modelName, {
                successRate: config.reliability,
                avgResponseTime: config.avgResponseTime,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                totalCost: 0,
                lastUsed: null,
                performanceScore: this.calculateInitialPerformanceScore(config)
            });
        }

        console.log(`📚 Loaded ${this.models.size} AI models`);
    }

    calculateInitialPerformanceScore(config) {
        // Calculate initial performance score based on model characteristics
        let score = 0;
        score += config.reliability * 40; // Reliability is most important
        score += (3000 - config.avgResponseTime) / 3000 * 30; // Speed factor
        score += config.costPerToken === 0 ? 20 : (0.0001 - config.costPerToken) / 0.0001 * 20; // Cost factor
        score += config.maxTokens / 200000 * 10; // Token capacity factor
        return Math.max(0, Math.min(100, score));
    }

    async initializePerformanceTracking() {
        // Load historical performance data if available
        try {
            const performanceData = await fs.readFile(
                path.join(__dirname, 'data', 'model-performance.json'), 
                'utf8'
            );
            const data = JSON.parse(performanceData);
            
            for (const [modelName, performance] of Object.entries(data)) {
                if (this.modelPerformance.has(modelName)) {
                    this.modelPerformance.set(modelName, {
                        ...this.modelPerformance.get(modelName),
                        ...performance
                    });
                }
            }
            
            console.log('📊 Loaded historical performance data');
        } catch (error) {
            console.log('📊 No historical performance data found, starting fresh');
        }
    }

    async processRequest(request) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();
        
        try {
            // Analyze the request
            const analysis = await this.analyzeRequest(request);
            
            // Determine the best approach (single model, ensemble, or cascade)
            const strategy = await this.determineStrategy(analysis);
            
            let response;
            switch (strategy.type) {
                case 'single':
                    response = await this.processSingleModel(request, strategy.model, analysis);
                    break;
                case 'ensemble':
                    response = await this.processEnsemble(request, strategy.models, analysis);
                    break;
                case 'cascade':
                    response = await this.processCascade(request, strategy.models, analysis);
                    break;
                default:
                    throw new Error(`Unknown strategy type: ${strategy.type}`);
            }
            
            // Update performance metrics
            await this.updatePerformanceMetrics(strategy, true, Date.now() - startTime, response.cost || 0);
            
            // Learn from this interaction
            await this.learningEngine.learn(request, response, strategy, analysis);
            
            return {
                id: requestId,
                success: true,
                response: response.content,
                metadata: {
                    strategy: strategy.type,
                    models: strategy.type === 'single' ? [strategy.model] : strategy.models,
                    responseTime: Date.now() - startTime,
                    cost: response.cost || 0,
                    tokens: response.tokens || 0,
                    confidence: response.confidence || 0.8
                }
            };
        } catch (error) {
            console.error(`❌ Request processing failed:`, error.message);
            return {
                id: requestId,
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }

    async analyzeRequest(request) {
        const analysis = {
            complexity: 'medium',
            domain: 'general',
            urgency: 'normal',
            accuracy_required: 'high',
            cost_sensitivity: 'normal',
            privacy_level: 'normal',
            expected_length: 'medium',
            task_type: 'unknown',
            context_size: 0,
            requires_reasoning: false,
            requires_creativity: false,
            requires_multimodal: false
        };

        const prompt = request.prompt || request.task || '';
        const context = request.context || {};

        // Analyze task type
        if (prompt.match(/\b(debug|fix|error|bug)\b/i)) {
            analysis.task_type = 'debugging';
            analysis.accuracy_required = 'very-high';
            analysis.domain = 'code';
        } else if (prompt.match(/\b(generate|create|write|implement)\b/i)) {
            analysis.task_type = 'generation';
            analysis.requires_creativity = true;
            analysis.domain = 'code';
        } else if (prompt.match(/\b(explain|describe|document)\b/i)) {
            analysis.task_type = 'explanation';
            analysis.expected_length = 'long';
        } else if (prompt.match(/\b(review|analyze|check)\b/i)) {
            analysis.task_type = 'analysis';
            analysis.accuracy_required = 'very-high';
            analysis.requires_reasoning = true;
        } else if (prompt.match(/\b(refactor|optimize|improve)\b/i)) {
            analysis.task_type = 'optimization';
            analysis.complexity = 'high';
            analysis.requires_reasoning = true;
        }

        // Analyze complexity
        if (prompt.length > 1000 || (context.fileSize && context.fileSize > 10000)) {
            analysis.complexity = 'high';
        } else if (prompt.length < 100) {
            analysis.complexity = 'low';
        }

        // Analyze urgency
        if (context.urgent || prompt.match(/\b(urgent|asap|quickly|fast)\b/i)) {
            analysis.urgency = 'high';
            analysis.cost_sensitivity = 'low';
        }

        // Analyze privacy requirements
        if (context.sensitive || prompt.match(/\b(private|confidential|secret)\b/i)) {
            analysis.privacy_level = 'high';
        }

        // Analyze multimodal requirements
        if (context.images || context.files || prompt.match(/\b(image|picture|diagram|visual)\b/i)) {
            analysis.requires_multimodal = true;
        }

        // Calculate context size
        analysis.context_size = prompt.length + JSON.stringify(context).length;

        return analysis;
    }

    async determineStrategy(analysis) {
        // Get candidate models based on analysis
        const candidates = await this.routingEngine.getCandidateModels(analysis, this.models, this.modelPerformance);
        
        if (candidates.length === 0) {
            throw new Error('No suitable models found for this request');
        }

        // Determine strategy based on analysis and available models
        if (analysis.accuracy_required === 'very-high' && candidates.length >= 2) {
            // Use ensemble for critical tasks
            return {
                type: 'ensemble',
                models: candidates.slice(0, 3), // Use top 3 models
                voting: 'weighted'
            };
        } else if (analysis.complexity === 'high' && candidates.length >= 2) {
            // Use cascade for complex tasks
            return {
                type: 'cascade',
                models: candidates.slice(0, 2), // Use top 2 models
                fallback_threshold: 0.7
            };
        } else {
            // Use single best model
            return {
                type: 'single',
                model: candidates[0]
            };
        }
    }

    async processSingleModel(request, modelName, analysis) {
        console.log(`🤖 Processing with single model: ${modelName}`);
        
        const result = await this.aiIntegration.processAIRequest({
            task: request.task || request.prompt,
            prompt: request.prompt,
            context: {
                ...request.context,
                selectedModel: modelName,
                analysis
            },
            mcpActions: request.mcpActions
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return {
            content: result.response.content || result.response,
            cost: result.cost,
            tokens: result.tokens,
            confidence: 0.8,
            model: modelName
        };
    }

    async processEnsemble(request, modelNames, analysis) {
        console.log(`🤖 Processing with ensemble: ${modelNames.join(', ')}`);
        
        const responses = await Promise.allSettled(
            modelNames.map(modelName => 
                this.processSingleModel(request, modelName, analysis)
            )
        );

        const successfulResponses = responses
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        if (successfulResponses.length === 0) {
            throw new Error('All ensemble models failed');
        }

        // Use ensemble engine to combine responses
        const combinedResponse = await this.ensembleEngine.combineResponses(
            successfulResponses, 
            analysis,
            this.modelPerformance
        );

        return combinedResponse;
    }

    async processCascade(request, modelNames, analysis) {
        console.log(`🤖 Processing with cascade: ${modelNames.join(' -> ')}`);
        
        for (let i = 0; i < modelNames.length; i++) {
            try {
                const response = await this.processSingleModel(request, modelNames[i], analysis);
                
                // Check if response meets quality threshold
                if (response.confidence >= 0.7 || i === modelNames.length - 1) {
                    return response;
                }
                
                console.log(`🔄 Cascading to next model due to low confidence: ${response.confidence}`);
            } catch (error) {
                console.log(`🔄 Cascading due to error: ${error.message}`);
                if (i === modelNames.length - 1) {
                    throw error;
                }
            }
        }
    }

    async updatePerformanceMetrics(strategy, success, responseTime, cost) {
        const models = strategy.type === 'single' ? [strategy.model] : strategy.models;
        
        for (const modelName of models) {
            const performance = this.modelPerformance.get(modelName);
            if (performance) {
                performance.totalRequests++;
                if (success) {
                    performance.successfulRequests++;
                } else {
                    performance.failedRequests++;
                }
                
                performance.successRate = performance.successfulRequests / performance.totalRequests;
                performance.avgResponseTime = (
                    (performance.avgResponseTime * (performance.totalRequests - 1) + responseTime) / 
                    performance.totalRequests
                );
                performance.totalCost += cost;
                performance.lastUsed = Date.now();
                
                // Recalculate performance score
                performance.performanceScore = this.calculatePerformanceScore(modelName, performance);
                
                this.modelPerformance.set(modelName, performance);
            }
        }
        
        // Save performance data periodically
        if (Math.random() < 0.1) { // 10% chance to save
            await this.savePerformanceData();
        }
    }

    calculatePerformanceScore(modelName, performance) {
        const model = this.models.get(modelName);
        if (!model) return 0;
        
        let score = 0;
        score += performance.successRate * 40; // Success rate is most important
        score += (5000 - performance.avgResponseTime) / 5000 * 25; // Speed factor
        score += model.costPerToken === 0 ? 20 : Math.max(0, (0.0001 - model.costPerToken) / 0.0001 * 20); // Cost factor
        score += Math.min(15, performance.totalRequests / 100 * 15); // Experience factor
        
        return Math.max(0, Math.min(100, score));
    }

    async savePerformanceData() {
        try {
            const dataDir = path.join(__dirname, 'data');
            await fs.mkdir(dataDir, { recursive: true });
            
            const performanceData = Object.fromEntries(this.modelPerformance);
            await fs.writeFile(
                path.join(dataDir, 'model-performance.json'),
                JSON.stringify(performanceData, null, 2)
            );
        } catch (error) {
            console.error('Failed to save performance data:', error.message);
        }
    }

    generateRequestId() {
        return `multi-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getSystemStatus() {
        const modelStats = Array.from(this.models.entries()).map(([name, config]) => {
            const performance = this.modelPerformance.get(name);
            return {
                name,
                provider: config.provider,
                status: 'active',
                performance: {
                    score: performance.performanceScore.toFixed(1),
                    successRate: (performance.successRate * 100).toFixed(1) + '%',
                    avgResponseTime: performance.avgResponseTime.toFixed(0) + 'ms',
                    totalRequests: performance.totalRequests,
                    totalCost: performance.totalCost.toFixed(4)
                }
            };
        });

        return {
            totalModels: this.models.size,
            activeModels: modelStats.filter(m => m.status === 'active').length,
            models: modelStats,
            systemHealth: 'healthy'
        };
    }
}

class IntelligentRoutingEngine {
    async getCandidateModels(analysis, models, performance) {
        const candidates = [];
        
        for (const [modelName, config] of models) {
            const score = this.scoreModelForTask(analysis, config, performance.get(modelName));
            candidates.push({ name: modelName, score, config });
        }
        
        // Sort by score (descending) and return model names
        return candidates
            .sort((a, b) => b.score - a.score)
            .map(candidate => candidate.name);
    }
    
    scoreModelForTask(analysis, config, performance) {
        let score = 0;
        
        // Task type matching
        if (config.optimalTasks && Array.isArray(config.optimalTasks) && analysis.task_type && config.optimalTasks.includes(analysis.task_type)) {
            score += 30;
        }
        
        // Strength matching
        if (analysis.requires_reasoning && config.strengths && Array.isArray(config.strengths) && config.strengths.includes('complex-reasoning')) score += 20;
        if (analysis.requires_creativity && config.strengths && Array.isArray(config.strengths) && config.strengths.includes('code-generation')) score += 20;
        if (analysis.requires_multimodal && config.strengths && Array.isArray(config.strengths) && config.strengths.includes('multimodal')) score += 25;
        if (analysis.domain === 'code' && config.strengths && Array.isArray(config.strengths) && config.strengths.includes('code-specific')) score += 15;
        
        // Performance factors
        score += performance.performanceScore * 0.3;
        
        // Urgency considerations
        if (analysis.urgency === 'high' && config.avgResponseTime < 1000) score += 15;
        
        // Privacy considerations
        if (analysis.privacy_level === 'high' && config.provider === 'local') score += 20;
        
        // Cost considerations
        if (analysis.cost_sensitivity === 'high' && config.costPerToken === 0) score += 15;
        
        // Accuracy requirements
        if (analysis.accuracy_required === 'very-high' && performance.successRate > 0.95) score += 10;
        
        return score;
    }
}

class EnsembleEngine {
    async combineResponses(responses, analysis, performance) {
        if (responses.length === 1) {
            return responses[0];
        }
        
        // Weight responses based on model performance and confidence
        const weightedResponses = responses.map(response => {
            const modelPerf = performance.get(response.model);
            const weight = (modelPerf.performanceScore / 100) * (response.confidence || 0.8);
            return { ...response, weight };
        });
        
        // For code generation tasks, use voting
        if (analysis.task_type === 'generation' || analysis.task_type === 'debugging') {
            return this.voteOnBestResponse(weightedResponses);
        }
        
        // For explanation tasks, combine responses
        if (analysis.task_type === 'explanation') {
            return this.combineExplanations(weightedResponses);
        }
        
        // Default: return highest weighted response
        return weightedResponses.reduce((best, current) => 
            current.weight > best.weight ? current : best
        );
    }
    
    voteOnBestResponse(responses) {
        // Simple weighted voting - return response with highest weight
        const best = responses.reduce((best, current) => 
            current.weight > best.weight ? current : best
        );
        
        return {
            ...best,
            confidence: Math.min(0.95, best.confidence + 0.1), // Boost confidence for ensemble
            cost: responses.reduce((sum, r) => sum + (r.cost || 0), 0),
            tokens: responses.reduce((sum, r) => sum + (r.tokens || 0), 0)
        };
    }
    
    combineExplanations(responses) {
        // Combine explanations from multiple models
        const combinedContent = responses
            .sort((a, b) => b.weight - a.weight)
            .map((r, i) => `## Response ${i + 1} (${r.model})\n${r.content}`)
            .join('\n\n');
        
        const totalWeight = responses.reduce((sum, r) => sum + r.weight, 0);
        const avgConfidence = responses.reduce((sum, r) => sum + r.confidence * r.weight, 0) / totalWeight;
        
        return {
            content: combinedContent,
            confidence: Math.min(0.95, avgConfidence),
            cost: responses.reduce((sum, r) => sum + (r.cost || 0), 0),
            tokens: responses.reduce((sum, r) => sum + (r.tokens || 0), 0),
            model: 'ensemble-' + responses.map(r => r.model).join('-')
        };
    }
}

class ModelLearningEngine {
    constructor() {
        this.learningData = [];
        this.patterns = new Map();
    }
    
    async learn(request, response, strategy, analysis) {
        const learningEntry = {
            timestamp: Date.now(),
            request: {
                task_type: analysis.task_type,
                complexity: analysis.complexity,
                domain: analysis.domain,
                urgency: analysis.urgency
            },
            strategy: strategy.type,
            models: strategy.type === 'single' ? [strategy.model] : strategy.models,
            success: response.success,
            responseTime: response.responseTime,
            cost: response.cost || 0,
            confidence: response.confidence || 0.8
        };
        
        this.learningData.push(learningEntry);
        
        // Keep only last 1000 entries
        if (this.learningData.length > 1000) {
            this.learningData.shift();
        }
        
        // Update patterns
        await this.updatePatterns();
    }
    
    async updatePatterns() {
        // Analyze patterns in the learning data
        const recentData = this.learningData.slice(-100); // Last 100 entries
        
        // Pattern: Best model for each task type
        const taskModelPerformance = new Map();
        
        for (const entry of recentData) {
            if (!taskModelPerformance.has(entry.request.task_type)) {
                taskModelPerformance.set(entry.request.task_type, new Map());
            }
            
            const taskMap = taskModelPerformance.get(entry.request.task_type);
            
            for (const model of entry.models) {
                if (!taskMap.has(model)) {
                    taskMap.set(model, { successes: 0, total: 0, avgTime: 0, avgCost: 0 });
                }
                
                const stats = taskMap.get(model);
                stats.total++;
                if (entry.success) stats.successes++;
                stats.avgTime = (stats.avgTime * (stats.total - 1) + entry.responseTime) / stats.total;
                stats.avgCost = (stats.avgCost * (stats.total - 1) + entry.cost) / stats.total;
            }
        }
        
        this.patterns.set('task-model-performance', taskModelPerformance);
    }
    
    getRecommendations(analysis) {
        const taskPerf = this.patterns.get('task-model-performance');
        if (!taskPerf || !taskPerf.has(analysis.task_type)) {
            return null;
        }
        
        const modelStats = taskPerf.get(analysis.task_type);
        const recommendations = Array.from(modelStats.entries())
            .map(([model, stats]) => ({
                model,
                successRate: stats.successes / stats.total,
                avgResponseTime: stats.avgTime,
                avgCost: stats.avgCost,
                score: (stats.successes / stats.total) * 100 - (stats.avgTime / 1000) - (stats.avgCost * 1000)
            }))
            .sort((a, b) => b.score - a.score);
        
        return recommendations;
    }
}

module.exports = {
    MultiModelAISystem,
    IntelligentRoutingEngine,
    EnsembleEngine,
    ModelLearningEngine
};

// Example usage
if (require.main === module) {
    const aiSystem = new MultiModelAISystem();
    
    aiSystem.on('system-ready', async () => {
        console.log('🎉 Multi-Model AI System ready!');
        
        // Example request
        const testRequest = {
            prompt: 'Debug this JavaScript function that is not working correctly',
            context: {
                fileSize: 500,
                urgent: false,
                sensitive: false
            },
            mcpActions: [
                { type: 'save-file', path: './fixed-function.js' }
            ]
        };
        
        try {
            const result = await aiSystem.processRequest(testRequest);
            console.log('✅ Test request result:', result);
            
            console.log('📊 System status:', aiSystem.getSystemStatus());
        } catch (error) {
            console.error('❌ Test request failed:', error.message);
        }
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('🛑 Shutting down Multi-Model AI System...');
        await aiSystem.aiIntegration.shutdown();
        process.exit(0);
    });
}