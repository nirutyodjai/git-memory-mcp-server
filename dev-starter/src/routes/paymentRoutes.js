const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const authMiddleware = require('../middleware/auth'); // Assuming auth middleware exists

// Process a payment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { subscriptionId, amount, token } = req.body;
        const payment = await PaymentService.processPayment(subscriptionId, amount, token);
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get payment history for a user
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await PaymentService.getPaymentHistory(userId);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;