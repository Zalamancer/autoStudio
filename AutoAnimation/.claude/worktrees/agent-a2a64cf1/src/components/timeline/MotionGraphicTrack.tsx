import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
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

export function MotionGraphicTrack({ pixelsPerFrame }: MotionGraphicTrackProps) {
  const instances = useMotionGraphicStore((s) => s.instances)
  const selectedInstanceId = useMotionGraphicStore((s) => s.selectedInstanceId)
  const setSelectedInstanceId = useMotionGraphicStore((s) => s.setSelectedInstanceId)
  const updateInstance = useMotionGraphicStore((s) => s.updateInstance)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (instances.length === 0) return null

  const handleClick = (id: string) => {
    setSelectedInstanceId(id)
    setRightPanelTab('motion-graphic-properties')
  }

  return (
    <>
      {instances.map((inst, i) => {
        const reg = getMotionGraphic(inst.templateId)
        const label = inst.name || reg?.title || inst.templateId
        return (
          <DraggableTimelineRow
            key={inst.id}
            label={`✦ ${label}`}
            colors={MG_COLORS[i % MG_COLORS.length]}
            startFrame={inst.startFrame}
            endFrame={inst.endFrame}
            isSelected={selectedInstanceId === inst.id}
            isVisible={inst.visible}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => handleClick(inst.id)}
            onTimeRangeChange={(sf, ef) => updateInstance(inst.id, { startFrame: sf, endFrame: ef })}
          />
        )
      })}
    </>
  )
}
