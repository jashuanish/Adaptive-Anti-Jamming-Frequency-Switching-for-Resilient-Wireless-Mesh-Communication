import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

// 9-node mesh positions (normalized 0-1)
const NODES = [
  { id: 'H1', x: 0.12, y: 0.15 },
  { id: 'H2', x: 0.38, y: 0.10 },
  { id: 'H3', x: 0.68, y: 0.12 },
  { id: 'H4', x: 0.22, y: 0.45 },
  { id: 'H5', x: 0.50, y: 0.40 },
  { id: 'H6', x: 0.80, y: 0.42 },
  { id: 'H7', x: 0.15, y: 0.78 },
  { id: 'H8', x: 0.50, y: 0.82 },
  { id: 'H9', x: 0.84, y: 0.78 },
]

const EDGES = [
  ['H1','H2'],['H1','H4'],['H2','H3'],['H2','H4'],['H2','H5'],
  ['H3','H5'],['H3','H6'],['H4','H5'],['H4','H7'],['H5','H6'],
  ['H5','H8'],['H6','H9'],['H7','H8'],['H8','H9'],
]

// Active route H1 → H4 → H5 → H8 → H9
const ROUTE = ['H1','H4','H5','H8','H9']
const ROUTE_EDGES = [['H1','H4'],['H4','H5'],['H5','H8'],['H8','H9']]
const JAMMED_EDGE = ['H5','H8']

const PHASES = [
  { label: 'MESH FORMATION', desc: 'Nodes discover neighbors and establish link tables.' },
  { label: 'A* ROUTE COMPUTED', desc: 'Optimal path H1→H4→H5→H8→H9 calculated using Euclidean heuristic.' },
  { label: 'PACKET TRANSMISSION', desc: 'Data payload begins traversing the computed route.' },
  { label: 'JAMMER DETECTED', desc: 'Link H5→H8 attacked. Packet bounces back — frequency exhausted.' },
  { label: 'FREQUENCY HOP', desc: 'Blind trial-and-error switches to open channel F3.' },
  { label: 'LINK RESTORED', desc: 'Transmission resumes. Packet delivered to H9.' },
]

