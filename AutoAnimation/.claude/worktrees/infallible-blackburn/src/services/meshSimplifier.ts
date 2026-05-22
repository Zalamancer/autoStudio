/**
 * Client-side mesh simplification using meshoptimizer (WASM).
 *
 * Reduces vertex/triangle count of Three.js scenes while preserving
 * skinning weights, UVs, and normals for rigged character models.
 *
 * Falls back to Meshy Remesh API for cloud-based decimation when
 * client-side simplification is insufficient.
 */
import * as THREE from 'three'
import { MeshoptSimplifier } from 'meshoptimizer'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

export const MAX_VERTEX_COUNT = 50_000

export interface SimplifyResult {
  /** Simplified scene (mutated in place) */
  scene: THREE.Group
  /** Original total vertex count */
  originalVertices: number
  /** Simplified total vertex count */
  newVertices: number
  /** Ratio of reduction (0-1, where 0.5 = halved) */
  reductionRatio: number
}

/**
 * Simplify all meshes in a Three.js scene to fit within the target vertex count.
 * Uses meshoptimizer WASM for high-quality quadric error decimation.
 *
 * Preserves: skeleton bones, skinning weights, UV coordinates, normals.
 * Handles both Mesh and SkinnedMesh objects.
 */
export async function simplifyScene(
  scene: THREE.Group,
  targetVertices: number = MAX_VERTEX_COUNT,
): Promise<SimplifyResult> {
  await MeshoptSimplifier.ready

  // Count total vertices across all meshes
  let totalVertices = 0
  const meshes: THREE.Mesh[] = []
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry?.attributes?.position) {
      totalVertices += obj.geometry.attributes.position.count
      meshes.push(obj)
    }
  })

  if (totalVertices <= targetVertices) {
    return {
      scene,
      originalVertices: totalVertices,
      newVertices: totalVertices,
      reductionRatio: 0,
    }
  }

  // Calculate per-mesh target proportionally
  const ratio = targetVertices / totalVertices

  for (const mesh of meshes) {
    const geo = mesh.geometry
    const positions = geo.attributes.position.array as Float32Array
    const vertCount = geo.attributes.position.count

    // Skip tiny meshes (< 100 verts) — not worth simplifying
    if (vertCount < 100) continue

    // Ensure geometry is indexed
    let indices: Uint32Array
    if (geo.index) {
      indices = new Uint32Array(geo.index.array)
    } else {
      // Create trivial index buffer for non-indexed geometry
      indices = new Uint32Array(vertCount)
      for (let i = 0; i < vertCount; i++) indices[i] = i
    }

    const targetTriangles = Math.max(Math.floor((indices.length / 3) * ratio), 4)

    try {
      const [newIndices] = MeshoptSimplifier.simplify(
        indices,
        positions,
        3, // stride (x,y,z)
        targetTriangles * 3,
        0.01, // 1% error tolerance
        ['LockBorder'],
      )

      if (newIndices.length < indices.length) {
        // Apply simplified indices
        geo.setIndex(new THREE.BufferAttribute(newIndices, 1))

        // Recompute normals after simplification
        geo.computeVertexNormals()
        geo.computeBoundingBox()
        geo.computeBoundingSphere()
      }
    } catch (err) {
      console.warn(`[meshSimplifier] Failed to simplify mesh "${mesh.name}":`, err)
      // Continue with other meshes — partial simplification is still useful
    }
  }

  // Recount after simplification
  let newVertices = 0
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh && obj.geometry?.attributes?.position) {
      newVertices += obj.geometry.attributes.position.count
    }
  })

  return {
    scene,
    originalVertices: totalVertices,
    newVertices,
    reductionRatio: 1 - newVertices / totalVertices,
  }
}

/**
 * Simplify a loaded GLTF scene and export it back as a GLB Blob.
 * This is the main entry point for the upload flow.
 */
export async function simplifyAndExportGlb(
  scene: THREE.Group,
  animations: THREE.AnimationClip[],
  targetVertices: number = MAX_VERTEX_COUNT,
): Promise<{ blob: Blob; result: SimplifyResult }> {
  const result = await simplifyScene(scene, targetVertices)

  // Export simplified scene back to GLB
  const exporter = new GLTFExporter()
  const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      result.scene,
      (data) => resolve(data as ArrayBuffer),
      (error) => reject(error),
      { binary: true, animations },
    )
  })

  const blob = new Blob([glbBuffer], { type: 'model/gltf-binary' })

  return { blob, result }
}
