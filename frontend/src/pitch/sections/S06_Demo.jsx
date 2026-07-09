import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const DEMO_STEPS = [
  {
    id: 'packet',
    label: 'PACKET QUEUED',
    icon: '◉',
    color: 'var(--p-green)',
    desc: 'Message "TARGET ALPHA" queued for transmission. A* computes route H1→H4→H5→H8→H9.',
    freqState: [null, null, null, null, null],
    packetChar: 'T',
  },
  {
    id: 'transmit',
    label: 'TRANSMITTING',
    icon: '→',
    color: 'var(--p-green)',
    desc: 'Packet attempts F2 on link H4→H5. Signal probe initiated.',
    freqState: [null, 'try', null, null, null],
    packetChar: 'T',
  },
  {
    id: 'jam',
    label: 'JAMMING DETECTED',
    icon: '⚡',
    color: 'var(--p-red)',
    desc: 'F2 jammed. ACK not received. Packet bounces back. Failure recorded.',
    freqState: [null, 'fail', null, null, null],
    packetChar: 'T',
  },
  {
    id: 'buffer',
    label: 'BUFFERING',
    icon: '◌',
    color: 'var(--p-amber)',
    desc: 'System buffers the packet. Jam detection score increments. Retrying next tick.',
    freqState: [null, 'fail', null, null, null],
    packetChar: '…',
  },
  {
    id: 'hop',
    label: 'FREQUENCY HOP',
    icon: '⟳',
    color: 'var(--p-amber)',
    desc: 'Blind selection of F4 — untried on this link. Probe transmitted.',
    freqState: [null, 'fail', null, 'try', null],
    packetChar: 'T',
  },
  {
    id: 'reconnect',
    label: 'LINK RESTORED',
    icon: '✓',
    color: 'var(--p-green)',
    desc: 'F4 is clear. ACK received. Packet successfully crosses H4→H5.',
    freqState: [null, 'fail', null, 'ok', null],
    packetChar: 'T',
  },
  {
    id: 'delivered',
    label: 'DELIVERED',
    icon: '◈',
    color: 'var(--p-green)',
    desc: 'Payload "TARGET ALPHA" reconstructed and delivered to H9. Zero data loss.',
    freqState: [null, 'fail', null, 'ok', null],
    packetChar: '✓',
  },
]

