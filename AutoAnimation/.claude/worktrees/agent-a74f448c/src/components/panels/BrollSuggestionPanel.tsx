/**
 * BrollSuggestionPanel -- interactive B-roll suggestion cards showing
 * dialogue gaps with visual concept queries and Pixabay thumbnails.
 * Cinema-standardized workflow panel with blue accent colors.
 */

import { useState, useCallback } from 'react'
import {
  Camera,
  Check,
  X,
  RefreshCw,
  Loader2,
  Film,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect } from '@/components/ui/panel-controls'
import { useBrollStore, type BrollSuggestion } from '@/stores/useBrollStore'
import type { MediaTransitionType } from '@/stores/useMediaStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

const TRANSITIONS: { value: MediaTransitionType; label: string }[] = [
  { value: 'fade', label: 'Fade' },
  { value: 'ken-burns', label: 'Ken Burns' },
  { value: 'slide-left', label: 'Slide' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'none', label: 'None' },
]

function formatFrameRange(startFrame: number, endFrame: number, fps: number): string {
  const startSec = (startFrame / fps).toFixed(1)
  const endSec = (endFrame / fps).toFixed(1)
  return `${startSec}s - ${endSec}s`
}

function SuggestionCard({ suggestion }: { suggestion: BrollSuggestion }) {
  const acceptSuggestion = useBrollStore((s) => s.acceptSuggestion)
  const rejectSuggestion = useBrollStore((s) => s.rejectSuggestion)
  const swapSuggestion = useBrollStore((s) => s.swapSuggestion)
  const refreshSuggestion = useBrollStore((s) => s.refreshSuggestion)
  const setSuggestionTransition = useBrollStore((s) => s.setSuggestionTransition)
  const fps = useTimelineStore((s) => s.fps) || 30

  const [editQuery, setEditQuery] = useState(suggestion.query)
  const [isEditing, setIsEditing] = useState(false)

  const handleRefresh = useCallback(() => {
    refreshSuggestion(suggestion.id, editQuery)
    setIsEditing(false)
  }, [refreshSuggestion, suggestion.id, editQuery])

  const isAccepted = suggestion.status === 'accepted'
  const isRejected = suggestion.status === 'rejected'

  if (isRejected) return null

  return (
    <div
      className={cn(
        'w-full px-3 py-2.5 rounded-lg border transition-colors space-y-2',
        isAccepted
          ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
          : 'bg-[#2a2a2a] border-white/5'
      )}
    >
      {/* Header: time range + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-[#4a7eff]" />
          <span className="text-xs font-medium text-gray-200">
            {formatFrameRange(suggestion.startFrame, suggestion.endFrame, fps)}
          </span>
        </div>
        {isAccepted && (
          <span className="flex items-center gap-1 text-xs text-[#4a7eff]">
            <Check className="w-3 h-3" /> Inserted
          </span>
        )}
      </div>

      {/* Context */}
      {(suggestion.contextBefore || suggestion.contextAfter) && (
        <div className="text-[9px] text-gray-500 italic truncate">
          {suggestion.contextBefore && <span>"{suggestion.contextBefore}"</span>}
          {suggestion.contextBefore && suggestion.contextAfter && <span> ... </span>}
          {suggestion.contextAfter && <span>"{suggestion.contextAfter}"</span>}
        </div>
      )}

      {/* Query */}
      <div className="flex items-center gap-1">
        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              value={editQuery}
              onChange={(e) => setEditQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
              className="flex-1 px-2 py-0.5 text-xs rounded-lg bg-zinc-800 border border-white/5 text-zinc-200 focus:border-[#4a7eff]/30 focus:outline-none"
              autoFocus
            />
            <button onClick={handleRefresh} className="p-1 rounded-lg hover:bg-[#3a3a3a]">
              <Search className="w-3 h-3 text-[#4a7eff]" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-[#4a7eff]/70 hover:text-[#4a7eff] truncate"
          >
            {suggestion.query}
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {suggestion.isSearching ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-[#4a7eff] animate-spin" />
        </div>
      ) : suggestion.results.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {suggestion.results.map((result, i) => (
            <button
              key={result.pixabayId}
              onClick={() => swapSuggestion(suggestion.id, i)}
              className={cn(
                'shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors',
                i === suggestion.selectedIndex
                  ? 'border-[#4a7eff]'
                  : 'border-transparent hover:border-white/20'
              )}
            >
              <img
                src={result.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-500 text-center py-2">No results found</div>
      )}

      {/* Actions */}
      {!isAccepted && suggestion.results.length > 0 && (
        <div className="flex items-center gap-2">
          {/* Transition Selector */}
          <div className="flex-1">
            <PanelSelect
              value={suggestion.transition}
              onChange={(v) => setSuggestionTransition(suggestion.id, v as MediaTransitionType)}
              options={TRANSITIONS}
              fullWidth
            />
          </div>

          <button
            onClick={() => acceptSuggestion(suggestion.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-[#4a7eff] hover:bg-[#5a8aff] text-white transition-colors"
          >
            <Check className="w-3 h-3" /> Accept
          </button>
          <button
            onClick={() => rejectSuggestion(suggestion.id)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-[#2a2a2a] border border-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
          >
            <X className="w-3 h-3" /> Reject
          </button>
          <button
            onClick={() => refreshSuggestion(suggestion.id)}
            className="p-1 rounded-lg hover:bg-[#3a3a3a] text-gray-500 hover:text-gray-300 transition-colors"
            title="Refresh search"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export function BrollSuggestionPanel() {
  const suggestions = useBrollStore((s) => s.suggestions)
  const isAnalyzing = useBrollStore((s) => s.isAnalyzing)
  const analyzeTranscript = useBrollStore((s) => s.analyzeTranscript)

  const pendingCount = suggestions.filter((s) => s.status === 'pending').length
  const acceptedCount = suggestions.filter((s) => s.status === 'accepted').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 px-3 py-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#4a7eff]" />
            <span className="text-sm font-medium text-gray-200">B-Roll Suggestions</span>
            {suggestions.length > 0 && (
              <span className="text-xs text-gray-500">
                {pendingCount} pending / {acceptedCount} accepted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Loader2 className="w-5 h-5 text-[#4a7eff] animate-spin mb-3" />
            <span className="text-sm text-gray-400">Analyzing dialogue gaps...</span>
            <span className="text-xs text-gray-600 mt-1">This may take a moment</span>
          </div>
        )}

        {/* Suggestion Cards */}
        {suggestions.length > 0 && (
          <div className="space-y-1">
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isAnalyzing && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Camera size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No B-roll suggestions yet</span>
            <span className="text-xs text-gray-600 mt-1">
              Click below to analyze your dialogue for gaps
            </span>
          </div>
        )}
      </div>

      {/* ── Footer: Analyze button ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={() => analyzeTranscript()}
          disabled={isAnalyzing}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
            isAnalyzing
              ? 'bg-[#2a2a2a] text-gray-500 cursor-not-allowed border border-white/5'
              : 'bg-[#4a7eff] hover:bg-[#5a8aff] text-white',
          )}
        >
          {isAnalyzing ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Search size={13} />
          )}
          Analyze for B-Roll
        </button>
      </div>
    </div>
  )
}
