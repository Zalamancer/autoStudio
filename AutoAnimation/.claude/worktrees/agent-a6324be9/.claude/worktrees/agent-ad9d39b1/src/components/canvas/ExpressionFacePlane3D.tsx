/**
 * Renders eye + eyebrow sprite overlays on a 3D character's face.
 * Sister component to VisemeFacePlane3D — uses the same Head bone tracking
 * and dual-plane cross-fade pattern, but for expression sprites driven by
 * the emotion timeline instead of viseme timeline.
 *
 * Two overlay groups (eye + eyebrow), each with dual A/B planes for cross-fade.
 * Every frame:
 * 1. Track Head bone world transform (same as VisemeFacePlane3D)
 * 2. Get current emotion from getEmotionAtFrame(frame)
 * 3. Resolve eye variant → sprite lookup
 * 4. Resolve eyebrow variant → sprite lookup
 * 5. Cross-fade if sprite changed
 *
 * Supports DecalGeometry mode (surface wrapping) with curved-plane fallback.
 */
import { useRef, useMemo, useEffect, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FaceExpressionMapping } from '@/types/character3d'
import { getEyeVariantFromEmotion, getEyebrowVariantFromEmotion } from '@/types/emotionHeads'
import { getVisemeTexture, preloadExpressionSprites } from '@/services/visemeTextureCache'
import { detectFaceMesh } from '@/services/faceMeshDetector'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

interface ExpressionFacePlane3DProps {
  characterScene: THREE.Object3D
  /** Ref to the R3F-managed group that wraps the clonedScene (has correct world matrix) */
  containerGroupRef?: React.RefObject<THREE.Group>
  headBoneName: string
  mapping: FaceExpressionMapping
  eyeSprites: Record<string, string | null> | null
  eyebrowSprites: Record<string, string | null> | null
  getCurrentFrame: () => number
  getEmotionAtFrame: (frame: number) => string
}

/**
 * Creates a cylindrically-curved plane geometry for face wrapping.
 * Same as VisemeFacePlane3D's createCurvedPlaneGeometry.
 */
function createCurvedPlaneGeometry(widthSegs = 16, heightSegs = 8, curvature = 0.4): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(1, 1, widthSegs, heightSegs)
  const pos = geo.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const zOffset = -curvature * (2 * x) * (2 * x) * 0.25
    pos.setZ(i, zOffset)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/** Transparent placeholder texture (subtle outline, nearly invisible). */
const PLACEHOLDER_TEXTURE = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
})()

/**
 * Finds a head bone/object by trying multiple naming conventions.
 * Matches VisemeFacePlane3D's findHeadBone implementation.
 */
function findHeadBone(scene: THREE.Object3D, primaryName: string): THREE.Object3D | null {
  const namesToTry = [primaryName, 'Head', 'head', 'mixamorig:Head', 'mixamorig_Head', 'Bip01_Head', 'head_JNT']

  // Pass 1: proper Bone by exact name
  for (const name of namesToTry) {
    let found: THREE.Object3D | null = null
    scene.traverse((obj) => {
      if (!found && (obj as THREE.Bone).isBone && obj.name === name) found = obj
    })
    if (found) return found
  }

  // Pass 2: ANY object by exact name
  for (const name of namesToTry) {
    let found: THREE.Object3D | null = null
    scene.traverse((obj) => {
      if (!found && obj.name === name) found = obj
    })
    if (found) return found
  }

  // Pass 3: fuzzy bone
  let fallbackBone: THREE.Object3D | null = null
  scene.traverse((obj) => {
    if (!fallbackBone && (obj as THREE.Bone).isBone && obj.name.toLowerCase().includes('head')) fallbackBone = obj
  })
  if (fallbackBone) return fallbackBone

  // Pass 4: fuzzy any object
  let fallbackObj: THREE.Object3D | null = null
  scene.traverse((obj) => {
    if (!fallbackObj && obj.name.toLowerCase().includes('head')) fallbackObj = obj
  })
  return fallbackObj
}

/**
 * Single expression overlay group (eye or eyebrow).
 * Uses dual A/B planes with cross-fade, same pattern as VisemeFacePlane3D.
 */
