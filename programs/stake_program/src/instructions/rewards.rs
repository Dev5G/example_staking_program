use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount, transfer, Transfer},
};

use crate::{
    constants::{CONFIG_SEED, POOL_SEED, STATE_SEED}, 
    errors::{ConfigError, StakingError, PoolError}, 
    events::{ClaimRewardsEvent, ManualRewardAddedEvent},
    state::{Config, StakingPool, UserState}, 
};
pub fn claim_handler(ctx: Context<ClaimRewards>) -> Result<()> {
    require_eq!(ctx.accounts.config.version, 1, StakingError::VersionMismatch);
    require!(!ctx.accounts.config.paused, ConfigError::ContractPaused);
    require!(!ctx.accounts.user_state.locked, StakingError::AlreadyProcessing);

    // Lock user state while processing
    ctx.accounts.user_state.locked = true;

    // Wrap in a scoped block to ensure unlock even on failure
    let result: Result<()> = (|| {
        let user_stake = ctx.accounts.user_state.amount;
        let total_staked = ctx.accounts.pool.total_staked;
        require!(user_stake > 0 && total_staked > 0, StakingError::NothingToClaim);

        let new_rewards = ctx.accounts.pool.total_tax_collected
            .checked_sub(ctx.accounts.user_state.last_tax_snapshot)
            .ok_or(StakingError::MathOverflow)?;
        require!(new_rewards > 0, StakingError::InsufficientFundsInPool);

        let user_reward_u128 = (user_stake as u128)
            .checked_mul(new_rewards as u128)
            .and_then(|v| v.checked_div(total_staked as u128))
            .ok_or(StakingError::MathOverflow)?;

        let user_reward = u64::try_from(user_reward_u128)
            .map_err(|_| StakingError::MathOverflow)?;
        require!(user_reward > 0, StakingError::InsufficientFundsInPool);

        let available = ctx.accounts.pool_vault.amount;
        let claimable = user_reward.min(available);

        // Update pool + user snapshot
        ctx.accounts.pool.total_rewards_distributed = ctx
            .accounts
            .pool
            .total_rewards_distributed
            .checked_add(claimable)
            .ok_or(StakingError::MathOverflow)?;
        ctx.accounts.user_state.last_tax_snapshot = ctx.accounts.pool.total_tax_collected;

        // Transfer rewards
        let signer_seeds: &[&[u8]] = &[POOL_SEED, &[ctx.accounts.pool.bump]];
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.pool_vault.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.pool.to_account_info(),
                },
                &[signer_seeds],
            ),
            claimable,
        )?;

        emit!(ClaimRewardsEvent {
            user: ctx.accounts.user.key(),
            reward: claimable,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    })();

    // Always unlock, even on error
    ctx.accounts.user_state.locked = false;
    result
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
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
    
    /// Programs
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}


pub fn add_rewards_handler(ctx: Context<AddRewards>, amount: u64) -> Result<()> {
    require!(amount > 0, PoolError::InvalidPoolRewardAmountAdded);

    // Transfer from reward authority -> pool vault
    transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    // Increase the reward distribution pool
    ctx.accounts.pool.total_tax_collected = ctx
        .accounts
        .pool
        .total_tax_collected
        .checked_add(amount)
        .ok_or(StakingError::MathOverflow)?;

    emit!(ManualRewardAddedEvent {
        authority: ctx.accounts.authority.key(),
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct AddRewards<'info> {
    /// Global config
    #[account(seeds = [CONFIG_SEED], bump)]
    pub config: Box<Account<'info, Config>>,

    /// Pool PDA
    #[account(mut, seeds = [POOL_SEED], bump)]
    pub pool: Box<Account<'info, StakingPool>>,

    /// Authority (must match config.authority)
    #[account(
        mut,
        constraint = authority.key() == config.authority @ StakingError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// From ATA (authority’s token account)
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = authority,
    )]
    pub from: Box<Account<'info, TokenAccount>>,

    /// Pool vault
    #[account(
        mut,
        associated_token::mint = config.token_mint,
        associated_token::authority = pool,
    )]
    pub pool_vault: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
