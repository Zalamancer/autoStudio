/**
 * RightPanel — thin router that delegates to sub-panel components.
 *
 * Each sub-panel lives in its own file with isolated store subscriptions,
 * so re-renders are scoped to the active panel only.
 */
import { lazy, Suspense, useState, useEffect, useCallback, memo } from 'react'
import { Trash2, ChevronLeft, ChevronRight, Wand2, BarChart3 } from 'lucide-react'
import { PanelErrorBoundary } from '@/components/PanelErrorBoundary'
import { useEditorStore } from '@/stores'
import { useCharacterConfigStore } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useNB2Store } from '@/stores/useNB2Store'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { useSpriteBackgroundRemoval } from '@/hooks/useSpriteBackgroundRemoval'
import { isRecraftAvailable } from '@/services/recraft'
import type { NB2PartType } from '@/types/nanoBanana2'
import type { RightPanelTab } from '@/types'
import type { CharacterPartTab } from '@/stores/useCharacterConfigStore'
import type { AssetDetailInfo } from '@/components/panels/SavedImagesGrid'
import { cn } from '@/lib/utils'

// Section headers
import {
  NB2GenerationHeader,
  CharacterSectionHeader,
  TextSectionHeader,
  PixelArtSectionHeader,
  AvatarSectionHeader,
  GenSectionHeader,
  TemplateSectionHeader,
  MediaSectionHeader,
  BackgroundSectionHeader,
  CameraSectionHeader,
  CrowdSectionHeader,
  BrandKitSectionHeader,
  AIDirectorToolSectionHeader,
  RigEditorRightPanel,
} from './SectionHeaders'

// Shared constants
import {
  ASSET_SECTION_TABS,
  ASSET_GRID_ITEMS,
  CHARACTER_TABS,
  TEXT_TABS,
  PIXELART_TABS,
  AVATAR_TABS,
  GEN_TABS,
  TEMPLATE_TABS,
  MEDIA_TABS,
  BG_BG_TABS,
  BG_ALL_TABS,
  AI_DIRECTOR_TOOL_TABS,
  CONTEXT_INFO,
  TAB_TO_NB2_PART,
  type CameraSubTab,
  type BrandKitSubTab,
  type MediaSubTab,
} from './rightPanelConstants'

// Small sub-panels kept as eager imports (< 120 lines each)
import { SpriteRemoveBgButton } from './SpriteRemoveBgButton'
import { SpriteVectorizeButton } from './SpriteVectorizeButton'
import { ImageUploadArea } from '@/components/panels/ImageUploadArea'
import { SavedImagesGrid } from '@/components/panels/SavedImagesGrid'
import { CopilotDrawer } from '@/components/copilot/CopilotDrawer'

// All sub-panels lazy-loaded for code splitting
const GroupTransformPanel = lazy(() =>
  import('./GroupTransformPanel').then((m) => ({ default: m.GroupTransformPanel })),
)
const StylePanel = lazy(() => import('./StylePanel').then((m) => ({ default: m.StylePanel })))
const AnimationsPanel = lazy(() => import('./AnimationsPanel').then((m) => ({ default: m.AnimationsPanel })))
const NB2PromptEditor = lazy(() => import('./NB2PromptEditor').then((m) => ({ default: m.NB2PromptEditor })))
const CameraPropertiesPanel = lazy(() =>
  import('./CameraPropertiesPanel').then((m) => ({ default: m.CameraPropertiesPanel })),
)
const CrowdPropertiesPanel = lazy(() =>
  import('./CrowdPropertiesPanel').then((m) => ({ default: m.CrowdPropertiesPanel })),
)
const MotionStyleBrowser = lazy(() => import('./MotionStyleBrowser').then((m) => ({ default: m.MotionStyleBrowser })))
const GenerateTab = lazy(() => import('@/components/panels/GenerateTab').then((m) => ({ default: m.GenerateTab })))

const MOTION_DESIGN_TABS = [
  { id: 'generate' as const, label: 'Generate', icon: Wand2 },
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
]

