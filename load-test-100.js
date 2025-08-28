#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

class LoadTester {
    constructor() {
        this.loadBalancerUrl = 'http://localhost:8080';
        this.requestsPerServer = 100;
        this.concurrentRequests = 10;
        this.results = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            responseTimes: [],
            errors: []
        };
    }

    async getServerStats() {
        try {
            const response = await axios.get(`${this.loadBalancerUrl}/stats`);
            return response.data;
        } catch (error) {
            console.error('Failed to get server stats:', error.message);
            return null;
        }
    }

    async sendRequest(requestId) {
        const startTime = performance.now();
        try {
            const response = await axios.get(`${this.loadBalancerUrl}/health`, {
                timeout: 5000,
                headers: {
                    'X-Request-ID': `load-test-${requestId}`,
                    'User-Agent': 'MCP-Load-Tester/1.0'
                }
            });
            
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.results.successfulRequests++;
            this.results.responseTimes.push(responseTime);
            this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
            this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);
            
            return {
                success: true,
                responseTime,
                status: response.status,
                requestId
            };
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.results.failedRequests++;
            this.results.errors.push({
                requestId,
                error: error.message,
                responseTime
            });
            
            return {
                success: false,
                error: error.message,
                responseTime,
                requestId
            };
        }
    }

    async runConcurrentRequests(requestCount) {
        const promises = [];
        
        for (let i = 0; i < requestCount; i++) {
            promises.push(this.sendRequest(i + 1));
            
            // Add small delay between requests to avoid overwhelming
            if (i % this.concurrentRequests === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        return Promise.all(promises);
    }

    calculateStats() {
        if (this.results.responseTimes.length > 0) {
            this.results.averageResponseTime = 
                this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
        }
        
        // Calculate percentiles
        const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
        const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
        const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
        const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
        
        return {
            ...this.results,
            p50ResponseTime: p50,
            p95ResponseTime: p95,
            p99ResponseTime: p99
        };
    }

    async runLoadTest() {
        console.log('🚀 Starting MCP Load Balancer Load Test');
        console.log('=' .repeat(50));
        
        // Get initial server stats
        const initialStats = await this.getServerStats();
        if (!initialStats) {
            console.error('❌ Cannot connect to load balancer');
            return;
        }
        
        console.log(`📊 Initial Stats:`);
        console.log(`   - Active Servers: ${initialStats.servers?.total || 0}`);
        console.log(`   - Healthy Servers: ${initialStats.servers?.healthy || 0}`);
        console.log(`   - Load Balancer Uptime: ${Math.floor((initialStats.loadBalancer?.uptime || 0) / 60)} minutes`);
        console.log('');
        
        const totalRequests = (initialStats.servers?.total || 1) * this.requestsPerServer;
        this.results.totalRequests = totalRequests;
        
        console.log(`🎯 Test Configuration:`);
        console.log(`   - Requests per Server: ${this.requestsPerServer}`);
        console.log(`   - Total Requests: ${totalRequests}`);
        console.log(`   - Concurrent Requests: ${this.concurrentRequests}`);
        console.log('');
        
        console.log('⏳ Running load test...');
        const startTime = performance.now();
        
        try {
            await this.runConcurrentRequests(totalRequests);
        } catch (error) {
            console.error('❌ Load test failed:', error.message);
            return;
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        // Calculate final stats
        const finalStats = this.calculateStats();
        
        // Get final server stats
        const finalServerStats = await this.getServerStats();
        
        console.log('');
        console.log('📈 Load Test Results');
        console.log('=' .repeat(50));
        console.log(`⏱️  Total Test Time: ${(totalTime / 1000).toFixed(2)} seconds`);
        console.log(`📊 Request Statistics:`);
        console.log(`   - Total Requests: ${finalStats.totalRequests}`);
        console.log(`   - Successful: ${finalStats.successfulRequests} (${((finalStats.successfulRequests / finalStats.totalRequests) * 100).toFixed(2)}%)`);
        console.log(`   - Failed: ${finalStats.failedRequests} (${((finalStats.failedRequests / finalStats.totalRequests) * 100).toFixed(2)}%)`);
        console.log(`   - Requests/sec: ${(finalStats.totalRequests / (totalTime / 1000)).toFixed(2)}`);
        console.log('');
        
        console.log(`⚡ Response Time Statistics:`);
        console.log(`   - Average: ${finalStats.averageResponseTime.toFixed(2)}ms`);
        console.log(`   - Min: ${finalStats.minResponseTime.toFixed(2)}ms`);
        console.log(`   - Max: ${finalStats.maxResponseTime.toFixed(2)}ms`);
        console.log(`   - 50th percentile: ${(finalStats.p50ResponseTime || 0).toFixed(2)}ms`);
        console.log(`   - 95th percentile: ${(finalStats.p95ResponseTime || 0).toFixed(2)}ms`);
        console.log(`   - 99th percentile: ${(finalStats.p99ResponseTime || 0).toFixed(2)}ms`);
        console.log('');
        
        if (finalServerStats) {
            console.log(`🔄 Load Balancer Final Stats:`);
            console.log(`   - Total Requests Handled: ${finalServerStats.loadBalancer?.totalRequests || 0}`);
            console.log(`   - Error Count: ${finalServerStats.loadBalancer?.errorCount || 0}`);
            console.log(`   - Error Rate: ${finalServerStats.loadBalancer?.errorRate || '0.00%'}`);
        }
        
        if (finalStats.errors.length > 0) {
            console.log('');
            console.log(`❌ Error Summary (${finalStats.errors.length} errors):`);
            const errorCounts = {};
            finalStats.errors.forEach(error => {
                errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
            });
            
            Object.entries(errorCounts).forEach(([error, count]) => {
                console.log(`   - ${error}: ${count} occurrences`);
            });
        }
        
        console.log('');
        console.log('✅ Load test completed!');
        
        // Performance recommendations
        if (finalStats.averageResponseTime > 1000) {
            console.log('⚠️  High average response time detected. Consider optimizing server performance.');
        }
        
        if (finalStats.failedRequests / finalStats.totalRequests > 0.05) {
            console.log('⚠️  High error rate detected. Check server health and capacity.');
        }
        
        if ((finalStats.totalRequests / (totalTime / 1000)) < 50) {
            console.log('⚠️  Low throughput detected. Consider increasing server capacity.');
        }
    }
}

// Add useful MCP servers configuration
const usefulMCPServers = [
    {
        name: 'database-server',
        type: 'database',
        description: 'Database operations and SQL queries',
        port: 4001,
        capabilities: ['read', 'write', 'query', 'schema']
    },
    {
        name: 'file-operations-server',
        type: 'filesystem',
        description: 'Advanced file operations and management',
        port: 4002,
        capabilities: ['read', 'write', 'search', 'backup']
    },
    {
        name: 'api-gateway-server',
        type: 'api',
        description: 'API gateway and routing services',
        port: 4003,
        capabilities: ['routing', 'authentication', 'rate-limiting']
    },
    {
        name: 'cache-server',
        type: 'cache',
        description: 'Caching and performance optimization',
        port: 4004,
        capabilities: ['cache', 'invalidate', 'statistics']
    },
    {
        name: 'notification-server',
        type: 'notification',
        description: 'Push notifications and messaging',
        port: 4005,
        capabilities: ['push', 'email', 'sms', 'webhook']
    },
    {
        name: 'analytics-server',
        type: 'analytics',
        description: 'Data analytics and reporting',
        port: 4006,
        capabilities: ['collect', 'analyze', 'report', 'visualize']
    },
    {
        name: 'security-server',
        type: 'security',
        description: 'Security scanning and validation',
        port: 4007,
        capabilities: ['scan', 'validate', 'encrypt', 'audit']
    },
    {
        name: 'workflow-server',
        type: 'workflow',
        description: 'Workflow automation and orchestration',
        port: 4008,
        capabilities: ['orchestrate', 'schedule', 'monitor', 'retry']
    },
    {
        name: 'search-server',
        type: 'search',
        description: 'Full-text search and indexing',
        port: 4009,
        capabilities: ['index', 'search', 'suggest', 'facet']
    },
    {
        name: 'monitoring-server',
        type: 'monitoring',
        description: 'System monitoring and alerting',
        port: 4010,
        capabilities: ['monitor', 'alert', 'dashboard', 'metrics']
    }
];

async function addUsefulServers() {
    console.log('\n🔧 Adding Useful MCP Servers');
    console.log('=' .repeat(50));
    
    for (const server of usefulMCPServers) {
        console.log(`📦 Adding ${server.name} (${server.type}) on port ${server.port}`);
        console.log(`   Description: ${server.description}`);
        console.log(`   Capabilities: ${server.capabilities.join(', ')}`);
        
        // Here you would typically register the server with the coordinator
        // For now, we'll just log the configuration
    }
    
    console.log('\n✅ Useful MCP servers configuration ready!');
    console.log('💡 To activate these servers, integrate them with your MCP Coordinator.');
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--add-servers')) {
        await addUsefulServers();
        return;
    }
    
    if (args.includes('--help')) {
        console.log('MCP Load Balancer Load Tester');
        console.log('Usage:');
        console.log('  node load-test-100.js           - Run load test');
        console.log('  node load-test-100.js --add-servers - Show useful MCP servers');
        console.log('  node load-test-100.js --help    - Show this help');
        return;
    }
    
    const tester = new LoadTester();
    await tester.runLoadTest();
    
    // Also show useful servers info
    await addUsefulServers();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { LoadTester, usefulMCPServers };