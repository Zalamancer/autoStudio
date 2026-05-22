/**
 * Composition Engine — intelligent visual layout and positioning system.
 *
 * Provides rule-of-thirds placement, visual hierarchy sizing, platform safe zones,
 * dynamic multi-element layout, color theory palette generation, depth layering,
 * brand consistency enforcement, and smart negative space management.
 *
 * Called by the orchestrator to compute optimal positions for characters,
 * text overlays, stock media, SVG objects, and shapes.
 */

import type { ExtractedColor } from './colorExtraction'
import type { BrandProfile } from '@/types/brandDirector'
import { hexToRgb, rgbToHex } from '@/utils/color'

// ─── Core Types ─────────────────────────────────────────────────────────────

export type AspectRatioKey = '16:9' | '9:16' | '1:1' | '4:3' | '21:9'

export interface CanvasConfig {
  width: number
  height: number
  aspectRatio: AspectRatioKey
}

/** Percentage-based position (0-100) */
export interface Position {
  x: number
  y: number
}

export interface ElementPlacement {
  position: Position
  scale: number
  zIndex: number
  opacity: number
}

export type ElementRole = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'background'
export type DepthLayer = 'foreground' | 'midground' | 'background'

export interface LayoutElement {
  id: string
  role: ElementRole
  type: 'character' | 'text' | 'media' | 'svg' | 'shape' | 'template'
  /** Approximate width as % of canvas (0-100) */
  widthPercent?: number
  /** Approximate height as % of canvas (0-100) */
  heightPercent?: number
  /** Preferred depth layer */
  depthLayer?: DepthLayer
}

export interface ComputedLayout {
  placements: Map<string, ElementPlacement>
  safeZone: SafeZone
  grid: ThirdsGrid
}

// ─── Platform Safe Zones ────────────────────────────────────────────────────

export interface SafeZone {
  /** Safe content area as percentage insets from each edge (0-100) */
  top: number
  bottom: number
  left: number
  right: number
}

export type TargetPlatform = 'tiktok' | 'youtube' | 'instagram' | 'reels' | 'generic'

/**
 * Platform-specific safe zones (in % of canvas) to avoid UI overlays.
 *
 * TikTok: username/caption at bottom-left, like/comment/share buttons on right,
 *         music bar at bottom, "For You / Following" tabs at top.
 * YouTube Shorts: similar to TikTok but slightly different margins.
 * Instagram Reels: bottom caption area, right-side action buttons.
 */
const PLATFORM_SAFE_ZONES: Record<TargetPlatform, SafeZone> = {
  tiktok: { top: 12, bottom: 18, left: 3, right: 12 },
  youtube: { top: 10, bottom: 15, left: 3, right: 10 },
  instagram: { top: 8, bottom: 20, left: 3, right: 10 },
  reels: { top: 8, bottom: 20, left: 3, right: 10 },
  generic: { top: 5, bottom: 5, left: 5, right: 5 },
}

export function getSafeZone(platform: TargetPlatform = 'generic'): SafeZone {
  return PLATFORM_SAFE_ZONES[platform] || PLATFORM_SAFE_ZONES.generic
}

/**
 * Returns the usable content rectangle as percentage bounds (0-100).
 */
export function getSafeContentBounds(platform: TargetPlatform = 'generic') {
  const sz = getSafeZone(platform)
  return {
    minX: sz.left,
    maxX: 100 - sz.right,
    minY: sz.top,
    maxY: 100 - sz.bottom,
  }
}

// ─── Rule of Thirds Grid ────────────────────────────────────────────────────

export interface ThirdsGrid {
  /** Vertical lines at 1/3 and 2/3 of width */
  verticalLines: [number, number]
  /** Horizontal lines at 1/3 and 2/3 of height */
  horizontalLines: [number, number]
  /** The 4 power points (intersections) */
  powerPoints: Position[]
}

/**
 * Compute the rule-of-thirds grid within the safe zone.
 */
export function computeThirdsGrid(platform: TargetPlatform = 'generic'): ThirdsGrid {
  const bounds = getSafeContentBounds(platform)
  const rangeX = bounds.maxX - bounds.minX
  const rangeY = bounds.maxY - bounds.minY

  const v1 = bounds.minX + rangeX / 3
  const v2 = bounds.minX + (2 * rangeX) / 3
  const h1 = bounds.minY + rangeY / 3
  const h2 = bounds.minY + (2 * rangeY) / 3

  return {
    verticalLines: [v1, v2],
    horizontalLines: [h1, h2],
    powerPoints: [
      { x: v1, y: h1 }, // top-left
      { x: v2, y: h1 }, // top-right
      { x: v1, y: h2 }, // bottom-left
      { x: v2, y: h2 }, // bottom-right
    ],
  }
}

/**
 * Snap a position to the nearest rule-of-thirds power point.
 * Returns the power point with the smallest Euclidean distance.
 */
