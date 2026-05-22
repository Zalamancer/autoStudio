/**
 * Shared Three.js face utilities used by VisemeFacePlane3D and ExpressionFacePlane3D.
 */
import * as THREE from 'three'

/**
 * Creates a cylindrically-curved plane geometry that wraps around a face-like surface.
 * @param widthSegs - horizontal segments (more = smoother curve)
 * @param heightSegs - vertical segments
 * @param curvature - 0 = flat, 1 = half-cylinder wrap. 0.3-0.5 works well for a face.
 */
export function createCurvedPlaneGeometry(
  widthSegs = 16,
  heightSegs = 8,
  curvature = 0.4
): THREE.BufferGeometry {
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

/**
 * Finds a head bone/object by trying multiple naming conventions.
 * Supports: Bone objects, regular Object3D nodes, and fuzzy name matching.
 */
export function findHeadBone(scene: THREE.Object3D, primaryName: string): THREE.Object3D | null {
  const namesToTry = [
    primaryName, 'Head', 'head', 'mixamorig:Head',
    'mixamorig_Head', 'Bip01_Head', 'head_JNT',
  ]

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
    if (!fallbackBone && (obj as THREE.Bone).isBone && obj.name.toLowerCase().includes('head'))
      fallbackBone = obj
  })
  if (fallbackBone) return fallbackBone

  // Pass 4: fuzzy any object
  let fallbackObj: THREE.Object3D | null = null
  scene.traverse((obj) => {
    if (!fallbackObj && obj.name.toLowerCase().includes('head'))
      fallbackObj = obj
  })
  return fallbackObj
}
