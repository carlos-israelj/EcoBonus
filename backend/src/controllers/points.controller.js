import pointsService from '../services/points.service.js';
import logger from '../config/logger.js';

/**
 * Points Controller
 * Handles all points-related endpoints
 */
class PointsController {
  /**
   * GET /api/points/balance
   * Get user's current points balance
   */
  async getBalance(req, res) {
    try {
      const userId = req.userId;

      const result = await pointsService.getBalance(userId);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to fetch balance',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        balance: result.balance,
        level: result.level,
        experience: result.experience,
      });
    } catch (error) {
      logger.error('Get balance controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/points/history
   * Get user's points transaction history
   */
  async getHistory(req, res) {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const result = await pointsService.getHistory(userId, limit, offset);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to fetch history',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        transactions: result.transactions,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      });
    } catch (error) {
      logger.error('Get history controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/points/admin/adjust
   * Admin endpoint to manually adjust user points
   */
  async adminAdjust(req, res) {
    try {
      const { userId, amount, reason } = req.body;
      const adminId = req.userId;

      // Validate input
      if (!userId || amount === undefined || !reason) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['userId', 'amount', 'reason'],
        });
      }

      if (typeof amount !== 'number' || amount === 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be a non-zero number',
        });
      }

      const result = await pointsService.adminAdjustment(userId, amount, reason, adminId);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to adjust points',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        message: 'Points adjusted successfully',
        newBalance: result.newBalance,
        adjustment: result.amount,
      });
    } catch (error) {
      logger.error('Admin adjust controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new PointsController();
