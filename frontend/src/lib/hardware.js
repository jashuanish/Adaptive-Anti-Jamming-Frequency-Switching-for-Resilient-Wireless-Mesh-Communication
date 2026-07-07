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
 * useSerialStream() → { lines, connect, connected }
 * Manages a Web Serial connection with React state.
 */
export function useSerialStream(baudRate = 9600) {
  const [lines, setLines] = useState([])
  const [connected, setConnected] = useState(false)
  const portRef = useRef(null)
  const abortRef = useRef(null)

  async function connect() {
    try {
      const port = await requestSerialPort(baudRate)
      portRef.current = port
      abortRef.current = new AbortController()
      setConnected(true)
      await readSerialLines(
        port,
        (line) => setLines((prev) => [...prev.slice(-199), line]),
        abortRef.current.signal
      )
    } catch (e) {
      setConnected(false)
    }
  }

  function disconnect() {
    abortRef.current?.abort()
    portRef.current?.close()
    setConnected(false)
  }

  return { lines, connect, disconnect, connected }
}
