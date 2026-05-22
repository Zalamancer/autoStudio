import { useState } from 'react'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'
import type { WhiteboardStroke } from '@/services/whiteboardAnimation'

interface WhiteboardStrokeTrackProps {
  pixelsPerFrame: number
}

const STROKE_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(139, 92, 246, 0.30)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.6)' },
  { bg: 'rgba(6, 182, 212, 0.30)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.6)' },
  { bg: 'rgba(16, 185, 129, 0.30)', text: '#34d399', border: 'rgba(16, 185, 129, 0.6)' },
  { bg: 'rgba(249, 115, 22, 0.30)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },
]

const ERASER_COLOR: TimelineRowColors = {
  bg: 'rgba(239, 68, 68, 0.20)', text: '#f87171', border: 'rgba(239, 68, 68, 0.5)',
}

const EASING_OPTIONS: { value: WhiteboardStroke['easing']; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
  { value: 'ease-in-cubic', label: 'Ease In Cubic' },
  { value: 'ease-out-cubic', label: 'Ease Out Cubic' },
  { value: 'ease-in-out-cubic', label: 'Ease In Out Cubic' },
  { value: 'ease-out-back', label: 'Ease Out Back' },
  { value: 'ease-in-expo', label: 'Ease In Expo' },
  { value: 'ease-out-expo', label: 'Ease Out Expo' },
]

function EasingPopover({ strokeId, currentEasing, onClose }: {
  strokeId: string
  currentEasing: WhiteboardStroke['easing']
  onClose: () => void
}) {
  const updateStroke = useWhiteboardStore((s) => s.updateStroke)

  return (
    <div
      className="absolute bottom-full left-0 mb-1 z-50 min-w-[140px] py-1 rounded-lg shadow-xl border border-zinc-700/60 overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-low)' }}
      onMouseLeave={onClose}
    >
      <div className="px-2 py-1 text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Easing</div>
      {EASING_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={`w-full text-left px-3 py-1 text-[11px] transition-colors ${
            currentEasing === opt.value
              ? 'text-white bg-zinc-700/50'
              : 'text-zinc-300 hover:bg-zinc-700/30'
          }`}
          onClick={() => {
            updateStroke(strokeId, { easing: opt.value })
            onClose()
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function WhiteboardStrokeTrack({ pixelsPerFrame }: WhiteboardStrokeTrackProps) {
  const enabled = useWhiteboardStore((s) => s.enabled)
  const strokes = useWhiteboardStore((s) => s.config.strokes)
  const updateStroke = useWhiteboardStore((s) => s.updateStroke)
  const selectedStrokeId = useWhiteboardStore((s) => s.selectedStrokeId)
  const setSelectedStrokeId = useWhiteboardStore((s) => s.setSelectedStrokeId)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const fps = useTimelineStore((s) => s.fps)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const [easingPopoverId, setEasingPopoverId] = useState<string | null>(null)

  if (!enabled || strokes.length === 0) return null

  return (
    <>
      {strokes.map((stroke, index) => {
        const isEraser = stroke.isEraser
        const isText = !!stroke.textContent
        const isInstant = stroke.startFrame === 0 && stroke.endFrame === 0
        const colors = isEraser ? ERASER_COLOR : STROKE_COLORS[index % STROKE_COLORS.length]
        const duration = isInstant ? 0 : ((stroke.endFrame - stroke.startFrame) / fps)
        const label = isEraser
          ? `Eraser ${index + 1}`
          : isText
          ? `Text: ${stroke.textContent!.substring(0, 10)}`
          : isInstant
          ? `Stroke ${index + 1} (instant)`
          : `Stroke ${index + 1} (${duration.toFixed(1)}s)`

        return (
          <div key={stroke.id} className="relative">
            <div onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setEasingPopoverId(easingPopoverId === stroke.id ? null : stroke.id)
            }}>
              <DraggableTimelineRow
                label={label}
                colors={colors}
                startFrame={stroke.startFrame}
                endFrame={isInstant ? totalFrames : stroke.endFrame}
                isSelected={selectedStrokeId === stroke.id}
                isVisible={true}
                pixelsPerFrame={pixelsPerFrame}
                totalFrames={totalFrames}
                onClick={() => {
                  setSelectedStrokeId(stroke.id)
                  setRightPanelTab('whiteboard-stroke-properties')
                }}
                onTimeRangeChange={(sf, ef) => updateStroke(stroke.id, { startFrame: sf, endFrame: ef })}
              />
            </div>
            {easingPopoverId === stroke.id && !isEraser && !isInstant && (
              <EasingPopover
                strokeId={stroke.id}
                currentEasing={stroke.easing}
                onClose={() => setEasingPopoverId(null)}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
