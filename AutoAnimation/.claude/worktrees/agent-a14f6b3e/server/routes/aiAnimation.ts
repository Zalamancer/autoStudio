import { Router, type Request, type Response } from 'express'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { createJob, getJob, updateJob, addJobListener, type JobEvent } from '../jobs'
import { generateFrameFunction, generateObjectFunctions, isClaudeConfigured } from '../services/claude'
import { renderFrames } from '../services/renderer'
import { encodeVideo, cleanupTempDir, isFFmpegAvailable } from '../services/encoder'

const router = Router()

// Max concurrent AI animation jobs
const MAX_CONCURRENT_JOBS = 3
let activeJobCount = 0

// POST /generate — start an animation generation job
router.post('/generate', async (req: Request, res: Response) => {
  if (!isClaudeConfigured()) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY is not configured' })
    return
  }

  if (activeJobCount >= MAX_CONCURRENT_JOBS) {
    res.status(503).json({ error: 'Server busy — too many concurrent jobs. Please try again later.' })
    return
  }

  const ffmpegOk = await isFFmpegAvailable()
  if (!ffmpegOk) {
    res.status(503).json({ error: 'ffmpeg is not installed or not in PATH' })
    return
  }

  const {
    prompt,
    fps = 30,
    durationSeconds = 10,
    width = 1920,
    height = 1080,
  } = req.body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'prompt is required' })
    return
  }

  if (durationSeconds < 1 || durationSeconds > 60) {
    res.status(400).json({ error: 'durationSeconds must be between 1 and 60' })
    return
  }

  const job = createJob()
  const totalFrames = fps * durationSeconds
  const tmpDir = path.join(os.tmpdir(), `ai-anim-${job.id}`)

  activeJobCount++

  // Return job ID immediately
  res.status(202).json({ jobId: job.id })

  // Run pipeline asynchronously
  runPipeline(job.id, prompt, fps, durationSeconds, width, height, totalFrames, tmpDir)
    .catch((err) => {
      console.error(`Job ${job.id} pipeline error:`, err)
      updateJob(job.id, {
        status: 'error',
        phase: 'error',
        progress: 0,
        message: err instanceof Error ? err.message : 'Unknown error',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    })
    .finally(() => {
      activeJobCount--
    })
})

