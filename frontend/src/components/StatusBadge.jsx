const statusStyles = {
  SUCCESS: 'bg-success/10 text-success border-success/30',
  FAILED: 'bg-danger/10 text-danger border-danger/30',
  FLAGGED: 'bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30',
  CREATED: 'bg-text-muted/10 text-text-muted border-text-muted/30',
}

function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.CREATED

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-mono uppercase tracking-wider ${style}`}>
      {status}
    </span>
  )
}

export default StatusBadge
