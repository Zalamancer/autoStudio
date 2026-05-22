/**
 * svgArtGenerator.ts
 *
 * Procedural SVG art generator — thick, playful, animated line art.
 * Pure TypeScript math generators, no external dependencies.
 * Seeded PRNG for deterministic output.
 */

// ── Types ───────────────────────────────────────────────────────────────

export type ArtStyle =
  // Playful (thick, animated)
  | 'noodle'
  | 'squiggle'
  | 'bubbles'
  | 'lava'
  | 'ribbon'
  | 'bounce'
  | 'swirl'
  | 'tentacle'
  | 'confetti'
  | 'wiggle'
  // Classic (fine-line, generative)
  | 'blob'
  | 'flowField'
  | 'mandala'
  | 'spiral'
  | 'waves'
  | 'aurora'
  | 'topography'
  | 'constellation'
  | 'geometric'
  | 'landscape'

export interface ArtOptions {
  style: ArtStyle
  width: number
  height: number
  palette: string[]
  complexity: number // 1–10
  seed: number
  animated: boolean
}

export const ART_STYLES: { id: ArtStyle; label: string; group: 'playful' | 'classic' }[] = [
  // Playful — thick lines, organic movement
  { id: 'noodle', label: 'Noodle', group: 'playful' },
  { id: 'squiggle', label: 'Squiggle', group: 'playful' },
  { id: 'bubbles', label: 'Bubbles', group: 'playful' },
  { id: 'lava', label: 'Lava', group: 'playful' },
  { id: 'ribbon', label: 'Ribbon', group: 'playful' },
  { id: 'bounce', label: 'Bounce', group: 'playful' },
  { id: 'swirl', label: 'Swirl', group: 'playful' },
  { id: 'tentacle', label: 'Tentacle', group: 'playful' },
  { id: 'confetti', label: 'Confetti', group: 'playful' },
  { id: 'wiggle', label: 'Wiggle', group: 'playful' },
  // Classic — fine generative art
  { id: 'blob', label: 'Blob', group: 'classic' },
  { id: 'flowField', label: 'Flow Field', group: 'classic' },
  { id: 'mandala', label: 'Mandala', group: 'classic' },
  { id: 'spiral', label: 'Spiral', group: 'classic' },
  { id: 'waves', label: 'Waves', group: 'classic' },
  { id: 'aurora', label: 'Aurora', group: 'classic' },
  { id: 'topography', label: 'Topo', group: 'classic' },
  { id: 'constellation', label: 'Stars', group: 'classic' },
  { id: 'geometric', label: 'Geometric', group: 'classic' },
  { id: 'landscape', label: 'Landscape', group: 'classic' },
]

export const COLOR_PALETTES: { id: string; label: string; colors: string[] }[] = [
  { id: 'sunset', label: 'Sunset', colors: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a659e'] },
  { id: 'ocean', label: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef', '#caf0f8', '#023e8a'] },
  { id: 'forest', label: 'Forest', colors: ['#2d6a4f', '#40916c', '#52b788', '#95d5b2', '#d8f3dc'] },
  { id: 'neon', label: 'Neon', colors: ['#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ffbe0b'] },
  { id: 'pastel', label: 'Pastel', colors: ['#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff', '#cdb4db'] },
  { id: 'monochrome', label: 'Mono', colors: ['#f8f9fa', '#dee2e6', '#adb5bd', '#495057', '#212529'] },
  { id: 'earth', label: 'Earth', colors: ['#bc6c25', '#dda15e', '#606c38', '#283618', '#fefae0'] },
  { id: 'candy', label: 'Candy', colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'] },
]

// ── Seeded PRNG ─────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── 2D Value Noise ──────────────────────────────────────────────────────

function hash(x: number, y: number, seed: number): number {
  let h = seed + x * 374761393 + y * 668265263
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = h ^ (h >>> 16)
  return (h >>> 0) / 4294967296
}

function noise2D(x: number, y: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const tx = xf * xf * (3 - 2 * xf)
  const ty = yf * yf * (3 - 2 * yf)
  const a = hash(xi, yi, seed)
  const b = hash(xi + 1, yi, seed)
  const c = hash(xi, yi + 1, seed)
  const d = hash(xi + 1, yi + 1, seed)
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty
}

function fbm(x: number, y: number, octaves: number, seed: number): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  let total = 0
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, y * frequency, seed + i * 100) * amplitude
    total += amplitude
    amplitude *= 0.5
    frequency *= 2
  }
  return value / total
}

// ── Helpers ─────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16)
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16)
  const r = Math.round(lerp(r1, r2, t)), g = Math.round(lerp(g1, g2, t)), b = Math.round(lerp(b1, b2, t))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/** Build a smooth cubic bezier curve through an array of points */
function smoothPath(pts: [number, number][], closed = false): string {
  if (pts.length < 2) return ''
  const n = pts.length
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, n - 1)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  if (closed) d += 'Z'
  return d
}

/** Wobble a set of points by a noise-based offset to create a second animation frame */
function wobblePoints(pts: [number, number][], amount: number, seed: number): [number, number][] {
  return pts.map(([x, y], i) => [
    x + (noise2D(i * 0.7, 0, seed) - 0.5) * amount,
    y + (noise2D(0, i * 0.7, seed + 99) - 0.5) * amount,
  ])
}

