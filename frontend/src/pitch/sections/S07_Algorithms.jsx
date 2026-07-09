import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const ALGO_CARDS = [
  {
    id: 'astar',
    name: 'A* SEARCH',
    tag: 'GRAPH THEORY',
    color: 'var(--p-green)',
    summary: 'Optimal pathfinding with Euclidean heuristic across the 9-node weighted graph.',
    complexity: 'O((V + E) log V)',
    detail: [
      'Maintains open and closed priority queues.',
      'g(n) = actual path cost from source to node n.',
      'h(n) = Euclidean distance estimate to target.',
      'f(n) = g(n) + h(n) — the priority key.',
      'Guarantees shortest path in weighted graphs with admissible heuristic.',
    ],
    viz: (
      <svg viewBox="0 0 260 90" style={{ width: '100%', height: 90 }}>
        {/* Nodes */}
        {[
          { id: 'S', x: 20, y: 45 },
          { id: 'A', x: 80, y: 15 },
          { id: 'B', x: 80, y: 75 },
          { id: 'C', x: 140, y: 45 },
          { id: 'T', x: 230, y: 45 },
        ].map((n, i) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={12}
              fill={['S','C','T'].includes(n.id) ? 'rgba(0,255,157,0.12)' : 'rgba(255,255,255,0.04)'}
              stroke={['S','C','T'].includes(n.id) ? '#00FF9D' : 'rgba(255,255,255,0.12)'}
              strokeWidth={1.5}
            />
            <text x={n.x} y={n.y + 4} textAnchor="middle"
              fill={['S','C','T'].includes(n.id) ? '#00FF9D' : 'rgba(255,255,255,0.4)'}
              fontSize={8} fontFamily="'Share Tech Mono', monospace" fontWeight="600">
              {n.id}
            </text>
          </g>
        ))}
        {/* Edges */}
        {[
          [[20,45],[80,15],'rgba(0,255,157,0.15)'],
          [[20,45],[80,75],'rgba(0,255,157,0.15)'],
          [[80,15],[140,45],'#00FF9D'],
          [[80,75],[140,45],'rgba(0,255,157,0.15)'],
          [[140,45],[230,45],'#00FF9D'],
        ].map(([a,b,c],i)=>(
          <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
            stroke={c} strokeWidth={c==='#00FF9D'?1.5:1}
            strokeDasharray={c==='#00FF9D'?'none':'3 2'} />
        ))}
        {/* Labels */}
        <text x={105} y={28} fill="rgba(0,255,157,0.5)" fontSize={7} fontFamily="monospace">f=8</text>
        <text x={168} y={40} fill="rgba(0,255,157,0.5)" fontSize={7} fontFamily="monospace">f=12</text>
        <text x={115} y={68} fill="rgba(255,255,255,0.2)" fontSize={7} fontFamily="monospace">f=15</text>
      </svg>
    ),
  },
  {
    id: 'greedy',
    name: 'GREEDY FREQ SELECT',
    tag: 'BLIND SEARCH',
    color: 'var(--p-amber)',
    summary: 'Randomly selects untried frequencies per-link without global state or prediction.',
    complexity: 'O(F) per hop',
    detail: [
      'No knowledge of jammer state — purely reactive.',
      'Per-link attempted_freqs set tracks failures.',
      'Random selection from remaining candidates.',
      'Total failure (all 5 jammed) → drop + underscore.',
      'Reset on successful hop to next link.',
    ],
    viz: (
      <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
        {['F1','F2','F3','F4','F5'].map((f, i) => {
          const states = ['fail','fail','pending','pending','pending']
          const colors = { fail: '#FF4D4F', pending: 'rgba(255,176,32,0.5)', ok: '#00FF9D' }
          return (
            <div key={f} style={{
              flex: 1, padding: '10px 4px', textAlign: 'center',
              background: states[i]==='fail'?'rgba(255,77,79,0.1)':'rgba(255,176,32,0.06)',
              border: `1px solid ${states[i]==='fail'?'rgba(255,77,79,0.25)':'rgba(255,176,32,0.15)'}`,
              borderRadius: 2,
            }}>
              <div style={{ fontFamily: 'var(--font-signal)', fontSize: 8, color: 'var(--p-muted)' }}>{f}</div>
              <div style={{ fontSize: 9, marginTop: 4, color: colors[states[i]] }}>
                {states[i]==='fail'?'✕':'·'}
              </div>
            </div>
          )
        })}
      </div>
    ),
  },
  {
    id: 'levenshtein',
    name: 'LEVENSHTEIN DISTANCE',
    tag: 'DYNAMIC PROGRAMMING',
    color: 'var(--p-blue)',
    summary: 'Minimum edit-distance payload reconstruction. Recovers dropped chars using tactical dictionary.',
    complexity: 'O(mn)',
    detail: [
      'Compares corrupted string against known dictionary.',
      'Counts insertions, deletions, substitutions.',
      'Best match with dist ≤ 2 is accepted as correction.',
      'Dictionary: TARGET, CONFIRM, ABORT, MISSION, etc.',
      'T_RGET → TARGET (distance = 1, substitution).',
    ],
    viz: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '12px 0' }}>
        <div style={{ fontFamily: 'var(--font-signal)', fontSize: 22, color: 'var(--p-red)', letterSpacing: '0.1em' }}>T_RGET</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ fontSize: 20, color: 'var(--p-muted)' }}>→</div>
          <div style={{ fontFamily: 'var(--font-signal)', fontSize: 8, color: 'var(--p-text2)' }}>dist=1</div>
        </div>
        <div style={{ fontFamily: 'var(--font-signal)', fontSize: 22, color: 'var(--p-green)', letterSpacing: '0.1em', textShadow: '0 0 12px rgba(0,255,157,0.4)' }}>TARGET</div>
      </div>
    ),
  },
  {
    id: 'jam-detection',
    name: 'STREAMING DETECTION',
    tag: 'SIGNAL ANALYSIS',
    color: 'var(--p-red)',
    summary: 'Real-time accumulate-and-decay scoring to detect jam onset without threshold latency.',
    complexity: 'O(1) per tick',
    detail: [
      'Score += 1 on each ACK failure.',
      'Score × 0.85 decay applied per simulation tick.',
      'Threshold crossing triggers ELEVATED threat status.',
      'No window size — continuous streaming analysis.',
      'Fires alert to HUD within 2 simulation ticks.',
    ],
    viz: null,
  },
]

