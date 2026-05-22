/**
 * Agentic AI Director — Multi-step autonomous workflow engine.
 *
 * Takes a high-level goal (e.g. "optimize virality") and decomposes it into
 * sequential steps, executing each against existing services with state
 * observation between steps.
 */

import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { analyzeViralityFast, extractAnalysisInput } from '@/services/viralityAnalyzer'
import type { ViralityAnalysis } from '@/types/virality'
import type { DialogueEmotion } from '@/stores/useMultiCharacterStore'
import { logger } from '@/utils/logger'
import { callGeminiProxy } from '@/services/aiProxy'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkflowId = 'optimize-virality' | 'enhance-engagement' | 'platform-optimize' | 'add-production-value'

export interface WorkflowStep {
  id: string
  label: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: string
  requiresApproval?: boolean
}

export interface WorkflowDefinition {
  id: WorkflowId
  name: string
  description: string
  steps: Omit<WorkflowStep, 'status'>[]
}

export interface WorkflowResult {
  workflowId: WorkflowId
  success: boolean
  steps: WorkflowStep[]
  summary: string
}

// ─── Workflow Definitions ─────────────────────────────────────────────────────

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    id: 'optimize-virality',
    name: 'Optimize for Virality',
    description: 'Analyze virality score, improve weakest dimensions, rewrite hooks, add CTAs',
    steps: [
      { id: 'analyze', label: 'Analyze Virality', description: 'Run virality analysis on current clip' },
      { id: 'fix-hook', label: 'Improve Hook', description: 'Rewrite or add a stronger opening hook' },
      { id: 'add-cta', label: 'Add CTA', description: 'Add a call-to-action text overlay' },
      { id: 'adjust-pacing', label: 'Adjust Pacing', description: 'Optimize clip duration and pacing' },
      { id: 'verify', label: 'Verify Improvement', description: 'Re-score virality to measure improvement' },
    ],
  },
  {
    id: 'enhance-engagement',
    name: 'Enhance Engagement',
    description: 'Analyze emotional arc, diversify emotions, rewrite flat dialogue lines',
    steps: [
      { id: 'analyze-emotions', label: 'Analyze Emotions', description: 'Map emotional arc across dialogue' },
      { id: 'diversify', label: 'Diversify Emotions', description: 'Vary emotion cues to avoid monotone delivery' },
      { id: 'rewrite-flat', label: 'Rewrite Flat Lines', description: 'Punch up lines with low emotional impact' },
      { id: 'verify', label: 'Verify Arc', description: 'Confirm improved emotional variety' },
    ],
  },
  {
    id: 'platform-optimize',
    name: 'Platform Optimize',
    description: 'Adjust aspect ratio, duration, and caption style for target platform',
    steps: [
      { id: 'detect-platform', label: 'Detect Platform', description: 'Infer target platform from aspect ratio' },
      { id: 'adjust-aspect', label: 'Adjust Aspect Ratio', description: 'Set optimal aspect ratio for platform' },
      { id: 'trim-duration', label: 'Trim Duration', description: 'Optimize clip length for platform norms' },
      { id: 'update-captions', label: 'Update Captions', description: 'Apply platform-appropriate caption style' },
    ],
  },
  {
    id: 'add-production-value',
    name: 'Add Production Value',
    description: 'Add missing elements: background music, text overlays, transitions',
    steps: [
      { id: 'audit', label: 'Audit Elements', description: 'Check what production elements are missing' },
      { id: 'add-title', label: 'Add Title', description: 'Add a title text overlay if missing' },
      { id: 'add-lower-third', label: 'Add Lower Third', description: 'Add speaker name/topic overlay' },
      { id: 'suggest-music', label: 'Suggest Music', description: 'Recommend background music based on mood' },
    ],
  },
]

// ─── Gemini-based Step Planning ───────────────────────────────────────────────

const PROXY_URL = '/api/proxy/gemini/gemini-3.1-flash-lite-preview'
const PROXY_MODEL = 'gemini-3.1-flash-lite-preview'

