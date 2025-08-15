'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHero } from '@/components/app-hero'
import { emergencyWithdrawTx, updateAdminTx, updateFeeBasisPointsTx } from 'anchor_project'
import { useTransaction } from '../solana/useTransaction'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export function AdminFeature() {
  const { signAndSend, publicKey, connection } = useTransaction()
  const [feeBps, setFeeBps] = useState('1000')
  const [newAdmin, setNewAdmin] = useState('')
  const [withdraw, setWithdraw] = useState('0.1')

  const disabled = !publicKey

  return (
    <div>
      <AppHero title="Admin" subtitle="Program administration" />
      <div className="max-w-xl mx-auto grid gap-4">
        <div className="grid grid-cols-3 gap-2 items-center">
          <label>Fee Basis Points</label>
          <Input className="col-span-2" value={feeBps} onChange={(e) => setFeeBps(e.target.value)} />
          <Button
            disabled={disabled}
            onClick={async () => {
              const tx = await updateFeeBasisPointsTx({
                admin: publicKey!,
                feeBasisPoints: parseInt(feeBps, 10),
                connection,
              })
              await signAndSend(tx) // No connection parameter needed
            }}
          >
            Update Fee
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <label>New Admin</label>
          <Input className="col-span-2" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
          <Button
            disabled={disabled}
            onClick={async () => {
              const tx = await updateAdminTx({ 
                admin: publicKey!, 
                newAdmin: new PublicKey(newAdmin), 
                connection 
              })
              await signAndSend(tx) // No connection parameter needed
            }}
          >
            Update Admin
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <label>Emergency Withdraw (SOL)</label>
          <Input className="col-span-2" value={withdraw} onChange={(e) => setWithdraw(e.target.value)} />
          <Button
            variant="destructive"
            disabled={disabled}
            onClick={async () => {
              const tx = await emergencyWithdrawTx({
                admin: publicKey!,
                amount: parseFloat(withdraw) * LAMPORTS_PER_SOL,
                connection,
              })
              await signAndSend(tx) // No connection parameter needed
            }}
          >
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  )
}