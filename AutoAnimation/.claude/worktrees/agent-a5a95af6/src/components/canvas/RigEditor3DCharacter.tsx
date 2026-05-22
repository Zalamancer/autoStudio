/**
 * Poseable 3D character renderer for the rig editor.
 * Extends Character3DRenderer with manual bone posing on top of AnimationMixer.
 *
 * Render order per frame:
 * 1. Restore all bones to rest pose (clean baseline)
 * 2. AnimationMixer updates skeleton (GLB clip playback — sets absolute values)
 * 3. Manual pose offsets applied from use3DRigStore.currentPose
 * 4. GPU skinning renders deformed mesh (automatic via Three.js)
 */
import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { autoRemapClip } from '@/services/gltfUtils'
import type { BoneMapping } from '@/types/character3d'
import type { BonePose3D } from '@/types/rig3d'

interface RigEditor3DCharacterProps {
  glbUrl: string
  animationGlbUrl?: string
  animationSpeed?: number
  /** Bone mapping of the character model (standard → actual bone names) */
  targetBoneMapping?: BoneMapping
  /** Callback providing the skeleton ref once loaded */
  onSkeletonReady: (skeleton: THREE.Skeleton | null) => void
}

// ─── Reusable Three.js objects (avoid per-frame allocations) ────────────────

const _offsetQuat = new THREE.Quaternion()
const _offsetPos = new THREE.Vector3()
const _offsetScale = new THREE.Vector3()

/** Per-bone rest pose snapshot using Three.js objects for fast copy */
type RestPoseMap = Map<
  string,
  { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 }
>

