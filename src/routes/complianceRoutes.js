const express = require('express');
const router = express.Router();
const ComplianceService = require('../services/ComplianceService');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// GET the current compliance settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await ComplianceService.getComplianceSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get compliance settings.' });
    }
});

// PUT to update compliance settings for a specific standard
router.put('/settings/:standard', async (req, res) => {
    try {
        const { standard } = req.params;
        const settings = req.body;
        const updatedSettings = await ComplianceService.updateComplianceSettings(standard, settings);
        if (updatedSettings) {
            res.json(updatedSettings);
        } else {
            res.status(404).json({ message: `Compliance standard '${standard}' not found.` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to update compliance settings.' });
    }
});

// GET to generate a mock compliance report
router.get('/report/:standard', async (req, res) => {
    try {
        const { standard } = req.params;
        const report = await ComplianceService.generateComplianceReport(standard);
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate compliance report.' });
    }
});

module.exports = router;