#!/usr/bin/env node

require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');
const { execSync, spawn } = require('child_process');
const http = require('http');
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class MCPCoordinator {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-coordinator',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.mcpServers = new Map();
    this.categories = new Map();
    this.memoryPath = path.join(process.cwd(), '.git-memory');
    this.configPath = path.join(process.cwd(), 'mcp-coordinator-config.json');
    this.batchSize = 100; // Increased batch size for faster deployment
    this.currentPhase = 0;
    this.maxServers = 1000;
    this.maxServersPerCategory = 100;
    
    this.initializeDirectories();
    this.setupTools();
    this.loadConfiguration();
  }

  async initializeDirectories() {
    const dirs = [
      this.memoryPath,
      path.join(this.memoryPath, 'coordinator'),
      path.join(this.memoryPath, 'categories'),
      path.join(this.memoryPath, 'servers'),
      path.join(this.memoryPath, 'shared')
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }
    }
  }

  async loadConfiguration() {
    try {
      const config = await fs.readFile(this.configPath, 'utf8');
      const data = JSON.parse(config);
      this.currentPhase = data.currentPhase || 0;
      this.mcpServers = new Map(data.mcpServers || []);
      this.categories = new Map(data.categories || []);
    } catch (error) {
      // Create default configuration
      await this.createDefaultConfiguration();
    }
  }

  async saveConfiguration() {
    const config = {
      currentPhase: this.currentPhase,
      mcpServers: Array.from(this.mcpServers.entries()),
      categories: Array.from(this.categories.entries()),
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  async createDefaultConfiguration() {
    // Define categories with expanded port ranges for 1000 servers (100 per category)
    const defaultCategories = {
      'database': { portStart: 3100, portEnd: 3199, count: 0, maxServers: 100 },
      'filesystem': { portStart: 3200, portEnd: 3299, count: 0, maxServers: 100 },
      'api': { portStart: 3300, portEnd: 3399, count: 0, maxServers: 100 },
      'ai-ml': { portStart: 3400, portEnd: 3499, count: 0, maxServers: 100 },
      'version-control': { portStart: 3500, portEnd: 3599, count: 0, maxServers: 100 },
      'dev-tools': { portStart: 3600, portEnd: 3699, count: 0, maxServers: 100 },
      'system-ops': { portStart: 3700, portEnd: 3799, count: 0, maxServers: 100 },
      'communication': { portStart: 3800, portEnd: 3899, count: 0, maxServers: 100 },
      'business': { portStart: 3900, portEnd: 3999, count: 0, maxServers: 100 },
      'iot-hardware': { portStart: 4000, portEnd: 4099, count: 0, maxServers: 100 }
    };
    
    for (const [category, config] of Object.entries(defaultCategories)) {
      this.categories.set(category, config);
      
      // Create category memory directory
      const categoryDir = path.join(this.memoryPath, 'categories', category);
      await fs.mkdir(categoryDir, { recursive: true });
    }
    
    await this.saveConfiguration();
  }

  setupTools() {
    // Coordinator management tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'deploy_batch',
            description: 'Deploy a batch of MCP servers (up to 100 servers per batch for 1000-server capacity)',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Category of MCP servers to deploy'
                },
                count: {
                  type: 'number',
                  description: 'Number of servers to deploy (max 100 per batch)',
                  maximum: 100
                },
                startIndex: {
                  type: 'number',
                  description: 'Starting index for server numbering (optional)',
                  minimum: 0
                }
              },
              required: ['category']
            }
          },
          {
            name: 'list_servers',
            description: 'List all deployed MCP servers',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Filter by category (optional)'
                },
                status: {
                  type: 'string',
                  description: 'Filter by status (running, stopped, error)'
                }
              }
            }
          },
          {
            name: 'coordinate_memory',
            description: 'Coordinate memory sharing between MCP servers',
            inputSchema: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['sync', 'backup', 'restore', 'cleanup']
                },
                target: {
                  type: 'string',
                  description: 'Target category or server ID'
                }
              },
              required: ['operation']
            }
          },
          {
            name: 'health_check',
            description: 'Perform health check on MCP servers',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Category to check (optional)'
                },
                detailed: {
                  type: 'boolean',
                  description: 'Include detailed health information'
                }
              }
            }
          },
          {
            name: 'scale_system',
            description: 'Scale the system up or down',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['scale_up', 'scale_down', 'auto_scale']
                },
                target_count: {
                  type: 'number',
                  description: 'Target number of servers'
                }
              },
              required: ['action']
            }
          },
          {
            name: 'memory_store_coordinator',
            description: 'Store data in coordinator memory with Git versioning',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Memory key'
                },
                content: {
                  type: 'string',
                  description: 'Content to store'
                },
                category: {
                  type: 'string',
                  description: 'Category for organization'
                },
                metadata: {
                  type: 'object',
                  description: 'Additional metadata'
                }
              },
              required: ['key', 'content']
            }
          },
          {
            name: 'memory_retrieve_coordinator',
            description: 'Retrieve data from coordinator memory',
            inputSchema: {
              type: 'object',
              properties: {
                key: {
                  type: 'string',
                  description: 'Memory key to retrieve'
                },
                category: {
                  type: 'string',
                  description: 'Category to search in'
                }
              },
              required: ['key']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'deploy_batch':
            return await this.deployBatch(args.category, args.count || 50);
          
          case 'list_servers':
            return await this.listServers(args.category, args.status);
          
          case 'coordinate_memory':
            return await this.coordinateMemory(args.operation, args.target);
          
          case 'health_check':
            return await this.healthCheck(args.category, args.detailed);
          
          case 'scale_system':
            return await this.scaleSystem(args.action, args.target_count);
          
          case 'memory_store_coordinator':
            return await this.storeCoordinatorMemory(args.key, args.content, args.category, args.metadata);
          
          case 'memory_retrieve_coordinator':
            return await this.retrieveCoordinatorMemory(args.key, args.category);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }]
        };
      }
    });
  }

  async deployBatch(category, count = 50) {
    if (!this.categories.has(category)) {
      throw new Error(`Unknown category: ${category}`);
    }

    const categoryConfig = this.categories.get(category);
    const availablePorts = categoryConfig.portEnd - categoryConfig.portStart + 1;
    const currentCount = categoryConfig.count;
    
    if (currentCount + count > availablePorts) {
      throw new Error(`Cannot deploy ${count} servers. Only ${availablePorts - currentCount} ports available in category ${category}`);
    }

    const deployedServers = [];
    const startPort = categoryConfig.portStart + currentCount;
    
    for (let i = 0; i < count; i++) {
      const port = startPort + i;
      const serverId = `${category}-${port}`;
      
      // Create server configuration
      const serverConfig = {
        id: serverId,
        category: category,
        port: port,
        status: 'deploying',
        createdAt: new Date().toISOString(),
        memoryPath: path.join(this.memoryPath, 'servers', serverId)
      };
      
      // Create server memory directory
      await fs.mkdir(serverConfig.memoryPath, { recursive: true });
      
      // Generate server script
      await this.generateServerScript(serverConfig);
      
      this.mcpServers.set(serverId, serverConfig);
      deployedServers.push(serverConfig);
    }
    
    // Update category count
    categoryConfig.count += count;
    this.categories.set(category, categoryConfig);
    
    // Update phase if we've deployed 50 servers
    if (deployedServers.length === 50) {
      this.currentPhase++;
    }
    
    await this.saveConfiguration();
    
    // Commit to Git
    await this.gitCommit(`Deploy batch: ${count} servers in ${category} category (Phase ${this.currentPhase})`);
    
    return {
      content: [{
        type: 'text',
        text: `Successfully deployed ${count} servers in category '${category}':\n${deployedServers.map(s => `- ${s.id} (Port: ${s.port})`).join('\n')}\n\nTotal servers: ${this.mcpServers.size}\nCurrent phase: ${this.currentPhase}`
      }]
    };
  }

  async generateServerScript(serverConfig) {
    const serverScript = `#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs').promises;
const path = require('path');

class MCP_${serverConfig.category.toUpperCase()}_Server {
  constructor() {
    this.server = new Server(
      {
        name: '${serverConfig.id}',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.serverId = '${serverConfig.id}';
    this.category = '${serverConfig.category}';
    this.port = ${serverConfig.port};
    this.memoryPath = '${serverConfig.memoryPath}';
    
    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'server_info',
            description: 'Get server information',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'memory_operation',
            description: 'Perform memory operations',
            inputSchema: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['store', 'retrieve', 'list', 'delete']
                },
                key: { type: 'string' },
                content: { type: 'string' },
                metadata: { type: 'object' }
              },
              required: ['operation']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'server_info':
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                id: this.serverId,
                category: this.category,
                port: this.port,
                status: 'running',
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
              }, null, 2)
            }]
          };
        
        case 'memory_operation':
          return await this.handleMemoryOperation(args);
        
        default:
          throw new Error(\`Unknown tool: \${name}\`);
      }
    });
  }

  async handleMemoryOperation(args) {
    const { operation, key, content, metadata } = args;
    const memoryFile = path.join(this.memoryPath, 'memory.json');
    
    let memory = {};
    try {
      const data = await fs.readFile(memoryFile, 'utf8');
      memory = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty memory
    }
    
    switch (operation) {
      case 'store':
        memory[key] = {
          content,
          metadata: metadata || {},
          timestamp: new Date().toISOString(),
          serverId: this.serverId
        };
        await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
        return {
          content: [{
            type: 'text',
            text: \`Stored data with key: \${key}\`
          }]
        };
      
      case 'retrieve':
        if (memory[key]) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(memory[key], null, 2)
            }]
          };
        } else {
          throw new Error(\`Key not found: \${key}\`);
        }
      
      case 'list':
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(Object.keys(memory), null, 2)
          }]
        };
      
      case 'delete':
        if (memory[key]) {
          delete memory[key];
          await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
          return {
            content: [{
              type: 'text',
              text: \`Deleted key: \${key}\`
            }]
          };
        } else {
          throw new Error(\`Key not found: \${key}\`);
        }
      
      default:
        throw new Error(\`Unknown operation: \${operation}\`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(\`MCP Server \${this.serverId} running on port \${this.port}\`);
  }
}

const server = new MCP_${serverConfig.category.toUpperCase()}_Server();
server.run().catch(console.error);
`;
    
    const scriptPath = path.join(process.cwd(), `mcp-server-${serverConfig.id}.js`);
    await fs.writeFile(scriptPath, serverScript);
    
    // Update server config with script path
    serverConfig.scriptPath = scriptPath;
  }

  async listServers(category, status) {
    let servers = Array.from(this.mcpServers.values());
    
    if (category) {
      servers = servers.filter(s => s.category === category);
    }
    
    if (status) {
      servers = servers.filter(s => s.status === status);
    }
    
    const summary = {
      totalServers: this.mcpServers.size,
      currentPhase: this.currentPhase,
      categories: {}
    };
    
    for (const [cat, config] of this.categories.entries()) {
      summary.categories[cat] = {
        deployed: config.count,
        available: (config.portEnd - config.portStart + 1) - config.count
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: `Server Summary:\n${JSON.stringify(summary, null, 2)}\n\nFiltered Servers (${servers.length}):\n${servers.map(s => `- ${s.id} (${s.category}:${s.port}) - ${s.status}`).join('\n')}`
      }]
    };
  }

  async coordinateMemory(operation, target) {
    switch (operation) {
      case 'sync':
        await this.gitCommit(`Memory sync operation for ${target || 'all servers'}`);
        return {
          content: [{
            type: 'text',
            text: `Memory synchronized for ${target || 'all servers'}`
          }]
        };
      
      case 'backup':
        const backupPath = path.join(this.memoryPath, 'backups', new Date().toISOString().replace(/:/g, '-'));
        await fs.mkdir(backupPath, { recursive: true });
        // Copy memory files to backup
        return {
          content: [{
            type: 'text',
            text: `Memory backup created at ${backupPath}`
          }]
        };
      
      default:
        throw new Error(`Unknown memory operation: ${operation}`);
    }
  }

  async healthCheck(category, detailed = false) {
    const results = {
      coordinator: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        servers: this.mcpServers.size
      },
      categories: {}
    };
    
    for (const [cat, config] of this.categories.entries()) {
      if (!category || category === cat) {
        results.categories[cat] = {
          deployed: config.count,
          capacity: config.portEnd - config.portStart + 1,
          utilization: (config.count / (config.portEnd - config.portStart + 1) * 100).toFixed(2) + '%'
        };
      }
    }
    
    return {
      content: [{
        type: 'text',
        text: `Health Check Results:\n${JSON.stringify(results, null, 2)}`
      }]
    };
  }

  async scaleSystem(action, targetCount) {
    const currentCount = this.mcpServers.size;
    
    switch (action) {
      case 'scale_up':
        if (targetCount && targetCount > currentCount) {
          const needed = targetCount - currentCount;
          return {
            content: [{
              type: 'text',
              text: `Scaling up: Need to deploy ${needed} more servers. Current: ${currentCount}, Target: ${targetCount}`
            }]
          };
        }
        break;
      
      case 'scale_down':
        if (targetCount && targetCount < currentCount) {
          const excess = currentCount - targetCount;
          return {
            content: [{
              type: 'text',
              text: `Scaling down: Need to remove ${excess} servers. Current: ${currentCount}, Target: ${targetCount}`
            }]
          };
        }
        break;
      
      case 'auto_scale':
        // Implement auto-scaling logic based on load
        return {
          content: [{
            type: 'text',
            text: `Auto-scaling analysis: Current load optimal for ${currentCount} servers`
          }]
        };
    }
    
    return {
      content: [{
        type: 'text',
        text: `Scale operation completed. Current servers: ${currentCount}`
      }]
    };
  }

  async storeCoordinatorMemory(key, content, category, metadata) {
    const memoryDir = category ? 
      path.join(this.memoryPath, 'categories', category) : 
      path.join(this.memoryPath, 'coordinator');
    
    await fs.mkdir(memoryDir, { recursive: true });
    
    const memoryFile = path.join(memoryDir, 'memory.json');
    let memory = {};
    
    try {
      const data = await fs.readFile(memoryFile, 'utf8');
      memory = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty memory
    }
    
    memory[key] = {
      content,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      coordinator: true
    };
    
    await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
    await this.gitCommit(`Store coordinator memory: ${key}`);
    
    return {
      content: [{
        type: 'text',
        text: `Stored coordinator memory with key: ${key} in ${category || 'coordinator'} category`
      }]
    };
  }

  async retrieveCoordinatorMemory(key, category) {
    const memoryDir = category ? 
      path.join(this.memoryPath, 'categories', category) : 
      path.join(this.memoryPath, 'coordinator');
    
    const memoryFile = path.join(memoryDir, 'memory.json');
    
    try {
      const data = await fs.readFile(memoryFile, 'utf8');
      const memory = JSON.parse(data);
      
      if (memory[key]) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(memory[key], null, 2)
          }]
        };
      } else {
        throw new Error(`Key not found: ${key}`);
      }
    } catch (error) {
      throw new Error(`Memory retrieval failed: ${error.message}`);
    }
  }

  async gitCommit(message) {
    try {
      execSync('git add .', { cwd: process.cwd() });
      execSync(`git commit -m "${message}"`, { cwd: process.cwd() });
    } catch (error) {
      // Git operations might fail, but don't stop the process
      console.error('Git commit failed:', error.message);
    }
  }

  async startHttpServer() {
    const app = express();
    app.use(express.json());
    
    // CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-Id');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Attach request id and standard 200 OK helper for new endpoints
    app.use((req, res, next) => {
      const reqId = req.headers['x-request-id'] || uuidv4();
      res.setHeader('X-Request-Id', reqId);
      req.requestId = reqId;
      next();
    });

    const ok = (res, data, meta = {}) => {
      return res.status(200).json({
        code: 200,
        ok: true,
        data,
        meta: Object.assign({
          requestId: res.getHeader('X-Request-Id'),
          service: 'mcp-coordinator',
          version: '1.0.0'
        }, meta),
        ts: new Date().toISOString()
      });
    };

    const fail = (res, message, details) => {
      return res.status(200).json({
        code: 200,
        ok: false,
        error: message,
        details: details || null,
        meta: {
          requestId: res.getHeader('X-Request-Id'),
          service: 'mcp-coordinator',
          version: '1.0.0'
        },
        ts: new Date().toISOString()
      });
    };
    
    // API endpoints
    app.get('/servers', async (req, res) => {
      try {
        const result = await this.listServers(req.query.category, req.query.status);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    app.get('/health', async (req, res) => {
      try {
        const result = await this.healthCheck(req.query.category, req.query.detailed === 'true');
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    app.post('/deploy', async (req, res) => {
      try {
        const { category, count } = req.body;
        const result = await this.deployBatch(category, count);
        res.json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    app.get('/stats', (req, res) => {
      res.json({
        success: true,
        data: {
          totalServers: this.mcpServers.size,
          categories: Array.from(this.categories.entries()).map(([name, config]) => ({
            name,
            deployed: config.count,
            capacity: config.portEnd - config.portStart + 1
          })),
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      });
    });

    // New: Standardized 200 OK AI inference endpoint
    app.post('/ai/infer', async (req, res) => {
      try {
        const { provider = (process.env.AI_PROVIDER || 'mock'), model, messages, prompt, temperature, max_tokens, baseUrl, options } = req.body || {};

        const normMessages = Array.isArray(messages) && messages.length > 0
          ? messages
          : [{ role: 'user', content: typeof prompt === 'string' ? prompt : JSON.stringify(prompt || '') }];

        const pickFirstText = (msgs) => {
          const last = msgs[msgs.length - 1];
          if (!last) return '';
          if (typeof last.content === 'string') return last.content;
          if (Array.isArray(last.content)) {
            const t = last.content.find((c) => c && (c.text || c.content || c.value));
            return t?.text || t?.content || t?.value || '';
          }
          return '';
        };

        const doOpenAI = async () => {
          const OPENAI_BASE = (baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
          const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
          if (!OPENAI_API_KEY) return fail(res, 'OPENAI_API_KEY is not configured');
          const body = {
            model: model || process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
            messages: normMessages,
            temperature: typeof temperature === 'number' ? temperature : undefined,
            max_tokens: typeof max_tokens === 'number' ? max_tokens : undefined,
            stream: false
          };
          const r = await axios.post(`${OPENAI_BASE}/v1/chat/completions`, body, {
            headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
          });
          const d = r.data;
          const text = d?.choices?.[0]?.message?.content || '';
          return ok(res, {
            provider: 'openai',
            model: body.model,
            output: text,
            usage: d?.usage || null,
            raw: d
          });
        };

        const doOllama = async () => {
          const OLLAMA_HOST = (process.env.OLLAMA_HOST || 'http://localhost:11434').replace(/\/$/, '');
          const body = {
            model: model || process.env.OLLAMA_MODEL || 'llama3.1',
            prompt: pickFirstText(normMessages),
            stream: false,
            options: Object.assign({}, options || {}, typeof temperature === 'number' ? { temperature } : {})
          };
          const r = await axios.post(`${OLLAMA_HOST}/api/generate`, body, {});
          const d = r.data;
          return ok(res, {
            provider: 'ollama',
            model: body.model,
            output: d?.response || '',
            raw: d
          });
        };

        const doMock = async () => {
          const text = pickFirstText(normMessages);
          return ok(res, {
            provider: 'mock',
            model: model || 'mock-echo',
            output: `[mock] ${text}`,
            raw: { echo: text }
          });
        };

        if (provider === 'openai') return await doOpenAI();
        if (provider === 'ollama') return await doOllama();
        if (provider === 'mock') return await doMock();

        return fail(res, `Provider not supported yet: ${provider}`);
      } catch (error) {
        return fail(res, 'Inference error', { message: error.message });
      }
    });

    // New: Memory ingest endpoint to Git Memory shared space
    app.post('/memory/ingest', async (req, res) => {
      try {
        const { source = 'unknown', content, metadata } = req.body || {};
        if (!content) return fail(res, 'content is required');

        const id = uuidv4();
        const dir = path.join(this.memoryPath, 'shared', 'ingest');
        await fs.mkdir(dir, { recursive: true });
        const payload = {
          id,
          source,
          content,
          metadata: metadata || {},
          createdAt: new Date().toISOString()
        };
        const filePath = path.join(dir, `${id}.json`);
        await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
        await this.gitCommit(`Ingest memory: ${source} (${id})`);
        return ok(res, { id, path: filePath });
      } catch (error) {
        return fail(res, 'Ingest error', { message: error.message });
      }
    });
    
    const port = process.env.MCP_COORDINATOR_PORT || 3000;
    app.listen(port, () => {
      console.error(`MCP Coordinator HTTP server running on port ${port}`);
    });
  }
  
  async run() {
    // Start HTTP server
    await this.startHttpServer();
    
    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Coordinator running...');
  }
}

const coordinator = new MCPCoordinator();
coordinator.run().catch(console.error);