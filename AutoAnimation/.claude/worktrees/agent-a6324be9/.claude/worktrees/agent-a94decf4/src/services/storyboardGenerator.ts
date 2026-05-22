/**
 * AI Storyboard Generator — Takes a script text and calls Gemini to generate
 * a scene-by-scene storyboard with visual descriptions, camera angles,
 * character positions, emotions, and duration estimates.
 *
 * This runs BEFORE the orchestrator plan generation and can be used
 * to inform the ClipPlan structure.
 */

import type {
  Storyboard,
  StoryboardSceneEntry,
  CameraAngle,
} from '@/types/storyboard'
import { withCreditGate } from './creditGate'
import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_API_URL = 'gemini-2.0-flash' // model name for callGeminiProxy

const VALID_CAMERA_ANGLES: CameraAngle[] = [
  'wide-shot', 'medium-shot', 'close-up', 'extreme-close-up',
  'over-the-shoulder', 'bird-eye', 'low-angle', 'dutch-angle',
  'tracking', 'static',
]

/**
 * Generate an AI storyboard from a script text using Gemini.
 *
 * @param scriptText - The full script text (may include [emotion] cues)
 * @param options - Optional configuration
 * @returns A complete Storyboard with scenes
 */
export async function generateStoryboardFromScript(
  scriptText: string,
  options: {
    /** Target duration in seconds (0 = let AI decide) */
    targetDurationSeconds?: number
    /** Aspect ratio for framing guidance */
    aspectRatio?: string
    /** Known character names (helps AI identify speakers) */
    characterNames?: string[]
    /** Style hint (e.g. "dramatic", "educational", "comedic") */
    style?: string
  } = {},
): Promise<Storyboard> {
  return withCreditGate('gemini-script', async () =>
    _generateStoryboardImpl(scriptText, options),
  )
}

