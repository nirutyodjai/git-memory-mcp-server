class BillingService {
  static async getBillingInfo(userId) {
    // Mock implementation
    return {
      plan: 'Professional',
      nextBillingDate: '2024-12-31',
      amount: 99.99,
    };
  }
}

module.exports = BillingService;