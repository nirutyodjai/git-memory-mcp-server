const axios = require('axios');

class McpSdk {
  constructor(baseUrl) {
    this.api = axios.create({
      baseURL: baseUrl,
    });
  }

  // Authentication
  async login(username, password) {
    const { data } = await this.api.post('/auth/login', { username, password });
    this.api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    return data;
  }

  // Analytics
  async getAnalytics() {
    const { data } = await this.api.get('/api/analytics');
    return data;
  }

  // Branding
  async getBranding() {
    const { data } = await this.api.get('/api/branding');
    return data;
  }

  // Subscriptions
  async getPlans() {
    const { data } = await this.api.get('/portal/plans');
    return data;
  }
}

module.exports = McpSdk;