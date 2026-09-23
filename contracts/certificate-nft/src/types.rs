use soroban_sdk::{contracttype, Address, String};

/// Category of waste collected
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum WasteCategory {
    Plastic,
    Glass,
    Paper,
    Metal,
    Organic,
    Electronic,
    Mixed,
}

/// GPS Location
#[contracttype]
#[derive(Clone, Debug)]
pub struct Location {
    pub latitude: i64,   // Scaled by 1e6
    pub longitude: i64,  // Scaled by 1e6
}

/// Impact Certificate NFT
#[contracttype]
#[derive(Clone, Debug)]
pub struct ImpactCertificate {
    pub token_id: u64,
    pub owner: Address,
    pub mission_id: u64,
    pub claim_id: u64,
    pub location: Location,
    pub timestamp: u64,
    pub weight_kg: u32,           // Estimated weight in kg
    pub category: WasteCategory,
    pub proof_uri: String,        // IPFS hash with evidence
    pub carbon_offset: u32,       // CO2 equivalent in grams
}

/// NFT Metadata (for marketplaces)
#[contracttype]
#[derive(Clone, Debug)]
pub struct NFTMetadata {
    pub name: String,
    pub description: String,
    pub image: String,  // IPFS URI
    pub attributes: String, // JSON string of attributes
}

/// Listing for B2B marketplace
#[contracttype]
#[derive(Clone, Debug)]
pub struct Listing {
    pub token_id: u64,
    pub seller: Address,
    pub price: i128,
    pub is_active: bool,
    pub created_at: u64,
}
