use anchor_lang::prelude::*;

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
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Incompatible config version.")]
    VersionMismatch,
    #[msg("Math overflow or conversion failed.")]
    MathOverflow,
}

#[error_code]
pub enum PoolError {
    #[msg("Pool is already initialized.")]
    AlreadyInitialized,
    #[msg("Pool is not initialized.")]
    NotInitialized,
    #[msg("Invalid pool state.")]
    InvalidPoolState,
    #[msg("Pool has reached its maximum capacity.")]
    PoolFull,
    #[msg("Pool is empty.")]
    PoolEmpty,
}

#[error_code]
pub enum ConfigError {
    #[msg("The contract is currently paused.")]
    ContractPaused,
    #[msg("Config is already initialized.")]
    AlreadyInitialized,
    #[msg("Config is not initialized.")]
    NotInitialized,
    #[msg("Invalid config state.")]
    InvalidConfigState,
    #[msg("Invalid community wallet address.")]
    InvalidCommunityWallet,
}
#[error_code]
pub enum AuthError {
    #[msg("Unauthorized: Only the authority can perform this action.")]
    Unauthorized,
    #[msg("Incompatible config version.")]
    VersionMismatch,
}

