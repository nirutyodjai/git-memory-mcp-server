const express = require('express');
const router = express.Router();
const IntelligentLoadBalancer = require('../services/IntelligentLoadBalancer');

// Mock servers for demonstration
const servers = [
    { id: 'server1', name: 'Server 1', status: 'online' },
    { id: 'server2', name: 'Server 2', status: 'online' },
    { id: 'server3', name: 'Server 3', status: 'online' },
];

const loadBalancer = new IntelligentLoadBalancer(servers);

// Endpoint to get traffic history
router.get('/traffic', (req, res) => {
    res.json(loadBalancer.getTrafficHistory());
});

// Endpoint to get anomaly history
router.get('/anomalies', (req, res) => {
    res.json(loadBalancer.getAnomalyHistory());
});

// Endpoint to get optimization history
router.get('/optimizations', (req, res) => {
    res.json(loadBalancer.getOptimizationHistory());
});

module.exports = router;