function svgOpen(w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`
}

// ── Style Generators ────────────────────────────────────────────────────

/**
 * NOODLE — A thick curvy line that draws itself in from nothing,
 * then gently squirms. Starts small, grows like a noodle being extruded.
 */
function generateNoodle(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const count = 1 + Math.floor(complexity * 0.4)
  const els: string[] = []
  const styles: string[] = []

  for (let n = 0; n < count; n++) {
    const pts: [number, number][] = []
    const segments = 8 + complexity * 2
    // Random wandering path
    let x = w * (0.15 + rng() * 0.7)
    let y = h * (0.15 + rng() * 0.7)
    pts.push([x, y])
    for (let i = 0; i < segments; i++) {
      const angle = rng() * Math.PI * 2
      const dist = 30 + rng() * (40 + complexity * 8)
      x += Math.cos(angle) * dist
      y += Math.sin(angle) * dist
      x = Math.max(40, Math.min(w - 40, x))
      y = Math.max(40, Math.min(h - 40, y))
      pts.push([x, y])
    }

    const d1 = smoothPath(pts)
    const d2 = smoothPath(wobblePoints(pts, 15 + complexity * 2, seed + n * 7))
    const color = palette[n % palette.length]
    const sw = 10 + complexity * 2.5
    const totalLen = segments * 60 // approximate path length
    const dur1 = 2 + n * 0.8
    const dur2 = 3 + rng() * 2
    const id = `noodle${n}`

    if (animated) {
      styles.push(
        `@keyframes draw${n}{0%{stroke-dashoffset:${totalLen}}100%{stroke-dashoffset:0}}` +
        `@keyframes squirm${n}{0%,100%{d:path("${d1}")}50%{d:path("${d2}")}}`
      )
      // The drawing animation plays first, then squirming loops
      els.push(
        `<path id="${id}" d="${d1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" style="stroke-dasharray:${totalLen};animation:draw${n} ${dur1}s ease-out forwards,squirm${n} ${dur2}s ease-in-out ${dur1}s infinite"/>`
      )
    } else {
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>`
      )
    }
    // Add a thinner bright inner stroke for depth
    const innerColor = palette[(n + 1) % palette.length]
    if (animated) {
      styles.push(
        `@keyframes drawi${n}{0%{stroke-dashoffset:${totalLen}}100%{stroke-dashoffset:0}}`
      )
      els.push(
        `<path d="${d1}" fill="none" stroke="${innerColor}" stroke-width="${(sw * 0.35).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" style="stroke-dasharray:${totalLen};animation:drawi${n} ${dur1}s ease-out forwards,squirm${n} ${dur2}s ease-in-out ${dur1}s infinite"/>`
      )
    } else {
      els.push(
        `<path d="${d1}" fill="none" stroke="${innerColor}" stroke-width="${(sw * 0.35).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>`
      )
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}15" rx="20"/>${els.join('')}</svg>`
}

/**
 * SQUIGGLE — Multiple thick playful squiggly lines moving across the canvas.
 */
function generateSquiggle(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const count = 3 + Math.floor(complexity * 0.6)
  const els: string[] = []
  const styles: string[] = []

  for (let n = 0; n < count; n++) {
    const pts: [number, number][] = []
    const freq = 0.02 + rng() * 0.03
    const amp = 30 + rng() * (20 + complexity * 5)
    const baseY = h * (0.15 + (n / count) * 0.7)
    for (let x = -20; x <= w + 20; x += 12) {
      const y = baseY + Math.sin(x * freq + n * 2) * amp + Math.cos(x * freq * 1.7 + n) * amp * 0.5
      pts.push([x, y])
    }
    const d1 = smoothPath(pts)
    const d2 = smoothPath(wobblePoints(pts, 20 + complexity * 3, seed + n * 11))
    const color = palette[n % palette.length]
    const sw = 8 + complexity * 1.5 + rng() * 4
    const totalLen = w + 200
    const dur = 2.5 + rng() * 2

    if (animated) {
      styles.push(
        `@keyframes sq${n}{0%,100%{d:path("${d1}")}50%{d:path("${d2}")}}` +
        `@keyframes sqdraw${n}{0%{stroke-dashoffset:${totalLen}}100%{stroke-dashoffset:0}}`
      )
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" opacity="0.8" style="stroke-dasharray:${totalLen};animation:sqdraw${n} ${dur}s ease-out forwards,sq${n} ${dur + 1}s ease-in-out ${dur}s infinite"/>`
      )
    } else {
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" opacity="0.8"/>`
      )
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10" rx="20"/>${els.join('')}</svg>`
}

/**
 * BUBBLES — Round bouncy circles that float, pulse, and pop in one by one.
 */
