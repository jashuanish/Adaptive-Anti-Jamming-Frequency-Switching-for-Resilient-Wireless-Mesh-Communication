import { motion } from 'framer-motion'

/**
 * SignalMeter — horizontal RSSI-style bar with tick marks
 * Props: value (0-100), label
 */
export default function SignalMeter({ value = 0, label = 'Signal Quality' }) {
  const pct = Math.max(0, Math.min(100, value))
  const color = pct > 65 ? 'var(--success)' : pct > 35 ? 'var(--warning)' : 'var(--danger)'
  const ticks = [25, 50, 75]

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span className="text-label">{label}</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color,
          transition: 'color var(--dur-base) var(--ease-out)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {Math.round(pct)}<span style={{ fontSize: 'var(--text-xs)', marginLeft: 2, color: 'var(--muted)' }}>%</span>
        </span>
      </div>

      {/* Track with tick marks */}
      <div style={{ position: 'relative' }}>
        <div style={{
          height: 6,
          background: 'var(--surface-4)',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid var(--divider)',
        }}>
          <motion.div
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: color,
              borderRadius: 3,
              transition: 'background var(--dur-slow) var(--ease-out)',
            }}
          />
        </div>

        {/* Tick marks */}
        {ticks.map(t => (
          <div key={t} style={{
            position: 'absolute',
            top: 0,
            left: `${t}%`,
            width: 1,
            height: 6,
            background: 'var(--surface-2)',
            opacity: 0.8,
          }} />
        ))}
      </div>

      {/* Tick labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: 4,
      }}>
        {[0, 25, 50, 75, 100].map(t => (
          <span key={t} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--muted)',
            lineHeight: 1,
          }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
