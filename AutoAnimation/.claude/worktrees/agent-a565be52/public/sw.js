/**
 * ProAnimate Service Worker
 *
 * Provides offline caching for the application shell, static assets,
 * and cached API responses. Uses a cache-first strategy for static
 * assets and network-first for API calls.
 */

const CACHE_NAME = 'proanimate-v1'
const STATIC_CACHE = 'proanimate-static-v1'
const API_CACHE = 'proanimate-api-v1'

/** Static assets to pre-cache on install */
const PRECACHE_URLS = [
  '/',
  '/index.html',
]

/** URL patterns that should be cached */
const CACHEABLE_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/,
]

/** API patterns that can be cached for offline */
const CACHEABLE_API_PATTERNS = [
  /\/api\/health/,
]

// ── Install ──

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some URLs:', err)
      })
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// ── Activate ──

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => {
          return key !== CACHE_NAME && key !== STATIC_CACHE && key !== API_CACHE
        }).map((key) => caches.delete(key))
      )
    })
  )
  // Take control of all open tabs
  self.clients.claim()
})

// ── Fetch ──

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip WebSocket and chrome-extension URLs
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.protocol === 'chrome-extension:') return

  // API requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API_PATTERNS.some((p) => p.test(url.pathname))
    if (isCacheable) {
      event.respondWith(networkFirstWithCache(event.request, API_CACHE))
    }
    return
  }

  // Static assets: cache-first
  const isStaticAsset = CACHEABLE_PATTERNS.some((p) => p.test(url.pathname))
  if (isStaticAsset) {
    event.respondWith(cacheFirstWithNetwork(event.request, STATIC_CACHE))
    return
  }

  // HTML navigation: network-first (serve app shell offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(event.request, STATIC_CACHE))
    return
  }
})

// ── Strategies ──

/** Cache-first: return cached version, fall back to network */
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Return a basic offline response
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

/** Network-first: try network, fall back to cache */
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached

    // For navigation requests, return the cached index.html
    if (request.mode === 'navigate') {
      const indexCached = await caches.match('/index.html')
      if (indexCached) return indexCached
    }

    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
  }
}

// ── Background Sync ──

self.addEventListener('sync', (event) => {
  if (event.tag === 'proanimate-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Notify the client to trigger sync
  const clients = await self.clients.matchAll()
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_REQUESTED' })
  }
}

// ── Message handling ──

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data?.type === 'CACHE_URLS') {
    const urls = event.data.urls || []
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(urls).catch(() => {
          // Non-fatal: some URLs may not be cacheable
        })
      })
    )
  }
})
