import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'

interface Character3DTrackProps {
  pixelsPerFrame: number
}

/** One color palette per character, cycling through them */
const CHARACTER_3D_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },   // blue
  { bg: 'rgba(239, 68, 68, 0.30)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },      // red
  { bg: 'rgba(34, 197, 94, 0.30)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.6)' },      // green
  { bg: 'rgba(245, 158, 11, 0.30)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },    // amber
  { bg: 'rgba(139, 92, 246, 0.30)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.6)' },    // violet
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },    // pink
  { bg: 'rgba(6, 182, 212, 0.30)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.6)' },      // cyan
  { bg: 'rgba(249, 115, 22, 0.30)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },    // orange
]

export function Character3DTrack({ pixelsPerFrame }: Character3DTrackProps) {
  const characters = use3DCharacterStore((s) => s.characters)
  const activeCharacterId = use3DCharacterStore((s) => s.activeCharacterId)
  const selectCharacter = use3DCharacterStore((s) => s.select3DCharacter)
  const setTimeRange = use3DCharacterStore((s) => s.set3DCharacterTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (characters.length === 0) return null

  return (
    <>
      {characters.map((char, index) => {
        const colors = CHARACTER_3D_COLORS[index % CHARACTER_3D_COLORS.length]
        return (
          <DraggableTimelineRow
            key={char.id}
            label={`🧊 ${char.name}`}
            colors={colors}
            startFrame={char.startFrame ?? 0}
            endFrame={char.endFrame ?? totalFrames}
            isSelected={activeCharacterId === char.id}
            isVisible={char.visible}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => {
              selectCharacter(char.id)
              setRightPanelTab('3d-character-properties')
            }}
            onTimeRangeChange={(sf, ef) => setTimeRange(char.id, sf, ef)}
          />
        )
      })}
    </>
  )
}
