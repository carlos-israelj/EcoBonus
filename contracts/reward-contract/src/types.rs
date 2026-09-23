use soroban_sdk::{contracttype, Address, String};

/// Reward pool managed by a sponsor
#[contracttype]
#[derive(Clone, Debug)]
pub struct RewardPool {
    pub sponsor: Address,
    pub total_funded: i128,      // Total XLM funded
    pub total_distributed: i128,  // Total XLM distributed
    pub available_balance: i128,  // Available XLM balance
    pub is_active: bool,
}

/// Status of a claim
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ClaimStatus {
    Pending,      // Waiting for validation
    Approved,     // Validated and paid
    Rejected,     // Rejected by validator
    Disputed,     // In manual review
}

/// Claim submitted by a user
#[contracttype]
#[derive(Clone, Debug)]
pub struct Claim {
    pub id: u64,
    pub mission_id: u64,
    pub claimer: Address,
    pub amount: i128,
    pub status: ClaimStatus,
    pub submitted_at: u64,
    pub proof_uri: String,         // IPFS hash with evidence
    pub validator: Option<Address>, // Who validated the claim
    pub validated_at: Option<u64>,
}

/// Validation result from AI oracle
#[contracttype]
#[derive(Clone, Debug)]
pub struct ValidationResult {
    pub valid: bool,
    pub category: String,
    pub confidence: u32,  // 0-100
    pub estimated_weight_kg: u32,
}
