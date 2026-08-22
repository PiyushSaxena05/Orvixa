import StatusBadge from './StatusBadge'

function TransactionCard({ transaction }) {
  const amount = (transaction.amountInPaise / 100).toFixed(2)
  const isFlagged = transaction.status === 'FLAGGED'
  const isFailed = transaction.status === 'FAILED'

  const date = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="border border-border-soft rounded-xl p-5 bg-surface hover:border-accent/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-lg text-text-primary font-medium">
          ₹{amount}
        </span>
        <StatusBadge status={transaction.status} />
      </div>

      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-text-muted truncate">
          {transaction.razorpayOrderId}
        </p>
        {date && <p className="font-mono text-[11px] text-text-muted shrink-0 ml-2">{date}</p>}
      </div>

      {isFlagged && transaction.fraudExplanation && (
        <div className="mt-4 pt-4 border-t border-border-soft flex gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" className="text-accent-secondary shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <p className="text-sm text-text-muted leading-relaxed">
            {transaction.fraudExplanation}
          </p>
        </div>
      )}

      {isFailed && transaction.retrySuggestion && (
        <div className="mt-4 pt-4 border-t border-border-soft flex gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" className="text-danger shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 8v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
          <p className="text-sm text-text-muted leading-relaxed">
            {transaction.retrySuggestion}
          </p>
        </div>
      )}
    </div>
  )
}

export default TransactionCard
