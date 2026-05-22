/**
 * Server routes for pixel art character cloud persistence.
 * Uses Supabase Storage ("characters" bucket) under pixelart/ prefix.
 * Stores sprite blobs as base64 data URLs in JSON files.
 */
import { Router } from 'express'
import { getSupabaseAdmin } from '../middleware/supabaseAuth.js'
import { requireAuth } from '../middleware/supabaseAuth.js'

const router = Router()
const BUCKET = 'characters'
const PREFIX = 'pixelart'

// ── Types ────────────────────────────────────────────────────

interface PixelArtMeta {
  id: string
  name: string
  description: string
  size: number
  n_directions: 4 | 8
  thumbnailDataUrl: string
  createdAt: number
}

// ── Helpers ──────────────────────────────────────────────────

async function getIndex(userId: string): Promise<PixelArtMeta[]> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/${PREFIX}/_index.json`
  const { data, error } = await sb.storage.from(BUCKET).download(path)
  if (error || !data) return []
  try {
    return JSON.parse(await data.text()) as PixelArtMeta[]
  } catch {
    return []
  }
}

async function saveIndex(userId: string, index: PixelArtMeta[]): Promise<void> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/${PREFIX}/_index.json`
  const buf = Buffer.from(JSON.stringify(index), 'utf-8')
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { upsert: true, contentType: 'application/json' })
  if (error) {
    console.error('[PixelArt] saveIndex error:', error)
    throw error
  }
}

// ── Routes ───────────────────────────────────────────────────

/** GET /api/pixelart-characters — list saved pixel art characters (metadata only) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const index = await getIndex(userId)
    res.json({ characters: index })
  } catch (err) {
    console.error('[PixelArt] list error:', err)
    res.status(500).json({ error: 'Failed to list pixel art characters' })
  }
})

/** GET /api/pixelart-characters/:id — download full pixel art data */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    const { data, error } = await sb.storage
      .from(BUCKET)
      .download(`${userId}/${PREFIX}/${charId}.json`)

    if (error || !data) {
      res.status(404).json({ error: 'Pixel art character not found' })
      return
    }

    const text = await data.text()
    res.setHeader('Content-Type', 'application/json')
    res.send(text)
  } catch (err) {
    console.error('[PixelArt] get error:', err)
    res.status(500).json({ error: 'Failed to get pixel art character' })
  }
})

/** POST /api/pixelart-characters — upload pixel art character data */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const { meta, character, blobs } = req.body

    if (!meta?.id) {
      res.status(400).json({ error: 'Missing character id in meta' })
      return
    }

    const sb = getSupabaseAdmin()

    // Upload the full data (character metadata + blobs) as a single JSON file
    const dataPath = `${userId}/${PREFIX}/${meta.id}.json`
    const dataBlob = new Blob([JSON.stringify({ meta, character, blobs })], { type: 'application/json' })
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(dataPath, dataBlob, { upsert: true, contentType: 'application/json' })

    if (uploadErr) {
      console.error('[PixelArt] upload error:', uploadErr)
      res.status(500).json({ error: 'Failed to upload pixel art data' })
      return
    }

    // Update index
    const index = await getIndex(userId)
    const filtered = index.filter((c) => c.id !== meta.id)
    filtered.unshift(meta)
    await saveIndex(userId, filtered)

    res.json({ ok: true })
  } catch (err) {
    console.error('[PixelArt] upload error:', err)
    res.status(500).json({ error: 'Failed to upload pixel art character' })
  }
})

/** DELETE /api/pixelart-characters/:id — delete a pixel art character */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    // Remove the data file
    await sb.storage.from(BUCKET).remove([`${userId}/${PREFIX}/${charId}.json`])

    // Update index
    const index = await getIndex(userId)
    const filtered = index.filter((c) => c.id !== charId)
    await saveIndex(userId, filtered)

    res.json({ ok: true })
  } catch (err) {
    console.error('[PixelArt] delete error:', err)
    res.status(500).json({ error: 'Failed to delete pixel art character' })
  }
})

export default router
