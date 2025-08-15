'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHero } from '@/components/app-hero'
// import { useWalletUi } from '@wallet-ui/react'
import { createStakingTx, addStakingTx, decreaseStakingTx, closeStakingTx, claimRewardsTx } from 'anchor_project'
// import { useWalletTransactionSignAndSend } from '@/components/solana/use-wallet-transaction-sign-and-send'
import { useTransaction } from '../solana/useTransaction'
// import { connection } from 'next/dist/server/request/connection'
// import { connection } from '../solana/solana-provider'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export function StakingFeature() {
  // const { client, wallet, cluster } = useWalletUi()
  const [amount, setAmount] = useState('1')
  const { signAndSend, publicKey ,connection} = useTransaction()
  
  const disabled = !publicKey

  return (
    <div>
      <AppHero title="Staking" subtitle="Create, add, decrease, close and claim" />
      <div className="max-w-xl mx-auto grid gap-3">
        <div className="grid grid-cols-3 gap-2 items-center">
          <label className="col-span-1">Amount (SOL)</label>
          <Input className="col-span-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={disabled}
            onClick={async () => {
              const tx = await createStakingTx({
                user: publicKey!,
                amount: parseFloat(amount) * LAMPORTS_PER_SOL,
                connection,
              })
              // let res = await client.sendAndConfirmTransaction(tx)
              // console.log(res)
              await signAndSend(tx, connection)
            }}
          >
            Create Staking
          </Button>
          <Button
            disabled={disabled}
            onClick={async () => {
              const tx = await addStakingTx({
                user: publicKey!,
                amount: parseFloat(amount) * LAMPORTS_PER_SOL,
                connection,
              })
              await signAndSend(tx, connection)
            }}
          >
            Add Stake
          </Button>
          <Button
            disabled={disabled}
            onClick={async () => {
              const tx = await decreaseStakingTx({
                user: publicKey!,
                amount: parseFloat(amount) * LAMPORTS_PER_SOL,
                connection,
              })
              await signAndSend(tx, connection)
            }}
          >
            Decrease Stake
          </Button>
          <Button
            disabled={disabled}
            onClick={async () => {
              const tx = await claimRewardsTx({ user: publicKey!, connection })
              await signAndSend(tx, connection)
            }}
          >
            Claim Rewards
          </Button>
          <Button
            variant="destructive"
            disabled={disabled}
            onClick={async () => {
              const tx = await closeStakingTx({ user: publicKey!, connection })
              await signAndSend(tx, connection)
            }}
          >
            Close Staking
          </Button>
        </div>
      </div>
    </div>
  )
}
