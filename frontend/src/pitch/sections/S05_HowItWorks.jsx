import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const ALGORITHMS = [
  {
    num: '01',
    name: 'A* ROUTE PLANNING',
    tag: 'MACRO-ROUTING',
    color: 'var(--p-green)',
    icon: '◈',
    desc: 'Calculates the geographically optimal path across the 9-node mesh using a Euclidean distance heuristic. Guarantees shortest path while minimizing search space.',
    detail: 'f(n) = g(n) + h(n) where g is path cost and h is Euclidean distance to target. Open/closed set management ensures no node is evaluated twice.',
  },
  {
    num: '02',
    name: 'BLIND FREQUENCY SEARCH',
    tag: 'GREEDY SELECTION',
    color: 'var(--p-amber)',
    icon: '⟳',
    desc: 'On each hop, selects an untried frequency from the 5-channel band. Records failures per-link. Greedy selection without backtracking — simulates real ACK-failure behavior.',
    detail: 'No global state. Each link maintains its own attempted_freqs set. On ACK failure, freq is blacklisted for this hop. Full blacklist = packet dropped (underscore placeholder).',
  },
  {
    num: '03',
    name: 'ACCUMULATE & DECAY',
    tag: 'JAM DETECTION',
    color: 'var(--p-blue)',
    icon: '◉',
    desc: 'Streaming detection of jamming onset by accumulating hop-failure counts and decaying them over time. Triggers adaptive response before full saturation.',
    detail: 'Score += 1 on each failure, × 0.85 decay per tick. Threshold crossing fires the adaptive evasion routine and pushes THREAT alert to the command HUD.',
  },
  {
    num: '04',
    name: 'EDGE-SPECIFIC AI JAMMER',
    tag: 'DYNAMIC JAMMING',
    color: 'var(--p-red)',
    icon: '⚡',
    desc: 'Independent interference matrix per physical link. Frequency 1 may be jammed on link H1-H2 but completely clear on H2-H3. Dynamic mode re-randomizes every tick.',
    detail: 'jammed_edges[(node1, node2)][freq] = True/False. Randomizer runs independently per-edge per-tick when dynamic_mode=true. Creates unpredictable multi-link attack patterns.',
  },
  {
    num: '05',
    name: 'LEVENSHTEIN RECONSTRUCTION',
    tag: 'PAYLOAD RECOVERY',
    color: 'var(--p-green)',
    icon: '≈',
    desc: 'When packets are totally dropped (underscore placeholders), the receiver uses Levenshtein edit-distance against a tactical dictionary to reconstruct the original message.',
    detail: 'T_RGET → TARGET. Minimum edit distance = 1 (substitution). Dictionary includes tactical keywords: TARGET, CONFIRM, ABORT, MISSION, SIGNAL, PACKET, ROUTE.',
  },
  {
    num: '06',
    name: 'GRAPH MESH TOPOLOGY',
    tag: 'NETWORK THEORY',
    color: 'var(--p-amber)',
    icon: '⬡',
    desc: 'Weighted undirected graph of 9 nodes with 14 edges. Edge weights derived from Euclidean distance between node coordinates. Supports dynamic link failure simulation.',
    detail: 'Adjacency represented as weighted dict. A* operates on this graph. Future: dynamic A* re-routing if any link reaches 100% jam saturation for N consecutive ticks.',
  },
]

