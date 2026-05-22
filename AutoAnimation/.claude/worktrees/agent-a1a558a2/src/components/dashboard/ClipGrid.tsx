import { memo } from 'react'
import { type DashboardClip } from '@/stores/useDashboardStore'
import { ClipCard } from './ClipCard'
import type { VideoCompositionProps } from '@/remotion/types'

interface ClipGridProps {
  clips: DashboardClip[]
  /** Total number of clips before search/filter is applied */
  totalClipCount: number
  expandedClipId: string | null
  executingClipId: string | null
  onToggleExpand: (clipId: string) => void
  onRemove: (clipId: string) => void
  onPlay: (recordingId: string, compositionSnapshot?: VideoCompositionProps | null) => void
  onShare: (recordingId: string) => void
  onInsights: (recordingId: string) => void
}

export const ClipGrid = memo(function ClipGrid({
  clips,
  totalClipCount,
  expandedClipId,
  executingClipId,
  onToggleExpand,
  onRemove,
  onPlay,
  onShare,
  onInsights,
}: ClipGridProps) {
  if (clips.length === 0) {
    // Distinguish between "no clips at all" and "no clips match the current filter"
    const isFiltered = totalClipCount > 0
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-3">{isFiltered ? '\uD83D\uDD0D' : '\uD83C\uDFAC'}</div>
        <h3 className="text-lg font-medium text-gray-400 mb-1">
          {isFiltered ? 'No matching clips' : 'No clips yet'}
        </h3>
        <p className="text-sm text-gray-600">
          {isFiltered
            ? 'Try adjusting your search or filters'
            : 'Click "New Clip" to start generating AI-powered clips'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {clips.map((clip) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          isExpanded={expandedClipId === clip.id}
          isExecuting={executingClipId === clip.id}
          onToggleExpand={() => onToggleExpand(clip.id)}
          onRemove={() => onRemove(clip.id)}
          onPlay={onPlay}
          onShare={onShare}
          onInsights={onInsights}
        />
      ))}
    </div>
  )
})
