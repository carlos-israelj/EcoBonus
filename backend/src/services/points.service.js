import supabase from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Points Service
 * Manages the points system (earn, spend, balance, ledger)
 */
class PointsService {
  /**
   * Get user's current points balance
   */
  async getBalance(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('total_points, level, experience')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to fetch balance: ${error.message}`);
      }

      return {
        success: true,
        balance: user?.total_points || 0,
        level: user?.level || 1,
        experience: user?.experience || 0,
      };
    } catch (error) {
      logger.error('Get balance error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Award points to user
   * Creates ledger entry and updates user balance
   */
  async awardPoints(userId, amount, source, referenceId = null, description = null, metadata = null) {
    try {
      // Start transaction by fetching current balance
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('total_points, level, experience, current_streak')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch user: ${fetchError.message}`);
      }

      const currentBalance = user.total_points || 0;
      const newBalance = currentBalance + amount;

      // Calculate if user levels up
      const { newLevel, newExperience } = this.calculateLevel(user.experience + amount);
      const leveledUp = newLevel > user.level;

      // Create ledger entry
      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('points_ledger')
        .insert({
          user_id: userId,
          transaction_type: 'earn',
          amount: amount,
          balance_after: newBalance,
          source: source,
          reference_id: referenceId,
          description: description || `Earned ${amount} points`,
          metadata: metadata,
        })
        .select()
        .single();

      if (ledgerError) {
        throw new Error(`Failed to create ledger entry: ${ledgerError.message}`);
      }

      // Update user balance, experience, and level
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_points: newBalance,
          level: newLevel,
          experience: newExperience,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update user balance: ${updateError.message}`);
      }

      logger.info('Points awarded:', {
        userId,
        amount,
        source,
        newBalance,
        leveledUp,
        newLevel,
      });

      return {
        success: true,
        ledgerEntry,
        newBalance,
        leveledUp,
        newLevel,
        experience: newExperience,
      };
    } catch (error) {
      logger.error('Award points error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Deduct points from user (for voucher redemption, etc.)
   */
  async spendPoints(userId, amount, source, referenceId = null, description = null) {
    try {
      // Fetch current balance
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch user: ${fetchError.message}`);
      }

      const currentBalance = user.total_points || 0;

      // Check if user has enough points
      if (currentBalance < amount) {
        return {
          success: false,
          error: 'Insufficient points',
          required: amount,
          available: currentBalance,
        };
      }

      const newBalance = currentBalance - amount;

      // Create ledger entry (negative amount)
      const { data: ledgerEntry, error: ledgerError } = await supabase
        .from('points_ledger')
        .insert({
          user_id: userId,
          transaction_type: 'spend',
          amount: -amount, // Negative for spend
          balance_after: newBalance,
          source: source,
          reference_id: referenceId,
          description: description || `Spent ${amount} points`,
        })
        .select()
        .single();

      if (ledgerError) {
        throw new Error(`Failed to create ledger entry: ${ledgerError.message}`);
      }

      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          total_points: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update user balance: ${updateError.message}`);
      }

      logger.info('Points spent:', {
        userId,
        amount,
        source,
        newBalance,
      });

      return {
        success: true,
        ledgerEntry,
        newBalance,
        amountSpent: amount,
      };
    } catch (error) {
      logger.error('Spend points error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's points transaction history
   */
  async getHistory(userId, limit = 50, offset = 0) {
    try {
      const { data, error, count } = await supabase
        .from('points_ledger')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to fetch history: ${error.message}`);
      }

      return {
        success: true,
        transactions: data || [],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      logger.error('Get history error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Calculate streak bonus
   * Returns bonus points based on current streak
   */
  calculateStreakBonus(streakDays) {
    if (streakDays >= 30) return 20; // 1 month streak
    if (streakDays >= 14) return 15; // 2 weeks
    if (streakDays >= 7) return 10;  // 1 week
    if (streakDays >= 3) return 5;   // 3 days
    return 0;
  }

  /**
   * Calculate level and experience
   * Formula: level = floor(sqrt(experience / 100))
   * Example: 100 XP = level 1, 400 XP = level 2, 900 XP = level 3
   */
  calculateLevel(totalExperience) {
    const level = Math.floor(Math.sqrt(totalExperience / 100)) + 1;
    return {
      newLevel: level,
      newExperience: totalExperience,
    };
  }

  /**
   * Calculate points for mission completion
   * Base points + bonuses (streak, difficulty, bags)
   */
  calculateMissionPoints(mission, claim, user) {
    let basePoints = mission.reward_points || 40;
    let bonusPoints = 0;

    // Difficulty bonus
    if (mission.difficulty === 'medium') bonusPoints += 10;
    if (mission.difficulty === 'hard') bonusPoints += 20;

    // Bag collection bonus (5 pts per bag above expected)
    const extraBags = Math.max(0, claim.bags_collected - (mission.estimated_bags || 3));
    bonusPoints += extraBags * 5;

    // Streak bonus
    const streakBonus = this.calculateStreakBonus(user.current_streak || 0);
    bonusPoints += streakBonus;

    return {
      basePoints,
      bonusPoints,
      totalPoints: basePoints + bonusPoints,
      breakdown: {
        base: basePoints,
        difficulty: mission.difficulty === 'medium' ? 10 : mission.difficulty === 'hard' ? 20 : 0,
        extraBags: extraBags * 5,
        streak: streakBonus,
      },
    };
  }

  /**
   * Award points for approved claim
   */
  async awardClaimPoints(claimId) {
    try {
      // Fetch claim with mission and user data
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .select(`
          *,
          mission:missions(*),
          user:users(*)
        `)
        .eq('id', claimId)
        .single();

      if (claimError) {
        throw new Error(`Failed to fetch claim: ${claimError.message}`);
      }

      // Calculate points
      const pointsCalc = this.calculateMissionPoints(claim.mission, claim, claim.user);

      // Award points
      const result = await this.awardPoints(
        claim.user_id,
        pointsCalc.totalPoints,
        'mission_completion',
        claimId,
        `Mission completed: ${claim.mission.title}`,
        {
          mission_id: claim.mission_id,
          breakdown: pointsCalc.breakdown,
        }
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Update claim with points awarded
      const { error: updateError } = await supabase
        .from('claims')
        .update({
          points_awarded: pointsCalc.basePoints,
          bonus_points: pointsCalc.bonusPoints,
          total_points: pointsCalc.totalPoints,
        })
        .eq('id', claimId);

      if (updateError) {
        logger.error('Failed to update claim points:', updateError);
      }

      return {
        success: true,
        pointsAwarded: pointsCalc.totalPoints,
        breakdown: pointsCalc.breakdown,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
      };
    } catch (error) {
      logger.error('Award claim points error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Refund points (if claim is rejected after initial approval)
   */
  async refundPoints(userId, amount, referenceId, description) {
    return await this.awardPoints(
      userId,
      amount,
      'refund',
      referenceId,
      description,
      { refund: true }
    );
  }

  /**
   * Admin: Adjust points (penalty or bonus)
   */
  async adminAdjustment(userId, amount, reason, adminId) {
    const transactionType = amount > 0 ? 'bonus' : 'penalty';
    const source = 'admin_adjustment';

    // Create ledger entry
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      };
    }

    const newBalance = (user.total_points || 0) + amount;

    const { error: ledgerError } = await supabase
      .from('points_ledger')
      .insert({
        user_id: userId,
        transaction_type: transactionType,
        amount: amount,
        balance_after: newBalance,
        source: source,
        description: `Admin adjustment: ${reason}`,
        metadata: { admin_id: adminId },
      });

    if (ledgerError) {
      return {
        success: false,
        error: ledgerError.message,
      };
    }

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        total_points: newBalance,
      })
      .eq('id', userId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    logger.info('Admin points adjustment:', {
      userId,
      amount,
      reason,
      adminId,
      newBalance,
    });

    return {
      success: true,
      newBalance,
      amount,
    };
  }
}

export default new PointsService();
