/**
 * Trend Spotter Service — Uses Gemini with Google Search grounding to find
 * real-time trending topics. Falls back to curated defaults when the API
 * is unavailable or the key is not configured.
 */

import { withCreditGate } from './creditGate'

export interface TrendItem {
  id: string
  topic: string
  description: string
  hashtags: string[]
  suggestedFormat: string
  trendScore: number // 0-100
  orchestratorPrompt: string // Ready-to-use prompt for the orchestrator
}

export interface TrendResults {
  trends: TrendItem[]
  niche: string
  fetchedAt: number
}

const PROXY_URL = '/api/proxy/gemini/gemini-3.1-flash-lite-preview'
const DIRECT_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

// ── Curated fallback topics per niche ──────────────────────────────────

const CURATED_DEFAULTS: Record<string, TrendItem[]> = {
  general: [
    { id: 'default-0', topic: 'AI Tools Everyone Should Know', description: 'AI productivity tools are reshaping how people work and create content.', hashtags: ['#AI', '#Productivity', '#Tech', '#Tools'], suggestedFormat: 'educational', trendScore: 82, orchestratorPrompt: 'Create a 30-second animated video listing 5 AI tools that save time, with quick demos and bold text overlays.' },
    { id: 'default-1', topic: 'Life Hacks That Actually Work', description: 'Practical everyday life hacks continue to drive massive engagement.', hashtags: ['#LifeHacks', '#Tips', '#Hacks'], suggestedFormat: 'how-to', trendScore: 78, orchestratorPrompt: 'Create a 30-second animated video showing 3 surprising life hacks with step-by-step visuals.' },
    { id: 'default-2', topic: 'Morning Routine for Success', description: 'Optimized morning routines are a perennial high-engagement format.', hashtags: ['#MorningRoutine', '#Motivation', '#Productivity'], suggestedFormat: 'educational', trendScore: 75, orchestratorPrompt: 'Create a 30-second animated video showing a 5-step morning routine for peak productivity.' },
    { id: 'default-3', topic: 'Money Mistakes in Your 20s', description: 'Personal finance content targeting young adults always resonates.', hashtags: ['#Finance', '#MoneyTips', '#Investing'], suggestedFormat: 'educational', trendScore: 74, orchestratorPrompt: 'Create a 30-second animated video about the top 5 money mistakes people make in their 20s and how to avoid them.' },
    { id: 'default-4', topic: 'Fun Science Facts', description: 'Mind-blowing science facts drive shares and saves across all platforms.', hashtags: ['#Science', '#Facts', '#DidYouKnow'], suggestedFormat: 'entertainment', trendScore: 70, orchestratorPrompt: 'Create a 30-second animated video revealing 3 mind-blowing science facts with colorful visuals.' },
  ],
  tech: [
    { id: 'default-0', topic: 'Coding with AI Assistants', description: 'AI pair programming tools are transforming software development workflows.', hashtags: ['#CodingWithAI', '#DevTools', '#Programming'], suggestedFormat: 'educational', trendScore: 85, orchestratorPrompt: 'Create a 30-second animated video showing how AI coding assistants boost developer productivity.' },
    { id: 'default-1', topic: 'Best Free APIs for Side Projects', description: 'Developers love discovering free APIs they can integrate into side projects.', hashtags: ['#APIs', '#WebDev', '#SideProject'], suggestedFormat: 'educational', trendScore: 78, orchestratorPrompt: 'Create a 30-second animated video listing 5 free APIs every developer should try.' },
    { id: 'default-2', topic: 'Open Source Alternatives', description: 'Open source replacements for paid SaaS tools attract huge engagement.', hashtags: ['#OpenSource', '#FreeSoftware', '#Tech'], suggestedFormat: 'educational', trendScore: 76, orchestratorPrompt: 'Create a 30-second animated video comparing 3 paid tools with their free open-source alternatives.' },
    { id: 'default-3', topic: 'Smartphone Hidden Features', description: 'Undiscovered phone features drive curiosity and shares.', hashtags: ['#PhoneTips', '#TechTips', '#Hidden'], suggestedFormat: 'how-to', trendScore: 72, orchestratorPrompt: 'Create a 30-second animated video revealing 3 hidden smartphone features most people do not know about.' },
    { id: 'default-4', topic: 'Future of Wearable Tech', description: 'Next-gen wearables continue to fascinate tech enthusiasts.', hashtags: ['#Wearables', '#FutureTech', '#Innovation'], suggestedFormat: 'commentary', trendScore: 68, orchestratorPrompt: 'Create a 30-second animated video exploring what wearable tech will look like in 5 years.' },
  ],
  business: [
    { id: 'default-0', topic: 'Side Hustle Ideas for 2025', description: 'Low-investment side hustle opportunities remain a top-performing topic.', hashtags: ['#SideHustle', '#Entrepreneur', '#Business'], suggestedFormat: 'educational', trendScore: 80, orchestratorPrompt: 'Create a 30-second animated video listing 5 side hustle ideas that require less than $100 to start.' },
    { id: 'default-1', topic: 'Personal Branding Tips', description: 'Building a personal brand on social media is essential for entrepreneurs.', hashtags: ['#PersonalBrand', '#Marketing', '#Growth'], suggestedFormat: 'how-to', trendScore: 75, orchestratorPrompt: 'Create a 30-second animated video explaining 3 key personal branding tips for social media growth.' },
    { id: 'default-2', topic: 'Startup Mistakes to Avoid', description: 'Cautionary tales of common startup pitfalls generate saves and shares.', hashtags: ['#Startup', '#Founder', '#Mistakes'], suggestedFormat: 'educational', trendScore: 72, orchestratorPrompt: 'Create a 30-second animated video covering the top 3 mistakes first-time founders make.' },
  ],
  health: [
    { id: 'default-0', topic: 'Desk Stretches for Remote Workers', description: 'Quick stretch routines for desk workers combat sedentary lifestyle concerns.', hashtags: ['#DeskStretches', '#WFH', '#Health'], suggestedFormat: 'how-to', trendScore: 78, orchestratorPrompt: 'Create a 30-second animated video demonstrating 5 quick desk stretches you can do between meetings.' },
    { id: 'default-1', topic: 'Sleep Hygiene Tips', description: 'Better sleep content consistently ranks among top health topics.', hashtags: ['#Sleep', '#Health', '#Wellness'], suggestedFormat: 'educational', trendScore: 75, orchestratorPrompt: 'Create a 30-second animated video explaining 4 science-backed tips for better sleep quality.' },
    { id: 'default-2', topic: 'Gut Health Basics', description: 'The gut microbiome and its link to overall health fascinate audiences.', hashtags: ['#GutHealth', '#Nutrition', '#Wellness'], suggestedFormat: 'educational', trendScore: 73, orchestratorPrompt: 'Create a 30-second animated video about how gut health affects your mood and immune system.' },
  ],
  entertainment: [
    { id: 'default-0', topic: 'Movie Plot Explained in 30 Seconds', description: 'Ultra-short movie explanations drive massive engagement and shares.', hashtags: ['#MovieExplained', '#FilmTok', '#Movies'], suggestedFormat: 'entertainment', trendScore: 82, orchestratorPrompt: 'Create a 30-second animated video explaining a popular movie plot twist with dramatic narration.' },
    { id: 'default-1', topic: 'Video Game Easter Eggs', description: 'Hidden secrets in popular games generate curiosity and replay value.', hashtags: ['#EasterEggs', '#Gaming', '#Secrets'], suggestedFormat: 'entertainment', trendScore: 76, orchestratorPrompt: 'Create a 30-second animated video revealing 3 hidden easter eggs in popular video games.' },
    { id: 'default-2', topic: 'Celebrity Fun Facts', description: 'Little-known facts about celebrities are always shareable.', hashtags: ['#CelebFacts', '#FunFacts', '#Celebrities'], suggestedFormat: 'entertainment', trendScore: 70, orchestratorPrompt: 'Create a 30-second animated video sharing 3 surprising facts about a famous celebrity.' },
  ],
  education: [
    { id: 'default-0', topic: 'Study Techniques That Work', description: 'Evidence-based study methods help students learn more efficiently.', hashtags: ['#StudyTips', '#Learning', '#Education'], suggestedFormat: 'educational', trendScore: 80, orchestratorPrompt: 'Create a 30-second animated video explaining 3 proven study techniques backed by science.' },
    { id: 'default-1', topic: 'History in 30 Seconds', description: 'Bite-sized history lessons are perfect for short-form content.', hashtags: ['#History', '#DidYouKnow', '#Learn'], suggestedFormat: 'educational', trendScore: 75, orchestratorPrompt: 'Create a 30-second animated video explaining a fascinating historical event in simple terms.' },
    { id: 'default-2', topic: 'Psychology Tricks for Daily Life', description: 'Applied psychology hacks are extremely shareable and practical.', hashtags: ['#Psychology', '#MindHacks', '#SelfImprovement'], suggestedFormat: 'how-to', trendScore: 74, orchestratorPrompt: 'Create a 30-second animated video teaching 3 psychology tricks that work in everyday conversations.' },
  ],
}

