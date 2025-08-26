const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// MCP Server configurations for Proxy 1 (Original servers + test-server-01 to test-server-50)
const mcpServers = [
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-time',
    description: 'Time and timezone conversion utilities',
    status: 'active',
    tools: ['get_current_time', 'convert_time']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-git',
    description: 'Git repository management and operations',
    status: 'active',
    tools: ['git_status', 'git_diff_unstaged', 'git_diff_staged', 'git_commit', 'git_add']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-filesystem',
    description: 'File system operations and management',
    status: 'active',
    tools: ['read_file', 'write_file', 'list_directory', 'create_directory']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-playwright',
    description: 'Web automation and browser testing',
    status: 'active',
    tools: ['launch_browser', 'navigate_to', 'take_screenshot', 'click_element']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-multifetch',
    description: 'Multi-source data fetching and aggregation',
    status: 'active',
    tools: ['fetch']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-blender',
    description: '3D modeling and rendering with Blender',
    status: 'active',
    tools: ['create_cube', 'create_sphere']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-thinking',
    description: 'Sequential thinking and reasoning capabilities',
    status: 'active',
    tools: ['think_step', 'analyze_problem', 'generate_solution']
  },
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-memory',
    description: 'Memory management and storage operations',
    status: 'active',
    tools: ['store_memory', 'retrieve_memory', 'search_memory', 'delete_memory']
  },
  {
    name: 'mcp.config.usrlocalmcp.antv-chart',
    description: 'Chart and visualization generation',
    status: 'active',
    tools: ['create_chart', 'generate_graph', 'visualize_data']
  },
  {
    name: 'mcp.config.usrlocalmcp.apiweaver',
    description: 'API integration and weaving capabilities',
    status: 'active',
    tools: ['weave_api', 'integrate_service', 'manage_endpoints']
  }
];

// Add test servers 01-50 to proxy 1
for (let i = 1; i <= 50; i++) {
  mcpServers.push({
    name: `test-server-${i.toString().padStart(2, '0')}`,
    description: `Test MCP server ${i} for load testing`,
    status: 'active',
    tools: ['test_tool_1', 'test_tool_2', 'test_tool_3']
  });
}

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    proxy: 'proxy-1',
    port: PORT,
    servers: mcpServers.length,
    timestamp: new Date().toISOString() 
  });
});

// Get server count
app.get('/servers/count', (req, res) => {
  res.json({ count: mcpServers.length, proxy: 'proxy-1' });
});

// List all servers
app.get('/servers', (req, res) => {
  res.json({ servers: mcpServers, proxy: 'proxy-1' });
});

// MCP tool execution endpoint
app.post('/mcp/:serverName/:toolName', async (req, res) => {
  const { serverName, toolName } = req.params;
  const { args } = req.body;
  
  const server = mcpServers.find(s => s.name === serverName);
  if (!server) {
    return res.status(404).json({ error: 'Server not found', proxy: 'proxy-1' });
  }
  
  if (!server.tools.includes(toolName)) {
    return res.status(404).json({ error: 'Tool not found', proxy: 'proxy-1' });
  }
  
  // Simulate tool execution
  res.json({ 
    result: `Executed ${toolName} on ${serverName}`, 
    args, 
    proxy: 'proxy-1',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`MCP Proxy Server 1 running on port ${PORT}`);
  console.log(`Registered ${mcpServers.length} MCP servers`);
  mcpServers.forEach(server => {
    console.log(`  - ${server.name}: ${server.tools.length} tools`);
  });
});