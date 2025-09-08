const documentation = {
  introduction: 'Welcome to the Git Memory MCP Server API...',
  authentication: 'API authentication is done via JWT tokens...',
};

const apiExplorer = {
  endpoints: [
    { path: '/api/analytics', method: 'GET', description: 'Get analytics data' },
    { path: '/api/branding', method: 'GET', description: 'Get branding information' },
  ],
};

const codeSamples = {
  javascript: 'const sdk = new McpSdk("http://localhost:3000");\nsdk.login("user", "pass");',
  python: 'sdk = McpSdk("http://localhost:3000")\nsdk.login("user", "pass")',
};

const communityForums = {
  threads: [
    { id: 1, title: 'How to scale to 1000 servers?', author: 'dev1' },
    { id: 2, title: 'Best practices for Git-based memory', author: 'dev2' },
  ],
};

class DeveloperPortalService {
  static async getDocumentation() {
    return documentation;
  }

  static async getApiExplorer() {
    return apiExplorer;
  }

  static async getCodeSamples() {
    return codeSamples;
  }

  static async getCommunityForums() {
    return communityForums;
  }
}

module.exports = DeveloperPortalService;