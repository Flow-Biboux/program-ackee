import { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { getGlobalStatePda, getProgram } from 'anchor_project'

export function useGlobalState() {
  const { connection } = useConnection()
  const [feeBasisPoints, setFeeBasisPoints] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGlobalState = async () => {
      if (!connection) return
      
      setIsLoading(true)
      setError(null)
      try {
        const program = getProgram(connection)
        const globalState = getGlobalStatePda(connection, program)
        const globalStateData = await program.account.globalState.fetch(globalState)
        setFeeBasisPoints(globalStateData.feeBasisPoints)
      } catch (err) {
        console.error('Error fetching global state:', err)
        setError('Failed to load global state')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGlobalState()
  }, [connection])

  const calculateFee = (amount: number) => {
    if (!feeBasisPoints) return 0
    return (amount * feeBasisPoints) / 10000 // Convert basis points to percentage
  }

  return {
    feeBasisPoints,
    isLoading,
    error,
    calculateFee
  }
}
