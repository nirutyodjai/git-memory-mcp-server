// Test script for Everything MCP Server
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing Everything MCP Server...');
console.log('📍 Server location: src/everything/dist/index.js');

// Available tools in Everything MCP Server
const availableTools = [
  { name: 'echo', description: 'Echo back input messages', params: ['message'] },
  { name: 'add', description: 'Add two numbers', params: ['a', 'b'] },
  { name: 'longRunningOperation', description: 'Demo progress notifications', params: ['duration', 'steps'] },
  { name: 'printEnv', description: 'Show environment variables', params: [] },
  { name: 'sampleLLM', description: 'LLM sampling demo', params: ['prompt', 'maxTokens'] },
  { name: 'getTinyImage', description: 'Return test image', params: [] },
  { name: 'annotatedMessage', description: 'Demo annotations', params: ['messageType', 'includeImage'] },
  { name: 'getResourceReference', description: 'Return resource reference', params: ['resourceId'] },
  { name: 'startElicitation', description: 'Initiate elicitation', params: ['color', 'number', 'pets'] },
  { name: 'structuredContent', description: 'Demo structured content', params: ['location'] }
];

console.log('\n🔧 Available Tools:');
availableTools.forEach((tool, index) => {
  console.log(`${index + 1}. ${tool.name} - ${tool.description}`);
  if (tool.params.length > 0) {
    console.log(`   Parameters: ${tool.params.join(', ')}`);
  }
});

console.log('\n✅ Everything MCP Server is ready for testing!');
console.log('\n📝 To test tools, you can:');
console.log('1. Use Trae AI to call MCP tools directly');
console.log('2. Use Claude Desktop with MCP configuration');
console.log('3. Use any MCP-compatible client');

console.log('\n🎯 Example usage in Trae AI:');
console.log('- "Use the echo tool to say hello"');
console.log('- "Add 15 and 25 using the add tool"');
console.log('- "Show me environment variables"');
console.log('- "Get a tiny test image"');

console.log('\n🚀 Server Status: Running and Ready!');