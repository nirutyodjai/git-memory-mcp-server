#!/usr/bin/env node

const express = require('express');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

class MCPProxyServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.mcpProcesses = new Map();
    this.coordinatorProcess = null;
    this.port = 3000;
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        coordinator: this.coordinatorProcess ? 'running' : 'stopped',
        activeServers: this.mcpProcesses.size,
        uptime: process.uptime()
      });
    });

    // Start MCP Coordinator
    this.app.post('/coordinator/start', async (req, res) => {
      try {
        if (this.coordinatorProcess) {
          return res.json({ message: 'Coordinator already running', pid: this.coordinatorProcess.pid });
        }

        this.coordinatorProcess = spawn('node', ['mcp-coordinator.js'], {
          cwd: process.cwd(),
          stdio: ['pipe', 'pipe', 'pipe']
        });

        this.coordinatorProcess.stdout.on('data', (data) => {
          console.log(`Coordinator stdout: ${data}`);
        });

        this.coordinatorProcess.stderr.on('data', (data) => {
          console.log(`Coordinator stderr: ${data}`);
        });

        this.coordinatorProcess.on('close', (code) => {
          console.log(`Coordinator process exited with code ${code}`);
          this.coordinatorProcess = null;
        });

        res.json({ 
          message: 'Coordinator started successfully', 
          pid: this.coordinatorProcess.pid 
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Stop MCP Coordinator
    this.app.post('/coordinator/stop', (req, res) => {
      try {
        if (this.coordinatorProcess) {
          this.coordinatorProcess.kill();
          this.coordinatorProcess = null;
          res.json({ message: 'Coordinator stopped successfully' });
        } else {
          res.json({ message: 'Coordinator is not running' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Send command to coordinator
    this.app.post('/coordinator/command', async (req, res) => {
      try {
        if (!this.coordinatorProcess) {
          return res.status(400).json({ error: 'Coordinator is not running' });
        }

        const { method, params } = req.body;
        const request = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: method,
          params: params
        };

        this.coordinatorProcess.stdin.write(JSON.stringify(request) + '\n');
        
        // For now, return acknowledgment
        // In a full implementation, you'd want to capture the response
        res.json({ 
          message: 'Command sent to coordinator',
          request: request
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Deploy batch of servers
    this.app.post('/deploy/batch', async (req, res) => {
      try {
        const { category, count = 50 } = req.body;
        
        if (!category) {
          return res.status(400).json({ error: 'Category is required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'deploy_batch',
            arguments: { category, count }
          }
        };

        // Send to coordinator if running
        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Deploying ${count} servers in category '${category}'`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List all servers
    this.app.get('/servers', async (req, res) => {
      try {
        const { category, status } = req.query;
        
        const command = {
          method: 'tools/call',
          params: {
            name: 'list_servers',
            arguments: { category, status }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        // Load from config file as fallback
        try {
          const config = await fs.readFile(this.configPath, 'utf8');
          const data = JSON.parse(config);
          
          res.json({
            currentPhase: data.currentPhase || 0,
            totalServers: data.mcpServers ? data.mcpServers.length : 0,
            categories: data.categories || {},
            servers: data.mcpServers || []
          });
        } catch (configError) {
          res.json({ 
            message: 'No configuration found',
            command: command
          });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check for specific category
    this.app.get('/health/:category', async (req, res) => {
      try {
        const { category } = req.params;
        
        const command = {
          method: 'tools/call',
          params: {
            name: 'health_check',
            arguments: { category, detailed: true }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Health check for category '${category}'`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Memory operations
    this.app.post('/memory/store', async (req, res) => {
      try {
        const { key, content, category, metadata } = req.body;
        
        if (!key || !content) {
          return res.status(400).json({ error: 'Key and content are required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'memory_store_coordinator',
            arguments: { key, content, category, metadata }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Storing memory with key '${key}'`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/memory/retrieve/:key', async (req, res) => {
      try {
        const { key } = req.params;
        const { category } = req.query;
        
        const command = {
          method: 'tools/call',
          params: {
            name: 'memory_retrieve_coordinator',
            arguments: { key, category }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Retrieving memory with key '${key}'`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 3D-SCO MCP Server endpoints
    // Playwright automation endpoint
    this.app.post('/3d-sco/playwright', async (req, res) => {
      try {
        const { action, url, selector, text, options } = req.body;
        
        if (!action) {
          return res.status(400).json({ error: 'Action is required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'playwright_automation',
            arguments: { action, url, selector, text, options }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Playwright automation: ${action}`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Multi Fetch endpoint
    this.app.post('/3d-sco/multifetch', async (req, res) => {
      try {
        const { urls, options } = req.body;
        
        if (!urls || !Array.isArray(urls)) {
          return res.status(400).json({ error: 'URLs array is required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'multi_fetch',
            arguments: { urls, options }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Multi fetch for ${urls.length} URLs`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Blender 3D modeling endpoint
    this.app.post('/3d-sco/blender', async (req, res) => {
      try {
        const { operation, parameters, script } = req.body;
        
        if (!operation) {
          return res.status(400).json({ error: 'Operation is required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'blender_operation',
            arguments: { operation, parameters, script }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Blender operation: ${operation}`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Sequential Thinking endpoint
    this.app.post('/3d-sco/thinking', async (req, res) => {
      try {
        const { problem, context, steps } = req.body;
        
        if (!problem) {
          return res.status(400).json({ error: 'Problem description is required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'sequential_thinking',
            arguments: { problem, context, steps }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Sequential thinking for problem: ${problem.substring(0, 50)}...`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Advanced Memory endpoint
    this.app.post('/3d-sco/memory', async (req, res) => {
      try {
        const { operation, key, data, query, options } = req.body;
        
        if (!operation) {
          return res.status(400).json({ error: 'Operation is required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'advanced_memory',
            arguments: { operation, key, data, query, options }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Advanced memory operation: ${operation}`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Scale system
    this.app.post('/scale', async (req, res) => {
      try {
        const { action, target_count } = req.body;
        
        if (!action) {
          return res.status(400).json({ error: 'Action is required' });
        }

        const command = {
          method: 'tools/call',
          params: {
            name: 'scale_system',
            arguments: { action, target_count }
          }
        };

        if (this.coordinatorProcess) {
          this.coordinatorProcess.stdin.write(JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            ...command
          }) + '\n');
        }

        res.json({ 
          message: `Scaling system: ${action}`,
          command: command
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get system statistics
    this.app.get('/stats', async (req, res) => {
      try {
        const stats = {
          proxy: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            activeConnections: this.mcpProcesses.size
          },
          coordinator: {
            running: !!this.coordinatorProcess,
            pid: this.coordinatorProcess ? this.coordinatorProcess.pid : null
          }
        };

        // Try to load configuration
        try {
          const config = await fs.readFile(this.configPath, 'utf8');
          const data = JSON.parse(config);
          stats.deployment = {
            currentPhase: data.currentPhase || 0,
            totalServers: data.mcpServers ? data.mcpServers.length : 0,
            categories: Object.keys(data.categories || {}).length
          };
        } catch (configError) {
          stats.deployment = {
            currentPhase: 0,
            totalServers: 0,
            categories: 0
          };
        }

        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Serve static dashboard
    this.app.get('/', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>MCP Coordinator Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .stat-item { text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; margin-top: 5px; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-warning { background: #ffc107; color: black; }
        .form-group { margin: 10px 0; }
        .form-control { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .log { background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; max-height: 300px; overflow-y: auto; }
        #status { margin: 10px 0; padding: 10px; border-radius: 4px; }
        .status-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .status-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 MCP Coordinator Dashboard</h1>
            <p>Manage and monitor your MCP server ecosystem</p>
        </div>
        
        <div class="card">
            <h2>System Status</h2>
            <div id="status"></div>
            <div class="stats" id="stats">
                <div class="stat-item">
                    <div class="stat-value" id="totalServers">0</div>
                    <div class="stat-label">Total Servers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="currentPhase">0</div>
                    <div class="stat-label">Current Phase</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="categories">0</div>
                    <div class="stat-label">Categories</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="uptime">0s</div>
                    <div class="stat-label">Uptime</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Coordinator Control</h2>
            <div class="actions">
                <button class="btn btn-success" onclick="startCoordinator()">Start Coordinator</button>
                <button class="btn btn-danger" onclick="stopCoordinator()">Stop Coordinator</button>
                <button class="btn btn-primary" onclick="refreshStats()">Refresh Stats</button>
            </div>
        </div>
        
        <div class="card">
            <h2>Deploy Servers</h2>
            <div class="form-group">
                <label>Category:</label>
                <select class="form-control" id="deployCategory">
                    <option value="database">Database</option>
                    <option value="filesystem">File System</option>
                    <option value="api">API & Web Services</option>
                    <option value="ai-ml">AI/ML</option>
                    <option value="version-control">Version Control</option>
                    <option value="dev-tools">Development Tools</option>
                    <option value="system-ops">System Operations</option>
                    <option value="communication">Communication</option>
                    <option value="business">Business Applications</option>
                    <option value="iot-hardware">IoT & Hardware</option>
                </select>
            </div>
            <div class="form-group">
                <label>Count (max 50):</label>
                <input type="number" class="form-control" id="deployCount" value="50" min="1" max="50">
            </div>
            <div class="actions">
                <button class="btn btn-primary" onclick="deployBatch()">Deploy Batch</button>
            </div>
        </div>
        
        <div class="card">
            <h2>Memory Operations</h2>
            <div class="form-group">
                <label>Key:</label>
                <input type="text" class="form-control" id="memoryKey" placeholder="memory-key">
            </div>
            <div class="form-group">
                <label>Content:</label>
                <textarea class="form-control" id="memoryContent" rows="3" placeholder="Content to store"></textarea>
            </div>
            <div class="form-group">
                <label>Category (optional):</label>
                <input type="text" class="form-control" id="memoryCategory" placeholder="category">
            </div>
            <div class="actions">
                <button class="btn btn-success" onclick="storeMemory()">Store Memory</button>
                <button class="btn btn-primary" onclick="retrieveMemory()">Retrieve Memory</button>
            </div>
        </div>
        
        <div class="card">
            <h2>System Log</h2>
            <div class="log" id="log">System ready...</div>
        </div>
    </div>
    
    <script>
        let logElement = document.getElementById('log');
        
        function log(message) {
            const timestamp = new Date().toLocaleTimeString();
            logElement.innerHTML += \`\${timestamp}: \${message}\n\`;
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        function showStatus(message, isError = false) {
            const statusElement = document.getElementById('status');
            statusElement.textContent = message;
            statusElement.className = isError ? 'status-error' : 'status-success';
        }
        
        async function apiCall(url, options = {}) {
            try {
                const response = await fetch(url, {
                    headers: { 'Content-Type': 'application/json' },
                    ...options
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'API call failed');
                return data;
            } catch (error) {
                log(\`Error: \${error.message}\`);
                showStatus(error.message, true);
                throw error;
            }
        }
        
        async function startCoordinator() {
            try {
                const result = await apiCall('/coordinator/start', { method: 'POST' });
                log(result.message);
                showStatus('Coordinator started successfully');
                refreshStats();
            } catch (error) {
                // Error already logged
            }
        }
        
        async function stopCoordinator() {
            try {
                const result = await apiCall('/coordinator/stop', { method: 'POST' });
                log(result.message);
                showStatus('Coordinator stopped');
                refreshStats();
            } catch (error) {
                // Error already logged
            }
        }
        
        async function deployBatch() {
            const category = document.getElementById('deployCategory').value;
            const count = parseInt(document.getElementById('deployCount').value);
            
            try {
                const result = await apiCall('/deploy/batch', {
                    method: 'POST',
                    body: JSON.stringify({ category, count })
                });
                log(result.message);
                showStatus(\`Deploying \${count} servers in \${category} category\`);
                setTimeout(refreshStats, 2000);
            } catch (error) {
                // Error already logged
            }
        }
        
        async function storeMemory() {
            const key = document.getElementById('memoryKey').value;
            const content = document.getElementById('memoryContent').value;
            const category = document.getElementById('memoryCategory').value;
            
            if (!key || !content) {
                showStatus('Key and content are required', true);
                return;
            }
            
            try {
                const result = await apiCall('/memory/store', {
                    method: 'POST',
                    body: JSON.stringify({ key, content, category })
                });
                log(result.message);
                showStatus(\`Memory stored with key: \${key}\`);
            } catch (error) {
                // Error already logged
            }
        }
        
        async function retrieveMemory() {
            const key = document.getElementById('memoryKey').value;
            const category = document.getElementById('memoryCategory').value;
            
            if (!key) {
                showStatus('Key is required', true);
                return;
            }
            
            try {
                const result = await apiCall(\`/memory/retrieve/\${key}\${category ? '?category=' + category : ''}\`);
                log(result.message);
                showStatus(\`Memory retrieved for key: \${key}\`);
            } catch (error) {
                // Error already logged
            }
        }
        
        async function refreshStats() {
            try {
                const stats = await apiCall('/stats');
                
                document.getElementById('totalServers').textContent = stats.deployment.totalServers;
                document.getElementById('currentPhase').textContent = stats.deployment.currentPhase;
                document.getElementById('categories').textContent = stats.deployment.categories;
                document.getElementById('uptime').textContent = Math.floor(stats.proxy.uptime) + 's';
                
                const coordinatorStatus = stats.coordinator.running ? 'Running' : 'Stopped';
                log(\`Stats updated - Coordinator: \${coordinatorStatus}, Servers: \${stats.deployment.totalServers}\`);
            } catch (error) {
                // Error already logged
            }
        }
        
        // Auto-refresh stats every 30 seconds
        setInterval(refreshStats, 30000);
        
        // Initial stats load
        refreshStats();
    </script>
</body>
</html>
      `);
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🚀 MCP Proxy Server running on http://localhost:${this.port}`);
          console.log(`📊 Dashboard available at http://localhost:${this.port}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
    }
    
    // Stop coordinator if running
    if (this.coordinatorProcess) {
      this.coordinatorProcess.kill();
    }
    
    // Stop all MCP processes
    for (const [id, process] of this.mcpProcesses) {
      process.kill();
    }
    
    this.mcpProcesses.clear();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down MCP Proxy Server...');
  if (global.proxyServer) {
    await global.proxyServer.stop();
  }
  process.exit(0);
});

// Start the server
if (require.main === module) {
  const proxyServer = new MCPProxyServer();
  global.proxyServer = proxyServer;
  
  proxyServer.start().catch(error => {
    console.error('Failed to start proxy server:', error);
    process.exit(1);
  });
}

module.exports = MCPProxyServer;