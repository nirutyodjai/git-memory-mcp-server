const { PrismaClient } = require('../generated/prisma');
const logger = require('../utils/logger');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // Invoice Management
  async createInvoice(subscriptionId, amount, description = null, lineItems = []) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: true,
          user: true
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Generate unique invoice number
      const invoiceNumber = await this.generateInvoiceNumber();
      
      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Calculate total amount with tax
      const taxRate = 0.07; // 7% tax
      const taxAmount = amount * taxRate;
      const totalAmount = amount + taxAmount;

      const invoice = await this.prisma.invoice.create({
        data: {
          subscriptionId,
          invoiceNumber,
          amount,
          currency: subscription.plan.currency,
          status: 'DRAFT',
          dueDate,
          description: description || `${subscription.plan.displayName} Subscription`,
          lineItems: lineItems.length > 0 ? lineItems : [
            {
              description: `${subscription.plan.displayName} - ${subscription.plan.interval}ly subscription`,
              quantity: 1,
              unitPrice: amount,
              totalPrice: amount
            }
          ],
          taxAmount,
          discountAmount: 0,
          totalAmount
        },
        include: {
          subscription: {
            include: {
              plan: true,
              user: true
            }
          }
        }
      });

      logger.info(`Invoice created: ${invoiceNumber}`, {
        invoiceId: invoice.id,
        subscriptionId,
        amount: totalAmount
      });

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
    
    const count = await this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  async finalizeInvoice(invoiceId) {
    try {
      const invoice = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'OPEN',
          updatedAt: new Date()
        },
        include: {
          subscription: {
            include: {
              plan: true,
              user: true
            }
          }
        }
      });

      logger.info(`Invoice finalized: ${invoice.invoiceNumber}`, {
        invoiceId,
        totalAmount: invoice.totalAmount
      });

      return invoice;
    } catch (error) {
      logger.error('Error finalizing invoice:', error);
      throw error;
    }
  }

  // Payment Processing
  async createPayment(subscriptionId, amount, paymentMethod = 'stripe', metadata = null) {
    try {
      const payment = await this.prisma.payment.create({
        data: {
          subscriptionId,
          amount,
          currency: 'USD',
          status: 'PENDING',
          paymentMethod,
          metadata
        },
        include: {
          subscription: {
            include: {
              plan: true,
              user: true
            }
          }
        }
      });

      logger.info(`Payment created`, {
        paymentId: payment.id,
        subscriptionId,
        amount,
        paymentMethod
      });

      return payment;
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  async processPayment(paymentId, transactionId, success = true, failureReason = null) {
    try {
      const updateData = {
        transactionId,
        updatedAt: new Date()
      };

      if (success) {
        updateData.status = 'SUCCEEDED';
        updateData.paidAt = new Date();
      } else {
        updateData.status = 'FAILED';
        updateData.failureReason = failureReason;
      }

      const payment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
        include: {
          subscription: {
            include: {
              plan: true,
              user: true
            }
          },
          invoice: true
        }
      });

      // If payment succeeded, update invoice status
      if (success && payment.invoiceId) {
        await this.prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date()
          }
        });
      }

      // If payment succeeded, extend subscription period
      if (success) {
        await this.extendSubscription(payment.subscriptionId);
      }

      logger.info(`Payment ${success ? 'succeeded' : 'failed'}`, {
        paymentId,
        transactionId,
        amount: payment.amount
      });

      return payment;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  async extendSubscription(subscriptionId) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate new period end (30 days from current period end)
      const newPeriodEnd = new Date(subscription.currentPeriodEnd);
      newPeriodEnd.setDate(newPeriodEnd.getDate() + 30);

      const updatedSubscription = await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: subscription.currentPeriodEnd,
          currentPeriodEnd: newPeriodEnd,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      });

      logger.info(`Subscription extended`, {
        subscriptionId,
        newPeriodEnd
      });

      return updatedSubscription;
    } catch (error) {
      logger.error('Error extending subscription:', error);
      throw error;
    }
  }

  // Stripe Integration (Mock Implementation)
  async processStripePayment(paymentId, stripeToken) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          subscription: {
            include: {
              plan: true,
              user: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Mock Stripe charge (in real implementation, use Stripe SDK)
      const mockStripeCharge = {
        id: `ch_${crypto.randomBytes(12).toString('hex')}`,
        amount: Math.round(payment.amount * 100), // Stripe uses cents
        currency: payment.currency.toLowerCase(),
        status: 'succeeded',
        paid: true
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process the payment
      const processedPayment = await this.processPayment(
        paymentId,
        mockStripeCharge.id,
        mockStripeCharge.paid,
        mockStripeCharge.paid ? null : 'Card declined'
      );

      return {
        payment: processedPayment,
        stripeCharge: mockStripeCharge
      };
    } catch (error) {
      logger.error('Error processing Stripe payment:', error);
      
      // Mark payment as failed
      await this.processPayment(paymentId, null, false, error.message);
      throw error;
    }
  }

  // Refund Processing
  async refundPayment(paymentId, amount = null, reason = 'requested_by_customer') {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          subscription: {
            include: {
              plan: true,
              user: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'SUCCEEDED') {
        throw new Error('Can only refund successful payments');
      }

      const refundAmount = amount || payment.amount;
      
      // Mock refund processing
      const mockRefund = {
        id: `re_${crypto.randomBytes(12).toString('hex')}`,
        amount: Math.round(refundAmount * 100),
        currency: payment.currency.toLowerCase(),
        status: 'succeeded'
      };

      const refundedPayment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          metadata: {
            ...payment.metadata,
            refund: {
              id: mockRefund.id,
              amount: refundAmount,
              reason,
              processedAt: new Date().toISOString()
            }
          }
        }
      });

      logger.info(`Payment refunded`, {
        paymentId,
        refundAmount,
        reason
      });

      return {
        payment: refundedPayment,
        refund: mockRefund
      };
    } catch (error) {
      logger.error('Error refunding payment:', error);
      throw error;
    }
  }

  // Analytics and Reporting
  async getPaymentAnalytics(startDate, endDate) {
    try {
      const payments = await this.prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          subscription: {
            include: {
              plan: true
            }
          }
        }
      });

      const analytics = {
        totalPayments: payments.length,
        successfulPayments: payments.filter(p => p.status === 'SUCCEEDED').length,
        failedPayments: payments.filter(p => p.status === 'FAILED').length,
        totalRevenue: payments
          .filter(p => p.status === 'SUCCEEDED')
          .reduce((sum, p) => sum + p.amount, 0),
        averagePaymentAmount: 0,
        paymentsByMethod: {},
        paymentsByPlan: {}
      };

      const successfulPayments = payments.filter(p => p.status === 'SUCCEEDED');
      if (successfulPayments.length > 0) {
        analytics.averagePaymentAmount = analytics.totalRevenue / successfulPayments.length;
      }

      // Group by payment method
      payments.forEach(payment => {
        const method = payment.paymentMethod || 'unknown';
        analytics.paymentsByMethod[method] = (analytics.paymentsByMethod[method] || 0) + 1;
      });

      // Group by plan
      payments.forEach(payment => {
        const planName = payment.subscription?.plan?.name || 'unknown';
        analytics.paymentsByPlan[planName] = (analytics.paymentsByPlan[planName] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      logger.error('Error getting payment analytics:', error);
      throw error;
    }
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

module.exports = PaymentService;