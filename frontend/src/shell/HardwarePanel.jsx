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
      // Ignore serial echo; UI already appended the local message
      return
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
      setChatTargetId(devices[0].id)
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {devices.length > 0 && (
            <Button variant="ghost" onClick={handleStartScan}>+ Add Another Device</Button>
          )}
          <StatusPill 
            variant={devices.length > 0 ? 'nominal' : 'muted'} 
            label={devices.length > 0 ? 'HARDWARE ONLINE' : 'HARDWARE STANDBY'} 
            pulse={devices.length > 0}
          />
        </div>
      </div>

      <div style={{ flex: 1, padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', minHeight: 0 }}>
        
        {devices.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--divider-strong)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', padding: '40px', textAlign: 'center' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 500, color: 'var(--text-1)', marginBottom: '8px' }}>No active hardware link</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '400px', marginBottom: '24px' }}>
              Connect ESP32 / NRF modules to your local USB ports to establish dynamic hardware operation.
            </p>
            <Button variant="primary" onClick={handleStartScan}>Add Device via Web Serial</Button>
          </div>
        ) : (
          <div className="panel" style={{ background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} className="animate-pulse-dot"></span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-1)' }}>
                  SECURE CHAT LINK [SERIAL]
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {devices.map(d => (
                  <Button key={d.id} variant="danger" onClick={() => disconnect(d.id)} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    Disconnect {d.name}
                  </Button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.map((msg, i) => {
                const isOp = msg.isOp
                const isSys = msg.sys
                
                if (isSys) {
                  // Centered system/log pills
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '4px 0', opacity: msg.dim ? 0.5 : 1 }}>
                      <div style={{
                        background: msg.msg.includes('⚠') ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255,255,255,0.06)',
                        color: msg.msg.includes('⚠') ? '#ff3b30' : 'var(--text-2)',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        border: `1px solid ${msg.msg.includes('⚠') ? 'rgba(255, 59, 48, 0.3)' : 'transparent'}`,
                        textAlign: 'center',
                        maxWidth: '80%'
                      }}>
                        {msg.msg}
                      </div>
                    </div>
                  )
                }

                // Chat Bubbles (ME vs THEM)
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isOp ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    alignSelf: isOp ? 'flex-end' : 'flex-start',
                    marginTop: '4px'
                  }}>
                    {!isOp && (
                      <div style={{
                        fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--muted)',
                        marginBottom: '4px', paddingLeft: '4px'
                      }}>
                        {msg.sender} <span style={{ opacity: 0.5 }}>{msg.ts}</span>
                      </div>
                    )}
                    
                    <div style={{
                      padding: '10px 14px',
                      background: isOp 
                        ? 'linear-gradient(135deg, #007aff, #0056b3)' 
                        : 'rgba(255,255,255,0.08)',
                      color: '#fff',
                      borderRadius: isOp ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-sans)',
                      wordBreak: 'break-word',
                      lineHeight: '1.4',
                      boxShadow: isOp ? '0 2px 8px rgba(0, 122, 255, 0.25)' : '0 2px 8px rgba(0,0,0,0.2)',
                      border: isOp ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      backdropFilter: isOp ? 'none' : 'blur(10px)'
                    }}>
                      {msg.msg}
                    </div>
                    
                    {isOp && (
                      <div style={{
                        fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--muted)',
                        marginTop: '4px', paddingRight: '4px'
                      }}>
                        {msg.ts} <span style={{ color: '#007aff' }}>✓✓</span>
                      </div>
                    )}
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
                {devices.map(d => (
                  <option key={d.id} value={d.id}>Send to {d.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Transmit message..."
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--divider)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-1)', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', outline: 'none' }}
              />
              <Button variant="primary" type="submit" disabled={!chatTargetId}>Send</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
