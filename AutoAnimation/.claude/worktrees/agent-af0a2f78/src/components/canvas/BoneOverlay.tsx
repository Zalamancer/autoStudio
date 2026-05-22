import { useRef, useEffect, useCallback, useState } from 'react'
import { useRigStore } from '@/stores/useRigStore'
import { computeJointWorldPositions } from '@/services/forwardKinematics'
import { renderBoneOverlay } from '@/services/meshRenderer'

interface BoneOverlayProps {
  canvasWidth: number
  canvasHeight: number
  /** Logical width of the video canvas (e.g. 1920) */
  logicalWidth: number
  /** Logical height of the video canvas (e.g. 1080) */
  logicalHeight: number
  /** Character top-left X in logical canvas coords */
  offsetX?: number
  /** Character top-left Y in logical canvas coords */
  offsetY?: number
  /** Character scaleX from group transform (default 1) */
  scaleX?: number
  /** Character scaleY from group transform (default 1) */
  scaleY?: number
}

/**
 * Interactive bone overlay rendered on a <canvas> on top of the character.
 * Shows joints as draggable circles and bone segments as lines.
 * Handles pointer events for joint selection and dragging.
 *
 * Coordinate pipeline:
 *   Joint rest positions are in IMAGE-PIXEL space (0..imageWidth, 0..imageHeight).
 *   We translate + scale them into LOGICAL CANVAS space (0..1920, 0..1080),
 *   then the ctx.scale(displayScale) maps logical → display pixels.
 */
export function BoneOverlay({
  canvasWidth,
  canvasHeight,
  logicalWidth,
  logicalHeight,
  offsetX = 0,
  offsetY = 0,
  scaleX: charScaleX = 1,
  scaleY: charScaleY = 1,
}: BoneOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredJointId, setHoveredJointId] = useState<string | null>(null)
  const dragStartRef = useRef<{
    jointId: string
    startDx: number
    startDy: number
    pointerX: number
    pointerY: number
  } | null>(null)

  const rig = useRigStore((s) => (s.activeRigId ? s.rigs[s.activeRigId] : null))
  const selectedJointId = useRigStore((s) => s.selectedJointId)
  const currentPose = useRigStore((s) => s.currentPose)
  const isRigMode = useRigStore((s) => s.isRigMode)
  const showBoneOverlay = useRigStore((s) => s.showBoneOverlay)

  // Display-pixel ↔ logical-pixel scale factors
  const displayScaleX = canvasWidth / logicalWidth
  const displayScaleY = canvasHeight / logicalHeight

  // ── Rendering ─────────────────────────────────────────────────────────
  const renderOverlay = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !rig || !currentPose) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!showBoneOverlay || rig.skeleton.joints.length === 0) return

    // Compute world positions (in image-pixel space)
    const worldPositions = computeJointWorldPositions(
      rig.skeleton,
      rig.restPose,
      currentPose,
    )

    // Transform: display-pixel ← logical ← image-pixel
    ctx.save()
    // Step 1: logical → display pixels
    ctx.scale(displayScaleX, displayScaleY)
    // Step 2: translate to character's top-left corner in logical space
    ctx.translate(offsetX, offsetY)
    // Step 3: apply character scale (image-pixel → logical within character bounds)
    ctx.scale(charScaleX, charScaleY)

    // Render with slightly larger joint radius for easier grabbing
    const jointRadius = Math.max(6, 8 / Math.max(charScaleX, charScaleY))
    renderBoneOverlay(ctx, rig.skeleton, worldPositions, selectedJointId, jointRadius, hoveredJointId)

    ctx.restore()
  }, [
    rig, currentPose, selectedJointId, showBoneOverlay,
    displayScaleX, displayScaleY, offsetX, offsetY,
    charScaleX, charScaleY, hoveredJointId,
  ])

  // Re-render overlay whenever relevant state changes
  useEffect(() => {
    renderOverlay()
  }, [renderOverlay])

  // Also run a RAF loop to keep overlay in sync during playback
  useEffect(() => {
    if (!isRigMode || !rig) return

    let animId: number
    const loop = () => {
      renderOverlay()
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [isRigMode, rig?.id, renderOverlay])

  // ── Pointer → image-pixel coordinate conversion ───────────────────────
  /** Convert pointer event coordinates to image-pixel space */
  const pointerToImagePixel = useCallback(
    (e: React.PointerEvent): { x: number; y: number } => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      // display-pixel → logical → image-pixel
      const logicalX = px / displayScaleX
      const logicalY = py / displayScaleY
      return {
        x: (logicalX - offsetX) / charScaleX,
        y: (logicalY - offsetY) / charScaleY,
      }
    },
    [displayScaleX, displayScaleY, offsetX, offsetY, charScaleX, charScaleY],
  )

  // ── Hit-test ──────────────────────────────────────────────────────────
  /** Scale hit radius inversely with character scale so joints stay easy to grab
   *  even when the character image is scaled down significantly (e.g. 0.225×). */
  const scaledHitRadius = Math.max(20, 24 / Math.max(charScaleX, charScaleY))

  /** Find the closest joint within a hit radius (in image-pixel space) */
  const findJointAtPoint = useCallback(
    (x: number, y: number, hitRadius: number = scaledHitRadius): string | null => {
      if (!rig || !currentPose) return null

      const worldPositions = computeJointWorldPositions(rig.skeleton, rig.restPose, currentPose)

      let closestId: string | null = null
      let closestDist = hitRadius

      for (const joint of rig.skeleton.joints) {
        const wp = worldPositions[joint.id]
        if (!wp) continue
        const dx = x - wp.worldX
        const dy = y - wp.worldY
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < closestDist) {
          closestDist = dist
          closestId = joint.id
        }
      }

      return closestId
    },
    [rig, currentPose, scaledHitRadius],
  )

  // ── Pointer handlers ──────────────────────────────────────────────────
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!rig || !currentPose) return
      e.stopPropagation()

      const pos = pointerToImagePixel(e)
      const jointId = findJointAtPoint(pos.x, pos.y)

      if (jointId) {
        useRigStore.getState().selectJoint(jointId)
        const jointPose = currentPose[jointId] || { dx: 0, dy: 0, rotation: 0 }
        dragStartRef.current = {
          jointId,
          startDx: jointPose.dx,
          startDy: jointPose.dy,
          pointerX: pos.x,
          pointerY: pos.y,
        }
        setIsDragging(true)
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } else {
        useRigStore.getState().selectJoint(null)
      }
    },
    [rig, currentPose, pointerToImagePixel, findJointAtPoint],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pos = pointerToImagePixel(e)

      if (isDragging && dragStartRef.current) {
        // Drag the joint — update its pose offset
        const { jointId, startDx, startDy, pointerX, pointerY } = dragStartRef.current
        const deltaPx = pos.x - pointerX
        const deltaPy = pos.y - pointerY

        useRigStore.getState().setJointPose(jointId, {
          dx: startDx + deltaPx,
          dy: startDy + deltaPy,
        })
      } else {
        // Hover detection — show grab cursor when over a joint
        const jointId = findJointAtPoint(pos.x, pos.y)
        setHoveredJointId(jointId)
      }
    },
    [isDragging, pointerToImagePixel, findJointAtPoint],
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(false)
      dragStartRef.current = null
      try {
        ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        // ignore if not captured
      }
    },
    [],
  )

  if (!isRigMode || !rig) return null

  // Dynamic cursor: grab when hovering a joint, grabbing when dragging
  const cursor = isDragging ? 'grabbing' : hoveredJointId ? 'grab' : 'crosshair'

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="absolute inset-0"
      style={{ zIndex: 100, cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  )
}
