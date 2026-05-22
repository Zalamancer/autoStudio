import { memo, useCallback, useState, useMemo } from 'react'
import {
  Type,
  Quote,
  Heading1,
  Subtitles,
  RectangleHorizontal,
  MousePointerClick,
  Droplets,
  Maximize2,
  Flame,
  Gamepad2,
  Highlighter,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { PanelCategoryTabs } from '@/components/ui/panel-controls'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import type { TextOverlay, TextPresetType } from '@/stores/useTextOverlayStore'
import { ELEMENTAL_TEXT_PRESETS, type ElementalTextPreset } from '@/data/elementalTextPresets'
import { GAMING_TEXT_PRESETS, type GamingTextPreset } from '@/data/gamingTextPresets'
import { HIGHLIGHTED_TEXT_PRESETS, type HighlightedTextPreset } from '@/data/highlightedTextPresets'
import { cn } from '@/lib/utils'
import { hexToRgbObj } from '@/utils/color'

// ── Helpers ─────────────────────────────────────────────────────────────

const FONT_WEIGHT_MAP: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
}

function hexToRgb(hex: string) {
  return hexToRgbObj(hex) ?? { r: 0, g: 0, b: 0 }
}

// ── Tabs ────────────────────────────────────────────────────────────────

const TEXT_TABS = [
  { id: 'basic', label: 'Basic', icon: Type },
  { id: 'elemental', label: 'Elemental', icon: Flame },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
] as const

type TextTabId = (typeof TEXT_TABS)[number]['id']

const BASIC_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'heading', label: 'Heading' },
  { id: 'body', label: 'Body' },
  { id: 'overlay', label: 'Overlay' },
]

// ── Presets ─────────────────────────────────────────────────────────────

interface PresetDef {
  type: TextPresetType
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  defaults: Partial<TextOverlay>
  previewStyle: string
  previewText: string
  category: string
}

const PRESETS: PresetDef[] = [
  {
    type: 'title',
    label: 'Title',
    icon: Heading1,
    defaults: {
      content: 'Your Title Here',
      fontFamily: 'Montserrat',
      fontSize: 64,
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'center',
      verticalAlign: 'middle',
      position: 'center',
      lineHeight: 1.2,
      letterSpacing: 0,
      textCase: 'none',
      shadow: true,
      background: false,
      backgroundOpacity: 0.5,
    },
    previewStyle: 'text-lg font-bold',
    previewText: 'Title',
    category: 'heading',
  },
  {
    type: 'subtitle',
    label: 'Subtitle',
    icon: Subtitles,
    defaults: {
      content: 'Your subtitle text',
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 'normal',
      color: '#e4e4e7',
      align: 'center',
      verticalAlign: 'bottom',
      position: 'bottom',
      lineHeight: 1.4,
      letterSpacing: 0,
      textCase: 'none',
      shadow: true,
      background: false,
      backgroundOpacity: 0.5,
    },
    previewStyle: 'text-sm text-gray-300',
    previewText: 'Subtitle',
    category: 'body',
  },
  {
    type: 'lower-third',
    label: 'Lower Third',
    icon: RectangleHorizontal,
    defaults: {
      content: 'Name\nTitle or Role',
      fontFamily: 'Roboto',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'left',
      verticalAlign: 'bottom',
      position: 'bottom',
      lineHeight: 1.3,
      letterSpacing: 0,
      textCase: 'none',
      shadow: false,
      background: true,
      backgroundOpacity: 0.75,
    },
    previewStyle: 'text-xs font-bold border-l-2 border-accent pl-2',
    previewText: 'Name\nTitle',
    category: 'overlay',
  },
  {
    type: 'cta',
    label: 'Call to Action',
    icon: MousePointerClick,
    defaults: {
      content: 'Subscribe Now',
      fontFamily: 'Montserrat',
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'center',
      verticalAlign: 'bottom',
      position: 'bottom',
      lineHeight: 1.2,
      letterSpacing: 1,
      textCase: 'uppercase',
      shadow: false,
      background: true,
      backgroundOpacity: 0.9,
    },
    previewStyle: 'text-xs font-bold bg-accent px-3 py-1 rounded-md inline-block',
    previewText: 'Subscribe',
    category: 'overlay',
  },
  {
    type: 'quote',
    label: 'Quote',
    icon: Quote,
    defaults: {
      content: '"Your inspiring quote here"',
      fontFamily: 'Playfair Display',
      fontSize: 40,
      fontWeight: 'normal',
      color: '#fafafa',
      align: 'center',
      verticalAlign: 'middle',
      position: 'center',
      lineHeight: 1.5,
      letterSpacing: 0,
      textCase: 'none',
      shadow: true,
      background: false,
      backgroundOpacity: 0.5,
    },
    previewStyle: 'text-xs italic text-white',
    previewText: '\u201CQuote\u201D',
    category: 'body',
  },
  {
    type: 'watermark',
    label: 'Watermark',
    icon: Droplets,
    defaults: {
      content: '@username',
      fontFamily: 'Space Mono',
      fontSize: 16,
      fontWeight: 'normal',
      color: '#a1a1aa',
      align: 'right',
      verticalAlign: 'top',
      position: 'top',
      lineHeight: 1.2,
      letterSpacing: 0.5,
      textCase: 'none',
      shadow: false,
      background: false,
      backgroundOpacity: 0.3,
    },
    previewStyle: 'text-[10px] text-gray-500 opacity-60 font-mono',
    previewText: '@user',
    category: 'overlay',
  },
]

