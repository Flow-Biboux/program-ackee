import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { isAdmin } from 'anchor_project'

export function useIsAdmin() {
  const { publicKey } = useWallet()
  const [isUserAdmin, setIsUserAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!publicKey) {
        setIsUserAdmin(false)
        return
      }

      setIsLoading(true)
      try {
        const adminStatus = await isAdmin(publicKey.toBase58())
        setIsUserAdmin(adminStatus)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsUserAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [publicKey])

  return { isUserAdmin, isLoading }
}
