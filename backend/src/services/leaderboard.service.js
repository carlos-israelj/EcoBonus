import supabase from '../config/supabase.js';
import logger from '../config/logger.js';

/**
 * Leaderboard Service
 * Manages rankings and leaderboard cache
 */
class LeaderboardService {
  /**
   * Get leaderboard for specific scope and period
   */
  async getLeaderboard(options = {}) {
    const {
      period = 'weekly',
      scope = 'global',
      scopeValue = null,
      limit = 100,
    } = options;

    try {
      // Determine period dates
      const { periodStart, periodEnd } = this.getPeriodDates(period);

      let query = supabase
        .from('leaderboard_cache')
        .select('*')
        .eq('period', period)
        .eq('scope', scope)
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0])
        .order('rank', { ascending: true })
        .limit(limit);

      // Add scope value filter if provided
      if (scopeValue) {
        query = query.eq('scope_value', scopeValue);
      } else if (scope !== 'global') {
        // If scope requires value but not provided, return empty
        return {
          success: true,
          leaderboard: [],
          period,
          scope,
          scopeValue,
        };
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch leaderboard: ${error.message}`);
      }

      return {
        success: true,
        leaderboard: data || [],
        period,
        scope,
        scopeValue,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      };
    } catch (error) {
      logger.error('Get leaderboard error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(userId, period = 'weekly', scope = 'global', scopeValue = null) {
    try {
      const { periodStart, periodEnd } = this.getPeriodDates(period);

      let query = supabase
        .from('leaderboard_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .eq('scope', scope)
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0]);

      if (scopeValue) {
        query = query.eq('scope_value', scopeValue);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user rank: ${error.message}`);
      }

      if (!data) {
        return {
          success: true,
          inLeaderboard: false,
          message: 'User not ranked in this leaderboard',
        };
      }

      return {
        success: true,
        inLeaderboard: true,
        rank: data.rank,
        totalPoints: data.total_points,
        missionsCompleted: data.missions_completed,
        period,
        scope,
        scopeValue,
      };
    } catch (error) {
      logger.error('Get user rank error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update leaderboard cache (run periodically via cron)
   */
  async updateLeaderboardCache(period = 'weekly', scope = 'global', scopeValue = null) {
    try {
      const { periodStart, periodEnd } = this.getPeriodDates(period);

      // Build query to get top users
      let query = supabase
        .from('users')
        .select('id, name, avatar_url, level, total_points, total_missions_completed')
        .eq('is_active', true)
        .order('total_points', { ascending: false })
        .limit(100);

      // Add scope filters
      if (scope === 'university' && scopeValue) {
        query = query.eq('university', scopeValue);
      } else if (scope === 'city' && scopeValue) {
        query = query.eq('city', scopeValue);
      } else if (scope === 'district' && scopeValue) {
        query = query.eq('district', scopeValue);
      } else if (scope === 'country' && scopeValue) {
        query = query.eq('country', scopeValue);
      }

      const { data: topUsers, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch top users: ${fetchError.message}`);
      }

      if (!topUsers || topUsers.length === 0) {
        logger.info('No users found for leaderboard update:', { period, scope, scopeValue });
        return {
          success: true,
          updated: 0,
        };
      }

      // Delete old cache entries for this period/scope
      await supabase
        .from('leaderboard_cache')
        .delete()
        .eq('period', period)
        .eq('scope', scope)
        .eq('scope_value', scopeValue || '')
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0]);

      // Insert new cache entries
      const cacheEntries = topUsers.map((user, index) => ({
        period,
        scope,
        scope_value: scopeValue,
        user_id: user.id,
        rank: index + 1,
        total_points: user.total_points,
        missions_completed: user.total_missions_completed,
        user_name: user.name,
        user_avatar_url: user.avatar_url,
        user_level: user.level,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
      }));

      const { error: insertError } = await supabase
        .from('leaderboard_cache')
        .insert(cacheEntries);

      if (insertError) {
        throw new Error(`Failed to insert cache entries: ${insertError.message}`);
      }

      logger.info('Leaderboard cache updated:', {
        period,
        scope,
        scopeValue,
        usersRanked: cacheEntries.length,
      });

      return {
        success: true,
        updated: cacheEntries.length,
        period,
        scope,
        scopeValue,
      };
    } catch (error) {
      logger.error('Update leaderboard cache error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update all leaderboards (run via cron hourly)
   */
  async updateAllLeaderboards() {
    const results = {
      success: true,
      updates: [],
      errors: [],
    };

    const periods = ['daily', 'weekly', 'monthly', 'all_time'];
    const scopes = [
      { scope: 'global', value: null },
      // Add specific values dynamically based on your data
      // { scope: 'country', value: 'Peru' },
      // { scope: 'city', value: 'Lima' },
    ];

    for (const period of periods) {
      for (const { scope, value } of scopes) {
        try {
          const result = await this.updateLeaderboardCache(period, scope, value);
          if (result.success) {
            results.updates.push({ period, scope, value, updated: result.updated });
          } else {
            results.errors.push({ period, scope, value, error: result.error });
          }
        } catch (error) {
          results.errors.push({ period, scope, value, error: error.message });
        }
      }
    }

    if (results.errors.length > 0) {
      results.success = false;
    }

    logger.info('All leaderboards updated:', {
      totalUpdates: results.updates.length,
      totalErrors: results.errors.length,
    });

    return results;
  }

  /**
   * Get period start and end dates
   */
  getPeriodDates(period) {
    const now = new Date();
    let periodStart, periodEnd;

    switch (period) {
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;

      case 'weekly':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek); // Start of week (Sunday)
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;

      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      case 'all_time':
        periodStart = new Date(2020, 0, 1); // Arbitrary start date
        periodEnd = new Date(2099, 11, 31); // Far future
        break;

      default:
        periodStart = new Date(now);
        periodEnd = new Date(now);
    }

    return { periodStart, periodEnd };
  }

  /**
   * Get surrounding users on leaderboard (context around user's position)
   */
  async getSurroundingRanks(userId, period = 'weekly', scope = 'global', scopeValue = null, range = 5) {
    try {
      // Get user's rank first
      const userRankResult = await this.getUserRank(userId, period, scope, scopeValue);

      if (!userRankResult.success || !userRankResult.inLeaderboard) {
        return {
          success: true,
          surrounding: [],
          userRank: null,
        };
      }

      const userRank = userRankResult.rank;
      const { periodStart, periodEnd } = this.getPeriodDates(period);

      // Fetch users above and below
      let query = supabase
        .from('leaderboard_cache')
        .select('*')
        .eq('period', period)
        .eq('scope', scope)
        .gte('period_start', periodStart.toISOString().split('T')[0])
        .lte('period_end', periodEnd.toISOString().split('T')[0])
        .gte('rank', Math.max(1, userRank - range))
        .lte('rank', userRank + range)
        .order('rank', { ascending: true });

      if (scopeValue) {
        query = query.eq('scope_value', scopeValue);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch surrounding ranks: ${error.message}`);
      }

      return {
        success: true,
        surrounding: data || [],
        userRank: userRank,
        range: range,
      };
    } catch (error) {
      logger.error('Get surrounding ranks error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new LeaderboardService();
