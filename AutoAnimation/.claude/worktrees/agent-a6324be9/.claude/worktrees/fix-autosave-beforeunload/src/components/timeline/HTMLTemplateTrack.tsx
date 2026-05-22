import { memo, useCallback } from 'react'
import { useHTMLTemplateLayerStore, type CanvasHTMLTemplate } from '@/stores/useHTMLTemplateLayerStore'
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

/** Memo'd row that creates stable callbacks from its own id prop. */
const HTMLTemplateRow = memo(function HTMLTemplateRow({
  tpl,
  colors,
  isSelected,
  pixelsPerFrame,
  totalFrames,
}: {
  tpl: CanvasHTMLTemplate
  colors: TimelineRowColors
  isSelected: boolean
  pixelsPerFrame: number
  totalFrames: number
}) {
  const setSelectedTemplateId = useHTMLTemplateLayerStore((s) => s.setSelectedTemplateId)
  const updateTemplate = useHTMLTemplateLayerStore((s) => s.updateTemplate)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const handleClick = useCallback(() => {
    setSelectedTemplateId(tpl.id)
    setRightPanelTab('html-template-properties')
  }, [tpl.id, setSelectedTemplateId, setRightPanelTab])

  const handleTimeRangeChange = useCallback(
    (sf: number, ef: number) => updateTemplate(tpl.id, { startFrame: sf, endFrame: ef }),
    [tpl.id, updateTemplate],
  )

  return (
    <DraggableTimelineRow
      label={`🌐 ${tpl.name}`}
      colors={colors}
      startFrame={tpl.startFrame}
      endFrame={tpl.endFrame}
      isSelected={isSelected}
      isVisible={tpl.visible}
      pixelsPerFrame={pixelsPerFrame}
      totalFrames={totalFrames}
      onClick={handleClick}
      onTimeRangeChange={handleTimeRangeChange}
    />
  )
})

export const HTMLTemplateTrack = memo(function HTMLTemplateTrack({ pixelsPerFrame }: HTMLTemplateTrackProps) {
  const templates = useHTMLTemplateLayerStore((s) => s.templates)
  const selectedTemplateId = useHTMLTemplateLayerStore((s) => s.selectedTemplateId)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (templates.length === 0) return null

  return (
    <>
      {templates.map((tpl, i) => (
        <HTMLTemplateRow
          key={tpl.id}
          tpl={tpl}
          colors={TEMPLATE_COLORS[i % TEMPLATE_COLORS.length]}
          isSelected={selectedTemplateId === tpl.id}
          pixelsPerFrame={pixelsPerFrame}
          totalFrames={totalFrames}
        />
      ))}
    </>
  )
})
