function Header() {
  return (
    <header className="border-b border-border-soft bg-ink/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">

        <div className="flex items-baseline gap-3">
          <span className="font-display text-2xl text-text-primary tracking-tight">
            Orvixa
          </span>
          <span className="font-mono text-[11px] text-text-muted uppercase tracking-widest">
            Verified Payments
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" className="text-brass">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-xs text-text-muted">Signature engine active</span>
        </div>

      </div>
    </header>
  )
}

export default Header