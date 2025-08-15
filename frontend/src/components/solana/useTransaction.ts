// frontend/src/components/solana/use-transaction.ts
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react' 


export function useTransaction() {
  const { publicKey, signTransaction, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const signAndSend = async (tx: Transaction) => {
    if (!publicKey) throw new Error('Wallet not connected')
    console.log('connection', connection)

    tx.feePayer = publicKey
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

let simu = await connection.simulateTransaction(tx)
console.log('simu', simu.value)
console.log('tx', tx)
    // const signed = await signTransaction!(tx)
    const signature = await sendTransaction(tx, connection)
    await connection.confirmTransaction(signature)

    return signature
  }

  return { signAndSend, publicKey, connection }
}
