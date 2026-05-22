/**
 * Shared constants and pre-read store context for composition sub-modules.
 *
 * Uses the actual store/model types instead of inline re-definitions
 * to avoid type cast issues and keep everything in sync.
 */

import type { VisemeEvent, WordEvent, GeneratedVoice } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { Character3D, Saved3DCharacter, Animation3D } from '@/types/character3d'
import type { DialogueCharacter, DialogueLine } from '@/stores/useMultiCharacterStore'
import type { SavedCharacter } from '@/stores/useSavedCharactersStore'
import type { ActiveAnimation, AnimationItem } from '@/stores/useAnimationStore'
import type { CanvasVideo } from '@/stores/useVideoLayerStore'
import type { CanvasMediaItem, MediaAsset } from '@/stores/useMediaStore'
import type { TextOverlay } from '@/stores/useTextOverlayStore'
import type { CanvasHTMLTemplate } from '@/stores/useHTMLTemplateLayerStore'
import type { ArtCurveComposition } from '@/types/artCurves'

export const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

export const fontWeightMap: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
}

/**
 * Pre-read store data passed into each sub-module builder so we only call
 * `.getState()` once in the barrel file.
 */
export interface CompositionContext {
  // Editor / timeline
  aspectRatio: string
  fps: number
  totalFrames: number

  // Character config (2D)
  savedImages: Record<string, string[]>
  visemeMapping: Record<string, number | null>
  useCurvedVisemes: boolean
  curvedVisemes: Record<string, string | null>

  // Character parts
  transforms: Record<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>
  selectedSprites: Record<string, number | null>

  // Voice state
  activeVoiceId: string | null
  generatedVoices: GeneratedVoice[]
  visemeTimeline: VisemeEvent[]
  emotionTimeline: EmotionEvent[]
  wordTimeline: WordEvent[]
  sentenceTimeline: Array<{ sentence: string; startFrame: number; endFrame: number; words: WordEvent[] }>
  captionStyle: import('@/types/voice').CaptionStyle
  captionFontSize: number
  captionPosition: 'top' | 'center' | 'bottom'
  captionPresetId: string

  // Animations
  activeAnimations: ActiveAnimation[]
  libraryMap: Map<string, AnimationItem>

  // Video layers
  canvasVideos: CanvasVideo[]

  // Media
  mediaCanvasItems: CanvasMediaItem[]
  mediaAssetMap: Map<string, MediaAsset>

  // Text overlays
  textOverlays: TextOverlay[]

  // Keyframes
  keyframeTracks: Array<{
    objectRef: { objectType: string; objectId: string }
    property: string
    keyframes: Array<{
      frame: number
      value: number
      easing: string
      bezierParams?: { x1: number; y1: number; x2: number; y2: number }
    }>
  }>

  // Shapes
  shapes: Array<{
    id: string
    type: 'rectangle' | 'circle' | 'triangle' | 'star'
    name: string
    position: { x: number; y: number }
    width: number
    height: number
    rotation: number
    fill: string
    stroke: string
    strokeWidth: number
    opacity: number
    zIndex: number
    visible: boolean
    startFrame: number
    endFrame: number
    borderRadius?: number
    points?: number
    innerRadius?: number
  }>

  // Art curves
  artCurves: ArtCurveComposition[]

  // HTML templates
  htmlTemplates: CanvasHTMLTemplate[]

  // Multi-character dialogue
  dialogueCharacters: DialogueCharacter[]
  dialogueLines: DialogueLine[]
  savedCharacterMap: Map<string, SavedCharacter>
  generatedVoiceMap: Map<string, GeneratedVoice>

  // 3D characters
  chars3D: Character3D[]
  saved3DCharacters: Saved3DCharacter[]
  saved3DBlobUrls: Record<string, string>
  anims3D: Animation3D[]
  anim3DBlobUrls: Record<string, string>
}
