/**
 * Remotion Three.js layer that renders all 3D characters for video export.
 * Uses @remotion/three's ThreeCanvas for GPU-accelerated rendering.
 */
import { Suspense } from 'react'
import { useFrame } from '@/engine'
import { Canvas } from '@react-three/fiber'
import type { Character3DExportData } from './types'
import { Remotion3DCharacter } from './Remotion3DCharacter'

interface Remotion3DLayerProps {
  characters3D: Character3DExportData[]
  fps: number
  width: number
  height: number
  /** Camera position [x, y, z] — defaults to editor value [0, 1, 5] */
  cameraPosition?: [number, number, number]
  /** Camera field of view in degrees — defaults to editor value 45 */
  cameraFov?: number
  /** Ambient light intensity — defaults to 0.5 */
  ambientIntensity?: number
  /** Key light intensity — defaults to 1.0 */
  keyLightIntensity?: number
}

export function Remotion3DLayer({
  characters3D,
  fps,
  cameraPosition = [0, 1, 5],
  cameraFov = 45,
  ambientIntensity = 0.5,
  keyLightIntensity = 1.0,
}: Remotion3DLayerProps) {
  const frame = useFrame()

  const visibleCharacters = characters3D.filter((c) => c.visible)

  if (visibleCharacters.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        style={{ width: '100%', height: '100%' }}
        gl={{ preserveDrawingBuffer: true }}
      >
        {/* Lighting — key/fill/rim for 3D depth (matches editor camera) */}
        <ambientLight intensity={ambientIntensity} />
        <directionalLight position={[4, 6, 4]} intensity={keyLightIntensity} />
        <directionalLight position={[-3, 4, 2]} intensity={0.4} />
        <directionalLight position={[0, 4, -4]} intensity={0.5} />
        <hemisphereLight args={['#b1e1ff', '#b97a20', 0.25]} />

        {/* Render each 3D character at the current frame */}
        {visibleCharacters.map((char) => (
          <Suspense key={char.id} fallback={null}>
            <Remotion3DCharacter
              character={char}
              currentFrame={frame}
              fps={fps}
            />
          </Suspense>
        ))}
      </Canvas>
    </div>
  )
}
