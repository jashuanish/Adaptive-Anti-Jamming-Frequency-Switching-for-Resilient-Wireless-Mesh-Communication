import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS = [
  {
    value: 100,
    unit: '%',
    label: 'RENDEZVOUS SUCCESS',
    desc: 'All test runs achieved at least one open frequency channel.',
    color: 'var(--p-green)',
    suffix: '%',
  },
  {
    value: 0,
    unit: 'MSG',
    label: 'ZERO MESSAGE LOSS',
    desc: 'No complete message was irrecoverably lost. Levenshtein recovered all partial drops.',
    color: 'var(--p-green)',
    suffix: ' LOST',
  },
  {
    value: 2,
    unit: 'SEC',
    label: 'JAM DETECTION SPEED',
    desc: 'Streaming accumulate-decay scorer triggers within 2 simulation ticks.',
    color: 'var(--p-amber)',
    prefix: '<',
    suffix: 's',
  },
  {
    value: 5,
    unit: 'CH',
    label: 'FREQUENCY CHANNELS',
    desc: 'Five independent per-link channels. Each attempted blind before declaring failure.',
    color: 'var(--p-blue)',
    suffix: ' CH',
  },
  {
    value: 9,
    unit: 'NODE',
    label: 'MESH TOPOLOGY',
    desc: '9-host weighted graph with 14 physical edges. A* tested across all source-target pairs.',
    color: 'var(--p-blue)',
    suffix: ' NODES',
  },
  {
    value: 1,
    unit: 'EDIT',
    label: 'LEVENSHTEIN DIST',
    desc: 'Average reconstruction achieved within 1 edit distance (T_RGET → TARGET).',
    color: 'var(--p-amber)',
    suffix: ' EDIT',
  },
]

const FEATURE_CARDS = [
  { label: 'No prior jammer knowledge', icon: '◎', color: 'var(--p-green)' },
  { label: 'Blind frequency discovery', icon: '⟳', color: 'var(--p-green)' },
  { label: 'Edge-specific interference matrix', icon: '▣', color: 'var(--p-blue)' },
  { label: 'A* optimal route planning', icon: '◈', color: 'var(--p-amber)' },
  { label: 'Levenshtein payload recovery', icon: '≈', color: 'var(--p-blue)' },
  { label: 'Real hardware implementation', icon: '⬡', color: 'var(--p-amber)' },
  { label: 'Dynamic AI jamming simulation', icon: '⚡', color: 'var(--p-red)' },
  { label: 'Military-grade tactical UI', icon: '◉', color: 'var(--p-green)' },
]

function CountUpNumber({ target, duration = 1800, prefix = '', suffix = '' }) {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView || startedRef.current) return
    startedRef.current = true

    if (target === 0) { setValue(0); return }

    const start = Date.now()
    const step = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(1, elapsed / duration)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return (
    <span ref={ref}>
      {prefix}{value}{suffix}
    </span>
  )
}

export default function S10_Research() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="pd-section" style={{ padding: '120px 0', background: 'var(--p-bg)' }}>
      <div className="pd-scanline" style={{ opacity: 0.2 }} />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64, textAlign: 'center' }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 10 · RESEARCH CONTRIBUTION</div>
          <div className="pd-divider-accent" style={{ margin: '0 auto 24px' }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            VERIFIED<br />
            <span style={{ color: 'var(--p-green)' }}>OUTCOMES</span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginBottom: 48 }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              style={{
                padding: '32px 28px',
                background: 'var(--p-surface)',
                border: '1px solid var(--p-divider)',
                borderTop: `2px solid ${stat.color}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Background glow */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%',
                height: '100%',
                background: `radial-gradient(ellipse at top left, ${stat.color}08 0%, transparent 60%)`,
                pointerEvents: 'none',
              }} />

              {/* Count-up number */}
              <div style={{
                fontFamily: 'var(--font-military)',
                fontWeight: 900,
                fontSize: 52,
                lineHeight: 1,
                color: stat.color,
                textShadow: `0 0 20px ${stat.color}40`,
                marginBottom: 8,
              }}>
                <CountUpNumber
                  target={stat.value}
                  prefix={stat.prefix || ''}
                  suffix={stat.suffix || ''}
                  duration={1600}
                />
              </div>

              <div style={{
                fontFamily: 'var(--font-signal)',
                fontSize: 9,
                letterSpacing: '0.18em',
                color: stat.color,
                marginBottom: 8,
                opacity: 0.8,
              }}>
                {stat.label}
              </div>

              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11.5,
                color: 'var(--p-text2)',
                lineHeight: 1.6,
              }}>
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <div className="pd-label" style={{ marginBottom: 20, textAlign: 'center' }}>NOVEL CONTRIBUTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {FEATURE_CARDS.map((fc, i) => (
              <motion.div
                key={fc.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.8 + i * 0.06 }}
                style={{
                  padding: '16px 14px',
                  background: 'var(--p-surface)',
                  border: '1px solid var(--p-divider)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  transition: 'border-color 0.2s',
                  cursor: 'default',
                }}
                whileHover={{ borderColor: `${fc.color}30`, y: -2 }}
              >
                <span style={{ color: fc.color, fontSize: 14, flexShrink: 0 }}>{fc.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11.5,
                  color: 'var(--p-text2)',
                  lineHeight: 1.5,
                }}>
                  {fc.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
