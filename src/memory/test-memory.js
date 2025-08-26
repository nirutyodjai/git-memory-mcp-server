import { spawn } from 'child_process';

// Test the memory server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a test request to read the graph
const testRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'read_graph',
    arguments: {}
  }
};

server.stdin.write(JSON.stringify(testRequest) + '\n');

server.stdout.on('data', (data) => {
  console.log('Server response:', data.toString());
  server.kill();
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});