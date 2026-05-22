import { memo, useCallback, useMemo } from 'react'
import { useMotionGraphicStore, type MotionGraphicInstance } from '@/stores/useMotionGraphicStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'
import { getMotionGraphic } from '@/motionGraphics'

interface MotionGraphicTrackProps {
  pixelsPerFrame: number
}

const MG_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(168, 85, 247, 0.30)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.6)' },
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },
  { bg: 'rgba(249, 115, 22, 0.30)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },
  { bg: 'rgba(34, 197, 94, 0.30)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.6)' },
]

/** Memo'd row that creates stable callbacks from its own id prop. */
const MotionGraphicRow = memo(function MotionGraphicRow({
  inst,
  colors,
  isSelected,
  pixelsPerFrame,
  totalFrames,
}: {
  inst: MotionGraphicInstance
  colors: TimelineRowColors
  isSelected: boolean
  pixelsPerFrame: number
  totalFrames: number
}) {
  const setSelectedInstanceId = useMotionGraphicStore((s) => s.setSelectedInstanceId)
  const updateInstance = useMotionGraphicStore((s) => s.updateInstance)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const label = useMemo(() => {
    const reg = getMotionGraphic(inst.templateId)
    return `✦ ${inst.name || reg?.title || inst.templateId}`
  }, [inst.templateId, inst.name])

  const handleClick = useCallback(() => {
    setSelectedInstanceId(inst.id)
    setRightPanelTab('motion-graphic-properties')
  }, [inst.id, setSelectedInstanceId, setRightPanelTab])

  const handleTimeRangeChange = useCallback(
    (sf: number, ef: number) => updateInstance(inst.id, { startFrame: sf, endFrame: ef }),
    [inst.id, updateInstance],
  )

  return (
    <DraggableTimelineRow
      label={label}
      colors={colors}
      startFrame={inst.startFrame}
      endFrame={inst.endFrame}
      isSelected={isSelected}
      isVisible={inst.visible}
      pixelsPerFrame={pixelsPerFrame}
      totalFrames={totalFrames}
      onClick={handleClick}
      onTimeRangeChange={handleTimeRangeChange}
    />
  )
})

export const MotionGraphicTrack = memo(function MotionGraphicTrack({ pixelsPerFrame }: MotionGraphicTrackProps) {
  const instances = useMotionGraphicStore((s) => s.instances)
  const selectedInstanceId = useMotionGraphicStore((s) => s.selectedInstanceId)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (instances.length === 0) return null

  return (
    <>
      {instances.map((inst, i) => (
        <MotionGraphicRow
          key={inst.id}
          inst={inst}
          colors={MG_COLORS[i % MG_COLORS.length]}
          isSelected={selectedInstanceId === inst.id}
          pixelsPerFrame={pixelsPerFrame}
          totalFrames={totalFrames}
        />
      ))}
    </>
  )
})
