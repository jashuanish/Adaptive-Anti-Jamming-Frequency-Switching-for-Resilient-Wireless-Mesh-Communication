import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './pitch.css'
import PitchDeck from './PitchDeck'

const SECTION_COUNT = 12

export default function PitchGate({ onLaunch }) {
  const [launching, setLaunching] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const [activeSection, setActiveSection] = useState(0)
  const deckRef = useRef(null)

  // Scroll progress tracking
  useEffect(() => {
    const el = deckRef.current
    if (!el) return
    const onScroll = () => {
      const pct = el.scrollTop / (el.scrollHeight - el.clientHeight)
      setScrollPct(isNaN(pct) ? 0 : pct)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Section intersection tracking
  const onSectionVisible = useCallback((idx) => setActiveSection(idx), [])

  const handleLaunch = useCallback(() => {
    setLaunching(true)
    // After exit animation, tell parent to show app
    setTimeout(() => onLaunch(), 1000)
  }, [onLaunch])

  const scrollToSection = useCallback((idx) => {
    const el = deckRef.current
    if (!el) return
    const section = el.querySelector(`[data-section="${idx}"]`)
    if (section) section.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <AnimatePresence>
      {!launching && (
        <motion.div
          key="pitch-gate"
          className="pitch-deck"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'brightness(2)',
            transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] },
          }}
          ref={deckRef}
          id="pitch-scroll-container"
        >
          {/* Scroll progress bar */}
          <div
            className="pd-scroll-progress"
            style={{ width: `${scrollPct * 100}%` }}
          />

          {/* Fixed top bar */}
          <TopBar onLaunch={handleLaunch} />

          {/* Section nav dots */}
          <NavDots
            count={SECTION_COUNT}
            active={activeSection}
            onNav={scrollToSection}
          />

          {/* The full deck */}
          <PitchDeck
            onLaunch={handleLaunch}
            onSectionVisible={onSectionVisible}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TopBar({ onLaunch }) {
  return (
    <div className="pd-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Logo mark */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="1" y="1" width="22" height="22" rx="3" stroke="var(--p-green)" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="3" fill="var(--p-green)" />
          <line x1="12" y1="5" x2="12" y2="9" stroke="var(--p-green)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="15" x2="12" y2="19" stroke="var(--p-green)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="5" y1="12" x2="9" y2="12" stroke="var(--p-green)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15" y1="12" x2="19" y2="12" stroke="var(--p-green)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{
          fontFamily: 'var(--font-signal)',
          fontSize: 11,
          letterSpacing: '0.18em',
          color: 'var(--p-text2)',
        }}>
          RF MESH CONTROL · PROJECT DAA
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* RF bars decorative */}
        {[0.4, 0.7, 1.0, 0.6, 0.9, 0.5, 0.8].map((h, i) => (
          <div
            key={i}
            className="pd-rf-bar"
            style={{
              height: `${h * 20}px`,
              animationDelay: `${i * 0.11}s`,
              animationDuration: `${0.6 + i * 0.07}s`,
            }}
          />
        ))}
        <div style={{ width: 16 }} />
        <button className="pd-btn-primary" onClick={onLaunch} style={{
          padding: '7px 18px',
          fontSize: 11,
          letterSpacing: '0.14em',
        }}>
          ENTER PLATFORM ▶
        </button>
      </div>
    </div>
  )
}

function NavDots({ count, active, onNav }) {
  return (
    <div className="pd-nav-dots">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          className={`pd-nav-dot ${i === active ? 'active' : ''}`}
          onClick={() => onNav(i)}
          title={`Section ${i + 1}`}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <div className={`pd-nav-dot ${i === active ? 'active' : ''}`} />
        </button>
      ))}
    </div>
  )
}
