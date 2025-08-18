'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHero } from '@/components/app-hero'
import { createStakingTx, addStakingTx, decreaseStakingTx, closeStakingTx, claimRewardsTx } from 'anchor_project'
import { useTransactionWithFeedback } from '../solana/useTransactionWithFeedback'
import { useStakingData } from '../solana/useStakingData'
import { TransactionHashDisplay } from '../solana/TransactionHashDisplay'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export function StakingFeature() {
  const [amount, setAmount] = useState('1')
  const { executeTransaction, txHash, isLoading, publicKey, connection, disabled } = useTransactionWithFeedback()
  const { stakingData, isLoading: isLoadingStaking, error: stakingError } = useStakingData()

  return (
    <div>
      <AppHero title="Staking" subtitle="Create, add, decrease, close and claim" />
      <div className="max-w-xl mx-auto grid gap-3">
        {/* Staking Data Display */}
        {isLoadingStaking ? (
          <div className="text-sm text-gray-600">Loading staking data...</div>
        ) : stakingError ? (
          <div className="text-sm text-red-600">{stakingError}</div>
        ) : stakingData ? (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">
              <div className="font-semibold mb-2">Your Staking Status:</div>
              <div>Staked Amount: {stakingData.amount.toFixed(4)} SOL</div>
              <div>Available Rewards: {stakingData.rewards.toFixed(4)} SOL</div>
              <div>Account Status: {stakingData.exists ? 'Active' : 'Not Created'}</div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="col-span-1">Amount (SOL)</label>
          <Input className="col-span-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={disabled || isLoading}
            onClick={() =>
              executeTransaction(
                () =>
                  createStakingTx({
                    user: publicKey!,
                    amount: parseFloat(amount) * LAMPORTS_PER_SOL,
                    connection,
                  }),
                'Create Staking',
              )
            }
          >
            {isLoading ? 'Creating...' : 'Create Staking'}
          </Button>
          <Button
            disabled={disabled || isLoading}
            onClick={() =>
              executeTransaction(
                () =>
                  addStakingTx({
                    user: publicKey!,
                    amount: parseFloat(amount) * LAMPORTS_PER_SOL,
                    connection,
                  }),
                'Add Stake',
              )
            }
          >
            {isLoading ? 'Adding...' : 'Add Stake'}
          </Button>
          <Button
            disabled={disabled || isLoading}
            onClick={() =>
              executeTransaction(
                () =>
                  decreaseStakingTx({
                    user: publicKey!,
                    amount: parseFloat(amount) * LAMPORTS_PER_SOL,
                    connection,
                  }),
                'Decrease Stake',
              )
            }
          >
            {isLoading ? 'Decreasing...' : 'Decrease Stake'}
          </Button>
          <Button
            disabled={disabled || isLoading}
            onClick={() => executeTransaction(() => claimRewardsTx({ user: publicKey!, connection }), 'Claim Rewards')}
          >
            {isLoading ? 'Claiming...' : 'Claim Rewards'}
          </Button>
          <Button
            variant="destructive"
            disabled={disabled || isLoading}
            onClick={() => executeTransaction(() => closeStakingTx({ user: publicKey!, connection }), 'Close Staking')}
          >
            {isLoading ? 'Closing...' : 'Close Staking'}
          </Button>
        </div>

        <TransactionHashDisplay txHash={txHash} />
      </div>
    </div>
  )
}
