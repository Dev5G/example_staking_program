use anchor_lang::prelude::*;

#[account]
pub struct UserState {
    pub amount: u64,
    pub start_time: i64,
    pub authority: Pubkey,
    pub last_tax_snapshot: u64,
    pub locked: bool, 
}

impl UserState {
    pub const LEN: usize = 8   // discriminator
        + 8   // amount
        + 8   // start_time
        + 32  // authority
        + 8   // last_tax_snapshot
        + 1;  // locked
}
