use anchor_lang::prelude::*;
use crate::{
    state::Config,
    events::PausedEvent,
    constants::CONFIG_SEED,
    errors::AuthError, 
};

#[derive(Accounts)]
pub struct SetPause<'info> {
    /// Global config/state PDA
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ AuthError::Unauthorized
    )]
    pub config: Account<'info, Config>,
    /// Authority allowed to pause/unpause
    #[account()]
    pub authority: Signer<'info>,
}

impl<'info> SetPause<'info> {
    pub fn set_pause(&mut self, paused: bool) -> Result<()> {
        // Update pause state
        self.config.paused = paused;

        // Emit event
        emit!(PausedEvent {
            authority: self.authority.key(),
            paused,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}
