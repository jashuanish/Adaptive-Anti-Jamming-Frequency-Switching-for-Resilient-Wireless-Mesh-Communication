import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const STORY_STEPS = [
  {
    id: 'radio',
    icon: '📡',
    label: 'FRIENDLY RADIO',
    status: 'NOMINAL',
    color: 'var(--p-green)',
    desc: 'Field unit broadcasting on 2.4 GHz. Message transmission initiated.',
  },
  {
    id: 'jammer',
    icon: '⚡',
    label: 'ENEMY JAMMER ACTIVATED',
    status: 'THREAT',
    color: 'var(--p-red)',
    desc: 'Hostile EW system sweeps the RF spectrum. All known frequencies attacked simultaneously.',
  },
  {
    id: 'lost',
    icon: '✕',
    label: 'SIGNAL LOST',
    status: 'FAILURE',
    color: 'var(--p-amber)',
    desc: 'Packet lost. Traditional FHSS fails — predefined sequence was predictable.',
  },
  {
    id: 'mission',
    icon: '⚠',
    label: 'MISSION COMPROMISED',
    status: 'CRITICAL',
    color: 'var(--p-red)',
    desc: 'Command cannot reach field units. Coordination breaks down. Lives at risk.',
  },
]

function StoryStep({ step, index, isActive, isComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={isActive || isComplete ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 24,
        padding: '24px 0',
        borderBottom: index < STORY_STEPS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
        opacity: isActive || isComplete ? 1 : 0.2,
      }}
    >
      {/* Number + connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `2px solid ${step.color}`,
          background: `${step.color}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          boxShadow: isActive ? `0 0 20px ${step.color}50` : 'none',
          transition: 'box-shadow 0.4s ease',
        }}>
          {step.icon}
        </div>
        {index < STORY_STEPS.length - 1 && (
          <div style={{
            width: 2,
            height: 40,
            background: isComplete ? step.color : 'rgba(255,255,255,0.06)',
            marginTop: 4,
            transition: 'background 0.4s ease',
            boxShadow: isComplete ? `0 0 6px ${step.color}` : 'none',
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            fontFamily: 'var(--font-military)',
            fontWeight: 800,
            fontSize: 18,
            color: step.color,
            letterSpacing: '0.06em',
          }}>
            {step.label}
          </span>
          <span style={{
            fontFamily: 'var(--font-signal)',
            fontSize: 9,
            letterSpacing: '0.18em',
            padding: '3px 8px',
            border: `1px solid ${step.color}40`,
            color: step.color,
            background: `${step.color}10`,
          }}>
            {step.status}
          </span>
        </div>
        <p className="pd-body" style={{ fontSize: 13, lineHeight: 1.7 }}>
          {step.desc}
        </p>
      </div>
    </motion.div>
  )
}

// Animated RF interference visualization
function InterferenceViz({ active }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const W = canvas.offsetWidth, H = canvas.offsetHeight

    function draw() {
      timeRef.current += 0.02
      ctx.clearRect(0, 0, W, H)

      const jamming = active
      // Draw 5 frequency lanes
      for (let f = 0; f < 5; f++) {
        const y = (f + 0.5) * H / 5
        const isJammed = jamming && f < 4

        // Lane label
        ctx.fillStyle = 'rgba(139,144,153,0.5)'
        ctx.font = '8px "Share Tech Mono", monospace'
        ctx.fillText(`F${f + 1}`, 4, y + 3)

        if (isJammed) {
          // Noise fill
          for (let x = 24; x < W; x += 4) {
            const noise = (Math.random() - 0.5) * 14
            ctx.fillStyle = 'rgba(255,77,79,0.15)'
            ctx.fillRect(x, y + noise - 2, 3, 4)
          }
          // Jam label
          ctx.fillStyle = 'rgba(255,77,79,0.6)'
          ctx.fillText('JAMMED', W - 56, y + 3)
        } else {
          // Signal wave
          ctx.beginPath()
          ctx.strokeStyle = f === 4 && jamming ? 'rgba(0,255,157,0.8)' : 'rgba(0,255,157,0.4)'
          ctx.lineWidth = f === 4 && jamming ? 2 : 1
          for (let x = 24; x < W - 60; x += 2) {
            const signal = Math.sin(x * 0.06 + timeRef.current * 2 + f) * 6
            if (x === 24) ctx.moveTo(x, y + signal)
            else ctx.lineTo(x, y + signal)
          }
          ctx.stroke()
          if (f === 4 && jamming) {
            ctx.fillStyle = 'rgba(0,255,157,0.7)'
            ctx.fillText('OPEN ✓', W - 56, y + 3)
          }
        }
      }

      // Frequency axis
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(20, 0); ctx.lineTo(20, H)
      ctx.stroke()

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 150, display: 'block', borderRadius: 4 }}
    />
  )
}

export default function S02_Problem() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [activeStep, setActiveStep] = useState(-1)

  useEffect(() => {
    if (!inView) return
    let i = 0
    const id = setInterval(() => {
      setActiveStep(v => v + 1)
      i++
      if (i >= STORY_STEPS.length) clearInterval(id)
    }, 800)
    return () => clearInterval(id)
  }, [inView])

  return (
    <section className="pd-section" style={{ minHeight: '100vh', padding: '120px 0', background: 'var(--p-bg)' }}>
      <div className="pd-grid-bg" style={{ opacity: 0.5 }} />

      <div className="pd-container" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64 }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 02 · THE PROBLEM</div>
          <div className="pd-divider-accent" style={{ marginBottom: 24 }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
            WHEN COMMUNICATION<br />
            <span style={{ color: 'var(--p-red)' }}>GOES DARK</span>
          </h2>
          <p className="pd-body" style={{ marginTop: 16, maxWidth: 520, fontSize: 14 }}>
            In contested electromagnetic environments, a single jammer can silence an entire
            field operation. Traditional frequency hopping is predictable. Adversaries exploit
            that predictability.
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          {/* Story steps */}
          <div>
            {STORY_STEPS.map((step, i) => (
              <StoryStep
                key={step.id}
                step={step}
                index={i}
                isActive={activeStep === i}
                isComplete={activeStep > i}
              />
            ))}
          </div>

          {/* Right: visualization */}
          <div>
            <div style={{
              background: 'var(--p-surface)',
              border: '1px solid var(--p-divider)',
              padding: 24,
              marginBottom: 20,
            }}>
              <div className="pd-label" style={{ marginBottom: 16 }}>LIVE RF SPECTRUM MONITOR</div>
              <InterferenceViz active={activeStep >= 1} />
            </div>

            {/* Status indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'TRANSMISSION STATUS', val: activeStep >= 2 ? 'FAILED' : 'ACTIVE', color: activeStep >= 2 ? 'var(--p-red)' : 'var(--p-green)' },
                { label: 'JAMMER STATE', val: activeStep >= 1 ? 'ACTIVE' : 'CLEAR', color: activeStep >= 1 ? 'var(--p-red)' : 'var(--p-green)' },
                { label: 'FREQUENCIES JAMMED', val: activeStep >= 1 ? '4 / 5' : '0 / 5', color: activeStep >= 1 ? 'var(--p-amber)' : 'var(--p-green)' },
                { label: 'MISSION STATUS', val: activeStep >= 3 ? 'COMPROMISED' : 'NOMINAL', color: activeStep >= 3 ? 'var(--p-red)' : 'var(--p-green)' },
              ].map(item => (
                <div key={item.label} style={{
                  padding: '14px 16px',
                  background: 'var(--p-surface)',
                  border: '1px solid var(--p-divider)',
                }}>
                  <div className="pd-label" style={{ marginBottom: 6 }}>{item.label}</div>
                  <div style={{
                    fontFamily: 'var(--font-signal)',
                    fontSize: 13,
                    color: item.color,
                    fontWeight: 600,
                    transition: 'color 0.4s ease',
                  }}>
                    {item.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
