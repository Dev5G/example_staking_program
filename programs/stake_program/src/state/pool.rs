use anchor_lang::prelude::*;

#[account]
pub struct StakingPool {
    pub total_tax_collected: u64,
    pub total_rewards_distributed: u64,
    pub total_staked: u64,
    pub bump: u8,
}

impl StakingPool {
    pub const LEN: usize = 8
        + 8   // total_tax_collected
        + 8   // total_rewards_distributed
        + 8   // total_staked
        + 1;  // bump
}
