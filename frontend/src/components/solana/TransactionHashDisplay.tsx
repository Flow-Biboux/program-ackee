interface TransactionHashDisplayProps {
  txHash: string | null
  className?: string
}

export function TransactionHashDisplay({ txHash, className = "" }: TransactionHashDisplayProps) {
  if (!txHash) return null

  return (
    <div className={`mt-4 p-3 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <p className="text-sm text-green-800 mb-2">Transaction completed successfully!</p>
      <a
        href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
      >
        View on Solana Explorer: {txHash}
      </a>
    </div>
  )
}
