/**
 * Lightweight 3D character renderer for animation preview cards.
 * Plays a GLB animation on a character model without rig store dependencies.
 * Designed to be rendered inside a small <Canvas> on hover.
 */
import { useRef, useEffect, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { autoRemapClip } from '@/services/gltfUtils'
import type { BoneMapping } from '@/types/character3d'

interface AnimationPreviewCharacterProps {
  glbUrl: string
  animationGlbUrl: string
  boneMapping?: BoneMapping
  animationSpeed?: number
}

export const AnimationPreviewCharacter = memo(function AnimationPreviewCharacter({
  glbUrl,
  animationGlbUrl,
  boneMapping,
  animationSpeed = 1,
}: AnimationPreviewCharacterProps) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const groupRef = useRef<THREE.Group>(null)

  const { scene, animations: modelAnimations } = useGLTF(glbUrl)
  const animGltf = useGLTF(animationGlbUrl)

  // Clone scene for independent instance with rebound skeletons
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh) {
        child.frustumCulled = false
        const oldSkeleton = child.skeleton
        if (oldSkeleton) {
          const newBones: THREE.Bone[] = []
          for (const oldBone of oldSkeleton.bones) {
            const sceneGraphBone = clone.getObjectByName(oldBone.name)
            if (sceneGraphBone && (sceneGraphBone as THREE.Bone).isBone) {
              newBones.push(sceneGraphBone as THREE.Bone)
            } else {
              newBones.push(oldBone)
            }
          }
          child.skeleton = new THREE.Skeleton(newBones, oldSkeleton.boneInverses.map((m) => m.clone()))
          child.bind(child.skeleton)
        }
      }
    })
    return clone
  }, [scene])

  // Collect model bone names for remapping
  const modelBoneNames = useMemo(() => {
    const names: string[] = []
    clonedScene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Bone).isBone) names.push(obj.name)
    })
    return names
  }, [clonedScene])

  // Remap external animation clips to match character bones
  const remappedClips = useMemo(() => {
    if (!animGltf?.animations.length) return null
    return animGltf.animations.map((clip) =>
      autoRemapClip(clip.clone(), boneMapping || {}, modelBoneNames)
    )
  }, [animGltf, boneMapping, modelBoneNames])

  // Set up mixer and play animation
  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene)
    mixerRef.current = mixer

    let clips: THREE.AnimationClip[] = []
    if (remappedClips?.length) {
      clips = remappedClips
    } else if (animGltf?.animations.length) {
      clips = animGltf.animations
    } else if (modelAnimations.length) {
      clips = modelAnimations
    }

    if (clips.length > 0) {
      const action = mixer.clipAction(clips[0], clonedScene)
      action.setEffectiveTimeScale(animationSpeed)
      action.play()
    }

    return () => {
      mixer.stopAllAction()
      mixerRef.current = null
    }
  }, [remappedClips, animGltf, modelAnimations, clonedScene, animationSpeed])

  // Per-frame: update mixer + slow turntable rotation
  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3
    }
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

  // Center model so bottom sits at y=0
  const yOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    return -box.min.y
  }, [clonedScene])

  return (
    <group ref={groupRef} scale={autoScale} position={[0, yOffset * autoScale, 0]}>
      <primitive object={clonedScene} />
    </group>
  )
})
