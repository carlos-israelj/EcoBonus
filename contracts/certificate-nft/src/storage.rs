use soroban_sdk::{symbol_short, Address, Env, Vec};
use crate::types::{ImpactCertificate, Listing};
use crate::error::Error;

pub fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get(&symbol_short!("admin"))
        .unwrap()
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage()
        .instance()
        .set(&symbol_short!("admin"), admin);
}

pub fn next_token_id(env: &Env) -> u64 {
    let key = symbol_short!("tkn_cnt");
    let current: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(current + 1));
    current + 1
}

pub fn get_token_count(env: &Env) -> u64 {
    let key = symbol_short!("tkn_cnt");
    env.storage().instance().get(&key).unwrap_or(0)
}

pub fn get_burned_count(env: &Env) -> u64 {
    let key = symbol_short!("burned");
    env.storage().instance().get(&key).unwrap_or(0)
}

pub fn increment_burned_count(env: &Env) {
    let key = symbol_short!("burned");
    let current: u64 = env.storage().instance().get(&key).unwrap_or(0);
    env.storage().instance().set(&key, &(current + 1));
}

pub fn get_certificate(env: &Env, token_id: u64) -> Result<ImpactCertificate, Error> {
    let key = (symbol_short!("cert"), token_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::TokenNotFound)
}

pub fn set_certificate(env: &Env, token_id: u64, certificate: &ImpactCertificate) {
    let key = (symbol_short!("cert"), token_id);
    env.storage().persistent().set(&key, certificate);
}

pub fn remove_certificate(env: &Env, token_id: u64) {
    let key = (symbol_short!("cert"), token_id);
    env.storage().persistent().remove(&key);
}

pub fn get_owner(env: &Env, token_id: u64) -> Result<Address, Error> {
    let key = (symbol_short!("owner"), token_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::TokenNotFound)
}

pub fn set_owner(env: &Env, token_id: u64, owner: &Address) {
    let key = (symbol_short!("owner"), token_id);
    env.storage().persistent().set(&key, owner);
}

pub fn add_owner_token(env: &Env, owner: &Address, token_id: u64) {
    let key = (symbol_short!("own_tkns"), owner.clone());
    let mut tokens: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    tokens.push_back(token_id);
    env.storage().persistent().set(&key, &tokens);
}

pub fn remove_owner_token(env: &Env, owner: &Address, token_id: u64) {
    let key = (symbol_short!("own_tkns"), owner.clone());
    let tokens: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
    let mut new_tokens = Vec::new(env);

    for t in tokens.iter() {
        if t != token_id {
            new_tokens.push_back(t);
        }
    }

    env.storage().persistent().set(&key, &new_tokens);
}

pub fn get_owner_tokens(env: &Env, owner: &Address) -> Vec<u64> {
    let key = (symbol_short!("own_tkns"), owner.clone());
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or(Vec::new(env))
}

pub fn get_listing(env: &Env, token_id: u64) -> Result<Listing, Error> {
    let key = (symbol_short!("listing"), token_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::ListingNotFound)
}

pub fn set_listing(env: &Env, token_id: u64, listing: &Listing) {
    let key = (symbol_short!("listing"), token_id);
    env.storage().persistent().set(&key, listing);
}

pub fn has_listing(env: &Env, token_id: u64) -> bool {
    let key = (symbol_short!("listing"), token_id);
    if let Some(listing) = env.storage().persistent().get::<_, Listing>(&key) {
        listing.is_active
    } else {
        false
    }
}

pub fn add_minter(env: &Env, minter: &Address) {
    let key = symbol_short!("minters");
    let mut minters: Vec<Address> = env.storage().instance().get(&key).unwrap_or(Vec::new(env));

    for m in minters.iter() {
        if m == *minter {
            return;
        }
    }

    minters.push_back(minter.clone());
    env.storage().instance().set(&key, &minters);
}

pub fn is_minter(env: &Env, address: &Address) -> bool {
    let key = symbol_short!("minters");
    let minters: Vec<Address> = env.storage().instance().get(&key).unwrap_or(Vec::new(env));

    for m in minters.iter() {
        if m == *address {
            return true;
        }
    }

    false
}
