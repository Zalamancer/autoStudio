import { useState, useCallback } from 'react'
import { Volume2, VolumeX, Loader2, Download, Sparkles, Clock, Music, Search as SearchIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelCategoryTabs, PanelSearchInput, PanelButtonGroup } from '@/components/ui/panel-controls'
import { useSoundEffectStore } from '@/stores/useSoundEffectStore'
import { getFreesoundService } from '@/services/freesound'
import { generateSoundEffect } from '@/services/elevenlabs'
import { useMediaStore } from '@/stores/useMediaStore'
import { saveMediaBlob } from '@/services/mediaDB'
import { toast } from '@/stores/useToastStore'
import type { FreesoundHit } from '@/services/freesound'
import { useShallow } from 'zustand/react/shallow'

const SFX_CATEGORIES = [
  { label: 'Whoosh', query: 'whoosh transition swoosh' },
  { label: 'Impact', query: 'impact hit dramatic' },
  { label: 'Nature', query: 'nature ambient birds' },
  { label: 'Crowd', query: 'crowd applause cheer' },
  { label: 'Tech', query: 'notification beep digital' },
  { label: 'Musical', query: 'musical stinger accent' },
]

export function SoundEffectsPanel() {
  const {
    searchQuery,
    source,
    results,
    isLoading,
    hasMore,
    currentPage,
    previewingId,
    generatePrompt,
    isGenerating,
    setSearchQuery,
    setSource,
    setLoading,
    setResults,
    appendResults,
    setGeneratePrompt,
    setGenerating,
    preview,
    stopPreview,
  } = useSoundEffectStore(useShallow((s) => ({
    searchQuery: s.searchQuery,
    source: s.source,
    results: s.results,
    isLoading: s.isLoading,
    hasMore: s.hasMore,
    currentPage: s.currentPage,
    previewingId: s.previewingId,
    generatePrompt: s.generatePrompt,
    isGenerating: s.isGenerating,
    setSearchQuery: s.setSearchQuery,
    setSource: s.setSource,
    setLoading: s.setLoading,
    setResults: s.setResults,
    appendResults: s.appendResults,
    setGeneratePrompt: s.setGeneratePrompt,
    setGenerating: s.setGenerating,
    preview: s.preview,
    stopPreview: s.stopPreview,
  })))

  const [addingIds, setAddingIds] = useState<number[]>([])

  const handleSearch = useCallback(async (query: string, page = 1) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const service = getFreesoundService()
      const res = await service.search({
        query: query.trim(),
        page,
        pageSize: 20,
        filter: 'duration:[0 TO 30]',
      })
      if (page === 1) {
        setResults(res.results, res.count, page)
      } else {
        appendResults(res.results, res.count, page)
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [setLoading, setResults, appendResults])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch(searchQuery)
  }

  const handleAddToTimeline = useCallback(async (hit: FreesoundHit) => {
    setAddingIds((prev) => [...prev, hit.id])
    try {
      const service = getFreesoundService()
      const blob = await service.downloadAsBlob(hit.previews['preview-hq-mp3'])
      const assetId = `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const url = URL.createObjectURL(blob)

      await saveMediaBlob(assetId, blob)
      const mediaStore = useMediaStore.getState()
      mediaStore.addAsset({
        id: assetId,
        name: `SFX: ${hit.name}`,
        type: 'audio/mpeg',
        size: blob.size,
        category: 'audio',
        url,
        addedAt: Date.now(),
      }, blob)
      mediaStore.addToCanvas(assetId)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAddingIds((prev) => prev.filter((id) => id !== hit.id))
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!generatePrompt.trim()) return
    setGenerating(true)
    try {
      const result = await generateSoundEffect({
        text: generatePrompt.trim(),
        promptInfluence: 0.3,
      })

      const assetId = `sfx_gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const url = URL.createObjectURL(result.audioBlob)

      await saveMediaBlob(assetId, result.audioBlob)
      const mediaStore = useMediaStore.getState()
      mediaStore.addAsset({
        id: assetId,
        name: `SFX: ${generatePrompt.trim()}`,
        type: 'audio/mpeg',
        size: result.audioBlob.size,
        category: 'audio',
        url,
        addedAt: Date.now(),
      }, result.audioBlob)
      mediaStore.addToCanvas(assetId)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [generatePrompt, setGenerating])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
          <Music size={14} className="text-green-400" />
          Sound Effects
        </h2>
      </div>

      {/* Source Toggle */}
      <div className="px-3 pb-2">
        <PanelCategoryTabs
          tabs={[
            { id: 'search', label: 'Search', icon: SearchIcon },
            { id: 'generate', label: 'AI Generate', icon: Sparkles },
          ]}
          activeTab={source}
          onChange={(id) => setSource(id as 'search' | 'generate')}
          compact
        />
      </div>

      {source === 'search' ? (
        <>
          {/* Search Input */}
          <div className="px-3 pb-2" onKeyDown={handleKeyDown}>
            <PanelSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search 500K+ sounds..."
            />
          </div>

          {/* Category Chips */}
          <div className="px-3 pb-2">
            <PanelButtonGroup
              options={SFX_CATEGORIES.map((cat) => ({ value: cat.query, label: cat.label }))}
              value=""
              onChange={(query) => {
                setSearchQuery(query)
                handleSearch(query)
              }}
            />
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {results.map((hit) => (
              <SFXResultItem
                key={hit.id}
                hit={hit}
                isPlaying={previewingId === hit.id}
                isAdding={addingIds.includes(hit.id)}
                onPreview={() => preview(hit)}
                onStopPreview={stopPreview}
                onAdd={() => handleAddToTimeline(hit)}
              />
            ))}

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-zinc-500" />
              </div>
            )}

            {hasMore && !isLoading && (
              <button
                onClick={() => handleSearch(searchQuery, currentPage + 1)}
                className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-2"
              >
                Load more...
              </button>
            )}

            {!isLoading && results.length === 0 && searchQuery && (
              <div className="text-center py-6 text-zinc-600 text-xs">
                No results. Try different keywords.
              </div>
            )}
          </div>
        </>
      ) : (
        /* AI Generate Tab */
        <div className="px-3 pb-3 space-y-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Describe the sound effect</label>
            <textarea
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              placeholder="e.g. dramatic orchestral hit, coin dropping on wooden table, sci-fi whoosh transition..."
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-purple-500/30 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !generatePrompt.trim()}
            className={cn(
              'w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
              isGenerating || !generatePrompt.trim()
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate & Add to Timeline
              </>
            )}
          </button>

          <div className="text-[10px] text-zinc-600 leading-relaxed">
            Uses ElevenLabs AI to generate custom sound effects from text descriptions. 15 credits per generation.
          </div>
        </div>
      )}
    </div>
  )
}

function SFXResultItem({
  hit,
  isPlaying,
  isAdding,
  onPreview,
  onStopPreview,
  onAdd,
}: {
  hit: FreesoundHit
  isPlaying: boolean
  isAdding: boolean
  onPreview: () => void
  onStopPreview: () => void
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group">
      {/* Play/Stop */}
      <button
        onClick={isPlaying ? onStopPreview : onPreview}
        className={cn(
          'w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-colors',
          isPlaying
            ? 'bg-green-500/20 text-green-400'
            : 'bg-zinc-700 text-zinc-400 hover:text-zinc-200'
        )}
      >
        {isPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-200 truncate">{hit.name}</div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="flex items-center gap-0.5">
            <Clock size={9} />
            {hit.duration.toFixed(1)}s
          </span>
          <span className="truncate">{hit.username}</span>
        </div>
      </div>

      {/* Add */}
      <button
        onClick={onAdd}
        disabled={isAdding}
        className={cn(
          'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
          isAdding
            ? 'bg-zinc-700 text-zinc-500'
            : 'bg-zinc-700 text-zinc-400 hover:bg-green-500/20 hover:text-green-400 opacity-0 group-hover:opacity-100'
        )}
      >
        {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      </button>
    </div>
  )
}