function FreqBars({ state }) {
  const labels = ['F1', 'F2', 'F3', 'F4', 'F5']
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
      {labels.map((f, i) => {
        const s = state[i]
        return (
          <div key={f} style={{
            flex: 1,
            padding: '8px 4px',
            textAlign: 'center',
            background:
              s === 'ok' ? 'rgba(0,255,157,0.12)' :
              s === 'fail' ? 'rgba(255,77,79,0.12)' :
              s === 'try' ? 'rgba(255,176,32,0.12)' :
              'rgba(255,255,255,0.03)',
            border: `1px solid ${
              s === 'ok' ? 'rgba(0,255,157,0.35)' :
              s === 'fail' ? 'rgba(255,77,79,0.3)' :
              s === 'try' ? 'rgba(255,176,32,0.35)' :
              'rgba(255,255,255,0.05)'
            }`,
            borderRadius: 2,
            transition: 'all 0.4s ease',
          }}>
            <div style={{ fontFamily: 'var(--font-signal)', fontSize: 8, color: 'var(--p-muted)', marginBottom: 3 }}>{f}</div>
            <div style={{ fontSize: 10,
              color: s === 'ok' ? 'var(--p-green)' : s === 'fail' ? 'var(--p-red)' : s === 'try' ? 'var(--p-amber)' : 'transparent'
            }}>
              {s === 'ok' ? '✓' : s === 'fail' ? '✕' : s === 'try' ? '…' : '·'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Animated packet trail between two points
function PacketTrail({ from, to, color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-signal)', fontSize: 9, color,
        flexShrink: 0,
        boxShadow: `0 0 10px ${color}40`,
      }}>{from}</div>
      <div style={{ flex: 1, height: 2, background: `${color}30`, position: 'relative', overflow: 'visible' }}>
        <motion.div
          animate={{ left: ['0%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 8, height: 8, borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <div style={{
          position: 'absolute',
          top: -8, left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-signal)',
          fontSize: 7,
          color: 'var(--p-muted)',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `2px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-signal)', fontSize: 9, color,
        flexShrink: 0,
        boxShadow: `0 0 10px ${color}40`,
      }}>{to}</div>
    </div>
  )
}

export default function S06_Demo() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(false)

  useEffect(() => {
    if (!inView || auto) return
    setAuto(true)
    const id = setInterval(() => {
      setStep(s => {
        if (s >= DEMO_STEPS.length - 1) { clearInterval(id); return s }
        return s + 1
      })
    }, 1500)
    return () => clearInterval(id)
  }, [inView, auto])

  const current = DEMO_STEPS[step]

  return (
    <section className="pd-section" style={{ minHeight: '90vh', padding: '120px 0', background: 'var(--p-bg)' }}>
      <div className="pd-scanline" style={{ opacity: 0.25 }} />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 48 }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 06 · LIVE DEMONSTRATION</div>
          <div className="pd-divider-accent" style={{ marginBottom: 24 }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            PACKET LIFECYCLE<br />
            <span style={{ color: 'var(--p-amber)' }}>UNDER JAMMING</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
          {/* Step display */}
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                style={{
                  padding: 32,
                  background: 'var(--p-surface)',
                  border: `1px solid ${current.color}30`,
                  borderTop: `3px solid ${current.color}`,
                  marginBottom: 24,
                }}
              >
                {/* Status icon */}
                <div style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  border: `2px solid ${current.color}`,
                  background: `${current.color}12`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  color: current.color,
                  marginBottom: 16,
                  boxShadow: `0 0 20px ${current.color}30`,
                }}>
                  {current.icon}
                </div>

                <div style={{
                  fontFamily: 'var(--font-military)',
                  fontWeight: 800,
                  fontSize: 22,
                  color: current.color,
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}>
                  {current.label}
                </div>

                <p className="pd-body" style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
                  {current.desc}
                </p>

                {/* Packet display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="pd-label">PACKET CHAR</div>
                  <div style={{
                    fontFamily: 'var(--font-signal)',
                    fontSize: 28,
                    color: current.packetChar === '✓' ? 'var(--p-green)' :
                           current.packetChar === '…' ? 'var(--p-amber)' : 'var(--p-text1)',
                    letterSpacing: '0.1em',
                    textShadow: current.packetChar === '✓' ? '0 0 12px rgba(0,255,157,0.5)' : 'none',
                  }}>
                    {current.packetChar}
                  </div>
                </div>

                {/* Freq state */}
                <div className="pd-label" style={{ marginBottom: 6 }}>FREQUENCY CHANNEL STATUS</div>
                <FreqBars state={current.freqState} />
              </motion.div>
            </AnimatePresence>

            {/* Link visualization */}
            {step >= 1 && (
              <div style={{
                padding: 20,
                background: 'var(--p-surface)',
                border: '1px solid var(--p-divider)',
              }}>
                <div className="pd-label" style={{ marginBottom: 12 }}>ACTIVE LINK</div>
                <PacketTrail
                  from="H4" to="H5"
                  color={step === 2 || step === 3 ? 'var(--p-red)' : step >= 5 ? 'var(--p-green)' : 'var(--p-amber)'}
                  label={step === 2 || step === 3 ? 'JAMMED' : step >= 5 ? 'CLEAR — F4' : 'PROBING…'}
                />
              </div>
            )}
          </div>

          {/* Step list */}
          <div>
            <div className="pd-label" style={{ marginBottom: 16 }}>TRANSMISSION SEQUENCE</div>
            {DEMO_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  background: step === i ? `${s.color}10` : 'transparent',
                  border: `1px solid ${step === i ? `${s.color}30` : 'rgba(255,255,255,0.04)'}`,
                  cursor: 'pointer',
                  marginBottom: 4,
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderLeft: step === i ? `3px solid ${s.color}` : '3px solid transparent',
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `1.5px solid ${i <= step ? s.color : 'rgba(255,255,255,0.1)'}`,
                  background: i < step ? `${s.color}20` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: i < step ? 10 : 11,
                  color: i <= step ? s.color : 'var(--p-muted)',
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}>
                  {i < step ? '✓' : s.icon}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-military)',
                    fontWeight: 700,
                    fontSize: 13,
                    color: step === i ? s.color : 'var(--p-text2)',
                    letterSpacing: '0.05em',
                  }}>
                    {s.label}
                  </div>
                </div>
              </button>
            ))}

            {/* Controls */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="pd-btn-ghost"
                onClick={() => setStep(s => Math.max(0, s - 1))}
                style={{ flex: 1, fontSize: 11, padding: '9px 0' }}
                disabled={step === 0}
              >
                ← PREV
              </button>
              <button
                className="pd-btn-ghost"
                onClick={() => setStep(s => Math.min(DEMO_STEPS.length - 1, s + 1))}
                style={{ flex: 1, fontSize: 11, padding: '9px 0' }}
                disabled={step === DEMO_STEPS.length - 1}
              >
                NEXT →
              </button>
              <button
                className="pd-btn-ghost"
                onClick={() => { setStep(0); setAuto(false) }}
                style={{ fontSize: 11, padding: '9px 14px' }}
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
