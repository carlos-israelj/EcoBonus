#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _},
    Address, Env, String,
};
use types::{Location, WasteCategory};

#[test]
fn test_mint_certificate() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let contract_id = env.register_contract(None, CertificateNFT);
    let client = CertificateNFTClient::new(&env, &contract_id);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
    };

    let token_id = client.mint_certificate(
        &admin,
        &owner,
        &1,  // mission_id
        &1,  // claim_id
        &location,
        &5,  // 5 kg
        &WasteCategory::Plastic,
        &String::from_str(&env, "ipfs://QmProof123"),
        &100, // 100g CO2 offset
    );

    assert_eq!(token_id, 1);

    let cert = client.get_certificate(&token_id);
    assert_eq!(cert.owner, owner);
    assert_eq!(cert.mission_id, 1);
    assert_eq!(cert.weight_kg, 5);
    assert_eq!(cert.carbon_offset, 100);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);

    let contract_id = env.register_contract(None, CertificateNFT);
    let client = CertificateNFTClient::new(&env, &contract_id);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
    };

    let token_id = client.mint_certificate(
        &admin,
        &owner1,
        &1,
        &1,
        &location,
        &5,
        &WasteCategory::Plastic,
        &String::from_str(&env, "ipfs://QmProof123"),
        &100,
    );

    // Transfer to owner2
    client.transfer(&owner1, &owner2, &token_id);

    let new_owner = client.get_owner(&token_id);
    assert_eq!(new_owner, owner2);

    let cert = client.get_certificate(&token_id);
    assert_eq!(cert.owner, owner2);
}

#[test]
fn test_list_and_buy() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Create mock token for payment
    let token_address = env.register_stellar_asset_contract(admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    token_client.mint(&buyer, &1_000_000);

    let contract_id = env.register_contract(None, CertificateNFT);
    let client = CertificateNFTClient::new(&env, &contract_id);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
    };

    let token_id = client.mint_certificate(
        &admin,
        &seller,
        &1,
        &1,
        &location,
        &5,
        &WasteCategory::Plastic,
        &String::from_str(&env, "ipfs://QmProof123"),
        &100,
    );

    // List for sale
    client.list_for_sale(&seller, &token_id, &500_000);

    let listing = client.get_listing(&token_id);
    assert_eq!(listing.price, 500_000);
    assert!(listing.is_active);

    // Buy
    client.buy_certificate(&buyer, &token_id, &token_address);

    let new_owner = client.get_owner(&token_id);
    assert_eq!(new_owner, buyer);

    let updated_listing = client.get_listing(&token_id);
    assert!(!updated_listing.is_active);
}

#[test]
fn test_burn() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let contract_id = env.register_contract(None, CertificateNFT);
    let client = CertificateNFTClient::new(&env, &contract_id);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
    };

    let token_id = client.mint_certificate(
        &admin,
        &owner,
        &1,
        &1,
        &location,
        &5,
        &WasteCategory::Plastic,
        &String::from_str(&env, "ipfs://QmProof123"),
        &100,
    );

    assert_eq!(client.get_total_burned(), 0);

    // Burn
    client.burn(&owner, &token_id);

    assert_eq!(client.get_total_burned(), 1);
}

#[test]
fn test_user_impact() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);

    let contract_id = env.register_contract(None, CertificateNFT);
    let client = CertificateNFTClient::new(&env, &contract_id);

    client.initialize(&admin);

    let location = Location {
        latitude: -12046374,
        longitude: -77042793,
    };

    // Mint 3 certificates
    client.mint_certificate(
        &admin,
        &owner,
        &1,
        &1,
        &location.clone(),
        &5,  // 5 kg
        &WasteCategory::Plastic,
        &String::from_str(&env, "ipfs://QmProof1"),
        &100, // 100g CO2
    );

    client.mint_certificate(
        &admin,
        &owner,
        &2,
        &2,
        &location.clone(),
        &3,  // 3 kg
        &WasteCategory::Glass,
        &String::from_str(&env, "ipfs://QmProof2"),
        &50, // 50g CO2
    );

    client.mint_certificate(
        &admin,
        &owner,
        &3,
        &3,
        &location,
        &7,  // 7 kg
        &WasteCategory::Paper,
        &String::from_str(&env, "ipfs://QmProof3"),
        &150, // 150g CO2
    );

    let (total_weight, total_carbon) = client.get_user_impact(&owner);
    assert_eq!(total_weight, 15);  // 5 + 3 + 7
    assert_eq!(total_carbon, 300); // 100 + 50 + 150
}
