/**
 * Emoji Rain effect: falling emoji characters.
 * Animated: 8 seed variants cycled per frame.
 */

import type { EmojiRainSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: EmojiRainSettings, seed?: number): string {
  return `emoji-rain|${src}|${s.density}|${s.emojiSet}|${s.size}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const EMOJI_SETS: Record<string, string[]> = {
  hearts: ['❤️', '💕', '💖', '💗', '💓', '💝', '💘'],
  fire: ['🔥', '💥', '⚡', '✨', '💫', '🌟', '☄️'],
  stars: ['⭐', '🌟', '✨', '💫', '🌠', '⭐', '🔆'],
  random: ['😂', '🎉', '🔥', '❤️', '⭐', '💯', '🙌', '✨', '🎊', '👏'],
}

async function process(src: string, s: EmojiRainSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 4421 + 17)
  const emojis = EMOJI_SETS[s.emojiSet] || EMOJI_SETS.random
  const count = Math.floor(s.density * 40) + 5
  const fontSize = s.size * 8

  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < count; i++) {
    const ex = rng() * w
    const ey = (rng() * (h + fontSize) + seed * s.speed * 40) % (h + fontSize) - fontSize * 0.5
    const emoji = emojis[Math.floor(rng() * emojis.length)]
    const rot = (rng() - 0.5) * 0.5

    ctx.save()
    ctx.translate(ex, ey)
    ctx.rotate(rot)
    ctx.globalAlpha = 0.7 + rng() * 0.3
    ctx.fillText(emoji, 0, 0)
    ctx.restore()
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const emojiRainCache = createEffectCache<EmojiRainSettings>({
  name: 'emoji-rain',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
