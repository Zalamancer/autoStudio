import type { MeshData, BoneSkeleton } from '@/types/rig'
import type { JointWorldState } from './forwardKinematics'

/**
 * Render a deformed mesh to a Canvas 2D context using per-triangle
 * affine transform + clip. The source image is sampled via its UV coordinates.
 */
export function renderMeshToCanvas(
  ctx: CanvasRenderingContext2D,
  mesh: MeshData,
  textureImage: HTMLImageElement | HTMLCanvasElement
): void {
  const { vertices, triangles } = mesh
  const imgW = textureImage.width
  const imgH = textureImage.height

  for (const tri of triangles) {
    const v0 = vertices[tri.a]
    const v1 = vertices[tri.b]
    const v2 = vertices[tri.c]

    // Source triangle in texture space (pixels)
    const srcX0 = v0.u * imgW
    const srcY0 = v0.v * imgH
    const srcX1 = v1.u * imgW
    const srcY1 = v1.v * imgH
    const srcX2 = v2.u * imgW
    const srcY2 = v2.v * imgH

    // Destination triangle in deformed space
    const dstX0 = v0.deformedX
    const dstY0 = v0.deformedY
    const dstX1 = v1.deformedX
    const dstY1 = v1.deformedY
    const dstX2 = v2.deformedX
    const dstY2 = v2.deformedY

    // Compute affine transform mapping src triangle → dst triangle
    const transform = computeAffineTransform(
      srcX0, srcY0, srcX1, srcY1, srcX2, srcY2,
      dstX0, dstY0, dstX1, dstY1, dstX2, dstY2
    )

    if (!transform) continue

    ctx.save()

    // Clip to destination triangle
    ctx.beginPath()
    ctx.moveTo(dstX0, dstY0)
    ctx.lineTo(dstX1, dstY1)
    ctx.lineTo(dstX2, dstY2)
    ctx.closePath()
    ctx.clip()

    // Apply affine transform and draw full image
    ctx.setTransform(
      transform.a, transform.b,
      transform.c, transform.d,
      transform.e, transform.f
    )
    ctx.drawImage(textureImage, 0, 0)

    ctx.restore()
  }
}

/**
 * Draw the mesh wireframe for debugging.
 */
export function renderMeshWireframe(
  ctx: CanvasRenderingContext2D,
  mesh: MeshData,
  color: string = 'rgba(0, 200, 255, 0.3)',
  lineWidth: number = 0.5
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth

  for (const tri of mesh.triangles) {
    const v0 = mesh.vertices[tri.a]
    const v1 = mesh.vertices[tri.b]
    const v2 = mesh.vertices[tri.c]

    ctx.beginPath()
    ctx.moveTo(v0.deformedX, v0.deformedY)
    ctx.lineTo(v1.deformedX, v1.deformedY)
    ctx.lineTo(v2.deformedX, v2.deformedY)
    ctx.closePath()
    ctx.stroke()
  }
}

/**
 * Draw bone segments and joint circles on the canvas.
 */
