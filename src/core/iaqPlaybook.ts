import type { IaqHack } from '../api/types'

// ─── Corsi-Rosenthal Box CADR calculator ─────────────────────────────────────
// CADR = (Room volume m³ × Air Changes per Hour) / 60
// For clean air: target ≥ 5 ACH for high-risk family

export function calculateRequiredCadr(
  roomLengthM: number,
  roomWidthM: number,
  ceilingHeightM: number,
  targetAch = 5
): { cadrM3h: number; boxFanCount: number } {
  const volumeM3 = roomLengthM * roomWidthM * ceilingHeightM
  const cadrM3h = volumeM3 * targetAch
  // A standard 20"×20" box fan + 4 MERV-13 filters ≈ 600 m³/h CADR
  const boxFanCount = Math.ceil(cadrM3h / 600)
  return { cadrM3h: Math.round(cadrM3h), boxFanCount }
}

// ─── Ranked IAQ hacks — static catalog — O(1) lookup ─────────────────────────
export const IAQ_HACKS: IaqHack[] = [
  {
    id: 'cr-box',
    title: 'Corsi-Rosenthal Box Fan Filter',
    description:
      'Tape 4 MERV-13 furnace filters around a 20" box fan. Costs ~₹1,500–₹3,000. Delivers 400–600 m³/h CADR — rivaling ₹30,000 purifiers.',
    costTier: 'low',
    cadrBoost: 500,
    difficulty: 'easy',
  },
  {
    id: 'door-seal',
    title: 'Door & Window Draft Sealing',
    description:
      'Apply foam weather stripping to doors and windows. Reduces outdoor PM2.5 infiltration by 30–50% at zero recurring cost.',
    costTier: 'free',
    cadrBoost: 0,
    difficulty: 'easy',
  },
  {
    id: 'beeswax-candles',
    title: 'Replace Incense with Beeswax Candles',
    description:
      'Incense smoke generates PM2.5 at 10–45× outdoor levels indoors. Switch to unscented beeswax or soy candles.',
    costTier: 'low',
    cadrBoost: 0,
    difficulty: 'easy',
  },
  {
    id: 'cooking-hood',
    title: 'Use Exhaust Hood While Cooking',
    description:
      'Gas cooking generates PM2.5 spikes up to 300 μg/m³. Run the range hood on high or open a window opposite the stove.',
    costTier: 'free',
    cadrBoost: 200,
    difficulty: 'easy',
  },
  {
    id: 'wet-mop',
    title: 'Wet Mopping Over Dry Sweeping',
    description:
      'Dry sweeping re-suspends settled PM2.5. Wet mop floors daily during smog events to trap particles.',
    costTier: 'free',
    cadrBoost: 0,
    difficulty: 'easy',
  },
  {
    id: 'merv13-hvac',
    title: 'Upgrade HVAC to MERV-13 Filter',
    description:
      'Replace standard HVAC filter with MERV-13. Captures 90%+ of PM2.5. Run fan continuously during high AQI days.',
    costTier: 'low',
    cadrBoost: 300,
    difficulty: 'medium',
  },
]
