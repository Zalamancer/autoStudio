/**
 * Manim video generation routes.
 *
 * POST /generate-code  — Generate ManimCE Python code from a scene spec
 * POST /render          — Start a render job (returns jobId)
 * POST /feedback        — Visual review: screenshot + code → approval or fix
 * POST /explain         — Text explanation via Gemini
 * POST /explain-visual  — Generate a supplementary Manim clip for a question
 * GET  /status/:jobId   — Poll render job status
 * GET  /output/:filename — Serve rendered video files
 */

import { Router, type Request, type Response } from 'express'
import express from 'express'
import {
  generateManimCode,
  generateManimCodeWithRetry,
  reviewManimCode,
  isManimCodeGeneratorConfigured,
  type SceneSpecInput,
} from '../services/manimCodeGenerator.js'
import {
  renderManimScene,
  startManimRenderAsync,
  getManimRenderStatus,
  getManimOutputDir,
  isManimAvailable,
} from '../services/manimRenderer.js'

const router = Router()

// ---------------------------------------------------------------------------
// Lazy Vertex AI client for /explain endpoint (Gemini)
// ---------------------------------------------------------------------------

let _vertexFetch: typeof fetch | null = null

async function callGemini(prompt: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID
  const location = process.env.GCP_LOCATION || 'us-central1'
  if (!projectId) {
    throw new Error('GCP_PROJECT_ID is required for Gemini explain endpoints')
  }

  const model = 'gemini-2.0-flash'
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`

  // Use Application Default Credentials via Google Auth library
  const { GoogleAuth } = await import('google-auth-library')
  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] })
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenResponse.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${text.slice(0, 500)}`)
  }

  const data = await response.json() as any
  const textPart = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)
  return textPart?.text || ''
}

// ---------------------------------------------------------------------------
// POST /generate-code
// ---------------------------------------------------------------------------

