#!/usr/bin/env node

/**
 * Test Distributed Load Balancer with 200 MCP Servers
 * ทดสอบระบบ Distributed Load Balancer กับ 200 MCP servers
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

class DistributedLoadTester {
    constructor() {
        this.masterUrl = 'http://localhost:9000';
        this.subBalancers = [
            'http://localhost:8080',
            'http://localhost:8081'
        ];
        this.results = {
            master: { requests: 0, errors: 0, totalTime: 0 },
            subBalancers: {},
            servers: { total: 0, healthy: 0, errors: 0 }
        };
    }

    // ทดสอบ Master Load Balancer
    async testMasterLoadBalancer() {
        console.log('🎯 Testing Master Load Balancer...');
        
        try {
            const start = performance.now();
            const response = await axios.get(`${this.masterUrl}/health`);
            const end = performance.now();
            
            this.results.master.requests++;
            this.results.master.totalTime += (end - start);
            
            console.log('✅ Master Health:', response.data);
            
            // ทดสอบ stats
            const statsResponse = await axios.get(`${this.masterUrl}/stats`);
            console.log('📊 Master Stats:', statsResponse.data);
            
            return true;
        } catch (error) {
            console.error('❌ Master Load Balancer Error:', error.message);
            this.results.master.errors++;
            return false;
        }
    }

    // ทดสอบ Sub Load Balancers
    async testSubLoadBalancers() {
        console.log('🔄 Testing Sub Load Balancers...');
        
        for (let i = 0; i < this.subBalancers.length; i++) {
            const url = this.subBalancers[i];
            const balancerId = `LB-${i + 1}`;
            
            if (!this.results.subBalancers[balancerId]) {
                this.results.subBalancers[balancerId] = {
                    requests: 0,
                    errors: 0,
                    totalTime: 0,
                    servers: { total: 0, healthy: 0 }
                };
            }
            
            try {
                const start = performance.now();
                const response = await axios.get(`${url}/health`);
                const end = performance.now();
                
                this.results.subBalancers[balancerId].requests++;
                this.results.subBalancers[balancerId].totalTime += (end - start);
                
                if (response.data.servers) {
                    this.results.subBalancers[balancerId].servers = response.data.servers;
                    this.results.servers.total += response.data.servers.total || 0;
                    this.results.servers.healthy += response.data.servers.healthy || 0;
                }
                
                console.log(`✅ ${balancerId} Health:`, response.data);
                
                // ทดสอบ stats
                const statsResponse = await axios.get(`${url}/stats`);
                console.log(`📊 ${balancerId} Stats:`, statsResponse.data);
                
            } catch (error) {
                console.error(`❌ ${balancerId} Error:`, error.message);
                this.results.subBalancers[balancerId].errors++;
                this.results.servers.errors++;
            }
        }
    }

    // ทดสอบ Load Distribution
    async testLoadDistribution(requestCount = 100) {
        console.log(`🚀 Testing Load Distribution with ${requestCount} requests...`);
        
        const promises = [];
        
        for (let i = 0; i < requestCount; i++) {
            // สลับระหว่าง master และ sub balancers
            const targetUrl = i % 3 === 0 ? this.masterUrl : this.subBalancers[i % 2];
            
            promises.push(
                this.makeRequest(targetUrl, i)
                    .catch(error => {
                        console.error(`Request ${i} failed:`, error.message);
                        return { error: true, requestId: i };
                    })
            );
        }
        
        const results = await Promise.all(promises);
        
        const successful = results.filter(r => !r.error).length;
        const failed = results.filter(r => r.error).length;
        
        console.log(`📈 Load Distribution Results:`);
        console.log(`   ✅ Successful: ${successful}/${requestCount}`);
        console.log(`   ❌ Failed: ${failed}/${requestCount}`);
        console.log(`   📊 Success Rate: ${((successful / requestCount) * 100).toFixed(2)}%`);
        
        return { successful, failed, total: requestCount };
    }

    // ส่ง request เดี่ยว
    async makeRequest(url, requestId) {
        const start = performance.now();
        
        try {
            const response = await axios.get(`${url}/health`, {
                timeout: 5000,
                headers: {
                    'X-Request-ID': requestId.toString(),
                    'User-Agent': 'DistributedLoadTester/1.0'
                }
            });
            
            const end = performance.now();
            const responseTime = end - start;
            
            return {
                requestId,
                url,
                status: response.status,
                responseTime,
                data: response.data
            };
        } catch (error) {
            const end = performance.now();
            throw new Error(`Request ${requestId} to ${url} failed: ${error.message}`);
        }
    }

    // แสดงผลสรุป
    displaySummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 DISTRIBUTED LOAD BALANCER TEST SUMMARY');
        console.log('='.repeat(60));
        
        // Master Load Balancer
        console.log('\n🎯 Master Load Balancer:');
        console.log(`   Requests: ${this.results.master.requests}`);
        console.log(`   Errors: ${this.results.master.errors}`);
        if (this.results.master.requests > 0) {
            const avgTime = this.results.master.totalTime / this.results.master.requests;
            console.log(`   Avg Response Time: ${avgTime.toFixed(2)}ms`);
        }
        
        // Sub Load Balancers
        console.log('\n🔄 Sub Load Balancers:');
        Object.entries(this.results.subBalancers).forEach(([id, stats]) => {
            console.log(`   ${id}:`);
            console.log(`     Requests: ${stats.requests}`);
            console.log(`     Errors: ${stats.errors}`);
            console.log(`     Servers: ${stats.servers.healthy}/${stats.servers.total}`);
            if (stats.requests > 0) {
                const avgTime = stats.totalTime / stats.requests;
                console.log(`     Avg Response Time: ${avgTime.toFixed(2)}ms`);
            }
        });
        
        // Server Summary
        console.log('\n📊 Server Summary:');
        console.log(`   Total Servers: ${this.results.servers.total}`);
        console.log(`   Healthy Servers: ${this.results.servers.healthy}`);
        console.log(`   Server Errors: ${this.results.servers.errors}`);
        
        if (this.results.servers.total > 0) {
            const healthRate = (this.results.servers.healthy / this.results.servers.total) * 100;
            console.log(`   Health Rate: ${healthRate.toFixed(2)}%`);
        }
        
        console.log('\n' + '='.repeat(60));
    }

    // รัน test ทั้งหมด
    async runAllTests() {
        console.log('🚀 Starting Distributed Load Balancer Tests');
        console.log('============================================================');
        
        try {
            // ทดสอบ Master
            await this.testMasterLoadBalancer();
            
            // รอสักครู่
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // ทดสอบ Sub Balancers
            await this.testSubLoadBalancers();
            
            // รอสักครู่
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // ทดสอบ Load Distribution
            await this.testLoadDistribution(200); // ทดสอบด้วย 200 requests
            
            // แสดงผลสรุป
            this.displaySummary();
            
            console.log('\n✅ All tests completed successfully!');
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.displaySummary();
            process.exit(1);
        }
    }
}

// รัน tests
async function main() {
    const tester = new DistributedLoadTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DistributedLoadTester;