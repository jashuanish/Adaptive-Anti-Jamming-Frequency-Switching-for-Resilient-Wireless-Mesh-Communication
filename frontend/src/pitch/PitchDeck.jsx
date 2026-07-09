import { useEffect, useRef } from 'react'
import S01_Hero from './sections/S01_Hero'
import S02_Problem from './sections/S02_Problem'
import S03_WhyFail from './sections/S03_WhyFail'
import S04_Architecture from './sections/S04_Architecture'
import S05_HowItWorks from './sections/S05_HowItWorks'
import S06_Demo from './sections/S06_Demo'
import S07_Algorithms from './sections/S07_Algorithms'
import S08_Hardware from './sections/S08_Hardware'
import S09_SoftwareArch from './sections/S09_SoftwareArch'
import S10_Research from './sections/S10_Research'
import S11_Preview from './sections/S11_Preview'
import S12_Launch from './sections/S12_Launch'

const SECTIONS = [
  S01_Hero,
  S02_Problem,
  S03_WhyFail,
  S04_Architecture,
  S05_HowItWorks,
  S06_Demo,
  S07_Algorithms,
  S08_Hardware,
  S09_SoftwareArch,
  S10_Research,
  S11_Preview,
  S12_Launch,
]

export default function PitchDeck({ onLaunch, onSectionVisible }) {
  const containerRef = useRef(null)

  // IntersectionObserver: tell gate which section is active
  useEffect(() => {
    const sections = containerRef.current?.querySelectorAll('[data-section]')
    if (!sections) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            onSectionVisible(parseInt(e.target.dataset.section, 10))
          }
        })
      },
      { threshold: 0.4 }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [onSectionVisible])

  return (
    <div ref={containerRef} style={{ paddingTop: 44 }}>
      {SECTIONS.map((Section, i) => (
        <div key={i} data-section={i}>
          <Section onLaunch={onLaunch} />
        </div>
      ))}
    </div>
  )
}