function generateBubbles(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const count = 8 + complexity * 4
  const els: string[] = []
  const styles: string[] = []

  for (let i = 0; i < count; i++) {
    const cx = 40 + rng() * (w - 80)
    const cy = 40 + rng() * (h - 80)
    const r = 12 + rng() * (20 + complexity * 5)
    const color = palette[i % palette.length]
    const delay = (i * 0.15).toFixed(2)
    const pulseDur = (2 + rng() * 2).toFixed(2)
    const floatY = (8 + rng() * 12).toFixed(1)

    if (animated) {
      styles.push(
        `@keyframes pop${i}{0%{transform:translate(${cx}px,${cy}px) scale(0);opacity:0}60%{transform:translate(${cx}px,${cy}px) scale(1.2);opacity:0.8}100%{transform:translate(${cx}px,${cy}px) scale(1);opacity:0.75}}` +
        `@keyframes float${i}{0%,100%{transform:translate(${cx}px,${cy}px) scale(1)}50%{transform:translate(${cx}px,${(cy - parseFloat(floatY))}px) scale(${(1 + rng() * 0.15).toFixed(2)})}}`
      )
      els.push(
        `<circle cx="0" cy="0" r="${r.toFixed(1)}" fill="${color}" style="animation:pop${i} 0.6s ease-out ${delay}s both,float${i} ${pulseDur}s ease-in-out ${(parseFloat(delay) + 0.6).toFixed(2)}s infinite"/>` +
        `<circle cx="0" cy="0" r="${(r * 0.35).toFixed(1)}" fill="white" opacity="0.3" style="animation:pop${i} 0.6s ease-out ${delay}s both,float${i} ${pulseDur}s ease-in-out ${(parseFloat(delay) + 0.6).toFixed(2)}s infinite"/>`
      )
    } else {
      els.push(
        `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="0.75"/>` +
        `<circle cx="${(cx - r * 0.25).toFixed(1)}" cy="${(cy - r * 0.25).toFixed(1)}" r="${(r * 0.35).toFixed(1)}" fill="white" opacity="0.3"/>`
      )
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}12" rx="20"/>${els.join('')}</svg>`
}

/**
 * LAVA — Thick morphing amoeba blobs that slowly breathe and merge.
 */
function generateLava(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const count = 2 + Math.floor(complexity * 0.4)
  const els: string[] = []
  const styles: string[] = []

  for (let n = 0; n < count; n++) {
    const cx = w * (0.25 + rng() * 0.5)
    const cy = h * (0.25 + rng() * 0.5)
    const baseR = Math.min(w, h) * (0.12 + rng() * 0.12 + complexity * 0.015)
    const lobes = 5 + Math.floor(complexity * 0.5)

    const makeBlob = (seedOffset: number): string => {
      const pts: [number, number][] = []
      for (let i = 0; i < lobes; i++) {
        const angle = (i / lobes) * Math.PI * 2
        const r = baseR * (0.7 + 0.6 * noise2D(Math.cos(angle) * 2 + n * 5, Math.sin(angle) * 2 + n * 5, seed + seedOffset))
        pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
      }
      return smoothPath(pts, true)
    }

    const d1 = makeBlob(0)
    const d2 = makeBlob(100 + n * 50)
    const d3 = makeBlob(200 + n * 50)
    const color = palette[n % palette.length]
    const dur = (5 + rng() * 4).toFixed(1)

    if (animated) {
      styles.push(
        `@keyframes lava${n}{0%,100%{d:path("${d1}")}33%{d:path("${d2}")}66%{d:path("${d3}")}}`
      )
      els.push(
        `<path d="${d1}" fill="${color}" opacity="0.7" style="animation:lava${n} ${dur}s ease-in-out infinite"/>` +
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="4" opacity="0.3" style="animation:lava${n} ${dur}s ease-in-out infinite"/>`
      )
    } else {
      els.push(
        `<path d="${d1}" fill="${color}" opacity="0.7"/>` +
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="4" opacity="0.3"/>`
      )
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}18" rx="20"/>${els.join('')}</svg>`
}

/**
 * RIBBON — Wide flowing ribbon that unfurls across the canvas with a wavy body.
 */
function generateRibbon(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const ribbons = 1 + Math.floor(complexity * 0.3)
  const els: string[] = []
  const styles: string[] = []

  for (let n = 0; n < ribbons; n++) {
    const segments = 10 + complexity * 2
    const ribbonWidth = 20 + complexity * 4 + rng() * 15
    const topPts: [number, number][] = []
    const botPts: [number, number][] = []

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = t * w
      const baseY = h * (0.3 + n * 0.2) + Math.sin(t * Math.PI * (2 + complexity * 0.3) + n * 2) * (40 + complexity * 8)
      const wobble = noise2D(t * 4 + n * 5, 0, seed) * 20
      topPts.push([x, baseY - ribbonWidth / 2 + wobble])
      botPts.push([x, baseY + ribbonWidth / 2 + wobble])
    }

    const topD = smoothPath(topPts)
    const botD = smoothPath([...botPts].reverse())
    const fullD = `${topD} L${botPts[botPts.length - 1][0].toFixed(1)},${botPts[botPts.length - 1][1].toFixed(1)} ${botD.replace(/^M[^ ]+/, '')} Z`

    // Wobbled version
    const topPts2 = wobblePoints(topPts, 12 + complexity, seed + n * 13)
    const botPts2 = wobblePoints(botPts, 12 + complexity, seed + n * 17)
    const topD2 = smoothPath(topPts2)
    const botD2 = smoothPath([...botPts2].reverse())
    const fullD2 = `${topD2} L${botPts2[botPts2.length - 1][0].toFixed(1)},${botPts2[botPts2.length - 1][1].toFixed(1)} ${botD2.replace(/^M[^ ]+/, '')} Z`

    const c1 = palette[n % palette.length]
    const c2 = palette[(n + 1) % palette.length]
    const gradId = `rg${n}`
    const dur = (4 + rng() * 3).toFixed(1)

    els.push(`<defs><linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>`)

    if (animated) {
      styles.push(
        `@keyframes rib${n}{0%,100%{d:path("${fullD}")}50%{d:path("${fullD2}")}}` +
        `@keyframes ribclip${n}{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}`
      )
      els.push(
        `<path d="${fullD}" fill="url(#${gradId})" opacity="0.75" style="animation:ribclip${n} 2s ease-out forwards,rib${n} ${dur}s ease-in-out 2s infinite"/>` +
        `<path d="${topD}" fill="none" stroke="${c1}" stroke-width="2.5" stroke-linecap="round" opacity="0.4" style="animation:ribclip${n} 2s ease-out forwards"/>`
      )
    } else {
      els.push(
        `<path d="${fullD}" fill="url(#${gradId})" opacity="0.75"/>` +
        `<path d="${topD}" fill="none" stroke="${c1}" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>`
      )
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10" rx="20"/>${els.join('')}</svg>`
}

/**
 * BOUNCE — Round shapes that bounce in with squash & stretch.
 */
function generateBounce(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const count = 5 + complexity * 2
  const els: string[] = []
  const styles: string[] = []
  const floorY = h * 0.85

  for (let i = 0; i < count; i++) {
    const cx = 40 + (i / (count - 1)) * (w - 80)
    const r = 15 + rng() * (10 + complexity * 3)
    const color = palette[i % palette.length]
    const bounceDur = (1.2 + rng() * 0.8).toFixed(2)
    const delay = (i * 0.2).toFixed(2)
    const bounceH = 60 + rng() * (80 + complexity * 15)
    const restY = floorY - r

    if (animated) {
      // Bounce: fall from top, squash at bottom, bounce back up
      styles.push(
        `@keyframes bnc${i}{` +
        `0%{transform:translate(${cx}px,${(restY - bounceH)}px) scaleX(1) scaleY(1)}` +
        `40%{transform:translate(${cx}px,${restY}px) scaleX(1.25) scaleY(0.75)}` +
        `55%{transform:translate(${cx}px,${(restY - bounceH * 0.4)}px) scaleX(0.9) scaleY(1.1)}` +
        `70%{transform:translate(${cx}px,${restY}px) scaleX(1.15) scaleY(0.85)}` +
        `85%{transform:translate(${cx}px,${(restY - bounceH * 0.15)}px) scaleX(0.95) scaleY(1.05)}` +
        `100%{transform:translate(${cx}px,${restY}px) scaleX(1) scaleY(1)}}`
      )
      els.push(
        `<g style="animation:bnc${i} ${bounceDur}s ease-in ${delay}s infinite">` +
        `<circle cx="0" cy="0" r="${r.toFixed(1)}" fill="${color}" opacity="0.85"/>` +
        `<ellipse cx="${(-r * 0.2).toFixed(1)}" cy="${(-r * 0.2).toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" ry="${(r * 0.2).toFixed(1)}" fill="white" opacity="0.25"/>` +
        `</g>`
      )
      // Shadow
      els.push(
        `<ellipse cx="${cx.toFixed(1)}" cy="${floorY.toFixed(1)}" rx="${(r * 0.8).toFixed(1)}" ry="${(r * 0.15).toFixed(1)}" fill="${color}" opacity="0.15"/>`
      )
    } else {
      els.push(
        `<circle cx="${cx.toFixed(1)}" cy="${restY.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="0.85"/>` +
        `<ellipse cx="${(cx - r * 0.2).toFixed(1)}" cy="${(restY - r * 0.2).toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" ry="${(r * 0.2).toFixed(1)}" fill="white" opacity="0.25"/>` +
        `<ellipse cx="${cx.toFixed(1)}" cy="${floorY.toFixed(1)}" rx="${(r * 0.8).toFixed(1)}" ry="${(r * 0.15).toFixed(1)}" fill="${color}" opacity="0.15"/>`
      )
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10" rx="20"/>${els.join('')}</svg>`
}

/**
 * SWIRL — Thick spiral that draws itself in from center, then pulsates.
 */
function generateSwirl(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const cx = w / 2, cy = h / 2
  const arms = 1 + Math.floor(complexity * 0.3)
  const els: string[] = []
  const styles: string[] = []

  for (let a = 0; a < arms; a++) {
    const offset = (a / arms) * Math.PI * 2
    const pts: [number, number][] = []
    const turns = 2 + complexity * 0.4
    const maxR = Math.min(w, h) * 0.4
    const totalSteps = 60 + complexity * 10

    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps
      const angle = offset + t * turns * Math.PI * 2
      const r = t * maxR
      const wobble = noise2D(t * 5, a * 3, seed) * (10 + complexity * 2)
      pts.push([cx + Math.cos(angle) * (r + wobble), cy + Math.sin(angle) * (r + wobble)])
    }

    const d1 = smoothPath(pts)
    const d2 = smoothPath(wobblePoints(pts, 10 + complexity, seed + a * 19))
    const color = palette[a % palette.length]
    const sw = 12 + complexity * 2
    const totalLen = totalSteps * 15
    const drawDur = (2.5 + a * 0.5).toFixed(1)
    const wobDur = (3 + rng() * 2).toFixed(1)

    if (animated) {
      styles.push(
        `@keyframes swdraw${a}{0%{stroke-dashoffset:${totalLen}}100%{stroke-dashoffset:0}}` +
        `@keyframes swwob${a}{0%,100%{d:path("${d1}")}50%{d:path("${d2}")}}`
      )
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" opacity="0.8" style="stroke-dasharray:${totalLen};animation:swdraw${a} ${drawDur}s ease-out forwards,swwob${a} ${wobDur}s ease-in-out ${drawDur}s infinite"/>` +
        `<path d="${d1}" fill="none" stroke="${palette[(a + 1) % palette.length]}" stroke-width="${(sw * 0.3).toFixed(1)}" stroke-linecap="round" opacity="0.4" style="stroke-dasharray:${totalLen};animation:swdraw${a} ${drawDur}s ease-out forwards,swwob${a} ${wobDur}s ease-in-out ${drawDur}s infinite"/>`
      )
    } else {
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" opacity="0.8"/>` +
        `<path d="${d1}" fill="none" stroke="${palette[(a + 1) % palette.length]}" stroke-width="${(sw * 0.3).toFixed(1)}" stroke-linecap="round" opacity="0.4"/>`
      )
    }
    // Dot at tip
    const tip = pts[pts.length - 1]
    const dotR = sw * 0.6
    if (animated) {
      styles.push(`@keyframes swtip${a}{0%{r:0}100%{r:${dotR.toFixed(1)}}}`)
      els.push(`<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="0" fill="${color}" style="animation:swtip${a} 0.3s ease-out ${drawDur}s forwards"/>`)
    } else {
      els.push(`<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="${dotR.toFixed(1)}" fill="${color}"/>`)
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10" rx="20"/>${els.join('')}</svg>`
}

/**
 * TENTACLE — Thick organic arms that wave and curl from a base point.
 */
function generateTentacle(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const baseX = w * (0.3 + rng() * 0.4)
  const baseY = h * (0.6 + rng() * 0.2)
  const armCount = 3 + Math.floor(complexity * 0.5)
  const els: string[] = []
  const styles: string[] = []

  for (let a = 0; a < armCount; a++) {
    const spread = ((a / (armCount - 1)) - 0.5) * Math.PI * 0.7 - Math.PI / 2
    const length = 6 + Math.floor(complexity * 0.8)
    const pts: [number, number][] = [[baseX, baseY]]

    let x = baseX, y = baseY
    for (let i = 1; i <= length; i++) {
      const t = i / length
      const angle = spread + Math.sin(t * Math.PI * 2 + a) * 0.4
      const step = 25 + rng() * 15
      x += Math.cos(angle) * step
      y += Math.sin(angle) * step
      x = Math.max(20, Math.min(w - 20, x))
      y = Math.max(20, Math.min(h - 20, y))
      pts.push([x, y])
    }

    const d1 = smoothPath(pts)
    const d2 = smoothPath(wobblePoints(pts, 18 + complexity * 2, seed + a * 23))
    const color = palette[a % palette.length]
    // Thickness tapers: thick at base, thin at tip
    const baseSW = 14 + complexity * 2
    const dur = (2.5 + rng() * 1.5).toFixed(1)
    const wobDur = (3 + rng() * 2).toFixed(1)
    const totalLen = length * 35

    if (animated) {
      styles.push(
        `@keyframes tdraw${a}{0%{stroke-dashoffset:${totalLen}}100%{stroke-dashoffset:0}}` +
        `@keyframes twob${a}{0%,100%{d:path("${d1}")}50%{d:path("${d2}")}}`
      )
      // We can't easily taper with a single stroke, so use two paths: thick base + full thin
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${baseSW}" stroke-linecap="round" opacity="0.7" style="stroke-dasharray:${totalLen};animation:tdraw${a} ${dur}s ease-out forwards,twob${a} ${wobDur}s ease-in-out ${dur}s infinite"/>` +
        `<path d="${d1}" fill="none" stroke="${palette[(a + 2) % palette.length]}" stroke-width="${(baseSW * 0.3).toFixed(1)}" stroke-linecap="round" opacity="0.3" style="stroke-dasharray:${totalLen};animation:tdraw${a} ${dur}s ease-out forwards,twob${a} ${wobDur}s ease-in-out ${dur}s infinite"/>`
      )
    } else {
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${baseSW}" stroke-linecap="round" opacity="0.7"/>` +
        `<path d="${d1}" fill="none" stroke="${palette[(a + 2) % palette.length]}" stroke-width="${(baseSW * 0.3).toFixed(1)}" stroke-linecap="round" opacity="0.3"/>`
      )
    }
    // Tip dot
    const tip = pts[pts.length - 1]
    els.push(`<circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="${(baseSW * 0.4).toFixed(1)}" fill="${color}" opacity="0.8"/>`)
  }
  // Base circle
  const baseR = 15 + complexity * 2
  els.push(`<circle cx="${baseX.toFixed(1)}" cy="${baseY.toFixed(1)}" r="${baseR}" fill="${palette[0]}" opacity="0.8"/>`)

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10" rx="20"/>${els.join('')}</svg>`
}

/**
 * CONFETTI — Round thick dots and short strokes bursting out playfully.
 */
function generateConfetti(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const count = 15 + complexity * 6
  const els: string[] = []
  const styles: string[] = []

  for (let i = 0; i < count; i++) {
    const cx = 30 + rng() * (w - 60)
    const cy = 30 + rng() * (h - 60)
    const color = palette[i % palette.length]
    const delay = (rng() * 2).toFixed(2)
    const isCircle = rng() > 0.4

    if (isCircle) {
      const r = 6 + rng() * (8 + complexity * 2)
      if (animated) {
        const angle = rng() * 360
        const dist = 20 + rng() * 40
        const dur = (0.8 + rng() * 0.6).toFixed(2)
        styles.push(
          `@keyframes cf${i}{` +
          `0%{transform:translate(${(w / 2).toFixed(0)}px,${(h / 2).toFixed(0)}px) scale(0) rotate(0deg);opacity:0}` +
          `50%{opacity:0.9}` +
          `100%{transform:translate(${cx.toFixed(0)}px,${cy.toFixed(0)}px) scale(1) rotate(${angle.toFixed(0)}deg);opacity:0.8}}` +
          `@keyframes cfp${i}{0%,100%{transform:translate(${cx.toFixed(0)}px,${cy.toFixed(0)}px) scale(1)}50%{transform:translate(${(cx + Math.cos(angle * Math.PI / 180) * dist * 0.2).toFixed(0)}px,${(cy + Math.sin(angle * Math.PI / 180) * dist * 0.2).toFixed(0)}px) scale(${(1.1 + rng() * 0.2).toFixed(2)})}}`
        )
        els.push(
          `<circle cx="0" cy="0" r="${r.toFixed(1)}" fill="${color}" style="animation:cf${i} ${dur}s ease-out ${delay}s both,cfp${i} ${(1.5 + rng()).toFixed(2)}s ease-in-out ${(parseFloat(delay) + parseFloat(dur)).toFixed(2)}s infinite"/>`
        )
      } else {
        els.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}" opacity="0.8"/>`)
      }
    } else {
      // Short thick stroke segment
      const len = 15 + rng() * (15 + complexity * 3)
      const angle = rng() * Math.PI * 2
      const x2 = cx + Math.cos(angle) * len
      const y2 = cy + Math.sin(angle) * len
      const sw = 5 + rng() * (3 + complexity)
      if (animated) {
        const dur = (0.6 + rng() * 0.5).toFixed(2)
        const rot = (rng() * 360).toFixed(0)
        styles.push(
          `@keyframes cfl${i}{` +
          `0%{transform:translate(${(w / 2).toFixed(0)}px,${(h / 2).toFixed(0)}px) rotate(0deg) scale(0);opacity:0}` +
          `100%{transform:translate(${cx.toFixed(0)}px,${cy.toFixed(0)}px) rotate(${rot}deg) scale(1);opacity:0.8}}`
        )
        els.push(
          `<line x1="0" y1="0" x2="${(x2 - cx).toFixed(1)}" y2="${(y2 - cy).toFixed(1)}" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" style="animation:cfl${i} ${dur}s ease-out ${delay}s both"/>`
        )
      } else {
        els.push(
          `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" opacity="0.8"/>`
        )
      }
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10" rx="20"/>${els.join('')}</svg>`
}

/**
 * WIGGLE — A thick continuous line that perpetually wiggles side to side,
 * like a happy worm dancing. Uses `<animate>` on d for smooth morph.
 */
function generateWiggle(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const count = 2 + Math.floor(complexity * 0.3)
  const els: string[] = []
  const styles: string[] = []

  for (let n = 0; n < count; n++) {
    // Vertical meandering line
    const pts: [number, number][] = []
    const segments = 8 + complexity * 2
    const baseX = w * (0.2 + (n / Math.max(count - 1, 1)) * 0.6)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = baseX + Math.sin(t * Math.PI * (2 + complexity * 0.3) + n * 3) * (40 + complexity * 8)
      const y = t * h
      pts.push([x, y])
    }

    // Three wiggle frames
    const d1 = smoothPath(pts)
    const d2 = smoothPath(wobblePoints(pts, 25 + complexity * 3, seed + n * 31))
    const d3 = smoothPath(wobblePoints(pts, 25 + complexity * 3, seed + n * 31 + 50))
    const color = palette[n % palette.length]
    const sw = 12 + complexity * 2.5
    const dur = (2 + rng() * 1.5).toFixed(1)
    const totalLen = h * 1.3
    const drawDur = (1.5 + n * 0.3).toFixed(1)

    if (animated) {
      styles.push(
        `@keyframes wdraw${n}{0%{stroke-dashoffset:${totalLen.toFixed(0)}}100%{stroke-dashoffset:0}}` +
        `@keyframes wwig${n}{0%,100%{d:path("${d1}")}33%{d:path("${d2}")}66%{d:path("${d3}")}}`
      )
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" opacity="0.8" style="stroke-dasharray:${totalLen.toFixed(0)};animation:wdraw${n} ${drawDur}s ease-out forwards,wwig${n} ${dur}s ease-in-out ${drawDur}s infinite"/>` +
        `<path d="${d1}" fill="none" stroke="white" stroke-width="${(sw * 0.2).toFixed(1)}" stroke-linecap="round" opacity="0.2" style="stroke-dasharray:${totalLen.toFixed(0)};animation:wdraw${n} ${drawDur}s ease-out forwards,wwig${n} ${dur}s ease-in-out ${drawDur}s infinite"/>`
      )
    } else {
      els.push(
        `<path d="${d1}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" opacity="0.8"/>` +
        `<path d="${d1}" fill="none" stroke="white" stroke-width="${(sw * 0.2).toFixed(1)}" stroke-linecap="round" opacity="0.2"/>`
      )
    }
  }

  const style = styles.length > 0 ? `<style>${styles.join('')}</style>` : ''
  return `${svgOpen(w, h)}${style}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10" rx="20"/>${els.join('')}</svg>`
}

// ── Classic Style Generators ─────────────────────────────────────────────

function generateBlob(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const count = 3 + Math.floor(complexity * 0.8)
  const paths: string[] = []

  for (let i = 0; i < count; i++) {
    const cx = w * (0.2 + rng() * 0.6)
    const cy = h * (0.2 + rng() * 0.6)
    const baseR = Math.min(w, h) * (0.1 + rng() * 0.2)
    const points = 6 + Math.floor(complexity * 0.5)
    const coords: [number, number][] = []

    for (let j = 0; j < points; j++) {
      const angle = (j / points) * Math.PI * 2
      const r = baseR * (0.7 + 0.6 * noise2D(Math.cos(angle) * 2 + i * 10, Math.sin(angle) * 2 + i * 10, o.seed))
      coords.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
    }

    let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`
    for (let j = 0; j < coords.length; j++) {
      const curr = coords[j]
      const next = coords[(j + 1) % coords.length]
      const next2 = coords[(j + 2) % coords.length]
      const cpx1 = curr[0] + (next[0] - coords[(j - 1 + coords.length) % coords.length][0]) / 4
      const cpy1 = curr[1] + (next[1] - coords[(j - 1 + coords.length) % coords.length][1]) / 4
      const cpx2 = next[0] - (next2[0] - curr[0]) / 4
      const cpy2 = next[1] - (next2[1] - curr[1]) / 4
      d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${next[0].toFixed(1)} ${next[1].toFixed(1)}`
    }
    d += ' Z'
    const color = palette[i % palette.length]
    const anim = animated ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx.toFixed(0)} ${cy.toFixed(0)}" to="360 ${cx.toFixed(0)} ${cy.toFixed(0)}" dur="${8 + i * 3}s" repeatCount="indefinite"/>` : ''
    paths.push(`<path d="${d}" fill="${color}" opacity="0.6">${anim}</path>`)
  }
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}22"/>${paths.join('')}</svg>`
}

