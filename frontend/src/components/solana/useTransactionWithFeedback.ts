import { useState } from 'react'
import { useTransaction } from './useTransaction'

export function useTransactionWithFeedback() {
  const { signAndSend, publicKey, connection } = useTransaction()
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const executeTransaction = async (txBuilder: () => Promise<any>, actionName: string) => {
    setIsLoading(true)
    setTxHash(null)
    try {
      const tx = await txBuilder()
      const hash = await signAndSend(tx)
      setTxHash(hash)
      return hash
    } catch (error) {
      console.error(`${actionName} failed:`, error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearHash = () => setTxHash(null)

  return {
    executeTransaction,
    txHash,
    isLoading,
    clearHash,
    publicKey,
    connection,
    disabled: !publicKey
  }
}
