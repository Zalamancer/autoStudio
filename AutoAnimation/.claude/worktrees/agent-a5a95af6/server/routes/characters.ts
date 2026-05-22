/**
 * Server routes for saved character cloud persistence.
 * Uses Supabase Storage ("characters" bucket) to store character
 * image data (JSON files with base64 sprites) and a per-user metadata index.
 */
import { Router } from 'express'
import { getSupabaseAdmin } from '../middleware/supabaseAuth.js'
import { requireAuth } from '../middleware/supabaseAuth.js'

const router = Router()
const BUCKET = 'characters'

// ── Types ────────────────────────────────────────────────────

interface CharacterMeta {
  id: string
  name: string
  stylePrompt: string
  createdAt: number
  /** Truncated reference image (first 200 chars) for quick list display */
  referenceImagePreview?: string
}

// ── Helpers ──────────────────────────────────────────────────

async function getIndex(userId: string): Promise<CharacterMeta[]> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/_index.json`
  const { data, error } = await sb.storage.from(BUCKET).download(path)
  if (error || !data) return []
  try {
    return JSON.parse(await data.text()) as CharacterMeta[]
  } catch {
    return []
  }
}

async function saveIndex(userId: string, index: CharacterMeta[]): Promise<void> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/_index.json`
  const buf = Buffer.from(JSON.stringify(index), 'utf-8')
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { upsert: true, contentType: 'application/json' })
  if (error) {
    console.error('[Characters] saveIndex error:', error)
    throw error
  }
}

// ── Routes ───────────────────────────────────────────────────

/** GET /api/characters — list saved characters (metadata only) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const index = await getIndex(userId)
    res.json({ characters: index })
  } catch (err) {
    console.error('[Characters] list error:', err)
    res.status(500).json({ error: 'Failed to list characters' })
  }
})

/** GET /api/characters/:id — download full character image data */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    const { data, error } = await sb.storage
      .from(BUCKET)
      .download(`${userId}/${charId}.json`)

    if (error || !data) {
      res.status(404).json({ error: 'Character not found' })
      return
    }

    const text = await data.text()
    res.setHeader('Content-Type', 'application/json')
    res.send(text)
  } catch (err) {
    console.error('[Characters] get error:', err)
    res.status(500).json({ error: 'Failed to get character' })
  }
})

/** POST /api/characters — upload a character (metadata + full image data as JSON body) */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const { meta, imageData } = req.body as { meta: CharacterMeta; imageData: any }

    if (!meta?.id) {
      res.status(400).json({ error: 'Missing character id in meta' })
      return
    }

    const sb = getSupabaseAdmin()

    // Upload the full image data as a JSON file
    const dataPath = `${userId}/${meta.id}.json`
    const dataBlob = new Blob([JSON.stringify(imageData)], { type: 'application/json' })
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(dataPath, dataBlob, { upsert: true, contentType: 'application/json' })

    if (uploadErr) {
      console.error('[Characters] upload error:', uploadErr)
      res.status(500).json({ error: 'Failed to upload character data' })
      return
    }

    // Update index
    const index = await getIndex(userId)
    const filtered = index.filter((c) => c.id !== meta.id)
    filtered.unshift(meta)
    await saveIndex(userId, filtered)

    res.json({ ok: true })
  } catch (err) {
    console.error('[Characters] upload error:', err)
    res.status(500).json({ error: 'Failed to upload character' })
  }
})

/** DELETE /api/characters/:id — delete a character */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    // Remove the data file
    await sb.storage.from(BUCKET).remove([`${userId}/${charId}.json`])

    // Update index
    const index = await getIndex(userId)
    const filtered = index.filter((c) => c.id !== charId)
    await saveIndex(userId, filtered)

    res.json({ ok: true })
  } catch (err) {
    console.error('[Characters] delete error:', err)
    res.status(500).json({ error: 'Failed to delete character' })
  }
})

export default router
