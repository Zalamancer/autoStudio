/**
 * Microlink screenshot CORS proxy.
 *
 * iad.microlink.io serves screenshots from a CDN that doesn't always send
 * Access-Control-Allow-Origin. The canvas-image-video-maker tool draws those
 * screenshots into a canvas it later exports via captureStream, which means a
 * CORS-tainted image breaks MP4 export entirely.
 *
 * Public proxies (corsproxy.io, allorigins) are unreliable - 403s, rate
 * limits, slow reroutes - so this proxy fetches the upstream image and pipes
 * it back through the local Express server with the right CORS headers.
 *
 * The URL allowlist (iad.microlink.io only) keeps this from being abused as a
 * generic open proxy. CORS middleware in server/index.ts already gates
 * requests by origin.
 */

import { Router, type Request, type Response } from 'express'
import logger from '../lib/logger'

const router = Router()

// Match the random-hash filenames Microlink generates on its CDN, optionally
// followed by a query string (cache busters etc.).
const ALLOWED_URL = /^https:\/\/iad\.microlink\.io\/[A-Za-z0-9_-]+\.(png|jpg|jpeg|webp)(\?.*)?$/

router.get('/', async (req: Request, res: Response) => {
  const target = String(req.query.url || '')
  if (!ALLOWED_URL.test(target)) {
    return res.status(400).json({
      error: 'Only iad.microlink.io image URLs are proxied.',
    })
  }
  try {
    const upstream = await fetch(target)
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Upstream HTTP ${upstream.status}`,
      })
    }
    const contentType = upstream.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(buffer)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.warn('[microlink-proxy] upstream fetch failed', { target, message })
    res.status(502).json({ error: 'Upstream fetch failed: ' + message })
  }
})

export default router
