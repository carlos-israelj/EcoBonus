use soroban_sdk::{symbol_short, Address, Env, Vec};
use crate::types::{RewardPool, Claim};
use crate::error::Error;

// Storage keys
const ADMIN_KEY: &str = "admin";
const CLAIM_COUNTER_KEY: &str = "claim_counter";
const POOL_PREFIX: &str = "pool";
const CLAIM_PREFIX: &str = "claim";
const SPONSOR_CLAIMS_PREFIX: &str = "sponsor_claims";
const USER_CLAIMS_PREFIX: &str = "user_claims";
const VALIDATORS_KEY: &str = "validators";

/// Get admin address
pub fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&symbol_short!("admin"))
        .unwrap()
}

/// Set admin address
pub fn set_admin(env: &Env, admin: &Address) {
    env.storage()
        .instance()
        .set(&symbol_short!("admin"), admin);
}

/// Get next claim ID
pub fn next_claim_id(env: &Env) -> u64 {
    let key = symbol_short!("clm_cnt");
    let current: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(current + 1));
    current + 1
}

/// Get reward pool by sponsor
pub fn get_pool(env: &Env, sponsor: &Address) -> Result<RewardPool, Error> {
    let key = (symbol_short!("pool"), sponsor.clone());
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::PoolNotFound)
}

/// Set reward pool
pub fn set_pool(env: &Env, sponsor: &Address, pool: &RewardPool) {
    let key = (symbol_short!("pool"), sponsor.clone());
    env.storage().persistent().set(&key, pool);
}

/// Check if pool exists
pub fn has_pool(env: &Env, sponsor: &Address) -> bool {
    let key = (symbol_short!("pool"), sponsor.clone());
    env.storage().persistent().has(&key)
}

/// Get claim by ID
pub fn get_claim(env: &Env, claim_id: u64) -> Result<Claim, Error> {
    let key = (symbol_short!("claim"), claim_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::ClaimNotFound)
}

/// Set claim
pub fn set_claim(env: &Env, claim_id: u64, claim: &Claim) {
    let key = (symbol_short!("claim"), claim_id);
    env.storage().persistent().set(&key, claim);
}

/// Add claim to user's list
pub fn add_user_claim(env: &Env, user: &Address, claim_id: u64) {
    let key = (symbol_short!("usr_clms"), user.clone());
    let mut claims: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    claims.push_back(claim_id);
    env.storage().persistent().set(&key, &claims);
}

/// Get user's claims
pub fn get_user_claims(env: &Env, user: &Address) -> Vec<u64> {
    let key = (symbol_short!("usr_clms"), user.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}

/// Add claim to sponsor's list
pub fn add_sponsor_claim(env: &Env, sponsor: &Address, claim_id: u64) {
    let key = (symbol_short!("spon_clm"), sponsor.clone());
    let mut claims: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    claims.push_back(claim_id);
    env.storage().persistent().set(&key, &claims);
}

/// Get sponsor's funded claims
pub fn get_sponsor_claims(env: &Env, sponsor: &Address) -> Vec<u64> {
    let key = (symbol_short!("spon_clm"), sponsor.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}

/// Add validator
pub fn add_validator(env: &Env, validator: &Address) {
    let key = symbol_short!("validat");
    let mut validators: Vec<Address> = env.storage().instance().get(&key).unwrap_or(Vec::new(env));

    // Check if already exists
    for v in validators.iter() {
        if v == *validator {
            return;
        }
    }

    validators.push_back(validator.clone());
    env.storage().instance().set(&key, &validators);
}

/// Check if address is validator
pub fn is_validator(env: &Env, address: &Address) -> bool {
    let key = symbol_short!("validat");
    let validators: Vec<Address> = env.storage().instance().get(&key).unwrap_or(Vec::new(env));

    for v in validators.iter() {
        if v == *address {
            return true;
        }
    }

    false
}

/// Remove validator
pub fn remove_validator(env: &Env, validator: &Address) {
    let key = symbol_short!("validat");
    let validators: Vec<Address> = env.storage().instance().get(&key).unwrap_or(Vec::new(env));
    let mut new_validators = Vec::new(env);

    for v in validators.iter() {
        if v != *validator {
            new_validators.push_back(v);
        }
    }

    env.storage().instance().set(&key, &new_validators);
}
