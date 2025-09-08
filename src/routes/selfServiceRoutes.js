const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const BillingService = require('../services/BillingService');
const AnalyticsService = require('../services/AnalyticsService');
const AuthMiddleware = require('../auth/auth-middleware');
const auth = new AuthMiddleware();

// Account Management
router.get('/account', auth.verifyToken, async (req, res) => {
  const user = await UserService.getUser(req.user.id);
  res.json(user);
});

router.put('/account', auth.verifyToken, async (req, res) => {
  const updatedUser = await UserService.updateUser(req.user.id, req.body);
  res.json(updatedUser);
});

// Billing Dashboard
router.get('/billing', auth.verifyToken, async (req, res) => {
  const billingInfo = await BillingService.getBillingInfo(req.user.id);
  res.json(billingInfo);
});

// Usage Analytics
router.get('/usage', auth.verifyToken, async (req, res) => {
  const usageData = await AnalyticsService.getUsage(req.user.id);
  res.json(usageData);
});

module.exports = router;