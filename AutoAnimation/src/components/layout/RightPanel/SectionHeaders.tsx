/**
 * Section header components for the RightPanel.
 * Each renders the arrow-navigated dropdown header for its context.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Camera,
  Users,
  Palette,
  Sparkles,
  Info,
  Shirt,
  Footprints,
  Ban,
} from 'lucide-react'
import { TabNavigation } from '@/components/ui'
import { useNB2Store } from '@/stores/useNB2Store'
import { useCrowdStore } from '@/stores/useCrowdStore'
import { useLayerTreeStore } from '@/stores/useLayerTreeStore'
import { NB2_PART_TYPES, NB2_PART_LABELS } from '@/types/nanoBanana2'
import type { RightPanelTab } from '@/types'
import { cn } from '@/lib/utils'
import { BRPropertiesPanel, useToolContext, useEngineContext, useCharacterContext } from '@bonerigging/editor'
import { PerformTakesPanel } from '@/components/panels/PerformTakesPanel'
import { PartTransformControls, type PartTransform } from '@/components/layout/RightPanel/PartTransformControls'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'

import {
  CHARACTER_SECTIONS,
  CHARACTER_SECTION_TABS,
  ASSET_SECTION_TABS,
  characterSubTabs,
  TEXT_SECTIONS,
  PIXELART_SECTIONS,
  AVATAR_SECTIONS,
  GEN_SECTIONS,
  TEMPLATE_SECTIONS,
  MEDIA_SECTIONS,
  MEDIA_SUB_TABS,
  type MediaSubTab,
  BG_SECTIONS,
  BG_BG_TABS,
  bgSubTabs,
  LAYER_VIEW_TABS,
  CAMERA_SUB_TABS,
  BRAND_KIT_SUB_TABS,
  NB2_STEP_ICONS,
  PantsIcon,
  RIG_SECTIONS,
  BONE_CATEGORIES,
  AI_DIRECTOR_TOOL_SECTIONS,
  type CameraSubTab,
  type BrandKitSubTab,
  type RigSectionId,
  type BoneCategoryId,
} from './rightPanelConstants'

// ---------------------------------------------------------------------------
// NB2 Generation Header
// ---------------------------------------------------------------------------

export function NB2GenerationHeader() {
  const editingPromptStep = useNB2Store((s) => s.editingPromptStep)
  const setEditingPromptStep = useNB2Store((s) => s.setEditingPromptStep)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editingPromptStep) setEditingPromptStep('concept')
  }, [editingPromptStep, setEditingPromptStep])

  const currentStep = editingPromptStep ?? 'concept'
  const currentIndex = NB2_PART_TYPES.indexOf(currentStep)
  const StepIcon = NB2_STEP_ICONS[currentStep] ?? Sparkles

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? NB2_PART_TYPES.length - 1 : currentIndex - 1
    setEditingPromptStep(NB2_PART_TYPES[prev])
  }, [currentIndex, setEditingPromptStep])
  const goNext = useCallback(() => {
    const next = currentIndex >= NB2_PART_TYPES.length - 1 ? 0 : currentIndex + 1
    setEditingPromptStep(NB2_PART_TYPES[next])
  }, [currentIndex, setEditingPromptStep])

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button
        onClick={goPrev}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <StepIcon size={14} className="shrink-0 text-accent" />
          <span className="truncate">{NB2_PART_LABELS[currentStep]}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-panel-bg border border-white/5 rounded-xl shadow-2xl py-1.5">
            {NB2_PART_TYPES.map((step) => {
              const Icon = NB2_STEP_ICONS[step] ?? Sparkles
              const isActive = step === currentStep
              return (
                <button
                  key={step}
                  onClick={() => {
                    setEditingPromptStep(step)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive ? 'bg-accent/10 text-accent' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="truncate">{NB2_PART_LABELS[step]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button
        onClick={goNext}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared Dropdown Section Header
// ---------------------------------------------------------------------------

export function DropdownSectionHeader({
  sections,
  activeIndex,
  onSelect,
}: {
  sections: readonly { id: string; icon: typeof Sparkles; label: string }[]
  activeIndex: number
  onSelect: (index: number) => void
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const current = sections[Math.max(activeIndex, 0)]
  const SectionIcon = current.icon

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = useCallback(() => {
    onSelect(activeIndex <= 0 ? sections.length - 1 : activeIndex - 1)
  }, [activeIndex, sections.length, onSelect])
  const goNext = useCallback(() => {
    onSelect(activeIndex >= sections.length - 1 ? 0 : activeIndex + 1)
  }, [activeIndex, sections.length, onSelect])

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button
        onClick={goPrev}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Previous"
      >
        <ChevronLeft size={16} />
      </button>
      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <SectionIcon size={14} className="shrink-0 text-accent" />
          <span className="truncate">{current.label}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-panel-bg border border-white/5 rounded-xl shadow-2xl py-1.5">
            {sections.map((section, i) => {
              const Icon = section.icon
              const isActive = i === activeIndex
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    onSelect(i)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive ? 'bg-accent/10 text-accent' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="truncate">{section.label}</span>
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
  )
}

// ---------------------------------------------------------------------------
// Context-specific section headers
// ---------------------------------------------------------------------------

export function CharacterSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection = CHARACTER_SECTION_TABS.has(rightPanelTab)
    ? 'character'
    : rightPanelTab === 'style-properties'
      ? 'style'
      : rightPanelTab === 'voices'
        ? 'voices'
        : rightPanelTab === 'animations'
          ? 'animations'
          : 'character'
  const currentIndex = CHARACTER_SECTIONS.findIndex((s) => s.id === activeSection)
  // When on a sprite tab (eye, body, etc.) the "Assets" pill should stay highlighted
  const activePill = ASSET_SECTION_TABS.has(rightPanelTab) ? 'character-assets' : 'group-properties'
  return (
    <>
      <DropdownSectionHeader
        sections={CHARACTER_SECTIONS}
        activeIndex={currentIndex}
        onSelect={(i) => setRightPanelTab(CHARACTER_SECTIONS[i].defaultTab)}
      />
      {activeSection === 'character' && (
        <div className="px-3 pb-2 border-t border-white/5 pt-2">
          <TabNavigation
            tabs={characterSubTabs}
            activeTab={activePill}
            onTabChange={(id) => setRightPanelTab(id as RightPanelTab)}
            size="sm"
            animated
          />
        </div>
      )}
    </>
  )
}

export function TextSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection =
    rightPanelTab === 'text-animations' ? 'animations' : rightPanelTab === 'text-styles' ? 'styles' : 'properties'
  return (
    <DropdownSectionHeader
      sections={TEXT_SECTIONS}
      activeIndex={TEXT_SECTIONS.findIndex((s) => s.id === activeSection)}
      onSelect={(i) => setRightPanelTab(TEXT_SECTIONS[i].defaultTab)}
    />
  )
}

export function PixelArtSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection = rightPanelTab === 'pixelart-animations' ? 'animations' : 'properties'
  return (
    <DropdownSectionHeader
      sections={PIXELART_SECTIONS}
      activeIndex={PIXELART_SECTIONS.findIndex((s) => s.id === activeSection)}
      onSelect={(i) => setRightPanelTab(PIXELART_SECTIONS[i].defaultTab)}
    />
  )
}

export function AvatarSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection =
    rightPanelTab === 'avatar-voices' ? 'voices' : rightPanelTab === 'avatar-videos' ? 'videos' : 'properties'
  return (
    <DropdownSectionHeader
      sections={AVATAR_SECTIONS}
      activeIndex={AVATAR_SECTIONS.findIndex((s) => s.id === activeSection)}
      onSelect={(i) => setRightPanelTab(AVATAR_SECTIONS[i].defaultTab)}
    />
  )
}

export function GenSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  return (
    <DropdownSectionHeader
      sections={GEN_SECTIONS}
      activeIndex={Math.max(
        GEN_SECTIONS.findIndex((s) => s.id === rightPanelTab),
        0,
      )}
      onSelect={(i) => setRightPanelTab(GEN_SECTIONS[i].tab)}
    />
  )
}

export function TemplateSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  return (
    <DropdownSectionHeader
      sections={TEMPLATE_SECTIONS}
      activeIndex={Math.max(
        TEMPLATE_SECTIONS.findIndex((s) => s.id === rightPanelTab),
        0,
      )}
      onSelect={(i) => setRightPanelTab(TEMPLATE_SECTIONS[i].tab)}
    />
  )
}

export function MediaSectionHeader({
  rightPanelTab,
  setRightPanelTab,
  activeSubTab,
  setActiveSubTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
  activeSubTab: string
  setActiveSubTab: (tab: MediaSubTab) => void
}) {
  return (
    <>
      <DropdownSectionHeader
        sections={MEDIA_SECTIONS}
        activeIndex={Math.max(
          MEDIA_SECTIONS.findIndex((s) => s.id === rightPanelTab),
          0,
        )}
        onSelect={(i) => setRightPanelTab(MEDIA_SECTIONS[i].tab)}
      />
      <div className="px-3 pb-2">
        <TabNavigation
          tabs={MEDIA_SUB_TABS}
          activeTab={activeSubTab}
          onTabChange={(id) => setActiveSubTab(id as MediaSubTab)}
          size="sm"
          animated
        />
      </div>
    </>
  )
}

export function BackgroundSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const isBgSection = BG_BG_TABS.has(rightPanelTab)
  const isLayersSection = rightPanelTab === 'canvas-layers'
  const viewMode = useLayerTreeStore((s) => s.viewMode)
  const setViewMode = useLayerTreeStore((s) => s.setViewMode)
  return (
    <>
      <DropdownSectionHeader
        sections={BG_SECTIONS}
        activeIndex={BG_SECTIONS.findIndex((s) => s.id === (isBgSection ? 'background' : 'layers'))}
        onSelect={(i) => setRightPanelTab(BG_SECTIONS[i].defaultTab as RightPanelTab)}
      />
      {isBgSection && (
        <div className="px-3 pb-2">
          <TabNavigation
            tabs={bgSubTabs}
            activeTab={rightPanelTab}
            onTabChange={(id) => setRightPanelTab(id as RightPanelTab)}
            size="sm"
            animated
          />
        </div>
      )}
      {isLayersSection && (
        <div className="px-3 pb-2">
          <TabNavigation
            tabs={LAYER_VIEW_TABS}
            activeTab={viewMode}
            onTabChange={(id) => setViewMode(id as 'categories' | 'custom')}
            size="sm"
            animated
          />
        </div>
      )}
    </>
  )
}

export function CameraSectionHeader({
  activeSubTab,
  setActiveSubTab,
}: {
  activeSubTab: string
  setActiveSubTab: (tab: CameraSubTab) => void
}) {
  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200">
            <Camera size={14} className="shrink-0 text-accent" />
            <span className="truncate">Camera</span>
          </div>
        </div>
        <button
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="px-3 pb-2">
        <TabNavigation
          tabs={CAMERA_SUB_TABS}
          activeTab={activeSubTab}
          onTabChange={(id) => setActiveSubTab(id as CameraSubTab)}
          size="sm"
          animated
        />
      </div>
    </>
  )
}

export function CrowdSectionHeader() {
  const groups = useCrowdStore((s) => s.groups)
  const selectedGroupId = useCrowdStore((s) => s.selectedGroupId)
  const setSelectedGroupId = useCrowdStore((s) => s.setSelectedGroupId)
  const currentIndex = groups.findIndex((g) => g.id === selectedGroupId)
  const current = currentIndex >= 0 ? groups[currentIndex] : null
  const goPrev = useCallback(() => {
    if (groups.length === 0) return
    setSelectedGroupId(groups[currentIndex <= 0 ? groups.length - 1 : currentIndex - 1].id)
  }, [currentIndex, groups, setSelectedGroupId])
  const goNext = useCallback(() => {
    if (groups.length === 0) return
    setSelectedGroupId(groups[currentIndex >= groups.length - 1 ? 0 : currentIndex + 1].id)
  }, [currentIndex, groups, setSelectedGroupId])
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button
        onClick={goPrev}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Previous group"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200">
          <Users size={14} className="shrink-0 text-accent" />
          <span className="truncate">{current?.name ?? 'Crowd'}</span>
        </div>
      </div>
      <button
        onClick={goNext}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Next group"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

export function BrandKitSectionHeader({
  activeSubTab,
  setActiveSubTab,
}: {
  activeSubTab: string
  setActiveSubTab: (tab: BrandKitSubTab) => void
}) {
  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200">
            <Palette size={14} className="shrink-0 text-accent" />
            <span className="truncate">Brand Kit</span>
          </div>
        </div>
        <button
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="px-3 pb-2">
        <TabNavigation
          tabs={BRAND_KIT_SUB_TABS}
          activeTab={activeSubTab}
          onTabChange={(id) => setActiveSubTab(id as BrandKitSubTab)}
          size="sm"
          animated
        />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// AI Director Tool Section Header
// ---------------------------------------------------------------------------

export function AIDirectorToolSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  return (
    <DropdownSectionHeader
      sections={AI_DIRECTOR_TOOL_SECTIONS}
      activeIndex={Math.max(
        AI_DIRECTOR_TOOL_SECTIONS.findIndex((s) => s.id === rightPanelTab),
        0,
      )}
      onSelect={(i) => setRightPanelTab(AI_DIRECTOR_TOOL_SECTIONS[i].tab)}
    />
  )
}

// ---------------------------------------------------------------------------
// Rig Clothes Panel — Cinema-style pill tabs for clothing selection
// ---------------------------------------------------------------------------

const CLOTHING_TABS = [
  { id: 'shirt', label: 'Shirt', icon: Shirt, fit: 1.2, fitLabel: 'Loose' },
  { id: 'pants', label: 'Pants', icon: PantsIcon, fit: 1.0, fitLabel: 'Fitted' },
  { id: 'shoes', label: 'Shoes', icon: Footprints, fit: 0.8, fitLabel: 'Rigid' },
] as const
type ClothingTabId = (typeof CLOTHING_TABS)[number]['id']

function RigClothesPanel() {
  const [activeTab, setActiveTab] = useState<ClothingTabId>('shirt')

  // Use the rig editor's own character context — its activeCharacterId IS the savedCharacterId
  const { state: rigCharState } = useCharacterContext()
  const rigActiveId = rigCharState.activeCharacterId
  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const updateCharacter = useSavedCharactersStore((s) => s.updateCharacter)

  const savedChar = savedCharacters.find((c) => c.id === rigActiveId)
  const bodyParts = savedChar?.bodyParts as Record<string, string[]> | undefined
  const selectedSprites = (savedChar?.selectedSprites ?? {}) as Record<string, number | null>
  const partTransforms = (savedChar?.partTransforms ?? {}) as Record<string, PartTransform>
  const currentTabMeta = CLOTHING_TABS.find((t) => t.id === activeTab)!

  const sprites = bodyParts?.[activeTab] ?? []
  const selectedIdx = selectedSprites[activeTab] ?? 0

  const DEFAULT_TRANSFORM: PartTransform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }

  const handleSelect = useCallback(
    (idx: number | null) => {
      if (!savedChar) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateCharacter(savedChar.id, {
        selectedSprites: { ...selectedSprites, [activeTab]: idx } as any,
      })
    },
    [savedChar, selectedSprites, activeTab, updateCharacter],
  )

  const handleTransformChange = useCallback(
    (part: string, updates: Partial<PartTransform>) => {
      if (!savedChar) return
      const current = partTransforms[part] || DEFAULT_TRANSFORM
      updateCharacter(savedChar.id, {
        partTransforms: {
          ...partTransforms,
          [part]: { ...current, ...updates },
        } as any,
      })
    },
    [savedChar, partTransforms, updateCharacter],
  )

  if (!savedChar) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <Shirt size={28} className="mb-3" />
        <span className="text-sm text-gray-400">No character selected</span>
        <span className="text-xs text-gray-600 mt-1">Select a character on the canvas</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Pill Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {CLOTHING_TABS.map((tab) => {
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

      {/* ── Fit info bar ── */}
      <div className="shrink-0 px-3 py-1.5 border-b border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">
          Fit: <span className="text-zinc-300">{currentTabMeta.fitLabel}</span>{' '}
          <span className="text-zinc-600">({currentTabMeta.fit}x)</span>
        </span>
        <span className="text-[10px] text-zinc-500">
          {sprites.length} variant{sprites.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Scrollable sprite list ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sprites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-600">
            <currentTabMeta.icon size={28} className="mb-3" />
            <span className="text-sm text-gray-400">No {currentTabMeta.label.toLowerCase()} sprites</span>
            <span className="text-xs text-gray-600 mt-1">Upload sprites in Character Assets</span>
          </div>
        ) : (
          <div className="space-y-1">
            {/* None row — deselect */}
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-3',
                selectedIdx === null
                  ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
                  : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
              )}
            >
              <Ban size={14} className="shrink-0 text-gray-500" />
              <div>
                <div className="text-xs font-medium text-gray-200">None</div>
                <div className="text-[9px] text-gray-500 mt-0.5">No {currentTabMeta.label.toLowerCase()}</div>
              </div>
            </button>

            {/* Sprite variant rows */}
            {sprites.map((url, idx) => {
              const isSelected = selectedIdx === idx
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-left transition-colors border flex items-center gap-3',
                    isSelected
                      ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
                      : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                  )}
                >
                  <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 overflow-hidden shrink-0">
                    <img
                      src={url}
                      alt={`${currentTabMeta.label} ${idx + 1}`}
                      className="w-full h-full object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-200">
                      {currentTabMeta.label} {idx + 1}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">Mesh: 20x30 grid</div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4a7eff]/20 text-[#4a7eff] shrink-0">
                      Active
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Transform Controls for active clothing tab ── */}
        {selectedIdx !== null && sprites.length > 0 && (
          <div className="px-3 py-2 border-t border-white/5">
            <PartTransformControls
              label={currentTabMeta.label}
              transform={partTransforms[activeTab] || DEFAULT_TRANSFORM}
              onChange={(updates) => handleTransformChange(activeTab, updates)}
              color="bg-white"
              defaultExpanded
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Rig Editor Right Panel
// ---------------------------------------------------------------------------

export function RigEditorRightPanel() {
  const [activeSection, setActiveSection] = useState<RigSectionId>('skeleton')
  const [boneCategory, setBoneCategory] = useState<BoneCategoryId>('all')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { state: brToolState } = useToolContext()
  const engine = useEngineContext()

  useEffect(() => {
    if (brToolState.editMode) setActiveSection('skeleton')
  }, [brToolState.editMode])
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const currentIndex = RIG_SECTIONS.findIndex((s) => s.id === activeSection)
  const current = RIG_SECTIONS[currentIndex]
  const SectionIcon = current.icon
  const goPrev = useCallback(() => {
    setActiveSection(RIG_SECTIONS[currentIndex <= 0 ? RIG_SECTIONS.length - 1 : currentIndex - 1].id)
  }, [currentIndex])
  const goNext = useCallback(() => {
    setActiveSection(RIG_SECTIONS[currentIndex >= RIG_SECTIONS.length - 1 ? 0 : currentIndex + 1].id)
  }, [currentIndex])

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-white/5">
        <div className="flex items-center gap-1 px-3 py-2">
          <button
            onClick={goPrev}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            title="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <div ref={dropdownRef} className="relative flex-1 min-w-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <div className="relative group shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors">
                  <Info size={13} />
                </div>
                {engine.statusText && (
                  <div className="absolute top-full left-0 mt-3 w-52 px-3 py-2 bg-panel-bg border border-white/10 rounded-lg shadow-xl text-[10px] text-zinc-400 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                    {engine.statusText}
                  </div>
                )}
              </div>
              <SectionIcon size={14} className="shrink-0 text-accent" />
              <span className="truncate">{current.label}</span>
              <ChevronDown
                size={14}
                className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
              />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-panel-bg border border-white/5 rounded-xl shadow-2xl py-1.5">
                {RIG_SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = section.id === activeSection
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id)
                        setDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                      )}
                    >
                      <Icon size={15} className="shrink-0" />
                      <span className="truncate">{section.label}</span>
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
      </div>
      {activeSection === 'skeleton' && (
        <div className="shrink-0 px-3 pb-2 border-b border-white/5 pt-2">
          <div className="flex gap-1">
            {BONE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setBoneCategory(cat.id)}
                className={cn(
                  'flex-1 h-7 rounded-md text-[10px] font-medium transition-colors',
                  boneCategory === cat.id
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50',
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'skeleton' && <BRPropertiesPanel boneCategory={boneCategory} />}
        {activeSection === 'clothes' && <RigClothesPanel />}
        {activeSection === 'takes' && <PerformTakesPanel />}
      </div>
    </div>
  )
}
