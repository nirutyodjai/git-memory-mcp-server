const EventEmitter = require('events');

/**
 * @class CommunityMarketplaceService
 * @description Manages community-contributed MCP servers, including submissions, ratings, and discovery.
 * 
 * @emits server-submitted - When a new server is submitted.
 * @emits server-rated - When a server is rated.
 */
class CommunityMarketplaceService extends EventEmitter {
    constructor() {
        super();
        this.communityServers = [
            {
                id: 'community-server-1',
                name: 'Community Weather Server',
                author: 'CommunityDev1',
                description: 'A simple MCP server that provides real-time weather data from a public API.',
                version: '1.0.0',
                tags: ['weather', 'data', 'community'],
                rating: 4.5,
                ratingsCount: 15,
                sourceUrl: 'https://github.com/CommunityDev1/weather-mcp-server',
                submittedAt: new Date('2024-01-15T10:00:00Z'),
            },
            {
                id: 'community-server-2',
                name: 'Stock Price Server',
                author: 'TraderJane',
                description: 'MCP server for fetching real-time stock prices from multiple exchanges.',
                version: '1.2.0',
                tags: ['stocks', 'finance', 'real-time'],
                rating: 4.8,
                ratingsCount: 25,
                sourceUrl: 'https://github.com/TraderJane/stock-price-mcp',
                submittedAt: new Date('2024-02-20T14:30:00Z'),
            },
        ];
    }

    /**
     * @description Get all community-contributed servers.
     * @returns {Promise<Array>} A list of community servers.
     */
    async getCommunityServers() {
        console.log('Fetching all community servers...');
        return this.communityServers;
    }

    /**
     * @description Get a specific community server by its ID.
     * @param {string} serverId - The ID of the server to retrieve.
     * @returns {Promise<Object|null>} The server object or null if not found.
     */
    async getServerById(serverId) {
        console.log(`Fetching community server with ID: ${serverId}`);
        return this.communityServers.find(server => server.id === serverId) || null;
    }

    /**
     * @description Submit a new community server to the marketplace.
     * @param {Object} serverData - The data for the new server.
     * @returns {Promise<Object>} The newly created server object.
     */
    async submitServer(serverData) {
        console.log('New community server submitted:', serverData.name);
        const newServer = {
            id: `community-server-${Date.now()}`,
            ...serverData,
            rating: 0,
            ratingsCount: 0,
            submittedAt: new Date(),
        };
        this.communityServers.push(newServer);
        this.emit('server-submitted', newServer);
        return newServer;
    }

    /**
     * @description Rate a community server.
     * @param {string} serverId - The ID of the server to rate.
     * @param {number} rating - The rating value (1-5).
     * @returns {Promise<Object|null>} The updated server object or null if not found.
     */
    async rateServer(serverId, rating) {
        const server = this.communityServers.find(s => s.id === serverId);
        if (!server) {
            console.log(`Server with ID ${serverId} not found for rating.`);
            return null;
        }

        const newTotalRating = (server.rating * server.ratingsCount) + rating;
        const newRatingsCount = server.ratingsCount + 1;
        server.rating = newTotalRating / newRatingsCount;
        server.ratingsCount = newRatingsCount;

        console.log(`Server ${serverId} rated. New rating: ${server.rating.toFixed(2)}`);
        this.emit('server-rated', server);
        return server;
    }

    /**
     * @description Get the top-rated community servers.
     * @param {number} limit - The maximum number of servers to return.
     * @returns {Promise<Array>} A list of top-rated servers.
     */
    async getTopRatedServers(limit = 5) {
        console.log(`Fetching top ${limit} rated community servers...`);
        return [...this.communityServers]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit);
    }
}

module.exports = new CommunityMarketplaceService();