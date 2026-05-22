import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'

interface HTMLTemplateTrackProps {
  pixelsPerFrame: number
}

const TEMPLATE_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },
  { bg: 'rgba(99, 102, 241, 0.30)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.6)' },
  { bg: 'rgba(14, 165, 233, 0.30)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.6)' },
  { bg: 'rgba(6, 182, 212, 0.30)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.6)' },
]

export function HTMLTemplateTrack({ pixelsPerFrame }: HTMLTemplateTrackProps) {
  const templates = useHTMLTemplateLayerStore((s) => s.templates)
  const selectedTemplateId = useHTMLTemplateLayerStore((s) => s.selectedTemplateId)
  const setSelectedTemplateId = useHTMLTemplateLayerStore((s) => s.setSelectedTemplateId)
  const updateTemplate = useHTMLTemplateLayerStore((s) => s.updateTemplate)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (templates.length === 0) return null

  const handleClick = (id: string) => {
    setSelectedTemplateId(id)
    setRightPanelTab('html-template-properties')
  }

  return (
    <>
      {templates.map((tpl, i) => (
        <DraggableTimelineRow
          key={tpl.id}
          label={`🌐 ${tpl.name}`}
          colors={TEMPLATE_COLORS[i % TEMPLATE_COLORS.length]}
          startFrame={tpl.startFrame}
          endFrame={tpl.endFrame}
          isSelected={selectedTemplateId === tpl.id}
          isVisible={tpl.visible}
          pixelsPerFrame={pixelsPerFrame}
          totalFrames={totalFrames}
          onClick={() => handleClick(tpl.id)}
          onTimeRangeChange={(sf, ef) => updateTemplate(tpl.id, { startFrame: sf, endFrame: ef })}
        />
      ))}
    </>
  )
}
