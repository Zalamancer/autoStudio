/**
 * Competitor Video Scraper Routes — Scrape social media videos, extract transcripts,
 * and provide AI-powered content analysis.
 *
 * Reuses shared viralScraper infrastructure for yt-dlp operations and normalization.
 *
 * Endpoints:
 *   POST /scrape-url       — Single video URL → metadata + transcript + analysis
 *   POST /scrape-username   — Username/profile → recent videos
 *   POST /scrape-keyword    — Keyword/hashtag search across platforms
 *   POST /transcribe        — On-demand transcript for a scraped video
 *   POST /analyze           — AI analysis of video content via Gemini
 */

import { Router, type Request, type Response } from 'express'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getVideoInfo, extractSubtitles, downloadAudio } from '../services/viralScraper/ytdlpRunner'
import { normalizeVideo } from '../services/viralScraper/normalizer'
import type { NormalizedVideo } from '../services/viralScraper/types'
import { runApifyActor, getApifyToken } from '../services/apifyRunner'

const router = Router()

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

// ── Helpers ──

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || null
}

/** Flatten NormalizedVideo (nested media/metadata) into the flat shape the frontend expects */
function flattenVideo(v: NormalizedVideo) {
  return {
    id: v.id,
    platform: v.platform,
    url: v.url,
    title: v.title,
    description: v.description,
    author: v.author,
    stats: v.stats,
    thumbnailUrl: v.media.thumbnailUrl,
    duration: v.media.duration,
    publishedAt: v.metadata.publishedAt,
    hashtags: v.metadata.hashtags,
    fetchedAt: v.fetchedAt,
  }
}

