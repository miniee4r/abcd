import { useState } from 'react'
import type { FamilyPersona, PersonaScore } from '../api/types'

interface Props {
  persona: FamilyPersona
  score: PersonaScore
  onChange: (p: FamilyPersona) => void
}

const riskColors = {
  low: 'var(--good)',
  moderate: 'var(--moderate)',
  high: '#f97316',
  critical: 'var(--unhealthy)',
}

export default function PersonaSetup({ persona, score, onChange }: Props) {
  const [open, setOpen] = useState(false)

  function toggle<K extends keyof FamilyPersona>(key: K, value: FamilyPersona[K]) {
    onChange({ ...persona, [key]: value })
  }

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div>
          <h2 style={{ margin: 0 }}>Family Profile</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Vulnerability: <strong style={{ color: riskColors[score.riskLevel] }}>{score.riskLevel.toUpperCase()} ({score.vulnerabilityIndex}/100)</strong>
          </p>
        </div>
        <button
          className="btn btn-ghost"
          aria-expanded={open}
          aria-controls="persona-panel"
          aria-label={open ? 'Collapse family profile' : 'Edit family profile'}
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        >
          {open ? '▲ Collapse' : '▼ Edit Profile'}
        </button>
      </div>

      {open && (
        <div id="persona-panel" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend className="label" style={{ marginBottom: '0.5rem' }}>Household members</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {([
                ['hasInfants', 'Infants (< 2 yrs)'],
                ['hasChildren', 'Children (2–17)'],
                ['hasElderly', 'Elderly (60+)'],
              ] as const).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={persona[key]}
                    onChange={(e) => toggle(key, e.target.checked as FamilyPersona[typeof key])}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend className="label" style={{ marginBottom: '0.5rem' }}>Health conditions</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {([
                ['hasAsthma', 'Asthma'],
                ['hasCOPD', 'COPD'],
                ['hasCardioDisease', 'Heart disease'],
              ] as const).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={persona[key]}
                    onChange={(e) => toggle(key, e.target.checked as FamilyPersona[typeof key])}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <fieldset style={{ border: 'none', padding: 0 }}>
              <legend className="label" style={{ marginBottom: '0.25rem' }}>Housing type</legend>
              <select
                value={persona.housingType}
                onChange={(e) => toggle('housingType', e.target.value as 'apartment' | 'house')}
                style={{ background: 'var(--bg-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.5rem', fontFamily: 'var(--font)' }}
                aria-label="Housing type"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
              </select>
            </fieldset>

            {persona.housingType === 'apartment' && (
              <fieldset style={{ border: 'none', padding: 0 }}>
                <legend className="label" style={{ marginBottom: '0.25rem' }}>Floor level</legend>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={persona.floorLevel}
                  onChange={(e) => toggle('floorLevel', Number(e.target.value))}
                  style={{ width: 70, background: 'var(--bg-2)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.5rem', fontFamily: 'var(--mono)' }}
                  aria-label="Floor level number"
                />
              </fieldset>
            )}
          </div>

          {score.primaryRisks.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <p className="label" style={{ marginBottom: '0.25rem' }}>Active risk factors</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {score.primaryRisks.map((r) => (
                  <span key={r} style={{ fontSize: '0.75rem', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20, padding: '0.2rem 0.6rem' }}>{r}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
