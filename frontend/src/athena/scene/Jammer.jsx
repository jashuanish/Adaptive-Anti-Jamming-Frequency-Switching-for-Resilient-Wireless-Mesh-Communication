import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import { COLORS } from '../geo'

const RED = COLORS.threat

/** Expanding shockwave rings emitted from the jammer when active. */
function PulseRings({ active, score }) {
  const rings = useRef([])
  const RING_COUNT = 3
  return (
    <group>
      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <Ring key={i} index={i} count={RING_COUNT} active={active} score={score} ref={(r) => (rings.current[i] = r)} />
      ))}
    </group>
  )
}

function Ring({ index, count, active, score }) {
  const ref = useRef()
  const mat = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const period = 2.4
    const phase = ((state.clock.elapsedTime / period) + index / count) % 1
    const r = 0.5 + phase * (4 + score * 6)
    ref.current.scale.setScalar(r)
    if (mat.current) mat.current.opacity = active ? (1 - phase) * 0.5 * (0.4 + score) : 0
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, 0]}>
      <ringGeometry args={[0.9, 1, 64]} />
      <meshBasicMaterial ref={mat} color={RED} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

/** Jittering interference particle cloud, visible only under threat. */
function InterferenceField({ active, score }) {
  const ref = useRef()
  const COUNT = 260
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const seeds = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      const r = Math.cbrt(Math.random()) * 3.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      seeds[i] = Math.random() * 10
    }
    return { positions, seeds }
  }, [])

  const base = useMemo(() => positions.slice(), [positions])

  useFrame((state) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const j = i * 3
      const jitter = active ? 0.12 * (0.4 + score) : 0.02
      arr[j] = base[j] + Math.sin(t * 6 + seeds[i]) * jitter
      arr[j + 1] = base[j + 1] + Math.cos(t * 5 + seeds[i]) * jitter
      arr[j + 2] = base[j + 2] + Math.sin(t * 7 + seeds[i] * 1.3) * jitter
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.material.opacity = active ? 0.35 + score * 0.4 : 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={RED} size={0.07} transparent opacity={0.2} sizeAttenuation toneMapped={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/**
 * The hostile jammer emitter. Position defaults to mesh center, elevated.
 * `score` (0-1) drives threat sphere scale + intensity; `active` toggles the attack.
 */
export function Jammer({ score = 0, active = false, position = [0, 1.4, 1.5] }) {
  const core = useRef()
  const coreMat = useRef()
  const threatSphere = useRef()
  const threatMat = useRef()
  const spikes = useRef()

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (core.current) core.current.rotation.y += delta * 1.4
    if (spikes.current) spikes.current.rotation.y -= delta * 0.8
    if (coreMat.current) {
      coreMat.current.emissiveIntensity = active ? 2.2 + Math.sin(t * 9) * 0.8 : 0.5 + Math.sin(t * 2) * 0.15
    }
    if (threatSphere.current && threatMat.current) {
      const target = active ? 1 + score * 2.4 + Math.sin(t * 3) * 0.15 : 0.4
      threatSphere.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1)
      threatMat.current.opacity = active ? 0.06 + score * 0.14 : 0.03
    }
  })

  return (
    <group position={position}>
      {/* threat sphere — interference field volume (wireframe nested to inherit scale) */}
      <mesh ref={threatSphere}>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial ref={threatMat} color={RED} transparent opacity={0.05} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        <mesh>
          <sphereGeometry args={[3.21, 20, 20]} />
          <meshBasicMaterial color={RED} wireframe transparent opacity={active ? 0.05 + score * 0.07 : 0.02} toneMapped={false} />
        </mesh>
      </mesh>

      <InterferenceField active={active} score={score} />

      <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.5}>
        {/* hostile core */}
        <mesh ref={core}>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial
            ref={coreMat}
            color={RED}
            emissive={RED}
            emissiveIntensity={1}
            metalness={0.6}
            roughness={0.2}
            flatShading
          />
        </mesh>
        {/* antenna spikes */}
        <group ref={spikes}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} rotation={[0, (i * Math.PI) / 2, Math.PI / 2]} position={[Math.cos((i * Math.PI) / 2) * 0.6, 0, Math.sin((i * Math.PI) / 2) * 0.6]}>
              <coneGeometry args={[0.06, 0.7, 6]} />
              <meshBasicMaterial color={RED} toneMapped={false} />
            </mesh>
          ))}
        </group>

        <Html distanceFactor={14} position={[0, 1.4, 0]} style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{ whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff2d55', boxShadow: '0 0 10px #ff2d55' }} className={active ? 'blink' : ''} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#ff6b88', textShadow: '0 0 12px rgba(255,45,85,0.7)' }}>JAMMER</span>
            </div>
            <div style={{ fontSize: 8.5, letterSpacing: '0.18em', color: active ? '#ff2d55' : '#7d93ad', marginLeft: 12 }}>
              {active ? 'HOSTILE · ACTIVE' : 'ESP32 · IDLE'}
            </div>
          </div>
        </Html>
      </Float>

      <PulseRings active={active} score={score} />
    </group>
  )
}
