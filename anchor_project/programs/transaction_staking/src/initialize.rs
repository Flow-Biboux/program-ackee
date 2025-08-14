use {crate::state::*, anchor_lang::prelude::*};

pub fn process_initialize(ctx: Context<Initialize>, fee_basis_points: Option<u32>) -> Result<()> {
    ctx.accounts.global_state.init(
        ctx.accounts.admin.key(),
        ctx.accounts.fee_vault.key(),
        ctx.bumps.global_state,
    );
    ctx.accounts.fee_vault.init(ctx.bumps.fee_vault);

    if let Some(fee) = fee_basis_points {
        ctx.accounts.global_state.update_fee_basis_points(fee)?;
    }

    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init,
        payer= admin,
        space= 8+ GlobalState::INIT_SPACE,
        seeds = [GLOBAL_SEED.as_bytes()],
        bump
    )]
    pub global_state: Account<'info, GlobalState>,
    #[account(init,
        payer= admin,
        space= 8 + FeeVault::INIT_SPACE,
        seeds = [FEE_VAULT_SEED.as_bytes()],
        bump
    )]
    pub fee_vault: Account<'info, FeeVault>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}
