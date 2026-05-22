/**
 * SilenceOverlay — Timeline overlay highlighting silence/filler regions.
 *
 * Red semi-transparent blocks for silences, orange for fillers.
 * Only shown when silence removal preview is active.
 */

import { useMemo, memo} from 'react'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

export const SilenceOverlay = memo(function SilenceOverlay() {
  const removalMode = useTranscriptStore((s) => s.removalMode)
  const silenceRegions = useTranscriptStore((s) => s.silenceRegions)
  const fillerRegions = useTranscriptStore((s) => s.fillerRegions)
  const excludedRegionIndices = useTranscriptStore((s) => s.excludedRegionIndices)
  const removalPreview = useTranscriptStore((s) => s.removalPreview)
  const fps = useTimelineStore((s) => s.fps)
  const zoom = useTimelineStore((s) => s.zoom)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const regions = useMemo(() => {
    if (!removalMode) return []

    const blocks: { left: number; width: number; color: string; label: string }[] = []
    const pxPerFrame = zoom * 2 // Approximate px per frame (matches TimeRuler)

    for (const silence of silenceRegions) {
      const startFrame = Math.round(silence.startTime * fps)
      const endFrame = Math.round(silence.endTime * fps)
      blocks.push({
        left: startFrame * pxPerFrame,
        width: Math.max(2, (endFrame - startFrame) * pxPerFrame),
        color: 'bg-red-500/25',
        label: `${silence.duration.toFixed(1)}s`,
      })
    }

    for (const filler of fillerRegions) {
      const startFrame = Math.round(filler.startTime * fps)
      const endFrame = Math.round(filler.endTime * fps)
      blocks.push({
        left: startFrame * pxPerFrame,
        width: Math.max(2, (endFrame - startFrame) * pxPerFrame),
        color: 'bg-orange-500/25',
        label: filler.word,
      })
    }

    return blocks
  }, [removalMode, silenceRegions, fillerRegions, fps, zoom, totalFrames, excludedRegionIndices, removalPreview])

  if (!removalMode || regions.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {regions.map((region, i) => (
        <div
          key={i}
          className={`absolute top-0 bottom-0 ${region.color} border-x border-white/10`}
          style={{
            left: `${region.left}px`,
            width: `${region.width}px`,
          }}
        />
      ))}
    </div>
  )
})
