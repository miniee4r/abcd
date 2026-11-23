import type { AqiReading, DailyRoutine, TimeSlot, PersonaScore } from '../api/types'
import { categorizeUsAqi } from '../api/airQuality'

// ─── AQI thresholds adjusted by vulnerability — O(1) ─────────────────────────
function getSafeThreshold(persona: PersonaScore): number {
  if (persona.riskLevel === 'critical') return 50
  if (persona.riskLevel === 'high') return 80
  if (persona.riskLevel === 'moderate') return 100
  return 150
}

function formatHour(hour: number): string {
  const ampm = hour < 12 ? 'AM' : 'PM'
  const h = hour % 12 || 12
  return `${h}:00 ${ampm}`
}

// ─── Map AQI reading to time slot — O(1) ──────────────────────────────────────
function readingToSlot(reading: AqiReading): Omit<TimeSlot, 'activity' | 'safetyNote'> {
  const date = new Date(reading.time)
  return {
    hour: date.getHours(),
    label: formatHour(date.getHours()),
    usAqi: reading.usAqi,
  }
}

// ─── Activity suggestion by hour and AQI — O(1) ───────────────────────────────
function suggestActivity(hour: number, aqi: number): { activity: string; safetyNote: string } {
  const category = categorizeUsAqi(aqi)

  if (aqi <= 100) {
    if (hour >= 6 && hour <= 8) return { activity: 'Morning walk / cycling', safetyNote: 'Good air — ideal for outdoor exercise.' }
    if (hour >= 9 && hour <= 17) return { activity: 'Outdoor errands / commute', safetyNote: `${category} — safe for most activities.` }
    if (hour >= 18 && hour <= 20) return { activity: 'Evening walk / park', safetyNote: 'Good window — take kids out.' }
    return { activity: 'Rest / indoor activities', safetyNote: 'Overnight — stay indoors.' }
  }

  if (aqi <= 150) {
    if (hour >= 11 && hour <= 14) return { activity: 'Quick outdoor errand (< 30 min)', safetyNote: 'Sensitive groups: wear N95 mask.' }
    return { activity: 'Stay indoors', safetyNote: 'Air quality is poor — minimize outdoor exposure.' }
  }

  return { activity: 'Stay indoors', safetyNote: `${category} — do not go outside. Run air purifier.` }
}

// ─── Build today's optimized routine — O(n) n = 24 hourly slots ───────────────
export function buildDailyRoutine(
  readings: AqiReading[],
  persona: PersonaScore
): DailyRoutine {
  const threshold = getSafeThreshold(persona)
  const today = new Date().toDateString()

  // Filter to today's readings
  const todayReadings = readings.filter((r) => new Date(r.time).toDateString() === today)
  const slots = todayReadings.length > 0 ? todayReadings : readings.slice(0, 24)

  const safeWindows: TimeSlot[] = []
  const avoidWindows: TimeSlot[] = []

  for (const reading of slots) {
    const { hour, label, usAqi } = readingToSlot(reading)
    const { activity, safetyNote } = suggestActivity(hour, usAqi)
    const slot: TimeSlot = { hour, label, activity, safetyNote, usAqi }

    if (usAqi <= threshold) {
      safeWindows.push(slot)
    } else {
      avoidWindows.push(slot)
    }
  }

  const worstAqi = Math.max(...slots.map((r) => r.usAqi))
  const commuteAdvice =
    worstAqi > 150
      ? 'Consider remote work today. If commuting, use public transport with air filtration and wear N95.'
      : worstAqi > 100
      ? 'Commute during 10 AM–2 PM window. Keep car windows closed and set AC to recirculate.'
      : 'Air quality acceptable for commuting. Avoid rush-hour idling where possible.'

  return { date: today, safeWindows, avoidWindows, commuteAdvice }
}
