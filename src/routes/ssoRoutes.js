const express = require('express');
const SSOService = require('../services/SSOService');

const router = express.Router();

router.get('/sso/:provider', async (req, res) => {
  const { provider } = req.params;
  const result = await SSOService.getSsoUrl(provider);
  res.json(result);
});

router.get('/sso/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code } = req.query;
  const result = await SSOService.handleSsoCallback(provider, code);
  res.json(result);
});

module.exports = router;