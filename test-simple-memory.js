const { spawn } = require('child_process');
const path = require('path');

// Test the Simple Memory MCP Server
const serverPath = path.join(__dirname, 'src', 'simple-memory', 'dist', 'index.js');

function testMCPServer() {
    console.log('Testing Simple Memory MCP Server...');
    
    const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let responseData = '';
    
    server.stdout.on('data', (data) => {
        responseData += data.toString();
        console.log('Server response:', data.toString());
    });
    
    server.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
    });
    
    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
    });
    
    // Test 1: List tools
    console.log('\n=== Test 1: List Tools ===');
    const listToolsRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
    };
    
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    
    // Wait a bit then test set operation
    setTimeout(() => {
        console.log('\n=== Test 2: Set Operation ===');
        const setRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'set',
                arguments: {
                    key: 'test_key',
                    value: 'test_value',
                    tags: ['test']
                }
            }
        };
        
        server.stdin.write(JSON.stringify(setRequest) + '\n');
        
        // Test get operation
        setTimeout(() => {
            console.log('\n=== Test 3: Get Operation ===');
            const getRequest = {
                jsonrpc: '2.0',
                id: 3,
                method: 'tools/call',
                params: {
                    name: 'get',
                    arguments: {
                        key: 'test_key'
                    }
                }
            };
            
            server.stdin.write(JSON.stringify(getRequest) + '\n');
            
            // Close after tests
            setTimeout(() => {
                server.kill();
            }, 2000);
        }, 1000);
    }, 1000);
}

testMCPServer();