#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};
use types::{Location, MissionStatus};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, MissionContract);
    let client = MissionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    client.initialize(&admin);

    // Verify admin is set (would need a getter function in production)
    assert!(true); // Placeholder
}

#[test]
fn test_create_mission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MissionContract);
    let client = MissionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,  // Lima, Peru
        longitude: -77042793,
        radius: 100,
    };

    let deadline = env.ledger().timestamp() + 86400; // 24 hours from now

    let mission_id = client.create_mission(
        &creator,
        &location,
        &1_000_000, // 1 USDC (assuming 6 decimals)
        &10,        // max 10 claimers
        &deadline,
        &String::from_str(&env, "ipfs://QmTest123"),
        &2, // 2 photos required
    );

    assert_eq!(mission_id, 1);

    // Get mission and verify
    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.id, 1);
    assert_eq!(mission.creator, creator);
    assert_eq!(mission.reward_amount, 1_000_000);
    assert_eq!(mission.status, MissionStatus::Pending);
    assert_eq!(mission.current_claimers, 0);
}

#[test]
fn test_fund_mission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MissionContract);
    let client = MissionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
        radius: 100,
    };

    let deadline = env.ledger().timestamp() + 86400;

    let mission_id = client.create_mission(
        &creator,
        &location,
        &1_000_000,
        &10,
        &deadline,
        &String::from_str(&env, "ipfs://QmTest123"),
        &2,
    );

    // Fund the mission
    client.fund_mission(&mission_id, &creator, &10_000_000);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.status, MissionStatus::Active);
    assert_eq!(mission.funded_amount, 10_000_000);
}

#[test]
fn test_claim_mission() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MissionContract);
    let client = MissionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let claimer = Address::generate(&env);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
        radius: 100,
    };

    let deadline = env.ledger().timestamp() + 86400;

    let mission_id = client.create_mission(
        &creator,
        &location,
        &1_000_000,
        &10,
        &deadline,
        &String::from_str(&env, "ipfs://QmTest123"),
        &2,
    );

    // Fund mission
    client.fund_mission(&mission_id, &creator, &10_000_000);

    // Claim mission
    let claim_id = client.claim_mission(
        &mission_id,
        &claimer,
        &String::from_str(&env, "ipfs://QmProof123"),
    );

    assert!(claim_id > 0);

    let mission = client.get_mission(&mission_id);
    assert_eq!(mission.current_claimers, 1);
}

#[test]
#[should_panic(expected = "Error(InvalidRewardAmount)")]
fn test_create_mission_invalid_reward() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MissionContract);
    let client = MissionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
        radius: 100,
    };

    let deadline = env.ledger().timestamp() + 86400;

    // Should panic with invalid reward
    client.create_mission(
        &creator,
        &location,
        &0, // Invalid reward amount
        &10,
        &deadline,
        &String::from_str(&env, "ipfs://QmTest123"),
        &2,
    );
}

#[test]
#[should_panic(expected = "Error(AlreadyClaimed)")]
fn test_double_claim() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, MissionContract);
    let client = MissionContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let claimer = Address::generate(&env);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
        radius: 100,
    };

    let deadline = env.ledger().timestamp() + 86400;

    let mission_id = client.create_mission(
        &creator,
        &location,
        &1_000_000,
        &10,
        &deadline,
        &String::from_str(&env, "ipfs://QmTest123"),
        &2,
    );

    client.fund_mission(&mission_id, &creator, &10_000_000);

    // First claim
    client.claim_mission(
        &mission_id,
        &claimer,
        &String::from_str(&env, "ipfs://QmProof1"),
    );

    // Second claim - should panic
    client.claim_mission(
        &mission_id,
        &claimer,
        &String::from_str(&env, "ipfs://QmProof2"),
    );
}
