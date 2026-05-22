/**
 * Shared constants, types, icons, and tab definitions for the RightPanel.
 * Extracted from the RightPanel monolith to be imported by the thin router
 * and individual sub-panel components.
 */
import {
  Layers,
  User,
  Smile,
  Scissors,
  Mic,
  Eye,
  Image,
  Square,
  Type,
  Sparkles,
  Code,
  Box,
  Film,
  Shirt,
  Footprints,
  PersonStanding,
  ChevronRight,
  Grid3x3,
  Paintbrush,
  UserCircle,
  LayoutTemplate,
  Camera,
  Users,
  Move,
  Aperture,
  LayoutGrid,
  Bone,
  Palette,
  RotateCcw,
  FileVideo,
  Zap,
  Link2,
  FileText,
  Building2,
  type LucideIcon,
} from 'lucide-react'
import type { Tab } from '@/components/ui'
import type { RightPanelTab } from '@/types'
import type { NB2PartType } from '@/types/nanoBanana2'
import type { GradientFill } from '@/types/gradient'

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Extract a CSS-compatible color string from a fill value (solid string or GradientFill) */
export function resolveFillString(fill: string | GradientFill): string {
  if (typeof fill === 'string') return fill
  return fill.stops?.[0]?.color ?? '#000000'
}

// ---------------------------------------------------------------------------
// Custom SVG Icons
// ---------------------------------------------------------------------------

