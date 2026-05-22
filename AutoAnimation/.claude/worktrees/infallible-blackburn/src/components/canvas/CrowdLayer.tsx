import { useRef, useEffect, useCallback, memo } from 'react'
import { useCrowdStore, getSpriteBitmaps } from '@/stores/useCrowdStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useEditorStore, useTimelineStore } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { preRenderCrowdSprites, variantKey } from '@/services/crowdSpriteRenderer'
import { setSpriteBitmaps } from '@/stores/useCrowdStore'
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
  const hitTargetsRef = useRef<{ gx: number; gy: number; groupId: string }[]>([])

  // ── Pre-render character sprites when groups change ──
  // Handles async hydration: if character isn't hydrated yet, hydrates it first,
  // then regenerates members (so they get spriteSelections), then pre-renders.
  useEffect(() => {
    let cancelled = false

    async function renderSprites() {
      for (const group of groups) {
        if (!group.characterId) continue

        const store = useSavedCharactersStore.getState()
        let character = store.characters.find((c) => c.id === group.characterId)

        // Ensure the character is hydrated (bodyParts loaded from IndexedDB)
        if (character && !character._hydrated) {
          await store.hydrateCharacter(character.id)
          if (cancelled) return
          character = useSavedCharactersStore.getState().characters.find((c) => c.id === group.characterId)
        }

        if (!character?.bodyParts) continue

        // Check if members have spriteSelections — if not, regenerate them
        // (happens when character was assigned before hydration completed)
        let members = membersCache[group.id]
        const hasSpriteSelections = members?.some((m) => m.spriteSelections)

        if (!hasSpriteSelections) {
          // Re-trigger generation now that character is hydrated — store will pick up bodyParts
          // Pass characterId again so needsRegen fires without changing the seed
          useCrowdStore.getState().updateGroup(group.id, { characterId: group.characterId })
          if (cancelled) return
          // Re-read the freshly generated members
          members = useCrowdStore.getState().membersCache[group.id]
        }

        if (!members) continue

        const selections = members.filter((m) => m.spriteSelections).map((m) => m.spriteSelections!)

        if (selections.length === 0) continue

        const bitmaps = await preRenderCrowdSprites(character, selections)
        if (!cancelled) {
          setSpriteBitmaps(group.id, bitmaps)
        }
      }
    }

    renderSprites()
    return () => {
      cancelled = true
    }
  }, [groups, membersCache])

  // ── Animation loop ──
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

      // Build hit targets during draw for click-to-select
      const hitTargets: { gx: number; gy: number; groupId: string }[] = []

      for (const group of groups) {
        if (!group.visible) continue
        if (frame < group.startFrame || frame >= group.endFrame) continue

        const members = membersCache[group.id]
        if (!members || members.length === 0) continue

        // Collect hit targets for this group
        const t = frame / effectiveFps
        for (const member of members) {
          const sway = Math.sin(t * member.swaySpeed * 2 + member.swayPhase) * 3 * member.scale
          const bob = Math.sin(t * member.bobSpeed * 2 + member.bobPhase) * 2 * member.scale
          hitTargets.push({
            gx: member.x * canvasWidth + sway,
            gy: member.y * canvasHeight + bob,
            groupId: group.id,
          })
        }

        const bitmaps = getSpriteBitmaps(group.id)
        drawCrowdGroup(ctx, members, canvasWidth, canvasHeight, frame, effectiveFps, bitmaps)
      }

      hitTargetsRef.current = hitTargets
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [groups, membersCache, canvasWidth, canvasHeight])

  // ── Click-to-select handler ──
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    const HIT_THRESHOLD = 20
    let closest: { groupId: string; dist: number } | null = null

    for (const target of hitTargetsRef.current) {
      const dx = clickX - target.gx
      const dy = clickY - target.gy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < HIT_THRESHOLD && (!closest || dist < closest.dist)) {
        closest = { groupId: target.groupId, dist }
      }
    }

    if (closest) {
      useCrowdStore.getState().setSelectedGroupId(closest.groupId)
      useEditorStore.getState().setRightPanelTab('crowd-properties')
    }
  }, [])

  const hasVisibleGroups = groups.some((g) => g.visible)
  if (!hasVisibleGroups) return null

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={handleCanvasClick}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 4,
        cursor: 'pointer',
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
  spriteBitmaps?: Map<string, ImageBitmap>,
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

    // Try character sprite first
    if (member.spriteSelections && spriteBitmaps) {
      const key = variantKey(member.spriteSelections)
      const bitmap = spriteBitmaps.get(key)
      if (bitmap) {
        const spriteW = s * 2.2
        const spriteH = s * 2.2
        ctx.drawImage(bitmap, cx - spriteW / 2, cy - spriteH * 0.6, spriteW, spriteH)
        ctx.restore()
        continue
      }
    }

    // Fallback: silhouette
    const bodyW = s * 0.9
    const bodyH = s * 1.4 * member.heightRatio
    const bodyX = cx - bodyW / 2
    const bodyY = cy - bodyH * 0.3

    ctx.fillStyle = member.outfitColor
    ctx.beginPath()
    ctx.roundRect(bodyX, bodyY, bodyW, bodyH, s * 0.2)
    ctx.fill()

    const headR = s * 0.35
    const headY = bodyY - headR * 0.6

    ctx.fillStyle = member.skinColor
    ctx.beginPath()
    ctx.ellipse(cx, headY, headR, headR * 1.1, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
