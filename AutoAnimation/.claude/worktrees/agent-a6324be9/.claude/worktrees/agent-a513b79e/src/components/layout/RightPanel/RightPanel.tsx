/**
 * RightPanel — thin router that delegates to sub-panel components.
 *
 * Each sub-panel lives in its own file with isolated store subscriptions,
 * so re-renders are scoped to the active panel only.
 */
import { lazy, Suspense, useState, useEffect, useCallback, memo } from 'react'
import { Trash2 } from 'lucide-react'
import { PanelErrorBoundary } from '@/components/PanelErrorBoundary'
import { TabNavigation } from '@/components/ui'
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
  BackgroundSectionHeader,
  CameraSectionHeader,
  CrowdSectionHeader,
  BrandKitSectionHeader,
  RigEditorRightPanel,
} from './SectionHeaders'

// Shared constants
import {
  CHARACTER_SECTION_TABS,
  CHARACTER_TABS,
  characterBottomTabs,
  TEXT_TABS,
  PIXELART_TABS,
  AVATAR_TABS,
  GEN_TABS,
  TEMPLATE_TABS,
  BG_BG_TABS,
  BG_ALL_TABS,
  CONTEXT_INFO,
  TAB_TO_NB2_PART,
  type CameraSubTab,
  type BrandKitSubTab,
} from './rightPanelConstants'

// Sub-panels — already in separate files
import { SpriteRemoveBgButton } from './SpriteRemoveBgButton'
import { SpriteVectorizeButton } from './SpriteVectorizeButton'
import { GroupTransformPanel } from './GroupTransformPanel'
import { StylePanel } from './StylePanel'
import { AnimationsPanel } from './AnimationsPanel'
import { NB2PromptEditor } from './NB2PromptEditor'
import { CameraPropertiesPanel } from './CameraPropertiesPanel'
import { CrowdPropertiesPanel } from './CrowdPropertiesPanel'
import { MotionStyleBrowser } from './MotionStyleBrowser'
import { BrandKitPropertiesPanel } from './BrandKitPropertiesPanel'
import { VideoPropertiesPanel } from './VideoPropertiesPanel'
import { PixelArtCharacterPropertiesPanel, PixelArtAnimationsPanel } from './PixelArtCharacterPropertiesPanel'
import { AvatarCharacterPropertiesPanel, AvatarVideosPanel } from './AvatarCharacterPropertiesPanel'
import { MotionGraphicPropertiesPanel } from './MotionGraphicPropertiesPanel'
import { WhiteboardTextPropertiesPanel } from './WhiteboardTextPropertiesPanel'
import { WhiteboardDrawingPropertiesPanel } from './WhiteboardDrawingPropertiesPanel'
import { WhiteboardStrokePropertiesPanel } from './WhiteboardStrokePropertiesPanel'
import { LayersPanel } from '@/components/panels/LayersPanel'
import { ImageUploadArea, SavedImagesGrid, VoicesPanel } from '@/components/panels'
import { AssetDetailsPanel } from '@/components/panels/AssetDetailsPanel'
import { Rig3DPropertiesPanel } from '@/components/panels/Rig3DPropertiesPanel'
import { CopilotDrawer } from '@/components/copilot/CopilotDrawer'

// Lazy-loaded heavy sub-panels (>200 lines)
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
  tab: string
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
  'motion-graphic-properties',
  '3d-character-properties',
  'pixelart-character-properties',
  'avatar-character-properties',
  'avatar-videos',
  'avatar-voices',
  'video-properties',
])

const SPRITE_TABS: { tab: string; label: string; plural: string; nb2Part: NB2PartType | null }[] = [
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
  if (rightPanelTab === 'motion-gallery-styles')
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <PanelErrorBoundary panelName="Motion Gallery Styles">
          <MotionStyleBrowser />
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
        ) : rightPanelTab === 'crowd-properties' ? (
          <CrowdSectionHeader />
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

              {/* Sprite Tabs */}
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
              {rightPanelTab === 'media-properties' && <MediaPropertiesPanel />}
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

              {/* Beat Sync Section */}
              {BEAT_SYNC_TABS.has(rightPanelTab) && <BeatSyncSection />}
            </PanelErrorBoundary>
          )}
        </Suspense>
      </div>

      {/* Character bottom tabs */}
      {!isNB2Generating && isCharacterContext && CHARACTER_SECTION_TABS.has(rightPanelTab) && (
        <div className="border-t border-white/5 px-3 py-2">
          <TabNavigation
            tabs={characterBottomTabs}
            activeTab={rightPanelTab}
            onTabChange={(id) => setRightPanelTab(id as RightPanelTab)}
            size="sm"
            animated
          />
        </div>
      )}

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
