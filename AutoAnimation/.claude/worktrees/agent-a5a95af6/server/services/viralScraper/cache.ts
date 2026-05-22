/**
 * Simple TTL Map cache for viral scraper results.
 * Prevents redundant API calls and yt-dlp invocations.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor(private defaultTTLMs: number) {
    // Cleanup stale entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.purge(), 5 * 60_000)
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTLMs),
    })
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  get size(): number {
    return this.store.size
  }

  private purge(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) this.store.delete(key)
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Pre-configured caches
/** Discovery results: 10 minute TTL */
export const discoveryCache = new TTLCache<unknown>(10 * 60_000)
/** Video metadata: 30 minute TTL */
export const metadataCache = new TTLCache<unknown>(30 * 60_000)
/** Comments: 15 minute TTL */
export const commentsCache = new TTLCache<unknown>(15 * 60_000)
