/**
 * Frame-exact 3D character renderer for Remotion export/preview.
 * Supports both direct blob URLs (for preview) and base64 (for final export).
 */
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { autoRemapClip } from '@/services/gltfUtils'
import { VisemeFacePlane3D } from '@/components/canvas/VisemeFacePlane3D'
import { ExpressionFacePlane3D } from '@/components/canvas/ExpressionFacePlane3D'
import type { Viseme, VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { Character3DExportData } from './types'

interface Remotion3DCharacterProps {
  character: Character3DExportData
  currentFrame: number
  fps: number
}

function findVisemeAtFrame(timeline: VisemeEvent[] | undefined, frame: number): Viseme {
  if (!timeline) return 'Rest'
  for (const event of timeline) {
    if (frame >= event.startFrame && frame < event.endFrame) return event.viseme
  }
  return 'Rest'
}

function findEmotionAtFrame(timeline: EmotionEvent[] | undefined, frame: number): string {
  if (!timeline) return 'Neutral'
  for (const event of timeline) {
    if (frame >= event.startFrame && frame < event.endFrame) return event.emotion
  }
  return 'Neutral'
}

function base64ToBlobUrl(base64: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: 'model/gltf-binary' })
  return URL.createObjectURL(blob)
}

export function Remotion3DCharacter({
  character,
  currentFrame,
  fps,
}: Remotion3DCharacterProps) {
  // Use direct blob URL if available, otherwise convert base64
  const glbUrl = useMemo(() => {
    if (character.glbUrl) return character.glbUrl
    if (character.glbBase64) return base64ToBlobUrl(character.glbBase64)
    return null
  }, [character.glbUrl, character.glbBase64])

  const animGlbUrl = useMemo(() => {
    if (character.activeAnimationGlbUrl) return character.activeAnimationGlbUrl
    if (character.activeAnimationGlbBase64) return base64ToBlobUrl(character.activeAnimationGlbBase64)
    return null
  }, [character.activeAnimationGlbUrl, character.activeAnimationGlbBase64])

  // Don't render if no GLB URL
  if (!glbUrl || !character.visible) return null

  return (
    <Remotion3DCharacterInner
      glbUrl={glbUrl}
      animGlbUrl={animGlbUrl}
      character={character}
      currentFrame={currentFrame}
      fps={fps}
    />
  )
}

// Separate inner component to avoid conditional hook calls
function Remotion3DCharacterInner({
  glbUrl,
  animGlbUrl,
  character,
  currentFrame,
  fps,
}: {
  glbUrl: string
  animGlbUrl: string | null
  character: Character3DExportData
  currentFrame: number
  fps: number
}) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const { scene, animations: modelAnimations } = useGLTF(glbUrl)

  // Clone the scene
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false

        // Rebuild skeleton.bones from scene-graph bones (same instances the mixer uses)
        const oldSkeleton = child.skeleton
        if (oldSkeleton) {
          const newBones: THREE.Bone[] = []
          for (const oldBone of oldSkeleton.bones) {
            const sceneGraphBone = clone.getObjectByName(oldBone.name)
            if (sceneGraphBone && (sceneGraphBone as THREE.Bone).isBone) {
              newBones.push(sceneGraphBone as THREE.Bone)
            } else {
              newBones.push(oldBone) // fallback — keep original
            }
          }
          child.skeleton = new THREE.Skeleton(newBones, oldSkeleton.boneInverses.map(m => m.clone()))
          child.bind(child.skeleton)
        }
      }
    })
    return clone
  }, [scene])

  // Load animation GLB if provided
  // Always call useGLTF to satisfy Rules of Hooks — falls back to main glbUrl (already cached)
  const animGltf = useGLTF(animGlbUrl || glbUrl)

  // Collect model bone names for autoRemapClip fallback
  const modelBoneNames = useMemo(() => {
    const names: string[] = []
    clonedScene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Bone).isBone) names.push(obj.name)
    })
    return names
  }, [clonedScene])

  // Remap external animation clips to match the character's bone names
  const remappedClips = useMemo(() => {
    if (!animGlbUrl || !animGltf?.animations.length) return null
    return animGltf.animations.map((clip) =>
      autoRemapClip(clip.clone(), character.boneMapping || {}, modelBoneNames)
    )
  }, [animGlbUrl, animGltf, character.boneMapping, modelBoneNames])

  // Set up mixer and animation
  useEffect(() => {
    if (!clonedScene) return

    const mixer = new THREE.AnimationMixer(clonedScene)
    mixerRef.current = mixer

    // Determine clips — use remapped external clips, or raw external, or model embedded
    let clips: THREE.AnimationClip[] = []
    if (remappedClips?.length) {
      clips = remappedClips
    } else if (animGlbUrl && animGltf?.animations.length) {
      clips = animGltf.animations
    } else if (modelAnimations.length) {
      clips = modelAnimations
    }

    if (clips.length > 0) {
      const action = mixer.clipAction(clips[0], clonedScene)
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.setEffectiveTimeScale(character.animationSpeed)
      action.play()
    }

    return () => {
      mixer.stopAllAction()
      mixerRef.current = null
    }
  }, [clonedScene, remappedClips, animGltf, modelAnimations, character.animationSpeed])

  // Seek animation to exact frame on each render
  useFrame(() => {
    if (!mixerRef.current) return
    const timeInSeconds =
      ((currentFrame - character.animationStartFrame) / fps) * character.animationSpeed
    mixerRef.current.setTime(Math.max(0, timeInSeconds))
  })

  // Auto-fit: normalize scale so model fits ~1.8 units tall
  const autoScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim <= 0) return 1
    const TARGET_HEIGHT = 1.8
    return TARGET_HEIGHT / maxDim
  }, [clonedScene])

  const yOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    return -box.min.y
  }, [clonedScene])

  return (
    <>
      <group
        position={[character.position.x, character.position.y, character.position.z]}
        rotation={[character.rotation.x, character.rotation.y, character.rotation.z]}
        scale={character.scale}
      >
        <group scale={autoScale} position={[0, yOffset * autoScale, 0]}>
          <primitive object={clonedScene} />
        </group>
      </group>

      {/* Viseme face plane for 3D lip sync export — world-space positioned */}
      {character.visemeFaceMapping?.enabled && character.visemeSpriteMap && (
        <VisemeFacePlane3D
          characterScene={clonedScene}
          headBoneName={character.boneMapping?.Head ?? 'Head'}
          mapping={character.visemeFaceMapping}
          visemeSpriteMap={character.visemeSpriteMap}
          curvedVisemes={null}
          getCurrentFrame={() => currentFrame}
          getVisemeAtFrame={(frame) => findVisemeAtFrame(character.visemeTimeline, frame)}
          getEmotionAtFrame={(frame) => findEmotionAtFrame(character.emotionTimeline, frame)}
        />
      )}

      {/* Expression face planes for 3D eye/eyebrow export */}
      {character.faceExpressionMapping?.enabled && (character.eyeVariantSpriteMap || character.eyebrowVariantSpriteMap) && (
        <ExpressionFacePlane3D
          characterScene={clonedScene}
          headBoneName={character.boneMapping?.Head ?? 'Head'}
          mapping={character.faceExpressionMapping}
          eyeSprites={character.eyeVariantSpriteMap ?? null}
          eyebrowSprites={character.eyebrowVariantSpriteMap ?? null}
          getCurrentFrame={() => currentFrame}
          getEmotionAtFrame={(frame) => findEmotionAtFrame(character.emotionTimeline, frame)}
        />
      )}
    </>
  )
}
