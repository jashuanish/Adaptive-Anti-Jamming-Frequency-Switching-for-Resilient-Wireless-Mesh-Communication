import { useEffect, useRef, useState, useCallback } from 'react'
import { useAthena } from '../athena/store'

const LEVEL_CONFIG = {
  INFO:    { color: 'var(--text-2)',      label: 'INF' },
  WARN:    { color: 'var(--warning-text)', label: 'WRN' },
  ERROR:   { color: 'var(--danger-text)',  label: 'ERR' },
  SUCCESS: { color: 'var(--success-text)', label: 'OK ' },
  DEBUG:   { color: 'var(--muted)',        label: 'DBG' },
}

// Build a log entry from telemetry state
function buildLogFromState(raw, tel) {
  const entries = []
  const ts = new Date().toISOString().slice(11, 23)
  const st = raw?.state || {}

  if (raw?.running) {
    if (st.freq_tried) {
      const lvl = st.hop_success ? 'SUCCESS' : 'WARN'
      entries.push({
        id: Date.now() + Math.random(),
        ts,
        level: lvl,
        msg: st.hop_success
          ? `HOP OK [${st.current_host}→${st.target_host}] freq=${st.freq_tried}`
          : `JAMMED [${st.current_host}→${st.target_host}] freq=${st.freq_tried} — retrying`,
      })
    }
  }

  if (tel.systemStatus === 'COMPLETE') {
    entries.push({ id: Date.now() + 1, ts, level: 'SUCCESS', msg: 'TRANSMISSION COMPLETE — payload delivered to receiver' })
  }

  if (tel.jammerActive) {
    entries.push({ id: Date.now() + 2, ts, level: 'WARN', msg: `RF INTERFERENCE DETECTED — threat=${tel.threatLevel} quality=${Math.round(tel.signalQuality)}%` })
  }

  return entries
}

const FILTER_LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'SUCCESS', 'DEBUG']

