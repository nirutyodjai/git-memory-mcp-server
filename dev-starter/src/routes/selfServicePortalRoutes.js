const express = require('express');
const router = express.Router();
const SelfServicePortalService = require('../services/SelfServicePortalService');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes with authentication
router.use(authMiddleware);

// Account Management
router.get('/account', async (req, res) => {
    try {
        const accountDetails = await SelfServicePortalService.getAccountDetails(req.user.id);
        if (accountDetails) {
            res.json(accountDetails);
        } else {
            res.status(404).json({ message: 'Account not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to get account details.' });
    }
});

router.put('/account', async (req, res) => {
    try {
        const updatedDetails = await SelfServicePortalService.updateAccountDetails(req.user.id, req.body);
        res.json(updatedDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Billing Dashboard
router.get('/billing/history', async (req, res) => {
    try {
        const billingHistory = await SelfServicePortalService.getBillingHistory(req.user.id);
        res.json(billingHistory);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get billing history.' });
    }
});

// Usage Analytics
router.get('/usage', async (req, res) => {
    try {
        const usageAnalytics = await SelfServicePortalService.getUsageAnalytics(req.user.id);
        if (usageAnalytics) {
            res.json(usageAnalytics);
        } else {
            res.status(404).json({ message: 'Usage analytics not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to get usage analytics.' });
    }
});

// Support Ticketing
router.post('/support/tickets', async (req, res) => {
    try {
        const newTicket = await SelfServicePortalService.createSupportTicket(req.user.id, req.body);
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create support ticket.' });
    }
});

router.get('/support/tickets', async (req, res) => {
    try {
        const supportTickets = await SelfServicePortalService.getSupportTickets(req.user.id);
        res.json(supportTickets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to get support tickets.' });
    }
});

module.exports = router;