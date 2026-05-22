/**
 * Server-side Orchestrator Runner.
 *
 * Generates a ClipPlan via Gemini and produces the plan + voice assets
 * needed for rendering.  Actual video rendering is deferred to a client
 * worker (browser tab or Electron) that picks up "ready" plans.
 *
 * Flow:
 *   1. Generate ClipPlan via Gemini (reuses the plan prompt logic)
 *   2. Generate voices via ElevenLabs for each dialogue line
 *   3. Store plan + voice URLs in auto_publish_executions
 *   4. Mark execution as "ready" for client-side rendering
 */

import logger from '../lib/logger'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

function getGeminiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
}

function getElevenLabsKey(): string {
  return process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || ''
}

export interface ExecutionResult {
  plan: Record<string, unknown>
  voiceUrls: Array<{ lineIndex: number; audioUrl: string }>
  creditsUsed: number
}

/**
 * Generate a ClipPlan for the given topic prompt.
 */
async function generatePlan(
  topicPrompt: string,
  orchestratorSettings: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const apiKey = getGeminiKey()
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const aspectRatio = (orchestratorSettings.aspectRatio as string) || '9:16'
  const duration = (orchestratorSettings.durationSeconds as number) || 0
  const durationNote = duration > 0 ? `Target duration: ${duration} seconds.` : 'Choose an appropriate duration (15-60s for short-form).'

  const prompt = `You are an AI Director for an animation studio. Generate a complete animated clip plan from this topic.

TOPIC: ${topicPrompt}

CONSTRAINTS:
- Aspect ratio: ${aspectRatio}
- ${durationNote}
- This is for automated publishing — make it engaging and self-contained.
- Include a catchy hook in the first 3 seconds.

Return a JSON ClipPlan with:
{
  "canvas": { "aspectRatio": "${aspectRatio}", "width": 1080, "height": 1920 },
  "dialogue": [
    { "characterName": "narrator", "script": "...", "emotion": "neutral" }
  ],
  "captions": { "style": "word-by-word", "position": "bottom" },
  "textOverlays": [],
  "title": "Short descriptive title"
}

Keep the script concise (under 100 words for short-form content).`

  const resp = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Gemini API error: ${resp.status} - ${err}`)
  }

  const data = await resp.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

  try {
    return JSON.parse(text)
  } catch {
    logger.error('[OrchestratorRunner] Failed to parse Gemini response')
    throw new Error('Invalid plan JSON from Gemini')
  }
}

/**
 * Generate TTS audio for dialogue lines via ElevenLabs.
 */
async function generateVoices(
  dialogueLines: Array<{ script: string; characterName: string }>,
): Promise<Array<{ lineIndex: number; audioUrl: string }>> {
  const apiKey = getElevenLabsKey()
  if (!apiKey) {
    logger.warn('[OrchestratorRunner] ElevenLabs key not configured — skipping voice generation')
    return []
  }

  // Fetch available voices
  const voicesResp = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: { 'xi-api-key': apiKey },
  })

  if (!voicesResp.ok) {
    logger.warn('[OrchestratorRunner] Failed to fetch voices')
    return []
  }

  const { voices } = await voicesResp.json()
  const defaultVoice = voices?.[0]?.voice_id

  if (!defaultVoice) return []

  const results: Array<{ lineIndex: number; audioUrl: string }> = []

  for (let i = 0; i < dialogueLines.length; i++) {
    const line = dialogueLines[i]
    const cleanScript = line.script.replace(/\[[\w-]+\]/g, '').trim()
    if (!cleanScript) continue

    try {
      const ttsResp = await fetch(
        `${ELEVENLABS_API_URL}/text-to-speech/${defaultVoice}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanScript,
            model_id: 'eleven_v3',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      )

      if (!ttsResp.ok) {
        logger.warn(`[OrchestratorRunner] TTS failed for line ${i}: ${ttsResp.statusText}`)
        continue
      }

      // For server-side, we store the audio as a base64 data URL
      const audioBuffer = await ttsResp.arrayBuffer()
      const base64 = Buffer.from(audioBuffer).toString('base64')
      const audioUrl = `data:audio/mpeg;base64,${base64}`

      results.push({ lineIndex: i, audioUrl })
    } catch (err) {
      logger.warn({ err }, `[OrchestratorRunner] TTS error for line ${i}`)
    }
  }

  return results
}

