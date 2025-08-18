'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AppHero } from '@/components/app-hero'
import { emergencyWithdrawTx, updateAdminTx, updateFeeBasisPointsTx } from 'anchor_project'
import { useTransactionWithFeedback } from '../solana/useTransactionWithFeedback'
import { TransactionHashDisplay } from '../solana/TransactionHashDisplay'
import { useIsAdmin } from '../solana/useIsAdmin'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export function AdminFeature() {
  const [feeBps, setFeeBps] = useState('1000')
  const [newAdmin, setNewAdmin] = useState('')
  const [withdraw, setWithdraw] = useState('0.1')
  const { executeTransaction, txHash, isLoading, publicKey, connection, disabled } = useTransactionWithFeedback()
  const { isUserAdmin, isLoading: isAdminLoading } = useIsAdmin()

  // Show loading state while checking admin status
  if (isAdminLoading) {
    return (
      <div>
        <AppHero title="Admin" subtitle="Program administration" />
        <div className="max-w-xl mx-auto text-center py-8">
          <p>Checking admin permissions...</p>
        </div>
      </div>
    )
  }

  // Show access denied if user is not admin
  if (!isUserAdmin) {
    return (
      <div>
        <AppHero title="Admin" subtitle="Program administration" />
        <div className="max-w-xl mx-auto text-center py-8">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
            <p className="text-red-700">You do not have admin permissions for this program.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHero title="Admin" subtitle="Program administration" />
      <div className="max-w-xl mx-auto grid gap-4">
        <div className="grid grid-cols-3 gap-2 items-center">
          <label>Fee Basis Points</label>
          <Input className="col-span-2" value={feeBps} onChange={(e) => setFeeBps(e.target.value)} />
          <Button
            disabled={disabled || isLoading}
            onClick={() =>
              executeTransaction(
                () =>
                  updateFeeBasisPointsTx({
                    admin: publicKey!,
                    feeBasisPoints: parseInt(feeBps, 10),
                    connection,
                  }),
                'Update Fee',
              )
            }
          >
            {isLoading ? 'Updating...' : 'Update Fee'}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <label>New Admin</label>
          <Input className="col-span-2" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
          <Button
            disabled={disabled || isLoading}
            onClick={() =>
              executeTransaction(
                () =>
                  updateAdminTx({
                    admin: publicKey!,
                    newAdmin: new PublicKey(newAdmin),
                    connection,
                  }),
                'Update Admin',
              )
            }
          >
            {isLoading ? 'Updating...' : 'Update Admin'}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 items-center">
          <label>Emergency Withdraw (SOL)</label>
          <Input className="col-span-2" value={withdraw} onChange={(e) => setWithdraw(e.target.value)} />
          <Button
            variant="destructive"
            disabled={disabled || isLoading}
            onClick={() =>
              executeTransaction(
                () =>
                  emergencyWithdrawTx({
                    admin: publicKey!,
                    amount: parseFloat(withdraw) * LAMPORTS_PER_SOL,
                    connection,
                  }),
                'Emergency Withdraw',
              )
            }
          >
            {isLoading ? 'Withdrawing...' : 'Withdraw'}
          </Button>
        </div>

        <TransactionHashDisplay txHash={txHash} />
      </div>
    </div>
  )
}
