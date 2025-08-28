#!/usr/bin/env node

const express = require('express');
const axios = require('axios');
const { performance } = require('perf_hooks');

class DistributedLoadBalancer {
    constructor() {
        this.coordinatorUrl = 'http://localhost:3000';
        this.loadBalancers = [];
        this.serversPerBalancer = 100;
        this.totalServers = 500;
        this.basePort = 8080;
        this.stats = {
            totalRequests: 0,
            totalErrors: 0,
            startTime: Date.now()
        };
    }

    // สร้าง Load Balancer แต่ละตัว
    createLoadBalancer(balancerId, port, assignedServers) {
        const app = express();
        const balancer = {
            id: balancerId,
            port: port,
            servers: assignedServers,
            healthyServers: [],
            currentIndex: 0,
            stats: {
                requests: 0,
                errors: 0,
                uptime: Date.now()
            }
        };

        // Middleware สำหรับ logging
        app.use((req, res, next) => {
            balancer.stats.requests++;
            this.stats.totalRequests++;
            console.log(`[LB-${balancerId}] ${req.method} ${req.path} - Request #${balancer.stats.requests}`);
            next();
        });

        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                balancer_id: balancerId,
                port: port,
                servers: {
                    total: balancer.servers.length,
                    healthy: balancer.healthyServers.length
                },
                stats: {
                    requests: balancer.stats.requests,
                    errors: balancer.stats.errors,
                    uptime: Date.now() - balancer.stats.uptime
                }
            });
        });

        // Stats endpoint
        app.get('/stats', (req, res) => {
            res.json({
                loadBalancer: {
                    id: balancerId,
                    port: port,
                    uptime: Date.now() - balancer.stats.uptime,
                    totalRequests: balancer.stats.requests,
                    errorCount: balancer.stats.errors,
                    errorRate: balancer.stats.requests > 0 ? 
                        ((balancer.stats.errors / balancer.stats.requests) * 100).toFixed(2) + '%' : '0.00%'
                },
                servers: {
                    total: balancer.servers.length,
                    healthy: balancer.healthyServers.length,
                    assigned: balancer.servers.map(server => ({
                        name: server.name,
                        port: server.port,
                        status: server.status
                    }))
                }
            });
        });

        // Refresh servers from coordinator
        app.post('/refresh', async (req, res) => {
            try {
                const response = await axios.get(`${this.coordinatorUrl}/servers`);
                const allServers = this.parseServersResponse(response.data);
                
                // กรอง servers ที่ได้รับมอบหมาย
                const assignedServerNames = balancer.servers.map(s => s.name);
                balancer.healthyServers = allServers.filter(server => 
                    assignedServerNames.includes(server.name) && 
                    ['running', 'active', 'deploying'].includes(server.status)
                );
                
                console.log(`[LB-${balancerId}] Refreshed: ${balancer.healthyServers.length} healthy servers`);
                res.json({ 
                    refreshed: balancer.healthyServers.length,
                    balancer_id: balancerId
                });
            } catch (error) {
                console.error(`[LB-${balancerId}] Refresh error:`, error.message);
                balancer.stats.errors++;
                this.stats.totalErrors++;
                res.status(500).json({ error: 'Refresh failed', balancer_id: balancerId });
            }
        });

        // Proxy requests to servers
        app.use('*', async (req, res) => {
            if (balancer.healthyServers.length === 0) {
                balancer.stats.errors++;
                this.stats.totalErrors++;
                return res.status(503).json({ 
                    error: 'No healthy servers available',
                    balancer_id: balancerId
                });
            }

            // Round-robin load balancing
            const server = balancer.healthyServers[balancer.currentIndex];
            balancer.currentIndex = (balancer.currentIndex + 1) % balancer.healthyServers.length;

            try {
                const targetUrl = `http://localhost:${server.port}${req.originalUrl}`;
                const proxyResponse = await axios({
                    method: req.method,
                    url: targetUrl,
                    data: req.body,
                    headers: {
                        ...req.headers,
                        'X-Forwarded-For': req.ip,
                        'X-Load-Balancer': `LB-${balancerId}`
                    },
                    timeout: 5000
                });

                res.status(proxyResponse.status).json(proxyResponse.data);
            } catch (error) {
                console.error(`[LB-${balancerId}] Proxy error to ${server.name}:`, error.message);
                balancer.stats.errors++;
                this.stats.totalErrors++;
                res.status(502).json({ 
                    error: 'Bad Gateway',
                    server: server.name,
                    balancer_id: balancerId
                });
            }
        });

        return { app, balancer };
    }

    // แยก servers response จาก coordinator
    parseServersResponse(data) {
        console.log('🔍 Parsing coordinator response structure');
        console.log('📊 Full response:', JSON.stringify(data, null, 2));
        
        if (!data || !data.data) {
            console.log('❌ Invalid response structure from coordinator');
            return [];
        }

        console.log('📊 Data structure:', JSON.stringify(data.data, null, 2));
        const servers = [];
        
        // ตรวจสอบ structure ของ response
        if (data.data.content && Array.isArray(data.data.content)) {
            console.log(`📋 Found content array with ${data.data.content.length} items`);
            // กรณีที่ content เป็น array ของ objects
            for (const item of data.data.content) {
                console.log('📋 Processing item type:', item.type);
                
                if (item && item.text && typeof item.text === 'string') {
                    console.log('📋 Found text content, processing lines...');
                    const lines = item.text.split('\n');
                    console.log(`📋 Split into ${lines.length} lines`);
                    
                    for (const line of lines) {
                        if (line.trim()) {
                            const parsed = this.parseServerLine(line.trim());
                            if (parsed) {
                                servers.push(parsed);
                            }
                        }
                    }
                } else if (item && item.content && Array.isArray(item.content)) {
                    console.log(`📋 Found nested content array with ${item.content.length} lines`);
                    // วนลูปผ่าน content ภายใน
                    for (const serverLine of item.content) {
                        if (typeof serverLine === 'string') {
                            console.log('📋 Processing line:', serverLine);
                            const parsed = this.parseServerLine(serverLine);
                            if (parsed) {
                                servers.push(parsed);
                            }
                        }
                    }
                }
            }
        } else if (data.data.content && typeof data.data.content === 'string') {
            console.log('📋 Found content string');
            // กรณีที่ content เป็น string
            const lines = data.data.content.split('\n');
            for (const line of lines) {
                const parsed = this.parseServerLine(line);
                if (parsed) {
                    servers.push(parsed);
                }
            }
        } else {
            console.log('❌ Unexpected content structure:', typeof data.data.content);
        }

        console.log(`📈 Successfully parsed ${servers.length} servers`);
        return servers;
    }

    // แยกข้อมูล server จากแต่ละบรรทัด
    parseServerLine(line) {
        if (!line || typeof line !== 'string') {
            return null;
        }

        console.log(`🔍 Trying to parse line: "${line}"`);
        
        // รูปแบบ: - filesystem-3150 (filesystem:3150) - deploying
        // ลองหลาย pattern
        const patterns = [
            /^-\s+([\w-]+)\s+\(([\w-]+):(\d+)\)\s+-\s+(\w+)/, // เดิม
            /-\s+([\w-]+)\s+\(([\w-]+):(\d+)\)\s+-\s+(\w+)/, // ไม่ต้อง ^ 
            /([\w-]+)\s+\(([\w-]+):(\d+)\)\s+-\s+(\w+)/, // ไม่มี - ข้างหน้า
            /([\w-]+)-(\d+)\s+\(([\w-]+):(\d+)\)\s+-\s+(\w+)/ // รูปแบบที่ซับซ้อนขึ้น
        ];
        
        for (let i = 0; i < patterns.length; i++) {
            const match = line.match(patterns[i]);
            if (match) {
                console.log(`✅ Pattern ${i} matched:`, match);
                
                let serverName, serverType, port, status;
                
                if (patterns[i] === patterns[3]) {
                    // รูปแบบพิเศษ
                    serverName = match[1] + '-' + match[2];
                    serverType = match[3];
                    port = parseInt(match[4]);
                    status = match[5];
                } else {
                    serverName = match[1];
                    serverType = match[2];
                    port = parseInt(match[3]);
                    status = match[4];
                }
                
                console.log(`✅ Parsed server: ${serverName} (${serverType}) on port ${port} - ${status}`);
                
                return {
                    name: serverName,
                    type: serverType,
                    id: `${serverType}-${port}`,
                    port: port,
                    status: status
                };
            }
        }
        
        console.log(`❌ No pattern matched for line: "${line}"`);
        return null;
    }

    // กระจาย servers ให้กับ load balancers
    async distributeServers() {
        try {
            console.log('🔍 Getting servers from coordinator...');
            const response = await axios.get(`${this.coordinatorUrl}/servers`);
            const allServers = this.parseServersResponse(response.data);
            
            if (allServers.length === 0) {
                throw new Error('No servers available from coordinator');
            }

            console.log(`📊 Found ${allServers.length} servers from coordinator`);
            
            // ถ้า servers น้อยกว่าที่ต้องการ ให้สร้าง mock servers เพิ่ม
            let serversToUse = allServers.slice();
            if (serversToUse.length < this.totalServers) {
                const additionalServers = this.totalServers - serversToUse.length;
                console.log(`🔧 Creating ${additionalServers} additional mock servers...`);
                
                for (let i = 0; i < additionalServers; i++) {
                    const port = 4000 + i;
                    serversToUse.push({
                        name: `mock-server-${port}`,
                        type: 'mock',
                        id: `mock-${port}`,
                        port: port,
                        status: 'running'
                    });
                }
            }
            
            const numberOfBalancers = Math.ceil(serversToUse.length / this.serversPerBalancer);
            
            console.log(`🎯 Target: ${this.totalServers} servers, Current: ${allServers.length} servers`);
            console.log(`🎯 Creating ${numberOfBalancers} load balancers for ${serversToUse.length} servers`);
            console.log(`📈 ${this.serversPerBalancer} servers per load balancer`);

            // แบ่ง servers ให้กับแต่ละ load balancer
            for (let i = 0; i < numberOfBalancers; i++) {
                const startIndex = i * this.serversPerBalancer;
                const endIndex = Math.min(startIndex + this.serversPerBalancer, serversToUse.length);
                const assignedServers = serversToUse.slice(startIndex, endIndex);
                const port = this.basePort + i;

                console.log(`🚀 Creating Load Balancer ${i + 1} on port ${port} with ${assignedServers.length} servers`);
                
                const { app, balancer } = this.createLoadBalancer(i + 1, port, assignedServers);
                
                // เริ่ม server
                const server = app.listen(port, () => {
                    console.log(`✅ Load Balancer ${i + 1} listening on port ${port}`);
                    console.log(`   Assigned servers: ${assignedServers.map(s => s.name).join(', ')}`);
                });

                this.loadBalancers.push({
                    ...balancer,
                    server: server,
                    app: app
                });

                // Refresh servers สำหรับ load balancer นี้
                setTimeout(async () => {
                    try {
                        await axios.post(`http://localhost:${port}/refresh`);
                        console.log(`🔄 Load Balancer ${i + 1} refreshed successfully`);
                    } catch (error) {
                        console.error(`❌ Failed to refresh Load Balancer ${i + 1}:`, error.message);
                    }
                }, 2000 + (i * 500)); // Stagger refreshes
            }

            return numberOfBalancers;
        } catch (error) {
            console.error('❌ Failed to distribute servers:', error.message);
            throw error;
        }
    }

    // สร้าง Master Load Balancer สำหรับกระจายไปยัง sub-balancers
    createMasterBalancer() {
        const app = express();
        const masterPort = 9000;
        let currentBalancerIndex = 0;

        app.use((req, res, next) => {
            console.log(`[MASTER] ${req.method} ${req.path}`);
            next();
        });

        // Health check
        app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                type: 'master_load_balancer',
                port: masterPort,
                sub_balancers: this.loadBalancers.length,
                total_servers: this.totalServers
            });
        });

        // Stats รวม
        app.get('/stats', async (req, res) => {
            const balancerStats = [];
            
            for (const lb of this.loadBalancers) {
                try {
                    const response = await axios.get(`http://localhost:${lb.port}/stats`);
                    balancerStats.push(response.data);
                } catch (error) {
                    balancerStats.push({ error: `Failed to get stats from LB-${lb.id}` });
                }
            }

            res.json({
                master: {
                    uptime: Date.now() - this.stats.startTime,
                    total_requests: this.stats.totalRequests,
                    total_errors: this.stats.totalErrors
                },
                load_balancers: balancerStats,
                summary: {
                    total_balancers: this.loadBalancers.length,
                    servers_per_balancer: this.serversPerBalancer,
                    total_servers: this.totalServers
                }
            });
        });

        // Proxy ไปยัง sub-balancers
        app.use('*', async (req, res) => {
            if (this.loadBalancers.length === 0) {
                return res.status(503).json({ error: 'No load balancers available' });
            }

            const targetBalancer = this.loadBalancers[currentBalancerIndex];
            currentBalancerIndex = (currentBalancerIndex + 1) % this.loadBalancers.length;

            try {
                const targetUrl = `http://localhost:${targetBalancer.port}${req.originalUrl}`;
                const proxyResponse = await axios({
                    method: req.method,
                    url: targetUrl,
                    data: req.body,
                    headers: {
                        ...req.headers,
                        'X-Master-Balancer': 'true'
                    },
                    timeout: 10000
                });

                res.status(proxyResponse.status).json(proxyResponse.data);
            } catch (error) {
                console.error(`[MASTER] Proxy error to LB-${targetBalancer.id}:`, error.message);
                res.status(502).json({ 
                    error: 'Bad Gateway',
                    target_balancer: targetBalancer.id
                });
            }
        });

        const server = app.listen(masterPort, () => {
            console.log(`🎯 Master Load Balancer listening on port ${masterPort}`);
            console.log(`📊 Managing ${this.loadBalancers.length} sub-balancers`);
        });

        return server;
    }

    // เริ่มระบบ distributed load balancing
    async start() {
        try {
            console.log('🚀 Starting Distributed Load Balancer System');
            console.log('=' .repeat(60));
            console.log(`📋 Configuration:`);
            console.log(`   - Total Servers: ${this.totalServers}`);
            console.log(`   - Servers per Load Balancer: ${this.serversPerBalancer}`);
            console.log(`   - Base Port: ${this.basePort}`);
            console.log(`   - Master Port: 9000`);
            console.log('');

            // กระจาย servers และสร้าง load balancers
            const numberOfBalancers = await this.distributeServers();
            
            // รอให้ load balancers เริ่มทำงาน
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // สร้าง master load balancer
            this.createMasterBalancer();
            
            console.log('');
            console.log('✅ Distributed Load Balancer System Started!');
            console.log('=' .repeat(60));
            console.log(`🎯 Master Load Balancer: http://localhost:9000`);
            console.log(`📊 Sub Load Balancers:`);
            
            for (const lb of this.loadBalancers) {
                console.log(`   - LB-${lb.id}: http://localhost:${lb.port} (${lb.servers.length} servers)`);
            }
            
            console.log('');
            console.log('🔗 API Endpoints:');
            console.log('   - Master Health: GET http://localhost:9000/health');
            console.log('   - Master Stats: GET http://localhost:9000/stats');
            console.log('   - Sub-LB Health: GET http://localhost:808X/health');
            console.log('   - Sub-LB Stats: GET http://localhost:808X/stats');
            
        } catch (error) {
            console.error('❌ Failed to start distributed load balancer:', error.message);
            process.exit(1);
        }
    }

    // หยุดระบบ
    async stop() {
        console.log('🛑 Stopping Distributed Load Balancer System...');
        
        for (const lb of this.loadBalancers) {
            if (lb.server) {
                lb.server.close();
                console.log(`✅ Stopped Load Balancer ${lb.id}`);
            }
        }
        
        console.log('✅ All load balancers stopped');
    }
}

// การใช้งาน
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help')) {
        console.log('Distributed Load Balancer System');
        console.log('Usage:');
        console.log('  node distributed-load-balancer.js                    - Start system');
        console.log('  node distributed-load-balancer.js --servers 300      - Set total servers');
        console.log('  node distributed-load-balancer.js --per-lb 50        - Set servers per LB');
        console.log('  node distributed-load-balancer.js --help             - Show help');
        return;
    }
    
    const distributor = new DistributedLoadBalancer();
    
    // กำหนดค่าจาก arguments
    const serversIndex = args.indexOf('--servers');
    if (serversIndex !== -1 && args[serversIndex + 1]) {
        distributor.totalServers = parseInt(args[serversIndex + 1]);
    }
    
    const perLbIndex = args.indexOf('--per-lb');
    if (perLbIndex !== -1 && args[perLbIndex + 1]) {
        distributor.serversPerBalancer = parseInt(args[perLbIndex + 1]);
    }
    
    // จัดการ graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await distributor.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        await distributor.stop();
        process.exit(0);
    });
    
    await distributor.start();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { DistributedLoadBalancer };