function ExpressionOverlay({
  groupRef,
  config,
  sprites,
  getCurrentVariant,
  curvedGeo,
  decalGeo,
  renderOrder,
}: {
  groupRef: React.RefObject<THREE.Group>
  config: FaceExpressionMapping['eye']
  sprites: Record<string, string | null> | null
  getCurrentVariant: () => string
  curvedGeo: THREE.BufferGeometry
  decalGeo: THREE.BufferGeometry | null
  renderOrder: number
}) {
  const matARef = useRef<THREE.MeshBasicMaterial>(null!)
  const matBRef = useRef<THREE.MeshBasicMaterial>(null!)
  const planeARef = useRef<THREE.Mesh>(null!)
  const planeBRef = useRef<THREE.Mesh>(null!)

  const activeSlot = useRef<'A' | 'B'>('A')
  const lastSpriteUrl = useRef<string | null>(null)
  const hasAnySprites = useRef(false)
  const initialised = useRef(false)

  // ── Refs for props so useFrame always reads the latest values ──
  // R3F's useFrame callback ref update can race with React's effect ordering,
  // causing stale closure reads. Storing props in refs avoids this entirely.
  const configRef = useRef(config)
  configRef.current = config
  const spritesRef = useRef(sprites)
  spritesRef.current = sprites
  const getCurrentVariantRef = useRef(getCurrentVariant)
  getCurrentVariantRef.current = getCurrentVariant

  useEffect(() => {
    const s = spritesRef.current
    if (s) {
      const hasSprites = Object.values(s).some((v) => v != null)
      hasAnySprites.current = hasSprites
    } else {
      hasAnySprites.current = false
    }
    initialised.current = false
    lastSpriteUrl.current = null
  }, [sprites])

  const geo = decalGeo ?? curvedGeo

  useFrame((_, delta) => {
    const matA = matARef.current
    const matB = matBRef.current
    const cfg = configRef.current
    const spr = spritesRef.current
    if (!matA || !matB || !cfg.enabled) return

    // Set plane scales (only for curved geo, decal is pre-sized)
    if (!decalGeo) {
      if (planeARef.current) planeARef.current.scale.set(cfg.scale.x, cfg.scale.y, 1)
      if (planeBRef.current) planeBRef.current.scale.set(cfg.scale.x, cfg.scale.y, 1)
    }

    if (!hasAnySprites.current) {
      matA.map = PLACEHOLDER_TEXTURE
      matA.needsUpdate = true
      matA.opacity = 0
      matB.opacity = 0
      return
    }

    const variant = getCurrentVariantRef.current()
    const spriteUrl = spr?.[variant] ?? null

    if (spriteUrl && spriteUrl !== lastSpriteUrl.current) {
      lastSpriteUrl.current = spriteUrl
      const texture = getVisemeTexture(spriteUrl)

      if (!initialised.current) {
        matA.map = texture
        matA.needsUpdate = true
        matA.opacity = cfg.opacity
        matB.opacity = 0
        activeSlot.current = 'A'
        initialised.current = true
        return
      }

      if (activeSlot.current === 'A') {
        matB.map = texture
        matB.needsUpdate = true
        activeSlot.current = 'B'
      } else {
        matA.map = texture
        matA.needsUpdate = true
        activeSlot.current = 'A'
      }
    }

    if (!initialised.current) {
      matA.opacity = 0
      matB.opacity = 0
      initialised.current = true
      return
    }

    // Cross-fade animation (60ms default)
    const transitionSec = 0.06
    const fadeSpeed = transitionSec > 0 ? delta / transitionSec : 10
    const target = cfg.opacity

    if (activeSlot.current === 'A') {
      matA.opacity = Math.min(target, matA.opacity + fadeSpeed)
      matB.opacity = Math.max(0, matB.opacity - fadeSpeed)
    } else {
      matB.opacity = Math.min(target, matB.opacity + fadeSpeed)
      matA.opacity = Math.max(0, matA.opacity - fadeSpeed)
    }
  })

  if (!config.enabled) return null

  return (
    <group ref={groupRef}>
      <mesh ref={planeARef} renderOrder={renderOrder} frustumCulled={false} geometry={geo}>
        <meshBasicMaterial
          ref={matARef}
          map={PLACEHOLDER_TEXTURE}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={planeBRef} position={[0, 0, 0.001]} renderOrder={renderOrder} frustumCulled={false} geometry={geo}>
        <meshBasicMaterial
          ref={matBRef}
          map={PLACEHOLDER_TEXTURE}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export const ExpressionFacePlane3D = memo(function ExpressionFacePlane3D({
  characterScene,
  containerGroupRef,
  headBoneName,
  mapping,
  eyeSprites,
  eyebrowSprites,
  getCurrentFrame,
  getEmotionAtFrame,
}: ExpressionFacePlane3DProps) {
  const eyeGroupRef = useRef<THREE.Group>(null!)
  const eyebrowGroupRef = useRef<THREE.Group>(null!)
  const rootGroupRef = useRef<THREE.Group>(null!)

  // ── Refs for props so useFrame always reads the latest values ──
  const mappingRef = useRef(mapping)
  mappingRef.current = mapping
  const getCurrentFrameRef = useRef(getCurrentFrame)
  getCurrentFrameRef.current = getCurrentFrame
  const getEmotionAtFrameRef = useRef(getEmotionAtFrame)
  getEmotionAtFrameRef.current = getEmotionAtFrame

  // Pre-load all sprites into GPU textures
  useEffect(() => {
    preloadExpressionSprites(eyeSprites, eyebrowSprites)
  }, [eyeSprites, eyebrowSprites])

  // Find head bone
  const headBone = useMemo((): THREE.Object3D | null => {
    return findHeadBone(characterScene, headBoneName)
  }, [characterScene, headBoneName])

  // For static models (no head bone), compute a fallback anchor
  const localHeadAnchor = useMemo(() => {
    if (headBone) return null
    const localBox = new THREE.Box3().setFromObject(characterScene)
    if (localBox.isEmpty()) return null
    const localSize = new THREE.Vector3()
    const localCenter = new THREE.Vector3()
    localBox.getSize(localSize)
    localBox.getCenter(localCenter)
    return new THREE.Vector3(localCenter.x, localBox.min.y + localSize.y * 0.85, localBox.max.z + localSize.z * 0.01)
  }, [headBone, characterScene])

  // Try to create DecalGeometry if enabled
  const { eyeDecalGeo, eyebrowDecalGeo } = useMemo(() => {
    if (!mapping.useDecalProjection || !headBone) {
      return { eyeDecalGeo: null, eyebrowDecalGeo: null }
    }

    const faceMesh = detectFaceMesh(characterScene, headBone)
    if (!faceMesh) {
      return { eyeDecalGeo: null, eyebrowDecalGeo: null }
    }

    try {
      const eyeSize = new THREE.Vector3(mapping.eye.scale.x, mapping.eye.scale.y, 0.05)
      const eyeDecal = new DecalGeometry(faceMesh.mesh, faceMesh.eyeAnchor, new THREE.Euler(0, 0, 0), eyeSize)

      const eyebrowSize = new THREE.Vector3(mapping.eyebrow.scale.x, mapping.eyebrow.scale.y, 0.05)
      const eyebrowDecal = new DecalGeometry(
        faceMesh.mesh,
        faceMesh.eyebrowAnchor,
        new THREE.Euler(0, 0, 0),
        eyebrowSize,
      )

      return { eyeDecalGeo: eyeDecal, eyebrowDecalGeo: eyebrowDecal }
    } catch {
      return { eyeDecalGeo: null, eyebrowDecalGeo: null }
    }
  }, [characterScene, headBone, mapping.useDecalProjection, mapping.eye.scale, mapping.eyebrow.scale])

  // Curved plane geometry shared between overlays (fallback)
  const curvedGeo = useMemo(() => createCurvedPlaneGeometry(16, 8, 0.3), [])

  // Reusable vectors/quaternions
  const _worldPos = useMemo(() => new THREE.Vector3(), [])
  const _worldQuat = useMemo(() => new THREE.Quaternion(), [])
  const _worldScale = useMemo(() => new THREE.Vector3(), [])
  const _offsetVec = useMemo(() => new THREE.Vector3(), [])
  const _euler = useMemo(() => new THREE.Euler(), [])

  // Current variant refs (updated per frame, read by overlay children)
  const currentEyeVariant = useRef('neutral')
  const currentEyebrowVariant = useRef('neutral')

  // Every frame: position the expression groups + resolve current variants
  useFrame(() => {
    if (!rootGroupRef.current) return

    // Read latest values from refs (avoids stale closure issues in R3F)
    const m = mappingRef.current

    // Resolve emotion → variants
    const frame = getCurrentFrameRef.current()
    const emotion = getEmotionAtFrameRef.current(frame)
    currentEyeVariant.current = getEyeVariantFromEmotion(emotion)
    currentEyebrowVariant.current = getEyebrowVariantFromEmotion(emotion)

    if (headBone) {
      // Mode A: follow head bone
      headBone.updateWorldMatrix(true, false)
      headBone.matrixWorld.decompose(_worldPos, _worldQuat, _worldScale)

      // Position eye group
      if (eyeGroupRef.current && m.eye.enabled) {
        _offsetVec.set(m.eye.offset.x, m.eye.offset.y, m.eye.offset.z)
        _offsetVec.applyQuaternion(_worldQuat)
        eyeGroupRef.current.position.set(
          _worldPos.x + _offsetVec.x,
          _worldPos.y + _offsetVec.y,
          _worldPos.z + _offsetVec.z,
        )
        _euler.set(m.eye.rotation.x, m.eye.rotation.y, m.eye.rotation.z)
        const eyeQuat = new THREE.Quaternion().setFromEuler(_euler)
        eyeGroupRef.current.quaternion.copy(_worldQuat.clone().multiply(eyeQuat))
      }

      // Position eyebrow group
      if (eyebrowGroupRef.current && m.eyebrow.enabled) {
        _offsetVec.set(m.eyebrow.offset.x, m.eyebrow.offset.y, m.eyebrow.offset.z)
        _offsetVec.applyQuaternion(_worldQuat)
        eyebrowGroupRef.current.position.set(
          _worldPos.x + _offsetVec.x,
          _worldPos.y + _offsetVec.y,
          _worldPos.z + _offsetVec.z,
        )
        _euler.set(m.eyebrow.rotation.x, m.eyebrow.rotation.y, m.eyebrow.rotation.z)
        const browQuat = new THREE.Quaternion().setFromEuler(_euler)
        eyebrowGroupRef.current.quaternion.copy(_worldQuat.clone().multiply(browQuat))
      }
    } else if (localHeadAnchor) {
      // Mode B: static model
      const containerGroup = containerGroupRef?.current
      let worldMatrix: THREE.Matrix4

      if (containerGroup) {
        containerGroup.updateWorldMatrix(true, false)
        worldMatrix = containerGroup.matrixWorld
      } else {
        characterScene.updateWorldMatrix(true, false)
        worldMatrix = characterScene.matrixWorld
      }

      _worldPos.copy(localHeadAnchor).applyMatrix4(worldMatrix)
      worldMatrix.decompose(new THREE.Vector3(), _worldQuat, _worldScale)

      if (eyeGroupRef.current && m.eye.enabled) {
        _offsetVec.set(m.eye.offset.x, m.eye.offset.y, m.eye.offset.z)
        _offsetVec.applyQuaternion(_worldQuat)
        eyeGroupRef.current.position.set(
          _worldPos.x + _offsetVec.x,
          _worldPos.y + _offsetVec.y,
          _worldPos.z + _offsetVec.z,
        )
        _euler.set(m.eye.rotation.x, m.eye.rotation.y, m.eye.rotation.z)
        const eyeQuat = new THREE.Quaternion().setFromEuler(_euler)
        eyeGroupRef.current.quaternion.copy(_worldQuat.clone().multiply(eyeQuat))
      }

      if (eyebrowGroupRef.current && m.eyebrow.enabled) {
        _offsetVec.set(m.eyebrow.offset.x, m.eyebrow.offset.y, m.eyebrow.offset.z)
        _offsetVec.applyQuaternion(_worldQuat)
        eyebrowGroupRef.current.position.set(
          _worldPos.x + _offsetVec.x,
          _worldPos.y + _offsetVec.y,
          _worldPos.z + _offsetVec.z,
        )
        _euler.set(m.eyebrow.rotation.x, m.eyebrow.rotation.y, m.eyebrow.rotation.z)
        const browQuat = new THREE.Quaternion().setFromEuler(_euler)
        eyebrowGroupRef.current.quaternion.copy(_worldQuat.clone().multiply(browQuat))
      }
    }
  })

  return (
    <group ref={rootGroupRef}>
      {/* Eye overlay */}
      {mapping.eye.enabled && (
        <ExpressionOverlay
          groupRef={eyeGroupRef}
          config={mapping.eye}
          sprites={eyeSprites}
          getCurrentVariant={() => currentEyeVariant.current}
          curvedGeo={curvedGeo}
          decalGeo={eyeDecalGeo}
          renderOrder={9998}
        />
      )}

      {/* Eyebrow overlay */}
      {mapping.eyebrow.enabled && (
        <ExpressionOverlay
          groupRef={eyebrowGroupRef}
          config={mapping.eyebrow}
          sprites={eyebrowSprites}
          getCurrentVariant={() => currentEyebrowVariant.current}
          curvedGeo={curvedGeo}
          decalGeo={eyebrowDecalGeo}
          renderOrder={9997}
        />
      )}
    </group>
  )
})
