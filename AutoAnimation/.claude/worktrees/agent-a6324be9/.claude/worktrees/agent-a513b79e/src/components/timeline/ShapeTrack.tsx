import { memo } from 'react'
import { useShapeStore } from '@/stores/useShapeStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'

interface ShapeTrackProps {
  pixelsPerFrame: number
}

const SHAPE_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  { bg: 'rgba(139, 92, 246, 0.30)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.6)' },
  { bg: 'rgba(16, 185, 129, 0.30)', text: '#34d399', border: 'rgba(16, 185, 129, 0.6)' },
  { bg: 'rgba(245, 158, 11, 0.30)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },
]

export const ShapeTrack = memo(function ShapeTrack({ pixelsPerFrame }: ShapeTrackProps) {
  const shapes = useShapeStore((s) => s.shapes)
  const selectedShapeId = useShapeStore((s) => s.selectedShapeId)
  const setSelectedShapeId = useShapeStore((s) => s.setSelectedShapeId)
  const setShapeTimeRange = useShapeStore((s) => s.setShapeTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (shapes.length === 0) return null

  return (
    <>
      {shapes.map((shape, index) => {
        const colors = SHAPE_COLORS[index % SHAPE_COLORS.length]

        return (
          <DraggableTimelineRow
            key={shape.id}
            label={shape.name}
            colors={colors}
            startFrame={shape.startFrame}
            endFrame={shape.endFrame}
            isSelected={selectedShapeId === shape.id}
            isVisible={shape.visible}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => {
              setSelectedShapeId(shape.id)
              setRightPanelTab('shape-properties')
            }}
            onTimeRangeChange={(sf, ef) => setShapeTimeRange(shape.id, sf, ef)}
          />
        )
      })}
    </>
  )
})
