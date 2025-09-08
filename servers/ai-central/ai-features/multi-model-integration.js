/**
 * NEXUS IDE - Multi-Model AI Integration System
 * รวม AI models หลายตัวเข้าด้วยกันเพื่อให้ได้ผลลัพธ์ที่ดีที่สุด
 * 
 * Features:
 * - GPT-4 Integration
 * - Claude Integration  
 * - Llama Integration
 * - Model Selection Algorithm
 * - Response Aggregation
 * - Performance Monitoring
 */

const axios = require('axios');
const EventEmitter = require('events');

class MultiModelAIIntegration extends EventEmitter {
    constructor() {
        super();
        this.models = new Map();
        this.modelConfigs = {
            'gpt-4': {
                endpoint: 'https://api.openai.com/v1/chat/completions',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                maxTokens: 4096,
                temperature: 0.7,
                strengths: ['reasoning', 'code-generation', 'explanation'],
                priority: 1
            },
            'claude-3': {
                endpoint: 'https://api.anthropic.com/v1/messages',
                headers: {
                    'x-api-key': process.env.ANTHROPIC_API_KEY,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                maxTokens: 4096,
                temperature: 0.7,
                strengths: ['analysis', 'safety', 'detailed-explanation'],
                priority: 2
            },
            'llama-2': {
                endpoint: process.env.LLAMA_ENDPOINT || 'http://localhost:11434/api/generate',
                headers: {
                    'Content-Type': 'application/json'
                },
                maxTokens: 2048,
                temperature: 0.7,
                strengths: ['local-processing', 'privacy', 'customization'],
                priority: 3
            }
        };
        
        this.initializeModels();
    }

    /**
     * Initialize AI models
     */
    initializeModels() {
        console.log('🤖 Initializing Multi-Model AI Integration...');
        
        for (const [modelName, config] of Object.entries(this.modelConfigs)) {
            this.models.set(modelName, {
                ...config,
                available: false,
                responseTime: 0,
                successRate: 100,
                lastUsed: null
            });
        }
        
        this.checkModelAvailability();
    }

    /**
     * Check availability of all models
     */
    async checkModelAvailability() {
        console.log('🔍 Checking AI model availability...');
        
        for (const [modelName, model] of this.models) {
            try {
                const startTime = Date.now();
                await this.testModel(modelName);
                const responseTime = Date.now() - startTime;
                
                model.available = true;
                model.responseTime = responseTime;
                console.log(`✅ ${modelName} is available (${responseTime}ms)`);
            } catch (error) {
                model.available = false;
                console.log(`❌ ${modelName} is not available:`, error.message);
            }
        }
    }

    /**
     * Test model with a simple request
     */
    async testModel(modelName) {
        const model = this.models.get(modelName);
        if (!model) throw new Error(`Model ${modelName} not found`);

        const testPrompt = 'Hello, please respond with "OK" to confirm you are working.';
        
        switch (modelName) {
            case 'gpt-4':
                return await this.callGPT4(testPrompt);
            case 'claude-3':
                return await this.callClaude(testPrompt);
            case 'llama-2':
                return await this.callLlama(testPrompt);
            default:
                throw new Error(`Unknown model: ${modelName}`);
        }
    }

    /**
     * Select best model for the task
     */
    selectBestModel(taskType, requirements = {}) {
        const availableModels = Array.from(this.models.entries())
            .filter(([name, model]) => model.available)
            .sort((a, b) => {
                const [nameA, modelA] = a;
                const [nameB, modelB] = b;
                
                // Score based on strengths
                let scoreA = 0;
                let scoreB = 0;
                
                if (modelA.strengths.includes(taskType)) scoreA += 10;
                if (modelB.strengths.includes(taskType)) scoreB += 10;
                
                // Score based on performance
                scoreA += (1000 - modelA.responseTime) / 100;
                scoreB += (1000 - modelB.responseTime) / 100;
                
                // Score based on success rate
                scoreA += modelA.successRate / 10;
                scoreB += modelB.successRate / 10;
                
                // Priority (lower number = higher priority)
                scoreA += (10 - modelA.priority);
                scoreB += (10 - modelB.priority);
                
                return scoreB - scoreA;
            });

        if (availableModels.length === 0) {
            throw new Error('No AI models are available');
        }

        const [selectedModelName, selectedModel] = availableModels[0];
        console.log(`🎯 Selected model: ${selectedModelName} for task: ${taskType}`);
        
        return selectedModelName;
    }

    /**
     * Generate response using the best available model
     */
    async generateResponse(prompt, options = {}) {
        const {
            taskType = 'general',
            maxRetries = 3,
            fallbackModels = true,
            aggregateResponses = false
        } = options;

        try {
            if (aggregateResponses) {
                return await this.generateAggregatedResponse(prompt, options);
            }

            const modelName = this.selectBestModel(taskType);
            return await this.callModel(modelName, prompt, options);
            
        } catch (error) {
            console.error('❌ Error generating response:', error.message);
            
            if (fallbackModels && maxRetries > 0) {
                console.log('🔄 Trying fallback model...');
                return await this.generateResponse(prompt, {
                    ...options,
                    maxRetries: maxRetries - 1
                });
            }
            
            throw error;
        }
    }

    /**
     * Generate aggregated response from multiple models
     */
    async generateAggregatedResponse(prompt, options = {}) {
        const availableModels = Array.from(this.models.keys())
            .filter(name => this.models.get(name).available);
            
        if (availableModels.length === 0) {
            throw new Error('No AI models are available');
        }

        console.log(`🔄 Generating aggregated response from ${availableModels.length} models...`);
        
        const responses = await Promise.allSettled(
            availableModels.map(async (modelName) => {
                try {
                    const response = await this.callModel(modelName, prompt, options);
                    return { modelName, response, success: true };
                } catch (error) {
                    return { modelName, error: error.message, success: false };
                }
            })
        );

        const successfulResponses = responses
            .filter(result => result.status === 'fulfilled' && result.value.success)
            .map(result => result.value);

        if (successfulResponses.length === 0) {
            throw new Error('All models failed to generate response');
        }

        // Aggregate responses using a simple voting/ranking system
        return this.aggregateResponses(successfulResponses, prompt);
    }

    /**
     * Aggregate multiple responses into one best response
     */
    aggregateResponses(responses, originalPrompt) {
        // For now, return the response from the highest priority model
        // In the future, implement more sophisticated aggregation
        const sortedResponses = responses.sort((a, b) => {
            const priorityA = this.models.get(a.modelName).priority;
            const priorityB = this.models.get(b.modelName).priority;
            return priorityA - priorityB;
        });

        const bestResponse = sortedResponses[0];
        
        return {
            response: bestResponse.response,
            primaryModel: bestResponse.modelName,
            alternativeResponses: sortedResponses.slice(1),
            aggregationMethod: 'priority-based',
            confidence: this.calculateConfidence(responses)
        };
    }

    /**
     * Calculate confidence score for aggregated response
     */
    calculateConfidence(responses) {
        if (responses.length === 1) return 0.8;
        if (responses.length === 2) return 0.9;
        return 0.95; // Higher confidence with more models
    }

    /**
     * Call specific model
     */
    async callModel(modelName, prompt, options = {}) {
        const model = this.models.get(modelName);
        if (!model || !model.available) {
            throw new Error(`Model ${modelName} is not available`);
        }

        const startTime = Date.now();
        
        try {
            let response;
            
            switch (modelName) {
                case 'gpt-4':
                    response = await this.callGPT4(prompt, options);
                    break;
                case 'claude-3':
                    response = await this.callClaude(prompt, options);
                    break;
                case 'llama-2':
                    response = await this.callLlama(prompt, options);
                    break;
                default:
                    throw new Error(`Unknown model: ${modelName}`);
            }
            
            // Update model statistics
            const responseTime = Date.now() - startTime;
            model.responseTime = (model.responseTime + responseTime) / 2;
            model.lastUsed = new Date();
            model.successRate = Math.min(100, model.successRate + 0.1);
            
            this.emit('modelUsed', { modelName, responseTime, success: true });
            
            return response;
            
        } catch (error) {
            // Update failure statistics
            model.successRate = Math.max(0, model.successRate - 1);
            this.emit('modelUsed', { modelName, error: error.message, success: false });
            throw error;
        }
    }

    /**
     * Call GPT-4 API
     */
    async callGPT4(prompt, options = {}) {
        const model = this.models.get('gpt-4');
        
        const requestData = {
            model: 'gpt-4',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: options.maxTokens || model.maxTokens,
            temperature: options.temperature || model.temperature
        };

        const response = await axios.post(model.endpoint, requestData, {
            headers: model.headers,
            timeout: 30000
        });

        return response.data.choices[0].message.content;
    }

    /**
     * Call Claude API
     */
    async callClaude(prompt, options = {}) {
        const model = this.models.get('claude-3');
        
        const requestData = {
            model: 'claude-3-sonnet-20240229',
            max_tokens: options.maxTokens || model.maxTokens,
            temperature: options.temperature || model.temperature,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        };

        const response = await axios.post(model.endpoint, requestData, {
            headers: model.headers,
            timeout: 30000
        });

        return response.data.content[0].text;
    }

    /**
     * Call Llama API (local or remote)
     */
    async callLlama(prompt, options = {}) {
        const model = this.models.get('llama-2');
        
        const requestData = {
            model: 'llama2',
            prompt: prompt,
            stream: false,
            options: {
                temperature: options.temperature || model.temperature,
                num_predict: options.maxTokens || model.maxTokens
            }
        };

        const response = await axios.post(model.endpoint, requestData, {
            headers: model.headers,
            timeout: 60000 // Llama might be slower
        });

        return response.data.response;
    }

    /**
     * Get model statistics
     */
    getModelStats() {
        const stats = {};
        
        for (const [modelName, model] of this.models) {
            stats[modelName] = {
                available: model.available,
                responseTime: model.responseTime,
                successRate: model.successRate,
                lastUsed: model.lastUsed,
                strengths: model.strengths,
                priority: model.priority
            };
        }
        
        return stats;
    }

    /**
     * Update model configuration
     */
    updateModelConfig(modelName, config) {
        const model = this.models.get(modelName);
        if (!model) {
            throw new Error(`Model ${modelName} not found`);
        }
        
        Object.assign(model, config);
        console.log(`📝 Updated configuration for ${modelName}`);
    }

    /**
     * Add new model
     */
    addModel(modelName, config) {
        this.models.set(modelName, {
            ...config,
            available: false,
            responseTime: 0,
            successRate: 100,
            lastUsed: null
        });
        
        console.log(`➕ Added new model: ${modelName}`);
        this.testModel(modelName).catch(error => {
            console.log(`❌ New model ${modelName} test failed:`, error.message);
        });
    }

    /**
     * Remove model
     */
    removeModel(modelName) {
        if (this.models.delete(modelName)) {
            console.log(`➖ Removed model: ${modelName}`);
        } else {
            console.log(`⚠️ Model ${modelName} not found`);
        }
    }
}

module.exports = MultiModelAIIntegration;