export function snapToThirds(pos: Position, platform: TargetPlatform = 'generic'): Position {
  const grid = computeThirdsGrid(platform)
  let best = grid.powerPoints[0]
  let bestDist = Infinity

  for (const pp of grid.powerPoints) {
    const d = Math.hypot(pp.x - pos.x, pp.y - pos.y)
    if (d < bestDist) {
      bestDist = d
      best = pp
    }
  }
  return { ...best }
}

/**
 * Place a position along the nearest thirds line (horizontal or vertical)
 * without snapping to the exact intersection.
 */
export function alignToThirdsLine(pos: Position, axis: 'x' | 'y', platform: TargetPlatform = 'generic'): Position {
  const grid = computeThirdsGrid(platform)
  if (axis === 'x') {
    const lines = grid.verticalLines
    const closest = Math.abs(pos.x - lines[0]) < Math.abs(pos.x - lines[1]) ? lines[0] : lines[1]
    return { x: closest, y: pos.y }
  }
  const lines = grid.horizontalLines
  const closest = Math.abs(pos.y - lines[0]) < Math.abs(pos.y - lines[1]) ? lines[0] : lines[1]
  return { x: pos.x, y: closest }
}

// ─── Visual Hierarchy ───────────────────────────────────────────────────────

interface HierarchyConfig {
  scale: number
  /** Suggested opacity (1 = fully opaque) */
  opacity: number
  /** Suggested z-index offset */
  zIndexBoost: number
}

const HIERARCHY_DEFAULTS: Record<ElementRole, HierarchyConfig> = {
  primary: { scale: 1.5, opacity: 1.0, zIndexBoost: 10 },
  secondary: { scale: 1.15, opacity: 0.95, zIndexBoost: 5 },
  tertiary: { scale: 0.85, opacity: 0.9, zIndexBoost: 2 },
  accent: { scale: 0.6, opacity: 0.85, zIndexBoost: 1 },
  background: { scale: 1.0, opacity: 0.7, zIndexBoost: 0 },
}

export function getHierarchyConfig(role: ElementRole): HierarchyConfig {
  return HIERARCHY_DEFAULTS[role]
}

// ─── Depth Layering ─────────────────────────────────────────────────────────

interface DepthConfig {
  /** Scale multiplier (further = smaller) */
  scaleFactor: number
  /** Suggested CSS blur in px (further = blurrier). 0 = sharp foreground. */
  blurPx: number
  /** Opacity reduction for depth effect */
  opacity: number
  /** Suggested z-index range */
  zIndexBase: number
}

const DEPTH_LAYERS: Record<DepthLayer, DepthConfig> = {
  foreground: { scaleFactor: 1.0, blurPx: 0, opacity: 1.0, zIndexBase: 10 },
  midground: { scaleFactor: 0.8, blurPx: 0, opacity: 0.95, zIndexBase: 5 },
  background: { scaleFactor: 0.6, blurPx: 2, opacity: 0.8, zIndexBase: 1 },
}

export function getDepthConfig(layer: DepthLayer): DepthConfig {
  return DEPTH_LAYERS[layer]
}

// ─── Dynamic Layout Engine ──────────────────────────────────────────────────

/**
 * Given N elements with roles, compute optimal positions within safe zones
 * using rule-of-thirds, visual hierarchy, and spacing heuristics.
 */
export function computeLayout(
  elements: LayoutElement[],
  config: CanvasConfig,
  platform: TargetPlatform = 'generic',
): ComputedLayout {
  const safeZone = getSafeZone(platform)
  const grid = computeThirdsGrid(platform)
  const bounds = getSafeContentBounds(platform)
  const placements = new Map<string, ElementPlacement>()

  // Sort by visual priority
  const priorityOrder: ElementRole[] = ['primary', 'secondary', 'tertiary', 'accent', 'background']
  const sorted = [...elements].sort((a, b) => priorityOrder.indexOf(a.role) - priorityOrder.indexOf(b.role))

  // Separate by role groups
  const primaries = sorted.filter((e) => e.role === 'primary')
  const secondaries = sorted.filter((e) => e.role === 'secondary')
  const tertiaries = sorted.filter((e) => e.role === 'tertiary')
  const accents = sorted.filter((e) => e.role === 'accent')
  const backgrounds = sorted.filter((e) => e.role === 'background')

  // --- Place backgrounds (full canvas, behind everything) ---
  for (const el of backgrounds) {
    placements.set(el.id, {
      position: { x: 50, y: 50 },
      scale: 1.05,
      zIndex: 1,
      opacity: DEPTH_LAYERS.background.opacity,
    })
  }

  // --- Place primaries using power points ---
  placePrimaries(primaries, grid, bounds, config, placements)

  // --- Place secondaries ---
  placeSecondaries(secondaries, grid, bounds, config, primaries, placements)

  // --- Place tertiaries ---
  placeTertiaries(tertiaries, bounds, placements)

  // --- Place accents in margins / corners ---
  placeAccents(accents, bounds, placements)

  return { placements, safeZone, grid }
}

