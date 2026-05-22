import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, Plus, Grid3x3, List, X, Star, SlidersHorizontal, Wand2 } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'
import { PanelCategoryTabs } from '@/components/ui/panel-controls/PanelCategoryTabs'
import { cn } from '@/lib/utils'
import { getAllMotionGraphics } from '@/motionGraphics'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { useTemplateRatingStore } from '@/stores/useTemplateRatingStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import type { MotionGraphicRegistration } from '@/types/motionGraphic'
import templateRounds from '@/motionGraphics/templateRounds.json'
import { GenerateTab } from './GenerateTab'

// ── Style taxonomy (vibe-based) ──────────────────────────────────────

const STYLE_FAMILIES = [
  { id: 'all', label: 'All Styles' },
  { id: 'clean', label: 'Clean' },
  { id: 'bold', label: 'Bold' },
  { id: 'glitchy', label: 'Glitchy' },
  { id: 'retro', label: 'Retro' },
  { id: 'artsy', label: 'Artsy' },
  { id: 'trippy', label: 'Trippy' },
  { id: 'cinematic', label: 'Cinematic' },
]

const SUB_STYLES: Record<string, { id: string; label: string }[]> = {
  clean: [
    { id: 'all', label: 'All' },
    { id: 'fade', label: 'Fade' },
    { id: 'slide', label: 'Slide' },
    { id: 'reveal', label: 'Reveal' },
    { id: 'type-on', label: 'Type-On' },
    { id: 'motion', label: 'Motion' },
  ],
  bold: [
    { id: 'all', label: 'All' },
    { id: 'slam', label: 'Slam' },
    { id: 'bounce', label: 'Bounce' },
    { id: 'shake', label: 'Shake' },
    { id: 'pop', label: 'Pop' },
    { id: 'zoom', label: 'Zoom' },
  ],
  glitchy: [
    { id: 'all', label: 'All' },
    { id: 'digital', label: 'Digital' },
    { id: 'vhs', label: 'VHS/CRT' },
    { id: 'broken', label: 'Broken' },
    { id: 'corrupt', label: 'Corrupt' },
    { id: 'buffer', label: 'Buffer' },
  ],
  retro: [
    { id: 'all', label: 'All' },
    { id: 'film', label: 'Film' },
    { id: 'computer', label: '90s PC' },
    { id: 'arcade', label: 'Arcade' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'print', label: 'Print' },
  ],
  artsy: [
    { id: 'all', label: 'All' },
    { id: 'paint', label: 'Paint/Ink' },
    { id: 'craft', label: 'Craft' },
    { id: 'sketch', label: 'Sketch' },
    { id: 'textile', label: 'Textile' },
    { id: 'paper', label: 'Paper' },
  ],
  trippy: [
    { id: 'all', label: 'All' },
    { id: 'glow', label: 'Glow/Neon' },
    { id: 'liquid', label: 'Liquid' },
    { id: 'morph', label: 'Morph' },
    { id: 'warp', label: 'Warp' },
    { id: 'psychedelic', label: 'Psychedelic' },
  ],
  cinematic: [
    { id: 'all', label: 'All' },
    { id: 'title', label: 'Title' },
    { id: 'dramatic', label: 'Dramatic' },
    { id: 'camera', label: 'Camera' },
    { id: 'letterbox', label: 'Letterbox' },
    { id: 'grade', label: 'Grade' },
  ],
}

