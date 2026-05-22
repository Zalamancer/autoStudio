/**
 * Brand Director service: website analysis, trend discovery, and video idea generation.
 *
 * - analyze-url and trends: calls server endpoints (CORS-free)
 * - idea generation: client-side Gemini call (reuses VITE_GEMINI_API_KEY)
 * - buildBrandAwarePrompt: constructs orchestrator prompt from selected idea
 */
import type {
  BrandProfile,
  BrandImage,
  TrendData,
  VideoIdea,
  AnalyzeURLResponse,
  FetchTrendsResponse,
  SocialPresence,
  MentionsSummary,
  CompetitorProfile,
  CompetitiveAnalysis,
  ViralityEvidence,
  TrendItem,
  IdeaSourceEvidence,
} from '@/types/brandDirector'
import type { TokenUsage } from '@/types/orchestrator'
import { callGeminiProxy } from '@/services/aiProxy'

const PROXY_MODEL = 'gemini-3.1-flash-lite-preview'

/**
 * Attempt to recover complete JSON objects from a truncated array.
 * e.g. `[{...}, {... (cut off)` → parse the complete objects only.
 */
function repairTruncatedJsonArray(text: string): unknown[] | null {
  if (!text.startsWith('[')) return null
  // Find all complete top-level objects by matching balanced braces
  const objects: unknown[] = []
  let depth = 0
  let start = -1
  let inString = false
  let escape = false
  for (let i = 1; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\' && inString) {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && start >= 0) {
        try {
          objects.push(JSON.parse(text.slice(start, i + 1)))
        } catch {
          /* skip malformed object */
        }
        start = -1
      }
    }
  }
  return objects.length > 0 ? objects : null
}

// ── Server API calls ──

export async function analyzeBusinessURL(url: string): Promise<AnalyzeURLResponse> {
  const res = await fetch('/api/brand-director/analyze-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }

  return res.json()
}

export async function fetchNicheTrends(keywords: string[], industry: string, niche: string): Promise<TrendData> {
  // Try n8n + Apify first (real scraped data with full author/engagement metrics)
  try {
    const n8nRes = await fetch('/api/brand-director/n8n-trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, maxResults: 15 }),
    })
    if (n8nRes.ok) {
      const data = await n8nRes.json()
      if (data.trends?.items?.length > 0) {
        console.log(`[BrandDirector] Got ${data.trends.items.length} videos from n8n + Apify`)
        return data.trends
      }
    }
  } catch (err) {
    console.warn('[BrandDirector] n8n trends failed, falling back to YouTube+Gemini:', err)
  }

  // Fallback: YouTube API + Gemini search grounding
  const res = await fetch('/api/brand-director/trends', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords, industry, niche }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }
  const data: FetchTrendsResponse = await res.json()
  return data.trends
}

// ── Brand Intelligence API calls ──

