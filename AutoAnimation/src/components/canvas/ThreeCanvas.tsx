/**
 * React Three Fiber canvas wrapper for rendering 3D characters.
 * Rendered as a transparent WebGL overlay in VideoCanvas at z-index 7.5.
 *
 * Camera is FIXED front-facing (no orbit) since output is for 2D screens.
 * Characters can be moved/rotated/scaled via UnifiedGizmo3D (octant gizmo).
 */
import { Suspense, useMemo, useCallback, useRef, useState, useEffect, memo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { useEditorStore, useTimelineStore } from '@/stores'
import { Character3DRenderer } from './Character3DRenderer'

interface ThreeCanvasProps {
  canvasWidth: number
  canvasHeight: number
  /** Parent DOM element used as the event source so the WebGL overlay doesn't block clicks to layers below. */
  eventSource?: React.RefObject<HTMLElement | null>
}

export const ThreeCanvas = memo(function ThreeCanvas({ canvasWidth, canvasHeight, eventSource }: ThreeCanvasProps) {
  const characters = use3DCharacterStore((s) => s.characters)
  const activeCharacterId = use3DCharacterStore((s) => s.activeCharacterId)
  const selectCharacter = use3DCharacterStore((s) => s.select3DCharacter)
  const updateCharacter = use3DCharacterStore((s) => s.update3DCharacter)
  const savedCharacters = useSaved3DCharactersStore((s) => s.characters)
  const blobUrls = useSaved3DCharactersStore((s) => s.blobUrls)
  const animations = use3DAnimationStore((s) => s.animations)
  const animBlobUrls = use3DAnimationStore((s) => s.blobUrls)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  // Subscribe to currentFrame/totalFrames without causing re-renders.
  // We use a ref to track values and a low-frequency state update to
  // re-compute visible characters only when the visibility set changes.
  const frameRef = useRef({
    currentFrame: useTimelineStore.getState().currentFrame,
    totalFrames: useTimelineStore.getState().totalFrames,
  })
  const [visibleIds, setVisibleIds] = useState<string>('')

  useEffect(() => {
    const computeVisible = () => {
      const { currentFrame, totalFrames } = frameRef.current
      const ids = characters
        .filter((c) => {
          if (!c.visible) return false
          const sf = c.startFrame ?? 0
          const ef = c.endFrame ?? totalFrames
          return currentFrame >= sf && currentFrame < ef
        })
        .map((c) => c.id)
        .join(',')
      return ids
    }

    // Set initial
    setVisibleIds(computeVisible())

    const unsub = useTimelineStore.subscribe((state) => {
      frameRef.current = { currentFrame: state.currentFrame, totalFrames: state.totalFrames }
      const newIds = computeVisible()
      setVisibleIds((prev) => (prev !== newIds ? newIds : prev))
    })
    return unsub
  }, [characters])

  const visibleCharacters = useMemo(() => {
    const idSet = new Set(visibleIds.split(',').filter(Boolean))
    return characters.filter((c) => idSet.has(c.id))
  }, [characters, visibleIds])

  // Deselect when clicking empty space
  const handlePointerMissed = useCallback(() => {
    selectCharacter(null)
  }, [selectCharacter])

  // Don't render the WebGL canvas at all if there are no 3D characters
  if (visibleCharacters.length === 0) return null

  // Calculate aspect ratio for camera
  const aspect = canvasWidth / canvasHeight || 16 / 9

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <Canvas
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        eventSource={eventSource?.current ? (eventSource as React.RefObject<HTMLElement>) : undefined}
        eventPrefix="offset"
        // Use offsetSize so ResizeObserver reads the element's layout dimensions
        // (offsetWidth/offsetHeight) instead of getBoundingClientRect(). This is
        // required because a parent has CSS transform: scale() which makes
        // getBoundingClientRect() return the smaller visual size, while
        // offsetWidth/offsetHeight return the correct logical layout size.
        resize={{ offsetSize: true }}
        camera={{
          position: [0, 1, 5],
          fov: 45,
          near: 0.01,
          far: 1000,
          aspect,
        }}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
        }}
        // Transparent background so 2D layers show through
        onCreated={(state) => {
          state.gl.setClearColor(0x000000, 0)
          // Lock camera — look straight at the characters
          state.camera.lookAt(0, 1, 0)
        }}
        onPointerMissed={handlePointerMissed}
      >
        {/* Lighting — key/fill/rim setup for 3D depth on a front-facing camera */}
        <ambientLight intensity={0.5} />
        {/* Key light — upper-right, slightly in front */}
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.0}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Fill light — upper-left */}
        <directionalLight position={[-3, 4, 2]} intensity={0.4} />
        {/* Rim/back light — behind and above for edge highlight */}
        <directionalLight position={[0, 4, -4]} intensity={0.5} />
        {/* Hemisphere light for subtle color variation */}
        <hemisphereLight args={['#b1e1ff', '#b97a20', 0.25]} />

        {/* Environment for PBR materials */}
        <Suspense fallback={null}>
          <Environment preset="studio" />
        </Suspense>

        {/* No OrbitControls — camera is fixed for 2D screen output */}

        {/* Render each visible 3D character */}
        {visibleCharacters.map((char) => {
          const savedChar = savedCharacters.find((sc) => sc.id === char.saved3DCharacterId)
          if (!savedChar) return null

          const glbUrl = blobUrls[savedChar.glbBlobId]
          if (!glbUrl) return null

          // Find animation GLB URL if character has an active animation
          let animationGlbUrl: string | undefined
          if (char.activeAnimationId) {
            const anim = animations.find((a) => a.id === char.activeAnimationId)
            if (anim) {
              animationGlbUrl = animBlobUrls[anim.glbBlobId]
            }
          }

          return (
            <Suspense key={char.id} fallback={null}>
              <Character3DRenderer
                character={char}
                glbUrl={glbUrl}
                animationGlbUrl={animationGlbUrl}
                boneMapping={savedChar.boneMapping}
                isSelected={char.id === activeCharacterId}
                onSelect={() => {
                  selectCharacter(char.id)
                  setRightPanelTab('3d-character-properties')
                }}
                onTransformChange={(pos, rot, scl) => {
                  updateCharacter(char.id, {
                    position: pos,
                    rotation: rot,
                    scale: scl,
                  })
                }}
              />
            </Suspense>
          )
        })}
      </Canvas>
    </div>
  )
})
