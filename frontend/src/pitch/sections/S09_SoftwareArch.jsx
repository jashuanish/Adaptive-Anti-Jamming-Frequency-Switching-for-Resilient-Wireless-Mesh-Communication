import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const LAYERS = [
  {
    id: 'hardware',
    label: 'HARDWARE LAYER',
    items: ['ESP32 Node', 'NRF24L01+ Transceiver', 'OLED / TFT Display'],
    color: 'var(--p-amber)',
    icon: '⬡',
  },
  {
    id: 'backend',
    label: 'BACKEND ENGINE',
    items: ['Flask API Server', 'Simulation State Machine', 'Jammer Matrix Manager'],
    color: 'var(--p-red)',
    icon: '◈',
    children: ['Hardware Bridge (MQTT)', 'REST API /state /step /reset'],
  },
  {
    id: 'algorithms',
    label: 'ALGORITHM CORE',
    items: ['A* Route Planner', 'Frequency Hopping State Machine', 'Levenshtein Reconstructor'],
    color: 'var(--p-green)',
    icon: '⟳',
  },
  {
    id: 'frontend',
    label: 'REACT FRONTEND',
    items: ['Zustand State Store', 'Telemetry Polling Loop (850ms)', 'Framer Motion / Three.js'],
    color: 'var(--p-blue)',
    icon: '▣',
  },
  {
    id: 'visualization',
    label: 'VISUALIZATION',
    items: ['3D Mesh Viewport (R3F)', 'HUD Overlay', 'Wide-Area Link Visualizer'],
    color: 'var(--p-green)',
    icon: '◉',
  },
]

// Flowing connection line between layer items
function FlowConnector({ from, to }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 32,
      position: 'relative',
    }}>
      <div style={{
        width: 2,
        height: '100%',
        background: 'linear-gradient(to bottom, rgba(0,255,157,0.3), rgba(0,255,157,0.05))',
        position: 'relative',
      }}>
        <motion.div
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear', repeatDelay: 0.5 }}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--p-green)',
            boxShadow: '0 0 6px var(--p-green)',
          }}
        />
      </div>
      {/* Data label */}
      <div style={{
        position: 'absolute',
        right: 'calc(50% + 12px)',
        fontFamily: 'var(--font-signal)',
        fontSize: 8,
        color: 'var(--p-muted)',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
      }}>
        {from} →
      </div>
    </div>
  )
}

export default function S09_SoftwareArch() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="pd-section" style={{ padding: '120px 0', background: 'var(--p-surface)' }}>
      <div className="pd-grid-bg" />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 56 }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 09 · SOFTWARE ARCHITECTURE</div>
          <div className="pd-divider-accent" style={{ marginBottom: 24 }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            DECOUPLED<br />
            <span style={{ color: 'var(--p-blue)' }}>DUAL-LAYER SYSTEM</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64 }}>
          {/* Stack diagram */}
          <div>
            {LAYERS.map((layer, i) => (
              <div key={layer.id}>
                <motion.div
                  className="pd-stack-layer"
                  style={{ borderLeft: `3px solid ${layer.color}` }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div style={{
                    fontSize: 18,
                    color: layer.color,
                    textShadow: `0 0 8px ${layer.color}40`,
                    flexShrink: 0,
                  }}>
                    {layer.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-signal)',
                      fontSize: 9,
                      letterSpacing: '0.18em',
                      color: layer.color,
                      marginBottom: 4,
                    }}>
                      {layer.label}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {layer.items.map(item => (
                        <span key={item} style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 11,
                          color: 'var(--p-text2)',
                          padding: '2px 8px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 2,
                        }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Connector between layers */}
                {i < LAYERS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.4 + i * 0.15 }}
                  >
                    <FlowConnector from={LAYERS[i].label.split(' ')[0]} />
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Right: key design decisions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div className="pd-label" style={{ marginBottom: 20 }}>DESIGN DECISIONS</div>

            {[
              {
                title: 'DECOUPLED ARCHITECTURE',
                color: 'var(--p-green)',
                body: 'Backend and frontend are completely independent. The simulation engine runs in Python/Flask — the React frontend polls at 850ms intervals. No shared memory, no tight coupling.',
              },
              {
                title: 'BLIND POLL STRATEGY',
                color: 'var(--p-amber)',
                body: 'When running=true, the frontend POSTs /step to advance the sim by one tick, then reads the resulting state. This guarantees the UI is always synchronized with the backend state machine.',
              },
              {
                title: 'STATE MACHINE DESIGN',
                color: 'var(--p-blue)',
                body: 'The entire simulation lives as a JSON-serializable state dict. Every tick mutates this dict and returns it. The frontend derives all telemetry, alerts, and threat levels from raw state.',
              },
              {
                title: 'EDGE-SPECIFIC JAMMING',
                color: 'var(--p-red)',
                body: 'The jammer matrix is per-(node, freq) pair. This allows partial jamming scenarios where one link is saturated while adjacent links remain clear — reflecting real-world EW behavior.',
              },
            ].map(item => (
              <div key={item.title} style={{
                padding: '16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-military)',
                  fontWeight: 700,
                  fontSize: 14,
                  color: item.color,
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{ width: 3, height: 14, background: item.color, flexShrink: 0 }} />
                  {item.title}
                </div>
                <p className="pd-body" style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                  {item.body}
                </p>
              </div>
            ))}

            {/* Tech stack badges */}
            <div style={{ marginTop: 24 }}>
              <div className="pd-label" style={{ marginBottom: 12 }}>TECHNOLOGY STACK</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Python 3', 'Flask', 'React 19', 'Vite 8', 'Three.js', 'Framer Motion', 'Zustand', 'GSAP', 'Lenis'].map(tech => (
                  <span key={tech} style={{
                    fontFamily: 'var(--font-signal)',
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    padding: '4px 10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--p-text2)',
                    background: 'rgba(255,255,255,0.03)',
                  }}>
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
