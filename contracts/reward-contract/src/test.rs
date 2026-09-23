#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Env, String,
};
use types::ClaimStatus;

fn create_token_contract<'a>(env: &Env, admin: &Address) -> (Address, token::Client<'a>) {
    let contract_address = env.register_stellar_asset_contract(admin.clone());
    let client = token::Client::new(env, &contract_address);
    (contract_address, client)
}

#[test]
fn test_create_pool() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sponsor = Address::generate(&env);

    // Create token
    let (token_address, token_client) = create_token_contract(&env, &admin);

    // Mint tokens to sponsor
    token_client.mint(&sponsor, &10_000_000);

    // Deploy reward contract
    let contract_id = env.register_contract(None, RewardContract);
    let client = RewardContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    // Create pool
    client.create_pool(&sponsor, &token_address, &5_000_000);

    // Verify pool
    let pool = client.get_pool(&sponsor);
    assert_eq!(pool.sponsor, sponsor);
    assert_eq!(pool.token_address, token_address);
    assert_eq!(pool.total_funded, 5_000_000);
    assert_eq!(pool.available_balance, 5_000_000);
    assert_eq!(pool.total_distributed, 0);
    assert!(pool.is_active);
}

#[test]
fn test_fund_pool() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sponsor = Address::generate(&env);

    let (token_address, token_client) = create_token_contract(&env, &admin);
    token_client.mint(&sponsor, &10_000_000);

    let contract_id = env.register_contract(None, RewardContract);
    let client = RewardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.create_pool(&sponsor, &token_address, &5_000_000);

    // Fund additional amount
    client.fund_pool(&sponsor, &3_000_000);

    let pool = client.get_pool(&sponsor);
    assert_eq!(pool.total_funded, 8_000_000);
    assert_eq!(pool.available_balance, 8_000_000);
}

#[test]
fn test_submit_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sponsor = Address::generate(&env);
    let claimer = Address::generate(&env);

    let (token_address, token_client) = create_token_contract(&env, &admin);
    token_client.mint(&sponsor, &10_000_000);

    let contract_id = env.register_contract(None, RewardContract);
    let client = RewardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.create_pool(&sponsor, &token_address, &5_000_000);

    // Submit claim
    let claim_id = client.submit_claim(
        &1, // mission_id
        &claimer,
        &100_000, // 0.1 USDC
        &String::from_str(&env, "ipfs://QmProof123"),
        &sponsor,
    );

    assert_eq!(claim_id, 1);

    // Verify claim
    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.id, 1);
    assert_eq!(claim.mission_id, 1);
    assert_eq!(claim.claimer, claimer);
    assert_eq!(claim.amount, 100_000);
    assert_eq!(claim.status, ClaimStatus::Pending);
}

#[test]
fn test_validate_and_distribute() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sponsor = Address::generate(&env);
    let claimer = Address::generate(&env);
    let validator = Address::generate(&env);

    let (token_address, token_client) = create_token_contract(&env, &admin);
    token_client.mint(&sponsor, &10_000_000);

    let contract_id = env.register_contract(None, RewardContract);
    let client = RewardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.add_validator(&admin, &validator);
    client.create_pool(&sponsor, &token_address, &5_000_000);

    // Submit claim
    let claim_id = client.submit_claim(
        &1,
        &claimer,
        &100_000,
        &String::from_str(&env, "ipfs://QmProof123"),
        &sponsor,
    );

    // Validate claim
    client.validate_claim(&claim_id, &validator, &true);

    let claim = client.get_claim(&claim_id);
    assert_eq!(claim.status, ClaimStatus::Approved);
    assert_eq!(claim.validator, Some(validator));

    // Distribute reward
    let initial_balance = token_client.balance(&claimer);
    client.distribute_reward(&claim_id);

    // Check balances
    let final_balance = token_client.balance(&claimer);
    assert_eq!(final_balance - initial_balance, 100_000);

    // Check pool updated
    let pool = client.get_pool(&sponsor);
    assert_eq!(pool.available_balance, 4_900_000);
    assert_eq!(pool.total_distributed, 100_000);
}

#[test]
#[should_panic(expected = "Error(InsufficientPoolBalance)")]
fn test_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sponsor = Address::generate(&env);
    let claimer = Address::generate(&env);

    let (token_address, token_client) = create_token_contract(&env, &admin);
    token_client.mint(&sponsor, &10_000_000);

    let contract_id = env.register_contract(None, RewardContract);
    let client = RewardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.create_pool(&sponsor, &token_address, &100_000);

    // Try to submit claim larger than pool
    client.submit_claim(
        &1,
        &claimer,
        &200_000,
        &String::from_str(&env, "ipfs://QmProof123"),
        &sponsor,
    );
}

#[test]
#[should_panic(expected = "Error(ClaimNotPending)")]
fn test_validate_already_validated() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sponsor = Address::generate(&env);
    let claimer = Address::generate(&env);
    let validator = Address::generate(&env);

    let (token_address, token_client) = create_token_contract(&env, &admin);
    token_client.mint(&sponsor, &10_000_000);

    let contract_id = env.register_contract(None, RewardContract);
    let client = RewardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.add_validator(&admin, &validator);
    client.create_pool(&sponsor, &token_address, &5_000_000);

    let claim_id = client.submit_claim(
        &1,
        &claimer,
        &100_000,
        &String::from_str(&env, "ipfs://QmProof123"),
        &sponsor,
    );

    // First validation
    client.validate_claim(&claim_id, &validator, &true);

    // Try to validate again - should panic
    client.validate_claim(&claim_id, &validator, &true);
}

#[test]
fn test_withdraw_pool() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sponsor = Address::generate(&env);

    let (token_address, token_client) = create_token_contract(&env, &admin);
    token_client.mint(&sponsor, &10_000_000);

    let contract_id = env.register_contract(None, RewardContract);
    let client = RewardContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.create_pool(&sponsor, &token_address, &5_000_000);

    let initial_balance = token_client.balance(&sponsor);

    // Withdraw
    client.withdraw_pool(&sponsor, &2_000_000);

    let final_balance = token_client.balance(&sponsor);
    assert_eq!(final_balance - initial_balance, 2_000_000);

    let pool = client.get_pool(&sponsor);
    assert_eq!(pool.available_balance, 3_000_000);
}
