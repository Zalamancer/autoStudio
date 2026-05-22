import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Layers,
  User,
  Smile,
  Scissors,
  Mic,
  Eye,
  EyeOff,
  Image,
  Trash2,
  RotateCcw,
  Palette,
  Loader2,
  Square,
  Copy,
  Type,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  Minus,
  ArrowDown,
  Eraser,
  Code,
  Plus,
  Box,
  Film,
  Shirt,
  Footprints,
  PersonStanding,
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
  Grid3x3,
  Paintbrush,
  UserCircle,
  LayoutTemplate,
  Camera,
  Users,
  Upload,
  FileVideo,
  Move,
  Aperture,
  LayoutGrid,
  type LucideIcon,
} from 'lucide-react'
import { TabNavigation, type Tab, DraggableNumberInput, ColorPicker } from '@/components/ui'
import { useEditorStore, useCanvasStore, useCharacterConfigStore } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useArtCurveStore } from '@/stores/useArtCurveStore'
import { useManimStore } from '@/stores/useManimStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useHTMLTemplateLayerStore, computeTemplateDimensions } from '@/stores/useHTMLTemplateLayerStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useImageRecolor } from '@/hooks/useImageRecolor'
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval'
import { useSpriteBackgroundRemoval } from '@/hooks/useSpriteBackgroundRemoval'

import { recordPropertyChange } from '@/hooks/usePropertyRecorder'

import { isRecraftAvailable } from '@/services/recraft'
import { SpriteRemoveBgButton } from './SpriteRemoveBgButton'
import { SpriteVectorizeButton } from './SpriteVectorizeButton'
import { GroupTransformPanel } from './GroupTransformPanel'
import { BoilingLineSection } from './BoilingLineSection'
import { PixelArtEffectSection } from './PixelArtEffectSection'
import { StylePanel } from './StylePanel'
import { LayersPanel } from '@/components/panels/LayersPanel'
import { AnimationsPanel } from './AnimationsPanel'
import { NB2PromptEditor } from './NB2PromptEditor'
import { BRPropertiesPanel } from '@bonerigging/editor'
import { Rig3DPropertiesPanel } from '@/components/panels/Rig3DPropertiesPanel'
import { DragField, TransformRow, SENSITIVITIES, type Axis } from '@/components/panels/BonePropertiesEditor'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import type { VisemeFaceMapping, FaceExpressionMapping } from '@/types/character3d'
import { DEFAULT_VISEME_FACE_MAPPING, DEFAULT_FACE_EXPRESSION_MAPPING } from '@/types/character3d'
import { ImageUploadArea, SavedImagesGrid, VoicesPanel } from '@/components/panels'
import { AssetDetailsPanel } from '@/components/panels/AssetDetailsPanel'
import type { AssetDetailInfo } from '@/components/panels/SavedImagesGrid'
import type { RightPanelTab } from '@/types'
import { VideoPropertiesPanel } from './VideoPropertiesPanel'
import { PixelArtCharacterPropertiesPanel, PixelArtAnimationsPanel } from './PixelArtCharacterPropertiesPanel'
import { AvatarCharacterPropertiesPanel, AvatarVideosPanel } from './AvatarCharacterPropertiesPanel'
import { MotionGraphicPropertiesPanel } from './MotionGraphicPropertiesPanel'
import { WhiteboardTextPropertiesPanel } from './WhiteboardTextPropertiesPanel'
import { WhiteboardDrawingPropertiesPanel } from './WhiteboardDrawingPropertiesPanel'
import { WhiteboardStrokePropertiesPanel } from './WhiteboardStrokePropertiesPanel'
import { CameraPropertiesPanel } from './CameraPropertiesPanel'
import { CrowdPropertiesPanel } from './CrowdPropertiesPanel'
import { MotionStyleBrowser } from './MotionStyleBrowser'
import { useCrowdStore } from '@/stores/useCrowdStore'
import { BrandKitPropertiesPanel } from './BrandKitPropertiesPanel'
import { useShallow } from 'zustand/react/shallow'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { createDefaultDraftingConfig, type DraftingConfig } from '@/services/whiteboardAnimation'
import { parseCodeControls, CODE_BACKGROUND_PROMPT } from '@/services/codeBackground'
import { useBrandKitStore } from '@/stores/useBrandKitStore'
import { useNB2Store } from '@/stores/useNB2Store'
import { NB2_PART_TYPES, NB2_PART_LABELS, type NB2PartType } from '@/types/nanoBanana2'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useTimelineStore } from '@/stores'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import type { BeatSyncEffect, KeyframableObjectType } from '@/types/keyframes'
import { cn } from '@/lib/utils'
import {
  PanelSlider,
  PanelSelect,
  PanelToggle,
  PanelMultiSelect,
  PanelTextarea,
  PanelDropZone,
  PanelActionButton,
  PanelSection,
  PanelInput,
} from '@/components/ui/panel-controls'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { CopilotDrawer } from '@/components/copilot/CopilotDrawer'
import type { GradientFill } from '@/types/gradient'
import { TEXT_ANIMATION_PRESETS, CATEGORY_INFO, type TextAnimationCategory } from '@/services/textAnimationPresets'
import { NEON_GLOW_PRESETS } from '@/data/neonGlowPresets'
import { GRADIENT_TEXT_PRESETS } from '@/data/gradientTextPresets'
import { TEXT_3D_STYLE_PRESETS } from '@/data/text3DStylePresets'
import { ELEMENTAL_TEXT_PRESETS } from '@/data/elementalTextPresets'
import { COMIC_TEXT_STYLE_PRESETS } from '@/data/comicTextStylePresets'
import { GAMING_TEXT_PRESETS } from '@/data/gamingTextPresets'
import { HIGHLIGHTED_TEXT_PRESETS } from '@/data/highlightedTextPresets'
import { CINEMATIC_TEXT_PRESETS } from '@/services/cinematicTextPresets'
import type { FontFamily, FontWeight, TextCase, TextOverlay } from '@/stores/useTextOverlayStore'

/** Extract a CSS-compatible color string from a fill value (solid string or GradientFill) */
function resolveFillString(fill: string | GradientFill): string {
  if (typeof fill === 'string') return fill
  return fill.stops?.[0]?.color ?? '#000000'
}

