class SSOService {
  static async getSsoUrl(provider) {
    // In a real application, you would generate a unique URL for the SSO provider
    return {
      url: `https://sso.provider.com/auth?provider=${provider}`,
    };
  }

  static async handleSsoCallback(provider, code) {
    // In a real application, you would exchange the code for a user profile
    // and then log the user in
    return {
      user: {
        id: `sso-${provider}-123`,
        username: `sso-user@${provider}.com`,
        role: 'viewer',
      },
    };
  }
}

module.exports = SSOService;