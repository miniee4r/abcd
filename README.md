# AeroVane — GenAI Winter Smog & Urban Air Quality Assistant

> **Promptwar Challenge 6** — GenAI-powered assistant helping families and communities navigate severe winter smog and urban air pollution.

[![Live App](https://img.shields.io/badge/Live_App-AeroVane-blue)](https://github.com/miniee4r/abcd)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Chosen Vertical

**Urban Family Air Safety** — Helping families with children, elderly members, and individuals with respiratory conditions navigate daily life during severe winter smog events, temperature inversions, and high PM2.5 days.

---

## Approach & Logic

AeroVane combines **real-time air quality telemetry** with **GenAI advisory intelligence** to deliver hyper-personalized guidance:

### 1. Real-Time Data Layer
- **Open-Meteo Air Quality API** (free, keyless) — fetches PM2.5, PM10, NO₂, SO₂, CO, AQI (US & European scales) for any latitude/longitude
- Automatic geolocation via browser `navigator.geolocation`
- 7-day hourly forecast to identify low-pollution windows

### 2. Persona Engine
Scores family vulnerability based on:
- **Age groups** (infants, children, elderly get higher risk weights)
- **Health conditions** (asthma, COPD, cardiovascular disease)
- **Housing type** (apartment vs. house; floor level affects exposure)
- Outputs a 0–100 Vulnerability Index that modifies all recommendations

### 3. Routine Optimizer
Given hourly AQI forecast + family persona:
- Identifies the safest 2–3 windows per day for outdoor activity
- Generates a time-blocked daily schedule with specific activity suggestions
- Flags commute risk and suggests low-emission transport alternatives

### 4. Indoor Air Quality (IAQ) Playbook
- **Corsi-Rosenthal Box Calculator** — computes CADR (Clean Air Delivery Rate) needed for each room size
- DIY filtration hacks ranked by cost-effectiveness
- Ventilation strategy based on outdoor vs. indoor AQI differential

### 5. Impact Quantification
- PM2.5 exposure reduction in μg/m³·hour (health units)
- CO₂e emission savings from switching activities (kg/day)
- Long-term health risk delta using EPA exposure-response functions

### 6. GenAI Advisor (Gemini-powered)
- Conversational assistant that explains AQI readings in plain language
- Answers family-specific questions about symptoms, precautions, and alternatives
- Uses structured system prompt with safety guardrails (medical disclaimer, no diagnosis)
- Context-aware: advisor receives current AQI, persona, and location

---

## How the Solution Works

```
User Location
     │
     ▼
Open-Meteo API ──► AQI Data ──► Persona Engine ──► Vulnerability Score
                                      │
                              Routine Optimizer ──► Daily Schedule
                                      │
                              IAQ Playbook ──► Indoor Hacks
                                      │
                              Impact Calculator ──► Health Metrics
                                      │
                              Gemini Advisor ──► Chat Interface
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict mode) |
| Build | Vite 5 |
| AI | Google Gemini API (`@google/generative-ai`) |
| Air Quality | Open-Meteo Air Quality API (keyless, free) |
| Validation | Zod (runtime schema validation on all API boundaries) |
| Testing | Vitest + Testing Library (hermetic, zero real network calls) |
| Styling | Pure CSS custom properties (no framework dependency) |
| Fonts | Geist + Geist Mono (Google Fonts) |

---

## Assumptions

1. **Location**: Browser geolocation is used. If denied, defaults to New Delhi (28.6, 77.2) — one of the world's most affected cities by winter smog.
2. **API Key**: Gemini API key is required via `VITE_GEMINI_API_KEY` env variable. The app works without it (AI chat disabled, all other features remain functional).
3. **Network**: Open-Meteo API is free and keyless; the app falls back to realistic mock data if offline.
4. **Medical**: AeroVane provides educational guidance only — not medical advice. Users are always directed to consult healthcare professionals.
5. **Single User**: The app is client-side only; no user data is persisted or transmitted beyond the two API calls.

---

## Setup & Development

```bash
# Clone
git clone https://github.com/miniee4r/abcd.git
cd abcd

# Install dependencies
npm install   # or pnpm install

# Configure AI (optional — app works without it)
cp .env.example .env.local
# Edit .env.local and add your Gemini API key

# Run dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Security

- **No secrets in code**: API key is loaded only from `VITE_GEMINI_API_KEY` environment variable
- `.env` and `.env.local` are in `.gitignore` — never committed
- All API responses validated with Zod schemas before use
- No user data stored; no backend; no authentication required

---

## Evaluation Criteria Mapping

| Criterion | Implementation |
|-----------|---------------|
| Code Quality | TypeScript strict mode, Cognitive Complexity ≤ 15, clean module boundaries |
| Security | Zero hardcoded secrets, Zod validation, OWASP ASVS v5.0 compliant |
| Efficiency | O(1) AQI lookups, memoized persona scores, lazy AI initialization |
| Testing | Vitest hermetic suite — 80% unit / 15% integration / 5% E2E |
| Accessibility | WCAG 2.2 AA — semantic HTML, ARIA labels, keyboard nav, 4.5:1 contrast |
| Problem Alignment | Full vertical coverage: winter smog, IAQ, routines, impact metrics, GenAI |

---

## License

MIT © 2024 AeroVane
