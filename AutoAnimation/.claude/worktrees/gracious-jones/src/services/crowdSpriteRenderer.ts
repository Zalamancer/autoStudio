/**
 * Pre-renders character sprite variations for crowd rendering.
 *
 * Loads character body-part images, composites them at thumbnail size
 * onto offscreen canvases, and caches the results as ImageBitmap.
 * Each unique combination of sprite indices gets its own cached bitmap.
 */

import type { SavedCharacter, CharacterPartTab } from '@/stores/useSavedCharactersStore'

const SPRITE_SIZE = 80 // px — thumbnail size for crowd member rendering
const DRAW_ORDER: CharacterPartTab[] = ['body', 'pants', 'shoes', 'shirt', 'head', 'hair']

// Cache: characterId -> variantKey -> ImageBitmap
const spriteCache = new Map<string, Map<string, ImageBitmap>>()
// Image loading cache: url -> HTMLImageElement (loaded)
const imageCache = new Map<string, HTMLImageElement>()

/** Build a unique key from sprite selections */
export function variantKey(selections: Record<string, number>): string {
  return DRAW_ORDER.map((p) => `${p}:${selections[p] ?? 0}`).join('|')
}

/** Load an image URL, with caching. Handles data: and blob: URLs without CORS. */
function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    const img = new Image()
    // Only set crossOrigin for http/https URLs, not data: or blob:
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => {
      imageCache.set(url, img)
      resolve(img)
    }
    img.onerror = (err) => {
      console.warn('[CrowdSpriteRenderer] Failed to load image:', url.slice(0, 60), err)
      reject(err)
    }
    img.src = url
  })
}

/** Get or render a character variant bitmap */
export async function getCharacterSpriteBitmap(
  character: SavedCharacter,
  spriteSelections: Record<string, number>,
): Promise<ImageBitmap | null> {
  if (!character.bodyParts) {
    console.warn('[CrowdSpriteRenderer] Character has no bodyParts:', character.name)
    return null
  }

  const charCache = spriteCache.get(character.id) ?? new Map()
  spriteCache.set(character.id, charCache)

  const key = variantKey(spriteSelections)
  const cached = charCache.get(key)
  if (cached) return cached

  // Render the variant onto an offscreen canvas
  const canvas = document.createElement('canvas')
  canvas.width = SPRITE_SIZE
  canvas.height = SPRITE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  let anyPartDrawn = false

  // Load and draw each body part layer in draw order
  for (const part of DRAW_ORDER) {
    const urls = character.bodyParts[part]
    if (!urls || urls.length === 0) continue

    const idx = spriteSelections[part] ?? 0
    const url = urls[Math.min(idx, urls.length - 1)]
    if (!url) continue

    // Skip invisible parts
    const pt = character.partTransforms?.[part]
    if (pt && !pt.visible) continue

    try {
      const img = await loadImage(url)

      ctx.save()

      // Apply part transform if available (scale offsets to thumbnail size)
      if (pt) {
        const scaleRatio = SPRITE_SIZE / Math.max(img.naturalWidth, img.naturalHeight, 1)
        const tx = pt.x * scaleRatio
        const ty = pt.y * scaleRatio

        ctx.translate(SPRITE_SIZE / 2 + tx, SPRITE_SIZE / 2 + ty)
        ctx.rotate((pt.rotation * Math.PI) / 180)
        ctx.scale(pt.scaleX, pt.scaleY)
        ctx.translate(-SPRITE_SIZE / 2, -SPRITE_SIZE / 2)
      }

      ctx.drawImage(img, 0, 0, SPRITE_SIZE, SPRITE_SIZE)
      ctx.restore()
      anyPartDrawn = true
    } catch {
      // Skip failed loads — already warned in loadImage
    }
  }

  if (!anyPartDrawn) {
    console.warn('[CrowdSpriteRenderer] No parts rendered for variant:', key)
    return null
  }

  try {
    const bitmap = await createImageBitmap(canvas)
    charCache.set(key, bitmap)
    return bitmap
  } catch (err) {
    console.warn('[CrowdSpriteRenderer] createImageBitmap failed:', err)
    return null
  }
}

/** Pre-render all unique variants needed for a crowd group's members */
export async function preRenderCrowdSprites(
  character: SavedCharacter,
  memberSelections: Record<string, number>[],
): Promise<Map<string, ImageBitmap>> {
  const results = new Map<string, ImageBitmap>()

  // Deduplicate — only render each unique variant once
  const seen = new Set<string>()
  const uniqueSelections: Record<string, number>[] = []
  for (const sel of memberSelections) {
    const key = variantKey(sel)
    if (!seen.has(key)) {
      seen.add(key)
      uniqueSelections.push(sel)
    }
  }

  await Promise.all(
    uniqueSelections.map(async (sel) => {
      const bitmap = await getCharacterSpriteBitmap(character, sel)
      if (bitmap) results.set(variantKey(sel), bitmap)
    }),
  )

  return results
}

/** Clear cache for a specific character */
export function clearCharacterSpriteCache(characterId: string): void {
  const charCache = spriteCache.get(characterId)
  if (charCache) {
    for (const bitmap of charCache.values()) bitmap.close()
    spriteCache.delete(characterId)
  }
}

/** Clear all caches */
export function clearAllSpriteCaches(): void {
  for (const charCache of spriteCache.values()) {
    for (const bitmap of charCache.values()) bitmap.close()
  }
  spriteCache.clear()
  imageCache.clear()
}
