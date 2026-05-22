import type { CrownSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: CrownSettings, seed?: number): string {
  return `crown|${src}|${s.style}|${s.size}|${s.color}|${s.glow}|s${seed ?? 0}`
}

async function process(src: string, s: CrownSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const cc = parseInt(s.color.replace('#', ''), 16)
  const cr = (cc >> 16) & 255, cg = (cc >> 8) & 255, cb = cc & 255
  const sz = s.size * w * 0.4
  const cx = w * 0.5
  const cy = h * 0.08

  ctx.save()

  // Glow effect
  if (s.glow > 0) {
    const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sz)
    glowGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${s.glow * 0.4})`)
    glowGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    ctx.fillStyle = glowGrad
    ctx.beginPath()
    ctx.arc(cx, cy, sz, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = `rgb(${cr},${cg},${cb})`
  ctx.strokeStyle = `rgb(${Math.max(0, cr - 40)},${Math.max(0, cg - 40)},${Math.max(0, cb - 40)})`
  ctx.lineWidth = 2

  switch (s.style) {
    case 'royal': {
      const baseY = cy + sz * 0.2
      const peakH = sz * 0.5
      const halfW = sz * 0.5
      const points = 5
      ctx.beginPath()
      ctx.moveTo(cx - halfW, baseY)
      for (let i = 0; i < points; i++) {
        const px = cx - halfW + (i + 0.5) * (halfW * 2 / points)
        ctx.lineTo(px, baseY - peakH)
        ctx.lineTo(cx - halfW + (i + 1) * (halfW * 2 / points), baseY)
      }
      ctx.lineTo(cx + halfW, baseY + sz * 0.15)
      ctx.lineTo(cx - halfW, baseY + sz * 0.15)
      ctx.closePath()
      ctx.fill(); ctx.stroke()
      // Jewels
      ctx.fillStyle = '#ff0000'
      for (let i = 0; i < points; i++) {
        const px = cx - halfW + (i + 0.5) * (halfW * 2 / points)
        ctx.beginPath(); ctx.arc(px, baseY - peakH + 5, 3, 0, Math.PI * 2); ctx.fill()
      }
      break
    }
    case 'laurel': {
      const leafCount = 8
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < leafCount; i++) {
          const angle = (i / leafCount) * Math.PI * 0.6 + Math.PI * 0.2
          const lx = cx + side * Math.cos(angle) * sz * 0.4
          const ly = cy - Math.sin(angle) * sz * 0.4 + sz * 0.3
          ctx.save()
          ctx.translate(lx, ly)
          ctx.rotate(side * angle - Math.PI * 0.5)
          ctx.fillStyle = `rgb(${cr},${cg},${cb})`
          ctx.beginPath()
          ctx.ellipse(0, 0, sz * 0.08, sz * 0.03, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
      break
    }
    case 'tiara': {
      const baseY = cy + sz * 0.1
      ctx.beginPath()
      ctx.arc(cx, baseY, sz * 0.4, Math.PI, 0)
      ctx.lineWidth = 3
      ctx.stroke()
      // Central gem
      ctx.fillStyle = '#00ccff'
      ctx.beginPath(); ctx.arc(cx, baseY - sz * 0.38, 4, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'halo': {
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = `rgb(${cr},${cg},${cb})`
      ctx.lineWidth = sz * 0.06
      ctx.beginPath()
      ctx.ellipse(cx, cy, sz * 0.4, sz * 0.1, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 0.2
      ctx.fillStyle = `rgb(${cr},${cg},${cb})`
      ctx.beginPath()
      ctx.ellipse(cx, cy, sz * 0.42, sz * 0.12, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }

  ctx.restore()
  return canvas.toDataURL('image/png')
}

export const crownCache = createEffectCache<CrownSettings>({
  name: 'crown',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
