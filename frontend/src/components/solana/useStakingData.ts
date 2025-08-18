import { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getStakerPda, getProgram } from 'anchor_project'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export function useStakingData() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [stakingData, setStakingData] = useState<{
    amount: number
    rewards: number
    exists: boolean
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStakingData = async () => {
      if (!connection || !publicKey) {
        setStakingData(null)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        const program = getProgram(connection)
        const staker = getStakerPda(publicKey, connection, program)

        // Check if staking account exists
        const accountInfo = await connection.getAccountInfo(staker)
        if (!accountInfo) {
          setStakingData({ amount: 0, rewards: 0, exists: false })
          return
        }

        // Fetch staking data
        const stakerData = await program.account.staker.fetch(staker)
        setStakingData({
          amount: stakerData.amount.toNumber() / LAMPORTS_PER_SOL, // Convert from lamports to SOL
          rewards: stakerData.rewardDebt.toNumber() / LAMPORTS_PER_SOL, // Convert from lamports to SOL
          exists: true,
        })
      } catch (err) {
        console.error('Error fetching staking data:', err)
        setError('Failed to load staking data')
        setStakingData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStakingData()
  }, [connection, publicKey])

  return {
    stakingData,
    isLoading,
    error,
  }
}
