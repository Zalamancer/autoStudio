/**
 * Recraft.ai API proxy routes for image vectorization and background removal.
 *
 * Endpoints:
 *   POST /vectorize          — Convert raster image to SVG
 *   POST /remove-background  — Remove image background (returns PNG)
 *   GET  /status             — Check if RECRAFT_API_KEY is configured
 */
import { Router, type Request, type Response } from 'express'
import { validate } from '../middleware/validate'
import { recraftImageBody } from '../schemas'

const router = Router()

const RECRAFT_API_BASE = 'https://external.api.recraft.ai/v1/images'

function getRecraftKey(): string | null {
  return process.env.RECRAFT_API_KEY || null
}

export function isRecraftConfigured(): boolean {
  return !!getRecraftKey()
}

/**
 * Convert a base64 data URL to a File-like Blob for multipart upload.
 */
function base64ToBlob(base64DataUrl: string): { buffer: Buffer; mimeType: string } {
  const matches = base64DataUrl.match(/^data:(.+?);base64,(.+)$/)
  if (!matches) {
    throw new Error('Invalid base64 data URL')
  }
  const mimeType = matches[1]
  const buffer = Buffer.from(matches[2], 'base64')
  return { buffer, mimeType }
}

// GET /status — Check API key availability
router.get('/status', (_req: Request, res: Response) => {
  res.json({ configured: isRecraftConfigured() })
})

// POST /vectorize — Convert raster image to SVG
router.post('/vectorize', validate({ body: recraftImageBody }), async (req: Request, res: Response) => {
  try {
    const { image } = req.body

    const apiKey = getRecraftKey()
    if (!apiKey) {
      res.status(503).json({ error: 'RECRAFT_API_KEY is not configured' })
      return
    }


    const { buffer, mimeType } = base64ToBlob(image)

    // Build multipart form data
    const boundary = '----RecraftBoundary' + Date.now().toString(36)
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('svg') ? 'svg' : 'jpg'
    const filename = `image.${ext}`

    const bodyParts: Buffer[] = []

    // File field
    bodyParts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    ))
    bodyParts.push(buffer)
    bodyParts.push(Buffer.from('\r\n'))

    // response_format field
    bodyParts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
      `b64_json\r\n`
    ))

    // Closing boundary
    bodyParts.push(Buffer.from(`--${boundary}--\r\n`))

    const body = Buffer.concat(bodyParts)

    const recraftRes = await fetch(`${RECRAFT_API_BASE}/vectorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    })

    if (!recraftRes.ok) {
      const errorText = await recraftRes.text()
      console.error('[Recraft] vectorize error:', errorText)
      res.status(recraftRes.status).json({ error: `Recraft API error: ${errorText}` })
      return
    }

    const data = await recraftRes.json() as Record<string, unknown>

    // Response format: { image: { b64_json: "...", image_id: "..." }, credits: N }
    const imageObj = data.image as Record<string, unknown> | undefined
    const svgB64 = imageObj?.b64_json as string | undefined
    const svgUrl = imageObj?.url as string | undefined

    if (!svgB64 && !svgUrl) {
      console.error('[Recraft] Unexpected response:', JSON.stringify(data).slice(0, 500))
      res.status(500).json({ error: 'No SVG data in Recraft response' })
      return
    }

    let svgString: string

    if (svgB64) {
      svgString = Buffer.from(svgB64, 'base64').toString('utf-8')
    } else {
      const svgRes = await fetch(svgUrl!)
      if (!svgRes.ok) {
        res.status(500).json({ error: `Failed to fetch SVG from URL: ${svgRes.status}` })
        return
      }
      svgString = await svgRes.text()
    }

    res.json({ svg: svgString })
  } catch (error) {
    console.error('[Recraft] vectorize error:', error)
    res.status(500).json({
      error: 'Vectorization failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// POST /remove-background — Remove image background
router.post('/remove-background', validate({ body: recraftImageBody }), async (req: Request, res: Response) => {
  try {
    const { image } = req.body

    const apiKey = getRecraftKey()
    if (!apiKey) {
      res.status(503).json({ error: 'RECRAFT_API_KEY is not configured' })
      return
    }


    const { buffer, mimeType } = base64ToBlob(image)

    // Build multipart form data
    const boundary = '----RecraftBoundary' + Date.now().toString(36)
    const ext = mimeType.includes('png') ? 'png' : 'jpg'
    const filename = `image.${ext}`

    const bodyParts: Buffer[] = []

    // File field
    bodyParts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    ))
    bodyParts.push(buffer)
    bodyParts.push(Buffer.from('\r\n'))

    // Use URL response format (more reliable than b64_json for removeBackground)
    // We fetch the URL immediately and convert to base64 ourselves
    bodyParts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="response_format"\r\n\r\n` +
      `url\r\n`
    ))

    // Closing boundary
    bodyParts.push(Buffer.from(`--${boundary}--\r\n`))

    const body = Buffer.concat(bodyParts)

    const recraftRes = await fetch(`${RECRAFT_API_BASE}/removeBackground`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    })

    if (!recraftRes.ok) {
      const errorText = await recraftRes.text()
      console.error('[Recraft] remove-background error:', errorText)
      res.status(recraftRes.status).json({ error: `Recraft API error: ${errorText}` })
      return
    }

    const data = await recraftRes.json() as Record<string, unknown>

    console.log('[Recraft] remove-background response keys:', Object.keys(data))

    // Recraft response can be:
    //   { image: { b64_json: "..." } }           — when response_format=b64_json
    //   { image: { url: "https://..." } }         — when response_format=url (default)
    //   { data: [{ b64_json: "..." }] }           — some API versions
    const imageObj = data.image as Record<string, unknown> | undefined
    const dataArr = data.data as Array<Record<string, unknown>> | undefined
    const firstData = dataArr?.[0]

    const rawB64 = imageObj?.b64_json as string | undefined
      ?? firstData?.b64_json as string | undefined
    const imageUrl = imageObj?.url as string | undefined
      ?? firstData?.url as string | undefined

    if (!rawB64 && !imageUrl) {
      console.error('[Recraft] Unexpected response structure:', JSON.stringify(data).slice(0, 1000))
      res.status(500).json({ error: 'No image data in Recraft response' })
      return
    }

    let resultDataUrl: string

    // Prefer b64_json, but only if it contains real data (>200 chars ≈ non-trivial image)
    if (rawB64 && rawB64.length > 200) {
      resultDataUrl = `data:image/png;base64,${rawB64}`
    } else {
      // Fall back to URL fetch (also handles case where b64_json is empty/tiny)
      const fetchUrl = imageUrl ?? (rawB64 ? null : null)
      if (!fetchUrl) {
        console.error('[Recraft] b64_json too small and no URL fallback. b64 length:', rawB64?.length ?? 0)
        res.status(500).json({ error: 'Recraft returned empty image data' })
        return
      }
      console.log('[Recraft] Fetching image from URL:', fetchUrl.slice(0, 100))
      const imgRes = await fetch(fetchUrl)
      if (!imgRes.ok) {
        res.status(500).json({ error: `Failed to fetch image from URL: ${imgRes.status}` })
        return
      }
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
      if (imgBuffer.length < 100) {
        console.error('[Recraft] Image from URL suspiciously small:', imgBuffer.length, 'bytes')
        res.status(500).json({ error: 'Recraft returned an empty or corrupt image' })
        return
      }
      resultDataUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`
    }

    res.json({ image: resultDataUrl })
  } catch (error) {
    console.error('[Recraft] remove-background error:', error)
    res.status(500).json({
      error: 'Background removal failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
