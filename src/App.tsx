import { useState, useEffect, useCallback } from 'react'
import type { AqiReading, FamilyPersona } from './api/types'
import { fetchAirQuality, getCurrentCoords } from './api/airQuality'
import { scorePersona, DEFAULT_PERSONA } from './core/personaEngine'
import { buildDailyRoutine } from './core/routineOptimizer'
import { calculateImpact } from './core/impactCalculator'
import Header from './components/Header'
import TelemetryDashboard from './components/TelemetryDashboard'
import PersonaSetup from './components/PersonaSetup'
import RoutinePlanner from './components/RoutinePlanner'
import IaqHacksGrid from './components/IaqHacksGrid'
import ImpactMetrics from './components/ImpactMetrics'
import AdvisorChat from './components/AdvisorChat'

type Tab = 'dashboard' | 'routine' | 'iaq' | 'impact' | 'advisor'

export default function App() {
  const [readings, setReadings] = useState<AqiReading[]>([])
  const [persona, setPersona] = useState<FamilyPersona>(DEFAULT_PERSONA)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState({ lat: 28.6139, lon: 77.2090, name: 'New Delhi, India' })

  const personaScore = scorePersona(persona)
  const routine = readings.length > 0 ? buildDailyRoutine(readings, personaScore) : null
  const impactMetrics = readings.length > 0
    ? calculateImpact(readings, 2, routine?.safeWindows.length ?? 0, ['carToPublicTransit'])
    : null
  const currentReading = readings[0] ?? null

  const loadData = useCallback(async () => {
    setLoading(true)
    const coords = await getCurrentCoords()
    setLocation({ lat: coords.lat, lon: coords.lon, name: `GPS: ${coords.lat.toFixed(2)}, ${coords.lon.toFixed(2)}` })
    const data = await fetchAirQuality(coords.lat, coords.lon)
    setReadings(data)
    setLoading(false)
  }, [])

  const selectLocation = useCallback(async (loc: { name: string; lat: number; lon: number }) => {
    setLoading(true)
    setLocation({ lat: loc.lat, lon: loc.lon, name: loc.name })
    const data = await fetchAirQuality(loc.lat, loc.lon)
    setReadings(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    // Initial fetch with default location
    fetchAirQuality(location.lat, location.lon).then((data) => {
      setReadings(data)
      setLoading(false)
    })
  }, [])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Air Quality' },
    { id: 'routine', label: 'Daily Routine' },
    { id: 'iaq', label: 'Indoor Air' },
    { id: 'impact', label: 'My Impact' },
    { id: 'advisor', label: 'AI Advisor' },
  ]

  return (
    <div className="app">
      <Header
        location={location.name}
        onRefresh={() => selectLocation(location)}
        onSelectCity={selectLocation}
        onUseGps={loadData}
        loading={loading}
      />
      <main className="main-content" role="main">
        <PersonaSetup persona={persona} onChange={setPersona} score={personaScore} />

        <nav aria-label="App sections" style={{ display: 'flex', gap: '0.5rem', margin: '1.5rem 0 1rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
          <TelemetryDashboard readings={readings} loading={loading} />
        )}
        {activeTab === 'routine' && routine && currentReading && (
          <RoutinePlanner routine={routine} personaScore={personaScore} />
        )}
        {activeTab === 'iaq' && <IaqHacksGrid />}
        {activeTab === 'impact' && impactMetrics && (
          <ImpactMetrics metrics={impactMetrics} />
        )}
        {activeTab === 'advisor' && currentReading && (
          <AdvisorChat
            currentReading={currentReading}
            persona={persona}
            personaScore={personaScore}
          />
        )}
      </main>
    </div>
  )
}
