/**
 * Smart Auto-Layout Engine
 *
 * Rule-based layout algorithms for positioning canvas elements:
 * - Rule of thirds
 * - Golden ratio
 * - Visual hierarchy
 * - Safe zone awareness (social media UI overlaps)
 * - Overlap avoidance
 *
 * Works with text overlays, characters, shapes, media items, and 3D characters.
 */

import type { AspectRatio } from '@/types/editor'

// ── Types ──

export interface LayoutRect {
  id: string
  type: 'text' | 'character' | 'shape' | 'media' | '3d-character'
  label: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  /** Importance weight for visual hierarchy (higher = more important) */
  importance: number
}

export interface LayoutSuggestion {
  id: string
  elementId: string
  elementType: LayoutRect['type']
  label: string
  reason: string
  original: { x: number; y: number; width: number; height: number }
  suggested: { x: number; y: number; width: number; height: number }
}

export interface LayoutPreset {
  id: string
  name: string
  description: string
  layout: (elements: LayoutRect[], canvas: CanvasDimensions) => LayoutSuggestion[]
}

export interface CanvasDimensions {
  width: number
  height: number
  aspectRatio: AspectRatio
}

/** Safe zone margins as fractions of canvas dimensions */
export interface SafeZones {
  top: number
  bottom: number
  left: number
  right: number
}

// ── Constants ──

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

/** Social media safe zones (percentage of canvas edge to avoid) */
const SOCIAL_SAFE_ZONES: Record<AspectRatio, SafeZones> = {
  '9:16': { top: 0.12, bottom: 0.15, left: 0.05, right: 0.05 },  // TikTok/Reels UI
  '16:9': { top: 0.05, bottom: 0.08, left: 0.05, right: 0.05 },  // YouTube
  '1:1':  { top: 0.05, bottom: 0.10, left: 0.05, right: 0.05 },  // Instagram
  '4:3':  { top: 0.05, bottom: 0.08, left: 0.05, right: 0.05 },
  '21:9': { top: 0.05, bottom: 0.08, left: 0.08, right: 0.08 },
}

const GOLDEN_RATIO = 1.618

// ── Utility Functions ──

export function getCanvasDimensions(aspectRatio: AspectRatio): CanvasDimensions {
  const dims = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['16:9']
  return { ...dims, aspectRatio }
}

function getSafeArea(canvas: CanvasDimensions): { x: number; y: number; w: number; h: number } {
  const sz = SOCIAL_SAFE_ZONES[canvas.aspectRatio] || SOCIAL_SAFE_ZONES['16:9']
  return {
    x: canvas.width * sz.left,
    y: canvas.height * sz.top,
    w: canvas.width * (1 - sz.left - sz.right),
    h: canvas.height * (1 - sz.top - sz.bottom),
  }
}

/** Rule of thirds grid points */
function getThirdsPoints(canvas: CanvasDimensions) {
  const safe = getSafeArea(canvas)
  return {
    left: safe.x + safe.w / 3,
    center: safe.x + safe.w / 2,
    right: safe.x + (2 * safe.w) / 3,
    top: safe.y + safe.h / 3,
    middle: safe.y + safe.h / 2,
    bottom: safe.y + (2 * safe.h) / 3,
  }
}

/** Golden ratio points within safe area */
function getGoldenPoints(canvas: CanvasDimensions) {
  const safe = getSafeArea(canvas)
  const goldenSmall = 1 / GOLDEN_RATIO
  const goldenLarge = 1 - goldenSmall
  return {
    leftGolden: safe.x + safe.w * goldenSmall,
    rightGolden: safe.x + safe.w * goldenLarge,
    topGolden: safe.y + safe.h * goldenSmall,
    bottomGolden: safe.y + safe.h * goldenLarge,
  }
}

/** Check if two rects overlap */
function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  padding = 20,
): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  )
}

/** Clamp rect within safe area */
function clampToSafe(
  rect: { x: number; y: number; width: number; height: number },
  canvas: CanvasDimensions,
): { x: number; y: number; width: number; height: number } {
  const safe = getSafeArea(canvas)
  const maxW = Math.min(rect.width, safe.w)
  const maxH = Math.min(rect.height, safe.h)
  return {
    x: Math.max(safe.x, Math.min(rect.x, safe.x + safe.w - maxW)),
    y: Math.max(safe.y, Math.min(rect.y, safe.y + safe.h - maxH)),
    width: maxW,
    height: maxH,
  }
}

