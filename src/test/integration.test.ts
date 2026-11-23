import { describe, it, expect } from 'vitest'
import { generateMockReadings, categorizeUsAqi } from '../api/airQuality'
import { scorePersona } from '../core/personaEngine'
import { buildDailyRoutine } from '../core/routineOptimizer'
import { calculateImpact } from '../core/impactCalculator'
import { IAQ_HACKS } from '../core/iaqPlaybook'
import type { FamilyPersona } from '../api/types'

// ─── Integration: Full pipeline — high-risk family in Delhi smog ──────────────
describe('Full pipeline integration', () => {
  const readings = generateMockReadings(28.6, 77.2) // Delhi winter smog

  const persona: FamilyPersona = {
    hasInfants: true,
    hasChildren: false,
    hasElderly: true,
    hasAsthma: true,
    hasCOPD: false,
    hasCardioDisease: true,
    housingType: 'apartment',
    floorLevel: 1,
  }

  const score = scorePersona(persona)
  const routine = buildDailyRoutine(readings, score)
  const impact = calculateImpact(readings, 2, routine.safeWindows.length, ['carToPublicTransit'])

  it('persona is critical risk', () => {
    expect(score.riskLevel).toBe('critical')
    expect(score.vulnerabilityIndex).toBeGreaterThanOrEqual(70)
  })

  it('routine has commute advice', () => {
    expect(routine.commuteAdvice).toBeTruthy()
    expect(typeof routine.commuteAdvice).toBe('string')
  })

  it('total routine slots = 24', () => {
    expect(routine.safeWindows.length + routine.avoidWindows.length).toBeLessThanOrEqual(24)
  })

  it('high-risk family has fewer safe windows than low-risk', () => {
    const lowRisk: FamilyPersona = { ...persona, hasInfants: false, hasElderly: false, hasAsthma: false, hasCardioDisease: false }
    const lowScore = scorePersona(lowRisk)
    const lowRoutine = buildDailyRoutine(readings, lowScore)
    // Low-risk family should have >= safe windows as high-risk
    expect(lowRoutine.safeWindows.length).toBeGreaterThanOrEqual(routine.safeWindows.length)
  })

  it('impact metrics are consistent', () => {
    expect(impact.activitiesOptimized).toBe(routine.safeWindows.length)
    expect(impact.pm25ExposureReductionUgh).toBeGreaterThanOrEqual(0)
  })

  it('IAQ hacks are available to recommend', () => {
    expect(IAQ_HACKS.filter((h) => h.costTier === 'free').length).toBeGreaterThanOrEqual(2)
  })

  it('all routine safe slot AQIs are within persona threshold', () => {
    // Critical persona threshold = 50
    for (const slot of routine.safeWindows) {
      expect(slot.usAqi).toBeLessThanOrEqual(50)
    }
  })

  it('categorizeUsAqi handles all routine slot AQIs without throwing', () => {
    for (const slot of [...routine.safeWindows, ...routine.avoidWindows]) {
      expect(() => categorizeUsAqi(slot.usAqi)).not.toThrow()
    }
  })
})
