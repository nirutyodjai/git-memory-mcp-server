
const express = require('express');
const cors = require('cors');

class mcpserverlinearServer {
    constructor() {
        this.name = 'mcp-server-linear';
        this.port = 9006;
        this.category = 'project-management';
        this.app = express();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.startServer();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    setupRoutes() {
        // Health check
        this.app.get(['/', '/health'], (req, res) => {
            res.json({
                status: 'healthy',
                name: this.name,
                category: this.category,
                port: this.port,
                timestamp: new Date().toISOString()
            });
        });

        // MCP Protocol endpoints
        this.app.get('/tools', (req, res) => {
            res.json({
                tools: this.getAvailableTools()
            });
        });

        this.app.post('/call', (req, res) => {
            const { tool, arguments: args } = req.body;
            res.json({
                success: true,
                result: `Tool ${tool} executed successfully`,
                server: this.name,
                timestamp: new Date().toISOString()
            });
        });
    }

    getAvailableTools() {
        const categoryTools = {
            'search': ['search_web', 'search_documents'],
            'productivity': ['create_task', 'update_task', 'get_tasks'],
            'notes': ['create_note', 'update_note', 'search_notes'],
            'project-management': ['create_issue', 'update_issue', 'get_projects'],
            'default': ['ping', 'status']
        };
        
        const tools = categoryTools[this.category] || categoryTools.default;
        return tools.map(tool => ({
            name: tool,
            description: `${tool.replace('_', ' ')} operation`,
            category: this.category
        }));
    }

    startServer() {
        this.app.listen(this.port, () => {
            console.log(`[${this.name}] Server running on port ${this.port}`);
        });
    }
}

new mcpserverlinearServer();
