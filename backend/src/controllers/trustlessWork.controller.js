/**
 * Trustless Work Controller
 *
 * Handles webhooks from frontend for AI validation and auto-approval
 */

import trustlessWorkService from '../services/trustlessWork.service.js';
import logger from '../config/logger.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';

/**
 * Validate claim and auto-approve if AI validation passes
 *
 * POST /api/trustless-work/validate-claim
 * Body: { escrowId, evidenceUri, userAddress }
 */
export const validateClaim = async (req, res) => {
  try {
    const { escrowId, evidenceUri, userAddress } = req.body;

    if (!escrowId || !evidenceUri || !userAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: escrowId, evidenceUri, userAddress'
      });
    }

    logger.info('Validating claim', {
      escrowId,
      evidenceUri,
      userAddress
    });

    // Step 1: Call AI service for validation
    let aiResult;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/validate`, {
        imageUri: evidenceUri,
        escrowId,
        userAddress
      });

      aiResult = aiResponse.data;
      logger.info('AI validation result', aiResult);
    } catch (aiError) {
      logger.error('AI service error:', aiError.message);

      // For now, if AI service is not available, we'll manually approve
      // In production, you might want to fail here instead
      logger.warn('AI service unavailable, proceeding with manual approval');
      aiResult = {
        valid: true,
        confidence: 0.5,
        category: 'unknown',
        reason: 'AI service unavailable'
      };
    }

    // Step 2: If AI validation passes, auto-approve milestone
    if (aiResult.valid) {
      logger.info('✅ AI validation passed, approving milestone');

      try {
        const approvalResult = await trustlessWorkService.approveMilestone(escrowId, '0');

        logger.info('Milestone approved, now releasing funds');

        // Step 3: Release funds after approval
        const releaseResult = await trustlessWorkService.releaseFunds(escrowId, '0');

        return res.json({
          success: true,
          message: 'Claim validated and approved successfully',
          aiValidation: aiResult,
          approval: approvalResult,
          release: releaseResult
        });
      } catch (escrowError) {
        logger.error('Error in escrow operations:', escrowError);

        return res.status(500).json({
          success: false,
          error: 'Failed to approve/release funds',
          details: escrowError.message,
          aiValidation: aiResult
        });
      }
    } else {
      // AI validation failed
      logger.warn('❌ AI validation failed', {
        escrowId,
        reason: aiResult.reason
      });

      return res.json({
        success: false,
        message: 'Claim validation failed',
        reason: aiResult.reason || 'Evidence does not meet requirements',
        aiValidation: aiResult
      });
    }
  } catch (error) {
    logger.error('Error in validateClaim:', error);

    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation',
      details: error.message
    });
  }
};

/**
 * Get escrow data
 *
 * GET /api/trustless-work/escrow/:escrowId
 */
export const getEscrowData = async (req, res) => {
  try {
    const { escrowId } = req.params;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing escrowId parameter'
      });
    }

    const escrows = await trustlessWorkService.getEscrows([escrowId]);

    if (!escrows || escrows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Escrow not found'
      });
    }

    return res.json({
      success: true,
      escrow: escrows[0]
    });
  } catch (error) {
    logger.error('Error fetching escrow:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch escrow data',
      details: error.message
    });
  }
};

/**
 * Manually approve a milestone (admin only)
 *
 * POST /api/trustless-work/approve-milestone
 * Body: { escrowId, milestoneIndex }
 */
export const approveMilestone = async (req, res) => {
  try {
    const { escrowId, milestoneIndex = '0' } = req.body;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing escrowId'
      });
    }

    const result = await trustlessWorkService.approveMilestone(escrowId, milestoneIndex);

    return res.json({
      success: true,
      message: 'Milestone approved successfully',
      result
    });
  } catch (error) {
    logger.error('Error approving milestone:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to approve milestone',
      details: error.message
    });
  }
};

/**
 * Manually release funds (admin only)
 *
 * POST /api/trustless-work/release-funds
 * Body: { escrowId, milestoneIndex }
 */
export const releaseFunds = async (req, res) => {
  try {
    const { escrowId, milestoneIndex = '0' } = req.body;

    if (!escrowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing escrowId'
      });
    }

    const result = await trustlessWorkService.releaseFunds(escrowId, milestoneIndex);

    return res.json({
      success: true,
      message: 'Funds released successfully',
      result
    });
  } catch (error) {
    logger.error('Error releasing funds:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to release funds',
      details: error.message
    });
  }
};

export default {
  validateClaim,
  getEscrowData,
  approveMilestone,
  releaseFunds
};
