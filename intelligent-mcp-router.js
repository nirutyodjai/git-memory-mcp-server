/**
 * NEXUS IDE - Intelligent MCP Router
 * AI-powered routing system that intelligently selects the most appropriate
 * MCP server for each task based on context, performance, and capabilities
 */

const { MultiModelAISystem } = require('./multi-model-ai-system');
const { AIMCPIntegration } = require('./ai-mcp-integration');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class IntelligentMCPRouter extends EventEmitter {
    constructor() {
        super();
        this.multiModelAI = new MultiModelAISystem();
        this.mcpServers = new Map();
        this.serverCapabilities = new Map();
        this.performanceMetrics = new Map();
        this.routingHistory = [];
        this.learningEngine = new RoutingLearningEngine();
        this.loadBalancer = new IntelligentLoadBalancer();
        this.healthMonitor = new MCPHealthMonitor();
        
        this.routingStrategies = {
            'performance': new PerformanceBasedRouting(),
            'capability': new CapabilityBasedRouting(),
            'load': new LoadBasedRouting(),
            'ai': new AIBasedRouting(),
            'hybrid': new HybridRouting()
        };
        
        this.defaultStrategy = 'hybrid';
        this.initializeRouter();
    }

    async initializeRouter() {
        console.log('🧠 Initializing Intelligent MCP Router...');
        
        await this.discoverMCPServers();
        await this.loadServerCapabilities();
        await this.loadPerformanceHistory();
        await this.startHealthMonitoring();
        
        console.log('✅ Intelligent MCP Router ready!');
        this.emit('router-ready');
    }

    async discoverMCPServers() {
        try {
            // Discover available MCP servers
            const serverConfigPath = path.join(__dirname, 'config', 'mcp-servers.json');
            const serverConfig = JSON.parse(await fs.readFile(serverConfigPath, 'utf8'));
            
            for (const [serverId, config] of Object.entries(serverConfig.servers)) {
                await this.registerMCPServer(serverId, config);
            }
            
            console.log(`🔍 Discovered ${this.mcpServers.size} MCP servers`);
        } catch (error) {
            console.log('🔍 No MCP server config found, using defaults');
            await this.setupDefaultServers();
        }
    }

    async registerMCPServer(serverId, config) {
        const server = {
            id: serverId,
            name: config.name,
            endpoint: config.endpoint,
            capabilities: config.capabilities || [],
            priority: config.priority || 1,
            maxConcurrency: config.maxConcurrency || 10,
            timeout: config.timeout || 30000,
            retryAttempts: config.retryAttempts || 3,
            healthCheckInterval: config.healthCheckInterval || 60000,
            status: 'unknown',
            lastHealthCheck: null,
            currentLoad: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            lastResponseTime: 0,
            errorRate: 0,
            tags: config.tags || [],
            metadata: config.metadata || {}
        };
        
        this.mcpServers.set(serverId, server);
        this.performanceMetrics.set(serverId, {
            responseTimeHistory: [],
            errorHistory: [],
            loadHistory: [],
            successRate: 100,
            reliability: 100,
            efficiency: 100
        });
        
        // Perform initial health check
        await this.healthMonitor.checkServerHealth(server);
        
        console.log(`📡 Registered MCP server: ${server.name} (${serverId})`);
    }

    async setupDefaultServers() {
        const defaultServers = {
            'git-memory': {
                name: 'Git Memory MCP Server',
                endpoint: 'http://localhost:8080',
                capabilities: ['git', 'memory', 'file-operations', 'search'],
                priority: 1,
                tags: ['git', 'memory', 'core']
            },
            'ai-assistant': {
                name: 'AI Assistant MCP Server',
                endpoint: 'http://localhost:8081',
                capabilities: ['ai', 'code-completion', 'analysis', 'debugging'],
                priority: 1,
                tags: ['ai', 'assistant', 'core']
            },
            'file-system': {
                name: 'File System MCP Server',
                endpoint: 'http://localhost:8082',
                capabilities: ['file-operations', 'directory-listing', 'file-watching'],
                priority: 2,
                tags: ['filesystem', 'io']
            }
        };
        
        for (const [serverId, config] of Object.entries(defaultServers)) {
            await this.registerMCPServer(serverId, config);
        }
    }

    async loadServerCapabilities() {
        for (const [serverId, server] of this.mcpServers) {
            try {
                const capabilities = await this.queryServerCapabilities(server);
                this.serverCapabilities.set(serverId, capabilities);
            } catch (error) {
                console.warn(`⚠️ Failed to load capabilities for ${serverId}:`, error.message);
                // Use default capabilities from config
                this.serverCapabilities.set(serverId, server.capabilities);
            }
        }
    }

    async queryServerCapabilities(server) {
        // Query server for its actual capabilities
        try {
            const response = await fetch(`${server.endpoint}/capabilities`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.capabilities || server.capabilities;
            }
        } catch (error) {
            // Fallback to configured capabilities
        }
        
        return server.capabilities;
    }

    async loadPerformanceHistory() {
        try {
            const historyPath = path.join(__dirname, 'data', 'mcp-performance-history.json');
            const historyData = await fs.readFile(historyPath, 'utf8');
            const history = JSON.parse(historyData);
            
            for (const [serverId, metrics] of Object.entries(history)) {
                if (this.performanceMetrics.has(serverId)) {
                    const current = this.performanceMetrics.get(serverId);
                    this.performanceMetrics.set(serverId, { ...current, ...metrics });
                }
            }
            
            console.log('📊 Loaded performance history');
        } catch (error) {
            console.log('📊 No performance history found, starting fresh');
        }
    }

    async startHealthMonitoring() {
        // Start periodic health monitoring
        setInterval(async () => {
            await this.performHealthChecks();
        }, 30000); // Check every 30 seconds
        
        // Initial health check
        await this.performHealthChecks();
    }

    async performHealthChecks() {
        const healthPromises = Array.from(this.mcpServers.values()).map(server => 
            this.healthMonitor.checkServerHealth(server)
        );
        
        await Promise.allSettled(healthPromises);
    }

    // Main Routing Methods
    async routeRequest(request) {
        const startTime = Date.now();
        
        try {
            // Analyze the request to determine requirements
            const requirements = await this.analyzeRequest(request);
            
            // Find suitable servers
            const candidateServers = await this.findCandidateServers(requirements);
            
            if (candidateServers.length === 0) {
                throw new Error('No suitable MCP servers found for this request');
            }
            
            // Select the best server using AI-powered routing
            const selectedServer = await this.selectOptimalServer(candidateServers, requirements, request);
            
            // Execute the request
            const result = await this.executeRequest(selectedServer, request);
            
            // Record routing decision and performance
            await this.recordRoutingDecision({
                request,
                requirements,
                candidateServers,
                selectedServer,
                result,
                responseTime: Date.now() - startTime,
                success: result.success
            });
            
            return {
                success: true,
                result: result.data,
                metadata: {
                    selectedServer: selectedServer.id,
                    responseTime: Date.now() - startTime,
                    routingStrategy: requirements.strategy,
                    confidence: result.confidence || 0.8
                }
            };
        } catch (error) {
            console.error('❌ Request routing failed:', error.message);
            
            // Try fallback routing
            const fallbackResult = await this.tryFallbackRouting(request, error);
            
            if (fallbackResult) {
                return fallbackResult;
            }
            
            return {
                success: false,
                error: error.message,
                metadata: {
                    responseTime: Date.now() - startTime,
                    fallbackAttempted: true
                }
            };
        }
    }

    async analyzeRequest(request) {
        // Use AI to analyze the request and determine requirements
        const aiRequest = {
            task: 'request-analysis',
            prompt: this.buildRequestAnalysisPrompt(request),
            context: {
                requestType: request.type,
                requestData: request.data,
                userContext: request.userContext,
                availableServers: Array.from(this.mcpServers.keys())
            }
        };
        
        try {
            const result = await this.multiModelAI.processRequest(aiRequest);
            
            if (result.success) {
                const analysis = this.parseRequestAnalysis(result.response);
                
                return {
                    ...analysis,
                    strategy: analysis.recommendedStrategy || this.defaultStrategy,
                    priority: analysis.priority || 'medium',
                    timeout: analysis.estimatedTimeout || 30000,
                    retryable: analysis.retryable !== false
                };
            }
        } catch (error) {
            console.warn('⚠️ AI request analysis failed, using heuristics:', error.message);
        }
        
        // Fallback to heuristic analysis
        return this.heuristicRequestAnalysis(request);
    }

    buildRequestAnalysisPrompt(request) {
        return `Analyze the following MCP request and determine the optimal routing requirements:

**Request Type:** ${request.type}
**Request Data:** ${JSON.stringify(request.data, null, 2)}
**User Context:** ${JSON.stringify(request.userContext || {}, null, 2)}

**Available MCP Servers:**
${Array.from(this.mcpServers.entries()).map(([id, server]) => 
    `- ${id}: ${server.name} (${server.capabilities.join(', ')})`
).join('\n')}

**Current Server Status:**
${Array.from(this.mcpServers.entries()).map(([id, server]) => 
    `- ${id}: ${server.status} (Load: ${server.currentLoad}/${server.maxConcurrency})`
).join('\n')}

Provide analysis including:
1. Required capabilities
2. Performance requirements
3. Recommended routing strategy
4. Priority level
5. Estimated processing time
6. Fallback options

Return analysis in JSON format.`;
    }

    parseRequestAnalysis(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            // Fallback parsing for non-JSON responses
            return this.extractAnalysisFromText(response);
        }
    }

    extractAnalysisFromText(text) {
        const analysis = {
            requiredCapabilities: [],
            recommendedStrategy: 'hybrid',
            priority: 'medium',
            estimatedTimeout: 30000
        };
        
        // Extract capabilities
        const capabilityMatch = text.match(/capabilities?[:\s]+([^\n]+)/i);
        if (capabilityMatch) {
            analysis.requiredCapabilities = capabilityMatch[1]
                .split(/[,;]/).map(cap => cap.trim().toLowerCase());
        }
        
        // Extract strategy
        const strategyMatch = text.match(/strategy[:\s]+(\w+)/i);
        if (strategyMatch) {
            analysis.recommendedStrategy = strategyMatch[1].toLowerCase();
        }
        
        // Extract priority
        const priorityMatch = text.match(/priority[:\s]+(\w+)/i);
        if (priorityMatch) {
            analysis.priority = priorityMatch[1].toLowerCase();
        }
        
        return analysis;
    }

    heuristicRequestAnalysis(request) {
        const analysis = {
            requiredCapabilities: [],
            recommendedStrategy: 'hybrid',
            priority: 'medium',
            estimatedTimeout: 30000,
            retryable: true
        };
        
        // Determine capabilities based on request type
        switch (request.type) {
            case 'git-operation':
                analysis.requiredCapabilities = ['git'];
                analysis.priority = 'high';
                break;
            case 'file-operation':
                analysis.requiredCapabilities = ['file-operations'];
                analysis.priority = 'medium';
                break;
            case 'ai-request':
                analysis.requiredCapabilities = ['ai', 'code-completion'];
                analysis.priority = 'high';
                analysis.estimatedTimeout = 60000;
                break;
            case 'search':
                analysis.requiredCapabilities = ['search', 'memory'];
                analysis.priority = 'medium';
                break;
            default:
                analysis.requiredCapabilities = ['general'];
        }
        
        // Adjust strategy based on request characteristics
        if (request.data && request.data.urgent) {
            analysis.recommendedStrategy = 'performance';
            analysis.priority = 'high';
        }
        
        if (request.data && request.data.complex) {
            analysis.recommendedStrategy = 'capability';
            analysis.estimatedTimeout = 60000;
        }
        
        return analysis;
    }

    async findCandidateServers(requirements) {
        const candidates = [];
        
        for (const [serverId, server] of this.mcpServers) {
            // Check if server is healthy
            if (server.status !== 'healthy') {
                continue;
            }
            
            // Check if server has required capabilities
            const serverCapabilities = this.serverCapabilities.get(serverId) || [];
            const hasRequiredCapabilities = requirements.requiredCapabilities.every(cap => 
                Array.isArray(serverCapabilities) && serverCapabilities.some(serverCap => 
                    serverCap && cap && typeof serverCap === 'string' && typeof cap === 'string' && (
                        serverCap.toLowerCase().includes(cap.toLowerCase()) ||
                        cap.toLowerCase().includes(serverCap.toLowerCase())
                    )
                )
            );
            
            if (!hasRequiredCapabilities && requirements.requiredCapabilities.length > 0) {
                continue;
            }
            
            // Check load capacity
            if (server.currentLoad >= server.maxConcurrency) {
                continue;
            }
            
            // Calculate suitability score
            const suitabilityScore = this.calculateSuitabilityScore(server, requirements);
            
            candidates.push({
                server,
                suitabilityScore,
                capabilities: serverCapabilities,
                metrics: this.performanceMetrics.get(serverId)
            });
        }
        
        // Sort by suitability score
        return candidates.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }

    calculateSuitabilityScore(server, requirements) {
        let score = 0;
        
        // Base score from server priority
        score += (5 - server.priority) * 20; // Higher priority = higher score
        
        // Performance score
        const metrics = this.performanceMetrics.get(server.id);
        if (metrics) {
            score += metrics.successRate * 0.3;
            score += metrics.reliability * 0.2;
            score += metrics.efficiency * 0.2;
        }
        
        // Load score (prefer less loaded servers)
        const loadRatio = server.currentLoad / server.maxConcurrency;
        score += (1 - loadRatio) * 30;
        
        // Response time score
        if (server.averageResponseTime > 0) {
            const responseTimeScore = Math.max(0, 100 - (server.averageResponseTime / 1000));
            score += responseTimeScore * 0.1;
        }
        
        // Priority adjustment
        if (requirements.priority === 'high') {
            score *= 1.2;
        } else if (requirements.priority === 'low') {
            score *= 0.8;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    async selectOptimalServer(candidates, requirements, request) {
        const strategy = this.routingStrategies[requirements.strategy] || 
                        this.routingStrategies[this.defaultStrategy];
        
        const selection = await strategy.selectServer(candidates, requirements, request, {
            performanceMetrics: this.performanceMetrics,
            routingHistory: this.routingHistory,
            multiModelAI: this.multiModelAI
        });
        
        // Update server load
        const selectedServer = selection.server;
        selectedServer.currentLoad++;
        
        return selectedServer;
    }

    async executeRequest(server, request) {
        const startTime = Date.now();
        
        try {
            // Prepare request for MCP server
            const mcpRequest = this.prepareMCPRequest(request, server);
            
            // Execute request with timeout
            const response = await Promise.race([
                this.sendMCPRequest(server, mcpRequest),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), server.timeout)
                )
            ]);
            
            const responseTime = Date.now() - startTime;
            
            // Update server metrics
            await this.updateServerMetrics(server.id, {
                success: true,
                responseTime,
                timestamp: Date.now()
            });
            
            return {
                success: true,
                data: response,
                responseTime,
                confidence: 0.9
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Update server metrics
            await this.updateServerMetrics(server.id, {
                success: false,
                responseTime,
                error: error.message,
                timestamp: Date.now()
            });
            
            throw error;
        } finally {
            // Decrease server load
            server.currentLoad = Math.max(0, server.currentLoad - 1);
        }
    }

    prepareMCPRequest(request, server) {
        return {
            id: this.generateRequestId(),
            method: request.method || 'execute',
            params: request.data,
            metadata: {
                timestamp: Date.now(),
                source: 'nexus-ide',
                userContext: request.userContext,
                routingInfo: {
                    selectedServer: server.id,
                    routingStrategy: request.strategy
                }
            }
        };
    }

    async sendMCPRequest(server, request) {
        // Simulate MCP request - in real implementation, this would use actual MCP protocol
        const response = await fetch(`${server.endpoint}/mcp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-MCP-Version': '1.0'
            },
            body: JSON.stringify(request)
        });
        
        if (!response.ok) {
            throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    async updateServerMetrics(serverId, result) {
        const server = this.mcpServers.get(serverId);
        const metrics = this.performanceMetrics.get(serverId);
        
        if (!server || !metrics) return;
        
        // Update server stats
        server.totalRequests++;
        server.lastResponseTime = result.responseTime;
        
        if (result.success) {
            server.successfulRequests++;
        } else {
            server.failedRequests++;
        }
        
        // Calculate averages
        server.averageResponseTime = (
            (server.averageResponseTime * (server.totalRequests - 1)) + result.responseTime
        ) / server.totalRequests;
        
        server.errorRate = (server.failedRequests / server.totalRequests) * 100;
        
        // Update metrics history
        metrics.responseTimeHistory.push({
            timestamp: result.timestamp,
            responseTime: result.responseTime
        });
        
        if (!result.success) {
            metrics.errorHistory.push({
                timestamp: result.timestamp,
                error: result.error
            });
        }
        
        // Keep history limited
        if (metrics.responseTimeHistory.length > 1000) {
            metrics.responseTimeHistory = metrics.responseTimeHistory.slice(-1000);
        }
        
        if (metrics.errorHistory.length > 100) {
            metrics.errorHistory = metrics.errorHistory.slice(-100);
        }
        
        // Recalculate derived metrics
        this.recalculateMetrics(serverId);
    }

    recalculateMetrics(serverId) {
        const server = this.mcpServers.get(serverId);
        const metrics = this.performanceMetrics.get(serverId);
        
        if (!server || !metrics) return;
        
        // Success rate (last 100 requests)
        const recentRequests = Math.min(100, server.totalRequests);
        const recentSuccesses = Math.max(0, server.successfulRequests - 
            Math.max(0, server.totalRequests - recentRequests));
        metrics.successRate = recentRequests > 0 ? (recentSuccesses / recentRequests) * 100 : 100;
        
        // Reliability (based on error frequency)
        const recentErrors = metrics.errorHistory.filter(error => 
            Date.now() - error.timestamp < 3600000 // Last hour
        ).length;
        metrics.reliability = Math.max(0, 100 - (recentErrors * 10));
        
        // Efficiency (based on response time)
        const recentResponseTimes = metrics.responseTimeHistory
            .filter(rt => Date.now() - rt.timestamp < 3600000)
            .map(rt => rt.responseTime);
        
        if (recentResponseTimes.length > 0) {
            const avgResponseTime = recentResponseTimes.reduce((a, b) => a + b, 0) / recentResponseTimes.length;
            metrics.efficiency = Math.max(0, 100 - (avgResponseTime / 100)); // Normalize to 0-100
        }
    }

    async recordRoutingDecision(decision) {
        this.routingHistory.push({
            timestamp: Date.now(),
            requestType: decision.request.type,
            requirements: decision.requirements,
            candidateCount: decision.candidateServers.length,
            selectedServer: decision.selectedServer.id,
            success: decision.success,
            responseTime: decision.responseTime,
            strategy: decision.requirements.strategy
        });
        
        // Keep history limited
        if (this.routingHistory.length > 10000) {
            this.routingHistory = this.routingHistory.slice(-10000);
        }
        
        // Learn from the decision
        await this.learningEngine.recordDecision(decision);
    }

    async tryFallbackRouting(request, originalError) {
        console.log('🔄 Attempting fallback routing...');
        
        try {
            // Try with relaxed requirements
            const relaxedRequirements = {
                requiredCapabilities: [], // Accept any server
                recommendedStrategy: 'load', // Use least loaded server
                priority: 'low',
                estimatedTimeout: 60000,
                retryable: false
            };
            
            const candidates = await this.findCandidateServers(relaxedRequirements);
            
            if (candidates.length > 0) {
                const fallbackServer = candidates[0].server;
                const result = await this.executeRequest(fallbackServer, request);
                
                return {
                    success: true,
                    result: result.data,
                    metadata: {
                        selectedServer: fallbackServer.id,
                        responseTime: result.responseTime,
                        routingStrategy: 'fallback',
                        originalError: originalError.message,
                        confidence: 0.5
                    }
                };
            }
        } catch (fallbackError) {
            console.error('❌ Fallback routing also failed:', fallbackError.message);
        }
        
        return null;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Management and Monitoring Methods
    getServerStatus() {
        const status = {};
        
        for (const [serverId, server] of this.mcpServers) {
            const metrics = this.performanceMetrics.get(serverId);
            
            status[serverId] = {
                name: server.name,
                status: server.status,
                currentLoad: server.currentLoad,
                maxConcurrency: server.maxConcurrency,
                totalRequests: server.totalRequests,
                successRate: metrics ? metrics.successRate.toFixed(1) + '%' : 'N/A',
                averageResponseTime: server.averageResponseTime.toFixed(0) + 'ms',
                errorRate: server.errorRate.toFixed(1) + '%',
                capabilities: this.serverCapabilities.get(serverId) || [],
                lastHealthCheck: server.lastHealthCheck
            };
        }
        
        return status;
    }

    getRoutingStatistics() {
        const stats = {
            totalRequests: this.routingHistory.length,
            successfulRoutes: this.routingHistory.filter(r => r.success).length,
            averageResponseTime: 0,
            strategyUsage: {},
            serverUsage: {},
            errorRate: 0
        };
        
        if (this.routingHistory.length > 0) {
            // Calculate averages
            stats.averageResponseTime = this.routingHistory.reduce((sum, r) => sum + r.responseTime, 0) / this.routingHistory.length;
            stats.errorRate = ((this.routingHistory.length - stats.successfulRoutes) / this.routingHistory.length) * 100;
            
            // Strategy usage
            for (const record of this.routingHistory) {
                stats.strategyUsage[record.strategy] = (stats.strategyUsage[record.strategy] || 0) + 1;
                stats.serverUsage[record.selectedServer] = (stats.serverUsage[record.selectedServer] || 0) + 1;
            }
        }
        
        return stats;
    }

    async savePerformanceHistory() {
        try {
            const historyPath = path.join(__dirname, 'data', 'mcp-performance-history.json');
            const historyData = Object.fromEntries(this.performanceMetrics);
            
            await fs.mkdir(path.dirname(historyPath), { recursive: true });
            await fs.writeFile(historyPath, JSON.stringify(historyData, null, 2));
            
            console.log('💾 Saved performance history');
        } catch (error) {
            console.error('❌ Failed to save performance history:', error.message);
        }
    }
}

// Supporting Classes
class RoutingLearningEngine {
    constructor() {
        this.decisionHistory = [];
        this.patterns = new Map();
    }

    async recordDecision(decision) {
        this.decisionHistory.push({
            timestamp: Date.now(),
            requestPattern: this.extractRequestPattern(decision.request),
            selectedServer: decision.selectedServer.id,
            success: decision.success,
            responseTime: decision.responseTime,
            strategy: decision.requirements.strategy
        });
        
        await this.updatePatterns(decision);
    }

    extractRequestPattern(request) {
        return {
            type: request.type,
            dataSize: JSON.stringify(request.data || {}).length,
            hasUserContext: !!request.userContext,
            complexity: this.estimateComplexity(request)
        };
    }

    estimateComplexity(request) {
        // Simple complexity estimation
        const dataStr = JSON.stringify(request.data || {});
        if (dataStr.length > 10000) return 'high';
        if (dataStr.length > 1000) return 'medium';
        return 'low';
    }

    async updatePatterns(decision) {
        const pattern = this.extractRequestPattern(decision.request);
        const key = `${pattern.type}_${pattern.complexity}`;
        
        if (!this.patterns.has(key)) {
            this.patterns.set(key, {
                count: 0,
                successfulServers: new Map(),
                averageResponseTime: 0,
                bestStrategy: null
            });
        }
        
        const patternData = this.patterns.get(key);
        patternData.count++;
        
        if (decision.success) {
            const serverCount = patternData.successfulServers.get(decision.selectedServer.id) || 0;
            patternData.successfulServers.set(decision.selectedServer.id, serverCount + 1);
        }
        
        // Update average response time
        patternData.averageResponseTime = (
            (patternData.averageResponseTime * (patternData.count - 1)) + decision.responseTime
        ) / patternData.count;
    }

    getBestServerForPattern(requestPattern) {
        const key = `${requestPattern.type}_${requestPattern.complexity}`;
        const patternData = this.patterns.get(key);
        
        if (!patternData || patternData.successfulServers.size === 0) {
            return null;
        }
        
        // Find server with highest success rate for this pattern
        let bestServer = null;
        let bestSuccessRate = 0;
        
        for (const [serverId, successCount] of patternData.successfulServers) {
            const successRate = successCount / patternData.count;
            if (successRate > bestSuccessRate) {
                bestSuccessRate = successRate;
                bestServer = serverId;
            }
        }
        
        return { serverId: bestServer, confidence: bestSuccessRate };
    }
}

class IntelligentLoadBalancer {
    constructor() {
        this.algorithms = {
            'round-robin': new RoundRobinBalancer(),
            'least-connections': new LeastConnectionsBalancer(),
            'weighted-response-time': new WeightedResponseTimeBalancer(),
            'adaptive': new AdaptiveBalancer()
        };
    }

    balance(servers, algorithm = 'adaptive') {
        const balancer = this.algorithms[algorithm] || this.algorithms['adaptive'];
        return balancer.selectServer(servers);
    }
}

class MCPHealthMonitor {
    async checkServerHealth(server) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${server.endpoint}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                server.status = 'healthy';
                server.lastHealthCheck = Date.now();
                return { healthy: true, responseTime };
            } else {
                server.status = 'unhealthy';
                return { healthy: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            server.status = 'unreachable';
            return { healthy: false, error: error.message };
        }
    }
}

// Routing Strategy Classes
class PerformanceBasedRouting {
    async selectServer(candidates, requirements, request, context) {
        // Select server with best performance metrics
        return candidates.reduce((best, current) => {
            const bestScore = this.calculatePerformanceScore(best.metrics);
            const currentScore = this.calculatePerformanceScore(current.metrics);
            return currentScore > bestScore ? current : best;
        });
    }

    calculatePerformanceScore(metrics) {
        if (!metrics) return 0;
        return (metrics.successRate * 0.4) + (metrics.reliability * 0.3) + (metrics.efficiency * 0.3);
    }
}

class CapabilityBasedRouting {
    async selectServer(candidates, requirements, request, context) {
        // Select server with best capability match
        return candidates.reduce((best, current) => {
            const bestMatch = this.calculateCapabilityMatch(best.capabilities, requirements.requiredCapabilities);
            const currentMatch = this.calculateCapabilityMatch(current.capabilities, requirements.requiredCapabilities);
            return currentMatch > bestMatch ? current : best;
        });
    }

    calculateCapabilityMatch(serverCapabilities, requiredCapabilities) {
        if (requiredCapabilities.length === 0) return 1;
        
        const matches = requiredCapabilities.filter(req => 
            serverCapabilities && serverCapabilities.some(cap => cap && req && cap.toLowerCase().includes(req.toLowerCase()))
        ).length;
        
        return matches / requiredCapabilities.length;
    }
}

class LoadBasedRouting {
    async selectServer(candidates, requirements, request, context) {
        // Select server with lowest load
        return candidates.reduce((best, current) => {
            const bestLoad = best.server.currentLoad / best.server.maxConcurrency;
            const currentLoad = current.server.currentLoad / current.server.maxConcurrency;
            return currentLoad < bestLoad ? current : best;
        });
    }
}

class AIBasedRouting {
    async selectServer(candidates, requirements, request, context) {
        // Use AI to make routing decision
        const aiRequest = {
            task: 'server-selection',
            prompt: this.buildSelectionPrompt(candidates, requirements, request),
            context: {
                candidates: candidates.map(c => ({
                    id: c.server.id,
                    name: c.server.name,
                    suitabilityScore: c.suitabilityScore,
                    currentLoad: c.server.currentLoad,
                    capabilities: c.capabilities,
                    metrics: c.metrics
                })),
                requirements,
                requestType: request.type
            }
        };
        
        try {
            const result = await context.multiModelAI.processRequest(aiRequest);
            
            if (result.success) {
                const selection = this.parseAISelection(result.response, candidates);
                if (selection) {
                    return selection;
                }
            }
        } catch (error) {
            console.warn('⚠️ AI-based routing failed, falling back to performance-based:', error.message);
        }
        
        // Fallback to performance-based routing
        const performanceRouting = new PerformanceBasedRouting();
        return await performanceRouting.selectServer(candidates, requirements, request, context);
    }

    buildSelectionPrompt(candidates, requirements, request) {
        return `Select the optimal MCP server for the following request:

**Request:** ${request.type}
**Requirements:** ${JSON.stringify(requirements, null, 2)}

**Candidate Servers:**
${candidates.map((c, i) => 
    `${i + 1}. ${c.server.name} (${c.server.id})\n` +
    `   - Suitability Score: ${c.suitabilityScore.toFixed(1)}\n` +
    `   - Current Load: ${c.server.currentLoad}/${c.server.maxConcurrency}\n` +
    `   - Success Rate: ${c.metrics?.successRate?.toFixed(1) || 'N/A'}%\n` +
    `   - Avg Response Time: ${c.server.averageResponseTime.toFixed(0)}ms\n` +
    `   - Capabilities: ${c.capabilities.join(', ')}`
).join('\n\n')}

Consider:
1. Server performance and reliability
2. Current load and capacity
3. Capability match with requirements
4. Response time expectations
5. Request priority and urgency

Return the index (1-based) of the best server with a brief explanation.`;
    }

    parseAISelection(response, candidates) {
        // Try to extract server index from AI response
        const indexMatch = response.match(/(?:server\s*)?(?:index\s*)?(?:#\s*)?(\d+)/i);
        
        if (indexMatch) {
            const index = parseInt(indexMatch[1]) - 1; // Convert to 0-based
            if (index >= 0 && index < candidates.length) {
                return candidates[index];
            }
        }
        
        // Try to match by server name or ID
        for (const candidate of candidates) {
            if (response && candidate && candidate.server && (
                (candidate.server.name && response.toLowerCase().includes(candidate.server.name.toLowerCase())) ||
                (candidate.server.id && response.toLowerCase().includes(candidate.server.id.toLowerCase()))
            )) {
                return candidate;
            }
        }
        
        return null;
    }
}

class HybridRouting {
    async selectServer(candidates, requirements, request, context) {
        // Combine multiple routing strategies
        const strategies = {
            performance: new PerformanceBasedRouting(),
            capability: new CapabilityBasedRouting(),
            load: new LoadBasedRouting()
        };
        
        const scores = new Map();
        
        // Get scores from each strategy
        for (const [name, strategy] of Object.entries(strategies)) {
            try {
                const selected = await strategy.selectServer(candidates, requirements, request, context);
                const serverId = selected.server.id;
                
                if (!scores.has(serverId)) {
                    scores.set(serverId, { candidate: selected, strategyScores: {} });
                }
                
                scores.get(serverId).strategyScores[name] = 1; // Winner gets 1 point
            } catch (error) {
                console.warn(`⚠️ Strategy ${name} failed:`, error.message);
            }
        }
        
        // Calculate weighted scores
        const weights = {
            performance: 0.4,
            capability: 0.3,
            load: 0.3
        };
        
        let bestCandidate = null;
        let bestScore = -1;
        
        for (const [serverId, data] of scores) {
            let totalScore = 0;
            
            for (const [strategy, weight] of Object.entries(weights)) {
                totalScore += (data.strategyScores[strategy] || 0) * weight;
            }
            
            // Add base suitability score
            totalScore += data.candidate.suitabilityScore * 0.01;
            
            if (totalScore > bestScore) {
                bestScore = totalScore;
                bestCandidate = data.candidate;
            }
        }
        
        return bestCandidate || candidates[0]; // Fallback to first candidate
    }
}

// Simple load balancer implementations
class RoundRobinBalancer {
    constructor() {
        this.currentIndex = 0;
    }

    selectServer(servers) {
        if (servers.length === 0) return null;
        
        const server = servers[this.currentIndex % servers.length];
        this.currentIndex++;
        return server;
    }
}

class LeastConnectionsBalancer {
    selectServer(servers) {
        if (servers.length === 0) return null;
        
        return servers.reduce((least, current) => 
            current.server.currentLoad < least.server.currentLoad ? current : least
        );
    }
}

class WeightedResponseTimeBalancer {
    selectServer(servers) {
        if (servers.length === 0) return null;
        
        return servers.reduce((best, current) => {
            const bestWeight = this.calculateWeight(best.server);
            const currentWeight = this.calculateWeight(current.server);
            return currentWeight > bestWeight ? current : best;
        });
    }

    calculateWeight(server) {
        // Higher weight = better server (lower response time, lower load)
        const loadFactor = 1 - (server.currentLoad / server.maxConcurrency);
        const responseFactor = server.averageResponseTime > 0 ? 1000 / server.averageResponseTime : 1;
        return loadFactor * responseFactor;
    }
}

class AdaptiveBalancer {
    selectServer(servers) {
        // Adaptive algorithm that considers multiple factors
        return servers.reduce((best, current) => {
            const bestScore = this.calculateAdaptiveScore(best.server, best.metrics);
            const currentScore = this.calculateAdaptiveScore(current.server, current.metrics);
            return currentScore > bestScore ? current : best;
        });
    }

    calculateAdaptiveScore(server, metrics) {
        const loadScore = 1 - (server.currentLoad / server.maxConcurrency);
        const responseScore = server.averageResponseTime > 0 ? 1000 / server.averageResponseTime : 1;
        const reliabilityScore = metrics ? metrics.reliability / 100 : 0.5;
        const successScore = metrics ? metrics.successRate / 100 : 0.5;
        
        return (loadScore * 0.3) + (responseScore * 0.2) + (reliabilityScore * 0.25) + (successScore * 0.25);
    }
}

module.exports = {
    IntelligentMCPRouter,
    RoutingLearningEngine,
    IntelligentLoadBalancer,
    MCPHealthMonitor
};

// Example usage
if (require.main === module) {
    const router = new IntelligentMCPRouter();
    
    router.on('router-ready', async () => {
        console.log('🎉 Intelligent MCP Router ready!');
        
        // Example routing request
        const request = {
            type: 'ai-request',
            method: 'code-completion',
            data: {
                code: 'function calculateSum(a, b) {',
                language: 'javascript',
                context: 'math utility function'
            },
            userContext: {
                userId: 'user123',
                preferences: { style: 'functional' }
            }
        };
        
        try {
            const result = await router.routeRequest(request);
            console.log('✅ Routing result:', result);
            
            console.log('📊 Server status:', router.getServerStatus());
            console.log('📈 Routing statistics:', router.getRoutingStatistics());
        } catch (error) {
            console.error('❌ Routing failed:', error.message);
        }
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('🛑 Shutting down Intelligent MCP Router...');
        await router.savePerformanceHistory();
        process.exit(0);
    });
}