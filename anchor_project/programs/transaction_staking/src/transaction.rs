use crate::{constant::*, error::StakingError::*, helper::*, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub to: SystemAccount<'info>,
    #[account(mut,
        seeds = [FEE_VAULT_SEED.as_bytes()],
        bump = fee_vault.bump
    )]
    pub fee_vault: Account<'info, FeeVault>,
    #[account(mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    pub system_program: Program<'info, System>,
}

pub fn process_transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
    let from = &mut ctx.accounts.from.to_account_info();
    let to = &mut ctx.accounts.to.to_account_info();
    let fee_vault = &mut ctx.accounts.fee_vault.to_account_info();
    let global = &mut ctx.accounts.global_state;

    transfer_sol(from, to, amount)?;
    global.pay_fees(amount, from, fee_vault)?;

    Ok(())
}
