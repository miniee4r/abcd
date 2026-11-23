import { describe, it, expect } from 'vitest'
import { scorePersona } from '../core/personaEngine'
import type { FamilyPersona } from '../api/types'

const BASE: FamilyPersona = {
  hasInfants: false,
  hasChildren: false,
  hasElderly: false,
  hasAsthma: false,
  hasCOPD: false,
  hasCardioDisease: false,
  housingType: 'house',
  floorLevel: 1,
}

describe('scorePersona', () => {
  it('returns low risk for healthy adult in house', () => {
    const result = scorePersona(BASE)
    expect(result.riskLevel).toBe('low')
    expect(result.vulnerabilityIndex).toBe(0)
    expect(result.primaryRisks).toHaveLength(0)
  })

  it('returns high risk for infant with COPD in ground-floor apartment', () => {
    // Infant(25) + COPD(25) + ground floor(10) = 60 → high risk (threshold: ≥50)
    const result = scorePersona({
      ...BASE,
      hasInfants: true,
      hasCOPD: true,
      housingType: 'apartment',
      floorLevel: 1,
    })
    expect(result.riskLevel).toBe('high')
    expect(result.vulnerabilityIndex).toBeGreaterThanOrEqual(60)
    expect(result.primaryRisks.length).toBeGreaterThanOrEqual(2)
  })

  it('returns critical for infant + COPD + cardio + elderly', () => {
    // Infant(25) + COPD(25) + cardio(20) + elderly(20) = 90 → critical
    const result = scorePersona({
      ...BASE,
      hasInfants: true,
      hasCOPD: true,
      hasCardioDisease: true,
      hasElderly: true,
    })
    expect(result.riskLevel).toBe('critical')
    expect(result.vulnerabilityIndex).toBeGreaterThanOrEqual(70)
  })

  it('caps vulnerability at 100', () => {
    const result = scorePersona({
      hasInfants: true,
      hasChildren: true,
      hasElderly: true,
      hasAsthma: true,
      hasCOPD: true,
      hasCardioDisease: true,
      housingType: 'apartment',
      floorLevel: 1,
    })
    expect(result.vulnerabilityIndex).toBeLessThanOrEqual(100)
  })

  it('high-floor apartment does not add ground-floor risk', () => {
    const low = scorePersona({ ...BASE, housingType: 'apartment', floorLevel: 10 })
    const high = scorePersona({ ...BASE, housingType: 'apartment', floorLevel: 1 })
    expect(high.vulnerabilityIndex).toBeGreaterThan(low.vulnerabilityIndex)
  })

  it('includes relevant risk labels', () => {
    const result = scorePersona({ ...BASE, hasAsthma: true })
    expect(result.primaryRisks.some((r) => r.includes('Asthma'))).toBe(true)
  })
})
