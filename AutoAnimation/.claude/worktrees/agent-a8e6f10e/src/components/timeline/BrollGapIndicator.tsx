/**
 * BrollGapIndicator -- small camera icons above timeline gaps where
 * B-roll suggestions are available. Clicking opens the B-roll suggestion panel.
 */

import { Camera } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBrollStore } from '@/stores/useBrollStore'

interface BrollGapIndicatorProps {
  /** Pixel width per frame for positioning */
  pixelsPerFrame: number
  /** Offset in pixels from the left edge of the timeline */
  leftOffset?: number
}

export function BrollGapIndicator({ pixelsPerFrame, leftOffset = 0 }: BrollGapIndicatorProps) {
  const suggestions = useBrollStore((s) => s.suggestions)
  const setSelectedSuggestion = useBrollStore((s) => s.setSelectedSuggestion)

  const pendingSuggestions = suggestions.filter((s) => s.status === 'pending')
  if (pendingSuggestions.length === 0) return null

  return (
    <>
      {pendingSuggestions.map((suggestion) => {
        const left = leftOffset + suggestion.startFrame * pixelsPerFrame
        const width = (suggestion.endFrame - suggestion.startFrame) * pixelsPerFrame
        const resultCount = suggestion.results.length

        return (
          <button
            key={suggestion.id}
            className={cn(
              'absolute -top-5 flex items-center gap-0.5 px-1 py-0.5 rounded',
              'bg-blue-600/80 hover:bg-blue-500 text-white transition-colors',
              'text-[10px] leading-none z-10'
            )}
            style={{ left: `${left + width / 2 - 12}px` }}
            onClick={(e) => {
              e.stopPropagation()
              setSelectedSuggestion(suggestion.id)
            }}
            title={`B-Roll: "${suggestion.query}" (${resultCount} suggestions)`}
          >
            <Camera className="w-3 h-3" />
            {resultCount > 0 && <span>{resultCount}</span>}
          </button>
        )
      })}
    </>
  )
}
