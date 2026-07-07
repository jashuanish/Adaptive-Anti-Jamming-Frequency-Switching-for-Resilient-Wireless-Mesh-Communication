/**
 * Button — engineering-grade button primitive
 * Props: variant, size, loading, onClick, disabled, children
 */
export default function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  children,
  fullWidth = false,
  title,
}) {
  const variantClass = {
    primary:      'btn-primary',
    ghost:        'btn-ghost',
    success:      'btn-success',
    danger:       'btn-danger',
    'danger-active': 'btn-danger-active',
    warning:      'btn-warning',
  }[variant] || 'btn-ghost'

  const sizeStyles = {
    sm: { padding: '5px 10px', fontSize: 'var(--text-xs)' },
    md: { padding: '7px 14px', fontSize: 'var(--text-sm)' },
    lg: { padding: '9px 18px', fontSize: 'var(--text-base)' },
  }[size] || {}

  return (
    <button
      className={`btn ${variantClass}`}
      style={{
        ...sizeStyles,
        width: fullWidth ? '100%' : undefined,
      }}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
    >
      {loading && (
        <span style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          border: '1.5px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {children}
    </button>
  )
}