// Tag → style mapping
const TAG_MAP: Record<string, { family: string; sub?: string }> = {
  minimal: { family: 'clean' },
  fade: { family: 'clean', sub: 'fade' },
  slide: { family: 'clean', sub: 'slide' },
  reveal: { family: 'clean', sub: 'reveal' },
  mask: { family: 'clean', sub: 'reveal' },
  typewriter: { family: 'clean', sub: 'type-on' },
  typography: { family: 'clean', sub: 'motion' },
  impact: { family: 'bold', sub: 'slam' },
  slam: { family: 'bold', sub: 'slam' },
  bounce: { family: 'bold', sub: 'bounce' },
  elastic: { family: 'bold', sub: 'bounce' },
  spring: { family: 'bold', sub: 'bounce' },
  shake: { family: 'bold', sub: 'shake' },
  pop: { family: 'bold', sub: 'pop' },
  burst: { family: 'bold', sub: 'pop' },
  zoom: { family: 'bold', sub: 'zoom' },
  scale: { family: 'bold', sub: 'zoom' },
  glitch: { family: 'glitchy', sub: 'digital' },
  digital: { family: 'glitchy', sub: 'digital' },
  vhs: { family: 'glitchy', sub: 'vhs' },
  crt: { family: 'glitchy', sub: 'vhs' },
  corrupt: { family: 'glitchy', sub: 'corrupt' },
  error: { family: 'glitchy', sub: 'broken' },
  signal: { family: 'glitchy', sub: 'buffer' },
  buffer: { family: 'glitchy', sub: 'buffer' },
  film: { family: 'retro', sub: 'film' },
  cinema: { family: 'retro', sub: 'film' },
  retro: { family: 'retro' },
  arcade: { family: 'retro', sub: 'arcade' },
  vintage: { family: 'retro', sub: 'vintage' },
  terminal: { family: 'retro', sub: 'computer' },
  ink: { family: 'artsy', sub: 'paint' },
  paint: { family: 'artsy', sub: 'paint' },
  chalk: { family: 'artsy', sub: 'sketch' },
  pencil: { family: 'artsy', sub: 'sketch' },
  stitch: { family: 'artsy', sub: 'textile' },
  fabric: { family: 'artsy', sub: 'textile' },
  craft: { family: 'artsy', sub: 'craft' },
  origami: { family: 'artsy', sub: 'paper' },
  paper: { family: 'artsy', sub: 'paper' },
  neon: { family: 'trippy', sub: 'glow' },
  glow: { family: 'trippy', sub: 'glow' },
  hologram: { family: 'trippy', sub: 'glow' },
  liquid: { family: 'trippy', sub: 'liquid' },
  morph: { family: 'trippy', sub: 'morph' },
  warp: { family: 'trippy', sub: 'warp' },
  prism: { family: 'trippy', sub: 'psychedelic' },
  chromatic: { family: 'trippy', sub: 'psychedelic' },
  rainbow: { family: 'trippy', sub: 'psychedelic' },
  vaporwave: { family: 'trippy', sub: 'psychedelic' },
  trailer: { family: 'cinematic', sub: 'title' },
  dramatic: { family: 'cinematic', sub: 'dramatic' },
  spotlight: { family: 'cinematic', sub: 'dramatic' },
  camera: { family: 'cinematic', sub: 'camera' },
  letterbox: { family: 'cinematic', sub: 'letterbox' },
  widescreen: { family: 'cinematic', sub: 'letterbox' },
}

function classifyTemplate(reg: MotionGraphicRegistration): { family: string; sub: string } {
  for (const tag of reg.tags) {
    const m = TAG_MAP[tag.toLowerCase()]
    if (m) return { family: m.family, sub: m.sub || 'all' }
  }
  const text = `${reg.title} ${reg.description}`.toLowerCase()
  for (const [kw, m] of Object.entries(TAG_MAP)) {
    if (text.includes(kw)) return { family: m.family, sub: m.sub || 'all' }
  }
  return { family: 'all', sub: 'all' }
}

// ── Error boundary ───────────────────────────────────────────────────

class PreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (prevProps.children !== this.props.children) this.setState({ hasError: false })
  }
  render() {
    if (this.state.hasError)
      return (
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 8,
            background: '#1a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#f87171',
            fontFamily: 'monospace',
          }}
        >
          preview error
        </div>
      )
    return this.props.children
  }
}

// ── Mini preview ─────────────────────────────────────────────────────

