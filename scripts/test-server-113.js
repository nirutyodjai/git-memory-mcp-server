#!/usr/bin/env node

/**
 * Test MCP Server 113 - Mock Server with 4 Tools
 * สำหรับทดสอบการเชื่อมต่อและการทำงานของ MCP Proxy Server
 */

const http = require('http');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class TestServer113 {
  constructor() {
    this.serverId = 'test-server-113';
    this.serverName = 'Test MCP Server 113';
    this.port = 3113;
    this.tools = [
      {
        name: 'test_tool_1',
        description: 'Test Tool 1 - Data Processing',
        inputSchema: {
          type: 'object',
          properties: {
            data: { type: 'string', description: 'Data to process' },
            format: { type: 'string', enum: ['json', 'xml', 'csv'], default: 'json' }
          },
          required: ['data']
        }
      },
      {
        name: 'test_tool_2',
        description: 'Test Tool 2 - File Operations',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: 'File name' },
            operation: { type: 'string', enum: ['read', 'write', 'delete'], default: 'read' },
            content: { type: 'string', description: 'File content (for write operation)' }
          },
          required: ['filename', 'operation']
        }
      },
      {
        name: 'test_tool_3',
        description: 'Test Tool 3 - Network Operations',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', format: 'uri', description: 'Target URL' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
            headers: { type: 'object', description: 'HTTP headers' },
            timeout: { type: 'number', default: 5000, description: 'Request timeout in ms' }
          },
          required: ['url']
        }
      },
      {
        name: 'test_tool_4',
        description: 'Test Tool 4 - System Monitoring',
        inputSchema: {
          type: 'object',
          properties: {
            metric: { type: 'string', enum: ['cpu', 'memory', 'disk', 'network'], description: 'Metric to monitor' },
            interval: { type: 'number', default: 1000, description: 'Monitoring interval in ms' },
            duration: { type: 'number', default: 10000, description: 'Monitoring duration in ms' }
          },
          required: ['metric']
        }
      }
    ];
  }

  async startHttpServer() {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.url === '/info') {
          res.writeHead(200);
          res.end(JSON.stringify({
            id: this.serverId,
            name: this.serverName,
            type: 'http',
            version: '1.0.0',
            tools: this.tools,
            status: 'active',
            timestamp: new Date().toISOString()
          }));
        } else if (req.url === '/health') {
          res.writeHead(200);
          res.end(JSON.stringify({ 
            status: 'healthy', 
            timestamp: Date.now(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
          }));
        } else if (req.url === '/tools/list') {
          res.writeHead(200);
          res.end(JSON.stringify({ tools: this.tools }));
        } else if (req.url === '/tools/call') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            try {
              const request = JSON.parse(body);
              const result = this.executeToolMock(request.params.name, request.params.arguments || {});
              res.writeHead(200);
              res.end(JSON.stringify({
                content: [{
                  type: 'text',
                  text: result
                }]
              }));
            } catch (error) {
              res.writeHead(400);
              res.end(JSON.stringify({ error: error.message }));
            }
          });
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      });

      server.listen(this.port, () => {
        console.log(`🚀 ${this.serverName} HTTP server started on port ${this.port}`);
        console.log(`📊 Server Info:`);
        console.log(`   - ID: ${this.serverId}`);
        console.log(`   - Name: ${this.serverName}`);
        console.log(`   - Port: ${this.port}`);
        console.log(`   - Tools: ${this.tools.length}`);
        console.log(`   - Endpoint: http://localhost:${this.port}`);
        console.log(`\n🔧 Available Tools:`);
        this.tools.forEach((tool, index) => {
          console.log(`   ${index + 1}. ${tool.name} - ${tool.description}`);
        });
        console.log(`\n✅ Server is ready to accept connections!`);
        resolve(server);
      });

      server.on('error', (error) => {
        console.error(`❌ Server error:`, error.message);
        reject(error);
      });
    });
  }

  executeToolMock(toolName, args) {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    console.log(`🔧 Executing tool: ${toolName}`);
    console.log(`📝 Arguments:`, JSON.stringify(args, null, 2));

    switch (toolName) {
      case 'test_tool_1':
        return `Data processing completed for: ${args.data || 'default data'} in ${args.format || 'json'} format. Processed at ${new Date().toISOString()}`;
      
      case 'test_tool_2':
        return `File operation '${args.operation || 'read'}' completed for file: ${args.filename || 'default.txt'}. ${args.content ? 'Content written successfully.' : 'Operation completed.'}`;
      
      case 'test_tool_3':
        return `Network request ${args.method || 'GET'} to ${args.url || 'http://example.com'} completed successfully. Response time: ${Math.random() * 100 + 50}ms`;
      
      case 'test_tool_4':
        return `System monitoring started for ${args.metric || 'cpu'} metric. Interval: ${args.interval || 1000}ms, Duration: ${args.duration || 10000}ms. Current value: ${Math.random() * 100}%`;
      
      default:
        return `Mock result from ${this.serverName} for tool ${toolName}`;
    }
  }

  async startMCPServer() {
    const server = new Server(
      {
        name: this.serverId,
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Register list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log(`📋 Listing ${this.tools.length} tools from ${this.serverName}`);
      return { tools: this.tools };
    });

    // Register call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      console.log(`🔧 Tool call received: ${name}`);
      
      const result = this.executeToolMock(name, args || {});
      return {
        content: [{
          type: 'text',
          text: result
        }]
      };
    });

    // Start the MCP server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log(`🚀 ${this.serverName} MCP server is running!`);
    console.log(`📊 Available tools: ${this.tools.length}`);
  }
}

// Main execution
async function main() {
  const testServer = new TestServer113();
  
  // Check if we should start HTTP server or MCP server
  const args = process.argv.slice(2);
  
  if (args.includes('--http')) {
    // Start HTTP server for proxy testing
    await testServer.startHttpServer();
  } else {
    // Start MCP server (default)
    await testServer.startMCPServer();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TestServer113 };