const express = require('express');
const SubscriptionService = require('../services/SubscriptionService');
const PaymentService = require('../services/PaymentService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const subscriptionService = new SubscriptionService();
const paymentService = new PaymentService();

// Middleware to ensure user is authenticated
router.use(authenticateToken);

// Get all available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getAllPlans(true);
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    logger.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
});

// Get user's current subscription
router.get('/current', async (req, res) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.id);
    
    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Error fetching user subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

// Create new subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { planId, trialDays = 0 } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    const subscription = await subscriptionService.createSubscription(
      req.user.id,
      planId,
      trialDays
    );

    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    logger.error('Error creating subscription:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;
    
    const currentSubscription = await subscriptionService.getUserSubscription(req.user.id);
    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    const subscription = await subscriptionService.cancelSubscription(
      currentSubscription.id,
      cancelAtPeriodEnd
    );

    res.json({
      success: true,
      data: subscription,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of current period'
        : 'Subscription canceled immediately'
    });
  } catch (error) {
    logger.error('Error canceling subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

// Get usage statistics
router.get('/usage', async (req, res) => {
  try {
    const { metric, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const metrics = metric ? [metric] : ['api_calls', 'storage_mb', 'servers_count'];
    const usage = {};

    for (const metricName of metrics) {
      const metricUsage = await subscriptionService.getUserUsage(req.user.id, metricName, start, end);
      const limitCheck = await subscriptionService.checkUsageLimit(req.user.id, metricName);
      
      usage[metricName] = {
        ...metricUsage,
        ...limitCheck
      };
    }

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        usage
      }
    });
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics'
    });
  }
});

// Create API key
router.post('/api-keys', async (req, res) => {
  try {
    const { name, permissions = [], expiresAt } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'API key name is required'
      });
    }

    const apiKey = await subscriptionService.createApiKey(
      req.user.id,
      name,
      permissions,
      expiresAt ? new Date(expiresAt) : null
    );

    res.status(201).json({
      success: true,
      data: apiKey,
      message: 'API key created successfully. Please save it securely as it will not be shown again.'
    });
  } catch (error) {
    logger.error('Error creating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key'
    });
  }
});

// Get user's API keys (without the actual key)
router.get('/api-keys', async (req, res) => {
  try {
    const apiKeys = await subscriptionService.prisma.apiKey.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    logger.error('Error fetching API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
});

// Revoke API key
router.delete('/api-keys/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;

    await subscriptionService.prisma.apiKey.updateMany({
      where: {
        id: keyId,
        userId: req.user.id
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

module.exports = router;