const express = require('express');
const router = express.Router();
const SubscriptionService = require('../services/SubscriptionService');

// Get all plans
router.get('/plans', async (req, res) => {
    try {
        const plans = await SubscriptionService.getPlans();
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new subscription
router.post('/', async (req, res) => {
    try {
        const { userId, plan } = req.body;
        if (!userId || !plan) {
            return res.status(400).json({ message: 'Missing required fields: userId, plan' });
        }
        const subscription = await SubscriptionService.createSubscription(userId, plan);
        res.status(201).json(subscription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Process a payment
router.post('/payment', async (req, res) => {
    try {
        const { subscriptionId, amount, token } = req.body;
        if (!subscriptionId || !amount || !token) {
            return res.status(400).json({ message: 'Missing required fields: subscriptionId, amount, token' });
        }
        const payment = await SubscriptionService.processPayment(subscriptionId, amount, token);
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;