/** Push overlapping elements apart */
export function resolveOverlaps(
  rects: Array<{ x: number; y: number; width: number; height: number; id: string }>,
  canvas: CanvasDimensions,
  padding = 20,
): Map<string, { x: number; y: number }> {
  const adjustments = new Map<string, { x: number; y: number }>()
  const safe = getSafeArea(canvas)
  const sorted = [...rects].sort((a, b) => a.y - b.y)

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    for (let j = i + 1; j < sorted.length; j++) {
      const other = sorted[j]
      if (rectsOverlap(current, other, padding)) {
        // Push the lower-priority element down
        const newY = current.y + current.height + padding
        if (newY + other.height <= safe.y + safe.h) {
          other.y = newY
          adjustments.set(other.id, { x: other.x, y: newY })
        } else {
          // Try pushing right
          const newX = current.x + current.width + padding
          if (newX + other.width <= safe.x + safe.w) {
            other.x = newX
            adjustments.set(other.id, { x: newX, y: other.y })
          }
        }
      }
    }
  }

  return adjustments
}

// ── Importance Scoring ──

export function assignImportance(element: LayoutRect): number {
  const typeWeights: Record<LayoutRect['type'], number> = {
    'character': 10,
    '3d-character': 10,
    'text': 7,
    'media': 5,
    'shape': 3,
  }
  let score = typeWeights[element.type] || 5

  // Larger elements tend to be more important
  const area = element.width * element.height
  if (area > 200000) score += 2
  else if (area > 50000) score += 1

  return score
}

// ── Main Layout Engine ──

/**
 * Analyze current element positions and generate repositioning suggestions.
 * Uses rule-based algorithms: rule of thirds, golden ratio, visual hierarchy,
 * safe zone awareness, and overlap avoidance.
 */
export function generateAutoLayout(
  elements: LayoutRect[],
  canvas: CanvasDimensions,
): LayoutSuggestion[] {
  if (elements.length === 0) return []

  const suggestions: LayoutSuggestion[] = []
  const safe = getSafeArea(canvas)
  const thirds = getThirdsPoints(canvas)
  const golden = getGoldenPoints(canvas)

  // Sort by importance (highest first)
  const sorted = [...elements]
    .map((el) => ({ ...el, importance: assignImportance(el) }))
    .sort((a, b) => b.importance - a.importance)

  // Track placed positions for overlap avoidance
  const placed: Array<{ x: number; y: number; width: number; height: number; id: string }> = []

  for (const element of sorted) {
    let suggestedX = element.x
    let suggestedY = element.y
    let suggestedW = element.width
    let suggestedH = element.height
    const reasons: string[] = []

    // 1. Check if element is outside safe zone
    const isOutsideSafe =
      element.x < safe.x ||
      element.y < safe.y ||
      element.x + element.width > safe.x + safe.w ||
      element.y + element.height > safe.y + safe.h

    if (isOutsideSafe) {
      const clamped = clampToSafe(
        { x: element.x, y: element.y, width: element.width, height: element.height },
        canvas,
      )
      suggestedX = clamped.x
      suggestedY = clamped.y
      suggestedW = clamped.width
      suggestedH = clamped.height
      reasons.push('Moved into safe zone to avoid social media UI overlap')
    }

    // 2. Visual hierarchy: position primary elements at power points
    if (element.importance >= 9) {
      // Primary element: center or golden ratio position
      suggestedX = thirds.center - suggestedW / 2
      suggestedY = golden.topGolden - suggestedH / 2
      reasons.push('Positioned at golden ratio focal point for visual dominance')
    } else if (element.importance >= 6) {
      // Secondary element: rule of thirds intersection
      if (element.type === 'text') {
        // Text at bottom third for readability
        suggestedX = thirds.center - suggestedW / 2
        suggestedY = thirds.bottom - suggestedH / 2
        reasons.push('Aligned to bottom third grid line for text readability')
      } else {
        suggestedX = thirds.right - suggestedW / 2
        suggestedY = thirds.top - suggestedH / 2
        reasons.push('Snapped to rule-of-thirds intersection point')
      }
    } else {
      // Tertiary element: fill remaining space
      suggestedX = safe.x + 40
      suggestedY = safe.y + 40
      reasons.push('Positioned in available space within safe zone')
    }

    // 3. Clamp final position to safe zone
    const finalClamped = clampToSafe(
      { x: suggestedX, y: suggestedY, width: suggestedW, height: suggestedH },
      canvas,
    )
    suggestedX = finalClamped.x
    suggestedY = finalClamped.y

    // 4. Resolve overlaps with already-placed elements
    const proposed = { x: suggestedX, y: suggestedY, width: suggestedW, height: suggestedH, id: element.id }
    for (const p of placed) {
      if (rectsOverlap(proposed, p, 20)) {
        // Try moving below
        const belowY = p.y + p.height + 20
        if (belowY + suggestedH <= safe.y + safe.h) {
          suggestedY = belowY
          proposed.y = belowY
          reasons.push('Shifted to avoid overlap with other element')
        } else {
          // Try moving to the side
          const sideX = p.x + p.width + 20
          if (sideX + suggestedW <= safe.x + safe.w) {
            suggestedX = sideX
            proposed.x = sideX
            reasons.push('Shifted horizontally to avoid overlap')
          }
        }
      }
    }

    placed.push({ x: suggestedX, y: suggestedY, width: suggestedW, height: suggestedH, id: element.id })

    // Only suggest if position actually changed
    const dx = Math.abs(suggestedX - element.x)
    const dy = Math.abs(suggestedY - element.y)
    const dw = Math.abs(suggestedW - element.width)
    const dh = Math.abs(suggestedH - element.height)

    if (dx > 5 || dy > 5 || dw > 5 || dh > 5) {
      suggestions.push({
        id: `suggestion-${element.id}-${Date.now()}`,
        elementId: element.id,
        elementType: element.type,
        label: element.label,
        reason: reasons.join('. ') || 'Optimized position for better composition',
        original: {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
        },
        suggested: {
          x: Math.round(suggestedX),
          y: Math.round(suggestedY),
          width: Math.round(suggestedW),
          height: Math.round(suggestedH),
        },
      })
    }
  }

  return suggestions
}

