const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  port: 9090,
  mcpServers: {
    'shadcn-ui': {
      name: 'Shadcn UI MCP Server',
      description: 'MCP server for Shadcn UI components',
      status: 'available',
      tools: ['create_component', 'list_components', 'update_component']
    },
    'magic-ui': {
      name: 'Magic UI MCP Server',
      description: 'MCP server for Magic UI components',
      status: 'available',
      tools: ['create_magic_component', 'list_magic_components']
    },
    'google-workspace': {
      name: 'Google Workspace MCP Server',
      description: 'MCP server for Google Workspace integration',
      status: 'configured',
      tools: ['gmail_send', 'calendar_create', 'drive_upload', 'docs_create']
    },
    'playwright': {
      name: 'Playwright MCP Server',
      description: 'MCP server for browser automation',
      status: 'available',
      tools: ['browser_navigate', 'take_screenshot', 'fill_form']
    },
    'memory': {
      name: 'Memory MCP Server',
      description: 'MCP server for persistent memory',
      status: 'available',
      tools: ['store_memory', 'retrieve_memory', 'list_memories']
    },
    'git-memory': {
      name: 'Git Memory MCP Server',
      description: 'MCP server for Git operations with memory integration',
      status: 'available',
      tools: ['git_status', 'git_commit', 'git_branch', 'git_diff', 'store_memory', 'retrieve_memory', 'semantic_search', 'commit_with_memory']
    }
  }
};

class MCPProxyServer {
  constructor() {
    this.mcpServers = new Map();
    this.server = null;
    this.initializeMCPServers();
  }

  initializeMCPServers() {
    for (const [name, config] of Object.entries(CONFIG.mcpServers)) {
      this.mcpServers.set(name, {
        ...config,
        startTime: new Date().toISOString(),
        requestCount: 0
      });
      console.log(`Registered MCP server: ${name} - ${config.name}`);
    }
  }

  createHTTPServer() {
    this.server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Handle different endpoints
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          mcpServers: Array.from(this.mcpServers.keys()),
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }));
        return;
      }

      if (req.url === '/servers') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const serverStatus = {};
        for (const [name, server] of this.mcpServers) {
          serverStatus[name] = {
            name: server.name,
            description: server.description,
            status: server.status,
            tools: server.tools,
            startTime: server.startTime,
            requestCount: server.requestCount
          };
        }
        res.end(JSON.stringify(serverStatus));
        return;
      }

      if (req.url.startsWith('/mcp/')) {
        const serverName = req.url.split('/')[2];
        if (this.mcpServers.has(serverName)) {
          const server = this.mcpServers.get(serverName);
          server.requestCount++;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            server: serverName,
            message: `MCP request to ${server.name}`,
            availableTools: server.tools,
            status: server.status
          }));
          return;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'MCP server not found' }));
          return;
        }
      }

      // Default response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'MCP Proxy Server',
        version: '1.0.0',
        endpoints: ['/health', '/servers', '/mcp/{server-name}'],
        mcpServers: Object.keys(CONFIG.mcpServers),
        totalServers: this.mcpServers.size
      }));
    });

    return this.server;
  }

  async start() {
    console.log('Starting MCP Proxy Server...');
    console.log(`Registered ${this.mcpServers.size} MCP servers`);
    
    // Create and start HTTP server
    const server = this.createHTTPServer();
    
    server.listen(CONFIG.port, () => {
      console.log(`\n🚀 MCP Proxy Server listening on port ${CONFIG.port}`);
      console.log(`📊 Health check: http://localhost:${CONFIG.port}/health`);
      console.log(`🔧 Server status: http://localhost:${CONFIG.port}/servers`);
      console.log(`🔗 MCP endpoints: http://localhost:${CONFIG.port}/mcp/{server-name}`);
      console.log(`\nAvailable MCP servers:`);
      for (const [name, server] of this.mcpServers) {
        console.log(`  - ${name}: ${server.name} (${server.tools.length} tools)`);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down MCP Proxy Server...');
      
      // Close HTTP server
      server.close(() => {
        console.log('✅ MCP Proxy Server stopped');
        process.exit(0);
      });
    });
  }
}

// Start the proxy server
if (require.main === module) {
  const proxy = new MCPProxyServer();
  proxy.start().catch(console.error);
}

module.exports = MCPProxyServer;