function MeshSVG({ phase }) {
  const jammed = phase >= 3
  const hopComplete = phase >= 5
  const packetPos = phase < 2 ? null : ['H1','H4','H5', jammed && !hopComplete ? 'H5' : 'H8','H9'][Math.min(phase - 2, 4)]

  return (
    <svg viewBox="0 0 500 360" style={{ width: '100%', height: '100%' }}>
      {/* Grid dots */}
      {Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 11 }, (_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={c * 50}
            cy={r * 50}
            r={0.8}
            fill="rgba(0,255,157,0.08)"
          />
        ))
      )}

      {/* Edges */}
      {EDGES.map(([a, b]) => {
        const nA = NODES.find(n => n.id === a)
        const nB = NODES.find(n => n.id === b)
        const isRoute = ROUTE_EDGES.some(([ra, rb]) => (ra === a && rb === b) || (ra === b && rb === a))
        const isJammEdge = jammed && (
          (a === JAMMED_EDGE[0] && b === JAMMED_EDGE[1]) ||
          (a === JAMMED_EDGE[1] && b === JAMMED_EDGE[0])
        )
        const x1 = nA.x * 500, y1 = nA.y * 360
        const x2 = nB.x * 500, y2 = nB.y * 360

        return (
          <g key={`${a}-${b}`}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={
                isJammEdge && !hopComplete ? '#FF4D4F' :
                isRoute && phase >= 1 ? '#00FF9D' :
                'rgba(255,255,255,0.07)'
              }
              strokeWidth={isRoute && phase >= 1 ? 1.5 : 1}
              strokeDasharray={isRoute && phase >= 1 ? '4 2' : 'none'}
              style={{
                transition: 'stroke 0.4s ease',
                filter: isJammEdge && !hopComplete ? 'drop-shadow(0 0 4px #FF4D4F)' : isRoute && phase >= 1 ? 'drop-shadow(0 0 3px #00FF9D)' : 'none',
              }}
            />
            {/* Jam bolt */}
            {isJammEdge && !hopComplete && (
              <text
                x={(x1 + x2) / 2 - 6}
                y={(y1 + y2) / 2 + 4}
                fill="#FF4D4F"
                fontSize={12}
                style={{ animation: 'pd-blink 0.4s step-end infinite' }}
              >
                ⚡
              </text>
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {NODES.map((node, i) => {
        const isOnRoute = ROUTE.includes(node.id)
        const isActive = node.id === packetPos
        const cx = node.x * 500, cy = node.y * 360

        return (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.07, type: 'spring', stiffness: 300 }}
          >
            {/* Glow ring for active */}
            {isActive && (
              <circle cx={cx} cy={cy} r={18} fill="rgba(255,176,32,0.15)"
                style={{ animation: 'pd-signal-pulse 1s ease-in-out infinite' }} />
            )}
            <circle
              cx={cx} cy={cy} r={13}
              fill={
                isActive ? 'rgba(255,176,32,0.15)' :
                isOnRoute && phase >= 1 ? 'rgba(0,255,157,0.08)' :
                'rgba(255,255,255,0.04)'
              }
              stroke={
                isActive ? '#FFB020' :
                isOnRoute && phase >= 1 ? '#00FF9D' :
                'rgba(255,255,255,0.1)'
              }
              strokeWidth={isActive ? 2 : 1.5}
              style={{
                filter: isActive ? 'drop-shadow(0 0 8px #FFB020)' : isOnRoute && phase >= 1 ? 'drop-shadow(0 0 4px #00FF9D)' : 'none',
                transition: 'all 0.4s ease',
              }}
            />
            <text
              x={cx} y={cy + 3}
              textAnchor="middle"
              fill={isActive ? '#FFB020' : isOnRoute && phase >= 1 ? '#00FF9D' : 'rgba(255,255,255,0.35)'}
              fontSize={8}
              fontFamily="'Share Tech Mono', monospace"
              fontWeight={600}
            >
              {node.id}
            </text>
          </motion.g>
        )
      })}

      {/* Packet indicator */}
      {packetPos && (
        <motion.g
          key={packetPos + phase}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {(() => {
            const n = NODES.find(nd => nd.id === packetPos)
            return (
              <circle
                cx={n.x * 500}
                cy={n.y * 360}
                r={5}
                fill="#FFB020"
                style={{
                  filter: 'drop-shadow(0 0 8px #FFB020)',
                  animation: 'pd-signal-pulse 0.8s ease-in-out infinite',
                }}
              />
            )
          })()}
        </motion.g>
      )}
    </svg>
  )
}

export default function S04_Architecture() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [phase, setPhase] = useState(-1)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!inView || playing) return
    setPlaying(true)
    let i = 0
    const id = setInterval(() => {
      setPhase(i)
      i++
      if (i >= PHASES.length) clearInterval(id)
    }, 1200)
    return () => clearInterval(id)
  }, [inView, playing])

  const reset = () => {
    setPhase(-1)
    setPlaying(false)
    setTimeout(() => setPlaying(false), 50)
  }

  return (
    <section className="pd-section" style={{ minHeight: '100vh', padding: '120px 0', background: 'var(--p-bg)' }}>
      <div className="pd-scanline" style={{ opacity: 0.3 }} />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 48 }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 04 · MISSION ARCHITECTURE</div>
          <div className="pd-divider-accent" style={{ marginBottom: 24 }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            9-NODE TACTICAL<br />
            <span style={{ color: 'var(--p-green)' }}>MESH NETWORK</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40, alignItems: 'start' }}>
          {/* SVG mesh */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            style={{
              background: 'var(--p-surface)',
              border: '1px solid var(--p-divider)',
              padding: 16,
              height: 400,
            }}
          >
            <div style={{ height: '100%', position: 'relative' }}>
              <MeshSVG phase={phase} />
              <div style={{
                position: 'absolute',
                bottom: 8, left: 8,
                display: 'flex', gap: 16,
              }}>
                {[
                  { color: '#00FF9D', label: 'ACTIVE ROUTE' },
                  { color: '#FFB020', label: 'PACKET' },
                  { color: '#FF4D4F', label: 'JAMMED LINK' },
                ].map(leg => (
                  <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 16, height: 2, background: leg.color, boxShadow: `0 0 4px ${leg.color}` }} />
                    <span style={{ fontFamily: 'var(--font-signal)', fontSize: 9, color: 'var(--p-muted)' }}>
                      {leg.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Phase list */}
          <div>
            <div className="pd-label" style={{ marginBottom: 16 }}>SIMULATION SEQUENCE</div>
            {PHASES.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  opacity: phase >= i ? 1 : 0.3,
                  transition: 'opacity 0.4s ease',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-signal)',
                  fontSize: 10,
                  color: phase === i ? 'var(--p-amber)' : phase > i ? 'var(--p-green)' : 'var(--p-muted)',
                  width: 20,
                  flexShrink: 0,
                  paddingTop: 1,
                }}>
                  {phase > i ? '✓' : `0${i+1}`}
                </div>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-military)',
                    fontWeight: 700,
                    fontSize: 13,
                    color: phase === i ? 'var(--p-amber)' : 'var(--p-text1)',
                    marginBottom: 3,
                    transition: 'color 0.3s',
                  }}>
                    {p.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'var(--p-text2)',
                    lineHeight: 1.5,
                  }}>
                    {p.desc}
                  </div>
                </div>
              </div>
            ))}

            <button
              className="pd-btn-ghost"
              onClick={reset}
              style={{ marginTop: 20, width: '100%', fontSize: 11, padding: '10px 16px' }}
            >
              ↺ REPLAY SEQUENCE
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
