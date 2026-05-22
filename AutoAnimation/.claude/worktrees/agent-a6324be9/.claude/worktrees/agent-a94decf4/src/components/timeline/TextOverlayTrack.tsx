import { memo } from 'react'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'

interface TextOverlayTrackProps {
  pixelsPerFrame: number
}

const TEXT_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(249, 115, 22, 0.30)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },
  { bg: 'rgba(6, 182, 212, 0.30)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.6)' },
  { bg: 'rgba(139, 92, 246, 0.30)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.6)' },
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },
  { bg: 'rgba(16, 185, 129, 0.30)', text: '#34d399', border: 'rgba(16, 185, 129, 0.6)' },
]

export const TextOverlayTrack = memo(function TextOverlayTrack({ pixelsPerFrame }: TextOverlayTrackProps) {
  const overlays = useTextOverlayStore((s) => s.overlays)
  const selectedId = useTextOverlayStore((s) => s.selectedId)
  const setSelectedId = useTextOverlayStore((s) => s.setSelectedId)
  const setOverlayTimeRange = useTextOverlayStore((s) => s.setOverlayTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (overlays.length === 0) return null

  return (
    <>
      {overlays.map((overlay, index) => {
        const colors = TEXT_COLORS[index % TEXT_COLORS.length]
        const label = overlay.presetType
          ? overlay.presetType.charAt(0).toUpperCase() + overlay.presetType.slice(1).replace(/-/g, ' ')
          : 'Text'

        return (
          <DraggableTimelineRow
            key={overlay.id}
            label={label}
            colors={colors}
            startFrame={overlay.startFrame ?? 0}
            endFrame={overlay.endFrame ?? totalFrames}
            isSelected={selectedId === overlay.id}
            isVisible={overlay.visible}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => {
              setSelectedId(overlay.id)
              setRightPanelTab('text-properties')
            }}
            onTimeRangeChange={(sf, ef) => setOverlayTimeRange(overlay.id, sf, ef)}
          />
        )
      })}
    </>
  )
})
