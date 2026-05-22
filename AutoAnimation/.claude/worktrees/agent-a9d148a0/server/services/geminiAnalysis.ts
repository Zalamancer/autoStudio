/**
 * Gemini Analysis Layer: deep AI-powered performance analysis.
 * Sends project features + performance history to Gemini 2.0 Flash
 * for natural language insights and recommendations.
 */

import { getSupabaseAdmin } from '../middleware/supabaseAuth'

// ── Types ──

interface GeminiInsight {
  title: string
  description: string
  confidence: number
  category: string
  impact: 'high' | 'medium' | 'low'
}

interface GeminiRecommendation {
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  actionType: string | null
  actionPayload: Record<string, unknown>
}

interface GeminiTrend {
  title: string
  description: string
  direction: 'improving' | 'declining' | 'stable'
}

export interface GeminiAnalysisResult {
  insights: GeminiInsight[]
  recommendations: GeminiRecommendation[]
  trends: GeminiTrend[]
}

// ── Gemini API ──

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const resp = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Gemini API error: ${resp.status} - ${err}`)
  }

  const data = await resp.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Analysis Functions ──

/**
 * Deep analysis of a user's content performance history.
 * Compares project features across posts and identifies patterns.
 */
export async function analyzePerformance(
  userId: string,
  platform?: string
): Promise<GeminiAnalysisResult> {
  const supabase = getSupabaseAdmin()

  // Fetch recent snapshots with performance data
  let query = supabase
    .from('project_snapshots')
    .select(`
      aspect_ratio, fps, duration_seconds, character_count,
      emotion_distribution, dialogue_line_count, total_script_word_count,
      voice_count, animation_count, has_lottie_background, has_svg_animations,
      has_html_templates, caption_style, text_overlay_count, has_title, has_cta,
      script_sentiment, platform, posting_hour, posting_day_of_week,
      performance_records!inner(views, likes, comments, shares, saves, engagement_rate, avg_watch_time_sec, performance_score)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (platform) {
    query = query.eq('platform', platform)
  }

  const { data: history, error } = await query

  if (error || !history || history.length < 2) {
    return { insights: [], recommendations: [], trends: [] }
  }

  // Build prompt
  const historyText = history.map((post: any, i: number) => {
    const perf = Array.isArray(post.performance_records) ? post.performance_records[0] : post.performance_records
    return `Post ${i + 1}: platform=${post.platform}, aspect_ratio=${post.aspect_ratio}, duration=${post.duration_seconds}s, characters=${post.character_count}, dialogue_lines=${post.dialogue_line_count}, words=${post.total_script_word_count}, voices=${post.voice_count}, animations=${post.animation_count}, lottie_bg=${post.has_lottie_background}, svg=${post.has_svg_animations}, html_templates=${post.has_html_templates}, captions=${post.caption_style || 'none'}, text_overlays=${post.text_overlay_count}, title=${post.has_title}, cta=${post.has_cta}, sentiment=${post.script_sentiment || 'unknown'}, posting_hour=${post.posting_hour}, posting_day=${post.posting_day_of_week}, emotions=${JSON.stringify(post.emotion_distribution)}, METRICS: views=${perf?.views || 0}, likes=${perf?.likes || 0}, comments=${perf?.comments || 0}, shares=${perf?.shares || 0}, saves=${perf?.saves || 0}, engagement_rate=${perf?.engagement_rate || 0}%, watch_time=${perf?.avg_watch_time_sec || 0}s, score=${perf?.performance_score || 0}/100`
  }).join('\n')

  const prompt = `You are a social media content performance analyst for short-form animated character videos.

Analyze the following publishing history and identify patterns, insights, and actionable recommendations.

CONTENT HISTORY (${history.length} posts):
${historyText}

Return your analysis as JSON with this exact structure:
{
  "insights": [
    {
      "title": "Short headline (max 10 words)",
      "description": "2-3 sentence explanation of the finding",
      "confidence": 0.0-1.0,
      "category": "duration|aspect_ratio|emotion|caption_style|posting_time|voice|animation|general",
      "impact": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "title": "Short actionable title",
      "description": "What to change and why",
      "category": "duration|aspect_ratio|caption_style|posting_time|emotion|voice|animation|general",
      "priority": "high|medium|low",
      "actionType": "set_aspect_ratio|set_duration|set_caption_style|add_cta|change_posting_time|add_emotion|null",
      "actionPayload": {}
    }
  ],
  "trends": [
    {
      "title": "Trend headline",
      "description": "What is changing over time",
      "direction": "improving|declining|stable"
    }
  ]
}

Rules:
- Base insights on actual data patterns, not assumptions
- Limit to 3-5 insights, 3-5 recommendations, and 1-3 trends
- For actionType, only use the enum values listed above or null
- For actionPayload, use the format: {"aspectRatio": "9:16"} for set_aspect_ratio, {"durationSeconds": 25} for set_duration, {"captionStyle": "word-by-word"} for set_caption_style, {"suggestedHour": 20} for change_posting_time
- Confidence should reflect how strongly the data supports the insight
- Focus on the most impactful, actionable findings`

  const resultText = await callGemini(prompt)

  try {
    const parsed = JSON.parse(resultText) as GeminiAnalysisResult
    return {
      insights: parsed.insights || [],
      recommendations: parsed.recommendations || [],
      trends: parsed.trends || [],
    }
  } catch {
    console.error('[GeminiAnalysis] Failed to parse response:', resultText.slice(0, 200))
    return { insights: [], recommendations: [], trends: [] }
  }
}

