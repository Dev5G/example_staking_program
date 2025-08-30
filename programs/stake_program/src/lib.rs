use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, Transfer, Mint, TokenAccount};
// use anchor_spl::associated_token::{AssociatedToken, get_associated_token_address, Create, create};

pub mod instructions;
pub mod state;
pub mod errors;
pub mod events;
pub mod constants;
// pub mod contexts;

use instructions::*;
// use state::*;
// use errors::*;
// use events::*;
// use constants::*;

declare_id!("76hLS4VrVptrteJAK1imstSGQt5kzinqt33GVoiSZPB2");

#[program]
pub mod stake_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, community_wallet: Pubkey) -> Result<()> {
        instructions::initialize::handler(ctx, community_wallet)
    }

    // pub fn create_vault(ctx: Context<CreateVault>) -> Result<()> {
    //     instructions::create_vault::handler(ctx)
    // }

    // pub fn initialize_user_state(ctx: Context<InitializeUserState>) -> Result<()> {
    //     instructions::initialize_user_state::handler(ctx)
    // }

    // pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
    //     instructions::stake::handler(ctx, amount)
    // }

    // pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
    //     instructions::unstake::handler(ctx)
    // }

    // pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    //     instructions::claim_rewards::handler(ctx)
    // }

    // pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
    //     instructions::set_paused::handler(ctx, paused)
    // }
}
