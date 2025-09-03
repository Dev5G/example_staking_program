use anchor_lang::prelude::*;

#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub time: i64,
}

#[event]
pub struct UnstakeEvent {
    pub user: Pubkey,
    pub unstaked_amount: u64,
    pub tax: u64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimRewardsEvent {
    pub user: Pubkey,
    pub reward: u64,
    pub timestamp: i64,
}

#[event]
pub struct ConfigUpdatedEvent {
    pub authority: Pubkey,
    pub new_community_wallet: Pubkey,
    pub new_tax_percentage: u8,
    pub new_min_stake_duration: i64,
}

#[event]
pub struct PausedEvent {
    pub authority: Pubkey,
    pub paused: bool,
    pub timestamp: i64,
}

#[event]
pub struct InitializedEvent {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub community_wallet: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ManualRewardAddedEvent {
    pub authority: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
