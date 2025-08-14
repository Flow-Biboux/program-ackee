use crate::{error::StakingError::*, helper::*};
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct GlobalState {
    pub admin: Pubkey,
    pub total_staked: u64,
    pub reward_per_share: u128,
    pub fee_basis_points: u32, // Fee in basis points (100_000 = 100%, 10_000 = 10%, 1_000 = 1%, 100 = 0.1%)
    pub fee_vault: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Staker {
    pub owner: Pubkey,
    pub amount: u64,
    pub reward_debt: u128,
}

#[account]
#[derive(InitSpace)]

pub struct FeeVault {
    pub bump: u8,
}

pub const GLOBAL_SEED: &str = "global-state";
pub const FEE_VAULT_SEED: &str = "fee-vault";
pub const STAKER_SEED: &str = "staker";
pub const FEE_DENOMINATOR: u32 = 100_000; // 100_000 = 100%, 10_000 = 10%, 1_000 = 1%, 100 = 0.1%

impl GlobalState {
    pub fn init(&mut self, admin: Pubkey, fee_vault: Pubkey, bump: u8) {
        self.admin = admin;
        self.fee_vault = fee_vault;
        self.bump = bump;
        self.reward_per_share = 0;
        self.total_staked = 0;
        self.fee_basis_points = 1_000; // Default 1% fee (1_000 = 1%)
    }
    pub fn increase_total_staked(&mut self, amount: u64) {
        self.total_staked = self.total_staked.checked_add(amount).unwrap();
    }

    pub fn decrease_total_staked(&mut self, amount: u64) {
        self.total_staked = self.total_staked.checked_sub(amount).unwrap();
    }
    pub fn pay_fees<'info>(
        &mut self,
        transaction_amount: u64,
        from: &mut AccountInfo<'info>,
        fee_vault: &mut AccountInfo<'info>,
    ) -> Result<()> {
        // Calculate fee based on configurable percentage
        let fee_amount = self.calculate_fee_amount(transaction_amount);

        // Transfer the calculated fee to vault
        transfer_sol(from, fee_vault, fee_amount)?;

        if self.total_staked > 0 {
            let fee = fee_amount as u128;
            self.reward_per_share = self
                .reward_per_share
                .checked_add(
                    fee.checked_mul(1_000_000_000_000u128)
                        .unwrap()
                        .checked_div(self.total_staked as u128)
                        .unwrap(),
                )
                .unwrap();
        }
        Ok(())
    }

    pub fn update_fee_basis_points(&mut self, new_fee_basis_points: u32) -> Result<()> {
        require_gte!(
            new_fee_basis_points,
            0,
            crate::error::StakingError::MathError
        );
        require_gte!(
            FEE_DENOMINATOR,
            new_fee_basis_points,
            crate::error::StakingError::MathError
        ); // Max 100%
        self.fee_basis_points = new_fee_basis_points;
        Ok(())
    }

    pub fn calculate_fee_amount(&self, transaction_amount: u64) -> u64 {
        (transaction_amount as u128 * self.fee_basis_points as u128 / FEE_DENOMINATOR as u128)
            as u64
    }
}

impl FeeVault {
    pub fn init(&mut self, bump: u8) {
        self.bump = bump;
    }
}

impl Staker {
    pub fn init(&mut self, owner: Pubkey, global: &GlobalState) {
        self.owner = owner;
        self.amount = 0;
        // Set reward_debt to current reward_per_share so new stakers only get future rewards
        self.reward_debt = global.reward_per_share;
    }

    pub fn increase_stake_amount(&mut self, amount: u64) -> Result<()> {
        self.amount = self.amount.checked_add(amount).ok_or(MathError)?;
        Ok(())
    }

    pub fn decrease_stake_amount(&mut self, amount: u64) -> Result<()> {
        require_gte!(self.amount, amount, InsufficientStakedAmount);
        self.amount = self.amount.checked_sub(amount).ok_or(MathError)?;
        Ok(())
    }

    pub fn claim_rewards<'info>(
        &mut self,
        global: &Account<'info, GlobalState>,
        fee_vault: &mut AccountInfo<'info>,
        user: &mut AccountInfo<'info>,
    ) -> Result<()> {
        // Calculate pending rewards
        let pending = self.calculate_pending_rewards(global);

        if pending > 0 {
            // Transfer rewards from fee vault to user
            transfer_sol_pda(fee_vault, user, pending)?;
        }

        // Update reward_debt to current global reward_per_share
        self.reward_debt = global.reward_per_share;

        Ok(())
    }

    pub fn calculate_pending_rewards<'info>(&self, global: &Account<'info, GlobalState>) -> u64 {
        if self.amount == 0 {
            return 0;
        }

        let reward_per_share = global.reward_per_share;
        let reward_debt = self.reward_debt;

        if reward_per_share <= reward_debt {
            return 0;
        }

        let pending = (reward_per_share - reward_debt)
            .checked_mul(self.amount as u128)
            .unwrap()
            .checked_div(1_000_000_000_000u128)
            .unwrap();

        pending as u64
    }

    pub fn add_stake<'info>(
        &mut self,
        global: &mut Account<'info, GlobalState>,
        user: &mut AccountInfo<'info>,
        staker: &mut AccountInfo<'info>,
        amount: u64,
    ) -> Result<()> {
        require_gt!(amount, 0, InvalidAmount);
        require_eq!(self.reward_debt, global.reward_per_share, RewardDebtNotZero);

        transfer_sol(user, staker, amount)?;

        self.increase_stake_amount(amount)?;

        global.increase_total_staked(amount);
        Ok(())
    }

    pub fn decrease_stake<'info>(
        &mut self,
        global: &mut Account<'info, GlobalState>,
        staker: &mut AccountInfo<'info>,
        user: &mut AccountInfo<'info>,
        amount: u64,
    ) -> Result<()> {
        require_eq!(self.reward_debt, global.reward_per_share, RewardDebtNotZero);

        transfer_sol_pda(staker, user, amount)?;

        self.decrease_stake_amount(amount)?;

        global.decrease_total_staked(amount);
        Ok(())
    }
}
