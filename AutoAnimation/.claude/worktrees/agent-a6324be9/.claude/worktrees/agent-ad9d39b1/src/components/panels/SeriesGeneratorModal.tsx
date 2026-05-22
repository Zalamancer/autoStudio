/**
 * Series Generator Modal — AI-powered series outline generation.
 * Topic input, episode count slider, arc type selector,
 * review screen with episode titles + prompts, and batch generation.
 */

import { useState, useCallback } from 'react'
import {
  X,
  Loader2,
  Sparkles,
  ChevronRight,
  ListOrdered,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSeriesStore } from '@/stores/useSeriesStore'
import type { SeriesOutline, NarrativeArc } from '@/types/series'
import { PanelSlider } from '@/components/ui/panel-controls'

const ARC_OPTIONS: { value: NarrativeArc; label: string; description: string }[] = [
  { value: 'standalone', label: 'Standalone', description: 'Each episode is independent' },
  { value: 'progressive', label: 'Progressive', description: 'Episodes build on each other' },
  { value: 'seasonal', label: 'Seasonal', description: 'Full narrative arc with climax' },
]

const ARC_POSITION_COLORS: Record<string, string> = {
  intro: 'text-blue-400',
  build: 'text-amber-400',
  climax: 'text-red-400',
  resolution: 'text-emerald-400',
}

interface SeriesGeneratorModalProps {
  onClose: () => void
  onGenerateAll: (prompts: string[]) => void
}

export function SeriesGeneratorModal({ onClose, onGenerateAll }: SeriesGeneratorModalProps) {
  const [topic, setTopic] = useState('')
  const [episodeCount, setEpisodeCount] = useState(5)
  const [arcType, setArcType] = useState<NarrativeArc>('standalone')
  const [outline, setOutline] = useState<SeriesOutline | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isGenerating = useSeriesStore((s) => s.isGeneratingOutline)
  const generateOutline = useSeriesStore((s) => s.generateOutline)
  const getOutlinePrompts = useSeriesStore((s) => s.getOutlinePrompts)

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || isGenerating) return
    setError(null)
    try {
      const result = await generateOutline(topic.trim(), episodeCount, arcType)
      setOutline(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outline')
    }
  }, [topic, episodeCount, arcType, isGenerating, generateOutline])

  const handleGenerateAll = useCallback(() => {
    if (!outline) return
    const prompts = getOutlinePrompts(outline)
    onGenerateAll(prompts)
    onClose()
  }, [outline, getOutlinePrompts, onGenerateAll, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ListOrdered size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Series Generator</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!outline ? (
            /* ── Input Phase ── */
            <>
              {/* Topic */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Series Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., 5 essential cooking tips for beginners"
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>

              {/* Episode Count */}
              <div>
                <PanelSlider
                  label="Episodes"
                  value={episodeCount}
                  onChange={(v) => setEpisodeCount(Math.round(v))}
                  min={3}
                  max={10}
                  step={1}
                />
              </div>

              {/* Arc Type */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Narrative Arc</label>
                <div className="grid grid-cols-3 gap-2">
                  {ARC_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setArcType(opt.value)}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition-all',
                        arcType === opt.value
                          ? 'bg-purple-500/15 border-purple-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10',
                      )}
                    >
                      <div className="text-xs font-medium">{opt.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{opt.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </>
          ) : (
            /* ── Review Phase ── */
            <>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-white">{outline.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{outline.theme}</p>
                {outline.sharedCharacters.length > 0 && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Characters: {outline.sharedCharacters.join(', ')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {outline.episodes.map((ep) => (
                  <EpisodeCard key={ep.episodeNumber} episode={ep} />
                ))}
              </div>

              <button
                onClick={() => setOutline(null)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Back to settings
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>

          {!outline ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  Generate Outline
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleGenerateAll}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              <Play size={12} />
              Generate All {outline.episodes.length} Episodes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Episode Card Component ──

function EpisodeCard({ episode }: { episode: SeriesOutline['episodes'][0] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-[10px] text-gray-500 font-mono w-5">
          #{episode.episodeNumber}
        </span>
        <span className="text-xs text-white font-medium flex-1 truncate">
          {episode.title}
        </span>
        <span className={cn('text-[9px] font-medium', ARC_POSITION_COLORS[episode.arcPosition] || 'text-gray-400')}>
          {episode.arcPosition}
        </span>
        <ChevronRight
          size={12}
          className={cn(
            'text-gray-500 transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 space-y-1.5 border-t border-white/5">
          <p className="text-[11px] text-gray-300 leading-relaxed mt-1.5">
            {episode.prompt}
          </p>
          {episode.hooks.length > 0 && (
            <div className="text-[10px] text-gray-500">
              <span className="text-gray-400 font-medium">Hooks: </span>
              {episode.hooks.join(' | ')}
            </div>
          )}
          <div className="text-[10px] text-gray-500">
            <span className="text-gray-400 font-medium">CTA: </span>
            {episode.cta}
          </div>
        </div>
      )}
    </div>
  )
}
