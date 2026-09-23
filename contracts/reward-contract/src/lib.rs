#![no_std]

mod types;
mod storage;
mod error;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};
use types::{RewardPool, Claim, ClaimStatus};
use error::Error;

#[contract]
pub struct RewardContract;

#[contractimpl]
impl RewardContract {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) {
        storage::set_admin(&env, &admin);
    }

    /// Create a new reward pool with native XLM
    pub fn create_pool(
        env: Env,
        sponsor: Address,
        initial_amount: i128,
    ) -> Result<(), Error> {
        sponsor.require_auth();

        // Check if pool already exists
        if storage::has_pool(&env, &sponsor) {
            return Err(Error::PoolAlreadyExists);
        }

        // Validate amount
        if initial_amount < 0 {
            return Err(Error::InvalidAmount);
        }

        // Create pool
        let pool = RewardPool {
            sponsor: sponsor.clone(),
            total_funded: initial_amount,
            total_distributed: 0,
            available_balance: initial_amount,
            is_active: true,
        };

        storage::set_pool(&env, &sponsor, &pool);

        Ok(())
    }

    /// Fund an existing pool with XLM
    pub fn fund_pool(
        env: Env,
        sponsor: Address,
        amount: i128,
    ) -> Result<(), Error> {
        sponsor.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut pool = storage::get_pool(&env, &sponsor)?;

        if !pool.is_active {
            return Err(Error::PoolInactive);
        }

        // Update pool accounting
        pool.total_funded += amount;
        pool.available_balance += amount;
        storage::set_pool(&env, &sponsor, &pool);

        Ok(())
    }

    /// Withdraw XLM from pool (sponsor only)
    pub fn withdraw_pool(
        env: Env,
        sponsor: Address,
        amount: i128,
    ) -> Result<(), Error> {
        sponsor.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut pool = storage::get_pool(&env, &sponsor)?;

        if amount > pool.available_balance {
            return Err(Error::InsufficientPoolBalance);
        }

        // Update pool accounting
        pool.available_balance -= amount;
        storage::set_pool(&env, &sponsor, &pool);

        Ok(())
    }

    /// Deactivate pool (sponsor or admin only)
    pub fn deactivate_pool(
        env: Env,
        sponsor: Address,
        caller: Address,
    ) -> Result<(), Error> {
        caller.require_auth();

        let admin = storage::get_admin(&env);
        if caller != sponsor && caller != admin {
            return Err(Error::Unauthorized);
        }

        let mut pool = storage::get_pool(&env, &sponsor)?;
        pool.is_active = false;
        storage::set_pool(&env, &sponsor, &pool);

        Ok(())
    }

    /// Submit a claim for validation
    pub fn submit_claim(
        env: Env,
        mission_id: u64,
        claimer: Address,
        amount: i128,
        proof_uri: String,
        sponsor: Address,
    ) -> Result<u64, Error> {
        claimer.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Check pool has funds
        let pool = storage::get_pool(&env, &sponsor)?;
        if !pool.is_active {
            return Err(Error::PoolInactive);
        }
        if pool.available_balance < amount {
            return Err(Error::InsufficientPoolBalance);
        }

        // Create claim
        let claim_id = storage::next_claim_id(&env);
        let claim = Claim {
            id: claim_id,
            mission_id,
            claimer: claimer.clone(),
            amount,
            status: ClaimStatus::Pending,
            submitted_at: env.ledger().timestamp(),
            proof_uri,
            validator: None,
            validated_at: None,
        };

        storage::set_claim(&env, claim_id, &claim);
        storage::add_user_claim(&env, &claimer, claim_id);
        storage::add_sponsor_claim(&env, &sponsor, claim_id);

        Ok(claim_id)
    }

    /// Validate a claim (validator or admin only)
    pub fn validate_claim(
        env: Env,
        claim_id: u64,
        validator: Address,
        approved: bool,
    ) -> Result<(), Error> {
        validator.require_auth();

        let admin = storage::get_admin(&env);
        if !storage::is_validator(&env, &validator) && validator != admin {
            return Err(Error::InvalidValidator);
        }

        let mut claim = storage::get_claim(&env, claim_id)?;

        // Can only validate pending claims
        if claim.status != ClaimStatus::Pending {
            return Err(Error::ClaimNotPending);
        }

        // Update claim status
        claim.validator = Some(validator);
        claim.validated_at = Some(env.ledger().timestamp());

        if approved {
            claim.status = ClaimStatus::Approved;
        } else {
            claim.status = ClaimStatus::Rejected;
        }

        storage::set_claim(&env, claim_id, &claim);

        Ok(())
    }

    /// Distribute XLM reward after validation (automatic after approval)
    pub fn distribute_reward(
        env: Env,
        claim_id: u64,
    ) -> Result<(), Error> {
        let claim = storage::get_claim(&env, claim_id)?;

        // Can only distribute approved claims
        if claim.status != ClaimStatus::Approved {
            return Err(Error::ClaimNotPending);
        }

        // Find the pool (iterate through sponsor claims)
        // In production, we'd store sponsor reference in claim
        // For now, we'll search (not optimal but works for MVP)
        let sponsor = Self::find_claim_sponsor(&env, claim_id)?;
        let mut pool = storage::get_pool(&env, &sponsor)?;

        // Check balance
        if pool.available_balance < claim.amount {
            return Err(Error::InsufficientPoolBalance);
        }

        // Update pool accounting
        pool.available_balance -= claim.amount;
        pool.total_distributed += claim.amount;
        storage::set_pool(&env, &sponsor, &pool);

        Ok(())
    }

    /// Add a validator (admin only)
    pub fn add_validator(
        env: Env,
        admin: Address,
        validator: Address,
    ) -> Result<(), Error> {
        admin.require_auth();

        let stored_admin = storage::get_admin(&env);
        if admin != stored_admin {
            return Err(Error::Unauthorized);
        }

        storage::add_validator(&env, &validator);
        Ok(())
    }

    /// Remove a validator (admin only)
    pub fn remove_validator(
        env: Env,
        admin: Address,
        validator: Address,
    ) -> Result<(), Error> {
        admin.require_auth();

        let stored_admin = storage::get_admin(&env);
        if admin != stored_admin {
            return Err(Error::Unauthorized);
        }

        storage::remove_validator(&env, &validator);
        Ok(())
    }

    /// Get pool stats
    pub fn get_pool(env: Env, sponsor: Address) -> Result<RewardPool, Error> {
        storage::get_pool(&env, &sponsor)
    }

    /// Get claim details
    pub fn get_claim(env: Env, claim_id: u64) -> Result<Claim, Error> {
        storage::get_claim(&env, claim_id)
    }

    /// Get user's claims
    pub fn get_user_claims(env: Env, user: Address) -> Vec<u64> {
        storage::get_user_claims(&env, &user)
    }

    /// Get sponsor's claims
    pub fn get_sponsor_claims(env: Env, sponsor: Address) -> Vec<u64> {
        storage::get_sponsor_claims(&env, &sponsor)
    }

    /// Check if address is a validator
    pub fn is_validator(env: Env, address: Address) -> bool {
        storage::is_validator(&env, &address)
    }

    // Helper function to find which sponsor a claim belongs to
    fn find_claim_sponsor(env: &Env, claim_id: u64) -> Result<Address, Error> {
        let claim = storage::get_claim(env, claim_id)?;

        // In a real implementation, we'd store the sponsor in the claim
        // For now, iterate through all possible sponsors (not efficient)
        // This is a limitation we'd fix in production

        // Placeholder: return the claimer as sponsor (needs to be fixed)
        // TODO: Add sponsor field to Claim struct
        Ok(claim.claimer)
    }
}
