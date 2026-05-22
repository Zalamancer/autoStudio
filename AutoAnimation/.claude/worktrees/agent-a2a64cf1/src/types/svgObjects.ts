/**
 * Types for the declarative SVG object animation system.
 *
 * Claude generates per-object definitions with:
 * - Static SVG markup (with {{colorName}} placeholders)
 * - Animation keyframes (time-based transforms)
 * - Editable color slots
 *
 * The browser interpolates keyframes at the current frame — no per-frame
 * JavaScript execution required.
 */

// ---------------------------------------------------------------------------
// Keyframe types
// ---------------------------------------------------------------------------

/** A single animation keyframe — transform values at a point in time */
export interface SVGObjectKeyframe {
  /** Time as fraction 0-1 (0 = start, 1 = end of animation) */
  time: number
  /** Translation X in pixels */
  x?: number
  /** Translation Y in pixels */
  y?: number
  /** Rotation in degrees */
  rotation?: number
  /** Scale X factor (1 = normal) */
  scaleX?: number
  /** Scale Y factor (1 = normal) */
  scaleY?: number
  /** Opacity 0-1 */
  opacity?: number
  /** Easing to the next keyframe */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/** Resolved transform values at a specific point in time */
export interface ResolvedTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  opacity: number
}

// ---------------------------------------------------------------------------
// Object definitions (from server / Claude)
// ---------------------------------------------------------------------------

/** Raw object definition returned by the server (from Claude output) */
export interface SVGObjectDefinition {
  name: string                           // e.g. "sky_gradient", "mountains", "sun"
  zIndex: number
  defaultColors: Record<string, string>  // { primary: "#1a1a2e", glow: "#e94560" }
  svgMarkup: string                      // static <g>...</g> with {{colorName}} placeholders
  keyframes: SVGObjectKeyframe[]         // animation keyframes
  error?: string                         // validation error if markup is invalid
}

/** Frontend-side SVG object with editable properties */
export interface SVGObject {
  id: string
  name: string
  zIndex: number
  visible: boolean
  colors: Record<string, string>         // editable, starts as copy of defaults
  defaultColors: Record<string, string>
  svgMarkup: string                      // static SVG markup with {{colorName}} placeholders
  keyframes: SVGObjectKeyframe[]         // animation keyframes
  startFrame: number                     // default 0
  endFrame: number                       // default totalFrames
  opacity: number                        // 0-1 (user override, multiplied with keyframe opacity)
  /** Hand-drawn boiling line effect settings (optional) */
  boilingLine?: import('./boilingLine').BoilingLineSettings
  /** Pixel art post-processing effect settings (optional) */
  pixelArt?: import('./pixelArtEffect').PixelArtEffectSettings
  /** Active Canvas 2D style effect (mutually exclusive — only one at a time) */
  activeStyleEffect?: import('./styleEffects').ActiveStyleEffect
  /** Blend mode for compositing */
  blendMode?: import('./blendModes').BlendMode
  /** Blur amount in pixels (0 = no blur) */
  blur?: number
  /** Blur type */
  blurType?: import('./blurEffect').BlurType
  /** Motion blur angle in degrees */
  motionBlurAngle?: number
}

/** A full composition of SVG objects */
export interface SVGObjectComposition {
  id: string
  prompt: string
  background: string
  width: number
  height: number
  objects: SVGObject[]
}

/** API response from /api/ai-animation/generate-objects */
export interface GenerateObjectsResponse {
  objects: SVGObjectDefinition[]
  background: string
  width: number
  height: number
  /** Token usage from Gemini API (if available) */
  tokenUsage?: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number }
}
