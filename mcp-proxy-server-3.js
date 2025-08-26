const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3003;

// MCP Server configurations for Proxy 3 (Advanced MCP servers + test-server-101 to test-server-150)
const mcpServers = [
  {
    name: 'mcp.config.usrlocalmcp.3d-sco-memory-advanced',
    description: 'Advanced memory management with AI capabilities',
    status: 'active',
    tools: ['store_memory', 'retrieve_memory', 'search_memory', 'delete_memory', 'ai_analyze', 'pattern_recognition']
  },
  {
    name: 'mcp.config.usrlocalmcp.data-analytics',
    description: 'Data analytics and processing engine',
    status: 'active',
    tools: ['analyze_data', 'generate_insights', 'create_reports', 'visualize_trends']
  },
  {
    name: 'mcp.config.usrlocalmcp.ml-processor',
    description: 'Machine learning processing and model management',
    status: 'active',
    tools: ['train_model', 'predict', 'evaluate_model', 'optimize_parameters']
  },
  {
    name: 'mcp.config.usrlocalmcp.workflow-engine',
    description: 'Workflow automation and orchestration',
    status: 'active',
    tools: ['create_workflow', 'execute_pipeline', 'monitor_tasks', 'schedule_jobs']
  },
  {
    name: 'mcp.config.usrlocalmcp.security-scanner',
    description: 'Security analysis and vulnerability scanning',
    status: 'active',
    tools: ['scan_vulnerabilities', 'analyze_security', 'generate_report', 'recommend_fixes']
  }
];

// Add test servers 101-150 to proxy 3
for (let i = 101; i <= 150; i++) {
  mcpServers.push({
    name: `test-server-${i}`,
    description: `Test MCP server ${i} for load testing`,
    status: 'active',
    tools: ['test_tool_1', 'test_tool_2', 'test_tool_3', 'test_tool_4', 'test_tool_5']
  });
}

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    proxy: 'proxy-3',
    port: PORT,
    servers: mcpServers.length,
    timestamp: new Date().toISOString() 
  });
});

// Get server count
app.get('/servers/count', (req, res) => {
  res.json({ count: mcpServers.length, proxy: 'proxy-3' });
});

// List all servers
app.get('/servers', (req, res) => {
  res.json({ servers: mcpServers, proxy: 'proxy-3' });
});

// MCP tool execution endpoint
app.post('/mcp/:serverName/:toolName', async (req, res) => {
  const { serverName, toolName } = req.params;
  const { args } = req.body;
  
  const server = mcpServers.find(s => s.name === serverName);
  if (!server) {
    return res.status(404).json({ error: 'Server not found', proxy: 'proxy-3' });
  }
  
  if (!server.tools.includes(toolName)) {
    return res.status(404).json({ error: 'Tool not found', proxy: 'proxy-3' });
  }
  
  // Simulate tool execution
  res.json({ 
    result: `Executed ${toolName} on ${serverName}`, 
    args, 
    proxy: 'proxy-3',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`MCP Proxy Server 3 running on port ${PORT}`);
  console.log(`Registered ${mcpServers.length} MCP servers`);
  mcpServers.forEach(server => {
    console.log(`  - ${server.name}: ${server.tools.length} tools`);
  });
});