export function RigEditor3DCharacter({
  glbUrl,
  animationGlbUrl,
  animationSpeed = 1,
  targetBoneMapping,
  onSkeletonReady,
}: RigEditor3DCharacterProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const actionRef = useRef<THREE.AnimationAction | null>(null)
  const skeletonRef = useRef<THREE.Skeleton | null>(null)
  const restPoseRef = useRef<RestPoseMap | null>(null)
  const allSkeletonsRef = useRef<THREE.Skeleton[]>([])

  // Load character GLB
  const { scene, animations: modelAnimations } = useGLTF(glbUrl)

  // Clone scene for independent instance.
  // After cloning, rebind each SkinnedMesh's skeleton so skeleton.bones
  // reference the actual scene-graph bone objects (the ones AnimationMixer
  // writes to via PropertyBinding / getObjectByName). Without this,
  // skeleton.bones are stale copies that the mixer never touches.
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)

    // Find a bone by name in a scene graph, skipping non-bone objects that may share the name
    function findBoneByName(root: THREE.Object3D, name: string): THREE.Bone | null {
      let result: THREE.Bone | null = null
      root.traverse((obj) => {
        if (!result && (obj as THREE.Bone).isBone && obj.name === name) {
          result = obj as THREE.Bone
        }
      })
      return result
    }

    let rebindFoundCount = 0
    let rebindFallbackCount = 0

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        const isSkinnedMesh = (child as THREE.SkinnedMesh).isSkinnedMesh
        const hasSkinIndex = !!mesh.geometry?.attributes?.skinIndex
        const hasSkinWeight = !!mesh.geometry?.attributes?.skinWeight
        const sm = child as THREE.SkinnedMesh
        console.log(
          `[RigEditor3DCharacter] Mesh "${child.name}" type=${child.type}`,
          `isSkinnedMesh=${isSkinnedMesh}`,
          `hasSkinIndex=${hasSkinIndex}`,
          `hasSkinWeight=${hasSkinWeight}`,
          `skeleton.bones=${isSkinnedMesh ? (sm.skeleton?.bones.length ?? 'no skeleton') : 'n/a'}`,
        )
      }

      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const skinnedChild = child as THREE.SkinnedMesh
        skinnedChild.frustumCulled = false

        // Rebuild skeleton.bones from scene-graph bones (same instances the mixer uses)
        const oldSkeleton = skinnedChild.skeleton
        if (oldSkeleton) {
          const newBones: THREE.Bone[] = []
          for (const oldBone of oldSkeleton.bones) {
            const sceneGraphBone = findBoneByName(clone, oldBone.name)
            if (sceneGraphBone) {
              newBones.push(sceneGraphBone)
              rebindFoundCount++
            } else {
              newBones.push(oldBone) // fallback — keep original
              rebindFallbackCount++
            }
          }
          const newSkeleton = new THREE.Skeleton(newBones, oldSkeleton.boneInverses.map(m => m.clone()))
          // Pass the existing (cloned) bindMatrix to bind() so it registers the
          // new skeleton WITHOUT recalculating boneInverses (which could be wrong
          // from stale matrixWorld in the freshly cloned scene).
          skinnedChild.bind(newSkeleton, skinnedChild.bindMatrix.clone())
        }
      }
    })

    if (rebindFoundCount > 0 || rebindFallbackCount > 0) {
      console.log(`[RigEditor3DCharacter] Clone rebind: ${rebindFoundCount} bones found, ${rebindFallbackCount} fallbacks`)
    }

    return clone
  }, [scene])

  // Extract skeleton from cloned scene + capture rest pose + collect all skeletons
  useEffect(() => {
    let foundSkeleton: THREE.Skeleton | null = null
    const allSkeletons: THREE.Skeleton[] = []
    clonedScene.traverse((obj) => {
      if ((obj as THREE.SkinnedMesh).isSkinnedMesh && (obj as THREE.SkinnedMesh).skeleton) {
        allSkeletons.push((obj as THREE.SkinnedMesh).skeleton)
        if (!foundSkeleton) {
          foundSkeleton = (obj as THREE.SkinnedMesh).skeleton
        }
      }
    })
    const skeleton = foundSkeleton as THREE.Skeleton | null
    skeletonRef.current = skeleton
    allSkeletonsRef.current = allSkeletons
    console.log(`[RigEditor3DCharacter] Collected ${allSkeletons.length} skeletons from SkinnedMeshes`)

    // Capture rest pose (bone transforms at load time) for reset each frame
    if (skeleton) {
      const restPose: RestPoseMap = new Map()
      for (const bone of skeleton.bones) {
        restPose.set(bone.name, {
          position: bone.position.clone(),
          quaternion: bone.quaternion.clone(),
          scale: bone.scale.clone(),
        })
      }
      restPoseRef.current = restPose
    } else {
      restPoseRef.current = null
    }

    if (skeleton) {
      console.log('[RigEditor3DCharacter] Skeleton ready:', skeleton.bones.length, 'bones. Names:', skeleton.bones.map(b => b.name).slice(0, 5))
      // Diagnostic: verify the skeleton's bones are in the cloned scene graph
      let bonesFoundInScene = 0
      for (const bone of skeleton.bones) {
        let found = false
        clonedScene.traverse((obj) => { if (obj === bone) found = true })
        if (found) bonesFoundInScene++
      }
      console.log(`[RigEditor3DCharacter] ${bonesFoundInScene}/${skeleton.bones.length} skeleton bones are in the cloned scene graph`)
      // Diagnostic: check matrixAutoUpdate on first bone (GLTFLoader sets false for matrix-node bones)
      const firstBone = skeleton.bones[0]
      console.log(`[RigEditor3DCharacter] First bone "${firstBone?.name}" matrixAutoUpdate=${firstBone?.matrixAutoUpdate}`)
      // Diagnostic: log boneInverse and bindMatrix for first bone
      if (skeleton.boneInverses[0]) {
        const invE = skeleton.boneInverses[0].elements
        console.log(`[RigEditor3DCharacter] boneInverses[0] diag: ${invE[0].toFixed(4)}, ${invE[5].toFixed(4)}, ${invE[10].toFixed(4)}`)
      }
      // Log the first SkinnedMesh's bindMatrix
      let firstSM: THREE.SkinnedMesh | null = null
      clonedScene.traverse((obj) => {
        if (!firstSM && (obj as THREE.SkinnedMesh).isSkinnedMesh) firstSM = obj as THREE.SkinnedMesh
      })
      if (firstSM) {
        const bmE = (firstSM as THREE.SkinnedMesh).bindMatrix.elements
        console.log(`[RigEditor3DCharacter] bindMatrix diag: ${bmE[0].toFixed(4)}, ${bmE[5].toFixed(4)}, ${bmE[10].toFixed(4)}`)
        console.log(`[RigEditor3DCharacter] bindMode: ${(firstSM as THREE.SkinnedMesh).bindMode}`)
      }
    }
    onSkeletonReady(skeleton)
  }, [clonedScene, onSkeletonReady])

  // Load external animation GLB if provided
  // Always call useGLTF to satisfy Rules of Hooks — falls back to main glbUrl (already cached)
  const animGltf = useGLTF(animationGlbUrl || glbUrl)

  // Set up AnimationMixer
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

  // Collect model bone names for fallback remapping when targetBoneMapping is empty.
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
    return animGltf.animations.map((clip) =>
      autoRemapClip(clip.clone(), targetBoneMapping || {}, modelBoneNames)
    )
  }, [animationGlbUrl, animGltf, targetBoneMapping, modelBoneNames])

  // Play animations
  useEffect(() => {
    const mixer = mixerRef.current
    if (!mixer) return

    // Stop current
    if (actionRef.current) {
      actionRef.current.fadeOut(0.2)
      actionRef.current = null
    }

    // Determine clips — use remapped external clips, or model's embedded clips
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
      action.setEffectiveTimeScale(animationSpeed)
      action.fadeIn(0.2)
      action.play()
      actionRef.current = action
    }
  }, [remappedClips, animGltf, modelAnimations, clonedScene, animationSpeed])

  // Per-frame update: reset → mixer → manual pose offsets
  useFrame((_, delta) => {
    const skeleton = skeletonRef.current
    if (!skeleton) return

    // Step 1: Restore all bones to rest pose (clean baseline)
    restoreBonesToRestPose(skeleton, restPoseRef.current)

    // Step 2: AnimationMixer updates skeleton (sets absolute bone values)
    mixerRef.current?.update(delta)

    // Step 3: Apply manual pose offsets on top of rest/mixer state
    const currentPose = use3DRigStore.getState().currentPose
    if (currentPose) {
      applyPoseOffsets(skeleton, currentPose)
    }

    // Step 4: Force recompose local matrices from position/quaternion/scale.
    //
    // Why this is necessary:
    //   GLTFLoader sets matrixAutoUpdate = false on nodes that have a pre-baked
    //   matrix in the GLTF file (common for bones exported from FBX→GLB).
    //   When matrixAutoUpdate = false, updateMatrixWorld() does NOT call
    //   updateMatrix(), so modifying bone.quaternion never writes back into
    //   bone.matrix — the local matrix stays frozen at the original value.
    //   Calling bone.updateMatrix() explicitly forces the recomposition:
    //   bone.matrix.compose(bone.position, bone.quaternion, bone.scale).
    for (const bone of skeleton.bones) {
      bone.updateMatrix()
    }

    // Step 5: Force world-matrix propagation then upload bone matrices to GPU.
    //
    // Why this is necessary:
    //   useFrame runs BEFORE Three.js calls gl.render() → scene.updateMatrixWorld().
    //   After step 3+4 we've modified bone.matrix, but bone.matrixWorld is still
    //   stale from the previous frame. skeleton.update() reads bone.matrixWorld →
    //   if stale, the GPU gets last frame's boneMatrices and the mesh appears
    //   frozen even though bones moved.
    //
    //   By calling clonedScene.updateMatrixWorld(true) first, we recompute
    //   every bone's matrixWorld from the just-recomposed local matrices.
    //   Then skeleton.update() uploads the current (correct) boneMatrices.
    clonedScene.updateMatrixWorld(true)
    // Update ALL skeletons (one per SkinnedMesh), not just the first.
    // Each mesh has its own Skeleton instance with its own boneMatrices/boneTexture.
    // The renderer may not call skeleton.update() for all meshes in Three.js r182+,
    // so we must do it explicitly after updating bone transforms.
    for (const skel of allSkeletonsRef.current) {
      skel.update()
    }

    // ── Diagnostic: check boneMatrix values for posed bone ────────────
    if (currentPose && skeleton.boneMatrices) {
      const firstKey = Object.keys(currentPose)[0]
      if (firstKey && ++_diagBoneMatrixCounter % 180 === 0) {
        const idx = skeleton.bones.findIndex((b) => b.name === firstKey)
        if (idx >= 0) {
          const bone = skeleton.bones[idx]
          const m = skeleton.boneMatrices
          const off = idx * 16
          // Column-major 4x4: diagonal is [0],[5],[10],[15]
          console.log(
            `[DIAG] "${firstKey}" idx=${idx}`,
            `quat(${bone.quaternion.x.toFixed(3)},${bone.quaternion.y.toFixed(3)},${bone.quaternion.z.toFixed(3)},${bone.quaternion.w.toFixed(3)})`,
            `boneMatrix diag(${m[off]?.toFixed(4)},${m[off + 5]?.toFixed(4)},${m[off + 10]?.toFixed(4)})`,
            `boneTexture=${!!skeleton.boneTexture}`,
            `matrixAutoUpdate=${bone.matrixAutoUpdate}`,
          )
          // Check boneInverse diagonal
          const inv = skeleton.boneInverses[idx]
          if (inv) {
            const e = inv.elements
            console.log(
              `[DIAG] boneInverse diag(${e[0].toFixed(4)},${e[5].toFixed(4)},${e[10].toFixed(4)})`,
              `bindMatrix diag:`, clonedScene.traverse !== undefined ? 'ok' : 'err',
            )
          }
        }
      }
    }
  })

  // Auto-fit: compute bounding box and normalize scale so model fits ~1.8 units tall.
  // Models authored in centimeters (e.g. 170 units tall) will be scaled down automatically.
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

  return (
    <group scale={autoScale} position={[0, yOffset * autoScale, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
}

/**
 * Restore all bones to their rest pose (captured at load time).
 * This ensures a clean baseline before mixer + offset application each frame.
 */
function restoreBonesToRestPose(
  skeleton: THREE.Skeleton,
  restPose: RestPoseMap | null
): void {
  if (!restPose) return
  for (const bone of skeleton.bones) {
    const rest = restPose.get(bone.name)
    if (!rest) continue
    bone.position.copy(rest.position)
    bone.quaternion.copy(rest.quaternion)
    bone.scale.copy(rest.scale)
  }
}

/**
 * Apply pose offsets to skeleton bones.
 * Offsets are added/multiplied on top of current bone state (after rest pose restore + mixer).
 * Since bones are reset to rest pose each frame, this is effectively: restPose + offset.
 */
let _applyLogCounter = 0
let _diagBoneMatrixCounter = 0
function applyPoseOffsets(skeleton: THREE.Skeleton, pose: BonePose3D): void {
  let appliedCount = 0
  for (const bone of skeleton.bones) {
    const offset = pose[bone.name]
    if (!offset) continue
    appliedCount++

    // Position offset (additive)
    if (offset.position.x !== 0 || offset.position.y !== 0 || offset.position.z !== 0) {
      _offsetPos.set(offset.position.x, offset.position.y, offset.position.z)
      bone.position.add(_offsetPos)
    }

    // Rotation offset (multiplicative — quaternion composition)
    if (
      offset.quaternion.x !== 0 ||
      offset.quaternion.y !== 0 ||
      offset.quaternion.z !== 0 ||
      offset.quaternion.w !== 1
    ) {
      _offsetQuat.set(
        offset.quaternion.x,
        offset.quaternion.y,
        offset.quaternion.z,
        offset.quaternion.w
      )
      bone.quaternion.multiply(_offsetQuat)
    }

    // Scale offset (multiplicative)
    if (offset.scale.x !== 1 || offset.scale.y !== 1 || offset.scale.z !== 1) {
      _offsetScale.set(offset.scale.x, offset.scale.y, offset.scale.z)
      bone.scale.multiply(_offsetScale)
    }
  }

  // Log every ~120 frames (~2s at 60fps) when offsets are active
  if (appliedCount > 0 && ++_applyLogCounter % 120 === 0) {
    const firstKey = Object.keys(pose)[0]
    const first = pose[firstKey]
    console.log(`[applyPoseOffsets] Applied ${appliedCount} bone offsets. First: "${firstKey}"`,
      'pos:', first?.position, 'quat:', first?.quaternion)
  }
}
