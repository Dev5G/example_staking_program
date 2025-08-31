use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, TokenAccount, Token}
};

use crate::{
    state::{Config, StakingPool},
    events::InitializedEvent,
    constants::{CONFIG_SEED, POOL_SEED},
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        seeds = [CONFIG_SEED],
        bump,
        payer = payer,
        space = Config::LEN
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        init,
        seeds = [POOL_SEED],
        bump,
        payer = payer,
        space = StakingPool::LEN
    )]
    pub pool: Box<Account<'info, StakingPool>>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = pool, // PDA authority for vault
    )]
    pub pool_vault: Box<Account<'info, TokenAccount>>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = config, // PDA authority for vault
    )]
    pub reward_vault: Box<Account<'info, TokenAccount>>,
    /// Pays rent + allocation fees
    #[account(mut)]
    pub payer: Signer<'info>,

    /// SPL token mint being staked
    #[account(mut)]
    pub token_mint: Box<Account<'info, Mint>>,

    /// Admin authority (separate from payer)
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<Initialize>, community_wallet: Pubkey) -> Result<()> {
    
    ctx.accounts.config.version = 1;
    ctx.accounts.config.authority = ctx.accounts.authority.key();
    ctx.accounts.config.paused = false;
    ctx.accounts.config.community_wallet = community_wallet;
    ctx.accounts.config.token_mint = ctx.accounts.token_mint.key();
    ctx.accounts.config.tax_percentage = 5;
    ctx.accounts.config.min_stake_duration = 90 * 86400;
    ctx.accounts.config.bump = ctx.bumps.config;

    ctx.accounts.pool.total_tax_collected = 0;
    ctx.accounts.pool.total_staked = 0;
    ctx.accounts.pool.total_rewards_distributed = 0;
    ctx.accounts.pool.bump = ctx.bumps.pool;

    emit!(InitializedEvent {
        authority: ctx.accounts.authority.key(),
        mint: ctx.accounts.token_mint.key(),
        community_wallet,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
