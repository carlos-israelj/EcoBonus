use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // Pool errors
    PoolNotFound = 1,
    PoolAlreadyExists = 2,
    PoolInactive = 3,
    InsufficientPoolBalance = 4,

    // Claim errors
    ClaimNotFound = 10,
    ClaimAlreadyProcessed = 11,
    ClaimExpired = 12,
    InvalidProofUri = 13,

    // Validation errors
    InvalidAmount = 20,
    InvalidValidator = 21,
    ClaimNotPending = 22,

    // Authorization errors
    Unauthorized = 30,
    NotSponsor = 31,
    NotValidator = 32,

    // Token errors
    TokenTransferFailed = 40,
    InvalidTokenAddress = 41,
}
