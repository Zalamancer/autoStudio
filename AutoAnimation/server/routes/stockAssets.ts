/**
 * Stock Asset Generation Pipeline
 *
 * Full pipeline: AI grid image → crop cells → remove BG → vectorize → store → publish
 *
 * Endpoints:
 *   POST /api/stock-assets/generate  — Generate a batch of stock assets from prompts
 *   GET  /api/stock-assets           — Browse generated stock assets
 *   GET  /api/stock-assets/search    — Search stock assets by prompt/category
 *   DELETE /api/stock-assets/:id     — Delete a stock asset
 */

import { Router, type Request, type Response } from 'express'
import sharp from 'sharp'
import { v4 as uuid } from 'uuid'
import { getSupabaseAdmin } from '../middleware/supabaseAuth'

const router = Router()

// ── Constants ──

const STOCK_ASSETS_BUCKET = 'stock-assets'
const THUMBNAIL_SIZE = 128
const MAX_GRID_CELLS = 16 // 4x4 max
const FAL_API_BASE = 'https://queue.fal.run'

// ── Helpers ──

function getFalApiKey(): string {
  const key = process.env.FAL_AI_API_KEY
  if (!key) throw new Error('FAL_AI_API_KEY not configured')
  return key
}

/**
 * Calculate optimal grid dimensions for N items
 */
function calculateGridDimensions(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 }
  if (count <= 2) return { cols: 2, rows: 1 }
  if (count <= 4) return { cols: 2, rows: 2 }
  if (count <= 6) return { cols: 3, rows: 2 }
  if (count <= 9) return { cols: 3, rows: 3 }
  if (count <= 12) return { cols: 4, rows: 3 }
  return { cols: 4, rows: 4 }
}

/**
 * Build a prompt that instructs the AI to generate objects in a grid layout
 */
function buildGridPrompt(
  items: string[],
  style: string,
  cols: number,
  rows: number,
): string {
  const styleMap: Record<string, string> = {
    flat: 'flat design, solid colors, no shadows, clean vector-style',
    cartoon: 'cartoon style, bold outlines, vibrant colors, playful',
    realistic: 'photorealistic, detailed, high quality, studio lighting',
    'pixel-art': 'pixel art style, 32x32 pixels per cell, retro game aesthetic',
    watercolor: 'watercolor illustration, soft edges, artistic, painted',
    'line-art': 'black and white line art, clean outlines, minimal, ink drawing',
    isometric: 'isometric 3D view, 45-degree angle, game asset style',
    '3d-render': '3D rendered, soft shadows, ambient occlusion, clean background',
    'hand-drawn': 'hand-drawn sketch style, pencil texture, artistic',
    minimalist: 'minimalist design, simple shapes, limited palette, modern',
  }

  const styleDesc = styleMap[style] || styleMap.flat

  // Build cell descriptions
  const cellDescriptions = items
    .map((item, i) => `Cell ${i + 1}: ${item}`)
    .join('. ')

  return [
    `A sprite sheet with ${cols} columns and ${rows} rows on a pure white background.`,
    `Each cell contains exactly one isolated object, centered with padding around it.`,
    `Clear grid separation between cells, no overlapping.`,
    `Style: ${styleDesc}.`,
    `Objects: ${cellDescriptions}.`,
    `Each object should be distinct, well-defined, and suitable for use as a game/animation asset.`,
    `White background behind each object, no decorative elements between cells.`,
  ].join(' ')
}

/**
 * Generate image via fal.ai Flux model (synchronous or polling)
 */
async function generateGridImage(
  prompt: string,
  width: number,
  height: number,
  model: string,
): Promise<Buffer> {
  const apiKey = getFalApiKey()

  console.log(`[stock-assets] Generating grid image via ${model} (${width}x${height})`)

  const body: Record<string, unknown> = {
    prompt,
    num_images: 1,
    image_size: { width, height },
    num_inference_steps: 28,
    guidance_scale: 7.5,
  }

  // Submit to queue
  const submitRes = await fetch(`${FAL_API_BASE}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!submitRes.ok) {
    const err = await submitRes.text()
    throw new Error(`FAL submit failed ${submitRes.status}: ${err}`)
  }

  const submitData = (await submitRes.json()) as Record<string, unknown>

  // If synchronous result
  if ((submitData as any).images) {
    const imageUrl = (submitData as any).images[0]?.url
    if (!imageUrl) throw new Error('No image URL in FAL response')
    const imgRes = await fetch(imageUrl)
    return Buffer.from(await imgRes.arrayBuffer())
  }

  // Async: poll for completion
  const requestId = submitData.request_id as string
  const statusUrl =
    (submitData as any).status_url ||
    `${FAL_API_BASE}/${model}/requests/${requestId}/status`
  const responseUrl =
    (submitData as any).response_url ||
    `${FAL_API_BASE}/${model}/requests/${requestId}`

  // Poll with exponential backoff
  let delay = 2000
  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((r) => setTimeout(r, delay))
    delay = Math.min(delay * 1.2, 10000)

    const pollRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${apiKey}` },
    })

    if (!pollRes.ok) continue

    const pollData = (await pollRes.json()) as Record<string, unknown>

    if (pollData.status === 'COMPLETED') {
      const resultRes = await fetch(responseUrl, {
        headers: { Authorization: `Key ${apiKey}` },
      })
      if (!resultRes.ok) throw new Error(`Failed to fetch result: ${resultRes.status}`)

      const resultData = (await resultRes.json()) as any
      const imageUrl = resultData.images?.[0]?.url
      if (!imageUrl) throw new Error('No image URL in completed result')

      const imgRes = await fetch(imageUrl)
      return Buffer.from(await imgRes.arrayBuffer())
    }

    if (pollData.status === 'FAILED') {
      throw new Error(`Image generation failed: ${pollData.error || 'unknown'}`)
    }
  }

  throw new Error('Image generation timed out after polling')
}

