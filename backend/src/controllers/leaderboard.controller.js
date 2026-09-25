import leaderboardService from '../services/leaderboard.service.js';
import logger from '../config/logger.js';

/**
 * Leaderboard Controller
 * Handles leaderboard and ranking endpoints
 */
class LeaderboardController {
  /**
   * GET /api/leaderboard
   * Get leaderboard for specific period and scope
   */
  async getLeaderboard(req, res) {
    try {
      const options = {
        period: req.query.period || 'weekly',
        scope: req.query.scope || 'global',
        scopeValue: req.query.scopeValue || null,
        limit: parseInt(req.query.limit) || 100,
      };

      const result = await leaderboardService.getLeaderboard(options);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to fetch leaderboard',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        leaderboard: result.leaderboard,
        period: result.period,
        scope: result.scope,
        scopeValue: result.scopeValue,
        periodStart: result.periodStart,
        periodEnd: result.periodEnd,
      });
    } catch (error) {
      logger.error('Get leaderboard controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/leaderboard/my-rank
   * Get authenticated user's rank
   */
  async getMyRank(req, res) {
    try {
      const userId = req.userId;
      const period = req.query.period || 'weekly';
      const scope = req.query.scope || 'global';
      const scopeValue = req.query.scopeValue || null;

      const result = await leaderboardService.getUserRank(userId, period, scope, scopeValue);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to fetch rank',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      logger.error('Get my rank controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/leaderboard/surrounding
   * Get users around authenticated user's rank
   */
  async getSurroundingRanks(req, res) {
    try {
      const userId = req.userId;
      const period = req.query.period || 'weekly';
      const scope = req.query.scope || 'global';
      const scopeValue = req.query.scopeValue || null;
      const range = parseInt(req.query.range) || 5;

      const result = await leaderboardService.getSurroundingRanks(userId, period, scope, scopeValue, range);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to fetch surrounding ranks',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        surrounding: result.surrounding,
        userRank: result.userRank,
        range: result.range,
      });
    } catch (error) {
      logger.error('Get surrounding ranks controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/leaderboard/update (admin only)
   * Manually trigger leaderboard cache update
   */
  async updateLeaderboard(req, res) {
    try {
      const { period, scope, scopeValue } = req.body;

      if (!period || !scope) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['period', 'scope'],
        });
      }

      const result = await leaderboardService.updateLeaderboardCache(period, scope, scopeValue);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to update leaderboard',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        message: 'Leaderboard updated successfully',
        updated: result.updated,
        period: result.period,
        scope: result.scope,
        scopeValue: result.scopeValue,
      });
    } catch (error) {
      logger.error('Update leaderboard controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new LeaderboardController();
