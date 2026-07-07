/**
 * React Three Fiber + Drei + Postprocessing re-exports.
 * Central place to pull 3D primitives from.
 */
export { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
export {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Float,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  Sparkles,
  Stars,
  Trail,
  Line,
  Text,
  Text3D,
  Html,
  useGLTF,
  useTexture,
  useProgress,
  Loader,
  Preload,
  AdaptiveDpr,
  PerformanceMonitor,
} from '@react-three/drei'
export {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
  DepthOfField,
  Glitch,
  Scanline,
} from '@react-three/postprocessing'
export { BlendFunction } from 'postprocessing'

// Convenience: default post-processing stack for dark sci-fi UIs
export function DefaultFX({ bloom = true, aberration = false, vignette = true } = {}) {
  const { EffectComposer, Bloom: B, ChromaticAberration: CA, Vignette: V } = {
    EffectComposer,
    Bloom,
    ChromaticAberration,
    Vignette,
  }
  return (
    <EffectComposer>
      {bloom && <B intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.025} />}
      {aberration && <CA offset={[0.002, 0.002]} />}
      {vignette && <V eskil={false} offset={0.15} darkness={0.8} />}
    </EffectComposer>
  )
}
