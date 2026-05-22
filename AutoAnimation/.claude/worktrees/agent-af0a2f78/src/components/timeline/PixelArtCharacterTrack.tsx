import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'

interface PixelArtCharacterTrackProps {
  pixelsPerFrame: number
}

const PIXEL_ART_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(16, 185, 129, 0.30)', text: '#34d399', border: 'rgba(16, 185, 129, 0.6)' },   // emerald
  { bg: 'rgba(245, 158, 11, 0.30)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.6)' },    // amber
  { bg: 'rgba(59, 130, 246, 0.30)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.6)' },     // blue
  { bg: 'rgba(239, 68, 68, 0.30)', text: '#f87171', border: 'rgba(239, 68, 68, 0.6)' },       // red
  { bg: 'rgba(139, 92, 246, 0.30)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.6)' },     // violet
  { bg: 'rgba(236, 72, 153, 0.30)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.6)' },     // pink
  { bg: 'rgba(6, 182, 212, 0.30)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.6)' },       // cyan
  { bg: 'rgba(249, 115, 22, 0.30)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.6)' },     // orange
]

/** Distinct clip colors that cycle per-clip within a character row */
const CLIP_COLORS = [
  'rgba(52, 211, 153, 0.50)',  // emerald
  'rgba(96, 165, 250, 0.50)',  // blue
  'rgba(251, 191, 36, 0.50)',  // amber
  'rgba(248, 113, 113, 0.50)', // red
  'rgba(167, 139, 250, 0.50)', // violet
  'rgba(34, 211, 238, 0.50)',  // cyan
]

export function PixelArtCharacterTrack({ pixelsPerFrame }: PixelArtCharacterTrackProps) {
  const characters = usePixelArtCharacterStore((s) => s.characters)
  const activeCharacterId = usePixelArtCharacterStore((s) => s.activeCharacterId)
  const selectCharacter = usePixelArtCharacterStore((s) => s.selectPixelArtCharacter)
  const setTimeRange = usePixelArtCharacterStore((s) => s.setTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (characters.length === 0) return null

  return (
    <>
      {characters.map((char, index) => {
        const colors = PIXEL_ART_COLORS[index % PIXEL_ART_COLORS.length]
        const charStart = char.startFrame ?? 0
        const charEnd = char.endFrame ?? totalFrames
        const charDuration = charEnd - charStart

        return (
          <DraggableTimelineRow
            key={char.id}
            label={char.name}
            colors={colors}
            startFrame={charStart}
            endFrame={charEnd}
            isSelected={activeCharacterId === char.id}
            isVisible={char.visible}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => {
              selectCharacter(char.id)
              setRightPanelTab('pixelart-character-properties')
            }}
            onTimeRangeChange={(sf, ef) => setTimeRange(char.id, sf, ef)}
          >
            {/* Animation clips rendered as colored segments inside the bar */}
            {char.animationClips?.map((clip, ci) => {
              const clipLeft = ((clip.startFrame - charStart) / charDuration) * 100
              const clipWidth = ((clip.endFrame - clip.startFrame) / charDuration) * 100
              if (clipLeft >= 100 || clipLeft + clipWidth <= 0) return null
              return (
                <div
                  key={clip.id}
                  className="absolute top-0 bottom-0 pointer-events-none flex items-center overflow-hidden"
                  style={{
                    left: `${Math.max(0, clipLeft)}%`,
                    width: `${Math.min(clipWidth, 100 - Math.max(0, clipLeft))}%`,
                    backgroundColor: CLIP_COLORS[ci % CLIP_COLORS.length],
                    borderLeft: '1px solid rgba(255,255,255,0.15)',
                    borderRight: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 2,
                  }}
                >
                  <span className="text-[9px] text-white/80 font-medium truncate px-1">
                    {clip.animationName}
                  </span>
                </div>
              )
            })}
          </DraggableTimelineRow>
        )
      })}
    </>
  )
}
