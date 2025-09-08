const express = require('express');
const router = express.Router();
const PredictiveScaler = require('../services/PredictiveScaler');

// This would be initialized with a server manager instance
const predictiveScaler = new PredictiveScaler({ getCurrentLoad: () => Math.random(), scale: () => {} });

router.get('/history', (req, res) => {
    res.json(predictiveScaler.getPredictionHistory());
});

module.exports = router;