function AlgoViz({ algo }) {
  if (algo.num === '01') {
    // A* path visualization
    return (
      <svg viewBox="0 0 200 80" style={{ width: '100%', height: 80 }}>
        {['H1','H4','H5','H8','H9'].map((n, i) => (
          <g key={n}>
            <circle cx={20 + i * 40} cy={40} r={10}
              fill="rgba(0,255,157,0.1)" stroke="#00FF9D" strokeWidth={1.5} />
            <text x={20 + i * 40} y={44} textAnchor="middle"
              fill="#00FF9D" fontSize={6} fontFamily="'Share Tech Mono', monospace">{n}</text>
            {i < 4 && (
              <line x1={30 + i * 40} y1={40} x2={50 + i * 40} y2={40}
                stroke="#00FF9D" strokeWidth={1} strokeDasharray="2 2"
                style={{ filter: 'drop-shadow(0 0 2px #00FF9D)' }} />
            )}
          </g>
        ))}
        <text x={100} y={68} textAnchor="middle"
          fill="rgba(0,255,157,0.4)" fontSize={7} fontFamily="'Share Tech Mono', monospace">
          f(n) = g(n) + h(n)
        </text>
      </svg>
    )
  }
  if (algo.num === '02') {
    // Frequency hop visualization
    const freqs = ['F1','F2','F3','F4','F5']
    const states = ['FAIL','FAIL','OK','—','—']
    return (
      <div style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
        {freqs.map((f, i) => (
          <div key={f} style={{
            flex: 1,
            padding: '8px 4px',
            textAlign: 'center',
            background: states[i] === 'OK' ? 'rgba(0,255,157,0.1)' : states[i] === 'FAIL' ? 'rgba(255,77,79,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${states[i] === 'OK' ? 'rgba(0,255,157,0.3)' : states[i] === 'FAIL' ? 'rgba(255,77,79,0.2)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: 2,
          }}>
            <div style={{ fontFamily: 'var(--font-signal)', fontSize: 8, color: 'var(--p-muted)', marginBottom: 4 }}>{f}</div>
            <div style={{ fontFamily: 'var(--font-signal)', fontSize: 9, color: states[i] === 'OK' ? 'var(--p-green)' : states[i] === 'FAIL' ? 'var(--p-red)' : 'var(--p-muted)' }}>
              {states[i]}
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (algo.num === '04') {
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4 }}>
          {['H1-H2','H2-H4','H4-H5','H5-H8','H8-H9','H3-H6'].map((edge, i) => {
            const jammed = i === 3
            return (
              <div key={edge} style={{
                padding: '6px 8px',
                background: jammed ? 'rgba(255,77,79,0.1)' : 'rgba(0,255,157,0.05)',
                border: `1px solid ${jammed ? 'rgba(255,77,79,0.25)' : 'rgba(0,255,157,0.1)'}`,
                borderRadius: 2,
              }}>
                <div style={{ fontFamily: 'var(--font-signal)', fontSize: 7.5, color: 'var(--p-muted)' }}>{edge}</div>
                <div style={{ fontFamily: 'var(--font-signal)', fontSize: 8, color: jammed ? 'var(--p-red)' : 'var(--p-green)', marginTop: 2 }}>
                  {jammed ? '⚡ JAMMED' : '✓ CLEAR'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
  if (algo.num === '05') {
    return (
      <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-signal)', fontSize: 18, color: 'var(--p-red)' }}>T_RGET</div>
        <div style={{ fontSize: 16, color: 'var(--p-muted)' }}>→</div>
        <div style={{ fontFamily: 'var(--font-signal)', fontSize: 18, color: 'var(--p-green)', textShadow: '0 0 12px rgba(0,255,157,0.4)' }}>TARGET</div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-signal)', fontSize: 10, color: 'var(--p-text2)' }}>
          dist = 1
        </div>
      </div>
    )
  }
  return null
}

export default function S05_HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [expanded, setExpanded] = useState(null)

  return (
    <section className="pd-section" style={{ minHeight: '100vh', padding: '120px 0', background: 'var(--p-surface)' }}>
      <div className="pd-grid-bg" />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 64 }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 05 · ALGORITHMIC STACK</div>
          <div className="pd-divider-accent" style={{ marginBottom: 24 }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            HOW IT<br />
            <span style={{ color: 'var(--p-green)' }}>WORKS</span>
          </h2>
          <p className="pd-body" style={{ marginTop: 16, maxWidth: 500, fontSize: 14 }}>
            Six algorithmic layers operating in tandem. Each responsible for a distinct layer
            of resilience. Click any to expand technical detail.
          </p>
        </motion.div>

        {/* Algorithm steps */}
        <div style={{ maxWidth: 800 }}>
          {ALGORITHMS.map((algo, i) => (
            <motion.div
              key={algo.num}
              initial={{ opacity: 0, x: -24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                onClick={() => setExpanded(expanded === i ? null : i)}
                style={{
                  display: 'flex',
                  gap: 20,
                  padding: '20px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                }}
              >
                {/* Left: number + connector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: `2px solid ${algo.color}`,
                    background: `${algo.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-signal)',
                    fontSize: 14,
                    color: algo.color,
                  }}>
                    {algo.icon}
                  </div>
                  {i < ALGORITHMS.length - 1 && (
                    <div style={{
                      width: 2, height: 20,
                      background: `${algo.color}30`,
                      marginTop: 4,
                    }} />
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span style={{
                      fontFamily: 'var(--font-military)',
                      fontWeight: 800,
                      fontSize: 17,
                      color: algo.color,
                      letterSpacing: '0.06em',
                    }}>
                      {algo.name}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-signal)',
                      fontSize: 9,
                      letterSpacing: '0.15em',
                      padding: '2px 8px',
                      border: `1px solid ${algo.color}30`,
                      color: algo.color,
                      opacity: 0.7,
                    }}>
                      {algo.tag}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--p-text2)', lineHeight: 1.6 }}>
                    {algo.desc}
                  </p>

                  {/* Expandable detail */}
                  <AnimatePresence>
                    {expanded === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          marginTop: 12,
                          padding: 16,
                          background: `${algo.color}06`,
                          border: `1px solid ${algo.color}20`,
                          borderLeft: `3px solid ${algo.color}`,
                        }}>
                          <AlgoViz algo={algo} />
                          <p style={{
                            fontFamily: 'var(--font-signal)',
                            fontSize: 11,
                            color: 'var(--p-text2)',
                            lineHeight: 1.7,
                            marginTop: 8,
                          }}>
                            {algo.detail}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Expand indicator */}
                <div style={{
                  fontFamily: 'var(--font-signal)',
                  fontSize: 12,
                  color: 'var(--p-muted)',
                  flexShrink: 0,
                  paddingTop: 8,
                  transform: expanded === i ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease',
                }}>
                  ∨
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
