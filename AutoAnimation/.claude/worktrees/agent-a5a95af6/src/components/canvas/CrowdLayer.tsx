import { useRef, useEffect, memo } from 'react'
import { useCrowdStore } from '@/stores/useCrowdStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useTimelineStore } from '@/stores'
import type { CrowdMember } from '@/services/crowdGenerator'

interface CrowdLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export const CrowdLayer = memo(function CrowdLayer({ canvasWidth, canvasHeight }: CrowdLayerProps) {
  const groups = useCrowdStore((s) => s.groups)
  const membersCache = useCrowdStore((s) => s.membersCache)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    const draw = () => {
      if (!running) return

      const { currentTime, fps } = usePlaybackStore.getState()
      const { fps: timelineFps } = useTimelineStore.getState()
      const effectiveFps = timelineFps || fps || 30
      const frame = Math.floor(currentTime * effectiveFps)

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      for (const group of groups) {
        if (!group.visible) continue
        if (frame < group.startFrame || frame >= group.endFrame) continue

        const members = membersCache[group.id]
        if (!members || members.length === 0) continue

        drawCrowdGroup(ctx, members, canvasWidth, canvasHeight, frame, effectiveFps)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [groups, membersCache, canvasWidth, canvasHeight])

  const hasVisibleGroups = groups.some((g) => g.visible)
  if (!hasVisibleGroups) return null

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 4,
      }}
    />
  )
})

// ── Drawing helpers ────────────────────────────────────────────────

function drawCrowdGroup(
  ctx: CanvasRenderingContext2D,
  members: CrowdMember[],
  canvasWidth: number,
  canvasHeight: number,
  frame: number,
  fps: number,
) {
  const t = frame / fps

  for (const member of members) {
    const sway = Math.sin(t * member.swaySpeed * 2 + member.swayPhase) * 3 * member.scale
    const bob = Math.sin(t * member.bobSpeed * 2 + member.bobPhase) * 2 * member.scale

    const cx = member.x * canvasWidth + sway
    const cy = member.y * canvasHeight + bob

    const baseSize = Math.min(canvasWidth, canvasHeight) * 0.025
    const s = baseSize * member.scale

    ctx.save()
    ctx.globalAlpha = member.opacity

    // Body (rounded rectangle)
    const bodyW = s * 0.9
    const bodyH = s * 1.4 * member.heightRatio
    const bodyX = cx - bodyW / 2
    const bodyY = cy - bodyH * 0.3

    ctx.fillStyle = member.outfitColor
    ctx.beginPath()
    ctx.roundRect(bodyX, bodyY, bodyW, bodyH, s * 0.2)
    ctx.fill()

    // Head (ellipse)
    const headR = s * 0.35
    const headY = bodyY - headR * 0.6

    ctx.fillStyle = member.skinColor
    ctx.beginPath()
    ctx.ellipse(cx, headY, headR, headR * 1.1, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
