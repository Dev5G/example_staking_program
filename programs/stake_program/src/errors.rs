use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
}


#[error_code]
pub enum StakingError {
    #[msg("Nothing to unstake.")]
    NothingToUnstake,
    #[msg("Nothing to claim.")]
    NothingToClaim,
    #[msg("Insufficient funds in pool.")]
    InsufficientFundsInPool,
    #[msg("Invalid stake amount.")]
    InvalidStakeAmount,
    #[msg("Vault has insufficient funds.")]
    VaultInsufficientBalance,
    #[msg("Vault ATA is not owned by config PDA.")]
    VaultOwnershipMismatch,
    #[msg("Action already in progress. Try again.")]
    AlreadyProcessing,
    #[msg("The contract is currently paused.")]
    ContractPaused,
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Incompatible config version.")]
    VersionMismatch,
    #[msg("Math overflow or conversion failed.")]
    MathOverflow,
}