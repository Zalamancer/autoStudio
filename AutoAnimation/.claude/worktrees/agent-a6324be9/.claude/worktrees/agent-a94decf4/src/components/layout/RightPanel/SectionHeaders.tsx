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
} from 'lucide-react'
import { TabNavigation } from '@/components/ui'
import { useNB2Store } from '@/stores/useNB2Store'
import { useCrowdStore } from '@/stores/useCrowdStore'
import { NB2_PART_TYPES, NB2_PART_LABELS } from '@/types/nanoBanana2'
import type { RightPanelTab } from '@/types'
import { cn } from '@/lib/utils'
import { BRPropertiesPanel, useToolContext, useEngineContext } from '@bonerigging/editor'
import { PerformTakesPanel } from '@/components/panels/PerformTakesPanel'

import {
  CHARACTER_SECTIONS,
  CHARACTER_SECTION_TABS,
  characterSubTabs,
  TEXT_SECTIONS,
  PIXELART_SECTIONS,
  AVATAR_SECTIONS,
  GEN_SECTIONS,
  TEMPLATE_SECTIONS,
  BG_SECTIONS,
  BG_BG_TABS,
  bgSubTabs,
  CAMERA_SUB_TABS,
  BRAND_KIT_SUB_TABS,
  NB2_STEP_ICONS,
  RIG_SECTIONS,
  BONE_CATEGORIES,
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

  useEffect(() => { if (!editingPromptStep) setEditingPromptStep('concept') }, [editingPromptStep, setEditingPromptStep])

  const currentStep = editingPromptStep ?? 'concept'
  const currentIndex = NB2_PART_TYPES.indexOf(currentStep)
  const StepIcon = NB2_STEP_ICONS[currentStep] ?? Sparkles

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = useCallback(() => { const prev = currentIndex <= 0 ? NB2_PART_TYPES.length - 1 : currentIndex - 1; setEditingPromptStep(NB2_PART_TYPES[prev]) }, [currentIndex, setEditingPromptStep])
  const goNext = useCallback(() => { const next = currentIndex >= NB2_PART_TYPES.length - 1 ? 0 : currentIndex + 1; setEditingPromptStep(NB2_PART_TYPES[next]) }, [currentIndex, setEditingPromptStep])

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button onClick={goPrev} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"><ChevronLeft size={16} /></button>
      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors">
          <StepIcon size={14} className="shrink-0 text-[#4a7eff]" />
          <span className="truncate">{NB2_PART_LABELS[currentStep]}</span>
          <ChevronDown size={14} className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
            {NB2_PART_TYPES.map((step) => {
              const Icon = NB2_STEP_ICONS[step] ?? Sparkles
              const isActive = step === currentStep
              return (
                <button key={step} onClick={() => { setEditingPromptStep(step); setDropdownOpen(false) }} className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors', isActive ? 'bg-[#4a7eff]/10 text-[#4a7eff]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]')}>
                  <Icon size={15} className="shrink-0" /><span className="truncate">{NB2_PART_LABELS[step]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button onClick={goNext} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"><ChevronRight size={16} /></button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared Dropdown Section Header
// ---------------------------------------------------------------------------

export function DropdownSectionHeader({ sections, activeIndex, onSelect }: {
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
    const handler = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = useCallback(() => { onSelect(activeIndex <= 0 ? sections.length - 1 : activeIndex - 1) }, [activeIndex, sections.length, onSelect])
  const goNext = useCallback(() => { onSelect(activeIndex >= sections.length - 1 ? 0 : activeIndex + 1) }, [activeIndex, sections.length, onSelect])

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button onClick={goPrev} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Previous"><ChevronLeft size={16} /></button>
      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors">
          <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" /><span className="truncate">{current.label}</span>
          <ChevronDown size={14} className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
            {sections.map((section, i) => {
              const Icon = section.icon; const isActive = i === activeIndex
              return (
                <button key={section.id} onClick={() => { onSelect(i); setDropdownOpen(false) }} className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors', isActive ? 'bg-[#4a7eff]/10 text-[#4a7eff]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]')}>
                  <Icon size={15} className="shrink-0" /><span className="truncate">{section.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <button onClick={goNext} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Next"><ChevronRight size={16} /></button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Context-specific section headers
// ---------------------------------------------------------------------------

export function CharacterSectionHeader({ rightPanelTab, setRightPanelTab }: { rightPanelTab: string; setRightPanelTab: (tab: RightPanelTab) => void }) {
  const activeSection = CHARACTER_SECTION_TABS.has(rightPanelTab) ? 'character' : rightPanelTab === 'style-properties' ? 'style' : rightPanelTab === 'voices' ? 'voices' : rightPanelTab === 'animations' ? 'animations' : 'character'
  const currentIndex = CHARACTER_SECTIONS.findIndex((s) => s.id === activeSection)
  return (
    <>
      <DropdownSectionHeader sections={CHARACTER_SECTIONS} activeIndex={currentIndex} onSelect={(i) => setRightPanelTab(CHARACTER_SECTIONS[i].defaultTab)} />
      {activeSection === 'character' && (
        <div className="px-3 pb-2 border-t border-white/5 pt-2">
          <TabNavigation tabs={characterSubTabs} activeTab={rightPanelTab} onTabChange={(id) => setRightPanelTab(id as RightPanelTab)} size="sm" animated />
        </div>
      )}
    </>
  )
}

export function TextSectionHeader({ rightPanelTab, setRightPanelTab }: { rightPanelTab: string; setRightPanelTab: (tab: RightPanelTab) => void }) {
  const activeSection = rightPanelTab === 'text-animations' ? 'animations' : rightPanelTab === 'text-styles' ? 'styles' : 'properties'
  return <DropdownSectionHeader sections={TEXT_SECTIONS} activeIndex={TEXT_SECTIONS.findIndex((s) => s.id === activeSection)} onSelect={(i) => setRightPanelTab(TEXT_SECTIONS[i].defaultTab)} />
}

export function PixelArtSectionHeader({ rightPanelTab, setRightPanelTab }: { rightPanelTab: string; setRightPanelTab: (tab: RightPanelTab) => void }) {
  const activeSection = rightPanelTab === 'pixelart-animations' ? 'animations' : 'properties'
  return <DropdownSectionHeader sections={PIXELART_SECTIONS} activeIndex={PIXELART_SECTIONS.findIndex((s) => s.id === activeSection)} onSelect={(i) => setRightPanelTab(PIXELART_SECTIONS[i].defaultTab)} />
}

export function AvatarSectionHeader({ rightPanelTab, setRightPanelTab }: { rightPanelTab: string; setRightPanelTab: (tab: RightPanelTab) => void }) {
  const activeSection = rightPanelTab === 'avatar-voices' ? 'voices' : rightPanelTab === 'avatar-videos' ? 'videos' : 'properties'
  return <DropdownSectionHeader sections={AVATAR_SECTIONS} activeIndex={AVATAR_SECTIONS.findIndex((s) => s.id === activeSection)} onSelect={(i) => setRightPanelTab(AVATAR_SECTIONS[i].defaultTab)} />
}

export function GenSectionHeader({ rightPanelTab, setRightPanelTab }: { rightPanelTab: string; setRightPanelTab: (tab: RightPanelTab) => void }) {
  return <DropdownSectionHeader sections={GEN_SECTIONS} activeIndex={Math.max(GEN_SECTIONS.findIndex((s) => s.id === rightPanelTab), 0)} onSelect={(i) => setRightPanelTab(GEN_SECTIONS[i].tab)} />
}

export function TemplateSectionHeader({ rightPanelTab, setRightPanelTab }: { rightPanelTab: string; setRightPanelTab: (tab: RightPanelTab) => void }) {
  return <DropdownSectionHeader sections={TEMPLATE_SECTIONS} activeIndex={Math.max(TEMPLATE_SECTIONS.findIndex((s) => s.id === rightPanelTab), 0)} onSelect={(i) => setRightPanelTab(TEMPLATE_SECTIONS[i].tab)} />
}

export function BackgroundSectionHeader({ rightPanelTab, setRightPanelTab }: { rightPanelTab: string; setRightPanelTab: (tab: RightPanelTab) => void }) {
  const isBgSection = BG_BG_TABS.has(rightPanelTab)
  return (
    <>
      <DropdownSectionHeader sections={BG_SECTIONS} activeIndex={BG_SECTIONS.findIndex((s) => s.id === (isBgSection ? 'background' : 'layers'))} onSelect={(i) => setRightPanelTab(BG_SECTIONS[i].defaultTab as RightPanelTab)} />
      {isBgSection && (
        <div className="px-3 pb-2">
          <TabNavigation tabs={bgSubTabs} activeTab={rightPanelTab} onTabChange={(id) => setRightPanelTab(id as RightPanelTab)} size="sm" animated />
        </div>
      )}
    </>
  )
}

export function CameraSectionHeader({ activeSubTab, setActiveSubTab }: { activeSubTab: string; setActiveSubTab: (tab: CameraSubTab) => void }) {
  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2">
        <button className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Previous"><ChevronLeft size={16} /></button>
        <div className="flex-1 min-w-0"><div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200"><Camera size={14} className="shrink-0 text-[#4a7eff]" /><span className="truncate">Camera</span></div></div>
        <button className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Next"><ChevronRight size={16} /></button>
      </div>
      <div className="px-3 pb-2"><TabNavigation tabs={CAMERA_SUB_TABS} activeTab={activeSubTab} onTabChange={(id) => setActiveSubTab(id as CameraSubTab)} size="sm" animated /></div>
    </>
  )
}

export function CrowdSectionHeader() {
  const groups = useCrowdStore((s) => s.groups)
  const selectedGroupId = useCrowdStore((s) => s.selectedGroupId)
  const setSelectedGroupId = useCrowdStore((s) => s.setSelectedGroupId)
  const currentIndex = groups.findIndex((g) => g.id === selectedGroupId)
  const current = currentIndex >= 0 ? groups[currentIndex] : null
  const goPrev = useCallback(() => { if (groups.length === 0) return; setSelectedGroupId(groups[currentIndex <= 0 ? groups.length - 1 : currentIndex - 1].id) }, [currentIndex, groups, setSelectedGroupId])
  const goNext = useCallback(() => { if (groups.length === 0) return; setSelectedGroupId(groups[currentIndex >= groups.length - 1 ? 0 : currentIndex + 1].id) }, [currentIndex, groups, setSelectedGroupId])
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <button onClick={goPrev} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Previous group"><ChevronLeft size={16} /></button>
      <div className="flex-1 min-w-0"><div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200"><Users size={14} className="shrink-0 text-[#4a7eff]" /><span className="truncate">{current?.name ?? 'Crowd'}</span></div></div>
      <button onClick={goNext} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Next group"><ChevronRight size={16} /></button>
    </div>
  )
}

export function BrandKitSectionHeader({ activeSubTab, setActiveSubTab }: { activeSubTab: string; setActiveSubTab: (tab: BrandKitSubTab) => void }) {
  return (
    <>
      <div className="flex items-center gap-1 px-3 py-2">
        <button className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Previous"><ChevronLeft size={16} /></button>
        <div className="flex-1 min-w-0"><div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200"><Palette size={14} className="shrink-0 text-[#4a7eff]" /><span className="truncate">Brand Kit</span></div></div>
        <button className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Next"><ChevronRight size={16} /></button>
      </div>
      <div className="px-3 pb-2"><TabNavigation tabs={BRAND_KIT_SUB_TABS} activeTab={activeSubTab} onTabChange={(id) => setActiveSubTab(id as BrandKitSubTab)} size="sm" animated /></div>
    </>
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

  useEffect(() => { if (brToolState.editMode) setActiveSection('skeleton') }, [brToolState.editMode])
  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const currentIndex = RIG_SECTIONS.findIndex((s) => s.id === activeSection)
  const current = RIG_SECTIONS[currentIndex]
  const SectionIcon = current.icon
  const goPrev = useCallback(() => { setActiveSection(RIG_SECTIONS[currentIndex <= 0 ? RIG_SECTIONS.length - 1 : currentIndex - 1].id) }, [currentIndex])
  const goNext = useCallback(() => { setActiveSection(RIG_SECTIONS[currentIndex >= RIG_SECTIONS.length - 1 ? 0 : currentIndex + 1].id) }, [currentIndex])

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-white/5">
        <div className="flex items-center gap-1 px-3 py-2">
          <button onClick={goPrev} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Previous"><ChevronLeft size={16} /></button>
          <div ref={dropdownRef} className="relative flex-1 min-w-0">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors">
              <div className="relative group shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-colors"><Info size={13} /></div>
                {engine.statusText && <div className="absolute top-full left-0 mt-3 w-52 px-3 py-2 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl text-[10px] text-zinc-400 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">{engine.statusText}</div>}
              </div>
              <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" /><span className="truncate">{current.label}</span>
              <ChevronDown size={14} className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
                {RIG_SECTIONS.map((section) => {
                  const Icon = section.icon; const isActive = section.id === activeSection
                  return (
                    <button key={section.id} onClick={() => { setActiveSection(section.id); setDropdownOpen(false) }} className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors', isActive ? 'bg-[#4a7eff]/10 text-[#4a7eff]' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]')}>
                      <Icon size={15} className="shrink-0" /><span className="truncate">{section.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <button onClick={goNext} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors" title="Next"><ChevronRight size={16} /></button>
        </div>
      </div>
      {activeSection === 'skeleton' && (
        <div className="shrink-0 px-3 pb-2 border-b border-white/5 pt-2">
          <div className="flex gap-1">
            {BONE_CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setBoneCategory(cat.id)} className={cn('flex-1 h-7 rounded-md text-[10px] font-medium transition-colors', boneCategory === cat.id ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50')}>{cat.label}</button>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'skeleton' && <BRPropertiesPanel boneCategory={boneCategory} />}
        {activeSection === 'takes' && <PerformTakesPanel />}
      </div>
    </div>
  )
}
