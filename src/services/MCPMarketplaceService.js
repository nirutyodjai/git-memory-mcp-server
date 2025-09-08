class MCPMarketplaceService {
    constructor() {
        this.servers = [
            { id: 'server1', name: 'Git Memory Server', description: 'Git repository management with persistent memory', author: 'Community', price: 0, rating: 4.5 },
            { id: 'server2', name: '3D SCO Memory', description: '3D scene memory management', author: 'Community', price: 0, rating: 4.2 },
            { id: 'server3', name: 'Figma Developer MCP', description: 'Figma design system integration', author: 'Community', price: 0, rating: 4.8 },
        ];
    }

    async getServers() {
        return this.servers;
    }

    async getServerById(id) {
        return this.servers.find(server => server.id === id);
    }
}

module.exports = new MCPMarketplaceService();