/**
 * Generate pre-publish recommendations for a specific project.
 * Compares against top/bottom performers in the user's history.
 */
export async function generatePrePublishRecommendations(
  userId: string,
  currentFeatures: Record<string, unknown>,
  platform: string
): Promise<GeminiRecommendation[]> {
  const supabase = getSupabaseAdmin()

  // Fetch top and bottom performing posts
  const { data: topPosts } = await supabase
    .from('project_snapshots')
    .select(`
      aspect_ratio, duration_seconds, character_count, dialogue_line_count,
      voice_count, animation_count, caption_style, has_title, has_cta,
      emotion_distribution, posting_hour,
      performance_records!inner(performance_score, engagement_rate, views)
    `)
    .eq('user_id', userId)
    .eq('platform', platform)
    .order('performance_records(performance_score)', { ascending: false })
    .limit(5)

  const { data: bottomPosts } = await supabase
    .from('project_snapshots')
    .select(`
      aspect_ratio, duration_seconds, character_count, dialogue_line_count,
      voice_count, animation_count, caption_style, has_title, has_cta,
      emotion_distribution, posting_hour,
      performance_records!inner(performance_score, engagement_rate, views)
    `)
    .eq('user_id', userId)
    .eq('platform', platform)
    .order('performance_records(performance_score)', { ascending: true })
    .limit(5)

  if (!topPosts || topPosts.length < 2) return []

  const prompt = `You are a social media optimization expert for animated character videos.

Compare this project against the creator's best and worst performing content and suggest improvements.

PLATFORM: ${platform}

CURRENT PROJECT:
${JSON.stringify(currentFeatures, null, 2)}

TOP PERFORMING POSTS (best engagement):
${JSON.stringify(topPosts, null, 2)}

${bottomPosts && bottomPosts.length > 0 ? `BOTTOM PERFORMING POSTS (worst engagement):\n${JSON.stringify(bottomPosts, null, 2)}` : ''}

Return a JSON array of 3-5 recommendations:
[
  {
    "title": "Short actionable title",
    "description": "What to change and expected impact",
    "category": "duration|aspect_ratio|caption_style|posting_time|emotion|voice|animation|general",
    "priority": "high|medium|low",
    "actionType": "set_aspect_ratio|set_duration|set_caption_style|add_cta|change_posting_time|add_emotion|null",
    "actionPayload": {}
  }
]

Rules:
- Only suggest changes where the current project clearly differs from top performers
- Be specific and actionable
- Use actionPayload formats: {"aspectRatio": "9:16"}, {"durationSeconds": 25}, {"captionStyle": "word-by-word"}, {"suggestedHour": 20}, {"content": "Follow!"}`

  const resultText = await callGemini(prompt)

  try {
    const parsed = JSON.parse(resultText) as GeminiRecommendation[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    console.error('[GeminiAnalysis] Failed to parse pre-publish recommendations')
    return []
  }
}

/**
 * Store Gemini analysis results in the database.
 */
export async function storeAnalysisResults(
  userId: string,
  result: GeminiAnalysisResult,
  platform?: string,
  recordingId?: string
): Promise<void> {
  const supabase = getSupabaseAdmin()

  // Store insights as learned_patterns
  if (result.insights.length > 0) {
    const patterns = result.insights.map((insight) => ({
      user_id: userId,
      pattern_type: 'gemini_insight',
      platform: platform || null,
      confidence: insight.confidence,
      sample_size: 0, // Gemini doesn't track sample size
      title: insight.title,
      description: insight.description,
      feature_key: insight.category,
      impact_score: insight.impact === 'high' ? 0.8 : insight.impact === 'medium' ? 0.5 : 0.3,
      data: { impact: insight.impact },
      is_active: true,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    }))

    await supabase.from('learned_patterns').insert(patterns)
  }

  // Store recommendations
  if (result.recommendations.length > 0) {
    const recs = result.recommendations.map((rec) => ({
      user_id: userId,
      recording_id: recordingId || null,
      source: 'gemini',
      category: rec.category,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      confidence: 0.7, // Gemini recommendations get a baseline confidence
      action_type: rec.actionType || null,
      action_payload: rec.actionPayload || {},
      status: 'pending',
      platform: platform || null,
    }))

    await supabase.from('recommendations').insert(recs)
  }
}
