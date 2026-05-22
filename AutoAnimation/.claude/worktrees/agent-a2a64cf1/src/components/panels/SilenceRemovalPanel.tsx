/**
 * SilenceRemovalPanel — Detect and remove silences and filler words.
 *
 * Offers three modes: Natural, Fast, Extra Fast.
 * Shows preview with stats and allows customization.
 */

import { useState, useCallback } from 'react'
import { Scissors, Volume2, Zap, ZapOff, X, Plus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useSilencePreview } from '@/hooks/useSilencePreview'
import { toast } from '@/stores/useToastStore'
import type { RemovalMode } from '@/types/silenceRemoval'

const MODES: { id: RemovalMode; name: string; description: string; icon: typeof Volume2 }[] = [
  {
    id: 'natural',
    name: 'Natural',
    description: 'Remove pauses > 1.5s. Keeps all speech.',
    icon: Volume2,
  },
  {
    id: 'fast',
    name: 'Fast',
    description: 'Remove pauses > 0.8s. Sounds like an edited interview.',
    icon: Zap,
  },
  {
    id: 'extra-fast',
    name: 'Extra Fast',
    description: 'Remove pauses > 0.3s + filler words. Tight delivery.',
    icon: ZapOff,
  },
]

export function SilenceRemovalPanel() {
  const removalMode = useTranscriptStore((s) => s.removalMode)
  const setRemovalMode = useTranscriptStore((s) => s.setRemovalMode)
  const silenceThreshold = useTranscriptStore((s) => s.silenceThreshold)
  const setSilenceThreshold = useTranscriptStore((s) => s.setSilenceThreshold)
  const fillerWords = useTranscriptStore((s) => s.fillerWords)
  const addFillerWord = useTranscriptStore((s) => s.addFillerWord)
  const removeFillerWord = useTranscriptStore((s) => s.removeFillerWord)
  const removalPreview = useTranscriptStore((s) => s.removalPreview)
  const excludedRegionIndices = useTranscriptStore((s) => s.excludedRegionIndices)
  const toggleRegionExclusion = useTranscriptStore((s) => s.toggleRegionExclusion)
  const clearRemovalPreview = useTranscriptStore((s) => s.clearRemovalPreview)
  const editedSegments = useTranscriptStore((s) => s.editedSegments)
  const applyTimelineEdits = useTimelineStore((s) => s.applyTimelineEdits)
  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const preview = useSilencePreview(removalMode)

  const [showFillerEditor, setShowFillerEditor] = useState(false)
  const [newFillerWord, setNewFillerWord] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)

  const hasTranscript = editedSegments.length > 0

  const handleApply = useCallback(() => {
    // Filter out excluded regions
    const editsToApply = removalPreview.filter((_, i) => !excludedRegionIndices.has(i))
    if (editsToApply.length === 0) return

    applyTimelineEdits(editsToApply)
    clearRemovalPreview()
    setShowConfirmation(false)
    toast.success(`Removed ${editsToApply.length} segments. Ctrl+Z to undo.`)
  }, [removalPreview, excludedRegionIndices, applyTimelineEdits, clearRemovalPreview])

  const handleAddFiller = useCallback(() => {
    if (newFillerWord.trim()) {
      addFillerWord(newFillerWord.trim())
      setNewFillerWord('')
    }
  }, [newFillerWord, addFillerWord])

  const activeEdits = removalPreview.filter((_, i) => !excludedRegionIndices.has(i))
  const activeRemovedSec = activeEdits.reduce((sum, e) => sum + (e.endFrame - e.startFrame) / fps, 0)
  const totalDuration = totalFrames / fps

  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
        <Scissors size={20} className="text-zinc-600" />
        <p className="text-xs text-zinc-500">Transcribe audio first</p>
        <p className="text-[10px] text-zinc-600">
          Silence removal requires transcript data with word-level timestamps
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Mode</span>
        <div className="grid grid-cols-3 gap-1.5">
          {MODES.map((mode) => {
            const Icon = mode.icon
            const isActive = removalMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => setRemovalMode(isActive ? null : mode.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center',
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-300',
                )}
              >
                <Icon size={16} />
                <span className="text-[10px] font-medium">{mode.name}</span>
              </button>
            )
          })}
        </div>
        {removalMode && (
          <p className="text-[10px] text-zinc-500">
            {MODES.find((m) => m.id === removalMode)?.description}
          </p>
        )}
      </div>

      {/* Preview stats */}
      {removalMode && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/10">
              <p className="text-[10px] text-red-400">Silences</p>
              <p className="text-sm font-medium text-red-300">
                {preview.silences.length}
                <span className="text-[10px] text-red-400/60 ml-1">
                  ({preview.silences.reduce((s, r) => s + r.duration, 0).toFixed(1)}s)
                </span>
              </p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
              <p className="text-[10px] text-orange-400">Fillers</p>
              <p className="text-sm font-medium text-orange-300">
                {preview.fillers.length}
                <span className="text-[10px] text-orange-400/60 ml-1">
                  ({preview.fillers.reduce((s, f) => s + (f.endTime - f.startTime), 0).toFixed(1)}s)
                </span>
              </p>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-400">Total saved</span>
              <span className="text-xs font-medium text-cyan-300">{activeRemovedSec.toFixed(1)}s</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-zinc-500">Estimated duration</span>
              <span className="text-[10px] text-zinc-400">
                {totalDuration.toFixed(1)}s → {(totalDuration - activeRemovedSec).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom threshold slider */}
      {removalMode && (
        <PanelSlider
          label="Silence threshold"
          value={silenceThreshold}
          onChange={(v) => {
            setSilenceThreshold(v)
            if (removalMode) setRemovalMode(removalMode) // Re-detect
          }}
          min={0.1}
          max={3.0}
          step={0.1}
          precision={1}
          suffix="s"
        />
      )}

      {/* Filler word editor */}
      {removalMode === 'extra-fast' && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowFillerEditor(!showFillerEditor)}
            className="text-[10px] text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            Filler words ({fillerWords.length}) {showFillerEditor ? '▲' : '▼'}
          </button>

          {showFillerEditor && (
            <div className="space-y-1.5 p-2 rounded-lg bg-zinc-800/40 border border-white/5">
              <div className="flex flex-wrap gap-1">
                {fillerWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/10 text-[10px] text-orange-300"
                  >
                    {word}
                    <button onClick={() => removeFillerWord(word)} className="hover:text-red-400">
                      <X size={8} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <input
                  value={newFillerWord}
                  onChange={(e) => setNewFillerWord(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddFiller() }}
                  placeholder="Add filler word..."
                  className="flex-1 bg-zinc-900/50 text-[10px] text-zinc-200 rounded px-2 py-1 outline-none placeholder:text-zinc-600"
                />
                <button onClick={handleAddFiller} className="p-1 rounded text-zinc-500 hover:text-cyan-400">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Region list with toggle */}
      {removalMode && removalPreview.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500">Regions to remove ({activeEdits.length}/{removalPreview.length})</span>
          <div className="max-h-[150px] overflow-y-auto space-y-0.5 pr-1">
            {removalPreview.map((edit, idx) => {
              const excluded = excludedRegionIndices.has(idx)
              return (
                <button
                  key={idx}
                  onClick={() => toggleRegionExclusion(idx)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors',
                    excluded
                      ? 'bg-zinc-800/30 text-zinc-600 line-through'
                      : edit.reason.startsWith('Filler')
                        ? 'bg-orange-500/5 text-orange-300 hover:bg-orange-500/10'
                        : 'bg-red-500/5 text-red-300 hover:bg-red-500/10',
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full shrink-0', excluded ? 'bg-zinc-600' : edit.reason.startsWith('Filler') ? 'bg-orange-500' : 'bg-red-500')} />
                  <span className="text-[10px] flex-1 truncate">{edit.reason}</span>
                  <span className="text-[9px] text-zinc-500 tabular-nums">
                    {((edit.endFrame - edit.startFrame) / fps).toFixed(1)}s
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Apply button */}
      {removalMode && removalPreview.length > 0 && (
        <div className="space-y-1.5">
          {!showConfirmation ? (
            <button
              onClick={() => setShowConfirmation(true)}
              disabled={activeEdits.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-30"
            >
              <Scissors size={14} />
              Apply Removal ({activeEdits.length} segments)
            </button>
          ) : (
            <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-300">
                  Remove {activeEdits.length} segments totaling {activeRemovedSec.toFixed(1)}s? This can be undone with Ctrl+Z.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-cyan-500 text-white hover:bg-cyan-400"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
