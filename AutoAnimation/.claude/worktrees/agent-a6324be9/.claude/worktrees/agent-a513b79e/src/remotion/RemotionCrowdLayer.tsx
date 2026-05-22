import { useFrame } from '@/engine'
import type { CrowdExportData } from './types'

interface RemotionCrowdLayerProps {
  crowdGroups: CrowdExportData[]
  canvasWidth: number
  canvasHeight: number
  fps: number
}

export function RemotionCrowdLayer({
  crowdGroups,
  canvasWidth,
  canvasHeight,
  fps,
}: RemotionCrowdLayerProps) {
  const frame = useFrame()

  return (
    <>
      {crowdGroups.map((group) => {
        if (!group.visible) return null
        if (frame < group.startFrame || frame >= group.endFrame) return null

        return (
          <RemotionCrowdGroup
            key={group.id}
            group={group}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            fps={fps}
            frame={frame}
          />
        )
      })}
    </>
  )
}

function RemotionCrowdGroup({
  group,
  canvasWidth,
  canvasHeight,
  fps,
  frame,
}: {
  group: CrowdExportData
  canvasWidth: number
  canvasHeight: number
  fps: number
  frame: number
}) {
  const t = frame / fps

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight,
        pointerEvents: 'none',
        zIndex: 4,
      }}
    >
      {group.members.map((member, i) => {
        const sway = Math.sin(t * member.swaySpeed * 2 + member.swayPhase) * 3 * member.scale
        const bob = Math.sin(t * member.bobSpeed * 2 + member.bobPhase) * 2 * member.scale

        const cx = member.x * canvasWidth + sway
        const cy = member.y * canvasHeight + bob

        const baseSize = Math.min(canvasWidth, canvasHeight) * 0.025
        const s = baseSize * member.scale

        const bodyW = s * 0.9
        const bodyH = s * 1.4 * member.heightRatio
        const headR = s * 0.35

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cx - bodyW / 2,
              top: cy - bodyH * 0.3 - headR * 1.7,
              opacity: member.opacity,
            }}
          >
            {/* Head */}
            <div
              style={{
                width: headR * 2,
                height: headR * 2.2,
                borderRadius: '50%',
                backgroundColor: member.skinColor,
                margin: '0 auto',
              }}
            />
            {/* Body */}
            <div
              style={{
                width: bodyW,
                height: bodyH,
                borderRadius: s * 0.2,
                backgroundColor: member.outfitColor,
                marginTop: -headR * 0.4,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
