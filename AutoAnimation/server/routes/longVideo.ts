/**
 * Long-Video → Shorts Clipping route.
 * Accepts a video upload, extracts audio via ffmpeg, transcribes via
 * OpenAI Whisper API, then sends the transcript to Gemini to identify
 * the best short-form clip moments.
 */

import { Router, type Request, type Response } from 'express'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const router = Router()

function getOpenAIKey(): string {
  return process.env.OPENAI_API_KEY || ''
}

interface ClipMoment {
  startSeconds: number
  endSeconds: number
  title: string
  hook: string
  score: number
}

// POST /analyze — upload a video and analyze for clip moments
router.post('/analyze', async (req: Request, res: Response) => {
  const openaiKey = getOpenAIKey()
  if (!openaiKey) {
    res.status(503).json({ error: 'OPENAI_API_KEY is not configured for Whisper transcription' })
    return
  }

  const { videoBase64, mimeType, maxClips } = req.body

  if (!videoBase64) {
    res.status(400).json({ error: 'videoBase64 is required' })
    return
  }

  const tmpDir = path.join(os.tmpdir(), `long-video-${Date.now()}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  try {
    // 1. Write video to temp file
    const ext = mimeType?.includes('webm') ? '.webm' : '.mp4'
    const videoPath = path.join(tmpDir, `input${ext}`)
    const audioPath = path.join(tmpDir, 'audio.mp3')

    const videoBuffer = Buffer.from(videoBase64, 'base64')
    fs.writeFileSync(videoPath, videoBuffer)

    // 2. Extract audio using ffmpeg
    try {
      await execFileAsync('ffmpeg', [
        '-i', videoPath,
        '-vn',
        '-acodec', 'libmp3lame',
        '-ar', '16000',
        '-ac', '1',
        '-q:a', '6',
        audioPath,
      ], { timeout: 120000 })
    } catch (err) {
      console.error('[LongVideo] ffmpeg error:', err)
      res.status(500).json({ error: 'Failed to extract audio from video. Ensure ffmpeg is installed.' })
      return
    }

    // 3. Transcribe audio via Whisper API
    const audioBuffer = fs.readFileSync(audioPath)
    const formData = new FormData()
    formData.append('file', new Blob([audioBuffer], { type: 'audio/mp3' }), 'audio.mp3')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'segment')

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: formData,
    })

    if (!whisperRes.ok) {
      const errText = await whisperRes.text()
      console.error('[LongVideo] Whisper error:', errText)
      res.status(500).json({ error: `Transcription failed: ${whisperRes.statusText}` })
      return
    }

    const whisperData = await whisperRes.json() as {
      text: string
      segments?: Array<{
        start: number
        end: number
        text: string
      }>
    }

    const transcript = whisperData.text
    const segments = whisperData.segments || []

    // Build timestamped transcript for Gemini
    const timestampedTranscript = segments
      .map((s) => `[${formatTime(s.start)}] ${s.text.trim()}`)
      .join('\n')

    // 4. Send transcript to Gemini for clip moment identification
    // We'll return the transcript and let the frontend call Gemini
    // (since the Gemini key is on the frontend side)
    res.json({
      transcript,
      timestampedTranscript,
      segments: segments.map((s) => ({
        startSeconds: s.start,
        endSeconds: s.end,
        text: s.text.trim(),
      })),
      durationSeconds: segments.length > 0 ? segments[segments.length - 1].end : 0,
    })
  } catch (err) {
    console.error('[LongVideo] Analysis error:', err)
    res.status(500).json({ error: err instanceof Error ? err.message : 'Analysis failed' })
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {
      // Non-critical
    }
  }
})

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default router
