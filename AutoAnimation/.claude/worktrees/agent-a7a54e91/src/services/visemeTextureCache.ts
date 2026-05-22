/**
 * GPU texture cache for 3D viseme sprites.
 * Converts data-URL strings → THREE.Texture objects with LRU-style caching
 * so the same sprite is never loaded twice per session.
 */
import * as THREE from 'three'

const cache = new Map<string, THREE.Texture>()

/** Load or return a cached THREE.Texture from a data-URL string. */
export function getVisemeTexture(dataUrl: string): THREE.Texture {
  const existing = cache.get(dataUrl)
  if (existing) return existing

  const img = new Image()
  img.src = dataUrl

  const texture = new THREE.Texture(img)
  texture.colorSpace = THREE.SRGBColorSpace
  // Pixel-crisp rendering for sprite art
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  // Flip to match standard image orientation
  texture.flipY = true

  img.onload = () => {
    texture.needsUpdate = true
  }

  // If the image is already cached by the browser, mark ready immediately
  if (img.complete && img.naturalWidth > 0) {
    texture.needsUpdate = true
  }

  cache.set(dataUrl, texture)
  return texture
}

/** Pre-load all sprites in a map so textures are GPU-ready before playback. */
export function preloadVisemeSprites(
  spriteMap: Record<string, string | null> | null
): void {
  if (!spriteMap) return
  for (const dataUrl of Object.values(spriteMap)) {
    if (dataUrl) getVisemeTexture(dataUrl)
  }
}

/** Pre-load all expression sprites (eye + eyebrow) so textures are GPU-ready before playback. */
export function preloadExpressionSprites(
  eyeSprites: Record<string, string | null> | null,
  eyebrowSprites: Record<string, string | null> | null
): void {
  preloadVisemeSprites(eyeSprites)
  preloadVisemeSprites(eyebrowSprites)
}

/** Dispose all cached textures and free GPU memory. */
export function disposeVisemeTextureCache(): void {
  for (const texture of cache.values()) {
    texture.dispose()
  }
  cache.clear()
}