function generateFlowField(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const lineCount = 40 + complexity * 15
  const steps = 20 + complexity * 5
  const stepSize = Math.min(w, h) / 60
  const paths: string[] = []

  for (let i = 0; i < lineCount; i++) {
    let x = rng() * w
    let y = rng() * h
    const color = palette[i % palette.length]
    let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`
    for (let s = 0; s < steps; s++) {
      const angle = fbm(x / 200, y / 200, 3, seed) * Math.PI * 4
      x += Math.cos(angle) * stepSize
      y += Math.sin(angle) * stepSize
      if (x < 0 || x > w || y < 0 || y > h) break
      d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
    }
    const sw = 0.5 + rng() * 2
    const animAttr = animated ? ` stroke-dasharray="10 5" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" from="0" to="-15" dur="${2 + rng() * 3}s" repeatCount="indefinite"/>` : '>'
    paths.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" opacity="0.7"${animAttr}</path>`)
  }
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}15"/>${paths.join('')}</svg>`
}

function generateMandala(o: ArtOptions, _rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const cx = w / 2, cy = h / 2
  const layers = 3 + Math.floor(complexity * 0.7)
  const symmetry = 6 + Math.floor(complexity * 0.8)
  const elements: string[] = []

  for (let layer = 0; layer < layers; layer++) {
    const r = (Math.min(w, h) * 0.4) * ((layer + 1) / layers)
    const color = palette[layer % palette.length]
    const petalW = r * 0.3
    const petalH = r * 0.15
    for (let i = 0; i < symmetry; i++) {
      const angle = (i / symmetry) * 360
      const rad = (angle * Math.PI) / 180
      const px = cx + Math.cos(rad) * r * 0.5
      const py = cy + Math.sin(rad) * r * 0.5
      elements.push(`<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${petalW.toFixed(1)}" ry="${petalH.toFixed(1)}" fill="${color}" opacity="0.6" transform="rotate(${angle.toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`)
    }
    elements.push(`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>`)
  }
  const dotCount = symmetry * 2
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2
    const r = Math.min(w, h) * 0.35
    elements.push(`<circle cx="${(cx + Math.cos(angle) * r).toFixed(1)}" cy="${(cy + Math.sin(angle) * r).toFixed(1)}" r="3" fill="${palette[i % palette.length]}" opacity="0.8"/>`)
  }
  const animGroup = animated ? `<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="30s" repeatCount="indefinite"/>` : ''
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}18"/><g>${elements.join('')}${animGroup}</g></svg>`
}

