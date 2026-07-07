/**
 * GSAP + Framer Motion presets for award-winning animations.
 * Import what you need — everything is tree-shaken.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, TextPlugin, CustomEase)

// Signature eases used on Awwwards sites
CustomEase.create('expo.out', '0.16, 1, 0.3, 1')
CustomEase.create('back.soft', '0.34, 1.56, 0.64, 1')

export { gsap, ScrollTrigger }

// ── Framer Motion variants ──────────────────────────────────────────────────

export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

export const stagger = (delay = 0.08) => ({
  visible: { transition: { staggerChildren: delay } },
})

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
}

export const slideLeft = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

// ── GSAP helpers ────────────────────────────────────────────────────────────

/** Animate element(s) in from below on scroll */
export function revealOnScroll(targets, opts = {}) {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 60 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: targets, start: 'top 85%', ...opts.scrollTrigger },
      ...opts,
    }
  )
}

/** Typewriter effect */
export function typewrite(target, text, duration = 1.5) {
  return gsap.to(target, { duration, text: { value: text, delimiter: '' }, ease: 'none' })
}

/** Magnetic button effect — call in onMouseMove */
export function magneticMove(el, e, strength = 0.4) {
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left - rect.width / 2) * strength
  const y = (e.clientY - rect.top - rect.height / 2) * strength
  gsap.to(el, { x, y, duration: 0.4, ease: 'power2.out' })
}

export function magneticReset(el) {
  gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' })
}
