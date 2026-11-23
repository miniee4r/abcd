import type { FamilyPersona, PersonaScore } from '../api/types'

// ─── Vulnerability scoring — O(1) ─────────────────────────────────────────────
// Weights sourced from EPA and WHO air quality guidelines

const WEIGHTS = {
  hasInfants: 25,
  hasChildren: 15,
  hasElderly: 20,
  hasAsthma: 20,
  hasCOPD: 25,
  hasCardioDisease: 20,
  groundFloor: 10, // ground floor = higher street-level exposure
} as const

export function scorePersona(persona: FamilyPersona): PersonaScore {
  let score = 0
  const risks: string[] = []

  if (persona.hasInfants) { score += WEIGHTS.hasInfants; risks.push('Infants (developing lungs)') }
  if (persona.hasChildren) { score += WEIGHTS.hasChildren; risks.push('Children (active outdoor time)') }
  if (persona.hasElderly) { score += WEIGHTS.hasElderly; risks.push('Elderly (reduced lung capacity)') }
  if (persona.hasAsthma) { score += WEIGHTS.hasAsthma; risks.push('Asthma (PM2.5 trigger)') }
  if (persona.hasCOPD) { score += WEIGHTS.hasCOPD; risks.push('COPD (severe sensitivity)') }
  if (persona.hasCardioDisease) { score += WEIGHTS.hasCardioDisease; risks.push('Cardiovascular disease') }
  if (persona.housingType === 'apartment' && persona.floorLevel <= 2) {
    score += WEIGHTS.groundFloor
    risks.push('Low-floor apartment (street-level pollution)')
  }

  // Cap at 100
  const vulnerabilityIndex = Math.min(100, score)

  const riskLevel =
    vulnerabilityIndex >= 70 ? 'critical'
    : vulnerabilityIndex >= 50 ? 'high'
    : vulnerabilityIndex >= 25 ? 'moderate'
    : 'low'

  return { vulnerabilityIndex, riskLevel, primaryRisks: risks }
}

// ─── Default family persona ────────────────────────────────────────────────────
export const DEFAULT_PERSONA: FamilyPersona = {
  hasInfants: false,
  hasChildren: true,
  hasElderly: false,
  hasAsthma: false,
  hasCOPD: false,
  hasCardioDisease: false,
  housingType: 'apartment',
  floorLevel: 3,
}
