import { Suspense, useState } from 'react'
import CommandScene from '../athena/scene/CommandScene'
import AlertToast from '../components/ui/AlertToast'
import CommandBar from './CommandBar'
import LeftNav from './LeftNav'
import ContextPanel from './ContextPanel'
import Console from './Console'
import HardwarePanel from './HardwarePanel'
import { useAthena } from '../athena/store'

function WorkspaceLabel({ tel }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '8px 20px',
      background: 'rgba(17,17,20,0.8)',
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--divider)',
      borderRadius: 'var(--radius-md)',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>
          ACTIVE ROUTE · A* OPTIMAL
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--primary)', letterSpacing: '0.06em' }}>
          {tel.routeLabel}
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: 'var(--divider)' }} />

      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>
          SYSTEM
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: tel.systemStatus === 'TRANSMITTING'
            ? 'var(--success-text)'
            : tel.systemStatus === 'COMPLETE'
            ? 'var(--primary)'
            : 'var(--text-2)',
        }}>
          {tel.systemStatus}
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: 'var(--divider)' }} />

      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: 2 }}>
          STEP
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
          —
        </div>
      </div>
    </div>
  )
}

function WorkspaceControls() {
  const cinematic = useAthena(s => s.cinematic)
  const setCinematic = useAthena(s => s.setCinematic)

  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      zIndex: 10,
      pointerEvents: 'auto',
    }}>
      <button
        onClick={() => setCinematic(!cinematic)}
        style={{
          background: cinematic ? 'rgba(45,127,249,0.15)' : 'rgba(17,17,20,0.8)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${cinematic ? 'rgba(45,127,249,0.3)' : 'var(--divider)'}`,
          borderRadius: 'var(--radius-sm)',
          color: cinematic ? 'var(--primary)' : 'var(--text-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          padding: '5px 10px',
          cursor: 'pointer',
          transition: 'all var(--dur-fast)',
        }}
      >
        {cinematic ? '◉ AUTO-ROTATE' : '○ MANUAL'}
      </button>

      <div style={{
        padding: '5px 10px',
        background: 'rgba(17,17,20,0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--divider)',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        color: 'var(--muted)',
        letterSpacing: '0.06em',
        lineHeight: 1.7,
        pointerEvents: 'none',
      }}>
        DRAG · ORBIT<br />
        SCROLL · ZOOM<br />
        R-DRAG · PAN
      </div>
    </div>
  )
}

export default function AppShell() {
  const [activeMode, setActiveMode] = useState('SIMULATION')
  const [activeTab, setActiveTab] = useState('simulation')
  const [consoleCollapsed, setConsoleCollapsed] = useState(false)
  const tel = useAthena(s => s.telemetry)

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Top command bar */}
      <CommandBar activeMode={activeMode} onModeChange={setActiveMode} />

      {/* Main workspace row */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Left navigation */}
        <LeftNav activeTab={activeTab} onTabChange={setActiveTab} />

        {activeMode === 'HARDWARE' ? (
          <HardwarePanel />
        ) : (
          <>
            {/* 3D Viewport — the centerpiece */}
            <main style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              background: '#09090B',
            }}>
              <Suspense fallback={
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--muted)',
                  letterSpacing: '0.1em',
                }}>
                  INITIALIZING 3D ENGINE…
                </div>
              }>
                <CommandScene />
              </Suspense>

              {/* Overlay controls */}
              <WorkspaceControls />

              {/* Bottom status bar overlay */}
              <WorkspaceLabel tel={tel} />
            </main>

            {/* Right context panel */}
            <ContextPanel />
          </>
        )}
      </div>

      {/* Bottom console */}
      <Console
        collapsed={consoleCollapsed}
        onToggleCollapse={() => setConsoleCollapsed(v => !v)}
      />

      {/* Alert toasts (fixed, top-right) */}
      <AlertToast />
    </div>
  )
}