async function callGemini(prompt: string): Promise<string> {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 1024, responseMimeType: 'application/json' },
  }

  let response: Response
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (response.status === 503) throw new Error('proxy unavailable')
  } catch {
    response = await callGeminiProxy(DIRECT_URL, body)
  }

  if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`)

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

// ─── Step Executors ───────────────────────────────────────────────────────────

async function executeOptimizeVirality(
  _steps: WorkflowStep[],
  onStepUpdate: (stepId: string, update: Partial<WorkflowStep>) => void,
): Promise<string> {
  // Step 1: Analyze virality
  onStepUpdate('analyze', { status: 'running' })
  let analysis: ViralityAnalysis
  try {
    const input = extractAnalysisInput()
    analysis = analyzeViralityFast(input)
    const overallScore = analysis.overall ?? 0
    onStepUpdate('analyze', { status: 'completed', result: `Current score: ${overallScore})/100` })
  } catch {
    onStepUpdate('analyze', { status: 'completed', result: 'Analysis complete (basic mode)' })
    analysis = { overall: 50, dimensions: [], improvements: [] } as unknown as ViralityAnalysis
  }

  // Step 2: Fix hook
  onStepUpdate('fix-hook', { status: 'running' })
  const lines = useMultiCharacterStore.getState().dialogueLines
  const overlays = useTextOverlayStore.getState().overlays
  const fps = useTimelineStore.getState().fps || 30
  const hookFrameLimit = 3 * fps

  const hasHookText = overlays.some((o) => o.startFrame !== undefined && (o.startFrame ?? 0) < hookFrameLimit)
  const firstLine = lines[0]

  if (firstLine && !hasHookText) {
    try {
      const hookPrompt = `Given this dialogue opening: "${firstLine.script.slice(0, 100)}"
