/**
 * Dev-only endpoint for managing motion graphics templates.
 * Allows deleting template files + their index.ts imports from the browser.
 * Only available in development mode.
 */
import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const router = Router()

const __dir = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dir, '..', '..')
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'src', 'motionGraphics', 'templates')
const INDEX_FILE = path.join(PROJECT_ROOT, 'src', 'motionGraphics', 'index.ts')

// Only allow in development
router.use((_req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev endpoints disabled in production' })
  }
  next()
})

/**
 * DELETE /api/dev/templates/:filename
 * Deletes a template file and removes its import from index.ts
 */
router.delete('/:filename', (req, res) => {
  const { filename } = req.params
  // Sanitize — only allow alphanumeric + dashes, no path traversal
  if (!/^[A-Za-z0-9]+$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' })
  }

  const filePath = path.join(TEMPLATES_DIR, `${filename}.tsx`)

  // 1. Delete the file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  } else {
    return res.status(404).json({ error: `File not found: ${filename}.tsx` })
  }

  // 2. Remove the import line from index.ts
  if (fs.existsSync(INDEX_FILE)) {
    const content = fs.readFileSync(INDEX_FILE, 'utf-8')
    const importLine = `import './templates/${filename}'`
    const updated = content
      .split('\n')
      .filter((line) => !line.includes(importLine))
      .join('\n')

    if (updated !== content) {
      fs.writeFileSync(INDEX_FILE, updated, 'utf-8')
    }
  }

  res.json({ ok: true, deleted: filename })
})

/**
 * DELETE /api/dev/templates (batch delete)
 * Body: { filenames: string[] }
 */
router.delete('/', (req, res) => {
  const { filenames } = req.body as { filenames?: string[] }
  if (!Array.isArray(filenames) || filenames.length === 0) {
    return res.status(400).json({ error: 'filenames array required' })
  }

  const results: { deleted: string[]; notFound: string[] } = { deleted: [], notFound: [] }

  // Delete files
  for (const name of filenames) {
    if (!/^[A-Za-z0-9]+$/.test(name)) continue
    const filePath = path.join(TEMPLATES_DIR, `${name}.tsx`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      results.deleted.push(name)
    } else {
      results.notFound.push(name)
    }
  }

  // Remove import lines from index.ts
  if (results.deleted.length > 0 && fs.existsSync(INDEX_FILE)) {
    const content = fs.readFileSync(INDEX_FILE, 'utf-8')
    const deleteSet = new Set(results.deleted)
    const updated = content
      .split('\n')
      .filter((line) => {
        const match = line.match(/import '\.\/templates\/([A-Za-z0-9]+)'/)
        return !match || !deleteSet.has(match[1])
      })
      .join('\n')

    if (updated !== content) {
      fs.writeFileSync(INDEX_FILE, updated, 'utf-8')
    }
  }

  res.json(results)
})

/**
 * Template ratings — stored as JSON file on disk
 */
const RATINGS_FILE = path.join(PROJECT_ROOT, '.template-ratings.json')

function loadRatingsFile(): Record<string, string> {
  try {
    if (fs.existsSync(RATINGS_FILE)) return JSON.parse(fs.readFileSync(RATINGS_FILE, 'utf-8'))
  } catch { /* ignore */ }
  return {}
}

function saveRatingsFile(data: Record<string, string>) {
  fs.writeFileSync(RATINGS_FILE, JSON.stringify(data), 'utf-8')
}

/** GET /api/dev/templates/ratings */
router.get('/ratings', (_req, res) => {
  res.json(loadRatingsFile())
})

/** PUT /api/dev/templates/ratings — { id: string, rating: 'liked' | 'disliked' | null } */
router.put('/ratings', (req, res) => {
  const { id, rating } = req.body as { id?: string; rating?: string | null }
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'id required' })

  const data = loadRatingsFile()
  if (rating === null || rating === undefined) {
    delete data[id]
  } else {
    data[id] = rating
  }
  saveRatingsFile(data)
  res.json({ ok: true })
})

export default router