/**
 * Crop a grid image into individual cell images using sharp
 */
async function cropGridCells(
  gridBuffer: Buffer,
  cols: number,
  rows: number,
  itemCount: number,
): Promise<Buffer[]> {
  const metadata = await sharp(gridBuffer).metadata()
  const imgWidth = metadata.width!
  const imgHeight = metadata.height!

  const cellWidth = Math.floor(imgWidth / cols)
  const cellHeight = Math.floor(imgHeight / rows)

  console.log(`[stock-assets] Cropping ${itemCount} cells from ${imgWidth}x${imgHeight} (${cellWidth}x${cellHeight} per cell)`)

  const cells: Buffer[] = []

  for (let i = 0; i < itemCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    const left = col * cellWidth
    const top = row * cellHeight

    const cellBuffer = await sharp(gridBuffer)
      .extract({ left, top, width: cellWidth, height: cellHeight })
      .png()
      .toBuffer()

    cells.push(cellBuffer)
  }

  return cells
}

/**
 * Remove white/near-white background from an image using sharp.
 * Converts white-ish pixels to transparent.
 */
async function removeWhiteBackground(imageBuffer: Buffer, threshold = 230): Promise<Buffer> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = new Uint8Array(data)

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]

    // If pixel is white-ish, make transparent
    if (r >= threshold && g >= threshold && b >= threshold) {
      pixels[i + 3] = 0 // Set alpha to 0
    } else {
      // Soften edges near white (anti-aliasing)
      const whiteness = Math.min(r, g, b)
      if (whiteness >= threshold - 30) {
        const fade = (whiteness - (threshold - 30)) / 30
        pixels[i + 3] = Math.round(pixels[i + 3] * (1 - fade))
      }
    }
  }

  return sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()
}

/**
 * Vectorize a raster image to SVG using potrace.
 * Preprocesses with sharp for better tracing results.
 */
async function vectorizeImage(imageBuffer: Buffer): Promise<string> {
  // Potrace works best with high-contrast black & white images.
  // For colored assets, we trace the alpha channel (silhouette) and embed
  // the original as a clipped <image> for full color, plus the traced path
  // as a fallback/outline.

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata()
  const width = metadata.width!
  const height = metadata.height!

  // Create a posterized version for better tracing
  const posterized = await sharp(imageBuffer)
    .threshold(128)
    .negate() // Potrace traces black on white
    .toBuffer()

  // Use potrace for tracing
  const potrace = await import('potrace')

  return new Promise<string>((resolve, reject) => {
    potrace.trace(posterized, {
      threshold: 128,
      turdSize: 2,
      optTolerance: 0.2,
      color: '#000000',
      background: 'transparent',
    }, (err: Error | null, svg: string) => {
      if (err) return reject(err)

      // Potrace generates SVGs with fixed width/height.
      // Embed the original raster image as a data URI inside the SVG
      // so we get both: vector outline + full color raster.
      const base64Image = imageBuffer.toString('base64')
      const dataUri = `data:image/png;base64,${base64Image}`

      // Build a hybrid SVG: traced vector paths + embedded raster
      const hybridSvg = [
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
        `  <defs>`,
        `    <clipPath id="traced-clip">`,
        // Extract paths from potrace SVG
        ...extractPaths(svg).map(p => `      <path d="${p}"/>`),
        `    </clipPath>`,
        `  </defs>`,
        // Full color raster clipped to traced outline
        `  <image href="${dataUri}" width="${width}" height="${height}" clip-path="url(#traced-clip)"/>`,
        // Vector outline (hidden by default, available for styling)
        `  <g class="vector-outline" style="display:none">`,
        ...extractPaths(svg).map(p => `    <path d="${p}" fill="currentColor"/>`),
        `  </g>`,
        `</svg>`,
      ].join('\n')

      resolve(hybridSvg)
    })
  })
}

