const express = require('express');
const router = express.Router();
const BrandingService = require('../services/BrandingService');
const { authMiddleware } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Branding
 *   description: Branding management
 */

/**
 * @swagger
 * /api/branding:
 *   get:
 *     summary: Get branding settings
 *     tags: [Branding]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Branding settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 theme:
 *                   type: string
 *                 logo:
 *                   type: string
 *                 customDomain:
 *                   type: string
 */
router.get('/branding', authMiddleware, async (req, res) => {
  try {
    const settings = await BrandingService.getBranding();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/branding:
 *   put:
 *     summary: Update branding settings
 *     tags: [Branding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *               logo:
 *                 type: string
 *               customDomain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated branding settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 theme:
 *                   type: string
 *                 logo:
 *                   type: string
 *                 customDomain:
 *                   type: string
 */
router.put('/branding', authMiddleware, async (req, res) => {
  try {
    const settings = await BrandingService.updateBranding(req.body);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;