const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/AnalyticsService');
const authMiddleware = require('../middleware/authMiddleware');
const ReportingService = require('../services/ReportingService');
const PredictionService = require('../services/PredictionService');

// Middleware to protect routes
router.use(authMiddleware);

/**
 * @swagger
 * /analytics/api-usage:
 *   get:
 *     summary: Get API usage statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API usage statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 calls: 
 *                   type: integer
 *                 tokens: 
 *                   type: integer
 */
router.get('/api-usage', async (req, res) => {
  try {
    const usage = await AnalyticsService.getApiUsage(req.user.id);
    res.json(usage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/repo/{id}:
 *   get:
 *     summary: Get repository analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repository analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commits: 
 *                   type: integer
 *                 pullRequests: 
 *                   type: integer
 *                 issues: 
 *                   type: integer
 */
router.get('/repo/:id', async (req, res) => {
  try {
    const analytics = await AnalyticsService.getRepoAnalytics(req.params.id);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/real-time-metrics:
 *   get:
 *     summary: Get real-time performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/real-time-metrics', async (req, res) => {
  try {
    const metrics = await AnalyticsService.getRealTimeMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/report:
 *   get:
 *     summary: Generate an analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: repoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [pdf, csv]
 *           default: pdf
 *     responses:
 *       200:
 *         description: Analytics report in the specified format
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/report/:repoId', async (req, res) => {
  try {
    const { repoId } = req.params;
    const { format = 'pdf' } = req.query;

    const apiUsage = await AnalyticsService.getApiUsage(req.user.id);
    const repoAnalytics = await AnalyticsService.getRepoAnalytics(repoId);

    const data = {
      apiUsage,
      repoAnalytics,
    };

    const filename = `report.${format}`;
    const outputPath = `./${filename}`;

    if (format === 'pdf') {
      await ReportingService.generatePdfReport(data, outputPath);
      res.download(outputPath, filename);
    } else if (format === 'csv') {
      await ReportingService.generateCsvReport(data, outputPath);
      res.download(outputPath, filename);
    } else {
      res.status(400).json({ message: 'Invalid report format specified' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/predictive:
 *   get:
 *     summary: Get predictive analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Predictive analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/predictive', async (req, res) => {
  try {
    const predictions = await AnalyticsService.getPredictions();
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /analytics/cost-optimization:
 *   get:
 *     summary: Get cost optimization insights
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cost optimization insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/cost-optimization', async (req, res) => {
  try {
    const insights = await AnalyticsService.getCostOptimizationInsights(req.user.id);
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;