/** Audio download + Whisper transcription fallback */
async function transcribeViaAudio(url: string, serverOrigin: string): Promise<{ text: string; source: string } | null> {
  const tmpDir = path.join(os.tmpdir(), `cs-audio-${Date.now()}`)

  try {
    const audioPath = await downloadAudio(url, tmpDir)
    if (!audioPath) return null

    const audioBuffer = fs.readFileSync(audioPath)
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
    formData.append('audio', blob, 'audio.mp3')

    const whisperUrl = `${serverOrigin}/api/whisper/transcribe`
    const res = await fetch(whisperUrl, { method: 'POST', body: formData })

    if (!res.ok) return null

    const result = (await res.json()) as { text?: string; words?: Array<{ word: string; start: number; end: number }> }
    if (result.text && result.text.trim().length > 10) {
      return { text: result.text, source: 'whisper' }
    }
  } catch {
    // Audio transcription failed
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  return null
}

// ── AI Analysis via Gemini ──

async function analyzeVideoContent(video: { title: string; description: string; transcript?: string; stats: { views: number; likes: number; comments: number } }): Promise<{
  hookScore: number
  contentStructure: string
  engagementInsights: string[]
  keyTakeaways: string[]
  replicationPrompt: string
}> {
  const apiKey = getGeminiKey()
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const prompt = `Analyze this social media video for content strategy insights. Return JSON only.

Title: ${video.title}
Description: ${video.description?.slice(0, 500) || 'N/A'}
Views: ${video.stats.views}, Likes: ${video.stats.likes}, Comments: ${video.stats.comments}
${video.transcript ? `Transcript (first 2000 chars): ${video.transcript.slice(0, 2000)}` : 'No transcript available.'}

Return this exact JSON structure:
{
  "hookScore": <number 0-100, how strong is the opening hook>,
  "contentStructure": "<describe the video structure: hook, body, CTA pattern>",
  "engagementInsights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "keyTakeaways": ["<takeaway 1>", "<takeaway 2>", "<takeaway 3>"],
  "replicationPrompt": "<a complete prompt to create a similar animated video with ProAnimate, include topic, style, tone, and structure>"
}`

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const parts: Array<{ text?: string; thought?: boolean }> =
    data?.candidates?.[0]?.content?.parts || []
  const textPart = [...parts].reverse().find((p) => p.text && !p.thought)
  const text = textPart?.text || '{}'

  try {
    const parsed = JSON.parse(text)
    return {
      hookScore: typeof parsed.hookScore === 'number' ? parsed.hookScore : 50,
      contentStructure: parsed.contentStructure || 'Unknown structure',
      engagementInsights: Array.isArray(parsed.engagementInsights) ? parsed.engagementInsights : [],
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      replicationPrompt: parsed.replicationPrompt || '',
    }
  } catch {
    return {
      hookScore: 50,
      contentStructure: 'Could not parse analysis',
      engagementInsights: [],
      keyTakeaways: [],
      replicationPrompt: '',
    }
  }
}

// ── Apify normalizers (Apify data shape differs from yt-dlp) ──

function normalizeTikTokItem(item: Record<string, unknown>) {
  return {
    id: `tiktok:${item.id || ''}`,
    platform: 'tiktok' as const,
    url: (item.webVideoUrl as string) || (item.url as string) || '',
    title: (item.text as string) || '',
    description: (item.text as string) || '',
    author: {
      username: (item.authorMeta as Record<string, unknown>)?.name as string || 'unknown',
      displayName: (item.authorMeta as Record<string, unknown>)?.nickName as string || 'Unknown',
      followerCount: (item.authorMeta as Record<string, unknown>)?.fans as number | undefined,
    },
    stats: {
      views: (item.playCount as number) ?? 0,
      likes: (item.diggCount as number) ?? 0,
      comments: (item.commentCount as number) ?? 0,
      shares: (item.shareCount as number) ?? 0,
    },
    thumbnailUrl: (item.covers as string[])?.length ? (item.covers as string[])[0] : '',
    duration: (item.videoMeta as Record<string, unknown>)?.duration as number ?? 0,
    publishedAt: (item.createTimeISO as string) || new Date().toISOString(),
    hashtags: Array.isArray(item.hashtags)
      ? (item.hashtags as Array<{ name?: string }>).map((h) => h.name || '').filter(Boolean)
      : [],
    fetchedAt: new Date().toISOString(),
  }
}

function normalizeYouTubeItem(item: Record<string, unknown>) {
  return {
    id: `youtube:${item.id || ''}`,
    platform: 'youtube' as const,
    url: (item.url as string) || '',
    title: (item.title as string) || '',
    description: (item.description as string) || '',
    author: {
      username: (item.channelName as string) || 'unknown',
      displayName: (item.channelName as string) || 'Unknown',
      followerCount: (item.channelFollowerCount as number) ?? undefined,
    },
    stats: {
      views: (item.viewCount as number) ?? 0,
      likes: (item.likeCount as number) ?? 0,
      comments: (item.commentCount as number) ?? 0,
      shares: 0,
    },
    thumbnailUrl: (item.thumbnailUrl as string) || '',
    duration: (item.duration as number) ?? 0,
    publishedAt: (item.date as string) || new Date().toISOString(),
    hashtags: Array.isArray(item.hashtags) ? (item.hashtags as string[]) : [],
    fetchedAt: new Date().toISOString(),
  }
}

function normalizeInstagramItem(item: Record<string, unknown>) {
  return {
    id: `instagram:${item.id || item.shortCode || ''}`,
    platform: 'instagram' as const,
    url: (item.url as string) || `https://www.instagram.com/reel/${item.shortCode || ''}/`,
    title: ((item.caption as string) || '').slice(0, 100),
    description: (item.caption as string) || '',
    author: {
      username: (item.ownerUsername as string) || 'unknown',
      displayName: (item.ownerFullName as string) || 'Unknown',
    },
    stats: {
      views: (item.videoViewCount as number) ?? (item.playCount as number) ?? 0,
      likes: (item.likesCount as number) ?? 0,
      comments: (item.commentsCount as number) ?? 0,
      shares: 0,
    },
    thumbnailUrl: (item.displayUrl as string) || '',
    duration: (item.videoDuration as number) ?? 0,
    publishedAt: (item.timestamp as string) || new Date().toISOString(),
    hashtags: ((item.caption as string) || '').match(/#\w+/g) || [],
    fetchedAt: new Date().toISOString(),
  }
}

// ── Routes ──

/**
 * POST /scrape-url — Single video URL → metadata + transcript + analysis
 */
router.post('/scrape-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as { url?: string }
    if (!url) {
      res.status(400).json({ error: 'Missing required field: url' })
      return
    }

    // Get metadata via shared yt-dlp runner + normalizer
    console.log(`[CompetitorScraper] Fetching metadata: ${url}`)
    const meta = await getVideoInfo(url)
    const normalized = normalizeVideo(meta)
    const video = flattenVideo(normalized)

    // Try subtitle extraction via shared yt-dlp runner
    console.log(`[CompetitorScraper] Extracting subtitles...`)
    const subs = await extractSubtitles(url)

    const result = {
      ...video,
      transcript: subs ? { text: subs.text, source: subs.source, language: 'en' } : undefined,
    }

    res.json(result)
  } catch (err) {
    console.error('[CompetitorScraper] scrape-url error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to scrape URL' })
  }
})

/**
 * POST /scrape-username — Username/profile → recent videos via Apify
 */
