/**
 * AI-powered 2D rig animation generation via Gemini 2.0 Flash.
 *
 * Takes a skeleton description + text prompt and returns pose keyframes
 * that can be injected into both the UI pose tracks and the bonerigging engine.
 */

import { withCreditGate } from './creditGate'
import type {
  BoneJoint,
  BoneSkeleton,
} from '@/types/rig'

// ── Types ──────────────────────────────────────────────────────────────

export interface RigAnimationRequest {
  prompt: string
  skeleton: BoneSkeleton
  imageWidth: number
  imageHeight: number
  durationSeconds: number
  loop: boolean
}

export interface GeneratedJointPose {
  dx: number
  dy: number
  rotation: number
}

export interface GeneratedKeyframe {
  time: number // seconds
  joints: Record<string, GeneratedJointPose>
}

export interface RigAnimationResult {
  name: string
  keyframes: GeneratedKeyframe[]
  durationSeconds: number
  loop: boolean
}

// ── Constants ──────────────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

// ── Prompt construction ────────────────────────────────────────────────

function buildSkeletonDescription(skeleton: BoneSkeleton, imageWidth: number, imageHeight: number): string {
  // Group joints by category
  const byCategory: Record<string, BoneJoint[]> = {}
  for (const joint of skeleton.joints) {
    const cat = joint.category || 'other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(joint)
  }

  let desc = `Image dimensions: ${imageWidth}x${imageHeight}px\n\nSkeleton joints (grouped by category):\n`

  for (const [category, joints] of Object.entries(byCategory)) {
    desc += `\n[${category}]\n`
    for (const j of joints) {
      desc += `  - id: "${j.id}", name: "${j.name}", parent: ${j.parentId ? `"${j.parentId}"` : 'none'}, restPosition: (${Math.round(j.restPosition.x)}, ${Math.round(j.restPosition.y)})\n`
    }
  }

  return desc
}

function buildPrompt(request: RigAnimationRequest): string {
  const skeletonDesc = buildSkeletonDescription(
    request.skeleton,
    request.imageWidth,
    request.imageHeight,
  )

  return `You are a 2D character animation expert. Given a character skeleton, generate smooth pose keyframes for the requested animation.

${skeletonDesc}

Animation request: "${request.prompt}"
Duration: ${request.durationSeconds} seconds
Loop: ${request.loop}

Output a JSON object with this exact schema:
{
  "name": "animation name",
  "keyframes": [
    {
      "time": 0.0,
      "joints": {
        "jointId": { "dx": 0, "dy": 0, "rotation": 0 }
      }
    }
  ]
}

Rules:
- "time" is in seconds, starting at 0.0 and going up to ${request.durationSeconds}
- "dx" and "dy" are pixel offsets from the joint's rest position. Use the image height (${request.imageHeight}px) as reference:
  - Subtle movements (breathing, idle): 2-15% of image height (${Math.round(request.imageHeight * 0.02)}-${Math.round(request.imageHeight * 0.15)}px)
  - Large movements (waving, jumping): 10-20% of image height (${Math.round(request.imageHeight * 0.1)}-${Math.round(request.imageHeight * 0.2)}px)
- "rotation" is in degrees (-45 to +45 for natural motion)
- Always start with a keyframe at time 0.0 (can be rest pose or starting pose)
${request.loop ? '- For looping: the last keyframe should return to approximately the same pose as the first keyframe' : '- The animation should end naturally, returning to rest pose at the end'}
- Only include joints that actually move — omit joints that stay at rest
- Create enough keyframes for smooth motion (typically 4-8 keyframes for a ${request.durationSeconds}s animation)
- Keep parent-child relationships in mind: moving a parent joint affects children

Example 1 - Idle breathing (1s, loop):
{
  "name": "idle breathing",
  "keyframes": [
    { "time": 0.0, "joints": { "torso": { "dx": 0, "dy": 0, "rotation": 0 } } },
    { "time": 0.5, "joints": { "torso": { "dx": 0, "dy": -8, "rotation": 0 } } },
    { "time": 1.0, "joints": { "torso": { "dx": 0, "dy": 0, "rotation": 0 } } }
  ]
}

Example 2 - Wave hand (2s, no loop):
{
  "name": "wave hand",
  "keyframes": [
    { "time": 0.0, "joints": {} },
    { "time": 0.3, "joints": { "arm-right-upper": { "dx": 0, "dy": -20, "rotation": -30 }, "arm-right-lower": { "dx": 10, "dy": -40, "rotation": -20 } } },
    { "time": 0.7, "joints": { "arm-right-upper": { "dx": 0, "dy": -20, "rotation": -30 }, "arm-right-lower": { "dx": -10, "dy": -40, "rotation": 20 } } },
    { "time": 1.1, "joints": { "arm-right-upper": { "dx": 0, "dy": -20, "rotation": -30 }, "arm-right-lower": { "dx": 10, "dy": -40, "rotation": -20 } } },
    { "time": 1.5, "joints": { "arm-right-upper": { "dx": 0, "dy": -20, "rotation": -30 }, "arm-right-lower": { "dx": -10, "dy": -40, "rotation": 20 } } },
    { "time": 2.0, "joints": {} }
  ]
}

Example 3 - Head nod (1s, no loop):
{
  "name": "head nod",
  "keyframes": [
    { "time": 0.0, "joints": {} },
    { "time": 0.25, "joints": { "head": { "dx": 0, "dy": 10, "rotation": 10 } } },
    { "time": 0.5, "joints": { "head": { "dx": 0, "dy": 0, "rotation": 0 } } },
    { "time": 0.75, "joints": { "head": { "dx": 0, "dy": 10, "rotation": 10 } } },
    { "time": 1.0, "joints": {} }
  ]
}

Respond ONLY with valid JSON matching the schema above.`
}