export async function fetchSocialPresence(brandName: string, url: string): Promise<SocialPresence> {
  const res = await fetch('/api/brand-director/social-presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandName, url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }
  return res.json()
}

export async function fetchMentions(
  brandName: string,
  keywords: string[],
  industry?: string,
): Promise<MentionsSummary> {
  const res = await fetch('/api/brand-director/mentions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandName, keywords, industry }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }
  return res.json()
}

export async function discoverCompetitors(
  brandName: string,
  industry: string,
  niche: string,
  products: string[],
): Promise<Array<{ name: string; url: string; relevance: number; reason?: string }>> {
  const res = await fetch('/api/brand-director/competitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandName, industry, niche, products }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }
  const data = await res.json()
  return data.competitors
}

export async function analyzeCompetitor(url: string): Promise<CompetitorProfile> {
  const res = await fetch('/api/brand-director/analyze-competitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }
  const data = await res.json()
  return {
    ...data.profile,
    id: crypto.randomUUID(),
    source: 'auto-discovered' as const,
    analyzedAt: new Date().toISOString(),
  }
}

export async function fetchCompetitiveAnalysis(
  brandProfile: BrandProfile,
  competitorProfiles: CompetitorProfile[],
): Promise<CompetitiveAnalysis> {
  const res = await fetch('/api/brand-director/competitive-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandProfile, competitorProfiles }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }
  const data = await res.json()
  return data.analysis
}

// ── Virality analysis ──

export async function analyzeViralityEvidence(
  trendItems: TrendItem[],
  industry: string,
  niche: string,
): Promise<ViralityEvidence> {
  // Only send items that have real video data (not gemini-search text items)
  const itemsToAnalyze = trendItems.map((t) => ({
    title: t.title,
    url: t.url,
    thumbnailUrl: t.thumbnailUrl,
    platform: t.source.platform,
    viewCount: t.viewCount,
    likeCount: t.likeCount,
    commentCount: t.commentCount,
    shareCount: t.shareCount,
    engagementRate: t.engagementRate,
    publishedAt: t.publishedAt,
    hashtags: t.hashtags,
    authorUsername: t.authorUsername,
    authorDisplayName: t.authorDisplayName,
    authorFollowerCount: t.authorFollowerCount,
    duration: t.duration,
    description: t.description,
    category: t.category,
  }))

  const res = await fetch('/api/brand-director/analyze-virality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trendItems: itemsToAnalyze, industry, niche }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `Server error: ${res.status}`)
  }

  return res.json()
}

// ── Client-side idea generation (Gemini) ──

export async function generateVideoIdeas(
  profile: BrandProfile,
  trends: TrendData,
  count = 5,
  viralityEvidence?: ViralityEvidence | null,
): Promise<{ ideas: VideoIdea[]; tokenUsage: TokenUsage | null }> {
  // Minimum views threshold — items below this are considered unverified/unreliable
  const MIN_CREDIBLE_VIEWS = 1000

  // Build enriched trend summary with engagement data
  const selectedTrends = trends.items.slice(0, 15)
  const topTrends = selectedTrends
    .map((t, i) => {
      const hasRealMetrics = (t.viewCount ?? 0) >= MIN_CREDIBLE_VIEWS
      const views = t.viewCount ? `${(t.viewCount / 1000).toFixed(0)}K views` : ''
      const likes = t.likeCount ? `${(t.likeCount / 1000).toFixed(0)}K likes` : ''
      const followers = t.authorFollowerCount ? `${(t.authorFollowerCount / 1000).toFixed(0)}K followers` : ''
      const engagement = t.engagementRate ? `${(t.engagementRate * 100).toFixed(1)}% engagement` : ''
      const ratio =
        t.authorFollowerCount && t.viewCount && t.authorFollowerCount > 0
          ? `views/follower: ${(t.viewCount / t.authorFollowerCount).toFixed(2)}x`
          : ''
      const hashtagStr = t.hashtags?.length ? `hashtags: ${t.hashtags.slice(0, 5).join(', ')}` : ''
      const metrics = [views, likes, followers, engagement, ratio, hashtagStr].filter(Boolean).join(' | ')
      const tag = hasRealMetrics
        ? ''
        : ' ⚠️ UNVERIFIED (no reliable metrics — do NOT cite as evidence for viral engagement)'
      return `${i + 1}. [${t.source.platform}] "${t.title}" — ${metrics || 'no metrics'}${tag}`
    })
    .join('\n')

  // Build virality context if available
  let viralityContext = ''
  if (viralityEvidence && viralityEvidence.breakdowns.length > 0) {
    const breakdownSummaries = viralityEvidence.breakdowns
      .slice(0, 10)
      .map(
        (b) =>
          `- [${b.platform}] "${b.title}" (${b.performanceVsBaseline}): ${b.whyViral} Key factors: ${b.keyFactors.join(', ')}`,
      )
      .join('\n')

    viralityContext = `
VIRALITY ANALYSIS (why these videos performed well):
${breakdownSummaries}

Common patterns: ${viralityEvidence.commonPatterns.join('; ')}
Niche assessment: ${viralityEvidence.nicheAssessment}
`
  }

  const prompt = `You are a viral video strategist for short-form content (TikTok, YouTube Shorts, Reels).

BUSINESS PROFILE:
- Name: ${profile.businessName}
- Industry: ${profile.industry}
- Niche: ${profile.niche}
- Target Audience: ${profile.targetAudience.join(', ')}
- Products/Services: ${profile.products.join(', ')}
- Brand Values: ${profile.brandValues.join(', ')}
- Tone: ${profile.tone}
- Description: ${profile.description}

TRENDING CONTENT IN THIS NICHE (with engagement data):
${topTrends}

${trends.summary ? `TREND ANALYSIS:\n${trends.summary}\n` : ''}${viralityContext}

Based on the business profile, current trends, and virality analysis, generate exactly ${count} video ideas that would perform well for this brand. Each idea should:
1. Align with at least one current trend — cite the SPECIFIC source video(s) by index number
2. Be authentic to the brand's tone and values
3. Appeal to the target audience
4. Be achievable as a short-form animated video (15-90 seconds)
5. Borrow specific successful elements (format, hook style, pacing) from the source videos

CRITICAL RULES FOR ENGAGEMENT RATINGS:
- "viral" = ONLY if backed by source videos with 500K+ views AND strong engagement metrics
- "high" = source videos have 100K+ views with proven engagement
- "medium" = source videos have 10K+ views or strong engagement rate
- "low" = sources have limited data or the concept is experimental
- Items marked ⚠️ UNVERIFIED have no reliable metrics — do NOT use them as the primary basis for a "viral" or "high" rating
- A video with 0-1000 views is NOT evidence of virality regardless of its title
- NEVER cite unverified/low-view sources as evidence that an idea will go "viral"

Return a JSON array of objects with these exact fields:
[
  {
    "id": "idea-1",
    "title": "string - catchy video title (under 60 chars)",
    "concept": "string - 2-3 sentence description of the video content and flow",
    "trendAlignment": "string - explain which trend this leverages and why it would work",
    "suggestedTemplateStyle": "string - e.g. 'explainer with infographics', 'product showcase', 'dialogue debate', 'storytelling narrative'",
    "estimatedEngagement": "low | medium | high | viral",
    "suggestedDuration": number (seconds, 15-90),
    "suggestedAspectRatio": "9:16 | 16:9 | 1:1",
    "tags": ["string array - 3-5 relevant hashtags without #"],
    "sourceEvidence": [
      {
        "sourceIndex": number (0-based index into the trending content list above — ONLY cite sources with real view data),
        "connectionReasoning": "string - why this source video inspired this idea, citing specific metrics",
        "aspectBorrowed": "string - specific element borrowed (e.g. 'hook format', 'storytelling structure', 'visual style')"
      }
    ],
    "reasoningChain": "string - your full thought process: which trends you noticed → their actual performance data → how you adapted them for this brand",
    "engagementRationale": "string - why you rated this engagement level, citing SPECIFIC view counts and engagement rates from source videos"
  }
]

Each idea MUST have at least 1 sourceEvidence entry (max 3) — prefer sources with verified metrics. Rank by estimated engagement (best first). Be creative but realistic.`

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 16384,
      responseMimeType: 'application/json',
    },
  }

  const res = await callGeminiProxy(GEMINI_API_URL, requestBody)

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error (${res.status}): ${err}`)
  }

  const data = await res.json()

  // Gemini 2.5 Flash may return thinking parts before the actual text.
  // Find the last non-thought text part.
  const parts: Array<{ text?: string; thought?: boolean }> = data?.candidates?.[0]?.content?.parts || []
  const textPart = [...parts].reverse().find((p) => p.text && !p.thought)
  const text = textPart?.text || ''

  if (!text) {
    console.error(
      '[BrandDirector] Empty Gemini response. Parts:',
      JSON.stringify(parts.map((p) => ({ thought: !!p.thought, len: p.text?.length ?? 0 }))),
    )
    throw new Error('Empty response from AI — please retry')
  }

  interface RawSourceEvidence {
    sourceIndex: number
    connectionReasoning: string
    aspectBorrowed: string
  }

  let rawIdeas: Array<Omit<VideoIdea, 'sourceEvidence'> & { sourceEvidence?: RawSourceEvidence[] }>
  try {
    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // JSON might be truncated — try to salvage complete objects from the array
      const repaired = repairTruncatedJsonArray(cleaned)
      if (repaired) {
        parsed = repaired
        console.warn('[BrandDirector] Recovered truncated JSON, got', (parsed as unknown[]).length, 'ideas')
      }
    }
    // Handle both raw array and { ideas: [...] } wrapper
    rawIdeas = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).ideas)
        ? ((parsed as Record<string, unknown>).ideas as typeof rawIdeas)
        : (null as never)
    if (!rawIdeas) throw new Error('unexpected shape')
  } catch {
    console.error('[BrandDirector] JSON parse failed. Text preview:', text.slice(0, 500))
    throw new Error('Failed to parse video ideas from AI response')
  }

  // Post-process: resolve source indices to actual TrendItem data
  // Drop citations to sources with negligible views (AI sometimes ignores instructions)
  const ideas: VideoIdea[] = rawIdeas.map((idea, i) => {
    const resolvedEvidence: IdeaSourceEvidence[] = (idea.sourceEvidence || [])
      .filter((se) => se.sourceIndex >= 0 && se.sourceIndex < selectedTrends.length)
      .map((se) => {
        const src = selectedTrends[se.sourceIndex]
        return {
          breakdownIndex: se.sourceIndex,
          sourceTitle: src.title,
          sourceUrl: src.url,
          sourceThumbnail: src.thumbnailUrl,
          sourcePlatform: src.source.platform,
          connectionReasoning: se.connectionReasoning,
          aspectBorrowed: se.aspectBorrowed,
          _viewCount: src.viewCount ?? 0, // temporary for filtering
        }
      })
      // Drop sources with < MIN_CREDIBLE_VIEWS — they aren't credible evidence
      .filter((se) => {
        const views = (se as IdeaSourceEvidence & { _viewCount: number })._viewCount
        return views >= MIN_CREDIBLE_VIEWS
      })
      .map(({ _viewCount, ...rest }) => rest as IdeaSourceEvidence)

    // Downgrade engagement rating if all source evidence was dropped
    let engagement = idea.estimatedEngagement
    const hadSources = (idea.sourceEvidence || []).length > 0
    const hasCredibleSources = resolvedEvidence.length > 0
    if (hadSources && !hasCredibleSources) {
      // AI cited sources but none had credible metrics — cap at "medium"
      if (engagement === 'viral' || engagement === 'high') {
        engagement = 'medium'
      }
    }
    // Also cap "viral" unless at least one source has 100K+ views
    if (engagement === 'viral') {
      const maxSourceViews = resolvedEvidence.reduce((max, se) => {
        const src = selectedTrends[se.breakdownIndex]
        return Math.max(max, src?.viewCount ?? 0)
      }, 0)
      if (maxSourceViews < 100_000) {
        engagement = 'high'
      }
    }

    return {
      ...idea,
      id: idea.id || `idea-${i + 1}`,
      estimatedEngagement: engagement,
      sourceEvidence: resolvedEvidence.length > 0 ? resolvedEvidence : undefined,
    }
  })

  // Extract token usage
  const usageMeta = data?.usageMetadata
  const tokenUsage: TokenUsage | null = usageMeta
    ? {
        promptTokenCount: usageMeta.promptTokenCount || 0,
        candidatesTokenCount: usageMeta.candidatesTokenCount || 0,
        totalTokenCount: usageMeta.totalTokenCount || 0,
      }
    : null

  return { ideas, tokenUsage }
}

// ── Prompt builder ──

export function buildBrandAwarePrompt(idea: VideoIdea, profile: BrandProfile, images: BrandImage[]): string {
  const imageNote =
    images.length > 0
      ? `\nThe orchestrator has ${images.length} brand image(s) available as overlays (logo, product photos). Use them as stock media overlays where they add visual value.`
      : ''

  return `Create a ${idea.suggestedDuration}-second ${idea.suggestedAspectRatio} video: "${idea.title}"

CONCEPT: ${idea.concept}

BRAND CONTEXT (ensure brand consistency throughout):
- Business: ${profile.businessName} (${profile.industry} / ${profile.niche})
- Target audience: ${profile.targetAudience.join(', ')}
- Products/services: ${profile.products.join(', ')}
- Brand tone: ${profile.tone}
- Brand colors: ${profile.primaryColors.join(', ')} — use these in shapes, text overlays, and HTML template configs
${profile.tagline ? `- Tagline: "${profile.tagline}"` : ''}
- Brand values: ${profile.brandValues.join(', ')}

TREND ALIGNMENT: ${idea.trendAlignment}

STYLE DIRECTION: ${idea.suggestedTemplateStyle}
${imageNote}

Make this video feel like it comes from ${profile.businessName}. Match the brand tone throughout dialogue and visuals. Use brand colors in shapes, text overlays, and template config overrides. Speak directly to ${profile.targetAudience[0] || 'the target audience'}.

Tags: ${idea.tags.map((t) => `#${t}`).join(' ')}`
}
