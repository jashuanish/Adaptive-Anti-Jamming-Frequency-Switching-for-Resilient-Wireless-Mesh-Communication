import { useEffect, useState } from 'react'
import { useAthena } from '../athena/store'
import StatusPill from '../components/ui/StatusPill'

const NAV_ITEMS = ['SIMULATION', 'HARDWARE']

function statusVariant(status, jammerActive) {
  if (jammerActive) return 'danger'
  if (status === 'TRANSMITTING') return 'nominal'
  if (status === 'COMPLETE') return 'primary'
  return 'muted'
}

export default function CommandBar({ activeMode, onModeChange }) {
  const [clock, setClock] = useState('')
  const connected = useAthena(s => s.connected)
  const tel = useAthena(s => s.telemetry)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const hh = String(now.getUTCHours()).padStart(2, '0')
      const mm = String(now.getUTCMinutes()).padStart(2, '0')
      const ss = String(now.getUTCSeconds()).padStart(2, '0')
      setClock(`${hh}:${mm}:${ss} UTC`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const pillVariant = statusVariant(tel.systemStatus, tel.jammerActive)

  return (
    <header style={{
      height: 'var(--cmd-bar-h)',
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--divider)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 var(--sp-4)',
      gap: 'var(--sp-4)',
      position: 'relative',
      zIndex: 200,
      flexShrink: 0,
    }}>
      {/* Wordmark */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 'calc(var(--left-nav-w) - var(--sp-4))',
      }}>
        {/* Logo mark */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="1" width="20" height="20" rx="3" stroke="var(--primary)" strokeWidth="1.5"/>
          <circle cx="11" cy="11" r="3" fill="var(--primary)"/>
          <line x1="11" y1="5" x2="11" y2="8" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="11" y1="14" x2="11" y2="17" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="5" y1="11" x2="8" y2="11" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="14" y1="11" x2="17" y2="11" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <div>
          <div style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 'var(--text-md)',
            letterSpacing: '0.06em',
            color: 'var(--text-1)',
          }}>
            RF MESH CONTROL
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: 'var(--muted)',
          }}>
            v2.1.0 · ANTI-JAM SIM
          </div>
        </div>
      </div>

      {/* Center — mode switcher + system status */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-6)',
      }}>
        {/* Mode tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg)',
          border: '1px solid var(--divider)',
          borderRadius: 'var(--radius-md)',
          padding: 2,
          gap: 2,
        }}>
          {NAV_ITEMS.map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              style={{
                padding: '4px 14px',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all var(--dur-fast) var(--ease-out)',
                background: activeMode === m ? 'var(--surface-3)' : 'transparent',
                color: activeMode === m ? 'var(--text-1)' : 'var(--muted)',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* System status pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--divider)',
          borderRadius: 'var(--radius-md)',
        }}>
          <StatusPill
            variant={pillVariant}
            label={tel.jammerActive ? '⚠ RF INTERFERENCE' : tel.systemStatus}
            pulse={tel.systemStatus === 'TRANSMITTING' || tel.jammerActive}
            size="sm"
          />
        </div>
      </div>

      {/* Right — clock + connection */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-4)',
        minWidth: 'calc(var(--ctx-panel-w) - var(--sp-4))',
        justifyContent: 'flex-end',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-2)',
          letterSpacing: '0.06em',
        }}>
          {clock}
        </div>

        <div style={{
          width: 1,
          height: 20,
          background: 'var(--divider)',
        }} />

        <StatusPill
          variant={connected ? 'nominal' : 'danger'}
          label={connected ? 'BACKEND ONLINE' : 'LINK LOST'}
          pulse={!connected}
          size="sm"
        />
      </div>
    </header>
  )
}
