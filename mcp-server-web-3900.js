#!/usr/bin/env node

/**
 * mcp-server-web-3900 - MCP Server (web)
 * Port: 3900
 * This is a bridge script that starts the actual server
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the actual MCP server
const serverPath = path.join(__dirname, 'servers', 'web', '1', 'web-001.js');
const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: __dirname
});

serverProcess.on('error', (error) => {
    console.error(`Failed to start web-001 server: ${error.message}`);
    process.exit(1);
});

serverProcess.on('exit', (code) => {
    console.log(`web-001 server exited with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Terminating web-001 server...');
    serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('Terminating web-001 server...');
    serverProcess.kill('SIGTERM');
});