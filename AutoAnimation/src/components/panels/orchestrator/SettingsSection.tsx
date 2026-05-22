import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Settings2,
  Monitor,
  Boxes,
  SlidersHorizontal,
  Brain,
  BookOpen,
  Sparkles,
  Shuffle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect, PanelToggle, PanelMultiSelect } from '@/components/ui/panel-controls'
import { ASPECT_RATIO_OPTIONS } from './constants'
import type { OrchestratorSettings } from '@/types/orchestrator'
import { useLearningStore } from '@/stores/useLearningStore'
import { useCharacterIdentityStore } from '@/stores/useCharacterIdentityStore'

// ── Cinema Tab Bar ──

const TABS = [
  { id: 'canvas', label: 'Canvas', icon: Monitor },
  { id: 'assets', label: 'Assets', icon: Boxes },
  { id: 'options', label: 'Options', icon: SlidersHorizontal },
] as const
type TabId = (typeof TABS)[number]['id']

// ── Asset Mode Buttons ──

type AssetMode = 'library' | 'ai-generated' | 'mix'

const ASSET_MODES: { id: AssetMode; label: string; icon: typeof BookOpen; desc: string }[] = [
  { id: 'library', label: 'Library', icon: BookOpen, desc: 'Stock & library only' },
  { id: 'ai-generated', label: 'AI-Generated', icon: Sparkles, desc: 'Create new from AI' },
  { id: 'mix', label: 'Mix', icon: Shuffle, desc: 'AI + library as needed' },
]

function getSettingsForMode(mode: AssetMode): Partial<OrchestratorSettings> {
  switch (mode) {
    case 'library':
      return {
        assetMode: mode,
        generateMusic: false,
        generateSVGAnimations: false,
        generateSVGAssets: false,
        generateStockAssets: false,
        useStockMedia: true,
        useSoundEffects: false,
      }
    case 'ai-generated':
      return {
        assetMode: mode,
        generateMusic: true,
        generateSVGAnimations: true,
        generateSVGAssets: true,
        generateStockAssets: true,
        useStockMedia: false,
        useSoundEffects: true,
      }
    case 'mix':
      return {
        assetMode: mode,
        generateMusic: false,
        generateSVGAnimations: true,
        generateSVGAssets: true,
        generateStockAssets: true,
        useStockMedia: true,
        useSoundEffects: true,
      }
  }
}

// ── Component ──

interface SettingsSectionProps {
  settings: OrchestratorSettings
  updateSettings: (updates: Partial<OrchestratorSettings>) => void
  savedCharacters: Array<{
    id: string
    name: string
    referenceImage?: string | null
  }>
  saved3DCharacters: Array<{
    id: string
    name: string
    thumbnailDataUrl?: string
  }>
  marketplaceItems: Array<{ id: string; title: string; category: string }>
  animationLibrary: Array<{ id: string; name: string }>
  audioAssets: Array<{ id: string; name: string }>
}

