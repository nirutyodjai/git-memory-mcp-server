import { spawn } from 'child_process';

// Test adding data to the memory server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestId = 1;

// Function to send request
function sendRequest(method, params) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method: 'tools/call',
    params: {
      name: method,
      arguments: params
    }
  };
  server.stdin.write(JSON.stringify(request) + '\n');
}

let responseCount = 0;
const expectedResponses = 4;

server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
  responseCount++;
  
  if (responseCount >= expectedResponses) {
    server.kill();
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Wait a bit for server to start, then send requests
setTimeout(() => {
  // Create entities
  sendRequest('create_entities', {
    entities: [
      {
        name: 'User',
        entityType: 'Person',
        observations: ['A software developer', 'Uses React and Node.js']
      },
      {
        name: 'Project',
        entityType: 'Software',
        observations: ['Web application', 'Built with modern technologies']
      }
    ]
  });
  
  // Create relations
  sendRequest('create_relations', {
    relations: [
      {
        from: 'User',
        to: 'Project',
        relationType: 'develops'
      }
    ]
  });
  
  // Add observations
  sendRequest('add_observations', {
    entityName: 'User',
    observations: ['Experienced with TypeScript', 'Prefers modern UI frameworks']
  });
  
  // Read the updated graph
  sendRequest('read_graph', {});
}, 1000);