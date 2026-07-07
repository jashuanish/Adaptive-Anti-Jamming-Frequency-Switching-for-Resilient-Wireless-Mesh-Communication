import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'
import { toWorld, COLORS } from '../geo'

function NodeLabel({ title, sub, color, align = 'left' }) {
  return (
    <Html
      center={false}
      distanceFactor={14}
      position={[0, 1.5, 0]}
      style={{ pointerEvents: 'none', userSelect: 'none', transform: `translateX(${align === 'left' ? '0' : '-100%'})` }}
    >
      <div style={{ whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#e8f4ff', textShadow: `0 0 10px ${color}` }}>{title}</span>
        </div>
        {sub && <div style={{ fontSize: 8.5, letterSpacing: '0.18em', color: '#7d93ad', marginLeft: 12 }}>{sub}</div>}
      </div>
    </Html>
  )
}

/**
 * A single tactical node: floating device core, status ring, beacon.
 * kind: 'sender' | 'receiver' | 'relay'
 */
function TacticalNode({ position, kind, active, label, sub }) {
  const core = useRef()
  const ring = useRef()
  const mat = useRef()

  const baseColor = kind === 'sender' ? COLORS.sender : kind === 'receiver' ? COLORS.receiver : COLORS.relay
  const isHub = kind !== 'relay'

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (ring.current) ring.current.rotation.z += delta * (isHub ? 0.6 : 0.3)
    if (mat.current) {
      const pulse = isHub ? 0.7 + Math.sin(t * 2.4) * 0.3 : 0.25 + Math.sin(t * 1.6 + position[0]) * 0.12
      mat.current.emissiveIntensity = active ? 1.6 : pulse
    }
    if (core.current && active) {
      core.current.rotation.y += delta * 1.2
    }
  })

  const size = isHub ? 0.62 : 0.4

  return (
    <group position={position}>
      <Float speed={2.2} rotationIntensity={isHub ? 0.4 : 0.15} floatIntensity={0.6}>
        {/* device core */}
        <mesh ref={core}>
          <icosahedronGeometry args={[size, isHub ? 1 : 0]} />
          <meshStandardMaterial
            ref={mat}
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={1}
            metalness={0.7}
            roughness={0.25}
            flatShading
          />
        </mesh>

        {/* wire shell for hubs */}
        {isHub && (
          <mesh>
            <icosahedronGeometry args={[size * 1.5, 1]} />
            <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.18} />
          </mesh>
        )}

        {/* status ring */}
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.9, 0.02, 8, 48]} />
          <meshBasicMaterial color={baseColor} transparent opacity={active ? 0.9 : 0.4} />
        </mesh>

        {label && <NodeLabel title={label} sub={sub} color={`#${baseColor.getHexString()}`} />}
      </Float>

      {/* ground beacon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, 0]}>
        <ringGeometry args={[size * 1.4, size * 1.55, 48]} />
        <meshBasicMaterial color={baseColor} transparent opacity={active ? 0.6 : 0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* vertical tether to floor */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 2, 6]} />
        <meshBasicMaterial color={baseColor} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

/** Renders every backend node, styling source as Sender, target as Receiver. */
export function NodeField({ raw }) {
  const nodes = raw?.nodes
  const st = raw?.state || {}
  const path = raw?.macro_path || []
  const source = path[0]
  const target = path[path.length - 1]
  const activeHop = [st.current_host, st.target_host]

  const items = useMemo(() => {
    if (!nodes) return []
    return Object.entries(nodes).map(([id, n]) => {
      const p = toWorld(n)
      const kind = id === source ? 'sender' : id === target ? 'receiver' : 'relay'
      const label = id === source ? 'SENDER' : id === target ? 'RECEIVER' : id
      const sub = id === source ? 'ESP32 · TX' : id === target ? 'ESP32 · RX' : 'RELAY'
      const active = activeHop.includes(id) || kind !== 'relay'
      return { id, position: [p.x, p.y, p.z], kind, label, sub, active }
    })
  }, [nodes, source, target, st.current_host, st.target_host])

  return (
    <group>
      {items.map((it) => (
        <TacticalNode key={it.id} {...it} />
      ))}
    </group>
  )
}
