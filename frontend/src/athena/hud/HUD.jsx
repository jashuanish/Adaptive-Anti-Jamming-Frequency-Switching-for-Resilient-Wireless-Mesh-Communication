import { useAthena } from '../store'
import { commands } from '../useTelemetry'
import Button from '../../components/ui/Button'
import SignalMeter from '../../components/ui/SignalMeter'
import ProgressBar from '../../components/ui/ProgressBar'
import MetricTile from '../../components/ui/MetricTile'

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
      fontSize: 10,
      letterSpacing: '0.14em',
      color: 'var(--text-1)',
      textTransform: 'uppercase',
      padding: '4px 0 8px',
      borderBottom: '1px solid var(--divider)',
      marginBottom: 12,
      fontWeight: 600,
    }}>
      {children}
    </div>
  )
}

function RouteSelect() {
  const raw = useAthena(s => s.raw)
  const tel = useAthena(s => s.telemetry)

  const selectStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid var(--divider)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-1)',
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
    outline: 'none',
  }

  const path = raw?.macro_path || []
  const currentSource = path[0] || 'H1'
  const currentTarget = path[path.length - 1] || 'H9'

  const handleChange = (source, target) => {
    commands.setRoute(source, target)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div className="text-label" style={{ marginBottom: 6 }}>Source Node</div>
        <select
          style={selectStyle}
          value={currentSource}
          onChange={e => handleChange(e.target.value, currentTarget)}
        >
          {HOSTS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <div>
        <div className="text-label" style={{ marginBottom: 6 }}>Target Node</div>
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
          padding: '8px 12px',
          background: 'rgba(45,127,249,0.15)',
          border: '1px solid rgba(45,127,249,0.3)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--primary)',
          letterSpacing: '0.06em',
          textAlign: 'center',
          fontWeight: 600
        }}>
          ROUTE: {tel.routeLabel}
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
    <div style={{ display: 'flex', gap: 8 }}>
      <Button
        variant={running ? 'ghost' : complete ? 'ghost' : 'success'}
        style={{ flex: 1 }}
        disabled={complete}
        onClick={() => commands.start()}
      >
        {running ? 'Transmitting…' : complete ? '✓ Complete' : '▶ Start'}
      </Button>
      <Button
        variant={jammerOn ? 'danger-active' : 'danger'}
        style={{ flex: 1 }}
        onClick={() => commands.toggleDynamicJammer(!jammerOn)}
      >
        {jammerOn ? '■ Stop Jam' : '⚡ Inject Jam'}
      </Button>
      <Button
        variant="ghost"
        onClick={() => commands.reset()}
      >
        ↺ Reset
      </Button>
    </div>
  )
}

function ThreatMeter({ level, score }) {
  const color = THREAT_COLOR[level] || 'var(--success)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="text-label" style={{ fontSize: 'var(--text-sm)' }}>Threat Level</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          color,
          letterSpacing: '0.08em',
        }}>
          {level}
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score * 100}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease-out' }} />
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
      padding: '8px 12px',
      background: jammed ? 'rgba(255,77,79,0.15)' : 'rgba(0,0,0,0.4)',
      border: `1px solid ${jammed ? 'rgba(255,77,79,0.4)' : 'var(--divider)'}`,
      borderRadius: 'var(--radius-sm)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: jammed ? 'var(--danger-text)' : 'var(--text-1)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: jammed ? 'var(--danger)' : 'var(--success)', letterSpacing: '0.1em', fontWeight: 600 }}>
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

  const edgeKey = (a, b) => `${a < b ? a : b}-${a < b ? b : a}`
  const jammedFreqs = raw?.jammed_freqs || {}
  const freqs = raw?.frequencies || ['F1', 'F2', 'F3', 'F4', 'F5']

  const edgeData = currHost && nextHost ? (jammedFreqs[edgeKey(currHost, nextHost)] || {}) : {}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="text-label" style={{ fontSize: 'var(--text-sm)' }}>Active Link Channels</span>
        {currHost && nextHost && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
            {currHost} → {nextHost}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {freqs.map(f => (
          <FreqChannel key={f} label={f} jammed={!!edgeData[f]} />
        ))}
      </div>
      {st.freq_tried && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: st.hop_success ? 'rgba(46,204,113,0.15)' : 'rgba(255,77,79,0.15)',
          border: `1px solid ${st.hop_success ? 'rgba(46,204,113,0.3)' : 'rgba(255,77,79,0.3)'}`,
          borderRadius: 'var(--radius-sm)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-1)' }}>
            Last hop: {st.freq_tried}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: st.hop_success ? 'var(--success)' : 'var(--danger)', letterSpacing: '0.1em', fontWeight: 600 }}>
            {st.hop_success ? 'SUCCESS' : 'BLOCKED'}
          </span>
        </div>
      )}
    </div>
  )
}

