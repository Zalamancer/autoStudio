import { Router } from 'express'
import { getTemplateCatalog, getTemplateById } from '../../services/templateCatalogService'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string | undefined
    const search = req.query.search as string | undefined
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    let templates = await getTemplateCatalog()

    if (category) {
      templates = templates.filter((t) => t.category === category)
    }
    if (search) {
      const lower = search.toLowerCase()
      templates = templates.filter((t) =>
        t.title.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lower))
      )
    }

    const total = templates.length
    const paginated = templates.slice(offset, offset + limit)

    const summaries = paginated.map(({ motionDesignDescription, ...rest }) => rest)

    res.json({ templates: summaries, total })
  } catch (err) {
    console.error('[Templates] List error:', err)
    res.status(500).json({ error: 'Failed to list templates', code: 'INTERNAL_ERROR' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id)
    if (!template) {
      res.status(404).json({ error: 'Template not found', code: 'NOT_FOUND' })
      return
    }
    res.json(template)
  } catch (err) {
    console.error('[Templates] Detail error:', err)
    res.status(500).json({ error: 'Failed to fetch template', code: 'INTERNAL_ERROR' })
  }
})

export default router
