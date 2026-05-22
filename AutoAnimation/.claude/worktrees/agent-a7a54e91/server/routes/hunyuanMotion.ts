/**
 * HunyuanMotion proxy routes for text-to-3D-motion generation.
 * Connects to the tencent/HY-Motion-1.0 HuggingFace Space via @gradio/client.
 *
 * Endpoints:
 *   POST /generate       — Start motion generation from text prompt
 *   GET  /task/:taskId   — Poll generation status / download result
 *
 * Gradio parameter names (from view_api):
 *   /_prompt_engineering:   text, duration
 *   /generate_motion_func: original_text, rewritten_text, seed_input, motion_duration, cfg_scale
 */
import { Router, type Request, type Response } from 'express'
import { Client } from '@gradio/client'

const router = Router()

// Prevent @gradio/client errors from crashing the entire Node process
process.on('unhandledRejection', (reason) => {
  console.error('[HunyuanMotion] Unhandled promise rejection (caught at process level):')
  console.error(reason)
})

// In-memory task store (for async Gradio calls)
interface MotionTask {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  progress: number
  prompt: string
  duration: number
  fps: number
  resultPath?: string
  error?: string
  createdAt: number
}

const tasks = new Map<string, MotionTask>()

const HF_SPACE = 'tencent/HY-Motion-1.0'

function getHFToken(): string | null {
  return process.env.HF_TOKEN || null
}

