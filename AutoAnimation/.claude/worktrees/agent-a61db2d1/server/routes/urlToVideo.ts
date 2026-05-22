/**
 * URL-to-Video API route: Extract content from URLs for video generation.
 *
 * Endpoints:
 *   POST /extract — Fetch URL, parse HTML, extract content via Gemini
 *   POST /extract-article — Optimized extraction for long-form articles with section detection
 */
import { Router, type Request, type Response } from 'express'
import * as cheerio from 'cheerio'
import logger from '../lib/logger'
import { extractArticleContent, extractStructuredData, extractPageImages } from '../services/readabilityExtractor'
import { parseArticleSections, allocateSectionDurations } from '../services/articleParser'

const router = Router()

// ── Simple rate limiter (per IP, 10 requests per minute) ─────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// Cleanup stale entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip)
  }
}, 5 * 60_000)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || null
}

function isPrivateURL(url: string): boolean {
  try {
    if (url.length > 2048) return true
    const parsed = new URL(url)
    const protocol = parsed.protocol.toLowerCase()
    if (protocol !== 'http:' && protocol !== 'https:') return true

    const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.startsWith('fc00') ||
      hostname.startsWith('fd') ||
      hostname.startsWith('fe80') ||
      hostname.endsWith('.local')
    )
  } catch {
    return true
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number, maxRedirects = 3): Promise<globalThis.Response> {
  let currentUrl = url
  for (let i = 0; i <= maxRedirects; i++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProAnimate/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      if ([301, 302, 307, 308].includes(res.status)) {
        const location = res.headers.get('location')
        if (!location) throw new Error('Redirect with no Location header')
        const resolved = new URL(location, currentUrl).href
        if (isPrivateURL(resolved)) throw new Error('Redirect to private URL blocked')
        currentUrl = resolved
        continue
      }
      return res
    } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error('Too many redirects')
}

/** Detect content type from hostname and page markup */
function detectContentType(hostname: string, $: cheerio.CheerioAPI): string {
  const h = hostname.toLowerCase()

  // Product pages
  if (h.includes('amazon.') || h.includes('shopify.') || h.includes('etsy.') ||
      h.includes('ebay.') || h.includes('walmart.') || h.includes('aliexpress.')) {
    return 'product'
  }
  if ($('[itemtype*="Product"]').length > 0 || $('meta[property="product:price"]').length > 0) {
    return 'product'
  }

  // Social posts
  if (h.includes('twitter.com') || h.includes('x.com') || h.includes('reddit.com') ||
      h.includes('threads.net') || h.includes('mastodon.')) {
    return 'social-post'
  }

  // Recipes
  if ($('[itemtype*="Recipe"]').length > 0 || h.includes('allrecipes.') ||
      h.includes('foodnetwork.') || h.includes('tasty.co')) {
    return 'recipe'
  }

  // News
  if ($('article').length > 0 && ($('meta[property="article:published_time"]').length > 0 ||
      h.includes('news') || h.includes('cnn.') || h.includes('bbc.') ||
      h.includes('reuters.') || h.includes('nytimes.'))) {
    return 'news'
  }

  // Articles (generic)
  if ($('article').length > 0 || $('main').length > 0) {
    return 'article'
  }

  return 'generic'
}

