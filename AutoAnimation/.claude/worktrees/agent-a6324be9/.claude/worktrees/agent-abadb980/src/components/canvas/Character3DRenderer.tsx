/**
 * Renders a single 3D character in the Three.js scene.
 * Loads GLB model, plays animation clips via AnimationMixer with bone retargeting.
 * Supports selection highlight and UnifiedGizmo3D for move/rotate/scale.
 *
 * Animation pipeline (matching RigEditor3DCharacter / AnimationPreviewCharacter):
 * 1. Clone scene + rebind skeletons (so AnimationMixer drives the correct bone refs)
 * 2. Collect model bone names for remapping
 * 3. autoRemapClip external animation clips to match character bone names
 * 4. Play remapped clips > raw external clips > model embedded clips
 */
import { useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { autoRemapClip } from '@/services/gltfUtils'
import { UnifiedGizmo3D } from './UnifiedGizmo3D'
import { VisemeFacePlane3D } from './VisemeFacePlane3D'
import { ExpressionFacePlane3D } from './ExpressionFacePlane3D'
import { useVisemeFaceData } from '@/hooks/useVisemeFaceData'
import { useExpressionFaceData } from '@/hooks/useExpressionFaceData'
import { useTimelineStore } from '@/stores'
import { motionTracking3DData } from '@/hooks/useMotionTracking'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import type { Character3D, BoneMapping } from '@/types/character3d'

interface Character3DRendererProps {
  character: Character3D
  glbUrl: string
  animationGlbUrl?: string
  /** Bone mapping of the character model (standard → actual bone names) */
  boneMapping?: BoneMapping
  isSelected: boolean
  onSelect: () => void
  onTransformChange: (
    position: { x: number; y: number; z: number },
    rotation: { x: number; y: number; z: number },
    scale: number,
  ) => void
}

/** Use a ref to always hold the latest callback — avoids stale closures in R3F event handlers */
function useLatestCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn)
  ref.current = fn
  return useCallback((...args: any[]) => ref.current(...args), []) as T
}

