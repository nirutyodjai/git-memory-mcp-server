const express = require('express');
const router = express.Router();
const ProfessionalServicesService = require('../services/ProfessionalServicesService');
const authMiddleware = require('../middleware/authMiddleware');

// Get all professional service offerings
router.get('/', async (req, res) => {
    try {
        const offerings = await ProfessionalServicesService.getOfferings();
        res.json(offerings);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve service offerings.' });
    }
});

// Get offerings by category
router.get('/:category', async (req, res) => {
    try {
        const offerings = await ProfessionalServicesService.getOfferingByCategory(req.params.category);
        if (offerings) {
            res.json(offerings);
        } else {
            res.status(404).json({ message: 'Service category not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve service offerings.' });
    }
});

// Request a professional service
router.post('/request', authMiddleware, async (req, res) => {
    try {
        const serviceRequest = await ProfessionalServicesService.requestService(req.body);
        res.status(201).json(serviceRequest);
    } catch (error) {
        res.status(400).json({ message: 'Failed to submit service request.' });
    }
});

module.exports = router;