router.post('/extract', async (req: Request, res: Response) => {
  // Rate limit
  const clientIp = (req.ip || req.socket.remoteAddress || 'unknown')
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.', code: 'RATE_LIMITED' })
  }

  const geminiKey = getGeminiKey()
  if (!geminiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured' })
  }

  const { url } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL required', code: 'INVALID_URL' })
  }

  // Validate URL
  try {
    new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL format', code: 'INVALID_URL' })
  }

  if (isPrivateURL(url)) {
    return res.status(400).json({ error: 'Private/local URLs are not allowed', code: 'PRIVATE_URL' })
  }

  try {
    // Fetch the page
    const response = await fetchWithTimeout(url, 15_000)
    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch URL: ${response.status}`, code: 'FETCH_FAILED' })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return res.status(400).json({ error: 'URL does not return HTML content', code: 'PARSE_FAILED' })
    }

    // Limit response size (2MB)
    const text = await response.text()
    const html = text.slice(0, 2_000_000)

    // Parse with cheerio
    const $ = cheerio.load(html)

    // Extract basic metadata
    const title = $('meta[property="og:title"]').attr('content') ||
      $('title').text().trim() || 'Untitled'
    const description = $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') || ''
    const ogImage = $('meta[property="og:image"]').attr('content') || ''
    const siteName = $('meta[property="og:site_name"]').attr('content') || ''
    const hostname = new URL(url).hostname

    // Detect content type
    const pageType = detectContentType(hostname, $)

    // Use Readability for cleaner article extraction
    const readabilityResult = extractArticleContent(html)
    const cleanArticleText = readabilityResult.textContent
      ? readabilityResult.textContent.replace(/\s+/g, ' ').trim().slice(0, 5000)
      : ''

    // Extract structured data (JSON-LD)
    const structuredData = extractStructuredData(html)

    // Extract high-quality page images
    const extractedImages = extractPageImages(html, url)

    // Fallback to cheerio for body text if Readability failed
    $('script, style, nav, footer, header, aside, .sidebar, .ads, .comments').remove()
    const cheerioBodyText = ($('article').text() || $('main').text() || $('body').text())
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)

    const bodyText = cleanArticleText || cheerioBodyText

    // Send to Gemini for intelligent extraction
    const geminiPrompt = `You are a content extractor for a video generation tool. Analyze this web page and extract structured information for creating an animated video.

URL: ${url}
Page Type: ${pageType}
Title: ${title}
Description: ${description}
Site: ${siteName}

Page Content (truncated):
${bodyText.slice(0, 4000)}

Extract and return ONLY valid JSON (no markdown):
{
  "contentType": "${pageType}",
  "title": "Clean title of the content",
  "summary": "2-3 sentence summary of the key content",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "tone": "informative|entertaining|serious|humorous|dramatic|educational",
  "suggestedDuration": 45,
  "suggestedAspectRatio": "9:16",
  "suggestedPrompt": "A complete orchestrator prompt that would generate a compelling video about this content. Write it as if you're briefing a video director. Include suggested character roles, visual style, and key talking points.",
  "productPrice": "only for product pages, e.g. '$29.99'",
  "productFeatures": ["only for product pages"]
}

Guidelines for suggestedPrompt:
- For articles: "Create a [tone] explainer video about [topic]. Key points: [bullets]. Use a narrator character..."
- For products: "Create a product showcase video for [product name]. Price: [price]. Features: [list]. Use an enthusiastic presenter..."
- For social posts: "Create a reaction/commentary video about this trending [platform] post: '[content]'. Use two characters debating..."
- For recipes: "Create a step-by-step recipe tutorial for [dish name]. Steps: [list]. Use a chef character..."
- For news: "Create a news breakdown video about [headline]. Key facts: [bullets]. Use a news anchor character..."
- Always suggest specific visual elements (templates, animations, stock media) that would enhance the video.`

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: geminiPrompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      return res.status(502).json({ error: `Gemini API error: ${geminiResponse.status}`, detail: errText, code: 'PARSE_FAILED' })
    }

    const geminiData = await geminiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!geminiText) {
      return res.status(502).json({ error: 'No extraction result from Gemini', code: 'PARSE_FAILED' })
    }

    let extracted: Record<string, unknown>
    try {
      extracted = JSON.parse(geminiText.replace(/```json?\n?/g, '').replace(/```/g, '').trim())
    } catch (parseErr) {
      logger.warn({ geminiText: geminiText.slice(0, 500) }, 'Failed to parse Gemini extraction JSON')
      // Fallback to basic extraction
      return res.json({
        url,
        contentType: pageType,
        title,
        summary: description || bodyText.slice(0, 200),
        keyPoints: [],
        tone: 'informative',
        suggestedDuration: 45,
        suggestedAspectRatio: '9:16',
        suggestedPrompt: `Create a video about: ${title}. ${description}`,
        primaryImageUrl: ogImage || undefined,
        siteName: siteName || undefined,
      })
    }

    // Merge with metadata
    return res.json({
      url,
      contentType: (extracted.contentType as string) || pageType,
      title: (extracted.title as string) || title,
      summary: (extracted.summary as string) || description,
      keyPoints: (extracted.keyPoints as string[]) || [],
      tone: (extracted.tone as string) || 'informative',
      suggestedDuration: (extracted.suggestedDuration as number) || 45,
      suggestedAspectRatio: (extracted.suggestedAspectRatio as string) || '9:16',
      suggestedPrompt: (extracted.suggestedPrompt as string) || `Create a video about: ${title}`,
      primaryImageUrl: ogImage || extractedImages[0] || undefined,
      extractedImages: extractedImages.length > 0 ? extractedImages : undefined,
      productPrice: (extracted.productPrice as string) || undefined,
      productFeatures: (extracted.productFeatures as string[]) || undefined,
      siteName: siteName || undefined,
      structuredData: structuredData.length > 0 ? structuredData : undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('abort')) {
      return res.status(504).json({ error: 'URL fetch timed out (15s limit)', code: 'TIMEOUT' })
    }
    return res.status(500).json({ error: `Extraction failed: ${message}`, code: 'FETCH_FAILED' })
  }
})

// ── POST /extract-article — Optimized for long-form article extraction ──

router.post('/extract-article', async (req: Request, res: Response) => {
  const clientIp = (req.ip || req.socket.remoteAddress || 'unknown')
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Try again in a minute.', code: 'RATE_LIMITED' })
  }

  const { url, targetDuration } = req.body
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL required', code: 'INVALID_URL' })
  }

  try {
    new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL format', code: 'INVALID_URL' })
  }

  if (isPrivateURL(url)) {
    return res.status(400).json({ error: 'Private/local URLs are not allowed', code: 'PRIVATE_URL' })
  }

  try {
    const response = await fetchWithTimeout(url, 15_000)
    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch URL: ${response.status}`, code: 'FETCH_FAILED' })
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return res.status(400).json({ error: 'URL does not return HTML content', code: 'PARSE_FAILED' })
    }

    const text = await response.text()
    const html = text.slice(0, 2_000_000)

    // Use Readability for clean extraction
    const readabilityResult = extractArticleContent(html)

    // Parse into sections by heading hierarchy
    const sections = parseArticleSections(html, url)

    // Extract images
    const extractedImages = extractPageImages(html, url)

    // Calculate word counts
    const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0)
    const estimatedReadingTime = Math.ceil(totalWordCount / 200) // ~200 wpm average

    // Allocate section durations
    const duration = typeof targetDuration === 'number' ? targetDuration : 60
    const videoScripts = allocateSectionDurations(sections, duration)

    return res.json({
      title: readabilityResult.title || 'Untitled Article',
      author: readabilityResult.byline || '',
      publishDate: '',
      sections: sections.map((s, i) => ({
        heading: s.heading,
        text: s.text.slice(0, 1000), // Truncate per-section text for response size
        images: s.images.slice(0, 3),
        wordCount: s.wordCount,
        level: s.level,
        enabled: true,
        videoScript: videoScripts[i] || null,
      })),
      totalWordCount,
      estimatedReadingTime,
      suggestedVideoDuration: Math.min(120, Math.max(30, estimatedReadingTime * 10)),
      extractedImages,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('abort')) {
      return res.status(504).json({ error: 'URL fetch timed out (15s limit)', code: 'TIMEOUT' })
    }
    return res.status(500).json({ error: `Article extraction failed: ${message}`, code: 'FETCH_FAILED' })
  }
})

export default router
