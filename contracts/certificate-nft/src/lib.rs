#![no_std]

mod types;
mod storage;
mod error;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};
use types::{ImpactCertificate, Location, WasteCategory, Listing};
use error::Error;

#[contract]
pub struct CertificateNFT;

#[contractimpl]
impl CertificateNFT {
    /// Initialize the contract
    pub fn initialize(env: Env, admin: Address) {
        storage::set_admin(&env, &admin);
    }

    /// Mint a new impact certificate NFT
    pub fn mint_certificate(
        env: Env,
        minter: Address,
        owner: Address,
        mission_id: u64,
        claim_id: u64,
        location: Location,
        weight_kg: u32,
        category: WasteCategory,
        proof_uri: String,
        carbon_offset: u32,
    ) -> Result<u64, Error> {
        minter.require_auth();

        // Only admin or authorized minters can mint
        let admin = storage::get_admin(&env);
        if minter != admin && !storage::is_minter(&env, &minter) {
            return Err(Error::NotMinter);
        }

        let token_id = storage::next_token_id(&env);

        let certificate = ImpactCertificate {
            token_id,
            owner: owner.clone(),
            mission_id,
            claim_id,
            location,
            timestamp: env.ledger().timestamp(),
            weight_kg,
            category,
            proof_uri,
            carbon_offset,
        };

        storage::set_certificate(&env, token_id, &certificate);
        storage::set_owner(&env, token_id, &owner);
        storage::add_owner_token(&env, &owner, token_id);

        Ok(token_id)
    }

    /// Transfer certificate to another address
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        token_id: u64,
    ) -> Result<(), Error> {
        from.require_auth();

        if from == to {
            return Err(Error::TransferToSelf);
        }

        let current_owner = storage::get_owner(&env, token_id)?;
        if current_owner != from {
            return Err(Error::NotTokenOwner);
        }

        // Check if token is listed for sale
        if storage::has_listing(&env, token_id) {
            return Err(Error::CannotBurnListed);
        }

        // Update owner
        storage::set_owner(&env, token_id, &to);
        storage::remove_owner_token(&env, &from, token_id);
        storage::add_owner_token(&env, &to, token_id);

        // Update certificate owner
        let mut certificate = storage::get_certificate(&env, token_id)?;
        certificate.owner = to;
        storage::set_certificate(&env, token_id, &certificate);

        Ok(())
    }

    /// Burn a certificate (for corporate carbon offset)
    pub fn burn(
        env: Env,
        owner: Address,
        token_id: u64,
    ) -> Result<(), Error> {
        owner.require_auth();

        let current_owner = storage::get_owner(&env, token_id)?;
        if current_owner != owner {
            return Err(Error::NotTokenOwner);
        }

        // Check if token is listed
        if storage::has_listing(&env, token_id) {
            return Err(Error::CannotBurnListed);
        }

        // Remove token
        storage::remove_certificate(&env, token_id);
        storage::remove_owner_token(&env, &owner, token_id);

        // Increment burned counter for stats
        storage::increment_burned_count(&env);

        Ok(())
    }

    /// List certificate for sale in B2B marketplace
    pub fn list_for_sale(
        env: Env,
        owner: Address,
        token_id: u64,
        price: i128,
    ) -> Result<(), Error> {
        owner.require_auth();

        if price <= 0 {
            return Err(Error::InvalidPrice);
        }

        let current_owner = storage::get_owner(&env, token_id)?;
        if current_owner != owner {
            return Err(Error::NotTokenOwner);
        }

        let listing = Listing {
            token_id,
            seller: owner,
            price,
            is_active: true,
            created_at: env.ledger().timestamp(),
        };

        storage::set_listing(&env, token_id, &listing);

        Ok(())
    }

    /// Cancel a listing
    pub fn cancel_listing(
        env: Env,
        owner: Address,
        token_id: u64,
    ) -> Result<(), Error> {
        owner.require_auth();

        let mut listing = storage::get_listing(&env, token_id)?;

        if listing.seller != owner {
            return Err(Error::Unauthorized);
        }

        listing.is_active = false;
        storage::set_listing(&env, token_id, &listing);

        Ok(())
    }

    /// Buy a listed certificate (B2B marketplace)
    pub fn buy_certificate(
        env: Env,
        buyer: Address,
        token_id: u64,
        token_address: Address,
    ) -> Result<(), Error> {
        buyer.require_auth();

        let listing = storage::get_listing(&env, token_id)?;

        if !listing.is_active {
            return Err(Error::ListingNotActive);
        }

        if buyer == listing.seller {
            return Err(Error::CannotBuyOwnListing);
        }

        // Transfer payment to seller
        let client = token::Client::new(&env, &token_address);
        client.transfer(&buyer, &listing.seller, &listing.price);

        // Transfer NFT to buyer
        storage::set_owner(&env, token_id, &buyer);
        storage::remove_owner_token(&env, &listing.seller, token_id);
        storage::add_owner_token(&env, &buyer, token_id);

        // Update certificate
        let mut certificate = storage::get_certificate(&env, token_id)?;
        certificate.owner = buyer;
        storage::set_certificate(&env, token_id, &certificate);

        // Deactivate listing
        let mut updated_listing = listing;
        updated_listing.is_active = false;
        storage::set_listing(&env, token_id, &updated_listing);

        Ok(())
    }

    /// Add authorized minter (admin only)
    pub fn add_minter(
        env: Env,
        admin: Address,
        minter: Address,
    ) -> Result<(), Error> {
        admin.require_auth();

        let stored_admin = storage::get_admin(&env);
        if admin != stored_admin {
            return Err(Error::NotAdmin);
        }

        storage::add_minter(&env, &minter);
        Ok(())
    }

    /// Get certificate details
    pub fn get_certificate(env: Env, token_id: u64) -> Result<ImpactCertificate, Error> {
        storage::get_certificate(&env, token_id)
    }

    /// Get owner of a token
    pub fn get_owner(env: Env, token_id: u64) -> Result<Address, Error> {
        storage::get_owner(&env, token_id)
    }

    /// Get all tokens owned by an address
    pub fn get_user_certificates(env: Env, user: Address) -> Vec<u64> {
        storage::get_owner_tokens(&env, &user)
    }

    /// Get listing details
    pub fn get_listing(env: Env, token_id: u64) -> Result<Listing, Error> {
        storage::get_listing(&env, token_id)
    }

    /// Get total minted
    pub fn get_total_minted(env: Env) -> u64 {
        storage::get_token_count(&env)
    }

    /// Get total burned
    pub fn get_total_burned(env: Env) -> u64 {
        storage::get_burned_count(&env)
    }

    /// Get total impact stats for a user
    pub fn get_user_impact(env: Env, user: Address) -> (u32, u32) {
        let tokens = storage::get_owner_tokens(&env, &user);
        let mut total_weight = 0u32;
        let mut total_carbon_offset = 0u32;

        for token_id in tokens.iter() {
            if let Ok(cert) = storage::get_certificate(&env, token_id) {
                total_weight += cert.weight_kg;
                total_carbon_offset += cert.carbon_offset;
            }
        }

        (total_weight, total_carbon_offset)
    }
}
