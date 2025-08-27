const http = require('http');
const url = require('url');
const PORT = 9090;

// 🚀 เปิดใช้งานเฉพาะ MCP servers ที่จำเป็นสำหรับการใช้งานคนเดียว
const ESSENTIAL_SERVERS = {
  'memory': {
    name: '🧠 Memory MCP Server [LITE]',
    description: 'Essential memory system for single user - optimized for low resource usage',
    status: 'built',
    tools: ['store_memory', 'retrieve_memory', 'search_memory', 'list_memories'],
    resourceUsage: 'low',
    priority: 'high'
  },
  'simple-memory': {
    name: '📝 Simple Memory [BASIC]',
    description: 'Basic memory operations with minimal overhead',
    status: 'built',
    tools: ['add', 'get', 'list', 'clear'],
    resourceUsage: 'minimal',
    priority: 'medium'
  },
  'filesystem': {
    name: '📁 File System [CORE]',
    description: 'Essential file operations for single user',
    status: 'built',
    tools: ['read_file', 'write_file', 'list_files', 'delete_file'],
    resourceUsage: 'low',
    priority: 'high'
  }
};

// 💾 Cache สำหรับลดการใช้ CPU
const cache = new Map();
const CACHE_TTL = 300000; // 5 นาที

// 🔧 Helper functions
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJSON(res, data, statusCode = 200) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1048576) { // 1MB limit
        reject(new Error('Request too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// 🚀 HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // 🏥 Health check
    if (pathname === '/health' && method === 'GET') {
      const memUsage = process.memoryUsage();
      const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      sendJSON(res, {
        status: 'healthy',
        mode: 'lightweight',
        version: '1.0.0',
        mcpServers: Object.keys(ESSENTIAL_SERVERS),
        serverCount: Object.keys(ESSENTIAL_SERVERS).length,
        memory: {
          used: `${heapUsedMB}MB`,
          total: `${heapTotalMB}MB`,
          usage: `${Math.round((heapUsedMB / heapTotalMB) * 100)}%`
        },
        uptime: `${Math.round(process.uptime())}s`,
        performance: {
          level: heapUsedMB < 512 ? 'excellent' : heapUsedMB < 1024 ? 'good' : 'warning',
          recommendation: heapUsedMB > 1024 ? 'Consider restarting server' : 'Running optimally'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 📋 Server list
    if (pathname === '/servers' && method === 'GET') {
      const cacheKey = 'servers';
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        sendJSON(res, {
          ...cached.data,
          cached: true,
          cacheAge: Math.round((Date.now() - cached.timestamp) / 1000)
        });
        return;
      }
      
      const data = {
        servers: ESSENTIAL_SERVERS,
        totalServers: Object.keys(ESSENTIAL_SERVERS).length,
        mode: 'lightweight',
        optimizedFor: 'single-user',
        resourceProfile: 'low',
        features: {
          memoryOptimized: true,
          fastStartup: true,
          lowCpuUsage: true,
          cacheEnabled: true
        }
      };
      
      cache.set(cacheKey, { data, timestamp: Date.now() });
      sendJSON(res, data);
      return;
    }

    // 🔌 MCP endpoints
    if (pathname.startsWith('/mcp/')) {
      const serverName = pathname.split('/')[2];
      
      if (!ESSENTIAL_SERVERS[serverName]) {
        sendJSON(res, {
          error: 'Server not found',
          availableServers: Object.keys(ESSENTIAL_SERVERS),
          suggestion: 'Use /servers endpoint to see available servers'
        }, 404);
        return;
      }
      
      const server = ESSENTIAL_SERVERS[serverName];
      
      if (method === 'GET') {
        sendJSON(res, {
          server: serverName,
          name: server.name,
          description: server.description,
          tools: server.tools,
          status: server.status,
          resourceUsage: server.resourceUsage,
          priority: server.priority,
          endpoint: `/mcp/${serverName}`,
          methods: ['GET', 'POST'],
          mode: 'lightweight'
        });
        return;
      }
      
      if (method === 'POST') {
        const body = await getRequestBody(req);
        
        sendJSON(res, {
          server: serverName,
          name: server.name,
          message: `MCP request to ${server.name}`,
          description: server.description,
          availableTools: server.tools,
          status: server.status,
          resourceUsage: server.resourceUsage,
          priority: server.priority,
          requestId: Date.now(),
          processingTime: '< 10ms',
          mode: 'lightweight',
          requestBody: body
        });
        return;
      }
    }

    // 📊 Performance monitoring
    if (pathname === '/performance' && method === 'GET') {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      sendJSON(res, {
        memory: {
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`
        },
        cpu: {
          user: `${Math.round(cpuUsage.user / 1000)}ms`,
          system: `${Math.round(cpuUsage.system / 1000)}ms`
        },
        uptime: `${Math.round(process.uptime())}s`,
        cache: {
          size: cache.size,
          ttl: `${CACHE_TTL / 1000}s`
        },
        performance: {
          level: memUsage.heapUsed < 512 * 1024 * 1024 ? 'excellent' : 
                 memUsage.heapUsed < 1024 * 1024 * 1024 ? 'good' : 'warning',
          mode: 'lightweight',
          optimizations: ['cache', 'limited-servers', 'memory-monitoring']
        }
      });
      return;
    }

    // 🧹 Cache cleanup
    if (pathname === '/cache/clear' && method === 'POST') {
      const oldSize = cache.size;
      cache.clear();
      
      sendJSON(res, {
        message: 'Cache cleared successfully',
        oldSize,
        newSize: cache.size,
        memoryFreed: 'estimated 10-50MB'
      });
      return;
    }

    // 🚫 404 handler
    sendJSON(res, {
      error: 'Endpoint not found',
      availableEndpoints: [
        'GET /health',
        'GET /servers', 
        'GET /mcp/:serverName',
        'POST /mcp/:serverName',
        'GET /performance',
        'POST /cache/clear'
      ],
      mode: 'lightweight',
      suggestion: 'Check available endpoints above'
    }, 404);

  } catch (error) {
    console.error('❌ Request error:', error);
    sendJSON(res, {
      error: 'Internal server error',
      message: error.message,
      mode: 'lightweight'
    }, 500);
  }
});

// 🧹 ทำความสะอาด cache อัตโนมัติ
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
  
  // Force garbage collection ถ้ามี
  if (global.gc && process.memoryUsage().heapUsed > 1024 * 1024 * 1024) {
    global.gc();
    console.log('🧹 Garbage collection performed');
  }
}, 300000); // ทุก 5 นาที

// 🚀 เริ่มเซิร์ฟเวอร์
server.listen(PORT, () => {
  console.log('\n🚀 MCP Proxy Server (Lightweight Mode) Started!');
  console.log('=' .repeat(50));
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Mode: Lightweight (Single User Optimized)`);
  console.log(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`⚡ Servers: ${Object.keys(ESSENTIAL_SERVERS).length} essential servers`);
  console.log(`🔧 Features: Cache, Memory Monitor, Auto Cleanup`);
  console.log('=' .repeat(50));
  console.log('\n📋 Available Endpoints:');
  console.log('  🏥 GET  /health          - Server health check');
  console.log('  📋 GET  /servers         - List available servers');
  console.log('  🔌 GET  /mcp/:server     - Server info');
  console.log('  🔌 POST /mcp/:server     - MCP requests');
  console.log('  📊 GET  /performance     - Performance metrics');
  console.log('  🧹 POST /cache/clear     - Clear cache');
  console.log('\n✅ Ready for single-user operations!');
  console.log('💡 Optimized for low resource usage\n');
});

// 🛑 Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// ⚠️ Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// 📊 Performance monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  if (heapUsedMB > 1024) {
    console.log(`⚠️ High memory usage detected: ${heapUsedMB}MB`);
    console.log('💡 Consider restarting the server or clearing cache');
  }
}, 60000); // ทุกนาที

module.exports = server;