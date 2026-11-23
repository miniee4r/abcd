import type { AqiReading } from '../api/types'
import { categorizeUsAqi, aqiColor } from '../api/airQuality'

interface Props {
  readings: AqiReading[]
  loading: boolean
}

function Stat({ label, value, unit, color }: {
  label: string; value: string | number; unit?: string; color?: string
}) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <p className="label">{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 700, color: color ?? 'var(--text-primary)', margin: '0.25rem 0' }}>
        {value}
        {unit && <span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>{unit}</span>}
      </p>
    </div>
  )
}

export default function TelemetryDashboard({ readings, loading }: Props) {
  if (loading) {
    return (
      <section aria-label="Air quality loading" aria-busy="true">
        <div className="grid-3" style={{ marginBottom: '1rem' }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
      </section>
    )
  }

  if (readings.length === 0) return null

  const current = readings[0]
  const category = categorizeUsAqi(current.usAqi)
  const color = aqiColor(category)

  // 24-hour forecast for sparkline
  const forecast = readings.slice(0, 24)

  return (
    <section aria-label="Current air quality">
      {/* AQI badge */}
      <div
        style={{
          background: `${color}18`,
          border: `1px solid ${color}40`,
          borderRadius: 'var(--radius)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="label">US Air Quality Index</p>
          <p style={{ fontSize: '3.5rem', fontWeight: 800, color, lineHeight: 1 }}>
            {current.usAqi}
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color, marginTop: 4 }}>{category}</p>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {getCategoryAdvice(category)}
          </p>
        </div>
      </div>

      {/* Pollutant stats */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <Stat label="PM2.5" value={current.pm2_5} unit="μg/m³" />
        <Stat label="PM10" value={current.pm10} unit="μg/m³" />
        <Stat label="NO₂" value={current.no2.toFixed(1)} unit="μg/m³" />
        <Stat label="SO₂" value={current.so2.toFixed(1)} unit="μg/m³" />
        <Stat label="CO" value={current.co.toFixed(0)} unit="μg/m³" />
        <Stat label="European AQI" value={current.euAqi} />
      </div>

      {/* 24h forecast */}
      <div className="card" aria-label="24-hour AQI forecast">
        <h2>24-Hour Forecast</h2>
        <div
          style={{
            display: 'flex',
            gap: 3,
            alignItems: 'flex-end',
            height: 80,
            overflow: 'hidden',
          }}
          role="img"
          aria-label={`AQI forecast: min ${Math.min(...forecast.map(r => r.usAqi))}, max ${Math.max(...forecast.map(r => r.usAqi))}`}
        >
          {forecast.map((r, i) => {
            const h = Math.min(100, (r.usAqi / 400) * 100)
            const c = aqiColor(categorizeUsAqi(r.usAqi))
            const hour = new Date(r.time).getHours()
            return (
              <div
                key={i}
                title={`${hour}:00 — AQI ${r.usAqi}`}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: c,
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.85,
                  minWidth: 6,
                  transition: 'opacity 0.15s',
                }}
              />
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <span>Now</span><span>+12h</span><span>+24h</span>
        </div>
      </div>
    </section>
  )
}

function getCategoryAdvice(category: string): string {
  switch (category) {
    case 'Good': return 'Air quality is satisfactory. Outdoor activities are safe for everyone.'
    case 'Moderate': return 'Sensitive individuals may experience mild effects. Most can enjoy outdoor activities.'
    case 'Unhealthy for Sensitive Groups': return 'Children, elderly, and those with respiratory issues should limit prolonged outdoor exertion.'
    case 'Unhealthy': return 'Everyone may experience health effects. Sensitive groups should avoid outdoor activities.'
    case 'Very Unhealthy': return 'Health alert! Everyone should avoid prolonged outdoor exposure. Run your air purifier.'
    case 'Hazardous': return 'Emergency conditions. Stay indoors with windows closed. Seek medical attention for symptoms.'
    default: return 'Monitor conditions closely.'
  }
}
