import { useState } from 'react'
import { IAQ_HACKS, calculateRequiredCadr } from '../core/iaqPlaybook'

export default function IaqHacksGrid() {
  const [roomL, setRoomL] = useState(5)
  const [roomW, setRoomW] = useState(4)
  const [roomH, setRoomH] = useState(2.7)

  const { cadrM3h, boxFanCount } = calculateRequiredCadr(roomL, roomW, roomH)

  return (
    <section aria-label="Indoor air quality improvements">
      {/* Corsi-Rosenthal Calculator */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>🔧 DIY Air Cleaner Calculator</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          A Corsi-Rosenthal box fan filter delivers 400–600 m³/h CADR for ~₹2,000. Enter your room size:
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1rem' }}>
          {([
            ['Length (m)', roomL, setRoomL],
            ['Width (m)', roomW, setRoomW],
            ['Ceiling Height (m)', roomH, setRoomH],
          ] as const).map(([label, value, setter]) => (
            <label key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {label}
              <input
                type="number"
                min={1}
                max={30}
                step={0.1}
                value={value}
                onChange={(e) => setter(parseFloat(e.target.value) || 1)}
                style={{ width: 90, background: 'var(--bg-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.5rem', fontFamily: 'var(--mono)' }}
                aria-label={label}
              />
            </label>
          ))}
        </div>
        <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem' }}>
          <p>Required CADR: <strong>{cadrM3h} m³/h</strong></p>
          <p>Recommended DIY box fans: <strong>{boxFanCount} Corsi-Rosenthal unit{boxFanCount > 1 ? 's' : ''}</strong></p>
        </div>
      </div>

      {/* Hacks grid */}
      <h2>Indoor Air Quality Hacks</h2>
      <div className="grid-2">
        {IAQ_HACKS.map((hack) => (
          <div key={hack.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '0.95rem', maxWidth: '80%' }}>{hack.title}</h3>
              <CostBadge tier={hack.costTier} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{hack.description}</p>
            {hack.cadrBoost > 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent)' }}>
                +{hack.cadrBoost} m³/h CADR boost
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function CostBadge({ tier }: { tier: 'free' | 'low' | 'medium' }) {
  const map = { free: ['Free', '#22c55e'], low: ['Low cost', '#eab308'], medium: ['Medium cost', '#f97316'] } as const
  const [label, color] = map[tier]
  return (
    <span style={{ fontSize: '0.7rem', background: `${color}22`, color, border: `1px solid ${color}40`, borderRadius: 20, padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}