// ── Main Component ──────────────────────────────────────────────────────

export function TextPanel() {
  const selectedId = useTextOverlayStore((s) => s.selectedId)
  const addOverlay = useTextOverlayStore((s) => s.addOverlay)

  const hasSelected = selectedId !== null
  const [activeTab, setActiveTab] = useState<TextTabId>('basic')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [basicCategory, setBasicCategory] = useState('all')

  const q = search.toLowerCase().trim()

  // ── Filtered lists ──
  const filteredBasic = useMemo(() => {
    let result = PRESETS
    if (basicCategory !== 'all') result = result.filter((p) => p.category === basicCategory)
    if (q) result = result.filter((p) => p.label.toLowerCase().includes(q) || p.previewText.toLowerCase().includes(q))
    return result
  }, [basicCategory, q])

  const filteredElemental = useMemo(() => {
    let result = [...ELEMENTAL_TEXT_PRESETS]
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    return result
  }, [q])

  const filteredGaming = useMemo(() => {
    let result = [...GAMING_TEXT_PRESETS]
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    return result
  }, [q])

  const filteredHighlighted = useMemo(() => {
    let result = [...HIGHLIGHTED_TEXT_PRESETS]
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    return result
  }, [q])

  const activeTabEmpty =
    (activeTab === 'basic' && filteredBasic.length === 0) ||
    (activeTab === 'elemental' && filteredElemental.length === 0) ||
    (activeTab === 'gaming' && filteredGaming.length === 0)

  const hasActiveFilter = basicCategory !== 'all'

  // ── Callbacks ──

  const addElementalPreset = useCallback(
    (preset: ElementalTextPreset) => {
      const totalFrames = useTimelineStore.getState().totalFrames
      const id = `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const newOverlay: TextOverlay = {
        id,
        presetType: 'title',
        content: preset.name,
        fontFamily: preset.fontFamily,
        fontSize: 56,
        fontWeight: preset.fontWeight,
        color: preset.color,
        align: 'center',
        verticalAlign: 'middle',
        position: 'center',
        freeX: 50,
        freeY: 50,
        lineHeight: 1.2,
        letterSpacing: preset.letterSpacing,
        textCase: preset.textCase || 'none',
        shadow: false,
        background: false,
        backgroundOpacity: 0.5,
        visible: true,
        opacity: 1,
        zIndex: 8,
        rotation: 0,
        width: null,
        height: null,
        startFrame: 0,
        endFrame: totalFrames,
        textShadow: preset.textShadow,
        webkitTextStroke: preset.webkitTextStroke,
        textStylePreset: preset.id,
      }
      addOverlay(newOverlay)
    },
    [addOverlay],
  )

  const addGamingPreset = useCallback(
    (preset: GamingTextPreset) => {
      const totalFrames = useTimelineStore.getState().totalFrames
      const id = `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const newOverlay: TextOverlay = {
        id,
        presetType: 'title',
        content: preset.name,
        fontFamily: preset.fontFamily,
        fontSize: 56,
        fontWeight: preset.fontWeight,
        color: preset.color,
        align: 'center',
        verticalAlign: 'middle',
        position: 'center',
        freeX: 50,
        freeY: 50,
        lineHeight: 1.2,
        letterSpacing: preset.letterSpacing,
        textCase: 'uppercase',
        shadow: false,
        background: false,
        backgroundOpacity: 0.5,
        visible: true,
        opacity: 1,
        zIndex: 8,
        rotation: 0,
        width: null,
        height: null,
        startFrame: 0,
        endFrame: totalFrames,
        textShadow: preset.textShadow,
        webkitTextStroke: preset.WebkitTextStroke,
        textStylePreset: preset.id,
      }
      addOverlay(newOverlay)
    },
    [addOverlay],
  )

  const addHighlightedPreset = useCallback(
    (preset: HighlightedTextPreset) => {
      const totalFrames = useTimelineStore.getState().totalFrames
      const id = `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const newOverlay: TextOverlay = {
        id,
        presetType: 'title',
        content: preset.name,
        fontFamily: preset.fontFamily,
        fontSize: 48,
        fontWeight: preset.fontWeight,
        color: preset.color,
        align: 'center',
        verticalAlign: 'middle',
        position: 'center',
        freeX: 50,
        freeY: 50,
        lineHeight: 1.3,
        letterSpacing: preset.letterSpacing,
        textCase: preset.textCase || 'none',
        shadow: false,
        background: true,
        backgroundOpacity: preset.backgroundOpacity,
        backgroundColor: preset.backgroundColor,
        backgroundBorderRadius: preset.backgroundBorderRadius,
        backgroundPaddingX: preset.backgroundPaddingX,
        backgroundPaddingY: preset.backgroundPaddingY,
        backgroundBorder: preset.backgroundBorder,
        visible: true,
        opacity: 1,
        zIndex: 8,
        rotation: 0,
        width: null,
        height: null,
        startFrame: 0,
        endFrame: totalFrames,
        textShadow: preset.textShadow,
        webkitTextStroke: preset.webkitTextStroke,
        textStylePreset: preset.id,
      }
      addOverlay(newOverlay)
    },
    [addOverlay],
  )

  const addPreset = useCallback(
    (preset: PresetDef) => {
      const totalFrames = useTimelineStore.getState().totalFrames
      const id = `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const newOverlay: TextOverlay = {
        id,
        presetType: preset.type,
        content: preset.defaults.content || 'Text',
        fontFamily: preset.defaults.fontFamily || 'Inter',
        fontSize: preset.defaults.fontSize || 32,
        fontWeight: preset.defaults.fontWeight || 'normal',
        color: preset.defaults.color || '#ffffff',
        align: preset.defaults.align || 'center',
        verticalAlign: preset.defaults.verticalAlign || 'middle',
        position: preset.defaults.position || 'center',
        freeX: 50,
        freeY: 50,
        lineHeight: preset.defaults.lineHeight || 1.2,
        letterSpacing: preset.defaults.letterSpacing || 0,
        textCase: preset.defaults.textCase || 'none',
        shadow: preset.defaults.shadow || false,
        background: preset.defaults.background || false,
        backgroundOpacity: preset.defaults.backgroundOpacity || 0.5,
        visible: true,
        opacity: 1,
        zIndex: 8,
        rotation: 0,
        width: null,
        height: null,
        startFrame: 0,
        endFrame: totalFrames,
      }
      addOverlay(newOverlay)
    },
    [addOverlay],
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {TEXT_TABS.map((tab) => {
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
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{
                  transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                }}
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

      {/* ── Search Bar + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search text styles..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
          {activeTab === 'basic' && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen ? 'bg-accent/20 text-accent' : 'text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface',
              )}
            >
              <SlidersHorizontal size={14} />
              {hasActiveFilter && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />}
            </button>
          )}
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('text-creator')}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface transition-colors"
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Filter panel (Basic tab only) ── */}
      {filtersOpen && activeTab === 'basic' && (
        <div className="shrink-0 px-3 pb-2">
          <PanelCategoryTabs
            tabs={BASIC_CATEGORIES}
            activeTab={basicCategory}
            onChange={(id) => setBasicCategory(id)}
            compact
          />
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Empty state */}
        {activeTabEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Type size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No text styles found</span>
            <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
          </div>
        )}

        {/* Basic tab */}
        {activeTab === 'basic' && !activeTabEmpty && (
          <div className="space-y-1">
            {filteredBasic.map((preset) => (
              <PresetRow key={preset.type} preset={preset} onAdd={addPreset} />
            ))}

            {/* Highlighted styles inline */}
            {filteredHighlighted.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-3 pb-1">
                  <Highlighter size={12} className="text-yellow-400" />
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Highlighted</span>
                </div>
                {filteredHighlighted.map((preset) => (
                  <HighlightedRow key={preset.id} preset={preset} onAdd={addHighlightedPreset} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Elemental tab */}
        {activeTab === 'elemental' && !activeTabEmpty && (
          <div className="space-y-1">
            {filteredElemental.map((preset) => (
              <ElementalRow key={preset.id} preset={preset} onAdd={addElementalPreset} />
            ))}
          </div>
        )}

        {/* Gaming tab */}
        {activeTab === 'gaming' && !activeTabEmpty && (
          <div className="space-y-1">
            {filteredGaming.map((preset) => (
              <GamingRow key={preset.id} preset={preset} onAdd={addGamingPreset} />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer hint ── */}
      {hasSelected && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg">
            <Type size={14} className="text-accent shrink-0" />
            <span className="text-xs text-gray-300">
              Edit text properties in the <span className="text-accent font-medium">Properties</span> panel
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Basic Preset Row ────────────────────────────────────────────────────

const PresetRow = memo(function PresetRow({ preset, onAdd }: { preset: PresetDef; onAdd: (p: PresetDef) => void }) {
  const Icon = preset.icon
  return (
    <button
      onClick={() => onAdd(preset)}
      className="w-full px-3 py-2.5 rounded-lg text-left transition-colors border bg-panel-surface border-white/5 hover:bg-panel-surface-hover flex items-center gap-3"
    >
      <div className="w-8 h-8 bg-panel-bg rounded-lg flex items-center justify-center shrink-0">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200">{preset.label}</div>
        <div className="text-[9px] text-gray-500 mt-0.5">{preset.previewText.replace('\n', ' \u00B7 ')}</div>
      </div>
      <span className="text-[9px] uppercase tracking-wide text-gray-600">{preset.category}</span>
    </button>
  )
})

// ── Elemental Preset Row ────────────────────────────────────────────────

const ElementalRow = memo(function ElementalRow({
  preset,
  onAdd,
}: {
  preset: ElementalTextPreset
  onAdd: (p: ElementalTextPreset) => void
}) {
  return (
    <button
      onClick={() => onAdd(preset)}
      className="w-full px-3 py-2.5 rounded-lg text-left transition-colors border bg-panel-surface border-white/5 hover:bg-panel-surface-hover flex items-center gap-3"
    >
      <span
        className="text-[13px] font-bold leading-none shrink-0 w-16 text-center"
        style={
          {
            fontFamily: `"${preset.fontFamily}", sans-serif`,
            fontWeight: preset.fontWeight,
            color: preset.color,
            textShadow: preset.textShadow,
            letterSpacing: `${Math.min(preset.letterSpacing, 3)}px`,
            textTransform: preset.textCase === 'uppercase' ? 'uppercase' : undefined,
            ...(preset.webkitTextStroke ? { WebkitTextStroke: preset.webkitTextStroke } : {}),
          } as React.CSSProperties
        }
      >
        Aa
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200">{preset.name}</div>
        <div className="text-[9px] text-gray-500 mt-0.5">{preset.description}</div>
      </div>
    </button>
  )
})

// ── Gaming Preset Row ────────────────────────────────────────────────

const GamingRow = memo(function GamingRow({
  preset,
  onAdd,
}: {
  preset: GamingTextPreset
  onAdd: (p: GamingTextPreset) => void
}) {
  return (
    <button
      onClick={() => onAdd(preset)}
      className="w-full px-3 py-2.5 rounded-lg text-left transition-colors border bg-panel-surface border-white/5 hover:bg-panel-surface-hover flex items-center gap-3"
    >
      <span
        className="text-[13px] font-bold leading-none shrink-0 w-16 text-center"
        style={
          {
            fontFamily: `"${preset.fontFamily}", sans-serif`,
            fontWeight: preset.fontWeight,
            color: preset.color,
            textShadow: preset.textShadow,
            letterSpacing: `${Math.min(preset.letterSpacing, 4)}px`,
            textTransform: 'uppercase',
            ...(preset.WebkitTextStroke ? { WebkitTextStroke: preset.WebkitTextStroke } : {}),
          } as React.CSSProperties
        }
      >
        Aa
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200">{preset.name}</div>
        <div className="text-[9px] text-gray-500 mt-0.5">{preset.description}</div>
      </div>
    </button>
  )
})

// ── Highlighted Preset Row ──────────────────────────────────────────────

const HighlightedRow = memo(function HighlightedRow({
  preset,
  onAdd,
}: {
  preset: HighlightedTextPreset
  onAdd: (p: HighlightedTextPreset) => void
}) {
  const bgRgb = hexToRgb(preset.backgroundColor)

  return (
    <button
      onClick={() => onAdd(preset)}
      className="w-full px-3 py-2.5 rounded-lg text-left transition-colors border bg-panel-surface border-white/5 hover:bg-panel-surface-hover flex items-center gap-3"
    >
      <span
        className="text-[11px] leading-none shrink-0"
        style={
          {
            fontFamily: `"${preset.fontFamily}", sans-serif`,
            fontWeight: FONT_WEIGHT_MAP[preset.fontWeight] ?? 400,
            color: preset.color,
            backgroundColor: `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${preset.backgroundOpacity})`,
            padding: '3px 6px',
            borderRadius: `${Math.min(preset.backgroundBorderRadius, 12)}px`,
            letterSpacing: `${Math.min(preset.letterSpacing, 3)}px`,
            textTransform: preset.textCase === 'uppercase' ? 'uppercase' : undefined,
            ...(preset.textShadow ? { textShadow: preset.textShadow } : {}),
            ...(preset.webkitTextStroke ? { WebkitTextStroke: preset.webkitTextStroke } : {}),
            ...(preset.backgroundBorder ? { border: preset.backgroundBorder } : {}),
          } as React.CSSProperties
        }
      >
        Aa
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200">{preset.name}</div>
        <div className="text-[9px] text-gray-500 mt-0.5">{preset.description}</div>
      </div>
    </button>
  )
})
