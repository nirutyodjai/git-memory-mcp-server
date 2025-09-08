const fs = require('fs');
const path = require('path');

class SubscriptionManager {
    constructor() {
        this.plans = new Map();
        this.loadPlans();
        this.watchPlans();
    }

    loadPlans() {
        const plansPath = path.join(__dirname, 'plans.json');
        try {
            if (fs.existsSync(plansPath)) {
                const plans = JSON.parse(fs.readFileSync(plansPath, 'utf8'));
                this.plans = new Map(Object.entries(plans));
                console.log('Subscription plans reloaded');
            }
        } catch (error) {
            console.error('Failed to load subscription plans:', error.message);
        }
    }

    watchPlans() {
        const plansPath = path.join(__dirname, 'plans.json');
        fs.watch(plansPath, (eventType, filename) => {
            if (eventType === 'change') {
                console.log('Detected change in plans.json, reloading...');
                this.loadPlans();
            }
        });
    }

    getPlan(planId) {
        return this.plans.get(planId);
    }

    getAllPlans() {
        return Array.from(this.plans.values());
    }
}

module.exports = new SubscriptionManager();