function HudPanel({ children, style }) {
  return (
    <div style={{
      background: 'rgba(15, 15, 18, 0.75)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      pointerEvents: 'auto',
      ...style
    }}>
      {children}
    </div>
  )
}

export default function HUD() {
  const tel = useAthena(s => s.telemetry)
  const raw = useAthena(s => s.raw)
  const st = raw?.state || {}

  const progressVariant = tel.jammerActive ? 'danger' : tel.progress >= 1 ? 'success' : 'primary'

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      padding: '24px'
    }}>
      {/* Left Column HUD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 340 }}>
        
        <HudPanel>
          <SectionLabel>Network Command</SectionLabel>
          <RouteSelect />
          <div style={{ height: 16 }} />
          <Controls />
        </HudPanel>

        <HudPanel>
          <SectionLabel>Transmission Metrics</SectionLabel>
          <ProgressBar value={tel.progress} variant={progressVariant} height={8} label="Payload Delivered" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <MetricTile label="Packets Lost" value={st.packet_loss ?? 0} variant={st.packet_loss > 0 ? 'warning' : 'default'} />
            <MetricTile label="Msg Chars" value={`${st.message_idx ?? 0}/${raw?.full_message?.length ?? 0}`} variant="default" />
          </div>
        </HudPanel>

        {st.received_message && (
          <HudPanel>
            <SectionLabel>Received Buffer</SectionLabel>
            <div style={{
              padding: '12px',
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid var(--divider)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-1)',
              wordBreak: 'break-all',
              lineHeight: 1.5,
              position: 'relative'
            }}>
              <div style={{ display: 'inline' }}>
                {st.received_message}
                {st.message_idx < (raw?.full_message?.length ?? 0) && (
                  <span className="animate-blink" style={{ color: 'var(--primary)' }}>_</span>
                )}
              </div>
              {st.corrected_message && st.corrected_message !== st.received_message && (
                <div style={{
                  marginTop: 8, padding: '8px',
                  background: 'rgba(46,204,113,0.15)',
                  border: '1px solid rgba(46,204,113,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11, color: 'var(--success)', letterSpacing: '0.05em'
                }}>
                  AUTO-CORRECTED: {st.corrected_message}
                </div>
              )}
            </div>
          </HudPanel>
        )}

      </div>

      {/* Right Column HUD */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: 340 }}>
        
        <HudPanel>
          <SectionLabel>RF Telemetry</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SignalMeter value={tel.signalQuality} label="Signal Quality" />
            <ThreatMeter level={tel.threatLevel} score={tel.threatScore} />
          </div>
        </HudPanel>

        <HudPanel>
          <SectionLabel>Frequency Map</SectionLabel>
          <FrequencyPanel />
        </HudPanel>

      </div>

      {/* Target Acquired Overlay */}
      {tel.progress >= 1 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(15, 15, 18, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '2px solid var(--success)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 0 80px rgba(46,204,113,0.3)',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--success)', letterSpacing: '0.15em', textAlign: 'center' }}>
            TARGET ACQUIRED
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text-1)', letterSpacing: '0.1em' }}>
            MISSION COMPLETE
          </div>
          {st.corrected_message && (
            <div style={{
              marginTop: 24, padding: '16px 24px',
              background: 'rgba(46,204,113,0.15)',
              border: '1px solid rgba(46,204,113,0.4)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 11, color: 'var(--success)', letterSpacing: '0.1em', fontWeight: 600 }}>
                STRING MATCHING AUTOCORRECT
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-1)' }}>
                {st.corrected_message}
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
