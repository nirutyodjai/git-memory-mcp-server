const express = require('express');
const router = express.Router();
const MarketplaceService = require('../services/MarketplaceService');
const { authMiddleware } = require('../middleware/auth');

// Get all servers
router.get('/servers', async (req, res) => {
  const servers = await MarketplaceService.getServers();
  res.json(servers);
});

// Get a specific server
router.get('/servers/:id', async (req, res) => {
  const server = await MarketplaceService.getServer(req.params.id);
  if (server) {
    res.json(server);
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Submit a new server
router.post('/servers', authMiddleware, async (req, res) => {
  const newServer = await MarketplaceService.submitServer(req.body);
  res.status(201).json(newServer);
});

module.exports = router;