/**
 * Renders a viseme mouth-sprite plane that follows a 3D character's Head bone.
 * Uses dual overlapping planes (A/B) for cross-fade transitions, matching the
 * 2D CharacterComposite approach. Texture swaps are driven by the existing
 * VisemeEvent[] + EmotionEvent[] timelines.
 *
 * APPROACH: Returns actual R3F JSX and uses useFrame to position the group
 * at the Head bone's world-space transform each frame.
 *
 * FALLBACK: For static models (no skeleton/bones), estimates the head/mouth
 * position from the model's world-space bounding box.
 *
 * GEOMETRY: Uses a cylindrically-curved plane to wrap around the face surface.
 */
import { useRef, useMemo, useEffect, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Viseme } from '@/types/voice'
import type { VisemeFaceMapping } from '@/types/character3d'
import { resolveVisemeSprite } from '@/services/visemeMapper'
import { getCurvatureFromEmotion } from '@/services/emotionMapping'
import { getVisemeTexture, preloadVisemeSprites } from '@/services/visemeTextureCache'
import { detectFaceMesh } from '@/services/faceMeshDetector'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

interface VisemeFacePlane3DProps {
  characterScene: THREE.Object3D
  /** Ref to the R3F-managed group that wraps the clonedScene (has correct world matrix) */
  containerGroupRef?: React.RefObject<THREE.Group>
  headBoneName: string
  mapping: VisemeFaceMapping
  visemeSpriteMap: Record<string, string | null> | null
  curvedVisemes: Record<string, string | null> | null
  getCurrentFrame: () => number
  getVisemeAtFrame: (frame: number) => Viseme
  getEmotionAtFrame: (frame: number) => string
  /** When true, attempts DecalGeometry projection onto face mesh surface */
  useDecalProjection?: boolean
}

/**
 * Creates a cylindrically-curved plane geometry that wraps around a face-like surface.
 * @param widthSegs - horizontal segments (more = smoother curve)
 * @param heightSegs - vertical segments
 * @param curvature - 0 = flat, 1 = half-cylinder wrap. 0.3-0.5 works well for a face.
 */
function createCurvedPlaneGeometry(widthSegs = 16, heightSegs = 8, curvature = 0.4): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(1, 1, widthSegs, heightSegs)
  const pos = geo.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    // Parabolic curve: edges push back, center stays at z=0
    const zOffset = -curvature * (2 * x) * (2 * x) * 0.25
    pos.setZ(i, zOffset)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/** Semi-transparent magenta placeholder when no sprites are loaded. */
const PLACEHOLDER_TEXTURE = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ff00ff'
  ctx.globalAlpha = 0.85
  ctx.fillRect(0, 0, 128, 128)
  ctx.globalAlpha = 1
  ctx.fillStyle = '#000000'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(64, 56, 32, 0, Math.PI)
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.strokeRect(2, 2, 124, 124)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
})()

