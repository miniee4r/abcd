import { useState, useEffect, useRef } from 'react'
import { POPULAR_CITIES, searchGlobalCities } from '../api/airQuality'

interface HeaderProps {
  location: string
  onRefresh: () => void
  onSelectCity: (city: { name: string; lat: number; lon: number }) => void
  onUseGps: () => void
  loading: boolean
}

export default function Header({
  location,
  onRefresh,
  onSelectCity,
  onUseGps,
  loading,
}: HeaderProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ name: string; country: string; admin1?: string; lat: number; lon: number }>>([])
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await searchGlobalCities(query)
      setResults(res)
      setSearching(false)
      setShowDropdown(true)
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      style={{
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="13" stroke="#3b82f6" strokeWidth="1.5" />
              <path d="M14 4 L18 14 L14 12 L10 14 Z" fill="#3b82f6" />
              <path d="M14 24 L10 14 L14 16 L18 14 Z" fill="#3b82f640" />
              <circle cx="14" cy="14" r="2" fill="#3b82f6" />
            </svg>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.2 }}>AeroVane</h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                GLOBAL WINTER SMOG & AIR QUALITY ASSISTANT
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, background: 'var(--bg-2)', padding: '0.3rem 0.75rem', borderRadius: 20, border: '1px solid var(--border)' }}>
              📍 {location}
            </span>
            <button
              onClick={onUseGps}
              className="btn btn-ghost"
              aria-label="Detect my GPS location"
              disabled={loading}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              🎯 My Location
            </button>
            <button
              onClick={onRefresh}
              className="btn btn-ghost"
              aria-label="Refresh air quality data"
              disabled={loading}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {loading ? '⟳ Loading…' : '⟳ Refresh'}
            </button>
          </div>
        </div>

        {/* Global city search & quick picks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', position: 'relative' }} ref={dropdownRef}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              placeholder="🔍 Search any city in the world (e.g. London, Beijing, Chicago)..."
              aria-label="Search city anywhere in the world"
              style={{
                width: '100%',
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.75rem',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font)',
                fontSize: '0.85rem',
              }}
            />
            {searching && (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Searching…
              </span>
            )}

            {/* Autocomplete Dropdown */}
            {showDropdown && results.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  zIndex: 100,
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {results.map((city, idx) => (
                  <button
                    key={`${city.lat}-${city.lon}-${idx}`}
                    onClick={() => {
                      onSelectCity({ name: `${city.name}, ${city.country}`, lat: city.lat, lon: city.lon })
                      setShowDropdown(false)
                      setQuery('')
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      padding: '0.5rem 0.75rem',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span><strong>{city.name}</strong>{city.admin1 ? `, ${city.admin1}` : ''}, {city.country}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{city.lat.toFixed(2)}, {city.lon.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick city pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick picks:</span>
            {POPULAR_CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => onSelectCity({ name: `${c.name}, ${c.country}`, lat: c.lat, lon: c.lon })}
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 14 }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
