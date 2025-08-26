import { spawn } from 'child_process';

// Test reading the populated knowledge graph
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a request to read the graph
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'read_graph',
    arguments: {}
  }
};

server.stdout.on('data', (data) => {
  const response = data.toString();
  console.log('=== Knowledge Graph Contents ===');
  
  try {
    const parsed = JSON.parse(response);
    if (parsed.result && parsed.result.content) {
      const graphData = JSON.parse(parsed.result.content[0].text);
      
      console.log('\n📊 ENTITIES:');
      graphData.entities.forEach((entity, index) => {
        console.log(`${index + 1}. ${entity.name} (${entity.entityType})`);
        entity.observations.forEach(obs => {
          console.log(`   • ${obs}`);
        });
        console.log('');
      });
      
      console.log('🔗 RELATIONS:');
      graphData.relations.forEach((relation, index) => {
        console.log(`${index + 1}. ${relation.from} --[${relation.relationType}]--> ${relation.to}`);
      });
    }
  } catch (e) {
    console.log('Raw response:', response);
  }
  
  server.kill();
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  console.log('\n✅ Memory system demonstration complete!');
});

// Wait for server to start, then send request
setTimeout(() => {
  server.stdin.write(JSON.stringify(testRequest) + '\n');
}, 500);