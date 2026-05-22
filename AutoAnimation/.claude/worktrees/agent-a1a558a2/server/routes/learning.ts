/**
 * AI Content Performance Learning routes.
 * Handles project snapshots, scoring, recommendations, and Gemini analysis.
 */

import { Router, type Request, type Response } from 'express'
import { requireAuth, getSupabaseAdmin } from '../middleware/supabaseAuth'
import {
  computeCorrelations,
  predictScore,
  generateLocalRecommendations,
  recomputePerformanceScores,
  updateLearnedPatterns,
} from '../services/scoringModel'
import {
  analyzePerformance,
  generatePrePublishRecommendations,
  storeAnalysisResults,
} from '../services/geminiAnalysis'

const router = Router()

// ── POST /snapshot ─────────────────────────────────────────────────────
// Store a project feature snapshot at publish time.
router.post('/snapshot', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const {
      recordingId,
      projectId,
      publishedPostId,
      platform,
      snapshot,
    } = req.body

    if (!recordingId || !platform || !snapshot) {
      res.status(400).json({ error: 'Missing required fields: recordingId, platform, snapshot' })
      return
    }

    const supabase = getSupabaseAdmin()

    // Insert project snapshot
    const { data: snapshotRow, error: snapErr } = await supabase
      .from('project_snapshots')
      .insert({
        user_id: userId,
        project_id: projectId || null,
        recording_id: recordingId,
        published_post_id: publishedPostId || null,
        aspect_ratio: snapshot.aspectRatio,
        fps: snapshot.fps,
        duration_seconds: snapshot.durationSeconds,
        canvas_width: snapshot.canvasWidth,
        canvas_height: snapshot.canvasHeight,
        character_count: snapshot.characterCount,
        emotion_distribution: snapshot.emotionDistribution,
        dialogue_line_count: snapshot.dialogueLineCount,
        total_script_word_count: snapshot.totalScriptWordCount,
        voice_ids: snapshot.voiceIds,
        voice_count: snapshot.voiceCount,
        avg_speech_rate_wpm: snapshot.avgSpeechRateWpm,
        animation_count: snapshot.animationCount,
        has_lottie_background: snapshot.hasLottieBackground,
        has_svg_animations: snapshot.hasSVGAnimations,
        has_html_templates: snapshot.hasHTMLTemplates,
        html_template_ids: snapshot.htmlTemplateIds,
        caption_style: snapshot.captionStyle,
        caption_position: snapshot.captionPosition,
        text_overlay_count: snapshot.textOverlayCount,
        has_title: snapshot.hasTitle,
        has_cta: snapshot.hasCTA,
        script_sentiment: snapshot.scriptSentiment || null,
        script_tone: snapshot.scriptTone || null,
        dominant_topics: snapshot.dominantTopics || [],
        platform,
        published_at: snapshot.publishedAt,
        posting_hour: snapshot.postingHour,
        posting_day_of_week: snapshot.postingDayOfWeek,
        feature_vector: snapshot.featureVector,
      })
      .select('id')
      .single()

    if (snapErr) {
      console.error('[Learning] Snapshot insert error:', snapErr)
      res.status(500).json({ error: 'Failed to store snapshot' })
      return
    }

    // Create initial performance record
    const { error: perfErr } = await supabase
      .from('performance_records')
      .insert({
        user_id: userId,
        snapshot_id: snapshotRow.id,
      })

    if (perfErr) {
      console.error('[Learning] Performance record insert error:', perfErr)
    }

    res.json({ snapshotId: snapshotRow.id })
  } catch (err: any) {
    console.error('[Learning] Snapshot error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── POST /update-metrics ───────────────────────────────────────────────
// Update performance records with latest engagement data.
router.post('/update-metrics', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { snapshotId, metrics } = req.body

    if (!snapshotId || !metrics) {
      res.status(400).json({ error: 'Missing required fields: snapshotId, metrics' })
      return
    }

    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('performance_records')
      .update({
        views: metrics.views || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        saves: metrics.saves || 0,
        engagement_rate: metrics.engagementRate || 0,
        avg_watch_time_sec: metrics.avgWatchTimeSec || 0,
        reach: metrics.reach || 0,
        impressions: metrics.impressions || 0,
        full_video_views_percent: metrics.fullVideoViewsPercent || 0,
        refresh_count: supabase.rpc ? undefined : 1, // Will be incremented below
        last_refreshed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('snapshot_id', snapshotId)
      .eq('user_id', userId)

    if (error) {
      console.error('[Learning] Metrics update error:', error)
      res.status(500).json({ error: 'Failed to update metrics' })
      return
    }

    // Increment refresh_count
    await supabase.rpc('increment_refresh_count', { p_snapshot_id: snapshotId }).catch(() => {
      // RPC might not exist yet, fall back to raw update
    })

    // Recompute performance scores across all posts
    await recomputePerformanceScores(userId)

    res.json({ success: true })
  } catch (err: any) {
    console.error('[Learning] Update metrics error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── GET /score ─────────────────────────────────────────────────────────
// Get predicted performance score for the current project.
router.get('/score', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const platform = req.query.platform as string
    const featureVectorStr = req.query.featureVector as string

    if (!platform || !featureVectorStr) {
      res.status(400).json({ error: 'Missing required query params: platform, featureVector' })
      return
    }

    let featureVector: Record<string, number>
    try {
      featureVector = JSON.parse(featureVectorStr)
    } catch {
      res.status(400).json({ error: 'Invalid featureVector JSON' })
      return
    }

    const correlations = await computeCorrelations(userId, platform)
    const result = predictScore(featureVector, correlations)

    res.json(result)
  } catch (err: any) {
    console.error('[Learning] Score error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── GET /insights ──────────────────────────────────────────────────────
// Fetch active learned patterns for the user.
router.get('/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const platform = req.query.platform as string | undefined

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('learned_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('impact_score', { ascending: false })

    if (platform) {
      query = query.or(`platform.eq.${platform},platform.is.null`)
    }

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: 'Failed to fetch insights' })
      return
    }

    // Map snake_case to camelCase
    const insights = (data || []).map((p: any) => ({
      id: p.id,
      patternType: p.pattern_type,
      platform: p.platform,
      confidence: p.confidence,
      sampleSize: p.sample_size,
      title: p.title,
      description: p.description,
      featureKey: p.feature_key,
      featureValue: p.feature_value,
      impactScore: p.impact_score,
      data: p.data,
      isActive: p.is_active,
      expiresAt: p.expires_at,
      createdAt: p.created_at,
    }))

    res.json({ insights })
  } catch (err: any) {
    console.error('[Learning] Insights error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── GET /recommendations/:recordingId ──────────────────────────────────
// Fetch recommendations for a specific recording.
router.get('/recommendations/:recordingId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { recordingId } = req.params
    const platform = req.query.platform as string | undefined

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (recordingId !== 'current') {
      query = query.eq('recording_id', recordingId)
    }

    if (platform) {
      query = query.or(`platform.eq.${platform},platform.is.null`)
    }

    const { data, error } = await query.limit(20)

    if (error) {
      res.status(500).json({ error: 'Failed to fetch recommendations' })
      return
    }

    const recommendations = (data || []).map((r: any) => ({
      id: r.id,
      source: r.source,
      category: r.category,
      title: r.title,
      description: r.description,
      priority: r.priority,
      confidence: r.confidence,
      actionType: r.action_type,
      actionPayload: r.action_payload,
      status: r.status,
      appliedAt: r.applied_at,
      platform: r.platform,
      createdAt: r.created_at,
    }))

    res.json({ recommendations })
  } catch (err: any) {
    console.error('[Learning] Recommendations error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── POST /analyze-gemini ───────────────────────────────────────────────
// Trigger Gemini deep analysis (rate-limited by aiRateLimiter in index.ts).
router.post('/analyze-gemini', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { platform, recordingId, currentFeatures } = req.body

    // Run deep analysis
    const result = await analyzePerformance(userId, platform)

    // If current features provided, also get pre-publish recommendations
    if (currentFeatures) {
      const prePublishRecs = await generatePrePublishRecommendations(userId, currentFeatures, platform)
      result.recommendations = [...result.recommendations, ...prePublishRecs]
    }

    // Store results in the database
    await storeAnalysisResults(userId, result, platform, recordingId)

    res.json(result)
  } catch (err: any) {
    console.error('[Learning] Gemini analysis error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── POST /recalculate ──────────────────────────────────────────────────
// Full model recalculation: recompute scores, correlations, and patterns.
router.post('/recalculate', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const platform = req.body.platform as string | undefined

    // 1. Recompute performance scores
    await recomputePerformanceScores(userId)

    // 2. Compute correlations
    const correlations = await computeCorrelations(userId, platform)

    // 3. Update learned patterns
    await updateLearnedPatterns(userId, correlations, platform)

    res.json({ success: true, correlationCount: correlations.length })
  } catch (err: any) {
    console.error('[Learning] Recalculate error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── PATCH /recommendations/:id/status ──────────────────────────────────
// Update recommendation status (applied, dismissed).
router.patch('/recommendations/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { id } = req.params
    const { status } = req.body

    if (!['applied', 'dismissed', 'expired'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be: applied, dismissed, or expired' })
      return
    }

    const supabase = getSupabaseAdmin()

    const updateData: any = { status }
    if (status === 'applied') {
      updateData.applied_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('recommendations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      res.status(500).json({ error: 'Failed to update recommendation' })
      return
    }

    res.json({ success: true })
  } catch (err: any) {
    console.error('[Learning] Update recommendation error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

// ── POST /score (POST variant for large feature vectors) ───────────────
router.post('/score', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId
    const { platform, featureVector } = req.body

    if (!platform || !featureVector) {
      res.status(400).json({ error: 'Missing required fields: platform, featureVector' })
      return
    }

    const correlations = await computeCorrelations(userId, platform)
    const result = predictScore(featureVector, correlations)

    // Also generate local recommendations
    const recommendations = generateLocalRecommendations(featureVector, correlations, platform)

    res.json({ ...result, recommendations })
  } catch (err: any) {
    console.error('[Learning] Score (POST) error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
})

export default router