// ── Layout Presets ──

function centerLayout(elements: LayoutRect[], canvas: CanvasDimensions): LayoutSuggestion[] {
  const safe = getSafeArea(canvas)
  const centerX = safe.x + safe.w / 2
  const suggestions: LayoutSuggestion[] = []

  // Stack elements vertically, centered horizontally
  const totalHeight = elements.reduce((sum, el) => sum + el.height, 0)
  const spacing = Math.min(30, (safe.h - totalHeight) / Math.max(1, elements.length - 1))
  let currentY = safe.y + (safe.h - totalHeight - spacing * (elements.length - 1)) / 2

  const sorted = [...elements].sort((a, b) => assignImportance(b) - assignImportance(a))

  for (const el of sorted) {
    const newX = centerX - el.width / 2
    const newY = currentY

    if (Math.abs(newX - el.x) > 5 || Math.abs(newY - el.y) > 5) {
      suggestions.push({
        id: `center-${el.id}`,
        elementId: el.id,
        elementType: el.type,
        label: el.label,
        reason: 'Centered horizontally with vertical stacking',
        original: { x: el.x, y: el.y, width: el.width, height: el.height },
        suggested: {
          x: Math.round(newX),
          y: Math.round(newY),
          width: el.width,
          height: el.height,
        },
      })
    }

    currentY += el.height + spacing
  }

  return suggestions
}

function splitScreenLayout(elements: LayoutRect[], canvas: CanvasDimensions): LayoutSuggestion[] {
  const safe = getSafeArea(canvas)
  const suggestions: LayoutSuggestion[] = []

  if (elements.length < 2) return centerLayout(elements, canvas)

  const sorted = [...elements].sort((a, b) => assignImportance(b) - assignImportance(a))
  const halfW = safe.w / 2 - 20 // gap

  for (let i = 0; i < sorted.length; i++) {
    const el = sorted[i]
    const isLeft = i % 2 === 0
    const columnX = isLeft ? safe.x : safe.x + safe.w / 2 + 10
    const columnW = Math.min(el.width, halfW)
    const newX = columnX + (halfW - columnW) / 2
    const newY = safe.y + (safe.h - el.height) / 2

    suggestions.push({
      id: `split-${el.id}`,
      elementId: el.id,
      elementType: el.type,
      label: el.label,
      reason: isLeft ? 'Placed in left half of split screen' : 'Placed in right half of split screen',
      original: { x: el.x, y: el.y, width: el.width, height: el.height },
      suggested: {
        x: Math.round(newX),
        y: Math.round(newY),
        width: el.width,
        height: el.height,
      },
    })
  }

  return suggestions
}