function generateSpiral(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const cx = w / 2, cy = h / 2
  const arms = 2 + Math.floor(complexity * 0.3)
  const paths: string[] = []
  const maxR = Math.min(w, h) * 0.45
  const turns = 3 + complexity * 0.5

  for (let a = 0; a < arms; a++) {
    const offset = (a / arms) * Math.PI * 2
    const color = palette[a % palette.length]
    const points: string[] = []
    const totalSteps = 100 + complexity * 20
    for (let i = 0; i <= totalSteps; i++) {
      const t = i / totalSteps
      const angle = offset + t * turns * Math.PI * 2
      const r = t * maxR
      points.push(`${(cx + Math.cos(angle) * r).toFixed(1)} ${(cy + Math.sin(angle) * r).toFixed(1)}`)
    }
    const d = `M ${points.join(' L ')}`
    const sw = 1 + rng() * 2
    const animAttr = animated ? ` stroke-dasharray="5 3"><animate attributeName="stroke-dashoffset" from="0" to="-8" dur="${4 + a}s" repeatCount="indefinite"/>` : '>'
    paths.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linecap="round" opacity="0.7"${animAttr}</path>`)
  }
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}12"/>${paths.join('')}</svg>`
}

function generateWaves(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const lineCount = 8 + complexity * 3
  const paths: string[] = []

  for (let i = 0; i < lineCount; i++) {
    const baseY = (h / (lineCount + 1)) * (i + 1)
    const amplitude = 20 + complexity * 5
    const freq = 0.005 + rng() * 0.01
    const phase = rng() * Math.PI * 2
    const color = palette[i % palette.length]
    const points: string[] = []
    for (let x = 0; x <= w; x += 4) {
      const y = baseY + Math.sin(x * freq + phase) * amplitude + Math.sin(x * freq * 2.3 + phase * 1.7) * amplitude * 0.4
      points.push(`${x} ${y.toFixed(1)}`)
    }
    const d = `M ${points.join(' L ')}`
    const sw = 1.5 + rng() * 1.5
    const animAttr = animated
      ? `><animate attributeName="d" dur="${6 + i * 0.5}s" repeatCount="indefinite" values="${d};M ${points.map((p, idx) => { const [px, py] = p.split(' '); return `${px} ${(parseFloat(py) + Math.sin(idx * 0.2) * 10).toFixed(1)}`; }).join(' L ')};${d}"/>`
      : '>'
    paths.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" opacity="0.6"${animAttr}</path>`)
  }
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10"/>${paths.join('')}</svg>`
}

function generateAurora(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const bandCount = 4 + Math.floor(complexity * 0.6)
  const defs: string[] = []
  const paths: string[] = []

  for (let i = 0; i < bandCount; i++) {
    const gradId = `ag${i}`
    const c1 = palette[i % palette.length]
    const c2 = palette[(i + 1) % palette.length]
    defs.push(`<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${c1}" stop-opacity="0"/><stop offset="30%" stop-color="${c1}" stop-opacity="0.5"/><stop offset="50%" stop-color="${c2}" stop-opacity="0.6"/><stop offset="70%" stop-color="${c1}" stop-opacity="0.5"/><stop offset="100%" stop-color="${c2}" stop-opacity="0"/></linearGradient>`)
    const baseY = h * (0.2 + i * 0.12)
    const points: string[] = []
    const bottomPoints: string[] = []
    const bandHeight = h * (0.08 + rng() * 0.06)
    for (let x = 0; x <= w; x += 8) {
      const n = fbm(x / 300, i * 3, 3, seed) * 60
      const y = baseY + n
      points.push(`${x} ${y.toFixed(1)}`)
      bottomPoints.unshift(`${x} ${(y + bandHeight).toFixed(1)}`)
    }
    const d = `M ${points.join(' L ')} L ${bottomPoints.join(' L ')} Z`
    const animAttr = animated ? `<animateTransform attributeName="transform" type="translate" values="0,0;${15 + i * 5},${-5 + i * 2};0,0" dur="${8 + i * 2}s" repeatCount="indefinite"/>` : ''
    paths.push(`<path d="${d}" fill="url(#${gradId})" opacity="0.7">${animAttr}</path>`)
  }
  return `${svgOpen(w, h)}<defs>${defs.join('')}</defs><rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}20"/>${paths.join('')}</svg>`
}

function generateTopography(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed } = o
  const levels = 8 + complexity * 2
  const paths: string[] = []
  const step = 6

  for (let level = 0; level < levels; level++) {
    const threshold = level / levels
    const color = palette[level % palette.length]
    const segments: string[] = []
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const v = fbm(x / 150, y / 150, 4, seed)
        if (Math.abs(v - threshold) < 0.02) segments.push(`${x},${y}`)
      }
    }
    if (segments.length > 1) {
      let d = ''
      let prevX = -999, prevY = -999
      for (const seg of segments) {
        const [sx, sy] = seg.split(',').map(Number)
        const dist = Math.hypot(sx - prevX, sy - prevY)
        if (dist < step * 2.5) d += ` L ${sx} ${sy}`
        else d += ` M ${sx} ${sy}`
        prevX = sx; prevY = sy
      }
      if (d) {
        const sw = 0.8 + rng() * 0.6
        paths.push(`<path d="${d.trim()}" fill="none" stroke="${color}" stroke-width="${sw.toFixed(1)}" opacity="0.6"/>`)
      }
    }
  }
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10"/>${paths.join('')}</svg>`
}

