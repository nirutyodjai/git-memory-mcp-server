const EventEmitter = require('events');

/**
 * @class MarketplaceService
 * @description Manages the MCP Marketplace, including server listings, installations, and revenue sharing.
 * 
 * @emits server-published - When a new server is published to the marketplace.
 * @emits server-installed - When a server is installed from the marketplace.
 */
class MarketplaceService extends EventEmitter {
    constructor() {
        super();
        // Mock data for demonstration
        this.serverListings = new Map([
            ['git-memory-server', {
                id: 'git-memory-server',
                name: 'Git Memory Server',
                author: 'Community',
                description: 'Git repository management with persistent memory',
                category: 'Core Servers',
                price: 0,
                status: 'approved',
                publishedAt: new Date(),
                version: '1.2.1',
            }],
            ['3d-sco-memory', {
                id: '3d-sco-memory',
                name: '3D SCO Memory',
                author: 'Community',
                description: '3D scene memory management',
                category: 'Core Servers',
                price: 0,
                status: 'approved',
                publishedAt: new Date(),
                version: '1.0.0',
            }]
        ]);
        this.installations = new Map();
        this.revenueSharing = {
            platform_fee: 0.30, // 30% platform fee
            developer_share: 0.70, // 70% for the developer
        };
    }

    /**
     * @description Publish a new MCP server to the marketplace.
     * @param {Object} serverDetails - The details of the server to publish.
     * @returns {Promise<Object>} The newly published server listing.
     */
    async publishServer(serverDetails) {
        const serverId = `server_${Date.now()}`;
        const newListing = {
            id: serverId,
            ...serverDetails,
            status: 'pending_review', // All new servers require review
            publishedAt: new Date(),
            version: '1.0.0',
        };
        this.serverListings.set(serverId, newListing);
        this.emit('server-published', newListing);
        return newListing;
    }

    /**
     * @description Get all server listings from the marketplace.
     * @returns {Promise<Array>} A list of all server listings.
     */
    async getServerListings() {
        return Array.from(this.serverListings.values());
    }

    /**
     * @description Get details for a specific server.
     * @param {string} serverId - The ID of the server.
     * @returns {Promise<Object|null>} The server details or null if not found.
     */
    async getServerById(serverId) {
        return this.serverListings.get(serverId) || null;
    }

    /**
     * @description Install an MCP server from the marketplace.
     * @param {string} userId - The ID of the user installing the server.
     * @param {string} serverId - The ID of the server to install.
     * @returns {Promise<Object>} The installation record.
     */
    async installServer(userId, serverId) {
        if (!this.serverListings.has(serverId)) {
            throw new Error('Server not found in the marketplace.');
        }

        const installationId = `install_${Date.now()}`;
        const newInstallation = {
            id: installationId,
            userId,
            serverId,
            installedAt: new Date(),
            status: 'active',
        };

        if (!this.installations.has(userId)) {
            this.installations.set(userId, []);
        }
        this.installations.get(userId).push(newInstallation);
        this.emit('server-installed', newInstallation);
        return newInstallation;
    }

    async rateServer(id, rating) {
        const server = this.serverListings.get(id);
        if (!server) return null;
        if (!server.ratings) server.ratings = [];
        server.ratings.push(rating);
        server.averageRating = server.ratings.reduce((a, b) => a + b, 0) / server.ratings.length;
        return server;
    }

    async getTopRatedServers() {
        return Array.from(this.serverListings.values())
            .filter(s => s.averageRating)
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 5);
    }
}

module.exports = new MarketplaceService();