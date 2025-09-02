const { PrismaClient } = require('../generated/prisma');
const crypto = require('crypto');
const logger = require('../utils/logger');

class SubscriptionService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // Plan Management
  async createPlan(planData) {
    try {
      const plan = await this.prisma.plan.create({
        data: {
          name: planData.name,
          displayName: planData.displayName,
          description: planData.description,
          price: planData.price,
          currency: planData.currency || 'USD',
          interval: planData.interval || 'month',
          features: planData.features,
          limits: planData.limits,
          sortOrder: planData.sortOrder || 0
        }
      });

      logger.info(`Plan created: ${plan.name}`, { planId: plan.id });
      return plan;
    } catch (error) {
      logger.error('Error creating plan:', error);
      throw error;
    }
  }

  async getAllPlans(activeOnly = true) {
    try {
      const plans = await this.prisma.plan.findMany({
        where: activeOnly ? { isActive: true } : {},
        orderBy: { sortOrder: 'asc' }
      });
      return plans;
    } catch (error) {
      logger.error('Error fetching plans:', error);
      throw error;
    }
  }

  async getPlanById(planId) {
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id: planId }
      });
      return plan;
    } catch (error) {
      logger.error('Error fetching plan:', error);
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(userId, planId, trialDays = 0) {
    try {
      const plan = await this.getPlanById(planId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      const now = new Date();
      const trialEnd = trialDays > 0 ? new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000)) : null;
      const periodStart = trialEnd || now;
      const periodEnd = new Date(periodStart.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days

      // Check if user already has an active subscription
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'TRIALING'] }
        }
      });

      if (existingSubscription) {
        throw new Error('User already has an active subscription');
      }

      const subscription = await this.prisma.subscription.create({
        data: {
          userId,
          planId,
          status: trialDays > 0 ? 'TRIALING' : 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialStart: trialDays > 0 ? now : null,
          trialEnd: trialEnd
        },
        include: {
          plan: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      });

      logger.info(`Subscription created for user ${userId}`, { 
        subscriptionId: subscription.id,
        planName: plan.name,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getUserSubscription(userId) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] }
        },
        include: {
          plan: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      return subscription;
    } catch (error) {
      logger.error('Error fetching user subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const updateData = {
        cancelAtPeriodEnd,
        updatedAt: new Date()
      };

      if (!cancelAtPeriodEnd) {
        updateData.status = 'CANCELED';
        updateData.canceledAt = new Date();
      }

      const subscription = await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
        include: {
          plan: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      });

      logger.info(`Subscription ${cancelAtPeriodEnd ? 'scheduled for cancellation' : 'canceled'}`, {
        subscriptionId,
        userId: subscription.userId
      });

      return subscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  // Usage Tracking
  async recordUsage(userId, metricName, quantity, metadata = null) {
    try {
      const usageRecord = await this.prisma.usageRecord.create({
        data: {
          userId,
          metricName,
          quantity,
          metadata,
          timestamp: new Date()
        }
      });

      return usageRecord;
    } catch (error) {
      logger.error('Error recording usage:', error);
      throw error;
    }
  }

  async getUserUsage(userId, metricName, startDate, endDate) {
    try {
      const usage = await this.prisma.usageRecord.aggregate({
        where: {
          userId,
          metricName,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          quantity: true
        },
        _count: {
          id: true
        }
      });

      return {
        totalUsage: usage._sum.quantity || 0,
        recordCount: usage._count.id || 0
      };
    } catch (error) {
      logger.error('Error fetching user usage:', error);
      throw error;
    }
  }

  // API Key Management
  async createApiKey(userId, name, permissions = [], expiresAt = null) {
    try {
      // Generate API key
      const apiKey = 'gm_' + crypto.randomBytes(32).toString('hex');
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const keyPrefix = apiKey.substring(0, 8);

      const apiKeyRecord = await this.prisma.apiKey.create({
        data: {
          userId,
          name,
          keyHash,
          keyPrefix,
          permissions,
          expiresAt
        }
      });

      logger.info(`API key created for user ${userId}`, {
        apiKeyId: apiKeyRecord.id,
        keyPrefix
      });

      // Return the plain API key only once
      return {
        ...apiKeyRecord,
        apiKey // This should be shown to user only once
      };
    } catch (error) {
      logger.error('Error creating API key:', error);
      throw error;
    }
  }

  async validateApiKey(apiKey) {
    try {
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      const apiKeyRecord = await this.prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              isActive: true
            }
          }
        }
      });

      if (!apiKeyRecord || !apiKeyRecord.isActive) {
        return null;
      }

      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return null;
      }

      if (!apiKeyRecord.user.isActive) {
        return null;
      }

      // Update last used timestamp
      await this.prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsedAt: new Date() }
      });

      return {
        apiKey: apiKeyRecord,
        user: apiKeyRecord.user
      };
    } catch (error) {
      logger.error('Error validating API key:', error);
      return null;
    }
  }

  // Subscription Limits Check
  async checkUsageLimit(userId, metricName) {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        // No subscription, use free tier limits
        const freePlan = await this.prisma.plan.findFirst({
          where: { name: 'free' }
        });
        if (!freePlan) return { allowed: false, reason: 'No plan available' };
        subscription = { plan: freePlan };
      }

      const limits = subscription.plan.limits;
      if (!limits[metricName]) {
        return { allowed: true }; // No limit set
      }

      // Get current month usage
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const usage = await this.getUserUsage(userId, metricName, startOfMonth, endOfMonth);
      const limit = limits[metricName];

      return {
        allowed: usage.totalUsage < limit,
        currentUsage: usage.totalUsage,
        limit,
        remaining: Math.max(0, limit - usage.totalUsage)
      };
    } catch (error) {
      logger.error('Error checking usage limit:', error);
      return { allowed: false, reason: 'Error checking limits' };
    }
  }

  async close() {
    await this.prisma.$disconnect();
  }
}

module.exports = SubscriptionService;