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

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'MCP Proxy Server 1', 
    version: '1.0.0',
    proxy: 'proxy-1',
    port: PORT,
    servers: mcpServers.length,
    endpoints: ['/health', '/servers', '/servers/count', '/tools', '/call', '/mcp/:serverName/:toolName', '/status']
  });
});

// Status endpoint
app.get('/status', (req, res) => {
  const activeServers = mcpServers.filter(s => s.status === 'active').length;
  res.json({ 
    proxy: 'proxy-1',
    port: PORT,
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    servers: {
      total: mcpServers.length,
      active: activeServers,
      inactive: mcpServers.length - activeServers
    },
    timestamp: new Date().toISOString()
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
  res.json({ tools: allTools, proxy: 'proxy-1', count: allTools.length });
});

// Standard MCP call endpoint
app.post('/call', async (req, res) => {
  const { server_name, tool_name, args } = req.body;
  
  if (!server_name || !tool_name) {
    return res.status(400).json({ 
      error: 'Missing required fields: server_name and tool_name', 
      proxy: 'proxy-1' 
    });
  }
  
  const server = mcpServers.find(s => s.name === server_name);
  if (!server) {
    return res.status(404).json({ 
      error: `Server '${server_name}' not found`, 
      proxy: 'proxy-1',
      available_servers: mcpServers.map(s => s.name)
    });
  }
  
  if (!server.tools.includes(tool_name)) {
    return res.status(404).json({ 
      error: `Tool '${tool_name}' not found in server '${server_name}'`, 
      proxy: 'proxy-1',
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
    proxy: 'proxy-1',
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