export function SettingsSection({
  settings,
  updateSettings,
  savedCharacters,
  saved3DCharacters,
  marketplaceItems,
  animationLibrary,
  audioAssets,
}: SettingsSectionProps) {
  const [showSettings, setShowSettings] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('canvas')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const currentMode: AssetMode = settings.assetMode ?? 'mix'

  // Build options for selects/multi-selects
  const characterOptions = savedCharacters.map((c) => ({
    value: c.id,
    label: c.name,
    image: c.referenceImage ?? undefined,
  }))

  const character3DOptions = saved3DCharacters.map((c) => ({
    value: c.id,
    label: c.name,
    image: c.thumbnailDataUrl ?? undefined,
  }))

  const identities = useCharacterIdentityStore((s) => s.identities)
  const identityOptions = identities.map((i) => ({
    value: i.id,
    label: i.name,
    image: i.thumbnailUrl ?? undefined,
  }))

  // Library items by category
  const htmlTemplateOptions = marketplaceItems
    .filter((i) => i.category === 'html-templates')
    .map((i) => ({ value: i.id, label: i.title }))

  const captionOptions = marketplaceItems
    .filter((i) => i.category === 'captions')
    .map((i) => ({ value: i.id, label: i.title }))

  const collageOptions = marketplaceItems
    .filter((i) => i.category === 'collages')
    .map((i) => ({ value: i.id, label: i.title }))

  const aiAnimationOptions = marketplaceItems
    .filter((i) => i.category === 'ai-animations')
    .map((i) => ({ value: i.id, label: i.title }))

  const animationOptions = animationLibrary.map((a) => ({
    value: a.id,
    label: a.name,
  }))

  const audioOptions = audioAssets.map((a) => ({
    value: a.id,
    label: a.name,
  }))

  const hasLibraryItems =
    htmlTemplateOptions.length > 0 ||
    captionOptions.length > 0 ||
    collageOptions.length > 0 ||
    aiAnimationOptions.length > 0 ||
    animationOptions.length > 0 ||
    audioOptions.length > 0

  const showLibraryPickers = currentMode !== 'ai-generated' && hasLibraryItems

  return (
    <div className="bg-[#1e1e1e] rounded-lg border border-white/5">
      {/* ── Collapsible Header ── */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#2a2a2a] transition-colors"
      >
        <Settings2 size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Settings</span>
        <ChevronRight
          size={12}
          className={cn('ml-auto text-gray-500 transition-transform duration-200', showSettings && 'rotate-90')}
        />
      </button>

      {showSettings && (
        <div className="border-t border-white/5">
          {/* ── Cinema Animated Tab Bar ── */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
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
                  <Icon size={14} className="shrink-0" />
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

          {/* ── Tab Content ── */}
          <div className="px-3 py-3 space-y-2">
            {/* ── Canvas Tab ── */}
            {activeTab === 'canvas' && (
              <>
                <PanelSelect
                  label="Aspect Ratio"
                  value={settings.aspectRatio}
                  onChange={(v) => updateSettings({ aspectRatio: v as OrchestratorSettings['aspectRatio'] })}
                  options={ASPECT_RATIO_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                />
                <PanelSelect
                  label="Duration"
                  value={String(settings.durationSeconds || 0)}
                  onChange={(v) => updateSettings({ durationSeconds: parseInt(v, 10) })}
                  options={[
                    { value: '0', label: 'AI decides' },
                    { value: '15', label: '15s' },
                    { value: '30', label: '30s' },
                    { value: '45', label: '45s' },
                    { value: '60', label: '60s' },
                    { value: '90', label: '90s' },
                    { value: '120', label: '2 min' },
                  ]}
                />
                <PanelSelect
                  label="FPS"
                  value={String(settings.fps || 0)}
                  onChange={(v) => updateSettings({ fps: parseInt(v, 10) })}
                  options={[
                    { value: '0', label: 'AI decides' },
                    { value: '24', label: '24 fps' },
                    { value: '30', label: '30 fps' },
                    { value: '60', label: '60 fps' },
                  ]}
                />
                {savedCharacters.length > 0 && (
                  <PanelMultiSelect
                    label="Characters"
                    options={characterOptions}
                    value={settings.selectedCharacterIds}
                    onChange={(ids) => updateSettings({ selectedCharacterIds: ids })}
                    placeholder="AI decides"
                    emptyMessage="No saved characters"
                  />
                )}
                {saved3DCharacters.length > 0 && (
                  <PanelMultiSelect
                    label="3D Characters"
                    options={character3DOptions}
                    value={settings.selected3DCharacterIds}
                    onChange={(ids) => updateSettings({ selected3DCharacterIds: ids })}
                    placeholder="None"
                    emptyMessage="No saved 3D characters"
                  />
                )}
                {identityOptions.length > 0 && (
                  <PanelMultiSelect
                    label="Character Identities"
                    options={identityOptions}
                    value={settings.selectedCharacterIdentityIds || []}
                    onChange={(ids) => updateSettings({ selectedCharacterIdentityIds: ids })}
                    placeholder="None (use fuzzy match)"
                    emptyMessage="No character identities"
                  />
                )}
              </>
            )}

            {/* ── Assets Tab ── */}
            {activeTab === 'assets' && (
              <>
                {/* 3 Asset Mode Buttons */}
                <div className="space-y-1.5">
                  {ASSET_MODES.map((mode) => {
                    const isActive = currentMode === mode.id
                    const Icon = mode.icon
                    return (
                      <button
                        key={mode.id}
                        onClick={() => updateSettings(getSettingsForMode(mode.id))}
                        className={cn(
                          'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-3',
                          isActive
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                            isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500',
                          )}
                        >
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className={cn('text-xs font-medium', isActive ? 'text-green-400' : 'text-gray-200')}>
                            {mode.label}
                          </div>
                          <div className="text-[9px] text-gray-500 mt-0.5">{mode.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* ── Advanced: individual generation toggles ── */}
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg bg-[#2a2a2a] border border-white/5 hover:bg-[#3a3a3a] transition-colors"
                >
                  {showAdvanced ? (
                    <ChevronDown size={12} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={12} className="text-gray-400" />
                  )}
                  <span className="text-[11px] font-medium text-gray-400">Advanced</span>
                  <span className="ml-auto text-[9px] text-gray-600">Individual toggles</span>
                </button>
                {showAdvanced && (
                  <div className="space-y-1 pt-2">
                    <PanelToggle
                      label="Music"
                      description="AI background music"
                      checked={settings.generateMusic}
                      onChange={(v) => updateSettings({ generateMusic: v })}
                    />
                    <PanelToggle
                      label="SVG Animations"
                      description="Animated backgrounds"
                      checked={settings.generateSVGAnimations}
                      onChange={(v) => updateSettings({ generateSVGAnimations: v })}
                    />
                    <PanelToggle
                      label="SVG Assets"
                      description="Objects & icons"
                      checked={settings.generateSVGAssets}
                      onChange={(v) => updateSettings({ generateSVGAssets: v })}
                    />
                    <PanelToggle
                      label="Stock Media"
                      description="Pixabay + Pexels images & video"
                      checked={settings.useStockMedia}
                      onChange={(v) => updateSettings({ useStockMedia: v })}
                    />
                    <PanelToggle
                      label="Image-Heavy Mode"
                      description="~40 stock-image cuts, talking-over-images shorts"
                      checked={settings.imageHeavyMode ?? false}
                      onChange={(v) =>
                        updateSettings({ imageHeavyMode: v, useStockMedia: v || settings.useStockMedia })
                      }
                    />
                    <PanelToggle
                      label="Sound Effects"
                      description="AI-generated SFX"
                      checked={settings.useSoundEffects}
                      onChange={(v) => updateSettings({ useSoundEffects: v })}
                    />
                  </div>
                )}

                {/* Library Item Pickers (visible for Library & Mix modes) */}
                {showLibraryPickers && (
                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <span className="text-gray-500 text-[10px] uppercase tracking-wider block pb-1">
                      Library Selection
                    </span>
                    {htmlTemplateOptions.length > 0 && (
                      <PanelMultiSelect
                        label="Templates"
                        options={htmlTemplateOptions}
                        value={settings.selectedHTMLTemplateIds}
                        onChange={(ids) => updateSettings({ selectedHTMLTemplateIds: ids })}
                        placeholder="None"
                      />
                    )}
                    {captionOptions.length > 0 && (
                      <PanelMultiSelect
                        label="Captions"
                        options={captionOptions}
                        value={settings.selectedCaptionIds}
                        onChange={(ids) => updateSettings({ selectedCaptionIds: ids })}
                        placeholder="None"
                      />
                    )}
                    {collageOptions.length > 0 && (
                      <PanelMultiSelect
                        label="Collages"
                        options={collageOptions}
                        value={settings.selectedCollageIds}
                        onChange={(ids) => updateSettings({ selectedCollageIds: ids })}
                        placeholder="None"
                      />
                    )}
                    {aiAnimationOptions.length > 0 && (
                      <PanelMultiSelect
                        label="AI Anims"
                        options={aiAnimationOptions}
                        value={settings.selectedAIAnimationIds}
                        onChange={(ids) => updateSettings({ selectedAIAnimationIds: ids })}
                        placeholder="None"
                      />
                    )}
                    {animationOptions.length > 0 && (
                      <PanelMultiSelect
                        label="Animations"
                        options={animationOptions}
                        value={settings.selectedAnimationIds}
                        onChange={(ids) => updateSettings({ selectedAnimationIds: ids })}
                        placeholder="None"
                      />
                    )}
                    {audioOptions.length > 0 && (
                      <PanelMultiSelect
                        label="Audio"
                        options={audioOptions}
                        value={settings.selectedAudioIds}
                        onChange={(ids) => updateSettings({ selectedAudioIds: ids })}
                        placeholder="None"
                      />
                    )}
                  </div>
                )}

                {currentMode === 'ai-generated' && (
                  <div className="flex items-center gap-2 px-2 py-2 text-[10px] text-gray-500 italic">
                    <Sparkles size={10} />
                    All assets will be AI-generated — library selection disabled
                  </div>
                )}
              </>
            )}

            {/* ── Options Tab ── */}
            {activeTab === 'options' && (
              <>
                <PanelToggle
                  label="Google Search"
                  description="Latest info"
                  checked={settings.useGoogleSearch}
                  onChange={(v) => updateSettings({ useGoogleSearch: v })}
                />
                <PanelToggle
                  label="Auto Camera"
                  description="Dialogue-driven zoom/pan"
                  checked={settings.useAutoCamera ?? true}
                  onChange={(v) => updateSettings({ useAutoCamera: v })}
                />

                <div className="border-t border-white/5 pt-2 mt-2">
                  <PanelToggle
                    label="Smart Defaults"
                    description="Learn from performance"
                    checked={settings.useSmartDefaults}
                    onChange={(v) => updateSettings({ useSmartDefaults: v })}
                  />
                  {settings.useSmartDefaults && <SmartDefaultsPreview />}
                </div>

                <div className="border-t border-white/5 pt-2 mt-2">
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
                  <PanelToggle
                    label="Include canvas items"
                    description="Shapes, text, characters"
                    checked={settings.includeCanvasItems}
                    onChange={(v) => updateSettings({ includeCanvasItems: v })}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Preview of what learned defaults will be applied */
function SmartDefaultsPreview() {
  const getLearningContext = useLearningStore((s) => s.getLearningContext)
  const learningContext = getLearningContext()

  const items: string[] = []
  if (learningContext.recommendedAspectRatio) {
    items.push(`Aspect: ${learningContext.recommendedAspectRatio}`)
  }
  if (learningContext.recommendedDuration) {
    items.push(`Duration: ${learningContext.recommendedDuration}s`)
  }
  if (learningContext.recommendedCaptionStyle) {
    items.push(`Captions: ${learningContext.recommendedCaptionStyle}`)
  }
  if (learningContext.performanceInsights?.length) {
    items.push(`${learningContext.performanceInsights.length} insight(s)`)
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-gray-500 italic">
        <Brain size={10} />
        No performance data yet — publish content to start learning
      </div>
    )
  }

  return (
    <div className="px-2 py-1.5 space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
        <Brain size={10} />
        Learned defaults active:
      </div>
      {items.map((item, i) => (
        <div key={i} className="text-[10px] text-gray-400 ml-4">
          {item}
        </div>
      ))}
    </div>
  )
}
