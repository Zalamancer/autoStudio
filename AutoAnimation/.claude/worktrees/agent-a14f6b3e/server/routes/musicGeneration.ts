/**
 * Music Generation API — abstracts Suno / ElevenLabs providers.
 *
 * POST /api/music/generate      → start generation job
 * GET  /api/music/status/:jobId → poll job status
 * GET  /api/music/download/:jobId → download audio
 * GET  /api/music/providers     → list available providers
 */

import { Router, type Request, type Response } from 'express'

const router = Router()

// ── In-memory job store ───────────────────────────────────────────────────

interface MusicJob {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress: number
  provider: string
  prompt: string
  audioBuffer?: Buffer
  durationSeconds?: number
  title?: string
  error?: string
  createdAt: number
}

const jobs = new Map<string, MusicJob>()

function createJobId(): string {
  return `music_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Clean up old jobs every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id)
  }
}, 30 * 60 * 1000)

// ── Provider Detection ────────────────────────────────────────────────────

function isSunoConfigured(): boolean {
  return !!process.env.SUNO_API_KEY
}

function isElevenLabsConfigured(): boolean {
  return !!(process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY)
}

function getElevenLabsKey(): string {
  return process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || ''
}

// ── Routes ────────────────────────────────────────────────────────────────

// GET /providers — list available music generation providers
router.get('/providers', (_req: Request, res: Response) => {
  const providers: string[] = []
  if (isSunoConfigured()) providers.push('suno')
  if (isElevenLabsConfigured()) providers.push('elevenlabs')
  res.json({ providers })
})

// POST /generate — start a music generation job
router.post('/generate', async (req: Request, res: Response) => {
  const { prompt, genre, mood, tempo, durationSeconds, instrumental } = req.body

  if (!prompt && !genre && !mood) {
    res.status(400).json({ error: 'At least one of prompt, genre, or mood is required' })
    return
  }

  // Build a combined prompt from structured fields
  const parts: string[] = []
  if (genre && genre !== 'custom') parts.push(genre)
  if (mood) parts.push(mood)
  if (tempo && tempo > 0) parts.push(`${tempo} BPM`)
  if (prompt) parts.push(prompt)
  if (instrumental) parts.push('instrumental, no vocals')
  const combinedPrompt = parts.join(', ')

  const duration = Math.min(Math.max(durationSeconds || 30, 5), 240)

  const jobId = createJobId()
  const job: MusicJob = {
    id: jobId,
    status: 'pending',
    progress: 0,
    provider: isSunoConfigured() ? 'suno' : 'elevenlabs',
    prompt: combinedPrompt,
    createdAt: Date.now(),
  }
  jobs.set(jobId, job)

  res.status(202).json({ jobId })

  // Run generation asynchronously
  generateMusicAsync(job, combinedPrompt, duration).catch((err) => {
    job.status = 'error'
    job.error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Music job ${jobId} failed:`, err)
  })
})

// GET /status/:jobId — poll job status
router.get('/status/:jobId', (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  res.json({
    status: job.status,
    progress: job.progress,
    provider: job.provider,
    durationSeconds: job.durationSeconds,
    title: job.title,
    error: job.error,
    ...(job.status === 'complete' ? { audioUrl: `/api/music/download/${job.id}` } : {}),
  })
})

// GET /download/:jobId — download generated audio
router.get('/download/:jobId', (req: Request, res: Response) => {
  const job = jobs.get(req.params.jobId)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  if (job.status !== 'complete' || !job.audioBuffer) {
    res.status(400).json({ error: 'Job is not complete' })
    return
  }

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Length', job.audioBuffer.length.toString())
  res.send(job.audioBuffer)
})

// ── Provider Implementations ──────────────────────────────────────────────

async function generateMusicAsync(
  job: MusicJob,
  prompt: string,
  durationSeconds: number,
): Promise<void> {
  job.status = 'processing'
  job.progress = 10

  if (isSunoConfigured()) {
    await generateWithSuno(job, prompt, durationSeconds)
  } else if (isElevenLabsConfigured()) {
    await generateWithElevenLabs(job, prompt, durationSeconds)
  } else {
    throw new Error('No music generation provider configured (set SUNO_API_KEY or ELEVENLABS_API_KEY)')
  }
}

// ── Suno Provider ─────────────────────────────────────────────────────────

async function generateWithSuno(
  job: MusicJob,
  prompt: string,
  durationSeconds: number,
): Promise<void> {
  job.provider = 'suno'
  const apiKey = process.env.SUNO_API_KEY!
  const apiUrl = process.env.SUNO_API_URL || 'https://api.suno.ai/v1'

  // Create generation task
  job.progress = 20
  const createResponse = await fetch(`${apiUrl}/songs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      duration: Math.min(durationSeconds, 240),
      instrumental: true,
    }),
  })

  if (!createResponse.ok) {
    const errData = await createResponse.json().catch(() => ({}))
    throw new Error(`Suno API error: ${(errData as Record<string, unknown>).error || createResponse.statusText}`)
  }

  const createData = await createResponse.json() as { id?: string; task_id?: string }
  const taskId = createData.id || createData.task_id
  if (!taskId) throw new Error('No task ID returned from Suno')

  // Poll for completion
  job.progress = 30
  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((r) => setTimeout(r, 2000))

    const statusResponse = await fetch(`${apiUrl}/songs/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json() as {
      status?: string
      audio_url?: string
      duration?: number
      title?: string
      error?: string
    }

    if (statusData.status === 'error') {
      throw new Error(statusData.error || 'Suno generation failed')
    }

    if (statusData.status === 'complete' && statusData.audio_url) {
      // Download audio
      job.progress = 85
      const audioResponse = await fetch(statusData.audio_url)
      if (!audioResponse.ok) throw new Error('Failed to download Suno audio')

      job.audioBuffer = Buffer.from(await audioResponse.arrayBuffer())
      job.durationSeconds = statusData.duration || durationSeconds
      job.title = statusData.title
      job.status = 'complete'
      job.progress = 100
      return
    }

    // Update progress (30-80 range during polling)
    job.progress = Math.min(80, 30 + Math.round((attempt / 120) * 50))
  }

  throw new Error('Suno generation timed out')
}

// ── ElevenLabs Provider (fallback) ────────────────────────────────────────

async function generateWithElevenLabs(
  job: MusicJob,
  prompt: string,
  durationSeconds: number,
): Promise<void> {
  job.provider = 'elevenlabs'
  const apiKey = getElevenLabsKey()

  job.progress = 30

  const durationMs = Math.min(durationSeconds * 1000, 120000) // ElevenLabs max 120s

  const response = await fetch('https://api.elevenlabs.io/v1/music/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      prompt,
      duration_ms: durationMs,
    }),
  })

  job.progress = 70

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(`ElevenLabs music error: ${(errData as Record<string, unknown>).detail || response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  job.audioBuffer = Buffer.from(arrayBuffer)
  job.durationSeconds = durationMs / 1000
  job.title = `AI Music: ${prompt.slice(0, 50)}`
  job.status = 'complete'
  job.progress = 100
}

export default router
