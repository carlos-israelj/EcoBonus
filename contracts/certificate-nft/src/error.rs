use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    // NFT errors
    TokenNotFound = 1,
    TokenAlreadyMinted = 2,
    NotTokenOwner = 3,

    // Transfer errors
    TransferToSelf = 10,
    InvalidRecipient = 11,

    // Marketplace errors
    ListingNotFound = 20,
    ListingNotActive = 21,
    InvalidPrice = 22,
    CannotBuyOwnListing = 23,

    // Authorization errors
    Unauthorized = 30,
    NotAdmin = 31,
    NotMinter = 32,

    // Burn errors
    CannotBurnListed = 40,
    InvalidTokenId = 41,
}
