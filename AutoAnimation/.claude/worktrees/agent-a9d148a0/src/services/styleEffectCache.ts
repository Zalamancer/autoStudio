/**
 * Generic LRU cache factory for Canvas 2D style effects.
 *
 * Extracts the proven LRU + inflight-dedup + sync-lookup + batch-precache
 * pattern from pixelArtEffect.ts into a reusable factory. Each effect
 * creates its own cache instance via createEffectCache().
 */

// ---------------------------------------------------------------------------
// Shared image loader (avoids per-module duplication)
// ---------------------------------------------------------------------------

const imgCache = new Map<string, HTMLImageElement>()

export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imgCache.get(src)
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached)
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgCache.set(src, img)
      if (imgCache.size > 500) {
        const iter = imgCache.keys()
        imgCache.delete(iter.next().value!)
      }
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}`))
    img.src = src
  })
}

// ---------------------------------------------------------------------------
// Cache factory
// ---------------------------------------------------------------------------

export interface EffectCacheConfig<T> {
  /** Debug name for the cache */
  name: string
  /** Max LRU entries */
  maxEntries: number
  /** Build cache key from src + settings + optional seed */
  cacheKeyFn: (src: string, settings: T, seed?: number) => string
  /** Async processor: src + settings + seed → data URL */
  processFn: (src: string, settings: T, seed?: number) => Promise<string>
  /** Optional synchronous canvas overlay (for rigged mode) */
  overlayFn?: (source: HTMLCanvasElement, output: HTMLCanvasElement, settings: T, seed?: number) => boolean
}

export interface EffectCache<T> {
  /** Synchronous cache lookup — returns null on miss */
  getFromCache: (src: string, settings: T, seed?: number) => string | null
  /** Async process + cache a single source */
  processAsync: (src: string, settings: T, seed?: number) => Promise<string>
  /** Batch pre-cache (fire-and-forget) */
  preCacheBatch: (sources: string[], settings: T, seeds?: number[]) => Promise<void>
  /** Clear all entries */
  clear: () => void
  /** Canvas overlay for rigged mode (if overlayFn was provided) */
  processOverlay?: (source: HTMLCanvasElement, output: HTMLCanvasElement, settings: T, seed?: number) => boolean
}

export function createEffectCache<T>(config: EffectCacheConfig<T>): EffectCache<T> {
  const cache = new Map<string, { dataUrl: string; lastUsed: number }>()
  const inflight = new Map<string, Promise<string>>()

  function evictIfNeeded() {
    if (cache.size <= config.maxEntries) return
    let oldest = Infinity
    let oldestKey = ''
    for (const [k, v] of cache) {
      if (v.lastUsed < oldest) {
        oldest = v.lastUsed
        oldestKey = k
      }
    }
    if (oldestKey) cache.delete(oldestKey)
  }

  function getFromCache(src: string, settings: T, seed?: number): string | null {
    const key = config.cacheKeyFn(src, settings, seed)
    const entry = cache.get(key)
    if (entry) {
      entry.lastUsed = performance.now()
      return entry.dataUrl
    }
    return null
  }

  async function processAsync(src: string, settings: T, seed?: number): Promise<string> {
    const key = config.cacheKeyFn(src, settings, seed)
    const cached = cache.get(key)
    if (cached) {
      cached.lastUsed = performance.now()
      return cached.dataUrl
    }
    const existing = inflight.get(key)
    if (existing) return existing

    const promise = config.processFn(src, settings, seed).then((dataUrl) => {
      evictIfNeeded()
      cache.set(key, { dataUrl, lastUsed: performance.now() })
      inflight.delete(key)
      return dataUrl
    }).catch((err) => {
      inflight.delete(key)
      throw err
    })

    inflight.set(key, promise)
    return promise
  }

  async function preCacheBatch(sources: string[], settings: T, seeds?: number[]): Promise<void> {
    const tasks: Promise<string>[] = []
    for (const src of sources.filter(Boolean)) {
      if (seeds && seeds.length > 0) {
        for (const seed of seeds) {
          tasks.push(processAsync(src, settings, seed))
        }
      } else {
        tasks.push(processAsync(src, settings))
      }
    }
    await Promise.allSettled(tasks)
  }

  function clear() {
    cache.clear()
    inflight.clear()
  }

  const result: EffectCache<T> = { getFromCache, processAsync, preCacheBatch, clear }

  if (config.overlayFn) {
    result.processOverlay = config.overlayFn
  }

  return result
}
