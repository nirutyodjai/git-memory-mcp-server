#!/usr/bin/env node

/**
 * mcp-server-database-3110 - MCP Server (database)
 * Port: 3110
 * This is a bridge script that starts the actual server
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the actual MCP server
const serverPath = path.join(__dirname, 'servers', 'database', '3110.js');
const serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    cwd: __dirname
});

serverProcess.on('error', (error) => {
    console.error(`Failed to start database-3110 server: ${error.message}`);
    process.exit(1);
});

serverProcess.on('exit', (code) => {
    console.log(`database-3110 server exited with code ${code}`);
    process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Terminating database-3110 server...');
    serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('Terminating database-3110 server...');
    serverProcess.kill('SIGTERM');
});