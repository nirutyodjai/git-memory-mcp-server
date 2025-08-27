#!/usr/bin/env node

/**
 * Basic Usage Example for Git Memory MCP Server
 * 
 * This example demonstrates how to use the Git Memory MCP Server
 * with basic Git operations and memory management.
 */

const { spawn } = require('child_process');
const readline = require('readline');

class GitMemoryClient {
  constructor() {
    this.server = null;
    this.requestId = 1;
  }

  async start() {
    console.log('🚀 Starting Git Memory MCP Server...');
    
    // Start the MCP server
    this.server = spawn('node', ['../dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr.on('data', (data) => {
      console.log('Server:', data.toString());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Server started successfully!');
    
    // Run examples
    await this.runExamples();
  }

  async sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const requestStr = JSON.stringify(request) + '\n';
      this.server.stdin.write(requestStr);

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);

      this.server.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async runExamples() {
    console.log('\n📋 Running Git Memory MCP Server Examples\n');

    try {
      // Example 1: List available tools
      console.log('1️⃣ Listing available tools...');
      const tools = await this.sendRequest('tools/list');
      console.log(`Found ${tools.result?.tools?.length || 0} tools`);
      
      // Example 2: Get Git status
      console.log('\n2️⃣ Getting Git repository status...');
      const status = await this.sendRequest('tools/call', {
        name: 'git_status',
        arguments: {}
      });
      console.log('Git Status:', status.result?.content?.[0]?.text || 'No status available');

      // Example 3: Store something in memory
      console.log('\n3️⃣ Storing information in memory...');
      const storeResult = await this.sendRequest('tools/call', {
        name: 'memory_store',
        arguments: {
          key: 'example-memory',
          content: 'This is an example memory entry created during basic usage demonstration',
          tags: ['example', 'demo', 'basic'],
          metadata: {
            created_by: 'basic-usage-example',
            timestamp: new Date().toISOString()
          }
        }
      });
      console.log('Memory stored:', storeResult.result?.content?.[0]?.text || 'Storage completed');

      // Example 4: Search memory
      console.log('\n4️⃣ Searching memory...');
      const searchResult = await this.sendRequest('tools/call', {
        name: 'memory_search',
        arguments: {
          query: 'example demonstration',
          limit: 5
        }
      });
      console.log('Search results:', searchResult.result?.content?.[0]?.text || 'No results found');

      // Example 5: Get commit history
      console.log('\n5️⃣ Getting commit history...');
      const logResult = await this.sendRequest('tools/call', {
        name: 'git_log',
        arguments: {
          maxCount: 5,
          oneline: true
        }
      });
      console.log('Recent commits:', logResult.result?.content?.[0]?.text || 'No commits found');

      // Example 6: Context search (combining Git and Memory)
      console.log('\n6️⃣ Performing context search...');
      const contextResult = await this.sendRequest('tools/call', {
        name: 'context_search',
        arguments: {
          query: 'example',
          includeCommits: true,
          includeMemory: true
        }
      });
      console.log('Context search:', contextResult.result?.content?.[0]?.text || 'No context found');

      console.log('\n✅ All examples completed successfully!');
      
    } catch (error) {
      console.error('❌ Error running examples:', error.message);
    }

    // Clean up
    this.server.kill();
    console.log('\n🛑 Server stopped.');
  }
}

// Run the example
if (require.main === module) {
  const client = new GitMemoryClient();
  client.start().catch(console.error);
}

module.exports = GitMemoryClient;