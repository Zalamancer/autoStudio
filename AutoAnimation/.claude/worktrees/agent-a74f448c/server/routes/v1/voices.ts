/**
 * Voices API routes — /api/v1/voices
 *
 * GET /       — list available ElevenLabs voices
 * POST /clone — submit voice clone request
 */

import { Router } from 'express'

const router = Router()

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

function getElevenLabsKey(): string {
  return process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY || ''
}

// ── GET / — List voices ──────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  try {
    const apiKey = getElevenLabsKey()
    if (!apiKey) {
      res.status(503).json({ error: 'ElevenLabs not configured', code: 'SERVICE_UNAVAILABLE' })
      return
    }

    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: { 'xi-api-key': apiKey },
    })

    if (!response.ok) {
      res.status(502).json({ error: 'Failed to fetch voices from ElevenLabs', code: 'UPSTREAM_ERROR' })
      return
    }

    const data = await response.json()
    const voices = (data.voices || []).map((v: any) => ({
      voiceId: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description,
      previewUrl: v.preview_url,
      labels: v.labels,
    }))

    res.json({ voices })
  } catch (err) {
    console.error('[Voices] List error:', err)
    res.status(500).json({ error: 'Failed to list voices', code: 'INTERNAL_ERROR' })
  }
})

// ── POST /clone — Clone a voice ──────────────────────────────────────────────

router.post('/clone', async (req, res) => {
  try {
    const apiKey = getElevenLabsKey()
    if (!apiKey) {
      res.status(503).json({ error: 'ElevenLabs not configured', code: 'SERVICE_UNAVAILABLE' })
      return
    }

    const { name, description } = req.body

    if (!name) {
      res.status(400).json({ error: 'Name is required', code: 'VALIDATION_ERROR' })
      return
    }

    // Voice cloning requires multipart form data with audio files
    // This is a simplified placeholder — full implementation would handle file uploads
    res.status(501).json({
      error: 'Voice cloning via API requires audio file upload. Use the dashboard UI.',
      code: 'NOT_IMPLEMENTED',
    })
  } catch (err) {
    console.error('[Voices] Clone error:', err)
    res.status(500).json({ error: 'Failed to clone voice', code: 'INTERNAL_ERROR' })
  }
})

export default router
