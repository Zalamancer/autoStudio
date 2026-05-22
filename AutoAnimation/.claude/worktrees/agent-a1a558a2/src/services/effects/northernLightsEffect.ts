/**
 * Northern Lights effect: aurora borealis overlay with color waves.
 * Animated: cycles through seed variants per frame.
 */

import type { NorthernLightsSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: NorthernLightsSettings, seed?: number): string {
  return `northern-lights|${src}|${s.intensity}|${s.colorRange}|${s.waveSpeed}|${s.height}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function getAuroraColors(colorRange: string): string[] {
  switch (colorRange) {
    case 'green': return ['#00ff66', '#33ff99', '#00cc44', '#66ffaa']
    case 'purple': return ['#8844ff', '#aa66ff', '#6622cc', '#cc88ff']
    case 'multi': return ['#00ff66', '#44aaff', '#aa44ff', '#ff44aa', '#00ccff']
    default: return ['#00ff66', '#33ff99', '#00cc44']
  }
}

async function process(src: string, s: NorthernLightsSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 4813 + 47)
  const colors = getAuroraColors(s.colorRange)
  const auroraTop = h * (1 - s.height) * 0.3
  const auroraBottom = h * 0.6
  const phase = seed * s.waveSpeed * 2

  ctx.globalCompositeOperation = 'screen'

  // Draw multiple aurora curtains
  const curtainCount = 3 + Math.floor(rng() * 3)
  for (let c = 0; c < curtainCount; c++) {
    const color = colors[c % colors.length]
    const alpha = s.intensity * (0.1 + rng() * 0.15)
    const waveFreq = 2 + rng() * 4
    const waveAmp = 20 + rng() * 40 * s.height
    const yOffset = auroraTop + rng() * (auroraBottom - auroraTop) * 0.5

    ctx.beginPath()
    ctx.moveTo(0, yOffset)

    // Draw wavy aurora band
    for (let x = 0; x <= w; x += 2) {
      const nx = x / w
      const waveY = Math.sin(nx * waveFreq * Math.PI + phase + c * 1.5) * waveAmp
      const y = yOffset + waveY
      ctx.lineTo(x, y)
    }

    // Close the band shape downward
    for (let x = w; x >= 0; x -= 2) {
      const nx = x / w
      const waveY = Math.sin(nx * waveFreq * Math.PI + phase + c * 1.5 + 0.5) * waveAmp
      const y = yOffset + waveY + 30 + rng() * 20
      ctx.lineTo(x, y)
    }
    ctx.closePath()

    // Vertical gradient within the curtain
    const grad = ctx.createLinearGradient(0, yOffset - waveAmp, 0, yOffset + waveAmp + 50)
    grad.addColorStop(0, `rgba(0, 0, 0, 0)`)
    grad.addColorStop(0.3, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', ''))
    // Use hex parsing
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${alpha})`)
    grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`)
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = grad
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL('image/png')
}

export const northernLightsCache = createEffectCache<NorthernLightsSettings>({
  name: 'northern-lights',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
