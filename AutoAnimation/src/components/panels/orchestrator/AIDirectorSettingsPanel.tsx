/**
 * AI Director — Right Panel Settings
 *
 * Shows only the section selected from the left panel rows.
 * Each section matches PanelSelect/PanelSlider row dimensions.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  RotateCcw,
  Brain,
  User,
  Check,
  Search,
  SlidersHorizontal,
  Monitor,
  Users,
  Boxes,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Package,
} from 'lucide-react'
import { PanelSlider, PanelSelect, PanelMultiSelect } from '@/components/ui/panel-controls'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useMarketplaceStore, builtinTemplateIds } from '@/stores/useMarketplaceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useCharacterIdentityStore } from '@/stores/useCharacterIdentityStore'
import { useBundleStore } from '@/stores/useBundleStore'
import { useLearningStore } from '@/stores/useLearningStore'
import type { SettingsSectionId } from '@/stores/useOrchestratorStore'
import type { OrchestratorSettings } from '@/types/orchestrator'
import { cn } from '@/lib/utils'

const SECTION_TABS: { id: SettingsSectionId; label: string; icon: typeof Monitor }[] = [
  { id: 'canvas', label: 'Canvas', icon: Monitor },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'assets', label: 'Assets', icon: Boxes },
  { id: 'options', label: 'Options', icon: SlidersHorizontal },
  { id: 'platform', label: 'Platform', icon: Globe },
]

export function AIDirectorSettingsPanel() {
  const settings = useOrchestratorStore((s) => s.settings)
  const updateSettings = useOrchestratorStore((s) => s.updateSettings)
  const toggleCharacterSelection = useOrchestratorStore((s) => s.toggleCharacterSelection)
  const setActiveSettingsSection = useOrchestratorStore((s) => s.setActiveSettingsSection)
  const reset = useOrchestratorStore((s) => s.reset)

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)
  const identities = useCharacterIdentityStore((s) => s.identities)
  const bundles = useBundleStore((s) => s.bundles)

  const allMarketplaceItems = useMarketplaceStore((s) => s.items)
  const marketplaceItems = useMemo(
    () => allMarketplaceItems.filter((i) => i.published || !builtinTemplateIds.has(i.id)),
    [allMarketplaceItems],
  )
  const animationLibrary = useAnimationStore((s) => s.library)
  const mediaAssets = useMediaStore((s) => s.assets)
  const audioAssets = mediaAssets.filter((a) => a.category === 'audio')

  const selectedCharIds = settings.selectedCharacterIds || []
  const selected3DCharIds = settings.selected3DCharacterIds || []
  const currentMode = settings.assetMode ?? 'mix'
  const showLibrary = currentMode !== 'ai-generated'

  const htmlTemplates = marketplaceItems.filter((i) => i.category === 'html-templates')
  const captions = marketplaceItems.filter((i) => i.category === 'captions')
  const collages = marketplaceItems.filter((i) => i.category === 'collages')
  const aiAnimations = marketplaceItems.filter((i) => i.category === 'ai-animations')

  const activeSection = useOrchestratorStore((s) => s.activeSettingsSection)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [charFilter, setCharFilter] = useState<'all' | '2d' | '3d'>('all')
  const [charSubTab, setCharSubTab] = useState<'characters' | 'bundles'>('characters')

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const currentIndex = SECTION_TABS.findIndex((t) => t.id === activeSection)
  const currentTab = SECTION_TABS[currentIndex] ?? SECTION_TABS[0]

  const goPrev = () => {
    const prev = currentIndex <= 0 ? SECTION_TABS.length - 1 : currentIndex - 1
    setActiveSettingsSection(SECTION_TABS[prev].id)
  }
  const goNext = () => {
    const next = currentIndex >= SECTION_TABS.length - 1 ? 0 : currentIndex + 1
    setActiveSettingsSection(SECTION_TABS[next].id)
  }

  const hasActiveFilter = charFilter !== 'all'

  // Filter characters for the characters section
  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let chars2d = savedCharacters
    let chars3d = saved3DCharacters

    if (q) {
      chars2d = chars2d.filter((c) => c.name.toLowerCase().includes(q))
      chars3d = chars3d.filter((c) => c.name.toLowerCase().includes(q))
    }
    if (charFilter === '2d') return { chars2d, chars3d: [] }
    if (charFilter === '3d') return { chars2d: [], chars3d }
    return { chars2d, chars3d }
  }, [savedCharacters, saved3DCharacters, searchQuery, charFilter])

  // Filter bundles
  const filteredBundles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return bundles
    return bundles.filter((b) => b.name.toLowerCase().includes(q))
  }, [bundles, searchQuery])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Dropdown Header: < ChevronLeft | [Icon] Title ▾ | ChevronRight > ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        <button
          onClick={goPrev}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Previous"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Title with dropdown */}
        <div ref={dropdownRef} className="relative flex-1 min-w-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <currentTab.icon size={14} className="shrink-0 text-zinc-400" />
            <span className="truncate">{currentTab.label}</span>
            <ChevronDown
              size={14}
              className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl py-1.5 max-h-[320px] overflow-y-auto">
              {SECTION_TABS.map((tab) => {
                const isActive = tab.id === activeSection
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSettingsSection(tab.id)
                      setDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                      isActive
                        ? 'bg-green-500/10 text-green-400'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                    )}
                  >
                    <tab.icon size={15} className="shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={goNext}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Animated white-pill sub-tabs + search (Characters section) ── */}
      {activeSection === 'characters' && (
        <>
          {/* Sub-tabs: Characters | Bundles */}
          <div className="shrink-0 flex items-center gap-1 px-3 py-2">
            {(
              [
                { id: 'characters', label: 'Characters', icon: Users },
                { id: 'bundles', label: 'Bundles', icon: Package },
              ] as const
            ).map((tab) => {
              const isActive = charSubTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setCharSubTab(tab.id)}
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
                  <Icon size={15} className="shrink-0" />
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

          {/* Search + Filter */}
          <div className="shrink-0 px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={charSubTab === 'characters' ? 'Search characters...' : 'Search bundles...'}
                  className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-green-500/30 focus:outline-none"
                />
              </div>
              {charSubTab === 'characters' && (
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className={cn(
                    'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                    filtersOpen
                      ? 'bg-green-500/20 text-green-400'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
                  )}
                >
                  <SlidersHorizontal size={14} />
                  {hasActiveFilter && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />
                  )}
                </button>
              )}
            </div>
          </div>
          {filtersOpen && charSubTab === 'characters' && (
            <div className="shrink-0 px-3 pb-2">
              <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1 block">Type</span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: '2d', label: '2D' },
                    { id: '3d', label: '3D' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setCharFilter(f.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border',
                      charFilter === f.id
                        ? 'bg-white text-black border-white/20'
                        : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:bg-[#2a2a2a]',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Section content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'canvas' && (
          <>
            <PanelSelect
              label="Aspect"
              value={settings.aspectRatio || '16:9'}
              onChange={(v) => updateSettings({ aspectRatio: v as OrchestratorSettings['aspectRatio'] })}
              options={[
                { value: '16:9', label: '16:9' },
                { value: '9:16', label: '9:16' },
                { value: '1:1', label: '1:1' },
                { value: '4:3', label: '4:3' },
              ]}
            />
            <PanelSlider
              label="Duration"
              value={settings.durationSeconds || 0}
              onChange={(v) => updateSettings({ durationSeconds: Math.round(v) })}
              min={0}
              max={180}
              step={5}
              precision={0}
              suffix="s"
            />
            <PanelSlider
              label="FPS"
              value={settings.fps || 30}
              onChange={(v) => updateSettings({ fps: Math.round(v) })}
              min={24}
              max={60}
              step={6}
              precision={0}
            />
          </>
        )}

        {activeSection === 'characters' && charSubTab === 'characters' && (
          <>
            {savedCharacters.length === 0 && saved3DCharacters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <User size={24} className="mb-2" />
                <span className="text-xs text-gray-400">No saved characters</span>
              </div>
            ) : filteredCharacters.chars2d.length === 0 && filteredCharacters.chars3d.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <Search size={20} className="mb-2" />
                <span className="text-xs text-gray-400">No characters found</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredCharacters.chars2d.map((c) => {
                  const isSelected = selectedCharIds.includes(c.id)
                  const thumb = c.referenceImage || c._thumbnail
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCharacterSelection(c.id)}
                      className={cn(
                        'relative group rounded-lg border overflow-hidden transition-all text-left',
                        isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-white/5 hover:border-panel-border',
                      )}
                    >
                      <div className="aspect-square bg-panel-bg flex items-center justify-center overflow-hidden">
                        {thumb ? (
                          <img src={thumb} alt={c.name} className="w-full h-full object-contain" draggable={false} />
                        ) : (
                          <User size={24} className="text-gray-600" />
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-accent rounded-full flex items-center justify-center z-10">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className="p-1.5 bg-panel-surface">
                        <p className="text-[11px] text-gray-300 truncate font-medium">{c.name}</p>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">2D</span>
                      </div>
                    </button>
                  )
                })}
                {filteredCharacters.chars3d.map((c) => {
                  const isSelected = selected3DCharIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCharacterSelection(c.id)}
                      className={cn(
                        'relative group rounded-lg border overflow-hidden transition-all text-left',
                        isSelected
                          ? 'border-violet-500 ring-2 ring-violet-500/30'
                          : 'border-white/5 hover:border-panel-border',
                      )}
                    >
                      <div className="aspect-square bg-panel-bg flex items-center justify-center overflow-hidden">
                        {c.thumbnailDataUrl ? (
                          <img
                            src={c.thumbnailDataUrl}
                            alt={c.name}
                            className="w-full h-full object-contain"
                            draggable={false}
                          />
                        ) : (
                          <User size={24} className="text-gray-600" />
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center z-10">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className="p-1.5 bg-panel-surface">
                        <p className="text-[11px] text-gray-300 truncate font-medium">{c.name}</p>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-violet-500/20 text-violet-400">3D</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeSection === 'characters' && charSubTab === 'bundles' && (
          <>
            {bundles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <Package size={24} className="mb-2" />
                <span className="text-xs text-gray-400">No bundles yet</span>
                <span className="text-[10px] text-zinc-600 mt-1">
                  Create character bundles from the Characters panel
                </span>
              </div>
            ) : filteredBundles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <Search size={20} className="mb-2" />
                <span className="text-xs text-gray-400">No bundles found</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredBundles.map((b) => {
                  // A bundle is "selected" when all its characters are selected
                  const allSelected =
                    b.characters.length > 0 &&
                    b.characters.every((c) =>
                      c.type === '3d' ? selected3DCharIds.includes(c.id) : selectedCharIds.includes(c.id),
                    )
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        // Toggle all characters in the bundle
                        for (const c of b.characters) {
                          if (allSelected) {
                            // Deselect all
                            toggleCharacterSelection(c.id)
                          } else {
                            // Select only unselected ones
                            const isAlready =
                              c.type === '3d' ? selected3DCharIds.includes(c.id) : selectedCharIds.includes(c.id)
                            if (!isAlready) toggleCharacterSelection(c.id)
                          }
                        }
                      }}
                      className={cn(
                        'relative group rounded-lg border overflow-hidden transition-all text-left',
                        allSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-white/5 hover:border-panel-border',
                      )}
                    >
                      <div className="aspect-square bg-panel-bg flex items-center justify-center overflow-hidden">
                        {b.thumbnail ? (
                          <img
                            src={b.thumbnail}
                            alt={b.name}
                            className="w-full h-full object-contain"
                            draggable={false}
                          />
                        ) : (
                          <Package size={24} className="text-gray-600" />
                        )}
                      </div>
                      {allSelected && (
                        <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center z-10">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className="p-1.5 bg-panel-surface">
                        <p className="text-[11px] text-gray-300 truncate font-medium">{b.name}</p>
                        <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          {b.characters.length} char{b.characters.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}

        {activeSection === 'assets' && (
          <>
            <PanelSelect
              label="Mode"
              value={currentMode}
              onChange={(v) => {
                const mode = v as 'library' | 'ai-generated' | 'mix'
                const presets: Record<string, Partial<OrchestratorSettings>> = {
                  library: {
                    assetMode: 'library',
                    generateMusic: false,
                    generateSVGAnimations: false,
                    generateSVGAssets: false,
                    generateStockAssets: false,
                    useStockMedia: true,
                    useSoundEffects: false,
                  },
                  'ai-generated': {
                    assetMode: 'ai-generated',
                    generateMusic: true,
                    generateSVGAnimations: true,
                    generateSVGAssets: true,
                    generateStockAssets: true,
                    useStockMedia: false,
                    useSoundEffects: true,
                  },
                  mix: {
                    assetMode: 'mix',
                    generateMusic: false,
                    generateSVGAnimations: true,
                    generateSVGAssets: true,
                    generateStockAssets: true,
                    useStockMedia: true,
                    useSoundEffects: true,
                  },
                }
                updateSettings(presets[mode])
              }}
              options={[
                { value: 'library', label: 'Library only' },
                { value: 'ai-generated', label: 'AI-Generated' },
                { value: 'mix', label: 'Mix' },
              ]}
            />
            <ToggleRow
              label="Music"
              enabled={settings.generateMusic !== false}
              onChange={(v) => updateSettings({ generateMusic: v })}
            />
            <ToggleRow
              label="SVG Anims"
              enabled={settings.generateSVGAnimations !== false}
              onChange={(v) => updateSettings({ generateSVGAnimations: v })}
            />
            <ToggleRow
              label="SVG Assets"
              enabled={settings.generateSVGAssets !== false}
              onChange={(v) => updateSettings({ generateSVGAssets: v })}
            />
            <ToggleRow
              label="Stock Media"
              enabled={settings.useStockMedia !== false}
              onChange={(v) => updateSettings({ useStockMedia: v })}
            />
            <ToggleRow
              label="Image-Heavy"
              enabled={settings.imageHeavyMode === true}
              onChange={(v) =>
                updateSettings({ imageHeavyMode: v, useStockMedia: v || settings.useStockMedia !== false })
              }
            />
            <ToggleRow
              label="Sound FX"
              enabled={settings.useSoundEffects !== false}
              onChange={(v) => updateSettings({ useSoundEffects: v })}
            />

            {showLibrary && (
              <>
                {htmlTemplates.length > 0 && (
                  <PanelMultiSelect
                    label="Templates"
                    options={htmlTemplates.map((t) => ({ value: t.id, label: t.title }))}
                    value={settings.selectedHTMLTemplateIds || []}
                    onChange={(ids) => updateSettings({ selectedHTMLTemplateIds: ids })}
                    placeholder="All"
                  />
                )}
                {captions.length > 0 && (
                  <PanelMultiSelect
                    label="Captions"
                    options={captions.map((t) => ({ value: t.id, label: t.title }))}
                    value={settings.selectedCaptionIds || []}
                    onChange={(ids) => updateSettings({ selectedCaptionIds: ids })}
                    placeholder="All"
                  />
                )}
                {collages.length > 0 && (
                  <PanelMultiSelect
                    label="Collages"
                    options={collages.map((t) => ({ value: t.id, label: t.title }))}
                    value={settings.selectedCollageIds || []}
                    onChange={(ids) => updateSettings({ selectedCollageIds: ids })}
                    placeholder="All"
                  />
                )}
                {aiAnimations.length > 0 && (
                  <PanelMultiSelect
                    label="AI Anims"
                    options={aiAnimations.map((t) => ({ value: t.id, label: t.title }))}
                    value={settings.selectedAIAnimationIds || []}
                    onChange={(ids) => updateSettings({ selectedAIAnimationIds: ids })}
                    placeholder="All"
                  />
                )}
                {animationLibrary.length > 0 && (
                  <PanelMultiSelect
                    label="Animations"
                    options={animationLibrary.map((a) => ({ value: a.id, label: a.name }))}
                    value={settings.selectedAnimationIds || []}
                    onChange={(ids) => updateSettings({ selectedAnimationIds: ids })}
                    placeholder="All"
                  />
                )}
                {audioAssets.length > 0 && (
                  <PanelMultiSelect
                    label="Audio"
                    options={audioAssets.map((a) => ({ value: a.id, label: a.name }))}
                    value={settings.selectedAudioIds || []}
                    onChange={(ids) => updateSettings({ selectedAudioIds: ids })}
                    placeholder="All"
                  />
                )}
              </>
            )}
          </>
        )}

        {activeSection === 'options' && (
          <>
            <ToggleRow
              label="Google Search"
              enabled={settings.useGoogleSearch === true}
              onChange={(v) => updateSettings({ useGoogleSearch: v })}
            />
            <ToggleRow
              label="Auto Camera"
              enabled={settings.useAutoCamera !== false}
              onChange={(v) => updateSettings({ useAutoCamera: v })}
            />
            <ToggleRow
              label="Smart Defaults"
              enabled={settings.useSmartDefaults === true}
              onChange={(v) => updateSettings({ useSmartDefaults: v })}
            />
            {settings.useSmartDefaults && <SmartDefaultsPreview />}
            <div className="pt-2 border-t border-white/5 mt-2">
              <PanelSelect
                label="A/B Variants"
                value={String(settings.variantCount ?? 1)}
                onChange={(v) => updateSettings({ variantCount: parseInt(v, 10) })}
                options={[
                  { value: '1', label: 'None' },
                  { value: '2', label: '2 variants' },
                  { value: '3', label: '3 variants' },
                  { value: '5', label: '5 variants' },
                ]}
              />
              <ToggleRow
                label="Canvas Items"
                enabled={settings.includeCanvasItems === true}
                onChange={(v) => updateSettings({ includeCanvasItems: v })}
              />
            </div>
            {/* Image Story style — only visible when mode is active */}
            {settings.imageStoryMode && (
              <div className="pt-2 border-t border-white/5 mt-2">
                <PanelSelect
                  label="Image Style"
                  value={settings.imageStoryStyle || 'Cartoon'}
                  onChange={(v) =>
                    updateSettings({ imageStoryStyle: v as import('@/types/imageStory').ImageStoryStyle })
                  }
                  options={[
                    { value: 'Cartoon', label: 'Cartoon' },
                    { value: 'Realistic', label: 'Realistic' },
                    { value: 'Minimalist', label: 'Minimalist' },
                    { value: 'Watercolor', label: 'Watercolor' },
                    { value: 'Flat', label: 'Flat' },
                    { value: '3D Render', label: '3D Render' },
                  ]}
                />
              </div>
            )}
          </>
        )}

        {activeSection === 'platform' && (
          <PanelSelect
            label="Platform"
            value={settings.targetPlatform || 'generic'}
            onChange={(v) =>
              updateSettings({ targetPlatform: v as 'tiktok' | 'youtube' | 'instagram' | 'reels' | undefined })
            }
            options={[
              { value: 'generic', label: 'Generic' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'youtube-shorts', label: 'YT Shorts' },
              { value: 'instagram-reels', label: 'Reels' },
              { value: 'youtube', label: 'YouTube' },
            ]}
          />
        )}
      </div>

      {/* Reset — sticky bottom */}
      <div className="mt-auto p-4 border-t border-white/5">
        <button
          onClick={reset}
          className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={12} />
          Reset Director
        </button>
      </div>
    </div>
  )
}

// ── Toggle Row — matches PanelSelect row dimensions ──

function ToggleRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-gray-400 text-sm shrink-0 w-20">{label}</span>
      <div className="flex-1">
        <button
          onClick={() => onChange(!enabled)}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm transition-colors',
            enabled ? 'bg-accent/10 text-accent' : 'bg-panel-surface text-gray-500 hover:bg-panel-surface-hover',
          )}
        >
          {enabled ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  )
}

function SmartDefaultsPreview() {
  const getLearningContext = useLearningStore((s) => s.getLearningContext)
  const ctx = getLearningContext()
  const items: string[] = []
  if (ctx.recommendedAspectRatio) items.push(`Aspect: ${ctx.recommendedAspectRatio}`)
  if (ctx.recommendedDuration) items.push(`Duration: ${ctx.recommendedDuration}s`)
  if (ctx.recommendedCaptionStyle) items.push(`Captions: ${ctx.recommendedCaptionStyle}`)
  if (ctx.performanceInsights?.length) items.push(`${ctx.performanceInsights.length} insight(s)`)

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-zinc-500 italic">
        <Brain size={10} /> No data yet
      </div>
    )
  }
  return (
    <div className="px-1 py-1 space-y-0.5">
      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
        <Brain size={10} /> Learned:
      </div>
      {items.map((item, i) => (
        <div key={i} className="text-[10px] text-gray-400 ml-4">
          {item}
        </div>
      ))}
    </div>
  )
}
