/**
 * Billing and Subscription Management Server
 * Advanced billing system for NEXUS IDE with Stripe integration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User } = require('../auth-system/models/User');
const { requireAuth, requirePermission, adminOnly } = require('../auth-system/middleware/permissions');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// Rate limiting
const billingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many billing requests from this IP'
});

app.use('/api/billing', billingLimiter);

// Body parsing
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
    free: {
        name: 'Free',
        price: 0,
        currency: 'usd',
        interval: 'month',
        features: {
            maxProjects: 3,
            maxCollaborators: 1,
            maxAIRequests: 100,
            maxStorageGB: 1,
            support: 'community'
        },
        stripePriceId: null
    },
    pro: {
        name: 'Pro',
        price: 29,
        currency: 'usd',
        interval: 'month',
        features: {
            maxProjects: 25,
            maxCollaborators: 5,
            maxAIRequests: 1000,
            maxStorageGB: 10,
            support: 'email'
        },
        stripePriceId: process.env.STRIPE_PRO_PRICE_ID
    },
    team: {
        name: 'Team',
        price: 99,
        currency: 'usd',
        interval: 'month',
        features: {
            maxProjects: 100,
            maxCollaborators: 25,
            maxAIRequests: 5000,
            maxStorageGB: 50,
            support: 'priority'
        },
        stripePriceId: process.env.STRIPE_TEAM_PRICE_ID
    },
    enterprise: {
        name: 'Enterprise',
        price: 299,
        currency: 'usd',
        interval: 'month',
        features: {
            maxProjects: -1, // unlimited
            maxCollaborators: -1,
            maxAIRequests: -1,
            maxStorageGB: -1,
            support: 'dedicated'
        },
        stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID
    }
};

class BillingManager {
    /**
     * Create Stripe customer
     */
    static async createCustomer(user) {
        try {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.profile.firstName + ' ' + user.profile.lastName,
                metadata: {
                    userId: user._id.toString(),
                    nexusUser: 'true'
                }
            });
            
            // Update user with Stripe customer ID
            await User.findByIdAndUpdate(user._id, {
                'subscription.stripeCustomerId': customer.id
            });
            
            return customer;
        } catch (error) {
            console.error('Error creating Stripe customer:', error);
            throw error;
        }
    }
    
    /**
     * Create subscription
     */
    static async createSubscription(userId, planId, paymentMethodId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');
            
            const plan = SUBSCRIPTION_PLANS[planId];
            if (!plan || !plan.stripePriceId) {
                throw new Error('Invalid subscription plan');
            }
            
            let customerId = user.subscription.stripeCustomerId;
            
            // Create customer if doesn't exist
            if (!customerId) {
                const customer = await this.createCustomer(user);
                customerId = customer.id;
            }
            
            // Attach payment method to customer
            if (paymentMethodId) {
                await stripe.paymentMethods.attach(paymentMethodId, {
                    customer: customerId
                });
                
                // Set as default payment method
                await stripe.customers.update(customerId, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId
                    }
                });
            }
            
            // Create subscription
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: plan.stripePriceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    userId: userId.toString(),
                    planId: planId
                }
            });
            
            // Update user subscription
            await User.findByIdAndUpdate(userId, {
                'subscription.tier': planId,
                'subscription.stripeSubscriptionId': subscription.id,
                'subscription.status': subscription.status,
                'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
                'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
                'subscription.updatedAt': new Date()
            });
            
            return subscription;
        } catch (error) {
            console.error('Error creating subscription:', error);
            throw error;
        }
    }
    
    /**
     * Cancel subscription
     */
    static async cancelSubscription(userId, immediate = false) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.subscription.stripeSubscriptionId) {
                throw new Error('No active subscription found');
            }
            
            let subscription;
            if (immediate) {
                subscription = await stripe.subscriptions.cancel(
                    user.subscription.stripeSubscriptionId
                );
            } else {
                subscription = await stripe.subscriptions.update(
                    user.subscription.stripeSubscriptionId,
                    { cancel_at_period_end: true }
                );
            }
            
            // Update user subscription
            const updateData = {
                'subscription.status': subscription.status,
                'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
                'subscription.updatedAt': new Date()
            };
            
            if (immediate) {
                updateData['subscription.tier'] = 'free';
                updateData['subscription.canceledAt'] = new Date();
            }
            
            await User.findByIdAndUpdate(userId, updateData);
            
            return subscription;
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw error;
        }
    }
    
    /**
     * Update subscription
     */
    static async updateSubscription(userId, newPlanId) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.subscription.stripeSubscriptionId) {
                throw new Error('No active subscription found');
            }
            
            const newPlan = SUBSCRIPTION_PLANS[newPlanId];
            if (!newPlan || !newPlan.stripePriceId) {
                throw new Error('Invalid subscription plan');
            }
            
            // Get current subscription
            const currentSubscription = await stripe.subscriptions.retrieve(
                user.subscription.stripeSubscriptionId
            );
            
            // Update subscription
            const subscription = await stripe.subscriptions.update(
                user.subscription.stripeSubscriptionId,
                {
                    items: [{
                        id: currentSubscription.items.data[0].id,
                        price: newPlan.stripePriceId
                    }],
                    proration_behavior: 'create_prorations'
                }
            );
            
            // Update user subscription
            await User.findByIdAndUpdate(userId, {
                'subscription.tier': newPlanId,
                'subscription.status': subscription.status,
                'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
                'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
                'subscription.updatedAt': new Date()
            });
            
            return subscription;
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }
    }
    
    /**
     * Get billing history
     */
    static async getBillingHistory(userId, limit = 10) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.subscription.stripeCustomerId) {
                return [];
            }
            
            const invoices = await stripe.invoices.list({
                customer: user.subscription.stripeCustomerId,
                limit: limit
            });
            
            return invoices.data.map(invoice => ({
                id: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: invoice.status,
                date: new Date(invoice.created * 1000),
                description: invoice.description,
                invoiceUrl: invoice.hosted_invoice_url,
                pdfUrl: invoice.invoice_pdf
            }));
        } catch (error) {
            console.error('Error getting billing history:', error);
            throw error;
        }
    }
    
    /**
     * Get usage statistics
     */
    static async getUsageStats(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');
            
            const plan = SUBSCRIPTION_PLANS[user.subscription.tier];
            const usage = user.usage.currentPeriod;
            
            return {
                plan: {
                    name: plan.name,
                    tier: user.subscription.tier,
                    features: plan.features
                },
                usage: {
                    projects: {
                        current: usage.projects || 0,
                        limit: plan.features.maxProjects,
                        percentage: plan.features.maxProjects > 0 ? 
                            Math.round(((usage.projects || 0) / plan.features.maxProjects) * 100) : 0
                    },
                    aiRequests: {
                        current: usage.aiRequests || 0,
                        limit: plan.features.maxAIRequests,
                        percentage: plan.features.maxAIRequests > 0 ? 
                            Math.round(((usage.aiRequests || 0) / plan.features.maxAIRequests) * 100) : 0
                    },
                    storage: {
                        current: usage.storageGB || 0,
                        limit: plan.features.maxStorageGB,
                        percentage: plan.features.maxStorageGB > 0 ? 
                            Math.round(((usage.storageGB || 0) / plan.features.maxStorageGB) * 100) : 0
                    },
                    collaborators: {
                        current: usage.collaborators || 0,
                        limit: plan.features.maxCollaborators,
                        percentage: plan.features.maxCollaborators > 0 ? 
                            Math.round(((usage.collaborators || 0) / plan.features.maxCollaborators) * 100) : 0
                    }
                },
                billingCycle: {
                    start: user.subscription.currentPeriodStart,
                    end: user.subscription.currentPeriodEnd,
                    daysRemaining: Math.ceil(
                        (user.subscription.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)
                    )
                }
            };
        } catch (error) {
            console.error('Error getting usage stats:', error);
            throw error;
        }
    }
}

