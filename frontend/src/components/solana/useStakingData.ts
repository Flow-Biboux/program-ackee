import { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getStakerPda, getGlobalStatePda, getProgram } from 'anchor_project'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

export function useStakingData() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [stakingData, setStakingData] = useState<{
    amount: number
    rewards: number
    exists: boolean
    totalStaked: number
    userPercentage: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate pending rewards using the same logic as the smart contract
  const calculatePendingRewards = (stakerAmount: number, rewardPerShare: number, rewardDebt: number): number => {
    if (stakerAmount === 0) {
      return 0
    }

    if (rewardPerShare <= rewardDebt) {
      return 0
    }

    const pending = BigInt(rewardPerShare - rewardDebt)
      * BigInt(stakerAmount)
      / BigInt(1_000_000_000_000)

    return Number(pending)
  }

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
      const globalState = getGlobalStatePda(connection, program)
      
      // Check if staking account exists
      const accountInfo = await connection.getAccountInfo(staker)
      if (!accountInfo) {
        setStakingData({ 
          amount: 0, 
          rewards: 0, 
          exists: false,
          totalStaked: 0,
          userPercentage: 0
        })
        return
      }

      // Fetch both staker and global state data
      const [stakerData, globalStateData] = await Promise.all([
        program.account.staker.fetch(staker),
        program.account.globalState.fetch(globalState)
      ])

      // Calculate pending rewards using the contract logic
      const pendingRewards = calculatePendingRewards(
        stakerData.amount.toNumber(),
        globalStateData.rewardPerShare.toNumber(),
        stakerData.rewardDebt.toNumber()
      )

      // Calculate total staked and user percentage
      const totalStaked = globalStateData.totalStaked.toNumber() / LAMPORTS_PER_SOL
      const userAmount = stakerData.amount.toNumber() / LAMPORTS_PER_SOL
      const userPercentage = totalStaked > 0 ? (userAmount / totalStaked) * 100 : 0

      setStakingData({
        amount: userAmount,
        rewards: pendingRewards / LAMPORTS_PER_SOL, // Convert from lamports to SOL
        exists: true,
        totalStaked,
        userPercentage
      })
    } catch (err) {
      console.error('Error fetching staking data:', err)
      setError('Failed to load staking data')
      setStakingData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStakingData()
  }, [connection, publicKey])

  return {
    stakingData,
    isLoading,
    error,
    refetch: fetchStakingData,
  }
}
