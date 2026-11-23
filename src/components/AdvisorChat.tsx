import { useState, useRef, useEffect } from 'react'
import type { AqiReading, FamilyPersona, PersonaScore } from '../api/types'
import { advisor } from '../ai/advisor'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface Props {
  currentReading: AqiReading
  persona: FamilyPersona
  personaScore: PersonaScore
}

const SUGGESTIONS = [
  'Is it safe to take my child outside today?',
  'What mask should my family wear?',
  'How do I make a cheap DIY air filter?',
  'Why is AQI worse in the morning?',
  'What foods help with PM2.5 exposure?',
]

export default function AdvisorChat({ currentReading, persona, personaScore }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    // Build Gemini history from previous turns
    const history = messages.map((m) => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.text }],
    }))

    const reply = await advisor.chat(text.trim(), currentReading, persona, personaScore, history)
    setMessages((prev) => [...prev, { role: 'assistant', text: reply }])
    setLoading(false)
    inputRef.current?.focus()
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <section aria-label="AI Advisor chat" style={{ display: 'flex', flexDirection: 'column', height: '65vh' }}>
      {!advisor.isAvailable && (
        <div style={{ background: '#eab30820', border: '1px solid #eab30840', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#eab308' }}>
          ⚠ AI advisor requires a Gemini API key. Add <code>VITE_GEMINI_API_KEY</code> to your <code>.env.local</code> file.
        </div>
      )}

      {/* Suggestions */}
      {messages.length === 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p className="label" style={{ marginBottom: '0.5rem' }}>Suggested questions</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={() => sendMessage(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '0.6rem 0.9rem',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '80%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px 12px 12px 2px', padding: '0.6rem 0.9rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            AeroVane is thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about air quality, safety, or recommendations…"
          disabled={loading}
          aria-label="Message to AI advisor"
          style={{
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.75rem',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font)',
            fontSize: '0.9rem',
          }}
        />
        <button
          className="btn btn-primary"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </section>
  )
}
