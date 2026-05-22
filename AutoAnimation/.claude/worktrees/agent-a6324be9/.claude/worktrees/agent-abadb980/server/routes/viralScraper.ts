/**
 * Viral Scraper API routes.
 *
 * Endpoints:
 *   POST   /discover              — Search trending videos across platforms
 *   GET    /video-info            — Get metadata for a single video URL
 *   POST   /video-info/batch      — Get metadata for up to 20 URLs
 *   GET    /comments              — Get comments for a video
 *   POST   /download              — Queue a video download
 *   GET    /download/:jobId       — Check download status
 *   GET    /download/:jobId/file  — Stream downloaded file
 *   DELETE /download/:jobId       — Cancel + cleanup
 *   GET    /health                — Check yt-dlp availability
 */

import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import { validate } from '../middleware/validate'
import {
  viralDiscoverBody,
  viralVideoInfoQuery,
  viralBatchVideoInfoBody,
  viralCommentsQuery,
  viralDownloadBody,
} from '../schemas'
import {
  isAvailable,
  getVersion,
  getVideoInfo,
  getComments,
} from '../services/viralScraper/ytdlpRunner'
import { normalizeVideo, normalizeComments } from '../services/viralScraper/normalizer'
import { discoverYouTube } from '../services/viralScraper/youtubeDiscovery'
import { discoverGemini } from '../services/viralScraper/geminiDiscovery'
import {
  queueDownload,
  getDownloadJob,
  cancelDownload,
} from '../services/viralScraper/downloadQueue'
import {
  discoveryCache,
  metadataCache,
  commentsCache,
} from '../services/viralScraper/cache'
import type { NormalizedVideo } from '../services/viralScraper/types'

const router = Router()

// ── Rate limiters ──

const discoverLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  message: { error: 'Too many discovery requests, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})

const downloadLimiter = rateLimit({
  windowMs: 60_000,
  max: 3,
  message: { error: 'Too many download requests, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})

const infoLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: { error: 'Too many info requests, try again in a minute' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
})

// ── GET /health ──

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const available = await isAvailable()
    if (!available) {
      res.status(503).json({
        status: 'unavailable',
        error: 'yt-dlp binary not found. Install via: brew install yt-dlp',
      })
      return
    }
    const version = await getVersion()
    res.json({ status: 'ok', ytdlp: version })
  } catch (err) {
    res.status(503).json({
      status: 'error',
      error: err instanceof Error ? err.message : 'yt-dlp check failed',
    })
  }
})

// ── POST /discover ──

router.post('/discover', discoverLimiter, validate({ body: viralDiscoverBody }), async (req: Request, res: Response) => {
  try {
    const { keywords, platforms, industry, niche, maxResults } = req.body
    const cacheKey = JSON.stringify({ keywords, platforms, industry, niche })

    // Check cache
    const cached = discoveryCache.get(cacheKey)
    if (cached) {
      res.json(cached)
      return
    }

    const enabledPlatforms = platforms || ['youtube', 'tiktok', 'instagram']
    const allVideos: NormalizedVideo[] = []
    let summary: string | undefined
    let trendItems: Array<{ title: string; description: string; category: string }> = []

    // Run discovery sources in parallel
    const results = await Promise.allSettled([
      // YouTube Data API (if platform enabled)
      enabledPlatforms.includes('youtube')
        ? discoverYouTube(keywords, maxResults || 15)
        : Promise.resolve([]),

      // Gemini + Google Search (for TikTok/Instagram)
      enabledPlatforms.some((p: string) => p === 'tiktok' || p === 'instagram')
        ? discoverGemini(keywords, industry || '', niche || '')
        : Promise.resolve({ videos: [], summary: '', trendItems: [] }),
    ])

    // Collect YouTube results
    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
      allVideos.push(...results[0].value)
    } else if (results[0].status === 'rejected') {
      console.warn('[ViralScraper] YouTube discovery failed:', results[0].reason)
    }

    // Collect Gemini results
    if (results[1].status === 'fulfilled') {
      const gemini = results[1].value as { videos: NormalizedVideo[]; summary: string; trendItems: typeof trendItems }
      allVideos.push(...gemini.videos)
      summary = gemini.summary
      trendItems = gemini.trendItems
    } else if (results[1].status === 'rejected') {
      console.warn('[ViralScraper] Gemini discovery failed:', results[1].reason)
    }

    // Sort by views
    allVideos.sort((a, b) => b.stats.views - a.stats.views)

    const response = {
      videos: allVideos,
      trendItems,
      summary,
      keywords,
      fetchedAt: new Date().toISOString(),
    }

    // Cache result
    discoveryCache.set(cacheKey, response)

    console.log(`[ViralScraper] Discover: ${allVideos.length} videos, ${trendItems.length} trend items`)
    res.json(response)
  } catch (err) {
    console.error('[ViralScraper] discover error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Discovery failed' })
  }
})