// Routes

/**
 * Get subscription plans
 */
app.get('/api/billing/plans', (req, res) => {
    try {
        const plans = Object.entries(SUBSCRIPTION_PLANS).map(([id, plan]) => ({
            id,
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            interval: plan.interval,
            features: plan.features
        }));
        
        res.json({ plans });
    } catch (error) {
        console.error('Error getting plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create subscription
 */
app.post('/api/billing/subscribe', requireAuth, async (req, res) => {
    try {
        const { planId, paymentMethodId } = req.body;
        
        if (!planId || !SUBSCRIPTION_PLANS[planId]) {
            return res.status(400).json({ error: 'Invalid plan ID' });
        }
        
        if (planId !== 'free' && !paymentMethodId) {
            return res.status(400).json({ error: 'Payment method required for paid plans' });
        }
        
        const subscription = await BillingManager.createSubscription(
            req.user.userId,
            planId,
            paymentMethodId
        );
        
        res.json({ 
            subscription: {
                id: subscription.id,
                status: subscription.status,
                clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
            }
        });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update subscription
 */
app.put('/api/billing/subscription', requireAuth, async (req, res) => {
    try {
        const { planId } = req.body;
        
        if (!planId || !SUBSCRIPTION_PLANS[planId]) {
            return res.status(400).json({ error: 'Invalid plan ID' });
        }
        
        const subscription = await BillingManager.updateSubscription(
            req.user.userId,
            planId
        );
        
        res.json({ 
            subscription: {
                id: subscription.id,
                status: subscription.status
            }
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Cancel subscription
 */
app.delete('/api/billing/subscription', requireAuth, async (req, res) => {
    try {
        const { immediate = false } = req.body;
        
        const subscription = await BillingManager.cancelSubscription(
            req.user.userId,
            immediate
        );
        
        res.json({ 
            subscription: {
                id: subscription.id,
                status: subscription.status,
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get billing history
 */
app.get('/api/billing/history', requireAuth, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const history = await BillingManager.getBillingHistory(
            req.user.userId,
            parseInt(limit)
        );
        
        res.json({ history });
    } catch (error) {
        console.error('Error getting billing history:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get usage statistics
 */
app.get('/api/billing/usage', requireAuth, async (req, res) => {
    try {
        const stats = await BillingManager.getUsageStats(req.user.userId);
        res.json(stats);
    } catch (error) {
        console.error('Error getting usage stats:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Create payment intent for one-time payments
 */
app.post('/api/billing/payment-intent', requireAuth, async (req, res) => {
    try {
        const { amount, currency = 'usd', description } = req.body;
        
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        let customerId = user.subscription.stripeCustomerId;
        
        // Create customer if doesn't exist
        if (!customerId) {
            const customer = await BillingManager.createCustomer(user);
            customerId = customer.id;
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency,
            customer: customerId,
            description,
            metadata: {
                userId: req.user.userId.toString()
            }
        });
        
        res.json({ 
            clientSecret: paymentIntent.client_secret 
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get customer portal URL
 */
app.post('/api/billing/portal', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !user.subscription.stripeCustomerId) {
            return res.status(400).json({ error: 'No billing account found' });
        }
        
        const session = await stripe.billingPortal.sessions.create({
            customer: user.subscription.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL}/dashboard/billing`
        });
        
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Admin: Get all subscriptions
 */
app.get('/api/billing/admin/subscriptions', adminOnly, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, tier } = req.query;
        
        const query = {};
        if (status) query['subscription.status'] = status;
        if (tier) query['subscription.tier'] = tier;
        
        const users = await User.find(query)
            .select('email profile subscription usage createdAt')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ 'subscription.updatedAt': -1 });
        
        const total = await User.countDocuments(query);
        
        res.json({
            subscriptions: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting subscriptions:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Stripe webhook handler
 */
app.post('/webhook/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;
                
            case 'customer.subscription.deleted':
                await handleSubscriptionCanceled(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
                
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).json({ error: 'Webhook handler failed' });
    }
});

// Webhook handlers
async function handleSubscriptionUpdate(subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;
    
    await User.findByIdAndUpdate(userId, {
        'subscription.status': subscription.status,
        'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
        'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
        'subscription.updatedAt': new Date()
    });
}

async function handleSubscriptionCanceled(subscription) {
    const userId = subscription.metadata.userId;
    if (!userId) return;
    
    await User.findByIdAndUpdate(userId, {
        'subscription.tier': 'free',
        'subscription.status': 'canceled',
        'subscription.canceledAt': new Date(),
        'subscription.updatedAt': new Date()
    });
}

async function handlePaymentSucceeded(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
    
    if (user) {
        // Reset usage for new billing period
        await User.findByIdAndUpdate(user._id, {
            'usage.currentPeriod': {
                projects: 0,
                aiRequests: 0,
                storageGB: 0,
                collaborators: 0
            },
            'subscription.lastPayment': new Date()
        });
    }
}

async function handlePaymentFailed(invoice) {
    const customerId = invoice.customer;
    const user = await User.findOne({ 'subscription.stripeCustomerId': customerId });
    
    if (user) {
        // Handle payment failure (send notification, etc.)
        console.log(`Payment failed for user ${user.email}`);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'billing-server',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Billing server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

const PORT = process.env.BILLING_PORT || 3003;

app.listen(PORT, () => {
    console.log(`🏦 Billing server running on port ${PORT}`);
});

module.exports = { app, BillingManager, SUBSCRIPTION_PLANS };