function placePrimaries(
  elements: LayoutElement[],
  grid: ThirdsGrid,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  config: CanvasConfig,
  placements: Map<string, ElementPlacement>,
) {
  const isVertical = config.height > config.width
  const hierarchy = HIERARCHY_DEFAULTS.primary

  if (elements.length === 0) return

  if (elements.length === 1) {
    // Single primary: place at center or slightly above center on vertical canvases
    const el = elements[0]
    const depth = getDepthConfig(el.depthLayer || 'foreground')
    if (el.type === 'character') {
      // Characters go in upper third for vertical, center for horizontal
      placements.set(el.id, {
        position: isVertical ? { x: 50, y: grid.horizontalLines[0] } : { x: 50, y: grid.horizontalLines[0] },
        scale: hierarchy.scale * depth.scaleFactor,
        zIndex: depth.zIndexBase + hierarchy.zIndexBoost,
        opacity: hierarchy.opacity * depth.opacity,
      })
    } else {
      placements.set(el.id, {
        position: { x: 50, y: 50 },
        scale: hierarchy.scale * depth.scaleFactor,
        zIndex: depth.zIndexBase + hierarchy.zIndexBoost,
        opacity: hierarchy.opacity * depth.opacity,
      })
    }
    return
  }

  // Multiple primaries: distribute along thirds lines
  if (elements.length === 2) {
    const [a, b] = elements
    const depthA = getDepthConfig(a.depthLayer || 'foreground')
    const depthB = getDepthConfig(b.depthLayer || 'foreground')
    if (isVertical) {
      // Vertical: stack at upper and lower thirds
      placements.set(a.id, {
        position: { x: 50, y: grid.horizontalLines[0] },
        scale: hierarchy.scale * depthA.scaleFactor,
        zIndex: depthA.zIndexBase + hierarchy.zIndexBoost,
        opacity: hierarchy.opacity * depthA.opacity,
      })
      placements.set(b.id, {
        position: { x: 50, y: grid.horizontalLines[1] },
        scale: hierarchy.scale * depthB.scaleFactor,
        zIndex: depthB.zIndexBase + hierarchy.zIndexBoost,
        opacity: hierarchy.opacity * depthB.opacity,
      })
    } else {
      // Horizontal: place at left-third and right-third
      placements.set(a.id, {
        position: { x: grid.verticalLines[0], y: grid.horizontalLines[0] },
        scale: hierarchy.scale * depthA.scaleFactor,
        zIndex: depthA.zIndexBase + hierarchy.zIndexBoost,
        opacity: hierarchy.opacity * depthA.opacity,
      })
      placements.set(b.id, {
        position: { x: grid.verticalLines[1], y: grid.horizontalLines[0] },
        scale: hierarchy.scale * depthB.scaleFactor,
        zIndex: depthB.zIndexBase + hierarchy.zIndexBoost,
        opacity: hierarchy.opacity * depthB.opacity,
      })
    }
    return
  }

  // 3+ primaries: spread evenly across the top thirds line
  const rangeX = bounds.maxX - bounds.minX
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const depth = getDepthConfig(el.depthLayer || 'foreground')
    const frac = (i + 1) / (elements.length + 1)
    const scaleFactor = Math.max(0.7, 1 - elements.length * 0.08)
    placements.set(el.id, {
      position: {
        x: bounds.minX + rangeX * frac,
        y: grid.horizontalLines[0],
      },
      scale: hierarchy.scale * scaleFactor * depth.scaleFactor,
      zIndex: depth.zIndexBase + hierarchy.zIndexBoost,
      opacity: hierarchy.opacity * depth.opacity,
    })
  }
}

function placeSecondaries(
  elements: LayoutElement[],
  grid: ThirdsGrid,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  config: CanvasConfig,
  primaries: LayoutElement[],
  placements: Map<string, ElementPlacement>,
) {
  const hierarchy = HIERARCHY_DEFAULTS.secondary

  if (elements.length === 0) return

  // Place secondaries on the opposite thirds line from primaries
  const isVertical = config.height > config.width
  const baseY = primaries.length > 0 ? grid.horizontalLines[1] : grid.horizontalLines[0]
  const rangeX = bounds.maxX - bounds.minX

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const depth = getDepthConfig(el.depthLayer || 'midground')
    const frac = elements.length === 1 ? 0.5 : (i + 1) / (elements.length + 1)
    placements.set(el.id, {
      position: {
        x: bounds.minX + rangeX * frac,
        y: isVertical ? baseY : grid.horizontalLines[1],
      },
      scale: hierarchy.scale * depth.scaleFactor,
      zIndex: depth.zIndexBase + hierarchy.zIndexBoost,
      opacity: hierarchy.opacity * depth.opacity,
    })
  }
}

