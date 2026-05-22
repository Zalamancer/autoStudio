/**
 * Face mesh detection utility for DecalGeometry projection.
 * Detects the head/face mesh from a loaded GLB scene and estimates
 * anatomical anchor points for eye, eyebrow, and mouth overlays.
 */
import * as THREE from 'three'

export interface FaceMeshResult {
  /** The face/head mesh to project onto */
  mesh: THREE.Mesh
  /** Estimated eye center in local space */
  eyeAnchor: THREE.Vector3
  /** Estimated eyebrow center in local space */
  eyebrowAnchor: THREE.Vector3
  /** Estimated mouth center in local space */
  mouthAnchor: THREE.Vector3
}

/**
 * Detect the head/face mesh from a loaded GLB scene for DecalGeometry projection.
 *
 * Strategy:
 * 1. Find SkinnedMesh objects whose skeleton contains the Head bone
 * 2. If multiple, pick the one whose bounding box center is closest to Head bone position
 * 3. If no SkinnedMesh found, find any Mesh nearest to head bone
 * 4. Estimate anatomical anchors from head bone position
 * 5. Return null if no suitable mesh found (triggers curved-plane fallback)
 */
export function detectFaceMesh(
  scene: THREE.Object3D,
  headBone: THREE.Object3D | null
): FaceMeshResult | null {
  if (!headBone) return null

  headBone.updateWorldMatrix(true, false)
  const headWorldPos = new THREE.Vector3()
  headBone.getWorldPosition(headWorldPos)

  // Pass 1: SkinnedMesh objects whose skeleton references the Head bone
  const skinnedCandidates: THREE.SkinnedMesh[] = []
  scene.traverse((obj) => {
    if (obj instanceof THREE.SkinnedMesh || (obj as any).isSkinnedMesh) {
      const sm = obj as THREE.SkinnedMesh
      if (sm.skeleton) {
        const hasHeadBone = sm.skeleton.bones.some(
          (b) => b === headBone || b.name === headBone.name
        )
        if (hasHeadBone) {
          skinnedCandidates.push(sm)
        }
      }
    }
  })

  let targetMesh: THREE.Mesh | null = null

  if (skinnedCandidates.length === 1) {
    targetMesh = skinnedCandidates[0]
  } else if (skinnedCandidates.length > 1) {
    // Pick the one closest to head bone position
    let bestDist = Infinity
    for (const sm of skinnedCandidates) {
      const box = new THREE.Box3().setFromObject(sm)
      const center = new THREE.Vector3()
      box.getCenter(center)
      const dist = center.distanceTo(headWorldPos)
      if (dist < bestDist) {
        bestDist = dist
        targetMesh = sm
      }
    }
  }

  // Pass 2: If no SkinnedMesh found, try any Mesh nearest to head bone
  if (!targetMesh) {
    let bestDist = Infinity
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.geometry) {
        const box = new THREE.Box3().setFromObject(obj)
        const center = new THREE.Vector3()
        box.getCenter(center)
        const dist = center.distanceTo(headWorldPos)
        if (dist < bestDist) {
          bestDist = dist
          targetMesh = obj
        }
      }
    })
  }

  if (!targetMesh) return null

  // Estimate anatomical anchors relative to head bone position.
  // These are in world space — callers should transform as needed.
  // Proportions based on humanoid head (~0.25 units tall at normalized 1.8 scale):
  // - Eyes: ~6% of total height above head bone origin
  // - Eyebrows: ~8% above head bone origin
  // - Mouth: ~4% below head bone origin
  const headHeight = 0.25 // approximate head height in normalized units

  const headWorldQuat = new THREE.Quaternion()
  headBone.getWorldQuaternion(headWorldQuat)

  const upDir = new THREE.Vector3(0, 1, 0).applyQuaternion(headWorldQuat)
  const fwdDir = new THREE.Vector3(0, 0, 1).applyQuaternion(headWorldQuat)

  const eyeAnchor = headWorldPos.clone()
    .add(upDir.clone().multiplyScalar(headHeight * 0.24))
    .add(fwdDir.clone().multiplyScalar(headHeight * 0.08))

  const eyebrowAnchor = headWorldPos.clone()
    .add(upDir.clone().multiplyScalar(headHeight * 0.32))
    .add(fwdDir.clone().multiplyScalar(headHeight * 0.08))

  const mouthAnchor = headWorldPos.clone()
    .add(upDir.clone().multiplyScalar(headHeight * -0.16))
    .add(fwdDir.clone().multiplyScalar(headHeight * 0.08))

  return {
    mesh: targetMesh,
    eyeAnchor,
    eyebrowAnchor,
    mouthAnchor,
  }
}
