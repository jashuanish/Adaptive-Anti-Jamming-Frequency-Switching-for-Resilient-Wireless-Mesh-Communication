import { useState, useEffect, useRef } from 'react'
import Button from '../components/ui/Button'
import StatusPill from '../components/ui/StatusPill'
import ProgressBar from '../components/ui/ProgressBar'
import MetricTile from '../components/ui/MetricTile'

export default function HardwarePanel() {
  const [step, setStep] = useState('INIT') // 'INIT' | 'SCANNING' | 'DEVICES' | 'CONNECTING' | 'ONLINE'
  const [scanProgress, setScanProgress] = useState(0)
  const [scanLogs, setScanLogs] = useState([])
  const [devices, setDevices] = useState([
    { id: 'dev1', name: 'ESP32-S3 Node Alpha', port: 'COM3', firmware: 'v2.4.1', battery: 94, signal: -58, temp: 32.4, role: 'sender', status: 'STANDBY', health: 'Nominal' },
    { id: 'dev2', name: 'ESP32-S3 Node Beta',  port: 'COM4', firmware: 'v2.4.1', battery: 89, signal: -62, temp: 34.1, role: 'receiver', status: 'STANDBY', health: 'Nominal' },
    { id: 'dev3', name: 'ESP32-S3 Node Gamma', port: 'COM5', firmware: 'v2.4.1', battery: 76, signal: -78, temp: 38.6, role: 'jammer', status: 'STANDBY', health: 'Nominal' }
  ])
  const [connectProgress, setConnectProgress] = useState(0)
  const [connectLogs, setConnectLogs] = useState([])
  const [chatMessages, setChatMessages] = useState([
    { sender: 'SYSTEM', msg: 'Secure channel initialized using AES-128 encryption.', ts: '11:04:12' },
    { sender: 'Alpha', msg: 'System check complete. Nodes responding.', ts: '11:04:45' },
    { sender: 'Beta', msg: 'Receiver sync signal locked.', ts: '11:05:01' }
  ])
  const [inputMsg, setInputMsg] = useState('')
  const [telemetry, setTelemetry] = useState({
    packetRate: 120,
    rssi: -62,
    noiseFloor: -98,
    temp: 34.1,
    jamIntensity: 0,
    isJammingDetected: false
  })

  const logContainerRef = useRef(null)
  const chatEndRef = useRef(null)

  // Simulation of Live Telemetry when Online
  useEffect(() => {
    if (step !== 'ONLINE') return
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const isJammed = Math.random() < 0.15 || prev.jamIntensity > 0
        const randJam = isJammed ? Math.floor(Math.random() * 40) + 60 : 0
        const currentRate = isJammed ? Math.floor(Math.random() * 40) + 20 : Math.floor(Math.random() * 15) + 110
        const currentRssi = isJammed ? -92 + Math.floor(Math.random() * 10) : -60 + Math.floor(Math.random() * 6)
        
        return {
          packetRate: currentRate,
          rssi: currentRssi,
          noiseFloor: isJammed ? -72 : -98 + Math.floor(Math.random() * 4),
          temp: parseFloat((34.1 + Math.sin(Date.now() / 10000) * 1.5).toFixed(1)),
          jamIntensity: randJam,
          isJammingDetected: isJammed
        }
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [step])

  // Scanning Progress Logic
  useEffect(() => {
    if (step !== 'SCANNING') return
    setScanProgress(0)
    setScanLogs([])
    
    const logs = [
      'Initializing hardware bridge link...',
      'Searching local USB controller interfaces...',
      'USB Host Controller detected (Silicon Labs CP210x Drivers loaded)',
      'Scanning serial COM ports for active hardware...',
      'COM3 [ESP32-S3 Node] response received',
      'COM4 [ESP32-S3 Node] response received',
      'COM5 [ESP32-S3 Node] response received',
      'Querying device firmware status registers...',
      'Hardware enumeration verification complete.'
    ]

    let logIndex = 0
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setScanLogs(prev => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${logs[logIndex]}`])
        logIndex++
      }
    }, 450)

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          clearInterval(logInterval)
          setTimeout(() => setStep('DEVICES'), 500)
          return 100
        }
        return prev + 4
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      clearInterval(logInterval)
    }
  }, [step])

  // Handshake Connection Logic
  useEffect(() => {
    if (step !== 'CONNECTING') return
    setConnectProgress(0)
    setConnectLogs([])

    const logs = [
      'Establishing physical RF link on 2.484 GHz...',
      'Broadcasting cryptographic sync beacon (AES-128)...',
      'Sender role assigned to Alpha [COM3]',
      'Receiver role assigned to Beta [COM4]',
      'Jammer threat role assigned to Gamma [COM5]',
      'Performing frequency hop table distribution...',
      'Hop pattern synchronized [Channels: 12, 34, 56, 78, 90]',
      'Exchange sequence handshake OK',
      'Hardware RF communication link ONLINE.'
    ]

    let logIndex = 0
    const logInterval = setInterval(() => {
      if (logIndex < logs.length) {
        setConnectLogs(prev => [...prev, `[${new Date().toISOString().slice(11, 19)}] ${logs[logIndex]}`])
        logIndex++
      }
    }, 500)

    const progressInterval = setInterval(() => {
      setConnectProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          clearInterval(logInterval)
          setTimeout(() => setStep('ONLINE'), 500)
          return 100
        }
        return prev + 5
      })
    }, 120)

    return () => {
      clearInterval(progressInterval)
      clearInterval(logInterval)
    }
  }, [step])

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [scanLogs, connectLogs])

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const handleStartScan = () => {
    setStep('SCANNING')
  }

  const handleRoleChange = (id, newRole) => {
    setDevices(prev => prev.map(d => {
      if (d.id === id) return { ...d, role: newRole }
      // Enforce unique roles
      if (d.role === newRole) return { ...d, role: 'none' }
      return d
    }))
  }

  const handleInitializeNetwork = () => {
    setStep('CONNECTING')
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMsg.trim()) return

    const ts = new Date().toISOString().slice(11, 19)
    const newMsg = { sender: 'OPERATOR', msg: inputMsg, ts }
    setChatMessages(prev => [...prev, newMsg])
    setInputMsg('')

    // Simulate response sequence
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        sender: 'Beta',
        msg: `ACK received. Link RSSI: ${telemetry.rssi} dBm. Packet index verified.`,
        ts: new Date().toISOString().slice(11, 19)
      }])
    }, 1000)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: 'var(--surface-1)',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px var(--sp-4)',
        borderBottom: '1px solid var(--divider)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface-2)'
      }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-1)' }}>Hardware Operations Dashboard</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Direct serial link control to ESP32 nodes using RF physical transceivers</p>
        </div>
        <div>
          <StatusPill 
            variant={step === 'ONLINE' ? 'nominal' : step === 'INIT' ? 'muted' : 'warning'} 
            label={step === 'ONLINE' ? 'HARDWARE ONLINE' : step === 'DEVICES' ? 'READY TO SYNC' : 'HARDWARE STANDBY'} 
            pulse={step === 'ONLINE' || step === 'SCANNING' || step === 'CONNECTING'}
          />
        </div>
      </div>

      {/* Mode Screens */}
      <div style={{ flex: 1, padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', minHeight: 0 }}>
        
        {/* INIT state */}
        {step === 'INIT' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px dashed var(--divider-strong)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-2)',
            padding: '40px',
            textAlign: 'center'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" style={{ marginBottom: '16px' }}>
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="18" x2="18.01" y2="18" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 500, color: 'var(--text-1)', marginBottom: '8px' }}>No active hardware link</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '400px', marginBottom: '24px' }}>
              Connect ESP32 / NRF modules to your local USB ports and scan COM interfaces to establish dynamic hardware operation.
            </p>
            <Button variant="primary" onClick={handleStartScan}>
              Scan USB COM Ports
            </Button>
          </div>
        )}

        {/* SCANNING State */}
        {step === 'SCANNING' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-4)',
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
            justifyContent: 'center'
          }}>
            <div className="panel" style={{ padding: '24px', background: 'var(--surface-2)' }}>
              <div style={{ marginBottom: '16px' }}>
                <span className="text-label">System Hardware Probe</span>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 500, marginTop: '4px' }}>Scanning COM Interfaces & RF Modules...</h3>
              </div>
              
              <ProgressBar value={scanProgress / 100} variant="primary" height={6} label="Scan Progress" />
              
              {/* Scan Log Terminal */}
              <div 
                ref={logContainerRef}
                style={{
                  height: '200px',
                  background: 'var(--bg)',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '20px',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-2)',
                  overflowY: 'auto',
                  lineHeight: '1.6'
                }}
              >
                {scanLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                <div className="animate-blink" style={{ display: 'inline-block', width: '6px', height: '12px', background: 'var(--muted)', marginLeft: '4px' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* DEVICES Config State */}
        {step === 'DEVICES' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-1)', marginBottom: '4px' }}>Detected Hardware Modules</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Assign node operational roles to initialize target mesh topology</p>
            </div>

            {/* Devices grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--sp-4)'
            }}>
              {devices.map(dev => (
                <div key={dev.id} className="panel" style={{
                  padding: '16px',
                  background: 'var(--surface-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, color: 'var(--text-1)' }}>{dev.name}</h4>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                        {dev.port} · FW {dev.firmware}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 6px',
                      background: dev.role === 'sender' ? 'var(--success-dim)' : dev.role === 'receiver' ? 'var(--primary-dim)' : dev.role === 'jammer' ? 'var(--danger-dim)' : 'var(--surface-3)',
                      color: dev.role === 'sender' ? 'var(--success-text)' : dev.role === 'receiver' ? 'var(--primary)' : dev.role === 'jammer' ? 'var(--danger-text)' : 'var(--muted)',
                      border: '1px solid var(--divider)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}>
                      {dev.role}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 'var(--text-xs)' }}>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Battery:</span>
                      <span style={{ marginLeft: '4px', fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{dev.battery}%</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Signal:</span>
                      <span style={{ marginLeft: '4px', fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{dev.signal} dBm</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Health:</span>
                      <span style={{ marginLeft: '4px', color: 'var(--success-text)', fontWeight: 500 }}>{dev.health}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--muted)' }}>Temp:</span>
                      <span style={{ marginLeft: '4px', fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{dev.temp} °C</span>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--divider)' }}></div>

                  {/* Role assignment selectors */}
                  <div>
                    <span className="text-label" style={{ display: 'block', marginBottom: '6px' }}>Assign Operational Role</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['sender', 'receiver', 'jammer'].map(r => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(dev.id, r)}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            background: dev.role === r ? 'var(--surface-3)' : 'transparent',
                            border: `1px solid ${dev.role === r ? 'var(--primary)' : 'var(--divider)'}`,
                            borderRadius: 'var(--radius-sm)',
                            color: dev.role === r ? 'var(--primary)' : 'var(--text-2)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all var(--dur-fast)'
                          }}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="ghost" onClick={() => setStep('INIT')}>Cancel</Button>
              <Button variant="primary" onClick={handleInitializeNetwork}>
                Initialize Hardware Network
              </Button>
            </div>
          </div>
        )}

        {/* CONNECTING state */}
        {step === 'CONNECTING' && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-4)',
            maxWidth: '800px',
            margin: '0 auto',
            width: '100%',
            justifyContent: 'center'
          }}>
            <div className="panel" style={{ padding: '24px', background: 'var(--surface-2)' }}>
              <div style={{ marginBottom: '16px' }}>
                <span className="text-label">AES-128 Sync Handshake Sequence</span>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 500, marginTop: '4px' }}>Initializing Cryptographic Signal Link...</h3>
              </div>
              
              <ProgressBar value={connectProgress / 100} variant="success" height={6} label="Negotiating Sync State" />
              
              {/* Handshake Log Terminal */}
              <div 
                ref={logContainerRef}
                style={{
                  height: '200px',
                  background: 'var(--bg)',
                  border: '1px solid var(--divider)',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '20px',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-2)',
                  overflowY: 'auto',
                  lineHeight: '1.6'
                }}
              >
                {connectLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                <div className="animate-blink" style={{ display: 'inline-block', width: '6px', height: '12px', background: 'var(--muted)', marginLeft: '4px' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* ONLINE State */}
        {step === 'ONLINE' && (
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: 'var(--sp-4)',
            minHeight: 0
          }}>
            
            {/* Sidebar Telemetry Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="panel" style={{ padding: '16px', background: 'var(--surface-2)' }}>
                <h4 className="text-label" style={{ marginBottom: '12px' }}>Operational Parameters</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <MetricTile label="RF PACKET RATE" value={telemetry.packetRate} unit="pkt/sec" variant={telemetry.isJammingDetected ? 'warning' : 'nominal'} />
                  <MetricTile label="LINK QUALITY (RSSI)" value={telemetry.rssi} unit="dBm" variant={telemetry.rssi < -80 ? 'danger' : 'default'} />
                  <MetricTile label="NOISE FLOOR" value={telemetry.noiseFloor} unit="dBm" />
                  <MetricTile label="NODE TEMP" value={`${telemetry.temp}`} unit="°C" />
                </div>
              </div>

              <div className="panel" style={{ padding: '16px', background: 'var(--surface-2)' }}>
                <h4 className="text-label" style={{ marginBottom: '12px' }}>Jammer Signal Matrix</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: 'var(--text-xs)' }}>
                      <span style={{ color: 'var(--text-2)' }}>Interference Saturation</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: telemetry.isJammingDetected ? 'var(--danger-text)' : 'var(--success-text)' }}>
                        {telemetry.jamIntensity}%
                      </span>
                    </div>
                    <div style={{ height: '4px', background: 'var(--surface-4)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${telemetry.jamIntensity}%`, background: 'var(--danger)', borderRadius: '2px', transition: 'width 0.4s' }}></div>
                    </div>
                  </div>
                  
                  <div style={{
                    padding: '8px 12px',
                    background: telemetry.isJammingDetected ? 'var(--danger-dim)' : 'var(--success-dim)',
                    border: `1px solid ${telemetry.isJammingDetected ? 'var(--danger)' : 'var(--success)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    color: telemetry.isJammingDetected ? 'var(--danger-text)' : 'var(--success-text)',
                    fontWeight: 500,
                    textAlign: 'center'
                  }}>
                    {telemetry.isJammingDetected ? '⚠ ACTIVE RF ATTACK DETECTED' : '✓ LINK SPECTRUM NOMINAL'}
                  </div>
                </div>
              </div>

              <Button variant="ghost" fullWidth onClick={() => setStep('DEVICES')}>
                Reconfigure Roles
              </Button>
            </div>

            {/* Chat & Logs Window Column */}
            <div className="panel" style={{
              background: 'var(--surface-2)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              
              {/* Secure Chat Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--divider)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} className="animate-pulse-dot"></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-1)' }}>
                  SECURE CHAT LINK [AES-128-CBC]
                </span>
              </div>

              {/* Chat Message Stream */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {chatMessages.map((msg, i) => {
                  const isOp = msg.sender === 'OPERATOR'
                  const isSys = msg.sender === 'SYSTEM'
                  
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOp ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      alignSelf: isOp ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        marginBottom: '2px',
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--muted)'
                      }}>
                        <span style={{ fontWeight: 600, color: isOp ? 'var(--primary)' : isSys ? 'var(--danger-text)' : 'var(--text-2)' }}>
                          {msg.sender}
                        </span>
                        <span>{msg.ts}</span>
                      </div>
                      
                      <div style={{
                        padding: '8px 12px',
                        background: isOp ? 'var(--primary)' : isSys ? 'var(--surface-4)' : 'var(--surface-3)',
                        color: isOp ? '#fff' : 'var(--text-1)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        fontFamily: isSys ? 'var(--font-mono)' : 'var(--font-sans)',
                        border: isSys ? '1px solid var(--divider)' : 'none',
                        wordBreak: 'break-word',
                        lineHeight: '1.4'
                      }}>
                        {msg.msg}
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef}></div>
              </div>

              {/* Chat Message Input */}
              <form onSubmit={handleSendMessage} style={{
                padding: '12px',
                borderTop: '1px solid var(--divider)',
                background: 'var(--surface-1)',
                display: 'flex',
                gap: '8px'
              }}>
                <input
                  type="text"
                  placeholder="Transmit message to hardware RX node..."
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg)',
                    border: '1px solid var(--divider)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: 'var(--text-1)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    outline: 'none'
                  }}
                />
                <Button variant="primary" type="submit">Send</Button>
              </form>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}
