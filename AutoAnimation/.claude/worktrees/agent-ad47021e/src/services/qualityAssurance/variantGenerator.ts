/**
 * A/B Variant Generator
 *
 * Takes a completed clip state and generates alternative visual treatment
 * variants by modifying: color palette, text positioning/styling,
 * animation timing, and stock media treatment.
 *
 * Works on the existing store state — no AI calls needed. Captures
 * a snapshot of the current state, applies treatments, then scores
 * each variant using the QA system.
 */

import type {
  GeneratedVariant,
  VariantTreatment,
  VariantConfig,
} from '@/types/qualityAssurance'
import { generateQAReport, extractQAInputFromStores } from './qualityGate'
// compositionEngine provides color utilities used indirectly via shiftHue

// ── Color Helpers ──

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!match) return null
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('')
}

function shiftHue(hex: string, degrees: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const { r, g, b } = rgb

  // Convert to HSL
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0, s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
    else if (max === gn) h = ((bn - rn) / d + 2) / 6
    else h = ((rn - gn) / d + 4) / 6
  }

  h = ((h * 360 + degrees) % 360) / 360
  if (h < 0) h += 1

  // HSL to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  if (s === 0) return rgbToHex(Math.round(l * 255), Math.round(l * 255), Math.round(l * 255))
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return rgbToHex(
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  )
}

// ── Store Snapshot & Restore ──

interface StoreSnapshot {
  textOverlays: unknown[]
  shapes: unknown[]
  mediaItems: unknown[]
  captionStyle: string
  aspectRatio: string
}

function captureSnapshot(): StoreSnapshot {
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const { useShapeStore } = require('@/stores/useShapeStore')
  const { useMediaStore } = require('@/stores/useMediaStore')
  const { useVoiceStore } = require('@/stores/useVoiceStore')
  const { useEditorStore } = require('@/stores')

  return {
    textOverlays: JSON.parse(JSON.stringify(useTextOverlayStore.getState().overlays || [])),
    shapes: JSON.parse(JSON.stringify(useShapeStore.getState().shapes || [])),
    mediaItems: JSON.parse(JSON.stringify(useMediaStore.getState().canvasItems || [])),
    captionStyle: useVoiceStore.getState().captionStyle,
    aspectRatio: useEditorStore.getState().aspectRatio,
  }
}

function restoreSnapshot(snapshot: StoreSnapshot): void {
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const { useShapeStore } = require('@/stores/useShapeStore')
  const { useVoiceStore } = require('@/stores/useVoiceStore')

  if (typeof useTextOverlayStore.getState().loadFromSnapshot === 'function') {
    useTextOverlayStore.getState().loadFromSnapshot(snapshot.textOverlays)
  }
  if (typeof useShapeStore.getState().loadFromSnapshot === 'function') {
    useShapeStore.getState().loadFromSnapshot(snapshot.shapes)
  }
  useVoiceStore.getState().setCaptionStyle(snapshot.captionStyle)
}

// ── Treatment Functions ──

/**
 * Apply a shifted color palette to text overlays and shapes.
 */
function applyColorSchemeTreatment(hueShift: number, _label: string): string[] {
  const changes: string[] = []
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const { useShapeStore } = require('@/stores/useShapeStore')
  const store = useTextOverlayStore.getState()
  const shapeStore = useShapeStore.getState()

  // Shift text overlay colors
  const overlays = store.overlays || []
  for (const overlay of overlays) {
    const newColor = shiftHue(overlay.color, hueShift)
    store.updateOverlay(overlay.id, { color: newColor })
  }
  if (overlays.length > 0) {
    changes.push(`Shifted ${overlays.length} text color(s) by ${hueShift} degrees`)
  }

  // Shift shape fill colors
  const shapes = shapeStore.shapes || []
  for (const shape of shapes) {
    if (shape.fill) {
      const newFill = shiftHue(shape.fill, hueShift)
      shapeStore.updateShape(shape.id, { fill: newFill })
    }
  }
  if (shapes.length > 0) {
    changes.push(`Shifted ${shapes.length} shape color(s)`)
  }

  return changes
}

/**
 * Apply different text styling (font weight, shadow, size scaling).
 */
function applyTextStyleTreatment(variant: 'bold' | 'minimal'): string[] {
  const changes: string[] = []
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const store = useTextOverlayStore.getState()
  const overlays = store.overlays || []

  for (const overlay of overlays) {
    if (variant === 'bold') {
      store.updateOverlay(overlay.id, {
        fontWeight: '800',
        shadow: true,
        fontSize: Math.round(overlay.fontSize * 1.15),
      })
    } else {
      store.updateOverlay(overlay.id, {
        fontWeight: '400',
        shadow: false,
        fontSize: Math.round(overlay.fontSize * 0.9),
        backgroundOpacity: 0.4,
      })
    }
  }

  if (overlays.length > 0) {
    changes.push(`Applied ${variant} text style to ${overlays.length} overlay(s)`)
  }

  return changes
}

/**
 * Shift text positions (higher/lower thirds, different horizontal alignment).
 */
function applyTextPositionTreatment(shift: 'higher' | 'lower'): string[] {
  const changes: string[] = []
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const store = useTextOverlayStore.getState()
  const overlays = store.overlays || []

  for (const overlay of overlays) {
    const yShift = shift === 'higher' ? -50 : 50
    store.updateOverlay(overlay.id, {
      freeY: Math.max(0, Math.min(100, overlay.freeY + yShift)),
    })
  }

  if (overlays.length > 0) {
    changes.push(`Moved ${overlays.length} text(s) ${shift}`)
  }

  return changes
}

