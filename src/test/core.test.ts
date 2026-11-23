import { describe, it, expect } from 'vitest'
import { calculateRequiredCadr, IAQ_HACKS } from '../core/iaqPlaybook'
import { calculateImpact } from '../core/impactCalculator'
import { generateMockReadings } from '../api/airQuality'

// ─── CADR calculator ───────────────────────────────────────────────────────────
describe('calculateRequiredCadr', () => {
  it('computes correct CADR for 5×4×2.7 room at 5 ACH', () => {
    const { cadrM3h, boxFanCount } = calculateRequiredCadr(5, 4, 2.7, 5)
    // Volume = 54 m³; 5 ACH = 270 m³/h
    expect(cadrM3h).toBe(270)
    expect(boxFanCount).toBe(1)
  })

  it('recommends multiple units for large rooms', () => {
    const { boxFanCount } = calculateRequiredCadr(10, 10, 3, 5)
    // Volume = 300; 5 ACH = 1500 → ceil(1500/600) = 3
    expect(boxFanCount).toBe(3)
  })

  it('handles minimum room size', () => {
    const { cadrM3h } = calculateRequiredCadr(1, 1, 1, 5)
    expect(cadrM3h).toBe(5)
  })
})

// ─── IAQ hacks catalog ─────────────────────────────────────────────────────────
describe('IAQ_HACKS', () => {
  it('contains at least 4 hacks', () => expect(IAQ_HACKS.length).toBeGreaterThanOrEqual(4))
  it('all hacks have required fields', () => {
    for (const h of IAQ_HACKS) {
      expect(h.id).toBeTruthy()
      expect(h.title).toBeTruthy()
      expect(h.description).toBeTruthy()
      expect(['free', 'low', 'medium']).toContain(h.costTier)
      expect(h.cadrBoost).toBeGreaterThanOrEqual(0)
    }
  })
})

// ─── Impact calculator ────────────────────────────────────────────────────────
describe('calculateImpact', () => {
  const readings = generateMockReadings(28.6, 77.2)

  it('returns non-negative exposure reduction', () => {
    const m = calculateImpact(readings, 2, 3, ['carToPublicTransit'])
    expect(m.pm25ExposureReductionUgh).toBeGreaterThanOrEqual(0)
  })

  it('returns CO2e savings for known activity', () => {
    const m = calculateImpact(readings, 1, 1, ['carToCycling'])
    expect(m.co2eSavedKgPerDay).toBeCloseTo(3.1, 1)
  })

  it('returns zero CO2e for no activities', () => {
    const m = calculateImpact(readings, 1, 0, [])
    expect(m.co2eSavedKgPerDay).toBe(0)
  })

  it('health risk delta is non-negative', () => {
    const m = calculateImpact(readings, 2, 3, ['carToPublicTransit', 'carToCycling'])
    expect(m.healthRiskDeltaPercent).toBeGreaterThanOrEqual(0)
  })

  it('handles empty readings gracefully', () => {
    const m = calculateImpact([], 2, 1, [])
    expect(m.pm25ExposureReductionUgh).toBe(0)
  })
})
