use crate::{error::StakingError::*, state::*, helper::*};
use anchor_lang::prelude::*;

pub fn process_update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
    // Only current admin can update admin
    require_eq!(ctx.accounts.global_state.admin, ctx.accounts.admin.key(), Unauthorized);
    
    // Update the admin
    ctx.accounts.global_state.admin = new_admin;
    
    Ok(())
}

pub fn process_emergency_withdraw(ctx: Context<EmergencyWithdraw>, amount: u64) -> Result<()> {
    // Only admin can perform emergency withdraw
    require_eq!(ctx.accounts.global_state.admin, ctx.accounts.admin.key(), Unauthorized);
    
    // Transfer the specified amount from fee vault to admin
    let fee_vault_info = &mut ctx.accounts.fee_vault.to_account_info();
    let admin_info = &mut ctx.accounts.admin.to_account_info();
    
    transfer_sol_pda(fee_vault_info, admin_info, amount)?;
    
    Ok(())
}

pub fn process_update_fee_basis_points(ctx: Context<UpdateFeeBasisPoints>, new_fee_basis_points: u32) -> Result<()> {
    // Only admin can update fee basis points
    require_eq!(ctx.accounts.global_state.admin, ctx.accounts.admin.key(), Unauthorized);
    
    // Update the fee basis points
    ctx.accounts.global_state.update_fee_basis_points(new_fee_basis_points)?;
    
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