export const EyebrowIcon: LucideIcon = (({ size = 24, ...props }) => (
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

export const PantsIcon: LucideIcon = (({ size = 24, ...props }) => (
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

// ---------------------------------------------------------------------------
// Character sections + tabs
// ---------------------------------------------------------------------------

export const CHARACTER_SECTIONS = [
  { id: 'character', icon: User, label: 'Character', defaultTab: 'group-properties' as const },
  { id: 'style', icon: Paintbrush, label: 'Style', defaultTab: 'style-properties' as const },
  { id: 'voices', icon: Mic, label: 'Voices', defaultTab: 'voices' as const },
  { id: 'animations', icon: Film, label: 'Animations', defaultTab: 'animations' as const },
]

/** Two pills inside the Character section: Compose + Assets */
export const characterSubTabs: Tab[] = [
  { id: 'group-properties', icon: Layers, label: 'Compose' },
  { id: 'character-assets', icon: Grid3x3, label: 'Assets' },
]

/** All tabs belonging to the Character dropdown section */
export const CHARACTER_SECTION_TABS = new Set([
  'group-properties',
  'character-assets',
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

/** Sprite tabs + asset grid — used to detect "Assets" pill active state */
export const ASSET_SECTION_TABS = new Set([
  'character-assets',
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

/** 9 asset grid items for the 3x3 grid in the Assets view */
export const ASSET_GRID_ITEMS = [
  { id: 'head', icon: User, label: 'Head' },
  { id: 'eye', icon: Eye, label: 'Eye' },
  { id: 'eyebrow', icon: EyebrowIcon, label: 'Eyebrow' },
  { id: 'viseme', icon: Smile, label: 'Viseme' },
  { id: 'hair', icon: Scissors, label: 'Hair' },
  { id: 'body', icon: PersonStanding, label: 'Body' },
  { id: 'shirt', icon: Shirt, label: 'Shirt' },
  { id: 'pants', icon: PantsIcon, label: 'Pants' },
  { id: 'shoes', icon: Footprints, label: 'Shoes' },
] as const

export const CHARACTER_TABS = new Set([
  'group-properties',
  'character-assets',
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

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export type CameraSubTab = 'all' | 'transform' | 'camera' | 'optical' | 'effects'

export const CAMERA_SUB_TABS: Tab[] = [
  { id: 'all', icon: LayoutGrid, label: 'All' },
  { id: 'transform', icon: Move, label: 'Transform' },
  { id: 'camera', icon: Camera, label: 'Camera' },
  { id: 'optical', icon: Aperture, label: 'Optical' },
  { id: 'effects', icon: Zap, label: 'Effects' },
]

// ---------------------------------------------------------------------------
// Brand Kit
// ---------------------------------------------------------------------------

export type BrandKitSubTab = 'all' | 'identity' | 'colors' | 'typography' | 'media' | 'voice'

export const BRAND_KIT_SUB_TABS: Tab[] = [
  { id: 'all', icon: LayoutGrid, label: 'All' },
  { id: 'identity', icon: Sparkles, label: 'Identity' },
  { id: 'colors', icon: Palette, label: 'Colors' },
  { id: 'typography', icon: Type, label: 'Type' },
  { id: 'media', icon: Image, label: 'Media' },
  { id: 'voice', icon: Mic, label: 'Voice' },
]

// ---------------------------------------------------------------------------
// Context info (header label + icon + color)
// ---------------------------------------------------------------------------

export const CONTEXT_INFO: Record<string, { label: string; icon: typeof Layers; color: string }> = {
  'group-properties': { label: 'Character', icon: Layers, color: 'text-accent' },
  'character-assets': { label: 'Assets', icon: Grid3x3, color: 'text-accent' },
  eye: { label: 'Character', icon: Eye, color: 'text-accent' },
  eyebrow: { label: 'Character', icon: EyebrowIcon, color: 'text-accent' },
  viseme: { label: 'Character', icon: Smile, color: 'text-accent' },
  hair: { label: 'Character', icon: Scissors, color: 'text-accent' },
  body: { label: 'Character', icon: PersonStanding, color: 'text-accent' },
  head: { label: 'Character', icon: User, color: 'text-accent' },
  shirt: { label: 'Character', icon: Shirt, color: 'text-accent' },
  pants: { label: 'Character', icon: PantsIcon, color: 'text-accent' },
  shoes: { label: 'Character', icon: Footprints, color: 'text-accent' },
  voices: { label: 'Character', icon: Mic, color: 'text-accent' },
  'media-properties': { label: 'Media', icon: Image, color: 'text-accent' },
  'svg-object-properties': { label: 'SVG Object', icon: Palette, color: 'text-accent' },
  'shape-properties': { label: 'Shape', icon: Square, color: 'text-accent' },
  'text-properties': { label: 'Text', icon: Type, color: 'text-accent' },
  'text-animations': { label: 'Text', icon: Sparkles, color: 'text-accent' },
  'animation-properties': { label: 'Animation', icon: Sparkles, color: 'text-accent' },
  'html-template-properties': { label: 'HTML Template', icon: Code, color: 'text-accent' },
  'motion-graphic-properties': { label: 'Motion Graphic', icon: Sparkles, color: 'text-accent' },
  '3d-character-properties': { label: '3D Character', icon: Box, color: 'text-accent' },
  'pixelart-character-properties': { label: 'Pixel Art', icon: Grid3x3, color: 'text-accent' },
  'avatar-character-properties': { label: 'Avatar', icon: UserCircle, color: 'text-accent' },
  'avatar-videos': { label: 'Avatar', icon: Film, color: 'text-accent' },
  'avatar-voices': { label: 'Avatar', icon: Mic, color: 'text-accent' },
  'pixelart-animations': { label: 'Pixel Art', icon: Film, color: 'text-accent' },
  'art-curve-properties': { label: 'Art Curve', icon: Palette, color: 'text-accent' },
  'video-properties': { label: 'Video', icon: Film, color: 'text-accent' },
  animations: { label: 'Character', icon: Film, color: 'text-accent' },
  'style-properties': { label: 'Style', icon: Paintbrush, color: 'text-accent' },
  'whiteboard-background-properties': { label: 'Background', icon: Palette, color: 'text-accent' },
  'whiteboard-bg-color': { label: 'Color', icon: Palette, color: 'text-accent' },
  'whiteboard-bg-templates': { label: 'Templates', icon: LayoutTemplate, color: 'text-accent' },
  'whiteboard-bg-texture': { label: 'Build', icon: Image, color: 'text-accent' },
  'canvas-layers': { label: 'Layers', icon: Layers, color: 'text-accent' },
  'camera-properties': { label: 'Camera', icon: Camera, color: 'text-accent' },
  'gen-image-properties': { label: 'Image Gen', icon: Image, color: 'text-accent' },
  'gen-text-to-video-properties': { label: 'Text to Video', icon: Film, color: 'text-accent' },
  'image-to-video-properties': { label: 'Img to Video', icon: FileVideo, color: 'text-accent' },
  'gen-audio-to-video-properties': { label: 'Audio to Video', icon: Mic, color: 'text-accent' },
  'gen-video-to-video-properties': { label: 'Video to Video', icon: Sparkles, color: 'text-accent' },
  'gen-retake-properties': { label: 'Retake', icon: RotateCcw, color: 'text-accent' },
  'gen-extend-properties': { label: 'Extend', icon: ChevronRight, color: 'text-accent' },
  'broll-suggest-properties': { label: 'B-Roll', icon: Film, color: 'text-accent' },
  'brand-kit-properties': { label: 'Brand Kit', icon: Palette, color: 'text-accent' },
  'crowd-properties': { label: 'Crowd', icon: Users, color: 'text-accent' },
  'motion-gallery-styles': { label: 'Style Browser', icon: LayoutGrid, color: 'text-accent' },
}

// ---------------------------------------------------------------------------
// Text sections
// ---------------------------------------------------------------------------

export const TEXT_SECTIONS = [
  { id: 'properties', icon: Type, label: 'Properties', defaultTab: 'text-properties' as const },
  { id: 'styles', icon: Paintbrush, label: 'Styles', defaultTab: 'text-styles' as const },
  { id: 'animations', icon: Sparkles, label: 'Animations', defaultTab: 'text-animations' as const },
]
export const TEXT_TABS = new Set(['text-properties', 'text-styles', 'text-animations'])

// ---------------------------------------------------------------------------
// Pixel Art sections
// ---------------------------------------------------------------------------

export const PIXELART_SECTIONS = [
  { id: 'properties', icon: Grid3x3, label: 'Pixel Art', defaultTab: 'pixelart-character-properties' as const },
  { id: 'animations', icon: Film, label: 'Animations', defaultTab: 'pixelart-animations' as const },
]
export const PIXELART_TABS = new Set(['pixelart-character-properties', 'pixelart-animations'])

// ---------------------------------------------------------------------------
// Avatar sections
// ---------------------------------------------------------------------------

export const AVATAR_SECTIONS = [
  { id: 'properties', icon: UserCircle, label: 'Avatar', defaultTab: 'avatar-character-properties' as const },
  { id: 'videos', icon: Film, label: 'Videos', defaultTab: 'avatar-videos' as const },
  { id: 'voices', icon: Mic, label: 'Voices', defaultTab: 'avatar-voices' as const },
]
export const AVATAR_TABS = new Set(['avatar-character-properties', 'avatar-videos', 'avatar-voices'])

// ---------------------------------------------------------------------------
// Generator sections
// ---------------------------------------------------------------------------

export const GEN_TABS = new Set([
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

export const GEN_SECTIONS = [
  { id: 'gen-image-properties', label: 'Image Gen', icon: Image, tab: 'gen-image-properties' as RightPanelTab },
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
  { id: 'gen-retake-properties', label: 'Retake', icon: RotateCcw, tab: 'gen-retake-properties' as RightPanelTab },
  { id: 'gen-extend-properties', label: 'Extend', icon: ChevronRight, tab: 'gen-extend-properties' as RightPanelTab },
  { id: 'broll-suggest-properties', label: 'B-Roll', icon: Film, tab: 'broll-suggest-properties' as RightPanelTab },
  { id: 'gen-manim-properties', label: 'Manim Video', icon: Sparkles, tab: 'gen-manim-properties' as RightPanelTab },
]

// ---------------------------------------------------------------------------
// Template sections
// ---------------------------------------------------------------------------

export const TEMPLATE_TABS = new Set(['html-template-properties', 'motion-graphic-properties'])
export const TEMPLATE_SECTIONS: { id: string; label: string; icon: typeof Code; tab: RightPanelTab }[] = [
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

// ---------------------------------------------------------------------------
// Media sections
// ---------------------------------------------------------------------------

export const MEDIA_SECTIONS: { id: string; label: string; icon: typeof Image; tab: RightPanelTab }[] = [
  { id: 'media-properties', label: 'Media', icon: Image, tab: 'media-properties' as RightPanelTab },
  { id: 'video-properties', label: 'Video', icon: Film, tab: 'video-properties' as RightPanelTab },
]

export const MEDIA_TABS = new Set(['media-properties', 'video-properties'])

export type MediaSubTab = 'all' | 'transform' | 'effects' | 'timing'

export const MEDIA_SUB_TABS: Tab[] = [
  { id: 'all', icon: LayoutGrid, label: 'All' },
  { id: 'transform', icon: Move, label: 'Transform' },
  { id: 'effects', icon: Sparkles, label: 'Effects' },
  { id: 'timing', icon: Film, label: 'Timing' },
]

// ---------------------------------------------------------------------------
// Background sections
// ---------------------------------------------------------------------------

export const BG_SECTIONS = [
  { id: 'background', icon: Image, label: 'Background', defaultTab: 'whiteboard-bg-color' as const },
  { id: 'layers', icon: Layers, label: 'Layers', defaultTab: 'canvas-layers' as const },
]
export const BG_BG_TABS = new Set([
  'whiteboard-bg-color',
  'whiteboard-bg-templates',
  'whiteboard-bg-texture',
  'whiteboard-background-properties',
])
export const BG_ALL_TABS = new Set([
  'whiteboard-bg-color',
  'whiteboard-bg-templates',
  'whiteboard-bg-texture',
  'whiteboard-background-properties',
  'canvas-layers',
])

export const bgSubTabs: Tab[] = [
  { id: 'whiteboard-bg-color', icon: Palette, label: 'Color' },
  { id: 'whiteboard-bg-templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'whiteboard-bg-texture', icon: Image, label: 'Build' },
]

/** Sub-tabs for the Layers section (view mode toggle) */
export const LAYER_VIEW_TABS: Tab[] = [
  { id: 'categories', icon: LayoutGrid, label: 'Categories' },
  { id: 'custom', icon: Layers, label: 'Custom' },
]

// ---------------------------------------------------------------------------
// NB2 part mapping
// ---------------------------------------------------------------------------

export const TAB_TO_NB2_PART: Record<string, NB2PartType> = {
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

export const NB2_STEP_ICONS: Record<NB2PartType, typeof User> = {
  concept: Sparkles,
  body: PersonStanding,
  head: User,
  hair: Scissors,
  'viseme-sheet': Smile,
  'eye-strip': Eye,
  'eyebrow-strip': EyebrowIcon,
  clothing: Shirt,
}

// ---------------------------------------------------------------------------
// Rig editor
// ---------------------------------------------------------------------------

export const RIG_SECTIONS = [
  { id: 'skeleton', icon: Bone, label: 'Skeleton' },
  { id: 'clothes', icon: Shirt, label: 'Clothes' },
  { id: 'takes', icon: Film, label: 'Takes' },
] as const
export type RigSectionId = (typeof RIG_SECTIONS)[number]['id']

export const BONE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'head', label: 'Head' },
  { id: 'body', label: 'Body' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'hands', label: 'Hands' },
] as const
export type BoneCategoryId = (typeof BONE_CATEGORIES)[number]['id']

// ---------------------------------------------------------------------------
// AI Director Tool Sections
// ---------------------------------------------------------------------------

export const AI_DIRECTOR_TOOL_SECTIONS: {
  id: string
  label: string
  icon: typeof Link2
  tab: RightPanelTab
}[] = [
  { id: 'ai-director-url', label: 'URL to Video', icon: Link2, tab: 'ai-director-url' },
  { id: 'ai-director-document', label: 'Documents', icon: FileText, tab: 'ai-director-document' },
  { id: 'ai-director-brand', label: 'Brand Director', icon: Building2, tab: 'ai-director-brand' },
]

export const AI_DIRECTOR_TOOL_TABS = new Set<string>(['ai-director-url', 'ai-director-document', 'ai-director-brand'])
