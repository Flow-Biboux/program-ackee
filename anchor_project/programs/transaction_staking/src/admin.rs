use crate::{error::StakingError::*, helper::*, state::*};
use anchor_lang::prelude::*;

pub fn process_update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
    ctx.accounts.global_state.admin = new_admin;

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateAdmin<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        constraint = admin.key() == global_state.admin @ Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn process_emergency_withdraw(ctx: Context<EmergencyWithdraw>, amount: u64) -> Result<()> {
    let fee_vault_info = &mut ctx.accounts.fee_vault.to_account_info();
    let admin_info = &mut ctx.accounts.admin.to_account_info();

    transfer_sol_pda(fee_vault_info, admin_info, amount)?;

    Ok(())
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        seeds = [GLOBAL_SEED.as_bytes()],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [FEE_VAULT_SEED.as_bytes()],
        bump = fee_vault.bump
    )]
    pub fee_vault: Account<'info, FeeVault>,
    #[account(
        mut,
        constraint = admin.key() == global_state.admin @ Unauthorized
    )]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_update_fee_basis_points(
    ctx: Context<UpdateFeeBasisPoints>,
    new_fee_basis_points: u32,
) -> Result<()> {
    ctx.accounts
        .global_state
        .update_fee_basis_points(new_fee_basis_points)?;

    Ok(())
}

#[derive(Accounts)]
pub struct UpdateFeeBasisPoints<'info> {
    #[account(
        mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump = global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        constraint = admin.key() == global_state.admin @ Unauthorized
    )]
    pub admin: Signer<'info>,
}
