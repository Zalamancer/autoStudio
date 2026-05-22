/**
 * Competitor Scraper Frontend Service — API calls to the competitor scraper backend.
 */

import type {
  CompetitorVideo,
  CompetitorAnalysis,
  CompetitorTranscript,
  ScraperPlatform,
} from '@/types/competitorScraper'

const BASE = '/api/competitor-scraper'

/**
 * Scrape a single video URL → metadata + transcript
 */
export async function scrapeUrl(url: string): Promise<CompetitorVideo> {
  const res = await fetch(`${BASE}/scrape-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Scrape failed (${res.status})`)
  }
  return res.json()
}

/**
 * Scrape a username/profile → recent videos
 */
export async function scrapeUsername(
  username: string,
  platform: ScraperPlatform = 'tiktok',
  maxResults = 20,
): Promise<{ videos: CompetitorVideo[]; count: number }> {
  const res = await fetch(`${BASE}/scrape-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, platform, maxResults }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Username scrape failed (${res.status})`)
  }
  return res.json()
}

/**
 * Search by keyword/hashtag across platforms
 */
export async function scrapeKeyword(
  keyword: string,
  platforms: ScraperPlatform[] = ['tiktok', 'youtube'],
  maxResults = 20,
): Promise<{ videos: CompetitorVideo[]; count: number }> {
  const res = await fetch(`${BASE}/scrape-keyword`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword, platforms, maxResults }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Keyword search failed (${res.status})`)
  }
  return res.json()
}

/**
 * On-demand transcript extraction for a video URL
 */
export async function transcribeVideo(url: string): Promise<CompetitorTranscript> {
  const res = await fetch(`${BASE}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Transcription failed (${res.status})`)
  }
  return res.json()
}

/**
 * AI analysis of video content
 */
export async function analyzeVideo(video: {
  title: string
  description: string
  transcript?: string
  stats: { views: number; likes: number; comments: number }
}): Promise<CompetitorAnalysis> {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(video),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Analysis failed (${res.status})`)
  }
  return res.json()
}
