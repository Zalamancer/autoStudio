/**
 * Vertex weight visualization overlay for 3D skinned meshes.
 * Colors each vertex by its weight for the selected bone (red=1.0, blue=0.0).
 * Read-only visualization — interactive painting is a future extension.
 */
import { useMemo, useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface WeightPaintOverlay3DProps {
  /** The skinned mesh to visualize */
  skinnedMesh: THREE.SkinnedMesh | null
  /** The skeleton (needed for bone index lookup) */
  skeleton: THREE.Skeleton | null
  /** Which bone to show weights for (null = hide overlay) */
  selectedBoneName: string | null
  /** Whether the overlay is visible */
  visible: boolean
}

/** Blue→Cyan→Green→Yellow→Red gradient for weight values 0-1 */
const WEIGHT_COLORS = [
  new THREE.Color(0x0000ff), // 0.0 blue
  new THREE.Color(0x00ffff), // 0.25 cyan
  new THREE.Color(0x00ff00), // 0.5 green
  new THREE.Color(0xffff00), // 0.75 yellow
  new THREE.Color(0xff0000), // 1.0 red
]

function weightToColor(weight: number, target: THREE.Color): THREE.Color {
  const w = Math.max(0, Math.min(1, weight))
  const idx = w * (WEIGHT_COLORS.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(lo + 1, WEIGHT_COLORS.length - 1)
  const t = idx - lo
  target.copy(WEIGHT_COLORS[lo]).lerp(WEIGHT_COLORS[hi], t)
  return target
}

export const WeightPaintOverlay3D = memo(function WeightPaintOverlay3D({
  skinnedMesh,
  skeleton,
  selectedBoneName,
  visible,
}: WeightPaintOverlay3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const colorTmp = useMemo(() => new THREE.Color(), [])

  // Build the weight-colored geometry
  const overlayGeometry = useMemo(() => {
    if (!skinnedMesh || !skeleton || !selectedBoneName || !visible) return null

    const geo = skinnedMesh.geometry
    if (!geo) return null

    const skinIndex = geo.attributes.skinIndex as THREE.BufferAttribute
    const skinWeight = geo.attributes.skinWeight as THREE.BufferAttribute
    if (!skinIndex || !skinWeight) return null

    // Find the bone index for the selected bone
    const boneIndex = skeleton.bones.findIndex((b) => b.name === selectedBoneName)
    if (boneIndex === -1) return null

    const vertexCount = geo.attributes.position.count
    const colors = new Float32Array(vertexCount * 3)

    // skinIndex.array can be Uint8Array, Uint16Array, or Float32Array
    // depending on the model — read via the generic typed array interface
    const skinIndexArr = skinIndex.array
    const skinWeightArr = skinWeight.array

    for (let i = 0; i < vertexCount; i++) {
      // Each vertex has up to 4 bone influences
      let totalWeight = 0
      for (let j = 0; j < 4; j++) {
        const boneIdx = skinIndexArr[i * 4 + j]
        const weight = skinWeightArr[i * 4 + j]
        if (Math.round(boneIdx) === boneIndex) {
          totalWeight += weight
        }
      }

      weightToColor(totalWeight, colorTmp)
      colors[i * 3] = colorTmp.r
      colors[i * 3 + 1] = colorTmp.g
      colors[i * 3 + 2] = colorTmp.b
    }

    // Clone geometry and add vertex colors
    const clonedGeo = geo.clone()
    clonedGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return clonedGeo
  }, [skinnedMesh, skeleton, selectedBoneName, visible, colorTmp])

  // Sync overlay position with the skinned mesh's world matrix each frame
  // so the weight overlay stays aligned with the animated mesh
  useFrame(() => {
    if (!meshRef.current || !skinnedMesh) return

    // Copy the skinned mesh's world transform so the overlay follows it
    skinnedMesh.updateWorldMatrix(true, false)
    meshRef.current.matrixAutoUpdate = false
    meshRef.current.matrix.copy(skinnedMesh.matrixWorld)
    meshRef.current.matrixWorldNeedsUpdate = true

    // Update vertex positions from the baked (skinned) geometry if available
    if (overlayGeometry && skinnedMesh.geometry) {
      const bakedPos = skinnedMesh.geometry.attributes.position
      const overlayPos = overlayGeometry.attributes.position
      if (bakedPos && overlayPos && bakedPos.count === overlayPos.count) {
        ;(overlayPos as THREE.BufferAttribute).copy(bakedPos as THREE.BufferAttribute)
        overlayPos.needsUpdate = true
      }
    }
  })

  if (!visible || !overlayGeometry || !skinnedMesh) return null

  return (
    <mesh
      ref={meshRef}
      geometry={overlayGeometry}
      renderOrder={999}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.85}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
})