function placeTertiaries(
  elements: LayoutElement[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  placements: Map<string, ElementPlacement>,
) {
  const hierarchy = HIERARCHY_DEFAULTS.tertiary

  // Tertiaries fill remaining space, placed at the bottom or in margins
  const rangeX = bounds.maxX - bounds.minX
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const depth = getDepthConfig(el.depthLayer || 'midground')
    const frac = elements.length === 1 ? 0.5 : (i + 1) / (elements.length + 1)
    placements.set(el.id, {
      position: {
        x: bounds.minX + rangeX * frac,
        y: bounds.maxY - 10,
      },
      scale: hierarchy.scale * depth.scaleFactor,
      zIndex: depth.zIndexBase + hierarchy.zIndexBoost,
      opacity: hierarchy.opacity * depth.opacity,
    })
  }
}

function placeAccents(
  elements: LayoutElement[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  placements: Map<string, ElementPlacement>,
) {
  const hierarchy = HIERARCHY_DEFAULTS.accent

  // Accents go in corners with generous margins for negative space
  const cornerPositions: Position[] = [
    { x: bounds.minX + 8, y: bounds.minY + 8 },
    { x: bounds.maxX - 8, y: bounds.minY + 8 },
    { x: bounds.minX + 8, y: bounds.maxY - 8 },
    { x: bounds.maxX - 8, y: bounds.maxY - 8 },
  ]

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]
    const depth = getDepthConfig(el.depthLayer || 'foreground')
    const corner = cornerPositions[i % cornerPositions.length]
    placements.set(el.id, {
      position: corner,
      scale: hierarchy.scale * depth.scaleFactor,
      zIndex: depth.zIndexBase + hierarchy.zIndexBoost,
      opacity: hierarchy.opacity * depth.opacity,
    })
  }
}

// ─── Character-Specific Layout ──────────────────────────────────────────────

export interface CharacterLayout {
  position: Position
  scale: number
}

/**
 * Compute optimal character positions given a count and aspect ratio.
 * Accounts for platform safe zones and rule of thirds.
 * This replaces the hardcoded positions in the orchestrator prompt.
 */
export function computeCharacterLayout(
  characterCount: number,
  aspectRatio: AspectRatioKey,
  platform: TargetPlatform = 'generic',
  templateContext?: string,
): CharacterLayout[] {
  const bounds = getSafeContentBounds(platform)
  const grid = computeThirdsGrid(platform)
  const isVertical = aspectRatio === '9:16'
  // Square canvas uses the same layout strategy as vertical with minor adjustments

  // Base Y position (characters typically in upper area)
  let baseY = isVertical ? grid.horizontalLines[0] : 18

  // Template-aware vertical position adjustment
  if (templateContext) {
    baseY = getTemplateAwareY(templateContext, isVertical)
  }

  // Clamp Y within safe zone
  baseY = Math.max(bounds.minY + 5, Math.min(bounds.maxY - 20, baseY))

  if (characterCount === 0) return []

  if (characterCount === 1) {
    return [
      {
        position: { x: 50, y: baseY },
        scale: isVertical ? 1.8 : 1.5,
      },
    ]
  }

  if (characterCount === 2) {
    const spread = isVertical ? 20 : 22
    const centerX = 50
    return [
      {
        position: { x: centerX - spread, y: baseY },
        scale: isVertical ? 1.5 : 1.3,
      },
      {
        position: { x: centerX + spread, y: baseY },
        scale: isVertical ? 1.5 : 1.3,
      },
    ]
  }

  // 3+ characters: distribute evenly within safe bounds
  const rangeX = bounds.maxX - bounds.minX
  const scaleFactor = Math.max(0.7, 1.4 - characterCount * 0.15)
  const layouts: CharacterLayout[] = []

  for (let i = 0; i < characterCount; i++) {
    const frac = (i + 1) / (characterCount + 1)
    layouts.push({
      position: {
        x: bounds.minX + rangeX * frac,
        y: baseY,
      },
      scale: scaleFactor,
    })
  }

  return layouts
}

/**
 * Adjust character Y position based on template/scene context.
 */
function getTemplateAwareY(context: string, isVertical: boolean): number {
  const ctx = context.toLowerCase()

  if (/ocean|underwater|sea|water/.test(ctx)) return isVertical ? 65 : 65
  if (/city|skyline|street|urban/.test(ctx)) return isVertical ? 60 : 60
  if (/nature|forest|outdoor|garden/.test(ctx)) return isVertical ? 60 : 60
  if (/space|sky|cloud|galaxy/.test(ctx)) return isVertical ? 40 : 40
  if (/terminal|code|editor/.test(ctx)) return isVertical ? 20 : 15
  if (/chart|business|infographic/.test(ctx)) return isVertical ? 20 : 15
  if (/map|world|geography/.test(ctx)) return isVertical ? 18 : 15
  if (/classroom|whiteboard/.test(ctx)) return isVertical ? 22 : 18

  // Default: upper area
  return isVertical ? 25 : 15
}

// ─── Aspect Ratio Intelligence ──────────────────────────────────────────────

const ASPECT_DIMENSIONS: Record<AspectRatioKey, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

