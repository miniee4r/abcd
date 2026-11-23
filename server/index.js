import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenerativeAI } from '@google/generative-ai'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const PORT = process.env.PORT || 3001

// ─── Lightweight .env parser (zero dependency) ────────────────────────────────
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const fullPath = path.join(ROOT_DIR, file)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  }
}
loadEnv()

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
const genAI = API_KEY && API_KEY !== 'your_gemini_api_key_here' ? new GoogleGenerativeAI(API_KEY) : null

const SYSTEM_PROMPT = `You are AeroVane, a helpful air quality safety assistant for families and communities.
Your role:
- Explain current air quality readings in plain, understandable language.
- Suggest practical, evidence-based steps to reduce PM2.5 exposure.
- Recommend low-emission daily routines and indoor air quality improvements.
- Explain the direct health impact of air quality choices.
Safety rules:
- Never diagnose medical conditions or prescribe treatments.
- Always recommend consulting a doctor for health symptoms.
- Base advice on EPA, WHO, and established air quality science.
- Be concise (3–5 sentences per response).`

// ─── Sanitize chat history for Gemini (strict user/model alternation) ─────────
function sanitizeHistory(history) {
  if (!Array.isArray(history) || history.length === 0) return []
  const clean = []
  for (const item of history) {
    const role = item.role === 'user' ? 'user' : 'model'
    const text = item.parts?.[0]?.text?.trim()
    if (!text) continue
    if (clean.length === 0 && role !== 'user') continue
    if (clean.length > 0 && clean[clean.length - 1].role === role) continue
    clean.push({ role, parts: [{ text }] })
  }
  if (clean.length > 0 && clean[clean.length - 1].role === 'user') {
    clean.pop()
  }
  return clean
}

// ─── Static file mime types for production serving ───────────────────────────
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = parsedUrl.pathname

  // 1. Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      status: 'ok',
      service: 'AeroVane Backend API',
      aiConfigured: Boolean(genAI),
      timestamp: new Date().toISOString(),
    }))
    return
  }

  // 2. Air quality proxy
  if (pathname === '/api/air-quality') {
    const lat = parsedUrl.searchParams.get('lat') || '28.6'
    const lon = parsedUrl.searchParams.get('lon') || '77.2'
    const openMeteoUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,us_aqi,european_aqi&timezone=auto&forecast_days=7`

    try {
      const response = await fetch(openMeteoUrl)
      if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`)
      const data = await response.json()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Failed to fetch air quality data', details: err.message }))
    }
    return
  }

  // 3. AI Chat proxy
  if (pathname === '/api/chat' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      try {
        const { message, currentReading, persona, personaScore, history } = JSON.parse(body || '{}')
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Message is required' }))
          return
        }

        if (!genAI) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            reply: 'AI advisor is not configured. Please add your Gemini API key to the .env file on the server to enable personalized guidance.',
          }))
          return
        }

        const category = currentReading ? `AQI ${currentReading.usAqi}` : 'Current AQI'
        const risks = personaScore?.primaryRisks?.join(', ') || 'general public'
        const housing = persona ? `${persona.housingType}${persona.housingType === 'apartment' ? ` (floor ${persona.floorLevel})` : ''}` : 'general'
        const context = `Conditions: ${category}. Risks: ${risks}. Housing: ${housing}. Vulnerability: ${personaScore?.riskLevel || 'moderate'}.`
        const enrichedMessage = `${context}\n\nUser question: ${message}`

        // Resilient model fallback: gemini-3.5-flash -> gemini-3.8-flash -> gemini-flash-latest
        const candidateModels = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest']
        let text = ''
        let lastError = null

        for (const modelName of candidateModels) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction: SYSTEM_PROMPT,
            })
            const cleanHistory = sanitizeHistory(history)
            const chat = model.startChat({ history: cleanHistory })
            const result = await chat.sendMessage(enrichedMessage)
            text = result.response.text()
            if (text) break
          } catch (mErr) {
            lastError = mErr
            console.warn(`[API_CHAT_FALLBACK] ${modelName} failed:`, mErr.message?.slice(0, 80))
          }
        }

        if (!text && lastError) {
          throw lastError
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ reply: text }))
      } catch (err) {
        console.error('[API_CHAT_EXCEPTION]', err)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          error: err.message || 'Failed to process AI chat',
          reply: 'Unable to reach the AI advisor right now. Please try again in a moment.',
        }))
      }
    })
    return
  }

  // 4. Geocoding proxy (Open-Meteo worldwide search)
  if (pathname === '/api/geocoding') {
    const name = parsedUrl.searchParams.get('name') || ''
    if (!name.trim()) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ results: [] }))
      return
    }
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name.trim())}&count=6&language=en&format=json`
      const response = await fetch(geoUrl)
      const data = await response.json()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(data))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ results: [], error: err.message }))
    }
    return
  }

  // 5. Static files serving (if dist exists for production)
  const distDir = path.join(ROOT_DIR, 'dist')
  if (fs.existsSync(distDir)) {
    let filePath = path.join(distDir, pathname === '/' ? 'index.html' : pathname)
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html')
    }
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    try {
      const content = fs.readFileSync(filePath)
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
      return
    } catch {
      // Fall through to 404
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not Found' }))
})

server.listen(PORT, () => {
  console.log(`[AeroVane Server] running at http://localhost:${PORT}`)
  console.log(`[AeroVane Server] Health check: http://localhost:${PORT}/api/health`)
})

export default server
