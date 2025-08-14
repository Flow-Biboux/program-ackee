use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Reward debt must be zero to perform action.")]
    RewardDebtNotZero,
    #[msg("Insufficient staked amount.")]
    InsufficientStakedAmount,
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Math overflow or underflow.")]
    MathError,
    #[msg("Insufficient funds.")]
    InsufficientFunds,
    #[msg("Invalid amount.")]
    InvalidAmount,
}
