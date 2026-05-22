/**
 * Orchestrator constants, shared types, and utility functions.
 */

import type { ClipPlan, CostEntry, OrchestratorSettings } from '@/types/orchestrator'
import type { TextOverlay, FontFamily } from '@/stores/useTextOverlayStore'
import type { GeneratedVoice } from '@/types/voice'
import type { ColorPalette, SafeZone, ThirdsGrid, BrandGuide, CharacterLayout } from '@/services/compositionEngine'

// ── API & Pricing Constants ──

// Use stable gemini-2.5-flash for production reliability.
// gemini-3.1-flash-lite-preview is available but still in preview.
export const GEMINI_MODEL = 'gemini-2.5-flash'

// GEMINI_API_URL now holds the model name for callGeminiProxy() instead of a URL
export const GEMINI_API_URL = GEMINI_MODEL

// ElevenLabs pricing (Starter plan estimate: ~$0.30 per 1,000 characters)
export const ELEVENLABS_COST_PER_CHAR = 0.0003 // $0.30 / 1000 chars

// Gemini 2.5 Pro pricing (USD per 1M tokens) — used for SVG generation cost tracking
export const GEMINI_PRO_INPUT_PRICE = 1.25
export const GEMINI_PRO_OUTPUT_PRICE = 10.0

// ── Dimension Constants ──

export const ASPECT_RATIO_DIMENSIONS: Record<string, { w: number; h: number }> = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '1:1': { w: 1080, h: 1080 },
  '4:3': { w: 1440, h: 1080 },
  '21:9': { w: 2560, h: 1080 },
}

// ── Text Overlay Presets ──

export const TEXT_PRESET_DEFAULTS: Record<string, Partial<TextOverlay>> = {
  title: {
    fontFamily: 'Montserrat',
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'center',
    shadow: true,
    background: false,
    textCase: 'none',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: 'normal',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'bottom',
    shadow: true,
    background: false,
    textCase: 'none',
  },
  'lower-third': {
    fontFamily: 'Roboto',
    fontSize: 28,
    fontWeight: 'medium',
    color: '#ffffff',
    align: 'left',
    verticalAlign: 'bottom',
    position: 'bottom',
    shadow: false,
    background: true,
    backgroundOpacity: 0.7,
    textCase: 'none',
  },
  cta: {
    fontFamily: 'Montserrat',
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'bottom',
    shadow: false,
    background: true,
    backgroundOpacity: 0.9,
    textCase: 'uppercase',
  },
  quote: {
    fontFamily: 'Playfair Display',
    fontSize: 40,
    fontWeight: 'normal',
    color: '#ffffff',
    align: 'center',
    verticalAlign: 'middle',
    position: 'center',
    shadow: true,
    background: false,
    textCase: 'none',
  },
  watermark: {
    fontFamily: 'Space Mono',
    fontSize: 16,
    fontWeight: 'normal',
    color: '#ffffff',
    align: 'right',
    verticalAlign: 'top',
    position: 'top',
    shadow: false,
    background: false,
    textCase: 'none',
    opacity: 0.5,
  },
}

// ── Font Validation ──

export const VALID_FONT_FAMILIES: string[] = ['Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Space Mono']

export function safeFontFamily(font: string | undefined, fallback: string = 'Inter'): FontFamily {
  if (font && VALID_FONT_FAMILIES.includes(font)) return font as FontFamily
  if (fallback && VALID_FONT_FAMILIES.includes(fallback)) return fallback as FontFamily
  return 'Inter'
}

// ── Stock Media Role Defaults ──

/** Default z-index by role — lower = further back */
export const ROLE_ZINDEX: Record<string, number> = {
  background: 1,
  cutaway: 4,
  overlay: 6,
  accent: 7,
}

/** Default scale by role — relative to canvas fit */
export const ROLE_DEFAULT_SCALE: Record<string, number> = {
  background: 1.05, // slight bleed to avoid edges
  cutaway: 1.0, // full canvas
  overlay: 0.4, // small overlay in corner
  accent: 0.25, // small accent element
}

/** Default transition by role */
export const ROLE_DEFAULT_ENTER: Record<string, string> = {
  background: 'fade',
  cutaway: 'fade',
  overlay: 'zoom-in',
  accent: 'slide-up',
}
export const ROLE_DEFAULT_EXIT: Record<string, string> = {
  background: 'fade',
  cutaway: 'fade',
  overlay: 'zoom-out',
  accent: 'fade',
}

// ── Shared Types ──

export type StepRunner = (plan: ClipPlan, context: ExecutionContext) => Promise<void>

export interface ExecutionContext {
  /** Map characterName -> dialogue character ID in store */
  characterIdMap: Map<string, string>
  /** Map characterName -> matched saved character ID */
  savedCharacterIdMap: Map<string, string>
  /** Map characterName -> voice ID (ElevenLabs) */
  voiceIdMap: Map<string, string>
  /** Generated voice data per dialogue line index */
  generatedVoices: GeneratedVoice[]
  /** Total frames for the clip */
  totalFrames: number
  /** FPS */
  fps: number
  /** Callback to report cost entries from execution steps */
  addCostEntry?: (entry: CostEntry) => void
  /** Marketplace listing IDs used during execution (for royalty distribution) */
  usedMarketplaceListingIds: string[]
  /** Orchestrator settings (for brand context, etc.) */
  settings?: OrchestratorSettings
  /** Beat timestamps (seconds) detected from generated music, for auto-cut alignment */
  beatTimestamps?: number[]
  /** Frame where the first dialogue line starts */
  dialogueStartFrame?: number
  /** Frame where the last dialogue line ends */
  dialogueEndFrame?: number
  /** Translated scripts by dialogue line index (set by generateVoices when plan.language is non-English) */
  translatedScripts?: Map<number, string>
  /** Map characterName -> available rig animations (name, index, duration) */
  rigAnimationMap: Map<string, { name: string; index: number; duration: number }[]>
  /** Pre-computed composition layout from the composition engine */
  compositionLayout?: {
    characters: CharacterLayout[]
    palette: ColorPalette
    safeZone: SafeZone
    grid: ThirdsGrid
    brandGuide?: BrandGuide
  }
  /** QA quality gate result from finalize step */
  qaResult?: import('@/types/qualityAssurance').QualityGateResult
}

/**
 * Create a fresh execution context.
 */
export function createExecutionContext(plan: ClipPlan): ExecutionContext {
  return {
    characterIdMap: new Map(),
    savedCharacterIdMap: new Map(),
    voiceIdMap: new Map(),
    generatedVoices: [],
    totalFrames: plan.canvas.fps * plan.canvas.durationSeconds,
    fps: plan.canvas.fps,
    usedMarketplaceListingIds: [],
    rigAnimationMap: new Map(),
  }
}