router.post('/scrape-username', async (req: Request, res: Response) => {
  try {
    const { username, platform, maxResults = 20 } = req.body as {
      username?: string
      platform?: string
      maxResults?: number
    }

    if (!username) {
      res.status(400).json({ error: 'Missing required field: username' })
      return
    }

    const apifyToken = getApifyToken()
    if (!apifyToken) {
      res.status(503).json({ error: 'APIFY_TOKEN not configured' })
      return
    }

    const targetPlatform = platform || 'tiktok'
    console.log(`[CompetitorScraper] Scraping ${targetPlatform} profile: @${username}`)

    let items: unknown[]

    if (targetPlatform === 'tiktok') {
      items = await runApifyActor(apifyToken, 'clockworks~free-tiktok-scraper', {
        profiles: [username],
        resultsPerPage: Math.min(maxResults, 50),
        shouldDownloadCovers: false,
        shouldDownloadVideos: false,
      })
    } else if (targetPlatform === 'youtube') {
      items = await runApifyActor(apifyToken, 'streamers~youtube-scraper', {
        searchKeywords: `@${username}`,
        maxResults: Math.min(maxResults, 50),
        type: 'video',
      })
    } else if (targetPlatform === 'instagram') {
      items = await runApifyActor(apifyToken, 'apify~instagram-scraper', {
        usernames: [username],
        resultsLimit: Math.min(maxResults, 50),
        resultsType: 'posts',
      })
    } else {
      res.status(400).json({ error: `Unsupported platform: ${targetPlatform}` })
      return
    }

    const videos = items.map((item) => {
      const record = item as Record<string, unknown>
      if (targetPlatform === 'tiktok') return normalizeTikTokItem(record)
      if (targetPlatform === 'youtube') return normalizeYouTubeItem(record)
      return normalizeInstagramItem(record)
    })

    res.json({ videos, count: videos.length })
  } catch (err) {
    console.error('[CompetitorScraper] scrape-username error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to scrape username' })
  }
})

/**
 * POST /scrape-keyword — Keyword/hashtag search across platforms
 */
router.post('/scrape-keyword', async (req: Request, res: Response) => {
  try {
    const { keyword, platforms = ['tiktok', 'youtube'], maxResults = 20 } = req.body as {
      keyword?: string
      platforms?: string[]
      maxResults?: number
    }

    if (!keyword) {
      res.status(400).json({ error: 'Missing required field: keyword' })
      return
    }

    const apifyToken = getApifyToken()
    if (!apifyToken) {
      res.status(503).json({ error: 'APIFY_TOKEN not configured' })
      return
    }

    console.log(`[CompetitorScraper] Keyword search: "${keyword}" on ${platforms.join(', ')}`)

    const scrapers = platforms.map(async (platform) => {
      try {
        let items: unknown[]

        if (platform === 'tiktok') {
          items = await runApifyActor(apifyToken, 'clockworks~free-tiktok-scraper', {
            hashtags: [keyword.replace(/^#/, '')],
            resultsPerPage: Math.min(maxResults, 30),
            shouldDownloadCovers: false,
            shouldDownloadVideos: false,
          })
          return items.map((i) => normalizeTikTokItem(i as Record<string, unknown>))
        }

        if (platform === 'youtube') {
          items = await runApifyActor(apifyToken, 'streamers~youtube-scraper', {
            searchKeywords: keyword,
            maxResults: Math.min(maxResults, 30),
            type: 'video',
          })
          return items.map((i) => normalizeYouTubeItem(i as Record<string, unknown>))
        }

        if (platform === 'instagram') {
          items = await runApifyActor(apifyToken, 'apify~instagram-scraper', {
            hashtags: [keyword.replace(/^#/, '')],
            resultsLimit: Math.min(maxResults, 30),
            resultsType: 'posts',
          })
          return items.map((i) => normalizeInstagramItem(i as Record<string, unknown>))
        }

        return []
      } catch (err) {
        console.error(`[CompetitorScraper] ${platform} keyword scrape failed:`, err)
        return []
      }
    })

    const results = await Promise.all(scrapers)
    const videos = results.flat()

    res.json({ videos, count: videos.length })
  } catch (err) {
    console.error('[CompetitorScraper] scrape-keyword error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to search keyword' })
  }
})

/**
 * POST /transcribe — On-demand transcript for a scraped video
 */
router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as { url?: string }
    if (!url) {
      res.status(400).json({ error: 'Missing required field: url' })
      return
    }

    console.log(`[CompetitorScraper] Transcribing: ${url}`)

    // Try subtitles first via shared yt-dlp runner
    const subs = await extractSubtitles(url)
    if (subs) {
      res.json({ text: subs.text, source: subs.source, language: 'en' })
      return
    }

    // Fall back to audio download (shared) + Whisper
    const protocol = req.protocol
    const host = req.get('host') || 'localhost:3001'
    const serverOrigin = `${protocol}://${host}`

    const audioResult = await transcribeViaAudio(url, serverOrigin)
    if (audioResult) {
      res.json({ text: audioResult.text, source: audioResult.source, language: 'en' })
      return
    }

    res.status(404).json({ error: 'Could not extract transcript — no subtitles available and audio transcription failed' })
  } catch (err) {
    console.error('[CompetitorScraper] transcribe error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Transcription failed' })
  }
})

/**
 * POST /analyze — AI analysis of video content via Gemini
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { title, description, transcript, stats } = req.body as {
      title?: string
      description?: string
      transcript?: string
      stats?: { views: number; likes: number; comments: number }
    }

    if (!title) {
      res.status(400).json({ error: 'Missing required field: title' })
      return
    }

    console.log(`[CompetitorScraper] Analyzing: ${title}`)

    const analysis = await analyzeVideoContent({
      title: title || '',
      description: description || '',
      transcript,
      stats: stats || { views: 0, likes: 0, comments: 0 },
    })

    res.json(analysis)
  } catch (err) {
    console.error('[CompetitorScraper] analyze error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Analysis failed' })
  }
})

export default router
