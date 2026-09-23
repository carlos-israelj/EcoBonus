use soroban_sdk::{symbol_short, Address, Env, Vec};
use crate::types::Mission;
use crate::error::Error;

// Storage keys
const ADMIN_KEY: &str = "admin";
const MISSION_COUNTER_KEY: &str = "mission_counter";
const MISSION_PREFIX: &str = "mission";
const USER_CLAIMS_PREFIX: &str = "user_claims";
const CREATOR_MISSIONS_PREFIX: &str = "creator_missions";
const USER_MISSIONS_PREFIX: &str = "user_missions";

/// Get admin address
pub fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&symbol_short!(ADMIN_KEY))
        .unwrap()
}

/// Set admin address
pub fn set_admin(env: &Env, admin: &Address) {
    env.storage()
        .instance()
        .set(&symbol_short!(ADMIN_KEY), admin);
}

/// Get next mission ID and increment counter
pub fn next_mission_id(env: &Env) -> u64 {
    let key = symbol_short!(MISSION_COUNTER_KEY);
    let current: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(current + 1));
    current + 1
}

/// Get mission count
pub fn get_mission_count(env: &Env) -> u64 {
    let key = symbol_short!(MISSION_COUNTER_KEY);
    env.storage().instance().get(&key).unwrap_or(0)
}

/// Get mission by ID
pub fn get_mission(env: &Env, mission_id: u64) -> Result<Mission, Error> {
    let key = (symbol_short!(MISSION_PREFIX), mission_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::MissionNotFound)
}

/// Set mission
pub fn set_mission(env: &Env, mission_id: u64, mission: &Mission) {
    let key = (symbol_short!(MISSION_PREFIX), mission_id);
    env.storage().persistent().set(&key, mission);
}

/// Get all missions (for querying nearby missions)
/// Note: In production, this should be optimized with spatial indexing
pub fn get_all_missions(env: &Env) -> Vec<Mission> {
    let count = get_mission_count(env);
    let mut missions = Vec::new(env);

    for i in 1..=count {
        if let Ok(mission) = get_mission(env, i) {
            missions.push_back(mission);
        }
    }

    missions
}

/// Check if user has claimed a mission
pub fn has_user_claimed(env: &Env, user: &Address, mission_id: u64) -> bool {
    let key = (symbol_short!(USER_CLAIMS_PREFIX), user.clone(), mission_id);
    env.storage().persistent().has(&key)
}

/// Mark user as having claimed a mission
pub fn mark_user_claimed(env: &Env, user: &Address, mission_id: u64) {
    let key = (symbol_short!(USER_CLAIMS_PREFIX), user.clone(), mission_id);
    env.storage().persistent().set(&key, &true);
}

/// Add mission to creator's list
pub fn add_creator_mission(env: &Env, creator: &Address, mission_id: u64) {
    let key = (symbol_short!(CREATOR_MISSIONS_PREFIX), creator.clone());
    let mut missions: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    missions.push_back(mission_id);
    env.storage().persistent().set(&key, &missions);
}

/// Get missions created by an address
pub fn get_creator_missions(env: &Env, creator: &Address) -> Vec<u64> {
    let key = (symbol_short!(CREATOR_MISSIONS_PREFIX), creator.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}

/// Add mission to user's claimed list
pub fn add_user_mission(env: &Env, user: &Address, mission_id: u64) {
    let key = (symbol_short!(USER_MISSIONS_PREFIX), user.clone());
    let mut missions: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    missions.push_back(mission_id);
    env.storage().persistent().set(&key, &missions);
}

/// Get missions claimed by a user
pub fn get_user_missions(env: &Env, user: &Address) -> Vec<u64> {
    let key = (symbol_short!(USER_MISSIONS_PREFIX), user.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}
