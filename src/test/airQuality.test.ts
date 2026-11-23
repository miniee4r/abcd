import { describe, it, expect } from 'vitest'
import { categorizeUsAqi, aqiColor, generateMockReadings } from '../api/airQuality'
import { AirQualityResponseSchema } from '../api/types'

// ─── categorizeUsAqi — O(1) boundary tests ────────────────────────────────────
describe('categorizeUsAqi', () => {
  it('returns Good for AQI 0', () => expect(categorizeUsAqi(0)).toBe('Good'))
  it('returns Good for AQI 50', () => expect(categorizeUsAqi(50)).toBe('Good'))
  it('returns Moderate for AQI 51', () => expect(categorizeUsAqi(51)).toBe('Moderate'))
  it('returns Moderate for AQI 100', () => expect(categorizeUsAqi(100)).toBe('Moderate'))
  it('returns Unhealthy for Sensitive Groups for AQI 101', () => expect(categorizeUsAqi(101)).toBe('Unhealthy for Sensitive Groups'))
  it('returns Unhealthy for AQI 151', () => expect(categorizeUsAqi(151)).toBe('Unhealthy'))
  it('returns Very Unhealthy for AQI 201', () => expect(categorizeUsAqi(201)).toBe('Very Unhealthy'))
  it('returns Hazardous for AQI 301', () => expect(categorizeUsAqi(301)).toBe('Hazardous'))
  it('returns Hazardous for AQI 500', () => expect(categorizeUsAqi(500)).toBe('Hazardous'))
})

// ─── aqiColor — returns valid CSS color ───────────────────────────────────────
describe('aqiColor', () => {
  it('returns hex color for Good', () => expect(aqiColor('Good')).toMatch(/^#[0-9a-f]{6}$/i))
  it('returns hex color for Hazardous', () => expect(aqiColor('Hazardous')).toMatch(/^#[0-9a-f]{6}$/i))
})

// ─── generateMockReadings — shape validation ───────────────────────────────────
describe('generateMockReadings', () => {
  const readings = generateMockReadings(28.6, 77.2)

  it('returns 168 readings (7 days × 24h)', () => expect(readings).toHaveLength(168))

  it('each reading has valid fields', () => {
    for (const r of readings) {
      expect(typeof r.time).toBe('string')
      expect(r.usAqi).toBeGreaterThanOrEqual(0)
      expect(r.pm2_5).toBeGreaterThanOrEqual(0)
      expect(r.pm10).toBeGreaterThanOrEqual(0)
    }
  })

  it('Delhi baseline produces higher AQI than equatorial', () => {
    const delhi = generateMockReadings(28.6, 77.2)
    const equatorial = generateMockReadings(1.3, 103.8)
    const delhiMean = delhi.reduce((s, r) => s + r.usAqi, 0) / delhi.length
    const equatorialMean = equatorial.reduce((s, r) => s + r.usAqi, 0) / equatorial.length
    expect(delhiMean).toBeGreaterThan(equatorialMean)
  })
})

// ─── Zod schema — rejects malformed response ──────────────────────────────────
describe('AirQualityResponseSchema', () => {
  it('rejects empty object', () => {
    const result = AirQualityResponseSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts valid structure', () => {
    const valid = {
      latitude: 28.6,
      longitude: 77.2,
      timezone: 'Asia/Kolkata',
      hourly: {
        time: ['2024-01-01T00:00'],
        pm2_5: [120],
        pm10: [200],
        nitrogen_dioxide: [80],
        sulphur_dioxide: [30],
        carbon_monoxide: [500],
        us_aqi: [170],
        european_aqi: [150],
      },
    }
    const result = AirQualityResponseSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts null pollutant values (sparse data)', () => {
    const sparse = {
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
      hourly: {
        time: ['2024-01-01T00:00'],
        pm2_5: [null],
        pm10: [null],
        nitrogen_dioxide: [null],
        sulphur_dioxide: [null],
        carbon_monoxide: [null],
        us_aqi: [null],
        european_aqi: [null],
      },
    }
    expect(AirQualityResponseSchema.safeParse(sparse).success).toBe(true)
  })
})
