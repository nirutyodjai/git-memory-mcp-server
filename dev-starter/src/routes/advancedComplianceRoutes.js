const express = require('express');
const router = express.Router();
const AdvancedCompliance = require('../services/AdvancedCompliance');
const authMiddleware = require('../middleware/authMiddleware');

const advancedCompliance = new AdvancedCompliance();

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

router.post('/soc2', async (req, res) => {
    try {
        const result = await advancedCompliance.checkSOC2Compliance(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to check SOC 2 compliance.' });
    }
});

router.post('/gdpr', async (req, res) => {
    try {
        const result = await advancedCompliance.checkGDPRCompliance(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to check GDPR compliance.' });
    }
});

router.post('/hipaa', async (req, res) => {
    try {
        const result = await advancedCompliance.checkHIPAACompliance(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to check HIPAA compliance.' });
    }
});

router.post('/iso27001', async (req, res) => {
    try {
        const result = await advancedCompliance.checkISO27001Compliance(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to check ISO 27001 compliance.' });
    }
});

module.exports = router;