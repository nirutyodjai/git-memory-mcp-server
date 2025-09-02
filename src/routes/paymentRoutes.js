const express = require('express');
const PaymentService = require('../services/PaymentService');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();
const paymentService = new PaymentService();

// Middleware to ensure user is authenticated
router.use(authenticateToken);

// Create invoice for subscription
router.post('/invoices', async (req, res) => {
  try {
    const { subscriptionId, amount, description, dueDate } = req.body;

    if (!subscriptionId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID and amount are required'
      });
    }

    const invoice = await paymentService.createInvoice(
      subscriptionId,
      amount,
      description || 'Subscription payment',
      dueDate ? new Date(dueDate) : null
    );

    res.status(201).json({
      success: true,
      data: invoice,
      message: 'Invoice created successfully'
    });
  } catch (error) {
    logger.error('Error creating invoice:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's invoices
router.get('/invoices', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const whereClause = {
      subscription: {
        userId: req.user.id
      }
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const invoices = await paymentService.prisma.invoice.findMany({
      where: whereClause,
      include: {
        subscription: {
          include: {
            plan: true
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await paymentService.prisma.invoice.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        invoices,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

// Get specific invoice
router.get('/invoices/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await paymentService.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        subscription: {
          userId: req.user.id
        }
      },
      include: {
        subscription: {
          include: {
            plan: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        payments: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    logger.error('Error fetching invoice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoice'
    });
  }
});

// Process payment for invoice
router.post('/invoices/:invoiceId/pay', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod = 'stripe', paymentToken } = req.body;

    // Verify invoice belongs to user
    const invoice = await paymentService.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        subscription: {
          userId: req.user.id
        }
      },
      include: {
        subscription: true
      }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Invoice is already paid'
      });
    }

    const payment = await paymentService.processPayment(
      invoiceId,
      invoice.amount,
      paymentMethod,
      {
        token: paymentToken,
        customerId: req.user.id,
        description: `Payment for invoice ${invoiceId}`
      }
    );

    res.json({
      success: true,
      data: payment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment history
router.get('/payments', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    const whereClause = {
      invoice: {
        subscription: {
          userId: req.user.id
        }
      }
    };

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    const payments = await paymentService.prisma.payment.findMany({
      where: whereClause,
      include: {
        invoice: {
          include: {
            subscription: {
              include: {
                plan: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await paymentService.prisma.payment.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// Request refund
router.post('/payments/:paymentId/refund', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    // Verify payment belongs to user
    const payment = await paymentService.prisma.payment.findFirst({
      where: {
        id: paymentId,
        invoice: {
          subscription: {
            userId: req.user.id
          }
        }
      },
      include: {
        invoice: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: 'Only completed payments can be refunded'
      });
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        error: 'Refund amount cannot exceed payment amount'
      });
    }

    const refund = await paymentService.processRefund(
      paymentId,
      refundAmount,
      reason || 'Customer requested refund'
    );

    res.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get payment analytics for user
router.get('/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await paymentService.getPaymentAnalytics({
      userId: req.user.id,
      startDate: start,
      endDate: end
    });

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        ...analytics
      }
    });
  } catch (error) {
    logger.error('Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment analytics'
    });
  }
});

// Webhook endpoint for payment provider (Stripe, etc.)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // In a real implementation, you would verify the webhook signature
    // For now, we'll just log the webhook event
    logger.info('Payment webhook received:', {
      signature,
      payloadLength: payload.length
    });

    // Process webhook event based on type
    // This is a simplified implementation
    const event = JSON.parse(payload.toString());
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        logger.info('Payment succeeded:', event.data.object.id);
        break;
      case 'payment_intent.payment_failed':
        logger.info('Payment failed:', event.data.object.id);
        break;
      case 'invoice.payment_succeeded':
        logger.info('Invoice payment succeeded:', event.data.object.id);
        break;
      default:
        logger.info('Unhandled webhook event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

module.exports = router;