export function getCanvasConfig(aspectRatio: AspectRatioKey): CanvasConfig {
  const dim = ASPECT_DIMENSIONS[aspectRatio] || ASPECT_DIMENSIONS['16:9']
  return { ...dim, aspectRatio }
}

/**
 * Recompute a single element position when the aspect ratio changes.
 * Maintains visual relationships rather than absolute pixel positions.
 */
export function reframePosition(
  pos: Position,
  fromAspect: AspectRatioKey,
  toAspect: AspectRatioKey,
  platform: TargetPlatform = 'generic',
): Position {
  const fromBounds = getSafeContentBounds('generic')
  const toBounds = getSafeContentBounds(platform)

  // Normalize position relative to the source safe zone (0-1 within safe area)
  const fromRangeX = fromBounds.maxX - fromBounds.minX
  const fromRangeY = fromBounds.maxY - fromBounds.minY
  const normX = fromRangeX > 0 ? (pos.x - fromBounds.minX) / fromRangeX : 0.5
  const normY = fromRangeY > 0 ? (pos.y - fromBounds.minY) / fromRangeY : 0.5

  const fromDim = ASPECT_DIMENSIONS[fromAspect]
  const toDim = ASPECT_DIMENSIONS[toAspect]
  const fromRatio = fromDim.width / fromDim.height
  const toRatio = toDim.width / toDim.height

  // When going from wide to tall, compress horizontal spread toward center
  // When going from tall to wide, expand horizontal spread
  const ratioShift = toRatio / fromRatio
  const adjustedNormX = 0.5 + (normX - 0.5) * Math.min(ratioShift, 1.5)

  // Map back to target safe zone
  const toRangeX = toBounds.maxX - toBounds.minX
  const toRangeY = toBounds.maxY - toBounds.minY

  return {
    x: clamp(toBounds.minX + clamp(adjustedNormX, 0, 1) * toRangeX, toBounds.minX, toBounds.maxX),
    y: clamp(toBounds.minY + clamp(normY, 0, 1) * toRangeY, toBounds.minY, toBounds.maxY),
  }
}

// ─── Aspect Ratio Reframing ──────────────────────────────────────────────────

/**
 * Describes an element that can be repositioned during aspect ratio reframing.
 */
export interface ReframableElement {
  id: string
  type: 'character' | 'text' | 'media' | 'svg' | 'shape' | 'template'
  position: Position
  scale: number
  /** Used for text to determine vertical placement strategy */
  textPosition?: TextPosition
  /** Used for characters to know stacking vs side-by-side */
  characterIndex?: number
}

/**
 * The output for a single reframed element.
 */
export interface ReframedElement {
  id: string
  position: Position
  scale: number
}

/**
 * Scale multipliers for element types per aspect-ratio direction.
 * Vertical formats need larger elements (especially text) since the
 * viewport is narrower. Ultra-wide formats can use smaller, spread-out elements.
 */
const REFRAME_SCALE_TABLE: Record<
  'to_vertical' | 'to_horizontal' | 'to_square' | 'to_ultrawide' | 'same',
  Record<ReframableElement['type'], number>
> = {
  to_vertical: {
    character: 1.2,
    text: 1.3,
    media: 1.0,
    svg: 1.1,
    shape: 1.1,
    template: 1.0,
  },
  to_horizontal: {
    character: 0.85,
    text: 0.9,
    media: 1.0,
    svg: 0.9,
    shape: 0.9,
    template: 1.0,
  },
  to_square: {
    character: 1.0,
    text: 1.0,
    media: 1.0,
    svg: 1.0,
    shape: 1.0,
    template: 1.0,
  },
  to_ultrawide: {
    character: 0.75,
    text: 0.8,
    media: 1.0,
    svg: 0.85,
    shape: 0.85,
    template: 1.0,
  },
  same: {
    character: 1.0,
    text: 1.0,
    media: 1.0,
    svg: 1.0,
    shape: 1.0,
    template: 1.0,
  },
}

/**
 * Determine the reframe direction category from source and target aspect ratios.
 */
function getReframeDirection(from: AspectRatioKey, to: AspectRatioKey): keyof typeof REFRAME_SCALE_TABLE {
  if (from === to) return 'same'
  const toDim = ASPECT_DIMENSIONS[to]
  const ratio = toDim.width / toDim.height
  if (ratio < 0.8) return 'to_vertical'
  if (ratio > 1.8) return 'to_ultrawide'
  if (ratio >= 0.8 && ratio <= 1.2) return 'to_square'
  return 'to_horizontal'
}

