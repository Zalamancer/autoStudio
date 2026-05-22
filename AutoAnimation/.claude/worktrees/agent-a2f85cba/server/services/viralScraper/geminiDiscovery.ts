/**
 * Gemini + Google Search grounding discovery for TikTok/Instagram trends.
 * Replaces RapidAPI-based scraping with Gemini's built-in search.
 * Discovered URLs are enriched via yt-dlp for full metadata.
 */

import type { NormalizedVideo } from './types'
import { getVideoInfo } from './ytdlpRunner'
import { normalizeVideo } from './normalizer'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || null
}

async function callGemini(prompt: string, useSearch = true): Promise<string> {
  const apiKey = getGeminiKey()
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const requestBody: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  }

  if (useSearch) {
    requestBody.tools = [{ google_search: {} }]
  } else {
    (requestBody.generationConfig as Record<string, unknown>).responseMimeType = 'application/json'
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/** Extract URLs from Gemini's text response */
function extractVideoURLs(text: string): string[] {
  const urlRegex = /https?:\/\/(?:www\.)?(?:tiktok\.com|instagram\.com|youtube\.com|youtu\.be)\/[^\s)}\]"'<>]+/g
  const matches = text.match(urlRegex) || []
  // Deduplicate
  return [...new Set(matches)].slice(0, 20)
}

/** Extract trend insights from Gemini response text */
function extractTrendItems(text: string, niche: string): Array<{
  title: string
  description: string
  category: string
}> {
  const items: Array<{ title: string; description: string; category: string }> = []
  const lines = text.split('\n').filter((l) => l.trim())
  let currentTitle = ''
  let currentDesc = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^[\d\u2022\-*]/.test(trimmed) && trimmed.length > 10) {
      if (currentTitle) {
        items.push({
          title: currentTitle,
          description: currentDesc.trim(),
          category: niche || 'trending',
        })
      }
      currentTitle = trimmed.replace(/^[\d.)\-*\u2022]+\s*/, '').replace(/\*\*/g, '')
      currentDesc = ''
    } else if (currentTitle && trimmed.length > 20) {
      currentDesc += ' ' + trimmed
    }
  }
  if (currentTitle) {
    items.push({
      title: currentTitle,
      description: currentDesc.trim(),
      category: niche || 'trending',
    })
  }

  return items.slice(0, 15)
}

/**
 * Discover trending TikTok/Instagram content via Gemini + Google Search grounding.
 * For each URL Gemini finds, we call yt-dlp to get full normalized metadata.
 */
export async function discoverGemini(
  keywords: string[],
  industry: string,
  niche: string,
): Promise<{ videos: NormalizedVideo[]; summary: string; trendItems: Array<{ title: string; description: string; category: string }> }> {
  const apiKey = getGeminiKey()
  if (!apiKey) {
    console.log('[ViralScraper] GEMINI_API_KEY not set, skipping Gemini discovery')
    return { videos: [], summary: '', trendItems: [] }
  }

  const prompt = `You are a viral content researcher. Search the web for current trending short-form videos on TikTok, Instagram Reels, and YouTube Shorts in the ${niche || 'general'} / ${industry || 'business'} space.

Keywords to search: ${keywords.join(', ')}

I need you to:
1. Find SPECIFIC trending videos that are going viral RIGHT NOW in this niche
2. Include the FULL URLs to TikTok videos, Instagram Reels, or YouTube Shorts
3. For each video, mention: the creator, approximate view count, what makes it viral
4. Identify common formats/hooks that are working (e.g. "day in the life", "5 things", "POV")
5. Note any trending sounds, hashtags, or challenges

Be as specific as possible with real video URLs and data. Include at least 5-10 video URLs if available.

Also provide a brief summary of the overall trend landscape for this niche.`

  console.log(`[ViralScraper] Gemini discovery: "${keywords.join(', ')}" (${niche}/${industry})`)
  const text = await callGemini(prompt, true)

  // Extract video URLs from response
  const urls = extractVideoURLs(text)
  console.log(`[ViralScraper] Gemini found ${urls.length} video URLs`)

  // Extract trend insights (for cases where yt-dlp can't reach the URL)
  const trendItems = extractTrendItems(text, niche)

  // Enrich URLs with yt-dlp metadata (parallel, with individual error handling)
  const enrichResults = await Promise.allSettled(
    urls.map(async (url) => {
      const meta = await getVideoInfo(url)
      return normalizeVideo(meta)
    }),
  )

  const videos: NormalizedVideo[] = enrichResults
    .filter((r): r is PromiseFulfilledResult<NormalizedVideo> => r.status === 'fulfilled')
    .map((r) => r.value)

  const failedCount = enrichResults.filter((r) => r.status === 'rejected').length
  if (failedCount > 0) {
    console.log(`[ViralScraper] ${failedCount}/${urls.length} URL enrichments failed (yt-dlp)`)
  }

  // Summary: first 500 chars of Gemini response
  const summary = text.slice(0, 500)

  return { videos, summary, trendItems }
}
