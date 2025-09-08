const express = require('express');
const router = express.Router();
const MarketplaceService = require('../services/MarketplaceService');
const authMiddleware = require('../middleware/authMiddleware');

// Get all server listings
router.get('/', async (req, res) => {
    try {
        const listings = await MarketplaceService.getServerListings();
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve server listings.' });
    }
});

// Get a specific server by ID
router.get('/:serverId', async (req, res) => {
    try {
        const server = await MarketplaceService.getServerById(req.params.serverId);
        if (server) {
            res.json(server);
        } else {
            res.status(404).json({ message: 'Server not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve server details.' });
    }
});

// Publish a new server to the marketplace
router.post('/publish', authMiddleware, async (req, res) => {
    try {
        const newListing = await MarketplaceService.publishServer(req.body);
        res.status(201).json(newListing);
    } catch (error) {
        res.status(400).json({ message: 'Failed to publish server.' });
    }
});

// Install a server
router.post('/:serverId/install', authMiddleware, async (req, res) => {
    try {
        const installation = await MarketplaceService.installServer(req.user.id, req.params.serverId);
        res.status(201).json(installation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rate a server
router.post('/:id/rate', authMiddleware, async (req, res) => {
    try {
        const { rating } = req.body;
        const updatedServer = await MarketplaceService.rateServer(req.params.id, rating);
        if (updatedServer) {
            res.json(updatedServer);
        } else {
            res.status(404).json({ message: 'Community server not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to rate community server.' });
    }
});

// GET top-rated community servers
router.get('/top-rated', async (req, res) => {
    try {
        const topServers = await MarketplaceService.getTopRatedServers();
        res.json(topServers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get top-rated servers.' });
    }
});

module.exports = router;