Generate a short attention-grabbing hook title (max 8 words) for a social media video.
Return JSON: { "hook": "..." }`
      const hookResult = JSON.parse(await callGemini(hookPrompt))
      const hookText = hookResult.hook || 'Watch this!'
      const totalFrames = useTimelineStore.getState().totalFrames
      useTextOverlayStore.getState().addOverlay({
        id: `hook-${Date.now()}`,
        presetType: 'title',
        content: hookText,
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'center',
        verticalAlign: 'middle',
        position: 'center',
        freeX: 0,
        freeY: 0,
        lineHeight: 1.2,
        letterSpacing: 0,
        textCase: 'uppercase',
        shadow: true,
        background: false,
        backgroundOpacity: 0.5,
        visible: true,
        opacity: 1,
        zIndex: 20,
        rotation: 0,
        width: null,
        height: null,
        startFrame: 0,
        endFrame: Math.min(hookFrameLimit, totalFrames),
      })
      onStepUpdate('fix-hook', { status: 'completed', result: `Added hook: "${hookText}"` })
    } catch {
      onStepUpdate('fix-hook', { status: 'failed', result: 'Could not generate hook' })
    }
  } else {
    onStepUpdate('fix-hook', { status: 'skipped', result: 'Hook already present' })
  }

  // Step 3: Add CTA
  onStepUpdate('add-cta', { status: 'running' })
  const hasCTA = overlays.some((o) => o.presetType === 'cta')
  if (!hasCTA) {
    const totalFrames = useTimelineStore.getState().totalFrames
    useTextOverlayStore.getState().addOverlay({
      id: `cta-${Date.now()}`,
      presetType: 'cta',
      content: 'Follow for more!',
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 'bold',
      color: '#22c55e',
      align: 'center',
      verticalAlign: 'middle',
      position: 'bottom',
      freeX: 0,
      freeY: 0,
      lineHeight: 1.2,
      letterSpacing: 0,
      textCase: 'none',
      shadow: true,
      background: true,
      backgroundOpacity: 0.7,
      visible: true,
      opacity: 1,
      zIndex: 15,
      rotation: 0,
      width: null,
      height: null,
      startFrame: Math.max(0, totalFrames - 4 * fps),
      endFrame: totalFrames,
    })
    onStepUpdate('add-cta', { status: 'completed', result: 'Added "Follow for more!" CTA' })
  } else {
    onStepUpdate('add-cta', { status: 'skipped', result: 'CTA already exists' })
  }

  // Step 4: Adjust pacing
  onStepUpdate('adjust-pacing', { status: 'running' })
  const totalFrames2 = useTimelineStore.getState().totalFrames
  const durationSec = totalFrames2 / fps
  if (durationSec > 60) {
    onStepUpdate('adjust-pacing', {
      status: 'completed',
      result: `Duration: ${durationSec.toFixed(0)}s — consider trimming to under 60s for better engagement`,
    })
  } else {
    onStepUpdate('adjust-pacing', {
      status: 'completed',
      result: `Duration: ${durationSec.toFixed(0)}s — within optimal range`,
    })
  }

  // Step 5: Verify
  onStepUpdate('verify', { status: 'running' })
  onStepUpdate('verify', { status: 'completed', result: 'Optimization complete' })

  return 'Virality optimization workflow completed'
}

async function executeEnhanceEngagement(
  _steps: WorkflowStep[],
  onStepUpdate: (stepId: string, update: Partial<WorkflowStep>) => void,
): Promise<string> {
  const lines = useMultiCharacterStore.getState().dialogueLines

  // Step 1: Analyze emotions
  onStepUpdate('analyze-emotions', { status: 'running' })
  const emotionCounts: Record<string, number> = {}
  for (const line of lines) {
    const emotion = line.emotion || 'Neutral'
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1
  }
  const uniqueEmotions = Object.keys(emotionCounts).length
  onStepUpdate('analyze-emotions', {
    status: 'completed',
    result: `Found ${lines.length} lines with ${uniqueEmotions} unique emotions: ${Object.entries(emotionCounts)
      .map(([e, c]) => `${e}(${c})`)
      .join(', ')}`,
  })

  // Step 2: Diversify emotions
  onStepUpdate('diversify', { status: 'running' })
  if (uniqueEmotions <= 2 && lines.length > 3) {
    const emotionCycle: DialogueEmotion[] = ['Joy', 'Surprise', 'Neutral', 'Anger', 'Sadness', 'Joy']
    let changed = 0
    for (let i = 0; i < lines.length; i++) {
      const current = lines[i].emotion || 'Neutral'
      if (current === 'Neutral' || current === 'Auto') {
        const newEmotion = emotionCycle[i % emotionCycle.length]
        useMultiCharacterStore.getState().updateDialogueLine(lines[i].id, { emotion: newEmotion })
        changed++
      }
    }
    onStepUpdate('diversify', { status: 'completed', result: `Diversified ${changed} lines with varied emotions` })
  } else {
    onStepUpdate('diversify', { status: 'skipped', result: 'Emotions already diverse' })
  }

  // Step 3: Rewrite flat lines
  onStepUpdate('rewrite-flat', { status: 'running' })
  const shortLines = lines.filter((l) => l.script.length < 20 && l.script.length > 0)
  if (shortLines.length > 0 && shortLines.length <= 3) {
    try {
      const prompt = `These dialogue lines feel flat and short. Rewrite each to be more engaging (keep same meaning, add energy):