/**
 * Reframe an entire clip's element positions and scales for a new aspect ratio.
 *
 * This enables one-click multi-platform export: the same clip authored in 9:16
 * can be intelligently repositioned for 16:9, 1:1, etc.
 *
 * Strategy per element type:
 * - **Characters**: Re-layout using `computeCharacterLayout()` for the target
 *   aspect ratio. 2 characters go side-by-side in horizontal, stacked in vertical.
 * - **Text**: Uses safe-zone-aware `getTextOverlayY()` for the target platform,
 *   scaled up for vertical (narrow viewport needs bigger text).
 * - **Media/Templates**: Positions remapped via `reframePosition()` with
 *   horizontal compression/expansion. Scale stays at 1.0 (they fill containers).
 * - **SVG/Shapes**: Repositioned via `reframePosition()` with type-appropriate
 *   scale adjustments.
 *
 * @param fromAspect - The aspect ratio the clip was authored in
 * @param toAspect  - The target aspect ratio for export
 * @param elements  - All elements in the clip with their current positions
 * @param options   - Platform and brand context
 * @returns Array of reframed elements with new positions and scales
 */
export function reframeClip(
  fromAspect: AspectRatioKey,
  toAspect: AspectRatioKey,
  elements: ReframableElement[],
  options?: {
    platform?: TargetPlatform
  },
): ReframedElement[] {
  if (fromAspect === toAspect) {
    return elements.map((el) => ({
      id: el.id,
      position: { ...el.position },
      scale: el.scale,
    }))
  }

  const platform = options?.platform || 'generic'
  const direction = getReframeDirection(fromAspect, toAspect)
  const scaleTable = REFRAME_SCALE_TABLE[direction]

  // Collect all characters for batch re-layout
  const characters = elements.filter((e) => e.type === 'character')
  const charLayouts = computeCharacterLayout(characters.length, toAspect, platform)

  const results: ReframedElement[] = []

  for (const el of elements) {
    let newPos: Position
    let newScale: number

    switch (el.type) {
      case 'character': {
        // Use the composition engine's character layout for the target aspect ratio
        const idx = el.characterIndex ?? characters.indexOf(el)
        const layout = charLayouts[idx]
        if (layout) {
          newPos = clampToSafeZone(layout.position, platform)
          // Blend the original relative scale with the new layout's scale
          // so user customizations are partially preserved
          const baseScale = layout.scale
          const originalRatio = el.scale / getBaseCharacterScale(fromAspect, characters.length)
          newScale = baseScale * clamp(originalRatio, 0.5, 2.0)
        } else {
          newPos = reframePosition(el.position, fromAspect, toAspect, platform)
          newScale = el.scale * scaleTable.character
        }
        break
      }

      case 'text': {
        // Text uses safe-zone-aware Y positioning for the target platform
        const textPos = el.textPosition || 'center'
        const safeY = getTextOverlayY(textPos, platform)
        // X stays centered (text overlays are typically centered horizontally)
        const toBounds = getSafeContentBounds(platform)
        const centerX = (toBounds.minX + toBounds.maxX) / 2
        newPos = { x: centerX, y: safeY }
        newScale = el.scale * scaleTable.text
        break
      }

      case 'media':
      case 'template': {
        // Media and templates are repositioned but keep their container scale
        newPos = reframePosition(el.position, fromAspect, toAspect, platform)
        newScale = el.scale * scaleTable[el.type]
        break
      }

      case 'svg':
      case 'shape': {
        // SVG objects and shapes get repositioned with crowding awareness
        newPos = reframePosition(el.position, fromAspect, toAspect, platform)
        newScale = el.scale * scaleTable[el.type]
        break
      }

      default: {
        newPos = reframePosition(el.position, fromAspect, toAspect, platform)
        newScale = el.scale
        break
      }
    }

    results.push({
      id: el.id,
      position: newPos,
      scale: Math.round(newScale * 100) / 100,
    })
  }

  return results
}

/**
 * Get the base character scale for a given aspect ratio and character count.
 * Used to compute relative scale ratios during reframing.
 */
function getBaseCharacterScale(aspect: AspectRatioKey, count: number): number {
  const isVertical = aspect === '9:16'
  if (count <= 1) return isVertical ? 1.8 : 1.5
  if (count === 2) return isVertical ? 1.5 : 1.3
  return Math.max(0.7, 1.4 - count * 0.15)
}

// ─── Color Theory ───────────────────────────────────────────────────────────

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  text: string
  textOnDark: string
  background: string
  /** All palette colors for easy iteration */
  all: string[]
}

/**
 * Build a complementary palette from extracted dominant colors.
 * Uses color theory to pick harmonious text, accent, and background colors.
 */
export function buildPaletteFromColors(extracted: ExtractedColor[]): ColorPalette {
  if (extracted.length === 0) {
    return defaultPalette()
  }

  const primary = extracted[0].hex
  const secondary = extracted.length > 1 ? extracted[1].hex : shiftHue(primary, 30)
  const accent = extracted.length > 2 ? extracted[2].hex : getComplementary(primary)

  // Determine text color based on primary luminance
  const primaryLum = relativeLuminance(primary)
  const text = primaryLum > 0.5 ? '#1a1a2e' : '#ffffff'
  const textOnDark = '#ffffff'
  const background = primaryLum > 0.5 ? darken(primary, 0.8) : lighten(primary, 0.8)

  const all = [primary, secondary, accent, text, background]

  return { primary, secondary, accent, text, textOnDark, background, all }
}

/**
 * Build a palette from brand profile colors.
 */
