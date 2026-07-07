import { useEffect, useRef } from 'react'
import { useAthena } from './store'

const API = 'http://localhost:5000/api'

const THREAT_TIERS = ['NOMINAL', 'GUARDED', 'ELEVATED', 'HIGH', 'CRITICAL']

/** Count jammed (edge,freq) pairs and total to get a 0-1 saturation. */
function jamSaturation(jammed_freqs) {
  if (!jammed_freqs) return 0
  let jam = 0, total = 0
  for (const edge of Object.values(jammed_freqs)) {
    for (const v of Object.values(edge)) { total++; if (v) jam++ }
  }
  return total ? jam / total : 0
}

function deriveTelemetry(raw, prevQuality) {
  const st = raw.state || {}
  const sat = jamSaturation(raw.jammed_freqs)
  const dyn = !!raw.dynamic_mode

  // Signal quality: degrade with jamming saturation + recent failed hop, smoothed
  const hopPenalty = st.hop_success === false ? 18 : 0
  const target = Math.max(4, 100 - sat * 90 - hopPenalty)
  const signalQuality = prevQuality == null ? target : prevQuality + (target - prevQuality) * 0.25

  // Threat score combines dynamic mode + saturation
  const threatScore = Math.min(1, (dyn ? 0.35 : 0) + sat * 0.9)
  const tier = THREAT_TIERS[Math.min(4, Math.floor(threatScore * 5))]

  const route = raw.macro_path || []
  const progress = raw.full_message?.length
    ? (st.message_idx || 0) / raw.full_message.length
    : 0

  return {
    signalQuality: Math.round(signalQuality * 10) / 10,
    threatLevel: tier,
    threatScore,
    packetLoss: st.packet_loss || 0,
    route,
    routeLabel: route.length ? route.join(' → ') : '—',
    systemStatus: raw.running ? 'TRANSMITTING' : (progress >= 1 ? 'COMPLETE' : 'STANDBY'),
    jammerActive: dyn || sat > 0,
    progress,
  }
}

/**
 * Polls the Flask backend, drives the simulation forward when running,
 * derives tactical telemetry, and fires cinematic alerts on transitions.
 *
 * Falls back gracefully: if the backend is unreachable it flags disconnected
 * and keeps the last scene alive.
 */
export function useTelemetry() {
  const { setRaw, setTelemetry, setConnected, pushAlert } = useAthena.getState()
  const prev = useRef({ quality: null, route: '', jammer: false, tier: 'NOMINAL', degraded: false, status: 'STANDBY' })
  const loop = useRef(null)

  async function fetchState(drive) {
    try {
      const res = await fetch(drive ? `${API}/step` : `${API}/state`, {
        method: drive ? 'POST' : 'GET',
      })
      const raw = await res.json()
      setConnected(true)
      ingest(raw)
      return raw
    } catch {
      setConnected(false)
      return null
    }
  }

  function ingest(raw) {
    const tel = deriveTelemetry(raw, prev.current.quality)
    prev.current.quality = tel.signalQuality
    setRaw(raw)
    setTelemetry(tel)

    // ---- transition-based cinematic alerts ----
    const routeKey = tel.route.join('>')
    if (prev.current.route && routeKey !== prev.current.route) {
      pushAlert('warning', 'ROUTE OPTIMIZATION INITIATED', 'A* recomputing tactical path')
      setTimeout(() => {
        useAthena.getState().pushAlert('nominal', 'COMMUNICATION RESTORED', `New route ${tel.routeLabel}`)
      }, 1800)
    }
    prev.current.route = routeKey

    if (tel.jammerActive && !prev.current.jammer) {
      pushAlert('threat', 'THREAT DETECTED', 'Hostile RF interference on mesh')
      setTimeout(() => useAthena.getState().pushAlert('threat', 'JAMMING ACTIVE', 'Adaptive frequency evasion engaged'), 900)
    }
    if (!tel.jammerActive && prev.current.jammer) {
      pushAlert('nominal', 'JAMMER NEUTRALIZED', 'RF spectrum clear')
    }
    prev.current.jammer = tel.jammerActive

    const degraded = tel.signalQuality < 45
    if (degraded && !prev.current.degraded) {
      pushAlert('warning', 'SIGNAL DEGRADED', `Link quality ${tel.signalQuality}%`)
    }
    prev.current.degraded = degraded

    if (tel.systemStatus === 'COMPLETE' && prev.current.status !== 'COMPLETE') {
      pushAlert('nominal', 'TRANSMISSION COMPLETE', 'Payload delivered to receiver')
    }
    prev.current.status = tel.systemStatus
  }

  // mount: initial fetch + adaptive polling
  useEffect(() => {
    let mounted = true
    fetchState(false)

    loop.current = setInterval(async () => {
      if (!mounted) return
      const running = useAthena.getState().raw?.running
      await fetchState(!!running) // when running, /step advances the sim
    }, 850)

    return () => { mounted = false; clearInterval(loop.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ---- command actions (exposed for the control deck) ----
export const commands = {
  async start() { try { await fetch(`${API}/step`, { method: 'POST' }) } catch {} },
  async reset() { try { await fetch(`${API}/reset`, { method: 'POST' }) } catch {} },
  async setRoute(source, target) {
    try {
      await fetch(`${API}/set_route`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, target }),
      })
    } catch {}
  },
  async toggleDynamicJammer(enabled) {
    try {
      await fetch(`${API}/toggle_dynamic_jammer`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
    } catch {}
  },
}
