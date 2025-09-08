const express = require('express');
const router = express.Router();
const AutomatedOptimization = require('../services/AutomatedOptimization');

// This would be initialized with a server manager instance
const automatedOptimization = new AutomatedOptimization({ getServers: () => [] });

router.get('/history', (req, res) => {
    res.json(automatedOptimization.getOptimizationHistory());
});

module.exports = router;