export function buildBrandPalette(profile: BrandProfile): ColorPalette {
  const colors = profile.primaryColors
  if (!colors || colors.length === 0) return defaultPalette()

  const primary = colors[0]
  const secondary = colors.length > 1 ? colors[1] : shiftHue(primary, 30)
  const accent = colors.length > 2 ? colors[2] : getComplementary(primary)

  const primaryLum = relativeLuminance(primary)
  const text = primaryLum > 0.5 ? '#1a1a2e' : '#ffffff'
  const textOnDark = '#ffffff'
  const background = primaryLum > 0.5 ? darken(primary, 0.85) : lighten(primary, 0.85)

  return {
    primary,
    secondary,
    accent,
    text,
    textOnDark,
    background,
    all: [primary, secondary, accent, text, background],
  }
}

function defaultPalette(): ColorPalette {
  return {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    text: '#ffffff',
    textOnDark: '#ffffff',
    background: '#0f172a',
    all: ['#6366f1', '#8b5cf6', '#f59e0b', '#ffffff', '#0f172a'],
  }
}

// Color manipulation helpers

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ]
}

function shiftHue(hex: string, degrees: number): string {
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const newH = (((h + degrees / 360) % 1) + 1) % 1
  const [nr, ng, nb] = hslToRgb(newH, s, l)
  return rgbToHex(nr, ng, nb)
}

function getComplementary(hex: string): string {
  return shiftHue(hex, 180)
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function darken(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(Math.round(r * factor), Math.round(g * factor), Math.round(b * factor))
}

function lighten(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(
    Math.round(r + (255 - r) * factor),
    Math.round(g + (255 - g) * factor),
    Math.round(b + (255 - b) * factor),
  )
}

/**
 * Check if a text color has sufficient contrast against a background.
 * Returns WCAG contrast ratio. >= 4.5 is AA, >= 7 is AAA.
 */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground)
  const l2 = relativeLuminance(background)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Pick the best text color (white or dark) for a given background.
 */
export function bestTextColor(bgHex: string): string {
  const lum = relativeLuminance(bgHex)
  return lum > 0.4 ? '#1a1a2e' : '#ffffff'
}

/**
 * Generate an analogous color scheme (colors adjacent on the color wheel).
 */
export function analogousColors(hex: string, count: number = 3): string[] {
  const step = 30
  const offset = -Math.floor(count / 2) * step
  return Array.from({ length: count }, (_, i) => shiftHue(hex, offset + i * step))
}

/**
 * Generate a triadic color scheme (3 colors evenly spaced on the color wheel).
 */
export function triadicColors(hex: string): [string, string, string] {
  return [hex, shiftHue(hex, 120), shiftHue(hex, 240)]
}

/**
 * Generate a split-complementary color scheme.
 */
export function splitComplementary(hex: string): [string, string, string] {
  return [hex, shiftHue(hex, 150), shiftHue(hex, 210)]
}

// ─── Brand Consistency ──────────────────────────────────────────────────────

export interface BrandGuide {
  palette: ColorPalette
  fontSuggestion: string
  toneSuggestion: string
}

/**
 * Build a composition-level brand guide from a BrandProfile.
 * This is used to enforce consistency across all visual elements.
 */
export function buildBrandGuide(profile: BrandProfile): BrandGuide {
  const palette = buildBrandPalette(profile)

  // Map brand tone to font suggestion
  const fontMap: Record<string, string> = {
    professional: 'Inter',
    casual: 'Nunito',
    playful: 'Fredoka One',
    authoritative: 'Playfair Display',
    technical: 'Space Mono',
    modern: 'Poppins',
    elegant: 'Cormorant Garamond',
    bold: 'Montserrat',
    friendly: 'Quicksand',
  }
  const fontSuggestion = fontMap[profile.tone.toLowerCase()] || 'Inter'

  return {
    palette,
    fontSuggestion,
    toneSuggestion: profile.tone,
  }
}

/**
 * Apply brand colors to a ClipPlan's text overlays and shapes.
 * Returns the color to use for a given element type.
 */
export function getBrandColorForElement(
  guide: BrandGuide,
  elementType: 'title' | 'subtitle' | 'cta' | 'shape-fill' | 'shape-border' | 'caption',
): string {
  switch (elementType) {
    case 'title':
      return guide.palette.text
    case 'subtitle':
      return guide.palette.textOnDark
    case 'cta':
      return guide.palette.accent
    case 'shape-fill':
      return guide.palette.primary
    case 'shape-border':
      return guide.palette.secondary
    case 'caption':
      return guide.palette.text
    default:
      return guide.palette.text
  }
}

// ─── Negative Space Analysis ────────────────────────────────────────────────

/**
 * Check if placing an element at a position would crowd existing placements.
 * Returns a density score (0 = empty, 1 = very crowded).
 */
