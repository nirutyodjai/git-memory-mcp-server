const express = require('express');
const router = express.Router();
const MCPMarketplaceService = require('../services/MCPMarketplaceService');

// Get all servers
router.get('/', async (req, res) => {
    try {
        const servers = await MCPMarketplaceService.getServers();
        res.json(servers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get server by ID
router.get('/:id', async (req, res) => {
    try {
        const server = await MCPMarketplaceService.getServerById(req.params.id);
        if (server) {
            res.json(server);
        } else {
            res.status(404).json({ message: 'Server not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;