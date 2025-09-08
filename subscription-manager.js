/**
 * Subscription Manager for API Gateway
 * จัดการ subscription plans และ rate limiting
 */

class SubscriptionManager {
    constructor() {
        this.plans = new Map();
        
        // Default plans
        this.plans.set('free', {
            id: 'free',
            name: 'Free Plan',
            requests_per_minute: 60,
            requests_per_hour: 1000,
            requests_per_day: 10000,
            features: ['basic_api_access'],
            price: 0
        });
        
        this.plans.set('pro', {
            id: 'pro',
            name: 'Pro Plan',
            requests_per_minute: 300,
            requests_per_hour: 10000,
            requests_per_day: 100000,
            features: ['basic_api_access', 'advanced_features', 'priority_support'],
            price: 29
        });
        
        this.plans.set('enterprise', {
            id: 'enterprise',
            name: 'Enterprise Plan',
            requests_per_minute: 1000,
            requests_per_hour: 50000,
            requests_per_day: 1000000,
            features: ['basic_api_access', 'advanced_features', 'priority_support', 'custom_integrations'],
            price: 199
        });
    }
    
    /**
     * Get plan by ID
     * @param {string} planId 
     * @returns {Object|null}
     */
    getPlan(planId) {
        return this.plans.get(planId) || this.plans.get('free');
    }
    
    /**
     * Add new plan
     * @param {string} planId 
     * @param {Object} planData 
     */
    addPlan(planId, planData) {
        this.plans.set(planId, {
            id: planId,
            ...planData
        });
    }
    
    /**
     * Get all plans
     * @returns {Array}
     */
    getAllPlans() {
        return Array.from(this.plans.values());
    }
    
    /**
     * Check if plan has feature
     * @param {string} planId 
     * @param {string} feature 
     * @returns {boolean}
     */
    hasFeature(planId, feature) {
        const plan = this.getPlan(planId);
        return plan && plan.features.includes(feature);
    }
}

// Export singleton instance
module.exports = new SubscriptionManager();