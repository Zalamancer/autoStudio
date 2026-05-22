/**
 * Cosmic effect: star field and nebula overlay.
 * Animated when twinkle is enabled: cycles through seed variants.
 */

import type { CosmicSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: CosmicSettings, seed?: number): string {
  return `cosmic|${src}|${s.starDensity}|${s.nebulaOpacity}|${s.colorScheme}|${s.twinkle}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function getNebulaColors(scheme: string): [number, number, number][] {
  switch (scheme) {
    case 'warm': return [[180, 60, 100], [200, 100, 50], [150, 40, 80]]
    case 'cool': return [[40, 80, 180], [60, 120, 200], [80, 60, 160]]
    case 'mixed':
    default: return [[120, 40, 180], [40, 100, 180], [180, 60, 120]]
  }
}

async function process(src: string, s: CosmicSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 9001 + 61)
  const nebulaColors = getNebulaColors(s.colorScheme)

  // Draw nebula clouds
  if (s.nebulaOpacity > 0) {
    ctx.globalCompositeOperation = 'screen'
    const cloudCount = 3 + Math.floor(rng() * 4)

    for (let i = 0; i < cloudCount; i++) {
      const [nr, ng, nb] = nebulaColors[i % nebulaColors.length]
      const cx = rng() * w
      const cy = rng() * h
      const rx = 30 + rng() * w * 0.4
      const ry = 20 + rng() * h * 0.3
      const alpha = s.nebulaOpacity * (0.05 + rng() * 0.1)

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
      grad.addColorStop(0, `rgba(${nr}, ${ng}, ${nb}, ${alpha})`)
      grad.addColorStop(0.5, `rgba(${nr}, ${ng}, ${nb}, ${alpha * 0.4})`)
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, rng() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // Draw stars
  if (s.starDensity > 0) {
    const starCount = Math.floor(s.starDensity * 300)

    for (let i = 0; i < starCount; i++) {
      const sx = rng() * w
      const sy = rng() * h

      // Star brightness (with optional twinkle variation)
      let brightness = 0.3 + rng() * 0.7
      if (s.twinkle) {
        brightness *= 0.5 + Math.sin(seed * 1.5 + i * 0.3) * 0.5
      }

      const size = 0.5 + rng() * 2
      const alpha = brightness

      // Star color: mostly white, some with color tint
      let r = 255, g = 255, b = 255
      if (rng() > 0.7) {
        // Colored star
        const tint = rng()
        if (tint < 0.33) { r = 255; g = 200; b = 150 } // warm
        else if (tint < 0.66) { r = 150; g = 200; b = 255 } // cool
        else { r = 255; g = 180; b = 180 } // reddish
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.beginPath()
      ctx.arc(sx, sy, size, 0, Math.PI * 2)
      ctx.fill()

      // Cross sparkle on bright stars
      if (brightness > 0.8 && size > 1) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.4})`
        ctx.lineWidth = 0.5
        const sparkLen = size * 3
        ctx.beginPath()
        ctx.moveTo(sx - sparkLen, sy)
        ctx.lineTo(sx + sparkLen, sy)
        ctx.moveTo(sx, sy - sparkLen)
        ctx.lineTo(sx, sy + sparkLen)
        ctx.stroke()
      }
    }
  }

  return canvas.toDataURL('image/png')
}

export const cosmicCache = createEffectCache<CosmicSettings>({
  name: 'cosmic',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
