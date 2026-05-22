/**
 * Scene Detector — Upload a long video → extract frames at intervals →
 * send to Gemini Vision for scene boundary detection + moment scoring →
 * return ranked clip segments.
 */

import { withCreditGate } from './creditGate'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Types ────────────────────────────────────────────────────────────

export interface DetectedScene {
  id: string
  startTimeSec: number
  endTimeSec: number
  durationSec: number
  /** Scene description from Gemini Vision */
  description: string
  /** Hook-worthy title */
  title: string
  /** Virality score 0-100 */
  viralityScore: number
  /** Reasoning for the score */
  reason: string
  /** Base64 thumbnail of a representative frame */
  thumbnailDataUrl: string
}

export interface SceneDetectionResult {
  scenes: DetectedScene[]
  totalDurationSec: number
  frameCount: number
}

export type SceneDetectionProgress = {
  phase: 'extracting' | 'analyzing' | 'complete'
  progress: number // 0-1
  message: string
}

// ── Constants ────────────────────────────────────────────────────────

// Model name passed to callGeminiProxy
const PROXY_MODEL = 'gemini-2.0-flash'

/** Extract 1 frame per this many seconds */
const FRAME_INTERVAL_SEC = 2
/** Max frames to send in a single Gemini request */
const MAX_FRAMES = 30
/** Frame thumbnail width */
const THUMB_WIDTH = 320

// ── Frame extraction ─────────────────────────────────────────────────

interface ExtractedFrame {
  timeSec: number
  dataUrl: string
}

/**
 * Extract frames from a video file at regular intervals using a hidden
 * <video> element + <canvas> snapshot approach.
 */
async function extractFrames(
  videoFile: File,
  intervalSec: number,
  maxFrames: number,
  onProgress?: (p: number) => void,
): Promise<{ frames: ExtractedFrame[]; durationSec: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const objectUrl = URL.createObjectURL(videoFile)
    video.src = objectUrl

    video.onloadedmetadata = () => {
      const durationSec = video.duration
      if (!isFinite(durationSec) || durationSec <= 0) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Invalid video duration'))
        return
      }

      // Calculate frame times
      const actualInterval = Math.max(intervalSec, durationSec / maxFrames)
      const frameTimes: number[] = []
      for (let t = 0; t < durationSec; t += actualInterval) {
        frameTimes.push(t)
        if (frameTimes.length >= maxFrames) break
      }

      // Set canvas size (maintain aspect ratio)
      const aspect = video.videoWidth / video.videoHeight
      canvas.width = THUMB_WIDTH
      canvas.height = Math.round(THUMB_WIDTH / aspect)

      const frames: ExtractedFrame[] = []
      let frameIndex = 0

      const captureNext = () => {
        if (frameIndex >= frameTimes.length) {
          URL.revokeObjectURL(objectUrl)
          resolve({ frames, durationSec })
          return
        }

        video.currentTime = frameTimes[frameIndex]
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)

        frames.push({
          timeSec: frameTimes[frameIndex],
          dataUrl,
        })

        frameIndex++
        onProgress?.(frameIndex / frameTimes.length)
        captureNext()
      }

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load video'))
      }

      captureNext()
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video'))
    }
  })
}

// ── Gemini Vision analysis ───────────────────────────────────────────

/**
 * Send extracted frames to Gemini Vision to detect scene boundaries
 * and score each scene for virality.
 */
