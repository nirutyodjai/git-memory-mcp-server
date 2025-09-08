const express = require('express');
const router = express.Router();
const CustomBrandingService = require('../services/CustomBrandingService');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// GET the current custom branding settings
router.get('/', async (req, res) => {
    try {
        const settings = await CustomBrandingService.getBrandingSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get branding settings.' });
    }
});

// PUT to update the custom branding settings
router.put('/', async (req, res) => {
    try {
        const newSettings = req.body;
        const updatedSettings = await CustomBrandingService.updateBrandingSettings(newSettings);
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update branding settings.' });
    }
});

// DELETE to reset the custom branding settings
router.delete('/', async (req, res) => {
    try {
        const settings = await CustomBrandingService.resetBrandingSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to reset branding settings.' });
    }
});

module.exports = router;