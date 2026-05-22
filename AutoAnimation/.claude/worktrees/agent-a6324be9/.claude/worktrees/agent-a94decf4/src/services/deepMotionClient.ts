/**
 * DeepMotion Client — calls our Express proxy for cloud motion capture.
 *
 * Flow:
 *   1. startDeepMotionJob(videoBlob)  → { rid }
 *   2. pollDeepMotionStatus(rid)      → DeepMotionJobStatus
 *   3. getDeepMotionDownloads(rid)    → DeepMotionDownload[]
 *   4. downloadDeepMotionGLB(url)     → Blob
 */

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface DeepMotionJobStatus {
  status: 'PROGRESS' | 'SUCCESS' | 'FAILURE' | string
  count?: number
  total?: number
  /** Human-readable status message */
  message?: string
}

export interface DeepMotionDownload {
  /** File format (e.g. "glb", "fbx", "bvh") */
  format: string
  /** Download URL */
  url: string
}

export interface DeepMotionProcessOptions {
  /** Enable face tracking */
  face?: boolean
  /** Enable hand tracking */
  hand?: boolean
  /** Target FPS */
  fps?: number
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Upload a video and start a DeepMotion motion capture job.
 * Returns the request ID (rid) for polling.
 */
export async function startDeepMotionJob(
  videoBlob: Blob,
  options?: DeepMotionProcessOptions
): Promise<{ rid: string }> {
  const params = new URLSearchParams()
  if (options?.face) params.set('face', 'true')
  if (options?.hand) params.set('hand', 'true')
  if (options?.fps) params.set('fps', String(options.fps))

  const qs = params.toString()
  const url = `/api/deepmotion/process${qs ? `?${qs}` : ''}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': videoBlob.type || 'video/mp4' },
    body: videoBlob,
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(data.error || `DeepMotion process failed (${res.status})`)
  }

  return res.json()
}

/**
 * Poll the status of a DeepMotion job.
 */
export async function pollDeepMotionStatus(rid: string): Promise<DeepMotionJobStatus> {
  const res = await fetch(`/api/deepmotion/status/${rid}`)

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(data.error || `DeepMotion status check failed (${res.status})`)
  }

  return res.json()
}

/**
 * Get download URLs for a completed DeepMotion job.
 */
export async function getDeepMotionDownloads(rid: string): Promise<DeepMotionDownload[]> {
  const res = await fetch(`/api/deepmotion/download/${rid}`)

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(data.error || `DeepMotion download failed (${res.status})`)
  }

  return res.json()
}

/**
 * Download a GLB file from a DeepMotion download URL.
 * Returns the raw blob for loading into Three.js.
 */
export async function downloadDeepMotionGLB(url: string): Promise<Blob> {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Failed to download GLB (${res.status})`)
  }

  return res.blob()
}
