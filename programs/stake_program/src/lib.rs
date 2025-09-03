use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;
pub mod events;
pub mod constants;
pub mod utils;

use instructions::*;

declare_id!("79Wno3MHuSPo9dWQSDdXK1woSPx8ndHhqRmbpfCvhvdp");

#[cfg(not(feature = "no-entrypoint"))]
use {solana_security_txt::security_txt};

#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "Bawls Staking Program",
    project_url: "https://bawlsonu.life",
    contacts: "Discord:@0x_skuld,X: @0x_skuld, Tg: @SkuldHub",
    // policy: "https://myproject.com/security-policy",

    // Optional Fields
    // preferred_languages: "en,de",
    // source_code: "https://github.com/solana-developers/solana-game-preset",
    // source_revision: "5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r",
    // source_release: "",
    // encryption: "",
    // auditors: "Verifier pubkey: 5vJwnLeyjV8uNJSp1zn7VLW8GwiQbcsQbGaVSwRmkE4r",
    acknowledgements: "Thank you to our bug bounty hunters and Shahid H. (Discord:@0x_skuld for developing the contract"
}

#[program]
pub mod stake_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, community_wallet: Pubkey) -> Result<()> {
        instructions::initialize::handler(ctx, community_wallet)
    }

    pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
    ctx.accounts.set_pause(paused)
    }

    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        instructions::stake::stake_handler(ctx, amount)
    }

    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        instructions::unstake::unstake_handler(ctx)
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        instructions::rewards::claim_handler(ctx)
    }

    pub fn add_rewards(ctx: Context<AddRewards>, amount: u64) -> Result<()> {
        instructions::rewards::add_rewards_handler(ctx, amount)
    }
}
