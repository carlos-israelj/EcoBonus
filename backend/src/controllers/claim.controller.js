import stellarService from '../services/stellar.service.js';
import ipfsService from '../services/ipfs.service.js';
import logger from '../config/logger.js';
import pool from '../config/database.js';

class ClaimController {
  /**
   * POST /api/claims
   * Submit a new claim
   */
  async submitClaim(req, res) {
    try {
      const { missionId, claimerAddress, location, images } = req.body;

      // Validate required fields
      if (!missionId || !claimerAddress || !location || !images || images.length < 2) {
        return res.status(400).json({
          error: 'Missing required fields: missionId, claimerAddress, location, images (min 2)',
        });
      }

      // Upload evidence to IPFS
      const proofBundle = await ipfsService.uploadProofBundle(images, {
        missionId,
        location,
        claimerAddress,
      });

      // Get unsigned transaction from blockchain
      const unsignedTx = await stellarService.submitClaim(
        missionId,
        claimerAddress,
        proofBundle.metadataUri
      );

      // Store claim in database for tracking
      const result = await pool.query(
        `INSERT INTO claims (
          mission_id, claimer_address, proof_uri,
          latitude, longitude, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id`,
        [
          missionId,
          claimerAddress,
          proofBundle.metadataUri,
          location.latitude,
          location.longitude,
          'pending_signature',
        ]
      );

      res.json({
        success: true,
        data: {
          claimId: result.rows[0].id,
          unsignedTransaction: unsignedTx,
          proofUri: proofBundle.metadataUri,
          ipfsMetadata: proofBundle,
        },
      });
    } catch (error) {
      logger.error('Error in submitClaim:', error);
      res.status(500).json({
        error: 'Failed to submit claim',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/claims/:id/validate
   * Validate a claim (admin/oracle only)
   */
  async validateClaim(req, res) {
    try {
      const { id } = req.params;
      const { approved, validationScore, aiAnalysis } = req.body;
      const claimId = parseInt(id);

      if (typeof approved !== 'boolean') {
        return res.status(400).json({
          error: 'Missing required field: approved (boolean)',
        });
      }

      // Submit validation to blockchain
      const txResponse = await stellarService.validateClaim(claimId, approved);

      // Update database
      await pool.query(
        `UPDATE claims
         SET status = $1,
             validation_score = $2,
             ai_analysis = $3,
             validated_at = NOW(),
             blockchain_tx = $4
         WHERE id = $5`,
        [
          approved ? 'approved' : 'rejected',
          validationScore,
          JSON.stringify(aiAnalysis),
          txResponse.hash,
          claimId,
        ]
      );

      logger.info(`Claim ${claimId} validated: ${approved}`, {
        txHash: txResponse.hash,
      });

      res.json({
        success: true,
        data: {
          claimId,
          approved,
          transactionHash: txResponse.hash,
        },
      });
    } catch (error) {
      logger.error(`Error validating claim ${req.params.id}:`, error);
      res.status(500).json({
        error: 'Failed to validate claim',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/claims/:id
   * Get claim details
   */
  async getClaimById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT c.*,
                u.username, u.reputation_score,
                m.title as mission_title
         FROM claims c
         LEFT JOIN users u ON c.claimer_address = u.wallet_address
         LEFT JOIN missions m ON c.mission_id = m.id
         WHERE c.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Claim not found',
        });
      }

      const claim = result.rows[0];

      // Get IPFS metadata if available
      if (claim.proof_uri && claim.proof_uri.startsWith('ipfs://')) {
        try {
          const cid = claim.proof_uri.replace('ipfs://', '');
          claim.proofMetadata = await ipfsService.getMetadata(cid);
        } catch (error) {
          logger.warn(`Failed to fetch IPFS metadata for claim ${id}:`, error);
        }
      }

      res.json({
        success: true,
        data: claim,
      });
    } catch (error) {
      logger.error(`Error in getClaimById (${req.params.id}):`, error);
      res.status(500).json({
        error: 'Failed to fetch claim details',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/users/:address/claims
   * Get all claims for a user
   */
  async getUserClaims(req, res) {
    try {
      const { address } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT c.*, m.title as mission_title, m.reward_amount
        FROM claims c
        LEFT JOIN missions m ON c.mission_id = m.id
        WHERE c.claimer_address = $1
      `;
      const params = [address];

      if (status) {
        query += ` AND c.status = $${params.length + 1}`;
        params.push(status);
      }

      query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      // Also get from blockchain for verification
      const blockchainClaims = await stellarService.getUserClaims(address);

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
        blockchain: blockchainClaims,
      });
    } catch (error) {
      logger.error(`Error in getUserClaims (${req.params.address}):`, error);
      res.status(500).json({
        error: 'Failed to fetch user claims',
        message: error.message,
      });
    }
  }
}

export default new ClaimController();
