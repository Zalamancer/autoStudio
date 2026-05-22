/**
 * Server routes for 3D character cloud persistence.
 * Uses Supabase Storage ("characters" bucket) under 3d/ prefix.
 * GLB blobs are stored as binary files; metadata as JSON.
 */
import { Router } from 'express'
import multer from 'multer'
import { getSupabaseAdmin } from '../middleware/supabaseAuth.js'
import { requireAuth } from '../middleware/supabaseAuth.js'

const router = Router()
const BUCKET = 'characters'
const PREFIX = '3d'

// Accept up to 25 MB GLB files
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25_000_000 } })

// ── Types ────────────────────────────────────────────────────

interface Character3DMeta {
  id: string
  name: string
  thumbnailDataUrl: string
  skeletonType: string
  polyCount: number
  createdAt: number
  sourcePrompt?: string
}

// ── Helpers ──────────────────────────────────────────────────

async function getIndex(userId: string): Promise<Character3DMeta[]> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/${PREFIX}/_index.json`
  const { data, error } = await sb.storage.from(BUCKET).download(path)
  if (error || !data) return []
  try {
    return JSON.parse(await data.text()) as Character3DMeta[]
  } catch {
    return []
  }
}

async function saveIndex(userId: string, index: Character3DMeta[]): Promise<void> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/${PREFIX}/_index.json`
  const buf = Buffer.from(JSON.stringify(index), 'utf-8')
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { upsert: true, contentType: 'application/json' })
  if (error) {
    console.error('[3DChars] saveIndex error:', error)
    throw error
  }
}

function publicUrl(storagePath: string): string {
  const sb = getSupabaseAdmin()
  const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

// ── Routes ───────────────────────────────────────────────────

/** GET /api/3d-characters — list saved 3D characters (metadata only) */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const index = await getIndex(userId)
    res.json({ characters: index })
  } catch (err) {
    console.error('[3DChars] list error:', err)
    res.status(500).json({ error: 'Failed to list 3D characters' })
  }
})

/** GET /api/3d-characters/:id/meta — download 3D character metadata JSON */
router.get('/:id/meta', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    const { data, error } = await sb.storage
      .from(BUCKET)
      .download(`${userId}/${PREFIX}/${charId}_meta.json`)

    if (error || !data) {
      res.status(404).json({ error: '3D character metadata not found' })
      return
    }

    const text = await data.text()
    res.setHeader('Content-Type', 'application/json')
    res.send(text)
  } catch (err) {
    console.error('[3DChars] get meta error:', err)
    res.status(500).json({ error: 'Failed to get 3D character metadata' })
  }
})

/** GET /api/3d-characters/:id/glb — download 3D character GLB file */
router.get('/:id/glb', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    const { data, error } = await sb.storage
      .from(BUCKET)
      .download(`${userId}/${PREFIX}/${charId}.glb`)

    if (error || !data) {
      res.status(404).json({ error: '3D character GLB not found' })
      return
    }

    const buffer = Buffer.from(await data.arrayBuffer())
    res.setHeader('Content-Type', 'model/gltf-binary')
    res.setHeader('Content-Disposition', `attachment; filename="${charId}.glb"`)
    res.send(buffer)
  } catch (err) {
    console.error('[3DChars] get glb error:', err)
    res.status(500).json({ error: 'Failed to get 3D character GLB' })
  }
})

/** POST /api/3d-characters — upload a 3D character (metadata JSON + GLB binary via multipart) */
router.post(
  '/',
  requireAuth,
  upload.single('glb'),
  async (req, res) => {
    try {
      const userId = (req as any).userId as string
      const glbFile = req.file

      if (!glbFile) {
        res.status(400).json({ error: 'Missing GLB file' })
        return
      }

      const meta: Character3DMeta = JSON.parse(req.body.meta || '{}')
      const character = JSON.parse(req.body.character || '{}')

      if (!meta.id) {
        res.status(400).json({ error: 'Missing character id in meta' })
        return
      }

      const sb = getSupabaseAdmin()

      // Upload GLB binary
      const glbPath = `${userId}/${PREFIX}/${meta.id}.glb`
      const { error: glbErr } = await sb.storage
        .from(BUCKET)
        .upload(glbPath, glbFile.buffer, { upsert: true, contentType: 'model/gltf-binary' })

      if (glbErr) {
        console.error('[3DChars] GLB upload error:', glbErr)
        res.status(500).json({ error: 'Failed to upload GLB' })
        return
      }

      // Upload metadata JSON (includes full Saved3DCharacter data)
      const metaPath = `${userId}/${PREFIX}/${meta.id}_meta.json`
      const metaBlob = new Blob([JSON.stringify(character)], { type: 'application/json' })
      const { error: metaErr } = await sb.storage
        .from(BUCKET)
        .upload(metaPath, metaBlob, { upsert: true, contentType: 'application/json' })

      if (metaErr) {
        console.error('[3DChars] meta upload error:', metaErr)
        res.status(500).json({ error: 'Failed to upload metadata' })
        return
      }

      // Update index
      const index = await getIndex(userId)
      const filtered = index.filter((c) => c.id !== meta.id)
      filtered.unshift(meta)
      await saveIndex(userId, filtered)

      res.json({ ok: true, glbUrl: publicUrl(glbPath) })
    } catch (err) {
      console.error('[3DChars] upload error:', err)
      res.status(500).json({ error: 'Failed to upload 3D character' })
    }
  }
)

/** DELETE /api/3d-characters/:id — delete a 3D character */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const charId = req.params.id
    const sb = getSupabaseAdmin()

    // Remove both files
    await sb.storage.from(BUCKET).remove([
      `${userId}/${PREFIX}/${charId}.glb`,
      `${userId}/${PREFIX}/${charId}_meta.json`,
    ])

    // Update index
    const index = await getIndex(userId)
    const filtered = index.filter((c) => c.id !== charId)
    await saveIndex(userId, filtered)

    res.json({ ok: true })
  } catch (err) {
    console.error('[3DChars] delete error:', err)
    res.status(500).json({ error: 'Failed to delete 3D character' })
  }
})

export default router
