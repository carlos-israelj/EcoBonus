// Token client wrapper for USDC transfers
// This module provides utility functions for interacting with Stellar token contracts

use soroban_sdk::{Address, Env};

/// Get token balance for an address
pub fn get_balance(env: &Env, token_address: &Address, address: &Address) -> i128 {
    let client = soroban_sdk::token::Client::new(env, token_address);
    client.balance(address)
}

/// Check if contract has approval to spend tokens
pub fn get_allowance(
    env: &Env,
    token_address: &Address,
    from: &Address,
    spender: &Address,
) -> i128 {
    let client = soroban_sdk::token::Client::new(env, token_address);
    client.allowance(from, spender)
}