export default function Console({ collapsed, onToggleCollapse }) {
  const [logs, setLogs] = useState([
    { id: 0, ts: new Date().toISOString().slice(11, 23), level: 'INFO', msg: 'RF Mesh Control initialized — A* routing engine online' },
    { id: 1, ts: new Date().toISOString().slice(11, 23), level: 'INFO', msg: 'Backend telemetry link established · polling 850ms' },
  ])
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const listRef = useRef(null)
  const prevRef = useRef({ status: '', hop: null, jammer: false })

  const raw = useAthena(s => s.raw)
  const tel = useAthena(s => s.telemetry)
  const connected = useAthena(s => s.connected)

  // Ingest state changes as log lines
  useEffect(() => {
    if (!raw) return
    const st = raw.state || {}
    const prev = prevRef.current
    const ts = new Date().toISOString().slice(11, 23)
    const newEntries = []

    // Connection change
    if (!connected) {
      newEntries.push({ id: Date.now(), ts, level: 'ERROR', msg: 'Backend link lost — attempting reconnect' })
    }

    // Jammer transition
    if (tel.jammerActive && !prev.jammer) {
      newEntries.push({ id: Date.now() + 1, ts, level: 'WARN', msg: `RF INTERFERENCE ACTIVE — sat=${Math.round(tel.threatScore * 100)}% tier=${tel.threatLevel}` })
    }
    if (!tel.jammerActive && prev.jammer) {
      newEntries.push({ id: Date.now() + 2, ts, level: 'SUCCESS', msg: 'RF spectrum clear — jammer neutralized' })
    }

    // Hop result
    const hopKey = `${st.current_host}-${st.freq_tried}-${raw.step}`
    if (raw.running && st.freq_tried && hopKey !== prev.hop) {
      newEntries.push({
        id: Date.now() + 3,
        ts,
        level: st.hop_success ? 'SUCCESS' : 'WARN',
        msg: st.hop_success
          ? `HOP OK   ${st.current_host} → ${st.target_host}   channel=${st.freq_tried}   pkt#${raw.step}`
          : `BLOCKED  ${st.current_host} → ${st.target_host}   channel=${st.freq_tried} JAMMED   pkt#${raw.step}`,
      })
      prev.hop = hopKey
    }

    // Transmission complete
    if (tel.systemStatus === 'COMPLETE' && prev.status !== 'COMPLETE') {
      newEntries.push({ id: Date.now() + 4, ts, level: 'SUCCESS', msg: `TRANSMISSION COMPLETE — ${st.received_message}` })
    }

    // Route change
    if (tel.routeLabel !== '—' && tel.routeLabel !== prev.status) {
      newEntries.push({ id: Date.now() + 5, ts, level: 'INFO', msg: `ROUTE SET  ${tel.routeLabel}` })
      prev.status = tel.routeLabel
    }

    prev.jammer = tel.jammerActive
    prev.status = tel.systemStatus

    if (newEntries.length > 0) {
      setLogs(prev => [...prev.slice(-198), ...newEntries])
    }
  }, [raw, tel, connected])

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && listRef.current && !collapsed) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [logs, autoScroll, collapsed])

  const filteredLogs = logs.filter(l => {
    const matchLevel = filter === 'ALL' || l.level === filter
    const matchSearch = !search || l.msg.toLowerCase().includes(search.toLowerCase())
    return matchLevel && matchSearch
  })

  const copyLogs = useCallback(() => {
    const text = filteredLogs.map(l => `[${l.ts}] ${l.level.padEnd(7)} ${l.msg}`).join('\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }, [filteredLogs])

  return (
    <div style={{
      height: collapsed ? 32 : 'var(--console-h)',
      background: 'var(--surface-1)',
      borderTop: '1px solid var(--divider)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      transition: 'height var(--dur-base) var(--ease-out)',
      overflow: 'hidden',
    }}>
      {/* Console toolbar */}
      <div style={{
        height: 32,
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--sp-3)',
        gap: 'var(--sp-2)',
        borderBottom: collapsed ? 'none' : '1px solid var(--divider)',
        flexShrink: 0,
      }}>
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            padding: '2px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color var(--dur-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          <span style={{ fontSize: 8, transform: collapsed ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform var(--dur-base)' }}>▲</span>
          SYSTEM CONSOLE
          <span style={{
            background: 'var(--surface-3)',
            color: 'var(--text-2)',
            borderRadius: 3,
            padding: '0 5px',
            fontSize: 9,
          }}>
            {logs.length}
          </span>
        </button>

        {!collapsed && (
          <>
            <div style={{ width: 1, height: 16, background: 'var(--divider)' }} />

            {/* Level filter */}
            {FILTER_LEVELS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'var(--surface-3)' : 'none',
                  border: `1px solid ${filter === f ? 'var(--divider-strong)' : 'transparent'}`,
                  borderRadius: 3,
                  color: filter === f ? 'var(--text-1)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  padding: '2px 7px',
                  transition: 'all var(--dur-fast)',
                }}
              >
                {f}
              </button>
            ))}

            <div style={{ width: 1, height: 16, background: 'var(--divider)' }} />

            {/* Search */}
            <input
              type="text"
              placeholder="Filter logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--divider)',
                borderRadius: 3,
                color: 'var(--text-1)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '2px 8px',
                outline: 'none',
                width: 140,
              }}
            />

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(v => !v)}
              style={{
                background: autoScroll ? 'var(--primary-dim)' : 'none',
                border: `1px solid ${autoScroll ? 'rgba(45,127,249,0.25)' : 'transparent'}`,
                borderRadius: 3,
                color: autoScroll ? 'var(--primary)' : 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                padding: '2px 7px',
                transition: 'all var(--dur-fast)',
              }}
            >
              AUTO-SCROLL
            </button>

            {/* Copy */}
            <button
              onClick={copyLogs}
              style={{
                background: 'none',
                border: '1px solid var(--divider)',
                borderRadius: 3,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                padding: '2px 7px',
                transition: 'color var(--dur-fast)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              COPY
            </button>
          </>
        )}
      </div>

      {/* Log lines */}
      {!collapsed && (
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {filteredLogs.map(entry => {
            const cfg = LEVEL_CONFIG[entry.level] || LEVEL_CONFIG.INFO
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  padding: '2px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  lineHeight: 1.6,
                  borderBottom: '1px solid transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ color: 'var(--muted)', flexShrink: 0, fontSize: 10 }}>{entry.ts}</span>
                <span style={{
                  color: cfg.color,
                  flexShrink: 0,
                  width: 28,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}>
                  {cfg.label}
                </span>
                <span style={{ color: 'var(--text-2)', wordBreak: 'break-word' }}>{entry.msg}</span>
              </div>
            )
          })}

          {filteredLogs.length === 0 && (
            <div style={{
              padding: '20px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--muted)',
              textAlign: 'center',
            }}>
              No log entries match filter
            </div>
          )}
        </div>
      )}
    </div>
  )
}
