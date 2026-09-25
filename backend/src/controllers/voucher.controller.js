import voucherService from '../services/voucher.service.js';
import logger from '../config/logger.js';

/**
 * Voucher Controller
 * Handles voucher catalog and redemption endpoints
 */
class VoucherController {
  /**
   * GET /api/vouchers/catalog
   * Get product catalog with optional filters
   */
  async getCatalog(req, res) {
    try {
      const filters = {
        category: req.query.category,
        maxPoints: req.query.maxPoints ? parseInt(req.query.maxPoints) : undefined,
        sponsorName: req.query.sponsor,
      };

      const result = await voucherService.getCatalog(filters);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to fetch catalog',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        products: result.products,
        total: result.total,
        filters: filters,
      });
    } catch (error) {
      logger.error('Get catalog controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/vouchers/products/:productId
   * Get product details by ID
   */
  async getProduct(req, res) {
    try {
      const { productId } = req.params;

      const result = await voucherService.getProductById(productId);

      if (!result.success) {
        return res.status(404).json({
          error: 'Product not found',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        product: result.product,
      });
    } catch (error) {
      logger.error('Get product controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/vouchers/redeem
   * Redeem voucher (exchange points for product)
   */
  async redeemVoucher(req, res) {
    try {
      const userId = req.userId;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({
          error: 'Missing required field: productId',
        });
      }

      const result = await voucherService.redeemVoucher(userId, productId);

      if (!result.success) {
        if (result.error === 'Insufficient points') {
          return res.status(400).json({
            error: result.error,
            required: result.required,
            available: result.available,
            shortage: result.shortage,
          });
        }

        return res.status(400).json({
          error: result.error,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Voucher redeemed successfully',
        voucher: result.voucher,
        pointsSpent: result.pointsSpent,
        newBalance: result.newBalance,
      });
    } catch (error) {
      logger.error('Redeem voucher controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/vouchers/my-vouchers
   * Get user's vouchers (active, redeemed, expired)
   */
  async getMyVouchers(req, res) {
    try {
      const userId = req.userId;
      const status = req.query.status;

      const result = await voucherService.getUserVouchers(userId, status);

      if (!result.success) {
        return res.status(500).json({
          error: 'Failed to fetch vouchers',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        vouchers: result.vouchers,
        total: result.total,
      });
    } catch (error) {
      logger.error('Get my vouchers controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/vouchers/verify/:qrCode
   * Verify voucher by QR code (for store validation)
   */
  async verifyVoucher(req, res) {
    try {
      const { qrCode } = req.params;

      const result = await voucherService.getVoucherByQR(qrCode);

      if (!result.success) {
        return res.status(404).json({
          error: 'Voucher not found',
          message: result.error,
        });
      }

      return res.json({
        success: true,
        voucher: result.voucher,
        isValid: result.isValid,
        status: result.status,
      });
    } catch (error) {
      logger.error('Verify voucher controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/vouchers/redeem-qr
   * Mark voucher as redeemed (store clerk endpoint)
   */
  async redeemQR(req, res) {
    try {
      const { qrCode, redeemedBy, redemptionLocation } = req.body;

      if (!qrCode || !redeemedBy) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['qrCode', 'redeemedBy'],
        });
      }

      const result = await voucherService.markAsRedeemed(qrCode, redeemedBy, redemptionLocation);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          redeemedAt: result.redeemedAt,
        });
      }

      return res.json({
        success: true,
        message: result.message,
        voucher: result.voucher,
        product: result.product,
        user: result.user,
      });
    } catch (error) {
      logger.error('Redeem QR controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/vouchers/cancel/:voucherId
   * Cancel voucher and refund points (admin only)
   */
  async cancelVoucher(req, res) {
    try {
      const { voucherId } = req.params;
      const { reason } = req.body;
      const adminId = req.userId;

      if (!reason) {
        return res.status(400).json({
          error: 'Missing required field: reason',
        });
      }

      const result = await voucherService.cancelVoucher(voucherId, adminId, reason);

      if (!result.success) {
        return res.status(400).json({
          error: result.error,
        });
      }

      return res.json({
        success: true,
        message: result.message,
        pointsRefunded: result.pointsRefunded,
      });
    } catch (error) {
      logger.error('Cancel voucher controller error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new VoucherController();
