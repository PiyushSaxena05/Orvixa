function Header() {
  return (
    <header className="border-b border-border-soft bg-ink/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">

        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8">
            <svg width="32" height="32" viewBox="0 0 32 32" className="text-accent">
              <path
                d="M16 3 L27 8 V16 C27 22.5 22.5 27.5 16 29 C9.5 27.5 5 22.5 5 16 V8 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M11 16 L14.5 19.5 L21 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-display font-semibold text-xl text-text-primary tracking-tight">
              Orvixa
            </span>
            <span className="hidden sm:inline font-mono text-[10px] text-text-muted uppercase tracking-[0.2em]">
              Verified Payments
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-border-soft bg-surface px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="text-xs text-text-muted">
            <span className="text-accent font-medium">Live</span> · Signature engine active
          </span>
        </div>

      </div>
    </header>
  )
}

export default Header