/**
 * Finds a head bone/object by trying multiple naming conventions.
 * Supports: Bone objects, regular Object3D nodes, and fuzzy name matching.
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

export const VisemeFacePlane3D = memo(function VisemeFacePlane3D({
  characterScene,
  containerGroupRef,
  headBoneName,
  mapping,
  visemeSpriteMap,
  curvedVisemes,
  getCurrentFrame,
  getVisemeAtFrame,
  getEmotionAtFrame,
  useDecalProjection = false,
}: VisemeFacePlane3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
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
  const mappingRef = useRef(mapping)
  mappingRef.current = mapping
  const spriteMapRef = useRef(visemeSpriteMap)
  spriteMapRef.current = visemeSpriteMap
  const curvedVisemesRef = useRef(curvedVisemes)
  curvedVisemesRef.current = curvedVisemes
  const getCurrentFrameRef = useRef(getCurrentFrame)
  getCurrentFrameRef.current = getCurrentFrame
  const getVisemeAtFrameRef = useRef(getVisemeAtFrame)
  getVisemeAtFrameRef.current = getVisemeAtFrame
  const getEmotionAtFrameRef = useRef(getEmotionAtFrame)
  getEmotionAtFrameRef.current = getEmotionAtFrame

  // Pre-load all sprites into GPU textures
  useEffect(() => {
    preloadVisemeSprites(visemeSpriteMap)
    preloadVisemeSprites(curvedVisemes)
    const hasSprites =
      (visemeSpriteMap && Object.values(visemeSpriteMap).some((v) => v != null)) ||
      (curvedVisemes && Object.values(curvedVisemes).some((v) => v != null))
    hasAnySprites.current = !!hasSprites
    initialised.current = false
    lastSpriteUrl.current = null
  }, [visemeSpriteMap, curvedVisemes])

  // Find head bone/object
  const headBone = useMemo((): THREE.Object3D | null => {
    return findHeadBone(characterScene, headBoneName)
  }, [characterScene, headBoneName])

  // For static models (no head bone), compute the mouth anchor in MODEL-LOCAL space.
  // This point will be transformed through the model's world matrix each frame,
  // so it rotates/scales/translates correctly with the character.
  const localMouthAnchor = useMemo(() => {
    if (headBone) return null // not needed when we have a bone
    // Compute LOCAL bounding box (before any parent transforms)
    const localBox = new THREE.Box3().setFromObject(characterScene)
    if (localBox.isEmpty()) return null
    const localSize = new THREE.Vector3()
    const localCenter = new THREE.Vector3()
    localBox.getSize(localSize)
    localBox.getCenter(localCenter)
    // Mouth: ~78% up from bottom, centered X, at front face (+Z max)
    return new THREE.Vector3(
      localCenter.x,
      localBox.min.y + localSize.y * 0.78,
      localBox.max.z + localSize.z * 0.01, // slightly in front of the mesh
    )
  }, [headBone, characterScene])

  // Reusable vectors/quaternions (allocated once, mutated per frame)
  const _worldPos = useMemo(() => new THREE.Vector3(), [])
  const _worldQuat = useMemo(() => new THREE.Quaternion(), [])
  const _worldScale = useMemo(() => new THREE.Vector3(), [])
  const _offsetVec = useMemo(() => new THREE.Vector3(), [])
  const _euler = useMemo(() => new THREE.Euler(), [])

  // Every frame: position the viseme plane group
  useFrame((_, delta) => {
    if (!groupRef.current) return

    // Read latest values from refs (avoids stale closure issues in R3F)
    const m = mappingRef.current
    const sprMap = spriteMapRef.current
    const cvSprites = curvedVisemesRef.current

    if (headBone) {
      // ── Mode A: follow head bone ──
      headBone.updateWorldMatrix(true, false)
      headBone.matrixWorld.decompose(_worldPos, _worldQuat, _worldScale)

      _offsetVec.set(m.offset.x, m.offset.y, m.offset.z)
      _offsetVec.applyQuaternion(_worldQuat)

      groupRef.current.position.set(_worldPos.x + _offsetVec.x, _worldPos.y + _offsetVec.y, _worldPos.z + _offsetVec.z)

      _euler.set(m.rotation.x, m.rotation.y, m.rotation.z)
      const mappingQuat = new THREE.Quaternion().setFromEuler(_euler)
      const combinedQuat = _worldQuat.clone().multiply(mappingQuat)
      groupRef.current.quaternion.copy(combinedQuat)
    } else if (localMouthAnchor) {
      // ── Mode B: static model — transform local anchor through world matrix ──
      const containerGroup = containerGroupRef?.current
      let worldMatrix: THREE.Matrix4

      if (containerGroup) {
        containerGroup.updateWorldMatrix(true, false)
        worldMatrix = containerGroup.matrixWorld
      } else {
        characterScene.updateWorldMatrix(true, false)
        worldMatrix = characterScene.matrixWorld
      }

      // Transform anchor point from model-local space to world space
      _worldPos.copy(localMouthAnchor).applyMatrix4(worldMatrix)

      // Get the container's world rotation for orienting the offset and the plane
      worldMatrix.decompose(new THREE.Vector3(), _worldQuat, _worldScale)

      // Apply offset in the model's forward/up/right directions
      _offsetVec.set(m.offset.x, m.offset.y, m.offset.z)
      _offsetVec.applyQuaternion(_worldQuat)

      groupRef.current.position.set(_worldPos.x + _offsetVec.x, _worldPos.y + _offsetVec.y, _worldPos.z + _offsetVec.z)

      // Inherit model rotation + apply mapping rotation
      _euler.set(m.rotation.x, m.rotation.y, m.rotation.z)
      const mappingQuat = new THREE.Quaternion().setFromEuler(_euler)
      const combinedQuat = _worldQuat.clone().multiply(mappingQuat)
      groupRef.current.quaternion.copy(combinedQuat)
    }

    // Set plane scales
    if (planeARef.current) planeARef.current.scale.set(m.scale.x, m.scale.y, 1)
    if (planeBRef.current) planeBRef.current.scale.set(m.scale.x, m.scale.y, 1)

    // ── Texture logic ──
    const matA = matARef.current
    const matB = matBRef.current
    if (!matA || !matB) return

    if (!hasAnySprites.current) {
      matA.map = PLACEHOLDER_TEXTURE
      matA.needsUpdate = true
      matA.opacity = m.opacity
      matB.opacity = 0
      return
    }

    const frame = getCurrentFrameRef.current()
    const viseme = getVisemeAtFrameRef.current(frame)
    const emotion = getEmotionAtFrameRef.current(frame)
    const curvature = getCurvatureFromEmotion(emotion)
    const spriteUrl = resolveVisemeSprite(viseme, curvature, sprMap, cvSprites)

    if (spriteUrl && spriteUrl !== lastSpriteUrl.current) {
      lastSpriteUrl.current = spriteUrl
      const texture = getVisemeTexture(spriteUrl)

      if (!initialised.current) {
        matA.map = texture
        matA.needsUpdate = true
        matA.opacity = m.opacity
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
      matA.map = PLACEHOLDER_TEXTURE
      matA.needsUpdate = true
      matA.opacity = m.opacity
      initialised.current = true
      return
    }

    // Cross-fade animation
    const transitionSec = m.transitionMs / 1000
    const fadeSpeed = transitionSec > 0 ? delta / transitionSec : 10
    const target = m.opacity

    if (activeSlot.current === 'A') {
      matA.opacity = Math.min(target, matA.opacity + fadeSpeed)
      matB.opacity = Math.max(0, matB.opacity - fadeSpeed)
    } else {
      matB.opacity = Math.min(target, matB.opacity + fadeSpeed)
      matA.opacity = Math.max(0, matA.opacity - fadeSpeed)
    }
  })

  // Try to create DecalGeometry for surface wrapping if enabled
  const decalGeo = useMemo(() => {
    if (!useDecalProjection || !headBone) return null

    const faceMesh = detectFaceMesh(characterScene, headBone)
    if (!faceMesh) return null

    try {
      const size = new THREE.Vector3(mapping.scale.x, mapping.scale.y, 0.05)
      return new DecalGeometry(faceMesh.mesh, faceMesh.mouthAnchor, new THREE.Euler(0, 0, 0), size)
    } catch {
      return null
    }
  }, [characterScene, headBone, useDecalProjection, mapping.scale.x, mapping.scale.y])

  // Curved plane geometry shared between both planes (fallback)
  const curvedGeo = useMemo(() => createCurvedPlaneGeometry(16, 8, 0.4), [])

  // Use decal geometry if available, otherwise curved plane
  const planeGeo = decalGeo ?? curvedGeo

  return (
    <group ref={groupRef}>
      {/* Plane A — primary viseme (curved plane or decal geometry) */}
      <mesh ref={planeARef} renderOrder={9999} frustumCulled={false} geometry={planeGeo}>
        <meshBasicMaterial
          ref={matARef}
          map={PLACEHOLDER_TEXTURE}
          transparent
          opacity={1}
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Plane B — cross-fade target */}
      <mesh ref={planeBRef} position={[0, 0, 0.001]} renderOrder={9999} frustumCulled={false} geometry={planeGeo}>
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
})