function lowerThirdLayout(elements: LayoutRect[], canvas: CanvasDimensions): LayoutSuggestion[] {
  const safe = getSafeArea(canvas)
  const suggestions: LayoutSuggestion[] = []

  const sorted = [...elements].sort((a, b) => assignImportance(b) - assignImportance(a))

  // Primary elements (characters, media) go to the upper portion
  // Text and shapes go to the lower third
  const primary = sorted.filter((el) => el.type === 'character' || el.type === '3d-character' || el.type === 'media')
  const secondary = sorted.filter((el) => el.type === 'text' || el.type === 'shape')

  const upperH = safe.h * 0.65
  const lowerY = safe.y + safe.h * 0.7

  // Center primary elements in upper area
  for (const el of primary) {
    const newX = safe.x + safe.w / 2 - el.width / 2
    const newY = safe.y + upperH / 2 - el.height / 2
    suggestions.push({
      id: `lower-third-${el.id}`,
      elementId: el.id,
      elementType: el.type,
      label: el.label,
      reason: 'Positioned in upper area of lower-third layout',
      original: { x: el.x, y: el.y, width: el.width, height: el.height },
      suggested: { x: Math.round(newX), y: Math.round(newY), width: el.width, height: el.height },
    })
  }

  // Stack secondary elements in the lower third
  let lowerCurrentY = lowerY
  for (const el of secondary) {
    const newX = safe.x + 40
    const newY = lowerCurrentY
    const newW = Math.min(el.width, safe.w - 80)
    suggestions.push({
      id: `lower-third-${el.id}`,
      elementId: el.id,
      elementType: el.type,
      label: el.label,
      reason: 'Placed in lower third for overlay-style text',
      original: { x: el.x, y: el.y, width: el.width, height: el.height },
      suggested: { x: Math.round(newX), y: Math.round(newY), width: newW, height: el.height },
    })
    lowerCurrentY += el.height + 10
  }

  return suggestions
}

function cornerPIPLayout(elements: LayoutRect[], canvas: CanvasDimensions): LayoutSuggestion[] {
  const safe = getSafeArea(canvas)
  const suggestions: LayoutSuggestion[] = []

  if (elements.length === 0) return []

  const sorted = [...elements].sort((a, b) => assignImportance(b) - assignImportance(a))

  // Primary element: full safe area
  const primary = sorted[0]
  suggestions.push({
    id: `pip-${primary.id}`,
    elementId: primary.id,
    elementType: primary.type,
    label: primary.label,
    reason: 'Full canvas as main content in picture-in-picture layout',
    original: { x: primary.x, y: primary.y, width: primary.width, height: primary.height },
    suggested: {
      x: Math.round(safe.x),
      y: Math.round(safe.y),
      width: Math.round(safe.w),
      height: Math.round(safe.h),
    },
  })

  // Secondary elements: corner PIP boxes
  const pipSize = Math.min(safe.w, safe.h) * 0.25
  const corners = [
    { x: safe.x + safe.w - pipSize - 20, y: safe.y + 20 },       // top-right
    { x: safe.x + 20, y: safe.y + 20 },                           // top-left
    { x: safe.x + safe.w - pipSize - 20, y: safe.y + safe.h - pipSize - 20 }, // bottom-right
    { x: safe.x + 20, y: safe.y + safe.h - pipSize - 20 },        // bottom-left
  ]

  for (let i = 1; i < sorted.length && i - 1 < corners.length; i++) {
    const el = sorted[i]
    const corner = corners[i - 1]
    suggestions.push({
      id: `pip-${el.id}`,
      elementId: el.id,
      elementType: el.type,
      label: el.label,
      reason: `Resized to corner PIP position`,
      original: { x: el.x, y: el.y, width: el.width, height: el.height },
      suggested: {
        x: Math.round(corner.x),
        y: Math.round(corner.y),
        width: Math.round(pipSize),
        height: Math.round(pipSize),
      },
    })
  }

  return suggestions
}

