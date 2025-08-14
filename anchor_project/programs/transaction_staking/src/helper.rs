use crate::error::StakingError::*;
use anchor_lang::{
    prelude::*,
    solana_program::{program::invoke, system_instruction::transfer},
};

pub fn transfer_sol_pda<'info>(
    from: &mut AccountInfo<'info>,
    to: &mut AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    require_gte!(from.lamports(), amount, InsufficientFunds);

    **from.try_borrow_mut_lamports()? -= amount;
    **to.try_borrow_mut_lamports()? += amount;
    Ok(())
}

pub fn transfer_sol<'info>(
    from: &mut AccountInfo<'info>,
    to: &mut AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    let instruction = transfer(&from.key(), &to.key(), amount);
    let account_infos = &[from.clone(), to.clone()];
    invoke(&instruction, account_infos)?;

    Ok(())
}
