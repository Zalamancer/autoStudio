/**
 * ClipExtractionPanel — Shows extracted clips as a ranked list with previews.
 */

import { useState } from 'react'
import { Film, Play, Sparkles, ArrowUpDown, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRepurposeStore } from '@/stores/useRepurposeStore'
import { rankClips } from '@/services/clipRanker'
import { ClipPreviewModal } from './ClipPreviewModal'

type SortMode = 'score' | 'duration' | 'chronological'

export function ClipExtractionPanel() {
  const extractedClips = useRepurposeStore((s) => s.extractedClips)
  const selectedClipIds = useRepurposeStore((s) => s.selectedClipIds)
  const toggleClipSelection = useRepurposeStore((s) => s.toggleClipSelection)
  const generateShort = useRepurposeStore((s) => s.generateShort)

  const [sortMode, setSortMode] = useState<SortMode>('score')
  const [previewClipId, setPreviewClipId] = useState<string | null>(null)

  const ranks = rankClips(extractedClips)
  const rankMap = new Map(ranks.map((r) => [r.clipId, r]))

  const sortedClips = [...extractedClips].sort((a, b) => {
    if (sortMode === 'score') {
      return (rankMap.get(b.id)?.compositeScore ?? 0) - (rankMap.get(a.id)?.compositeScore ?? 0)
    }
    if (sortMode === 'duration') {
      return b.duration - a.duration
    }
    return a.startTime - b.startTime
  })

  const previewClip = previewClipId
    ? extractedClips.find((c) => c.id === previewClipId) ?? null
    : null

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={12} className="text-zinc-500" />
        <span className="text-[10px] text-zinc-500">Sort:</span>
        {(['score', 'duration', 'chronological'] as SortMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded',
              sortMode === mode
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
          >
            {mode === 'score' ? 'By Score' : mode === 'duration' ? 'By Duration' : 'Chronological'}
          </button>
        ))}
      </div>

      {/* Clip cards */}
      {sortedClips.map((clip) => {
        const rank = rankMap.get(clip.id)
        const isSelected = selectedClipIds.has(clip.id)

        return (
          <div
            key={clip.id}
            className={cn(
              'border rounded-lg p-3 transition-all cursor-pointer',
              isSelected
                ? 'border-indigo-500/40 bg-indigo-500/5'
                : 'border-white/5 bg-zinc-900/50 hover:border-white/10',
            )}
            onClick={() => toggleClipSelection(clip.id)}
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail / Score badge */}
              <div className="flex-none w-16 h-16 rounded bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                {clip.thumbnailDataUrl ? (
                  <img src={clip.thumbnailDataUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Film size={20} className="text-zinc-600" />
                )}
                {rank && (
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded-tl">
                    {rank.compositeScore}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-medium text-zinc-200 truncate">{clip.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    ({Math.round(clip.duration)}s)
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{clip.reason}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewClipId(clip.id)
                }}
                className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors"
              >
                <Play size={10} /> Preview
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  generateShort(clip.id)
                }}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
              >
                <Sparkles size={10} /> Generate Short
              </button>
            </div>
          </div>
        )
      })}

      {extractedClips.length === 0 && (
        <div className="text-center py-8">
          <Film size={24} className="text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No clips extracted yet</p>
        </div>
      )}

      {/* Preview modal */}
      {previewClip && (
        <ClipPreviewModal
          clip={previewClip}
          rank={rankMap.get(previewClip.id) ?? null}
          onClose={() => setPreviewClipId(null)}
          onGenerateShort={() => {
            generateShort(previewClip.id)
            setPreviewClipId(null)
          }}
        />
      )}
    </div>
  )
}
