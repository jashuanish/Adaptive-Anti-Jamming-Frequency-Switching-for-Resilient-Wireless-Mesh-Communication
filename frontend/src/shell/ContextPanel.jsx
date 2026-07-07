import { useAthena } from '../athena/store'
import { commands } from '../athena/useTelemetry'
import Button from '../components/ui/Button'
import SignalMeter from '../components/ui/SignalMeter'
import ProgressBar from '../components/ui/ProgressBar'
import MetricTile from '../components/ui/MetricTile'

const HOSTS = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9']

const THREAT_COLOR = {
  NOMINAL:  'var(--success)',
  GUARDED:  'var(--primary)',
  ELEVATED: 'var(--warning)',
  HIGH:     '#FF7B24',
  CRITICAL: 'var(--danger)',
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.14em',
      color: 'var(--muted)',
      textTransform: 'uppercase',
      padding: '4px 0 8px',
      borderBottom: '1px solid var(--divider)',
      marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--divider)', margin: '16px 0' }} />
}

function RouteSelect() {
  const raw = useAthena(s => s.raw)
  const tel = useAthena(s => s.telemetry)

  const selectStyle = {
    width: '100%',
    padding: '6px 10px',
    background: 'var(--bg)',
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-1)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    outline: 'none',
  }

  // Read current source/target from path
  const path = raw?.macro_path || []
  const currentSource = path[0] || 'H1'
  const currentTarget = path[path.length - 1] || 'H9'

  const handleChange = (source, target) => {
    commands.setRoute(source, target)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div className="text-label" style={{ marginBottom: 4 }}>Source Node</div>
        <select
          style={selectStyle}
          value={currentSource}
          onChange={e => handleChange(e.target.value, currentTarget)}
        >
          {HOSTS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--muted)',
        letterSpacing: '0.08em',
      }}>
        → A* OPTIMAL
      </div>
      <div>
        <div className="text-label" style={{ marginBottom: 4 }}>Target Node</div>
        <select
          style={selectStyle}
          value={currentTarget}
          onChange={e => handleChange(currentSource, e.target.value)}
        >
          {HOSTS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      {tel.routeLabel !== '—' && (
        <div style={{
          padding: '6px 10px',
          background: 'var(--primary-dim)',
          border: '1px solid rgba(45,127,249,0.2)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--primary)',
          letterSpacing: '0.06em',
        }}>
          {tel.routeLabel}
        </div>
      )}
    </div>
  )
}

function Controls() {
  const raw = useAthena(s => s.raw)
  const tel = useAthena(s => s.telemetry)
  const running = raw?.running
  const complete = tel.progress >= 1
  const jammerOn = raw?.dynamic_mode

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Start / Pause */}
      <Button
        variant={running ? 'ghost' : complete ? 'ghost' : 'success'}
        fullWidth
        disabled={complete}
        onClick={() => commands.start()}
      >
        {running
          ? <><SpinnerIcon /> Transmitting…</>
          : complete
          ? '✓ Complete'
          : '▶  Start Transmission'}
      </Button>

      {/* Jammer toggle */}
      <Button
        variant={jammerOn ? 'danger-active' : 'danger'}
        fullWidth
        onClick={() => commands.toggleDynamicJammer(!jammerOn)}
      >
        {jammerOn ? '■  Deactivate Jammer' : '⚡  Inject Jammer'}
      </Button>

      {/* Reset */}
      <Button
        variant="ghost"
        fullWidth
        onClick={() => commands.reset()}
      >
        ↺  Reset Network
      </Button>
    </div>
  )
}

function SpinnerIcon() {
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      border: '1.5px solid var(--success-text)',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      marginRight: 4,
    }} />
  )
}

function ThreatMeter({ level, score }) {
  const color = THREAT_COLOR[level] || 'var(--success)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="text-label">Threat Level</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color,
          letterSpacing: '0.08em',
          transition: 'color var(--dur-base) var(--ease-out)',
        }}>
          {level}
        </span>
      </div>
      <div style={{
        height: 4,
        background: 'var(--divider-strong)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${score * 100}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.5s ease-out, background var(--dur-base) var(--ease-out)',
        }} />
      </div>
    </div>
  )
}

function FreqChannel({ label, jammed }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '5px 8px',
      background: jammed ? 'var(--danger-dim)' : 'var(--bg)',
      border: `1px solid ${jammed ? 'rgba(255,77,79,0.2)' : 'var(--divider)'}`,
      borderRadius: 'var(--radius-sm)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: jammed ? 'var(--danger-text)' : 'var(--text-2)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: jammed ? 'var(--danger)' : 'var(--success)',
        letterSpacing: '0.1em',
      }}>
        {jammed ? 'JAMMED' : 'CLEAR'}
      </span>
    </div>
  )
}

