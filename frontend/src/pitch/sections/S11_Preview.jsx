import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

// A fake dashboard preview — SVG representation of the actual UI
function DashboardMockup() {
  return (
    <svg
      viewBox="0 0 900 560"
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      {/* Background */}
      <rect width="900" height="560" fill="#09090B" />

      {/* Top bar */}
      <rect width="900" height="44" fill="#111114" />
      <rect width="900" height="1" y="44" fill="rgba(255,255,255,0.06)" />
      {/* Logo */}
      <circle cx="20" cy="22" r="8" fill="none" stroke="#2D7FF9" strokeWidth="1.5" />
      <circle cx="20" cy="22" r="3" fill="#2D7FF9" />
      <text x="36" y="26" fill="rgba(248,248,248,0.8)" fontSize="9" fontFamily="monospace" letterSpacing="2">RF MESH CONTROL</text>
      {/* Nav items */}
      {['SIMULATION','HARDWARE','CONSOLE'].map((n,i)=>(
        <text key={n} x={680+i*70} y={26} fill={i===0?'#2D7FF9':'rgba(167,167,178,0.6)'}
          fontSize="8" fontFamily="monospace" letterSpacing="1" textAnchor="middle">{n}</text>
      ))}
      {/* Status dots */}
      <circle cx="860" cy="22" r="4" fill="#2ECC71" />
      <text x="870" y="26" fill="rgba(167,167,178,0.5)" fontSize="7" fontFamily="monospace">LIVE</text>

      {/* Left nav */}
      <rect width="196" height="516" y="44" fill="#111114" />
      <rect width="1" height="516" x="196" y="44" fill="rgba(255,255,255,0.06)" />
      {/* Nav items */}
      {['◎ MESH VIEW','◈ FREQUENCY','≈ TELEMETRY','⬡ ALERTS'].map((n,i)=>(
        <g key={n}>
          <rect x="0" y={68+i*48} width="196" height="40"
            fill={i===0?'rgba(45,127,249,0.1)':'transparent'} />
          <text x="20" y={92+i*48} fill={i===0?'#2D7FF9':'rgba(167,167,178,0.5)'}
            fontSize="9" fontFamily="monospace" letterSpacing="1">{n}</text>
        </g>
      ))}

      {/* Main 3D viewport area */}
      <rect x="196" y="44" width="504" height="440" fill="#09090B" />
      {/* 3D mesh dots */}
      {[
        [350,180],[430,150],[510,170],[380,260],[470,240],[560,255],
        [360,340],[470,355],[560,340]
      ].map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="10" fill="rgba(45,127,249,0.08)" stroke="#2D7FF9" strokeWidth="1.2" />
          <text x={cx} y={cy+3} textAnchor="middle" fill="#2D7FF9" fontSize="5.5" fontFamily="monospace">H{i+1}</text>
        </g>
      ))}
      {/* Route line */}
      {[[350,180,380,260],[380,260,470,240],[470,240,470,355],[470,355,560,340]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#2ECC71" strokeWidth="1.5" strokeDasharray="4 2"
          style={{ filter: 'drop-shadow(0 0 3px #2ECC71)' }} />
      ))}
      {/* Other edges */}
      {[[350,180,430,150],[430,150,510,170],[510,170,560,255],[380,260,360,340],[560,255,560,340],[360,340,470,355]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {/* Moving packet */}
      <circle cx="420" cy="250" r="5" fill="#FFB020" style={{ filter: 'drop-shadow(0 0 6px #FFB020)' }} />

      {/* Right context panel */}
      <rect x="700" y="44" width="200" height="440" fill="#111114" />
      <rect width="1" height="440" x="700" y="44" fill="rgba(255,255,255,0.06)" />
      <text x="716" y="76" fill="rgba(167,167,178,0.5)" fontSize="7" fontFamily="monospace" letterSpacing="1.5">TELEMETRY</text>
      {/* Metric rows */}
      {[
        ['SIGNAL QUALITY', '72%', '#2ECC71'],
        ['THREAT LEVEL', 'ELEVATED', '#FFB020'],
        ['PACKET LOSS', '3', '#FF4D4F'],
        ['HOPS TOTAL', '14', '#2D7FF9'],
        ['ACTIVE ROUTE', 'H1→H4→H5', '#2D7FF9'],
      ].map(([k,v,c],i)=>(
        <g key={k}>
          <text x="716" y={108+i*40} fill="rgba(111,114,128,0.7)" fontSize="7" fontFamily="monospace" letterSpacing="1">{k}</text>
          <text x="716" y={123+i*40} fill={c} fontSize="10" fontFamily="monospace" fontWeight="600">{v}</text>
          <rect x="700" y={130+i*40} width="200" height="1" fill="rgba(255,255,255,0.04)" />
        </g>
      ))}

      {/* Frequency visualizer bar at bottom */}
      <rect x="196" y="484" width="504" height="76" fill="#111114" />
      <rect width="504" height="1" x="196" y="484" fill="rgba(255,255,255,0.06)" />
      <text x="212" y="500" fill="rgba(111,114,128,0.6)" fontSize="6" fontFamily="monospace" letterSpacing="2">WIDE-AREA LINK VISUALIZER</text>
      {/* Freq channels */}
      {[0,1,2,3,4].map(f=>{
        const jammed = f === 1 || f === 3
        const active = f === 2
        return (
          <g key={f}>
            <rect x={212+f*96} y={508} width={86} height={12}
              fill={jammed?'rgba(255,77,79,0.15)':active?'rgba(46,204,113,0.15)':'rgba(255,255,255,0.03)'}
              stroke={jammed?'rgba(255,77,79,0.3)':active?'rgba(46,204,113,0.3)':'rgba(255,255,255,0.05)'}
            />
            <text x={255+f*96} y={518} textAnchor="middle"
              fill={jammed?'#FF4D4F':active?'#2ECC71':'rgba(167,167,178,0.3)'}
              fontSize="6" fontFamily="monospace">{jammed?'JAMMED':active?'CLEAR':`F${f+1}`}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function S11_Preview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [focused, setFocused] = useState(false)

  return (
    <section className="pd-section" style={{
      padding: '120px 0',
      background: 'var(--p-bg)',
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div className="pd-container" ref={ref} style={{ width: '100%' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 48, textAlign: 'center' }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 11 · PLATFORM PREVIEW</div>
          <div className="pd-divider-accent" style={{ margin: '0 auto 24px' }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            THE TACTICAL<br />
            <span style={{ color: 'var(--p-green)' }}>COMMAND PLATFORM</span>
          </h2>
          <p className="pd-body" style={{ marginTop: 16, maxWidth: 500, margin: '16px auto 0', fontSize: 14 }}>
            The full simulation dashboard. Real-time telemetry, 3D mesh visualization,
            frequency hop animations, and live threat detection.
          </p>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(16px) brightness(0.3)' }}
          animate={inView ? {
            opacity: focused ? 1 : 0.75,
            scale: focused ? 1 : 0.98,
            filter: focused ? 'blur(0px) brightness(1)' : 'blur(4px) brightness(0.5)',
          } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(45,127,249,0.2)',
            boxShadow: `0 0 80px rgba(45,127,249,0.1), 0 40px 80px rgba(0,0,0,0.6)`,
            cursor: focused ? 'default' : 'pointer',
            maxWidth: 900,
            margin: '0 auto',
          }}
          onClick={() => setFocused(true)}
        >
          <DashboardMockup />

          {/* Overlay when not focused */}
          {!focused && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(8,10,14,0.5)',
              backdropFilter: 'blur(2px)',
              gap: 16,
            }}>
              <div style={{
                fontFamily: 'var(--font-signal)',
                fontSize: 11,
                letterSpacing: '0.2em',
                color: 'var(--p-text2)',
              }}>
                [CLASSIFIED] · CLICK TO PREVIEW
              </div>
              <div style={{
                width: 48, height: 48,
                borderRadius: '50%',
                border: '2px solid rgba(45,127,249,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#2D7FF9',
              }}>
                ⊕
              </div>
            </div>
          )}

          {/* Corner decorators */}
          {[
            { top: 0, left: 0, borderTop: '2px solid var(--p-green)', borderLeft: '2px solid var(--p-green)' },
            { top: 0, right: 0, borderTop: '2px solid var(--p-green)', borderRight: '2px solid var(--p-green)' },
            { bottom: 0, left: 0, borderBottom: '2px solid var(--p-green)', borderLeft: '2px solid var(--p-green)' },
            { bottom: 0, right: 0, borderBottom: '2px solid var(--p-green)', borderRight: '2px solid var(--p-green)' },
          ].map((style, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 16, height: 16,
              ...style,
            }} />
          ))}
        </motion.div>

        {/* Labels */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            marginTop: 24,
          }}
        >
          {[
            { label: '3D MESH VIEWPORT', color: 'var(--p-blue)' },
            { label: 'FREQUENCY VISUALIZER', color: 'var(--p-green)' },
            { label: 'LIVE TELEMETRY', color: 'var(--p-amber)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 16, height: 2, background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
              <span style={{ fontFamily: 'var(--font-signal)', fontSize: 9, letterSpacing: '0.15em', color: 'var(--p-muted)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
