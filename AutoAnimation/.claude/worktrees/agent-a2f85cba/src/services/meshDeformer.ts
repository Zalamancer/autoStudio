import type { MeshData, BoneSkeleton, BonePose, VertexSkinning, SkinWeight } from '@/types/rig'
import { computeJointWorldPositions, getBoneSegment } from './forwardKinematics'

/**
 * Per-bone-category influence radius multipliers.
 * Smaller body parts (fingers, head) get tighter envelopes to prevent bleed.
 * Larger body parts (torso, legs) get wider envelopes for smoother deformation.
 */
const CATEGORY_RADIUS_MULTIPLIER: Record<string, number> = {
  'root': 1.2,
  'torso': 1.0,
  'head': 0.6,
  'arm-left': 0.75,
  'arm-right': 0.75,
  'hand-left': 0.35,
  'hand-right': 0.35,
  'leg-left': 0.8,
  'leg-right': 0.8,
  'tail': 0.5,
  'other': 0.6,
}

/**
 * Compute skinning weights for each mesh vertex based on distance to bone segments.
 * Uses cubic falloff (matches bonerigging core) for sharp, clean weight boundaries.
 * Max 4 influences per vertex for performance.
 *
 * Features:
 * - Body-part-aware influence radius: fingers/head get tighter envelopes
 * - Alpha-barrier checking: transparent gaps prevent cross-body-part influence
 * - Smooth fallback: vertices outside all envelopes get extended-radius soft binding
 *   instead of a hard 100% snap to the nearest bone
 */
export function computeSkinningWeights(
  mesh: MeshData,
  skeleton: BoneSkeleton,
  influenceRadius?: number,
  imageData?: ImageData
): VertexSkinning {
  // Default influence radius scales with image size so weights blend smoothly
  // even for large images (e.g. 2160×3840).
  if (influenceRadius === undefined) {
    const imgDiag = Math.sqrt(mesh.imageWidth ** 2 + mesh.imageHeight ** 2)
    influenceRadius = Math.max(80, imgDiag * 0.18)
  }
  const restPose: BonePose = {}
  for (const joint of skeleton.joints) {
    restPose[joint.id] = { dx: 0, dy: 0, rotation: 0 }
  }

  const worldPositions = computeJointWorldPositions(skeleton, restPose, restPose)

  // Build a joint category lookup for per-bone radius scaling
  const jointCategory: Record<string, string> = {}
  for (const joint of skeleton.joints) {
    jointCategory[joint.id] = joint.category || 'other'
  }

  // Build bone segments (parent→child line segments) with per-bone radius
  const segments: { jointId: string; sx: number; sy: number; ex: number; ey: number; radius: number }[] = []
  for (const joint of skeleton.joints) {
    const seg = getBoneSegment(joint.id, skeleton, worldPositions)
    if (seg) {
      const cat = jointCategory[joint.id] || 'other'
      const mul = CATEGORY_RADIUS_MULTIPLIER[cat] ?? 0.6
      segments.push({
        jointId: joint.id,
        sx: seg.startX,
        sy: seg.startY,
        ex: seg.endX,
        ey: seg.endY,
        radius: influenceRadius * mul,
      })
    }
  }

  // For root joint (no segment), use point distance
  const rootWorld = worldPositions[skeleton.rootJointId]

  const skinning: VertexSkinning = []

  for (const vertex of mesh.vertices) {
    const weights: { jointId: string; dist: number; boneRadius: number }[] = []

    // Distance to each bone segment
    for (const seg of segments) {
      // If we have alpha data, check for transparent barrier between vertex and bone
      if (imageData && hasTransparentBarrier(
        vertex.restX, vertex.restY,
        nearestPointOnSegment(vertex.restX, vertex.restY, seg.sx, seg.sy, seg.ex, seg.ey),
        imageData
      )) {
        continue // skip — transparent gap means this bone shouldn't influence this vertex
      }

      const dist = pointToSegmentDistance(
        vertex.restX, vertex.restY,
        seg.sx, seg.sy, seg.ex, seg.ey
      )
      weights.push({ jointId: seg.jointId, dist, boneRadius: seg.radius })
    }

    // Distance to root joint (point)
    if (rootWorld) {
      const shouldSkipRoot = imageData && hasTransparentBarrier(
        vertex.restX, vertex.restY,
        { x: rootWorld.worldX, y: rootWorld.worldY },
        imageData
      )
      if (!shouldSkipRoot) {
        const dx = vertex.restX - rootWorld.worldX
        const dy = vertex.restY - rootWorld.worldY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (!weights.some((w) => w.jointId === skeleton.rootJointId)) {
          const cat = jointCategory[skeleton.rootJointId] || 'root'
          const mul = CATEGORY_RADIUS_MULTIPLIER[cat] ?? 1.0
          weights.push({ jointId: skeleton.rootJointId, dist, boneRadius: influenceRadius * mul })
        }
      }
    }

    // Sort by distance (closest first) and take top 4
    weights.sort((a, b) => a.dist - b.dist)
    const topWeights = weights.slice(0, 4)

    // Convert distances to weights using cubic falloff (matches bonerigging core)
    const skinWeights: SkinWeight[] = []
    let totalWeight = 0

    for (const w of topWeights) {
      const normalized = Math.max(0, 1 - w.dist / w.boneRadius)
      // Cubic falloff: sharper transitions at bone boundaries, smoother near bone center
      const weight = normalized * normalized * normalized
      if (weight > 0.001) {
        skinWeights.push({ jointId: w.jointId, weight })
        totalWeight += weight
      }
    }

    // Smooth fallback: if no bones within their envelopes, use an extended radius
    // with quadratic falloff to avoid hard-edge snapping to a single bone
    if (totalWeight === 0 && topWeights.length > 0) {
      const extendedRadius = influenceRadius * 2.5
      for (const w of topWeights) {
        const normalized = Math.max(0, 1 - w.dist / extendedRadius)
        const weight = normalized * normalized
        if (weight > 0.0001) {
          skinWeights.push({ jointId: w.jointId, weight })
          totalWeight += weight
        }
      }
    }

    // Normalize weights to sum to 1
    if (totalWeight > 0) {
      for (const sw of skinWeights) {
        sw.weight /= totalWeight
      }
    } else if (topWeights.length > 0) {
      // Last resort: bind to closest joint
      skinWeights.push({ jointId: topWeights[0].jointId, weight: 1 })
    }

    skinning.push(skinWeights)
  }

  return skinning
}

