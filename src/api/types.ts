import { z } from 'zod'

// ─── Open-Meteo Air Quality response schema ───────────────────────────────────
// Validates every API boundary — O(n) where n = hourly data points (≤ 168)

export const HourlySchema = z.object({
  time: z.array(z.string()),
  pm2_5: z.array(z.number().nullable()),
  pm10: z.array(z.number().nullable()),
  nitrogen_dioxide: z.array(z.number().nullable()),
  sulphur_dioxide: z.array(z.number().nullable()),
  carbon_monoxide: z.array(z.number().nullable()),
  us_aqi: z.array(z.number().nullable()),
  european_aqi: z.array(z.number().nullable()),
})

export const AirQualityResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  hourly: HourlySchema,
})

export type AirQualityResponse = z.infer<typeof AirQualityResponseSchema>
export type Hourly = z.infer<typeof HourlySchema>

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface AqiReading {
  time: string
  pm2_5: number
  pm10: number
  no2: number
  so2: number
  co: number
  usAqi: number
  euAqi: number
}

export type AqiCategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous'

export interface FamilyPersona {
  hasInfants: boolean
  hasChildren: boolean
  hasElderly: boolean
  hasAsthma: boolean
  hasCOPD: boolean
  hasCardioDisease: boolean
  housingType: 'apartment' | 'house'
  floorLevel: number // 1 = ground, affects exposure
}

export interface PersonaScore {
  vulnerabilityIndex: number // 0–100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical'
  primaryRisks: string[]
}

export interface TimeSlot {
  hour: number
  label: string // e.g. "6:00 AM"
  activity: string
  safetyNote: string
  usAqi: number
}

export interface DailyRoutine {
  date: string
  safeWindows: TimeSlot[]
  avoidWindows: TimeSlot[]
  commuteAdvice: string
}

export interface IaqHack {
  id: string
  title: string
  description: string
  costTier: 'free' | 'low' | 'medium'
  cadrBoost: number // m³/h
  difficulty: 'easy' | 'medium'
}

export interface ImpactMetrics {
  pm25ExposureReductionUgh: number // μg/m³·h saved per day
  co2eSavedKgPerDay: number
  healthRiskDeltaPercent: number
  activitiesOptimized: number
}
