import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAthena } from '../store'

const BOOT_LINES = [
  { msg: 'Initializing RF Mesh Control core',       status: 'OK'     },
  { msg: 'Loading A* routing engine',               status: 'OK'     },
  { msg: 'Binding telemetry polling loop',          status: 'OK'     },
  { msg: 'Calibrating RF spectrum analyzer',        status: 'OK'     },
  { msg: 'Establishing backend link · port 5000',  status: 'OK'     },
  { msg: 'Threat detection grid armed',             status: 'READY'  },
]

export default function BootSequence() {
  const booted = useAthena(s => s.booted)
  const setBooted = useAthena(s => s.setBooted)
  const [visible, setVisible] = useState([])

  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      setVisible(v => [...v, i])
      i++
      if (i >= BOOT_LINES.length) {
        clearInterval(id)
        setTimeout(() => setBooted(true), 700)
      }
    }, 180)
    return () => clearInterval(id)
  }, [setBooted])

  return (
    <AnimatePresence>
      {!booted && (
        <motion.div
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 900,
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          {/* Wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center' }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="1.5" y="1.5" width="29" height="29" rx="5" stroke="var(--primary)" strokeWidth="2"/>
                <circle cx="16" cy="16" r="4.5" fill="var(--primary)"/>
                <line x1="16" y1="7" x2="16" y2="11" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="21" x2="16" y2="25" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="7"  y1="16" x2="11" y2="16" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
                <line x1="21" y1="16" x2="25" y2="16" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 28,
                letterSpacing: '0.08em',
                color: 'var(--text-1)',
              }}>
                RF MESH CONTROL
              </div>
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.18em',
              color: 'var(--muted)',
            }}>
              ANTI-JAM FREQUENCY HOPPING SIMULATOR · v2.1.0
            </div>
          </motion.div>

          {/* Boot log */}
          <div style={{
            width: 460,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
          }}>
            {BOOT_LINES.map((line, i) =>
              visible.includes(i) ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 0',
                    borderBottom: '1px solid var(--divider-subtle)',
                  }}
                >
                  <span style={{ color: 'var(--text-2)' }}>{line.msg}</span>
                  <span style={{
                    color: line.status === 'OK' ? 'var(--success-text)'
                      : line.status === 'READY' ? 'var(--primary)'
                      : 'var(--warning-text)',
                    letterSpacing: '0.1em',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                  }}>
                    {line.status}
                  </span>
                </motion.div>
              ) : (
                <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid var(--divider-subtle)' }}>
                  <span style={{ color: 'var(--muted)', opacity: 0.3 }}>·</span>
                </div>
              )
            )}
          </div>

          {/* Loading bar */}
          <div style={{ width: 460, height: 2, background: 'var(--divider-strong)', borderRadius: 1, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${(visible.length / BOOT_LINES.length) * 100}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ height: '100%', background: 'var(--primary)', borderRadius: 1 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