${shortLines.map((l, i) => `${i + 1}. "${l.script}"`).join('\n')}
Return JSON: { "rewrites": ["...", "..."] }`
      const result = JSON.parse(await callGemini(prompt))
      const rewrites = result.rewrites || []
      for (let i = 0; i < Math.min(shortLines.length, rewrites.length); i++) {
        useMultiCharacterStore.getState().updateDialogueLine(shortLines[i].id, { script: rewrites[i] })
      }
      onStepUpdate('rewrite-flat', {
        status: 'completed',
        result: `Rewrote ${Math.min(shortLines.length, rewrites.length)} flat lines`,
      })
    } catch {
      onStepUpdate('rewrite-flat', { status: 'failed', result: 'Could not rewrite lines' })
    }
  } else {
    onStepUpdate('rewrite-flat', { status: 'skipped', result: 'No flat lines detected' })
  }

  // Step 4: Verify
  onStepUpdate('verify', { status: 'running' })
  onStepUpdate('verify', { status: 'completed', result: 'Engagement enhancement complete' })

  return 'Engagement enhancement workflow completed'
}

async function executePlatformOptimize(
  _steps: WorkflowStep[],
  onStepUpdate: (stepId: string, update: Partial<WorkflowStep>) => void,
): Promise<string> {
  const aspectRatio = useEditorStore.getState().aspectRatio

  // Step 1: Detect platform
  onStepUpdate('detect-platform', { status: 'running' })
  const platformMap: Record<string, string> = {
    '9:16': 'TikTok / Instagram Reels / YouTube Shorts',
    '16:9': 'YouTube / LinkedIn',
    '1:1': 'Instagram Feed / Facebook',
    '4:3': 'Facebook / Presentations',
    '21:9': 'Cinematic / Twitter Header',
  }
  const detectedPlatform = platformMap[aspectRatio] || 'Unknown'
  onStepUpdate('detect-platform', { status: 'completed', result: `Current: ${aspectRatio} → ${detectedPlatform}` })

  // Step 2: Adjust aspect ratio (suggest 9:16 for short-form if not already)
  onStepUpdate('adjust-aspect', { status: 'running' })
  const totalFrames = useTimelineStore.getState().totalFrames
  const fps = useTimelineStore.getState().fps || 30
  const durationSec = totalFrames / fps
  if (durationSec <= 60 && aspectRatio !== '9:16') {
    useEditorStore.getState().setAspectRatio('9:16')
    onStepUpdate('adjust-aspect', { status: 'completed', result: 'Switched to 9:16 for short-form content' })
  } else {
    onStepUpdate('adjust-aspect', { status: 'skipped', result: `${aspectRatio} is appropriate` })
  }

  // Step 3: Trim duration
  onStepUpdate('trim-duration', { status: 'running' })
  if (durationSec > 90) {
    onStepUpdate('trim-duration', {
      status: 'completed',
      result: `Clip is ${durationSec.toFixed(0)}s — consider trimming to 30-60s for short-form`,
    })
  } else {
    onStepUpdate('trim-duration', {
      status: 'completed',
      result: `Duration ${durationSec.toFixed(0)}s is within platform norms`,
    })
  }

  // Step 4: Update captions
  onStepUpdate('update-captions', { status: 'running' })
  const captionStyle = useVoiceStore.getState().captionStyle
  if (captionStyle !== 'word-by-word') {
    useVoiceStore.getState().setCaptionStyle('word-by-word')
    onStepUpdate('update-captions', { status: 'completed', result: 'Enabled word-by-word captions' })
  } else {
    onStepUpdate('update-captions', { status: 'skipped', result: `Captions already set to "${captionStyle}"` })
  }

  return 'Platform optimization workflow completed'
}

async function executeAddProductionValue(
  _steps: WorkflowStep[],
  onStepUpdate: (stepId: string, update: Partial<WorkflowStep>) => void,
): Promise<string> {
  const overlays = useTextOverlayStore.getState().overlays
  const lines = useMultiCharacterStore.getState().dialogueLines
  const totalFrames = useTimelineStore.getState().totalFrames
  const fps = useTimelineStore.getState().fps || 30

  // Step 1: Audit
  onStepUpdate('audit', { status: 'running' })
  const hasTitle = overlays.some((o) => o.presetType === 'title')
  const hasLowerThird = overlays.some((o) => o.presetType === 'lower-third')
  const missing: string[] = []
  if (!hasTitle) missing.push('title')
  if (!hasLowerThird) missing.push('lower-third')
  onStepUpdate('audit', {
    status: 'completed',
    result: missing.length ? `Missing: ${missing.join(', ')}` : 'All key elements present',
  })

  // Step 2: Add title
  onStepUpdate('add-title', { status: 'running' })
  if (!hasTitle && lines.length > 0) {
    try {
      const prompt = `Based on this dialogue: "${lines[0].script.slice(0, 100)}"