async function analyzeFramesWithGemini(frames: ExtractedFrame[], totalDurationSec: number): Promise<DetectedScene[]> {
  // Build frame descriptions with timestamps
  const frameList = frames.map((f, i) => `Frame ${i + 1} at ${formatTime(f.timeSec)}`).join('\n')

  // Build inline image parts
  const imageParts = frames.map((f) => {
    const base64 = f.dataUrl.split(',')[1]
    return {
      inline_data: {
        mime_type: 'image/jpeg',
        data: base64,
      },
    }
  })

  const prompt = `You are a video content analyst. I'm showing you ${frames.length} frames extracted from a ${formatTime(totalDurationSec)} video at regular intervals.

FRAME TIMESTAMPS:
${frameList}

Analyze these frames and identify distinct scenes/segments. For each scene, determine:
1. Where it starts and ends (approximate timestamps based on the frames shown)
2. What's happening in the scene (visual description)
3. A catchy short title (max 8 words)
4. A virality score (0-100) based on visual interest, emotional impact, and potential for social media
5. Why this scene would or wouldn't work as a standalone short clip

Return JSON:
{
  "scenes": [
    {
      "startTimeSec": 0,
      "endTimeSec": 15.5,
      "description": "Speaker introduces topic with enthusiasm, dynamic hand gestures",
      "title": "The Secret Nobody Tells You",
      "viralityScore": 78,
      "reason": "Strong hook, engaging body language, clear topic setup"
    }
  ]
}

Focus on finding 3-7 scenes. Prioritize moments with:
- Strong hooks or surprising reveals
- Emotional reactions or expressions
- Visual variety or dynamic action
- Complete standalone narratives (has a beginning and end)`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, ...imageParts],
      },
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  }

  const response = await callGeminiProxy('gemini-2.0-flash', body)

  if (!response.ok) {
    throw new Error(`Gemini Vision error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  const parsed = JSON.parse(cleaned)

  const scenes: DetectedScene[] = (parsed.scenes || []).map((scene: Record<string, unknown>, i: number) => {
    const startTimeSec = Number(scene.startTimeSec) || 0
    const endTimeSec = Number(scene.endTimeSec) || startTimeSec + 30

    // Find the closest frame for thumbnail
    const midTime = (startTimeSec + endTimeSec) / 2
    const closestFrame = frames.reduce((prev, curr) =>
      Math.abs(curr.timeSec - midTime) < Math.abs(prev.timeSec - midTime) ? curr : prev,
    )

    return {
      id: `scene-${i})`,
      startTimeSec,
      endTimeSec,
      durationSec: endTimeSec - startTimeSec,
      description: String(scene.description || ''),
      title: String(scene.title || `Scene ${i + 1}`),
      viralityScore: Number(scene.viralityScore) || 50,
      reason: String(scene.reason || ''),
      thumbnailDataUrl: closestFrame.dataUrl,
    }
  })

  scenes.sort((a, b) => b.viralityScore - a.viralityScore)
  return scenes
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Detect scenes in a video file using frame extraction + Gemini Vision.
 */
export async function detectScenes(
  videoFile: File,
  onProgress?: (p: SceneDetectionProgress) => void,
): Promise<SceneDetectionResult> {
  return withCreditGate('gemini-script', async () => {
    // Phase 1: Extract frames
    onProgress?.({
      phase: 'extracting',
      progress: 0,
      message: 'Extracting frames from video...',
    })

    const { frames, durationSec } = await extractFrames(videoFile, FRAME_INTERVAL_SEC, MAX_FRAMES, (p) =>
      onProgress?.({
        phase: 'extracting',
        progress: p * 0.5,
        message: `Extracting frames... ${Math.round(p * 100)}%`,
      }),
    )

    // Phase 2: Analyze with Gemini Vision
    onProgress?.({
      phase: 'analyzing',
      progress: 0.5,
      message: 'Analyzing scenes with AI...',
    })

    const scenes = await analyzeFramesWithGemini(frames, durationSec)

    onProgress?.({
      phase: 'complete',
      progress: 1,
      message: `Found ${scenes.length} scenes`,
    })

    return {
      scenes,
      totalDurationSec: durationSec,
      frameCount: frames.length,
    }
  })
}

// ── Extended: Scene detection within a time range ────────────────────

/**
 * Detect scenes within a specific time range of a video file.
 * Useful for clip extraction — analyze only the portion of interest.
 */
export async function detectScenesInRange(
  videoFile: File,
  startSec: number,
  endSec: number,
  onProgress?: (p: SceneDetectionProgress) => void,
): Promise<DetectedScene[]> {
  return withCreditGate('gemini-script', async () => {
    const rangeDuration = endSec - startSec
    if (rangeDuration <= 0) return []

    onProgress?.({
      phase: 'extracting',
      progress: 0,
      message: `Extracting frames from ${formatTime(startSec)} to ${formatTime(endSec)}...`,
    })

    // Extract frames only in the specified range
    const { frames } = await extractFramesInRange(videoFile, startSec, endSec, FRAME_INTERVAL_SEC, MAX_FRAMES, (p) =>
      onProgress?.({
        phase: 'extracting',
        progress: p * 0.5,
        message: `Extracting frames... ${Math.round(p * 100)}%`,
      }),
    )

    if (frames.length === 0) return []

    onProgress?.({
      phase: 'analyzing',
      progress: 0.5,
      message: 'Analyzing scenes with AI...',
    })

    const scenes = await analyzeFramesWithGemini(frames, rangeDuration)

    // Adjust scene times to be relative to the full video
    const adjusted = scenes.map((scene) => ({
      ...scene,
      startTimeSec: scene.startTimeSec + startSec,
      endTimeSec: scene.endTimeSec + startSec,
    }))

    onProgress?.({
      phase: 'complete',
      progress: 1,
      message: `Found ${adjusted.length} scenes in range`,
    })

    return adjusted
  })
}

/**
 * Extract frames from a video within a specific time range.
 */
async function extractFramesInRange(
  videoFile: File,
  startSec: number,
  endSec: number,
  intervalSec: number,
  maxFrames: number,
  onProgress?: (p: number) => void,
): Promise<{ frames: ExtractedFrame[] }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const objectUrl = URL.createObjectURL(videoFile)
    video.src = objectUrl

    video.onloadedmetadata = () => {
      const rangeDuration = endSec - startSec
      const actualInterval = Math.max(intervalSec, rangeDuration / maxFrames)
      const frameTimes: number[] = []
      for (let t = startSec; t < endSec; t += actualInterval) {
        frameTimes.push(t)
        if (frameTimes.length >= maxFrames) break
      }

      const aspect = video.videoWidth / video.videoHeight
      canvas.width = THUMB_WIDTH
      canvas.height = Math.round(THUMB_WIDTH / aspect)

      const frames: ExtractedFrame[] = []
      let frameIndex = 0

      const captureNext = () => {
        if (frameIndex >= frameTimes.length) {
          URL.revokeObjectURL(objectUrl)
          resolve({ frames })
          return
        }
        video.currentTime = frameTimes[frameIndex]
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        frames.push({
          timeSec: frameTimes[frameIndex],
          dataUrl: canvas.toDataURL('image/jpeg', 0.7),
        })
        frameIndex++
        onProgress?.(frameIndex / frameTimes.length)
        captureNext()
      }

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load video for range extraction'))
      }

      captureNext()
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load video'))
    }
  })
}

/**
 * Score a specific moment in a video for visual interest.
 * Extracts a single frame and analyzes it with Gemini Vision.
 * Returns a score 0-100 and a description.
 */
export async function scoreMomentVisually(
  videoFile: File,
  timeSec: number,
): Promise<{ score: number; description: string }> {
  // Extract a single frame at the given time
  const { frames } = await extractFramesInRange(videoFile, timeSec, timeSec + 0.1, 1, 1)
  if (frames.length === 0) return { score: 0, description: 'No frame extracted' }

  const frame = frames[0]
  const base64 = frame.dataUrl.split(',')[1]
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Rate this video frame for visual interest on a scale of 0-100. Consider: composition, emotion, action, uniqueness. Return JSON: { "score": number, "description": "brief description" }`,
          },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 256,
      responseMimeType: 'application/json',
    },
  }

  const response = await callGeminiProxy('gemini-2.0-flash', body)

  if (!response.ok) return { score: 50, description: 'Scoring failed' }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    return {
      score: Number(parsed.score) || 50,
      description: String(parsed.description || ''),
    }
  } catch {
    return { score: 50, description: '' }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