async function _generateStoryboardImpl(
  scriptText: string,
  options: {
    targetDurationSeconds?: number
    aspectRatio?: string
    characterNames?: string[]
    style?: string
  },
): Promise<Storyboard> {
  const {
    targetDurationSeconds = 0,
    aspectRatio = '16:9',
    characterNames = [],
    style = '',
  } = options

  const characterSection = characterNames.length > 0
    ? `Known characters in this script: ${characterNames.join(', ')}`
    : 'Identify characters from the script dialogue and context.'

  const durationSection = targetDurationSeconds > 0
    ? `Target total duration: ${targetDurationSeconds} seconds. Distribute scene durations to fit this total.`
    : 'Estimate appropriate durations based on dialogue length and visual complexity.'

  const styleSection = style
    ? `Visual style: ${style}. Apply this style to your visual descriptions and camera choices.`
    : ''

  const prompt = `You are a professional storyboard artist and animation director. Analyze the following script and break it down into a scene-by-scene storyboard for an animated video.

SCRIPT:
"""
${scriptText}
"""

CONTEXT:
- Aspect ratio: ${aspectRatio}
- ${characterSection}
- ${durationSection}
${styleSection ? `- ${styleSection}` : ''}

For each scene, provide:
1. A short title (2-5 words)
2. A detailed visual description of what happens
3. Camera angle/shot type (one of: wide-shot, medium-shot, close-up, extreme-close-up, over-the-shoulder, bird-eye, low-angle, dutch-angle, tracking, static)
4. Character positions as percentage coordinates (x: 0-100 horizontal, y: 0-100 vertical; 50,50 = center)
5. The dominant emotion
6. Duration estimate in seconds
7. Visual notes (lighting, effects, transitions, color mood)
8. Background description
9. Dialogue text for this scene (if any)
10. Speaker name (if any)

Guidelines:
- Create 3-12 scenes depending on script length
- Each dialogue exchange or significant visual change should be its own scene
- Vary camera angles for visual interest
- Position characters naturally for the chosen camera angle
- Duration should match dialogue length (roughly 2-3 seconds per sentence)
- Use emotion cues from [brackets] in the script if present

Return ONLY valid JSON with this structure:
{
  "title": "Brief storyboard title",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "description": "Detailed visual description of what happens",
      "cameraAngle": "medium-shot",
      "characters": [
        { "name": "Character Name", "x": 50, "y": 60, "scale": 1, "isSpeaking": true }
      ],
      "emotion": "neutral",
      "durationSeconds": 3,
      "visualNotes": "Soft lighting, warm tones, fade-in from black",
      "backgroundDescription": "Modern studio with soft gradient backdrop",
      "dialogueText": "Hello everyone, welcome!",
      "speakerName": "Character Name"
    }
  ]
}

Only respond with valid JSON, no other text.`

  const response = await callGeminiProxy(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse JSON — strip markdown code fences if present
  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const parsed = JSON.parse(cleaned)

  // Validate and normalize scenes
  const scenes: StoryboardSceneEntry[] = (parsed.scenes || []).map(
    (scene: Record<string, unknown>, index: number) => {
      const cameraAngle = VALID_CAMERA_ANGLES.includes(
        scene.cameraAngle as CameraAngle,
      )
        ? (scene.cameraAngle as CameraAngle)
        : 'medium-shot'

      const characters = Array.isArray(scene.characters)
        ? (scene.characters as Record<string, unknown>[]).map((c) => ({
            name: String(c.name || 'Character'),
            x: Math.max(0, Math.min(100, Number(c.x) || 50)),
            y: Math.max(0, Math.min(100, Number(c.y) || 60)),
            scale: Number(c.scale) || 1,
            isSpeaking: Boolean(c.isSpeaking),
          }))
        : []

      return {
        id: crypto.randomUUID(),
        sceneNumber: index + 1,
        title: String(scene.title || `Scene ${index + 1}`),
        description: String(scene.description || ''),
        cameraAngle,
        characters,
        emotion: String(scene.emotion || 'neutral'),
        durationSeconds: Math.max(1, Number(scene.durationSeconds) || 3),
        visualNotes: String(scene.visualNotes || ''),
        backgroundDescription: String(scene.backgroundDescription || ''),
        dialogueText: scene.dialogueText ? String(scene.dialogueText) : undefined,
        speakerName: scene.speakerName ? String(scene.speakerName) : undefined,
        appliedToTimeline: false,
      }
    },
  )

  const totalDuration = scenes.reduce((sum, s) => sum + s.durationSeconds, 0)

  const storyboard: Storyboard = {
    id: crypto.randomUUID(),
    sourceScript: scriptText,
    title: String(parsed.title || 'Untitled Storyboard'),
    scenes,
    totalDurationSeconds: totalDuration,
    createdAt: Date.now(),
  }

  console.log(
    `[StoryboardGenerator] Generated storyboard "${storyboard.title}" with ${scenes.length} scenes (${totalDuration}s total)`,
  )

  return storyboard
}

/**
 * Convert a Storyboard into context text that can be injected into
 * the orchestrator's Gemini prompt to inform ClipPlan generation.
 */
export function storyboardToOrchestratorContext(
  storyboard: Storyboard,
): string {
  if (storyboard.scenes.length === 0) return ''

  const sceneDescriptions = storyboard.scenes
    .map((scene) => {
      const parts = [
        `Scene ${scene.sceneNumber} "${scene.title}" (${scene.durationSeconds}s, ${scene.cameraAngle}):`,
        `  Visual: ${scene.description}`,
        `  Background: ${scene.backgroundDescription}`,
        `  Emotion: ${scene.emotion}`,
      ]
      if (scene.characters.length > 0) {
        parts.push(
          `  Characters: ${scene.characters.map((c) => `${c.name} at (${c.x}%,${c.y}%) scale=${c.scale}${c.isSpeaking ? ' [speaking]' : ''}`).join('; ')}`,
        )
      }
      if (scene.dialogueText) {
        parts.push(`  Dialogue: "${scene.dialogueText}"`)
      }
      if (scene.visualNotes) {
        parts.push(`  Notes: ${scene.visualNotes}`)
      }
      return parts.join('\n')
    })
    .join('\n\n')

  return `\n\nSTORYBOARD CONTEXT — The user has created an AI storyboard for this clip. Use it to guide your scene structure, character placement, background choices, and timing:

${sceneDescriptions}

IMPORTANT: Follow the storyboard's scene structure, camera angles, character positions, and duration allocations when building the ClipPlan. Adapt dialogue, backgrounds, and overlays to match each scene's description and visual notes.`
}
