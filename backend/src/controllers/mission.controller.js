import stellarService from '../services/stellar.service.js';
import logger from '../config/logger.js';
import pool from '../config/database.js';
import supabase from '../config/supabase.js';

class MissionController {
  /**
   * GET /api/missions/nearby
   * Get missions near a location using PostGIS
   */
  async getNearbyMissions(req, res) {
    try {
      const { lat, lon, radius = 5000 } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({
          error: 'Missing required parameters: lat, lon',
        });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lon);
      const radiusMeters = parseInt(radius);

      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusMeters)) {
        return res.status(400).json({
          error: 'Invalid parameters: lat, lon, and radius must be numbers',
        });
      }

      // Validate coordinates range
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({
          error: 'Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180',
        });
      }

      logger.info(`Searching missions near (${latitude}, ${longitude}) within ${radiusMeters}m`);

      // Call PostGIS function missions_nearby()
      const { data: missions, error } = await supabase.rpc('missions_nearby', {
        user_lat: latitude,
        user_lon: longitude,
        radius_meters: radiusMeters
      });

      if (error) {
        logger.error('Error calling missions_nearby function:', error);
        return res.status(500).json({
          error: 'Failed to fetch nearby missions',
          message: error.message,
          hint: error.hint || 'Make sure missions_nearby() function exists in Supabase'
        });
      }

      logger.info(`Found ${missions?.length || 0} missions within radius`);

      res.json({
        success: true,
        count: missions?.length || 0,
        radius_meters: radiusMeters,
        center: {
          latitude,
          longitude
        },
        data: missions || [],
      });
    } catch (error) {
      logger.error('Error in getNearbyMissions:', error);
      res.status(500).json({
        error: 'Failed to fetch nearby missions',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/missions/:id
   * Get mission details by ID
   */
  async getMissionById(req, res) {
    try {
      const { id } = req.params;
      const missionId = parseInt(id);

      if (isNaN(missionId)) {
        return res.status(400).json({
          error: 'Invalid mission ID',
        });
      }

      const mission = await stellarService.getMissionById(missionId);

      if (!mission) {
        return res.status(404).json({
          error: 'Mission not found',
        });
      }

      // Get claim statistics from database
      const stats = await this.getMissionStats(missionId);

      res.json({
        success: true,
        data: {
          ...mission,
          stats,
        },
      });
    } catch (error) {
      logger.error(`Error in getMissionById (${req.params.id}):`, error);
      res.status(500).json({
        error: 'Failed to fetch mission details',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/missions/:id/claims
   * Get all claims for a mission
   */
  async getMissionClaims(req, res) {
    try {
      const { id } = req.params;
      const missionId = parseInt(id);

      const result = await pool.query(
        `SELECT c.*, u.username, u.reputation_score
         FROM claims c
         LEFT JOIN users u ON c.claimer_address = u.wallet_address
         WHERE c.mission_id = $1
         ORDER BY c.created_at DESC`,
        [missionId]
      );

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows,
      });
    } catch (error) {
      logger.error(`Error in getMissionClaims (${req.params.id}):`, error);
      res.status(500).json({
        error: 'Failed to fetch mission claims',
        message: error.message,
      });
    }
  }

  // Helper methods
  async enrichMissionsFromDB(missions) {
    if (missions.length === 0) return [];

    const missionIds = missions.map(m => m.mission_id);

    const result = await pool.query(
      `SELECT mission_id,
              COUNT(*) as total_claims,
              COUNT(*) FILTER (WHERE status = 'approved') as approved_claims,
              AVG(validation_score) as avg_score
       FROM claims
       WHERE mission_id = ANY($1)
       GROUP BY mission_id`,
      [missionIds]
    );

    const statsMap = new Map(result.rows.map(r => [r.mission_id, r]));

    return missions.map(mission => ({
      ...mission,
      stats: statsMap.get(mission.mission_id) || {
        total_claims: 0,
        approved_claims: 0,
        avg_score: null,
      },
    }));
  }

  async getMissionStats(missionId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) as total_claims,
         COUNT(*) FILTER (WHERE status = 'approved') as approved_claims,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_claims,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected_claims,
         AVG(validation_score) as avg_validation_score
       FROM claims
       WHERE mission_id = $1`,
      [missionId]
    );

    return result.rows[0] || {
      total_claims: 0,
      approved_claims: 0,
      pending_claims: 0,
      rejected_claims: 0,
      avg_validation_score: null,
    };
  }
}

export default new MissionController();
