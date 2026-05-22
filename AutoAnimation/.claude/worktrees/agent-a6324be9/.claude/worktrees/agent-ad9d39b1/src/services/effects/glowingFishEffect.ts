import type { GlowingFishSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: GlowingFishSettings, seed?: number): string {
  return `glowing-fish|${src}|${s.fishCount}|${s.glowColor}|${s.swimSpeed}|${s.size}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: GlowingFishSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 3571 + 41)
  const gc = parseInt(s.glowColor.replace('#', ''), 16)
  const gr = (gc >> 16) & 255, gg = (gc >> 8) & 255, gb = gc & 255
  const phase = seed * s.swimSpeed * 0.4

  for (let i = 0; i < s.fishCount; i++) {
    const baseX = rng() * w
    const baseY = rng() * h
    const fx = baseX + Math.sin(phase + i * 2.1) * 20 * s.swimSpeed
    const fy = baseY + Math.cos(phase + i * 1.7) * 10
    const sz = s.size * 3 * (0.6 + rng() * 0.4)
    const dir = Math.sin(phase + i * 2.1) > 0 ? 1 : -1

    // Glow
    ctx.save()
    ctx.translate(fx, fy)
    ctx.scale(dir, 1)
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, sz * 2)
    glowGrad.addColorStop(0, `rgba(${gr},${gg},${gb},0.3)`)
    glowGrad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`)
    ctx.fillStyle = glowGrad
    ctx.beginPath()
    ctx.arc(0, 0, sz * 2, 0, Math.PI * 2)
    ctx.fill()

    // Fish body
    ctx.fillStyle = `rgba(${gr},${gg},${gb},0.7)`
    ctx.beginPath()
    ctx.ellipse(0, 0, sz, sz * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()

    // Tail
    ctx.beginPath()
    ctx.moveTo(-sz, 0)
    ctx.lineTo(-sz * 1.5, -sz * 0.4)
    ctx.lineTo(-sz * 1.5, sz * 0.4)
    ctx.closePath()
    ctx.fill()

    // Eye
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(sz * 0.5, -sz * 0.1, sz * 0.12, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const glowingFishCache = createEffectCache<GlowingFishSettings>({
  name: 'glowing-fish',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
