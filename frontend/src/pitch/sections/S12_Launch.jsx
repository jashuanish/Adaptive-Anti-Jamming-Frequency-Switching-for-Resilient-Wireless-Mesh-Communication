import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const MISSION_LINES = [
  { key: 'OP', val: 'ECLIPSE-7' },
  { key: 'CLASSIFICATION', val: 'PROJECT DAA' },
  { key: 'UNIT', val: 'RVCE · 2025' },
  { key: 'COMMS', val: 'RF MESH · 9-NODE · 2.4 GHz' },
  { key: 'ALGORITHM', val: 'A* · BLIND-FREQ-HOP · LEVENSHTEIN' },
  { key: 'STATUS', val: 'ALL SYSTEMS NOMINAL' },
  { key: 'AUTHORIZATION', val: 'GRANTED' },
]

function TerminalText({ lines, onComplete }) {
  const [shown, setShown] = useState([])
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setShown(v => [...v, i])
      i++
      if (i >= lines.length) {
        clearInterval(id)
        setTimeout(() => onComplete?.(), 400)
      }
    }, 200)
    return () => clearInterval(id)
  }, [lines.length, onComplete])

  return (
    <div style={{
      fontFamily: 'var(--font-signal)',
      fontSize: 11.5,
      lineHeight: 2,
      color: 'var(--p-text2)',
    }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            opacity: shown.includes(i) ? 1 : 0,
            transform: shown.includes(i) ? 'none' : 'translateX(-8px)',
            transition: 'all 0.25s ease',
            display: 'flex',
            gap: 16,
          }}
        >
          <span style={{ color: 'var(--p-muted)', width: 130, flexShrink: 0 }}>
            {line.key}
          </span>
          <span style={{
            color: line.key === 'STATUS' || line.key === 'AUTHORIZATION'
              ? 'var(--p-green)' : 'var(--p-text1)',
            letterSpacing: '0.06em',
          }}>
            {line.val}
          </span>
        </div>
      ))}
    </div>
  )
}

// Animated radar ring
function RadarRing() {
  return (
    <div style={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
      {/* Rings */}
      {[1, 0.66, 0.33].map((r, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid rgba(0,255,157,0.15)',
            borderRadius: '50%',
            margin: `${(1 - r) * 100}px`,
          }}
        />
      ))}
      {/* Crosshairs */}
      <div style={{
        position: 'absolute',
        top: '50%', left: 0, right: 0,
        height: 1,
        background: 'rgba(0,255,157,0.1)',
      }} />
      <div style={{
        position: 'absolute',
        left: '50%', top: 0, bottom: 0,
        width: 1,
        background: 'rgba(0,255,157,0.1)',
      }} />
      {/* Sweep */}
      <div style={{
        position: 'absolute',
        inset: 0,
        animation: 'pd-radar-sweep 3s linear infinite',
        transformOrigin: 'center',
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '50%',
          height: 1,
          background: 'linear-gradient(to right, rgba(0,255,157,0.8), transparent)',
          transformOrigin: 'left center',
        }} />
      </div>
      {/* Center dot */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 6, height: 6,
        borderRadius: '50%',
        background: 'var(--p-green)',
        boxShadow: '0 0 10px var(--p-green)',
      }} />
      {/* Blips */}
      {[
        { top: '25%', left: '62%', delay: '1.2s' },
        { top: '65%', left: '35%', delay: '0.4s' },
        { top: '42%', left: '78%', delay: '2.1s' },
      ].map((bl, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...bl,
          width: 4, height: 4,
          borderRadius: '50%',
          background: 'var(--p-green)',
          boxShadow: '0 0 6px var(--p-green)',
          animation: 'pd-pulse-dot 1.8s ease-in-out infinite',
          animationDelay: bl.delay,
        }} />
      ))}
    </div>
  )
}

export default function S12_Launch({ onLaunch }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [ready, setReady] = useState(false)
  const [launching, setLaunching] = useState(false)

  const handleLaunch = () => {
    setLaunching(true)
    setTimeout(() => onLaunch(), 600)
  }

  return (
    <section
      className="pd-section"
      ref={ref}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--p-bg)',
        position: 'relative',
      }}
    >
      {/* Grid */}
      <div className="pd-grid-bg" />
      <div className="pd-scanline" style={{ opacity: 0.3 }} />

      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: '30%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(0,255,157,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="pd-container" style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 80, alignItems: 'center' }}>
          {/* Left content */}
          <div>
            {/* Section label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="pd-label"
              style={{ marginBottom: 16 }}
            >
              SECTION 12 · LAUNCH SEQUENCE
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="pd-headline" style={{
                fontSize: 'clamp(52px, 7vw, 88px)',
                marginBottom: 8,
              }}>
                MISSION
              </div>
              <div className="pd-headline" style={{
                fontSize: 'clamp(52px, 7vw, 88px)',
                color: 'var(--p-green)',
                textShadow: '0 0 40px rgba(0,255,157,0.25)',
                marginBottom: 32,
                animation: ready ? 'pd-flicker 6s ease-in-out infinite' : 'none',
              }}>
                READY
              </div>
            </motion.div>

            {/* Mission brief terminal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                background: 'var(--p-surface)',
                border: '1px solid rgba(0,255,157,0.15)',
                padding: '20px 24px',
                marginBottom: 40,
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute',
                top: -1, left: 16,
                background: 'var(--p-surface)',
                padding: '0 8px',
                fontFamily: 'var(--font-signal)',
                fontSize: 9,
                letterSpacing: '0.2em',
                color: 'var(--p-green)',
              }}>
                MISSION BRIEFING
              </div>
              {inView && (
                <TerminalText
                  lines={MISSION_LINES}
                  onComplete={() => setReady(true)}
                />
              )}
            </motion.div>

            {/* Launch button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', gap: 16, alignItems: 'center' }}
            >
              <button
                id="launch-btn"
                className="pd-btn-primary"
                onClick={handleLaunch}
                disabled={launching}
                style={{
                  fontSize: 17,
                  padding: '16px 40px',
                  opacity: launching ? 0.6 : 1,
                  letterSpacing: '0.14em',
                }}
              >
                {launching ? 'INITIALIZING…' : 'LAUNCH TACTICAL SIMULATION'}
                {!launching && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8h9M9.5 4.5l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </motion.div>

            {/* Bottom note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={ready ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              style={{
                marginTop: 20,
                fontFamily: 'var(--font-signal)',
                fontSize: 10,
                color: 'var(--p-muted)',
                letterSpacing: '0.12em',
              }}
            >
              ↑ LOADS THE LIVE SIMULATION DASHBOARD · NO RELOAD
            </motion.div>
          </div>

          {/* Right: Radar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <RadarRing />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
