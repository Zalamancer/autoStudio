/**
 * Meshy API client for 3D character generation and auto-rigging.
 * All requests go through our Express backend proxy at /api/meshy/*.
 */
import type {
  MeshyTextTo3DRequest,
  MeshyImageTo3DRequest,
  MeshyTaskStatus,
  MeshyAutoRigRequest,
  MeshyRigStatus,
  MeshyRemeshRequest,
  MeshyRemeshStatus,
} from '@/types/character3d'
import { withCreditGate } from './creditGate'

const API_BASE = '/api/meshy'

// ─── API Calls ──────────────────────────────────────────────────────────────

/** Start a text-to-3D generation task */
export async function startTextTo3D(request: MeshyTextTo3DRequest): Promise<{ taskId: string }> {
  return withCreditGate('meshy-text-to-3d', async () => {
    const res = await fetch(`${API_BASE}/text-to-3d`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || 'Failed to start text-to-3D generation')
    }

    return res.json()
  })
}

/** Start an image-to-3D generation task */
export async function startImageTo3D(request: MeshyImageTo3DRequest): Promise<{ taskId: string }> {
  return withCreditGate('meshy-image-to-3d', async () => {
    const res = await fetch(`${API_BASE}/image-to-3d`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || 'Failed to start image-to-3D generation')
    }

    return res.json()
  })
}

/** Poll a generation task status */
export async function pollTask(taskId: string): Promise<MeshyTaskStatus> {
  const res = await fetch(`${API_BASE}/task/${taskId}`)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Failed to check task status')
  }

  return res.json()
}

/** Start auto-rigging on a generated model */
export async function startAutoRig(request: MeshyAutoRigRequest): Promise<{ taskId: string }> {
  return withCreditGate('meshy-auto-rig', async () => {
    const res = await fetch(`${API_BASE}/auto-rig`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(error.error || 'Failed to start auto-rigging')
    }

    return res.json()
  })
}

/** Poll a rigging task status */
export async function pollRigTask(taskId: string): Promise<MeshyRigStatus> {
  const res = await fetch(`${API_BASE}/rig/${taskId}`)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Failed to check rigging status')
  }

  return res.json()
}

// ─── Polling Helper ─────────────────────────────────────────────────────────

export interface PollOptions {
  intervalMs?: number
  maxWaitMs?: number
  onProgress?: (progress: number, status: string) => void
}

// ─── Remesh API ─────────────────────────────────────────────────────────────

/** Start a remesh (decimation) task to reduce polygon count */
export async function startRemesh(request: MeshyRemeshRequest): Promise<{ taskId: string }> {
  const res = await fetch(`${API_BASE}/remesh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelUrl: request.modelUrl,
      targetPolycount: request.targetPolycount ?? 30000,
    }),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Failed to start remeshing')
  }

  return res.json()
}

/** Poll a remesh task status */
export async function pollRemeshTask(taskId: string): Promise<MeshyRemeshStatus> {
  const res = await fetch(`${API_BASE}/remesh/${taskId}`)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error.error || 'Failed to check remesh status')
  }

  return res.json()
}

/** Poll a remesh task until it completes or fails */
export async function pollRemeshUntilComplete(
  taskId: string,
  options: PollOptions = {}
): Promise<MeshyRemeshStatus> {
  const { intervalMs = 5000, maxWaitMs = 600000, onProgress } = options
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const status = await pollRemeshTask(taskId)

    onProgress?.(status.progress, status.status)

    if (status.status === 'complete') return status
    if (status.status === 'failed') {
      throw new Error(status.error || 'Remeshing failed')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Remeshing timed out')
}

/** Poll a task until it completes or fails */
export async function pollUntilComplete(
  taskId: string,
  options: PollOptions = {}
): Promise<MeshyTaskStatus> {
  const { intervalMs = 3000, maxWaitMs = 600000, onProgress } = options
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const status = await pollTask(taskId)

    onProgress?.(status.progress, status.status)

    if (status.status === 'complete') return status
    if (status.status === 'failed') {
      throw new Error(status.error || 'Generation failed')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Generation timed out')
}

/** Poll a rig task until it completes or fails */
export async function pollRigUntilComplete(
  taskId: string,
  options: PollOptions = {}
): Promise<MeshyRigStatus> {
  const { intervalMs = 3000, maxWaitMs = 300000, onProgress } = options
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const status = await pollRigTask(taskId)

    onProgress?.(0, status.status)

    if (status.status === 'complete') return status
    if (status.status === 'failed') {
      throw new Error(status.error || 'Rigging failed')
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }

  throw new Error('Rigging timed out')
}

// ─── Full Pipeline ──────────────────────────────────────────────────────────

/**
 * Complete text-to-3D pipeline: generate model → auto-rig → return rigged GLB URL.
 */
export async function generateAndRig3DCharacter(
  prompt: string,
  style: 'realistic' | 'cartoon' | 'anime' = 'realistic',
  onProgress?: (step: string, progress: number) => void
): Promise<{ modelUrl: string; thumbnailUrl?: string }> {
  // Step 1: Generate 3D model
  onProgress?.('Generating 3D model...', 10)
  const { taskId } = await startTextTo3D({ prompt, style })

  const genResult = await pollUntilComplete(taskId, {
    onProgress: (progress) => {
      onProgress?.('Generating 3D model...', Math.min(10 + progress * 0.4, 50))
    },
  })

  if (!genResult.modelUrl) {
    throw new Error('No model URL returned from generation')
  }

  // Step 2: Auto-rig
  onProgress?.('Auto-rigging skeleton...', 55)
  const { taskId: rigTaskId } = await startAutoRig({ modelUrl: genResult.modelUrl })

  const rigResult = await pollRigUntilComplete(rigTaskId, {
    onProgress: () => {
      onProgress?.('Auto-rigging skeleton...', 75)
    },
  })

  if (!rigResult.riggedModelUrl) {
    throw new Error('No rigged model URL returned')
  }

  onProgress?.('Complete!', 100)

  return {
    modelUrl: rigResult.riggedModelUrl,
    thumbnailUrl: genResult.thumbnailUrl,
  }
}