function generateConstellation(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const count = 30 + complexity * 15
  const connectDist = Math.min(w, h) * (0.1 + complexity * 0.02)
  const stars: { x: number; y: number; r: number }[] = []
  const lines: string[] = []
  const dots: string[] = []

  for (let i = 0; i < count; i++) {
    stars.push({ x: rng() * w, y: rng() * h, r: 1 + rng() * 3 })
  }
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y)
      if (dist < connectDist) {
        const opacity = (1 - dist / connectDist) * 0.4
        lines.push(`<line x1="${stars[i].x.toFixed(1)}" y1="${stars[i].y.toFixed(1)}" x2="${stars[j].x.toFixed(1)}" y2="${stars[j].y.toFixed(1)}" stroke="${palette[i % palette.length]}" stroke-width="0.5" opacity="${opacity.toFixed(2)}"/>`)
      }
    }
  }
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i]
    const anim = animated ? `<animate attributeName="opacity" values="0.5;1;0.5" dur="${2 + rng() * 3}s" repeatCount="indefinite"/>` : ''
    dots.push(`<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(1)}" fill="${palette[i % palette.length]}" opacity="0.8">${anim}</circle>`)
  }
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}08"/>${lines.join('')}${dots.join('')}</svg>`
}

function generateGeometric(o: ArtOptions, rng: () => number): string {
  const { width: w, height: h, palette, complexity, animated } = o
  const cx = w / 2, cy = h / 2
  const layers = 4 + Math.floor(complexity * 0.6)
  const elements: string[] = []

  for (let layer = 0; layer < layers; layer++) {
    const sides = 3 + Math.floor(rng() * 5)
    const r = (Math.min(w, h) * 0.4) * ((layer + 1) / layers)
    const color = palette[layer % palette.length]
    const rotation = layer * 15 + rng() * 30
    const points: string[] = []
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
      points.push(`${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`)
    }
    const animAttr = animated ? `<animateTransform attributeName="transform" type="rotate" from="${rotation.toFixed(0)} ${cx} ${cy}" to="${(rotation + 360).toFixed(0)} ${cx} ${cy}" dur="${20 + layer * 5}s" repeatCount="indefinite"/>` : ''
    elements.push(`<polygon points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.5" transform="rotate(${rotation.toFixed(1)} ${cx} ${cy})">${animAttr}</polygon>`)
    if (complexity > 4) {
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
        elements.push(`<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(angle) * r).toFixed(1)}" y2="${(cy + Math.sin(angle) * r).toFixed(1)}" stroke="${color}" stroke-width="0.5" opacity="0.3"/>`)
      }
    }
  }
  return `${svgOpen(w, h)}<rect width="${w}" height="${h}" fill="${palette[palette.length - 1]}10"/>${elements.join('')}</svg>`
}

