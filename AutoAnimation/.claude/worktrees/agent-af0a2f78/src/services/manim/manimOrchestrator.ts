// ─── Manim Pipeline Orchestrator ────────────────────────────────────────────
// Coordinates all agents in sequence: plan -> decompose -> generate code ->
// render -> narrate -> assemble. Updates the Zustand store at each step.

import type {
  ManimGenerationSettings,
  ManimCodeResult,
  RenderJob,
  ManimVideoMetadata,
  TimelineAnnotation,
  SceneSpec,
  NarrationResult,
} from '@/services/manim/types'
import { useManimStore } from '@/stores/useManimStore'
import { planScript } from './agents/scriptPlanner'
import { decomposeScenes } from './agents/sceneDecomposer'
import { narrateAllScenes } from './agents/narrator'

// ─── Helpers ────────────────────────────────────────────────────────────────

type StoreState = ReturnType<typeof useManimStore.getState>

function updateStore(partial: Partial<StoreState>) {
  useManimStore.setState(partial)
}

async function generateCodeForScene(scene: SceneSpec): Promise<ManimCodeResult> {
  const res = await fetch('/api/manim/generate-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneSpec: scene }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Code generation failed for scene ${scene.index}: ${errorBody}`)
  }

  // Server returns ManimCodeOutput { code, className, ... } — map to client ManimCodeResult
  const data = await res.json()
  return {
    sceneIndex: scene.index,
    pythonCode: data.code,
    className: data.className,
    retryCount: data.retryCount ?? 0,
    errors: data.errors ?? [],
    visualApproved: data.visualApproved ?? false,
  }
}

async function renderScene(codeResult: ManimCodeResult): Promise<RenderJob> {
  // Submit render job — server expects { code, className, quality?, async? }
  const submitRes = await fetch('/api/manim/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: codeResult.pythonCode,
      className: codeResult.className,
    }),
  })

  if (!submitRes.ok) {
    const errorBody = await submitRes.text()
    throw new Error(`Render submission failed for scene ${codeResult.sceneIndex}: ${errorBody}`)
  }

  // Server doesn't return sceneIndex — attach it from the code result
  const job = (await submitRes.json()) as RenderJob
  job.sceneIndex = codeResult.sceneIndex

  // Poll until completed or failed
  let current = job
  while (current.status === 'queued' || current.status === 'rendering') {
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const statusRes = await fetch(`/api/manim/status/${current.jobId}`)
    if (!statusRes.ok) {
      throw new Error(`Status check failed for job ${current.jobId}`)
    }
    current = (await statusRes.json()) as RenderJob
    current.sceneIndex = codeResult.sceneIndex
  }

  if (current.status === 'failed') {
    throw new Error(`Render failed for scene ${codeResult.sceneIndex}: ${current.error}`)
  }

  return current
}

/**
 * Build dense timeline annotations (one per 0.5s window) from scene specs
 * and their render durations.
 */