/**
 * Deform mesh vertices using Linear Blend Skinning (LBS).
 * Mutates the deformedX/deformedY fields of each vertex in-place.
 */
export function deformMesh(
  mesh: MeshData,
  skinning: VertexSkinning,
  skeleton: BoneSkeleton,
  restPose: BonePose,
  currentPose: BonePose
): void {
  const restWorldPositions = computeJointWorldPositions(skeleton, restPose, restPose)
  const currentWorldPositions = computeJointWorldPositions(skeleton, restPose, currentPose)

  const DEG_TO_RAD = Math.PI / 180

  for (let i = 0; i < mesh.vertices.length; i++) {
    const vertex = mesh.vertices[i]
    const weights = skinning[i]

    if (!weights || weights.length === 0) {
      vertex.deformedX = vertex.restX
      vertex.deformedY = vertex.restY
      continue
    }

    let finalX = 0
    let finalY = 0

    for (const sw of weights) {
      const restJoint = restWorldPositions[sw.jointId]
      const curJoint = currentWorldPositions[sw.jointId]
      if (!restJoint || !curJoint) continue

      // Vector from rest joint position to vertex rest position
      const dx = vertex.restX - restJoint.worldX
      const dy = vertex.restY - restJoint.worldY

      // Rotate this vector by the joint's rotation delta
      const rotDelta = (curJoint.worldRotation - restJoint.worldRotation) * DEG_TO_RAD
      const cos = Math.cos(rotDelta)
      const sin = Math.sin(rotDelta)
      const rotatedX = dx * cos - dy * sin
      const rotatedY = dx * sin + dy * cos

      // Translate to current joint world position
      const transformedX = curJoint.worldX + rotatedX
      const transformedY = curJoint.worldY + rotatedY

      finalX += transformedX * sw.weight
      finalY += transformedY * sw.weight
    }

    vertex.deformedX = finalX
    vertex.deformedY = finalY
  }
}

/** Distance from point (px, py) to line segment (sx, sy)→(ex, ey) */
function pointToSegmentDistance(
  px: number, py: number,
  sx: number, sy: number,
  ex: number, ey: number
): number {
  const dx = ex - sx
  const dy = ey - sy
  const lenSq = dx * dx + dy * dy

  if (lenSq === 0) {
    // Segment is a point
    const ddx = px - sx
    const ddy = py - sy
    return Math.sqrt(ddx * ddx + ddy * ddy)
  }

  let t = ((px - sx) * dx + (py - sy) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))

  const closestX = sx + t * dx
  const closestY = sy + t * dy
  const ddx = px - closestX
  const ddy = py - closestY
  return Math.sqrt(ddx * ddx + ddy * ddy)
}

/** Find nearest point on a segment to (px, py), returned as {x, y}. */
function nearestPointOnSegment(
  px: number, py: number,
  sx: number, sy: number,
  ex: number, ey: number
): { x: number; y: number } {
  const dx = ex - sx
  const dy = ey - sy
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return { x: sx, y: sy }
  let t = ((px - sx) * dx + (py - sy) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return { x: sx + t * dx, y: sy + t * dy }
}

/**
 * Check if there's a transparent barrier in the image between a vertex and a bone point.
 * Traces a line from (vx, vy) to (target.x, target.y) and checks if any sampled
 * pixel along the line has alpha below threshold. A run of consecutive transparent
 * samples indicates a gap between body parts.
 *
 * Sampling interval adapts to image resolution: ~1px steps for small images,
 * up to ~3px for 4K+ images. This prevents missing thin transparent gaps on
 * high-res images while keeping performance reasonable.
 */
function hasTransparentBarrier(
  vx: number, vy: number,
  target: { x: number; y: number },
  imageData: ImageData
): boolean {
  const { data, width, height } = imageData
  const dx = target.x - vx
  const dy = target.y - vy
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 2) return false // too close to check

  // Adaptive sampling: higher resolution for smaller images, capped for large ones
  // Small (<512px diagonal): ~1px steps, Large (4K+): ~3px steps
  const imgDiag = Math.sqrt(width * width + height * height)
  const sampleInterval = Math.max(1, Math.min(3, imgDiag / 1024))
  const steps = Math.max(3, Math.ceil(dist / sampleInterval))

  const alphaThreshold = 12
  // Minimum consecutive transparent samples to confirm a barrier.
  // Scale with sampling density: finer sampling needs longer runs to avoid
  // triggering on semi-transparent anti-aliased edges.
  const minBarrierRun = sampleInterval < 1.5 ? 4 : 3
  let transparentRun = 0

  for (let i = 1; i < steps; i++) { // skip endpoints
    const t = i / steps
    const sx = Math.round(vx + dx * t)
    const sy = Math.round(vy + dy * t)
    if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue

    const alpha = data[(sy * width + sx) * 4 + 3]
    if (alpha < alphaThreshold) {
      transparentRun++
      if (transparentRun >= minBarrierRun) return true
    } else {
      transparentRun = 0
    }
  }

  return false
}
