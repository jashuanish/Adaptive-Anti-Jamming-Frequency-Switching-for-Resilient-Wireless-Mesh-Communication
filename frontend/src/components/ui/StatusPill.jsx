/**
 * StatusPill — inline status indicator
 * Props: variant ('nominal'|'warning'|'danger'|'primary'|'muted'), label, pulse
 */
export default function StatusPill({ variant = 'muted', label, pulse = false, size = 'md' }) {
  const colors = {
    nominal: { dot: 'var(--success)',  text: 'var(--success-text)' },
    warning: { dot: 'var(--warning)',  text: 'var(--warning-text)' },
    danger:  { dot: 'var(--danger)',   text: 'var(--danger-text)'  },
    primary: { dot: 'var(--primary)',  text: 'var(--primary)'      },
    muted:   { dot: 'var(--muted)',    text: 'var(--text-2)'       },
  }
  const c = colors[variant] || colors.muted
  const dotSize = size === 'sm' ? 5 : 6

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontFamily: 'var(--font-mono)',
      fontSize: size === 'sm' ? 'var(--text-xs)' : 'var(--text-sm)',
      fontWeight: 500,
      letterSpacing: '0.08em',
      color: c.text,
    }}>
      <span
        className={pulse ? 'animate-pulse-dot' : ''}
        style={{
          display: 'block',
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  )
}
