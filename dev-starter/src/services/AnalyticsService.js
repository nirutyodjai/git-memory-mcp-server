const prisma = require('../database/prisma-client');
const MonitoringService = require('./MonitoringService');
const PredictionService = require('./PredictionService');
const CostOptimizationService = require('./CostOptimizationService');

class AnalyticsService {
  static async getApiUsage(userId) {
    const apiCalls = await prisma.apiCall.count({
      where: { userId },
    });

    const tokenUsage = await prisma.tokenUsage.aggregate({
      _sum: {
        tokens: true,
      },
      where: { userId },
    });

    return {
      calls: apiCalls,
      tokens: tokenUsage._sum.tokens || 0,
    };
  }

  static async getRepoAnalytics(repoId) {
    const repo = await prisma.repository.findUnique({ where: { id: repoId } });
    if (!repo) {
      throw new Error('Repository not found');
    }
    const commits = await prisma.commit.count({ where: { repositoryId: repoId } });
    const pullRequests = await prisma.pullRequest.count({ where: { repositoryId: repoId } });
    const issues = await prisma.issue.count({ where: { repositoryId: repoId } });
    return { commits, pullRequests, issues };
  }

  static async getRealTimeMetrics() {
    return await MonitoringService.getRealTimeMetrics();
  }

  static async getPredictions() {
    return PredictionService.getPredictions();
  }

  /**
   * Get cost optimization insights.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<object>}
   */
  static async getCostOptimizationInsights(userId) {
    return CostOptimizationService.getInsights(userId);
  }
}

module.exports = AnalyticsService;