async function runPipeline(
  jobId: string,
  prompt: string,
  fps: number,
  durationSeconds: number,
  width: number,
  height: number,
  totalFrames: number,
  tmpDir: string,
) {
  try {
    // Phase 1: Generate frame function via Claude
    updateJob(jobId, {
      phase: 'generating',
      progress: 5,
      message: 'Generating animation script with Claude...',
    })

    const { functionCode } = await generateFrameFunction(prompt, width, height, fps, durationSeconds)

    updateJob(jobId, {
      phase: 'generating',
      progress: 15,
      message: 'Animation script generated, starting render...',
    })

    // Phase 2: Render frames
    updateJob(jobId, {
      phase: 'rendering',
      progress: 15,
      message: `Rendering frame 0/${totalFrames}...`,
    })

    await renderFrames({
      functionCode,
      totalFrames,
      width,
      height,
      fps,
      outputDir: tmpDir,
      onProgress: (frame, total) => {
        const renderProgress = 15 + Math.round((frame / total) * 65) // 15-80%
        updateJob(jobId, {
          phase: 'rendering',
          progress: renderProgress,
          message: `Rendering frame ${frame}/${total}...`,
        })
      },
    })

    // Phase 3: Encode to MP4
    updateJob(jobId, {
      phase: 'encoding',
      progress: 80,
      message: 'Encoding video...',
    })

    const outputPath = await encodeVideo({
      inputDir: tmpDir,
      fps,
      onProgress: (percent) => {
        const encodeProgress = 80 + Math.round(percent * 0.18) // 80-98%
        updateJob(jobId, {
          phase: 'encoding',
          progress: encodeProgress,
          message: `Encoding video... ${percent}%`,
        })
      },
    })

    // Phase 4: Complete — video stays on disk for download
    updateJob(jobId, {
      status: 'complete',
      phase: 'complete',
      progress: 100,
      message: 'Animation complete!',
      videoUrl: `/api/ai-animation/jobs/${jobId}/download`,
    })

    // Schedule temp file cleanup after 1 hour (gives user time to download)
    setTimeout(() => {
      console.log(`Cleaning up temp files for job ${jobId}`)
      cleanupTempDir(tmpDir)
    }, 60 * 60 * 1000)
  } catch (err) {
    console.error(`Job ${jobId} failed:`, err)
    updateJob(jobId, {
      status: 'error',
      phase: 'error',
      progress: 0,
      message: err instanceof Error ? err.message : 'Unknown error',
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    cleanupTempDir(tmpDir)
  }
}

// GET /jobs/:id/progress — SSE endpoint for job progress
router.get('/jobs/:id/progress', (req: Request, res: Response) => {
  const job = getJob(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  // Send current state immediately
  const currentEvent: JobEvent = {
    phase: job.phase,
    progress: job.progress,
    message: job.message,
    videoUrl: job.videoUrl,
    error: job.error,
  }
  res.write(`data: ${JSON.stringify(currentEvent)}\n\n`)

  // If already complete or errored, close
  if (job.status === 'complete' || job.status === 'error') {
    res.end()
    return
  }

  // Listen for updates
  const removeListener = addJobListener(req.params.id, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`)

    if (event.phase === 'complete' || event.phase === 'error') {
      res.end()
    }
  })

  // Clean up on client disconnect
  req.on('close', () => {
    removeListener()
  })
})

// GET /jobs/:id/download — download the generated video
router.get('/jobs/:id/download', (req: Request, res: Response) => {
  const job = getJob(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  if (job.status !== 'complete') {
    res.status(400).json({ error: 'Job is not complete yet' })
    return
  }

  const tmpDir = path.join(os.tmpdir(), `ai-anim-${req.params.id}`)
  const videoPath = path.join(tmpDir, 'output.mp4')

  if (!fs.existsSync(videoPath)) {
    res.status(404).json({ error: 'Video file not found (may have been cleaned up)' })
    return
  }

  res.setHeader('Content-Type', 'video/mp4')

  // Only force download when ?download=true, otherwise serve inline for <video> streaming
  if (req.query.download === 'true') {
    res.setHeader('Content-Disposition', `attachment; filename="ai-animation-${req.params.id}.mp4"`)
  }

  // Use sendFile for proper Range request support (needed for video seeking)
  res.sendFile(videoPath)
})

// GET /jobs/:id — get job status
router.get('/jobs/:id', (req: Request, res: Response) => {
  const job = getJob(req.params.id)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }

  res.json({
    id: job.id,
    status: job.status,
    phase: job.phase,
    progress: job.progress,
    message: job.message,
    videoUrl: job.videoUrl,
    error: job.error,
  })
})

// POST /generate-objects — generate per-object SVG animation functions (no rendering)
router.post('/generate-objects', async (req: Request, res: Response) => {
  if (!isClaudeConfigured()) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY is not configured' })
    return
  }

  const {
    prompt,
    width = 1920,
    height = 1080,
  } = req.body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'prompt is required' })
    return
  }

  try {
    const result = await generateObjectFunctions(prompt, width, height)

    // Validate each object has svgMarkup
    const validatedObjects = result.objects.map((obj) => {
      if (!obj.svgMarkup || obj.svgMarkup.trim().length === 0) {
        return { ...obj, error: 'Empty SVG markup' }
      }
      return obj
    })

    res.json({
      objects: validatedObjects,
      background: result.background,
      width,
      height,
    })
  } catch (err) {
    console.error('generate-objects error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to generate objects',
    })
  }
})

export default router
