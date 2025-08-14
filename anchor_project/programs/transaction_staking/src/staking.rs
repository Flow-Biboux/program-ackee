use crate::{constant::*, state::*};
use anchor_lang::prelude::*;

pub fn process_create_staking(ctx: Context<CreateStaking>, amount: u64) -> Result<()> {
    let global = &mut ctx.accounts.global_state;
    let user = &mut ctx.accounts.user.to_account_info();
    let staker = &mut ctx.accounts.staker.to_account_info();

    ctx.accounts.staker.init(ctx.accounts.user.key(), global, ctx.bumps.staker);
    ctx.accounts
        .staker
        .add_stake(global, user, staker, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct CreateStaking<'info> {
    #[account(mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump=global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(init,
        payer= user,
        space= 8 + Staker::INIT_SPACE,
        seeds = [STAKER_SEED.as_bytes(),user.key().as_ref()],
        bump
    )]
    pub staker: Account<'info, Staker>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_add_staking(ctx: Context<AddStaking>, amount: u64) -> Result<()> {
    let staker_account_info = &mut ctx.accounts.staker.to_account_info();
    let user_account_info = &mut ctx.accounts.user.to_account_info();
    let global = &mut ctx.accounts.global_state;

    ctx.accounts
        .staker
        .add_stake(global, user_account_info, staker_account_info, amount)?;

    Ok(())
}

#[derive(Accounts)]
pub struct AddStaking<'info> {
    #[account(mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump=global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut,
        seeds = [STAKER_SEED.as_bytes(),user.key().as_ref()],
        bump
    )]
    pub staker: Account<'info, Staker>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_decrease_staking(ctx: Context<DecreaseStaking>, amount: u64) -> Result<()> {
    let staker_account_info = &mut ctx.accounts.staker.to_account_info();
    let user_account_info = &mut ctx.accounts.user.to_account_info();
    let global = &mut ctx.accounts.global_state;
    ctx.accounts
        .staker
        .decrease_stake(global, staker_account_info, user_account_info, amount)?;
    Ok(())
}

#[derive(Accounts)]
pub struct DecreaseStaking<'info> {
    #[account(mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump=global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut,
        seeds = [STAKER_SEED.as_bytes(),user.key().as_ref()],
        bump
    )]
    pub staker: Account<'info, Staker>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_close_staking(ctx: Context<CloseStaking>) -> Result<()> {
    let amount = ctx.accounts.staker.amount;
    let fee_vault_account_info = &mut ctx.accounts.fee_vault.to_account_info();
    let user_account_info = &mut ctx.accounts.user.to_account_info();
    let staker_account_info = &mut ctx.accounts.staker.to_account_info();
    let global = &mut ctx.accounts.global_state;

    // First claim any pending rewards
    ctx.accounts
        .staker
        .claim_rewards(global, fee_vault_account_info, user_account_info)?;

    // Then close the staking account
    if amount > 0 {
        ctx.accounts.staker.decrease_stake(
            global,
            staker_account_info,
            user_account_info,
            amount,
        )?;
    }
    Ok(())
}

#[derive(Accounts)]
pub struct CloseStaking<'info> {
    #[account(mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump=global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(mut,
        seeds = [FEE_VAULT_SEED.as_bytes()],
        bump=fee_vault.bump
    )]
    pub fee_vault: Account<'info, FeeVault>,
    #[account(mut,
        close=user,
        seeds = [STAKER_SEED.as_bytes(),user.key().as_ref()],
        bump
    )]
    pub staker: Account<'info, Staker>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn process_claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let fee_vault_account_info = &mut ctx.accounts.fee_vault.to_account_info();
    let user_account_info = &mut ctx.accounts.user.to_account_info();
    let global = &ctx.accounts.global_state;

    ctx.accounts
        .staker
        .claim_rewards(global, fee_vault_account_info, user_account_info)?;

    Ok(())
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump=global_state.bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(
        mut,
        seeds = [FEE_VAULT_SEED.as_bytes()],
        bump=fee_vault.bump
    )]
    pub fee_vault: Account<'info, FeeVault>,
    #[account(
        mut,
        seeds = [STAKER_SEED.as_bytes(),user.key().as_ref()],
        bump
    )]
    pub staker: Account<'info, Staker>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}
