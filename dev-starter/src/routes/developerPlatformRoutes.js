const express = require('express');
const router = express.Router();
const DeveloperPlatformService = require('../services/DeveloperPlatformService');

// Get SDKs
router.get('/sdks', async (req, res) => {
    try {
        const sdks = await DeveloperPlatformService.getSDKs();
        res.json(sdks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get API Gateway status
router.get('/api-gateway/status', async (req, res) => {
    try {
        const status = await DeveloperPlatformService.getAPIGatewayStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Developer Portal content
router.get('/portal', async (req, res) => {
    try {
        const content = await DeveloperPlatformService.getPortalContent();
        res.json(content);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;