function TemplatePreview({ registration, playing }: { registration: MotionGraphicRegistration; playing: boolean }) {
  const Component = registration.component as React.ComponentType<any>
  const [frame, setFrame] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef(0)
  const fps = 30
  const dur = fps * 5

  useEffect(() => {
    if (!playing) {
      setFrame(0)
      return
    }
    startRef.current = performance.now()
    const tick = (now: number) => {
      setFrame(Math.floor(((now - startRef.current) / 1000) * fps) % dur)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, dur])

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        background: '#0a0a0a',
        fontSize: '4px',
      }}
    >
      <Component
        config={registration.defaultConfig}
        frame={frame}
        durationInFrames={dur}
        fps={fps}
        width={320}
        height={180}
        progress={frame / dur}
      />
    </div>
  )
}

// ── Gallery card ─────────────────────────────────────────────────────

function GalleryCard({ reg, onAdd }: { reg: MotionGraphicRegistration; onAdd: () => void }) {
  const [hovering, setHovering] = useState(false)
  return (
    <div
      className="group rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden hover:border-white/[0.12] transition-all"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="relative">
        {hovering ? (
          <PreviewErrorBoundary>
            <TemplatePreview registration={reg} playing />
          </PreviewErrorBoundary>
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace' }}>hover to preview</span>
          </div>
        )}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity',
            hovering ? 'opacity-100' : 'opacity-0',
          )}
        >
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-black text-[11px] font-semibold hover:bg-green-400 transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>
      <div className="px-2.5 py-2">
        <div className="text-[11px] font-medium text-zinc-200 truncate">{reg.title}</div>
        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{reg.description}</div>
      </div>
    </div>
  )
}

// ── Main panel (standardize-panel pattern) ───────────────────────────

const GALLERY_TABS = [
  { id: 'browse', label: 'Browse', icon: Grid3x3 },
  { id: 'generate', label: 'Generate', icon: Wand2 },
]

