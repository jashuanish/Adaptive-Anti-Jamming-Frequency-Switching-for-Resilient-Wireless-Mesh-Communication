import { useState, useEffect, useRef } from 'react'
import Button from '../components/ui/Button'
import StatusPill from '../components/ui/StatusPill'
import ProgressBar from '../components/ui/ProgressBar'
import MetricTile from '../components/ui/MetricTile'
import { useMultiSerialStream } from '../lib/hardware'

export default function HardwarePanel() {
  const [step, setStep] = useState('INIT') // 'INIT' | 'DEVICES' | 'ONLINE'
  const [chatMessages, setChatMessages] = useState([])
  const [inputMsg, setInputMsg] = useState('')
  const [jamTargetChannel, setJamTargetChannel] = useState(76)
  
  // Local state to track selections before applying them
  const [deviceConfigs, setDeviceConfigs] = useState({})
  // Send message target
  const [chatTargetId, setChatTargetId] = useState(null)

  const [telemetry, setTelemetry] = useState({
    packetRate: 0,
    rssi: -60,
    noiseFloor: -98,
    temp: 34.1,
    jamIntensity: 0,
    isJammingDetected: false,
    cleanChannel: null
  })

  const chatEndRef = useRef(null)

  const onLineReceived = (id, line) => {
    // Parse ESP32 logs
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false })
    
    // Check if it's a chat message
    if (line.includes('[RECV] <<')) {
      const msg = line.split('[RECV] <<')[1].trim()
      setChatMessages(prev => [...prev, { sender: `Node (${id})`, msg, ts, id }])
    }
    else if (line.includes('[SENT] >>')) {
      const msg = line.split('[SENT] >>')[1].trim()
      setChatMessages(prev => [...prev, { sender: `Node (${id}) [SENT]`, msg, ts, id, dim: true }])
    }
    else if (line.includes('[JAMMER]')) {
      setChatMessages(prev => [...prev, { sender: 'SYSTEM', msg: line, ts, sys: true }])
    }
    else if (line.includes('[ALERT] Interference detected')) {
      setTelemetry(prev => ({ ...prev, isJammingDetected: true, jamIntensity: 85 }))
      setChatMessages(prev => [...prev, { sender: 'SYSTEM', msg: '⚠ INTERFERENCE DETECTED', ts, sys: true }])
    }
    else if (line.includes('[SECURE] Clean channel acquired:')) {
      const ch = line.split('acquired:')[1].trim()
      setTelemetry(prev => ({ ...prev, isJammingDetected: false, jamIntensity: 0, cleanChannel: ch }))
      setChatMessages(prev => [...prev, { sender: 'SYSTEM', msg: `✓ CHANNEL HOP SUCCESS -> CH ${ch}`, ts, sys: true }])
    }
    else {
      // Add all other system logs to chat as info
      setChatMessages(prev => [...prev, { sender: 'LOG', msg: line, ts, sys: true, dim: true }])
    }
  }

  const { devices, connect, disconnect, sendCommand, updateDeviceRole } = useMultiSerialStream(115200, onLineReceived)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])
  
  useEffect(() => {
    // Auto-select chat target if none selected and there are devices
    if (!chatTargetId && devices.length > 0) {
      const validTarget = devices.find(d => d.role === 'sender' || d.role === 'receiver')
      if (validTarget) setChatTargetId(validTarget.id)
    }
  }, [devices, chatTargetId])

  const handleStartScan = async () => {
    const id = await connect()
    if (id) {
      setStep('DEVICES')
      setDeviceConfigs(prev => ({ ...prev, [id]: { display: '4', role: 'sender', configured: false } }))
    }
  }

  const updateConfig = (id, key, val) => {
    setDeviceConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: val }
    }))
  }

  const handleApplyConfig = (id) => {
    const conf = deviceConfigs[id]
    if (!conf) return

    // 1. Send display
    sendCommand(id, conf.display)
    
    // 2. Wait a little bit, then send role
    setTimeout(() => {
      const roleNum = conf.role === 'sender' ? '1' : conf.role === 'receiver' ? '2' : '3'
      sendCommand(id, roleNum)
      updateDeviceRole(id, conf.role)
      
      // Mark as configured
      updateConfig(id, 'configured', true)
    }, 500)
  }

  const handleInitializeNetwork = () => {
    const jammer = devices.find(d => d.role === 'jammer')
    if (jammer) {
      setTimeout(() => {
        sendCommand(jammer.id, jamTargetChannel.toString())
      }, 500)
    }
    setStep('ONLINE')
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMsg.trim()) return

    if (chatTargetId) {
      sendCommand(chatTargetId, inputMsg)
      
      // Manually add the sent message from the UI to the chat list (so the user sees "ME: msg")
      // The ESP32's [SENT] >> msg will also be logged, but visually dimmed.
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false })
      setChatMessages(prev => [...prev, { sender: 'ME', msg: inputMsg, ts, isOp: true }])
    }
    setInputMsg('')
  }

  const handleJamToggle = (start) => {
    const jammerDev = devices.find(d => d.role === 'jammer')
    if (jammerDev) {
      sendCommand(jammerDev.id, start ? '/jam' : '/antijam')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--surface-1)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '16px var(--sp-4)', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-1)' }}>Hardware Operations Dashboard</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Direct serial link control to ESP32 nodes</p>
        </div>
        <div>
          <StatusPill 
            variant={step === 'ONLINE' ? 'nominal' : step === 'INIT' ? 'muted' : 'warning'} 
            label={step === 'ONLINE' ? 'HARDWARE ONLINE' : step === 'DEVICES' ? 'READY TO SYNC' : 'HARDWARE STANDBY'} 
            pulse={step === 'ONLINE'}
          />
        </div>
      </div>

      <div style={{ flex: 1, padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', minHeight: 0 }}>
        
        {step === 'INIT' && devices.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--divider-strong)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', padding: '40px', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 500, color: 'var(--text-1)', marginBottom: '8px' }}>No active hardware link</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '400px', marginBottom: '24px' }}>
              Connect ESP32 / NRF modules to your local USB ports to establish dynamic hardware operation.
            </p>
            <Button variant="primary" onClick={handleStartScan}>Add Device via Web Serial</Button>
          </div>
        )}

        {(step === 'DEVICES' || (step === 'INIT' && devices.length > 0)) && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-1)', marginBottom: '4px' }}>Detected Hardware Modules</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Configure displays and assign operational roles.</p>
              </div>
              <Button variant="ghost" onClick={handleStartScan}>+ Add Another Device</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
              {devices.map(dev => {
                const conf = deviceConfigs[dev.id] || { display: '4', role: 'sender', configured: false }
                
                return (
                  <div key={dev.id} className="panel" style={{ padding: '16px', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, color: 'var(--text-1)' }}>{dev.name}</h4>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Web Serial API</span>
                      </div>
                      <span style={{
                        padding: '2px 6px',
                        background: conf.configured ? 'var(--success-dim)' : 'var(--surface-3)',
                        color: conf.configured ? 'var(--success-text)' : 'var(--muted)',
                        border: '1px solid var(--divider)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}>
                        {conf.configured ? dev.role : 'NOT CONFIGURED'}
                      </span>
                    </div>

                    <div style={{ height: '1px', background: 'var(--divider)' }}></div>

                    <div>
                      <span className="text-label" style={{ display: 'block', marginBottom: '6px' }}>1. Display Selection</span>
                      <select 
                        disabled={conf.configured}
                        value={conf.display}
                        onChange={(e) => updateConfig(dev.id, 'display', e.target.value)}
                        style={{ width: '100%', padding: '6px', background: 'var(--bg)', color: 'white', border: '1px solid var(--divider)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                      >
                        <option value="1">TFT (ST7735)</option>
                        <option value="2">LCD (I2C 16x2)</option>
                        <option value="3">OLED (SSD1306)</option>
                        <option value="4">None</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-label" style={{ display: 'block', marginBottom: '6px' }}>2. Operational Role</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['sender', 'receiver', 'jammer'].map(r => (
                          <button
                            key={r}
                            disabled={conf.configured}
                            onClick={() => updateConfig(dev.id, 'role', r)}
                            style={{
                              flex: 1, padding: '4px 6px',
                              background: conf.role === r ? 'var(--surface-3)' : 'transparent',
                              border: `1px solid ${conf.role === r ? 'var(--primary)' : 'var(--divider)'}`,
                              borderRadius: 'var(--radius-sm)',
                              color: conf.role === r ? 'var(--primary)' : 'var(--text-2)',
                              fontFamily: 'var(--font-mono)', fontSize: '9px', cursor: conf.configured ? 'default' : 'pointer', textTransform: 'uppercase'
                            }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    {conf.role === 'jammer' && (
                      <div style={{ marginTop: 4 }}>
                        <span className="text-label" style={{ display: 'block', marginBottom: '6px' }}>Target Jamming Channel</span>
                        <input type="number" disabled={conf.configured} value={jamTargetChannel} onChange={(e) => setJamTargetChannel(e.target.value)} style={{ width: '100%', padding: '4px', background: 'var(--bg)', color: 'white', border: '1px solid var(--divider)', borderRadius: 4 }} />
                      </div>
                    )}
                    
                    {!conf.configured ? (
                      <Button variant="primary" onClick={() => handleApplyConfig(dev.id)}>Apply Configuration</Button>
                    ) : (
                      <Button variant="danger" onClick={() => {
                        disconnect(dev.id)
                        setDeviceConfigs(prev => {
                          const n = {...prev}
                          delete n[dev.id]
                          return n
                        })
                      }}>Disconnect Device</Button>
                    )}
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="primary" onClick={handleInitializeNetwork} disabled={devices.length === 0 || devices.some(d => !(deviceConfigs[d.id]?.configured))}>
                Enter Dashboard
              </Button>
            </div>
          </div>
        )}

        {step === 'ONLINE' && (
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--sp-4)', minHeight: 0 }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="panel" style={{ padding: '16px', background: 'var(--surface-2)' }}>
                <h4 className="text-label" style={{ marginBottom: '12px' }}>Operational Parameters</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <MetricTile label="ACTIVE CHANNEL" value={telemetry.cleanChannel || '76'} unit="CH" />
                  <MetricTile label="LINK QUALITY (RSSI)" value={telemetry.rssi} unit="dBm" variant={telemetry.rssi < -80 ? 'danger' : 'default'} />
                  <MetricTile label="NOISE FLOOR" value={telemetry.noiseFloor} unit="dBm" />
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

                  {devices.some(d => d.role === 'jammer') && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <Button variant="danger" fullWidth onClick={() => handleJamToggle(true)}>Start Jam</Button>
                      <Button variant="success" fullWidth onClick={() => handleJamToggle(false)}>Stop Jam</Button>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="ghost" fullWidth onClick={() => setStep('DEVICES')}>
                Back to Devices
              </Button>
            </div>

            <div className="panel" style={{ background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} className="animate-pulse-dot"></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-1)' }}>
                  SECURE CHAT LINK [SERIAL]
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.map((msg, i) => {
                  const isOp = msg.isOp
                  const isSys = msg.sys
                  
                  return (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isOp ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      alignSelf: isOp ? 'flex-end' : 'flex-start',
                      opacity: msg.dim ? 0.6 : 1
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '2px',
                        fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--muted)'
                      }}>
                        <span style={{ fontWeight: 600, color: isOp ? 'var(--primary)' : isSys ? 'var(--warning-text)' : 'var(--text-2)' }}>
                          {msg.sender}
                        </span>
                        <span>{msg.ts}</span>
                      </div>
                      
                      <div style={{
                        padding: '8px 12px',
                        background: isOp ? 'var(--primary)' : isSys ? 'var(--surface-4)' : 'var(--surface-3)',
                        color: isOp ? '#fff' : (isSys ? 'var(--warning-text)' : 'var(--text-1)'),
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

              <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid var(--divider)', background: 'var(--surface-1)', display: 'flex', gap: '8px' }}>
                <select 
                  value={chatTargetId || ''} 
                  onChange={(e) => setChatTargetId(e.target.value)}
                  style={{ background: 'var(--bg)', color: 'white', border: '1px solid var(--divider)', borderRadius: 4, padding: '0 8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}
                >
                  {devices.filter(d => d.role === 'sender' || d.role === 'receiver').map(d => (
                    <option key={d.id} value={d.id}>Send from {d.role}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Transmit message to network..."
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-1)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', outline: 'none' }}
                />
                <Button variant="primary" type="submit" disabled={!chatTargetId}>Send</Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
