import { Assets, Texture } from 'pixi.js'

/**
 * PixiTextureCache provides a shared texture cache for character sprites,
 * media images, and any other assets loaded into PixiJS.
 *
 * Features:
 * - Deduplicates texture loads (same URL → same texture)
 * - Tracks reference counts for safe disposal
 * - LRU eviction when max capacity is exceeded
 * - Handles data URIs and blob URLs
 */

interface CacheEntry {
  texture: Texture
  url: string
  refCount: number
  lastAccessed: number
}

const MAX_CACHE_SIZE = 256

class TextureCache {
  private cache = new Map<string, CacheEntry>()
  private loading = new Map<string, Promise<Texture>>()

  /**
   * Load a texture by URL. Returns a cached texture if available,
   * otherwise loads it asynchronously.
   */
  async load(url: string): Promise<Texture> {
    // Return cached texture if available
    const cached = this.cache.get(url)
    if (cached) {
      cached.lastAccessed = Date.now()
      cached.refCount++
      return cached.texture
    }

    // Return in-flight promise if already loading
    const pending = this.loading.get(url)
    if (pending) return pending

    // Start loading
    const promise = this.loadTexture(url)
    this.loading.set(url, promise)

    try {
      const texture = await promise
      this.cache.set(url, {
        texture,
        url,
        refCount: 1,
        lastAccessed: Date.now(),
      })

      // Evict old entries if over capacity
      this.evictIfNeeded()

      return texture
    } finally {
      this.loading.delete(url)
    }
  }

  /**
   * Get a texture synchronously (null if not cached).
   */
  get(url: string): Texture | null {
    const entry = this.cache.get(url)
    if (entry) {
      entry.lastAccessed = Date.now()
      return entry.texture
    }
    return null
  }

  /**
   * Check if a texture is in the cache.
   */
  has(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * Release a reference to a texture. When refCount hits 0,
   * the texture becomes eligible for eviction.
   */
  release(url: string) {
    const entry = this.cache.get(url)
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1)
    }
  }

  /**
   * Remove a specific texture from the cache.
   */
  remove(url: string) {
    const entry = this.cache.get(url)
    if (entry) {
      this.cache.delete(url)
      // Don't destroy Assets-managed textures — they're shared
    }
  }

  /**
   * Clear the entire cache.
   */
  clear() {
    this.cache.clear()
    this.loading.clear()
  }

  get size(): number {
    return this.cache.size
  }

  private async loadTexture(url: string): Promise<Texture> {
    try {
      // For data URIs and blob URLs, use Assets.load
      const texture = await Assets.load<Texture>({
        src: url,
        loadParser: 'loadTextures',
      })
      return texture
    } catch {
      // Fallback: try loading as a simple URL
      try {
        return await Assets.load<Texture>(url)
      } catch (err) {
        console.warn(`[PixiTextureCache] Failed to load: ${url.slice(0, 100)}...`, err)
        return Texture.EMPTY
      }
    }
  }

  private evictIfNeeded() {
    if (this.cache.size <= MAX_CACHE_SIZE) return

    // Evict LRU entries with refCount === 0
    const entries = Array.from(this.cache.entries())
      .filter(([, e]) => e.refCount === 0)
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

    const toEvict = this.cache.size - MAX_CACHE_SIZE
    for (let i = 0; i < Math.min(toEvict, entries.length); i++) {
      this.cache.delete(entries[i][0])
    }
  }
}

/** Singleton texture cache instance */
export const pixiTextureCache = new TextureCache()