// Custom SVG icons for tabs that lucide doesn't cover
const EyebrowIcon: LucideIcon = (({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 14c2-4.5 5-5.5 9-4" />
    <path d="M21 14c-2-4.5-5-5.5-9-4" />
  </svg>
)) as unknown as LucideIcon

const PantsIcon: LucideIcon = (({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 3h8v5l-1.5 13h-2L12 12l-.5 9h-2L8 8V3z" />
  </svg>
)) as unknown as LucideIcon

// Top-level character sections — navigated with arrows
const CHARACTER_SECTIONS = [
  { id: 'character', icon: User, label: 'Character', defaultTab: 'group-properties' as const },
  { id: 'style', icon: Paintbrush, label: 'Style', defaultTab: 'style-properties' as const },
  { id: 'voices', icon: Mic, label: 'Voices', defaultTab: 'voices' as const },
  { id: 'animations', icon: Film, label: 'Animations', defaultTab: 'animations' as const },
]

// Character sprite sub-tabs — shown only in "Character" section
const characterSubTabs: Tab[] = [
  { id: 'group-properties', icon: Layers, label: 'Transform' },
  { id: 'head', icon: User, label: 'Head' },
  { id: 'eye', icon: Eye, label: 'Eye' },
  { id: 'eyebrow', icon: EyebrowIcon, label: 'Eyebrow' },
  { id: 'viseme', icon: Smile, label: 'Viseme' },
]

// Tabs that belong to the "Character" section (not voices/animations)
const CHARACTER_SECTION_TABS = new Set([
  'group-properties',
  'eye',
  'eyebrow',
  'viseme',
  'hair',
  'body',
  'head',
  'shirt',
  'pants',
  'shoes',
])

// Character sub-tabs — bottom bar (body parts)
const characterBottomTabs: Tab[] = [
  { id: 'hair', icon: Scissors, label: 'Hair' },
  { id: 'body', icon: PersonStanding, label: 'Body' },
  { id: 'shirt', icon: Shirt, label: 'Shirt' },
  { id: 'pants', icon: PantsIcon, label: 'Pants' },
  { id: 'shoes', icon: Footprints, label: 'Shoes' },
]

// Camera sub-tabs — shown in CameraSectionHeader
type CameraSubTab = 'all' | 'transform' | 'camera' | 'optical' | 'effects'

const CAMERA_SUB_TABS: Tab[] = [
  { id: 'all', icon: LayoutGrid, label: 'All' },
  { id: 'transform', icon: Move, label: 'Transform' },
  { id: 'camera', icon: Camera, label: 'Camera' },
  { id: 'optical', icon: Aperture, label: 'Optical' },
  { id: 'effects', icon: Zap, label: 'Effects' },
]

// Brand kit sub-tabs — shown in BrandKitSectionHeader
type BrandKitSubTab = 'all' | 'identity' | 'colors' | 'typography' | 'media' | 'voice'

const BRAND_KIT_SUB_TABS: Tab[] = [
  { id: 'all', icon: LayoutGrid, label: 'All' },
  { id: 'identity', icon: Sparkles, label: 'Identity' },
  { id: 'colors', icon: Palette, label: 'Colors' },
  { id: 'typography', icon: Type, label: 'Type' },
  { id: 'media', icon: Image, label: 'Media' },
  { id: 'voice', icon: Mic, label: 'Voice' },
]

// Context label and icon for the right panel header
const CONTEXT_INFO: Record<string, { label: string; icon: typeof Layers; color: string }> = {
  'group-properties': { label: 'Character', icon: Layers, color: 'text-[#4a7eff]' },
  eye: { label: 'Character', icon: Eye, color: 'text-[#4a7eff]' },
  eyebrow: { label: 'Character', icon: EyebrowIcon, color: 'text-[#4a7eff]' },
  viseme: { label: 'Character', icon: Smile, color: 'text-[#4a7eff]' },
  hair: { label: 'Character', icon: Scissors, color: 'text-[#4a7eff]' },
  body: { label: 'Character', icon: PersonStanding, color: 'text-[#4a7eff]' },
  head: { label: 'Character', icon: User, color: 'text-[#4a7eff]' },
  shirt: { label: 'Character', icon: Shirt, color: 'text-[#4a7eff]' },
  pants: { label: 'Character', icon: PantsIcon, color: 'text-[#4a7eff]' },
  shoes: { label: 'Character', icon: Footprints, color: 'text-[#4a7eff]' },
  voices: { label: 'Character', icon: Mic, color: 'text-[#4a7eff]' },
  'media-properties': { label: 'Media', icon: Image, color: 'text-[#4a7eff]' },
  'svg-object-properties': { label: 'SVG Object', icon: Palette, color: 'text-[#4a7eff]' },
  'shape-properties': { label: 'Shape', icon: Square, color: 'text-[#4a7eff]' },
  'text-properties': { label: 'Text', icon: Type, color: 'text-[#4a7eff]' },
  'text-animations': { label: 'Text', icon: Sparkles, color: 'text-[#4a7eff]' },
  'animation-properties': { label: 'Animation', icon: Sparkles, color: 'text-[#4a7eff]' },
  'html-template-properties': { label: 'HTML Template', icon: Code, color: 'text-[#4a7eff]' },
  'motion-graphic-properties': { label: 'Motion Graphic', icon: Sparkles, color: 'text-[#4a7eff]' },
  '3d-character-properties': { label: '3D Character', icon: Box, color: 'text-[#4a7eff]' },
  'pixelart-character-properties': { label: 'Pixel Art', icon: Grid3x3, color: 'text-[#4a7eff]' },
  'avatar-character-properties': { label: 'Avatar', icon: UserCircle, color: 'text-[#4a7eff]' },
  'avatar-videos': { label: 'Avatar', icon: Film, color: 'text-[#4a7eff]' },
  'avatar-voices': { label: 'Avatar', icon: Mic, color: 'text-[#4a7eff]' },
  'pixelart-animations': { label: 'Pixel Art', icon: Film, color: 'text-[#4a7eff]' },
  'art-curve-properties': { label: 'Art Curve', icon: Palette, color: 'text-[#4a7eff]' },
  'video-properties': { label: 'Video', icon: Film, color: 'text-[#4a7eff]' },
  animations: { label: 'Character', icon: Film, color: 'text-[#4a7eff]' },
  'style-properties': { label: 'Style', icon: Paintbrush, color: 'text-[#4a7eff]' },
  'whiteboard-background-properties': { label: 'Background', icon: Palette, color: 'text-[#4a7eff]' },
  'whiteboard-bg-color': { label: 'Color', icon: Palette, color: 'text-[#4a7eff]' },
  'whiteboard-bg-templates': { label: 'Templates', icon: LayoutTemplate, color: 'text-[#4a7eff]' },
  'whiteboard-bg-texture': { label: 'Build', icon: Image, color: 'text-[#4a7eff]' },
  'canvas-layers': { label: 'Layers', icon: Layers, color: 'text-[#4a7eff]' },
  'camera-properties': { label: 'Camera', icon: Camera, color: 'text-[#4a7eff]' },
  'gen-image-properties': { label: 'Image Gen', icon: Image, color: 'text-[#4a7eff]' },
  'gen-text-to-video-properties': { label: 'Text to Video', icon: Film, color: 'text-[#4a7eff]' },
  'image-to-video-properties': { label: 'Img to Video', icon: FileVideo, color: 'text-[#4a7eff]' },
  'gen-audio-to-video-properties': { label: 'Audio to Video', icon: Mic, color: 'text-[#4a7eff]' },
  'gen-video-to-video-properties': { label: 'Video to Video', icon: Sparkles, color: 'text-[#4a7eff]' },
  'gen-retake-properties': { label: 'Retake', icon: RotateCcw, color: 'text-[#4a7eff]' },
  'gen-extend-properties': { label: 'Extend', icon: ChevronRight, color: 'text-[#4a7eff]' },
  'broll-suggest-properties': { label: 'B-Roll', icon: Film, color: 'text-[#4a7eff]' },
  'brand-kit-properties': { label: 'Brand Kit', icon: Palette, color: 'text-[#4a7eff]' },
  'crowd-properties': { label: 'Crowd', icon: Users, color: 'text-[#4a7eff]' },
  'motion-gallery-styles': { label: 'Style Browser', icon: LayoutGrid, color: 'text-[#4a7eff]' },
}

const CHARACTER_TABS = new Set([
  'group-properties',
  'eye',
  'eyebrow',
  'viseme',
  'hair',
  'body',
  'head',
  'shirt',
  'pants',
  'shoes',
  'voices',
  'animations',
  'style-properties',
])

// Text sections — navigated with arrows (Properties / Styles / Animations)
const TEXT_SECTIONS = [
  { id: 'properties', icon: Type, label: 'Properties', defaultTab: 'text-properties' as const },
  { id: 'styles', icon: Paintbrush, label: 'Styles', defaultTab: 'text-styles' as const },
  { id: 'animations', icon: Sparkles, label: 'Animations', defaultTab: 'text-animations' as const },
]
const TEXT_TABS = new Set(['text-properties', 'text-styles', 'text-animations'])

// Pixel art character sections — navigated with arrows (same pattern as CHARACTER_SECTIONS)
const PIXELART_SECTIONS = [
  { id: 'properties', icon: Grid3x3, label: 'Pixel Art', defaultTab: 'pixelart-character-properties' as const },
  { id: 'animations', icon: Film, label: 'Animations', defaultTab: 'pixelart-animations' as const },
]
const PIXELART_TABS = new Set(['pixelart-character-properties', 'pixelart-animations'])

// Avatar character sections — navigated with arrows (same pattern as CHARACTER_SECTIONS)
const AVATAR_SECTIONS = [
  { id: 'properties', icon: UserCircle, label: 'Avatar', defaultTab: 'avatar-character-properties' as const },
  { id: 'videos', icon: Film, label: 'Videos', defaultTab: 'avatar-videos' as const },
  { id: 'voices', icon: Mic, label: 'Voices', defaultTab: 'avatar-voices' as const },
]
const AVATAR_TABS = new Set(['avatar-character-properties', 'avatar-videos', 'avatar-voices'])

// Generator sections — navigated with dropdown in right panel
const GEN_TABS = new Set([
  'gen-image-properties',
  'gen-text-to-video-properties',
  'image-to-video-properties',
  'gen-audio-to-video-properties',
  'gen-video-to-video-properties',
  'gen-retake-properties',
  'gen-extend-properties',
  'broll-suggest-properties',
  'gen-manim-properties',
])

const GEN_SECTIONS = [
  {
    id: 'gen-image-properties',
    label: 'Image Gen',
    icon: Image,
    tab: 'gen-image-properties' as RightPanelTab,
  },
  {
    id: 'gen-text-to-video-properties',
    label: 'Text to Video',
    icon: Film,
    tab: 'gen-text-to-video-properties' as RightPanelTab,
  },
  {
    id: 'image-to-video-properties',
    label: 'Img to Video',
    icon: FileVideo,
    tab: 'image-to-video-properties' as RightPanelTab,
  },
  {
    id: 'gen-audio-to-video-properties',
    label: 'Audio to Video',
    icon: Mic,
    tab: 'gen-audio-to-video-properties' as RightPanelTab,
  },
  {
    id: 'gen-video-to-video-properties',
    label: 'Video to Video',
    icon: Sparkles,
    tab: 'gen-video-to-video-properties' as RightPanelTab,
  },
  {
    id: 'gen-retake-properties',
    label: 'Retake',
    icon: RotateCcw,
    tab: 'gen-retake-properties' as RightPanelTab,
  },
  {
    id: 'gen-extend-properties',
    label: 'Extend',
    icon: ChevronRight,
    tab: 'gen-extend-properties' as RightPanelTab,
  },
  {
    id: 'broll-suggest-properties',
    label: 'B-Roll',
    icon: Film,
    tab: 'broll-suggest-properties' as RightPanelTab,
  },
  {
    id: 'gen-manim-properties',
    label: 'Manim Video',
    icon: Sparkles,
    tab: 'gen-manim-properties' as RightPanelTab,
  },
]

// Template right panel tabs — canvas template property panels
const TEMPLATE_TABS = new Set(['html-template-properties', 'motion-graphic-properties'])
const TEMPLATE_SECTIONS: { id: string; label: string; icon: typeof Code; tab: RightPanelTab }[] = [
  {
    id: 'html-template-properties',
    label: 'HTML Template',
    icon: Code,
    tab: 'html-template-properties' as RightPanelTab,
  },
  {
    id: 'motion-graphic-properties',
    label: 'Motion Graphic',
    icon: Sparkles,
    tab: 'motion-graphic-properties' as RightPanelTab,
  },
]

// Background sections — navigated with arrows (same pattern as CHARACTER_SECTIONS)
// Top-level sections navigated with arrows (Background / Layers)
const BG_SECTIONS = [
  { id: 'background', icon: Image, label: 'Background', defaultTab: 'whiteboard-bg-color' as const },
  { id: 'layers', icon: Layers, label: 'Layers', defaultTab: 'canvas-layers' as const },
]
const BG_BG_TABS = new Set([
  'whiteboard-bg-color',
  'whiteboard-bg-templates',
  'whiteboard-bg-texture',
  'whiteboard-background-properties',
])
const BG_ALL_TABS = new Set([
  'whiteboard-bg-color',
  'whiteboard-bg-templates',
  'whiteboard-bg-texture',
  'whiteboard-background-properties',
  'canvas-layers',
])

// Background sub-tabs — shown only in "Background" section
const bgSubTabs: Tab[] = [
  { id: 'whiteboard-bg-color', icon: Palette, label: 'Color' },
  { id: 'whiteboard-bg-templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'whiteboard-bg-texture', icon: Image, label: 'Build' },
]

// Map right-panel tab → NB2 pipeline partType for regeneration
const TAB_TO_NB2_PART: Record<string, NB2PartType> = {
  eye: 'eye-strip',
  eyebrow: 'eyebrow-strip',
  viseme: 'viseme-sheet',
  hair: 'hair',
  head: 'head',
  body: 'body',
  shirt: 'clothing',
  pants: 'clothing',
  shoes: 'clothing',
}

// Icon mapping for NB2 pipeline steps in generation header
const NB2_STEP_ICONS: Record<NB2PartType, typeof User> = {
  concept: Sparkles,
  body: PersonStanding,
  head: User,
  hair: Scissors,
  'viseme-sheet': Smile,
  'eye-strip': Eye,
  'eyebrow-strip': EyebrowIcon,
  clothing: Shirt,
}

/** Dropdown header for NB2 generation mode — replaces CharacterSectionHeader when overlay is active */
function NB2GenerationHeader() {
  const editingPromptStep = useNB2Store((s) => s.editingPromptStep)
  const setEditingPromptStep = useNB2Store((s) => s.setEditingPromptStep)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Init to 'concept' on mount so prompts show before generation
  useEffect(() => {
    if (!editingPromptStep) setEditingPromptStep('concept')
  }, [editingPromptStep, setEditingPromptStep])

  const currentStep = editingPromptStep ?? 'concept'
  const currentIndex = NB2_PART_TYPES.indexOf(currentStep)
  const StepIcon = NB2_STEP_ICONS[currentStep] ?? Sparkles

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
          <StepIcon size={14} className="shrink-0 text-[#4a7eff]" />
          <span className="truncate">{NB2_PART_LABELS[currentStep]}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
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
                    isActive
                      ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
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

/** Arrow-navigated section header for character context */
function CharacterSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  // Determine which section is active
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
  const current = CHARACTER_SECTIONS[currentIndex]
  const SectionIcon = current.icon

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? CHARACTER_SECTIONS.length - 1 : currentIndex - 1
    setRightPanelTab(CHARACTER_SECTIONS[prev].defaultTab)
  }, [currentIndex, setRightPanelTab])

  const goNext = useCallback(() => {
    const next = currentIndex >= CHARACTER_SECTIONS.length - 1 ? 0 : currentIndex + 1
    setRightPanelTab(CHARACTER_SECTIONS[next].defaultTab)
  }, [currentIndex, setRightPanelTab])

  const isCharacterSection = activeSection === 'character'

  return (
    <>
      {/* Arrow nav for Character / Voices / Animations */}
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
            <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" />
            <span className="truncate">{current.label}</span>
            <ChevronDown
              size={14}
              className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
              {CHARACTER_SECTIONS.map((section) => {
                const Icon = section.icon
                const isActive = section.id === activeSection
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setRightPanelTab(section.defaultTab)
                      setDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                      isActive
                        ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
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

      {/* Sprite sub-tabs — only in Character section */}
      {isCharacterSection && (
        <div className="px-3 pb-2 border-t border-white/5 pt-2">
          <TabNavigation
            tabs={characterSubTabs}
            activeTab={rightPanelTab}
            onTabChange={(id) => setRightPanelTab(id as RightPanelTab)}
            size="sm"
            animated
          />
        </div>
      )}
    </>
  )
}

/** Section header for camera context */
function CameraSectionHeader({
  activeSubTab,
  setActiveSubTab,
}: {
  activeSubTab: string
  setActiveSubTab: (tab: CameraSubTab) => void
}) {
  return (
    <>
      {/* Arrow nav — matches CharacterSectionHeader visually */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Previous"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200">
            <Camera size={14} className="shrink-0 text-[#4a7eff]" />
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

      {/* Sub-tabs — animated pills */}
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

/** Arrow-navigated section header for crowd context */
function CrowdSectionHeader() {
  const groups = useCrowdStore((s) => s.groups)
  const selectedGroupId = useCrowdStore((s) => s.selectedGroupId)
  const setSelectedGroupId = useCrowdStore((s) => s.setSelectedGroupId)

  const currentIndex = groups.findIndex((g) => g.id === selectedGroupId)
  const current = currentIndex >= 0 ? groups[currentIndex] : null

  const goPrev = useCallback(() => {
    if (groups.length === 0) return
    const prev = currentIndex <= 0 ? groups.length - 1 : currentIndex - 1
    setSelectedGroupId(groups[prev].id)
  }, [currentIndex, groups, setSelectedGroupId])

  const goNext = useCallback(() => {
    if (groups.length === 0) return
    const next = currentIndex >= groups.length - 1 ? 0 : currentIndex + 1
    setSelectedGroupId(groups[next].id)
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
          <Users size={14} className="shrink-0 text-[#4a7eff]" />
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

/** Arrow-navigated section header for brand kit context */
function BrandKitSectionHeader({
  activeSubTab,
  setActiveSubTab,
}: {
  activeSubTab: string
  setActiveSubTab: (tab: BrandKitSubTab) => void
}) {
  return (
    <>
      {/* Arrow nav */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          title="Previous"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200">
            <Palette size={14} className="shrink-0 text-[#4a7eff]" />
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

      {/* Sub-tabs — animated pills */}
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

/** Arrow-navigated section header for generate context */
function GenSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const currentIndex = GEN_SECTIONS.findIndex((s) => s.id === rightPanelTab)
  const current = GEN_SECTIONS[Math.max(currentIndex, 0)]
  const SectionIcon = current.icon

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? GEN_SECTIONS.length - 1 : currentIndex - 1
    setRightPanelTab(GEN_SECTIONS[prev].tab)
  }, [currentIndex, setRightPanelTab])

  const goNext = useCallback(() => {
    const next = currentIndex >= GEN_SECTIONS.length - 1 ? 0 : currentIndex + 1
    setRightPanelTab(GEN_SECTIONS[next].tab)
  }, [currentIndex, setRightPanelTab])

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
          <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" />
          <span className="truncate">{current.label}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
            {GEN_SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = section.id === rightPanelTab
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setRightPanelTab(section.tab)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
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
  )
}

/** Arrow-navigated section header for template context (HTML Template / Motion Graphic) */
function TemplateSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const currentIndex = TEMPLATE_SECTIONS.findIndex((s) => s.id === rightPanelTab)
  const current = TEMPLATE_SECTIONS[Math.max(currentIndex, 0)]
  const SectionIcon = current.icon
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? TEMPLATE_SECTIONS.length - 1 : currentIndex - 1
    setRightPanelTab(TEMPLATE_SECTIONS[prev].tab)
  }, [currentIndex, setRightPanelTab])

  const goNext = useCallback(() => {
    const next = currentIndex >= TEMPLATE_SECTIONS.length - 1 ? 0 : currentIndex + 1
    setRightPanelTab(TEMPLATE_SECTIONS[next].tab)
  }, [currentIndex, setRightPanelTab])

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
          <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" />
          <span className="truncate">{current.label}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
            {TEMPLATE_SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = section.id === rightPanelTab
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setRightPanelTab(section.tab)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
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
  )
}

/** Arrow-navigated section header for pixel art character context */
function PixelArtSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection = rightPanelTab === 'pixelart-animations' ? 'animations' : 'properties'
  const currentIndex = PIXELART_SECTIONS.findIndex((s) => s.id === activeSection)
  const current = PIXELART_SECTIONS[currentIndex]
  const SectionIcon = current.icon

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? PIXELART_SECTIONS.length - 1 : currentIndex - 1
    setRightPanelTab(PIXELART_SECTIONS[prev].defaultTab)
  }, [currentIndex, setRightPanelTab])

  const goNext = useCallback(() => {
    const next = currentIndex >= PIXELART_SECTIONS.length - 1 ? 0 : currentIndex + 1
    setRightPanelTab(PIXELART_SECTIONS[next].defaultTab)
  }, [currentIndex, setRightPanelTab])

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
          <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" />
          <span className="truncate">{current.label}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
            {PIXELART_SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = section.id === activeSection
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setRightPanelTab(section.defaultTab)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
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
  )
}

/** Arrow-navigated section header for text context (Properties / Animations) */
function TextSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection =
    rightPanelTab === 'text-animations' ? 'animations' : rightPanelTab === 'text-styles' ? 'styles' : 'properties'
  const currentIndex = TEXT_SECTIONS.findIndex((s) => s.id === activeSection)
  const current = TEXT_SECTIONS[currentIndex]
  const SectionIcon = current.icon

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? TEXT_SECTIONS.length - 1 : currentIndex - 1
    setRightPanelTab(TEXT_SECTIONS[prev].defaultTab)
  }, [currentIndex, setRightPanelTab])

  const goNext = useCallback(() => {
    const next = currentIndex >= TEXT_SECTIONS.length - 1 ? 0 : currentIndex + 1
    setRightPanelTab(TEXT_SECTIONS[next].defaultTab)
  }, [currentIndex, setRightPanelTab])

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
          <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" />
          <span className="truncate">{current.label}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
            {TEXT_SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = section.id === activeSection
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setRightPanelTab(section.defaultTab)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
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
  )
}

/** Arrow-navigated section header for avatar character context */
function AvatarSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection =
    rightPanelTab === 'avatar-voices' ? 'voices' : rightPanelTab === 'avatar-videos' ? 'videos' : 'properties'
  const currentIndex = AVATAR_SECTIONS.findIndex((s) => s.id === activeSection)
  const current = AVATAR_SECTIONS[currentIndex]
  const SectionIcon = current.icon

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? AVATAR_SECTIONS.length - 1 : currentIndex - 1
    setRightPanelTab(AVATAR_SECTIONS[prev].defaultTab)
  }, [currentIndex, setRightPanelTab])

  const goNext = useCallback(() => {
    const next = currentIndex >= AVATAR_SECTIONS.length - 1 ? 0 : currentIndex + 1
    setRightPanelTab(AVATAR_SECTIONS[next].defaultTab)
  }, [currentIndex, setRightPanelTab])

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
          <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" />
          <span className="truncate">{current.label}</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
            {AVATAR_SECTIONS.map((section) => {
              const Icon = section.icon
              const isActive = section.id === activeSection
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setRightPanelTab(section.defaultTab)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
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
  )
}

// ── Whiteboard Background Properties ──────────────────────────────────

/** Recommended background colors (quick-pick swatches) */
const WB_RECOMMENDED_COLORS: { label: string; color: string }[] = [
  { label: 'Blank', color: 'transparent' },
  { label: 'White', color: '#ffffff' },
  { label: 'Light Gray', color: '#f5f5f5' },
  { label: 'Dark', color: '#1e1e1e' },
  { label: 'Cream', color: '#fdf6e3' },
  { label: 'Chalkboard', color: '#2d4a3e' },
  { label: 'Blueprint', color: '#1a2744' },
]

/** Element toggles for drafting overlay */
const WB_ELEMENT_TOGGLES: { key: string; label: string }[] = [
  { key: 'showGrid', label: 'Grid' },
  { key: 'showScales', label: 'Scales' },
  { key: 'showLabels', label: 'Labels' },
  { key: 'showRadialCurves', label: 'Radial Curves' },
  { key: 'showPolarGrid', label: 'Polar Grid' },
  { key: 'showConcentricCircles', label: 'Concentric Circles' },
  { key: 'showTestCircles', label: 'Test Circles' },
  { key: 'showRadiatingLines', label: 'Radiating Lines' },
  { key: 'showLargeArc', label: 'Large Arc' },
]

/** Arrow-navigated section header for background / layers context */
function BackgroundSectionHeader({
  rightPanelTab,
  setRightPanelTab,
}: {
  rightPanelTab: string
  setRightPanelTab: (tab: RightPanelTab) => void
}) {
  const activeSection = BG_BG_TABS.has(rightPanelTab) ? 'background' : 'layers'
  const currentIndex = BG_SECTIONS.findIndex((s) => s.id === activeSection)
  const current = BG_SECTIONS[currentIndex]
  const SectionIcon = current.icon

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = useCallback(() => {
    const prev = currentIndex <= 0 ? BG_SECTIONS.length - 1 : currentIndex - 1
    setRightPanelTab(BG_SECTIONS[prev].defaultTab)
  }, [currentIndex, setRightPanelTab])

  const goNext = useCallback(() => {
    const next = currentIndex >= BG_SECTIONS.length - 1 ? 0 : currentIndex + 1
    setRightPanelTab(BG_SECTIONS[next].defaultTab)
  }, [currentIndex, setRightPanelTab])

  const isBackgroundSection = activeSection === 'background'

  return (
    <>
      {/* Arrow nav for Background / Layers */}
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
            <SectionIcon size={14} className="shrink-0 text-[#4a7eff]" />
            <span className="truncate">{current.label}</span>
            <ChevronDown
              size={14}
              className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
            />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1e1e1e] border border-white/5 rounded-xl shadow-2xl py-1.5">
              {BG_SECTIONS.map((section) => {
                const Icon = section.icon
                const isActive = section.id === activeSection
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setRightPanelTab(section.defaultTab)
                      setDropdownOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                      isActive
                        ? 'bg-[#4a7eff]/10 text-[#4a7eff]'
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

      {/* Sub-tabs — only in Background section */}
      {isBackgroundSection && (
        <div className="px-3 pb-2 border-t border-white/5 pt-2">
          <TabNavigation
            tabs={bgSubTabs}
            activeTab={rightPanelTab}
            onTabChange={(id) => setRightPanelTab(id as RightPanelTab)}
            size="sm"
            animated
          />
        </div>
      )}
    </>
  )
}

function WhiteboardBackgroundPropertiesPanel() {
  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)
  const config = useWhiteboardStore((s) => s.config)
  const customBackgrounds = useWhiteboardStore((s) => s.customBackgrounds)
  const setBackgroundColor = useWhiteboardStore((s) => s.setBackgroundColor)
  const setBackgroundStyle = useWhiteboardStore((s) => s.setBackgroundStyle)
  const setBackgroundType = useWhiteboardStore((s) => s.setBackgroundType)
  const setBackgroundImageUrl = useWhiteboardStore((s) => s.setBackgroundImageUrl)
  const setBackgroundVideoUrl = useWhiteboardStore((s) => s.setBackgroundVideoUrl)
  const setBackgroundCode = useWhiteboardStore((s) => s.setBackgroundCode)
  const setBackgroundCodeControls = useWhiteboardStore((s) => s.setBackgroundCodeControls)
  const updateBackgroundCodeControl = useWhiteboardStore((s) => s.updateBackgroundCodeControl)
  const updateDraftingConfig = useWhiteboardStore((s) => s.updateDraftingConfig)
  const addCustomBackground = useWhiteboardStore((s) => s.addCustomBackground)
  const removeCustomBackground = useWhiteboardStore((s) => s.removeCustomBackground)

  const [isDragging, setIsDragging] = useState(false)
  const [codeText, setCodeText] = useState(config.backgroundCode ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      const id = `custbg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      if (file.type.startsWith('video/')) {
        addCustomBackground({ id, type: 'video', dataUrl, label: file.name })
        setBackgroundType('video')
        setBackgroundVideoUrl(dataUrl)
      } else if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
        addCustomBackground({ id, type: 'svg', dataUrl, label: file.name })
        setBackgroundType('image')
        setBackgroundImageUrl(dataUrl)
      } else {
        addCustomBackground({ id, type: 'image', dataUrl, label: file.name })
        setBackgroundType('image')
        setBackgroundImageUrl(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const applyCode = () => {
    if (!codeText.trim()) return
    setBackgroundCode(codeText)
    setBackgroundType('code')
    setBackgroundCodeControls(parseCodeControls(codeText))
  }

  // Determine active BG sub-section from tab
  const activeSection =
    rightPanelTab === 'whiteboard-bg-templates'
      ? 'templates'
      : rightPanelTab === 'whiteboard-bg-texture'
        ? 'texture'
        : 'color'

  return (
    <div className="flex-1 overflow-y-auto">
      {/* ════════════════════════════════════════════════════════ */}
      {/* COLOR TAB                                              */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeSection === 'color' && (
        <div className="p-3 space-y-2">
          {/* Custom solid color card — clicking opens ColorPicker */}
          <div className="relative w-full rounded-lg overflow-hidden border-2 border-dashed border-white/5 hover:border-zinc-400 transition-colors">
            <div
              className="w-full aspect-video relative cursor-pointer"
              style={{
                backgroundColor:
                  config.backgroundStyle === 'blank' &&
                  config.backgroundColor &&
                  config.backgroundColor !== 'transparent'
                    ? config.backgroundColor
                    : '#27272a',
              }}
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
                style={{ mixBlendMode: 'difference' }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="text-[11px] font-medium text-white">Custom Color</span>
              </div>
              {/* Full-card ColorPicker — invisible overlay that opens on click */}
              <div className="absolute inset-0">
                <ColorPicker
                  className="!w-full !h-full !opacity-0 !cursor-pointer"
                  color={config.backgroundColor === 'transparent' ? '#000000' : config.backgroundColor}
                  onChange={(c) => {
                    setBackgroundColor(c)
                    setBackgroundStyle('blank')
                    setBackgroundType('preset')
                  }}
                  showAlpha={false}
                />
              </div>
            </div>
          </div>

          {/* Gradient cards */}
          {[
            { label: 'Sunset', bg: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)', color: '#f97316' },
            { label: 'Ocean', bg: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#0ea5e9' },
            { label: 'Forest', bg: 'linear-gradient(135deg, #22c55e, #14b8a6, #0ea5e9)', color: '#22c55e' },
            { label: 'Night', bg: 'linear-gradient(180deg, #0f172a, #1e1b4b, #312e81)', color: '#0f172a' },
            { label: 'Fire', bg: 'linear-gradient(180deg, #fbbf24, #f97316, #ef4444)', color: '#ef4444' },
            { label: 'Radial Glow', bg: 'radial-gradient(circle at center, #3b82f6, #1e1b4b)', color: '#1e1b4b' },
            { label: 'Radial Warm', bg: 'radial-gradient(circle at center, #fbbf24, #78350f)', color: '#78350f' },
            { label: 'Vignette', bg: 'radial-gradient(circle at center, #374151, #000000)', color: '#000000' },
            { label: 'Aurora', bg: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #ec4899, #f97316)', color: '#06b6d4' },
            { label: 'Monochrome', bg: 'linear-gradient(180deg, #525252, #171717)', color: '#171717' },
          ].map((grad) => {
            const isActive = config.backgroundStyle === 'gradient-' + grad.label.toLowerCase().replace(/\s+/g, '-')
            return (
              <button
                key={grad.label}
                onClick={() => {
                  setBackgroundColor(grad.color)
                  setBackgroundStyle('gradient-' + grad.label.toLowerCase().replace(/\s+/g, '-'))
                  setBackgroundType('preset')
                  useWhiteboardStore.getState().setConfig({ backgroundGradient: grad.bg })
                }}
                className={`w-full rounded-lg overflow-hidden transition-all ${
                  isActive
                    ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                    : 'hover:ring-1 hover:ring-zinc-500'
                }`}
              >
                <div className="w-full aspect-video relative" style={{ background: grad.bg }}>
                  <span className="absolute bottom-1 left-2 text-[10px] font-medium text-white/80 drop-shadow-sm">
                    {grad.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}

          {/* Solid color cards */}
          {WB_RECOMMENDED_COLORS.map((swatch) => {
            const isActive =
              config.backgroundColor === swatch.color &&
              config.backgroundStyle !== 'drafting' &&
              config.backgroundStyle !== 'cutting-mat'
            const isTransparent = swatch.color === 'transparent'
            const isDark =
              isTransparent ||
              [
                '#000000',
                '#1a1a2e',
                '#0d1117',
                '#1e1e1e',
                '#0f172a',
                '#1a2744',
                '#2d4a3e',
                '#1a3bc2',
                '#0f2e7a',
              ].includes(swatch.color)
            return (
              <button
                key={swatch.color}
                onClick={() => {
                  setBackgroundColor(swatch.color)
                  setBackgroundStyle('blank')
                  setBackgroundType('preset')
                }}
                className={`w-full rounded-lg overflow-hidden transition-all ${
                  isActive
                    ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                    : 'hover:ring-1 hover:ring-zinc-500'
                }`}
              >
                <div
                  className="w-full aspect-video relative"
                  style={{
                    backgroundColor: isTransparent ? '#1a1a1a' : swatch.color,
                    backgroundImage: isTransparent
                      ? 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)'
                      : undefined,
                    backgroundSize: isTransparent ? '12px 12px' : undefined,
                    backgroundPosition: isTransparent ? '0 0, 0 6px, 6px -6px, -6px 0px' : undefined,
                  }}
                >
                  <span
                    className={`absolute bottom-1 left-2 text-[10px] font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}
                  >
                    {swatch.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TEMPLATES TAB (Drafting, Cutting Mat, etc.)             */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeSection === 'templates' && (
        <div className="p-3 space-y-2">
          {/* Drafting template card */}
          <button
            onClick={() => {
              setBackgroundStyle('drafting')
              setBackgroundType('preset')
              const dc = config.draftingConfig ?? createDefaultDraftingConfig()
              setBackgroundColor(dc.bgColor)
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'drafting'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#0f2e7a' }}>
              {/* Mini drafting grid preview */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 90" preserveAspectRatio="none">
                {[20, 40, 60, 80, 100, 120, 140].map((x) => (
                  <line key={`v${x}`} x1={x} y1={0} x2={x} y2={90} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                ))}
                {[15, 30, 45, 60, 75].map((y) => (
                  <line key={`h${y}`} x1={0} y1={y} x2={160} y2={y} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
                ))}
                <circle cx="80" cy="45" r="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <line x1="30" y1="80" x2="130" y2="10" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </svg>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-blue-300">Drafting</span>
              {config.backgroundStyle === 'drafting' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Cutting Mat template card */}
          <button
            onClick={() => {
              setBackgroundStyle('cutting-mat')
              setBackgroundType('preset')
              setBackgroundColor('#1a3bc2')
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'cutting-mat'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#1a3bc2' }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 90" preserveAspectRatio="none">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150].map((x) => (
                  <line key={`v${x}`} x1={x} y1={5} x2={x} y2={85} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
                ))}
                {[10, 20, 30, 40, 50, 60, 70, 80].map((y) => (
                  <line key={`h${y}`} x1={5} y1={y} x2={155} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
                ))}
                <rect
                  x="5"
                  y="5"
                  width="150"
                  height="80"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.5"
                />
                <line x1="30" y1="85" x2="130" y2="5" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
                <line x1="30" y1="5" x2="130" y2="85" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
              </svg>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-blue-300">Cutting Mat</span>
              {config.backgroundStyle === 'cutting-mat' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Chalkboard template card */}
          <button
            onClick={() => {
              setBackgroundStyle('chalkboard')
              setBackgroundType('preset')
              setBackgroundColor('#2d4a3e')
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'chalkboard'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#2d4a3e' }}>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-zinc-400/60">Chalkboard</span>
              {config.backgroundStyle === 'chalkboard' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Blueprint template card */}
          <button
            onClick={() => {
              setBackgroundStyle('blueprint')
              setBackgroundType('preset')
              setBackgroundColor('#1a2744')
            }}
            className={`w-full rounded-lg overflow-hidden transition-all ${
              config.backgroundStyle === 'blueprint'
                ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900'
                : 'hover:ring-1 hover:ring-zinc-500'
            }`}
          >
            <div className="w-full aspect-video relative" style={{ backgroundColor: '#1a2744' }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 90" preserveAspectRatio="none">
                {[20, 40, 60, 80, 100, 120, 140].map((x) => (
                  <line key={`v${x}`} x1={x} y1={0} x2={x} y2={90} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                ))}
                {[15, 30, 45, 60, 75].map((y) => (
                  <line key={`h${y}`} x1={0} y1={y} x2={160} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                ))}
              </svg>
              <span className="absolute bottom-1 left-2 text-[10px] font-medium text-blue-300/60">Blueprint</span>
              {config.backgroundStyle === 'blueprint' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#4a7eff] flex items-center justify-center">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Drafting properties (shown when drafting is active) */}
          {config.backgroundStyle === 'drafting' &&
            (() => {
              const dc = config.draftingConfig ?? createDefaultDraftingConfig()
              return (
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Drafting Properties</h4>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-20 shrink-0">Line Color</span>
                    <ColorPicker
                      color={dc.lineColor}
                      onChange={(c) => updateDraftingConfig({ lineColor: c })}
                      showAlpha={false}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-20 shrink-0">BG Color</span>
                    <ColorPicker
                      color={dc.bgColor}
                      onChange={(c) => {
                        updateDraftingConfig({ bgColor: c })
                        setBackgroundColor(c)
                      }}
                      showAlpha={false}
                    />
                  </div>

                  <PanelSelect
                    label="Gradient"
                    value={dc.gradientMode}
                    onChange={(v) => updateDraftingConfig({ gradientMode: v as DraftingConfig['gradientMode'] })}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'radial', label: 'Radial' },
                      { value: 'linear-top', label: 'Linear Top' },
                      { value: 'linear-left', label: 'Linear Left' },
                      { value: 'vignette', label: 'Vignette' },
                    ]}
                  />

                  {dc.gradientMode !== 'none' && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm w-20 shrink-0">Grad Color</span>
                      <ColorPicker
                        color={dc.gradientColor}
                        onChange={(c) => updateDraftingConfig({ gradientColor: c })}
                        showAlpha={false}
                      />
                    </div>
                  )}

                  <PanelSlider
                    label="Thickness"
                    min={0.2}
                    max={3}
                    step={0.1}
                    value={dc.thicknessScale}
                    onChange={(v) => updateDraftingConfig({ thicknessScale: v })}
                  />
                  <PanelSlider
                    label="Opacity"
                    min={0}
                    max={1}
                    step={0.05}
                    value={dc.opacity}
                    onChange={(v) => updateDraftingConfig({ opacity: v })}
                  />
                  <PanelSlider
                    label="Grid Density"
                    min={1}
                    max={10}
                    step={1}
                    value={dc.gridDensity}
                    onChange={(v) => updateDraftingConfig({ gridDensity: v })}
                  />
                  <PanelSlider
                    label="Margin"
                    min={0}
                    max={0.1}
                    step={0.005}
                    value={dc.margin}
                    onChange={(v) => updateDraftingConfig({ margin: v })}
                  />

                  <PanelMultiSelect
                    label="Elements"
                    options={WB_ELEMENT_TOGGLES.map((t) => ({ value: t.key, label: t.label }))}
                    value={WB_ELEMENT_TOGGLES.filter((t) => dc[t.key as keyof DraftingConfig] === true).map(
                      (t) => t.key,
                    )}
                    onChange={(vals) => {
                      const updates: Partial<DraftingConfig> = {}
                      for (const t of WB_ELEMENT_TOGGLES) {
                        ;(updates as Record<string, boolean>)[t.key] = vals.includes(t.key)
                      }
                      updateDraftingConfig(updates)
                    }}
                  />
                </div>
              )
            })()}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TEXTURE TAB                                            */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeSection === 'texture' && (
        <div className="p-4 space-y-5">
          {/* Upload area */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Upload</h4>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.svg"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFileUpload(e.dataTransfer.files)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
                isDragging ? 'border-[#4a7eff] bg-[#4a7eff]/10' : 'border-white/5 bg-[#2a2a2a] hover:border-zinc-500',
              )}
            >
              <Image size={20} className={cn('mb-1.5', isDragging ? 'text-[#4a7eff]' : 'text-zinc-500')} />
              <p className={cn('text-xs', isDragging ? 'text-[#4a7eff]' : 'text-zinc-400')}>
                Drop image, video, or SVG
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">or click to browse</p>
            </div>

            {/* Custom backgrounds grid */}
            {customBackgrounds.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5">
                {customBackgrounds.map((bg) => {
                  const isActive =
                    (bg.type === 'video' &&
                      config.backgroundType === 'video' &&
                      config.backgroundVideoUrl === bg.dataUrl) ||
                    (bg.type !== 'video' &&
                      config.backgroundType === 'image' &&
                      config.backgroundImageUrl === bg.dataUrl)
                  return (
                    <div key={bg.id} className="relative group">
                      <button
                        onClick={() => {
                          if (bg.type === 'video') {
                            setBackgroundType('video')
                            setBackgroundVideoUrl(bg.dataUrl)
                          } else {
                            setBackgroundType('image')
                            setBackgroundImageUrl(bg.dataUrl)
                          }
                        }}
                        className={cn(
                          'w-full aspect-video rounded-sm border overflow-hidden',
                          isActive
                            ? 'ring-2 ring-[#4a7eff] ring-offset-1 ring-offset-zinc-900 border-[#4a7eff]'
                            : 'border-white/5 hover:border-zinc-400',
                        )}
                      >
                        {bg.type === 'video' ? (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Film size={14} className="text-zinc-500" />
                          </div>
                        ) : (
                          <img src={bg.dataUrl} alt={bg.label} className="w-full h-full object-cover" />
                        )}
                      </button>
                      <button
                        onClick={() => removeCustomBackground(bg.id)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/60 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Code Background */}
          <div className="space-y-2 pt-3 border-t border-white/5">
            <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Code Background</h4>

            {/* Copy AI prompt button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(CODE_BACKGROUND_PROMPT)
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#2a2a2a] text-zinc-300 hover:bg-[#3a3a3a] border border-white/5 transition-colors text-[11px] font-medium"
            >
              <Copy size={12} />
              Copy AI Prompt
            </button>

            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              placeholder={`// Paste AI-generated JS code here\n// Uses draw(ctx, w, h, t, controls)\n// addControl(id, label, min, max, val)\n// addControl(id, label, "color", "#hex")\n// addControl(id, label, "toggle", true)\n// addControl(id, label, "text", "value")\n// addControl(id, label, "dropdown", "sel", [...])`}
              className="w-full h-40 px-3 py-2 rounded-lg bg-[#2a2a2a] border border-white/5 text-[11px] text-zinc-200 font-mono placeholder-zinc-600 outline-none focus:ring-1 focus:ring-[#4a7eff] transition-colors resize-y"
              spellCheck={false}
            />
            <button
              onClick={applyCode}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 border border-[#4a7eff]/20 hover:border-[#4a7eff]/30 transition-colors text-[11px] font-medium"
            >
              <Zap size={12} />
              Apply Code
            </button>

            {/* Auto-generated controls from addControl() */}
            {config.backgroundCodeControls && config.backgroundCodeControls.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Controls</span>
                {config.backgroundCodeControls.map((ctrl) => {
                  if (ctrl.type === 'slider') {
                    return (
                      <PanelSlider
                        key={ctrl.id}
                        label={ctrl.label}
                        min={ctrl.min}
                        max={ctrl.max}
                        step={ctrl.step ?? 0.01}
                        value={ctrl.value}
                        onChange={(v) => updateBackgroundCodeControl(ctrl.id, v)}
                      />
                    )
                  }
                  if (ctrl.type === 'color') {
                    return (
                      <div key={ctrl.id} className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-20 shrink-0">{ctrl.label}</span>
                        <ColorPicker
                          color={ctrl.value}
                          onChange={(c) => updateBackgroundCodeControl(ctrl.id, c)}
                          showAlpha={false}
                        />
                      </div>
                    )
                  }
                  if (ctrl.type === 'toggle') {
                    return (
                      <PanelToggle
                        key={ctrl.id}
                        label={ctrl.label}
                        checked={ctrl.value}
                        onChange={(v) => updateBackgroundCodeControl(ctrl.id, v)}
                      />
                    )
                  }
                  if (ctrl.type === 'text') {
                    return (
                      <div key={ctrl.id} className="flex items-center gap-3">
                        <span className="text-gray-400 text-[11px] w-20 shrink-0">{ctrl.label}</span>
                        <input
                          type="text"
                          value={ctrl.value}
                          onChange={(e) => updateBackgroundCodeControl(ctrl.id, e.target.value)}
                          className="flex-1 px-2 py-1 rounded-lg bg-[#2a2a2a] border border-white/5 text-xs text-zinc-200 outline-none focus:ring-1 focus:ring-[#4a7eff]"
                        />
                      </div>
                    )
                  }
                  if (ctrl.type === 'dropdown') {
                    return (
                      <PanelSelect
                        key={ctrl.id}
                        label={ctrl.label}
                        value={ctrl.value}
                        onChange={(v) => updateBackgroundCodeControl(ctrl.id, v)}
                        options={ctrl.options.map((o) => ({ value: o, label: o }))}
                      />
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function RightPanel() {
  const copilotIsOpen = useCopilotStore((s) => s.isOpen)
  const activeCanvasOverlay = useEditorStore((s) => s.activeCanvasOverlay)
  const { rightPanelTab, setRightPanelTab } = useEditorStore()
  const { characters, selectedCharacterId } = useCanvasStore()
  const { setSpriteLabel, useCurvedVisemes, savedImages, clearSavedImages } = useCharacterConfigStore()
  const { characters: savedCharacters, selectedCharacterId: selectedSavedCharacterId } = useSavedCharactersStore()
  const [openAssetDetail, setOpenAssetDetail] = useState<AssetDetailInfo | null>(null)
  const [cameraSubTab, setCameraSubTab] = useState<CameraSubTab>('transform')
  const [brandKitSubTab, setBrandKitSubTab] = useState<BrandKitSubTab>('all')

  // Sprite background removal (for head/viseme/hair/body tabs)
  const {
    isProcessing: isSprBgRemoving,
    currentIndex: sprBgIndex,
    totalCount: sprBgTotal,
    error: sprBgError,
    removeAllBackgrounds: sprRemoveAllBgs,
  } = useSpriteBackgroundRemoval()

  // Check if Recraft HD bg removal is available
  const [recraftReady, setRecraftReady] = useState(false)
  useEffect(() => {
    isRecraftAvailable().then(setRecraftReady)
  }, [])

  // NB2 regeneration
  const nb2RegeneratingStep = useNB2Store((s) => s.regeneratingStep)
  const nb2Prompt = useNB2Store((s) => s.prompt)
  const nb2Regenerate = useNB2Store((s) => s.regenerateStep)
  const nb2HasResult = useNB2Store((s) => s.result !== null)

  const handleNB2Regenerate = useCallback(
    (tab: string) => {
      const partType = TAB_TO_NB2_PART[tab]
      if (partType && nb2HasResult && nb2Prompt.trim()) {
        nb2Regenerate(partType)
      }
    },
    [nb2Regenerate, nb2HasResult, nb2Prompt],
  )

  // Auto-sync NB2 prompt editor to current right-panel tab when character-generator overlay is active
  useEffect(() => {
    if (activeCanvasOverlay !== 'character-generator') return
    const partType = TAB_TO_NB2_PART[rightPanelTab]
    if (partType) {
      useNB2Store.getState().setEditingPromptStep(partType)
    } else {
      useNB2Store.getState().setEditingPromptStep(null)
    }
  }, [activeCanvasOverlay, rightPanelTab])

  // Clear right-panel character cache when entering AI character generator
  useEffect(() => {
    if (activeCanvasOverlay === 'character-generator') {
      useSavedCharactersStore.getState().selectCharacter(null)
    }
  }, [activeCanvasOverlay])

  const multiCharacters = useMultiCharacterStore((s) => s.characters)
  const activeDialogueCharId = useMultiCharacterStore((s) => s.activeCharacterId)
  const activeDialogueChar = multiCharacters.find((c) => c.id === activeDialogueCharId)

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId)
  const selectedSavedCharacter = savedCharacters.find((c) => c.id === selectedSavedCharacterId)

  const handleAssetDetailOpen = (info: AssetDetailInfo) => {
    // Toggle - if same asset clicked again, close it
    if (openAssetDetail?.tab === info.tab && openAssetDetail?.index === info.index) {
      setOpenAssetDetail(null)
    } else {
      setOpenAssetDetail(info)
    }
  }

  const handleAssetDetailClose = () => {
    setOpenAssetDetail(null)
  }

  const handleLabelChange = (newLabel: string) => {
    if (openAssetDetail) {
      setSpriteLabel(openAssetDetail.tab, openAssetDetail.index, newLabel)
      // Update the local state to reflect the change
      setOpenAssetDetail({ ...openAssetDetail, label: newLabel })

      // Sync labels to the saved character so they persist across reloads
      const configLabels = useCharacterConfigStore.getState().spriteLabels
      const { activeCharacterId, characters: dialogueChars } = useMultiCharacterStore.getState()
      const savedCharId = activeCharacterId
        ? dialogueChars.find((c) => c.id === activeCharacterId)?.savedCharacterId
        : useSavedCharactersStore.getState().selectedCharacterId
      if (savedCharId) {
        useSavedCharactersStore.getState().updateCharacter(savedCharId, {
          spriteLabels: configLabels,
        })
      }
    }
  }

  const handleSpriteImageChange = (newImage: string) => {
    if (!openAssetDetail) return
    const { tab: assetTab, index: assetIndex } = openAssetDetail
    const currentImages = useCharacterConfigStore.getState().savedImages[assetTab]
    if (assetIndex < 0 || assetIndex >= currentImages.length) return
    const updated = [...currentImages]
    updated[assetIndex] = newImage
    useCharacterConfigStore.getState().setSavedImages(assetTab, updated)
    // Update local state so the panel preview reflects the change
    setOpenAssetDetail({ ...openAssetDetail, image: newImage })
  }

  // When rig-editor tabs are active, replace the entire right panel
  const isRigEditor = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor')
  const isRigEditor3D = useEditorStore((s) => s.leftPanelActiveTab === 'rig-editor-3d')

  if (isRigEditor) {
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <BRPropertiesPanel />
      </aside>
    )
  }

  if (isRigEditor3D) {
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden overflow-y-auto">
        <Rig3DPropertiesPanel />
      </aside>
    )
  }

  // When copilot is open, replace the right panel with the copilot chat
  if (copilotIsOpen) {
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <CopilotDrawer />
      </aside>
    )
  }

  // Motion Gallery Style Browser — takes over the entire right panel
  if (rightPanelTab === 'motion-gallery-styles') {
    return (
      <aside className="w-full md:w-[280px] flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <MotionStyleBrowser />
      </aside>
    )
  }

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
        {/* NB2 generation mode — prompt editor is the only content */}
        {isNB2Generating ? (
          <NB2PromptEditor />
        ) : (
          <>
            {rightPanelTab === 'group-properties' && <GroupTransformPanel />}

            {/* Eye Tab - Image Upload & Saved */}
            {rightPanelTab === 'eye' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Eye Sprites</h4>
                  {savedImages.eye.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('eye')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all eye sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="eye"
                  label="Eye Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('eye') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'eye-strip'}
                />
                <SavedImagesGrid
                  tab="eye"
                  label="Eyes"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'eye' ? openAssetDetail.index : null}
                />

                {/* Remove Background */}
                {savedImages.eye.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="eye"
                    count={savedImages.eye.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.eye.length > 0 && <SpriteVectorizeButton tab="eye" count={savedImages.eye.length} />}
              </div>
            )}

            {/* Eyebrow Tab - Image Upload & Saved */}
            {rightPanelTab === 'eyebrow' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Eyebrow Sprites</h4>
                  {savedImages.eyebrow.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('eyebrow')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all eyebrow sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="eyebrow"
                  label="Eyebrow Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('eyebrow') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'eyebrow-strip'}
                />
                <SavedImagesGrid
                  tab="eyebrow"
                  label="Eyebrows"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'eyebrow' ? openAssetDetail.index : null}
                />

                {/* Remove Background */}
                {savedImages.eyebrow.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="eyebrow"
                    count={savedImages.eyebrow.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.eyebrow.length > 0 && (
                  <SpriteVectorizeButton tab="eyebrow" count={savedImages.eyebrow.length} />
                )}
              </div>
            )}

            {/* Viseme Tab - Same layout as other tabs */}
            {rightPanelTab === 'viseme' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Viseme Sprites</h4>
                  {savedImages.viseme.length > 0 && (
                    <button
                      onClick={() => {
                        clearSavedImages('viseme')
                        if (useCurvedVisemes) {
                          useCharacterConfigStore.getState().clearCurvedVisemes()
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all viseme sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="viseme"
                  label="Viseme Sheet"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('viseme') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'viseme-sheet'}
                />
                <SavedImagesGrid
                  tab="viseme"
                  label="Visemes"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'viseme' ? openAssetDetail.index : null}
                />

                {/* Remove Background */}
                {savedImages.viseme.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="viseme"
                    count={savedImages.viseme.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.viseme.length > 0 && (
                  <SpriteVectorizeButton tab="viseme" count={savedImages.viseme.length} />
                )}
              </div>
            )}

            {/* Hair Tab - Image Upload & Saved */}
            {rightPanelTab === 'hair' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Hair Sprites</h4>
                  {savedImages.hair.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('hair')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all hair sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="hair"
                  label="Hair Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('hair') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'hair'}
                />
                <SavedImagesGrid
                  tab="hair"
                  label="Hair Styles"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'hair' ? openAssetDetail.index : null}
                />

                {/* Remove Background */}
                {savedImages.hair.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="hair"
                    count={savedImages.hair.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.hair.length > 0 && <SpriteVectorizeButton tab="hair" count={savedImages.hair.length} />}
              </div>
            )}

            {/* Head Tab - Image Upload & Saved */}
            {rightPanelTab === 'head' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Head Sprites</h4>
                  {savedImages.head.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('head')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all head sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="head"
                  label="Head Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('head') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'head'}
                />
                <SavedImagesGrid
                  tab="head"
                  label="Heads"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'head' ? openAssetDetail.index : null}
                />

                {/* Remove Background */}
                {savedImages.head.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="head"
                    count={savedImages.head.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.head.length > 0 && <SpriteVectorizeButton tab="head" count={savedImages.head.length} />}
              </div>
            )}

            {/* Body Tab - Image Upload & Saved */}
            {rightPanelTab === 'body' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Body Sprites</h4>
                  {savedImages.body.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('body')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all body sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="body"
                  label="Body Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('body') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'body'}
                />
                <SavedImagesGrid
                  tab="body"
                  label="Bodies"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'body' ? openAssetDetail.index : null}
                />

                {/* Remove Background */}
                {savedImages.body.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="body"
                    count={savedImages.body.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.body.length > 0 && <SpriteVectorizeButton tab="body" count={savedImages.body.length} />}
              </div>
            )}

            {/* Shirt Tab */}
            {rightPanelTab === 'shirt' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Shirt Sprites</h4>
                  {savedImages.shirt.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('shirt')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all shirt sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="shirt"
                  label="Shirt Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('shirt') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'clothing'}
                />
                <SavedImagesGrid
                  tab="shirt"
                  label="Shirts"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'shirt' ? openAssetDetail.index : null}
                />
                {savedImages.shirt.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="shirt"
                    count={savedImages.shirt.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.shirt.length > 0 && <SpriteVectorizeButton tab="shirt" count={savedImages.shirt.length} />}
              </div>
            )}

            {/* Pants Tab */}
            {rightPanelTab === 'pants' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Pants Sprites</h4>
                  {savedImages.pants.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('pants')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all pants sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="pants"
                  label="Pants Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('pants') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'clothing'}
                />
                <SavedImagesGrid
                  tab="pants"
                  label="Pants"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'pants' ? openAssetDetail.index : null}
                />
                {savedImages.pants.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="pants"
                    count={savedImages.pants.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.pants.length > 0 && <SpriteVectorizeButton tab="pants" count={savedImages.pants.length} />}
              </div>
            )}

            {/* Shoes Tab */}
            {rightPanelTab === 'shoes' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-300">Shoes Sprites</h4>
                  {savedImages.shoes.length > 0 && (
                    <button
                      onClick={() => clearSavedImages('shoes')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete all shoes sprites"
                    >
                      <Trash2 size={12} />
                      Clear All
                    </button>
                  )}
                </div>
                <ImageUploadArea
                  tab="shoes"
                  label="Shoes Image"
                  onRegenerate={nb2HasResult ? () => handleNB2Regenerate('shoes') : undefined}
                  isRegenerating={nb2RegeneratingStep === 'clothing'}
                />
                <SavedImagesGrid
                  tab="shoes"
                  label="Shoes"
                  onAssetDetailOpen={handleAssetDetailOpen}
                  openDetailIndex={openAssetDetail?.tab === 'shoes' ? openAssetDetail.index : null}
                />
                {savedImages.shoes.length > 0 && (
                  <SpriteRemoveBgButton
                    tab="shoes"
                    count={savedImages.shoes.length}
                    isProcessing={isSprBgRemoving}
                    currentIndex={sprBgIndex}
                    totalCount={sprBgTotal}
                    error={sprBgError}
                    onRemove={sprRemoveAllBgs}
                    recraftAvailable={recraftReady}
                  />
                )}

                {/* Vectorize to SVG */}
                {savedImages.shoes.length > 0 && <SpriteVectorizeButton tab="shoes" count={savedImages.shoes.length} />}
              </div>
            )}

            {/* Voices Tab */}
            {rightPanelTab === 'voices' && <VoicesPanel />}

            {/* Animations Tab */}
            {rightPanelTab === 'animations' && <AnimationsPanel />}

            {/* Style Tab (Boiling Line + Pixel Art) */}
            {rightPanelTab === 'style-properties' && <StylePanel />}

            {/* Media Properties Tab */}
            {rightPanelTab === 'media-properties' && <MediaPropertiesPanel />}

            {/* SVG Object Properties Tab */}
            {rightPanelTab === 'svg-object-properties' && <SVGObjectPropertiesPanel />}

            {/* Whiteboard Text Properties Tab */}
            {rightPanelTab === 'whiteboard-text-properties' && <WhiteboardTextPropertiesPanel />}

            {/* Whiteboard Drawing Properties Tab */}
            {rightPanelTab === 'whiteboard-drawing-properties' && <WhiteboardDrawingPropertiesPanel />}

            {/* Whiteboard Stroke Properties Tab (curve editor) */}
            {rightPanelTab === 'whiteboard-stroke-properties' && <WhiteboardStrokePropertiesPanel />}

            {/* Shape Properties Tab */}
            {rightPanelTab === 'shape-properties' && <ShapePropertiesPanel />}

            {/* Text Properties Tab */}
            {rightPanelTab === 'text-properties' && <TextPropertiesPanel />}

            {/* Text Styles Tab */}
            {rightPanelTab === 'text-styles' && <TextStylePresetsPanel />}

            {/* Text Animations Tab */}
            {rightPanelTab === 'text-animations' && <TextAnimationsPanel />}

            {/* Animation Properties Tab */}
            {rightPanelTab === 'animation-properties' && <AnimationPropertiesPanel />}

            {/* HTML Template Properties Tab */}
            {rightPanelTab === 'html-template-properties' && <HTMLTemplatePropertiesPanel />}

            {/* Motion Graphic Properties Tab */}
            {rightPanelTab === 'motion-graphic-properties' && <MotionGraphicPropertiesPanel />}

            {/* 3D Character Properties Tab */}
            {rightPanelTab === '3d-character-properties' && <Character3DPropertiesPanel />}

            {/* Avatar Character Properties Tab */}
            {rightPanelTab === 'avatar-character-properties' && <AvatarCharacterPropertiesPanel />}

            {/* Avatar Videos Tab */}
            {rightPanelTab === 'avatar-videos' && <AvatarVideosPanel />}

            {/* Avatar Voices Tab */}
            {rightPanelTab === 'avatar-voices' && <VoicesPanel />}

            {/* Pixel Art Character Properties Tab */}
            {rightPanelTab === 'pixelart-character-properties' && <PixelArtCharacterPropertiesPanel />}

            {/* Pixel Art Animations Tab */}
            {rightPanelTab === 'pixelart-animations' && <PixelArtAnimationsPanel />}

            {/* Art Curve Properties Tab */}
            {rightPanelTab === 'art-curve-properties' && <ArtCurvePropertiesPanel />}

            {/* Video Properties Tab */}
            {rightPanelTab === 'video-properties' && <VideoPropertiesPanel />}

            {/* Camera Properties Tab */}
            {rightPanelTab === 'camera-properties' && <CameraPropertiesPanel activeTab={cameraSubTab} />}

            {/* Whiteboard Background Properties Tab */}
            {BG_BG_TABS.has(rightPanelTab) && <WhiteboardBackgroundPropertiesPanel />}

            {/* Generate Tool Properties */}
            {rightPanelTab === 'gen-image-properties' && <GenImagePropertiesPanel />}
            {rightPanelTab === 'gen-text-to-video-properties' && <GenTextToVideoPropertiesPanel />}
            {rightPanelTab === 'gen-audio-to-video-properties' && <GenAudioToVideoPropertiesPanel />}
            {rightPanelTab === 'gen-video-to-video-properties' && <GenVideoToVideoPropertiesPanel />}
            {rightPanelTab === 'gen-retake-properties' && <GenRetakePropertiesPanel />}
            {rightPanelTab === 'gen-extend-properties' && <GenExtendPropertiesPanel />}
            {rightPanelTab === 'image-to-video-properties' && <ImageToVideoPropertiesPanel />}
            {rightPanelTab === 'broll-suggest-properties' && <BrollSuggestPropertiesPanel />}
            {rightPanelTab === 'gen-manim-properties' && <GenManimPropertiesPanel />}

            {/* Crowd Properties Tab */}
            {rightPanelTab === 'crowd-properties' && <CrowdPropertiesPanel />}
            {rightPanelTab === 'motion-gallery-styles' && <MotionStyleBrowser />}

            {/* Canvas Layers Tab */}
            {rightPanelTab === 'canvas-layers' && <LayersPanel />}

            {/* Brand Kit Properties Tab */}
            {rightPanelTab === 'brand-kit-properties' && <BrandKitPropertiesPanel activeTab={brandKitSubTab} />}

            {/* Beat Sync Section — shown for non-character property tabs */}
            {(rightPanelTab === 'media-properties' ||
              rightPanelTab === 'text-properties' ||
              rightPanelTab === 'text-styles' ||
              rightPanelTab === 'text-animations' ||
              rightPanelTab === 'shape-properties' ||
              rightPanelTab === 'svg-object-properties' ||
              rightPanelTab === 'animation-properties' ||
              rightPanelTab === 'html-template-properties' ||
              rightPanelTab === 'motion-graphic-properties' ||
              rightPanelTab === '3d-character-properties' ||
              rightPanelTab === 'pixelart-character-properties' ||
              rightPanelTab === 'avatar-character-properties' ||
              rightPanelTab === 'avatar-videos' ||
              rightPanelTab === 'avatar-voices' ||
              rightPanelTab === 'video-properties') && <BeatSyncSection />}
          </>
        )}
      </div>

      {/* Character bottom tabs — body parts, pinned to bottom (hidden during NB2 generation) */}
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

// ---------------------------------------------------------------------------
// Generate Tool Properties Panels
// ---------------------------------------------------------------------------

const ASPECT_OPTIONS = [
  { value: '1:1', label: '1:1' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
]

const DURATION_OPTIONS = [
  { value: '4', label: '4s' },
  { value: '6', label: '6s' },
  { value: '8', label: '8s' },
  { value: '10', label: '10s' },
]

const EXTEND_DURATION_OPTIONS = [
  { value: '2', label: '2s' },
  { value: '4', label: '4s' },
  { value: '6', label: '6s' },
]

const STYLE_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'anime', label: 'Anime' },
  { value: 'illustration', label: 'Illustration' },
  { value: '3d-render', label: '3D Render' },
]

const MOTION_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'dynamic', label: 'Dynamic' },
  { value: 'cinematic', label: 'Cinematic' },
]

function GenImagePropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [negPrompt, setNegPrompt] = useState('')
  const [aspect, setAspect] = useState('1:1')
  const [style, setStyle] = useState('auto')

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelTextarea
          label="Prompt"
          value={prompt}
          onChange={setPrompt}
          placeholder="Describe the image you want to generate..."
          rows={4}
        />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Style" value={style} onChange={setStyle} options={STYLE_OPTIONS} />
        <PanelTextarea
          label="Negative prompt"
          value={negPrompt}
          onChange={setNegPrompt}
          placeholder="What to avoid..."
          rows={2}
        />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}} disabled={!prompt.trim()}>
          Generate Image
        </PanelActionButton>
      </div>
    </div>
  )
}

function GenTextToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [duration, setDuration] = useState('4')
  const [motion, setMotion] = useState('auto')

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelTextarea
          label="Prompt"
          value={prompt}
          onChange={setPrompt}
          placeholder="Describe the video you want to generate..."
          rows={4}
        />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Duration" value={duration} onChange={setDuration} options={DURATION_OPTIONS} />
        <PanelSelect label="Motion" value={motion} onChange={setMotion} options={MOTION_OPTIONS} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}} disabled={!prompt.trim()}>
          Generate Video
        </PanelActionButton>
      </div>
    </div>
  )
}

function GenAudioToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [duration, setDuration] = useState('4')
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone
          icon={Upload}
          label="Upload audio file"
          sublabel="MP3, WAV, M4A"
          isDragging={isDragging}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        />
        <PanelTextarea
          label="Scene description"
          value={prompt}
          onChange={setPrompt}
          placeholder="Describe the visual scene..."
          rows={3}
        />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Duration" value={duration} onChange={setDuration} options={DURATION_OPTIONS} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>
          Generate Video
        </PanelActionButton>
      </div>
    </div>
  )
}

function GenVideoToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [strength, setStrength] = useState(0.5)
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone
          icon={FileVideo}
          label="Upload source video"
          sublabel="MP4, WebM, MOV"
          isDragging={isDragging}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        />
        <PanelTextarea
          label="Style / transform"
          value={prompt}
          onChange={setPrompt}
          placeholder="Describe the desired style or transformation..."
          rows={3}
        />
        <PanelSlider label="Strength" value={strength} onChange={setStrength} min={0} max={1} step={0.05} />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>
          Transform Video
        </PanelActionButton>
      </div>
    </div>
  )
}

function GenRetakePropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [seed, setSeed] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone
          icon={FileVideo}
          label="Upload reference video"
          sublabel="MP4, WebM, MOV — or select from timeline"
          isDragging={isDragging}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        />
        <PanelTextarea
          label="Adjustments"
          value={prompt}
          onChange={setPrompt}
          placeholder="Describe what to change..."
          rows={3}
        />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelInput label="Seed" value={seed} onChange={setSeed} placeholder="Random" />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>
          Retake Video
        </PanelActionButton>
      </div>
    </div>
  )
}

function GenExtendPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [extendDuration, setExtendDuration] = useState('4')
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelDropZone
          icon={FileVideo}
          label="Upload video to extend"
          sublabel="MP4, WebM, MOV — or select from timeline"
          isDragging={isDragging}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
        />
        <PanelSelect
          label="Add"
          value={extendDuration}
          onChange={setExtendDuration}
          options={EXTEND_DURATION_OPTIONS}
        />
        <PanelTextarea
          label="Continuation prompt"
          value={prompt}
          onChange={setPrompt}
          placeholder="Describe how the video should continue..."
          rows={3}
        />
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>
          Extend Video
        </PanelActionButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Manim Video Generator Properties Panel
// ---------------------------------------------------------------------------

const MANIM_DURATION_OPTIONS = [
  { value: '1', label: '1 min' },
  { value: '2', label: '2 min' },
  { value: '3', label: '3 min' },
  { value: '5', label: '5 min' },
]

const MANIM_DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const MANIM_QUALITY_OPTIONS = [
  { value: 'low', label: 'Draft' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const MANIM_STEP_LABELS: Record<string, string> = {
  'planning-script': 'Planning script',
  'decomposing-scenes': 'Decomposing scenes',
  'generating-code': 'Generating Manim code',
  rendering: 'Rendering scenes',
  narrating: 'Generating narration',
  assembling: 'Assembling video',
  completed: 'Completed',
  error: 'Failed',
}

function GenManimPropertiesPanel() {
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState('2')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [quality, setQuality] = useState('medium')
  const [aspect, setAspect] = useState('16:9')
  const [interactive, setInteractive] = useState(true)

  const step = useManimStore((s) => s.step)
  const stepProgress = useManimStore((s) => s.stepProgress)
  const error = useManimStore((s) => s.error)
  const currentSceneIndex = useManimStore((s) => s.currentSceneIndex)
  const sceneSpecs = useManimStore((s) => s.sceneSpecs)

  const isRunning = step !== 'idle' && step !== 'completed' && step !== 'error'
  const sceneCount = sceneSpecs?.length ?? 0

  const handleGenerate = useCallback(() => {
    import('@/services/manim/manimOrchestrator').then(({ runManimPipeline }) => {
      runManimPipeline({
        topic,
        targetDurationMinutes: Number(duration),
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        quality: quality as 'low' | 'medium' | 'high',
        enableInteractiveAnnotations: interactive,
        aspectRatio: aspect as '16:9' | '9:16' | '1:1',
      }).catch(() => {
        // Error is already written to the store by the orchestrator's catch block
      })
    })
  }, [topic, duration, difficulty, quality, interactive, aspect])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-3 space-y-1">
        <PanelTextarea
          label="Topic"
          value={topic}
          onChange={setTopic}
          placeholder="Explain eigenvalues and eigenvectors..."
          rows={3}
        />
        <PanelSelect label="Duration" value={duration} onChange={setDuration} options={MANIM_DURATION_OPTIONS} />
        <PanelSelect
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={MANIM_DIFFICULTY_OPTIONS}
        />
        <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
        <PanelSelect label="Render Quality" value={quality} onChange={setQuality} options={MANIM_QUALITY_OPTIONS} />
        <PanelToggle
          label="Interactive annotations"
          description="Enable pause-and-explain on playback"
          checked={interactive}
          onChange={setInteractive}
        />

        {/* Pipeline status */}
        {step !== 'idle' && (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              {isRunning && <Loader2 size={12} className="animate-spin text-[#4a7eff]" />}
              <span
                className={
                  step === 'error' ? 'text-red-400' : step === 'completed' ? 'text-green-400' : 'text-zinc-300'
                }
              >
                {MANIM_STEP_LABELS[step] ?? step}
                {isRunning &&
                sceneCount > 0 &&
                (step === 'generating-code' || step === 'rendering' || step === 'narrating')
                  ? ` (${currentSceneIndex + 1}/${sceneCount})`
                  : ''}
              </span>
            </div>
            {isRunning && (
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4a7eff] transition-all duration-300"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            )}
            {step === 'error' && error && (
              <p className="text-[11px] text-red-400/80 leading-tight line-clamp-3">{error}</p>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={handleGenerate} disabled={!topic.trim() || isRunning}>
          {isRunning ? 'Generating...' : 'Generate Manim Video'}
        </PanelActionButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Image-to-Video Properties Panel
// ---------------------------------------------------------------------------

function ImageToVideoPropertiesPanel() {
  const [prompt, setPrompt] = useState('')
  const [aspect, setAspect] = useState('16:9')
  const [duration, setDuration] = useState('4')
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <PanelSection title="Source Image" icon={Image}>
          <div className="space-y-3">
            <PanelDropZone
              icon={Upload}
              label="Upload source image"
              sublabel="PNG, JPG, WebP"
              isDragging={isDragging}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={() => setIsDragging(false)}
            />
            <PanelTextarea
              label="Motion prompt"
              value={prompt}
              onChange={setPrompt}
              placeholder="Describe how the image should animate..."
              rows={3}
            />
          </div>
        </PanelSection>
        <PanelSection title="Output" collapsible>
          <div className="space-y-3">
            <PanelSelect label="Aspect" value={aspect} onChange={setAspect} options={ASPECT_OPTIONS} />
            <PanelSelect label="Duration" value={duration} onChange={setDuration} options={DURATION_OPTIONS} />
          </div>
        </PanelSection>
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}}>
          Animate Image
        </PanelActionButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// B-Roll Suggest Properties Panel
// ---------------------------------------------------------------------------

function BrollSuggestPropertiesPanel() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <PanelSection title="B-Roll Search" icon={Film}>
          <div className="space-y-3">
            <PanelTextarea
              value={prompt}
              onChange={setPrompt}
              placeholder="Describe the scene or topic for B-roll suggestions..."
              rows={3}
            />
          </div>
        </PanelSection>
      </div>
      <div className="shrink-0 p-3 border-t border-white/5">
        <PanelActionButton variant="primary" fullWidth onClick={() => {}} disabled={!prompt.trim()}>
          Find B-Roll
        </PanelActionButton>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Media Properties Panel — shown when a canvas media item is selected
// Uses the same DraggableNumberInput controls as the character transform panel
// ---------------------------------------------------------------------------

function MediaPropertiesPanel() {
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const updateCanvasItem = useMediaStore((s) => s.updateCanvasItem)
  const removeFromCanvas = useMediaStore((s) => s.removeFromCanvas)
  // Subscribe to live transform for real-time updates during canvas manipulation
  const liveTransform = useLiveTransformStore((s) => s.active)

  // Color extraction and recoloring
  const { extractedColors, colorMap, isExtracting, isRecoloring, setColor, resetColor, resetAllColors, displayUrl } =
    useImageRecolor(selectedCanvasItemId)

  // Background removal
  const {
    isProcessing: isBgRemoving,
    progress: bgProgress,
    error: bgError,
    removeBackground: removeBg,
  } = useBackgroundRemoval()

  const item = canvasItems.find((c) => c.id === selectedCanvasItemId)
  const asset = item ? assets.find((a) => a.id === item.assetId) : null

  // Use live transform values when actively manipulating this item
  const isLiveActive = liveTransform?.type === 'media' && liveTransform?.id === item?.id
  const displayValues = useMemo(() => {
    if (!item) return null
    if (isLiveActive && liveTransform) {
      return {
        x: liveTransform.x,
        y: liveTransform.y,
        rotation: liveTransform.rotation,
        scale: liveTransform.scale,
        opacity: item.opacity,
        zIndex: item.zIndex,
      }
    }
    return {
      x: item.position.x,
      y: item.position.y,
      rotation: item.rotation,
      scale: item.scale,
      opacity: item.opacity,
      zIndex: item.zIndex,
    }
  }, [item, isLiveActive, liveTransform])

  if (!item || !asset || !displayValues) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Image size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No media selected</p>
        <p className="text-[10px] mt-1">Click a media item on the canvas to edit its properties</p>
      </div>
    )
  }

  const handleReset = () => {
    updateCanvasItem(item.id, {
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
    })
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header + Preview */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 bg-[#2a2a2a] rounded-lg overflow-hidden shrink-0 border border-white/10 relative">
          <img src={displayUrl || asset.url} alt={asset.name} className="w-full h-full object-contain" />
          {isRecoloring && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-blue-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{asset.name}</p>
          <p className="text-[10px] text-gray-500">
            {asset.width && asset.height ? `${asset.width} × ${asset.height}` : asset.type}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => updateCanvasItem(item.id, { visible: !item.visible })}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              item.visible
                ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]'
                : 'text-gray-600 hover:text-gray-400 hover:bg-[#3a3a3a]',
            )}
            title={item.visible ? 'Hide' : 'Show'}
          >
            {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#3a3a3a] transition-colors"
            title="Reset transform"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Transform Controls */}
      <div className={cn('space-y-2', !item.visible && 'opacity-50 pointer-events-none')}>
        {/* Position */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Position</span>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <DraggableNumberInput
              label="X"
              value={displayValues.x}
              onChange={(v) => {
                updateCanvasItem(item.id, { position: { ...item.position, x: v } })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'position.x', v, item.position.x)
              }}
              step={1}
              precision={1}
              inline
            />
            <DraggableNumberInput
              label="Y"
              value={displayValues.y}
              onChange={(v) => {
                updateCanvasItem(item.id, { position: { ...item.position, y: v } })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'position.y', v, item.position.y)
              }}
              step={1}
              precision={1}
              inline
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Rotation</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="°"
              value={displayValues.rotation}
              onChange={(v) => {
                updateCanvasItem(item.id, { rotation: v })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'rotation', v, item.rotation)
              }}
              min={-180}
              max={180}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>

        {/* Scale */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Scale</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="%"
              value={displayValues.scale * 100}
              onChange={(v) => {
                updateCanvasItem(item.id, { scale: v / 100 })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'scale', v / 100, item.scale)
              }}
              min={5}
              max={500}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Opacity</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="%"
              value={displayValues.opacity * 100}
              onChange={(v) => {
                const val = Math.min(1, Math.max(0, v / 100))
                updateCanvasItem(item.id, { opacity: val })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'opacity', val, item.opacity)
              }}
              min={0}
              max={100}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>

        {/* Z-Index */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Z-Index</span>
          <div className="flex-1">
            <DraggableNumberInput
              label=""
              value={displayValues.zIndex}
              onChange={(v) => {
                const val = Math.round(v)
                updateCanvasItem(item.id, { zIndex: val })
                recordPropertyChange({ objectType: 'media', objectId: item.id }, 'zIndex', val, item.zIndex)
              }}
              min={-100}
              max={100}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>
      </div>

      {/* Colors Section */}
      {asset.category === 'images' && (
        <div className="pt-3 border-t border-white/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Colors</span>
            <div className="flex items-center gap-1.5">
              {isExtracting && <Loader2 size={10} className="animate-spin text-gray-500" />}
              {extractedColors && Object.keys(colorMap).length > 0 && (
                <button
                  onClick={resetAllColors}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#3a3a3a] transition-colors"
                  title="Reset all colors to original"
                >
                  <RotateCcw size={10} />
                </button>
              )}
            </div>
          </div>

          {isExtracting && <p className="text-[10px] text-gray-500 text-center">Analyzing colors...</p>}
          {!isExtracting && extractedColors && extractedColors.length === 0 && (
            <p className="text-[10px] text-gray-500 text-center">No colors detected</p>
          )}
          {extractedColors &&
            extractedColors.map((ec, i) => {
              const currentHex = colorMap[ec.hex] || ec.hex
              const isModified = colorMap[ec.hex] !== undefined
              return (
                <div key={`${ec.hex}-${i}`} className="flex items-center gap-2">
                  <ColorPicker color={currentHex} onChange={(c) => setColor(ec.hex, c)} />
                  <span className={cn('text-xs flex-1 truncate', isModified ? 'text-white' : 'text-gray-400')}>
                    Color {i + 1}
                  </span>
                  <span className="text-[10px] text-gray-600">{ec.percentage}%</span>
                  <span className="text-[10px] text-gray-500 font-mono">{currentHex}</span>
                  {isModified && (
                    <button
                      onClick={() => resetColor(ec.hex)}
                      className="p-0.5 rounded text-gray-600 hover:text-gray-400 transition-colors"
                      title={`Reset to ${ec.hex}`}
                    >
                      <RotateCcw size={10} />
                    </button>
                  )}
                </div>
              )
            })}
        </div>
      )}

      {/* Background Removal Section */}
      {asset.category === 'images' && (
        <div className="pt-3 border-t border-white/5 space-y-2.5">
          <span className="text-sm text-gray-400">Background</span>
          <button
            onClick={async () => {
              if (!asset || !item) return
              const newAssetId = await removeBg(asset.id)
              if (newAssetId) {
                updateCanvasItem(item.id, { assetId: newAssetId })
              }
            }}
            disabled={isBgRemoving}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isBgRemoving
                ? 'bg-[#2a2a2a] text-gray-300 cursor-wait'
                : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a]',
            )}
          >
            {isBgRemoving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {bgProgress?.phase === 'downloading'
                  ? `Downloading model... ${Math.round((bgProgress.progress || 0) * 100)}%`
                  : `Removing background... ${Math.round((bgProgress?.progress || 0) * 100)}%`}
              </>
            ) : (
              <>
                <Eraser size={14} />
                Remove Background
              </>
            )}
          </button>
          {isBgRemoving && bgProgress && (
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.round(bgProgress.progress * 100)}%` }}
              />
            </div>
          )}
          {bgError && <p className="text-[10px] text-red-400">{bgError}</p>}
          <p className="text-[10px] text-gray-600">Creates a new transparent PNG in your media library.</p>
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={() => removeFromCanvas(item.id)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-[#2a2a2a] text-red-400 hover:bg-red-600/20 transition-colors"
        title="Remove from canvas"
      >
        <Trash2 size={12} />
        Remove from Canvas
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SVG Object Properties Panel — shown when an SVG object is selected in the
// timeline or canvas. Provides color pickers, opacity, z-index, visibility,
// and reset/remove controls for each decomposed SVG animation object.
// ---------------------------------------------------------------------------

/** Color palette matching the SVGObjectTrack for header dot consistency */
const SVG_OBJECT_COLORS = ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#f472b6', '#fb923c', '#22d3ee', '#c084fc']

function SVGObjectPropertiesPanel() {
  const composition = useSVGObjectStore((s) => s.composition)
  const selectedObjectId = useSVGObjectStore((s) => s.selectedObjectId)
  const setObjectColor = useSVGObjectStore((s) => s.setObjectColor)
  const resetObjectColors = useSVGObjectStore((s) => s.resetObjectColors)
  const toggleObjectVisibility = useSVGObjectStore((s) => s.toggleObjectVisibility)
  const setObjectOpacity = useSVGObjectStore((s) => s.setObjectOpacity)
  const setObjectZIndex = useSVGObjectStore((s) => s.setObjectZIndex)
  const removeObject = useSVGObjectStore((s) => s.removeObject)
  const selectObject = useSVGObjectStore((s) => s.selectObject)
  const updateObject = useSVGObjectStore((s) => s.updateObject)

  if (!composition || composition.objects.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Palette size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No SVG composition</p>
        <p className="text-[10px] mt-1">Use "Generate Editable" in the AI Animation panel</p>
      </div>
    )
  }

  const obj = composition.objects.find((o) => o.id === selectedObjectId)

  if (!obj) {
    return (
      <div className="p-4 space-y-3">
        <div className="text-center text-zinc-500 mb-3">
          <Palette size={20} className="mx-auto mb-1.5 opacity-50" />
          <p className="text-xs">Select an object</p>
          <p className="text-[10px] mt-0.5">Click a track in the timeline to edit</p>
        </div>

        {/* Object List */}
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Objects</span>
          {composition.objects.map((o, index) => {
            const dotColor = SVG_OBJECT_COLORS[index % SVG_OBJECT_COLORS.length]
            return (
              <button
                key={o.id}
                onClick={() => selectObject(o.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-left"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                <span className={cn('text-xs truncate', o.visible ? 'text-zinc-300' : 'text-zinc-600')}>{o.name}</span>
                {!o.visible && <span className="text-[8px] text-zinc-600 ml-auto">hidden</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const objIndex = composition.objects.findIndex((o) => o.id === obj.id)
  const dotColor = SVG_OBJECT_COLORS[objIndex % SVG_OBJECT_COLORS.length]
  const colorEntries = Object.entries(obj.colors)

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        <span className="text-sm font-medium text-zinc-200 truncate">{obj.name}</span>
      </div>

      {/* Color Pickers */}
      {colorEntries.length > 0 && (
        <div className="border border-white/5 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-zinc-400" />
              <span className="text-xs text-zinc-300">Colors</span>
            </div>
            <button
              onClick={() => resetObjectColors(obj.id)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset all colors to defaults"
            >
              <RotateCcw size={10} />
            </button>
          </div>

          <div className="p-3 space-y-2.5 bg-[#1e1e1e]">
            {colorEntries.map(([key, value]) => {
              const isModified = value !== obj.defaultColors[key]
              return (
                <div key={key} className="flex items-center gap-2">
                  {/* Color swatch + picker */}
                  <ColorPicker color={value} onChange={(c) => setObjectColor(obj.id, key, c)} />
                  {/* Label */}
                  <span className={cn('text-xs flex-1 truncate', isModified ? 'text-zinc-200' : 'text-zinc-400')}>
                    {key}
                  </span>
                  {/* Hex value */}
                  <span className="text-[10px] text-zinc-500 font-mono">{value}</span>
                  {/* Reset single */}
                  {isModified && (
                    <button
                      onClick={() => setObjectColor(obj.id, key, obj.defaultColors[key])}
                      className="p-0.5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
                      title={`Reset to ${obj.defaultColors[key]}`}
                    >
                      <RotateCcw size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Opacity + Z-Index + Visibility */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#2a2a2a]">
          <span className="text-xs text-zinc-300">Properties</span>
          <button
            onClick={() => toggleObjectVisibility(obj.id)}
            className={cn(
              'p-1 rounded transition-colors',
              obj.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400',
            )}
            title={obj.visible ? 'Hide' : 'Show'}
          >
            {obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>

        <div className={cn('p-3 space-y-3 bg-[#1e1e1e]', !obj.visible && 'opacity-50 pointer-events-none')}>
          {/* Opacity */}
          <DraggableNumberInput
            label="Opacity"
            value={obj.opacity * 100}
            onChange={(v) => setObjectOpacity(obj.id, Math.min(1, Math.max(0, v / 100)))}
            min={0}
            max={100}
            step={1}
            unit="%"
            precision={0}
          />

          {/* Z-Index */}
          <DraggableNumberInput
            label="Z-Index"
            value={obj.zIndex}
            onChange={(v) => setObjectZIndex(obj.id, Math.round(v))}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />
        </div>
      </div>

      {/* Boiling Line (hand-drawn sketch effect) */}
      <BoilingLineSection
        settings={obj.boilingLine}
        onChange={(settings) => updateObject(obj.id, { boilingLine: settings })}
      />

      {/* Pixel Art (retro pixelation effect) */}
      <PixelArtEffectSection
        settings={obj.pixelArt}
        onChange={(settings) => updateObject(obj.id, { pixelArt: settings })}
      />

      {/* Remove Button */}
      <button
        onClick={() => {
          removeObject(obj.id)
          selectObject(null)
        }}
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
        title="Remove this object"
      >
        <Trash2 size={12} />
        Remove Object
      </button>

      {/* Other Objects Quick Select */}
      {composition.objects.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Objects</span>
          {composition.objects
            .filter((o) => o.id !== obj.id)
            .map((o, i) => {
              const oIdx = composition.objects.findIndex((x) => x.id === o.id)
              const oColor = SVG_OBJECT_COLORS[oIdx % SVG_OBJECT_COLORS.length]
              return (
                <button
                  key={o.id + i}
                  onClick={() => selectObject(o.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-left"
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: oColor }} />
                  <span className={cn('text-xs truncate', o.visible ? 'text-zinc-300' : 'text-zinc-600')}>
                    {o.name}
                  </span>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shape Properties Panel — shown when a canvas shape is selected.
// Provides transform controls, fill/stroke, opacity, and shape-specific
// settings (corner radius for rectangles, points/inner radius for stars).
// ---------------------------------------------------------------------------

const SHAPE_TYPE_LABELS: Record<string, string> = {
  rectangle: 'Rectangle',
  circle: 'Circle',
  triangle: 'Triangle',
  star: 'Star',
}

function ShapePropertiesPanel() {
  const selectedShapeId = useShapeStore((s) => s.selectedShapeId)
  const shapes = useShapeStore((s) => s.shapes)
  const updateShape = useShapeStore((s) => s.updateShape)
  const removeShape = useShapeStore((s) => s.removeShape)
  const duplicateShape = useShapeStore((s) => s.duplicateShape)
  const setSelectedShapeId = useShapeStore((s) => s.setSelectedShapeId)

  const liveTransform = useLiveTransformStore((s) => s.active)

  const shape = shapes.find((s) => s.id === selectedShapeId)

  // Use live transform values when actively manipulating
  const isLiveActive = liveTransform?.type === 'shape' && liveTransform?.id === shape?.id
  const displayValues = useMemo(() => {
    if (!shape) return null
    if (isLiveActive && liveTransform) {
      return {
        x: liveTransform.x,
        y: liveTransform.y,
        rotation: liveTransform.rotation,
        width: shape.width * (liveTransform.scale ?? 1),
        height: shape.height * (liveTransform.scale ?? 1),
        opacity: shape.opacity,
        zIndex: shape.zIndex,
      }
    }
    return {
      x: shape.position.x,
      y: shape.position.y,
      rotation: shape.rotation,
      width: shape.width,
      height: shape.height,
      opacity: shape.opacity,
      zIndex: shape.zIndex,
    }
  }, [shape, isLiveActive, liveTransform])

  if (!shape || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Square size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No shape selected</p>
        <p className="text-[10px] mt-1">Click a shape on the canvas or add one from the Media panel</p>
      </div>
    )
  }

  const handleReset = () => {
    updateShape(shape.id, {
      position: { x: 100, y: 100 },
      rotation: 0,
      opacity: 1,
      zIndex: 6,
    })
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Shape Preview */}
        <div className="w-14 h-14 bg-[#2a2a2a] rounded-lg overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
            {shape.type === 'rectangle' && (
              <rect
                x="4"
                y="6"
                width="28"
                height="24"
                rx={Math.min(shape.borderRadius ?? 0, 6)}
                fill={resolveFillString(shape.fill)}
                stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'}
                strokeWidth={Math.min(shape.strokeWidth, 2)}
              />
            )}
            {shape.type === 'circle' && (
              <ellipse
                cx="18"
                cy="18"
                rx="14"
                ry="14"
                fill={resolveFillString(shape.fill)}
                stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'}
                strokeWidth={Math.min(shape.strokeWidth, 2)}
              />
            )}
            {shape.type === 'triangle' && (
              <polygon
                points="18,4 34,32 2,32"
                fill={resolveFillString(shape.fill)}
                stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'}
                strokeWidth={Math.min(shape.strokeWidth, 2)}
                strokeLinejoin="round"
              />
            )}
            {shape.type === 'star' &&
              (() => {
                const cx = 18,
                  cy = 18,
                  outerR = 14
                const innerR = outerR * (shape.innerRadius ?? 0.4)
                const numPts = shape.points ?? 5
                const pts: string[] = []
                for (let i = 0; i < numPts * 2; i++) {
                  const angle = (Math.PI * i) / numPts - Math.PI / 2
                  const r = i % 2 === 0 ? outerR : innerR
                  pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
                }
                return (
                  <polygon
                    points={pts.join(' ')}
                    fill={resolveFillString(shape.fill)}
                    stroke={shape.stroke !== 'transparent' ? shape.stroke : 'none'}
                    strokeWidth={Math.min(shape.strokeWidth, 2)}
                    strokeLinejoin="round"
                  />
                )
              })()}
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 truncate">{shape.name}</p>
          <p className="text-[10px] text-zinc-500">{SHAPE_TYPE_LABELS[shape.type] || shape.type}</p>
          <p className="text-[10px] text-zinc-600">
            {Math.round(shape.width)} × {Math.round(shape.height)}
          </p>
        </div>
      </div>

      {/* Transform Section */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div
              className={cn('w-2 h-2 rounded-full', isLiveActive ? 'bg-[#4a7eff] animate-pulse' : 'bg-[#4a7eff]/50')}
            />
            <span className="text-sm text-zinc-300">Transform</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateShape(shape.id, { visible: !shape.visible })}
              className={cn(
                'p-1 rounded transition-colors',
                shape.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400',
              )}
              title={shape.visible ? 'Hide' : 'Show'}
            >
              {shape.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={handleReset}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset transform"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <div className={cn('p-3 space-y-3 bg-[#1e1e1e]', !shape.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Position</span>
            <div className="grid grid-cols-2 gap-2">
              <DraggableNumberInput
                label="X"
                value={displayValues.x}
                onChange={(v) => {
                  updateShape(shape.id, { position: { ...shape.position, x: v } })
                  recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'x', v, shape.position.x)
                }}
                step={1}
                precision={1}
              />
              <DraggableNumberInput
                label="Y"
                value={displayValues.y}
                onChange={(v) => {
                  updateShape(shape.id, { position: { ...shape.position, y: v } })
                  recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'y', v, shape.position.y)
                }}
                step={1}
                precision={1}
              />
            </div>
          </div>

          {/* Size */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Size</span>
            <div className="grid grid-cols-2 gap-2">
              <DraggableNumberInput
                label="W"
                value={displayValues.width}
                onChange={(v) => {
                  const val = Math.max(10, v)
                  updateShape(shape.id, { width: val })
                  recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'width', val, shape.width)
                }}
                min={10}
                step={1}
                precision={0}
              />
              <DraggableNumberInput
                label="H"
                value={displayValues.height}
                onChange={(v) => {
                  const val = Math.max(10, v)
                  updateShape(shape.id, { height: val })
                  recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'height', val, shape.height)
                }}
                min={10}
                step={1}
                precision={0}
              />
            </div>
          </div>

          {/* Rotation */}
          <DraggableNumberInput
            label="Rotation"
            value={displayValues.rotation}
            onChange={(v) => {
              updateShape(shape.id, { rotation: v })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'rotation', v, shape.rotation)
            }}
            min={-180}
            max={180}
            step={1}
            unit="°"
            precision={0}
          />

          {/* Opacity */}
          <DraggableNumberInput
            label="Opacity"
            value={displayValues.opacity * 100}
            onChange={(v) => {
              const val = Math.min(1, Math.max(0, v / 100))
              updateShape(shape.id, { opacity: val })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'opacity', val, shape.opacity)
            }}
            min={0}
            max={100}
            step={1}
            unit="%"
            precision={0}
          />

          {/* Z-Index */}
          <DraggableNumberInput
            label="Z-Index"
            value={displayValues.zIndex}
            onChange={(v) => {
              const val = Math.round(v)
              updateShape(shape.id, { zIndex: val })
              recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'zIndex', val, shape.zIndex)
            }}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />
        </div>
      </div>

      {/* Appearance Section */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Palette size={12} className="text-zinc-400" />
            <span className="text-xs text-zinc-300">Appearance</span>
          </div>
        </div>

        <div className="p-3 space-y-3 bg-[#1e1e1e]">
          {/* Fill Color */}
          <div className="flex items-center gap-2">
            <ColorPicker color={resolveFillString(shape.fill)} onChange={(c) => updateShape(shape.id, { fill: c })} />
            <span className="text-xs text-zinc-400 flex-1">Fill</span>
            <span className="text-[10px] text-zinc-500 font-mono">{resolveFillString(shape.fill)}</span>
          </div>

          {/* Stroke Color */}
          <div className="flex items-center gap-2">
            <ColorPicker
              color={shape.stroke === 'transparent' ? '#000000' : shape.stroke}
              onChange={(c) => updateShape(shape.id, { stroke: c, strokeWidth: Math.max(shape.strokeWidth, 1) })}
            />
            <span className="text-xs text-zinc-400 flex-1">Stroke</span>
            {shape.stroke !== 'transparent' && (
              <button
                onClick={() => updateShape(shape.id, { stroke: 'transparent', strokeWidth: 0 })}
                className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                title="Remove stroke"
              >
                none
              </button>
            )}
            <span className="text-[10px] text-zinc-500 font-mono">
              {shape.stroke === 'transparent' ? 'none' : shape.stroke}
            </span>
          </div>

          {/* Stroke Width */}
          {shape.stroke !== 'transparent' && (
            <DraggableNumberInput
              label="Stroke Width"
              value={shape.strokeWidth}
              onChange={(v) => {
                const val = Math.max(0, v)
                updateShape(shape.id, { strokeWidth: val })
                recordPropertyChange({ objectType: 'shape', objectId: shape.id }, 'strokeWidth', val, shape.strokeWidth)
              }}
              min={0}
              max={50}
              step={1}
              unit="px"
              precision={0}
            />
          )}

          {/* Rectangle: Corner Radius */}
          {shape.type === 'rectangle' && (
            <DraggableNumberInput
              label="Corner Radius"
              value={shape.borderRadius ?? 0}
              onChange={(v) => {
                const val = Math.max(0, v)
                updateShape(shape.id, { borderRadius: val })
                recordPropertyChange(
                  { objectType: 'shape', objectId: shape.id },
                  'borderRadius',
                  val,
                  shape.borderRadius ?? 0,
                )
              }}
              min={0}
              max={Math.min(shape.width, shape.height) / 2}
              step={1}
              unit="px"
              precision={0}
            />
          )}

          {/* Star: Points */}
          {shape.type === 'star' && (
            <>
              <DraggableNumberInput
                label="Points"
                value={shape.points ?? 5}
                onChange={(v) => updateShape(shape.id, { points: Math.max(3, Math.min(12, Math.round(v))) })}
                min={3}
                max={12}
                step={1}
                precision={0}
              />
              <DraggableNumberInput
                label="Inner Radius"
                value={(shape.innerRadius ?? 0.4) * 100}
                onChange={(v) => {
                  const val = Math.min(0.9, Math.max(0.1, v / 100))
                  updateShape(shape.id, { innerRadius: val })
                  recordPropertyChange(
                    { objectType: 'shape', objectId: shape.id },
                    'innerRadius',
                    val,
                    shape.innerRadius ?? 0.4,
                  )
                }}
                min={10}
                max={90}
                step={5}
                unit="%"
                precision={0}
              />
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => duplicateShape(shape.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-[#2a2a2a] text-zinc-300 hover:bg-[#3a3a3a] transition-colors"
          title="Duplicate shape"
        >
          <Copy size={12} />
          Duplicate
        </button>
        <button
          onClick={() => {
            removeShape(shape.id)
            setSelectedShapeId(null)
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
          title="Remove shape"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>

      {/* Other Shapes Quick Select */}
      {shapes.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Shapes</span>
          {shapes
            .filter((s) => s.id !== shape.id)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShapeId(s.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-left"
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: resolveFillString(s.fill) }}
                />
                <span className={cn('text-xs truncate', s.visible ? 'text-zinc-300' : 'text-zinc-600')}>{s.name}</span>
                {!s.visible && <span className="text-[8px] text-zinc-600 ml-auto">hidden</span>}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Text Properties Panel — shown when a text overlay is selected.
// Uses left-panel styling: #2a2a2a inputs, slider rows, toggle groups.
// ---------------------------------------------------------------------------

const RP_FONTS: { value: string; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Ubuntu', label: 'Ubuntu' },
  { value: 'PT Sans', label: 'PT Sans' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Comfortaa', label: 'Comfortaa' },
  { value: 'Fredoka', label: 'Fredoka' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Abril Fatface', label: 'Abril Fatface' },
  { value: 'Space Mono', label: 'Space Mono' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Archivo Black', label: 'Archivo Black' },
  { value: 'Alfa Slab One', label: 'Alfa Slab One' },
  { value: 'Bangers', label: 'Bangers' },
  { value: 'Righteous', label: 'Righteous' },
  { value: 'Permanent Marker', label: 'Permanent Marker' },
  { value: 'Pacifico', label: 'Pacifico' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Caveat', label: 'Caveat' },
]

const RP_WEIGHTS = [
  { value: 'normal', label: 'Regular' },
  { value: 'medium', label: 'Medium' },
  { value: 'semibold', label: 'Semibold' },
  { value: 'bold', label: 'Bold' },
  { value: 'black', label: 'Black' },
]

/* ── Custom dropdown (replaces native <select>) ── */
function CustomDropdown<T extends string>({
  value,
  options,
  onChange,
  renderOption,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  renderOption?: (opt: { value: T; label: string }, selected: boolean) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const selected = options.find((o) => o.value === value)

  // Position the portal dropdown relative to the button
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const dropUp = spaceBelow < 220 && rect.top > spaceBelow

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      ...(dropUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    })
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Reposition dropdown on ancestor scroll so it stays anchored
  useEffect(() => {
    if (!open || !buttonRef.current) return
    const handler = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return
      const rect = buttonRef.current!.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropUp = spaceBelow < 220 && rect.top > spaceBelow
      setDropdownStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        ...(dropUp
          ? { bottom: window.innerHeight - rect.top + 4, top: undefined }
          : { top: rect.bottom + 4, bottom: undefined }),
      })
    }
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [open])

  // Scroll active item into view when opened
  useEffect(() => {
    if (open && listRef.current) {
      const active = listRef.current.querySelector('[data-active="true"]')
      active?.scrollIntoView({ block: 'nearest' })
    }
  }, [open])

  return (
    <div ref={ref} className="relative flex-1">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
          'bg-[#2a2a2a] text-white hover:bg-[#333]',
          open && 'ring-1 ring-[#4a7eff]',
        )}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          className={cn('text-gray-500 shrink-0 ml-2 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={listRef}
            style={dropdownStyle}
            className="z-[9999] max-h-52 overflow-y-auto rounded-lg bg-[#1e1e1e] border border-[#3a3a3a] shadow-xl py-1"
          >
            {options.map((opt) => {
              const isActive = opt.value === value
              return (
                <button
                  key={opt.value}
                  data-active={isActive}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm transition-colors',
                    isActive ? 'bg-[#4a7eff]/20 text-white' : 'text-gray-300 hover:bg-[#2a2a2a] hover:text-white',
                  )}
                >
                  {renderOption ? renderOption(opt, isActive) : opt.label}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}

function TextPropertiesPanel() {
  const overlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const removeOverlay = useTextOverlayStore((s) => s.removeOverlay)
  const duplicateOverlay = useTextOverlayStore((s) => s.duplicateOverlay)
  const setSelectedId = useTextOverlayStore((s) => s.setSelectedId)

  const liveTransform = useLiveTransformStore((s) => s.active)

  const brandKits = useBrandKitStore((s) => s.brandKits)
  const activeBrandKitId = useBrandKitStore((s) => s.activeBrandKitId)
  const setActiveBrandKit = useBrandKitStore((s) => s.setActiveBrandKit)
  const fetchBrandKits = useBrandKitStore((s) => s.fetchBrandKits)
  const setLeftTab = useEditorStore((s) => s.setLeftPanelActiveTab)

  // Load brand kits from localStorage on mount
  useEffect(() => {
    fetchBrandKits()
  }, [fetchBrandKits])

  const isLiveActive = liveTransform?.type === 'text' && liveTransform?.id === overlay?.id
  const displayValues = useMemo(() => {
    if (!overlay) return null
    if (isLiveActive && liveTransform) {
      return {
        freeX: liveTransform.x,
        freeY: liveTransform.y,
        rotation: liveTransform.rotation,
        opacity: overlay.opacity,
        zIndex: overlay.zIndex,
      }
    }
    return {
      freeX: overlay.freeX,
      freeY: overlay.freeY,
      rotation: overlay.rotation,
      opacity: overlay.opacity,
      zIndex: overlay.zIndex,
    }
  }, [overlay, isLiveActive, liveTransform])

  if (!overlay || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Type size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No text selected</p>
        <p className="text-[10px] mt-1">Click a text overlay on the canvas to edit</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Text ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Text</h2>

        {/* Content */}
        <div className="mb-3">
          <span className="text-gray-400 text-sm mb-1 block">Content</span>
          <textarea
            value={overlay.content}
            onChange={(e) => updateOverlay(overlay.id, { content: e.target.value })}
            rows={3}
            className="w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
          />
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Font Size</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="px"
              value={overlay.fontSize}
              onChange={(v) => {
                updateOverlay(overlay.id, { fontSize: v })
                recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'fontSize', v, overlay.fontSize)
              }}
              min={8}
              max={400}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>

        {/* Line Height */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Line Height</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="×"
              value={overlay.lineHeight}
              onChange={(v) => {
                updateOverlay(overlay.id, { lineHeight: v })
                recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'lineHeight', v, overlay.lineHeight)
              }}
              min={0.5}
              max={3}
              step={0.1}
              precision={1}
              inline
            />
          </div>
        </div>

        {/* Letter Spacing */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Spacing</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="px"
              value={overlay.letterSpacing}
              onChange={(v) => {
                updateOverlay(overlay.id, { letterSpacing: v })
                recordPropertyChange(
                  { objectType: 'text', objectId: overlay.id },
                  'letterSpacing',
                  v,
                  overlay.letterSpacing,
                )
              }}
              min={-5}
              max={20}
              step={0.5}
              precision={1}
              inline
            />
          </div>
        </div>

        {/* Font Family */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Font</span>
          <CustomDropdown
            value={overlay.fontFamily}
            options={RP_FONTS}
            onChange={(v) => updateOverlay(overlay.id, { fontFamily: v as any })}
            renderOption={(opt) => <span style={{ fontFamily: `"${opt.value}", sans-serif` }}>{opt.label}</span>}
          />
        </div>

        {/* Font Weight */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Weight</span>
          <CustomDropdown
            value={overlay.fontWeight}
            options={RP_WEIGHTS}
            onChange={(v) => updateOverlay(overlay.id, { fontWeight: v as any })}
          />
        </div>

        {/* Horizontal Alignment */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Align</span>
          <div className="flex-1 flex gap-1">
            {[
              { value: 'left' as const, Icon: AlignLeft, title: 'Left' },
              { value: 'center' as const, Icon: AlignCenter, title: 'Center' },
              { value: 'right' as const, Icon: AlignRight, title: 'Right' },
              { value: 'justify' as const, Icon: AlignJustify, title: 'Justify' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateOverlay(overlay.id, { align: opt.value })}
                title={opt.title}
                className={cn(
                  'flex-1 h-8 rounded-lg flex items-center justify-center transition-colors',
                  overlay.align === opt.value
                    ? 'bg-[#4a7eff] text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white',
                )}
              >
                <opt.Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Alignment */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Vertical</span>
          <div className="flex-1 flex gap-1">
            {[
              { value: 'top' as const, Icon: ArrowUp, title: 'Top' },
              { value: 'middle' as const, Icon: Minus, title: 'Middle' },
              { value: 'bottom' as const, Icon: ArrowDown, title: 'Bottom' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  const posMap = { top: 'top', middle: 'center', bottom: 'bottom' } as const
                  updateOverlay(overlay.id, { verticalAlign: opt.value, position: posMap[opt.value] })
                }}
                title={opt.title}
                className={cn(
                  'flex-1 h-8 rounded-lg flex items-center justify-center transition-colors',
                  overlay.verticalAlign === opt.value
                    ? 'bg-[#4a7eff] text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white',
                )}
              >
                <opt.Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Text Case */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Case</span>
          <div className="flex-1 flex gap-1">
            {[
              { value: 'none' as const, label: 'Aa', title: 'As Typed' },
              { value: 'uppercase' as const, label: 'AA', title: 'Uppercase' },
              { value: 'lowercase' as const, label: 'aa', title: 'Lowercase' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateOverlay(overlay.id, { textCase: opt.value })}
                title={opt.title}
                className={cn(
                  'flex-1 h-8 rounded-lg flex items-center justify-center transition-colors text-xs font-medium',
                  overlay.textCase === opt.value
                    ? 'bg-[#4a7eff] text-white'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Style ─────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Style</h2>

        {/* Color — picker on left, brand theme dropdown fills right */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 w-20 shrink-0">
            <span className="text-gray-400 text-sm shrink-0">Color</span>
            <ColorPicker color={overlay.color} onChange={(c) => updateOverlay(overlay.id, { color: c })} />
          </div>
          <CustomDropdown
            value={activeBrandKitId ?? '__none__'}
            options={[
              { value: '__none__' as string, label: 'No Theme' },
              ...brandKits.map((k) => ({ value: k.id, label: k.name })),
              { value: '__create__' as string, label: '+ Create Theme' },
            ]}
            onChange={(v) => {
              if (v === '__create__') {
                setLeftTab('brand-kit')
                return
              }
              setActiveBrandKit(v === '__none__' ? null : v)
            }}
          />
        </div>

        {/* Opacity */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Opacity</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="%"
              value={Math.round(displayValues.opacity * 100)}
              onChange={(v) => {
                const val = Math.min(1, Math.max(0, v / 100))
                updateOverlay(overlay.id, { opacity: val })
                recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'opacity', val, overlay.opacity)
              }}
              min={0}
              max={100}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>

        {/* Shadow Toggle */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Shadow</span>
          <button
            onClick={() => updateOverlay(overlay.id, { shadow: !overlay.shadow })}
            className={cn(
              'relative w-10 h-6 rounded-full transition-colors',
              overlay.shadow ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]',
            )}
          >
            <span
              className={cn(
                'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                overlay.shadow && 'translate-x-4',
              )}
            />
          </button>
        </div>

        {/* Background Toggle */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Background</span>
          <button
            onClick={() => updateOverlay(overlay.id, { background: !overlay.background })}
            className={cn(
              'relative w-10 h-6 rounded-full transition-colors',
              overlay.background ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]',
            )}
          >
            <span
              className={cn(
                'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                overlay.background && 'translate-x-4',
              )}
            />
          </button>
        </div>

        {/* Background Opacity */}
        {overlay.background && (
          <div className="flex items-center gap-3 mb-3">
            <span className="text-gray-400 text-sm w-20 shrink-0">BG Opacity</span>
            <div className="flex-1">
              <DraggableNumberInput
                label="%"
                value={Math.round(overlay.backgroundOpacity * 100)}
                onChange={(v) => {
                  const val = Math.min(1, Math.max(0, v / 100))
                  updateOverlay(overlay.id, { backgroundOpacity: val })
                  recordPropertyChange(
                    { objectType: 'text', objectId: overlay.id },
                    'backgroundOpacity',
                    val,
                    overlay.backgroundOpacity,
                  )
                }}
                min={0}
                max={100}
                step={5}
                precision={0}
                inline
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Transform ─────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-white text-base font-semibold">Transform</h2>
          {isLiveActive && <div className="w-2 h-2 rounded-full bg-[#4a7eff] animate-pulse" />}
        </div>

        {/* Position */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-14 shrink-0">Position</span>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <DraggableNumberInput
              label="X"
              value={displayValues.freeX}
              onChange={(v) => {
                updateOverlay(overlay.id, { freeX: v, position: 'free' as const })
                recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'freeX', v, overlay.freeX)
              }}
              step={1}
              precision={0}
              inline
            />
            <DraggableNumberInput
              label="Y"
              value={displayValues.freeY}
              onChange={(v) => {
                updateOverlay(overlay.id, { freeY: v, position: 'free' as const })
                recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'freeY', v, overlay.freeY)
              }}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-14 shrink-0">Rotation</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="°"
              value={displayValues.rotation}
              onChange={(v) => {
                updateOverlay(overlay.id, { rotation: v })
                recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'rotation', v, overlay.rotation)
              }}
              min={-180}
              max={180}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>

        {/* Z-Index */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-14 shrink-0">Z-Index</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="#"
              value={displayValues.zIndex}
              onChange={(v) => {
                const val = Math.round(v)
                updateOverlay(overlay.id, { zIndex: val })
                recordPropertyChange({ objectType: 'text', objectId: overlay.id }, 'zIndex', val, overlay.zIndex)
              }}
              min={-100}
              max={100}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex gap-2">
          <button
            onClick={() => duplicateOverlay(overlay.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2a2a2a] text-white text-sm rounded-lg hover:bg-[#3a3a3a] transition-colors"
          >
            <Copy size={14} /> Duplicate
          </button>
          <button
            onClick={() => {
              removeOverlay(overlay.id)
              setSelectedId(null)
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/10 text-red-400 text-sm rounded-lg hover:bg-red-600/20 transition-colors"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Text Style Presets Panel — unified styles tab (neon, gradient, 3D, etc.)
// ---------------------------------------------------------------------------

type StyleCategory = 'all' | 'neon' | 'gradient' | '3d' | 'cinematic' | 'comic' | 'gaming' | 'elemental' | 'highlighted'

const STYLE_CATEGORIES: { id: StyleCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'neon', label: 'Neon' },
  { id: 'gradient', label: 'Gradient' },
  { id: '3d', label: '3D Depth' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'comic', label: 'Comic' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'elemental', label: 'Elemental' },
  { id: 'highlighted', label: 'Highlighted' },
]

interface UnifiedStylePreset {
  id: string
  name: string
  category: StyleCategory
  color: string
  previewColors: [string, string]
  apply: () => Partial<TextOverlay>
}

// Build a unified list from all preset sources
const ALL_STYLE_PRESETS: UnifiedStylePreset[] = [
  ...NEON_GLOW_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'neon' as StyleCategory,
    color: p.color,
    previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily,
      fontWeight: p.fontWeight,
      color: p.color,
      textShadow: p.textShadow,
      webkitTextStroke: p.WebkitTextStroke,
      letterSpacing: p.letterSpacing,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
  ...GRADIENT_TEXT_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'gradient' as StyleCategory,
    color: '#ffffff',
    previewColors: [
      p.style.textShadow ? '#ffffff' : '#ffffff',
      p.style.background.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#888888',
    ] as [string, string],
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily as FontFamily,
      fontWeight: p.fontWeight as FontWeight,
      color: '#ffffff',
      textShadow: p.style.textShadow,
      webkitTextStroke: p.style.WebkitTextStroke,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
  ...TEXT_3D_STYLE_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: '3d' as StyleCategory,
    color: p.color,
    previewColors: [p.color, p.textShadow.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#333333'] as [string, string],
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily as FontFamily,
      fontWeight: p.fontWeight as FontWeight,
      color: p.color,
      textShadow: p.textShadow,
      webkitTextStroke: p.WebkitTextStroke,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
  ...CINEMATIC_TEXT_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'cinematic' as StyleCategory,
    color: p.color,
    previewColors: [p.color, p.textShadow.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? '#000000'] as [string, string],
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily,
      fontWeight: p.fontWeight,
      color: p.color,
      letterSpacing: p.letterSpacing,
      textCase: p.textCase,
      fontSize: p.suggestedFontSize,
      textShadow: p.textShadow,
      webkitTextStroke: p.webkitTextStroke,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
  ...COMIC_TEXT_STYLE_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'comic' as StyleCategory,
    color: p.color,
    previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily,
      fontWeight: p.fontWeight,
      color: p.color,
      textShadow: p.textShadow,
      webkitTextStroke: p.WebkitTextStroke,
      letterSpacing: p.letterSpacing,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
  ...GAMING_TEXT_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'gaming' as StyleCategory,
    color: p.color,
    previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily,
      fontWeight: p.fontWeight,
      color: p.color,
      textShadow: p.textShadow,
      webkitTextStroke: p.WebkitTextStroke,
      letterSpacing: p.letterSpacing,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
  ...ELEMENTAL_TEXT_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'elemental' as StyleCategory,
    color: p.color,
    previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily,
      fontWeight: p.fontWeight,
      color: p.color,
      textShadow: p.textShadow,
      webkitTextStroke: p.webkitTextStroke,
      letterSpacing: p.letterSpacing,
      textCase: p.textCase as TextCase,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
  ...HIGHLIGHTED_TEXT_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'highlighted' as StyleCategory,
    color: p.color,
    previewColors: p.previewColors,
    apply: (): Partial<TextOverlay> => ({
      fontFamily: p.fontFamily,
      fontWeight: p.fontWeight,
      color: p.color,
      background: true,
      backgroundColor: p.backgroundColor,
      backgroundOpacity: p.backgroundOpacity,
      backgroundPaddingX: p.backgroundPaddingX,
      backgroundPaddingY: p.backgroundPaddingY,
      backgroundBorderRadius: p.backgroundBorderRadius,
      backgroundBorder: p.backgroundBorder,
      textShadow: p.textShadow,
      webkitTextStroke: p.webkitTextStroke,
      letterSpacing: p.letterSpacing,
      textCase: p.textCase as TextCase,
      shadow: false,
      textStylePreset: p.id,
    }),
  })),
]

function TextStylePresetsPanel() {
  const overlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const [activeCategory, setActiveCategory] = useState<StyleCategory>('all')

  if (!overlay) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Paintbrush size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No text selected</p>
        <p className="text-[10px] mt-1">Select a text overlay to apply styles</p>
      </div>
    )
  }

  const currentPresetId = overlay.textStylePreset

  const filteredPresets =
    activeCategory === 'all' ? ALL_STYLE_PRESETS : ALL_STYLE_PRESETS.filter((p) => p.category === activeCategory)

  const handleApplyPreset = (preset: UnifiedStylePreset) => {
    const updates = preset.apply()
    // If switching away from highlighted category, clear background
    if (preset.category !== 'highlighted' && overlay.background) {
      updates.background = false
    }
    updateOverlay(overlay.id, updates)
  }

  const handleClearStyle = () => {
    updateOverlay(overlay.id, {
      textShadow: undefined,
      webkitTextStroke: undefined,
      textStylePreset: undefined,
      shadow: false,
      background: false,
      backgroundColor: undefined,
      backgroundBorder: undefined,
      backgroundBorderRadius: undefined,
      backgroundPaddingX: undefined,
      backgroundPaddingY: undefined,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Current style banner */}
      {currentPresetId && (
        <div className="mx-4 mt-3 flex items-center justify-between bg-[#4a7eff]/10 border border-[#4a7eff]/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Paintbrush size={12} className="text-[#4a7eff]" />
            <span className="text-[11px] text-white font-medium">
              {ALL_STYLE_PRESETS.find((p) => p.id === currentPresetId)?.name ?? currentPresetId}
            </span>
          </div>
          <button
            onClick={handleClearStyle}
            className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
          >
            Clear
          </button>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1 p-4 pb-2">
        {STYLE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
              activeCategory === cat.id
                ? 'bg-[#4a7eff] text-white'
                : 'bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="px-4 pb-2">
        <span className="text-[10px] text-zinc-500">{filteredPresets.length} styles</span>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-4">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleApplyPreset(preset)}
            className={cn(
              'relative px-3 py-3 rounded-lg text-[11px] font-medium transition-all text-center leading-tight overflow-hidden',
              currentPresetId === preset.id
                ? 'ring-2 ring-[#4a7eff] shadow-lg shadow-[#4a7eff]/20'
                : 'hover:ring-1 hover:ring-white/20',
            )}
            style={{ backgroundColor: '#1a1a1a' }}
            title={preset.name}
          >
            {/* Color swatch bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 flex">
              <div className="flex-1" style={{ backgroundColor: preset.previewColors[0] }} />
              <div className="flex-1" style={{ backgroundColor: preset.previewColors[1] }} />
            </div>
            <span className="block mt-1 truncate" style={{ color: preset.previewColors[0] }}>
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Text Animations Panel — full tab for picking text animation presets
// ---------------------------------------------------------------------------

const SORTED_ANIM_CATEGORIES = Object.entries(CATEGORY_INFO)
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([id]) => id as TextAnimationCategory)

function TextAnimationsPanel() {
  const overlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const updateOverlay = useTextOverlayStore((s) => s.updateOverlay)
  const [activeCategory, setActiveCategory] = useState<TextAnimationCategory | 'all'>('all')

  if (!overlay) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No text selected</p>
        <p className="text-[10px] mt-1">Select a text overlay to apply animation</p>
      </div>
    )
  }

  const currentPresetId = overlay.animationPreset

  const filteredPresets =
    activeCategory === 'all'
      ? TEXT_ANIMATION_PRESETS
      : TEXT_ANIMATION_PRESETS.filter((p) => p.category === activeCategory)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Current preset banner */}
      {currentPresetId && currentPresetId !== 'none' && (
        <div className="mx-4 mt-3 flex items-center justify-between bg-[#4a7eff]/10 border border-[#4a7eff]/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-[#4a7eff]" />
            <span className="text-[11px] text-white font-medium">
              {TEXT_ANIMATION_PRESETS.find((p) => p.id === currentPresetId)?.name}
            </span>
          </div>
          <button
            onClick={() => updateOverlay(overlay.id, { animationPreset: 'none' })}
            className="text-[10px] text-zinc-400 hover:text-red-400 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
          >
            Remove
          </button>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1 p-4 pb-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
            activeCategory === 'all'
              ? 'bg-[#4a7eff] text-white'
              : 'bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]',
          )}
        >
          All
        </button>
        {SORTED_ANIM_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors',
              activeCategory === cat
                ? 'bg-[#4a7eff] text-white'
                : 'bg-[#2a2a2a] text-zinc-400 hover:text-white hover:bg-[#3a3a3a]',
            )}
          >
            {CATEGORY_INFO[cat].label}
          </button>
        ))}
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 gap-1.5 px-4 pb-4">
        {filteredPresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => updateOverlay(overlay.id, { animationPreset: preset.id })}
            className={cn(
              'px-3 py-3 rounded-lg text-[11px] font-medium transition-all text-center leading-tight',
              currentPresetId === preset.id
                ? 'bg-[#4a7eff] text-white ring-1 ring-[#4a7eff]/50 shadow-lg shadow-[#4a7eff]/20'
                : 'bg-[#2a2a2a] text-zinc-400 hover:bg-[#3a3a3a] hover:text-white',
            )}
            title={`${preset.name} (${CATEGORY_INFO[preset.category]?.label})`}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Animation Properties Panel — shown when a Lottie animation is selected.
// ---------------------------------------------------------------------------

function AnimationPropertiesPanel() {
  const selectedActiveId = useAnimationStore((s) => s.selectedActiveId)
  const activeAnimations = useAnimationStore((s) => s.activeAnimations)
  const library = useAnimationStore((s) => s.library)
  const updateActiveAnimation = useAnimationStore((s) => s.updateActiveAnimation)
  const removeFromCanvas = useAnimationStore((s) => s.removeFromCanvas)
  const setSelectedActiveId = useAnimationStore((s) => s.setSelectedActiveId)

  const anim = activeAnimations.find((a) => a.id === selectedActiveId)
  const libraryItem = anim ? library.find((l) => l.id === anim.animationId) : null

  if (!anim) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No animation selected</p>
        <p className="text-[10px] mt-1">Click an animation on the canvas or timeline</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#4a7eff]" />
        <span className="text-sm font-medium text-zinc-200 truncate">{libraryItem?.name || 'Animation'}</span>
        <span className="text-[10px] text-zinc-600 ml-auto">{libraryItem?.category}</span>
      </div>

      {/* Playback */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-[#2a2a2a]">
          <span className="text-xs text-zinc-300">Playback</span>
        </div>
        <div className="p-3 space-y-2.5 bg-[#1e1e1e]">
          <DraggableNumberInput
            label="Speed"
            value={anim.speed}
            onChange={(v) => updateActiveAnimation(anim.id, { speed: Math.max(0.1, v) })}
            min={0.1}
            max={5}
            step={0.1}
            unit="×"
            precision={1}
          />

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={anim.loop}
                onChange={() => updateActiveAnimation(anim.id, { loop: !anim.loop })}
                className="accent-[#4a7eff] w-3 h-3"
              />
              <span className="text-xs text-zinc-400">Loop</span>
            </label>
          </div>
        </div>
      </div>

      {/* Transform */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-[#2a2a2a]">
          <span className="text-xs text-zinc-300">Transform</span>
        </div>
        <div className="p-3 space-y-2.5 bg-[#1e1e1e]">
          <div className="grid grid-cols-2 gap-2">
            <DraggableNumberInput
              label="X"
              value={anim.position.x}
              onChange={(v) => {
                updateActiveAnimation(anim.id, { position: { ...anim.position, x: v } })
                recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'position.x', v, anim.position.x)
              }}
              step={1}
              precision={0}
            />
            <DraggableNumberInput
              label="Y"
              value={anim.position.y}
              onChange={(v) => {
                updateActiveAnimation(anim.id, { position: { ...anim.position, y: v } })
                recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'position.y', v, anim.position.y)
              }}
              step={1}
              precision={0}
            />
          </div>
          <DraggableNumberInput
            label="Scale"
            value={anim.scale * 100}
            onChange={(v) => {
              const val = Math.max(0.05, v / 100)
              updateActiveAnimation(anim.id, { scale: val })
              recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'scale', val, anim.scale)
            }}
            min={5}
            max={500}
            step={1}
            unit="%"
            precision={0}
          />
          <DraggableNumberInput
            label="Opacity"
            value={anim.opacity * 100}
            onChange={(v) => {
              const val = Math.min(1, Math.max(0, v / 100))
              updateActiveAnimation(anim.id, { opacity: val })
              recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'opacity', val, anim.opacity)
            }}
            min={0}
            max={100}
            step={1}
            unit="%"
            precision={0}
          />
          <DraggableNumberInput
            label="Z-Index"
            value={anim.zIndex}
            onChange={(v) => {
              const val = Math.round(v)
              updateActiveAnimation(anim.id, { zIndex: val })
              recordPropertyChange({ objectType: 'lottie', objectId: anim.id }, 'zIndex', val, anim.zIndex)
            }}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => {
          removeFromCanvas(anim.id)
          setSelectedActiveId(null)
        }}
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
      >
        <Trash2 size={12} /> Remove from Canvas
      </button>

      {/* Other Animations */}
      {activeAnimations.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Animations</span>
          {activeAnimations
            .filter((a) => a.id !== anim.id)
            .map((a) => {
              const item = library.find((l) => l.id === a.animationId)
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedActiveId(a.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-left"
                >
                  <Sparkles size={10} className="text-[#4a7eff] flex-shrink-0" />
                  <span className="text-xs text-zinc-300 truncate">{item?.name || 'Animation'}</span>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// HTML Template Properties Panel — shown when a canvas HTML template is selected
// Dynamic property editor built from parsed CONFIG / EDITABLE VARIABLES
// ---------------------------------------------------------------------------

import type { TemplateConfigProperty, ConfigPropertyType } from '@/services/templateConfigParser'

const TEMPLATE_AR_OPTIONS = ['canvas', '16:9', '9:16', '1:1', '4:3', '21:9'] as const
const TEMPLATE_AR_LABELS: Record<string, string> = {
  canvas: 'Canvas (Full)',
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
  '4:3': '4:3',
  '21:9': '21:9',
}

function HTMLTemplatePropertiesPanel() {
  const selectedTemplateId = useHTMLTemplateLayerStore((s) => s.selectedTemplateId)
  const templates = useHTMLTemplateLayerStore((s) => s.templates)
  const updateTemplate = useHTMLTemplateLayerStore((s) => s.updateTemplate)
  const updateTemplateConfig = useHTMLTemplateLayerStore((s) => s.updateTemplateConfig)
  const removeTemplate = useHTMLTemplateLayerStore((s) => s.removeTemplate)
  const setSelectedTemplateId = useHTMLTemplateLayerStore((s) => s.setSelectedTemplateId)

  // Canvas dimensions for computing template display size
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)

  // Subscribe to live transform for real-time updates during canvas manipulation
  const liveTransform = useLiveTransformStore((s) => s.active)

  const tpl = templates.find((t) => t.id === selectedTemplateId)

  // Group customConfig properties by group — must be above early return to preserve hook order
  const groupedConfig = useMemo(() => {
    if (!tpl) return {} as Record<string, TemplateConfigProperty[]>
    const groups: Record<string, TemplateConfigProperty[]> = {}
    for (const prop of tpl.customConfig) {
      if (!groups[prop.group]) groups[prop.group] = []
      groups[prop.group].push(prop)
    }
    return groups
  }, [tpl?.customConfig])

  // Compute template dimensions for display info and position presets
  const dims = useMemo(() => {
    if (!tpl) return null
    return computeTemplateDimensions(tpl.templateAspectRatio, canvasWidth, canvasHeight, tpl.scale)
  }, [tpl?.templateAspectRatio, tpl?.scale, canvasWidth, canvasHeight])

  if (!tpl || !dims) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Code size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No template selected</p>
        <p className="text-[10px] mt-1">Click a template on the canvas or timeline</p>
      </div>
    )
  }

  // Use live values when actively transforming on canvas
  const isLive = liveTransform?.type === 'html-template' && liveTransform.id === tpl.id
  const displayX = isLive ? Math.round(liveTransform.x ?? tpl.position.x) : Math.round(tpl.position.x)
  const displayY = isLive ? Math.round(liveTransform.y ?? tpl.position.y) : Math.round(tpl.position.y)
  const displayRotation = isLive ? (liveTransform.rotation ?? tpl.rotation) : tpl.rotation
  const displayScale = isLive ? (liveTransform.scale ?? tpl.scale) : tpl.scale

  const groupOrder = ['Text', 'Colors', 'Animation', 'Numbers', 'Data']
  const hasConfig = tpl.customConfig.length > 0

  const hasCustomAR = !!tpl.templateAspectRatio
  const activeAR = tpl.templateAspectRatio || 'canvas'

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white truncate">{tpl.name}</span>
        <span className="text-[10px] text-gray-500 ml-auto">HTML</span>
        <button
          onClick={() => updateTemplate(tpl.id, { visible: !tpl.visible })}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            tpl.visible
              ? 'text-gray-400 hover:text-white hover:bg-[#3a3a3a]'
              : 'text-gray-600 hover:text-gray-400 hover:bg-[#3a3a3a]',
          )}
          title={tpl.visible ? 'Hide' : 'Show'}
        >
          {tpl.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <PanelSelect
          label="Aspect Ratio"
          value={activeAR}
          onChange={(v) => updateTemplate(tpl.id, { templateAspectRatio: v === 'canvas' ? undefined : v })}
          options={TEMPLATE_AR_OPTIONS.map((ratio) => ({ value: ratio, label: TEMPLATE_AR_LABELS[ratio] }))}
        />
        {hasCustomAR && (
          <>
            <p className="text-[10px] text-gray-500">
              Container: {Math.round(dims.displayWidth)} x {Math.round(dims.displayHeight)}px
              {' | '}
              Native: {dims.nativeWidth} x {dims.nativeHeight}px
            </p>
            {/* Quick position presets */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm w-20 shrink-0">Align</span>
              <div className="flex-1 flex justify-end gap-1">
                {(
                  [
                    { pos: 'Top', icon: ArrowUp, y: 0 },
                    { pos: 'Center', icon: Minus, y: (canvasHeight - dims.displayHeight) / 2 },
                    { pos: 'Bottom', icon: ArrowDown, y: canvasHeight - dims.displayHeight },
                  ] as const
                ).map(({ pos, icon: Icon, y }) => (
                  <button
                    key={pos}
                    title={pos}
                    onClick={() =>
                      updateTemplate(tpl.id, {
                        position: {
                          x: (canvasWidth - dims.displayWidth) / 2,
                          y: Math.max(0, y),
                        },
                      })
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white transition-colors"
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dynamic Template Config Properties */}
      {hasConfig &&
        groupOrder.map((group) => {
          const props = groupedConfig[group]
          if (!props || props.length === 0) return null
          return (
            <TemplateConfigGroup
              key={group}
              group={group}
              properties={props}
              templateId={tpl.id}
              updateConfig={updateTemplateConfig}
            />
          )
        })}

      {/* Transform */}
      <div className="pt-3 border-t border-white/5 space-y-2">
        <span className="text-sm text-gray-400">Transform</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Position</span>
          <div className="flex-1 grid grid-cols-2 gap-2">
            <DraggableNumberInput
              label="X"
              value={displayX}
              onChange={(v) => updateTemplate(tpl.id, { position: { ...tpl.position, x: v } })}
              step={1}
              precision={0}
              inline
            />
            <DraggableNumberInput
              label="Y"
              value={displayY}
              onChange={(v) => updateTemplate(tpl.id, { position: { ...tpl.position, y: v } })}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Scale</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="%"
              value={Math.round(displayScale * 100)}
              onChange={(v) => updateTemplate(tpl.id, { scale: Math.min(3, Math.max(0.01, v / 100)) })}
              min={1}
              max={300}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Rotation</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="°"
              value={displayRotation}
              onChange={(v) => updateTemplate(tpl.id, { rotation: Math.round(v) })}
              min={-360}
              max={360}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Opacity</span>
          <div className="flex-1">
            <DraggableNumberInput
              label="%"
              value={tpl.opacity * 100}
              onChange={(v) => updateTemplate(tpl.id, { opacity: Math.min(1, Math.max(0, v / 100)) })}
              min={0}
              max={100}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Z-Index</span>
          <div className="flex-1">
            <DraggableNumberInput
              label=""
              value={tpl.zIndex}
              onChange={(v) => updateTemplate(tpl.id, { zIndex: Math.round(v) })}
              min={-100}
              max={100}
              step={1}
              precision={0}
              inline
            />
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => {
          removeTemplate(tpl.id)
          setSelectedTemplateId(null)
        }}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-[#2a2a2a] text-red-400 hover:bg-red-600/20 transition-colors"
      >
        <Trash2 size={12} /> Remove from Canvas
      </button>

      {/* Other Templates */}
      {templates.length > 1 && (
        <div className="space-y-1.5 pt-3 border-t border-white/5">
          <span className="text-xs text-gray-500">Other Templates</span>
          {templates
            .filter((t) => t.id !== tpl.id)
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplateId(t.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-left"
              >
                <Code size={10} className="text-blue-400 flex-shrink-0" />
                <span className="text-xs text-gray-300 truncate">{t.name}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template Config Group — renders a group of config properties (Text, Colors, etc.)
// ---------------------------------------------------------------------------

function TemplateConfigGroup({
  group,
  properties,
  templateId,
  updateConfig,
}: {
  group: string
  properties: TemplateConfigProperty[]
  templateId: string
  updateConfig: (id: string, key: string, value: unknown) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  const groupColors: Record<string, string> = {
    Text: 'text-[#4a7eff]',
    Colors: 'text-[#4a7eff]',
    Animation: 'text-[#4a7eff]',
    Numbers: 'text-[#4a7eff]',
    Data: 'text-[#4a7eff]',
  }

  return (
    <div className="pt-3 border-t border-white/5">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-2 mb-2">
        <span className={cn('text-sm font-medium', groupColors[group] || 'text-gray-300')}>{group}</span>
        <span className="text-[10px] text-gray-600 ml-auto">{properties.length}</span>
        <span className="text-gray-500 text-[10px]">{collapsed ? '▸' : '▾'}</span>
      </button>
      {!collapsed && (
        <div className="space-y-2.5">
          {properties.map((prop) => (
            <TemplateConfigControl
              key={prop.key}
              prop={prop}
              onChange={(value) => updateConfig(templateId, prop.key, value)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template Config Control — renders the right input for a single config property
// ---------------------------------------------------------------------------

function TemplateConfigControl({
  prop,
  onChange,
}: {
  prop: TemplateConfigProperty
  onChange: (value: unknown) => void
}) {
  const type: ConfigPropertyType = prop.type

  if (type === 'text') {
    return (
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400 w-20 shrink-0">{prop.label}</label>
        <input
          type="text"
          value={String(prop.value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-[#2a2a2a] text-white focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
        />
      </div>
    )
  }

  if (type === 'color') {
    const colorVal = String(prop.value ?? '#000000')
    // Convert rgba() to hex for color input (approximate)
    const hexVal = colorVal.startsWith('#') ? colorVal.slice(0, 7) : '#000000'
    return (
      <div className="flex items-center gap-2">
        <ColorPicker color={hexVal} onChange={(c) => onChange(c)} />
        <label className="text-xs text-gray-400">{prop.label}</label>
      </div>
    )
  }

  if (type === 'number') {
    const numVal = typeof prop.value === 'number' ? prop.value : 0
    return (
      <DraggableNumberInput
        label={prop.label}
        value={numVal}
        onChange={(v) => onChange(v)}
        step={numVal >= 100 ? 10 : numVal >= 1 ? 1 : 0.1}
        precision={numVal < 1 ? 2 : numVal < 100 ? 1 : 0}
      />
    )
  }

  if (type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!prop.value}
          onChange={() => onChange(!prop.value)}
          className="accent-[#4a7eff] w-3 h-3"
        />
        <span className="text-xs text-gray-400">{prop.label}</span>
      </label>
    )
  }

  if (type === 'text-array') {
    const arr = Array.isArray(prop.value) ? (prop.value as string[]) : []
    return (
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">{prop.label}</label>
        <div className="space-y-1">
          {arr.map((item, i) => (
            <div key={i} className="flex gap-1">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newArr = [...arr]
                  newArr[i] = e.target.value
                  onChange(newArr)
                }}
                className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-[#2a2a2a] text-white focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
              />
              <button
                onClick={() => {
                  const newArr = arr.filter((_, idx) => idx !== i)
                  onChange(newArr)
                }}
                className="px-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                title="Remove"
              >
                <Minus size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([...arr, ''])}
            className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-[#3a3a3a] transition-colors border border-dashed border-white/10"
          >
            <Plus size={10} /> Add
          </button>
        </div>
      </div>
    )
  }

  // object-array / nested-colors fallback: JSON textarea
  if (type === 'object-array') {
    const jsonStr = typeof prop.value === 'string' ? prop.value : JSON.stringify(prop.value, null, 2)
    return (
      <div>
        <label className="text-xs text-gray-400 block mb-1.5">{prop.label}</label>
        <textarea
          value={jsonStr}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              onChange(parsed)
            } catch {
              // Don't update if invalid JSON — user is still typing
            }
          }}
          rows={Math.min(8, Math.max(3, String(jsonStr).split('\n').length))}
          className="w-full px-3 py-2 rounded-lg text-xs bg-[#2a2a2a] text-white focus:outline-none focus:ring-1 focus:ring-[#4a7eff] font-mono resize-y"
          spellCheck={false}
        />
      </div>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// 3D Character Properties Panel
// Compact transform editor matching rig editor style (DragField + TransformRow).
// ---------------------------------------------------------------------------

const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180

function Character3DPropertiesPanel() {
  const activeCharacterId = use3DCharacterStore((s) => s.activeCharacterId)
  const characters = use3DCharacterStore((s) => s.characters)
  const updateCharacter = use3DCharacterStore((s) => s.update3DCharacter)
  const removeCharacter = use3DCharacterStore((s) => s.remove3DCharacter)
  const saved3DCharacters = useSaved3DCharactersStore((s) => s.characters)
  const animations = use3DAnimationStore((s) => s.animations)

  const character = characters.find((c) => c.id === activeCharacterId)
  const savedChar = character ? saved3DCharacters.find((sc) => sc.id === character.saved3DCharacterId) : null

  if (!character) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No 3D character selected</p>
        <p className="text-xs mt-1">Click a 3D character on the canvas to edit its properties</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Character name */}
      <div className="flex items-center gap-2">
        <Box className="w-3.5 h-3.5 text-[#4a7eff] shrink-0" />
        <span className="text-sm text-zinc-200 font-semibold truncate tracking-wide">{character.name}</span>
        {savedChar && (
          <span className="text-[10px] text-zinc-500 ml-auto shrink-0">
            {savedChar.skeletonType} • {(savedChar.polyCount / 1000).toFixed(1)}k
          </span>
        )}
      </div>

      <div className="h-px bg-white/5" />

      {/* Position */}
      <TransformRow label="Position">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={character.position[axis]}
            onChange={(v) => {
              updateCharacter(character.id, { position: { ...character.position, [axis]: v } })
            }}
            sensitivity={SENSITIVITIES.position}
          />
        ))}
      </TransformRow>

      {/* Rotation (display as degrees, store as radians) */}
      <TransformRow label="Rotation">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={character.rotation[axis] * RAD_TO_DEG}
            onChange={(deg) => {
              updateCharacter(character.id, {
                rotation: { ...character.rotation, [axis]: deg * DEG_TO_RAD },
              })
            }}
            sensitivity={SENSITIVITIES.rotation}
            decimals={1}
          />
        ))}
      </TransformRow>

      {/* Scale (uniform — show same value on all three axes) */}
      <TransformRow label="Scale">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={character.scale}
            onChange={(v) => {
              updateCharacter(character.id, { scale: Math.max(0.01, v) })
            }}
            sensitivity={SENSITIVITIES.scale}
          />
        ))}
      </TransformRow>

      <div className="h-px bg-white/5" />

      {/* Animation Speed */}
      <TransformRow label="Speed">
        <DragField
          axis="x"
          value={character.animationSpeed}
          onChange={(v) => {
            updateCharacter(character.id, { animationSpeed: Math.max(0, v) })
          }}
          sensitivity={0.005}
          decimals={2}
        />
      </TransformRow>

      {/* Animation selector */}
      {animations.length > 0 && (
        <PanelSelect
          label="Animation"
          value={character.activeAnimationId ?? ''}
          onChange={(v) => updateCharacter(character.id, { activeAnimationId: v || null })}
          options={[{ value: '', label: 'None' }, ...animations.map((a) => ({ value: a.id, label: a.name }))]}
          fullWidth
        />
      )}

      <div className="h-px bg-white/5" />

      {/* Face Lip Sync */}
      <VisemeFaceMappingSection character={character} updateCharacter={updateCharacter} />

      {/* Face Expressions (Eye + Eyebrow) */}
      <FaceExpressionMappingSection character={character} updateCharacter={updateCharacter} />

      <div className="h-px bg-white/5" />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => updateCharacter(character.id, { visible: !character.visible })}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
            character.visible
              ? 'bg-[#4a7eff]/15 text-[#4a7eff] hover:bg-[#4a7eff]/25'
              : 'bg-[#2a2a2a] text-zinc-500 hover:bg-[#3a3a3a]',
          )}
        >
          {character.visible ? 'Visible' : 'Hidden'}
        </button>
        <button
          onClick={() => removeCharacter(character.id)}
          className="flex-1 px-3 py-2 text-sm font-medium bg-red-600/10 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ── Viseme Face Mapping Section ───────────────────────────────────────────────

const RAD_TO_DEG_VFM = 180 / Math.PI
const DEG_TO_RAD_VFM = Math.PI / 180

function VisemeFaceMappingSection({
  character,
  updateCharacter,
}: {
  character: import('@/types/character3d').Character3D
  updateCharacter: (id: string, updates: Partial<import('@/types/character3d').Character3D>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const mapping = character.visemeFaceMapping
  const enabled = mapping?.enabled ?? false

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)

  const toggleEnabled = () => {
    if (enabled) {
      // Disable — keep mapping but toggle enabled off
      updateCharacter(character.id, {
        visemeFaceMapping: mapping ? { ...mapping, enabled: false } : undefined,
      })
    } else {
      // Enable — create default mapping if none exists
      updateCharacter(character.id, {
        visemeFaceMapping: mapping ? { ...mapping, enabled: true } : { ...DEFAULT_VISEME_FACE_MAPPING },
      })
      setExpanded(true)
    }
  }

  const updateMapping = (updates: Partial<VisemeFaceMapping>) => {
    if (!mapping) return
    updateCharacter(character.id, {
      visemeFaceMapping: { ...mapping, ...updates },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium hover:text-zinc-300 transition-colors"
        >
          <Smile className="w-3 h-3" />
          <span>Face Lip Sync</span>
          <span className="text-[10px] text-zinc-600 ml-0.5">{expanded ? '\u25B2' : '\u25BC'}</span>
        </button>
        <button
          onClick={toggleEnabled}
          className={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
            enabled
              ? 'bg-[#4a7eff]/20 text-[#4a7eff] hover:bg-[#4a7eff]/30'
              : 'bg-[#2a2a2a] text-zinc-500 hover:bg-[#3a3a3a]',
          )}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {expanded && mapping && (
        <div className="flex flex-col gap-2 pl-1">
          {/* Viseme source */}
          <PanelSelect
            label="Viseme Source"
            value={
              mapping.visemeSource.type === 'character-config'
                ? 'character-config'
                : mapping.visemeSource.type === 'saved-2d-character'
                  ? `saved:${mapping.visemeSource.characterId}`
                  : 'custom'
            }
            onChange={(val) => {
              if (val === 'character-config') {
                updateMapping({ visemeSource: { type: 'character-config' } })
              } else if (val.startsWith('saved:')) {
                updateMapping({
                  visemeSource: {
                    type: 'saved-2d-character',
                    characterId: val.replace('saved:', ''),
                  },
                })
              } else {
                updateMapping({ visemeSource: { type: 'custom', sprites: {} } })
              }
            }}
            options={[
              { value: 'character-config', label: 'Primary Character Sprites' },
              ...savedCharacters.map((sc) => ({ value: `saved:${sc.id}`, label: sc.name })),
              { value: 'custom', label: 'Custom Sprites' },
            ]}
            fullWidth
          />

          {/* Dialogue link */}
          {dialogueCharacters.length > 0 && (
            <PanelSelect
              label="Dialogue Source"
              value={mapping.dialogueCharacterId ?? ''}
              onChange={(v) => updateMapping({ dialogueCharacterId: v || undefined })}
              options={[
                { value: '', label: 'Primary Timeline' },
                ...dialogueCharacters.map((dc) => ({ value: dc.id, label: dc.name })),
              ]}
              fullWidth
            />
          )}

          {/* Position offset */}
          <TransformRow label="Offset">
            {(['x', 'y', 'z'] as Axis[]).map((axis) => (
              <DragField
                key={axis}
                axis={axis}
                value={mapping.offset[axis]}
                onChange={(v) => updateMapping({ offset: { ...mapping.offset, [axis]: v } })}
                sensitivity={0.001}
                decimals={3}
              />
            ))}
          </TransformRow>

          {/* Scale */}
          <TransformRow label="Size">
            <DragField
              axis="x"
              value={mapping.scale.x}
              onChange={(v) => updateMapping({ scale: { ...mapping.scale, x: Math.max(0.001, v) } })}
              sensitivity={0.001}
              decimals={3}
            />
            <DragField
              axis="y"
              value={mapping.scale.y}
              onChange={(v) => updateMapping({ scale: { ...mapping.scale, y: Math.max(0.001, v) } })}
              sensitivity={0.001}
              decimals={3}
            />
          </TransformRow>

          {/* Rotation */}
          <TransformRow label="Rotation">
            {(['x', 'y', 'z'] as Axis[]).map((axis) => (
              <DragField
                key={axis}
                axis={axis}
                value={mapping.rotation[axis] * RAD_TO_DEG_VFM}
                onChange={(deg) => updateMapping({ rotation: { ...mapping.rotation, [axis]: deg * DEG_TO_RAD_VFM } })}
                sensitivity={0.5}
                decimals={1}
              />
            ))}
          </TransformRow>

          {/* Opacity */}
          <PanelSlider
            label="Opacity"
            value={mapping.opacity}
            onChange={(v) => updateMapping({ opacity: v })}
            min={0}
            max={1}
            step={0.01}
            precision={0}
            compact
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />

          {/* Transition speed */}
          <PanelSlider
            label="Fade"
            value={mapping.transitionMs}
            onChange={(v) => updateMapping({ transitionMs: Math.max(0, Math.round(v)) })}
            min={0}
            max={500}
            step={10}
            compact
            suffix="ms"
          />

          {/* Place on Face button */}
          <VisemePlacementButton characterId={character.id} />
        </div>
      )}
    </div>
  )
}

function VisemePlacementButton({ characterId }: { characterId: string }) {
  const isPlacing = use3DCharacterStore((s) => s.visemePlacementCharId === characterId)
  const startPlacement = use3DCharacterStore((s) => s.startVisemePlacement)
  const stopPlacement = use3DCharacterStore((s) => s.stopVisemePlacement)

  return (
    <button
      onClick={() => {
        if (isPlacing) {
          stopPlacement()
        } else {
          startPlacement(characterId)
        }
      }}
      className={cn(
        'w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
        isPlacing
          ? 'bg-[#4a7eff]/20 text-[#4a7eff] hover:bg-[#4a7eff]/30'
          : 'bg-[#2a2a2a] text-zinc-400 hover:bg-[#3a3a3a] hover:text-zinc-300',
      )}
    >
      {isPlacing ? 'Click on face to place... (ESC to cancel)' : 'Place on Face'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Face Expression Mapping Section — eye + eyebrow overlays on 3D character
// ---------------------------------------------------------------------------

function FaceExpressionMappingSection({
  character,
  updateCharacter,
}: {
  character: import('@/types/character3d').Character3D
  updateCharacter: (id: string, updates: Partial<import('@/types/character3d').Character3D>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const mapping = character.faceExpressionMapping
  const enabled = mapping?.enabled ?? false

  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)

  const toggleEnabled = () => {
    if (enabled) {
      updateCharacter(character.id, {
        faceExpressionMapping: mapping ? { ...mapping, enabled: false } : undefined,
      })
    } else {
      updateCharacter(character.id, {
        faceExpressionMapping: mapping ? { ...mapping, enabled: true } : { ...DEFAULT_FACE_EXPRESSION_MAPPING },
      })
      setExpanded(true)
    }
  }

  const updateMapping = (updates: Partial<FaceExpressionMapping>) => {
    if (!mapping) return
    updateCharacter(character.id, {
      faceExpressionMapping: { ...mapping, ...updates },
    })
  }

  const updatePartConfig = (part: 'eye' | 'eyebrow', updates: Partial<FaceExpressionMapping['eye']>) => {
    if (!mapping) return
    updateCharacter(character.id, {
      faceExpressionMapping: {
        ...mapping,
        [part]: { ...mapping[part], ...updates },
      },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header + toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium hover:text-zinc-300 transition-colors"
        >
          <Eye className="w-3 h-3" />
          <span>Face Expressions</span>
          <span className="text-[10px] text-zinc-600 ml-0.5">{expanded ? '\u25B2' : '\u25BC'}</span>
        </button>
        <button
          onClick={toggleEnabled}
          className={cn(
            'px-2 py-0.5 text-[10px] font-medium rounded transition-colors',
            enabled
              ? 'bg-[#4a7eff]/20 text-[#4a7eff] hover:bg-[#4a7eff]/30'
              : 'bg-[#2a2a2a] text-zinc-500 hover:bg-[#3a3a3a]',
          )}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {expanded && mapping && (
        <div className="flex flex-col gap-2 pl-1">
          {/* Expression source */}
          <PanelSelect
            label="Expression Source"
            value={
              mapping.expressionSource.type === 'character-config'
                ? 'character-config'
                : mapping.expressionSource.type === 'saved-2d-character'
                  ? `saved:${mapping.expressionSource.characterId}`
                  : 'custom'
            }
            onChange={(val) => {
              if (val === 'character-config') {
                updateMapping({ expressionSource: { type: 'character-config' } })
              } else if (val.startsWith('saved:')) {
                updateMapping({
                  expressionSource: {
                    type: 'saved-2d-character',
                    characterId: val.replace('saved:', ''),
                  },
                })
              } else {
                updateMapping({
                  expressionSource: {
                    type: 'custom',
                    eyeSprites: {},
                    eyebrowSprites: {},
                  },
                })
              }
            }}
            options={[
              { value: 'character-config', label: 'Primary Character Sprites' },
              ...savedCharacters.map((sc) => ({ value: `saved:${sc.id}`, label: sc.name })),
              { value: 'custom', label: 'Custom Sprites' },
            ]}
            fullWidth
          />

          {/* Dialogue link */}
          {dialogueCharacters.length > 0 && (
            <PanelSelect
              label="Dialogue Source"
              value={mapping.dialogueCharacterId ?? ''}
              onChange={(v) => updateMapping({ dialogueCharacterId: v || undefined })}
              options={[
                { value: '', label: 'Primary Timeline' },
                ...dialogueCharacters.map((dc) => ({ value: dc.id, label: dc.name })),
              ]}
              fullWidth
            />
          )}

          {/* ── Eye overlay ── */}
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Eye Overlay</span>
              <button
                onClick={() => updatePartConfig('eye', { enabled: !mapping.eye.enabled })}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors',
                  mapping.eye.enabled
                    ? 'bg-[#4a7eff]/20 text-[#4a7eff] hover:bg-[#4a7eff]/30'
                    : 'bg-[#2a2a2a] text-zinc-500 hover:bg-[#3a3a3a]',
                )}
              >
                {mapping.eye.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {mapping.eye.enabled && (
              <div className="flex flex-col gap-1.5 pl-1">
                <TransformRow label="Offset">
                  {(['x', 'y', 'z'] as Axis[]).map((axis) => (
                    <DragField
                      key={axis}
                      axis={axis}
                      value={mapping.eye.offset[axis]}
                      onChange={(v) => updatePartConfig('eye', { offset: { ...mapping.eye.offset, [axis]: v } })}
                      sensitivity={0.001}
                      decimals={3}
                    />
                  ))}
                </TransformRow>
                <TransformRow label="Size">
                  <DragField
                    axis="x"
                    value={mapping.eye.scale.x}
                    onChange={(v) =>
                      updatePartConfig('eye', { scale: { ...mapping.eye.scale, x: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                  <DragField
                    axis="y"
                    value={mapping.eye.scale.y}
                    onChange={(v) =>
                      updatePartConfig('eye', { scale: { ...mapping.eye.scale, y: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                </TransformRow>
                <PanelSlider
                  label="Opacity"
                  value={mapping.eye.opacity}
                  onChange={(v) => updatePartConfig('eye', { opacity: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={0}
                  compact
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <ExpressionPlacementButton characterId={character.id} part="eye" />
              </div>
            )}
          </div>

          {/* ── Eyebrow overlay ── */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">Eyebrow Overlay</span>
              <button
                onClick={() => updatePartConfig('eyebrow', { enabled: !mapping.eyebrow.enabled })}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors',
                  mapping.eyebrow.enabled
                    ? 'bg-[#4a7eff]/20 text-[#4a7eff] hover:bg-[#4a7eff]/30'
                    : 'bg-[#2a2a2a] text-zinc-500 hover:bg-[#3a3a3a]',
                )}
              >
                {mapping.eyebrow.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {mapping.eyebrow.enabled && (
              <div className="flex flex-col gap-1.5 pl-1">
                <TransformRow label="Offset">
                  {(['x', 'y', 'z'] as Axis[]).map((axis) => (
                    <DragField
                      key={axis}
                      axis={axis}
                      value={mapping.eyebrow.offset[axis]}
                      onChange={(v) =>
                        updatePartConfig('eyebrow', { offset: { ...mapping.eyebrow.offset, [axis]: v } })
                      }
                      sensitivity={0.001}
                      decimals={3}
                    />
                  ))}
                </TransformRow>
                <TransformRow label="Size">
                  <DragField
                    axis="x"
                    value={mapping.eyebrow.scale.x}
                    onChange={(v) =>
                      updatePartConfig('eyebrow', { scale: { ...mapping.eyebrow.scale, x: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                  <DragField
                    axis="y"
                    value={mapping.eyebrow.scale.y}
                    onChange={(v) =>
                      updatePartConfig('eyebrow', { scale: { ...mapping.eyebrow.scale, y: Math.max(0.001, v) } })
                    }
                    sensitivity={0.001}
                    decimals={3}
                  />
                </TransformRow>
                <PanelSlider
                  label="Opacity"
                  value={mapping.eyebrow.opacity}
                  onChange={(v) => updatePartConfig('eyebrow', { opacity: v })}
                  min={0}
                  max={1}
                  step={0.01}
                  precision={0}
                  compact
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
                <ExpressionPlacementButton characterId={character.id} part="eyebrow" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ExpressionPlacementButton({ characterId, part }: { characterId: string; part: 'eye' | 'eyebrow' }) {
  const isPlacing = use3DCharacterStore(
    (s) => s.expressionPlacementCharId === characterId && s.expressionPlacementPart === part,
  )
  const startPlacement = use3DCharacterStore((s) => s.startExpressionPlacement)
  const stopPlacement = use3DCharacterStore((s) => s.stopExpressionPlacement)

  return (
    <button
      onClick={() => {
        if (isPlacing) {
          stopPlacement()
        } else {
          startPlacement(characterId, part)
        }
      }}
      className={cn(
        'w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
        isPlacing
          ? 'bg-[#4a7eff]/20 text-[#4a7eff] hover:bg-[#4a7eff]/30'
          : 'bg-[#2a2a2a] text-zinc-400 hover:bg-[#3a3a3a] hover:text-zinc-300',
      )}
    >
      {isPlacing
        ? `Click on face to place ${part}... (ESC to cancel)`
        : `Place ${part === 'eye' ? 'Eyes' : 'Eyebrows'} on Face`}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Art Curve Properties Panel — shown when an art curve composition is selected
// ---------------------------------------------------------------------------

const ART_CURVE_STYLE_LABELS: Record<string, string> = {
  swirl: 'Swirl',
}

function ArtCurvePropertiesPanel() {
  const selectedId = useArtCurveStore((s) => s.selectedCompositionId)
  const compositions = useArtCurveStore((s) => s.compositions)
  const updateComposition = useArtCurveStore((s) => s.updateComposition)
  const removeComposition = useArtCurveStore((s) => s.removeComposition)
  const setSelectedId = useArtCurveStore((s) => s.setSelectedCompositionId)

  const liveTransform = useLiveTransformStore((s) => s.active)

  const comp = compositions.find((c) => c.id === selectedId)

  // Use live transform values when actively manipulating
  const isLiveActive = liveTransform?.type === 'shape' && liveTransform?.id === comp?.id
  const displayValues = useMemo(() => {
    if (!comp) return null
    if (isLiveActive && liveTransform) {
      return {
        x: liveTransform.x,
        y: liveTransform.y,
        rotation: liveTransform.rotation,
        scale: liveTransform.scale ?? comp.scale,
        opacity: comp.opacity,
        zIndex: comp.zIndex,
      }
    }
    return {
      x: comp.position.x,
      y: comp.position.y,
      rotation: comp.rotation,
      scale: comp.scale,
      opacity: comp.opacity,
      zIndex: comp.zIndex,
    }
  }, [comp, isLiveActive, liveTransform])

  if (!comp || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Palette size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No art curve selected</p>
        <p className="text-[10px] mt-1">Click an art curve on the canvas to edit its properties</p>
      </div>
    )
  }

  const handleReset = () => {
    updateComposition(comp.id, {
      position: { x: 100, y: 100 },
      rotation: 0,
      opacity: 1,
      scale: 1,
      zIndex: 6,
    })
  }

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Preview swatch */}
        <div className="w-14 h-14 bg-[#2a2a2a] rounded-lg overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
          <div className="flex gap-0.5">
            {comp.palette.slice(0, 4).map((c, i) => (
              <div key={i} className="w-3 h-8 rounded-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 truncate">{comp.name}</p>
          <p className="text-[10px] text-zinc-500">{ART_CURVE_STYLE_LABELS[comp.style] || comp.style}</p>
          <p className="text-[10px] text-zinc-600">{comp.curves.length} curves</p>
        </div>
      </div>

      {/* Transform Section */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div
              className={cn('w-2 h-2 rounded-full', isLiveActive ? 'bg-[#4a7eff] animate-pulse' : 'bg-[#4a7eff]/50')}
            />
            <span className="text-sm text-zinc-300">Transform</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateComposition(comp.id, { visible: !comp.visible })}
              className={cn(
                'p-1 rounded transition-colors',
                comp.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400',
              )}
              title={comp.visible ? 'Hide' : 'Show'}
            >
              {comp.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={handleReset}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset transform"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <div className={cn('p-3 space-y-3 bg-[#1e1e1e]', !comp.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Position</span>
            <div className="grid grid-cols-2 gap-2">
              <DraggableNumberInput
                label="X"
                value={displayValues.x}
                onChange={(v) => updateComposition(comp.id, { position: { ...comp.position, x: v } })}
                step={1}
                precision={1}
              />
              <DraggableNumberInput
                label="Y"
                value={displayValues.y}
                onChange={(v) => updateComposition(comp.id, { position: { ...comp.position, y: v } })}
                step={1}
                precision={1}
              />
            </div>
          </div>

          {/* Scale */}
          <DraggableNumberInput
            label="Scale"
            value={displayValues.scale * 100}
            onChange={(v) => updateComposition(comp.id, { scale: Math.max(0.1, v / 100) })}
            min={10}
            max={500}
            step={5}
            unit="%"
            precision={0}
          />

          {/* Rotation */}
          <DraggableNumberInput
            label="Rotation"
            value={displayValues.rotation}
            onChange={(v) => updateComposition(comp.id, { rotation: v })}
            min={-180}
            max={180}
            step={1}
            unit="°"
            precision={0}
          />

          {/* Opacity */}
          <DraggableNumberInput
            label="Opacity"
            value={displayValues.opacity * 100}
            onChange={(v) => updateComposition(comp.id, { opacity: Math.min(1, Math.max(0, v / 100)) })}
            min={0}
            max={100}
            step={1}
            unit="%"
            precision={0}
          />

          {/* Z-Index */}
          <DraggableNumberInput
            label="Z-Index"
            value={displayValues.zIndex}
            onChange={(v) => updateComposition(comp.id, { zIndex: Math.round(v) })}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />
        </div>
      </div>

      {/* Background Section */}
      <div className="border border-white/5 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <Palette size={12} className="text-zinc-400" />
            <span className="text-xs text-zinc-300">Background</span>
          </div>
        </div>

        <div className="p-3 space-y-3 bg-[#1e1e1e]">
          {/* Transparent Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Transparent</span>
            <button
              onClick={() => updateComposition(comp.id, { bgTransparent: !comp.bgTransparent })}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors',
                comp.bgTransparent ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]',
              )}
            >
              <div
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  comp.bgTransparent ? 'translate-x-5' : 'translate-x-1',
                )}
              />
            </button>
          </div>

          {/* BG Color */}
          {!comp.bgTransparent && (
            <div className="flex items-center gap-2">
              <ColorPicker color={comp.bgColor} onChange={(c) => updateComposition(comp.id, { bgColor: c })} />
              <span className="text-xs text-zinc-400 flex-1">Color</span>
              <span className="text-[10px] text-zinc-500 font-mono">{comp.bgColor}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            removeComposition(comp.id)
            setSelectedId(null)
          }}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
          title="Remove art curve"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>

      {/* Other Compositions Quick Select */}
      {compositions.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Art Curves</span>
          {compositions
            .filter((c) => c.id !== comp.id)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className="w-full text-left px-2 py-1.5 rounded-md text-xs text-zinc-400 hover:bg-[#3a3a3a] hover:text-zinc-200 transition-colors flex items-center justify-between"
              >
                <span className="truncate">{c.name}</span>
                <span className="text-[10px] text-zinc-600">{ART_CURVE_STYLE_LABELS[c.style] || c.style}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Beat Sync Section — collapsible accordion shown in non-character property panels
// ---------------------------------------------------------------------------

const BEAT_EFFECTS: { value: BeatSyncEffect; label: string }[] = [
  { value: 'scale-pulse', label: 'Scale' },
  { value: 'opacity-flash', label: 'Opacity' },
  { value: 'bounce', label: 'Bounce' },
]

const BEAT_SUBDIVISIONS: { value: 1 | 2 | 4; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 4, label: '4' },
]

function BeatSyncSection() {
  const [open, setOpen] = useState(false)

  const { analysis, isAnalyzing, error, analyzeAudio, objectConfigs, applyObjectBeatSync, clearObjectBeatSync } =
    useBeatSyncStore(
      useShallow((s) => ({
        analysis: s.analysis,
        isAnalyzing: s.isAnalyzing,
        error: s.error,
        analyzeAudio: s.analyzeAudio,
        objectConfigs: s.objectConfigs,
        applyObjectBeatSync: s.applyObjectBeatSync,
        clearObjectBeatSync: s.clearObjectBeatSync,
      })),
    )

  const rightPanelTab = useEditorStore((s) => s.rightPanelTab)
  const playbackFps = usePlaybackStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  // Resolve selected object from the relevant store based on current rightPanelTab
  const textSelectedId = useTextOverlayStore((s) => s.selectedId)
  const textOverlay = useTextOverlayStore((s) => s.overlays.find((o) => o.id === s.selectedId))
  const shapeSelectedId = useShapeStore((s) => s.selectedShapeId)
  const shapes = useShapeStore((s) => s.shapes)
  const mediaSelectedId = useMediaStore((s) => s.selectedCanvasItemId)
  const mediaCanvasItems = useMediaStore((s) => s.canvasItems)
  const videoSelectedId = useVideoLayerStore((s) => s.selectedVideoId)

  const resolvedSelection = useMemo((): {
    objectId: string
    objectType: KeyframableObjectType
    startFrame: number
    endFrame: number
  } | null => {
    if (
      (rightPanelTab === 'text-properties' || rightPanelTab === 'text-styles' || rightPanelTab === 'text-animations') &&
      textSelectedId
    ) {
      if (textOverlay)
        return {
          objectId: textSelectedId,
          objectType: 'text',
          startFrame: textOverlay.startFrame ?? 0,
          endFrame: textOverlay.endFrame ?? totalFrames,
        }
    }
    if (rightPanelTab === 'shape-properties' && shapeSelectedId) {
      const shape = shapes.find((s) => s.id === shapeSelectedId)
      if (shape)
        return {
          objectId: shapeSelectedId,
          objectType: 'shape',
          startFrame: shape.startFrame ?? 0,
          endFrame: shape.endFrame ?? totalFrames,
        }
    }
    if (rightPanelTab === 'media-properties' && mediaSelectedId) {
      const item = mediaCanvasItems.find((m) => m.id === mediaSelectedId)
      if (item)
        return {
          objectId: mediaSelectedId,
          objectType: 'media',
          startFrame: item.startFrame ?? 0,
          endFrame: item.endFrame ?? totalFrames,
        }
    }
    if (rightPanelTab === 'video-properties' && videoSelectedId) {
      return { objectId: videoSelectedId, objectType: 'video', startFrame: 0, endFrame: totalFrames }
    }
    return null
  }, [
    rightPanelTab,
    textSelectedId,
    shapeSelectedId,
    mediaSelectedId,
    videoSelectedId,
    textOverlay,
    shapes,
    mediaCanvasItems,
    totalFrames,
  ])

  // Per-object config state
  const existingConfigKey = resolvedSelection ? `${resolvedSelection.objectType}:${resolvedSelection.objectId}` : null
  const existingConfig = existingConfigKey ? objectConfigs[existingConfigKey] : undefined

  const [effect, setEffect] = useState<BeatSyncEffect>(existingConfig?.effect ?? 'scale-pulse')
  const [subdivision, setSubdivision] = useState<1 | 2 | 4>(existingConfig?.subdivision ?? 1)
  const [intensity, setIntensity] = useState(existingConfig?.intensity ?? 0.75)

  useEffect(() => {
    setEffect(existingConfig?.effect ?? 'scale-pulse')
    setSubdivision(existingConfig?.subdivision ?? 1)
    setIntensity(existingConfig?.intensity ?? 0.75)
  }, [existingConfigKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Find first audio asset for quick analyze
  const audioAssets = useMediaStore(
    useShallow((s) => s.assets.filter((a) => a.category === 'audio' || (a.type && a.type.startsWith('audio/')))),
  )

  const handleAnalyze = async () => {
    const first = audioAssets[0]
    if (first) await analyzeAudio(first.url)
  }

  return (
    <div className="mx-4 mb-3 border border-white/5 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors"
      >
        {open ? (
          <ChevronDown size={12} className="text-zinc-500" />
        ) : (
          <ChevronRight size={12} className="text-zinc-500" />
        )}
        <Activity size={12} className="text-[#4a7eff]" />
        <span className="text-xs text-zinc-300 font-medium">Beat Sync</span>
        {analysis && (
          <span className="ml-auto text-[9px] text-[#4a7eff] bg-[#4a7eff]/10 px-1.5 py-0.5 rounded-full">
            {analysis.bpm} BPM
          </span>
        )}
      </button>

      {open && (
        <div className="p-3 space-y-3 bg-[#1e1e1e]">
          {/* Not analyzed yet */}
          {!analysis && !isAnalyzing && (
            <div className="text-center space-y-2">
              <p className="text-[10px] text-zinc-500">Analyze audio first</p>
              <button
                onClick={handleAnalyze}
                disabled={audioAssets.length === 0}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all',
                  audioAssets.length > 0
                    ? 'bg-[#4a7eff]/20 text-[#4a7eff] hover:bg-[#4a7eff]/30 border border-[#4a7eff]/30'
                    : 'bg-[#2a2a2a] text-zinc-600 cursor-not-allowed border border-white/5',
                )}
              >
                {audioAssets.length > 0 ? 'Analyze' : 'No audio found'}
              </button>
            </div>
          )}

          {/* Analyzing */}
          {isAnalyzing && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={12} className="animate-spin text-[#4a7eff]" />
              <span className="text-[11px] text-zinc-400">Analyzing...</span>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-[10px] text-red-400 text-center">{error}</p>}

          {/* Analyzed — show controls */}
          {analysis && !isAnalyzing && (
            <>
              {!resolvedSelection ? (
                <p className="text-[10px] text-zinc-500 text-center">Select an object to sync</p>
              ) : (
                <div className="space-y-2.5">
                  {/* Effect pills */}
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Effect</span>
                    <div className="flex gap-1">
                      {BEAT_EFFECTS.map((e) => (
                        <button
                          key={e.value}
                          onClick={() => setEffect(e.value)}
                          className={cn(
                            'flex-1 py-1 rounded-md text-[10px] font-medium transition-all border',
                            effect === e.value
                              ? 'bg-[#4a7eff]/20 text-[#4a7eff] border-[#4a7eff]/30'
                              : 'bg-[#2a2a2a] text-zinc-500 border-white/5 hover:border-[#4a7eff]/20',
                          )}
                        >
                          {e.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subdivision pills */}
                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Every Nth beat</span>
                    <div className="flex gap-1">
                      {BEAT_SUBDIVISIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSubdivision(s.value)}
                          className={cn(
                            'flex-1 py-1 rounded-md text-[10px] font-medium transition-all border',
                            subdivision === s.value
                              ? 'bg-[#4a7eff]/20 text-[#4a7eff] border-[#4a7eff]/30'
                              : 'bg-[#2a2a2a] text-zinc-500 border-white/5 hover:border-[#4a7eff]/20',
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intensity slider */}
                  <PanelSlider
                    label="Intensity"
                    value={intensity}
                    onChange={setIntensity}
                    min={0}
                    max={2}
                    step={0.05}
                    precision={0}
                    compact
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                  />

                  {/* Apply / Clear */}
                  <div className="flex gap-1.5">
                    {existingConfig && (
                      <button
                        onClick={() =>
                          clearObjectBeatSync([
                            { objectType: resolvedSelection.objectType, objectId: resolvedSelection.objectId },
                          ])
                        }
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-[#2a2a2a] text-zinc-400 hover:text-zinc-200 border border-white/5 hover:border-[#4a7eff]/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <X size={10} />
                        Clear
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const objectRef = {
                          objectType: resolvedSelection.objectType,
                          objectId: resolvedSelection.objectId,
                        }
                        const config = { objectRef, effect, subdivision, offset: 0, intensity }
                        const clipRanges = {
                          [`${resolvedSelection.objectType}:${resolvedSelection.objectId}`]: {
                            startFrame: resolvedSelection.startFrame,
                            endFrame: resolvedSelection.endFrame,
                          },
                        }
                        applyObjectBeatSync([config], playbackFps, clipRanges)
                      }}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold bg-[#4a7eff] text-white hover:bg-[#5a8aff] transition-all flex items-center justify-center gap-1"
                    >
                      <Zap size={10} />
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
