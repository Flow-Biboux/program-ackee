'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHero } from '@/components/app-hero'
import { transferTx } from 'anchor_project'
import { useTransactionWithFeedback } from '../solana/useTransactionWithFeedback'
import { useGlobalState } from '../solana/useGlobalState'
import { TransactionHashDisplay } from '../solana/TransactionHashDisplay'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export function TransferFeature() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('0.1')
  const { feeBasisPoints, isLoading: isLoadingFee, error: feeError, calculateFee } = useGlobalState()
  const { executeTransaction, txHash, isLoading, publicKey, connection, disabled } = useTransactionWithFeedback()

  const transferAmount = parseFloat(amount) || 0
  const fee = calculateFee(transferAmount)
  const totalAmount = transferAmount + fee

  return (
    <div>
      <AppHero title="Transfer" subtitle="Send a fee-charged transfer via program" />
      <div className="max-w-xl mx-auto grid gap-3">
        <Input placeholder="Destination" value={to} onChange={(e) => setTo(e.target.value)} />
        <Input placeholder="Amount (SOL)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        
        {/* Fee Display */}
        {isLoadingFee ? (
          <div className="text-sm text-gray-600">Loading fee...</div>
        ) : feeError ? (
          <div className="text-sm text-red-600">{feeError}</div>
        ) : feeBasisPoints !== null ? (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <div>Transfer Amount: {transferAmount} SOL</div>
              <div>Fee ({feeBasisPoints / 100}%): {fee.toFixed(4)} SOL</div>
              <div className="font-semibold">Total: {totalAmount.toFixed(4)} SOL</div>
            </div>
          </div>
        ) : null}

        <Button
          disabled={disabled || isLoading || isLoadingFee}
          onClick={() =>
            executeTransaction(
              () =>
                transferTx({
                  from: publicKey!,
                  to: new PublicKey(to),
                  amount: transferAmount * LAMPORTS_PER_SOL,
                  connection,
                }),
              'Transfer',
            )
          }
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>

        <TransactionHashDisplay txHash={txHash} />
      </div>
    </div>
  )
}
