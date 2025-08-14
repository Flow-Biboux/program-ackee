# Project Description

**Deployed Frontend URL:** [To be added upon deployment]

**Solana Program ID:** 9eXsPTK6DZ38uFnTuVaWNkmNgmCnWrZb9k64jwJdEzsv

## Project Overview

### Description
This dApp is a staking and fee-sharing platform built on Solana using Anchor. Users can stake SOL, participate in a staking pool, and earn a share of transaction fees collected from transfers made through the program. The system uses a reward-per-share model to distribute fees fairly and efficiently to stakers, based on their share of the total staked amount at the time of each fee event.

### Key Features
- **Staking:** Users can create a staking account, deposit SOL, add to or decrease their stake, and close their staking account to withdraw funds.
- **Transfer with Fee:** Users can transfer SOL through the program. Each transfer incurs a fee, which is sent to a program-controlled vault (PDA) and distributed to stakers.
- **Fee Distribution & Claiming:** The program uses a reward-per-share model. Stakers can claim their share of accumulated fees at any time, and only users staked at the time of a transfer are eligible for that transfer's fee.
- **Admin Controls:** The admin can update the fee rate, change admin authority, and perform emergency withdrawals from the fee vault.

### How to Use the dApp

1. **Connect Wallet**
   - Connect your Solana wallet to the frontend.
2. **Stake SOL**
   - Create a staking account and deposit SOL to participate in the staking pool.
3. **Transfer SOL**
   - Use the dApp to transfer SOL to another user. A fee will be collected and distributed to stakers.
4. **Claim Rewards**
   - Claim your share of accumulated fees at any time.
5. **Unstake/Close Account**
   - Decrease your stake or close your staking account to withdraw your funds (must claim all pending rewards first).

## Program Architecture

### PDA Usage
The program uses Program Derived Addresses (PDAs) to securely manage program state and fee vaults.

**PDAs Used:**
- **Global State PDA:** Stores the global state of the staking pool (seeds: ["global-state"]).
- **Fee Vault PDA:** Holds collected fees in a program-controlled account (seeds: ["fee-vault"]). This PDA is the authority over the fee vault account, ensuring only the program can move funds from it. All transfer fees are deposited here and distributed to stakers upon claiming.
- **Staker PDA:** Stores each user's staking data (seeds: ["staker", user_pubkey]).
- **Fee Account PDA:** A dedicated PDA that acts as the actual on-chain account (system or SPL token account) where the collected fees (from the Fee Vault PDA) are physically stored. This account is controlled by the Fee Vault PDA and is the source of funds when stakers claim their rewards. It ensures that fee funds are isolated and securely managed by the program.

### Program Instructions
**Instructions Implemented:**
- **initialize:** Initializes the program, setting up the global state and fee vault.
- **createStaking:** Creates a staking account and deposits SOL.
- **addStaking:** Adds more SOL to an existing staking account.
- **decreaseStaking:** Decreases the staked amount, returning SOL to the user.
- **closeStaking:** Closes the staking account, returning all funds to the user.
- **transfer:** Transfers SOL between users, collecting a fee and updating the reward-per-share.
- **claimRewards:** Claims accumulated rewards for a staker.
- **updateFeeBasisPoints:** Admin instruction to update the fee rate.
- **updateAdmin:** Admin instruction to change admin authority.
- **emergencyWithdraw:** Admin instruction to withdraw funds from the fee vault in emergencies.

### Account Structure
The main account structures are as follows:

```rust
#[account]
pub struct GlobalState {
    pub admin: Pubkey,              // Program admin authority
    pub total_staked: u64,          // Total SOL staked
    pub reward_per_share: u128,     // Cumulative rewards per staked token (high precision)
    pub fee_vault: Pubkey,          // PDA holding collected fees
    pub fee_account: Pubkey,        // PDA for the actual on-chain fee account
    pub fee_basis_points: u64,      // Fee rate in basis points
    pub bump: u8,                   // PDA bump
}

#[account]
pub struct Staker {
    pub owner: Pubkey,              // User's wallet
    pub amount: u64,                // Amount staked
    pub reward_debt: u128,          // User's last reward-per-share checkpoint
    pub bump: u8,                   // PDA bump
}

#[account]
pub struct FeeVault {
    pub bump: u8,                   // PDA bump
}
```

## Testing

### Test Coverage

**Functional Testing (User & Admin Actions):**
- **Program Initialization:** We test that the admin can initialize the staking program, and that it cannot be initialized twice.
- **Staking:** Users can create a staking account and deposit SOL. We check that the staked amount is correct, the user's account is set up properly, and the global state is updated.
- **Adding Stake:** Users can add more SOL to their existing staking account. We verify the new total, and that rewards are only calculated for the correct periods.
- **Decreasing Stake:** Users can decrease their staked amount. We check that the withdrawal is correct, the user's remaining stake is updated, and the global total is accurate.
- **Closing Staking Account:** Users can close their staking account, withdrawing all funds. We ensure the account is closed and the global state reflects the change.
- **Transfers with Fee:** We simulate transfers between users, check that the correct fee is collected, and that the fee vault balance increases as expected.
- **Fee Distribution:** After transfers, we check that the reward-per-share is updated and that only users staked at the time of the transfer are eligible for those rewards.
- **Claiming Rewards:** Users claim their share of accumulated fees. We verify that the correct amount is transferred from the fee vault to the user, and that reward debt is updated to prevent double-claiming.
- **Admin Actions:** We test that only the admin can update the fee rate, change admin authority, or perform emergency withdrawals from the fee vault, and that these actions work as intended.

**Negative Testing (Edge Cases & Security):**
- **Invalid Stake Amounts:** We try staking zero or more than the user's balance, and check that these are rejected.
- **Over-withdrawal:** We attempt to decrease or withdraw more than the staked amount, and ensure the program blocks it.
- **Unauthorized Access:** We test that users cannot modify or close other users' staking accounts, or perform admin actions without the correct authority.
- **Double Initialization:** We check that the program cannot be initialized more than once.
- **Non-existent Accounts:** We try to claim rewards or add/decrease stake from accounts that don't exist, and verify these fail.
- **Pending Rewards:** We ensure users cannot add or decrease stake if they have unclaimed rewards, enforcing correct reward accounting.
- **Fee Vault Draining:** We attempt to withdraw more from the fee vault than is available, and check that this is prevented.
- **Wrong PDAs/Seeds:** We test that using incorrect PDAs or seeds is rejected by the program.
- **Double-claiming:** We verify that users cannot claim the same rewards twice.


### Running Tests
```bash
# Commands to run your tests
anchor test
```

### Additional Notes for Evaluators
next step would be to use tooken2022 instead of transfering sol and use cpi guard to ensure transfer fees need to be payed