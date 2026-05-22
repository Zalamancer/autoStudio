/**
 * Whisper Transcription Route — Accept audio upload → multi-provider transcription → structured transcript.
 *
 * Supports providers: whisper (OpenAI), deepgram, assemblyai
 * Query params: provider, diarize, language
 */

import { Router } from 'express'
import multer from 'multer'
import logger from '../lib/logger'
import { transcribeWithDeepgram } from '../services/deepgramProvider'
import { transcribeWithAssemblyAI } from '../services/assemblyAIProvider'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
})

const OPENAI_API_URL = 'https://api.openai.com/v1/audio/transcriptions'

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  const file = req.file
  if (!file) {
    res.status(400).json({ error: 'No audio file provided' })
    return
  }

  const provider = (req.query.provider as string) || 'whisper'
  const diarize = req.query.diarize === 'true'
  const language = req.query.language as string | undefined
  const model = req.query.model as string | undefined

  try {
    // Route to the selected provider
    if (provider === 'deepgram') {
      const result = await transcribeWithDeepgram(file.buffer, file.mimetype, { diarize, language, model })
      res.json(result)
      return
    }

    if (provider === 'assemblyai') {
      const result = await transcribeWithAssemblyAI(file.buffer, file.mimetype, { diarize, language })
      res.json(result)
      return
    }

    // Default: OpenAI Whisper
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      res.status(503).json({ error: 'OpenAI API key not configured (set OPENAI_API_KEY)' })
      return
    }

    // Whisper API has a 25MB limit — check file size
    const WHISPER_MAX_SIZE = 25 * 1024 * 1024
    if (file.buffer.length > WHISPER_MAX_SIZE) {
      // For files > 25MB, recommend using Deepgram or AssemblyAI
      res.status(413).json({
        error: `File size (${Math.round(file.buffer.length / 1024 / 1024)}MB) exceeds Whisper's 25MB limit. Use provider=deepgram or provider=assemblyai for larger files.`,
      })
      return
    }

    const formData = new FormData()
    const blob = new Blob([file.buffer], { type: file.mimetype })
    formData.append('file', blob, file.originalname || 'audio.mp3')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')
    formData.append('timestamp_granularities[]', 'segment')

    if (language) {
      formData.append('language', language)
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error({ status: response.status, body: errorText }, '[Whisper] OpenAI API error')
      res.status(response.status).json({
        error: `OpenAI Whisper API error: ${response.statusText}`,
      })
      return
    }

    const data = await response.json()

    // Normalize response to our WhisperResult shape
    const result = {
      text: data.text || '',
      language: data.language || 'en',
      duration: data.duration || 0,
      segments: (data.segments || []).map((seg: Record<string, unknown>, i: number) => ({
        id: i,
        text: seg.text || '',
        start: seg.start || 0,
        end: seg.end || 0,
        words: (seg.words || []).map((w: Record<string, unknown>) => ({
          word: w.word || '',
          start: w.start || 0,
          end: w.end || 0,
          confidence: typeof w.probability === 'number' ? w.probability : 1,
        })),
      })),
      words: (data.words || []).map((w: Record<string, unknown>) => ({
        word: w.word || '',
        start: w.start || 0,
        end: w.end || 0,
        confidence: typeof w.probability === 'number' ? w.probability : 1,
      })),
    }

    res.json(result)
  } catch (err) {
    logger.error({ err, provider }, '[Whisper] Transcription failed')
    res.status(500).json({ error: 'Transcription failed' })
  }
})

export default router
