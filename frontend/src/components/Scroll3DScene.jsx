/**
 * Scroll3DScene — drop-in scroll-driven 3D canvas.
 *
 * Usage:
 *   <Scroll3DScene pages={4} />
 *
 * The canvas fills its parent. Wrap in a div with a fixed height
 * or use position:sticky on the parent for a pinned scroll experience.
 */
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  ScrollControls,
  useScroll,
  Environment,
  Float,
  MeshDistortMaterial,
  OrbitControls,
  AdaptiveDpr,
  Stars,
} from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { damp, dampC } from 'maath/easing'
import * as THREE from 'three'

// ── Individual model that reacts to scroll ────────────────────────────────────

function ScrollModel({ section = 0, totalSections = 3 }) {
  const meshRef = useRef()
  const matRef = useRef()
  const scroll = useScroll()

  const colorA = new THREE.Color('#38bdf8')
  const colorB = new THREE.Color('#8b5cf6')
  const colorC = new THREE.Color('#10b981')

  useFrame((state, delta) => {
    if (!meshRef.current || !matRef.current) return

    const sectionSize = 1 / totalSections
    const progress = scroll.range(section * sectionSize, sectionSize)

    // Rotation driven by scroll
    damp(meshRef.current.rotation, 'y', progress * Math.PI * 2, 0.1, delta)
    damp(meshRef.current.rotation, 'x', progress * Math.PI * 0.5, 0.1, delta)

    // Scale pulse on enter
    const targetScale = 0.6 + progress * 0.8
    damp(meshRef.current.scale, 'x', targetScale, 0.12, delta)
    damp(meshRef.current.scale, 'y', targetScale, 0.12, delta)
    damp(meshRef.current.scale, 'z', targetScale, 0.12, delta)

    // Color morph
    const targetColor = progress < 0.5 ? colorA.clone().lerp(colorB, progress * 2) : colorB.clone().lerp(colorC, (progress - 0.5) * 2)
    dampC(matRef.current.color, targetColor, 0.1, delta)

    // Distortion driven by scroll
    matRef.current.distort = 0.2 + progress * 0.5
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.2, 4]} />
        <MeshDistortMaterial
          ref={matRef}
          color="#38bdf8"
          speed={3}
          distort={0.3}
          roughness={0.1}
          metalness={0.8}
          envMapIntensity={1.5}
        />
      </mesh>
    </Float>
  )
}

// ── Camera path driven by scroll ──────────────────────────────────────────────

function ScrollCamera() {
  const scroll = useScroll()

  useFrame((state, delta) => {
    const t = scroll.offset
    damp(state.camera.position, 'x', Math.sin(t * Math.PI * 2) * 2, 0.1, delta)
    damp(state.camera.position, 'y', t * 2 - 1, 0.1, delta)
    damp(state.camera.position, 'z', 5 - t * 1.5, 0.1, delta)
    state.camera.lookAt(0, 0, 0)
  })

  return null
}

// ── Full scene ────────────────────────────────────────────────────────────────

function Scene({ sections }) {
  return (
    <>
      <ScrollCamera />
      <Stars radius={80} depth={60} count={3000} factor={3} fade />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={2} color="#38bdf8" />
      <pointLight position={[-10, -10, -5]} intensity={1} color="#8b5cf6" />

      {Array.from({ length: sections }).map((_, i) => (
        <ScrollModel
          key={i}
          section={i}
          totalSections={sections}
        />
      ))}

      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.8} luminanceSmoothing={0.03} />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.002, 0.002]}
        />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
      </EffectComposer>
    </>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export default function Scroll3DScene({ pages = 4, sections = 3, style = {} }) {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'sticky', top: 0, ...style }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <AdaptiveDpr pixelRatio={[1, 2]} />
        <Environment preset="night" />
        <ScrollControls pages={pages} damping={0.15}>
          <Scene sections={sections} />
        </ScrollControls>
      </Canvas>
    </div>
  )
}
