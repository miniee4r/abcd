interface HeaderProps {
  location: string
  onRefresh: () => void
  loading: boolean
}

export default function Header({ location, onRefresh, loading }: HeaderProps) {
  return (
    <header
      style={{
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        padding: '0 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* SVG wind vane logo */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="#3b82f6" strokeWidth="1.5" />
            <path d="M14 4 L18 14 L14 12 L10 14 Z" fill="#3b82f6" />
            <path d="M14 24 L10 14 L14 16 L18 14 Z" fill="#3b82f640" />
            <circle cx="14" cy="14" r="2" fill="#3b82f6" />
          </svg>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>AeroVane</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              AIR QUALITY ASSISTANT
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            📍 {location}
          </span>
          <button
            onClick={onRefresh}
            className="btn btn-ghost"
            aria-label="Refresh air quality data"
            disabled={loading}
            style={{ padding: '0.375rem 0.75rem' }}
          >
            {loading ? '⟳ Loading…' : '⟳ Refresh'}
          </button>
        </div>
      </div>
    </header>
  )
}