/** Right panel for Motion Designs — chevron nav between Generate and Analytics */
function MotionDesignRightPanel() {
  const [activeTab, setActiveTab] = useState<'generate' | 'analytics'>('generate')

  const currentIndex = MOTION_DESIGN_TABS.findIndex((t) => t.id === activeTab)
  const goPrev = () => {
    const prev = currentIndex <= 0 ? MOTION_DESIGN_TABS.length - 1 : currentIndex - 1
    setActiveTab(MOTION_DESIGN_TABS[prev].id)
  }
  const goNext = () => {
    const next = currentIndex >= MOTION_DESIGN_TABS.length - 1 ? 0 : currentIndex + 1
    setActiveTab(MOTION_DESIGN_TABS[next].id)
  }

  const current = MOTION_DESIGN_TABS[currentIndex]
  const CurrentIcon = current.icon

  return (
    <>
      {/* Chevron header */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        <button
          onClick={goPrev}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium text-zinc-200">
          <CurrentIcon size={14} className="text-zinc-400" />
          <span>{current.label}</span>
        </div>
        <button
          onClick={goNext}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PanelErrorBoundary panelName={current.label}>
          <Suspense fallback={null}>
            {activeTab === 'generate' && <GenerateTab />}
            {activeTab === 'analytics' && <MotionStyleBrowser />}
          </Suspense>
        </PanelErrorBoundary>
      </div>
    </>
  )
}

const AIDirectorSettingsPanel = lazy(() =>
  import('@/components/panels/orchestrator/AIDirectorSettingsPanel').then((m) => ({
    default: m.AIDirectorSettingsPanel,
  })),
)
const AIDirectorURLPanel = lazy(() => import('./AIDirectorURLPanel').then((m) => ({ default: m.AIDirectorURLPanel })))
const AIDirectorBrandPanel = lazy(() =>
  import('./AIDirectorBrandPanel').then((m) => ({ default: m.AIDirectorBrandPanel })),
)
const AIDirectorDocumentPanel = lazy(() =>
  import('./AIDirectorDocumentPanel').then((m) => ({ default: m.AIDirectorDocumentPanel })),
)
const BrandKitPropertiesPanel = lazy(() =>
  import('./BrandKitPropertiesPanel').then((m) => ({ default: m.BrandKitPropertiesPanel })),
)
const VideoPropertiesPanel = lazy(() =>
  import('./VideoPropertiesPanel').then((m) => ({ default: m.VideoPropertiesPanel })),
)
const PixelArtCharacterPropertiesPanel = lazy(() =>
  import('./PixelArtCharacterPropertiesPanel').then((m) => ({ default: m.PixelArtCharacterPropertiesPanel })),
)
const PixelArtAnimationsPanel = lazy(() =>
  import('./PixelArtCharacterPropertiesPanel').then((m) => ({ default: m.PixelArtAnimationsPanel })),
)
const AvatarCharacterPropertiesPanel = lazy(() =>
  import('./AvatarCharacterPropertiesPanel').then((m) => ({ default: m.AvatarCharacterPropertiesPanel })),
)
const AvatarVideosPanel = lazy(() =>
  import('./AvatarCharacterPropertiesPanel').then((m) => ({ default: m.AvatarVideosPanel })),
)
const MotionGraphicPropertiesPanel = lazy(() =>
  import('./MotionGraphicPropertiesPanel').then((m) => ({ default: m.MotionGraphicPropertiesPanel })),
)
const WhiteboardTextPropertiesPanel = lazy(() =>
  import('./WhiteboardTextPropertiesPanel').then((m) => ({ default: m.WhiteboardTextPropertiesPanel })),
)
const WhiteboardDrawingPropertiesPanel = lazy(() =>
  import('./WhiteboardDrawingPropertiesPanel').then((m) => ({ default: m.WhiteboardDrawingPropertiesPanel })),
)
const WhiteboardStrokePropertiesPanel = lazy(() =>
  import('./WhiteboardStrokePropertiesPanel').then((m) => ({ default: m.WhiteboardStrokePropertiesPanel })),
)
const LayersPanel = lazy(() => import('@/components/panels/LayersPanel').then((m) => ({ default: m.LayersPanel })))
const VoicesPanel = lazy(() => import('@/components/panels/VoicesPanel').then((m) => ({ default: m.VoicesPanel })))
const AssetDetailsPanel = lazy(() =>
  import('@/components/panels/AssetDetailsPanel').then((m) => ({ default: m.AssetDetailsPanel })),
)
const Rig3DPropertiesPanel = lazy(() =>
  import('@/components/panels/Rig3DPropertiesPanel').then((m) => ({ default: m.Rig3DPropertiesPanel })),
)
const MediaPropertiesPanel = lazy(() =>
  import('./MediaPropertiesPanel').then((m) => ({ default: m.MediaPropertiesPanel })),
)
const SVGObjectPropertiesPanel = lazy(() =>
  import('./SVGObjectPropertiesPanel').then((m) => ({ default: m.SVGObjectPropertiesPanel })),
)
const ShapePropertiesPanel = lazy(() =>
  import('./ShapePropertiesPanel').then((m) => ({ default: m.ShapePropertiesPanel })),
)
const TextPropertiesPanel = lazy(() =>
  import('./TextPropertiesPanel').then((m) => ({ default: m.TextPropertiesPanel })),
)
const AnimationPropertiesPanel = lazy(() =>
  import('./AnimationPropertiesPanel').then((m) => ({ default: m.AnimationPropertiesPanel })),
)
const HTMLTemplatePropertiesPanel = lazy(() =>
  import('./HTMLTemplatePropertiesPanel').then((m) => ({ default: m.HTMLTemplatePropertiesPanel })),
)
const Character3DPropertiesPanel = lazy(() =>
  import('./Character3DPropertiesPanel').then((m) => ({ default: m.Character3DPropertiesPanel })),
)
const BundleDetailsPanel = lazy(() => import('./BundleDetailsPanel').then((m) => ({ default: m.BundleDetailsPanel })))
const ArtCurvePropertiesPanel = lazy(() =>
  import('./ArtCurvePropertiesPanel').then((m) => ({ default: m.ArtCurvePropertiesPanel })),
)
const TextStylePresetsPanel = lazy(() =>
  import('./TextStylePresetsPanel').then((m) => ({ default: m.TextStylePresetsPanel })),
)
const TextAnimationsPanel = lazy(() =>
  import('./TextAnimationsPanel').then((m) => ({ default: m.TextAnimationsPanel })),
)
const WhiteboardBackgroundPropertiesPanel = lazy(() =>
  import('./WhiteboardBackgroundPropertiesPanel').then((m) => ({ default: m.WhiteboardBackgroundPropertiesPanel })),
)
const GenPropertiesPanels = lazy(() => import('./GenPropertiesPanels'))
const BeatSyncSection = lazy(() => import('./BeatSyncSection').then((m) => ({ default: m.BeatSyncSection })))

// Fallback for lazy panels
function PanelFallback() {
  return <div className="p-4 text-center text-zinc-600 text-xs">Loading...</div>
}

// ---------------------------------------------------------------------------
// Sprite Tab — self-contained, subscribes to its own stores
// ---------------------------------------------------------------------------

const SpriteTab = memo(function SpriteTab({
  tab,
  label,
  pluralLabel,
  nb2PartType,
  handleAssetDetailOpen,
  openAssetDetailIndex,
}: {
  tab: CharacterPartTab
  label: string
  pluralLabel: string
  nb2PartType: NB2PartType | null
  handleAssetDetailOpen: (info: AssetDetailInfo) => void
  openAssetDetailIndex: number | null
}) {
  // Own store subscriptions -- isolated from RightPanel re-renders
  const savedImages = useCharacterConfigStore((s) => s.savedImages[tab] ?? [])
  const clearSavedImages = useCharacterConfigStore((s) => s.clearSavedImages)
  const useCurvedVisemes = useCharacterConfigStore((s) => s.useCurvedVisemes)

  const nb2RegeneratingStep = useNB2Store((s) => s.regeneratingStep)
  const nb2Prompt = useNB2Store((s) => s.prompt)
  const nb2Regenerate = useNB2Store((s) => s.regenerateStep)
  const nb2HasResult = useNB2Store((s) => s.result !== null)

  const {
    isProcessing: isSprBgRemoving,
    currentIndex: sprBgIndex,
    totalCount: sprBgTotal,
    error: sprBgError,
    removeAllBackgrounds: sprRemoveAllBgs,
  } = useSpriteBackgroundRemoval()

  const [recraftReady, setRecraftReady] = useState(false)
  useEffect(() => {
    isRecraftAvailable().then(setRecraftReady)
  }, [])

  const handleNB2Regenerate = useCallback(() => {
    if (nb2PartType && nb2HasResult && nb2Prompt.trim()) nb2Regenerate(nb2PartType)
  }, [nb2PartType, nb2HasResult, nb2Prompt, nb2Regenerate])

  const handleClearAll = useCallback(() => {
    clearSavedImages(tab)
    if (tab === 'viseme' && useCurvedVisemes) {
      useCharacterConfigStore.getState().clearCurvedVisemes()
    }
  }, [tab, clearSavedImages, useCurvedVisemes])

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-300">{label} Sprites</h4>
        {savedImages.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
            title={`Delete all ${label.toLowerCase()} sprites`}
          >
            <Trash2 size={12} />
            Clear All
          </button>
        )}
      </div>
      <ImageUploadArea
        tab={tab}
        label={`${label} Image`}
        onRegenerate={nb2HasResult ? handleNB2Regenerate : undefined}
        isRegenerating={nb2RegeneratingStep === nb2PartType}
      />
      <SavedImagesGrid
        tab={tab}
        label={pluralLabel}
        onAssetDetailOpen={handleAssetDetailOpen}
        openDetailIndex={openAssetDetailIndex}
      />
      {savedImages.length > 0 && (
        <SpriteRemoveBgButton
          tab={tab}
          count={savedImages.length}
          isProcessing={isSprBgRemoving}
          currentIndex={sprBgIndex}
          totalCount={sprBgTotal}
          error={sprBgError}
          onRemove={sprRemoveAllBgs}
          recraftAvailable={recraftReady}
        />
      )}
      {savedImages.length > 0 && <SpriteVectorizeButton tab={tab} count={savedImages.length} />}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Assets Grid — 3×3 grid of character part boxes
// ---------------------------------------------------------------------------

const CharacterAssetsGrid = memo(function CharacterAssetsGrid({
  activeTab,
  onSelect,
}: {
  activeTab: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="w-full aspect-square bg-[#1a1a1a] rounded-lg p-2 grid grid-cols-3 gap-2">
      {ASSET_GRID_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1.5 rounded-lg transition-colors',
              isActive
                ? 'bg-accent/20 text-accent ring-1 ring-accent/30'
                : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200',
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BEAT_SYNC_TABS = new Set([
  'media-properties',
  'text-properties',
  'text-styles',
  'text-animations',
  'shape-properties',
  'svg-object-properties',
  'animation-properties',
  'html-template-properties',
  '3d-character-properties',
  'pixelart-character-properties',
  'avatar-character-properties',
  'avatar-videos',
  'avatar-voices',
  'video-properties',
])

const SPRITE_TABS: { tab: CharacterPartTab; label: string; plural: string; nb2Part: NB2PartType | null }[] = [
  { tab: 'eye', label: 'Eye', plural: 'Eyes', nb2Part: 'eye-strip' },
  { tab: 'eyebrow', label: 'Eyebrow', plural: 'Eyebrows', nb2Part: 'eyebrow-strip' },
  { tab: 'viseme', label: 'Viseme', plural: 'Visemes', nb2Part: 'viseme-sheet' },
  { tab: 'hair', label: 'Hair', plural: 'Hair Styles', nb2Part: 'hair' },
  { tab: 'head', label: 'Head', plural: 'Heads', nb2Part: 'head' },
  { tab: 'body', label: 'Body', plural: 'Bodies', nb2Part: 'body' },
  { tab: 'shirt', label: 'Shirt', plural: 'Shirts', nb2Part: 'clothing' },
  { tab: 'pants', label: 'Pants', plural: 'Pants', nb2Part: 'clothing' },
  { tab: 'shoes', label: 'Shoes', plural: 'Shoes', nb2Part: 'clothing' },
]

// ---------------------------------------------------------------------------
// Main RightPanel — thin router
// ---------------------------------------------------------------------------

export type { BoneCategoryId } from './rightPanelConstants'

export function RightPanel() {
  const copilotIsOpen = useCopilotStore((s) => s.isOpen)
  const activeCanvasOverlay = useEditorStore((s) => s.activeCanvasOverlay)
  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const [openAssetDetail, setOpenAssetDetail] = useState<AssetDetailInfo | null>(null)
  const [cameraSubTab, setCameraSubTab] = useState<CameraSubTab>('transform')
  const [brandKitSubTab, setBrandKitSubTab] = useState<BrandKitSubTab>('all')
  const [mediaSubTab, setMediaSubTab] = useState<MediaSubTab>('all')

  // Sync NB2 prompt editor to current right-panel tab
  useEffect(() => {
    if (activeCanvasOverlay !== 'character-generator') return
    const partType = TAB_TO_NB2_PART[rightPanelTab]
    if (partType) useNB2Store.getState().setEditingPromptStep(partType)
    else useNB2Store.getState().setEditingPromptStep(null)
  }, [activeCanvasOverlay, rightPanelTab])

  useEffect(() => {
    if (activeCanvasOverlay === 'character-generator') useSavedCharactersStore.getState().selectCharacter(null)
  }, [activeCanvasOverlay])

  // Asset detail handlers
  const handleAssetDetailOpen = useCallback((info: AssetDetailInfo) => {
    setOpenAssetDetail((prev) => (prev?.tab === info.tab && prev?.index === info.index ? null : info))
  }, [])
  const handleAssetDetailClose = useCallback(() => setOpenAssetDetail(null), [])

  const handleLabelChange = useCallback(
    (newLabel: string) => {
      if (!openAssetDetail) return
      useCharacterConfigStore.getState().setSpriteLabel(openAssetDetail.tab, openAssetDetail.index, newLabel)
      setOpenAssetDetail({ ...openAssetDetail, label: newLabel })
      const configLabels = useCharacterConfigStore.getState().spriteLabels
      const { activeCharacterId, characters: dialogueChars } = useMultiCharacterStore.getState()
      const savedCharId = activeCharacterId
        ? dialogueChars.find((c) => c.id === activeCharacterId)?.savedCharacterId
        : useSavedCharactersStore.getState().selectedCharacterId
      if (savedCharId) useSavedCharactersStore.getState().updateCharacter(savedCharId, { spriteLabels: configLabels })
    },
    [openAssetDetail],
  )

  const handleSpriteImageChange = useCallback(
    (newImage: string) => {
      if (!openAssetDetail) return
      const { tab: assetTab, index: assetIndex } = openAssetDetail
      const currentImages = useCharacterConfigStore.getState().savedImages[assetTab]
      if (assetIndex < 0 || assetIndex >= currentImages.length) return
      const updated = [...currentImages]
      updated[assetIndex] = newImage
      useCharacterConfigStore.getState().setSavedImages(assetTab, updated)
      setOpenAssetDetail({ ...openAssetDetail, image: newImage })
    },
    [openAssetDetail],
  )

  // Rig editor overrides
  const isRigEditor = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor')
  const isRigEditor3D = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor-3d')

  if (isRigEditor)
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <PanelErrorBoundary panelName="Rig Properties">
          <RigEditorRightPanel />
        </PanelErrorBoundary>
      </aside>
    )
  if (isRigEditor3D)
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden overflow-y-auto">
        <PanelErrorBoundary panelName="3D Rig Properties">
          <Rig3DPropertiesPanel />
        </PanelErrorBoundary>
      </aside>
    )
  if (copilotIsOpen)
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <PanelErrorBoundary panelName="Copilot">
          <CopilotDrawer />
        </PanelErrorBoundary>
      </aside>
    )
  if (rightPanelTab === 'ai-director-settings')
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <PanelErrorBoundary panelName="AI Director Settings">
          <Suspense fallback={<div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>}>
            <AIDirectorSettingsPanel />
          </Suspense>
        </PanelErrorBoundary>
      </aside>
    )
  if (rightPanelTab === 'motion-gallery-styles')
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <MotionDesignRightPanel />
      </aside>
    )
  if (rightPanelTab === 'bundle-details')
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <PanelErrorBoundary panelName="Bundle Details">
          <Suspense fallback={<div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>}>
            <BundleDetailsPanel />
          </Suspense>
        </PanelErrorBoundary>
      </aside>
    )

  const isCharacterContext = CHARACTER_TABS.has(rightPanelTab)
  const isNB2Generating = activeCanvasOverlay === 'character-generator' && isCharacterContext
  const isTextContext = TEXT_TABS.has(rightPanelTab)
  const isPixelArtContext = PIXELART_TABS.has(rightPanelTab)
  const isAvatarContext = AVATAR_TABS.has(rightPanelTab)
  const isBgContext = BG_ALL_TABS.has(rightPanelTab)
  const isGenContext = GEN_TABS.has(rightPanelTab)
  const isTemplateContext = TEMPLATE_TABS.has(rightPanelTab)
  const isMediaContext = MEDIA_TABS.has(rightPanelTab)
  const isAIDirectorToolContext = AI_DIRECTOR_TOOL_TABS.has(rightPanelTab)
  const contextInfo = CONTEXT_INFO[rightPanelTab]

  return (
    <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Context Header */}
      <div className="border-b border-white/5">
        {isNB2Generating ? (
          <NB2GenerationHeader />
        ) : isCharacterContext ? (
          <CharacterSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : isTextContext ? (
          <TextSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : isPixelArtContext ? (
          <PixelArtSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : isAvatarContext ? (
          <AvatarSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : isBgContext ? (
          <BackgroundSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : rightPanelTab === 'brand-kit-properties' ? (
          <BrandKitSectionHeader activeSubTab={brandKitSubTab} setActiveSubTab={setBrandKitSubTab} />
        ) : isGenContext ? (
          <GenSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : isTemplateContext ? (
          <TemplateSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : rightPanelTab === 'camera-properties' ? (
          <CameraSectionHeader activeSubTab={cameraSubTab} setActiveSubTab={setCameraSubTab} />
        ) : isMediaContext ? (
          <MediaSectionHeader
            rightPanelTab={rightPanelTab}
            setRightPanelTab={setRightPanelTab}
            activeSubTab={mediaSubTab}
            setActiveSubTab={setMediaSubTab}
          />
        ) : rightPanelTab === 'crowd-properties' ? (
          <CrowdSectionHeader />
        ) : isAIDirectorToolContext ? (
          <AIDirectorToolSectionHeader rightPanelTab={rightPanelTab} setRightPanelTab={setRightPanelTab} />
        ) : (
          <div className="flex items-center gap-2 px-3 py-2">
            {contextInfo && (
              <>
                <contextInfo.icon size={14} className={cn('shrink-0', contextInfo.color)} />
                <span className={cn('text-[13px] font-medium', contextInfo.color)}>{contextInfo.label}</span>
                <span className="text-[10px] text-zinc-600">Properties</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={<PanelFallback />}>
          {isNB2Generating ? (
            <NB2PromptEditor />
          ) : (
            <PanelErrorBoundary key={rightPanelTab} panelName={rightPanelTab}>
              {rightPanelTab === 'group-properties' && <GroupTransformPanel />}

              {/* Assets Grid — visible for grid view + individual sprite tabs */}
              {ASSET_SECTION_TABS.has(rightPanelTab) && (
                <div className="px-3 pt-3">
                  <CharacterAssetsGrid
                    activeTab={rightPanelTab}
                    onSelect={(id) => setRightPanelTab(id as RightPanelTab)}
                  />
                </div>
              )}

              {/* Sprite Tab Content — shown when a specific asset box is clicked */}
              {SPRITE_TABS.map((cfg) =>
                rightPanelTab === cfg.tab ? (
                  <SpriteTab
                    key={cfg.tab}
                    tab={cfg.tab}
                    label={cfg.label}
                    pluralLabel={cfg.plural}
                    nb2PartType={cfg.nb2Part}
                    handleAssetDetailOpen={handleAssetDetailOpen}
                    openAssetDetailIndex={openAssetDetail?.tab === cfg.tab ? openAssetDetail.index : null}
                  />
                ) : null,
              )}

              {rightPanelTab === 'voices' && <VoicesPanel />}
              {rightPanelTab === 'animations' && <AnimationsPanel />}
              {rightPanelTab === 'style-properties' && <StylePanel />}
              {rightPanelTab === 'media-properties' && <MediaPropertiesPanel activeTab={mediaSubTab} />}
              {rightPanelTab === 'svg-object-properties' && <SVGObjectPropertiesPanel />}
              {rightPanelTab === 'whiteboard-text-properties' && <WhiteboardTextPropertiesPanel />}
              {rightPanelTab === 'whiteboard-drawing-properties' && <WhiteboardDrawingPropertiesPanel />}
              {rightPanelTab === 'whiteboard-stroke-properties' && <WhiteboardStrokePropertiesPanel />}
              {rightPanelTab === 'shape-properties' && <ShapePropertiesPanel />}
              {rightPanelTab === 'text-properties' && <TextPropertiesPanel />}
              {rightPanelTab === 'text-styles' && <TextStylePresetsPanel />}
              {rightPanelTab === 'text-animations' && <TextAnimationsPanel />}
              {rightPanelTab === 'animation-properties' && <AnimationPropertiesPanel />}
              {rightPanelTab === 'html-template-properties' && <HTMLTemplatePropertiesPanel />}
              {rightPanelTab === 'motion-graphic-properties' && <MotionGraphicPropertiesPanel />}
              {rightPanelTab === '3d-character-properties' && <Character3DPropertiesPanel />}
              {rightPanelTab === 'avatar-character-properties' && <AvatarCharacterPropertiesPanel />}
              {rightPanelTab === 'avatar-videos' && <AvatarVideosPanel />}
              {rightPanelTab === 'avatar-voices' && <VoicesPanel />}
              {rightPanelTab === 'pixelart-character-properties' && <PixelArtCharacterPropertiesPanel />}
              {rightPanelTab === 'pixelart-animations' && <PixelArtAnimationsPanel />}
              {rightPanelTab === 'art-curve-properties' && <ArtCurvePropertiesPanel />}
              {rightPanelTab === 'video-properties' && <VideoPropertiesPanel />}
              {rightPanelTab === 'camera-properties' && <CameraPropertiesPanel activeTab={cameraSubTab} />}
              {BG_BG_TABS.has(rightPanelTab) && <WhiteboardBackgroundPropertiesPanel />}
              {isGenContext && <GenPropertiesPanels tab={rightPanelTab} />}
              {rightPanelTab === 'crowd-properties' && <CrowdPropertiesPanel />}
              {rightPanelTab === 'canvas-layers' && <LayersPanel />}
              {rightPanelTab === 'brand-kit-properties' && <BrandKitPropertiesPanel activeTab={brandKitSubTab} />}

              {/* AI Director Tool Panels */}
              {rightPanelTab === 'ai-director-url' && <AIDirectorURLPanel />}
              {rightPanelTab === 'ai-director-document' && <AIDirectorDocumentPanel />}
              {rightPanelTab === 'ai-director-brand' && <AIDirectorBrandPanel />}

              {/* Beat Sync Section */}
              {BEAT_SYNC_TABS.has(rightPanelTab) && <BeatSyncSection />}
            </PanelErrorBoundary>
          )}
        </Suspense>
      </div>

      {/* Asset Details Floating Panel */}
      {openAssetDetail && (
        <AssetDetailsPanel
          image={openAssetDetail.image}
          label={openAssetDetail.label}
          index={openAssetDetail.index}
          tab={openAssetDetail.tab}
          onLabelChange={handleLabelChange}
          onImageChange={handleSpriteImageChange}
          onClose={handleAssetDetailClose}
          anchorY={openAssetDetail.anchorY}
        />
      )}
    </aside>
  )
}
