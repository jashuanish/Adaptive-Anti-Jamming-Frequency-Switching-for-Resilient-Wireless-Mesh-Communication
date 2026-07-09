import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const HW_COMPONENTS = [
  {
    name: 'ESP32',
    role: 'MAIN CONTROLLER',
    color: 'var(--p-green)',
    desc: 'Dual-core 240 MHz Xtensa LX6. 520 KB SRAM. WiFi + Bluetooth. Runs the frequency hopping state machine.',
    specs: ['240 MHz · Dual Core', '520 KB SRAM', 'WiFi 802.11 b/g/n', '3.3V Logic'],
    icon: '⬡',
  },
  {
    name: 'NRF24L01+',
    role: 'RF TRANSCEIVER',
    color: 'var(--p-blue)',
    desc: '2.4 GHz ISM band. 125 selectable channels. Automatic ACK and retransmission. The primary communication interface.',
    specs: ['2.4 GHz ISM Band', '125 RF Channels', 'Auto-ACK / ARQ', '2 Mbps data rate'],
    icon: '◎',
  },
  {
    name: 'TFT DISPLAY',
    role: 'PRIMARY HMI',
    color: 'var(--p-amber)',
    desc: 'ST7735 1.8" color TFT. SPI interface. Real-time frequency channel status and hop counter display.',
    specs: ['128 × 160 px', 'ST7735 Driver', 'SPI Interface', '16-bit color'],
    icon: '▣',
  },
  {
    name: 'OLED 128×64',
    role: 'STATUS MONITOR',
    color: 'var(--p-green)',
    desc: 'SSD1306 I2C OLED. Displays node ID, current frequency, and link state in field-readable format.',
    specs: ['128 × 64 px', 'SSD1306 Driver', 'I2C Interface', '3.3V / 5V'],
    icon: '▤',
  },
  {
    name: 'LCD 16×2',
    role: 'MESSAGE OUTPUT',
    color: 'var(--p-text2)',
    desc: 'HD44780-compatible parallel LCD. Shows received payload and Levenshtein-corrected output in real time.',
    specs: ['16 × 2 character', 'HD44780 Compatible', 'Parallel / I2C', '5V Logic'],
    icon: '≡',
  },
]

// Simple pin diagram for ESP32 ↔ NRF24L01
function PinDiagram() {
  const pins = [
    { label: 'CE', esp: 'GPIO 4', color: 'var(--p-green)' },
    { label: 'CSN', esp: 'GPIO 5', color: 'var(--p-green)' },
    { label: 'MOSI', esp: 'GPIO 23', color: 'var(--p-blue)' },
    { label: 'MISO', esp: 'GPIO 19', color: 'var(--p-blue)' },
    { label: 'SCK', esp: 'GPIO 18', color: 'var(--p-amber)' },
    { label: 'IRQ', esp: 'GPIO 2', color: 'var(--p-red)' },
  ]
  return (
    <div style={{ padding: '16px 0' }}>
      <div className="pd-label" style={{ marginBottom: 12 }}>SPI COMMUNICATION PIPELINE · ESP32 ↔ NRF24L01</div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
        {/* ESP32 side */}
        <div style={{
          width: 100,
          background: 'rgba(0,255,157,0.06)',
          border: '1px solid rgba(0,255,157,0.2)',
          padding: 12,
          flexShrink: 0,
        }}>
          <div className="pd-label" style={{ fontSize: 8, marginBottom: 8, color: 'var(--p-green)' }}>ESP32</div>
          {pins.map(p => (
            <div key={p.label} style={{
              fontFamily: 'var(--font-signal)',
              fontSize: 9,
              color: p.color,
              padding: '4px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {p.esp}
            </div>
          ))}
        </div>

        {/* Wires */}
        <div style={{ flex: 1, position: 'relative', margin: '0 4px' }}>
          {pins.map((p, i) => (
            <div key={p.label} style={{
              position: 'absolute',
              left: 0, right: 0,
              top: 32 + i * 21.5,
              height: 1,
              background: `${p.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                fontFamily: 'var(--font-signal)',
                fontSize: 8,
                color: p.color,
                background: 'var(--p-bg)',
                padding: '0 6px',
              }}>
                {p.label}
              </div>
            </div>
          ))}
        </div>

        {/* NRF24 side */}
        <div style={{
          width: 100,
          background: 'rgba(45,127,249,0.06)',
          border: '1px solid rgba(45,127,249,0.2)',
          padding: 12,
          flexShrink: 0,
        }}>
          <div className="pd-label" style={{ fontSize: 8, marginBottom: 8, color: 'var(--p-blue)' }}>NRF24L01+</div>
          {pins.map(p => (
            <div key={p.label} style={{
              fontFamily: 'var(--font-signal)',
              fontSize: 9,
              color: p.color,
              padding: '4px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              {p.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function S08_Hardware() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="pd-section" style={{ padding: '120px 0', background: 'var(--p-bg)' }}>
      <div className="pd-grid-bg" style={{ opacity: 0.6 }} />

      <div className="pd-container" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 56 }}
        >
          <div className="pd-label" style={{ marginBottom: 12 }}>SECTION 08 · HARDWARE PLATFORM</div>
          <div className="pd-divider-accent" style={{ marginBottom: 24 }} />
          <h2 className="pd-headline" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            PHYSICAL<br />
            <span style={{ color: 'var(--p-amber)' }}>IMPLEMENTATION</span>
          </h2>
          <p className="pd-body" style={{ marginTop: 16, maxWidth: 500, fontSize: 14 }}>
            The simulation is validated against real hardware. ESP32 nodes communicate over
            the 2.4 GHz ISM band using NRF24L01+ transceivers — the same frequencies used
            by tactical mesh radios.
          </p>
        </motion.div>

        {/* Hardware grid */}
        <div className="pd-hw-grid" style={{ marginBottom: 48 }}>
          {HW_COMPONENTS.map((hw, i) => (
            <motion.div
              key={hw.name}
              className="pd-hw-card"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Icon */}
              <div style={{
                fontSize: 28,
                color: hw.color,
                marginBottom: 12,
                textShadow: `0 0 12px ${hw.color}50`,
              }}>
                {hw.icon}
              </div>

              <div style={{
                fontFamily: 'var(--font-signal)',
                fontSize: 9,
                letterSpacing: '0.16em',
                color: hw.color,
                marginBottom: 4,
              }}>
                {hw.role}
              </div>

              <div className="pd-subhead" style={{ fontSize: 20, marginBottom: 10, color: 'var(--p-text1)' }}>
                {hw.name}
              </div>

              <p className="pd-body" style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 14 }}>
                {hw.desc}
              </p>

              {/* Specs */}
              <div style={{ borderTop: '1px solid var(--p-divider)', paddingTop: 12 }}>
                {hw.specs.map(s => (
                  <div key={s} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '3px 0',
                    fontFamily: 'var(--font-signal)',
                    fontSize: 9,
                    color: 'var(--p-text2)',
                  }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: hw.color, flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pin diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{
            background: 'var(--p-surface)',
            border: '1px solid var(--p-divider)',
            padding: 24,
          }}
        >
          <PinDiagram />
        </motion.div>
      </div>
    </section>
  )
}