function generateLandscape(o: ArtOptions, _rng: () => number): string {
  const { width: w, height: h, palette, complexity, seed, animated } = o
  const ridges = 4 + Math.floor(complexity * 0.5)
  const paths: string[] = []

  for (let i = 0; i < ridges; i++) {
    const baseY = h * (0.3 + i * 0.12)
    const color = palette[i % palette.length]
    const t = i / ridges
    const bgColor = lerpColor(color, palette[palette.length - 1] || '#000000', t * 0.3)
    const points: string[] = [`0 ${h}`]
    for (let x = 0; x <= w; x += 4) {
      const n = fbm(x / (200 - i * 15), i * 5, 3 + Math.floor(complexity * 0.3), seed + i * 50)
      points.push(`${x} ${(baseY - n * h * 0.25).toFixed(1)}`)
    }
    points.push(`${w} ${h}`)
    const d = `M ${points.join(' L ')} Z`
    const opacity = 0.5 + (i / ridges) * 0.4
    const animAttr = animated ? `<animateTransform attributeName="transform" type="translate" values="0,0;${3 + i * 2},0;0,0" dur="${10 + i * 3}s" repeatCount="indefinite"/>` : ''
    paths.push(`<path d="${d}" fill="${bgColor}" opacity="${opacity.toFixed(2)}">${animAttr}</path>`)
  }
  const skyGrad = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${palette[0]}"/><stop offset="100%" stop-color="${palette[1] || palette[0]}33"/></linearGradient></defs>`
  return `${svgOpen(w, h)}${skyGrad}<rect width="${w}" height="${h}" fill="url(#sky)"/>${paths.join('')}</svg>`
}

