import type { ImpactMetrics as Metrics } from '../api/types'

interface Props { metrics: Metrics }

export default function ImpactMetrics({ metrics }: Props) {
  return (
    <section aria-label="Your health and environmental impact">
      <h2>Your Impact Today</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Based on your optimized routine vs. an unoptimized day at current AQI levels.
      </p>
      <div className="grid-2">
        <MetricCard
          icon="🫁"
          label="PM2.5 Exposure Saved"
          value={`${metrics.pm25ExposureReductionUgh}`}
          unit="μg/m³·h"
          detail="Less fine particle exposure today compared to an unoptimized routine."
          color="#3b82f6"
        />
        <MetricCard
          icon="🌱"
          label="CO₂e Emissions Saved"
          value={`${metrics.co2eSavedKgPerDay}`}
          unit="kg today"
          detail="From choosing low-emission transport and alternatives."
          color="#22c55e"
        />
        <MetricCard
          icon="❤️"
          label="Health Risk Reduction"
          value={`${metrics.healthRiskDeltaPercent}%`}
          unit=""
          detail="Estimated cardiovascular/respiratory risk reduction based on EPA exposure-response functions."
          color="#f97316"
        />
        <MetricCard
          icon="✅"
          label="Activities Optimized"
          value={`${metrics.activitiesOptimized}`}
          unit="today"
          detail="Outdoor windows scheduled within your safe AQI threshold."
          color="#8b5cf6"
        />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem', lineHeight: 1.5 }}>
        Disclaimer: Health impact estimates are educational and based on EPA linear exposure-response models.
        They are not medical advice. Consult a healthcare professional for personalized guidance.
      </p>
    </section>
  )
}

function MetricCard({ icon, label, value, unit, detail, color }: {
  icon: string; label: string; value: string; unit: string; detail: string; color: string
}) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1.4rem' }} aria-hidden="true">{icon}</span>
        <p className="label">{label}</p>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)', marginLeft: 4 }}>{unit}</span>}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', lineHeight: 1.4 }}>{detail}</p>
    </div>
  )
}
