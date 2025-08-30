use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;
pub mod events;
pub mod constants;
pub mod utils;

use instructions::*;

declare_id!("76hLS4VrVptrteJAK1imstSGQt5kzinqt33GVoiSZPB2");

#[program]
pub mod stake_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, community_wallet: Pubkey) -> Result<()> {
        instructions::initialize::handler(ctx, community_wallet)
    }

    pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
    ctx.accounts.set_pause(paused)
    }

    // pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    //     instructions::stake::handler(ctx, amount)
    // }

    // pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
    //     instructions::unstake::handler(ctx)
    // }

    // pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    //     instructions::claim_rewards::handler(ctx)
    // }

}
