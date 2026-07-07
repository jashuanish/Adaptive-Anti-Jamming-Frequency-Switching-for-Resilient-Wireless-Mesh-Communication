const NAV_ITEMS = [
  { id: 'simulation', label: 'Simulation',  icon: SimIcon   },
  { id: 'realtime',   label: 'Realtime',    icon: RealtimeIcon },
  { id: 'analytics',  label: 'Analytics',   icon: AnalyticsIcon },
  { id: 'logs',       label: 'Logs',        icon: LogsIcon  },
]

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

function SimIcon()      { return <NavIcon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v7M14 17h7" /> }
function RealtimeIcon() { return <NavIcon d="M22 12h-4l-3 9L9 3l-3 9H2" /> }
function AnalyticsIcon(){ return <NavIcon d="M18 20V10M12 20V4M6 20v-6" /> }
function LogsIcon()     { return <NavIcon d="M4 6h16M4 10h16M4 14h10M4 18h6" /> }
function SettingsIcon() { return <NavIcon d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /> }

function NavIcon({ d }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={() => onClick(item.id)}
      title={item.label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        width: '100%',
        padding: '7px 12px',
        background: active ? 'var(--surface-3)' : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        borderLeft: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
        cursor: 'pointer',
        color: active ? 'var(--text-1)' : 'var(--text-2)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 500 : 400,
        letterSpacing: '0.01em',
        transition: 'all var(--dur-fast) var(--ease-out)',
        textAlign: 'left',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-2)'
          e.currentTarget.style.color = 'var(--text-1)'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-2)'
        }
      }}
    >
      <span style={{ opacity: active ? 1 : 0.65, flexShrink: 0 }}>
        <item.icon />
      </span>
      <span>{item.label}</span>
    </button>
  )
}

export default function LeftNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      width: 'var(--left-nav-w)',
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--divider)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--sp-3)',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      {/* Section label */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.14em',
        color: 'var(--muted)',
        padding: '4px 12px 8px',
        textTransform: 'uppercase',
      }}>
        Phase 1
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={onTabChange}
          />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <div style={{
        height: 1,
        background: 'var(--divider)',
        margin: 'var(--sp-2) 0',
      }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {BOTTOM_ITEMS.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={activeTab === item.id}
            onClick={onTabChange}
          />
        ))}
      </div>

      {/* Build info */}
      <div style={{
        padding: '8px 12px 4px',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--muted)',
        lineHeight: 1.6,
      }}>
        RF MESH · A* ROUTING<br />
        BUILD 2025.07
      </div>
    </nav>
  )
}