// ── Export Presets ──

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'auto',
    name: 'Auto',
    description: 'Smart positioning using rule of thirds, golden ratio, and visual hierarchy',
    layout: generateAutoLayout,
  },
  {
    id: 'centered',
    name: 'Centered',
    description: 'All elements centered horizontally, stacked vertically by importance',
    layout: centerLayout,
  },
  {
    id: 'split-screen',
    name: 'Split Screen',
    description: 'Elements distributed across left and right halves',
    layout: splitScreenLayout,
  },
  {
    id: 'lower-third',
    name: 'Lower Third',
    description: 'Characters/media up top, text and shapes in the lower third',
    layout: lowerThirdLayout,
  },
  {
    id: 'corner-pip',
    name: 'Corner PIP',
    description: 'Primary element full-screen, others as picture-in-picture corners',
    layout: cornerPIPLayout,
  },
]

// ── Element Collection from Stores ──

/**
 * Collect all canvas elements from stores into a uniform LayoutRect array.
 * Uses `.getState()` to read from stores without React hooks.
 */
export function collectCanvasElements(): LayoutRect[] {
  // Lazy imports to avoid circular dependencies
  const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
  const { useShapeStore } = require('@/stores/useShapeStore')
  const { useMediaStore } = require('@/stores/useMediaStore')
  const { use3DCharacterStore } = require('@/stores/use3DCharacterStore')
  const { useMultiCharacterStore } = require('@/stores/useMultiCharacterStore')

  const elements: LayoutRect[] = []

  // Text overlays
  const textOverlays = useTextOverlayStore.getState().overlays
  for (const overlay of textOverlays) {
    if (!overlay.visible) continue
    // Estimate text dimensions for free-positioned overlays
    const w = overlay.width ?? 400
    const h = overlay.height ?? 60
    const x = overlay.position === 'free' ? overlay.freeX : 0
    const y = overlay.position === 'free' ? overlay.freeY : 0
    elements.push({
      id: overlay.id,
      type: 'text',
      label: overlay.content.slice(0, 30) || 'Text',
      x,
      y,
      width: w,
      height: h,
      zIndex: overlay.zIndex,
      importance: overlay.presetType === 'title' ? 8 : overlay.presetType === 'subtitle' ? 6 : 5,
    })
  }

  // Shapes
  const shapes = useShapeStore.getState().shapes
  for (const shape of shapes) {
    if (!shape.visible) continue
    elements.push({
      id: shape.id,
      type: 'shape',
      label: shape.name || `Shape`,
      x: shape.position.x,
      y: shape.position.y,
      width: shape.width,
      height: shape.height,
      zIndex: shape.zIndex,
      importance: 3,
    })
  }

  // Media items
  const mediaItems = useMediaStore.getState().canvasItems
  for (const item of mediaItems) {
    if (!item.visible) continue
    elements.push({
      id: item.id,
      type: 'media',
      label: 'Media',
      x: item.position.x,
      y: item.position.y,
      width: (item.scale || 1) * 300, // approximate
      height: (item.scale || 1) * 200,
      zIndex: item.zIndex,
      importance: 5,
    })
  }

  // 3D characters
  const chars3D = use3DCharacterStore.getState().characters
  for (const char of chars3D) {
    if (!char.visible) continue
    elements.push({
      id: char.id,
      type: '3d-character',
      label: char.name || '3D Character',
      x: char.position.x,
      y: char.position.y,
      width: 300 * (char.scale || 1),
      height: 400 * (char.scale || 1),
      zIndex: 10,
      importance: 10,
    })
  }

  // Dialogue characters (2D)
  const dialogueChars = useMultiCharacterStore.getState().characters
  for (const dChar of dialogueChars) {
    if (!dChar.visible) continue
    elements.push({
      id: dChar.id,
      type: 'character',
      label: dChar.name || '2D Character',
      x: dChar.position.x,
      y: dChar.position.y,
      width: 300 * (dChar.scale || 1),
      height: 400 * (dChar.scale || 1),
      zIndex: dChar.zIndex,
      importance: 10,
    })
  }

  return elements
}
