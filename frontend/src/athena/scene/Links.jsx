import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { toWorld, pathPoints, samplePolyline, COLORS } from '../geo'

const edgeKey = (a, b) => `${a < b ? a : b}-${a < b ? b : a}`

function isEdgeJammed(jammed_freqs, a, b) {
  const e = jammed_freqs?.[edgeKey(a, b)]
  if (!e) return false
  return Object.values(e).some(Boolean)
}

/** Static mesh wiring — dim links, jammed ones flicker red. */
function MeshLinks({ raw }) {
  const nodes = raw?.nodes
  const edges = raw?.edges || []
  const jammed = raw?.jammed_freqs
  const group = useRef()

  const lines = useMemo(() => {
    if (!nodes) return []
    return edges.map((e) => {
      const a = toWorld(nodes[e.source], 0)
      const b = toWorld(nodes[e.target], 0)
      return { id: `${e.source}-${e.target}`, source: e.source, target: e.target, points: [a, b] }
    })
  }, [nodes, edges])

  useFrame((state) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    group.current.children.forEach((line, i) => {
      const meta = lines[i]
      if (!meta) return
      const jam = isEdgeJammed(jammed, meta.source, meta.target)
      const mat = line.material
      if (jam) {
        mat.color.copy(COLORS.threat)
        mat.opacity = 0.35 + Math.abs(Math.sin(t * 12 + i)) * 0.5 // violent flicker
      } else {
        mat.color.copy(COLORS.relay)
        mat.opacity = 0.22
      }
    })
  })

  return (
    <group ref={group}>
      {lines.map((l) => (
        <Line key={l.id} points={l.points} color="#2b3f57" lineWidth={1} transparent opacity={0.22} />
      ))}
    </group>
  )
}

/** Bright active A* route + flowing packet particles. */
function ActiveRoute({ raw }) {
  const nodes = raw?.nodes
  const path = raw?.macro_path || []
  const st = raw?.state || {}
  const running = raw?.running
  const inst = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const points = useMemo(() => pathPoints(path, nodes, 0.05), [path, nodes])
  const COUNT = 16

  useFrame((state, delta) => {
    if (!inst.current || points.length < 2) return
    const speed = running ? 0.22 : 0.08
    const t0 = (state.clock.elapsedTime * speed) % 1
    const fail = st.hop_success === false
    for (let i = 0; i < COUNT; i++) {
      const t = (t0 + i / COUNT) % 1
      samplePolyline(points, t, tmp)
      dummy.position.copy(tmp)
      const head = i === 0
      const s = head ? 0.16 : 0.075 + (1 - i / COUNT) * 0.05
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      inst.current.setMatrixAt(i, dummy.matrix)
    }
    inst.current.instanceMatrix.needsUpdate = true
    inst.current.material.color.copy(fail ? COLORS.threat : COLORS.cyan)
    inst.current.material.opacity = running ? 1 : 0.6
  })

  if (points.length < 2) return null

  return (
    <group>
      {/* glowing route spine */}
      <Line points={points} color="#22d3ee" lineWidth={2.4} transparent opacity={0.85} />
      <Line points={points} color="#1d9bf0" lineWidth={6} transparent opacity={0.12} />
      {/* flowing packets */}
      <instancedMesh ref={inst} args={[null, null, COUNT]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={1} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

export function Links({ raw }) {
  return (
    <>
      <MeshLinks raw={raw} />
      <ActiveRoute raw={raw} />
    </>
  )
}
