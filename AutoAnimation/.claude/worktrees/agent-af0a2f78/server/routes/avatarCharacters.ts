/**
 * Server routes for avatar character cloud persistence.
 * Uses Supabase Storage ("characters" bucket) under avatar/ prefix.
 * Stores avatar image blobs as base64 data URLs in JSON files.
 */
import { Router } from 'express'
import { getSupabaseAdmin } from '../middleware/supabaseAuth.js'
import { requireAuth } from '../middleware/supabaseAuth.js'

const router = Router()
const BUCKET = 'characters'
const PREFIX = 'avatar'

// ── Types ────────────────────────────────────────────────────

interface AvatarMeta {
  id: string
  name: string
  description: string
  style: string
  thumbnailDataUrl: string
  createdAt: number
}

// ── Helpers ──────────────────────────────────────────────────

async function getIndex(userId: string): Promise<AvatarMeta[]> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/${PREFIX}/_index.json`
  const { data, error } = await sb.storage.from(BUCKET).download(path)
  if (error || !data) return []
  try {
    return JSON.parse(await data.text()) as AvatarMeta[]
  } catch {
    return []
  }
}

async function saveIndex(userId: string, index: AvatarMeta[]): Promise<void> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/${PREFIX}/_index.json`
  const buf = Buffer.from(JSON.stringify(index), 'utf-8')
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { upsert: true, contentType: 'application/json' })
  if (error) {
    console.error('[Avatar] saveIndex error:', error)
    throw error
  }
}

// ── Routes ───────────────────────────────────────────────────

/** GET /api/avatar-characters — list saved avatar characters (metadata only) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const index = await getIndex(userId)
    res.json({ characters: index })
  } catch (err) {
    console.error('[Avatar] list error:', err)
    res.status(500).json({ error: 'Failed to list avatar characters' })
  }
})

/** GET /api/avatar-characters/:id — download full avatar data */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    const { data, error } = await sb.storage
      .from(BUCKET)
      .download(`${userId}/${PREFIX}/${charId}.json`)

    if (error || !data) {
      res.status(404).json({ error: 'Avatar character not found' })
      return
    }

    const text = await data.text()
    res.setHeader('Content-Type', 'application/json')
    res.send(text)
  } catch (err) {
    console.error('[Avatar] get error:', err)
    res.status(500).json({ error: 'Failed to get avatar character' })
  }
})

/** POST /api/avatar-characters — upload avatar character data */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const { meta, character, blob } = req.body

    if (!meta?.id) {
      res.status(400).json({ error: 'Missing character id in meta' })
      return
    }

    const sb = getSupabaseAdmin()

    // Upload the full data (character metadata + base64 image blob) as a single JSON file
    const dataPath = `${userId}/${PREFIX}/${meta.id}.json`
    const buf = Buffer.from(JSON.stringify({ meta, character, blob }), 'utf-8')
    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(dataPath, buf, { upsert: true, contentType: 'application/json' })

    if (uploadErr) {
      console.error('[Avatar] upload error:', uploadErr)
      res.status(500).json({ error: 'Failed to upload avatar data' })
      return
    }

    // Update index
    const index = await getIndex(userId)
    const filtered = index.filter((c) => c.id !== meta.id)
    filtered.unshift(meta)
    await saveIndex(userId, filtered)

    res.json({ ok: true })
  } catch (err) {
    console.error('[Avatar] upload error:', err)
    res.status(500).json({ error: 'Failed to upload avatar character' })
  }
})

/** DELETE /api/avatar-characters/:id — delete an avatar character */
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
    console.error('[Avatar] delete error:', err)
    res.status(500).json({ error: 'Failed to delete avatar character' })
  }
})

export default router
