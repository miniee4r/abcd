import type { DailyRoutine, PersonaScore } from '../api/types'
import { aqiColor, categorizeUsAqi } from '../api/airQuality'

interface Props {
  routine: DailyRoutine
  personaScore: PersonaScore
}

export default function RoutinePlanner({ routine, personaScore }: Props) {
  return (
    <section aria-label="Daily routine optimizer">
      {/* Commute advice */}
      <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg-2)', borderColor: 'var(--accent)40' }}>
        <h2>🚗 Commute Advice</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{routine.commuteAdvice}</p>
      </div>

      <div className="grid-2">
        {/* Safe windows */}
        <div>
          <h2 style={{ color: 'var(--good)', marginBottom: '0.75rem' }}>
            ✓ Safe Windows ({routine.safeWindows.length}h)
          </h2>
          {routine.safeWindows.length === 0 ? (
            <div className="card">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No safe outdoor windows today based on your family's risk profile. Stay indoors.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {routine.safeWindows.slice(0, 8).map((slot) => (
                <SlotCard key={slot.hour} slot={slot} safe />
              ))}
            </div>
          )}
        </div>

        {/* Avoid windows */}
        <div>
          <h2 style={{ color: 'var(--unhealthy)', marginBottom: '0.75rem' }}>
            ✗ Avoid Outdoors ({routine.avoidWindows.length}h)
          </h2>
          {routine.avoidWindows.length === 0 ? (
            <div className="card">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>All hours are within safe thresholds. Enjoy outdoor time!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {routine.avoidWindows.slice(0, 8).map((slot) => (
                <SlotCard key={slot.hour} slot={slot} safe={false} />
              ))}
            </div>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
        * Thresholds adjusted for your family's vulnerability level ({personaScore.riskLevel}). Consult a doctor for medical advice.
      </p>
    </section>
  )
}

function SlotCard({ slot }: { slot: { label: string; activity: string; safetyNote: string; usAqi: number }; safe: boolean }) {
  const color = aqiColor(categorizeUsAqi(slot.usAqi))
  return (
    <div
      className="card"
      style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${color}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', fontWeight: 500 }}>{slot.label}</span>
        <span style={{ fontSize: '0.75rem', color }}>AQI {slot.usAqi}</span>
      </div>
      <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: '2px 0' }}>{slot.activity}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{slot.safetyNote}</p>
    </div>
  )
}