export const Character3DRenderer = memo(function Character3DRenderer({
  character,
  glbUrl,
  animationGlbUrl,
  boneMapping,
  isSelected,
  onSelect,
  onTransformChange,
}: Character3DRendererProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const innerGroupRef = useRef<THREE.Group>(null!)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionRef = useRef<THREE.AnimationAction | null>(null)

  // Viseme face data (sprites + timeline) — resolved from mapping config
  const visemeFaceData = useVisemeFaceData(character.visemeFaceMapping)

  // Expression face data (eye/eyebrow sprites + emotion timeline)
  const expressionFaceData = useExpressionFaceData(character.faceExpressionMapping)

  // Resolve Head bone name from boneMapping (standard "Head" → actual bone name)
  const headBoneName = boneMapping?.Head ?? 'Head'

  // Track whether we've already auto-fitted the viseme offset/scale for this character
  const didAutoFitViseme = useRef(false)
  const didAutoFitExpression = useRef(false)

  // Load the character model
  const { scene, animations: modelAnimations } = useGLTF(glbUrl)

  // Clone scene for independent instance.
  // After cloning, rebind each SkinnedMesh's skeleton so skeleton.bones
  // reference the actual scene-graph bone objects (the ones AnimationMixer
  // writes to via PropertyBinding / getObjectByName). Without this,
  // skeleton.bones are stale copies that the mixer never touches.
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
          child.skeleton = new THREE.Skeleton(
            newBones,
            oldSkeleton.boneInverses.map((m) => m.clone()),
          )
          child.bind(child.skeleton)
        }
      }
    })

    return clone
  }, [scene])

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

  // Center model so bottom sits at y=0
  const yOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    return -box.min.y
  }, [clonedScene])

  // Compute bounding box for selection outline (in auto-scaled space)
  const boundingBox = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    // Adjust for auto-scale
    size.multiplyScalar(autoScale)
    center.multiplyScalar(autoScale)
    center.y += yOffset * autoScale
    return { size, center }
  }, [clonedScene, autoScale, yOffset])

  // ── Auto-fit viseme plane on first enable ──
  // Detects if the scale values look wrong (e.g. stale from old coordinate system)
  // and force-resets to sensible world-unit defaults.
  // World units: the scene where the model is ~1.8 units tall after autoScale.
  useEffect(() => {
    if (!character.visemeFaceMapping?.enabled) return

    const currentScale = character.visemeFaceMapping.scale
    // If scale values are absurdly large (leftover from raw model space), force reset
    const needsReset = !didAutoFitViseme.current || currentScale.x > 5 || currentScale.y > 5

    if (!needsReset) return

    // The model is normalized to ~1.8 units tall by autoScale.
    // For a humanoid, the head is ~1/7 of total height ≈ 0.26 units.
    const NORMALIZED_HEIGHT = 1.8
    const headH = NORMALIZED_HEIGHT * 0.14 // ~0.252
    const mouthW = headH * 0.75 // ~0.19 — wider for lips
    const mouthH = headH * 0.45 // ~0.11 — taller for open mouth

    // Offset is relative to head bone (bone mode) or added to bbox estimate (fallback)
    const mouthOffset = {
      x: 0,
      y: 0, // bbox fallback already estimates mouth Y position
      z: 0.02, // slight forward to sit on face surface
    }

    use3DCharacterStore.getState().update3DCharacter(character.id, {
      visemeFaceMapping: {
        ...character.visemeFaceMapping,
        offset: mouthOffset,
        scale: { x: mouthW, y: mouthH },
      },
    })

    didAutoFitViseme.current = true
  }, [character.visemeFaceMapping?.enabled, character.visemeFaceMapping?.scale, clonedScene, character.id])

  // ── Auto-fit expression planes on first enable ──
  useEffect(() => {
    if (!character.faceExpressionMapping?.enabled) return
    if (didAutoFitExpression.current) return

    const NORMALIZED_HEIGHT = 1.8
    const headH = NORMALIZED_HEIGHT * 0.14

    const eyeW = headH * 0.72
    const eyeH = headH * 0.24
    const browW = headH * 0.8
    const browH = headH * 0.16

    use3DCharacterStore.getState().update3DCharacter(character.id, {
      faceExpressionMapping: {
        ...character.faceExpressionMapping,
        eye: {
          ...character.faceExpressionMapping.eye,
          offset: { x: 0, y: 0.06, z: 0.02 },
          scale: { x: eyeW, y: eyeH },
        },
        eyebrow: {
          ...character.faceExpressionMapping.eyebrow,
          offset: { x: 0, y: 0.08, z: 0.02 },
          scale: { x: browW, y: browH },
        },
      },
    })

    didAutoFitExpression.current = true
  }, [character.faceExpressionMapping?.enabled, clonedScene, character.id])

  // Load animation GLB if provided (external animation from HunyuanMotion)
  // Always call useGLTF to satisfy Rules of Hooks — falls back to main glbUrl (already cached)
  const animGltf = useGLTF(animationGlbUrl || glbUrl)

  // Collect model bone names for fallback remapping when boneMapping is empty.
  // Uses .isBone check (works on cloned scenes where instanceof THREE.Bone may fail).
  const modelBoneNames = useMemo(() => {
    const names: string[] = []
    clonedScene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Bone).isBone) names.push(obj.name)
    })
    return names
  }, [clonedScene])

  // Remap external animation clips to match the character's bone names
  const remappedClips = useMemo(() => {
    if (!animationGlbUrl || !animGltf?.animations.length) return null
    return animGltf.animations.map((clip) => autoRemapClip(clip.clone(), boneMapping || {}, modelBoneNames))
  }, [animationGlbUrl, animGltf, boneMapping, modelBoneNames])

  // Set up animation mixer
  useEffect(() => {
    if (!clonedScene) return

    const mixer = new THREE.AnimationMixer(clonedScene)
    mixerRef.current = mixer

    return () => {
      mixer.stopAllAction()
      mixerRef.current = null
      actionRef.current = null
    }
  }, [clonedScene])

  // Play animations
  useEffect(() => {
    const mixer = mixerRef.current
    if (!mixer) return

    // Stop current action
    if (actionRef.current) {
      actionRef.current.fadeOut(0.2)
      actionRef.current = null
    }

    // Determine clips — use remapped external clips, or raw external, or model embedded
    let clips: THREE.AnimationClip[] = []
    if (remappedClips?.length) {
      clips = remappedClips
    } else if (animationGlbUrl && animGltf?.animations.length) {
      clips = animGltf.animations
    } else if (modelAnimations.length) {
      clips = modelAnimations
    }

    if (clips.length > 0) {
      const action = mixer.clipAction(clips[0], clonedScene)
      action.reset()
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.setEffectiveTimeScale(character.animationSpeed)
      action.fadeIn(0.2)
      action.play()
      actionRef.current = action
    }
  }, [remappedClips, animGltf, modelAnimations, clonedScene, character.animationSpeed, character.activeAnimationId])

  // Update animation mixer every frame + apply motion tracking head rotation
  useFrame((_, delta) => {
    mixerRef.current?.update(delta)

    // Apply motion tracking head rotation if active
    if (clonedScene && headBoneName) {
      const trackingData = motionTracking3DData.get('__global__')
      if (trackingData) {
        let headBone: THREE.Object3D | null = null
        clonedScene.traverse((obj: THREE.Object3D) => {
          if ((obj as THREE.Bone).isBone && obj.name === headBoneName) {
            headBone = obj
          }
        })
        if (headBone) {
          const euler = new THREE.Euler(trackingData.headPitch, trackingData.headYaw, trackingData.headRoll, 'XYZ')
          ;(headBone as THREE.Bone).quaternion.setFromEuler(euler)
        }
      }
    }
  })

  // Stable callbacks that always invoke the latest onSelect / onTransformChange,
  // preventing stale closures in R3F's event system.
  const stableOnSelect = useLatestCallback(onSelect)
  const stableOnTransformChange = useLatestCallback(onTransformChange)

  // Handle click on character — either viseme placement or selection
  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation()

      // Check if expression placement mode is active for this character
      const store = use3DCharacterStore.getState()
      if (
        store.expressionPlacementCharId === character.id &&
        store.expressionPlacementPart &&
        e.intersections?.length > 0
      ) {
        const hit = e.intersections[0]
        const worldPoint = hit.point as THREE.Vector3

        let foundBone: THREE.Object3D | null = null
        clonedScene.traverse((obj: THREE.Object3D) => {
          if ((obj as THREE.Bone).isBone && obj.name === headBoneName) {
            foundBone = obj
          }
        })

        if (foundBone) {
          const headBoneObj = foundBone as THREE.Object3D
          headBoneObj.updateWorldMatrix(true, false)
          const boneWorldPos = new THREE.Vector3()
          const boneWorldQuat = new THREE.Quaternion()
          const boneWorldScale = new THREE.Vector3()
          headBoneObj.matrixWorld.decompose(boneWorldPos, boneWorldQuat, boneWorldScale)

          const worldOffset = worldPoint.clone().sub(boneWorldPos)
          const inverseQuat = boneWorldQuat.clone().invert()
          worldOffset.applyQuaternion(inverseQuat)
          worldOffset.z += 0.02

          use3DCharacterStore.getState().updateExpressionOffset(character.id, store.expressionPlacementPart!, {
            x: worldOffset.x,
            y: worldOffset.y,
            z: worldOffset.z,
          })
        }

        use3DCharacterStore.getState().stopExpressionPlacement()
        document.body.style.cursor = 'default'
        return
      }

      // Check if viseme placement mode is active for this character
      const placementCharId = store.visemePlacementCharId
      if (placementCharId === character.id && e.intersections?.length > 0) {
        const hit = e.intersections[0]
        const worldPoint = hit.point as THREE.Vector3

        // Find the head bone in the cloned scene
        let foundBone: THREE.Object3D | null = null
        clonedScene.traverse((obj: THREE.Object3D) => {
          if ((obj as THREE.Bone).isBone && obj.name === headBoneName) {
            foundBone = obj
          }
        })

        if (foundBone) {
          const headBoneObj = foundBone as THREE.Object3D
          headBoneObj.updateWorldMatrix(true, false)

          // Get bone world position and rotation
          const boneWorldPos = new THREE.Vector3()
          const boneWorldQuat = new THREE.Quaternion()
          const boneWorldScale = new THREE.Vector3()
          headBoneObj.matrixWorld.decompose(boneWorldPos, boneWorldQuat, boneWorldScale)

          // Compute world-space offset from bone to click point
          const worldOffset = worldPoint.clone().sub(boneWorldPos)

          // Un-rotate by bone's world rotation to get offset in bone-oriented space
          // (since VisemeFacePlane3D re-applies the bone rotation to the offset)
          const inverseQuat = boneWorldQuat.clone().invert()
          worldOffset.applyQuaternion(inverseQuat)

          // Add slight forward offset to avoid z-fighting
          worldOffset.z += 0.02

          // Update the mapping offset (in world units, bone-oriented)
          use3DCharacterStore.getState().updateVisemeFaceMappingOffset(character.id, {
            x: worldOffset.x,
            y: worldOffset.y,
            z: worldOffset.z,
          })
        }

        // Exit placement mode
        use3DCharacterStore.getState().stopVisemePlacement()
        document.body.style.cursor = 'default'
        return
      }

      stableOnSelect()
    },
    [stableOnSelect, character.id, clonedScene, headBoneName],
  )

  // Sync gizmo transform changes back to the store
  const handleGizmoChange = useCallback(() => {
    if (!groupRef.current) return
    const pos = groupRef.current.position
    const rot = groupRef.current.rotation
    const scl = groupRef.current.scale.x // uniform scale

    stableOnTransformChange({ x: pos.x, y: pos.y, z: pos.z }, { x: rot.x, y: rot.y, z: rot.z }, scl)
  }, [stableOnTransformChange])

  return (
    <>
      <group
        ref={groupRef}
        position={[character.position.x, character.position.y, character.position.z]}
        rotation={[character.rotation.x, character.rotation.y, character.rotation.z]}
        scale={character.scale}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          const s = use3DCharacterStore.getState()
          const isPlacing = s.visemePlacementCharId === character.id || s.expressionPlacementCharId === character.id
          document.body.style.cursor = isPlacing ? 'crosshair' : 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <group ref={innerGroupRef} scale={autoScale} position={[0, yOffset * autoScale, 0]}>
          <primitive object={clonedScene} />
        </group>

        {/* Selection outline — wireframe bounding box */}
        {isSelected && (
          <mesh position={[boundingBox.center.x, boundingBox.center.y, boundingBox.center.z]}>
            <boxGeometry args={[boundingBox.size.x * 1.05, boundingBox.size.y * 1.05, boundingBox.size.z * 1.05]} />
            <meshBasicMaterial color={character.color || '#3b82f6'} wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </group>

      {/* Viseme face plane — follows Head bone in world space */}
      {character.visemeFaceMapping?.enabled && (
        <VisemeFacePlane3D
          characterScene={clonedScene}
          containerGroupRef={innerGroupRef}
          headBoneName={headBoneName}
          mapping={character.visemeFaceMapping}
          visemeSpriteMap={visemeFaceData.spriteMap}
          curvedVisemes={visemeFaceData.curvedVisemes}
          getCurrentFrame={() => useTimelineStore.getState().currentFrame}
          getVisemeAtFrame={visemeFaceData.getVisemeAtFrame}
          getEmotionAtFrame={visemeFaceData.getEmotionAtFrame}
        />
      )}

      {/* Expression face planes — eye + eyebrow overlays following Head bone */}
      {character.faceExpressionMapping?.enabled && (
        <ExpressionFacePlane3D
          characterScene={clonedScene}
          containerGroupRef={innerGroupRef}
          headBoneName={headBoneName}
          mapping={character.faceExpressionMapping}
          eyeSprites={expressionFaceData.eyeSprites}
          eyebrowSprites={expressionFaceData.eyebrowSprites}
          getCurrentFrame={() => useTimelineStore.getState().currentFrame}
          getEmotionAtFrame={expressionFaceData.getEmotionAtFrame}
        />
      )}

      {/* Octant gizmo — translate + rotate + scale in one control */}
      {isSelected && groupRef.current && (
        <UnifiedGizmo3D target={groupRef.current} onChange={handleGizmoChange} size={0.7} />
      )}
    </>
  )
})
