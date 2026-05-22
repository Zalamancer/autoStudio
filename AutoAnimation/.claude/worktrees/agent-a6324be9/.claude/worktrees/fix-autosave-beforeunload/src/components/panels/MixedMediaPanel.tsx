/**
 * Mixed Media panel — Overlays and Style Effects.
 * Matches Cinema panel pattern: animated tab bar, search + filter, thick rows.
 */

import { useMemo, useState } from 'react'
import { Layers, Sparkles, Search, SlidersHorizontal, Ban } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { PanelCategoryTabs, PanelSlider } from '@/components/ui/panel-controls'
import { useMixedMediaStore } from '@/stores/useMixedMediaStore'
import { MIXED_MEDIA_PRESETS } from '@/data/mixedMediaPresets'
import { useStyleStore, STYLE_PRESETS } from '@/stores/useStyleStore'
import { cn } from '@/lib/utils'
import type { MixedMediaCategory } from '@/types/media'

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overlays', label: 'Overlays', icon: Layers },
  { id: 'styles', label: 'Styles', icon: Sparkles },
] as const

type TabId = (typeof TABS)[number]['id']

// ── Filter categories ─────────────────────────────────────────────────────────

const OVERLAY_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'film-grain', label: 'Film Grain' },
  { id: 'light-leak', label: 'Light Leak' },
  { id: 'bokeh', label: 'Bokeh' },
  { id: 'texture', label: 'Texture' },
  { id: 'gradient', label: 'Gradient' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'glitch', label: 'Glitch' },
  { id: 'organic', label: 'Organic' },
  { id: 'abstract', label: 'Abstract' },
]

const STYLE_EFFECT_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'mood', label: 'Mood' },
  { id: 'color', label: 'Color' },
  { id: 'artistic', label: 'Artistic' },
]

// ── Main Panel ────────────────────────────────────────────────────────────────

export function MixedMediaPanel() {
  const {
    activePreset,
    categoryFilter,
    overlayOpacity,
    isEnabled,
    setActivePreset,
    setCategoryFilter,
    setOverlayOpacity,
    setEnabled,
  } = useMixedMediaStore()

  const {
    enabled: styleEnabled,
    activePresetId: styleActivePresetId,
    intensity: styleIntensity,
    setEnabled: setStyleEnabled,
    applyPreset: applyStylePreset,
    setIntensity: setStyleIntensity,
    clearPreset: clearStylePreset,
  } = useStyleStore(
    useShallow((s) => ({
      enabled: s.enabled,
      activePresetId: s.activePresetId,
      intensity: s.intensity,
      setEnabled: s.setEnabled,
      applyPreset: s.applyPreset,
      setIntensity: s.setIntensity,
      clearPreset: s.clearPreset,
    })),
  )

  const [activeTab, setActiveTab] = useState<TabId>('overlays')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [styleCategoryFilter, setStyleCategoryFilter] = useState('all')

  const q = search.toLowerCase().trim()

  // ── Filtered data ─────────────────────────────────────────────────────────

  const filteredOverlays = useMemo(() => {
    let result = MIXED_MEDIA_PRESETS
    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter)
    }
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    }
    return result
  }, [categoryFilter, q])

  const filteredStyles = useMemo(() => {
    let result = STYLE_PRESETS
    if (styleCategoryFilter !== 'all') {
      result = result.filter((p) => p.category === styleCategoryFilter)
    }
    if (q) {
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }
    return result
  }, [styleCategoryFilter, q])

  const activeTabEmpty =
    (activeTab === 'overlays' && filteredOverlays.length === 0) ||
    (activeTab === 'styles' && filteredStyles.length === 0)

  const hasActiveFilter =
    (activeTab === 'overlays' && categoryFilter !== null) || (activeTab === 'styles' && styleCategoryFilter !== 'all')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {TABS.map((tab) => {
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

      {/* ── Search + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presets..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
              filtersOpen ? 'bg-[#4a7eff]/20 text-[#4a7eff]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
            )}
          >
            <SlidersHorizontal size={14} />
            {hasActiveFilter && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />}
          </button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      {filtersOpen && (
        <div className="shrink-0 px-3 pb-2 space-y-2">
          <PanelCategoryTabs
            tabs={activeTab === 'overlays' ? OVERLAY_CATEGORIES : STYLE_EFFECT_CATEGORIES}
            activeTab={activeTab === 'overlays' ? (categoryFilter ?? 'all') : styleCategoryFilter}
            onChange={(id) => {
              if (activeTab === 'overlays') setCategoryFilter(id === 'all' ? null : (id as MixedMediaCategory))
              else setStyleCategoryFilter(id)
            }}
            compact
          />
          {activeTab === 'overlays' && (
            <PanelSlider
              label="Opacity"
              value={overlayOpacity}
              onChange={setOverlayOpacity}
              min={0}
              max={1}
              step={0.05}
              formatValue={(v) => `${Math.round(v * 100)}%`}
            />
          )}
          {activeTab === 'styles' && styleEnabled && (
            <PanelSlider
              label="Intensity"
              value={Math.round(styleIntensity * 100)}
              onChange={(v) => setStyleIntensity(Math.min(1, Math.max(0, v / 100)))}
              min={0}
              max={100}
              step={5}
              suffix="%"
            />
          )}
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Empty state */}
        {activeTabEmpty && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Layers size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No presets found</span>
            <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
          </div>
        )}

        {/* ── Overlays tab ── */}
        {activeTab === 'overlays' && !activeTabEmpty && (
          <div className="space-y-1">
            <button
              onClick={() => {
                setEnabled(false)
                setActivePreset(null)
              }}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                !isEnabled ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30' : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
              )}
            >
              <Ban size={14} className="shrink-0 text-gray-500" />
              <div>
                <div className="text-xs font-medium text-gray-200">None</div>
                <div className="text-[9px] text-gray-500 mt-0.5">No overlay</div>
              </div>
            </button>
            {filteredOverlays.map((preset) => {
              const isActive = isEnabled && activePreset?.id === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setActivePreset(preset)
                    setEnabled(true)
                  }}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-left transition-colors border',
                    isActive ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30' : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-200">{preset.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] uppercase tracking-wide text-gray-500">{preset.blendMode}</span>
                      {preset.animation && <span className="text-[9px] text-purple-400">animated</span>}
                    </div>
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{preset.description}</div>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Styles tab ── */}
        {activeTab === 'styles' && !activeTabEmpty && (
          <div className="space-y-1">
            <button
              onClick={() => {
                setStyleEnabled(false)
                clearStylePreset()
              }}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                !styleEnabled
                  ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
                  : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
              )}
            >
              <Ban size={14} className="shrink-0 text-gray-500" />
              <div>
                <div className="text-xs font-medium text-gray-200">None</div>
                <div className="text-[9px] text-gray-500 mt-0.5">No style effect</div>
              </div>
            </button>
            {filteredStyles.map((preset) => {
              const isActive = styleEnabled && styleActivePresetId === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    applyStylePreset(preset.id)
                    setStyleEnabled(true)
                  }}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                    isActive ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30' : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                  )}
                >
                  <div
                    className="w-3.5 h-3.5 rounded shrink-0 border border-white/10"
                    style={{ backgroundColor: preset.previewColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-200">{preset.name}</span>
                      <span className="text-[9px] uppercase tracking-wide text-gray-500">{preset.category}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
