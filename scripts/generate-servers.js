const fs = require('fs');
const path = require('path');

console.log('🚀 Generating 500 MCP Servers configuration...');

const servers = [];
const categories = ['api', 'database', 'file-system', 'ai-ml', 'version-control'];
const tools = {
  api: ['api_get', 'api_post', 'api_put', 'api_delete'],
  database: ['db_query', 'db_insert', 'db_update', 'db_delete'],
  'file-system': ['file_read', 'file_write', 'file_delete', 'file_list'],
  'ai-ml': ['text_analyze', 'image_process', 'model_predict', 'data_transform'],
  'version-control': ['git_clone', 'git_commit', 'git_push', 'git_pull']
};

// Generate 495 external servers (we already have 5 in the base config)
for(let i = 1; i <= 495; i++) {
  const category = categories[i % 5];
  const serverTools = tools[category].map(toolName => ({
    name: `${toolName}_${i}`,
    description: `${toolName} for server ${i}`,
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' }
      }
    }
  }));
  
  servers.push({
    id: `external-server-${String(i).padStart(3, '0')}`,
    name: `External MCP Server ${i}`,
    endpoint: `http://localhost:${3000 + i}/mcp`,
    type: 'http',
    category: category,
    enabled: true,
    priority: Math.floor(i / 100) + 1,
    tools: serverTools,
    healthCheck: {
      enabled: true,
      interval: 60000,
      timeout: 5000
    },
    loadBalancing: {
      weight: 1,
      maxConnections: 10
    }
  });
}

const config = {
  version: '2.0.0',
  description: 'Configuration for 500 External MCP Servers',
  totalServers: 500,
  discovery: {
    enabled: true,
    methods: ['registry', 'endpoints', 'environment', 'config'],
    interval: 300000,
    timeout: 30000
  },
  loadBalancing: {
    strategy: 'round-robin',
    healthCheckEnabled: true,
    failoverEnabled: true
  },
  servers: servers
};

// Write to config file
const configPath = path.join(__dirname, '..', 'config', 'external-servers-500.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log(`✅ Generated ${servers.length} additional servers`);
console.log(`📁 Configuration saved to: ${configPath}`);
console.log(`🎯 Total servers available: 500`);

// Generate summary
const summary = {
  totalServers: 500,
  categories: {},
  endpoints: {
    startPort: 3001,
    endPort: 3495
  }
};

categories.forEach(cat => {
  summary.categories[cat] = servers.filter(s => s.category === cat).length;
});

console.log('\n📊 Server Distribution:');
Object.entries(summary.categories).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} servers`);
});

console.log(`\n🌐 Port Range: ${summary.endpoints.startPort} - ${summary.endpoints.endPort}`);
console.log('\n🎉 Server generation completed!');