/**
 * Apply different caption styles.
 */
function applyCaptionStyleTreatment(style: string): string[] {
  const { useVoiceStore } = require('@/stores/useVoiceStore')
  useVoiceStore.getState().setCaptionStyle(style)
  return [`Switched captions to ${style}`]
}

/**
 * Apply stock media opacity/scale treatments.
 */
function applyMediaTreatment(variant: 'dim' | 'zoom'): string[] {
  const changes: string[] = []
  const { useMediaStore } = require('@/stores/useMediaStore')
  const store = useMediaStore.getState()
  const items = store.canvasItems || []

  for (const item of items) {
    if (variant === 'dim') {
      store.updateCanvasItem(item.id, { opacity: Math.max(0.3, (item.opacity ?? 1) * 0.6) })
    } else {
      // Zoom: increase scale by 20%
      const scale = item.scale ?? 1
      store.updateCanvasItem(item.id, { scale: scale * 1.2 })
    }
  }

  if (items.length > 0) {
    changes.push(`Applied ${variant} treatment to ${items.length} media item(s)`)
  }

  return changes
}

// ── Variant Presets ──

interface VariantPreset {
  label: string
  treatments: VariantTreatment[]
  apply: () => string[]
}

const VARIANT_PRESETS: VariantPreset[] = [
  {
    label: 'Warm Palette + Bold Text',
    treatments: ['color_scheme', 'text_style'],
    apply: () => [
      ...applyColorSchemeTreatment(30, 'warm'),
      ...applyTextStyleTreatment('bold'),
    ],
  },
  {
    label: 'Cool Palette + Minimal Style',
    treatments: ['color_scheme', 'text_style'],
    apply: () => [
      ...applyColorSchemeTreatment(-60, 'cool'),
      ...applyTextStyleTreatment('minimal'),
    ],
  },
  {
    label: 'High Contrast + Repositioned',
    treatments: ['color_scheme', 'layout'],
    apply: () => [
      ...applyColorSchemeTreatment(180, 'contrast'),
      ...applyTextPositionTreatment('higher'),
    ],
  },
  {
    label: 'Cinematic + Dimmed Media',
    treatments: ['text_style', 'caption_style'],
    apply: () => [
      ...applyTextStyleTreatment('bold'),
      ...applyMediaTreatment('dim'),
      ...applyCaptionStyleTreatment('sentence'),
    ],
  },
  {
    label: 'Dynamic + Zoomed Media',
    treatments: ['layout', 'caption_style'],
    apply: () => [
      ...applyTextPositionTreatment('lower'),
      ...applyMediaTreatment('zoom'),
      ...applyCaptionStyleTreatment('karaoke'),
    ],
  },
]

// ── Main Variant Generator ──

/**
 * Generate A/B variants of the current clip by applying different visual treatments.
 * Captures a snapshot before each variant, applies treatments, scores, and restores.
 *
 * @returns Array of GeneratedVariant objects with scores and change descriptions.
 */
export function generateVariants(config?: Partial<VariantConfig>): GeneratedVariant[] {
  const count = config?.count ?? 2
  const includeOriginal = config?.includeOriginal ?? true

  const originalSnapshot = captureSnapshot()
  const variants: GeneratedVariant[] = []

  // Score the original
  if (includeOriginal) {
    const input = extractQAInputFromStores()
    const report = generateQAReport(input)
    variants.push({
      index: 0,
      label: 'Original',
      appliedTreatments: [],
      changes: [],
      qaScore: report.overallScore,
      viralScore: null,
      planDelta: {},
    })
  }

  // Generate treatment variants
  const presetsToUse = VARIANT_PRESETS.slice(0, count)

  for (let i = 0; i < presetsToUse.length; i++) {
    const preset = presetsToUse[i]

    // Restore original state before applying this variant's treatments
    restoreSnapshot(originalSnapshot)

    // Apply treatments
    const changes = preset.apply()

    // Score this variant
    const input = extractQAInputFromStores()
    const report = generateQAReport(input)

    variants.push({
      index: includeOriginal ? i + 1 : i,
      label: `Variant ${String.fromCharCode(65 + (includeOriginal ? i + 1 : i))} — ${preset.label}`,
      appliedTreatments: preset.treatments,
      changes,
      qaScore: report.overallScore,
      viralScore: null,
      planDelta: { treatments: preset.treatments },
    })
  }

  // Restore to original state after all variants are scored
  restoreSnapshot(originalSnapshot)

  // Sort by QA score (best first, keeping original at top if present)
  if (includeOriginal) {
    const original = variants[0]
    const rest = variants.slice(1).sort((a, b) => (b.qaScore ?? 0) - (a.qaScore ?? 0))
    return [original, ...rest]
  }

  return variants.sort((a, b) => (b.qaScore ?? 0) - (a.qaScore ?? 0))
}

/**
 * Apply a specific variant's treatments to the current clip state.
 * Call this after the user selects a variant to keep.
 */
export function applyVariant(variantIndex: number, variants: GeneratedVariant[]): boolean {
  const variant = variants.find((v) => v.index === variantIndex)
  if (!variant || variant.appliedTreatments.length === 0) return false

  // Find and re-apply the preset
  const preset = VARIANT_PRESETS.find((p) =>
    p.treatments.every((t) => variant.appliedTreatments.includes(t)),
  )
  if (!preset) return false

  preset.apply()
  return true
}