/**
 * Extract SVG path 'd' attributes from a potrace-generated SVG string
 */
function extractPaths(svg: string): string[] {
  const paths: string[] = []
  const pathRegex = /d="([^"]+)"/g
  let match
  while ((match = pathRegex.exec(svg)) !== null) {
    paths.push(match[1])
  }
  return paths
}

/**
 * Create a thumbnail from an image buffer
 */
async function createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

/**
 * Upload a buffer to Supabase storage and return public URL
 */
async function uploadToSupabase(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseAdmin()
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Upload failed: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ── Routes ──

/**
 * POST /api/stock-assets/generate
 *
 * Generate a batch of stock assets from text prompts.
 * Full pipeline: AI grid → crop → remove BG → vectorize → store → publish
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      category = 'objects',
      style = 'flat',
      items,
      gridCols,
      gridRows,
      model = 'fal-ai/flux/schnell',
      publishToMarketplace = true,
    } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'items array is required' })
      return
    }

    if (items.length > MAX_GRID_CELLS) {
      res.status(400).json({ error: `Maximum ${MAX_GRID_CELLS} items per batch` })
      return
    }

    const userId = (req as any).userId as string

    // Step 1: Calculate grid dimensions
    const { cols, rows } = gridCols && gridRows
      ? { cols: gridCols, rows: gridRows }
      : calculateGridDimensions(items.length)

    console.log(`[stock-assets] Generating ${items.length} assets in ${cols}x${rows} grid`)

    // Step 2: Build prompt and generate grid image
    const prompt = buildGridPrompt(items, style, cols, rows)
    const gridWidth = cols * 512
    const gridHeight = rows * 512

    const gridBuffer = await generateGridImage(prompt, gridWidth, gridHeight, model)
    console.log(`[stock-assets] Grid image generated (${gridBuffer.length} bytes)`)

    // Step 3: Crop into individual cells
    const cellBuffers = await cropGridCells(gridBuffer, cols, rows, items.length)
    console.log(`[stock-assets] Cropped ${cellBuffers.length} cells`)

    // Step 4: Process each cell (remove BG, vectorize, upload)
    const assets: Array<Record<string, unknown>> = []
    const supabase = getSupabaseAdmin()

    for (let i = 0; i < cellBuffers.length; i++) {
      const itemName = items[i]
      const assetId = uuid()

      try {
        console.log(`[stock-assets] Processing cell ${i + 1}/${cellBuffers.length}: "${itemName}"`)

        // Remove white background
        const transparentBuffer = await removeWhiteBackground(cellBuffers[i])

        // Create thumbnail
        const thumbnailBuffer = await createThumbnail(transparentBuffer)

        // Vectorize to SVG
        const svgContent = await vectorizeImage(transparentBuffer)
        const svgBuffer = Buffer.from(svgContent, 'utf-8')

        // Upload all three to Supabase
        const rasterUrl = await uploadToSupabase(
          STOCK_ASSETS_BUCKET,
          `${assetId}.png`,
          transparentBuffer,
          'image/png',
        )

        const vectorUrl = await uploadToSupabase(
          STOCK_ASSETS_BUCKET,
          `${assetId}.svg`,
          svgBuffer,
          'image/svg+xml',
        )

        const thumbnailUrl = await uploadToSupabase(
          STOCK_ASSETS_BUCKET,
          `${assetId}_thumb.png`,
          thumbnailBuffer,
          'image/png',
        )

        const metadata = await sharp(transparentBuffer).metadata()

        const asset = {
          id: assetId,
          name: itemName,
          prompt: itemName,
          category,
          style,
          rasterUrl,
          vectorUrl,
          thumbnailUrl,
          width: metadata.width,
          height: metadata.height,
          cellIndex: i,
          createdAt: Date.now(),
          creatorId: userId,
        }

        // Publish to marketplace if requested
        if (publishToMarketplace && supabase) {
          const { data: listing, error: listErr } = await supabase
            .from('marketplace_listings')
            .insert({
              id: assetId,
              creator_id: userId,
              title: itemName,
              description: `AI-generated ${style} ${category} asset: ${itemName}`,
              category: 'stock-objects',
              asset_url: `${STOCK_ASSETS_BUCKET}/${assetId}.png`,
              thumbnail_url: thumbnailUrl,
              metadata: {
                style,
                assetCategory: category,
                rasterUrl,
                vectorUrl,
                width: metadata.width,
                height: metadata.height,
                prompt: itemName,
                generationModel: model,
              },
            })
            .select('id')
            .single()

          if (!listErr && listing) {
            ;(asset as any).marketplaceListingId = listing.id
          } else if (listErr) {
            console.warn(`[stock-assets] Marketplace publish failed for "${itemName}":`, listErr.message)
          }
        }

        assets.push(asset)
        console.log(`[stock-assets] ✓ Asset "${itemName}" processed and uploaded`)
      } catch (cellErr) {
        console.error(`[stock-assets] Failed to process cell ${i} ("${itemName}"):`, cellErr)
        // Continue with remaining cells
      }
    }

    // Upload the original grid image for reference/debugging
    let gridImageUrl: string | undefined
    try {
      const gridId = uuid()
      gridImageUrl = await uploadToSupabase(
        STOCK_ASSETS_BUCKET,
        `grids/${gridId}.png`,
        gridBuffer,
        'image/png',
      )
    } catch {
      // Non-critical
    }

    res.json({
      assets,
      gridImageUrl,
      cost: 0, // Credit cost tracking handled by frontend
    })
  } catch (err) {
    console.error('[stock-assets] Generate error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

/**
 * GET /api/stock-assets
 *
 * Browse stock assets from the marketplace.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      res.status(503).json({ error: 'Supabase not configured' })
      return
    }

    const category = req.query.category as string | undefined
    const style = req.query.style as string | undefined
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
    const offset = parseInt(req.query.offset as string) || 0

    let query = supabase
      .from('marketplace_listings')
      .select('*')
      .eq('category', 'stock-objects')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category) {
      query = query.eq('metadata->>assetCategory', category)
    }

    if (style) {
      query = query.eq('metadata->>style', style)
    }

    const { data, error } = await query

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    // Transform marketplace listings to stock asset format
    const assets = (data || []).map((listing: any) => ({
      id: listing.id,
      name: listing.title,
      prompt: listing.metadata?.prompt || listing.title,
      category: listing.metadata?.assetCategory || 'objects',
      style: listing.metadata?.style || 'flat',
      rasterUrl: listing.metadata?.rasterUrl || listing.asset_url,
      vectorUrl: listing.metadata?.vectorUrl || '',
      thumbnailUrl: listing.thumbnail_url || '',
      width: listing.metadata?.width || 512,
      height: listing.metadata?.height || 512,
      createdAt: new Date(listing.created_at).getTime(),
      creatorId: listing.creator_id,
      marketplaceListingId: listing.id,
      useCount: listing.use_count || 0,
    }))

    res.json({ assets, total: data?.length || 0 })
  } catch (err) {
    console.error('[stock-assets] Browse error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

/**
 * GET /api/stock-assets/search
 *
 * Search stock assets by text query.
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      res.status(503).json({ error: 'Supabase not configured' })
      return
    }

    const q = (req.query.q as string || '').trim()
    if (!q) {
      res.status(400).json({ error: 'Search query (q) is required' })
      return
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)

    // Search by title (ilike) — marketplace_listings already has index on category
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('category', 'stock-objects')
      .ilike('title', `%${q}%`)
      .order('use_count', { ascending: false })
      .limit(limit)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    const assets = (data || []).map((listing: any) => ({
      id: listing.id,
      name: listing.title,
      prompt: listing.metadata?.prompt || listing.title,
      category: listing.metadata?.assetCategory || 'objects',
      style: listing.metadata?.style || 'flat',
      rasterUrl: listing.metadata?.rasterUrl || listing.asset_url,
      vectorUrl: listing.metadata?.vectorUrl || '',
      thumbnailUrl: listing.thumbnail_url || '',
      width: listing.metadata?.width || 512,
      height: listing.metadata?.height || 512,
      createdAt: new Date(listing.created_at).getTime(),
      creatorId: listing.creator_id,
      marketplaceListingId: listing.id,
      useCount: listing.use_count || 0,
    }))

    res.json({ assets })
  } catch (err) {
    console.error('[stock-assets] Search error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

/**
 * DELETE /api/stock-assets/:id
 *
 * Delete a stock asset (and its marketplace listing).
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      res.status(503).json({ error: 'Supabase not configured' })
      return
    }

    const { id } = req.params
    const userId = (req as any).userId as string

    // Verify ownership via marketplace listing
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (!listing || listing.creator_id !== userId) {
      res.status(403).json({ error: 'Not authorized to delete this asset' })
      return
    }

    // Delete storage files
    await supabase.storage.from(STOCK_ASSETS_BUCKET).remove([
      `${id}.png`,
      `${id}.svg`,
      `${id}_thumb.png`,
    ])

    // Delete marketplace listing
    await supabase
      .from('marketplace_listings')
      .delete()
      .eq('id', id)

    res.json({ success: true })
  } catch (err) {
    console.error('[stock-assets] Delete error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

export default router
