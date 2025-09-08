const express = require('express');
const router = express.Router();
const SaaSService = require('../services/SaaSService');

// Provision a new tenant
router.post('/provision', async (req, res) => {
    try {
        const { tenantName, adminUser } = req.body;
        if (!tenantName || !adminUser) {
            return res.status(400).json({ message: 'Missing required fields: tenantName, adminUser' });
        }
        const newTenant = await SaaSService.provisionTenant(tenantName, adminUser);
        res.status(201).json(newTenant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get tenant details
router.get('/:tenantId', async (req, res) => {
    try {
        const tenant = await SaaSService.getTenant(req.params.tenantId);
        if (tenant) {
            res.json(tenant);
        } else {
            res.status(404).json({ message: 'Tenant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// De-provision a tenant
router.delete('/:tenantId', async (req, res) => {
    try {
        const success = await SaaSService.deprovisionTenant(req.params.tenantId);
        if (success) {
            res.json({ message: 'Tenant de-provisioned successfully' });
        } else {
            res.status(404).json({ message: 'Tenant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;