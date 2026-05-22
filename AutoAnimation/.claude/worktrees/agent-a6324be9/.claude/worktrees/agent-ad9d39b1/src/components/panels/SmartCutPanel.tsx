/**
 * Smart Cut Panel — Silence detection and filler word removal.
 */

import { Scissors, Loader2, Trash2, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useSmartCutStore } from '@/stores/useSmartCutStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import type { SilenceRegion } from '@/services/silenceDetection'
import type { WordTimestamp } from '@/services/silenceDetection'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

function RegionRow({ region, onToggle }: { region: SilenceRegion; onToggle: () => void }) {
  const duration = region.endTime - region.startTime

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all border',
        region.enabled
          ? 'bg-red-500/10 border-red-500/20 text-zinc-200'
          : 'bg-zinc-800/30 border-white/5 text-zinc-500',
      )}
    >
      {region.enabled ? (
        <CheckSquare size={12} className="text-red-400 shrink-0" />
      ) : (
        <Square size={12} className="text-zinc-600 shrink-0" />
      )}

      <span className={cn(
        'px-1.5 py-0.5 rounded text-[9px] font-medium uppercase',
        region.type === 'silence' ? 'bg-zinc-700 text-zinc-400' : 'bg-orange-500/20 text-orange-400',
      )}>
        {region.type === 'silence' ? 'Silence' : 'Filler'}
      </span>

      {region.word && (
        <span className="text-orange-300 font-medium truncate">"{region.word}"</span>
      )}

      <span className="ml-auto text-zinc-500 shrink-0 tabular-nums">
        {formatTime(region.startTime)} — {formatTime(region.endTime)}
      </span>

      <span className="text-zinc-600 shrink-0 tabular-nums w-10 text-right">
        {duration.toFixed(1)}s
      </span>
    </button>
  )
}

export function SmartCutPanel() {
  const {
    regions, isAnalyzing, hasAnalyzed, filterMode,
    analyzeAudio, toggleRegion, toggleAll, setFilterMode, applySmartCut, reset,
  } = useSmartCutStore(
    useShallow((s) => ({
      regions: s.regions,
      isAnalyzing: s.isAnalyzing,
      hasAnalyzed: s.hasAnalyzed,
      filterMode: s.filterMode,
      analyzeAudio: s.analyzeAudio,
      toggleRegion: s.toggleRegion,
      toggleAll: s.toggleAll,
      setFilterMode: s.setFilterMode,
      applySmartCut: s.applySmartCut,
      reset: s.reset,
    })),
  )

  const generatedVoices = useVoiceStore((s) => s.generatedVoices)

  const handleAnalyze = async () => {
    // Find the first generated voice with audio and alignment
    const voice = generatedVoices[0]
    if (!voice) return

    // Build word timestamps from ElevenLabs alignment
    const words: WordTimestamp[] = []
    if (voice.wordTimeline) {
      for (const w of voice.wordTimeline) {
        words.push({
          word: w.word,
          start: w.startTime,
          end: w.endTime,
        })
      }
    }

    // Get audio blob
    let audioBlob: Blob | null = null
    if (voice.audioUrl) {
      try {
        const resp = await fetch(voice.audioUrl)
        audioBlob = await resp.blob()
      } catch {
        // Audio fetch failed
      }
    }

    if (audioBlob) {
      await analyzeAudio(audioBlob, words)
    }
  }

  // Filter regions by mode
  const filteredRegions = regions.filter((r) => {
    if (filterMode === 'silence') return r.type === 'silence'
    if (filterMode === 'fillers') return r.type === 'filler'
    return true
  })

  const enabledCount = filteredRegions.filter((r) => r.enabled).length
  const totalDuration = filteredRegions
    .filter((r) => r.enabled)
    .reduce((sum, r) => sum + (r.endTime - r.startTime), 0)

  const hasVoices = generatedVoices.length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none flex items-center justify-between min-h-[49px] px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Scissors size={16} className="text-red-400" />
          <h3 className="text-sm font-semibold text-white">Smart Cut</h3>
        </div>
        {hasAnalyzed && (
          <button
            onClick={reset}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            title="Reset"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Analyze button */}
      {!hasAnalyzed && !isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
            <Scissors size={20} className="text-red-400" />
          </div>
          <p className="text-sm font-medium text-zinc-300 mb-1">Detect silences & fillers</p>
          <p className="text-[11px] text-zinc-500 mb-4 max-w-[240px] leading-relaxed">
            Analyze your generated audio to find silence gaps and filler words for automatic removal.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={!hasVoices}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all',
              hasVoices
                ? 'bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5',
            )}
          >
            {hasVoices ? 'Analyze Audio' : 'Generate audio first'}
          </button>
        </div>
      )}

      {/* Analyzing spinner */}
      {isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 size={24} className="animate-spin text-red-400 mb-3" />
          <p className="text-xs text-zinc-400">Analyzing audio...</p>
        </div>
      )}

      {/* Results */}
      {hasAnalyzed && !isAnalyzing && (
        <>
          {/* Filter tabs */}
          <div className="flex-none flex items-center gap-1 px-3 py-2 border-b border-white/5">
            {(['all', 'silence', 'fillers'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all',
                  filterMode === mode
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent',
                )}
              >
                {mode === 'all' ? `All (${regions.length})` :
                 mode === 'silence' ? `Silences (${regions.filter((r) => r.type === 'silence').length})` :
                 `Fillers (${regions.filter((r) => r.type === 'filler').length})`}
              </button>
            ))}
          </div>

          {/* Select all / summary */}
          <div className="flex-none flex items-center justify-between px-3 py-1.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAll(enabledCount < filteredRegions.length)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {enabledCount < filteredRegions.length ? 'Select all' : 'Deselect all'}
              </button>
            </div>
            <span className="text-[10px] text-zinc-500">
              {enabledCount} selected · {totalDuration.toFixed(1)}s
            </span>
          </div>

          {/* Region list */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
            {filteredRegions.length === 0 ? (
              <p className="text-center text-xs text-zinc-600 py-4">No regions found</p>
            ) : (
              filteredRegions.map((region) => (
                <RegionRow
                  key={region.id}
                  region={region}
                  onToggle={() => toggleRegion(region.id)}
                />
              ))
            )}
          </div>

          {/* Apply button */}
          <div className="flex-none p-3 border-t border-white/5">
            <button
              onClick={applySmartCut}
              disabled={enabledCount === 0}
              className={cn(
                'w-full py-2.5 rounded-xl text-xs font-medium transition-all',
                enabledCount > 0
                  ? 'bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5',
              )}
            >
              Remove {enabledCount} region{enabledCount !== 1 ? 's' : ''} ({totalDuration.toFixed(1)}s)
            </button>
          </div>
        </>
      )}
    </div>
  )
}