export default function S07_Algorithms() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [expanded, setExpanded] = useState(null)

  return (
    <section className="pd-section" style={{ padding: '120px 0', background: 'var(--p-surface)' }}>
      <div className="pd-grid-bg" />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 56, textAlign: 'center' }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 07 · ALGORITHM SPOTLIGHT</div>
          <div className="pd-divider-accent" style={{ margin: '0 auto 24px' }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            DEEP DIVE INTO THE<br />
            <span style={{ color: 'var(--p-blue)' }}>ALGORITHMS</span>
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {ALGO_CARDS.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="pd-card"
                onClick={() => setExpanded(expanded === i ? null : i)}
                style={{
                  cursor: 'pointer',
                  borderTop: `2px solid ${card.color}`,
                  transition: 'all 0.2s ease',
                  borderColor: expanded === i ? card.color : 'var(--p-divider)',
                  background: expanded === i ? `${card.color}06` : 'var(--p-surface)',
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-signal)',
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      color: card.color,
                      marginBottom: 6,
                    }}>
                      {card.tag}
                    </div>
                    <div className="pd-subhead" style={{ fontSize: 18, color: card.color }}>
                      {card.name}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-signal)',
                    fontSize: 9,
                    color: 'var(--p-muted)',
                    padding: '4px 8px',
                    border: '1px solid var(--p-divider)',
                    whiteSpace: 'nowrap',
                  }}>
                    {card.complexity}
                  </div>
                </div>

                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--p-text2)', lineHeight: 1.6, marginBottom: 12 }}>
                  {card.summary}
                </p>

                {/* Visualization preview */}
                {card.viz && (
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    padding: '8px 12px',
                    marginBottom: 12,
                  }}>
                    {card.viz}
                  </div>
                )}

                {/* Expand toggle */}
                <div style={{
                  fontFamily: 'var(--font-signal)',
                  fontSize: 10,
                  color: card.color,
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{
                    transform: expanded === i ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.3s ease',
                    display: 'inline-block',
                  }}>∨</span>
                  {expanded === i ? 'COLLAPSE' : 'VIEW DETAIL'}
                </div>

                {/* Expanded content */}
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
                        marginTop: 16,
                        padding: '12px 16px',
                        background: 'rgba(0,0,0,0.2)',
                        borderLeft: `2px solid ${card.color}60`,
                      }}>
                        {card.detail.map((d, j) => (
                          <div key={j} style={{
                            display: 'flex',
                            gap: 10,
                            padding: '5px 0',
                            fontFamily: 'var(--font-signal)',
                            fontSize: 11,
                            color: 'var(--p-text2)',
                            lineHeight: 1.5,
                          }}>
                            <span style={{ color: card.color, flexShrink: 0 }}>›</span>
                            <span>{d}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
