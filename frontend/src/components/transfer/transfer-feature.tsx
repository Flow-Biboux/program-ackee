'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHero } from '@/components/app-hero'
import { transferTx } from 'anchor_project'
import { useTransactionWithFeedback } from '../solana/useTransactionWithFeedback'
import { TransactionHashDisplay } from '../solana/TransactionHashDisplay'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export function TransferFeature() {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('0.1')
  const { executeTransaction, txHash, isLoading, publicKey, connection, disabled } = useTransactionWithFeedback()

  return (
    <div>
      <AppHero title="Transfer" subtitle="Send a fee-charged transfer via program" />
      <div className="max-w-xl mx-auto grid gap-3">
        <Input placeholder="Destination" value={to} onChange={(e) => setTo(e.target.value)} />
        <Input placeholder="Amount (SOL)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button
          disabled={disabled || isLoading}
          onClick={() =>
            executeTransaction(
              () =>
                transferTx({
                  from: publicKey!,
                  to: new PublicKey(to),
                  amount: parseFloat(amount) * LAMPORTS_PER_SOL,
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
