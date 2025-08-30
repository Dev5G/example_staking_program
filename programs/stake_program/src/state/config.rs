use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub community_wallet: Pubkey,
    pub token_mint: Pubkey,
    pub tax_percentage: u8,
    pub min_stake_duration: i64,
    pub bump: u8,
    pub paused: bool,
    pub authority: Pubkey,
    pub version: u8, 
}

impl Config {
    pub const LEN: usize = 8   // discriminator
        + 32 // community_wallet
        + 32 // token_mint
        + 1  // tax_percentage
        + 8  // min_stake_duration
        + 1  // bump
        + 1  // paused
        + 32 // authority
        + 1; // version
}