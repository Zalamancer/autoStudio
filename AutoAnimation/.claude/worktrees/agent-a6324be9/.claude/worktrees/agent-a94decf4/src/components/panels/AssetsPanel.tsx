/**
 * Unified Assets Panel — consolidates SVG Art, Components, Motion Design, and Animations
 * into a single flat library with category filters and a collapsible AI generation section.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Layers,
  Search,
  SlidersHorizontal,
  Plus,
  Sparkles,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Shuffle,
  Save,
} from 'lucide-react'
import type { ModelTier } from '@/services/svgAnimationAI'
import { cn } from '@/lib/utils'
import { PanelCategoryTabs, PanelSlider, PanelToggle, PanelSelect } from '@/components/ui/panel-controls'
import { sanitizeSvg } from '@/services/sanitize'
import { useEditorStore } from '@/stores/useEditorStore'
import { useAnimationStore, type GenerationJob } from '@/stores/useAnimationStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { sampleAnimations } from '@/data/sampleAnimations'
import {
  generateSVGArt,
  wrapSVGAsHTML,
  ART_STYLES,
  COLOR_PALETTES,
  type ArtStyle,
  type ArtOptions,
} from '@/services/svgArtGenerator'
import { parseTemplateConfig } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { generateComponent } from '@/services/componentGenerator'
import { generateMotionDesign } from '@/services/motionDesignGenerator'
import { registerAndAddMotionDesign } from '@/motionGraphics/dynamicRegistry'

// ── Category filter type ──

type AssetCategory = 'all' | 'backgrounds' | 'overlays' | 'typography' | 'components' | 'patterns'

const CATEGORY_FILTERS: { id: AssetCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'backgrounds', label: 'Backgrounds' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'typography', label: 'Typography' },
  { id: 'components', label: 'Components' },
  { id: 'patterns', label: 'Patterns' },
]

type AssetTab = 'browse' | 'generate'
const ASSET_TABS: { id: AssetTab; label: string; icon: typeof Layers }[] = [
  { id: 'browse', label: 'Browse', icon: Layers },
  { id: 'generate', label: 'Generate', icon: Wand2 },
]

// ── AI Generation type ──

type GenerationType = 'animation' | 'component' | 'motion-design'

const GENERATION_TYPES: { value: GenerationType; label: string }[] = [
  { value: 'animation', label: 'Animation' },
  { value: 'component', label: 'Component' },
  { value: 'motion-design', label: 'Motion Design' },
]

const COMPONENT_STYLES = [
  'modern',
  'glassmorphism',
  'minimal',
  'retro',
  'neon',
  'brutalism',
  'neumorphism',
  'gradient',
  'dark',
  'pastel',
] as const

// ── SVG Art saved items ──

interface SavedSVGArt {
  id: string
  name: string
  style: ArtStyle
  svg: string
  palette: string[]
  options: ArtOptions
  date: number
}

const SVG_STORAGE_KEY = 'proanimate-svg-art-saved'

function loadSavedSVGArt(): SavedSVGArt[] {
  try {
    const raw = localStorage.getItem(SVG_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Saved components ──

interface SavedComponent {
  id: string
  name: string
  description: string
  html: string
  style: string
  savedAt: number
}

const COMP_STORAGE_KEY = 'proanimate-saved-components'

function loadSavedComponents(): SavedComponent[] {
  try {
    const raw = localStorage.getItem(COMP_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Saved motion designs ──

interface SavedMotionDesign {
  id: string
  name: string
  description: string
  data: any
  savedAt: number
}

const MD_STORAGE_KEY = 'proanimate-saved-motion-designs'

function loadSavedMotionDesigns(): SavedMotionDesign[] {
  try {
    const raw = localStorage.getItem(MD_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Unified asset item for grid display ──

interface AssetGridItem {
  id: string
  name: string
  category: AssetCategory
  type: 'animation' | 'svg-art' | 'component' | 'motion-design'
  thumbnail?: string
  onAdd: () => void
  sourceData?: any
}

// ── Panel ──

export function AssetsPanel() {
  const [activeTab, setActiveTab] = useState<AssetTab>('browse')
  const [category, setCategory] = useState<AssetCategory>('all')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeOpen, setActiveOpen] = useState(true)

  // SVG Art configurator state
  const [svgConfigStyle, setSvgConfigStyle] = useState<ArtStyle | null>(null)
  const [svgPaletteId, setSvgPaletteId] = useState('neon')
  const [svgComplexity, setSvgComplexity] = useState(5)
  const [svgAnimated, setSvgAnimated] = useState(true)
  const [svgSeed, setSvgSeed] = useState(() => Math.floor(Math.random() * 999999))

  // AI generation state
  const [genType, setGenType] = useState<GenerationType>('animation')
  const [genPrompt, setGenPrompt] = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [aiTier, setAiTier] = useState<ModelTier>('fast')
  const [compStyle, setCompStyle] = useState<string>('modern')
  const [transparentBg, setTransparentBg] = useState(true)

  // Animation store
  const {
    library,
    activeAnimations,
    selectedActiveId,
    generationJobs,
    generationError,
    initLibrary,
    addToCanvas: addAnimToCanvas,
    removeFromCanvas,
    updateActiveAnimation,
    setSelectedActiveId,
    generateFromPrompt,
    dismissJob,
    clearGenerationError,
  } = useAnimationStore()

  // Load saved items
  const [savedSVGArt] = useState<SavedSVGArt[]>(loadSavedSVGArt)
  const [savedComponents] = useState<SavedComponent[]>(loadSavedComponents)
  const [savedMotionDesigns] = useState<SavedMotionDesign[]>(loadSavedMotionDesigns)

  // Init animation library
  const [samplesLoaded, setSamplesLoaded] = useState(false)
  useEffect(() => {
    if (!samplesLoaded) {
      initLibrary(sampleAnimations)
      setSamplesLoaded(true)
    }
  }, [samplesLoaded, initLibrary])

  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)

  // Add SVG art to canvas
  const addSVGArtToCanvas = useCallback(
    (svg: string, palette: string[], name: string, styleName: string) => {
      const html = wrapSVGAsHTML(svg, palette, name)
      const bridgedHtml = injectMessageBridge(html)
      const staticConfig = parseTemplateConfig(bridgedHtml)
      const totalFrames = useTimelineStore.getState().totalFrames
      const templateId = `svg-art-${Date.now()}`

      useHTMLTemplateLayerStore.getState().addTemplate({
        id: templateId,
        htmlContent: bridgedHtml,
        name: `SVG Art: ${styleName}`,
        position: { x: 0, y: 0 },
        scale: 1,
        opacity: 1,
        zIndex: 1,
        rotation: 0,
        visible: true,
        width: canvasWidth,
        height: canvasHeight,
        startFrame: 0,
        endFrame: totalFrames,
        customConfig: staticConfig,
      })
      useHTMLTemplateLayerStore.getState().setSelectedTemplateId(templateId)
      useEditorStore.getState().setRightPanelTab('html-template-properties')
    },
    [canvasWidth, canvasHeight],
  )

  // Add component to canvas
  const addComponentToCanvas = useCallback(
    (html: string, name: string) => {
      const bridgedHtml = injectMessageBridge(html)
      const config = parseTemplateConfig(html)
      const totalFrames = useTimelineStore.getState().totalFrames
      const templateId = `comp-${Date.now()}`

      useHTMLTemplateLayerStore.getState().addTemplate({
        id: templateId,
        htmlContent: bridgedHtml,
        name,
        position: { x: 0, y: 0 },
        scale: 1,
        opacity: 1,
        zIndex: 1,
        rotation: 0,
        visible: true,
        width: canvasWidth,
        height: canvasHeight,
        startFrame: 0,
        endFrame: totalFrames,
        customConfig: config,
      })
    },
    [canvasWidth, canvasHeight],
  )

  // Build unified asset list
  const allAssets: AssetGridItem[] = []

  // Lottie animations from library
  for (const anim of library) {
    const cat: AssetCategory =
      anim.category === 'background' ? 'backgrounds' : anim.category === 'overlay' ? 'overlays' : 'overlays'
    allAssets.push({
      id: `anim-${anim.id}`,
      name: anim.name,
      category: cat,
      type: 'animation',
      thumbnail: anim.thumbnail,
      onAdd: () => addAnimToCanvas(anim.id),
      sourceData: anim,
    })
  }

  // SVG art styles as browsable patterns — clicking opens configurator
  for (const style of ART_STYLES) {
    allAssets.push({
      id: `svg-style-${style.id}`,
      name: style.label,
      category: 'patterns',
      type: 'svg-art',
      onAdd: () => {
        setSvgConfigStyle(style.id)
        setSvgSeed(Math.floor(Math.random() * 999999))
      },
    })
  }

  // Saved SVG art
  for (const item of savedSVGArt) {
    allAssets.push({
      id: `saved-svg-${item.id}`,
      name: item.name,
      category: 'patterns',
      type: 'svg-art',
      onAdd: () => addSVGArtToCanvas(item.svg, item.palette, item.name, item.name),
    })
  }

  // Saved components
  for (const comp of savedComponents) {
    allAssets.push({
      id: `saved-comp-${comp.id}`,
      name: comp.name,
      category: 'components',
      type: 'component',
      onAdd: () => addComponentToCanvas(comp.html, comp.name),
    })
  }

  // Saved motion designs
  for (const md of savedMotionDesigns) {
    allAssets.push({
      id: `saved-md-${md.id}`,
      name: md.name,
      category: 'typography',
      type: 'motion-design',
      onAdd: () => registerAndAddMotionDesign(md.data),
    })
  }

  // Filter
  const q = search.toLowerCase().trim()
  const filtered = allAssets.filter((item) => {
    if (category !== 'all' && item.category !== category) return false
    if (q && !item.name.toLowerCase().includes(q)) return false
    return true
  })

  // AI generate handler
  const handleGenerate = useCallback(async () => {
    const prompt = genPrompt.trim()
    if (!prompt || genLoading) return
    setGenLoading(true)
    setGenError(null)

    try {
      if (genType === 'animation') {
        const animCategory: 'background' | 'overlay' | undefined = transparentBg ? 'overlay' : undefined
        generateFromPrompt(prompt, animCategory, aiTier)
      } else if (genType === 'component') {
        const result = await generateComponent({ prompt, style: compStyle, aspectRatio: '16:9', animated: true })
        addComponentToCanvas(result.html, result.name)
      } else if (genType === 'motion-design') {
        const result = await generateMotionDesign({
          prompt,
          style: 'modern',
          colorMood: 'vibrant',
          flowRole: 'title',
          emotion: 'vibrant',
        })
        registerAndAddMotionDesign(result)
      }
    } catch (err: any) {
      setGenError(err.message || 'Generation failed')
    } finally {
      setGenLoading(false)
    }
  }, [genPrompt, genType, genLoading, aiTier, compStyle, transparentBg, generateFromPrompt, addComponentToCanvas])

  // Category badge colors
  const categoryColors: Record<string, string> = {
    animation: 'bg-[#4a7eff]/20 text-[#4a7eff]',
    'svg-art': 'bg-emerald-500/20 text-emerald-400',
    component: 'bg-violet-500/20 text-violet-400',
    'motion-design': 'bg-teal-500/20 text-teal-400',
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Pill Tab Bar (Browse / Generate) ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {ASSET_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{ transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms' }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'generate' ? (
        /* ══ Generate tab ══ */
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            <div className="space-y-2">
              {/* Prompt */}
              <textarea
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && genPrompt.trim()) {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
                placeholder={
                  genType === 'animation'
                    ? 'Describe an animation, e.g. "bouncing ball", "rain particles"...'
                    : genType === 'component'
                      ? 'Describe a component, e.g. "glassmorphism pricing card"...'
                      : 'Describe a motion design, e.g. "animated bar chart"...'
                }
                rows={2}
                className="w-full bg-[#1e1e1e] border border-white/5 rounded-lg px-2.5 py-2 text-xs text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#4a7eff]/50"
              />

              {/* Type selector */}
              <PanelSelect
                label="Type"
                value={genType}
                onChange={(v) => setGenType(v as GenerationType)}
                options={GENERATION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                fullWidth
              />

              {/* Animation-specific options */}
              {genType === 'animation' && (
                <>
                  <PanelSelect
                    label="Quality"
                    value={aiTier}
                    onChange={(v) => setAiTier(v as ModelTier)}
                    options={[
                      { value: 'fast', label: 'Fast' },
                      { value: 'quality', label: 'Quality' },
                      { value: 'ultra', label: 'Ultra' },
                    ]}
                    fullWidth
                  />
                  <PanelSelect
                    label="Background"
                    value={transparentBg ? 'off' : 'on'}
                    onChange={(v) => setTransparentBg(v === 'off')}
                    options={[
                      { value: 'on', label: 'On' },
                      { value: 'off', label: 'Off' },
                    ]}
                    fullWidth
                  />
                </>
              )}

              {/* Component-specific options */}
              {genType === 'component' && (
                <PanelSelect
                  label="Style"
                  value={compStyle}
                  onChange={setCompStyle}
                  options={COMPONENT_STYLES.map((s) => ({
                    value: s,
                    label: s.charAt(0).toUpperCase() + s.slice(1),
                  }))}
                  fullWidth
                />
              )}

              {/* Error */}
              {(genError || generationError) && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-red-400 flex-1">{genError || generationError}</span>
                  <button
                    onClick={() => {
                      setGenError(null)
                      clearGenerationError()
                    }}
                    className="p-0.5 rounded hover:bg-white/10 text-red-400 shrink-0"
                  >
                    <X size={10} />
                  </button>
                </div>
              )}

              {/* Generation jobs */}
              {generationJobs.length > 0 && (
                <div className="space-y-1.5">
                  {generationJobs.map((job) => (
                    <GenerationJobCard key={job.id} job={job} onDismiss={() => dismissJob(job.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate button — sticky footer */}
          <div className="shrink-0 px-3 py-2 border-t border-white/5">
            <button
              onClick={handleGenerate}
              disabled={!genPrompt.trim() || genLoading}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors',
                !genPrompt.trim() || genLoading
                  ? 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed'
                  : 'bg-[#4a7eff] text-white hover:bg-[#5a8aff]',
              )}
            >
              {genLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={14} />
                  Generate
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        /* ══ Browse tab ══ */
        <>
          {/* ── Search Bar + Filter Toggle ── */}
          <div className="shrink-0 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                  filtersOpen
                    ? 'bg-[#4a7eff]/20 text-[#4a7eff]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
                )}
              >
                <SlidersHorizontal size={14} />
                {category !== 'all' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />
                )}
              </button>
            </div>
          </div>

          {/* ── Category filter ── */}
          {filtersOpen && (
            <div className="shrink-0 px-3 pb-2">
              <PanelCategoryTabs
                tabs={CATEGORY_FILTERS}
                activeTab={category}
                onChange={(id) => setCategory(id as AssetCategory)}
                compact
              />
            </div>
          )}

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {/* ── On Canvas (collapsible) ── */}
            {activeAnimations.length > 0 && (
              <div className="rounded-lg border border-white/5 bg-[#2a2a2a] overflow-hidden">
                <button
                  onClick={() => setActiveOpen(!activeOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {activeOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <Sparkles size={13} className="text-[#4a7eff]" />
                  On Canvas ({activeAnimations.length})
                </button>

                {activeOpen && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {activeAnimations.map((active) => {
                      const item = library.find((a) => a.id === active.animationId)
                      return (
                        <div
                          key={active.id}
                          onClick={() => setSelectedActiveId(active.id)}
                          className={cn(
                            'rounded-lg text-xs cursor-pointer transition-colors px-2 py-1.5 border',
                            selectedActiveId === active.id
                              ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
                              : 'bg-[#3a3a3a] border-white/5 hover:bg-[#444]',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate max-w-[160px] text-white">{item?.name || 'Unknown'}</span>
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
                )}
              </div>
            )}

            {/* ── SVG Art Configurator (shown when a pattern is selected) ── */}
            {svgConfigStyle ? (
              <SVGArtConfigurator
                style={svgConfigStyle}
                paletteId={svgPaletteId}
                setPaletteId={setSvgPaletteId}
                complexity={svgComplexity}
                setComplexity={setSvgComplexity}
                animated={svgAnimated}
                setAnimated={setSvgAnimated}
                seed={svgSeed}
                setSeed={setSvgSeed}
                onBack={() => setSvgConfigStyle(null)}
                onAdd={addSVGArtToCanvas}
              />
            ) : (
              /* ── Asset grid ── */
              <>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                    <Layers size={28} className="mb-3" />
                    <span className="text-sm text-gray-400">No assets found</span>
                    <span className="text-xs text-gray-600 mt-1">Try a different keyword or category</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filtered.map((asset) => (
                      <AssetCard key={asset.id} asset={asset} categoryColors={categoryColors} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── SVG Art Configurator ──

const SVG_STORAGE_KEY_SAVE = 'proanimate-svg-art-saved'

function SVGArtConfigurator({
  style,
  paletteId,
  setPaletteId,
  complexity,
  setComplexity,
  animated,
  setAnimated,
  seed,
  setSeed,
  onBack,
  onAdd,
}: {
  style: ArtStyle
  paletteId: string
  setPaletteId: (id: string) => void
  complexity: number
  setComplexity: (v: number) => void
  animated: boolean
  setAnimated: (v: boolean) => void
  seed: number
  setSeed: (v: number) => void
  onBack: () => void
  onAdd: (svg: string, palette: string[], name: string, styleName: string) => void
}) {
  const palette = COLOR_PALETTES.find((p) => p.id === paletteId)?.colors || COLOR_PALETTES[0].colors
  const styleLabel = ART_STYLES.find((s) => s.id === style)?.label || style

  const options: ArtOptions = useMemo(
    () => ({ style, width: 800, height: 600, palette, complexity, seed, animated }),
    [style, palette, complexity, seed, animated],
  )

  const { svg, name } = useMemo(() => generateSVGArt(options), [options])

  const handleRandomize = useCallback(() => setSeed(Math.floor(Math.random() * 999999)), [setSeed])

  const handleAdd = useCallback(() => {
    onAdd(svg, palette, name, styleLabel)
  }, [svg, palette, name, styleLabel, onAdd])

  const handleSave = useCallback(() => {
    try {
      const raw = localStorage.getItem(SVG_STORAGE_KEY_SAVE)
      const existing = raw ? JSON.parse(raw) : []
      const item = {
        id: `saved-${Date.now()}`,
        name: `${styleLabel} #${seed}`,
        style,
        svg,
        palette,
        options,
        date: Date.now(),
      }
      localStorage.setItem(SVG_STORAGE_KEY_SAVE, JSON.stringify([item, ...existing]))
    } catch {
      /* ignore */
    }
  }, [svg, palette, style, seed, options, styleLabel])

  return (
    <div className="space-y-3">
      {/* Back header */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <span className="text-sm font-medium text-white">{styleLabel}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">pattern</span>
      </div>

      {/* Live preview */}
      <div
        className="w-full aspect-[4/3] bg-[#1e1e1e] rounded-lg overflow-hidden border border-white/5"
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svg) }}
      />

      {/* Palette picker */}
      <div>
        <span className="text-[11px] text-zinc-500 mb-1.5 block">Palette</span>
        <div className="grid grid-cols-2 gap-1.5">
          {COLOR_PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPaletteId(p.id)}
              className={cn(
                'flex flex-col gap-1 rounded-lg overflow-hidden transition-all border',
                paletteId === p.id
                  ? 'border-[#4a7eff] bg-[#4a7eff]/10'
                  : 'border-white/5 bg-[#2a2a2a] hover:border-gray-600',
              )}
            >
              <div className="flex w-full h-5">
                {p.colors.map((c, i) => (
                  <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 px-1.5 pb-1">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Complexity + Animated */}
      <div className="space-y-2">
        <PanelSlider label="Complexity" value={complexity} onChange={setComplexity} min={1} max={10} step={1} />
        <PanelToggle label="Animated" checked={animated} onChange={setAnimated} />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleRandomize}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#2a2a2a] border border-white/5 text-gray-300 hover:text-white hover:bg-[#3a3a3a] text-xs font-medium transition-colors"
        >
          <Shuffle size={12} />
          Randomize
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-2 rounded-lg bg-[#2a2a2a] border border-white/5 text-gray-300 hover:text-white hover:bg-[#3a3a3a] transition-colors"
          title="Save"
        >
          <Save size={12} />
        </button>
      </div>

      {/* Add to Canvas */}
      <button
        onClick={handleAdd}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[#4a7eff] hover:bg-[#5a8aff] text-white text-xs font-medium transition-colors"
      >
        <Plus size={13} />
        Add to Canvas
      </button>
    </div>
  )
}

// ── Asset Card ──

function AssetCard({ asset, categoryColors }: { asset: AssetGridItem; categoryColors: Record<string, string> }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-lg border border-white/5 bg-[#2a2a2a] overflow-hidden cursor-pointer transition-all hover:border-[#4a7eff]/30"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-[#1e1e1e] flex items-center justify-center">
        {asset.thumbnail ? (
          <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <Sparkles size={24} className="text-gray-600" />
        )}

        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                asset.onAdd()
              }}
              className="flex items-center gap-1 bg-[#4a7eff] text-white px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <Plus size={13} />
              Add
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <div className="text-xs font-medium text-white truncate">{asset.name}</div>
        <div className="flex items-center gap-1 mt-1">
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded',
              categoryColors[asset.type] || 'bg-gray-500/20 text-gray-400',
            )}
          >
            {asset.type === 'svg-art' ? 'pattern' : asset.type === 'motion-design' ? 'motion' : asset.type}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Generation Job Card (from AnimationsPanel) ──

const TIER_COLORS: Record<ModelTier, string> = {
  fast: 'bg-[#4a7eff]',
  quality: 'bg-emerald-500',
  ultra: 'bg-amber-500',
}

const TIER_BG_COLORS: Record<ModelTier, string> = {
  fast: 'bg-[#4a7eff]/20',
  quality: 'bg-emerald-500/20',
  ultra: 'bg-amber-500/20',
}

const TIER_TEXT_COLORS: Record<ModelTier, string> = {
  fast: 'text-[#4a7eff]',
  quality: 'text-emerald-400',
  ultra: 'text-amber-400',
}

function GenerationJobCard({ job, onDismiss }: { job: GenerationJob; onDismiss: () => void }) {
  const pct = Math.round(job.progress * 100)

  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-2 space-y-1.5',
        job.status === 'error'
          ? 'border-red-500/30 bg-red-500/5'
          : job.status === 'done'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-white/5 bg-[#1e1e1e]',
      )}
    >
      <div className="flex items-center gap-1.5">
        {job.status === 'generating' && (
          <Loader2 size={10} className={cn('animate-spin shrink-0', TIER_TEXT_COLORS[job.tier])} />
        )}
        {job.status === 'done' && <CheckCircle2 size={10} className="text-emerald-400 shrink-0" />}
        {job.status === 'error' && <AlertCircle size={10} className="text-red-400 shrink-0" />}
        <span className="text-[11px] text-gray-300 truncate flex-1">
          {job.prompt.length > 40 ? job.prompt.slice(0, 40) + '...' : job.prompt}
        </span>
        <span
          className={cn(
            'text-[9px] font-medium px-1.5 py-0.5 rounded',
            TIER_BG_COLORS[job.tier],
            TIER_TEXT_COLORS[job.tier],
          )}
        >
          {job.tier}
        </span>
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 shrink-0"
        >
          <X size={9} />
        </button>
      </div>

      {job.status === 'generating' && (
        <div className="relative h-1.5 rounded-full bg-[#2a2a2a] overflow-hidden">
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out',
              TIER_COLORS[job.tier],
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {job.status === 'done' && <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500" />}

      {job.status === 'error' && job.error && <p className="text-[10px] text-red-400">{job.error}</p>}

      {job.status === 'generating' && <p className="text-[10px] text-gray-500">{pct}%</p>}
    </div>
  )
}
