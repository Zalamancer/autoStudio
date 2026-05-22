/**
 * Shared sprite resolution utility.
 * Resolves the display sprite URL for each character part given saved images,
 * selected sprite indices, and fallback to the first available image.
 *
 * Replaces the copy-pasted pattern:
 *   (selectedSprites.PART !== null ? images[selectedSprites.PART] : null) || images[0] || null
 */

/** The character body parts that have sprite images */
export type SpritePart = 'eye' | 'eyebrow' | 'hair' | 'body' | 'head' | 'shirt' | 'pants' | 'shoes'

const SPRITE_PARTS: SpritePart[] = ['eye', 'eyebrow', 'hair', 'body', 'head', 'shirt', 'pants', 'shoes']

/**
 * Resolve a single sprite part to a display URL.
 * Returns the selected sprite if valid, else the first available, else null.
 */
export function resolveSpritePart(
  images: string[],
  selectedIndex: number | null,
): string | null {
  if (selectedIndex !== null && images[selectedIndex]) {
    return images[selectedIndex]
  }
  return images[0] || null
}

/**
 * Resolve all character sprite parts to their display URLs.
 * Returns a Record mapping each part to a string URL or null.
 */
export function resolveAllSprites(
  savedImages: Record<SpritePart, string[]>,
  selectedSprites: Record<SpritePart, number | null>,
): Record<SpritePart, string | null> {
  const result = {} as Record<SpritePart, string | null>
  for (const part of SPRITE_PARTS) {
    result[part] = resolveSpritePart(
      savedImages[part] || [],
      selectedSprites[part] ?? null,
    )
  }
  return result
}
