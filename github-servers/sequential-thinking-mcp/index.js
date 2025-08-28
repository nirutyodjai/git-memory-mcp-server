#!/usr/bin/env node

const express = require('express');
const app = express();
const port = 4014;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'sequential-thinking-mcp',
        description: 'Sequential thinking and reasoning capabilities',
        category: 'ai-reasoning',
        port: port,
        uptime: process.uptime()
    });
});

// Mock MCP endpoints
app.get('/capabilities', (req, res) => {
    res.json({
        tools: [
            {
                name: 'sequential-thinking_operation',
                description: 'Sequential thinking and reasoning capabilities'
            }
        ],
        resources: [],
        prompts: []
    });
});

app.post('/tools/call', (req, res) => {
    const { name, arguments: args } = req.body;
    res.json({
        content: [
            {
                type: 'text',
                text: `Mock response from ${name} with args: ${JSON.stringify(args)}`
            }
        ]
    });
});

app.listen(port, () => {
    console.log(`🚀 ${packageJson.name} running on port ${port}`);
    console.log(`📝 Description: ${packageJson.description}`);
    console.log(`🏷️ Category: ai-reasoning`);
});