// POST /generate — Start a motion generation task
router.post('/generate', async (req: Request, res: Response) => {
  console.log('[HunyuanMotion] POST /generate received, body:', JSON.stringify(req.body))

  try {
    const { prompt, duration = 3, fps = 30 } = req.body

    if (!prompt) {
      res.status(400).json({ error: 'Missing required field: prompt' })
      return
    }

    const taskId = `motion_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    const task: MotionTask = {
      id: taskId,
      status: 'processing',
      progress: 0,
      prompt,
      duration,
      fps,
      createdAt: Date.now(),
    }
    tasks.set(taskId, task)

    console.log(`[HunyuanMotion] [${taskId}] Created. Prompt: "${prompt}" (${duration}s, ${fps}fps)`)

    // Start async generation — fire-and-forget with catch
    generateMotionAsync(task).catch((error) => {
      console.error(`[HunyuanMotion] [${taskId}] Async generation failed:`, error instanceof Error ? error.message : String(error))
      if (error instanceof Error && error.stack) console.error(error.stack)
      task.status = 'failed'
      task.error = error instanceof Error ? error.message : 'Unknown error'
    })

    res.json({ taskId, status: 'processing' })
  } catch (error) {
    console.error('[HunyuanMotion] POST /generate error:', error)
    res.status(500).json({
      error: 'Failed to start motion generation',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// GET /task/:taskId — Poll task status
router.get('/task/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params
    const task = tasks.get(taskId)

    if (!task) {
      res.status(404).json({ error: 'Task not found' })
      return
    }

    console.log(`[HunyuanMotion] [${taskId}] Poll — status=${task.status}, progress=${task.progress}${task.error ? `, error="${task.error}"` : ''}`)

    const response: Record<string, unknown> = {
      status: task.status,
      progress: task.progress,
    }

    if (task.status === 'complete' && task.resultPath) {
      response.glbUrl = `/api/motion/download/${taskId}`
      response.fileFormat = task.resultPath.toLowerCase().endsWith('.fbx') ? 'fbx' : 'glb'
    }

    if (task.error) {
      response.error = task.error
    }

    res.json(response)
  } catch (error) {
    console.error('[HunyuanMotion] task poll error:', error)
    res.status(500).json({ error: 'Failed to check task status' })
  }
})

// GET /download/:taskId — Download the generated file
router.get('/download/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params
    const task = tasks.get(taskId)

    if (!task || task.status !== 'complete' || !task.resultPath) {
      res.status(404).json({ error: 'Result not available' })
      return
    }

    console.log(`[HunyuanMotion] [${taskId}] Download — resultPath=${task.resultPath}`)

    const isFbx = task.resultPath.toLowerCase().endsWith('.fbx')
    const contentType = isFbx ? 'application/octet-stream' : 'model/gltf-binary'
    const ext = isFbx ? 'fbx' : 'glb'

    if (task.resultPath.startsWith('http')) {
      console.log(`[HunyuanMotion] [${taskId}] Fetching remote: ${task.resultPath}`)
      const fileRes = await fetch(task.resultPath)
      if (!fileRes.ok) {
        console.error(`[HunyuanMotion] [${taskId}] Remote fetch failed: ${fileRes.status} ${fileRes.statusText}`)
        res.status(500).json({ error: 'Failed to download result from Gradio' })
        return
      }
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      console.log(`[HunyuanMotion] [${taskId}] Downloaded ${buffer.length} bytes as .${ext}`)
      res.set('Content-Type', contentType)
      res.set('Content-Disposition', `attachment; filename="motion_${taskId}.${ext}"`)
      res.send(buffer)
    } else {
      res.set('Content-Type', contentType)
      res.sendFile(task.resultPath)
    }
  } catch (error) {
    console.error('[HunyuanMotion] download error:', error)
    res.status(500).json({ error: 'Failed to download result' })
  }
})

// ─── Async Generation ───────────────────────────────────────────────────────

async function generateMotionAsync(task: MotionTask): Promise<void> {
  const hfToken = getHFToken()

  console.log(`[HunyuanMotion] [${task.id}] Connecting to ${HF_SPACE}...`)
  task.progress = 10

  const client = await Client.connect(HF_SPACE, {
    hf_token: (hfToken || undefined) as `hf_${string}` | undefined,
  })
  console.log(`[HunyuanMotion] [${task.id}] Connected`)

  task.progress = 20

  // Step 1: Prompt engineering (optional — improve motion quality)
  let rewrittenText = task.prompt
  try {
    console.log(`[HunyuanMotion] [${task.id}] Step 1: /_prompt_engineering (text="${task.prompt}", duration=${task.duration})`)

    const peResult = await client.predict('/_prompt_engineering', {
      text: task.prompt,
      duration: task.duration,
    })

    const peData = peResult.data as unknown[]
    console.log(`[HunyuanMotion] [${task.id}] Prompt engineering result: ${JSON.stringify(peData).slice(0, 500)}`)

    if (peData && peData.length > 0) {
      const text = typeof peData[0] === 'string' ? peData[0] : (peData[0] as any)?.value
      if (text && typeof text === 'string' && text.trim()) {
        rewrittenText = text.trim()
        console.log(`[HunyuanMotion] [${task.id}] Rewritten: "${rewrittenText}"`)
      }
      // Check for adjusted duration in second return value
      if (peData.length > 1) {
        const dur = typeof peData[1] === 'number' ? peData[1] : parseFloat(String(peData[1]))
        if (!isNaN(dur) && dur > 0) {
          task.duration = dur
          console.log(`[HunyuanMotion] [${task.id}] Duration adjusted to ${dur}s`)
        }
      }
    }
  } catch (peErr) {
    console.warn(`[HunyuanMotion] [${task.id}] Prompt engineering failed (continuing with original):`, peErr instanceof Error ? peErr.message : String(peErr))
  }

  task.progress = 40

  // Step 2: Generate motion
  const seed = Math.floor(Math.random() * 999999).toString()
  const cfgScale = 7.5

  const args = {
    original_text: task.prompt,
    rewritten_text: rewrittenText,
    seed_input: seed,
    motion_duration: task.duration,
    cfg_scale: cfgScale,
  }

  console.log(`[HunyuanMotion] [${task.id}] Step 2: /generate_motion_func args=${JSON.stringify(args)}`)

  const result = await client.predict('/generate_motion_func', args)

  task.progress = 90

  const data = result.data as unknown[]
  console.log(`[HunyuanMotion] [${task.id}] Result: ${data?.length ?? 0} elements`)
  if (data) {
    for (let i = 0; i < data.length; i++) {
      const s = typeof data[i] === 'object' ? JSON.stringify(data[i]).slice(0, 300) : String(data[i]).slice(0, 200)
      console.log(`[HunyuanMotion] [${task.id}]   [${i}] (${typeof data[i]}): ${s}`)
    }
  }

  // Extract file URL/path — the FBX file is typically at index 1
  // (index 0 is the HTML 3D viewer)
  task.resultPath = extractFilePath(data)

  if (task.resultPath) {
    task.status = 'complete'
    task.progress = 100
    console.log(`[HunyuanMotion] [${task.id}] COMPLETE — ${task.resultPath}`)
  } else {
    task.status = 'failed'
    task.error = 'No output file returned from model'
    console.error(`[HunyuanMotion] [${task.id}] FAILED — no file found in response`)
  }
}

/** Walk through Gradio result data and find a file URL or path */
function extractFilePath(data: unknown[] | null): string | undefined {
  if (!data) return undefined

  // Check each element for url/path properties
  for (let i = data.length - 1; i >= 0; i--) {
    const elem = data[i] as any
    if (!elem) continue

    // Direct url/path
    if (elem.url && typeof elem.url === 'string') return elem.url
    if (elem.path && typeof elem.path === 'string') return elem.path

    // Nested value object
    if (elem.value?.url && typeof elem.value.url === 'string') return elem.value.url
    if (elem.value?.path && typeof elem.value.path === 'string') return elem.value.path

    // Array of files (e.g. [{url: "..."}, ...])
    if (Array.isArray(elem)) {
      for (const item of elem) {
        if (item?.url && typeof item.url === 'string') return item.url
        if (item?.path && typeof item.path === 'string') return item.path
      }
    }

    // String that looks like a file path or URL
    if (typeof elem === 'string' && (elem.endsWith('.fbx') || elem.endsWith('.glb') || elem.startsWith('http'))) {
      return elem
    }
  }

  return undefined
}

export default router
