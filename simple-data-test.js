#!/usr/bin/env node

/**
 * Simple Data Sharing Test
 * ทดสอบการแชร์ข้อมูลแบบง่าย
 */

const http = require('http');

// ทดสอบการแชร์ข้อมูล
async function testDataSharing() {
    console.log('🧪 Testing Data Sharing...');
    
    const testData = {
        serverId: 'simple-test-server',
        data: {
            message: 'Hello from simple test!',
            timestamp: new Date().toISOString(),
            value: 42
        },
        metadata: {
            type: 'simple-test',
            priority: 'normal'
        }
    };
    
    try {
        const response = await makeRequest('POST', '/share/simple-test', testData);
        console.log('✅ Data sharing response:', response);
        
        // ทดสอบการดึงข้อมูล
        const getData = await makeRequest('GET', '/share/simple-test');
        console.log('📥 Retrieved data:', getData);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// ทำ HTTP request
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3500,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed);
                } catch (error) {
                    resolve({ success: false, error: 'Invalid JSON', raw: responseData });
                }
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data && method === 'POST') {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// เริ่มการทดสอบ
testDataSharing();