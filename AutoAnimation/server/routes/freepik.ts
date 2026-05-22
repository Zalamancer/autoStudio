import { Router, type Request, type Response } from 'express'

const router = Router()

// Auth handled at mount level in server/index.ts (requireAuth + aiRateLimiter)

router.get('/status', (_req: Request, res: Response) => {
  const hasKey = !!process.env.FREEPIK_API_KEY
  res.json({ configured: hasKey })
})

router.post('/search', async (req: Request, res: Response) => {
  const apiKey = process.env.FREEPIK_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'Freepik API key not configured' })
  }

  const { query, assetType, style, limit = 5, transparency } = req.body

  if (!query || !assetType) {
    return res.status(400).json({ error: 'query and assetType are required' })
  }

  let searchQuery = query
  if (style) searchQuery += ` ${style}`
  if (transparency) searchQuery += ' isolated'

  const filters: Record<string, string> = {}
  if (assetType === 'photo') filters['content_type[photo]'] = '1'
  else if (assetType === 'png' || assetType === 'illustration')
    filters['content_type[psd]'] = '1'
  else if (assetType === 'vector') filters['content_type[vector]'] = '1'

  const params = new URLSearchParams({
    term: searchQuery,
    per_page: String(limit),
    ...filters,
  })

  const url = `https://api.freepik.com/v1/resources?${params}`

  let retries = 0
  const delays = [1000, 2000, 4000]

  while (retries <= 3) {
    try {
      const upstream = await fetch(url, {
        headers: {
          'x-freepik-api-key': apiKey,
          Accept: 'application/json',
        },
      })

      if (upstream.status === 429 && retries < 3) {
        await new Promise((r) => setTimeout(r, delays[retries]))
        retries++
        continue
      }

      if (!upstream.ok) {
        return res
          .status(upstream.status)
          .json({ error: `Freepik API error: ${upstream.status}` })
      }

      const data = await upstream.json()
      const results = (data.data || []).map(
        (item: Record<string, unknown>, idx: number) => ({
          id: String(item.id),
          url: (item.image as Record<string, unknown>)?.source_url || '',
          thumbnailUrl:
            (item.thumbnails as Record<string, unknown>[])?.[0]?.url || '',
          width: (item.image as Record<string, unknown>)?.width || 0,
          height: (item.image as Record<string, unknown>)?.height || 0,
          format: String(
            (item.image as Record<string, unknown>)?.format || 'jpg',
          ),
          relevanceScore: 1 - idx / limit,
        }),
      )

      return res.json({ results })
    } catch (err) {
      if (retries >= 3) {
        return res.status(502).json({ error: 'Freepik API request failed' })
      }
      retries++
    }
  }
})

export default router