function buildTimelineAnnotations(
  scenes: SceneSpec[],
  renderJobs: RenderJob[],
): { timeline: TimelineAnnotation[]; sceneBoundaries: number[] } {
  const timeline: TimelineAnnotation[] = []
  const sceneBoundaries: number[] = []
  let currentTime = 0

  for (const scene of scenes) {
    sceneBoundaries.push(currentTime)

    // Use actual render duration if available, otherwise fall back to spec
    const renderJob = renderJobs.find((j) => j.sceneIndex === scene.index)
    const sceneDuration = renderJob?.durationSeconds ?? scene.durationSeconds
    const contextCount = scene.explanationContexts.length

    // Map explanation contexts evenly across the scene duration
    const windowDuration = 0.5
    const windowCount = Math.max(1, Math.floor(sceneDuration / windowDuration))

    for (let w = 0; w < windowCount; w++) {
      // Pick the closest explanation context for this time window
      const contextIndex = Math.min(Math.floor((w / windowCount) * contextCount), contextCount - 1)
      const context = scene.explanationContexts[Math.max(0, contextIndex)]

      if (context) {
        timeline.push({
          startTime: currentTime + w * windowDuration,
          endTime: currentTime + (w + 1) * windowDuration,
          context,
          sceneIndex: scene.index,
        })
      }
    }

    currentTime += sceneDuration
  }

  return { timeline, sceneBoundaries }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

export async function runManimPipeline(settings: ManimGenerationSettings): Promise<void> {
  try {
    // Initialize pipeline state
    updateStore({
      step: 'planning-script',
      settings,
      error: null,
      stepProgress: 0,
      currentSceneIndex: 0,
      topicScript: null,
      sceneSpecs: null,
      codeResults: [],
      renderJobs: [],
      narrationResults: [],
      finalVideoUrl: null,
      videoMetadata: null,
    })

    // ── Step 1: Plan Script ───────────────────────────────────────────────
    const topicScript = await planScript(settings)
    updateStore({ topicScript, stepProgress: 100 })

    // ── Step 2: Decompose Scenes ──────────────────────────────────────────
    updateStore({ step: 'decomposing-scenes', stepProgress: 0 })
    const sceneSpecs = await decomposeScenes(topicScript, settings)
    updateStore({ sceneSpecs, stepProgress: 100 })

    // ── Step 3: Generate Code ─────────────────────────────────────────────
    updateStore({ step: 'generating-code', stepProgress: 0 })
    const codeResults: ManimCodeResult[] = []

    for (let i = 0; i < sceneSpecs.length; i++) {
      updateStore({
        currentSceneIndex: i,
        stepProgress: Math.round((i / sceneSpecs.length) * 100),
      })
      const codeResult = await generateCodeForScene(sceneSpecs[i])
      codeResults.push(codeResult)
      updateStore({ codeResults: [...codeResults] })
    }
    updateStore({ stepProgress: 100 })

    // ── Step 4: Render Scenes ─────────────────────────────────────────────
    updateStore({ step: 'rendering', stepProgress: 0 })
    const renderJobs: RenderJob[] = []

    for (let i = 0; i < codeResults.length; i++) {
      updateStore({
        currentSceneIndex: i,
        stepProgress: Math.round((i / codeResults.length) * 100),
      })
      const renderJob = await renderScene(codeResults[i])
      renderJobs.push(renderJob)
      updateStore({ renderJobs: [...renderJobs] })
    }
    updateStore({ stepProgress: 100 })

    // ── Step 5: Narrate Scenes ────────────────────────────────────────────
    updateStore({ step: 'narrating', stepProgress: 0 })
    const narrationResults: NarrationResult[] = await narrateAllScenes(sceneSpecs, settings.voiceId)
    updateStore({ narrationResults, stepProgress: 100 })

    // ── Step 6: Assemble ──────────────────────────────────────────────────
    updateStore({ step: 'assembling', stepProgress: 0 })

    const { timeline, sceneBoundaries } = buildTimelineAnnotations(sceneSpecs, renderJobs)

    const totalDuration = renderJobs.reduce((sum, job) => sum + (job.durationSeconds ?? 0), 0)

    const videoMetadata: ManimVideoMetadata = {
      topic: topicScript.topic,
      totalDurationSeconds: totalDuration,
      sceneCount: sceneSpecs.length,
      knowledgeGraph: topicScript.knowledgeGraph,
      timeline,
      sceneBoundaries,
    }

    // Use the last render job's video URL as the final assembled video
    // (In production, a server-side concatenation step would combine all scene videos)
    const lastCompletedRender = renderJobs.find((j) => j.status === 'completed' && j.videoUrl)
    const finalVideoUrl = lastCompletedRender?.videoUrl ?? null

    updateStore({
      videoMetadata,
      finalVideoUrl,
      stepProgress: 100,
    })

    // ── Done ──────────────────────────────────────────────────────────────
    updateStore({ step: 'completed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    updateStore({ step: 'error', error: message })
    throw err
  }
}