// ── Generator Map ───────────────────────────────────────────────────────

const GENERATORS: Record<ArtStyle, (o: ArtOptions, rng: () => number) => string> = {
  noodle: generateNoodle,
  squiggle: generateSquiggle,
  bubbles: generateBubbles,
  lava: generateLava,
  ribbon: generateRibbon,
  bounce: generateBounce,
  swirl: generateSwirl,
  tentacle: generateTentacle,
  confetti: generateConfetti,
  wiggle: generateWiggle,
  blob: generateBlob,
  flowField: generateFlowField,
  mandala: generateMandala,
  spiral: generateSpiral,
  waves: generateWaves,
  aurora: generateAurora,
  topography: generateTopography,
  constellation: generateConstellation,
  geometric: generateGeometric,
  landscape: generateLandscape,
}

// ── Public API ──────────────────────────────────────────────────────────

export function generateSVGArt(options: ArtOptions): { svg: string; name: string } {
  const rng = mulberry32(options.seed)
  const svg = GENERATORS[options.style](options, rng)
  const name = `${options.style}-${options.seed}`
  return { svg, name }
}

/**
 * Wraps an SVG string in a minimal HTML5 document with a CONFIG object
 * so colors become editable via the existing right-panel property editor
 * and the postMessage template bridge.
 */
export function wrapSVGAsHTML(svg: string, palette: string[], name: string): string {
  const configEntries = palette.map((c, i) => `    color${i + 1}: '${c}'`).join(',\n')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
  .container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .container svg { width: 100%; height: 100%; }
</style>
</head>
<body>
<script>
  // ===== EDITABLE CONFIG =====
  const CONFIG = {
${configEntries}
  };
  // ===== END EDITABLE =====
</script>
<div class="container">
${svg}
</div>
<script>
  function applyColors() {
    var svgEl = document.querySelector('svg');
    if (!svgEl) return;
    var colors = Object.values(CONFIG).filter(function(v) { return typeof v === 'string' && v.charAt(0) === '#'; });
    svgEl.querySelectorAll('[fill]').forEach(function(el, i) {
      var c = colors[i % colors.length];
      var f = el.getAttribute('fill');
      if (c && f && !f.startsWith('url') && f !== 'none' && f !== 'white') el.setAttribute('fill', c);
    });
    svgEl.querySelectorAll('[stroke]').forEach(function(el, i) {
      var c = colors[i % colors.length];
      var s = el.getAttribute('stroke');
      if (c && s && s !== 'none' && s !== 'white') el.setAttribute('stroke', c);
    });
    svgEl.querySelectorAll('stop').forEach(function(el, i) {
      var c = colors[i % colors.length];
      if (c) el.setAttribute('stop-color', c);
    });
  }
  var origApply = window.__applyConfigUpdate;
  window.__applyConfigUpdate = function(key, value) {
    if (origApply) origApply(key, value);
    else if (typeof CONFIG !== 'undefined') CONFIG[key] = value;
    applyColors();
  };
  applyColors();
</script>
</body>
</html>`
}