router.post('/generate-code', async (req: Request, res: Response) => {
  if (!isManimCodeGeneratorConfigured()) {
    res.status(503).json({ error: 'Claude API not configured (ANTHROPIC_API_KEY missing on server)' })
    return
  }

  const { sceneSpec, maxRetries } = req.body as {
    sceneSpec?: SceneSpecInput
    maxRetries?: number
  }

  if (!sceneSpec) {
    res.status(400).json({ error: 'Missing required field: sceneSpec' })
    return
  }

  if (typeof sceneSpec.index !== 'number' || !sceneSpec.animationIntent) {
    res.status(400).json({ error: 'sceneSpec must include index and animationIntent' })
    return
  }

  console.log(`[manim/generate-code] Scene ${sceneSpec.index}: "${sceneSpec.title}"`)

  try {
    const result = await generateManimCodeWithRetry(sceneSpec, maxRetries ?? 3)
    res.json(result)
  } catch (err) {
    console.error('[manim/generate-code] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Code generation failed: ${message}` })
  }
})

// ---------------------------------------------------------------------------
// POST /render
// ---------------------------------------------------------------------------

router.post('/render', async (req: Request, res: Response) => {
  const { code, className, quality = 'm', async: asyncMode = true } = req.body as {
    code?: string
    className?: string
    quality?: 'l' | 'm' | 'h'
    async?: boolean
  }

  if (!code || !className) {
    res.status(400).json({ error: 'Missing required fields: code, className' })
    return
  }

  // Check Manim availability
  const available = await isManimAvailable()
  if (!available) {
    res.status(503).json({
      error: 'ManimCE is not installed or not available on the server PATH. Install with: pip install manim',
    })
    return
  }

  console.log(`[manim/render] Starting render for ${className} (quality=${quality}, async=${asyncMode})`)

  try {
    if (asyncMode) {
      // Fire-and-forget: return jobId immediately
      const jobId = startManimRenderAsync(code, className, quality)
      res.json({ jobId, status: 'queued' })
    } else {
      // Synchronous: wait for render to complete
      const result = await renderManimScene(code, className, quality)
      res.json({
        jobId: result.jobId,
        status: 'completed',
        videoUrl: `/api/manim/output/${result.jobId}${result.videoPath.endsWith('.webm') ? '.webm' : '.mp4'}`,
        durationSeconds: result.durationSeconds,
      })
    }
  } catch (err) {
    console.error('[manim/render] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Render failed: ${message}` })
  }
})

// ---------------------------------------------------------------------------
// POST /feedback — visual review
// ---------------------------------------------------------------------------

router.post('/feedback', async (req: Request, res: Response) => {
  if (!isManimCodeGeneratorConfigured()) {
    res.status(503).json({ error: 'Claude API not configured (ANTHROPIC_API_KEY missing on server)' })
    return
  }

  const { code, screenshotBase64, sceneSpec } = req.body as {
    code?: string
    screenshotBase64?: string
    sceneSpec?: SceneSpecInput
  }

  if (!code || !screenshotBase64 || !sceneSpec) {
    res.status(400).json({ error: 'Missing required fields: code, screenshotBase64, sceneSpec' })
    return
  }

  console.log(`[manim/feedback] Reviewing Scene${sceneSpec.index}`)

  try {
    const review = await reviewManimCode(code, screenshotBase64, sceneSpec)
    res.json(review)
  } catch (err) {
    console.error('[manim/feedback] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Review failed: ${message}` })
  }
})

// ---------------------------------------------------------------------------
// POST /explain — text explanation via Gemini
// ---------------------------------------------------------------------------

router.post('/explain', async (req: Request, res: Response) => {
  const { context, question, knowledgeGraph } = req.body as {
    context?: string
    question?: string
    knowledgeGraph?: Record<string, unknown>
  }

  if (!question) {
    res.status(400).json({ error: 'Missing required field: question' })
    return
  }

  console.log(`[manim/explain] Question: "${question.slice(0, 80)}..."`)

  try {
    const kgContext = knowledgeGraph
      ? `\n\nKnowledge graph context:\n${JSON.stringify(knowledgeGraph, null, 2)}`
      : ''

    const prompt = `You are an expert educator. Answer the following question clearly and concisely, suitable for a short educational video narration.

${context ? `Context: ${context}\n` : ''}Question: ${question}${kgContext}

Provide a clear, engaging explanation in 2-4 paragraphs. Use simple language. Highlight key concepts.`

    const answer = await callGemini(prompt)

    if (!answer) {
      res.status(500).json({ error: 'No response from Gemini' })
      return
    }

    res.json({ answer })
  } catch (err) {
    console.error('[manim/explain] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Explain failed: ${message}` })
  }
})

// ---------------------------------------------------------------------------
// POST /explain-visual — generate a supplementary Manim clip for a question
// ---------------------------------------------------------------------------

router.post('/explain-visual', async (req: Request, res: Response) => {
  if (!isManimCodeGeneratorConfigured()) {
    res.status(503).json({ error: 'Claude API not configured (ANTHROPIC_API_KEY missing on server)' })
    return
  }

  const { context, question } = req.body as {
    context?: string
    question?: string
  }

  if (!question) {
    res.status(400).json({ error: 'Missing required field: question' })
    return
  }

  console.log(`[manim/explain-visual] Generating visual for: "${question.slice(0, 80)}..."`)

  try {
    // Step 1: Ask Gemini to produce a scene spec for the explanation
    const specPrompt = `You are a visual education designer. Given a question, produce a JSON scene specification for a short (5-8 second) ManimCE animation that visually explains the answer.

Question: ${question}
${context ? `Context: ${context}` : ''}

Return ONLY a JSON object with these fields:
{
  "title": "short title",
  "durationSeconds": 6,
  "animationIntent": "what the animation should show",
  "narrationText": "brief narration",
  "elements": [
    { "elementId": "elem1", "type": "text|formula|shape|graph|arrow", "anchor": { "row": 0, "col": 2 }, "description": "what this element shows" }
  ]
}

Use the 6x6 grid system (rows 0-5, cols 0-5). Keep it simple: 2-5 elements max.`

    const specText = await callGemini(specPrompt)

    // Parse the scene spec JSON
    const jsonMatch = specText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      res.status(500).json({ error: 'Could not generate scene specification' })
      return
    }

    let parsedSpec: any
    try {
      parsedSpec = JSON.parse(jsonMatch[0])
    } catch {
      res.status(500).json({ error: 'Failed to parse scene specification JSON' })
      return
    }

    // Build full SceneSpecInput
    const sceneSpec: SceneSpecInput = {
      index: 0,
      title: parsedSpec.title || 'Explanation',
      durationSeconds: parsedSpec.durationSeconds || 6,
      animationIntent: parsedSpec.animationIntent || question,
      narrationText: parsedSpec.narrationText || '',
      elements: (parsedSpec.elements || []).map((e: any) => ({
        elementId: e.elementId || 'elem',
        type: e.type || 'text',
        anchor: e.anchor || { row: 2, col: 2 },
        description: e.description || '',
      })),
      elementContinuity: [],
    }

    // Step 2: Generate the Manim code
    const codeResult = await generateManimCodeWithRetry(sceneSpec, 2)

    // Step 3: Start async render if Manim is available
    const available = await isManimAvailable()
    let jobId: string | null = null

    if (available) {
      const { startManimRenderAsync } = await import('../services/manimRenderer.js')
      jobId = startManimRenderAsync(codeResult.code, codeResult.className, 'm')
    }

    res.json({
      code: codeResult.code,
      className: codeResult.className,
      sceneSpec,
      jobId,
      manimAvailable: available,
    })
  } catch (err) {
    console.error('[manim/explain-visual] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Visual explanation failed: ${message}` })
  }
})

// ---------------------------------------------------------------------------
// GET /status/:jobId
// ---------------------------------------------------------------------------

router.get('/status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params
  const status = getManimRenderStatus(jobId)

  if (!status) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  res.json(status)
})

// ---------------------------------------------------------------------------
// GET /output/:filename — serve rendered video files
// ---------------------------------------------------------------------------

router.use('/output', express.static(getManimOutputDir()))

// ---------------------------------------------------------------------------
// GET /available — check if ManimCE is installed
// ---------------------------------------------------------------------------

router.get('/available', async (_req: Request, res: Response) => {
  const available = await isManimAvailable()
  res.json({
    manimAvailable: available,
    claudeConfigured: isManimCodeGeneratorConfigured(),
  })
})

export default router
