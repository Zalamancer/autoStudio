/**
 * Stores barrel — only re-exports stores that are actively imported via '@/stores'.
 *
 * Zustand `create()` calls are side-effectful (store instance created at import time),
 * so every re-export here forces that store + all its dependencies into the main chunk.
 * Stores that are never imported via this barrel are intentionally excluded — import
 * them directly from their file instead (e.g. `from '@/stores/useCrowdStore'`).
 *
 * Run `rg "from '@/stores'" src/ | rg <storeName>` to verify barrel usage before
 * adding a store back here.
 */

// ── Core stores (heavily used across the app) ──
export { useEditorStore } from './useEditorStore'
export { useTimelineStore, useTimelineUndo } from './useTimelineStore'
export { useCanvasStore } from './useCanvasStore'
export { usePlaybackStore, timeToFrame, frameToTime, formatTimecode } from './usePlaybackStore'
export {
  useCharacterConfigStore,
  getVisemeSpriteIndex,
  getCurvedVisemeSprite,
  hasCurvedVisemes,
  getEyeVariantSprite,
  getEyebrowVariantSprite,
  hasEyeVariants,
  hasEyebrowVariants,
  hasEmotionHeads,
  type CharacterPartTab,
  type CuttingMode,
} from './useCharacterConfigStore'
export {
  useCharacterPartsStore,
  type CharacterPart,
  type LayerPart,
  type PartTransform,
} from './useCharacterPartsStore'
export { useVoiceStore } from './useVoiceStore'
export { useAnimationStore, type AnimationItem, type ActiveAnimation } from './useAnimationStore'
export { useProjectStore } from './useProjectStore'
export { useMultiCharacterStore, type DialogueCharacter, type DialogueLine } from './useMultiCharacterStore'
export { useAuthStore } from './useAuthStore'
export { useMediaStore, type MediaAsset, type CanvasMediaItem, type MediaCategory } from './useMediaStore'
export {
  useTextOverlayStore,
  type TextOverlay,
  type TextPresetType,
  type FontFamily,
  type FontWeight,
  type TextAlign,
  type TextPosition,
  type VerticalAlign,
  type TextCase,
} from './useTextOverlayStore'
export { useVideoLayerStore, type CanvasVideo } from './useVideoLayerStore'
export { useHTMLTemplateLayerStore, type CanvasHTMLTemplate } from './useHTMLTemplateLayerStore'
export { useKeyframeStore } from './useKeyframeStore'
export { useShapeStore } from './useShapeStore'
export { useSettingsStore, type Resolution, type ExportFormat, type ExportQuality } from './useSettingsStore'

// ── Type-only re-exports (no side effects — safe to keep) ──
export type { MarketplaceItem, MarketplaceCategory } from './useMarketplaceStore'

// ── NOT re-exported (import directly from the store file) ──
// useAIAnimationStore — pulls in aiAnimation service + creditGate
// useSVGObjectStore — used heavily via direct imports
// use3DCharacterStore — used heavily via direct imports
// useOrchestratorStore — pulls in orchestrator service + 9 stores
// useRigStore — 684 lines, 4 service imports
// useSaved3DCharactersStore — 3 service imports
// useSavedAvatarCharactersStore — 3 service imports
// useCrowdStore — service imports
// useMemeStore — service imports
// useMarketplaceStore — service imports (types re-exported above)
// useArtCurveStore, use3DAnimationStore, useLayerTreeStore
// useAvatarCharacterStore, useWardrobeStore, useAnnotationStore
