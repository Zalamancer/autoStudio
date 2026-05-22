import { useState } from 'react'
import {
  ChevronRight,
  Settings2,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect, PanelToggle, PanelMultiSelect } from '@/components/ui/panel-controls'
import { ASPECT_RATIO_OPTIONS } from './constants'
import type { OrchestratorSettings, OrchestratorAspectRatio } from '@/types/orchestrator'
import { useLearningStore } from '@/stores/useLearningStore'
import { useCharacterIdentityStore } from '@/stores/useCharacterIdentityStore'

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
  // Library data
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

  // Build aspect ratio options for PanelSelect
  const aspectOptions = ASPECT_RATIO_OPTIONS.map((opt) => ({
    value: opt.value,
    label: `${opt.icon} ${opt.label}`,
  }))

  // Build character options for PanelMultiSelect
  const characterOptions = savedCharacters.map((c) => ({
    value: c.id,
    label: c.name,
    image: c.referenceImage ?? undefined,
  }))

  // Build 3D character options for PanelMultiSelect
  const character3DOptions = saved3DCharacters.map((c) => ({
    value: c.id,
    label: c.name,
    image: c.thumbnailDataUrl ?? undefined,
  }))

  // Filter marketplace items by category
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

  // Build character identity options
  const identities = useCharacterIdentityStore((s) => s.identities)
  const identityOptions = identities.map((i) => ({
    value: i.id,
    label: i.name,
    image: i.thumbnailUrl ?? undefined,
  }))

  // Check if any library items exist
  const hasLibraryItems =
    htmlTemplateOptions.length > 0 ||
    captionOptions.length > 0 ||
    collageOptions.length > 0 ||
    aiAnimationOptions.length > 0 ||
    animationOptions.length > 0 ||
    audioOptions.length > 0

  return (
    <div className="bg-[#2a2a2a] rounded-lg overflow-hidden">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#3a3a3a] transition-colors"
      >
        <Settings2 size={14} className="text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Settings</span>
        <ChevronRight
          size={12}
          className={cn(
            'ml-auto text-gray-500 transition-transform duration-200',
            showSettings && 'rotate-90',
          )}
        />
      </button>

      {showSettings && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5">
          {/* ── Canvas & Characters ── */}
          <div className="pt-3">
            <PanelSelect
              label="Aspect Ratio"
              value={settings.aspectRatio}
              onChange={(v) => updateSettings({ aspectRatio: v as OrchestratorAspectRatio })}
              options={aspectOptions}
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
          </div>

          {/* ── Generation Toggles ── */}
          <div className="border-t border-white/5 pt-3">
            <span className="text-gray-500 text-xs uppercase tracking-wider mb-2 block">
              Generation
            </span>
            <PanelToggle
              label="Google Search"
              description="Latest info"
              checked={settings.useGoogleSearch}
              onChange={(v) => updateSettings({ useGoogleSearch: v })}
            />
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
              description="Pixabay images & video"
              checked={settings.useStockMedia}
              onChange={(v) => updateSettings({ useStockMedia: v })}
            />
            <PanelToggle
              label="Sound Effects"
              description="AI-generated SFX"
              checked={settings.useSoundEffects}
              onChange={(v) => updateSettings({ useSoundEffects: v })}
            />
            <PanelToggle
              label="Auto Camera"
              description="Dialogue-driven zoom/pan"
              checked={settings.useAutoCamera ?? true}
              onChange={(v) => updateSettings({ useAutoCamera: v })}
            />
          </div>

          {/* ── Smart Defaults (Learning) ── */}
          <div className="border-t border-white/5 pt-3">
            <span className="text-gray-500 text-xs uppercase tracking-wider mb-2 block">
              Intelligence
            </span>
            <PanelToggle
              label="Smart Defaults"
              description="Learn from performance"
              checked={settings.useSmartDefaults}
              onChange={(v) => updateSettings({ useSmartDefaults: v })}
            />
            {settings.useSmartDefaults && <SmartDefaultsPreview />}
          </div>

          {/* ── Library Items ── */}
          {hasLibraryItems && (
            <div className="border-t border-white/5 pt-3">
              <span className="text-gray-500 text-xs uppercase tracking-wider mb-2 block">
                Library
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

          {/* ── A/B Variants & Canvas Items ── */}
          <div className="border-t border-white/5 pt-3">
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
