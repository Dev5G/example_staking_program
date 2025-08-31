use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount}
};

use crate::{
    constants::{CONFIG_SEED, POOL_SEED, STATE_SEED}, errors::{ConfigError, StakingError}, events::StakeEvent, state::{Config, StakingPool, UserState}, utils::token_transfer 
};

pub fn stake_handler(ctx: Context<Stake>, amount: u64) -> Result<()> {
    // --- Security checks ---
    require!(!ctx.accounts.config.paused, ConfigError::ContractPaused);
    require!(amount > 0, StakingError::InvalidStakeAmount);

    // --- Transfer tokens into vault using utility ---
    token_transfer(
        &ctx.accounts.from,
        &ctx.accounts.pool_vault,
        &ctx.accounts.user, // authority = staker
        &ctx.accounts.token_program,
        amount,
    )?;

    // --- Update user + pool state ---
    let clock = Clock::get()?;
    if ctx.accounts.user_state.amount == 0 {
        ctx.accounts.user_state.locked = false; //  to prevent re-entrancy
        ctx.accounts.user_state.authority = ctx.accounts.user.key();
    }
    ctx.accounts.user_state.amount = ctx
        .accounts
        .user_state
        .amount
        .checked_add(amount)
        .ok_or(StakingError::MathOverflow)?;
    ctx.accounts.user_state.start_time = clock.unix_timestamp;
    ctx.accounts.user_state.last_tax_snapshot = ctx.accounts.pool.total_tax_collected;
    

    
    ctx.accounts.pool.total_staked = ctx
        .accounts
        .pool
        .total_staked
        .checked_add(amount)
        .ok_or(StakingError::MathOverflow)?;

    // --- Emit event ---
    emit!(StakeEvent {
        user: ctx.accounts.user.key(),
        amount,
        time: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
#[instruction( amount: u64)]
pub struct Stake<'info> {
    /// Global config PDA (program authority)
    #[account(
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Box<Account<'info, Config>>,

    /// Pool PDA
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump,
    )]
    pub pool: Box<Account<'info, StakingPool>>,

    /// User state PDA (tracks how much a user has staked)
    #[account(
        init_if_needed,
        payer = user,
        space = UserState::LEN,
        seeds = [STATE_SEED, user.key().as_ref(), config.key().as_ref()],
        bump,
    )]
    pub user_state: Box<Account<'info, UserState>>,

    /// The authority of this user state (must sign)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Source ATA (must hold at least `amount`)
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = user,
        constraint = from.amount >= amount @ StakingError::InsufficientFundsInWallet,
    )]
    pub from: Box<Account<'info, TokenAccount>>,

    /// Pool Vault ATA (owned by pool PDA)
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = pool
    )]
    pub pool_vault: Box<Account<'info, TokenAccount>>,

    /// Programs
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
