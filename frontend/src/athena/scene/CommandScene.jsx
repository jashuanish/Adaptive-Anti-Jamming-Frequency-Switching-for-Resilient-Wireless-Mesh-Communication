import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, AdaptiveDpr, Environment as DreiEnv } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { Environment } from './Environment'
import { NodeField } from './Nodes'
import { Links } from './Links'
import { Jammer } from './Jammer'
import { useAthena } from '../store'

function SceneContents() {
  const raw = useAthena((s) => s.raw)
  const tel = useAthena((s) => s.telemetry)

  return (
    <>
      <Environment threatScore={tel.threatScore} />
      <DreiEnv preset="night" />

      {raw && <NodeField raw={raw} />}
      {raw && <Links raw={raw} />}
      <Jammer score={tel.threatScore} active={tel.jammerActive} />
    </>
  )
}

export default function CommandScene() {
  const cinematic = useAthena((s) => s.cinematic)
  const threat = useAthena((s) => s.telemetry.threatScore)

  return (
    <Canvas
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.1
      }}
    >
      <PerspectiveCamera makeDefault position={[14, 11, 16]} fov={42} />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        minDistance={8}
        maxDistance={40}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate={cinematic}
        autoRotateSpeed={0.45}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.06}
      />

      <AdaptiveDpr pixelRatio={[1, 2]} />

      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>

      <EffectComposer multisampling={4}>
        <Bloom intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.18} mipmapBlur />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0008 + threat * 0.003, 0.0008 + threat * 0.003]}
        />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.18} />
        <Vignette eskil={false} offset={0.2} darkness={0.92} />
      </EffectComposer>
    </Canvas>
  )
}
