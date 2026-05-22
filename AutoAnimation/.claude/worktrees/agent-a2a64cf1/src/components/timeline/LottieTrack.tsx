import { useAnimationStore } from '@/stores/useAnimationStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { DraggableTimelineRow, type TimelineRowColors } from './DraggableTimelineRow'

interface LottieTrackProps {
  pixelsPerFrame: number
}

const LOTTIE_COLORS: TimelineRowColors[] = [
  { bg: 'rgba(251, 191, 36, 0.30)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.6)' },
  { bg: 'rgba(52, 211, 153, 0.30)', text: '#34d399', border: 'rgba(52, 211, 153, 0.6)' },
  { bg: 'rgba(248, 113, 113, 0.30)', text: '#f87171', border: 'rgba(248, 113, 113, 0.6)' },
  { bg: 'rgba(129, 140, 248, 0.30)', text: '#818cf8', border: 'rgba(129, 140, 248, 0.6)' },
  { bg: 'rgba(244, 114, 182, 0.30)', text: '#f472b6', border: 'rgba(244, 114, 182, 0.6)' },
]

export function LottieTrack({ pixelsPerFrame }: LottieTrackProps) {
  const activeAnimations = useAnimationStore((s) => s.activeAnimations)
  const library = useAnimationStore((s) => s.library)
  const selectedActiveId = useAnimationStore((s) => s.selectedActiveId)
  const setSelectedActiveId = useAnimationStore((s) => s.setSelectedActiveId)
  const setAnimationTimeRange = useAnimationStore((s) => s.setAnimationTimeRange)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  if (activeAnimations.length === 0) return null

  return (
    <>
      {activeAnimations.map((anim, i) => {
        const libraryItem = library.find((a) => a.id === anim.animationId)
        const label = libraryItem?.name ?? `Animation ${i + 1}`
        const colors = LOTTIE_COLORS[i % LOTTIE_COLORS.length]

        return (
          <DraggableTimelineRow
            key={anim.id}
            label={label}
            colors={colors}
            startFrame={anim.startFrame ?? 0}
            endFrame={anim.endFrame ?? totalFrames}
            isSelected={selectedActiveId === anim.id}
            isVisible={anim.isPlaying}
            pixelsPerFrame={pixelsPerFrame}
            totalFrames={totalFrames}
            onClick={() => {
              setSelectedActiveId(anim.id)
              setRightPanelTab('animation-properties')
            }}
            onTimeRangeChange={(sf, ef) => setAnimationTimeRange(anim.id, sf, ef)}
          />
        )
      })}
    </>
  )
}