export function renderBoneOverlay(
  ctx: CanvasRenderingContext2D,
  skeleton: BoneSkeleton,
  worldPositions: Record<string, JointWorldState>,
  selectedJointId: string | null = null,
  jointRadius: number = 6,
  hoveredJointId: string | null = null,
): void {

  // Draw bone segments (lines from parent to child)
  ctx.lineWidth = 3
  for (const joint of skeleton.joints) {
    if (!joint.parentId) continue
    const parentWorld = worldPositions[joint.parentId]
    const childWorld = worldPositions[joint.id]
    if (!parentWorld || !childWorld) continue

    const color = joint.color || getCategoryColor(joint.category)
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.8

    ctx.beginPath()
    ctx.moveTo(parentWorld.worldX, parentWorld.worldY)
    ctx.lineTo(childWorld.worldX, childWorld.worldY)
    ctx.stroke()
  }

  // Draw joint circles
  ctx.globalAlpha = 1
  for (const joint of skeleton.joints) {
    const world = worldPositions[joint.id]
    if (!world) continue

    const isSelected = joint.id === selectedJointId
    const isHovered = joint.id === hoveredJointId
    const color = joint.color || getCategoryColor(joint.category)
    const radius = isSelected ? jointRadius + 3 : isHovered ? jointRadius + 2 : jointRadius

    // Glow effect for hovered joint
    if (isHovered && !isSelected) {
      ctx.beginPath()
      ctx.arc(world.worldX, world.worldY, radius + 4, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(59, 130, 246, 0.25)' // blue glow
      ctx.fill()
    }

    // Outer ring
    ctx.beginPath()
    ctx.arc(world.worldX, world.worldY, radius, 0, Math.PI * 2)
    ctx.fillStyle = isSelected ? '#ffffff' : isHovered ? '#93c5fd' : color
    ctx.fill()
    ctx.strokeStyle = isSelected ? '#22c55e' : isHovered ? '#3b82f6' : '#000000'
    ctx.lineWidth = isSelected ? 3 : isHovered ? 2.5 : 1.5
    ctx.stroke()

    // Inner dot
    ctx.beginPath()
    ctx.arc(world.worldX, world.worldY, 2, 0, Math.PI * 2)
    ctx.fillStyle = isSelected ? '#22c55e' : isHovered ? '#3b82f6' : '#000000'
    ctx.fill()

    // Joint name label for selected joint
    if (isSelected) {
      ctx.font = `bold ${Math.max(10, jointRadius * 1.5)}px sans-serif`
      ctx.fillStyle = '#22c55e'
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.strokeText(joint.name || joint.id, world.worldX + radius + 4, world.worldY - radius - 2)
      ctx.fillText(joint.name || joint.id, world.worldX + radius + 4, world.worldY - radius - 2)
    }
  }

  ctx.globalAlpha = 1
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'root': return '#ef4444'
    case 'torso': return '#f97316'
    case 'head': return '#eab308'
    case 'arm-left': return '#22c55e'
    case 'arm-right': return '#06b6d4'
    case 'hand-left': return '#4ade80'
    case 'hand-right': return '#22d3ee'
    case 'leg-left': return '#8b5cf6'
    case 'leg-right': return '#ec4899'
    case 'tail': return '#a855f7'
    default: return '#94a3b8'
  }
}

/**
 * Compute a 2D affine transform matrix that maps three source points to three destination points.
 * Returns the 6 matrix coefficients (a, b, c, d, e, f) for ctx.setTransform().
 *
 * Maps: (srcX0, srcY0) → (dstX0, dstY0), etc.
 */
export function computeAffineTransform(
  srcX0: number, srcY0: number,
  srcX1: number, srcY1: number,
  srcX2: number, srcY2: number,
  dstX0: number, dstY0: number,
  dstX1: number, dstY1: number,
  dstX2: number, dstY2: number
): { a: number; b: number; c: number; d: number; e: number; f: number } | null {
  // Solve the linear system for the affine transform
  const det = (srcX0 - srcX2) * (srcY1 - srcY2) - (srcX1 - srcX2) * (srcY0 - srcY2)
  if (Math.abs(det) < 1e-10) return null

  const invDet = 1 / det

  const a = ((dstX0 - dstX2) * (srcY1 - srcY2) - (dstX1 - dstX2) * (srcY0 - srcY2)) * invDet
  const b = ((dstY0 - dstY2) * (srcY1 - srcY2) - (dstY1 - dstY2) * (srcY0 - srcY2)) * invDet
  const c = ((dstX1 - dstX2) * (srcX0 - srcX2) - (dstX0 - dstX2) * (srcX1 - srcX2)) * invDet
  const d = ((dstY1 - dstY2) * (srcX0 - srcX2) - (dstY0 - dstY2) * (srcX1 - srcX2)) * invDet
  const e = dstX2 - a * srcX2 - c * srcY2
  const f = dstY2 - b * srcX2 - d * srcY2

  return { a, b, c, d, e, f }
}