function FrequencyPanel() {
  const raw = useAthena(s => s.raw)
  const st = raw?.state || {}
  const path = raw?.macro_path || []
  const currHost = st.current_host
  const nextHost = st.target_host

  // Build edge key matching backend
  const edgeKey = (a, b) => `${a < b ? a : b}-${a < b ? b : a}`
  const jammedFreqs = raw?.jammed_freqs || {}
  const freqs = raw?.frequencies || ['F1', 'F2', 'F3', 'F4', 'F5']

  const edgeData = currHost && nextHost
    ? (jammedFreqs[edgeKey(currHost, nextHost)] || {})
    : {}

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
      }}>
        <span className="text-label">Active Link Channels</span>
        {currHost && nextHost && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--muted)',
          }}>
            {currHost} → {nextHost}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {freqs.map(f => (
          <FreqChannel
            key={f}
            label={f}
            jammed={!!edgeData[f]}
          />
        ))}
      </div>
      {st.freq_tried && (
        <div style={{
          marginTop: 8,
          padding: '5px 8px',
          background: st.hop_success ? 'var(--success-dim)' : 'var(--danger-dim)',
          border: `1px solid ${st.hop_success ? 'rgba(46,204,113,0.2)' : 'rgba(255,77,79,0.2)'}`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-2)' }}>
            Last attempt: {st.freq_tried}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: st.hop_success ? 'var(--success)' : 'var(--danger)',
            letterSpacing: '0.1em',
          }}>
            {st.hop_success ? 'HOP OK' : 'BLOCKED'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function ContextPanel() {
  const tel = useAthena(s => s.telemetry)
  const raw = useAthena(s => s.raw)
  const st = raw?.state || {}

  // Determine progress bar variant
  const progressVariant = tel.jammerActive ? 'danger' : tel.progress >= 1 ? 'success' : 'primary'

  return (
    <aside style={{
      width: 'var(--ctx-panel-w)',
      background: 'var(--surface-1)',
      borderLeft: '1px solid var(--divider)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      <div style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Route Config */}
        <section>
          <SectionLabel>Route Configuration</SectionLabel>
          <RouteSelect />
        </section>

        <Divider />

        {/* Controls */}
        <section>
          <SectionLabel>Simulation Control</SectionLabel>
          <Controls />
        </section>

        <Divider />

        {/* Transmission Progress */}
        <section>
          <SectionLabel>Transmission Progress</SectionLabel>
          <ProgressBar value={tel.progress} variant={progressVariant} height={4} label="Payload Delivered" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <MetricTile
              label="Packets Lost"
              value={st.packet_loss ?? 0}
              variant={st.packet_loss > 0 ? 'warning' : 'default'}
            />
            <MetricTile
              label="Msg Chars"
              value={`${st.message_idx ?? 0}/${raw?.full_message?.length ?? 0}`}
              variant="default"
            />
          </div>

          {/* Received message preview */}
          {st.received_message && (
            <div style={{ marginTop: 10 }}>
              <div className="text-label" style={{ marginBottom: 4 }}>Received Buffer</div>
              <div style={{
                padding: '6px 8px',
                background: 'var(--bg)',
                border: '1px solid var(--divider)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--success-text)',
                wordBreak: 'break-all',
                letterSpacing: '0.04em',
                lineHeight: 1.6,
              }}>
                {st.received_message}
                {st.message_idx < (raw?.full_message?.length ?? 0) && (
                  <span className="animate-blink" style={{ color: 'var(--primary)' }}>_</span>
                )}
              </div>
              {st.corrected_message && st.corrected_message !== st.received_message && (
                <div style={{
                  marginTop: 4,
                  padding: '4px 8px',
                  background: 'var(--primary-dim)',
                  border: '1px solid rgba(45,127,249,0.15)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--primary)',
                }}>
                  AUTO-CORRECTED: {st.corrected_message}
                </div>
              )}
            </div>
          )}
        </section>

        <Divider />

        {/* Signal & Threat */}
        <section>
          <SectionLabel>RF Status</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SignalMeter value={tel.signalQuality} label="Signal Quality" />
            <ThreatMeter level={tel.threatLevel} score={tel.threatScore} />
          </div>
        </section>

        <Divider />

        {/* Frequency channels */}
        <section>
          <SectionLabel>Frequency Channels</SectionLabel>
          <FrequencyPanel />
        </section>

      </div>
    </aside>
  )
}
