import { memo } from 'react'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import type { RightPanelTab } from '@/types'
import { DraggableTimelineRow } from './DraggableTimelineRow'

interface SVGObjectTrackProps {
  pixelsPerFrame: number
}

/**
 * Color palette for SVG object timeline bars. Each object gets a unique
 * color from this rotating palette.
 */
const OBJECT_COLORS = [
  { bg: 'rgba(139, 92, 246, 0.30)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.6)' }, // violet
  { bg: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },  // blue
  { bg: 'rgba(16, 185, 129, 0.30)', text: '#34d399', border: 'rgba(16, 185, 129, 0.6)' },  // emerald
  { bg: 'rgba(245, 158, 11, 0.30)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },  // amber
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },  // pink
  { bg: 'rgba(249, 115, 22, 0.30)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },  // orange
  { bg: 'rgba(6, 182, 212, 0.30)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.6)' },    // cyan
  { bg: 'rgba(168, 85, 247, 0.30)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },  // purple
]

/**
 * SVGObjectTrack renders one DraggableTimelineRow per SVG animation object,
 * showing colored bars that can be clicked to select and edited via drag handles.
 */
export const SVGObjectTrack = memo(function SVGObjectTrack({ pixelsPerFrame }: SVGObjectTrackProps) {
  const composition = useSVGObjectStore((s) => s.composition)
  const selectedObjectId = useSVGObjectStore((s) => s.selectedObjectId)
  const selectObject = useSVGObjectStore((s) => s.selectObject)
  const setObjectTimeRange = useSVGObjectStore((s) => s.setObjectTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (!composition || composition.objects.length === 0) return null

  return (
    <>
      {composition.objects.map((obj, index) => {
        const colors = OBJECT_COLORS[index % OBJECT_COLORS.length]

        return (
          <DraggableTimelineRow
            key={obj.id}
            label={obj.name}
            colors={colors}
            startFrame={obj.startFrame}
            endFrame={obj.endFrame}
            isSelected={selectedObjectId === obj.id}
            isVisible={obj.visible}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => {
              selectObject(obj.id)
              setRightPanelTab('svg-object-properties' as RightPanelTab)
            }}
            onTimeRangeChange={(sf, ef) => setObjectTimeRange(obj.id, sf, ef)}
          />
        )
      })}
    </>
  )
})
