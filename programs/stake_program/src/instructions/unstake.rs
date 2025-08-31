use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount, transfer, Transfer},
};

use crate::{
    constants::{CONFIG_SEED, POOL_SEED, STATE_SEED}, 
    errors::{ConfigError, StakingError}, 
    events::UnstakeEvent,
    state::{Config, StakingPool, UserState}, 
};

pub fn unstake_handler(ctx: Context<Unstake>) -> Result<()> {
    // --- Security checks ---
    require_eq!(ctx.accounts.config.version, 1, StakingError::VersionMismatch);
    require!(!ctx.accounts.config.paused, ConfigError::ContractPaused);
    // require!(!ctx.accounts.user_state.locked, StakingError::AlreadyProcessing);

    let now = Clock::get()?.unix_timestamp;
    let amount = ctx.accounts.user_state.amount;
    require!(amount > 0, StakingError::NothingToUnstake) ;

    // Lock while processing
    ctx.accounts.user_state.locked = true;

    let stake_duration = now - ctx.accounts.user_state.start_time;

    // --- Tax calculation ---
    let tax = if stake_duration >= ctx.accounts.config.min_stake_duration {
        0
    } else {
        (amount as u128)
            .checked_mul(ctx.accounts.config.tax_percentage as u128)
            .unwrap()
            .checked_div(100)
            .unwrap() as u64
    };

    let tax_to_pool = tax * 3 / 5;
    let tax_to_community = tax - tax_to_pool;
    let user_amount = amount
        .checked_sub(tax)
        .ok_or(StakingError::MathOverflow)?;

    // --- Vault balance check ---
    require!(
        ctx.accounts.pool_vault.amount >= amount,
        StakingError::VaultInsufficientBalance
    );

    // --- Update state ---
    ctx.accounts.pool.total_tax_collected = ctx
        .accounts
        .pool
        .total_tax_collected
        .checked_add(tax_to_pool)
        .ok_or(StakingError::MathOverflow)?;

    ctx.accounts.pool.total_staked = ctx
        .accounts
        .pool
        .total_staked
        .checked_sub(amount)
        .ok_or(StakingError::MathOverflow)?;

    ctx.accounts.user_state.amount = 0;
    ctx.accounts.user_state.start_time = 0;
    ctx.accounts.user_state.last_tax_snapshot = 0;

    // --- Transfers ---
    let signer_seeds: &[&[&[u8]]] = &[&[POOL_SEED, &[ctx.accounts.pool.bump]]]; // ✅ use pool as vault authority

    transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_vault.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        ),
        user_amount,
    )?;

    if tax_to_community > 0 {
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.community_ata.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                signer_seeds,
            ),
            tax_to_community,
        )?;
    }

    // --- Mark unlocked ---
    ctx.accounts.user_state.locked = false;

    // --- Emit event ---
    emit!(UnstakeEvent {
        user: ctx.accounts.user.key(),
        unstaked_amount: user_amount,
        tax,
        timestamp: now,
    });

    Ok(())
}


#[derive(Accounts)]
pub struct Unstake<'info> {
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

    /// User ATA (must hold at least `amount`)
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = user,
    )]
    pub to: Box<Account<'info, TokenAccount>>,

    /// Pool Vault ATA (owned by pool PDA)
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = pool
    )]
    pub pool_vault: Box<Account<'info, TokenAccount>>,
    /// Community wallet ATA to receive tax
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = community_wallet,
        constraint = community_ata.owner == community_wallet.key() @ StakingError::Unauthorized,
        constraint = community_ata.mint == config.token_mint @ StakingError::VaultMintMismatch,
    )]
    pub community_ata: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    /// the community wallet to receive tax (must be a valid wallet)
    #[account(
        mut,
        constraint = community_wallet.key() == config.community_wallet @ ConfigError::InvalidCommunityWallet
    )]
    pub community_wallet: AccountInfo<'info>,
    /// Programs
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
