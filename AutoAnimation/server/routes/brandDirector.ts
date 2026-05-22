/**
 * Brand Director API routes: website analysis + niche trend discovery.
 *
 * Endpoints:
 *   POST /analyze-url  — Fetch, parse, and analyze a business website
 *   POST /trends       — Discover trending content in a niche (YouTube + RapidAPI + Gemini)
 */
import { Router, type Request, type Response } from 'express'
import * as cheerio from 'cheerio'

const router = Router()

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// ── Helpers ──

function getGeminiKey(): string | null {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || null
}

function getYouTubeKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null
}

function isPrivateURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local')
    )
  } catch {
    return true
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<globalThis.Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProAnimate BrandDirector/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    return res
  } finally {
    clearTimeout(timeout)
  }
}

async function callGemini(prompt: string, jsonMode = true, useSearch = false): Promise<string> {
  const apiKey = getGeminiKey()
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const requestBody: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  if (useSearch) {
    requestBody.tools = [{ google_search: {} }]
    // JSON mode not supported with google_search tool
    delete (requestBody as { generationConfig: Record<string, unknown> }).generationConfig.responseMimeType
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
  // Gemini 2.5 Flash may return thinking parts before the actual text.
  // Find the last non-thought text part.
  const parts: Array<{ text?: string; thought?: boolean }> =
    data?.candidates?.[0]?.content?.parts || []
  const textPart = [...parts].reverse().find((p) => p.text && !p.thought)
  const text = textPart?.text || ''
  return text
}

// ── Shared website analysis helper ──

interface ImageCandidate {
  src: string
  alt: string
  role: 'logo' | 'hero' | 'product' | 'other'
}

async function analyzeWebsite(url: string): Promise<{
  profile: Record<string, unknown>
  images: Array<{ url: string; base64: string; mimeType: string; role: string; alt: string }>
}> {
  // Fetch HTML
  console.log(`[BrandDirector] Fetching: ${url}`)
  const response = await fetchWithTimeout(url, 15000)
  if (!response.ok) throw new Error(`Website returned HTTP ${response.status}`)
  const html = await response.text()

  // Parse HTML with cheerio
  const $ = cheerio.load(html)

  // Extract metadata
  const title = $('title').text().trim()
  const metaDescription = $('meta[name="description"]').attr('content') || ''
  const ogTitle = $('meta[property="og:title"]').attr('content') || ''
  const ogDescription = $('meta[property="og:description"]').attr('content') || ''
  const ogImage = $('meta[property="og:image"]').attr('content') || ''
  const themeColor = $('meta[name="theme-color"]').attr('content') || ''

  // Extract headings
  const headings: string[] = []
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim()
    if (text && text.length < 200) headings.push(text)
  })

  // Extract body text (first ~3000 chars for context)
  $('script, style, nav, footer, header').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000)

  // Extract images
  const imageCandidates: ImageCandidate[] = []

  $('img').each((_, el) => {
    const src = $(el).attr('src')
    const alt = $(el).attr('alt') || ''
    const className = $(el).attr('class') || ''
    const parentClass = $(el).parent().attr('class') || ''

    if (!src || src.startsWith('data:') || src.length < 5) return

    let absoluteSrc: string
    try {
      absoluteSrc = new URL(src, url).href
    } catch {
      return
    }

    let role: ImageCandidate['role'] = 'other'
    const combined = `${alt} ${className} ${parentClass}`.toLowerCase()
    if (combined.includes('logo')) role = 'logo'
    else if (combined.includes('hero') || combined.includes('banner') || combined.includes('header')) role = 'hero'
    else if (combined.includes('product') || combined.includes('item') || combined.includes('feature')) role = 'product'

    imageCandidates.push({ src: absoluteSrc, alt, role })
  })

  if (ogImage) {
    try {
      const absoluteOG = new URL(ogImage, url).href
      imageCandidates.unshift({ src: absoluteOG, alt: 'Open Graph image', role: 'hero' })
    } catch { /* skip */ }
  }

  const seen = new Set<string>()
  const sortedImages = imageCandidates
    .filter((img) => {
      if (seen.has(img.src)) return false
      seen.add(img.src)
      return true
    })
    .sort((a, b) => {
      const order = { logo: 0, hero: 1, product: 2, other: 3 }
      return order[a.role] - order[b.role]
    })
    .slice(0, 6)

  const downloadedImages = await Promise.allSettled(
    sortedImages.map(async (img) => {
      try {
        const imgRes = await fetchWithTimeout(img.src, 5000)
        if (!imgRes.ok) return null
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
        if (!contentType.startsWith('image/')) return null
        const buffer = Buffer.from(await imgRes.arrayBuffer())
        if (buffer.length > 2 * 1024 * 1024) return null
        const base64 = `data:${contentType};base64,${buffer.toString('base64')}`
        return { url: img.src, base64, mimeType: contentType, role: img.role, alt: img.alt }
      } catch {
        return null
      }
    }),
  )

  const images = downloadedImages
    .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof downloadedImages[0] extends Promise<infer T> ? () => T : never>>>> =>
      r.status === 'fulfilled' && r.value !== null,
    )
    .map((r) => r.value!)

  // Analyze with Gemini
  const analysisPrompt = `Analyze this business website and extract structured information.

WEBSITE URL: ${url}
TITLE: ${title}
META DESCRIPTION: ${metaDescription}
OG TITLE: ${ogTitle}
OG DESCRIPTION: ${ogDescription}
THEME COLOR: ${themeColor}

HEADINGS: ${headings.slice(0, 20).join(' | ')}

BODY TEXT (excerpt):
${bodyText}

Return a JSON object with these exact fields:
{
  "businessName": "string - the business/company name",
  "industry": "string - broad industry (e.g. Technology, Fashion, Food, Finance)",
  "niche": "string - specific niche within the industry",
  "targetAudience": ["string array - who they serve"],
  "products": ["string array - main products or services"],
  "brandValues": ["string array - core values or selling points"],
  "tone": "string - communication style: professional, casual, playful, authoritative, friendly, etc.",
  "primaryColors": ["string array - hex color codes from the site, include theme-color if available"],
  "tagline": "string or null - brand tagline/slogan if visible",
  "description": "string - 2-3 sentence summary of the business"
}`

  console.log('[BrandDirector] Analyzing with Gemini...')
  const analysisText = await callGemini(analysisPrompt)
  const parsed = JSON.parse(analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
  const profile = { url, ...parsed }

  console.log(`[BrandDirector] Analysis complete: ${profile.businessName} (${profile.industry}/${profile.niche})`)
  return { profile, images }
}

