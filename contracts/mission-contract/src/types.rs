use soroban_sdk::{contracttype, Address, String};

/// Mission status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MissionStatus {
    Pending,    // Created but not fully funded
    Active,     // Funded and accepting claims
    Completed,  // All claims slots filled
    Expired,    // Deadline passed
    Cancelled,  // Cancelled by creator/admin
}

/// GPS Location with radius
#[contracttype]
#[derive(Clone, Debug)]
pub struct Location {
    pub latitude: i64,   // Scaled by 1e6 for precision (e.g., -12.046374 * 1e6 = -12046374)
    pub longitude: i64,  // Scaled by 1e6
    pub radius: u32,     // Radius in meters for validation
}

/// Mission struct
#[contracttype]
#[derive(Clone, Debug)]
pub struct Mission {
    pub id: u64,
    pub creator: Address,
    pub location: Location,
    pub reward_amount: i128,      // Reward per claimer in USDC (scaled)
    pub status: MissionStatus,
    pub max_claimers: u32,        // Maximum number of people who can claim
    pub current_claimers: u32,    // Current number of claims
    pub evidence_required: u8,    // Number of photos required
    pub deadline: u64,            // Unix timestamp
    pub metadata_uri: String,     // IPFS URI with description, images, etc.
    pub funded_amount: i128,      // Total amount funded
}

/// Claim record (stored separately in RewardContract)
#[contracttype]
#[derive(Clone, Debug)]
pub struct ClaimRecord {
    pub mission_id: u64,
    pub claimer: Address,
    pub proof_uri: String,  // IPFS URI with evidence
    pub timestamp: u64,
}