export function MotionGalleryPanel() {
  const [galleryTab, setGalleryTab] = useState<'browse' | 'generate'>('browse')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter state — single selections via dropdowns
  const [selectedRound, setSelectedRound] = useState('all')
  const [selectedStyle, setSelectedStyle] = useState('all')
  const [selectedSubStyle, setSelectedSubStyle] = useState('all')

  const startRating = useTemplateRatingStore((s) => s.startRating)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const addInstance = useMotionGraphicStore((s) => s.addInstance)
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)
  const fps = usePlaybackStore((s) => s.fps)

  const allTemplates = useMemo(() => getAllMotionGraphics(), [])

  // Classify all templates
  const classified = useMemo(() => allTemplates.map((reg) => ({ reg, ...classifyTemplate(reg) })), [allTemplates])

  const hasActiveFilters = selectedRound !== 'all' || selectedStyle !== 'all'

  // Filter
  const filtered = useMemo(() => {
    let results = classified

    // Style filter
    if (selectedStyle !== 'all') {
      results = results.filter((c) => c.family === selectedStyle)
      if (selectedSubStyle !== 'all') {
        results = results.filter((c) => c.sub === selectedSubStyle)
      }
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(
        (c) =>
          c.reg.title.toLowerCase().includes(q) ||
          c.reg.description.toLowerCase().includes(q) ||
          c.reg.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.reg.id.toLowerCase().includes(q),
      )
    }

    // Round filter (uses static mapping from git history)
    if (selectedRound !== 'all') {
      const roundMap = templateRounds as Record<string, string>
      results = results.filter((c) => (roundMap[c.reg.id] || 'initial') === selectedRound)
    }

    return results.map((c) => c.reg)
  }, [classified, selectedStyle, selectedSubStyle, search, selectedRound])

  const handleAdd = useCallback(
    (reg: MotionGraphicRegistration) => {
      addInstance({
        id: `mg-${reg.id}-${Date.now()}`,
        templateId: reg.id,
        name: reg.title,
        config: { ...reg.defaultConfig },
        position: { x: canvasWidth / 2, y: canvasHeight / 2 },
        scale: 1,
        opacity: 1,
        zIndex: 10,
        rotation: 0,
        visible: true,
        startFrame: 0,
        endFrame: fps * 5,
      })
    },
    [addInstance, canvasWidth, canvasHeight, fps],
  )

  const subStyles = SUB_STYLES[selectedStyle]

  // Dynamic round options from templateRounds.json
  const roundOptions = useMemo(() => {
    const rounds = new Set(Object.values(templateRounds as Record<string, string>))
    const sorted = [...rounds].sort((a, b) => {
      if (a === 'initial') return -1
      if (b === 'initial') return 1
      const aNum = a.startsWith('r') ? parseInt(a.slice(1)) : a.startsWith('gen-') ? 1000 + parseInt(a.slice(4)) : 0
      const bNum = b.startsWith('r') ? parseInt(b.slice(1)) : b.startsWith('gen-') ? 1000 + parseInt(b.slice(4)) : 0
      return aNum - bNum
    })
    return [
      { value: 'all', label: 'All Rounds' },
      ...sorted.map((r) => ({
        value: r,
        label:
          r === 'initial'
            ? 'Initial'
            : r.startsWith('r')
              ? `Round ${r.slice(1)}`
              : `Gen ${new Date(parseInt(r.replace('gen-', ''))).toLocaleDateString()}`,
      })),
    ]
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Pill tabs ── */}
      <div className="shrink-0 px-3 pt-2">
        <PanelCategoryTabs
          tabs={GALLERY_TABS}
          activeTab={galleryTab}
          onChange={(id) => setGalleryTab(id as 'browse' | 'generate')}
          compact
        />
      </div>

      {/* ── Generate tab ── */}
      {galleryTab === 'generate' && <GenerateTab />}

      {/* ── Browse tab ── */}
      {galleryTab === 'browse' && (
        <>
          {/* ── Search + Filter + Star + View ── */}
          <div className="shrink-0 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${allTemplates.length} templates...`}
                  className="w-full pl-8 pr-8 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    <X size={12} />
                  </button>
                )}
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
                {hasActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />
                )}
              </button>
              <button
                onClick={() => {
                  const ratings = useTemplateRatingStore.getState().ratings
                  const unrated = filtered.filter((t) => !ratings[t.id])
                  if (unrated.length === 0) return
                  startRating(unrated)
                }}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="Rate filtered templates"
              >
                <Star size={14} />
              </button>
            </div>

            {/* ── Stats row ── */}
            <div className="flex items-center justify-between mt-1.5">
              <div className="text-[10px] text-zinc-500">
                <span className="text-zinc-300 font-medium">{filtered.length}</span> / {allTemplates.length} templates
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-1 rounded', viewMode === 'grid' ? 'bg-white/10 text-zinc-200' : 'text-zinc-500')}
                >
                  <Grid3x3 size={12} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-1 rounded', viewMode === 'list' ? 'bg-white/10 text-zinc-200' : 'text-zinc-500')}
                >
                  <List size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* ── Filter panel (hidden by default) — PanelSelect dropdowns ── */}
          {filtersOpen && (
            <div className="shrink-0 px-3 pb-2 border-b border-white/5">
              <PanelSelect label="Round" value={selectedRound} onChange={setSelectedRound} options={roundOptions} />
              <PanelSelect
                label="Style"
                value={selectedStyle}
                onChange={(v) => {
                  setSelectedStyle(v)
                  setSelectedSubStyle('all')
                }}
                options={STYLE_FAMILIES.map((s) => ({ value: s.id, label: s.label }))}
              />
              {subStyles && (
                <PanelSelect
                  label="Sub-style"
                  value={selectedSubStyle}
                  onChange={setSelectedSubStyle}
                  options={subStyles.map((s) => ({ value: s.id, label: s.label }))}
                />
              )}
            </div>
          )}

          {/* ── Template grid/list ── */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Search size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No templates found</span>
                <span className="text-xs text-gray-600 mt-1">Try a different filter</span>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((reg) => (
                  <GalleryCard key={reg.id} reg={reg} onAdd={() => handleAdd(reg)} />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => handleAdd(reg)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.06] transition-colors text-left group"
                  >
                    <div className="shrink-0 w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center">
                      <Plus size={12} className="text-zinc-500 group-hover:text-green-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-zinc-300 truncate">{reg.title}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{reg.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
