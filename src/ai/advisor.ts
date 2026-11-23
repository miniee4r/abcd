import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AqiReading, FamilyPersona, PersonaScore } from '../api/types'
import { categorizeUsAqi } from '../api/airQuality'

// ─── Safety-first system prompt — no medical diagnosis ───────────────────────
const SYSTEM_PROMPT = `You are AeroVane, a helpful air quality safety assistant for families and communities.

Your role:
- Explain current air quality readings in plain, understandable language
- Suggest practical, evidence-based steps to reduce PM2.5 exposure
- Recommend low-emission daily routines and indoor air quality improvements
- Explain the direct health impact of air quality choices

Your boundaries (always enforce):
- Never diagnose medical conditions or prescribe treatments
- Always recommend consulting a doctor for health symptoms
- Base advice on EPA, WHO, and established air quality science
- Be concise — 3–5 sentences per response unless asked for more detail

Always be warm, calm, and practical. Use simple language suitable for families.`

// ─── Advisor context builder — O(1) ──────────────────────────────────────────
function buildUserContext(
  currentReading: AqiReading,
  persona: FamilyPersona,
  personaScore: PersonaScore
): string {
  const category = categorizeUsAqi(currentReading.usAqi)
  const risks = personaScore.primaryRisks.join(', ') || 'general public'
  const housing = `${persona.housingType}${persona.housingType === 'apartment' ? ` (floor ${persona.floorLevel})` : ''}`
  return `Current conditions: AQI ${currentReading.usAqi} (${category}), PM2.5 ${currentReading.pm2_5} μg/m³. Family risk factors: ${risks}. Housing: ${housing}. Vulnerability: ${personaScore.riskLevel}.`
}

// ─── Advisor class — lazy Gemini initialization ───────────────────────────────
export class AirQualityAdvisor {
  private genAI: GoogleGenerativeAI | null = null
  private readonly apiKey: string | undefined

  constructor() {
    // Vite injects env vars at build time — never hardcode
    this.apiKey = import.meta.env['VITE_GEMINI_API_KEY'] as string | undefined
  }

  get isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'your_gemini_api_key_here')
  }

  private getModel() {
    if (!this.genAI) {
      if (!this.apiKey) throw new Error('API key not configured')
      this.genAI = new GoogleGenerativeAI(this.apiKey)
    }
    return this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })
  }

  // ─── Send a user message with current context ─────────────────────────────
  async chat(
    userMessage: string,
    currentReading: AqiReading,
    persona: FamilyPersona,
    personaScore: PersonaScore,
    history: { role: 'user' | 'model'; parts: { text: string }[] }[]
  ): Promise<string> {
    // 1. First attempt backend proxy (/api/chat) for maximum security
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          currentReading,
          persona,
          personaScore,
          history,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.reply) return data.reply
      }
    } catch {
      // Backend not running — fallback to client-side direct SDK
    }

    // 2. Direct client-side SDK fallback
    if (!this.isAvailable) {
      return 'AI advisor is not configured. Please add your Gemini API key to the .env file to enable personalized guidance.'
    }

    try {
      const model = this.getModel()
      const context = buildUserContext(currentReading, persona, personaScore)
      const enrichedMessage = `${context}\n\nUser question: ${userMessage}`

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(enrichedMessage)
      return result.response.text()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      // Surface user-friendly error, never expose internal details
      if (message.includes('API_KEY_INVALID') || message.includes('403')) {
        return 'Invalid API key. Please check your Gemini API key configuration.'
      }
      return 'Unable to reach the AI advisor right now. Please try again in a moment.'
    }
  }
}

// Singleton — avoids re-initializing GoogleGenerativeAI on every render
export const advisor = new AirQualityAdvisor()
