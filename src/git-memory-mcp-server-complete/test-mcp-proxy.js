const http = require('http');

// ฟังก์ชันสำหรับทดสอบ MCP Proxy Server
class MCPProxyTester {
  constructor(baseUrl = 'http://localhost:9090') {
    this.baseUrl = baseUrl;
  }

  // ทดสอบ Health Check
  async testHealth() {
    console.log('\n🔍 Testing Health Check...');
    try {
      const response = await this.makeRequest('/health');
      console.log('✅ Health Check Response:', JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error('❌ Health Check Failed:', error.message);
      return null;
    }
  }

  // ทดสอบ Server List
  async testServerList() {
    console.log('\n🔍 Testing Server List...');
    try {
      const response = await this.makeRequest('/servers');
      console.log('✅ Server List Response:');
      
      // แสดงรายละเอียดแต่ละ server
      for (const [name, server] of Object.entries(response)) {
        console.log(`\n📋 ${name}:`);
        console.log(`   Name: ${server.name}`);
        console.log(`   Description: ${server.description}`);
        console.log(`   Status: ${server.status}`);
        console.log(`   Tools: ${server.tools.join(', ')}`);
        console.log(`   Request Count: ${server.requestCount}`);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Server List Failed:', error.message);
      return null;
    }
  }

  // ทดสอบ MCP Server เฉพาะ
  async testMCPServer(serverName) {
    console.log(`\n🔍 Testing MCP Server: ${serverName}...`);
    try {
      const response = await this.makeRequest(`/mcp/${serverName}`);
      console.log(`✅ MCP Server ${serverName} Response:`, JSON.stringify(response, null, 2));
      return response;
    } catch (error) {
      console.error(`❌ MCP Server ${serverName} Failed:`, error.message);
      return null;
    }
  }

  // ทดสอบ MCP Servers ทั้งหมด
  async testAllMCPServers() {
    console.log('\n🔍 Testing All MCP Servers...');
    
    const serverList = await this.testServerList();
    if (!serverList) return;

    const serverNames = Object.keys(serverList);
    console.log(`\n📋 Found ${serverNames.length} MCP Servers: ${serverNames.join(', ')}`);

    for (const serverName of serverNames) {
      await this.testMCPServer(serverName);
      // รอสักครู่ระหว่างการทดสอบ
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // ทดสอบ MCP Servers เฉพาะ
  async testSpecificMCPServer() {
    console.log('\n=== Testing Specific MCP Servers ===');
    const serversToTest = [
      // Built-in 3D-SCO MCP Servers
      'filesystem', 'memory', 'sequentialthinking', 'everything', 
      'fetch', 'git', 'time', 'multifetch', 'blender',
      // External MCP Servers
      'shadcn-ui', 'magic-ui', 'google-workspace', 'playwright', 'git-memory'
    ];
    
    for (const serverName of serversToTest) {
      try {
        const response = await this.makeRequest(`/mcp/${serverName}`);
        console.log(`✅ ${serverName}:`, {
          name: response.server,
          tools: response.availableTools?.length || 0,
          status: response.status
        });
      } catch (error) {
        console.log(`❌ ${serverName}: Error -`, error.message);
      }
    }
  }

  // ฟังก์ชันช่วยสำหรับทำ HTTP Request
  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      
      http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`HTTP Request failed: ${error.message}`));
      });
    });
  }

  // รันการทดสอบทั้งหมด
  async runAllTests() {
    console.log('🚀 Starting MCP Proxy Server Tests...');
    console.log(`🔗 Base URL: ${this.baseUrl}`);
    
    try {
      // ทดสอบ Health Check
      const health = await this.testHealth();
      if (!health || health.status !== 'healthy') {
        console.error('❌ Server is not healthy. Stopping tests.');
        return;
      }

      // ทดสอบ Server List
      await this.testServerList();

      // ทดสอบ MCP Servers ทั้งหมด
      await this.testAllMCPServers();

      // ทดสอบ MCP Servers เฉพาะ
      await this.testSpecificMCPServer();

      console.log('\n✅ All tests completed successfully!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
  }
}

// รันการทดสอบ
if (require.main === module) {
  const tester = new MCPProxyTester();
  
  console.log('='.repeat(60));
  console.log('🧪 MCP Proxy Server Test Suite');
  console.log('='.repeat(60));
  
  tester.runAllTests().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('🏁 Test Suite Finished');
    console.log('='.repeat(60));
  }).catch(console.error);
}

module.exports = MCPProxyTester;