// ── GET /video-info ──

router.get('/video-info', infoLimiter, validate({ query: viralVideoInfoQuery }), async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string

    // Check cache
    const cached = metadataCache.get(url)
    if (cached) {
      res.json(cached)
      return
    }

    const meta = await getVideoInfo(url)
    const video = normalizeVideo(meta)

    metadataCache.set(url, video)
    res.json(video)
  } catch (err) {
    console.error('[ViralScraper] video-info error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get video info' })
  }
})

// ── POST /video-info/batch ──

router.post('/video-info/batch', infoLimiter, validate({ body: viralBatchVideoInfoBody }), async (req: Request, res: Response) => {
  try {
    const { urls } = req.body as { urls: string[] }

    const results = await Promise.allSettled(
      urls.map(async (url: string) => {
        // Check cache first
        const cached = metadataCache.get(url) as NormalizedVideo | undefined
        if (cached) return cached

        const meta = await getVideoInfo(url)
        const video = normalizeVideo(meta)
        metadataCache.set(url, video)
        return video
      }),
    )

    const videos: Array<NormalizedVideo | null> = results.map((r) =>
      r.status === 'fulfilled' ? r.value : null,
    )

    const errors: Array<{ url: string; error: string }> = results
      .map((r, i) => r.status === 'rejected' ? { url: urls[i], error: String(r.reason) } : null)
      .filter((e): e is NonNullable<typeof e> => e !== null)

    res.json({ videos, errors })
  } catch (err) {
    console.error('[ViralScraper] batch video-info error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Batch info failed' })
  }
})

// ── GET /comments ──

router.get('/comments', infoLimiter, validate({ query: viralCommentsQuery }), async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string
    const max = parseInt(req.query.max as string || '100')

    const cacheKey = `${url}:${max}`
    const cached = commentsCache.get(cacheKey)
    if (cached) {
      res.json(cached)
      return
    }

    const rawComments = await getComments(url, max)
    const comments = normalizeComments(rawComments)

    const response = { comments, count: comments.length, url }
    commentsCache.set(cacheKey, response)

    res.json(response)
  } catch (err) {
    console.error('[ViralScraper] comments error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get comments' })
  }
})

// ── POST /download ──

router.post('/download', downloadLimiter, validate({ body: viralDownloadBody }), async (req: Request, res: Response) => {
  try {
    const { url, platform } = req.body

    // Verify yt-dlp is available
    const available = await isAvailable()
    if (!available) {
      res.status(503).json({ error: 'yt-dlp not installed on server' })
      return
    }

    const job = queueDownload(url, platform || 'unknown')

    res.status(202).json({
      jobId: job.id,
      status: job.status,
      message: 'Download queued',
    })
  } catch (err) {
    console.error('[ViralScraper] download error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Download queue failed' })
  }
})

// ── GET /download/:jobId ──

router.get('/download/:jobId', (req: Request, res: Response) => {
  const job = getDownloadJob(req.params.jobId)
  if (!job) {
    res.status(404).json({ error: 'Download job not found' })
    return
  }

  res.json({
    jobId: job.id,
    status: job.status,
    platform: job.platform,
    fileName: job.fileName,
    error: job.error,
  })
})

// ── GET /download/:jobId/file ──

router.get('/download/:jobId/file', (req: Request, res: Response) => {
  const job = getDownloadJob(req.params.jobId)
  if (!job) {
    res.status(404).json({ error: 'Download job not found' })
    return
  }

  if (job.status !== 'completed' || !job.localPath) {
    res.status(400).json({ error: `Job status: ${job.status}`, status: job.status })
    return
  }

  if (!fs.existsSync(job.localPath)) {
    res.status(410).json({ error: 'File has been cleaned up' })
    return
  }

  const ext = path.extname(job.localPath)
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.mov': 'video/quicktime',
  }

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${job.fileName || 'video' + ext}"`)
  res.sendFile(job.localPath)
})

// ── DELETE /download/:jobId ──

router.delete('/download/:jobId', (req: Request, res: Response) => {
  const removed = cancelDownload(req.params.jobId)
  if (!removed) {
    res.status(404).json({ error: 'Download job not found' })
    return
  }
  res.json({ success: true })
})

export default router
