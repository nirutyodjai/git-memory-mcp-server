const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    proxy: 'proxy-2',
    port: PORT,
    servers: mcpServers.length,
    timestamp: new Date().toISOString() 
  });
});

// Get server count
app.get('/servers/count', (req, res) => {
  res.json({ count: mcpServers.length, proxy: 'proxy-2' });
});

// List all servers
app.get('/servers', (req, res) => {
  res.json({ servers: mcpServers, proxy: 'proxy-2' });
});

// MCP tool execution endpoint
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