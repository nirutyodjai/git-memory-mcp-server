const express = require('express');
const router = express.Router();
const MultiCloudDeployment = require('../services/MultiCloudDeployment');
const authMiddleware = require('../middleware/authMiddleware');

// Mock config
const config = {
    aws: { region: 'us-east-1' },
    azure: { connectionString: 'your-azure-connection-string' },
    gcp: { keyFilename: 'your-gcp-keyfile.json' },
};

const multiCloudDeployment = new MultiCloudDeployment(config);

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// POST a new deployment to a specified cloud provider
router.post('/deploy', async (req, res) => {
    try {
        const result = await multiCloudDeployment.deploy(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: `Failed to deploy.` });
    }
});

module.exports = router;