/**
 * Return curated fallback trends for a given niche.
 */
function getCuratedDefaults(niche: string): TrendResults {
  const trends = CURATED_DEFAULTS[niche] || CURATED_DEFAULTS['general'] || []
  return {
    trends,
    niche,
    fetchedAt: Date.now(),
  }
}

/**
 * Fetch trending topics for a given niche using Gemini + Google Search grounding.
 * Falls back to curated defaults when the API call fails or the key is missing.
 */
export async function fetchTrends(niche: string = 'general'): Promise<TrendResults> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

  // If no API key, return curated defaults immediately
  if (!apiKey) {
    return getCuratedDefaults(niche)
  }

  try {
    return await withCreditGate('gemini-script', async () => {
      const prompt = `You are a social media trend analyst. Find 5-7 currently trending topics for the "${niche}" niche that would work great as short-form animated videos (TikTok, YouTube Shorts, Instagram Reels).

For each trend provide:
- The trending topic/theme
- A brief description of why it's trending
- Relevant hashtags (3-5)
- Suggested video format (educational, entertainment, commentary, how-to, debate)
- A trend score (0-100, how viral/timely this is)
- A ready-to-use prompt for an AI video generator

Return JSON:
{
  "trends": [
    {
      "topic": "...",
      "description": "...",
      "hashtags": ["#...", "#..."],
      "suggestedFormat": "educational",
      "trendScore": 85,
      "orchestratorPrompt": "Create a 30-second animated video explaining..."
    }
  ]
}`

      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
        tools: [{ googleSearch: {} }],
      }

      let response: Response
      try {
        response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (response.status === 503) throw new Error('proxy unavailable')
      } catch {
        response = await fetch(`${DIRECT_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`)

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)

      const trends: TrendItem[] = (parsed.trends || []).map(
        (t: Record<string, unknown>, i: number) => ({
          id: `trend-${i}`,
          topic: String(t.topic || ''),
          description: String(t.description || ''),
          hashtags: Array.isArray(t.hashtags) ? t.hashtags.map(String) : [],
          suggestedFormat: String(t.suggestedFormat || 'educational'),
          trendScore: Number(t.trendScore) || 50,
          orchestratorPrompt: String(t.orchestratorPrompt || ''),
        }),
      )

      if (trends.length === 0) {
        // Gemini returned empty — use curated defaults
        return getCuratedDefaults(niche)
      }

      return {
        trends: trends.sort((a, b) => b.trendScore - a.trendScore),
        niche,
        fetchedAt: Date.now(),
      }
    })
  } catch {
    // Gemini failed — fall back to curated defaults
    return getCuratedDefaults(niche)
  }
}
