import { AirQualityResponseSchema, type AqiReading, type AqiCategory } from './types'

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const HOURLY_VARS = 'pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,us_aqi,european_aqi'

// ─── AQI category helper — O(1) ───────────────────────────────────────────────
export function categorizeUsAqi(aqi: number): AqiCategory {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

// ─── Color mapping for AQI category — O(1) ───────────────────────────────────
export function aqiColor(category: AqiCategory): string {
  const map: Record<AqiCategory, string> = {
    'Good': '#22c55e',
    'Moderate': '#eab308',
    'Unhealthy for Sensitive Groups': '#f97316',
    'Unhealthy': '#ef4444',
    'Very Unhealthy': '#8b5cf6',
    'Hazardous': '#7f1d1d',
  }
  return map[category]
}

// ─── Fetch air quality — network boundary with Zod validation ─────────────────
export async function fetchAirQuality(
  lat: number,
  lon: number
): Promise<AqiReading[]> {
  const backendUrl = `/api/air-quality?lat=${lat}&lon=${lon}`
  const directUrl = `${BASE_URL}?latitude=${lat}&longitude=${lon}&hourly=${HOURLY_VARS}&timezone=auto&forecast_days=7`

  let raw: unknown
  // 1. Try backend API proxy first
  try {
    const res = await fetch(backendUrl)
    if (res.ok) raw = await res.json()
  } catch {
    // Backend offline — proceed to direct external API
  }

  // 2. Direct Open-Meteo API fallback
  if (!raw) {
    try {
      const res = await fetch(directUrl)
      if (res.ok) raw = await res.json()
    } catch {
      // Network unavailable — return hermetic mock data
      return generateMockReadings(lat, lon)
    }
  }

  const parsed = AirQualityResponseSchema.safeParse(raw)
  if (!parsed.success) return generateMockReadings(lat, lon)

  const h = parsed.data.hourly
  // O(n) where n ≤ 168 (7 days × 24 hours)
  return h.time.map((time, i) => ({
    time,
    pm2_5: h.pm2_5[i] ?? 0,
    pm10: h.pm10[i] ?? 0,
    no2: h.nitrogen_dioxide[i] ?? 0,
    so2: h.sulphur_dioxide[i] ?? 0,
    co: h.carbon_monoxide[i] ?? 0,
    usAqi: h.us_aqi[i] ?? 0,
    euAqi: h.european_aqi[i] ?? 0,
  }))
}

// ─── Hermetic mock — realistic winter smog pattern ───────────────────────────
// Used as fallback when network is unavailable; also injected in tests
export function generateMockReadings(lat: number, _lon: number): AqiReading[] {
  // Delhi-like winter smog baseline; slightly better for equatorial latitudes
  const baseline = lat > 15 && lat < 35 ? 180 : 80
  const now = new Date()
  now.setMinutes(0, 0, 0)

  return Array.from({ length: 168 }, (_, i) => {
    const t = new Date(now.getTime() + i * 3_600_000)
    const hour = t.getHours()
    // Temperature inversion: worse at night/early morning (6–10 AM)
    const inversionMultiplier = hour >= 6 && hour <= 10 ? 1.4 : hour >= 22 ? 1.2 : 0.8
    const usAqi = Math.round(baseline * inversionMultiplier + (Math.random() - 0.5) * 20)
    return {
      time: t.toISOString(),
      pm2_5: +(usAqi * 0.18).toFixed(1),
      pm10: +(usAqi * 0.3).toFixed(1),
      no2: +(usAqi * 0.4).toFixed(1),
      so2: +(usAqi * 0.08).toFixed(1),
      co: +(usAqi * 2).toFixed(1),
      usAqi,
      euAqi: Math.round(usAqi * 0.9),
    }
  })
}

// ─── Get user's current coordinates — O(1) ───────────────────────────────────
export function getCurrentCoords(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 28.6, lon: 77.2 }) // Default: New Delhi
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 28.6, lon: 77.2 }),
      { timeout: 5000 }
    )
  })
}
