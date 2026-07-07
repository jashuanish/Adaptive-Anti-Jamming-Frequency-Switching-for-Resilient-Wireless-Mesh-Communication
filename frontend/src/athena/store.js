import { create } from 'zustand'

let alertId = 0

/**
 * Central command store. The 3D scene and HUD both subscribe here.
 * Raw backend state lives in `raw`; derived tactical telemetry in `telemetry`.
 */
export const useAthena = create((set, get) => ({
  // connection
  connected: false,
  booted: false,

  // raw backend payload (/api/state shape)
  raw: null,

  // derived tactical telemetry
  telemetry: {
    signalQuality: 100,   // 0-100
    threatLevel: 'NOMINAL', // NOMINAL | GUARDED | ELEVATED | HIGH | CRITICAL
    threatScore: 0,         // 0-1
    packetLoss: 0,          // cumulative
    route: [],              // active macro_path
    routeLabel: '—',
    systemStatus: 'STANDBY',
    jammerActive: false,
    progress: 0,            // message transmission 0-1
  },

  // active alerts (cinematic notifications)
  alerts: [],

  // camera / view
  cinematic: true,
  setCinematic: (v) => set({ cinematic: v }),

  setConnected: (connected) => set({ connected }),
  setBooted: (booted) => set({ booted }),

  setRaw: (raw) => set({ raw }),
  setTelemetry: (telemetry) => set({ telemetry }),

  pushAlert: (level, title, detail) => {
    const id = ++alertId
    set((s) => ({ alerts: [...s.alerts, { id, level, title, detail, t: Date.now() }] }))
    // auto-expire
    setTimeout(() => {
      set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) }))
    }, 5200)
  },
  dismissAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
}))
