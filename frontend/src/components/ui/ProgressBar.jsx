import { motion } from 'framer-motion'

/**
 * ProgressBar — thin precision progress indicator
 * Props: value (0-1), variant ('primary'|'success'|'warning'|'danger'), height (px), animated
 */
export default function ProgressBar({ value = 0, variant = 'primary', height = 3, animated = true, label }) {
  const pct = Math.max(0, Math.min(1, value)) * 100

  const trackColor = 'var(--divider-strong)'
  const fillColor = {
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger:  'var(--danger)',
  }[variant] || 'var(--primary)'

  return (
    <div>
      {label && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span className="text-label">{label}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-2)',
          }}>
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div style={{
        height,
        background: trackColor,
        borderRadius: height,
        overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
          style={{
            height: '100%',
            background: fillColor,
            borderRadius: height,
          }}
        />
      </div>
    </div>
  )
}