export function crowdingScore(
  pos: Position,
  size: { widthPercent: number; heightPercent: number },
  existingPlacements: Array<{ position: Position; widthPercent: number; heightPercent: number }>,
): number {
  if (existingPlacements.length === 0) return 0

  let overlaps = 0
  const halfW = size.widthPercent / 2
  const halfH = size.heightPercent / 2

  for (const existing of existingPlacements) {
    const eHalfW = existing.widthPercent / 2
    const eHalfH = existing.heightPercent / 2

    // Check bounding box overlap
    const xOverlap = Math.max(
      0,
      Math.min(pos.x + halfW, existing.position.x + eHalfW) - Math.max(pos.x - halfW, existing.position.x - eHalfW),
    )
    const yOverlap = Math.max(
      0,
      Math.min(pos.y + halfH, existing.position.y + eHalfH) - Math.max(pos.y - halfH, existing.position.y - eHalfH),
    )

    if (xOverlap > 0 && yOverlap > 0) {
      const overlapArea = xOverlap * yOverlap
      const myArea = size.widthPercent * size.heightPercent
      overlaps += overlapArea / myArea
    }
  }

  return Math.min(1, overlaps)
}

/**
 * Find the position with maximum negative space (least crowding) within the safe zone,
 * given existing placements. Uses a simple grid-search approach.
 */
export function findBestNegativeSpace(
  size: { widthPercent: number; heightPercent: number },
  existingPlacements: Array<{ position: Position; widthPercent: number; heightPercent: number }>,
  platform: TargetPlatform = 'generic',
  gridResolution: number = 10,
): Position {
  const bounds = getSafeContentBounds(platform)
  let bestPos: Position = { x: 50, y: 50 }
  let bestScore = Infinity

  const stepX = (bounds.maxX - bounds.minX) / gridResolution
  const stepY = (bounds.maxY - bounds.minY) / gridResolution

  for (let gx = 0; gx <= gridResolution; gx++) {
    for (let gy = 0; gy <= gridResolution; gy++) {
      const candidate: Position = {
        x: bounds.minX + gx * stepX,
        y: bounds.minY + gy * stepY,
      }
      const score = crowdingScore(candidate, size, existingPlacements)
      if (score < bestScore) {
        bestScore = score
        bestPos = candidate
      }
    }
  }

  return bestPos
}

// ─── Text Overlay Positioning ───────────────────────────────────────────────

export type TextPosition = 'top' | 'center' | 'bottom' | 'lower-third'

/**
 * Compute the optimal Y position for a text overlay, accounting for safe zones.
 */
export function getTextOverlayY(position: TextPosition, platform: TargetPlatform = 'generic'): number {
  const bounds = getSafeContentBounds(platform)
  switch (position) {
    case 'top':
      return bounds.minY + 5
    case 'center':
      return (bounds.minY + bounds.maxY) / 2
    case 'bottom':
      return bounds.maxY - 8
    case 'lower-third':
      return bounds.maxY - (bounds.maxY - bounds.minY) / 3
    default:
      return bounds.maxY - 8
  }
}

// ─── Orchestrator Integration ───────────────────────────────────────────────

/**
 * High-level function: compute all element positions for a clip plan.
 * This is designed to be called by the orchestrator after plan generation
 * to refine AI-generated positions with composition intelligence.
 */
export function refineClipLayout(
  plan: {
    aspectRatio: AspectRatioKey
    characterCount: number
    templateContext?: string
    textOverlayCount: number
    stockMediaCount: number
    svgObjectCount: number
    shapeCount: number
  },
  options?: {
    platform?: TargetPlatform
    brandProfile?: BrandProfile
  },
): {
  characters: CharacterLayout[]
  palette: ColorPalette
  safeZone: SafeZone
  grid: ThirdsGrid
  brandGuide?: BrandGuide
} {
  const platform = options?.platform || 'generic'
  const safeZone = getSafeZone(platform)
  const grid = computeThirdsGrid(platform)

  const characters = computeCharacterLayout(plan.characterCount, plan.aspectRatio, platform, plan.templateContext)

  let palette: ColorPalette
  let brandGuide: BrandGuide | undefined

  if (options?.brandProfile) {
    brandGuide = buildBrandGuide(options.brandProfile)
    palette = brandGuide.palette
  } else {
    palette = defaultPalette()
  }

  return { characters, palette, safeZone, grid, brandGuide }
}

// ─── Utility ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/**
 * Check if a position is within the platform safe zone.
 */
export function isInSafeZone(pos: Position, platform: TargetPlatform = 'generic'): boolean {
  const bounds = getSafeContentBounds(platform)
  return pos.x >= bounds.minX && pos.x <= bounds.maxX && pos.y >= bounds.minY && pos.y <= bounds.maxY
}

/**
 * Push a position inside the safe zone if it's currently outside.
 */
export function clampToSafeZone(pos: Position, platform: TargetPlatform = 'generic'): Position {
  const bounds = getSafeContentBounds(platform)
  return {
    x: clamp(pos.x, bounds.minX, bounds.maxX),
    y: clamp(pos.y, bounds.minY, bounds.maxY),
  }
}
