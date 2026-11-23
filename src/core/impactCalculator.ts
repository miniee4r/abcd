import type { AqiReading, ImpactMetrics } from '../api/types'

// ─── PM2.5 exposure math — EPA methodology ────────────────────────────────────
// Daily exposure (μg/m³·h) = Σ(AQI_hour × time_fraction_outdoors)

const OUTDOOR_HOURS_BASELINE = 4 // average urban adult hours outdoors
const INDOOR_PM25_REDUCTION_FRACTION = 0.7 // indoor PM2.5 ≈ 30% of outdoor with good sealing

// CO₂e savings per activity switch (kg CO₂e per day)
const CO2E_SAVINGS: Record<string, number> = {
  carToPublicTransit: 2.6,
  carToCycling: 3.1,
  outdoorGrillToInduction: 1.4,
  dieselGeneratorOff: 4.2,
}

// ─── Calculate daily impact — O(n) n = 24 ─────────────────────────────────────
export function calculateImpact(
  readings: AqiReading[],
  outdoorHoursReduced: number,
  activitiesOptimized: number,
  co2Activities: (keyof typeof CO2E_SAVINGS)[]
): ImpactMetrics {
  const slots = readings.slice(0, 24)

  // Baseline exposure: outdoorHours × mean PM2.5
  const meanPm25 = slots.reduce((s, r) => s + r.pm2_5, 0) / (slots.length || 1)
  const baselineExposure = meanPm25 * OUTDOOR_HOURS_BASELINE

  // Optimized exposure: fewer outdoor hours + indoor filtration benefit
  const reducedOutdoorHours = Math.max(0, OUTDOOR_HOURS_BASELINE - outdoorHoursReduced)
  const indoorExposure = meanPm25 * INDOOR_PM25_REDUCTION_FRACTION * outdoorHoursReduced
  const optimizedExposure = meanPm25 * reducedOutdoorHours + indoorExposure

  const pm25ExposureReductionUgh = +(baselineExposure - optimizedExposure).toFixed(1)

  // CO₂e savings
  const co2eSavedKgPerDay = +co2Activities
    .reduce((s, act) => s + (CO2E_SAVINGS[act] ?? 0), 0)
    .toFixed(2)

  // Health risk delta — EPA linear exposure-response: 0.6% per 10 μg/m³·h
  const healthRiskDeltaPercent = +(pm25ExposureReductionUgh * 0.06).toFixed(1)

  return {
    pm25ExposureReductionUgh,
    co2eSavedKgPerDay,
    healthRiskDeltaPercent,
    activitiesOptimized,
  }
}
