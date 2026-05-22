import { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  Play,
  Pause,
  Sparkles,
  X,
  Settings2,
  Maximize2,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Pencil,
  CheckCircle2,
} from 'lucide-react'
import type { ModelTier } from '@/services/svgAnimationAI'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelSlider, PanelToggle } from '@/components/ui/panel-controls'
import { useEditorStore } from '@/stores/useEditorStore'
import { useAnimationStore, type AnimationItem, type GenerationJob } from '@/stores/useAnimationStore'
import { sampleAnimations } from '@/data/sampleAnimations'

export function AnimationsPanel() {
  const {
    library,
    activeAnimations,
    selectedLibraryId,
    selectedActiveId,
    categoryFilter,
    searchQuery,
    generationJobs,
    generationError,
    initLibrary,
    addToCanvas,
    removeFromCanvas,
    updateActiveAnimation,
    setSelectedLibraryId,
    setSelectedActiveId,
    setCategoryFilter,
    setSearchQuery,
    getFilteredLibrary,
    generateFromPrompt,
    iterateAnimation,
    dismissJob,
    clearGenerationError,
  } = useAnimationStore()

  const [showActiveEditor, setShowActiveEditor] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiTier, setAiTier] = useState<ModelTier>('fast')
  const [transparentBg, setTransparentBg] = useState(true)
  /** When set, Generate becomes "Update" and replaces this animation */
  const [iteratingId, setIteratingId] = useState<string | null>(null)
  const iteratingItem = iteratingId ? library.find((a) => a.id === iteratingId) : null

  // Merge sample animations with any persisted AI items on mount
  const [samplesLoaded, setSamplesLoaded] = useState(false)
  useEffect(() => {
    if (!samplesLoaded) {
      initLibrary(sampleAnimations)
      setSamplesLoaded(true)
    }
  }, [samplesLoaded, initLibrary])

  const filteredLibrary = getFilteredLibrary()

  /** Submit: either iterate an existing animation or create a new one */
  const _handleSubmit = () => {
    const prompt = aiPrompt.trim()
    if (!prompt) return
    const category: 'background' | 'overlay' | 'transition' | undefined = transparentBg
      ? 'overlay'
      : categoryFilter !== 'all' ? categoryFilter : undefined

    if (iteratingId) {
      iterateAnimation(iteratingId, prompt)
      setIteratingId(null)
    } else {
      generateFromPrompt(prompt, category, aiTier)
    }
  }

  const selectedActive = activeAnimations.find((a) => a.id === selectedActiveId)
  const selectedLibraryItem = library.find((a) => a.id === selectedActive?.animationId)

  const categories: { id: 'all' | 'background' | 'overlay' | 'transition'; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'background', label: 'BG' },
    { id: 'overlay', label: 'Overlay' },
  ]

  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <PanelLayout
      icon={Sparkles}
      title="Animations"
      trailing={
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-panel-surface transition-colors"
            title="Search"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('animation-browser')}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-panel-surface transition-colors"
            title="Expand"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      }
      searchBar={{
        isOpen: searchOpen,
        onToggle: () => { setSearchOpen(false); setSearchQuery('') },
        query: searchQuery,
        onQueryChange: setSearchQuery,
        placeholder: 'Search animations...',
      }}
    >

      {/* ── Generate with AI ── */}
      <div className="rounded-lg border border-panel-border bg-panel-surface/60 overflow-hidden">
        <button
          onClick={() => setAiOpen(!aiOpen)}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
        >
          {aiOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Wand2 size={13} className="text-purple-400" />
          Generate with AI
        </button>

        {aiOpen && (
          <div className="px-3 pb-3 space-y-2">
            {/* Iterate mode indicator */}
            {iteratingItem && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                <Pencil size={10} className="text-purple-400 shrink-0" />
                <span className="text-[11px] text-purple-300 truncate flex-1">
                  Updating: {iteratingItem.name}
                </span>
                <button
                  onClick={() => setIteratingId(null)}
                  className="p-0.5 rounded hover:bg-white/10 text-purple-400 shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && aiPrompt.trim()) {
                  e.preventDefault()
                  _handleSubmit()
                }
              }}
              placeholder='Describe an animation, e.g. "bouncing ball", "rain particles"...'
              rows={2}
              className="w-full bg-panel-bg border border-panel-border rounded-md px-2.5 py-2 text-xs text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500/50"
            />

            {/* Options row: tier pills + transparent toggle */}
            <div className="flex items-center gap-2">
              {/* Model Tier Pills */}
              <div className="flex items-center gap-1">
                {([
                  { id: 'fast' as ModelTier, label: 'Fast' },
                  { id: 'quality' as ModelTier, label: 'Quality' },
                  { id: 'ultra' as ModelTier, label: 'Ultra' },
                ]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setAiTier(t.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors',
                      aiTier === t.id
                        ? t.id === 'ultra'
                          ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30'
                          : 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30'
                        : 'bg-panel-surface text-gray-500 hover:text-gray-300'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-3 bg-panel-surface-hover" />

              {/* Transparent BG toggle */}
              <button
                onClick={() => setTransparentBg(!transparentBg)}
                className={cn(
                  'px-2 py-1 rounded-full text-[10px] font-medium transition-colors',
                  transparentBg
                    ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30'
                    : 'bg-panel-surface text-gray-500 hover:text-gray-300'
                )}
                title={transparentBg ? 'Background: transparent' : 'Background: filled'}
              >
                {transparentBg ? 'No BG' : 'With BG'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { if (aiPrompt.trim()) _handleSubmit() }}
                disabled={!aiPrompt.trim()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  !aiPrompt.trim()
                    ? 'bg-panel-surface-hover text-gray-500 cursor-not-allowed'
                    : iteratingId
                      ? 'bg-purple-600 text-white hover:bg-purple-500'
                      : 'bg-purple-600 text-white hover:bg-purple-500'
                )}
              >
                {iteratingId ? (
                  <>
                    <Pencil size={12} />
                    Update
                  </>
                ) : (
                  <>
                    <Wand2 size={12} />
                    Generate
                  </>
                )}
              </button>
              {!iteratingId && categoryFilter !== 'all' && (
                <span className="text-[10px] text-gray-500">
                  Category: {categoryFilter}
                </span>
              )}
            </div>

            {/* ── Active generation jobs ── */}
            {generationJobs.length > 0 && (
              <div className="space-y-1.5">
                {generationJobs.map((job) => (
                  <GenerationJobCard key={job.id} job={job} onDismiss={() => dismissJob(job.id)} />
                ))}
              </div>
            )}

            {generationError && generationJobs.every((j) => j.status !== 'error') && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
                <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-[11px] text-red-400 flex-1">{generationError}</span>
                <button
                  onClick={clearGenerationError}
                  className="p-0.5 rounded hover:bg-white/10 text-red-400 shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Filter pills ── */}
      <div className="flex items-center gap-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              categoryFilter === cat.id
                ? 'bg-white text-black'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-panel-surface'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Active Animations on Canvas */}
      {activeAnimations.length > 0 && (
        <div className="mb-3 p-2 bg-panel-surface/80 rounded-lg border border-panel-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              On Canvas ({activeAnimations.length})
            </span>
            <button
              onClick={() => setShowActiveEditor(!showActiveEditor)}
              className="p-1 rounded hover:bg-panel-surface-hover text-gray-400"
            >
              <Settings2 size={12} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {activeAnimations.map((active) => {
              const item = library.find((a) => a.id === active.animationId)
              return (
                <div
                  key={active.id}
                  onClick={() => setSelectedActiveId(active.id)}
                  className={cn(
                    'rounded text-xs cursor-pointer transition-colors px-2 py-1.5',
                    selectedActiveId === active.id
                      ? 'bg-accent/10 border border-accent/30'
                      : 'bg-panel-surface-hover hover:bg-panel-surface-hover'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-24 text-white">{item?.name || 'Unknown'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromCanvas(active.id)
                      }}
                      className="p-0.5 rounded hover:bg-white/20 text-gray-400"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <PanelSlider
                      label="Speed"
                      value={active.speed}
                      onChange={(v) => updateActiveAnimation(active.id, { speed: v })}
                      min={0.25}
                      max={3}
                      step={0.25}
                      precision={2}
                      suffix="x"
                      compact
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active Animation Editor */}
          {showActiveEditor && selectedActive && (
            <div className="mt-3 pt-3 border-t border-panel-border space-y-2">
              <div className="text-xs text-gray-400 font-medium">{selectedLibraryItem?.name}</div>

              {/* Play/Pause */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Playback</span>
                <button
                  onClick={() =>
                    updateActiveAnimation(selectedActive.id, {
                      isPlaying: !selectedActive.isPlaying,
                    })
                  }
                  className={cn(
                    'p-1.5 rounded',
                    selectedActive.isPlaying
                      ? 'bg-accent text-white'
                      : 'bg-panel-surface-hover text-gray-400'
                  )}
                >
                  {selectedActive.isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>

              {/* Loop */}
              <PanelToggle
                label="Loop"
                checked={selectedActive.loop}
                onChange={(v) => updateActiveAnimation(selectedActive.id, { loop: v })}
              />

              {/* Speed */}
              <PanelSlider
                label="Speed"
                value={selectedActive.speed}
                onChange={(v) => updateActiveAnimation(selectedActive.id, { speed: v })}
                min={0.25}
                max={3}
                step={0.25}
                precision={2}
                suffix="x"
                compact
              />

              {/* Opacity */}
              <PanelSlider
                label="Opacity"
                value={selectedActive.opacity}
                onChange={(v) => updateActiveAnimation(selectedActive.id, { opacity: v })}
                min={0}
                max={1}
                step={0.1}
                precision={0}
                compact
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />

              {/* Scale */}
              <PanelSlider
                label="Scale"
                value={selectedActive.scale}
                onChange={(v) => updateActiveAnimation(selectedActive.id, { scale: v })}
                min={0.5}
                max={2}
                step={0.1}
                precision={0}
                compact
                formatValue={(v) => `${Math.round(v * 100)}%`}
              />
            </div>
          )}
        </div>
      )}

      {/* Library Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredLibrary.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No animations found
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredLibrary.map((animation) => (
              <AnimationCard
                key={animation.id}
                animation={animation}
                isSelected={selectedLibraryId === animation.id}
                onSelect={() => setSelectedLibraryId(animation.id)}
                onAdd={() => addToCanvas(animation.id)}
                onIterate={animation.sourcePrompt ? () => {
                  setAiPrompt(animation.sourcePrompt!)
                  setAiTier(animation.modelTier ?? 'fast')
                  setIteratingId(animation.id)
                  setAiOpen(true)
                } : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </PanelLayout>
  )
}

interface AnimationCardProps {
  animation: AnimationItem
  isSelected: boolean
  onSelect: () => void
  onAdd: () => void
  onIterate?: () => void
}

function AnimationCard({ animation, isSelected, onSelect, onAdd, onIterate }: AnimationCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const categoryColors = {
    background: 'bg-blue-500/20 text-blue-400',
    overlay: 'bg-purple-500/20 text-accent',
    transition: 'bg-orange-500/20 text-orange-400',
  }

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative rounded-lg border overflow-hidden cursor-pointer transition-all',
        isSelected
          ? 'border-accent bg-accent/10'
          : 'border-panel-border bg-panel-surface hover:border-panel-border'
      )}
    >
      {/* Thumbnail / Preview */}
      <div className="aspect-video bg-panel-bg flex items-center justify-center">
        {animation.thumbnail ? (
          <img
            src={animation.thumbnail}
            alt={animation.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Sparkles size={24} className="text-gray-600" />
        )}

        {/* Hover overlay with action buttons */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className="flex items-center gap-1 bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Plus size={13} />
              Add
            </button>
            {onIterate && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onIterate()
                }}
                className="flex items-center gap-1 bg-purple-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-medium"
                title="Edit prompt & regenerate"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="text-xs font-medium text-white truncate">{animation.name}</div>
        <div className="flex items-center gap-1 mt-1">
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              categoryColors[animation.category]
            )}
          >
            {animation.category}
          </span>
          {animation.modelTier && (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              animation.modelTier === 'ultra'
                ? 'bg-amber-500/20 text-amber-400'
                : animation.modelTier === 'quality'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-500/20 text-gray-400'
            )}>
              {animation.modelTier}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Generation Job Progress Card ──

const TIER_COLORS: Record<ModelTier, string> = {
  fast: 'bg-purple-500',
  quality: 'bg-emerald-500',
  ultra: 'bg-amber-500',
}

const TIER_BG_COLORS: Record<ModelTier, string> = {
  fast: 'bg-purple-500/20',
  quality: 'bg-emerald-500/20',
  ultra: 'bg-amber-500/20',
}

const TIER_TEXT_COLORS: Record<ModelTier, string> = {
  fast: 'text-purple-400',
  quality: 'text-emerald-400',
  ultra: 'text-amber-400',
}

function GenerationJobCard({ job, onDismiss }: { job: GenerationJob; onDismiss: () => void }) {
  const pct = Math.round(job.progress * 100)

  return (
    <div className={cn(
      'rounded-md border px-2.5 py-2 space-y-1.5',
      job.status === 'error'
        ? 'border-red-500/30 bg-red-500/5'
        : job.status === 'done'
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-panel-border bg-panel-bg'
    )}>
      {/* Header row */}
      <div className="flex items-center gap-1.5">
        {job.status === 'generating' && (
          <Loader2 size={10} className={cn('animate-spin shrink-0', TIER_TEXT_COLORS[job.tier])} />
        )}
        {job.status === 'done' && (
          <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />
        )}
        {job.status === 'error' && (
          <AlertCircle size={10} className="text-red-400 shrink-0" />
        )}
        <span className="text-[11px] text-gray-300 truncate flex-1">
          {job.prompt.length > 40 ? job.prompt.slice(0, 40) + '...' : job.prompt}
        </span>
        <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded', TIER_BG_COLORS[job.tier], TIER_TEXT_COLORS[job.tier])}>
          {job.tier}
        </span>
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 shrink-0"
        >
          <X size={9} />
        </button>
      </div>

      {/* Progress bar */}
      {job.status === 'generating' && (
        <div className="relative h-1.5 rounded-full bg-panel-surface overflow-hidden">
          <div
            className={cn('absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out', TIER_COLORS[job.tier])}
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className={cn(
              'h-full w-[200%] animate-[shimmer_1.5s_ease-in-out_infinite]',
              'bg-gradient-to-r from-transparent via-white/10 to-transparent'
            )} />
          </div>
        </div>
      )}

      {/* Done: full green bar */}
      {job.status === 'done' && (
        <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" />
      )}

      {/* Error message */}
      {job.status === 'error' && job.error && (
        <p className="text-[10px] text-red-400">{job.error}</p>
      )}

      {/* Percentage / status text */}
      {job.status === 'generating' && (
        <p className="text-[10px] text-gray-500">{pct}%</p>
      )}
    </div>
  )
}
