import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import pointsService from './points.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Voucher Service
 * Manages voucher catalog and redemption
 */
class VoucherService {
  /**
   * Get active products catalog
   */
  async getCatalog(filters = {}) {
    try {
      let query = supabase
        .from('sponsor_products')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.maxPoints) {
        query = query.lte('points_cost', filters.maxPoints);
      }

      if (filters.sponsorName) {
        query = query.eq('sponsor_name', filters.sponsorName);
      }

      // Sort by points_cost ascending
      query = query.order('points_cost', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch catalog: ${error.message}`);
      }

      return {
        success: true,
        products: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      logger.error('Get catalog error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    try {
      const { data, error } = await supabase
        .from('sponsor_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch product: ${error.message}`);
      }

      if (!data) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      return {
        success: true,
        product: data,
      };
    } catch (error) {
      logger.error('Get product error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Redeem voucher (exchange points for product)
   */
  async redeemVoucher(userId, productId) {
    try {
      // Fetch product
      const productResult = await this.getProductById(productId);
      if (!productResult.success) {
        return productResult;
      }

      const product = productResult.product;

      // Check if product is active
      if (!product.is_active) {
        return {
          success: false,
          error: 'Product is not available',
        };
      }

      // Check stock availability (if limited)
      if (product.stock_available !== -1) {
        const availableStock = product.stock_available - product.stock_reserved;
        if (availableStock <= 0) {
          return {
            success: false,
            error: 'Product out of stock',
          };
        }
      }

      // Get user balance
      const balanceResult = await pointsService.getBalance(userId);
      if (!balanceResult.success) {
        return {
          success: false,
          error: 'Failed to fetch user balance',
        };
      }

      const userBalance = balanceResult.balance;
      const pointsCost = product.points_cost;

      // Check if user has enough points
      if (userBalance < pointsCost) {
        return {
          success: false,
          error: 'Insufficient points',
          required: pointsCost,
          available: userBalance,
          shortage: pointsCost - userBalance,
        };
      }

      // Generate unique QR code
      const qrCode = uuidv4();

      // Calculate expiration date
      const expirationDays = product.expiration_days || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);

      // Create voucher redemption
      const { data: voucher, error: voucherError } = await supabase
        .from('voucher_redemptions')
        .insert({
          user_id: userId,
          product_id: productId,
          qr_code: qrCode,
          points_spent: pointsCost,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (voucherError) {
        throw new Error(`Failed to create voucher: ${voucherError.message}`);
      }

      // Deduct points from user
      const spendResult = await pointsService.spendPoints(
        userId,
        pointsCost,
        'voucher_redemption',
        voucher.id,
        `Redeemed: ${product.product_name}`
      );

      if (!spendResult.success) {
        // Rollback voucher creation
        await supabase
          .from('voucher_redemptions')
          .delete()
          .eq('id', voucher.id);

        return {
          success: false,
          error: spendResult.error,
        };
      }

      // Update product stock (reserve one)
      if (product.stock_available !== -1) {
        await supabase
          .from('sponsor_products')
          .update({
            stock_reserved: product.stock_reserved + 1,
          })
          .eq('id', productId);
      }

      logger.info('Voucher redeemed:', {
        userId,
        productId,
        voucherId: voucher.id,
        pointsSpent: pointsCost,
        newBalance: spendResult.newBalance,
      });

      return {
        success: true,
        voucher: {
          ...voucher,
          product: product,
        },
        pointsSpent: pointsCost,
        newBalance: spendResult.newBalance,
      };
    } catch (error) {
      logger.error('Redeem voucher error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's vouchers
   */
  async getUserVouchers(userId, status = null) {
    try {
      let query = supabase
        .from('voucher_redemptions')
        .select(`
          *,
          product:sponsor_products(*)
        `)
        .eq('user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch vouchers: ${error.message}`);
      }

      return {
        success: true,
        vouchers: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      logger.error('Get user vouchers error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get voucher by QR code (for store validation)
   */
  async getVoucherByQR(qrCode) {
    try {
      const { data, error } = await supabase
        .from('voucher_redemptions')
        .select(`
          *,
          product:sponsor_products(*),
          user:users(id, name, email, stellar_address)
        `)
        .eq('qr_code', qrCode)
        .single();

      if (error) {
        throw new Error(`Failed to fetch voucher: ${error.message}`);
      }

      if (!data) {
        return {
          success: false,
          error: 'Voucher not found',
        };
      }

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);

      const isExpired = now > expiresAt;
      const isValid = data.status === 'active' && !isExpired;

      return {
        success: true,
        voucher: data,
        isValid: isValid,
        status: isExpired ? 'expired' : data.status,
      };
    } catch (error) {
      logger.error('Get voucher by QR error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Mark voucher as redeemed (store clerk scans QR)
   */
  async markAsRedeemed(qrCode, redeemedBy, redemptionLocation = null) {
    try {
      // Fetch voucher
      const voucherResult = await this.getVoucherByQR(qrCode);
      if (!voucherResult.success) {
        return voucherResult;
      }

      const voucher = voucherResult.voucher;

      // Check if already redeemed
      if (voucher.status === 'redeemed') {
        return {
          success: false,
          error: 'Voucher already redeemed',
          redeemedAt: voucher.redeemed_at,
        };
      }

      // Check if expired
      if (!voucherResult.isValid) {
        return {
          success: false,
          error: 'Voucher expired or invalid',
          status: voucherResult.status,
        };
      }

      // Mark as redeemed
      const { error } = await supabase
        .from('voucher_redemptions')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by: redeemedBy,
          redemption_location: redemptionLocation,
        })
        .eq('id', voucher.id);

      if (error) {
        throw new Error(`Failed to mark voucher as redeemed: ${error.message}`);
      }

      // Update product stock
      const product = voucher.product;
      if (product.stock_available !== -1) {
        await supabase
          .from('sponsor_products')
          .update({
            stock_reserved: Math.max(0, product.stock_reserved - 1),
            stock_available: Math.max(0, product.stock_available - 1),
          })
          .eq('id', product.id);
      }

      logger.info('Voucher redeemed at store:', {
        voucherId: voucher.id,
        userId: voucher.user_id,
        productId: voucher.product_id,
        redeemedBy,
        redemptionLocation,
      });

      return {
        success: true,
        message: 'Voucher redeemed successfully',
        voucher: voucher,
        product: product,
        user: voucher.user,
      };
    } catch (error) {
      logger.error('Mark as redeemed error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel voucher (admin only, refunds points)
   */
  async cancelVoucher(voucherId, adminId, reason) {
    try {
      // Fetch voucher
      const { data: voucher, error: fetchError } = await supabase
        .from('voucher_redemptions')
        .select('*, product:sponsor_products(*)')
        .eq('id', voucherId)
        .single();

      if (fetchError || !voucher) {
        return {
          success: false,
          error: 'Voucher not found',
        };
      }

      // Check if already redeemed
      if (voucher.status === 'redeemed') {
        return {
          success: false,
          error: 'Cannot cancel redeemed voucher',
        };
      }

      // Mark as cancelled
      const { error: cancelError } = await supabase
        .from('voucher_redemptions')
        .update({
          status: 'cancelled',
        })
        .eq('id', voucherId);

      if (cancelError) {
        throw new Error(`Failed to cancel voucher: ${cancelError.message}`);
      }

      // Refund points to user
      const refundResult = await pointsService.refundPoints(
        voucher.user_id,
        voucher.points_spent,
        voucherId,
        `Voucher cancelled: ${reason}`
      );

      if (!refundResult.success) {
        logger.error('Failed to refund points on voucher cancellation:', refundResult.error);
      }

      // Update product stock
      const product = voucher.product;
      if (product.stock_available !== -1) {
        await supabase
          .from('sponsor_products')
          .update({
            stock_reserved: Math.max(0, product.stock_reserved - 1),
          })
          .eq('id', product.id);
      }

      logger.info('Voucher cancelled:', {
        voucherId,
        userId: voucher.user_id,
        adminId,
        reason,
        pointsRefunded: voucher.points_spent,
      });

      return {
        success: true,
        message: 'Voucher cancelled and points refunded',
        pointsRefunded: voucher.points_spent,
      };
    } catch (error) {
      logger.error('Cancel voucher error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Auto-expire vouchers (cron job)
   */
  async expireOldVouchers() {
    try {
      const now = new Date().toISOString();

      const { data: expiredVouchers, error } = await supabase
        .from('voucher_redemptions')
        .update({
          status: 'expired',
        })
        .eq('status', 'active')
        .lt('expires_at', now)
        .select();

      if (error) {
        throw new Error(`Failed to expire vouchers: ${error.message}`);
      }

      // Update stock for expired vouchers
      for (const voucher of expiredVouchers || []) {
        const { data: product } = await supabase
          .from('sponsor_products')
          .select('stock_reserved')
          .eq('id', voucher.product_id)
          .single();

        if (product && product.stock_reserved > 0) {
          await supabase
            .from('sponsor_products')
            .update({
              stock_reserved: Math.max(0, product.stock_reserved - 1),
            })
            .eq('id', voucher.product_id);
        }
      }

      logger.info('Expired vouchers:', {
        count: expiredVouchers?.length || 0,
      });

      return {
        success: true,
        expiredCount: expiredVouchers?.length || 0,
      };
    } catch (error) {
      logger.error('Expire vouchers error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new VoucherService();
