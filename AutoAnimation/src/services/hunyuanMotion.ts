/**
 * HunyuanMotion client for text-to-3D-motion generation.
 * All requests go through our Express backend proxy at /api/motion/*.
 *
 * The HuggingFace Space returns FBX files — these are automatically
 * converted to GLB client-side using the existing fbxConverter service.
 */
import type { MotionGenerateRequest, MotionTaskStatus } from '@/types/character3d'
import { convertFbxBlobToGlb } from '@/services/fbxConverter'
import { withCreditGate } from './creditGate'

const API_BASE = '/api/motion'

// ─── API Calls ──────────────────────────────────────────────────────────────

/** Start a motion generation task */
export async function startMotionGeneration(request: MotionGenerateRequest): Promise<{ taskId: string }> {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Failed to start motion generation')
  }

  return res.json()
}

/** Poll a motion generation task status */
export async function pollMotionTask(taskId: string): Promise<MotionTaskStatus> {
  const res = await fetch(`${API_BASE}/task/${taskId}`)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Failed to check motion task status')
  }

  return res.json()
}

/** Download the generated animation file (may be FBX or GLB) */
export async function downloadMotionFile(taskId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/download/${taskId}`)

  if (!res.ok) {
    throw new Error('Failed to download motion file')
  }

  return res.blob()
}

// Keep backwards-compatible alias
export const downloadMotionGLB = downloadMotionFile

// ─── Polling Helper ─────────────────────────────────────────────────────────

export interface MotionPollOptions {
  intervalMs?: number
  maxWaitMs?: number
  onProgress?: (progress: number, status: string) => void
}

/** Poll a motion task until it completes or fails */
export async function pollMotionUntilComplete(
  taskId: string,
  options: MotionPollOptions = {}
): Promise<MotionTaskStatus> {
  const { intervalMs = 5000, maxWaitMs = 600000, onProgress } = options
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const status = await pollMotionTask(taskId)

    onProgress?.(status.progress, status.status)

    if (status.status === 'complete') return status
    if (status.status === 'failed') {
      throw new Error(status.error || 'Motion generation failed')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Motion generation timed out')
}

// ─── Full Pipeline ──────────────────────────────────────────────────────────

/**
 * Complete motion generation pipeline:
 * 1. Start generation from text prompt
 * 2. Poll until complete
 * 3. Download file (FBX or GLB)
 * 4. Convert FBX→GLB if needed
 * Returns the GLB blob for storage in IndexedDB.
 */
export async function generateMotion(
  prompt: string,
  duration: number = 3,
  fps: number = 30,
  onProgress?: (step: string, progress: number) => void
): Promise<{ glbBlob: Blob; taskId: string }> {
  return withCreditGate('hunyuan-motion', async () => {
    // Step 1: Start generation
    onProgress?.('Starting motion generation...', 10)
    const { taskId } = await startMotionGeneration({ prompt, duration, fps })

    // Step 2: Poll until complete
    const taskResult = await pollMotionUntilComplete(taskId, {
      onProgress: (progress) => {
        onProgress?.('Generating motion...', Math.min(10 + progress * 0.7, 80))
      },
    })

    // Step 3: Download file
    onProgress?.('Downloading animation...', 85)
    const fileBlob = await downloadMotionFile(taskId)

    // Step 4: Convert FBX→GLB if the Space returned FBX
    let glbBlob: Blob
    if (taskResult.fileFormat === 'fbx') {
      onProgress?.('Converting FBX to GLB...', 90)
      glbBlob = await convertFbxBlobToGlb(fileBlob)
    } else {
      glbBlob = fileBlob
    }

    onProgress?.('Complete!', 100)

    return { glbBlob, taskId }
  })
}