// ── Extract social links from HTML ──

function extractSocialLinks(html: string, baseUrl: string): Array<{ platform: string; url: string; handle?: string }> {
  const $ = cheerio.load(html)
  const links: Array<{ platform: string; url: string; handle?: string }> = []
  const seen = new Set<string>()

  const platformPatterns: Array<{ platform: string; regex: RegExp }> = [
    { platform: 'instagram', regex: /instagram\.com\/([^/?#]+)/i },
    { platform: 'tiktok', regex: /tiktok\.com\/@?([^/?#]+)/i },
    { platform: 'youtube', regex: /youtube\.com\/(?:@|channel\/|c\/)?([^/?#]+)/i },
    { platform: 'twitter', regex: /(?:twitter|x)\.com\/([^/?#]+)/i },
    { platform: 'facebook', regex: /facebook\.com\/([^/?#]+)/i },
    { platform: 'linkedin', regex: /linkedin\.com\/(?:company|in)\/([^/?#]+)/i },
  ]

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')
    if (!href) return
    let absoluteUrl: string
    try {
      absoluteUrl = new URL(href, baseUrl).href
    } catch {
      return
    }
    for (const { platform, regex } of platformPatterns) {
      const match = absoluteUrl.match(regex)
      if (match && !seen.has(platform)) {
        seen.add(platform)
        links.push({ platform, url: absoluteUrl, handle: match[1] })
      }
    }
  })

  return links
}

// ── POST /analyze-url ──

router.post('/analyze-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as { url?: string }

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing required field: url' })
      return
    }

    let parsedURL: URL
    try {
      parsedURL = new URL(url)
    } catch {
      res.status(400).json({ error: 'Invalid URL format' })
      return
    }

    if (!['http:', 'https:'].includes(parsedURL.protocol)) {
      res.status(400).json({ error: 'URL must use http or https protocol' })
      return
    }

    if (isPrivateURL(url)) {
      res.status(400).json({ error: 'Cannot analyze private/local URLs' })
      return
    }

    const result = await analyzeWebsite(url)
    res.json(result)
  } catch (err) {
    console.error('[BrandDirector] analyze-url error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── POST /social-presence ──

router.post('/social-presence', async (req: Request, res: Response) => {
  try {
    const { brandName, url } = req.body as { brandName?: string; url?: string }
    if (!brandName || !url) {
      res.status(400).json({ error: 'Missing required fields: brandName, url' })
      return
    }

    console.log(`[BrandDirector] Discovering social presence for: ${brandName}`)

    // Scrape website for social links
    let socialLinks: Array<{ platform: string; url: string; handle?: string }> = []
    try {
      const response = await fetchWithTimeout(url, 10000)
      if (response.ok) {
        const html = await response.text()
        socialLinks = extractSocialLinks(html, url)
      }
    } catch {
      console.warn('[BrandDirector] Failed to scrape website for social links')
    }

    // Use Gemini + Google Search to discover additional accounts
    const prompt = `Find the official social media accounts for "${brandName}" (website: ${url}).

Known accounts from website: ${socialLinks.length > 0 ? socialLinks.map(l => `${l.platform}: ${l.url}`).join(', ') : 'None found on website'}

Search for their presence on: Instagram, TikTok, YouTube, Twitter/X, Facebook, LinkedIn.

For each account found, provide:
- platform name
- profile URL
- handle/username
- approximate follower count if visible
- whether it appears to be a verified/official account
- estimated posting frequency (daily, weekly, monthly, rarely)

Also provide a brief 2-3 sentence assessment of their overall social media presence strength.

Return JSON:
{
  "accounts": [
    { "platform": "instagram", "url": "...", "handle": "...", "followerCount": number|null, "verified": boolean, "postFrequency": "daily|weekly|monthly|rarely" }
  ],
  "assessment": "string - overall social media presence assessment"
}`

    const text = await callGemini(prompt, false, true)

    // Parse the response — try JSON first, then extract from text
    let accounts: Array<{ platform: string; url: string; handle?: string; followerCount?: number; verified?: boolean; postFrequency?: string }> = []
    let assessment = ''

    try {
      const jsonMatch = text.match(/\{[\s\S]*"accounts"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        accounts = parsed.accounts || []
        assessment = parsed.assessment || ''
      }
    } catch {
      // Fallback: use scraped links
      accounts = socialLinks.map(l => ({ platform: l.platform, url: l.url, handle: l.handle }))
      assessment = text.slice(0, 500)
    }

    // Merge scraped links with Gemini-discovered ones
    const mergedAccountMap = new Map<string, typeof accounts[0]>()
    for (const acc of [...socialLinks.map(l => ({ platform: l.platform, url: l.url, handle: l.handle })), ...accounts]) {
      if (!mergedAccountMap.has(acc.platform)) {
        mergedAccountMap.set(acc.platform, acc)
      }
    }

    res.json({
      accounts: Array.from(mergedAccountMap.values()),
      assessment,
      discoveredAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[BrandDirector] social-presence error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── POST /mentions ──

router.post('/mentions', async (req: Request, res: Response) => {
  try {
    const { brandName, keywords, industry } = req.body as { brandName?: string; keywords?: string[]; industry?: string }
    if (!brandName || !keywords || keywords.length === 0) {
      res.status(400).json({ error: 'Missing required fields: brandName, keywords' })
      return
    }

    console.log(`[BrandDirector] Searching mentions for: ${brandName}`)

    const prompt = `Search for recent online mentions, reviews, and discussions about "${brandName}" in the ${industry || 'general'} space.

Search keywords: ${keywords.join(', ')}

Find mentions on:
- Reddit (subreddits, threads, comments)
- Twitter/X (tweets, threads)
- Review sites (Trustpilot, G2, Capterra, Product Hunt, etc.)
- Forums and communities
- News articles and blogs

For each mention found, provide:
- platform type (reddit, twitter, review-site, forum, news, other)
- source name (e.g. "r/technology", "Trustpilot", "TechCrunch")
- title if available
- a short snippet (1-2 sentences)
- URL if available
- sentiment (positive, neutral, negative)
- approximate date if known
- relevance score (0.0-1.0)

Also provide a sentiment breakdown (counts) and overall sentiment summary.

Return JSON:
{
  "mentions": [
    { "id": "m-1", "platform": "reddit", "source": "r/technology", "title": "...", "snippet": "...", "url": "...", "sentiment": "positive", "date": "2024-01-15", "relevanceScore": 0.9 }
  ],
  "sentimentBreakdown": { "positive": 5, "neutral": 3, "negative": 2 },
  "overallSentiment": "string - 1-2 sentence summary of overall brand perception"
}`

    const text = await callGemini(prompt, false, true)

    let result = {
      mentions: [] as Array<{ id: string; platform: string; source: string; title?: string; snippet: string; url?: string; sentiment: string; date?: string; relevanceScore: number }>,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      overallSentiment: '',
    }

    try {
      const jsonMatch = text.match(/\{[\s\S]*"mentions"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        result = {
          mentions: (parsed.mentions || []).map((m: Record<string, unknown>, i: number) => ({
            ...m,
            id: m.id || `m-${i + 1}`,
          })),
          sentimentBreakdown: parsed.sentimentBreakdown || { positive: 0, neutral: 0, negative: 0 },
          overallSentiment: parsed.overallSentiment || '',
        }
      }
    } catch {
      result.overallSentiment = text.slice(0, 500)
    }

    res.json({ ...result, fetchedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[BrandDirector] mentions error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── POST /competitors ──

router.post('/competitors', async (req: Request, res: Response) => {
  try {
    const { brandName, industry, niche, products } = req.body as { brandName?: string; industry?: string; niche?: string; products?: string[] }
    if (!brandName || !industry || !niche) {
      res.status(400).json({ error: 'Missing required fields: brandName, industry, niche' })
      return
    }

    console.log(`[BrandDirector] Discovering competitors for: ${brandName}`)

    const prompt = `Find the top 5-8 competitors for "${brandName}" in the ${industry} / ${niche} space.

Their products/services: ${(products || []).join(', ')}

For each competitor, provide:
- Company/brand name
- Website URL
- How relevant they are as a competitor (0.0-1.0 relevance score)
- Brief reason why they compete

Return JSON array:
[
  { "name": "Competitor Name", "url": "https://...", "relevance": 0.9, "reason": "Direct competitor in..." }
]

Focus on direct competitors first, then indirect ones. Include both established players and emerging challengers.`

    const text = await callGemini(prompt, false, true)

    let competitors: Array<{ name: string; url: string; relevance: number; reason?: string }> = []

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        competitors = JSON.parse(jsonMatch[0])
      } else {
        console.warn('[BrandDirector] No JSON array found in competitor response. Text:', text.slice(0, 300))
      }
    } catch (parseErr) {
      console.warn('[BrandDirector] Failed to parse competitor JSON:', parseErr, 'Text:', text.slice(0, 300))
    }

    res.json({ competitors })
  } catch (err) {
    console.error('[BrandDirector] competitors error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── POST /analyze-competitor ──

router.post('/analyze-competitor', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as { url?: string }
    if (!url) {
      res.status(400).json({ error: 'Missing required field: url' })
      return
    }

    if (isPrivateURL(url)) {
      res.status(400).json({ error: 'Cannot analyze private/local URLs' })
      return
    }

    const { profile } = await analyzeWebsite(url)
    res.json({ profile })
  } catch (err) {
    console.error('[BrandDirector] analyze-competitor error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── POST /competitive-analysis ──

router.post('/competitive-analysis', async (req: Request, res: Response) => {
  try {
    const { brandProfile, competitorProfiles } = req.body as { brandProfile?: Record<string, unknown>; competitorProfiles?: Record<string, unknown>[] }
    if (!brandProfile || !competitorProfiles || competitorProfiles.length === 0) {
      res.status(400).json({ error: 'Missing required fields: brandProfile, competitorProfiles' })
      return
    }

    console.log(`[BrandDirector] Running competitive analysis: ${brandProfile.businessName} vs ${competitorProfiles.length} competitors`)

    const competitorSummaries = competitorProfiles.map((c, i) =>
      `${i + 1}. ${c.businessName} (${c.industry}/${c.niche})
   - Products: ${(c.products as string[] || []).join(', ')}
   - Target: ${(c.targetAudience as string[] || []).join(', ')}
   - Tone: ${c.tone}
   - Description: ${c.description}`
    ).join('\n\n')

    const prompt = `Perform a detailed competitive analysis comparing this brand against its competitors.

OUR BRAND:
- Name: ${brandProfile.businessName}
- Industry: ${brandProfile.industry} / ${brandProfile.niche}
- Products: ${(brandProfile.products as string[] || []).join(', ')}
- Target Audience: ${(brandProfile.targetAudience as string[] || []).join(', ')}
- Brand Values: ${(brandProfile.brandValues as string[] || []).join(', ')}
- Tone: ${brandProfile.tone}
- Description: ${brandProfile.description}

COMPETITORS:
${competitorSummaries}

Analyze and return JSON with these sections. Each insight should have: category, title (short), description (2-3 sentences), competitorNames (relevant competitor names), recommendation (actionable advice), impactScore (1-10).

{
  "ourStrengths": [{ "category": "strength", "title": "...", "description": "...", "competitorNames": [], "recommendation": "...", "impactScore": 8 }],
  "competitorStrengths": [{ "category": "strength", "title": "...", "description": "...", "competitorNames": ["..."], "recommendation": "...", "impactScore": 7 }],
  "competitorWeaknesses": [{ "category": "weakness", "title": "...", "description": "...", "competitorNames": ["..."], "recommendation": "...", "impactScore": 6 }],
  "contentOpportunities": [{ "category": "opportunity", "title": "...", "description": "...", "competitorNames": [], "recommendation": "...", "impactScore": 9 }],
  "summary": "string - 3-4 sentence executive summary of competitive positioning"
}

Provide 3-5 insights per section. Focus on actionable, content-creation-relevant insights.`

    const text = await callGemini(prompt)

    let analysis
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      // Try direct parse first, then regex extraction
      try {
        analysis = JSON.parse(cleaned)
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*"ourStrengths"[\s\S]*\}/)
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0])
        }
      }
    } catch {
      // ignore
    }

    if (!analysis) {
      console.error('[BrandDirector] Competitive analysis parse failed. Text preview:', text.slice(0, 500))
      res.status(500).json({ error: 'Failed to parse competitive analysis from AI' })
      return
    }

    res.json({ analysis: { ...analysis, analyzedAt: new Date().toISOString() } })
  } catch (err) {
    console.error('[BrandDirector] competitive-analysis error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── POST /analyze-virality ──

router.post('/analyze-virality', async (req: Request, res: Response) => {
  try {
    const { trendItems, industry, niche } = req.body as {
      trendItems?: Array<{
        title: string
        url?: string
        thumbnailUrl?: string
        platform: string
        viewCount?: number
        likeCount?: number
        commentCount?: number
        shareCount?: number
        engagementRate?: number
        publishedAt?: string
        hashtags?: string[]
        authorUsername?: string
        authorDisplayName?: string
        authorFollowerCount?: number
        duration?: number
        description?: string
        category?: string
      }>
      industry?: string
      niche?: string
    }

    if (!trendItems || trendItems.length === 0 || !industry || !niche) {
      res.status(400).json({ error: 'Missing required fields: trendItems, industry, niche' })
      return
    }

    // Skip items with negligible views — they have no meaningful metrics to analyze
    const MIN_VIEWS_FOR_ANALYSIS = 1000
    const credibleItems = trendItems.filter(item => (item.viewCount || 0) >= MIN_VIEWS_FOR_ANALYSIS)

    if (credibleItems.length === 0) {
      console.log(`[BrandDirector] No videos with ${MIN_VIEWS_FOR_ANALYSIS}+ views to analyze`)
      res.json({
        breakdowns: [],
        commonPatterns: [],
        nicheAssessment: 'No trending videos with sufficient view data found to analyze.',
        analyzedAt: new Date().toISOString(),
      })
      return
    }

    console.log(`[BrandDirector] Analyzing virality for ${credibleItems.length}/${trendItems.length} videos (${MIN_VIEWS_FOR_ANALYSIS}+ views) in ${industry}/${niche}`)

    // Build per-video summaries with computed metrics (use original indices for mapping back)
    const credibleIndices = trendItems.map((item, i) => ({ item, originalIndex: i }))
      .filter(({ item }) => (item.viewCount || 0) >= MIN_VIEWS_FOR_ANALYSIS)

    const videoSummaries = credibleIndices.map(({ item, originalIndex }) => {
      const views = item.viewCount || 0
      const followers = item.authorFollowerCount || 0
      const viewsToFollowerRatio = followers > 0 ? views / followers : 0
      const ageInDays = item.publishedAt
        ? Math.max(1, Math.floor((Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 0

      const engagement = item.engagementRate
        ? `${(item.engagementRate * 100).toFixed(1)}%`
        : views > 0
          ? `${(((item.likeCount || 0) + (item.commentCount || 0)) / views * 100).toFixed(1)}%`
          : 'unknown'

      return `VIDEO ${originalIndex} (index ${originalIndex}): "${item.title}"
  Platform: ${item.platform}
  Creator: ${item.authorDisplayName || item.authorUsername || 'unknown'} (${followers > 0 ? `${(followers / 1000).toFixed(0)}K followers` : 'follower count unknown'})
  Views: ${(views / 1000).toFixed(0)}K | Likes: ${item.likeCount || 0} | Comments: ${item.commentCount || 0} | Shares: ${item.shareCount || 0}
  Engagement rate: ${engagement}
  Views/Follower ratio: ${viewsToFollowerRatio > 0 ? viewsToFollowerRatio.toFixed(2) : 'unknown'}
  Age: ${ageInDays > 0 ? `${ageInDays} days` : 'unknown'}
  Duration: ${item.duration ? `${item.duration}s` : 'unknown'}
  Hashtags: ${(item.hashtags || []).join(', ') || 'none'}
  URL: ${item.url || 'N/A'}`
    }).join('\n\n')

    const prompt = `You are a viral content analyst. Analyze why each of these ${niche} / ${industry} videos performed the way they did.

CRITICAL CONTEXT FOR RELATIVE PERFORMANCE:
- A video with 500K views from a 10M follower creator is UNDERPERFORMING (0.05x ratio)
- A video with 100K views from a 5K follower creator is MASSIVELY OVERPERFORMING (20x ratio)
- Views/Follower ratio > 2.0 = overperforming, 0.5-2.0 = average, < 0.5 = underperforming
- If follower count is unknown, mark performanceVsBaseline as "unknown"

VIDEOS TO ANALYZE:
${videoSummaries}

For each video, determine:
1. Why it went viral or gained traction (content format, hook, timing, trend-riding)
2. Performance relative to the creator's size (use views/follower ratio)
3. Key factors that drove engagement
4. Any timing/news context that helped (if searchable)

Also identify:
- Common patterns across all these trending videos
- Overall assessment of what's working in the ${niche} niche right now

Return JSON:
{
  "breakdowns": [
    {
      "trendItemIndex": 0,
      "whyViral": "2-3 sentence explanation of why this video performed well",
      "keyFactors": ["factor1", "factor2", "factor3"],
      "performanceVsBaseline": "overperforming | average | underperforming | unknown",
      "timingContext": "relevant news/event context or null"
    }
  ],
  "commonPatterns": ["pattern1", "pattern2", "pattern3"],
  "nicheAssessment": "2-3 sentence overview of what's working in this niche"
}`

    const text = await callGemini(prompt, false, true)

    // Parse response
    let aiResult: {
      breakdowns?: Array<{
        trendItemIndex: number
        whyViral: string
        keyFactors: string[]
        performanceVsBaseline: string
        timingContext: string | null
      }>
      commonPatterns?: string[]
      nicheAssessment?: string
    } = {}

    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      const jsonMatch = cleaned.match(/\{[\s\S]*"breakdowns"[\s\S]*\}/)
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0])
      }
    } catch {
      console.warn('[BrandDirector] Virality analysis JSON parse failed')
    }

    // Merge AI breakdowns with computed metrics — only for credible items
    const breakdowns = credibleIndices.map(({ item, originalIndex }) => {
      const views = item.viewCount || 0
      const likes = item.likeCount || 0
      const comments = item.commentCount || 0
      const followers = item.authorFollowerCount || 0
      const viewsToFollowerRatio = followers > 0 ? Math.round((views / followers) * 100) / 100 : 0
      const engagementRate = item.engagementRate || (views > 0 ? (likes + comments) / views : 0)
      const ageInDays = item.publishedAt
        ? Math.max(1, Math.floor((Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 0

      const aiBreakdown = (aiResult.breakdowns || []).find(b => b.trendItemIndex === originalIndex)

      return {
        trendItemIndex: originalIndex,
        title: item.title,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        platform: item.platform,
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        engagementRate: Math.round(engagementRate * 10000) / 10000,
        authorName: item.authorDisplayName || item.authorUsername || 'Unknown',
        authorFollowerCount: followers,
        viewsToFollowerRatio,
        performanceVsBaseline: (aiBreakdown?.performanceVsBaseline as 'overperforming' | 'average' | 'underperforming' | 'unknown') || 'unknown',
        whyViral: aiBreakdown?.whyViral || '',
        keyFactors: aiBreakdown?.keyFactors || [],
        timingContext: aiBreakdown?.timingContext || null,
        ageInDays,
      }
    })

    const meaningfulBreakdowns = breakdowns.filter(b => b.whyViral)

    res.json({
      breakdowns: meaningfulBreakdowns,
      commonPatterns: aiResult.commonPatterns || [],
      nicheAssessment: aiResult.nicheAssessment || '',
      analyzedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[BrandDirector] analyze-virality error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── POST /n8n-trends ── (Apify scraper: TikTok + YouTube)

router.post('/n8n-trends', async (req: Request, res: Response) => {
  try {
    const { keywords, maxResults } = req.body as { keywords?: string[]; maxResults?: number }

    if (!keywords || keywords.length === 0) {
      res.status(400).json({ error: 'Missing required field: keywords' })
      return
    }

    const apifyToken = process.env.APIFY_API_TOKEN
    if (!apifyToken) {
      res.status(503).json({ error: 'APIFY_API_TOKEN not configured on server' })
      return
    }

    const limit = maxResults || 10

    // Build search queries that combine brand niche WITH producible content formats.
    // We want videos that ProAnimate can replicate: explainers, motion graphics, animated ads,
    // text-based content — NOT vlogs, talking heads, or random viral clips.
    const FORMAT_SUFFIXES = ['explainer', 'motion graphics', 'animated', 'ad']
    const nicheTerms = keywords.slice(0, 2) // e.g. ["custom software", "technology"]

    // For TikTok: build combined hashtags like "softwareexplainer", "techanimated"
    // instead of separate generic terms that return unrelated content
    const tiktokHashtags: string[] = []
    for (const niche of nicheTerms) {
      for (const fmt of FORMAT_SUFFIXES) {
        tiktokHashtags.push(`${niche} ${fmt}`.replace(/\s+/g, '').toLowerCase())
      }
    }
    // Also add some broad producible-content hashtags
    tiktokHashtags.push('explainervideo', 'motiongraphics', 'animatedexplainer', 'productanimation')

    // For YouTube: run multiple focused queries in parallel
    // Each query pairs the niche with a content format
    const youtubeQueries = [
      `${nicheTerms[0]} explainer video`,
      `${nicheTerms[0]} motion graphics`,
      `${nicheTerms.join(' ')} animated`,
    ]

    console.log(`[BrandDirector] Running Apify scrapers for niche: ${nicheTerms.join(', ')} (max ${limit})`)
    console.log(`[BrandDirector] TikTok hashtags: ${tiktokHashtags.join(', ')}`)
    console.log(`[BrandDirector] YouTube queries: ${youtubeQueries.join(' | ')}`)

    // Run TikTok + multiple YouTube queries in parallel
    const scraperPromises: Promise<unknown[]>[] = [
      runApifyActor(apifyToken, 'clockworks~free-tiktok-scraper', {
        excludePinnedPosts: true,
        hashtags: tiktokHashtags,
        resultsPerPage: limit * 2,
        shouldDownloadCovers: false,
        shouldDownloadSlideshowImages: false,
        shouldDownloadSubtitles: false,
        shouldDownloadVideos: false,
        searchSection: '',
      }),
      ...youtubeQueries.map((q) =>
        runApifyActor(apifyToken, 'streamers~youtube-scraper', {
          searchKeywords: q,
          maxResults: Math.ceil(limit / youtubeQueries.length) + 2,
          uploadDate: 'month',
        })
      ),
    ]

    const results = await Promise.allSettled(scraperPromises)

    const tiktokResult = results[0]
    const youtubeResults = results.slice(1)

    const tiktokVideos = tiktokResult.status === 'fulfilled' ? tiktokResult.value : []
    const youtubeVideos = youtubeResults
      .filter((r): r is PromiseFulfilledResult<unknown[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)

    if (tiktokResult.status === 'rejected') console.warn('[BrandDirector] TikTok scraper failed:', tiktokResult.reason)
    for (let i = 0; i < youtubeResults.length; i++) {
      if (youtubeResults[i].status === 'rejected') {
        console.warn(`[BrandDirector] YouTube scraper ${i} failed:`, (youtubeResults[i] as PromiseRejectedResult).reason)
      }
    }

    // Normalize TikTok results
    const items: Array<Record<string, unknown>> = []

    for (const v of (tiktokVideos as Record<string, any>[]).slice(0, 15)) {
      const views = v.playCount || v.plays || v.stats?.playCount || 0
      const likes = v.diggCount || v.likes || v.stats?.diggCount || 0
      const comments = v.commentCount || v.comments || v.stats?.commentCount || 0
      items.push({
        source: { platform: 'tiktok' },
        title: v.text || v.desc || 'Untitled',
        description: (v.text || v.desc || '').slice(0, 300),
        url: v.webVideoUrl || v.url || (v.id ? `https://www.tiktok.com/@${v.authorMeta?.name}/video/${v.id}` : undefined),
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        shareCount: v.shareCount || v.shares || v.stats?.shareCount || 0,
        engagementRate: views > 0 ? (likes + comments) / views : 0,
        authorUsername: v.authorMeta?.name || v.author?.uniqueId || '',
        authorDisplayName: v.authorMeta?.nickName || v.author?.nickname || '',
        authorFollowerCount: v.authorMeta?.fans || v.authorMeta?.followers || 0,
        thumbnailUrl: v.covers?.default || v.video?.cover || '',
        duration: v.videoMeta?.duration || v.video?.duration || 0,
        publishedAt: v.createTimeISO || (v.createTime ? new Date(v.createTime * 1000).toISOString() : ''),
        hashtags: (v.hashtags || []).map((h: any) => h.name || h).filter(Boolean),
      })
    }

    // Normalize YouTube results (streamers~youtube-scraper format) — deduplicate across queries
    const seenYoutubeUrls = new Set<string>()
    for (const v of (youtubeVideos as Record<string, any>[]).slice(0, 30)) {
      const url = v.url || (v.id ? `https://youtube.com/watch?v=${v.id}` : '')
      if (seenYoutubeUrls.has(url)) continue
      if (url) seenYoutubeUrls.add(url)
      const views = parseInt(v.viewCount || v.views || '0')
      const likes = parseInt(v.likes || v.likeCount || '0')
      const comments = parseInt(v.commentCount || v.numberOfComments || '0')
      items.push({
        source: { platform: 'youtube' },
        title: v.title || 'Untitled',
        description: (v.description || v.text || '').slice(0, 300),
        url: v.url || (v.id ? `https://youtube.com/watch?v=${v.id}` : undefined),
        viewCount: views,
        likeCount: likes,
        commentCount: comments,
        shareCount: 0,
        engagementRate: views > 0 ? (likes + comments) / views : 0,
        authorUsername: v.channelUsername || v.channelName || '',
        authorDisplayName: v.channelName || '',
        authorFollowerCount: 0, // streamers~youtube-scraper doesn't return subscriber count
        thumbnailUrl: v.thumbnailUrl || '',
        duration: v.duration || 0,
        publishedAt: v.date || v.publishedAt || v.uploadDate || '',
        hashtags: (v.hashtags || v.tags || []).filter(Boolean),
      })
    }

    // Filter out old videos — trending means recent (last 14 days max)
    const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const recentItems = items.filter((item) => {
      const publishedAt = item.publishedAt as string
      if (!publishedAt) return true // keep if no date (can't tell age)
      const publishedTime = new Date(publishedAt).getTime()
      if (isNaN(publishedTime)) return true // keep if unparseable
      return (now - publishedTime) <= MAX_AGE_MS
    })

    // Sort by views descending
    recentItems.sort((a, b) => ((b.viewCount as number) || 0) - ((a.viewCount as number) || 0))

    console.log(`[BrandDirector] Apify returned ${items.length} videos, ${recentItems.length} within last 14 days (TikTok: ${tiktokVideos.length}, YouTube: ${youtubeVideos.length})`)
    res.json({
      trends: {
        keywords,
        items: recentItems,
        fetchedAt: new Date().toISOString(),
        source: 'apify',
      },
    })
  } catch (err) {
    console.error('[BrandDirector] n8n-trends error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Apify scraper failed' })
  }
})

// ── Apify actor runner (shared module) ──

import { runApifyActor } from '../services/apifyRunner'

// ── POST /trends ──

router.post('/trends', async (req: Request, res: Response) => {
  try {
    const { keywords, industry, niche, sources } = req.body as {
      keywords?: string[]
      industry?: string
      niche?: string
      sources?: string[]
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      res.status(400).json({ error: 'Missing required field: keywords (array)' })
      return
    }

    const enabledSources = sources || ['youtube', 'gemini']
    const allItems: Array<{
      source: { platform: string; provider?: string }
      title: string
      description?: string
      url?: string
      viewCount?: number
      likeCount?: number
      engagementRate?: number
      publishedAt?: string
      thumbnailUrl?: string
      hashtags?: string[]
      category?: string
    }> = []
    let summary: string | undefined

    // Run all sources in parallel
    const results = await Promise.allSettled([
      // YouTube Data API
      enabledSources.includes('youtube') ? fetchYouTubeTrends(keywords) : Promise.resolve([]),

      // Gemini + Google Search
      enabledSources.includes('gemini') ? fetchGeminiTrends(keywords, industry || '', niche || '') : Promise.resolve({ items: [], summary: '' }),
    ])

    // Collect YouTube results
    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
      allItems.push(...results[0].value)
    } else if (results[0].status === 'rejected') {
      console.warn('[BrandDirector] YouTube trends failed:', results[0].reason)
    }

    // Collect Gemini results
    if (results[1].status === 'fulfilled') {
      const geminiResult = results[1].value as { items: typeof allItems; summary: string }
      allItems.push(...geminiResult.items)
      summary = geminiResult.summary
    } else if (results[1].status === 'rejected') {
      console.warn('[BrandDirector] Gemini trends failed:', results[1].reason)
    }

    // Sort by view count (highest first), then by engagement
    allItems.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))

    console.log(`[BrandDirector] Found ${allItems.length} trend items`)
    res.json({
      trends: {
        keywords,
        items: allItems,
        fetchedAt: new Date().toISOString(),
        summary,
      },
    })
  } catch (err) {
    console.error('[BrandDirector] trends error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' })
  }
})

// ── YouTube Data API v3 ──

async function fetchYouTubeTrends(keywords: string[]) {
  const apiKey = getYouTubeKey()
  if (!apiKey) {
    console.log('[BrandDirector] YOUTUBE_API_KEY not set, skipping YouTube trends')
    return []
  }

  const query = keywords.join(' | ')
  const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Search for videos
  const searchURL = `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    order: 'viewCount',
    publishedAfter,
    maxResults: '10',
    relevanceLanguage: 'en',
    key: apiKey,
  })

  const searchRes = await fetch(searchURL)
  if (!searchRes.ok) throw new Error(`YouTube search API error: ${searchRes.status}`)
  const searchData = await searchRes.json()

  const videoIds = (searchData.items || [])
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter(Boolean)
    .join(',')

  if (!videoIds) return []

  // Fetch video statistics
  const statsURL = `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
    part: 'statistics,snippet',
    id: videoIds,
    key: apiKey,
  })

  const statsRes = await fetch(statsURL)
  if (!statsRes.ok) throw new Error(`YouTube videos API error: ${statsRes.status}`)
  const statsData = await statsRes.json()

  return (statsData.items || []).map((video: {
    id: string
    snippet: { title: string; description: string; publishedAt: string; thumbnails?: { medium?: { url: string } } }
    statistics: { viewCount?: string; likeCount?: string }
  }) => ({
    source: { platform: 'youtube' as const },
    title: video.snippet.title,
    description: video.snippet.description?.slice(0, 200),
    url: `https://youtube.com/watch?v=${video.id}`,
    viewCount: parseInt(video.statistics.viewCount || '0'),
    likeCount: parseInt(video.statistics.likeCount || '0'),
    publishedAt: video.snippet.publishedAt,
    thumbnailUrl: video.snippet.thumbnails?.medium?.url,
  }))
}

// ── Gemini + Google Search ──

async function fetchGeminiTrends(keywords: string[], industry: string, niche: string) {
  const prompt = `You are a viral content researcher. Find 8-12 specific trending short-form videos in the ${niche || 'general'} / ${industry || 'business'} space.

Keywords: ${keywords.join(', ')}

Search for actual viral TikTok, YouTube Shorts, and Instagram Reels in this niche.

IMPORTANT: Return your response as a JSON object with this exact structure:
{
  "summary": "2-3 sentence overview of current trends in this niche",
  "items": [
    {
      "title": "Short descriptive title of the trend or video",
      "description": "1-2 sentence description of the content and why it works",
      "url": "URL if found, or null",
      "platform": "youtube | tiktok | instagram",
      "viewCount": approximate number or null,
      "category": "format type like 'humor', 'tutorial', 'storytime', 'comparison'"
    }
  ]
}

Focus on actual trending content, not generic advice. Include real video titles and URLs when possible.`

  const text = await callGemini(prompt, false, true)

  const items: Array<{
    source: { platform: string }
    title: string
    description?: string
    url?: string
    viewCount?: number
    category?: string
  }> = []
  let summary = ''

  // Try to extract JSON from the response
  try {
    // Find JSON block in the response (may be wrapped in markdown code fences)
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const jsonMatch = cleaned.match(/\{[\s\S]*"items"[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      summary = parsed.summary || ''
      for (const item of (parsed.items || [])) {
        items.push({
          source: { platform: item.platform || 'gemini-search' },
          title: item.title || '',
          description: item.description,
          url: item.url || undefined,
          viewCount: typeof item.viewCount === 'number' ? item.viewCount : undefined,
          category: item.category,
        })
      }
    }
  } catch {
    // JSON parse failed — fall back to section-based text parsing
    console.warn('[BrandDirector] Gemini trends JSON parse failed, falling back to text parsing')
  }

  // Fallback: if JSON parsing found nothing, do section-based parsing
  if (items.length === 0) {
    summary = text.slice(0, 500)
    // Split by double newlines or numbered items to find topic blocks
    const blocks = text.split(/\n{2,}|\n(?=\d+[\.\)])/).filter((b) => b.trim().length > 30)
    for (const block of blocks.slice(0, 12)) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      // First line (cleaned) is the title
      const titleLine = lines[0]?.replace(/^[\d\.\)\-\*•]+\s*/, '').replace(/\*\*/g, '').trim()
      if (!titleLine || titleLine.length < 5) continue
      // Rest is description
      const descLines = lines.slice(1).map((l) => l.replace(/\*\*/g, '').replace(/^[\-\*•]\s*/, '').trim())
      // Extract URL if present
      const urlMatch = block.match(/https?:\/\/[^\s\)]+/)
      items.push({
        source: { platform: 'gemini-search' },
        title: titleLine.slice(0, 120),
        description: descLines.join(' ').slice(0, 300) || undefined,
        url: urlMatch?.[0],
      })
    }
  }

  return { items: items.slice(0, 15), summary: summary || text.slice(0, 500) }
}

export default router
