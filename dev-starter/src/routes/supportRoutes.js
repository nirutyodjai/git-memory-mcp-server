const express = require('express');
const SupportService = require('../services/SupportService');

const router = express.Router();

router.post('/support/tickets', async (req, res) => {
  const { subject, message } = req.body;
  const userId = req.user.id;
  const ticket = await SupportService.createTicket(userId, subject, message);
  res.status(201).json(ticket);
});

router.get('/support/tickets/:ticketId', async (req, res) => {
  const { ticketId } = req.params;
  const ticket = await SupportService.getTicket(ticketId);
  res.json(ticket);
});

router.post('/support/tickets/:ticketId/comments', async (req, res) => {
  const { ticketId } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;
  const newComment = await SupportService.addComment(ticketId, userId, comment);
  res.status(201).json(newComment);
});

module.exports = router;