// ── Validation ─────────────────────────────────────────────────────────

function validateAndClamp(
  result: any,
  skeleton: BoneSkeleton,
  imageHeight: number,
  durationSeconds: number,
  loop: boolean,
): RigAnimationResult {
  const validJointIds = new Set(skeleton.joints.map((j) => j.id))
  const maxOffset = imageHeight * 0.25

  const keyframes: GeneratedKeyframe[] = []

  const rawKeyframes = Array.isArray(result.keyframes) ? result.keyframes : []
  for (const kf of rawKeyframes) {
    const time = typeof kf.time === 'number' ? Math.max(0, Math.min(kf.time, durationSeconds)) : 0
    const joints: Record<string, GeneratedJointPose> = {}

    if (kf.joints && typeof kf.joints === 'object') {
      for (const [jointId, pose] of Object.entries(kf.joints)) {
        if (!validJointIds.has(jointId)) continue
        const p = pose as any
        joints[jointId] = {
          dx: Math.max(-maxOffset, Math.min(maxOffset, typeof p.dx === 'number' ? p.dx : 0)),
          dy: Math.max(-maxOffset, Math.min(maxOffset, typeof p.dy === 'number' ? p.dy : 0)),
          rotation: Math.max(-180, Math.min(180, typeof p.rotation === 'number' ? p.rotation : 0)),
        }
      }
    }

    keyframes.push({ time, joints })
  }

  // Ensure we have at least a rest keyframe at time 0
  if (keyframes.length === 0 || keyframes[0].time !== 0) {
    keyframes.unshift({ time: 0, joints: {} })
  }

  // Sort by time
  keyframes.sort((a, b) => a.time - b.time)

  // Fill missing joints with rest pose for each keyframe
  for (const kf of keyframes) {
    for (const jointId of validJointIds) {
      if (!kf.joints[jointId]) {
        kf.joints[jointId] = { dx: 0, dy: 0, rotation: 0 }
      }
    }
  }

  return {
    name: typeof result.name === 'string' ? result.name : 'Generated Animation',
    keyframes,
    durationSeconds,
    loop,
  }
}

// ── Core generation ────────────────────────────────────────────────────

export async function generateRigAnimation(
  request: RigAnimationRequest,
): Promise<RigAnimationResult> {
  return withCreditGate('gemini-rig-animation', async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not configured')

    const prompt = buildPrompt(request)

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse JSON (clean up markdown fences if present despite responseMimeType)
    const cleaned = textContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleaned)
    } catch (e) {
      throw new Error(`Failed to parse Gemini response as JSON: ${(e as Error).message}`)
    }

    return validateAndClamp(
      parsed,
      request.skeleton,
      request.imageHeight,
      request.durationSeconds,
      request.loop,
    )
  })
}

// ── Convert to bonerigging Animation format ────────────────────────────

/**
 * Converts a RigAnimationResult to the bonerigging engine's Animation format.
 * This is the format expected by AnimationManager.importJSON().
 */
export function toBoneRiggingAnimation(result: RigAnimationResult, fps: number = 24): object {
  return {
    name: result.name,
    duration: result.durationSeconds,
    fps,
    loop: result.loop,
    ts: Date.now(),
    keyframes: result.keyframes.map((kf) => ({
      time: kf.time,
      deltas: Object.fromEntries(
        Object.entries(kf.joints)
          .filter(([, p]) => p.dx !== 0 || p.dy !== 0) // only non-rest deltas
          .map(([jointId, p]) => [jointId, { x: p.dx, y: p.dy }]),
      ),
      pinned: [],
    })),
  }
}
