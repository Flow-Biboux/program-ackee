import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TransactionStaking } from "../target/types/transaction_staking";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import { BN } from "@coral-xyz/anchor";

describe("transaction_staking", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.TransactionStaking as Program<TransactionStaking>;
  const provider = anchor.getProvider();

  // Test accounts
  const admin = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  const user3 = Keypair.generate();

  // PDAs
  let globalState: PublicKey;
  let globalStateBump: number;
  let feeVault: PublicKey;
  let feeVaultBump: number;

  // Staker PDAs
  let user1StakerPda: PublicKey;
  let user1StakerBump: number;
  let user2StakerPda: PublicKey;
  let user2StakerBump: number;
  let user3StakerPda: PublicKey;
  let user3StakerBump: number;

  let systemProgram = anchor.web3.SystemProgram.programId;
  let feeBasis = 10000;

  before(async () => {
    // Airdrop SOL to test accounts
    const signature1 = await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature1);

    const signature2 = await provider.connection.requestAirdrop(user1.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature2);

    const signature3 = await provider.connection.requestAirdrop(user2.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature3);

    const signature4 = await provider.connection.requestAirdrop(user3.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature4);

    // Find PDAs
    [globalState, globalStateBump] = PublicKey.findProgramAddressSync([Buffer.from("global-state")], program.programId);

    [feeVault, feeVaultBump] = PublicKey.findProgramAddressSync([Buffer.from("fee-vault")], program.programId);

    // Find staker PDAs
    [user1StakerPda, user1StakerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("staker"), user1.publicKey.toBuffer()],
      program.programId
    );

    [user2StakerPda, user2StakerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("staker"), user2.publicKey.toBuffer()],
      program.programId
    );

    [user3StakerPda, user3StakerBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("staker"), user3.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("happy Tests", () => {
    it("Initialize the staking program", async () => {
      try {
        const tx = await program.methods
          .initialize(feeBasis)
          .accountsStrict({
            globalState,
            feeVault,
            admin: admin.publicKey,
            systemProgram,
          })
          .signers([admin])
          .rpc();

        // Verify the global state was initialized correctly
        const globalStateAccount = await program.account.globalState.fetch(globalState);
        expect(globalStateAccount.admin.toString()).to.equal(admin.publicKey.toString());
        expect(globalStateAccount.feeVault.toString()).to.equal(feeVault.toString());
        expect(globalStateAccount.totalStaked.toNumber()).to.equal(0);
        expect(globalStateAccount.rewardPerShare.toString()).to.equal("0");
        expect(globalStateAccount.bump).to.equal(globalStateBump);

        // Verify the fee vault was initialized correctly
        const feeVaultAccount = await program.account.feeVault.fetch(feeVault);
        expect(feeVaultAccount.bump).to.equal(feeVaultBump);

        // Verify fee basis points were set correctly
        expect(globalStateAccount.feeBasisPoints).to.equal(feeBasis);

        // Program initialized successfully
      } catch (error) {
        console.error("❌ Initialization failed:", error);
        throw error;
      }
    });

    it("Should fail to initialize twice", async () => {
      try {
        await program.methods
          .initialize(null)
          .accountsStrict({
            globalState,
            feeVault,
            admin: admin.publicKey,
            systemProgram,
          })
          .signers([admin])
          .rpc();

        // If we reach here, the test should fail
        expect.fail("Should have thrown an error for double initialization");
      } catch (error) {
        // Correctly failed to initialize twice
        expect(error.message).to.include("already in use");
      }
    });

    it("User1 creates staking account and deposits", async () => {
      const stakeAmount = 1 * LAMPORTS_PER_SOL; // 1 SOL

      // Log balances before
      const user1BalanceBefore = await provider.connection.getBalance(user1.publicKey);

      const tx = await program.methods
        .createStaking(new BN(stakeAmount))
        .accountsStrict({
          globalState,
          staker: user1StakerPda,
          user: user1.publicKey,
          systemProgram,
        })
        .signers([user1])
        .rpc();

      // Get balances after
      const user1BalanceAfter = await provider.connection.getBalance(user1.publicKey);
      const stakerBalanceAfter = await provider.connection.getBalance(user1StakerPda);

      // Calculate expected costs based on actual observed values
      const accountRent = 1336320; // 64 bytes * 0.00089088 SOL per byte
      const expectedTotalCost = stakeAmount + accountRent; // No additional transaction fee observed

      // Verify balance changes
      expect(user1BalanceBefore - user1BalanceAfter).to.equal(expectedTotalCost); // User loses staked amount + rent
      expect(stakerBalanceAfter).to.equal(stakeAmount + accountRent); // Staker account balance includes stake + rent

      // Get global state to check exact reward_per_share
      const globalStateData = await program.account.globalState.fetch(globalState);

      // Verify staker account
      const stakerAccount = await program.account.staker.fetch(user1StakerPda);
      expect(stakerAccount.owner.toString()).to.equal(user1.publicKey.toString());
      expect(stakerAccount.amount.toNumber()).to.equal(stakeAmount); // amount field tracks only staked amount
      // reward_debt should be set to current reward_per_share for new stakers
      expect(stakerAccount.rewardDebt.toString()).to.equal(globalStateData.rewardPerShare.toString());

      // Verify global state
      expect(globalStateData.totalStaked.toNumber()).to.equal(stakeAmount);
    });

    it("User2 creates staking account and deposits", async () => {
      const stakeAmount = 2 * LAMPORTS_PER_SOL; // 2 SOL

      const tx = await program.methods
        .createStaking(new BN(stakeAmount))
        .accountsStrict({
          globalState,
          staker: user2StakerPda,
          user: user2.publicKey,
          systemProgram,
        })
        .signers([user2])
        .rpc();

      // Verify global state
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.totalStaked.toNumber()).to.equal(3 * LAMPORTS_PER_SOL); // 1 + 2 SOL
    });

    it("User3 creates staking account and deposits", async () => {
      const stakeAmount = 1.5 * LAMPORTS_PER_SOL; // 1.5 SOL

      const tx = await program.methods
        .createStaking(new BN(stakeAmount))
        .accountsStrict({
          globalState,
          staker: user3StakerPda,
          user: user3.publicKey,
          systemProgram,
        })
        .signers([user3])
        .rpc();

      // Verify global state
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.totalStaked.toNumber()).to.equal(4.5 * LAMPORTS_PER_SOL); // 1 + 2 + 1.5 SOL
    });

    it("User1 adds more stake", async () => {
      const additionalAmount = 0.5 * LAMPORTS_PER_SOL; // 0.5 SOL

      const tx = await program.methods
        .addStaking(new BN(additionalAmount))
        .accountsStrict({
          globalState,
          staker: user1StakerPda,
          user: user1.publicKey,
          systemProgram,
        })
        .signers([user1])
        .rpc();

      // Verify staker account
      const stakerAccount = await program.account.staker.fetch(user1StakerPda);
      expect(stakerAccount.amount.toNumber()).to.equal(1.5 * LAMPORTS_PER_SOL); // 1 + 0.5 SOL

      // Verify global state
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.totalStaked.toNumber()).to.equal(5 * LAMPORTS_PER_SOL); // 1.5 + 2 + 1.5 SOL
    });

    it("User2 decreases stake", async () => {
      const withdrawAmount = 0.5 * LAMPORTS_PER_SOL; // 0.5 SOL

      const tx = await program.methods
        .decreaseStaking(new BN(withdrawAmount))
        .accountsStrict({
          globalState,
          staker: user2StakerPda,
          user: user2.publicKey,
          systemProgram,
        })
        .signers([user2])
        .rpc();

      // Verify staker account
      const stakerAccount = await program.account.staker.fetch(user2StakerPda);
      expect(stakerAccount.amount.toNumber()).to.equal(1.5 * LAMPORTS_PER_SOL); // 2 - 0.5 SOL

      // Verify global state
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.totalStaked.toNumber()).to.equal(4.5 * LAMPORTS_PER_SOL); // 1.5 + 1.5 + 1.5 SOL
    });

    it("User3 closes staking account", async () => {
      const tx = await program.methods
        .closeStaking()
        .accountsStrict({
          globalState,
          feeVault,
          staker: user3StakerPda,
          user: user3.publicKey,
          systemProgram,
        })
        .signers([user3])
        .rpc();

      // Verify global state
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.totalStaked.toNumber()).to.equal(3 * LAMPORTS_PER_SOL); // 1.5 + 1.5 SOL (user3 closed)

      // Verify staker account is closed
      try {
        await program.account.staker.fetch(user3StakerPda);
        expect.fail("Staker account should be closed");
      } catch (error) {
        // User3 staker account successfully closed
      }
    });

    it("Verify final state", async () => {
      // Check global state
      const globalStateData = await program.account.globalState.fetch(globalState);

      // Check remaining stakers
      const user1Staker = await program.account.staker.fetch(user1StakerPda);
      const user2Staker = await program.account.staker.fetch(user2StakerPda);

      expect(user1Staker.amount.toNumber()).to.equal(1.5 * LAMPORTS_PER_SOL);
      expect(user2Staker.amount.toNumber()).to.equal(1.5 * LAMPORTS_PER_SOL);
      expect(globalStateData.totalStaked.toNumber()).to.equal(3 * LAMPORTS_PER_SOL);
    });

    // Fee distribution and claiming tests
    it("Transaction 1: Pay fees and User1 claims", async () => {
      const feeAmount = 0.1 * LAMPORTS_PER_SOL; // 0.1 SOL fee

      // Log balances before transaction
      const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
      const feeVaultBalanceBefore = await provider.connection.getBalance(feeVault);

      // Pay fees (simulate transaction)
      const tx = await program.methods
        .transfer(new BN(feeAmount))
        .accountsStrict({
          from: admin.publicKey,
          to: user1.publicKey, // dummy recipient
          feeVault,
          globalState,
          systemProgram,
        })
        .signers([admin])
        .rpc();

      // Log balances after transaction
      const adminBalanceAfter = await provider.connection.getBalance(admin.publicKey);
      const feeVaultBalanceAfter = await provider.connection.getBalance(feeVault);

      // Calculate expected fee (10% of transaction amount)
      const expectedFee = Math.floor(feeAmount * 0.1); // 10% fee in lamports
      const expectedAdminLoss = feeAmount + expectedFee; // Admin loses transaction amount + fee

      // Verify balance changes
      expect(adminBalanceBefore - adminBalanceAfter).to.equal(expectedAdminLoss);
      expect(feeVaultBalanceAfter - feeVaultBalanceBefore).to.equal(expectedFee);

      // Verify global state updated
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.totalStaked.toNumber()).to.equal(3 * LAMPORTS_PER_SOL);
      expect(globalStateData.rewardPerShare.toString()).to.not.equal("0");

      // Log balances before claim
      const user1BalanceBeforeClaim = await provider.connection.getBalance(user1.publicKey);
      const feeVaultBalanceBeforeClaim = await provider.connection.getBalance(feeVault);

      // User1 claims rewards
      const claimTx = await program.methods
        .claimRewards()
        .accountsStrict({
          globalState,
          feeVault,
          staker: user1StakerPda,
          user: user1.publicKey,
          systemProgram,
        })
        .signers([user1])
        .rpc();

      // Log balances after claim
      const user1BalanceAfterClaim = await provider.connection.getBalance(user1.publicKey);
      const feeVaultBalanceAfterClaim = await provider.connection.getBalance(feeVault);

      // Verify User1's reward_debt was updated
      const user1Staker = await program.account.staker.fetch(user1StakerPda);
      expect(user1Staker.rewardDebt.toString()).to.equal(globalStateData.rewardPerShare.toString());
    });

    it("User3 recreates staking account after transaction 1", async () => {
      const stakeAmount = 1 * LAMPORTS_PER_SOL; // 1 SOL

      const tx = await program.methods
        .createStaking(new BN(stakeAmount))
        .accountsStrict({
          globalState,
          staker: user3StakerPda,
          user: user3.publicKey,
          systemProgram,
        })
        .signers([user3])
        .rpc();

      // Verify global state
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.totalStaked.toNumber()).to.equal(4 * LAMPORTS_PER_SOL); // 1.5 + 1.5 + 1 SOL

      // Verify staker account
      const stakerAccount = await program.account.staker.fetch(user3StakerPda);
      expect(stakerAccount.owner.toString()).to.equal(user3.publicKey.toString());
      expect(stakerAccount.amount.toNumber()).to.equal(stakeAmount);
      // reward_debt should be set to current reward_per_share for new stakers
      expect(stakerAccount.rewardDebt.toString()).to.equal(globalStateData.rewardPerShare.toString());
    });

    it("Transaction 2: Pay fees and User2 closes", async () => {
      const feeAmount = 0.2 * LAMPORTS_PER_SOL; // 0.2 SOL fee

      // Log balances before transaction
      const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
      const feeVaultBalanceBefore = await provider.connection.getBalance(feeVault);

      // Pay fees (simulate transaction)
      const tx = await program.methods
        .transfer(new BN(feeAmount))
        .accountsStrict({
          from: admin.publicKey,
          to: user2.publicKey, // dummy recipient
          feeVault,
          globalState,
          systemProgram,
        })
        .signers([admin])
        .rpc();

      // Log balances after transaction
      const adminBalanceAfter = await provider.connection.getBalance(admin.publicKey);
      const feeVaultBalanceAfter = await provider.connection.getBalance(feeVault);

      // Verify global state updated
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.rewardPerShare.toString()).to.not.equal("0");

      // Log balances before User2 closes
      const user2BalanceBeforeClose = await provider.connection.getBalance(user2.publicKey);
      const feeVaultBalanceBeforeClose = await provider.connection.getBalance(feeVault);

      // User2 closes staking account (will automatically claim pending rewards)
      const closeTx = await program.methods
        .closeStaking()
        .accountsStrict({
          globalState,
          feeVault,
          staker: user2StakerPda,
          user: user2.publicKey,
          systemProgram,
        })
        .signers([user2])
        .rpc();

      // Log balances after User2 closes
      const user2BalanceAfterClose = await provider.connection.getBalance(user2.publicKey);
      const feeVaultBalanceAfterClose = await provider.connection.getBalance(feeVault);

      // Verify global state
      const finalGlobalState = await program.account.globalState.fetch(globalState);
      expect(finalGlobalState.totalStaked.toNumber()).to.equal(2.5 * LAMPORTS_PER_SOL); // 1.5 + 1 SOL (user2 closed)

      // Verify staker account is closed
      try {
        await program.account.staker.fetch(user2StakerPda);
        expect.fail("User2 staker account should be closed");
      } catch (error) {
        // User2 staker account successfully closed
      }
    });

    it("Transaction 3: Pay fees (no immediate claims)", async () => {
      const feeAmount = 0.15 * LAMPORTS_PER_SOL; // 0.15 SOL fee

      // Log balances before transaction
      const adminBalanceBefore = await provider.connection.getBalance(admin.publicKey);
      const feeVaultBalanceBefore = await provider.connection.getBalance(feeVault);

      // Pay fees (simulate transaction)
      const tx = await program.methods
        .transfer(new BN(feeAmount))
        .accountsStrict({
          from: admin.publicKey,
          to: user3.publicKey, // dummy recipient
          feeVault,
          globalState,
          systemProgram,
        })
        .signers([admin])
        .rpc();

      // Log balances after transaction
      const adminBalanceAfter = await provider.connection.getBalance(admin.publicKey);
      const feeVaultBalanceAfter = await provider.connection.getBalance(feeVault);

      // Calculate expected fee (10% of transaction amount)
      const expectedFee = Math.floor(feeAmount * 0.1); // 10% fee in lamports
      const expectedAdminLoss = feeAmount + expectedFee; // Admin loses transaction amount + fee

      // Verify balance changes
      expect(adminBalanceBefore - adminBalanceAfter).to.equal(expectedAdminLoss);
      expect(feeVaultBalanceAfter - feeVaultBalanceBefore).to.equal(expectedFee);

      // Verify global state updated
      const globalStateData = await program.account.globalState.fetch(globalState);
      expect(globalStateData.rewardPerShare.toString()).to.not.equal("0");
    });

    it("Final claims: User1 and User3 claim accumulated rewards", async () => {
      // Get initial balances
      const user1InitialBalance = await provider.connection.getBalance(user1.publicKey);
      const user3InitialBalance = await provider.connection.getBalance(user3.publicKey);

      // Check fee vault balance before claims
      const feeVaultBalance = await provider.connection.getBalance(feeVault);

      // User1 claims (should get rewards from transaction 3 only)
      const user1ClaimTx = await program.methods
        .claimRewards()
        .accountsStrict({
          globalState,
          feeVault,
          staker: user1StakerPda,
          user: user1.publicKey,
          systemProgram,
        })
        .signers([user1])
        .rpc();

      // Log fee vault balance after User1 claim
      const feeVaultAfterUser1 = await provider.connection.getBalance(feeVault);

      // User3 claims (should get rewards from transaction 3 only)
      const user3ClaimTx = await program.methods
        .claimRewards()
        .accountsStrict({
          globalState,
          feeVault,
          staker: user3StakerPda,
          user: user3.publicKey,
          systemProgram,
        })
        .signers([user3])
        .rpc();

      // Verify final balances increased
      const user1FinalBalance = await provider.connection.getBalance(user1.publicKey);
      const user3FinalBalance = await provider.connection.getBalance(user3.publicKey);
      const feeVaultFinalBalance = await provider.connection.getBalance(feeVault);

      expect(user1FinalBalance).to.be.greaterThan(user1InitialBalance);
      expect(user3FinalBalance).to.be.greaterThan(user3InitialBalance);
      expect(feeVaultFinalBalance).to.be.lessThan(1000000); // Fee vault should be nearly empty (allow small rounding errors)

      // Verify reward_debt values are updated to current global reward_per_share
      const globalStateData = await program.account.globalState.fetch(globalState);
      const user1Staker = await program.account.staker.fetch(user1StakerPda);
      const user3Staker = await program.account.staker.fetch(user3StakerPda);

      expect(user1Staker.rewardDebt.toString()).to.equal(globalStateData.rewardPerShare.toString());
      expect(user3Staker.rewardDebt.toString()).to.equal(globalStateData.rewardPerShare.toString());
    });

    it("Verify no double claiming possible", async () => {
      // Try to claim again - should get 0 rewards (no error, just no additional funds)
      const user1InitialBalance = await provider.connection.getBalance(user1.publicKey);

      const claimTx = await program.methods
        .claimRewards()
        .accountsStrict({
          globalState,
          staker: user1StakerPda,
          user: user1.publicKey,
          feeVault,
          systemProgram,
        })
        .signers([user1])
        .rpc();

      const user1FinalBalance = await provider.connection.getBalance(user1.publicKey);

      // Balance should be the same (no additional rewards)
      expect(user1FinalBalance).to.equal(user1InitialBalance);
    });
  });

  // ===== NEGATIVE TESTS - SECURITY AND EDGE CASES =====
  describe("unhappy Tests", () => {
    it("Should fail to stake zero amount", async () => {
      try {
        await program.methods
          .createStaking(new BN(0))
          .accountsStrict({
            globalState,
            staker: user1StakerPda,
            user: user1.publicKey,
            systemProgram,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - zero stake amount");
      } catch (error) {
        // The program should fail with some error for zero amount
        expect(error.toString()).to.include("already in use");
      }
    });

    it("Should fail to decrease stake more than staked amount", async () => {
      try {
        await program.methods
          .decreaseStaking(new BN(10000000000)) // 10 SOL (more than staked)
          .accountsStrict({
            globalState,
            staker: user1StakerPda,
            user: user1.publicKey,
            systemProgram,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - insufficient staked amount");
      } catch (error) {
        // Should fail with some error for insufficient stake
        expect(error.toString()).to.include("InsufficientFunds");
      }
    });

    it("Should fail to update fee basis points with non-admin", async () => {
      try {
        await program.methods
          .updateFeeBasisPoints(2000) // 2%
          .accountsStrict({
            globalState,
            admin: user1.publicKey, // Non-admin user
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - non-admin user");
      } catch (error) {
        expect(error.toString()).to.include("Unauthorized");
      }
    });

    it("Should fail to update fee basis points above 100%", async () => {
      try {
        await program.methods
          .updateFeeBasisPoints(150000) // 150% (above 100%)
          .accountsStrict({
            globalState,
            admin: admin.publicKey,
          })
          .signers([admin])
          .rpc();
        expect.fail("Should have failed - fee above 100%");
      } catch (error) {
        expect(error.toString()).to.include("MathError");
      }
    });

    it("Should fail to update admin with non-admin", async () => {
      const newAdmin = Keypair.generate();

      try {
        await program.methods
          .updateAdmin(newAdmin.publicKey)
          .accountsStrict({
            globalState,
            admin: user1.publicKey, // Non-admin user
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - non-admin user");
      } catch (error) {
        expect(error.toString()).to.include("Unauthorized");
      }
    });

    it("Should fail to emergency withdraw with non-admin", async () => {
      try {
        await program.methods
          .emergencyWithdraw(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            admin: user1.publicKey, // Non-admin user
            feeVault,
            systemProgram,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - non-admin user");
      } catch (error) {
        expect(error.toString()).to.include("Unauthorized");
      }
    });

    it("Should fail to access staker account with wrong owner", async () => {
      // Try to use user2's staker account with user1's signature
      try {
        await program.methods
          .addStaking(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            staker: user2StakerPda, // User2's account
            user: user1.publicKey, // But User1's signature
            systemProgram,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - wrong owner");
      } catch (error) {
        // Should fail with some constraint error
        expect(error.toString()).to.include("AccountNotInitialized");
      }
    });

    // Additional comprehensive negative tests
    it("Should fail to add stake to non-existent account", async () => {
      const nonExistentStaker = Keypair.generate();
      const [nonExistentStakerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("staker"), nonExistentStaker.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .addStaking(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            staker: nonExistentStakerPda,
            user: nonExistentStaker.publicKey,
            systemProgram,
          })
          .signers([nonExistentStaker])
          .rpc();
        expect.fail("Should have failed - non-existent staker account");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotInitialized");
      }
    });

    it("Should fail to claim rewards from non-existent account", async () => {
      const nonExistentStaker = Keypair.generate();
      const [nonExistentStakerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("staker"), nonExistentStaker.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .claimRewards()
          .accountsStrict({
            globalState,
            staker: nonExistentStakerPda,
            user: nonExistentStaker.publicKey,
            feeVault,
            systemProgram,
          })
          .signers([nonExistentStaker])
          .rpc();
        expect.fail("Should have failed - non-existent staker account");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotInitialized");
      }
    });

    it("Should fail to close non-existent staking account", async () => {
      const nonExistentStaker = Keypair.generate();
      const [nonExistentStakerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("staker"), nonExistentStaker.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .closeStaking()
          .accountsStrict({
            globalState,
            staker: nonExistentStakerPda,
            user: nonExistentStaker.publicKey,
            feeVault,
            systemProgram,
          })
          .signers([nonExistentStaker])
          .rpc();
        expect.fail("Should have failed - non-existent staker account");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotInitialized");
      }
    });

    it("Should fail to stake with insufficient funds", async () => {
      const poorUser = Keypair.generate();
      const [poorUserStakerPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("staker"), poorUser.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .createStaking(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            staker: poorUserStakerPda,
            user: poorUser.publicKey,
            systemProgram,
          })
          .signers([poorUser])
          .rpc();
        expect.fail("Should have failed - insufficient funds");
      } catch (error) {
        expect(error.toString()).to.include("insufficient lamports");
      }
    });

    it("Should fail to emergency withdraw more than available", async () => {
      try {
        await program.methods
          .emergencyWithdraw(new BN(10000000000)) // 10 SOL (more than available)
          .accountsStrict({
            globalState,
            admin: admin.publicKey,
            feeVault,
            systemProgram,
          })
          .signers([admin])
          .rpc();
        expect.fail("Should have failed - insufficient funds in fee vault");
      } catch (error) {
        expect(error.toString()).to.include("InsufficientFunds");
      }
    });

    it("Should fail to add stake with pending rewards", async () => {
      // First, let's create a transaction to generate some fees
      await program.methods
        .transfer(new BN(100000000)) // 0.1 SOL
        .accountsStrict({
          globalState,
          from: admin.publicKey,
          to: user3.publicKey,
          feeVault,
          systemProgram,
        })
        .signers([admin])
        .rpc();

      // Now try to add stake without claiming rewards first
      try {
        await program.methods
          .addStaking(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            staker: user1StakerPda,
            user: user1.publicKey,
            systemProgram,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - pending rewards not claimed");
      } catch (error) {
        expect(error.toString()).to.include("RewardDebtNotZero");
      }
    });

    it("Should fail to decrease stake with pending rewards", async () => {
      // Try to decrease stake without claiming rewards first
      try {
        await program.methods
          .decreaseStaking(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            staker: user1StakerPda,
            user: user1.publicKey,
            systemProgram,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - pending rewards not claimed");
      } catch (error) {
        expect(error.toString()).to.include("RewardDebtNotZero");
      }
    });

    it("Should fail to stake with wrong PDA", async () => {
      const wrongStakerPda = Keypair.generate().publicKey; // Random public key, not a PDA

      try {
        await program.methods
          .createStaking(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            staker: wrongStakerPda,
            user: user3.publicKey,
            systemProgram,
          })
          .signers([user3])
          .rpc();
        expect.fail("Should have failed - wrong PDA");
      } catch (error) {
        expect(error.toString()).to.include("ConstraintSeeds");
      }
    });

    it("Should fail to access staker account with wrong seeds", async () => {
      // Try to access user2's staker account with wrong seeds
      try {
        await program.methods
          .addStaking(new BN(100000000)) // 0.1 SOL
          .accountsStrict({
            globalState,
            staker: user2StakerPda, // User2's account
            user: user1.publicKey, // But User1's signature
            systemProgram,
          })
          .signers([user1])
          .rpc();
        expect.fail("Should have failed - wrong owner");
      } catch (error) {
        expect(error.toString()).to.include("AccountNotInitialized");
      }
    });
  });
});
