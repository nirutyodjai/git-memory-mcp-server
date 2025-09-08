#!/usr/bin/env node

/**
 * mcp-server-ai-ml-3500 - MCP Server (ai-ml)
 * Port: 3500
 * This is a bridge script that starts the actual server
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the actual MCP server
const serverPath = path.join(__dirname, 'servers', 'ai-ml', '1', 'ai-ml-001.js');
const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: __dirname
});

serverProcess.on('error', (error) => {
    console.error(`Failed to start ai-ml-001 server: ${error.message}`);
    process.exit(1);
});

serverProcess.on('exit', (code) => {
    console.log(`ai-ml-001 server exited with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Terminating ai-ml-001 server...');
    serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('Terminating ai-ml-001 server...');
    serverProcess.kill('SIGTERM');
});