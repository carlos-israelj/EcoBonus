#![no_std]

mod types;
mod storage;
mod mission;
mod error;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};
use types::{Mission, MissionStatus, Location};
use error::Error;

#[contract]
pub struct MissionContract;

#[contractimpl]
impl MissionContract {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) {
        storage::set_admin(&env, &admin);
    }

    /// Create a new mission
    /// Returns the mission ID
    pub fn create_mission(
        env: Env,
        creator: Address,
        location: Location,
        reward_amount: i128,
        max_claimers: u32,
        deadline: u64,
        metadata_uri: String,
        evidence_required: u8,
    ) -> Result<u64, Error> {
        creator.require_auth();

        // Validate inputs
        if reward_amount <= 0 {
            return Err(Error::InvalidRewardAmount);
        }

        if max_claimers == 0 {
            return Err(Error::InvalidMaxClaimers);
        }

        if deadline <= env.ledger().timestamp() {
            return Err(Error::InvalidDeadline);
        }

        let mission_id = storage::next_mission_id(&env);

        let mission = Mission {
            id: mission_id,
            creator: creator.clone(),
            location,
            reward_amount,
            status: MissionStatus::Pending,
            max_claimers,
            current_claimers: 0,
            evidence_required,
            deadline,
            metadata_uri,
            funded_amount: 0,
        };

        storage::set_mission(&env, mission_id, &mission);
        storage::add_creator_mission(&env, &creator, mission_id);

        Ok(mission_id)
    }

    /// Fund a mission to activate it
    pub fn fund_mission(
        env: Env,
        mission_id: u64,
        funder: Address,
        amount: i128,
    ) -> Result<(), Error> {
        funder.require_auth();

        let mut mission = storage::get_mission(&env, mission_id)?;

        // Only pending missions can be funded
        if mission.status != MissionStatus::Pending {
            return Err(Error::MissionNotPending);
        }

        // Check if deadline hasn't passed
        if env.ledger().timestamp() >= mission.deadline {
            return Err(Error::MissionExpired);
        }

        mission.funded_amount += amount;

        // If fully funded, activate the mission
        let required_funds = mission.reward_amount * mission.max_claimers as i128;
        if mission.funded_amount >= required_funds {
            mission.status = MissionStatus::Active;
        }

        storage::set_mission(&env, mission_id, &mission);

        Ok(())
    }

    /// Claim a mission
    /// Returns claim ID (to be used in RewardContract)
    pub fn claim_mission(
        env: Env,
        mission_id: u64,
        claimer: Address,
        proof_uri: String,
    ) -> Result<u64, Error> {
        claimer.require_auth();

        let mut mission = storage::get_mission(&env, mission_id)?;

        // Validate mission status
        if mission.status != MissionStatus::Active {
            return Err(Error::MissionNotActive);
        }

        // Check deadline
        if env.ledger().timestamp() >= mission.deadline {
            mission.status = MissionStatus::Expired;
            storage::set_mission(&env, mission_id, &mission);
            return Err(Error::MissionExpired);
        }

        // Check if mission is full
        if mission.current_claimers >= mission.max_claimers {
            mission.status = MissionStatus::Completed;
            storage::set_mission(&env, mission_id, &mission);
            return Err(Error::MissionFull);
        }

        // Check if user already claimed this mission
        if storage::has_user_claimed(&env, &claimer, mission_id) {
            return Err(Error::AlreadyClaimed);
        }

        // Increment claimers
        mission.current_claimers += 1;

        // If all slots filled, mark as completed
        if mission.current_claimers >= mission.max_claimers {
            mission.status = MissionStatus::Completed;
        }

        storage::set_mission(&env, mission_id, &mission);
        storage::mark_user_claimed(&env, &claimer, mission_id);
        storage::add_user_mission(&env, &claimer, mission_id);

        // Generate claim ID (combination of mission_id and claimer count)
        let claim_id = mission_id * 1000000 + mission.current_claimers as u64;

        Ok(claim_id)
    }

    /// Cancel a mission (only creator or admin)
    pub fn cancel_mission(
        env: Env,
        mission_id: u64,
        canceler: Address,
    ) -> Result<(), Error> {
        canceler.require_auth();

        let mut mission = storage::get_mission(&env, mission_id)?;
        let admin = storage::get_admin(&env);

        // Only creator or admin can cancel
        if canceler != mission.creator && canceler != admin {
            return Err(Error::Unauthorized);
        }

        // Can only cancel pending or active missions
        if mission.status != MissionStatus::Pending && mission.status != MissionStatus::Active {
            return Err(Error::CannotCancel);
        }

        mission.status = MissionStatus::Cancelled;
        storage::set_mission(&env, mission_id, &mission);

        Ok(())
    }

    /// Get mission details
    pub fn get_mission(env: Env, mission_id: u64) -> Result<Mission, Error> {
        storage::get_mission(&env, mission_id)
    }

    /// Get active missions near a location
    pub fn get_active_missions_near(
        env: Env,
        latitude: i64,
        longitude: i64,
        radius_km: u32,
    ) -> Vec<Mission> {
        let all_missions = storage::get_all_missions(&env);
        let mut nearby_missions = Vec::new(&env);

        for mission in all_missions.iter() {
            if mission.status != MissionStatus::Active {
                continue;
            }

            // Calculate distance (simplified - in production use proper geospatial calc)
            let distance = calculate_distance(
                latitude,
                longitude,
                mission.location.latitude,
                mission.location.longitude,
            );

            if distance <= radius_km {
                nearby_missions.push_back(mission);
            }
        }

        nearby_missions
    }

    /// Get missions by creator
    pub fn get_creator_missions(env: Env, creator: Address) -> Vec<u64> {
        storage::get_creator_missions(&env, &creator)
    }

    /// Get missions by user (claimed)
    pub fn get_user_missions(env: Env, user: Address) -> Vec<u64> {
        storage::get_user_missions(&env, &user)
    }

    /// Get total number of missions
    pub fn get_mission_count(env: Env) -> u64 {
        storage::get_mission_count(&env)
    }
}

// Helper function to calculate distance (simplified Haversine formula)
fn calculate_distance(lat1: i64, lon1: i64, lat2: i64, lon2: i64) -> u32 {
    // Convert from fixed point (scaled by 1e6)
    let lat1_f = lat1 as f64 / 1_000_000.0;
    let lon1_f = lon1 as f64 / 1_000_000.0;
    let lat2_f = lat2 as f64 / 1_000_000.0;
    let lon2_f = lon2 as f64 / 1_000_000.0;

    // Simplified distance calculation (for demo purposes)
    // In production, use proper Haversine formula
    let dlat = (lat2_f - lat1_f).abs();
    let dlon = (lon2_f - lon1_f).abs();

    // Rough approximation: 1 degree ≈ 111 km
    let distance_km = ((dlat * dlat + dlon * dlon).sqrt() * 111.0) as u32;

    distance_km
}
