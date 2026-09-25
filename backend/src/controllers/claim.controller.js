import stellarService from '../services/stellar.service.js';
import ipfsService from '../services/ipfs.service.js';
import photoValidationService from '../services/photoValidation.service.js';
import logger from '../config/logger.js';
import pool from '../config/database.js';
import supabase from '../config/supabase.js';

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

  /**
   * POST /api/claims/:id/validate-photos
   * Validate before/after photos for a claim
   */
  async validatePhotos(req, res) {
    try {
      const { id } = req.params;

      // Check if photos were uploaded
      if (!req.files || !req.files.before || !req.files.after) {
        return res.status(400).json({
          error: 'Both before and after photos are required',
        });
      }

      const beforePhoto = req.files.before[0].buffer;
      const afterPhoto = req.files.after[0].buffer;

      // Get claim to fetch mission details
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .select('mission_id')
        .eq('id', id)
        .single();

      if (claimError || !claim) {
        return res.status(404).json({
          error: 'Claim not found',
        });
      }

      // Get mission details
      const { data: mission, error: missionError } = await supabase
        .from('missions')
        .select('latitude, longitude, radius_meters')
        .eq('id', claim.mission_id)
        .single();

      if (missionError || !mission) {
        return res.status(404).json({
          error: 'Mission not found',
        });
      }

      // Validate photos
      const validation = await photoValidationService.validateBeforeAfterPhotos(
        beforePhoto,
        afterPhoto,
        mission
      );

      // Store validation result in database
      await supabase
        .from('claims')
        .update({
          validation_score: validation.score,
          validation_result: validation,
          photo_before_hash: validation.before.hash,
          photo_after_hash: validation.after.hash,
          photo_validated_at: new Date().toISOString(),
        })
        .eq('id', id);

      logger.info(`Photo validation for claim ${id}: ${validation.valid ? 'VALID' : 'INVALID'} (${validation.score}/100)`);

      res.json({
        success: true,
        claimId: id,
        validation,
      });
    } catch (error) {
      logger.error(`Error in validatePhotos (${req.params.id}):`, error);
      res.status(500).json({
        error: 'Failed to validate photos',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/claims/:id/upload-before
   * Upload and validate before photo
   */
  async uploadBeforePhoto(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: 'Photo file is required',
        });
      }

      const photoBuffer = req.file.buffer;

      // Get claim and mission
      const { data: claim } = await supabase
        .from('claims')
        .select('mission_id')
        .eq('id', id)
        .single();

      const { data: mission } = await supabase
        .from('missions')
        .select('latitude, longitude, radius_meters')
        .eq('id', claim.mission_id)
        .single();

      // Extract GPS and validate
      const gps = await photoValidationService.extractGPSFromPhoto(photoBuffer);
      const locationValidation = photoValidationService.validatePhotoLocation(gps, mission);
      const photoHash = await photoValidationService.calculatePhotoHash(photoBuffer);
      const metadata = await photoValidationService.getImageMetadata(photoBuffer);

      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadPhoto(photoBuffer, {
        claimId: id,
        type: 'before',
        gps,
        hash: photoHash,
      });

      // Store in database
      await supabase
        .from('claims')
        .update({
          photo_before_url: ipfsResult.url,
          photo_before_hash: photoHash,
          photo_before_gps: gps,
          photo_before_metadata: metadata,
          photo_before_location_valid: locationValidation.valid,
        })
        .eq('id', id);

      res.json({
        success: true,
        claimId: id,
        photo: {
          url: ipfsResult.url,
          hash: photoHash,
          gps,
          locationValidation,
          metadata,
        },
      });
    } catch (error) {
      logger.error(`Error in uploadBeforePhoto (${req.params.id}):`, error);
      res.status(500).json({
        error: 'Failed to upload before photo',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/claims/:id/upload-after
   * Upload and validate after photo
   */
  async uploadAfterPhoto(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          error: 'Photo file is required',
        });
      }

      const photoBuffer = req.file.buffer;

      // Get claim and mission
      const { data: claim } = await supabase
        .from('claims')
        .select('mission_id, photo_before_hash')
        .eq('id', id)
        .single();

      const { data: mission } = await supabase
        .from('missions')
        .select('latitude, longitude, radius_meters')
        .eq('id', claim.mission_id)
        .single();

      // Extract GPS and validate
      const gps = await photoValidationService.extractGPSFromPhoto(photoBuffer);
      const locationValidation = photoValidationService.validatePhotoLocation(gps, mission);
      const photoHash = await photoValidationService.calculatePhotoHash(photoBuffer);
      const metadata = await photoValidationService.getImageMetadata(photoBuffer);

      // Compare with before photo
      let photoComparison = null;
      if (claim.photo_before_hash) {
        photoComparison = photoValidationService.comparePhotoHashes(
          claim.photo_before_hash,
          photoHash
        );
      }

      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadPhoto(photoBuffer, {
        claimId: id,
        type: 'after',
        gps,
        hash: photoHash,
      });

      // Calculate overall validation score
      let validationScore = 0;
      if (locationValidation.valid) validationScore += 50;
      if (gps.hasGPS) validationScore += 10;
      if (photoComparison && !photoComparison.isIdentical) validationScore += 40;

      // Store in database
      await supabase
        .from('claims')
        .update({
          photo_after_url: ipfsResult.url,
          photo_after_hash: photoHash,
          photo_after_gps: gps,
          photo_after_metadata: metadata,
          photo_after_location_valid: locationValidation.valid,
          photo_comparison: photoComparison,
          validation_score: validationScore,
        })
        .eq('id', id);

      res.json({
        success: true,
        claimId: id,
        photo: {
          url: ipfsResult.url,
          hash: photoHash,
          gps,
          locationValidation,
          metadata,
        },
        photoComparison,
        validationScore,
      });
    } catch (error) {
      logger.error(`Error in uploadAfterPhoto (${req.params.id}):`, error);
      res.status(500).json({
        error: 'Failed to upload after photo',
        message: error.message,
      });
    }
  }
}

export default new ClaimController();
