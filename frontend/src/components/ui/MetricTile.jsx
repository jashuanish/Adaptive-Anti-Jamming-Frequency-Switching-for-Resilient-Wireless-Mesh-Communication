/**
 * MetricTile — compact telemetry readout block
 * Props: label, value, unit, trend ('up'|'down'|null), variant ('nominal'|'warning'|'danger'|'default')
 */
export default function MetricTile({ label, value, unit, trend, variant = 'default', mono = true }) {
  const variantColor = {
    nominal: 'var(--success-text)',
    warning: 'var(--warning-text)',
    danger:  'var(--danger-text)',
    primary: 'var(--primary)',
    default: 'var(--text-1)',
  }[variant] || 'var(--text-1)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span className="text-label">{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span
          className={mono ? 'text-metric' : ''}
          style={{
            fontSize: 'var(--text-3xl)',
            color: variantColor,
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
            fontVariantNumeric: 'tabular-nums',
            transition: 'color var(--dur-base) var(--ease-out)',
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--muted)',
            letterSpacing: '0.06em',
          }}>
            {unit}
          </span>
        )}
        {trend && (
          <span style={{
            fontSize: 'var(--text-xs)',
            color: trend === 'up' ? 'var(--success-text)' : 'var(--danger-text)',
            marginLeft: 2,
          }}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  )
}