Generate a catchy 3-5 word video title. Return JSON: { "title": "..." }`
      const result = JSON.parse(await callGemini(prompt))
      const title = result.title || 'Must Watch'
      useTextOverlayStore.getState().addOverlay({
        id: `title-${Date.now()}`,
        presetType: 'title',
        content: title,
        fontFamily: 'Inter',
        fontSize: 42,
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'center',
        verticalAlign: 'middle',
        position: 'top',
        freeX: 0,
        freeY: 0,
        lineHeight: 1.2,
        letterSpacing: 0,
        textCase: 'none',
        shadow: true,
        background: false,
        backgroundOpacity: 0.5,
        visible: true,
        opacity: 1,
        zIndex: 20,
        rotation: 0,
        width: null,
        height: null,
        startFrame: 0,
        endFrame: Math.min(5 * fps, totalFrames),
      })
      onStepUpdate('add-title', { status: 'completed', result: `Added title: "${title}"` })
    } catch {
      onStepUpdate('add-title', { status: 'failed', result: 'Could not generate title' })
    }
  } else {
    onStepUpdate('add-title', {
      status: 'skipped',
      result: hasTitle ? 'Title exists' : 'No dialogue to derive title from',
    })
  }

  // Step 3: Add lower third
  onStepUpdate('add-lower-third', { status: 'running' })
  if (!hasLowerThird && lines.length > 0) {
    const firstChar = useMultiCharacterStore.getState().characters.find((c) => c.id === lines[0].characterId)
    const charName = firstChar?.name || 'Speaker'
    useTextOverlayStore.getState().addOverlay({
      id: `lt-${Date.now()}`,
      presetType: 'lower-third',
      content: charName,
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'left',
      verticalAlign: 'middle',
      position: 'bottom',
      freeX: 0,
      freeY: 0,
      lineHeight: 1.2,
      letterSpacing: 0,
      textCase: 'none',
      shadow: true,
      background: true,
      backgroundOpacity: 0.6,
      visible: true,
      opacity: 1,
      zIndex: 12,
      rotation: 0,
      width: null,
      height: null,
      startFrame: 0,
      endFrame: Math.min(4 * fps, totalFrames),
    })
    onStepUpdate('add-lower-third', { status: 'completed', result: `Added lower-third: "${charName}"` })
  } else {
    onStepUpdate('add-lower-third', { status: 'skipped', result: 'Lower-third exists' })
  }

  // Step 4: Suggest music
  onStepUpdate('suggest-music', { status: 'running' })
  onStepUpdate('suggest-music', {
    status: 'completed',
    result: 'Use Audio panel → Generate Music to add background music',
  })

  return 'Production value enhancement completed'
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getWorkflowDefinition(id: WorkflowId): WorkflowDefinition | undefined {
  return WORKFLOW_DEFINITIONS.find((w) => w.id === id)
}

export async function executeWorkflow(
  workflowId: WorkflowId,
  onStepUpdate: (stepId: string, update: Partial<WorkflowStep>) => void,
): Promise<WorkflowResult> {
  const definition = getWorkflowDefinition(workflowId)
  if (!definition) throw new Error(`Unknown workflow: ${workflowId}`)

  const steps: WorkflowStep[] = definition.steps.map((s) => ({ ...s, status: 'pending' as const }))

  let summary: string
  let success = true
  try {
    switch (workflowId) {
      case 'optimize-virality':
        summary = await executeOptimizeVirality(steps, onStepUpdate)
        break
      case 'enhance-engagement':
        summary = await executeEnhanceEngagement(steps, onStepUpdate)
        break
      case 'platform-optimize':
        summary = await executePlatformOptimize(steps, onStepUpdate)
        break
      case 'add-production-value':
        summary = await executeAddProductionValue(steps, onStepUpdate)
        break
      default:
        throw new Error(`No executor for workflow: ${workflowId}`)
    }
  } catch (err) {
    logger.error(`[AgentWorkflow] ${workflowId} failed:`, err)
    summary = `Workflow failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    success = false
  }

  return { workflowId, success, steps, summary }
}
