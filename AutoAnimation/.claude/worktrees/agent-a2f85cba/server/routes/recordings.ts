/**
 * Server routes for recording cloud persistence.
 * Uses Supabase Storage ("recordings" bucket) to store video blobs,
 * thumbnails, and a per-user JSON metadata index.
 */
import { Router } from 'express'
import multer from 'multer'
import { getSupabaseAdmin } from '../middleware/supabaseAuth.js'
import { requireAuth } from '../middleware/supabaseAuth.js'

const router = Router()

// Accept up to 50 MB video + 2 MB thumbnail
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 52_000_000 } })

const BUCKET = 'recordings'

// ── Helpers ──────────────────────────────────────────────────

interface RecordingMeta {
  id: string
  name: string
  format: string
  width: number
  height: number
  fps: number
  durationSec: number
  fileSize: number
  createdAt: string
  projectId: string | null
  projectName: string | null
  videoUrl: string | null
  thumbnailUrl: string | null
}

async function getIndex(userId: string): Promise<RecordingMeta[]> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/_index.json`
  const { data, error } = await sb.storage.from(BUCKET).download(path)
  if (error || !data) return []
  try {
    const text = await data.text()
    return JSON.parse(text) as RecordingMeta[]
  } catch {
    return []
  }
}

async function saveIndex(userId: string, index: RecordingMeta[]): Promise<void> {
  const sb = getSupabaseAdmin()
  const path = `${userId}/_index.json`
  const buf = Buffer.from(JSON.stringify(index), 'utf-8')
  const { error } = await sb.storage.from(BUCKET).upload(path, buf, { upsert: true, contentType: 'application/json' })
  if (error) {
    console.error('[Recordings] saveIndex error:', error)
    throw error
  }
}

function publicUrl(storagePath: string): string {
  const sb = getSupabaseAdmin()
  const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

// ── Routes ───────────────────────────────────────────────────

/** GET /api/recordings — list all recordings for the authenticated user */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const index = await getIndex(userId)
    res.json({ recordings: index })
  } catch (err) {
    console.error('[Recordings] list error:', err)
    res.status(500).json({ error: 'Failed to list recordings' })
  }
})

/** POST /api/recordings — upload a recording (video + optional thumbnail) */
router.post(
  '/',
  requireAuth,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = (req as any).userId as string
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      const videoFile = files?.video?.[0]

      if (!videoFile) {
        res.status(400).json({ error: 'Missing video file' })
        return
      }

      const meta: RecordingMeta = JSON.parse(req.body.meta || '{}')
      if (!meta.id) {
        res.status(400).json({ error: 'Missing recording id in meta' })
        return
      }

      const sb = getSupabaseAdmin()

      // Upload video
      const ext = meta.format || 'mp4'
      const videoPath = `${userId}/${meta.id}.${ext}`
      const contentType = ext === 'webm' ? 'video/webm' : 'video/mp4'

      const { error: videoErr } = await sb.storage
        .from(BUCKET)
        .upload(videoPath, videoFile.buffer, { upsert: true, contentType })

      if (videoErr) {
        console.error('[Recordings] video upload error:', videoErr)
        res.status(500).json({ error: 'Failed to upload video' })
        return
      }

      meta.videoUrl = publicUrl(videoPath)
      meta.fileSize = videoFile.size

      // Upload thumbnail if provided
      const thumbFile = files?.thumbnail?.[0]
      if (thumbFile) {
        const thumbPath = `${userId}/${meta.id}_thumb.png`
        const { error: thumbErr } = await sb.storage
          .from(BUCKET)
          .upload(thumbPath, thumbFile.buffer, { upsert: true, contentType: 'image/png' })

        if (!thumbErr) {
          meta.thumbnailUrl = publicUrl(thumbPath)
        }
      }

      // Update index
      const index = await getIndex(userId)
      // Remove existing entry with same id (re-upload case)
      const filtered = index.filter((r) => r.id !== meta.id)
      filtered.unshift(meta)
      await saveIndex(userId, filtered)

      res.json({ recording: meta })
    } catch (err) {
      console.error('[Recordings] upload error:', err)
      res.status(500).json({ error: 'Failed to upload recording' })
    }
  }
)

/** DELETE /api/recordings/:id — delete a recording */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const recordingId = req.params.id
    const sb = getSupabaseAdmin()

    // Find the recording in the index to know the format
    const index = await getIndex(userId)
    const rec = index.find((r) => r.id === recordingId)

    // Remove files (try both common extensions)
    const pathsToRemove: string[] = []
    if (rec) {
      pathsToRemove.push(`${userId}/${recordingId}.${rec.format || 'mp4'}`)
    } else {
      pathsToRemove.push(`${userId}/${recordingId}.mp4`)
      pathsToRemove.push(`${userId}/${recordingId}.webm`)
    }
    pathsToRemove.push(`${userId}/${recordingId}_thumb.png`)

    await sb.storage.from(BUCKET).remove(pathsToRemove)

    // Update index
    const filtered = index.filter((r) => r.id !== recordingId)
    await saveIndex(userId, filtered)

    res.json({ ok: true })
  } catch (err) {
    console.error('[Recordings] delete error:', err)
    res.status(500).json({ error: 'Failed to delete recording' })
  }
})

/** PATCH /api/recordings/:id — rename a recording */
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId as string
    const recordingId = req.params.id
    const { name } = req.body

    if (!name) {
      res.status(400).json({ error: 'Missing name' })
      return
    }

    const index = await getIndex(userId)
    const rec = index.find((r) => r.id === recordingId)
    if (!rec) {
      res.status(404).json({ error: 'Recording not found' })
      return
    }

    rec.name = name
    await saveIndex(userId, index)

    res.json({ recording: rec })
  } catch (err) {
    console.error('[Recordings] rename error:', err)
    res.status(500).json({ error: 'Failed to rename recording' })
  }
})

export default router
