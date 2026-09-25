import supabase from '../config/supabase.js';
import pointsService from '../services/points.service.js';
import logger from '../config/logger.js';

/**
 * Validator Controller
 * Handles validator dashboard and manual claim validation
 */
class ValidatorController {
  /**
   * GET /api/validator/queue
   * Get pending claims queue for validation
   */
  async getValidationQueue(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const priority = req.query.priority; // 'high', 'medium', 'low'

      let query = supabase
        .from('validation_queue')
        .select(`
          *,
          claim:claims(
            *,
            mission:missions(id, code, title, category, latitude, longitude),
            user:users(id, name, avatar_url, total_missions_completed)
          )
        `, { count: 'exact' })
        .is('assigned_validator_id', null)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (priority) {
        const priorityMap = { high: 2, medium: 1, low: 0 };
        query = query.eq('priority', priorityMap[priority] || 0);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch queue: ${error.message}`);
      }

      return res.json({
        success: true,
        queue: data || [],
        total: count || 0,
        limit,
        offset,
      });
    } catch (error) {
      logger.error('Get validation queue error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/validator/my-queue
   * Get claims assigned to current validator
   */
  async getMyQueue(req, res) {
    try {
      const validatorId = req.userId;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const { data, error, count } = await supabase
        .from('validation_queue')
        .select(`
          *,
          claim:claims(
            *,
            mission:missions(id, code, title, category),
            user:users(id, name, avatar_url)
          )
        `, { count: 'exact' })
        .eq('assigned_validator_id', validatorId)
        .order('assigned_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch assigned queue: ${error.message}`);
      }

      return res.json({
        success: true,
        queue: data || [],
        total: count || 0,
        limit,
        offset,
      });
    } catch (error) {
      logger.error('Get my queue error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/validator/assign/:claimId
   * Assign claim to current validator
   */
  async assignClaim(req, res) {
    try {
      const { claimId } = req.params;
      const validatorId = req.userId;

      // Check if claim exists in queue
      const { data: queueItem, error: fetchError } = await supabase
        .from('validation_queue')
        .select('*')
        .eq('claim_id', claimId)
        .single();

      if (fetchError || !queueItem) {
        return res.status(404).json({
          error: 'Claim not found in validation queue',
        });
      }

      if (queueItem.assigned_validator_id) {
        return res.status(400).json({
          error: 'Claim already assigned to another validator',
          assignedTo: queueItem.assigned_validator_id,
        });
      }

      // Assign to validator
      const { error: updateError } = await supabase
        .from('validation_queue')
        .update({
          assigned_validator_id: validatorId,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', queueItem.id);

      if (updateError) {
        throw new Error(`Failed to assign claim: ${updateError.message}`);
      }

      logger.info('Claim assigned to validator:', {
        claimId,
        validatorId,
      });

      return res.json({
        success: true,
        message: 'Claim assigned successfully',
        claimId,
      });
    } catch (error) {
      logger.error('Assign claim error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/validator/approve/:claimId
   * Approve claim and award points
   */
  async approveClaim(req, res) {
    try {
      const { claimId } = req.params;
      const { notes } = req.body;
      const validatorId = req.userId;

      // Fetch claim
      const { data: claim, error: fetchError } = await supabase
        .from('claims')
        .select('*, mission:missions(*), user:users(*)')
        .eq('id', claimId)
        .single();

      if (fetchError || !claim) {
        return res.status(404).json({
          error: 'Claim not found',
        });
      }

      if (claim.validation_status === 'approved') {
        return res.status(400).json({
          error: 'Claim already approved',
        });
      }

      // Update claim status
      const { error: updateError } = await supabase
        .from('claims')
        .update({
          validation_status: 'approved',
          validator_id: validatorId,
          validation_notes: notes,
          validated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (updateError) {
        throw new Error(`Failed to update claim: ${updateError.message}`);
      }

      // Award points
      const pointsResult = await pointsService.awardClaimPoints(claimId);

      if (!pointsResult.success) {
        logger.error('Failed to award points after approval:', pointsResult.error);
      }

      // Remove from validation queue
      await supabase
        .from('validation_queue')
        .delete()
        .eq('claim_id', claimId);

      logger.info('Claim approved:', {
        claimId,
        validatorId,
        pointsAwarded: pointsResult.pointsAwarded,
        leveledUp: pointsResult.leveledUp,
      });

      return res.json({
        success: true,
        message: 'Claim approved successfully',
        claimId,
        pointsAwarded: pointsResult.pointsAwarded || 0,
        leveledUp: pointsResult.leveledUp || false,
        newLevel: pointsResult.newLevel,
      });
    } catch (error) {
      logger.error('Approve claim error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/validator/reject/:claimId
   * Reject claim with reason
   */
  async rejectClaim(req, res) {
    try {
      const { claimId } = req.params;
      const { reason } = req.body;
      const validatorId = req.userId;

      if (!reason) {
        return res.status(400).json({
          error: 'Missing required field: reason',
        });
      }

      // Fetch claim
      const { data: claim, error: fetchError } = await supabase
        .from('claims')
        .select('*')
        .eq('id', claimId)
        .single();

      if (fetchError || !claim) {
        return res.status(404).json({
          error: 'Claim not found',
        });
      }

      if (claim.validation_status === 'rejected') {
        return res.status(400).json({
          error: 'Claim already rejected',
        });
      }

      // Update claim status
      const { error: updateError } = await supabase
        .from('claims')
        .update({
          validation_status: 'rejected',
          validator_id: validatorId,
          rejection_reason: reason,
          validated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (updateError) {
        throw new Error(`Failed to update claim: ${updateError.message}`);
      }

      // Remove from validation queue
      await supabase
        .from('validation_queue')
        .delete()
        .eq('claim_id', claimId);

      logger.info('Claim rejected:', {
        claimId,
        validatorId,
        reason,
      });

      return res.json({
        success: true,
        message: 'Claim rejected',
        claimId,
        reason,
      });
    } catch (error) {
      logger.error('Reject claim error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/validator/stats
   * Get validator statistics
   */
  async getValidatorStats(req, res) {
    try {
      const validatorId = req.userId;

      // Count total validations
      const { count: totalValidations } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('validator_id', validatorId);

      // Count approved
      const { count: approvedCount } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('validator_id', validatorId)
        .eq('validation_status', 'approved');

      // Count rejected
      const { count: rejectedCount } = await supabase
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('validator_id', validatorId)
        .eq('validation_status', 'rejected');

      // Count currently assigned
      const { count: assignedCount } = await supabase
        .from('validation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_validator_id', validatorId);

      const approvalRate = totalValidations > 0
        ? ((approvedCount / totalValidations) * 100).toFixed(2)
        : 0;

      return res.json({
        success: true,
        stats: {
          totalValidations: totalValidations || 0,
          approved: approvedCount || 0,
          rejected: rejectedCount || 0,
          currentlyAssigned: assignedCount || 0,
          approvalRate: parseFloat(approvalRate),
        },
      });
    } catch (error) {
      logger.error('Get validator stats error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new ValidatorController();
