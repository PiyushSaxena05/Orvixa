import StatusBadge from './StatusBadge'

function TransactionCard({ transaction }) {
  const amount = (transaction.amountInPaise / 100).toFixed(2)
  const isFlagged = transaction.status === 'FLAGGED'

  return (
    <div className="border border-border-soft rounded-xl p-5 bg-surface">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-lg text-text-primary">
          ₹{amount}
        </span>
        <StatusBadge status={transaction.status} />
      </div>

      <p className="font-mono text-xs text-text-muted truncate">
        {transaction.razorpayOrderId}
      </p>

      {isFlagged && transaction.fraudExplanation && (
        <div className="mt-4 pt-4 border-t border-border-soft flex gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" className="text-brass shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <p className="text-sm text-text-muted leading-relaxed">
            {transaction.fraudExplanation}
          </p>
        </div>
      )}
    </div>
  )
}

export default TransactionCard