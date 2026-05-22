/**
 * RepurposePanel — Upload audio/video -> transcribe -> AI extracts best clips -> generate shorts.
 *
 * Cinema-standardized workflow: shell, blue accent, matching styles.
 */

import { useState, useCallback, useRef } from 'react'
import { Scissors, Loader2, Square, CheckSquare, Play, AlertCircle, Upload, Star, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRepurposeStore } from '@/stores/useRepurposeStore'
import { transcribeAudio, type WhisperResult } from '@/services/whisperTranscript'
import { CreditCostTag } from '@/components/credits/CreditCostTag'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function RepurposePanel() {
  const {
    sourceTranscript,
    setSourceTranscript,
    extractedClips,
    selectedClipIds,
    isExtracting,
    isGenerating,
    generationProgress,
    extractClips,
    toggleClipSelection,
    selectAllClips,
    deselectAllClips,
    generateSelectedShorts,
    reset,
  } = useRepurposeStore()

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsTranscribing(true)
    setTranscribeError(null)

    try {
      const result: WhisperResult = await transcribeAudio(file)
      setSourceTranscript(result)
    } catch (err) {
      setTranscribeError(err instanceof Error ? err.message : 'Transcription failed')
    } finally {
      setIsTranscribing(false)
    }
  }, [setSourceTranscript])

  const hasClips = extractedClips.length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Upload / Transcribe Phase */}
        {!sourceTranscript && !isTranscribing && (
          <>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1.5">
                Upload a long video or audio to find the best clips
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 rounded-lg border-2 border-dashed border-zinc-700 hover:border-[#4a7eff]/40 bg-[#2a2a2a] hover:bg-[#4a7eff]/5 transition-all flex flex-col items-center gap-2"
              >
                <Upload size={20} className="text-zinc-500" />
                <span className="text-xs text-zinc-400">Upload audio or video</span>
                <span className="text-[10px] text-zinc-600">MP4, WebM, MP3, WAV</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {transcribeError && (
              <div className="flex items-start gap-1.5 text-[11px] text-red-400">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                {transcribeError}
              </div>
            )}
          </>
        )}

        {/* Transcribing */}
        {isTranscribing && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Loader2 size={28} className="mb-3 animate-spin text-[#4a7eff]" />
            <span className="text-sm text-gray-400">Transcribing audio...</span>
            <span className="text-xs text-gray-600 mt-1">This may take a moment</span>
          </div>
        )}

        {/* Transcript Ready — Extract Clips */}
        {sourceTranscript && !hasClips && !isExtracting && (
          <>
            <div className="bg-[#2a2a2a] rounded-lg p-2.5 border border-white/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-zinc-400 font-medium">Transcript</span>
                <span className="text-[10px] text-zinc-500">{formatDuration(sourceTranscript.duration)}</span>
              </div>
              <p className="text-[10px] text-zinc-500 line-clamp-3">
                {sourceTranscript.text}
              </p>
              <p className="text-[9px] text-zinc-600 mt-1">
                {sourceTranscript.segments.length} segments — {sourceTranscript.language}
              </p>
            </div>

            <button
              onClick={extractClips}
              className="w-full py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-2 bg-[#4a7eff] hover:bg-[#5a8eff] text-white shadow-lg shadow-[#4a7eff]/20 transition-colors"
            >
              <Scissors size={14} />
              Find Best Clips
              <CreditCostTag operation="gemini-script" />
            </button>

            <button
              onClick={reset}
              className="w-full text-[10px] text-zinc-500 hover:text-zinc-400"
            >
              Upload different file
            </button>
          </>
        )}

        {/* Extracting */}
        {isExtracting && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Loader2 size={28} className="mb-3 animate-spin text-[#4a7eff]" />
            <span className="text-sm text-gray-400">Finding best clips...</span>
          </div>
        )}

        {/* Clip Cards */}
        {hasClips && !isGenerating && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-zinc-400">
                {extractedClips.length} clips found
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllClips}
                  className="text-[10px] text-[#4a7eff] hover:text-[#5a8eff]"
                >
                  All
                </button>
                <button
                  onClick={deselectAllClips}
                  className="text-[10px] text-zinc-500 hover:text-zinc-400"
                >
                  None
                </button>
                <button
                  onClick={reset}
                  className="text-[10px] text-zinc-500 hover:text-red-400"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1">
              {extractedClips.map((clip) => {
                const isSelected = selectedClipIds.has(clip.id)
                const scoreColor = clip.viralityScore >= 70
                  ? 'text-[#4a7eff]'
                  : clip.viralityScore >= 40
                    ? 'text-amber-400'
                    : 'text-zinc-500'

                return (
                  <div
                    key={clip.id}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg text-left transition-colors border cursor-pointer',
                      isSelected
                        ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
                        : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                    )}
                    onClick={() => toggleClipSelection(clip.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">
                        {isSelected ? (
                          <CheckSquare size={14} className="text-[#4a7eff]" />
                        ) : (
                          <Square size={14} className="text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium text-zinc-200 truncate">
                            {clip.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={cn('text-[9px] font-bold', scoreColor)}>
                              <Star size={8} className="inline mr-0.5 -mt-0.5" />
                              {clip.viralityScore}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              <Clock size={8} className="inline mr-0.5 -mt-0.5" />
                              {formatDuration(clip.duration)}
                            </span>
                          </div>
                        </div>

                        {clip.hookRewrite && (
                          <p className="text-[10px] text-[#4a7eff] mt-0.5 italic line-clamp-1">
                            &ldquo;{clip.hookRewrite}&rdquo;
                          </p>
                        )}

                        <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-1">
                          {clip.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Generation Progress */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Loader2 size={28} className="mb-3 animate-spin text-[#4a7eff]" />
            <span className="text-sm text-gray-400">Generating clips...</span>
            {generationProgress > 0 && (
              <div className="w-full mt-3 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4a7eff] transition-all duration-300 rounded-full"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {hasClips && !isGenerating && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <button
            onClick={generateSelectedShorts}
            disabled={selectedClipIds.size === 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
              selectedClipIds.size === 0
                ? 'bg-[#2a2a2a] text-zinc-600 cursor-not-allowed border border-white/5'
                : 'bg-[#4a7eff] hover:bg-[#5a8eff] text-white shadow-lg shadow-[#4a7eff]/20',
            )}
          >
            <Play size={13} />
            Generate {selectedClipIds.size} Clip{selectedClipIds.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
