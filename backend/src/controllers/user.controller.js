import stellarService from '../services/stellar.service.js';
import logger from '../config/logger.js';
import pool from '../config/database.js';

class UserController {
  /**
   * GET /api/users/:address
   * Get user profile and statistics
   */
  async getUserProfile(req, res) {
    try {
      const { address } = req.params;

      // Get user from database
      let user = await pool.query(
        'SELECT * FROM users WHERE wallet_address = $1',
        [address]
      );

      // Create user if doesn't exist
      if (user.rows.length === 0) {
        const insertResult = await pool.query(
          `INSERT INTO users (wallet_address, created_at)
           VALUES ($1, NOW())
           RETURNING *`,
          [address]
        );
        user = insertResult;
      }

      const userProfile = user.rows[0];

      // Get blockchain data
      const [certificates, impact] = await Promise.all([
        stellarService.getUserCertificates(address),
        stellarService.getUserImpact(address),
      ]);

      // Get claim statistics from database
      const stats = await pool.query(
        `SELECT
           COUNT(*) as total_claims,
           COUNT(*) FILTER (WHERE status = 'approved') as approved_claims,
           COUNT(*) FILTER (WHERE status = 'rejected') as rejected_claims,
           COUNT(*) FILTER (WHERE status = 'pending') as pending_claims,
           SUM(reward_amount) FILTER (WHERE status = 'approved') as total_earned
         FROM claims
         WHERE claimer_address = $1`,
        [address]
      );

      res.json({
        success: true,
        data: {
          ...userProfile,
          certificates: certificates.length,
          impact,
          stats: stats.rows[0],
        },
      });
    } catch (error) {
      logger.error(`Error in getUserProfile (${req.params.address}):`, error);
      res.status(500).json({
        error: 'Failed to fetch user profile',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/users/:address/certificates
   * Get user's impact certificates (NFTs)
   */
  async getUserCertificates(req, res) {
    try {
      const { address } = req.params;

      const tokenIds = await stellarService.getUserCertificates(address);

      // Fetch full certificate details for each token
      const certificates = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const cert = await stellarService.getCertificateDetails(tokenId);
            return cert;
          } catch (error) {
            logger.warn(`Failed to fetch certificate ${tokenId}:`, error);
            return null;
          }
        })
      );

      res.json({
        success: true,
        count: certificates.filter(c => c !== null).length,
        data: certificates.filter(c => c !== null),
      });
    } catch (error) {
      logger.error(`Error in getUserCertificates (${req.params.address}):`, error);
      res.status(500).json({
        error: 'Failed to fetch user certificates',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/users/:address/impact
   * Get user's environmental impact statistics
   */
  async getUserImpact(req, res) {
    try {
      const { address } = req.params;

      const impact = await stellarService.getUserImpact(address);

      // Get additional statistics from database
      const detailedStats = await pool.query(
        `SELECT
           COUNT(DISTINCT mission_id) as missions_completed,
           COUNT(*) as total_claims,
           MIN(created_at) as first_claim_date,
           MAX(created_at) as last_claim_date
         FROM claims
         WHERE claimer_address = $1 AND status = 'approved'`,
        [address]
      );

      res.json({
        success: true,
        data: {
          ...impact,
          ...detailedStats.rows[0],
          carbonOffsetKg: impact.totalCarbonOffsetG / 1000,
        },
      });
    } catch (error) {
      logger.error(`Error in getUserImpact (${req.params.address}):`, error);
      res.status(500).json({
        error: 'Failed to fetch user impact',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/users/:address
   * Update user profile
   */
  async updateUserProfile(req, res) {
    try {
      const { address } = req.params;
      const { username, email, avatar_uri } = req.body;

      const result = await pool.query(
        `UPDATE users
         SET username = COALESCE($1, username),
             email = COALESCE($2, email),
             avatar_uri = COALESCE($3, avatar_uri),
             updated_at = NOW()
         WHERE wallet_address = $4
         RETURNING *`,
        [username, email, avatar_uri, address]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error(`Error in updateUserProfile (${req.params.address}):`, error);
      res.status(500).json({
        error: 'Failed to update user profile',
        message: error.message,
      });
    }
  }
}

export default new UserController();
