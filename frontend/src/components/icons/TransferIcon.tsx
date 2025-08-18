import { ArrowRightLeft, Send, ArrowUpDown } from 'lucide-react'

// Simple transfer icon using ArrowRightLeft
export function TransferIcon({ className = "w-6 h-6" }: { className?: string }) {
  return <ArrowRightLeft className={className} />
}

// Send money icon
export function SendMoneyIcon({ className = "w-6 h-6" }: { className?: string }) {
  return <Send className={className} />
}

// Up/down transfer icon
export function UpDownTransferIcon({ className = "w-6 h-6" }: { className?: string }) {
  return <ArrowUpDown className={className} />
}
