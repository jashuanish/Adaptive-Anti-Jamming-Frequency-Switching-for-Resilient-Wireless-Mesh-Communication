/**
 * Real-time hardware integration utilities.
 *
 * Three paths:
 *  1. Socket.IO  — backend (Python/Flask) <-> browser, bidirectional
 *  2. Web Serial — direct browser <-> USB/Arduino (Chrome 89+, no server needed)
 *  3. MQTT       — IoT sensors via broker
 */
import { io } from 'socket.io-client'
import mqtt from 'mqtt'

// ── 1. Socket.IO ─────────────────────────────────────────────────────────────

let socket = null

export function connectSocket(url = '/') {
  if (socket?.connected) return socket
  socket = io(url, { transports: ['websocket'] })
  return socket
}

export function getSocket() {
  return socket
}

// ── 2. Web Serial API (Arduino, ESP32, etc.) ─────────────────────────────────

export async function requestSerialPort(baudRate = 9600) {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial API not supported. Use Chrome/Edge 89+.')
  }
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate })
  return port
}

/** Stream lines from a serial port. Calls onLine(string) for each newline. */
export async function readSerialLines(port, onLine, signal) {
  const decoder = new TextDecoderStream()
  port.readable.pipeTo(decoder.writable, { signal }).catch(() => {})
  const reader = decoder.readable.getReader()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += value
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) onLine(line.trim())
    }
  } finally {
    reader.releaseLock()
  }
}

/** Write a string command to a serial port */
export async function writeSerial(port, command) {
  const encoder = new TextEncoderStream()
  const writer = encoder.writable.getWriter()
  encoder.readable.pipeTo(port.writable)
  await writer.write(command + '\n')
  writer.releaseLock()
}

// ── 3. MQTT ──────────────────────────────────────────────────────────────────

export function connectMQTT(brokerUrl = 'ws://localhost:9001', options = {}) {
  const client = mqtt.connect(brokerUrl, options)
  return client
}

// ── React hook: useHardwareSocket ─────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'

/**
 * useHardwareSocket(event) → { data, socket }
 * Subscribes to a Socket.IO event and returns the latest value reactively.
 */
export function useHardwareSocket(event, serverUrl = '/') {
  const [data, setData] = useState(null)
  const socketRef = useRef(null)

  useEffect(() => {
    const s = connectSocket(serverUrl)
    socketRef.current = s
    s.on(event, setData)
    return () => s.off(event, setData)
  }, [event, serverUrl])

  return { data, socket: socketRef.current }
}

/**
 * useMultiSerialStream() → { devices, connect, disconnect, sendCommand, updateDeviceRole }
 * Manages multiple Web Serial connections with React state.
 */
export function useMultiSerialStream(baudRate = 115200, onLineReceived) {
  const [devices, setDevices] = useState([])
  const nextId = useRef(1)

  async function connect() {
    try {
      const port = await requestSerialPort(baudRate)
      
      // Hardware Reset for ESP32 (Pulse EN pin via DTR/RTS)
      try {
        await port.setSignals({ dataTerminalReady: false, requestToSend: true })
        await new Promise(r => setTimeout(r, 100))
        await port.setSignals({ dataTerminalReady: false, requestToSend: false })
        await new Promise(r => setTimeout(r, 1000)) // Wait for bootloader to finish
      } catch (err) {
        console.warn('Could not reset ESP32 (DTR/RTS not supported by adapter?)', err)
      }

      const id = `dev_${nextId.current++}`
      
      const abortController = new AbortController()
      
      const encoder = new TextEncoderStream()
      const writer = encoder.writable.getWriter()
      encoder.readable.pipeTo(port.writable).catch(() => {})

      setDevices(prev => [...prev, {
        id,
        port,
        writer,
        abortController,
        name: `ESP32 Node ${id.split('_')[1]}`,
        status: 'CONNECTED',
        role: 'unassigned' // Will be set by UI
      }])

      // Start reading asynchronously
      readSerialLines(
        port,
        (line) => {
          if (onLineReceived) onLineReceived(id, line)
        },
        abortController.signal
      ).catch(e => {
        console.warn(`Device ${id} disconnected`, e)
        disconnect(id)
      })

      return id
    } catch (e) {
      console.error('Serial connection failed:', e)
      return null
    }
  }

  function disconnect(id) {
    setDevices(prev => {
      const dev = prev.find(d => d.id === id)
      if (dev) {
        dev.abortController?.abort()
        dev.writer?.releaseLock()
        dev.port?.close().catch(() => {})
      }
      return prev.filter(d => d.id !== id)
    })
  }

  async function sendCommand(id, command) {
    setDevices(prev => {
      const dev = prev.find(d => d.id === id)
      if (dev && dev.writer) {
        dev.writer.write(command + '\n').catch(e => console.error(e))
      }
      return prev
    })
  }

  function updateDeviceRole(id, role) {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, role } : d))
  }

  return { devices, connect, disconnect, sendCommand, updateDeviceRole }
}
