import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const TRADITIONAL = [
  { text: 'Static, predefined frequency sequence', bad: true },
  { text: 'Sequence known by both sides a priori', bad: true },
  { text: 'Global jamming defeats all channels', bad: true },
  { text: 'No per-link intelligence', bad: true },
  { text: 'Fails under dynamic jamming patterns', bad: true },
  { text: 'Sender assumes omniscient jammer knowledge', bad: true },
]

const OURS = [
  { text: 'Blind trial-and-error — no prior knowledge required', good: true },
  { text: 'Edge-specific per-link frequency state machine', good: true },
  { text: 'Real-time adaptive frequency switching', good: true },
  { text: 'Dynamic jamming matrix updated every tick', good: true },
  { text: 'A* optimal routing across 9-node mesh', good: true },
  { text: 'Levenshtein reconstruction of dropped payloads', good: true },
]

function CheckIcon({ good }) {
  if (good) return (
    <svg className="check-icon" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="rgba(0,255,157,0.12)" stroke="rgba(0,255,157,0.4)" />
      <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#00FF9D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  return (
    <svg className="check-icon" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="8" fill="rgba(255,77,79,0.1)" stroke="rgba(255,77,79,0.3)" />
      <path d="M6 12l6-6M12 12L6 6" stroke="#FF4D4F" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Animated frequency bars
function FreqComparison({ traditional }) {
  const bars = [0.9, 0.6, 0.8, 0.7, 0.5]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 50, padding: '8px 0' }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${h * 100}%`,
          background: traditional ? 'var(--p-red)' : 'var(--p-green)',
          opacity: traditional ? (i === 1 || i === 3 ? 0.15 : 0.7) : 0.8,
          boxShadow: traditional ? 'none' : `0 0 6px var(--p-green)`,
          borderRadius: '2px 2px 0 0',
          transition: 'all 0.4s ease',
          animation: traditional ? 'none' : `pd-rf-wave ${0.5 + i * 0.1}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
    </div>
  )
}

export default function S03_WhyFail() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="pd-section" style={{
      minHeight: '100vh',
      padding: '120px 0',
      background: 'var(--p-surface)',
    }}>
      <div className="pd-grid-bg" />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64, textAlign: 'center' }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 03 · SYSTEM COMPARISON</div>
          <div className="pd-divider-accent" style={{ margin: '0 auto 24px' }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            WHY EXISTING SYSTEMS<br />
            <span style={{ color: 'var(--p-amber)' }}>FAIL UNDER FIRE</span>
          </h2>
        </motion.div>

        {/* Comparison */}
        <motion.div
          className="pd-compare-grid"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {/* Traditional FHSS */}
          <div className="pd-compare-col" style={{ borderTop: '3px solid var(--p-red)' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: 'var(--font-signal)',
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--p-red)',
                marginBottom: 4,
              }}>
                LEGACY APPROACH
              </div>
              <div className="pd-subhead" style={{ fontSize: 22, color: 'var(--p-text2)' }}>
                Traditional FHSS
              </div>
            </div>

            <FreqComparison traditional />

            <div className="pd-label" style={{ margin: '16px 0 12px', color: 'var(--p-red)' }}>
              KNOWN VULNERABILITIES
            </div>

            {TRADITIONAL.map((item, i) => (
              <motion.div
                key={i}
                className="pd-compare-row"
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.08 }}
              >
                <CheckIcon />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Our system */}
          <div className="pd-compare-col ours" style={{ borderTop: '3px solid var(--p-green)' }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontFamily: 'var(--font-signal)',
                fontSize: 10,
                letterSpacing: '0.2em',
                color: 'var(--p-green)',
                marginBottom: 4,
              }}>
                PROPOSED SYSTEM
              </div>
              <div className="pd-subhead" style={{ fontSize: 22, color: 'var(--p-text1)' }}>
                Adaptive Blind Hopping
              </div>
            </div>

            <FreqComparison traditional={false} />

            <div className="pd-label" style={{ margin: '16px 0 12px' }}>
              CAPABILITIES
            </div>

            {OURS.map((item, i) => (
              <motion.div
                key={i}
                className="pd-compare-row"
                initial={{ opacity: 0, x: 10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.08 }}
                style={{ color: 'var(--p-text1)' }}
              >
                <CheckIcon good />
                <span>{item.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Key differentiator callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1.2, duration: 0.6 }}
          style={{
            marginTop: 40,
            padding: '24px 32px',
            background: 'rgba(0,255,157,0.04)',
            border: '1px solid rgba(0,255,157,0.15)',
            borderLeft: '3px solid var(--p-green)',
          }}
        >
          <div className="pd-label" style={{ marginBottom: 8 }}>CORE NOVELTY</div>
          <p className="pd-body" style={{ fontSize: 14, color: 'var(--p-text1)' }}>
            Unlike all existing simulators, our sender has <strong style={{ color: 'var(--p-green)' }}>zero a priori knowledge</strong> of
            the jammer's state. It physically attempts transmission — discovering jammed
            frequencies only upon failure — exactly as real field hardware behaves.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
