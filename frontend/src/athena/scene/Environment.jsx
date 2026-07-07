import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid, Stars } from '@react-three/drei'
import * as THREE from 'three'

/** Holographic tactical ground grid + ambient battlefield lighting. */
export function Environment({ threatScore = 0 }) {
  const keyLight = useRef()

  useFrame((state) => {
    if (keyLight.current) {
      // subtle threat-driven red wash on the key light
      const t = state.clock.elapsedTime
      keyLight.current.intensity = 1.6 + Math.sin(t * 2) * 0.1
    }
  })

  return (
    <>
      <color attach="background" args={['#04070d']} />
      <fog attach="fog" args={['#04070d', 18, 46]} />

      <ambientLight intensity={0.35} color="#1d3a5c" />
      <hemisphereLight intensity={0.4} color="#1d9bf0" groundColor="#04070d" />
      <directionalLight ref={keyLight} position={[8, 14, 6]} intensity={1.6} color="#9fd4ff" />
      <pointLight position={[-12, 6, -8]} intensity={0.8} color="#22d3ee" distance={40} />
      {/* threat rim light grows with threat */}
      <pointLight position={[0, 4, 0]} intensity={threatScore * 6} color="#ff2d55" distance={30} />

      {/* Reflective tactical floor grid */}
      <Grid
        position={[0, -2.01, 0]}
        args={[60, 60]}
        cellSize={1.4}
        cellThickness={0.6}
        cellColor="#16314d"
        sectionSize={7}
        sectionThickness={1.2}
        sectionColor="#1d9bf0"
        fadeDistance={42}
        fadeStrength={1.5}
        infiniteGrid
        followCamera={false}
      />

      {/* dark mirror plane under grid for depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.05, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#04070d" metalness={0.9} roughness={0.5} />
      </mesh>

      <Stars radius={90} depth={50} count={2200} factor={3.5} saturation={0} fade speed={0.4} />
    </>
  )
}
