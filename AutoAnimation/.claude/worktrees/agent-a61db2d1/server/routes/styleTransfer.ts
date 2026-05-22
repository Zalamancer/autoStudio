/**
 * Style Transfer API — video-to-video AI style transformation.
 *
 * POST /api/style-transfer/submit     → upload video + start job
 * GET  /api/style-transfer/status/:id → poll job status
 * GET  /api/style-transfer/download/:id → download result
 * GET  /api/style-transfer/providers  → list available providers
 */

import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs'

const router = Router()

// Multer for video upload (max 100MB)
const upload = multer({
  dest: path.join(os.tmpdir(), 'style-transfer-uploads'),
  limits: { fileSize: 100 * 1024 * 1024 },
})

// ── Job store ─────────────────────────────────────────────────────────────

interface StyleTransferJob {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  progress: number
  provider: string
  style: string
  inputPath: string
  outputPath?: string
  outputBuffer?: Buffer
  durationSeconds?: number
  error?: string
  createdAt: number
}

const jobs = new Map<string, StyleTransferJob>()

function createJobId(): string {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// Clean old jobs every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) {
      // Clean up temp files
      try { if (job.inputPath) fs.unlinkSync(job.inputPath) } catch {}
      try { if (job.outputPath) fs.unlinkSync(job.outputPath) } catch {}
      jobs.delete(id)
    }
  }
}, 30 * 60 * 1000)

// ── Provider detection ────────────────────────────────────────────────────

function isRunwayConfigured(): boolean {
  return !!process.env.RUNWAY_API_KEY
}

function isKlingConfigured(): boolean {
  return !!process.env.KLING_API_KEY
}

