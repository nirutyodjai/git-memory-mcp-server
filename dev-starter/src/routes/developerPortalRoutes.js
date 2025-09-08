const express = require('express');
const router = express.Router();
const DeveloperPortalService = require('../services/DeveloperPortalService');

// Get documentation
router.get('/docs', async (req, res) => {
  const docs = await DeveloperPortalService.getDocumentation();
  res.json(docs);
});

// Get API explorer
router.get('/api-explorer', async (req, res) => {
  const explorer = await DeveloperPortalService.getApiExplorer();
  res.json(explorer);
});

// Get code samples
router.get('/code-samples', async (req, res) => {
  const samples = await DeveloperPortalService.getCodeSamples();
  res.json(samples);
});

// Get community forums
router.get('/forums', async (req, res) => {
  const forums = await DeveloperPortalService.getCommunityForums();
  res.json(forums);
});

module.exports = router;