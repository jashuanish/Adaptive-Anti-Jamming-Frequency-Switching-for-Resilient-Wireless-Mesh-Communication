import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Animated Canvas RF Spectrum
function RFCanvas() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    // Frequency bands
    const bands = Array.from({ length: 80 }, (_, i) => ({
      x: i,
      freq: 0.5 + Math.random() * 2.5,
      amp: 0.2 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      color: i % 20 === 0 ? '#FF4D4F' : i % 7 === 0 ? '#FFB020' : '#00FF9D',
    }))

    // Radar sweep angle
    let sweepAngle = 0

    function draw() {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      timeRef.current += 0.016
      sweepAngle = (sweepAngle + 0.008) % (Math.PI * 2)

      ctx.clearRect(0, 0, W, H)

      // Very subtle grid
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // RF spectrum bars at bottom portion
      const specH = H * 0.35
      const specY = H * 0.68
      const barW = W / bands.length - 1

      bands.forEach((band, i) => {
        const t = timeRef.current
        const h = Math.abs(
          Math.sin(t * band.freq + band.phase) * band.amp +
          Math.sin(t * band.freq * 0.5 + band.phase * 1.3) * band.amp * 0.4
        ) * specH

        // Bar
        const alpha = 0.5 + Math.abs(Math.sin(t * 0.8 + i * 0.1)) * 0.3
        ctx.fillStyle = band.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(')

        // Simple hex to rgba
        const hex = band.color
        let r = 0, g = 0, b = 0
        if (hex === '#00FF9D') { r = 0; g = 255; b = 157 }
        else if (hex === '#FFB020') { r = 255; g = 176; b = 32 }
        else { r = 255; g = 77; b = 79 }

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.7})`
        ctx.fillRect(i * (barW + 1), specY + specH - h, barW, h)

        // Glow cap
        ctx.fillStyle = `rgba(${r},${g},${b},0.9)`
        ctx.fillRect(i * (barW + 1), specY + specH - h - 2, barW, 2)
      })

      // Horizontal axis line
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, specY + specH)
      ctx.lineTo(W, specY + specH)
      ctx.stroke()

      // Signal wave overlays
      const waves = [
        { color: [0, 255, 157], amp: H * 0.04, freq: 0.012, speed: 0.8, yOff: H * 0.35 },
        { color: [45, 127, 249], amp: H * 0.025, freq: 0.018, speed: 1.2, yOff: H * 0.45 },
        { color: [255, 176, 32], amp: H * 0.015, freq: 0.025, speed: 0.6, yOff: H * 0.55 },
      ]

      waves.forEach(wave => {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(${wave.color.join(',')}, 0.35)`
        ctx.lineWidth = 1.5
        for (let x = 0; x < W; x += 2) {
          const y = wave.yOff + Math.sin(x * wave.freq + timeRef.current * wave.speed) * wave.amp
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      // Radar sweep from center-right
      const cx = W * 0.85, cy = H * 0.3
      const r2 = Math.min(W, H) * 0.15
      // Concentric circles
      for (let rr = r2 * 0.33; rr <= r2; rr += r2 * 0.33) {
        ctx.beginPath()
        ctx.arc(cx, cy, rr, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 255, 157, 0.08)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      // Sweep gradient
      const grad = ctx.createConicalGradient
        ? null
        : null // fallback to sector
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(sweepAngle)
      const sweepGrad = ctx.createLinearGradient(0, 0, r2, 0)
      sweepGrad.addColorStop(0, 'rgba(0, 255, 157, 0.0)')
      sweepGrad.addColorStop(0.7, 'rgba(0, 255, 157, 0.15)')
      sweepGrad.addColorStop(1, 'rgba(0, 255, 157, 0.35)')
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, r2, -0.35, 0)
      ctx.closePath()
      ctx.fillStyle = sweepGrad
      ctx.fill()
      // Sweep line
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(r2, 0)
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.7)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      // Radar blips
      const blips = [
        { angle: 0.8, dist: 0.55 },
        { angle: 2.1, dist: 0.7 },
        { angle: 4.5, dist: 0.4 },
      ]
      blips.forEach(bl => {
        const bx = cx + Math.cos(bl.angle) * r2 * bl.dist
        const by = cy + Math.sin(bl.angle) * r2 * bl.dist
        const fadeSince = ((sweepAngle - bl.angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)
        const alpha = Math.max(0, 0.8 - fadeSince * 1.2)
        ctx.beginPath()
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 255, 157, ${alpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(bx, by, 5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 255, 157, ${alpha * 0.25})`
        ctx.fill()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.85,
      }}
    />
  )
}

// Animated type-on text
function TypeOn({ text, delay = 0 }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    let i = 0
    const timer = setTimeout(() => {
      const id = setInterval(() => {
        setDisplayed(text.slice(0, ++i))
        if (i >= text.length) clearInterval(id)
      }, 30)
      return () => clearInterval(id)
    }, delay)
    return () => clearTimeout(timer)
  }, [text, delay])
  return (
    <span>
      {displayed}
      <span style={{ animation: 'pd-blink 1.1s step-end infinite', color: 'var(--p-green)' }}>_</span>
    </span>
  )
}

export default function S01_Hero({ onLaunch }) {
  return (
    <section className="pd-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      {/* RF Canvas background */}
      <div className="pd-hero-canvas">
        <RFCanvas />
      </div>

      {/* Scanline overlay */}
      <div className="pd-scanline" style={{ opacity: 0.4 }} />

      {/* Content */}
      <div className="pd-container" style={{ position: 'relative', zIndex: 2, paddingTop: 80, paddingBottom: 100 }}>
        <div style={{ maxWidth: 800 }}>
          {/* Classification badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: 28 }}
          >
            <span className="pd-badge">PROJECT DAA · RVCE · 2025</span>
          </motion.div>

          {/* Mono label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="pd-label"
            style={{ marginBottom: 20 }}
          >
            ELECTRONIC COUNTER-COUNTERMEASURES · ECCM-7B
          </motion.div>

          {/* Main headline */}
          <motion.h1
            className="pd-headline"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontSize: 'clamp(52px, 7vw, 96px)', marginBottom: 24, lineHeight: 0.9 }}
          >
            ADAPTIVE<br />
            <span style={{ color: 'var(--p-green)', textShadow: '0 0 40px rgba(0,255,157,0.3)' }}>
              ANTI-JAMMING
            </span><br />
            FREQUENCY<br />
            SWITCHING
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="pd-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            style={{ fontSize: 15, maxWidth: 560, marginBottom: 48, lineHeight: 1.7 }}
          >
            Keeping military communication alive in contested electromagnetic environments
            through blind trial-and-error frequency hopping and A* mesh routing.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
          >
            <button className="pd-btn-primary" onClick={onLaunch} id="hero-enter-btn">
              ENTER COMMAND PLATFORM
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <a href="#explore" className="pd-btn-ghost" onClick={e => {
              e.preventDefault()
              document.querySelector('[data-section="1"]')?.scrollIntoView({ behavior: 'smooth' })
            }}>
              EXPLORE MISSION ↓
            </a>
          </motion.div>

          {/* Bottom metrics strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            style={{
              display: 'flex',
              gap: 32,
              marginTop: 64,
              paddingTop: 24,
              borderTop: '1px solid rgba(0,255,157,0.1)',
            }}
          >
            {[
              { label: 'FREQUENCY BANDS', val: '5', unit: 'CH' },
              { label: 'MESH NODES', val: '9', unit: 'HOST' },
              { label: 'JAM DETECTION', val: '<2s', unit: 'LATENCY' },
              { label: 'SUCCESS RATE', val: '100', unit: '%' },
            ].map(m => (
              <div key={m.label}>
                <div className="pd-label" style={{ marginBottom: 4 }}>{m.label}</div>
                <div style={{
                  fontFamily: 'var(--font-military)',
                  fontWeight: 800,
                  fontSize: 26,
                  color: 'var(--p-text1)',
                }}>
                  {m.val}
                  <span style={{ fontSize: 12, color: 'var(--p-text2)', marginLeft: 4 }}>{m.unit}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 120,
        background: 'linear-gradient(transparent, var(--p-bg))',
        pointerEvents: 'none',
      }} />
    </section>
  )
}
