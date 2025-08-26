const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { authenticateApiKey, requirePermission, rateLimit, logRequest, healthCheck } = require('./auth-middleware');

const app = express();
const PORT = 3002;

// MCP Server configurations for Proxy 2 (Additional MCP servers + test-server-51 to test-server-100)
const mcpServers = [
  {
    name: 'mcp.config.usrlocalmcp.adr-analysis',
    description: 'Architecture Decision Records analysis and management',
    status: 'active',
    tools: ['analyze_adr', 'create_decision', 'track_changes']
  },
  {
    name: 'mcp.config.usrlocalmcp.1mcpserver',
    description: 'Primary MCP server management',
    status: 'active',
    tools: ['manage_server', 'monitor_health', 'configure_settings']
  },
  {
    name: 'mcp.config.usrlocalmcp.figma-developer-mcp',
    description: 'Figma development and design integration',
    status: 'active',
    tools: ['fetch_designs', 'export_assets', 'sync_components']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-memory',
    description: 'Advanced memory management and storage operations',
    status: 'active',
    tools: ['store_memory', 'retrieve_memory', 'search_memory', 'delete_memory', 'backup_memory']
  },
  {
    name: 'mcp.config.usrlocalmcp.document-processor',
    description: 'Document processing and analysis',
    status: 'active',
    tools: ['parse_pdf', 'extract_text', 'convert_format', 'merge_documents']
  }
];

// Add test servers 51-100 to proxy 2
for (let i = 51; i <= 100; i++) {
  mcpServers.push({
    name: `test-server-${i.toString().padStart(2, '0')}`,
    description: `Test MCP server ${i} for load testing`,
    status: 'active',
    tools: ['test_tool_1', 'test_tool_2', 'test_tool_3', 'test_tool_4']
  });
}

app.use(express.json());
app.use(logRequest);

// Health check endpoint (no auth required)
app.get('/health', healthCheck);

// Protected endpoints (require authentication)
app.use('/status', authenticateApiKey, requirePermission('read'));
app.use('/tools', authenticateApiKey, requirePermission('read'), rateLimit(50, 60000));
app.use('/call', authenticateApiKey, requirePermission('write'), rateLimit(30, 60000));
app.use('/mcp', authenticateApiKey, requirePermission('write'), rateLimit(30, 60000));

// Get server count
app.get('/servers/count', (req, res) => {
  res.json({ count: mcpServers.length, proxy: 'proxy-2' });
});

// List all servers
app.get('/servers', (req, res) => {
  res.json({ servers: mcpServers, proxy: 'proxy-2' });
});

// Public endpoints (no auth required)
app.get('/', (req, res) => {
  res.json({ 
    message: 'MCP Proxy Server 2 - Authentication Enabled', 
    version: '2.0.0',
    proxy: 'proxy-2',
    port: PORT,
    servers: mcpServers.length,
    endpoints: {
      '/': 'This endpoint',
      '/health': 'Health check (no auth)',
      '/status': 'Server status (requires auth)',
      '/tools': 'List all tools (requires read permission)',
      '/call': 'Execute MCP tool (requires write permission)',
      '/mcp/:serverName/:toolName': 'Legacy endpoint (requires write permission)'
    },
    authentication: {
      required: true,
      method: 'API Key',
      header: 'X-API-Key or api_key query parameter'
    }
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  const activeServers = mcpServers.filter(s => s.status === 'active').length;
  res.json({ 
    proxy: 'proxy-2',
    port: PORT,
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    servers: {
      total: mcpServers.length,
      active: activeServers,
      inactive: mcpServers.length - activeServers
    },
    timestamp: new Date().toISOString(),
    user: req.user.name,
    permissions: req.user.permissions
  });
});

// List all available tools
app.get('/tools', (req, res) => {
  const allTools = [];
  mcpServers.forEach(server => {
    server.tools.forEach(tool => {
      allTools.push({
        server: server.name,
        tool: tool,
        description: server.description
      });
    });
  });
  res.json({ tools: allTools, proxy: 'proxy-2', count: allTools.length });
});

// Standard MCP call endpoint
app.post('/call', async (req, res) => {
  const { server_name, tool_name, args } = req.body;
  
  if (!server_name || !tool_name) {
    return res.status(400).json({ 
      error: 'Missing required fields: server_name and tool_name', 
      proxy: 'proxy-2' 
    });
  }
  
  const server = mcpServers.find(s => s.name === server_name);
  if (!server) {
    return res.status(404).json({ 
      error: `Server '${server_name}' not found`, 
      proxy: 'proxy-2',
      available_servers: mcpServers.map(s => s.name)
    });
  }
  
  if (!server.tools.includes(tool_name)) {
    return res.status(404).json({ 
      error: `Tool '${tool_name}' not found in server '${server_name}'`, 
      proxy: 'proxy-2',
      available_tools: server.tools
    });
  }
  
  // Simulate tool execution with more realistic response
  const result = {
    success: true,
    server: server_name,
    tool: tool_name,
    args: args || {},
    result: `Successfully executed ${tool_name} on ${server_name}`,
    execution_time: Math.random() * 100 + 50, // Random execution time 50-150ms
    proxy: 'proxy-2',
    timestamp: new Date().toISOString()
  };
  
  res.json(result);
});

// MCP tool execution endpoint (legacy)
app.post('/mcp/:serverName/:toolName', async (req, res) => {
  const { serverName, toolName } = req.params;
  const { args } = req.body;
  
  const server = mcpServers.find(s => s.name === serverName);
  if (!server) {
    return res.status(404).json({ error: 'Server not found', proxy: 'proxy-2' });
  }
  
  if (!server.tools.includes(toolName)) {
    return res.status(404).json({ error: 'Tool not found', proxy: 'proxy-2' });
  }
  
  // Simulate tool execution
  res.json({ 
    result: `Executed ${toolName} on ${serverName}`, 
    args, 
    proxy: 'proxy-2',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`MCP Proxy Server 2 running on port ${PORT}`);
  console.log(`Registered ${mcpServers.length} MCP servers`);
  mcpServers.forEach(server => {
    console.log(`  - ${server.name}: ${server.tools.length} tools`);
  });
});