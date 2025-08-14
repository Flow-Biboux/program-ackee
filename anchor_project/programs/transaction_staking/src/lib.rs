use anchor_lang::prelude::*;

pub mod admin;
pub mod error;
pub mod helper;
pub mod initialize;
pub mod staking;
pub mod state;
pub mod transaction;

pub use crate::{admin::*, initialize::*, staking::*, state::*, transaction::*};

declare_id!("9eXsPTK6DZ38uFnTuVaWNkmNgmCnWrZb9k64jwJdEzsv");

#[program]
pub mod transaction_staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_basis_points: Option<u32>) -> Result<()> {
        msg!(
            "Initializing staking program. Admin: {:?}, Fee Vault: {:?}, Fee Basis Points: {:?}",
            ctx.accounts.admin.key(),
            ctx.accounts.fee_vault.key(),
            fee_basis_points
        );
        process_initialize(ctx, fee_basis_points)?;
        Ok(())
    }

    pub fn create_staking(ctx: Context<CreateStaking>, amount: u64) -> Result<()> {
        msg!(
            "Creating staking account for user: {:?} with amount: {}",
            ctx.accounts.user.key(),
            amount
        );
        process_create_staking(ctx, amount)?;
        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        msg!(
            "Claiming rewards for user: {:?}, staker: {:?}, fee vault: {:?}",
            ctx.accounts.user.key(),
            ctx.accounts.staker.key(),
            ctx.accounts.fee_vault.key()
        );
        process_claim_rewards(ctx)?;
        Ok(())
    }

    pub fn add_staking(ctx: Context<AddStaking>, amount: u64) -> Result<()> {
        msg!(
            "Adding staking for user: {:?}, amount: {}",
            ctx.accounts.user.key(),
            amount
        );
        process_add_staking(ctx, amount)?;
        Ok(())
    }

    pub fn decrease_staking(ctx: Context<DecreaseStaking>, amount: u64) -> Result<()> {
        msg!(
            "Decreasing staking for user: {:?}, amount: {}",
            ctx.accounts.user.key(),
            amount
        );
        process_decrease_staking(ctx, amount)?;
        Ok(())
    }

    pub fn close_staking(ctx: Context<CloseStaking>) -> Result<()> {
        msg!(
            "Closing staking account for user: {:?}, staker: {:?}",
            ctx.accounts.user.key(),
            ctx.accounts.staker.key()
        );
        process_close_staking(ctx)?;
        Ok(())
    }

    pub fn update_admin(ctx: Context<UpdateAdmin>, new_admin: Pubkey) -> Result<()> {
        msg!(
            "Updating admin from {:?} to {:?}",
            ctx.accounts.global_state.admin,
            new_admin
        );
        process_update_admin(ctx, new_admin)?;
        Ok(())
    }

    pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>, amount: u64) -> Result<()> {
        msg!(
            "Emergency withdraw by admin: {:?}, amount: {}",
            ctx.accounts.admin.key(),
            amount
        );
        process_emergency_withdraw(ctx, amount)?;
        Ok(())
    }

    pub fn update_fee_basis_points(ctx: Context<UpdateFeeBasisPoints>, new_fee_basis_points: u32) -> Result<()> {
        msg!(
            "Updating fee basis points from {:?} to {}",
            ctx.accounts.global_state.fee_basis_points,
            new_fee_basis_points
        );
        process_update_fee_basis_points(ctx, new_fee_basis_points)?;
        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, amount: u64) -> Result<()> {
        msg!(
            "Transfer from {:?} to {:?}, amount: {}",
            ctx.accounts.from.key(),
            ctx.accounts.to.key(),
            amount
        );
        process_transfer(ctx, amount)?;
        Ok(())
    }
    
}
