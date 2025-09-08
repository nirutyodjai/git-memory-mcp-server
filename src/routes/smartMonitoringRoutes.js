const express = require('express');
const router = express.Router();
const SmartMonitoring = require('../services/SmartMonitoring');

// This would be initialized with a server manager instance
const smartMonitoring = new SmartMonitoring({ getServers: () => [], checkHealth: () => ({ status: 'healthy' }) });

router.get('/history', (req, res) => {
    res.json(smartMonitoring.getAlertHistory());
});

module.exports = router;