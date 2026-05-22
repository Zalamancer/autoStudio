/**
 * Procedural crowd / background character generator.
 *
 * Uses a seeded PRNG so the same seed always produces the same crowd,
 * ensuring deterministic rendering across preview and export.
 */

// ── Seeded RNG (Mulberry32) ────────────────────────────────────────

export function seededRandom(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Types ──────────────────────────────────────────────────────────

export type CrowdPattern = 'row' | 'scattered' | 'arc' | 'bleachers' | 'random'

export interface CrowdGroupConfig {
  count: number
  pattern: CrowdPattern
  seed: number
  /** Bounding area in canvas-relative coordinates (0-1 normalized) */
  area: { x: number; y: number; w: number; h: number }
  /** Color palettes: each is [skinColor, outfitColor] */
  colors: string[][]
  /** Animation speed multiplier (1 = normal) */
  animSpeed: number
}

export interface CrowdMember {
  x: number
  y: number
  scale: number
  skinColor: string
  outfitColor: string
  swayPhase: number
  swaySpeed: number
  bobPhase: number
  bobSpeed: number
  opacity: number
  /** Body height ratio (0.7 - 1.3) for variety */
  heightRatio: number
  /** Per-part sprite indices for character-based rendering */
  spriteSelections?: Record<string, number>
}

/** Info about a saved character's available sprites for crowd generation */
export interface CharacterSpriteInfo {
  /** Number of sprites available per body part */
  spriteCounts: Record<string, number>
  /** Which parts to randomize per member */
  randomizeParts: string[]
  /** Fixed sprite selections for non-randomized parts */
  fixedSelections: Record<string, number>
}

// ── Default color palettes ─────────────────────────────────────────

export const DEFAULT_CROWD_PALETTES: string[][] = [
  ['#d4a574', '#2563eb'],  // tan skin, blue outfit
  ['#c68642', '#dc2626'],  // brown skin, red outfit
  ['#f5d6b8', '#16a34a'],  // light skin, green outfit
  ['#8d5524', '#9333ea'],  // dark brown skin, purple outfit
  ['#e8b990', '#f97316'],  // medium skin, orange outfit
  ['#d4a574', '#1e293b'],  // tan skin, dark outfit
  ['#f5d6b8', '#ec4899'],  // light skin, pink outfit
  ['#c68642', '#0891b2'],  // brown skin, teal outfit
]

// ── Generator ──────────────────────────────────────────────────────

export function generateCrowd(
  config: CrowdGroupConfig,
  characterInfo?: CharacterSpriteInfo,
): CrowdMember[] {
  const rng = seededRandom(config.seed)
  const { count, pattern, area, colors, animSpeed } = config
  const palettes = colors.length > 0 ? colors : DEFAULT_CROWD_PALETTES

  const members: CrowdMember[] = []

  for (let i = 0; i < count; i++) {
    // Pick placement based on pattern
    const pos = getPlacementPosition(i, count, pattern, rng)

    // Map normalized position to the bounding area
    const x = area.x + pos.x * area.w
    const y = area.y + pos.y * area.h

    // Depth-based scaling: members further up (lower y in normalized space)
    // are further away, so smaller and more transparent
    const depthFactor = 0.4 + 0.6 * pos.y // 0.4 at top, 1.0 at bottom
    const scale = depthFactor * (0.8 + rng() * 0.4)
    const opacity = 0.5 + 0.5 * depthFactor

    // Pick random palette
    const palette = palettes[Math.floor(rng() * palettes.length)]
    const skinColor = palette[0]
    const outfitColor = palette[1]

    // Animation parameters
    const swayPhase = rng() * Math.PI * 2
    const swaySpeed = (0.5 + rng() * 1.0) * animSpeed
    const bobPhase = rng() * Math.PI * 2
    const bobSpeed = (1.0 + rng() * 1.5) * animSpeed

    // Body variety
    const heightRatio = 0.8 + rng() * 0.4

    // Per-member random sprite selections for character-based rendering
    let spriteSelections: Record<string, number> | undefined
    if (characterInfo) {
      spriteSelections = { ...characterInfo.fixedSelections }
      for (const part of characterInfo.randomizeParts) {
        const spriteCount = characterInfo.spriteCounts[part]
        if (spriteCount && spriteCount > 0) {
          spriteSelections[part] = Math.floor(rng() * spriteCount)
        }
      }
    }

    members.push({
      x,
      y,
      scale,
      skinColor,
      outfitColor,
      swayPhase,
      swaySpeed,
      bobPhase,
      bobSpeed,
      opacity,
      heightRatio,
      spriteSelections,
    })
  }

  // Sort by y for back-to-front rendering (depth sorting)
  members.sort((a, b) => a.y - b.y)

  return members
}

// ── Placement patterns ─────────────────────────────────────────────

function getPlacementPosition(
  index: number,
  total: number,
  pattern: CrowdPattern,
  rng: () => number,
): { x: number; y: number } {
  switch (pattern) {
    case 'row': {
      // Evenly spaced in a single row with slight y jitter
      const cols = total
      const xNorm = (index + 0.5) / cols
      const yNorm = 0.5 + (rng() - 0.5) * 0.15
      return { x: xNorm, y: yNorm }
    }

    case 'scattered': {
      // Grid-based scatter with jitter for natural look
      const cols = Math.ceil(Math.sqrt(total * 1.5))
      const rows = Math.ceil(total / cols)
      const row = Math.floor(index / cols)
      const col = index % cols
      const xNorm = (col + 0.5) / cols + (rng() - 0.5) * (0.6 / cols)
      const yNorm = (row + 0.5) / rows + (rng() - 0.5) * (0.4 / rows)
      return {
        x: Math.max(0.02, Math.min(0.98, xNorm)),
        y: Math.max(0.02, Math.min(0.98, yNorm)),
      }
    }

    case 'arc': {
      // Semicircular arc arrangement
      const angle = (Math.PI * (index + 0.5)) / total
      const radiusX = 0.4 + rng() * 0.05
      const radiusY = 0.3 + rng() * 0.05
      const xNorm = 0.5 + radiusX * Math.cos(angle)
      const yNorm = 0.6 + radiusY * Math.sin(angle) * 0.5
      return { x: xNorm, y: yNorm }
    }

    case 'bleachers': {
      // Multiple rows, back rows higher and more packed
      const rowCount = Math.max(2, Math.ceil(Math.sqrt(total / 2)))
      const row = Math.floor(index * rowCount / total)
      const colsInRow = Math.ceil(total / rowCount)
      const colIndex = index - row * colsInRow
      const xOffset = row % 2 === 0 ? 0 : 0.5 / colsInRow // stagger rows
      const xNorm = (colIndex + 0.5) / colsInRow + xOffset + (rng() - 0.5) * 0.03
      const yNorm = (row + 0.5) / rowCount
      return {
        x: Math.max(0.02, Math.min(0.98, xNorm)),
        y: Math.max(0.02, Math.min(0.98, yNorm)),
      }
    }

    case 'random':
    default: {
      return { x: rng(), y: rng() }
    }
  }
}

// ── Canvas 2D drawing helper ───────────────────────────────────────

/**
 * Draw a single crowd member silhouette (head oval + body rounded rect)
 * onto a Canvas 2D context. The member's x/y are in the actual canvas
 * coordinate space (already scaled from normalized).
 */
export function drawCrowdMember(
  ctx: CanvasRenderingContext2D,
  member: CrowdMember,
  canvasWidth: number,
  canvasHeight: number,
  frame: number,
  fps: number,
) {
  const t = frame / fps
  const sway = Math.sin(t * member.swaySpeed * 2 + member.swayPhase) * 3 * member.scale
  const bob = Math.sin(t * member.bobSpeed * 2 + member.bobPhase) * 2 * member.scale

  const cx = member.x * canvasWidth + sway
  const cy = member.y * canvasHeight + bob

  const baseSize = Math.min(canvasWidth, canvasHeight) * 0.025
  const s = baseSize * member.scale

  ctx.save()
  ctx.globalAlpha = member.opacity

  // Body (rounded rectangle)
  const bodyW = s * 0.9
  const bodyH = s * 1.4 * member.heightRatio
  const bodyX = cx - bodyW / 2
  const bodyY = cy - bodyH * 0.3

  ctx.fillStyle = member.outfitColor
  ctx.beginPath()
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, s * 0.2)
  ctx.fill()

  // Head (ellipse)
  const headR = s * 0.35
  const headY = bodyY - headR * 0.6

  ctx.fillStyle = member.skinColor
  ctx.beginPath()
  ctx.ellipse(cx, headY, headR, headR * 1.1, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}
