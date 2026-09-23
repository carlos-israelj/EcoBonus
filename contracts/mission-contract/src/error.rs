use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Mission errors
    MissionNotFound = 1,
    MissionNotPending = 2,
    MissionNotActive = 3,
    MissionExpired = 4,
    MissionFull = 5,
    MissionAlreadyFunded = 6,
    CannotCancel = 7,

    // Validation errors
    InvalidRewardAmount = 10,
    InvalidMaxClaimers = 11,
    InvalidDeadline = 12,
    InvalidLocation = 13,

    // Claim errors
    AlreadyClaimed = 20,
    ClaimNotFound = 21,

    // Authorization errors
    Unauthorized = 30,
    NotAdmin = 31,
    NotCreator = 32,

    // General errors
    InsufficientFunds = 40,
    InvalidProof = 41,
}
