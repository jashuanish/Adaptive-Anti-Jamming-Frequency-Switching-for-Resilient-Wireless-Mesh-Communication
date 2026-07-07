import { AnimatePresence, motion } from 'framer-motion'
import { useAthena } from '../../athena/store'

const ALERT_CONFIG = {
  threat:  { variant: 'danger',  label: 'CRITICAL', borderColor: 'var(--danger)',  bg: 'var(--danger-dim)'  },
  warning: { variant: 'warning', label: 'WARNING',  borderColor: 'var(--warning)', bg: 'var(--warning-dim)' },
  nominal: { variant: 'nominal', label: 'NOMINAL',  borderColor: 'var(--success)', bg: 'var(--success-dim)' },
}

function Toast({ alert, onDismiss }) {
  const cfg = ALERT_CONFIG[alert.level] || ALERT_CONFIG.warning

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'relative',
        width: 320,
        background: 'var(--surface-2)',
        border: '1px solid var(--divider)',
        borderLeft: `3px solid ${cfg.borderColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(alert.id)}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          letterSpacing: '0.12em',
          color: cfg.borderColor,
        }}>
          {cfg.label}
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--text-1)',
          flex: 1,
        }}>
          {alert.title}
        </span>
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>✕</span>
      </div>

      {/* Detail */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-2)',
        letterSpacing: '0.04em',
      }}>
        {alert.detail}
      </div>

      {/* Progress bar (auto-dismiss timer) */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5.2, ease: 'linear' }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: cfg.borderColor,
          transformOrigin: 'left',
          opacity: 0.5,
        }}
      />
    </motion.div>
  )
}

/**
 * AlertToast — engineering-grade notification system.
 * Appears top-right. No glow. No blur. Restrained.
 */
export default function AlertToast() {
  const alerts = useAthena(s => s.alerts)
  const dismiss = useAthena(s => s.dismissAlert)

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(var(--cmd-bar-h) + 12px)',
      right: 16,
      zIndex: 500,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {alerts.map(a => (
          <div key={a.id} style={{ pointerEvents: 'auto' }}>
            <Toast alert={a} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