function isComfyUIConfigured(): boolean {
  return !!process.env.COMFYUI_URL
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get('/providers', (_req: Request, res: Response) => {
  const providers: string[] = []
  if (isRunwayConfigured()) providers.push('runway')
  if (isKlingConfigured()) providers.push('kling')
  if (isComfyUIConfigured()) providers.push('comfyui')
  res.json({ providers })
})

router.post('/submit', upload.single('video'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file uploaded' })
    return
  }

  const { style, intensity, customPrompt } = req.body

  if (!style) {
    res.status(400).json({ error: 'Style parameter is required' })
    return
  }

  if (!isRunwayConfigured() && !isKlingConfigured() && !isComfyUIConfigured()) {
    res.status(503).json({
      error: 'No style transfer provider configured (set RUNWAY_API_KEY, KLING_API_KEY, or COMFYUI_URL)',
    })
    return
  }

  const jobId = createJobId()
  const job: StyleTransferJob = {
    id: jobId,
    status: 'pending',
    progress: 0,
    provider: isRunwayConfigured() ? 'runway' : isKlingConfigured() ? 'kling' : 'comfyui',
    style,
    inputPath: req.file.path,
    createdAt: Date.now(),
  }
  jobs.set(jobId, job)

  res.status(202).json({ jobId })

  // Run async
  processStyleTransfer(job, parseFloat(intensity) || 0.8, customPrompt).catch((err) => {
    job.status = 'error'
    job.error = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Style transfer job ${jobId} failed:`, err)
  })
})

router.get('/status/:id', (req: Request, res: Response) => {
  const job = jobs.get(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  res.json({
    status: job.status,
    progress: job.progress,
    provider: job.provider,
    durationSeconds: job.durationSeconds,
    error: job.error,
    ...(job.status === 'complete' ? { videoUrl: `/api/style-transfer/download/${job.id}` } : {}),
  })
})

router.get('/download/:id', (req: Request, res: Response) => {
  const job = jobs.get(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  if (job.status !== 'complete') {
    res.status(400).json({ error: 'Job not complete' })
    return
  }

  if (job.outputBuffer) {
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Length', job.outputBuffer.length.toString())
    res.send(job.outputBuffer)
    return
  }

  if (job.outputPath && fs.existsSync(job.outputPath)) {
    res.sendFile(job.outputPath)
    return
  }

  res.status(404).json({ error: 'Output file not found' })
})

// ── Processing ────────────────────────────────────────────────────────────

async function processStyleTransfer(
  job: StyleTransferJob,
  intensity: number,
  customPrompt?: string,
): Promise<void> {
  job.status = 'processing'
  job.progress = 10

  if (isRunwayConfigured()) {
    await processWithRunway(job, intensity, customPrompt)
  } else if (isKlingConfigured()) {
    await processWithKling(job, intensity, customPrompt)
  } else if (isComfyUIConfigured()) {
    await processWithComfyUI(job, intensity, customPrompt)
  } else {
    throw new Error('No style transfer provider configured')
  }
}

async function processWithRunway(
  job: StyleTransferJob,
  intensity: number,
  customPrompt?: string,
): Promise<void> {
  job.provider = 'runway'
  const apiKey = process.env.RUNWAY_API_KEY!

  // Read source video
  const videoBuffer = fs.readFileSync(job.inputPath)
  const videoBase64 = videoBuffer.toString('base64')

  job.progress = 20

  // Build prompt from style + intensity
  const stylePrompt = customPrompt || `Transform video into ${job.style} style with ${Math.round(intensity * 100)}% stylization`

  // Submit to Runway Gen-3 API
  const createResponse = await fetch('https://api.dev.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify({
      model: 'gen3a_turbo',
      promptImage: `data:video/mp4;base64,${videoBase64}`,
      promptText: stylePrompt,
    }),
  })

  if (!createResponse.ok) {
    const errData = await createResponse.json().catch(() => ({}))
    throw new Error(`Runway API error: ${JSON.stringify(errData)}`)
  }

  const createData = await createResponse.json() as { id: string }
  const taskId = createData.id

  job.progress = 30

  // Poll for completion
  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((r) => setTimeout(r, 3000))

    const statusResponse = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'X-Runway-Version': '2024-11-06' },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json() as {
      status: string
      output?: string[]
      failure?: string
    }

    if (statusData.status === 'FAILED') {
      throw new Error(statusData.failure || 'Runway generation failed')
    }

    if (statusData.status === 'SUCCEEDED' && statusData.output?.[0]) {
      job.progress = 85
      const videoResponse = await fetch(statusData.output[0])
      if (!videoResponse.ok) throw new Error('Failed to download Runway output')

      job.outputBuffer = Buffer.from(await videoResponse.arrayBuffer())
      job.status = 'complete'
      job.progress = 100
      return
    }

    job.progress = Math.min(80, 30 + Math.round((attempt / 120) * 50))
  }

  throw new Error('Runway style transfer timed out')
}

async function processWithKling(
  job: StyleTransferJob,
  intensity: number,
  customPrompt?: string,
): Promise<void> {
  job.provider = 'kling'
  const apiKey = process.env.KLING_API_KEY!

  const videoBuffer = fs.readFileSync(job.inputPath)
  const videoBase64 = videoBuffer.toString('base64')

  job.progress = 20

  const stylePrompt = customPrompt || `${job.style} style, intensity ${Math.round(intensity * 100)}%`

  const createResponse = await fetch('https://api.klingai.com/v1/videos/image2video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model_name: 'kling-v1',
      prompt: stylePrompt,
      image: videoBase64,
      duration: '5',
      mode: 'std',
    }),
  })

  if (!createResponse.ok) {
    const errData = await createResponse.json().catch(() => ({}))
    throw new Error(`Kling API error: ${JSON.stringify(errData)}`)
  }

  const createData = await createResponse.json() as { data?: { task_id?: string } }
  const taskId = createData.data?.task_id
  if (!taskId) throw new Error('No task ID from Kling')

  job.progress = 30

  for (let attempt = 0; attempt < 120; attempt++) {
    await new Promise((r) => setTimeout(r, 3000))

    const statusResponse = await fetch(`https://api.klingai.com/v1/videos/image2video/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json() as {
      data?: { task_status?: string; task_result?: { videos?: Array<{ url: string; duration: string }> }; task_status_msg?: string }
    }

    if (statusData.data?.task_status === 'failed') {
      throw new Error(statusData.data?.task_status_msg || 'Kling generation failed')
    }

    if (statusData.data?.task_status === 'succeed') {
      const videoUrl = statusData.data?.task_result?.videos?.[0]?.url
      if (!videoUrl) throw new Error('No video URL in Kling result')

      job.progress = 85
      const videoResponse = await fetch(videoUrl)
      if (!videoResponse.ok) throw new Error('Failed to download Kling output')

      job.outputBuffer = Buffer.from(await videoResponse.arrayBuffer())
      job.durationSeconds = parseFloat(statusData.data?.task_result?.videos?.[0]?.duration || '5')
      job.status = 'complete'
      job.progress = 100
      return
    }

    job.progress = Math.min(80, 30 + Math.round((attempt / 120) * 50))
  }

  throw new Error('Kling style transfer timed out')
}

async function processWithComfyUI(
  job: StyleTransferJob,
  _intensity: number,
  _customPrompt?: string,
): Promise<void> {
  job.provider = 'comfyui'
  const comfyUrl = process.env.COMFYUI_URL!

  // For self-hosted ComfyUI, we'd upload the video and run a workflow
  // This is a placeholder for the ComfyUI API integration
  throw new Error(`ComfyUI style transfer not yet implemented (${comfyUrl}). Configure RUNWAY_API_KEY or KLING_API_KEY instead.`)
}

export default router