/**
 * Run the full server-side orchestration pipeline.
 */
export async function runOrchestration(
  topicPrompt: string,
  orchestratorSettings: Record<string, unknown>,
): Promise<ExecutionResult> {
  logger.info(`[OrchestratorRunner] Starting orchestration for: "${topicPrompt.slice(0, 80)}..."`)

  // Step 1: Generate plan
  const plan = await generatePlan(topicPrompt, orchestratorSettings)

  // Step 2: Generate voices for dialogue
  const dialogue = (plan as any).dialogue || []
  const voiceUrls = await generateVoices(dialogue)

  // Estimate credits used (rough: 1 for plan + 1 per voice line)
  const creditsUsed = 1 + voiceUrls.length

  logger.info(`[OrchestratorRunner] Orchestration complete: ${voiceUrls.length} voice lines, ${creditsUsed} credits`)

  return { plan, voiceUrls, creditsUsed }
}

/**
 * Convert a ClipPlan + voice data into a VideoCompositionProps-compatible JSON
 * for Remotion CLI rendering. This avoids needing Zustand on the server.
 */
export function exportCompositionProps(
  plan: Record<string, unknown>,
  voiceUrls: Array<{ lineIndex: number; audioUrl: string }>,
  fps: number = 30,
): Record<string, unknown> {
  const canvas = (plan as any).canvas || {}
  const dialogue = (plan as any).dialogue || []
  const captions = (plan as any).captions || {}
  const textOverlays = (plan as any).textOverlays || []

  const width = canvas.width || 1080
  const height = canvas.height || 1920

  // Build dialogue characters with voice data
  const dialogueCharacters = dialogue.map((line: any, idx: number) => {
    const voiceData = voiceUrls.find((v) => v.lineIndex === idx)
    return {
      id: `char_${idx}`,
      name: line.characterName || `Character ${idx + 1}`,
      visible: true,
      position: { x: width / 2, y: height * 0.6 },
      scale: 1,
      zIndex: 10 + idx,
      dialogueLines: [{
        id: `line_${idx}`,
        script: line.script,
        audioUrl: voiceData?.audioUrl || null,
        startFrame: idx * fps * 4,
        endFrame: (idx + 1) * fps * 4,
        visemeTimeline: [],
        emotionTimeline: [],
        wordTimeline: [],
      }],
      savedCharacter: null,
      renderMode: 'sprite',
    }
  })

  return {
    fps,
    width,
    height,
    character: null,
    audioUrl: null,
    visemeTimeline: [],
    emotionTimeline: [],
    captions: {
      style: captions.style || 'word-by-word',
      position: captions.position || 'bottom',
      fontSize: 48,
      color: '#ffffff',
      bgOpacity: 0.7,
      wordTimeline: [],
      sentenceTimeline: [],
    },
    animations: [],
    dialogueCharacters,
    videos: [],
    mediaItems: [],
    textOverlays: textOverlays.map((t: any, idx: number) => ({
      id: `text_${idx}`,
      text: t.text || '',
      type: t.type || 'title',
      position: t.position || { x: width / 2, y: 100 },
      fontSize: t.fontSize || 48,
      color: t.color || '#ffffff',
      fontFamily: t.fontFamily || 'Inter',
      visible: true,
      startFrame: t.startFrame || 0,
      endFrame: t.endFrame || fps * 5,
    })),
    shapes: [],
    artCurves: [],
    keyframeData: {},
    characters3D: [],
    backgroundAudio: [],
    rigData: [],
    htmlTemplates: [],
    svgComposition: { objects: [], keyframes: {} },
    retentionHooks: [],
    pixelArtCharacters: [],
    avatarCharacters: [],
  }
}
