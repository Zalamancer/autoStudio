/**
 * NB2 Quality Validation
 *
 * Post-generation quality checks for character parts.
 * Catches common AI generation failures:
 * - Mostly transparent images (generation missed the content)
 * - Too small images (content rendered at tiny scale)
 * - Mostly single-color images (chroma key wasn't removed or content is blank)
 * - Grid images with empty cells
 */

export interface QualityCheckResult {
  passed: boolean
  issue?: string
  /** Severity: 'warning' = usable but suboptimal, 'error' = should retry */
  severity?: 'warning' | 'error'
  /** Metrics collected during validation */
  metrics?: {
    transparentRatio: number
    contentRatio: number
    width: number
    height: number
    dominantColorRatio: number
  }
}

/**
 * Validate a generated single image (body, head, concept).
 * Checks that the image has meaningful content and isn't mostly empty.
 */
export async function validateSingleImage(
  dataUrl: string,
  partType: string,
): Promise<QualityCheckResult> {
  try {
    const { width, height, transparentRatio, dominantColorRatio } = await analyzeImage(dataUrl)

    // Check minimum dimensions
    if (width < 64 || height < 64) {
      return {
        passed: false,
        issue: `${partType} image too small (${width}x${height}px). Minimum 64x64px required.`,
        severity: 'error',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    // For post-chroma-key images, high transparency is expected (character on transparent bg)
    // But if >95% transparent, the content is likely missing
    if (transparentRatio > 0.95) {
      return {
        passed: false,
        issue: `${partType} image is ${Math.round(transparentRatio * 100)}% transparent — content appears to be missing.`,
        severity: 'error',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    // If <5% transparent, chroma key removal likely failed (image still has solid background)
    if (transparentRatio < 0.05 && partType !== 'concept') {
      return {
        passed: true,
        issue: `${partType} image has very little transparency (${Math.round(transparentRatio * 100)}%) — chroma key removal may have failed.`,
        severity: 'warning',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    // Check if one color dominates too much (excluding transparency)
    if (dominantColorRatio > 0.8 && transparentRatio < 0.5) {
      return {
        passed: true,
        issue: `${partType} image is dominated by a single color (${Math.round(dominantColorRatio * 100)}%) — may indicate low detail or failed generation.`,
        severity: 'warning',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    return {
      passed: true,
      metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
    }
  } catch {
    // If analysis fails, don't block — pass through
    return { passed: true, issue: `Could not validate ${partType} image` }
  }
}

/**
 * Validate a generated grid image (hair, visemes, eyes, eyebrows, clothing).
 * Checks overall image quality and samples individual cells for emptiness.
 */
export async function validateGridImage(
  dataUrl: string,
  partType: string,
  cols: number,
  rows: number,
): Promise<QualityCheckResult> {
  try {
    const { width, height, transparentRatio, dominantColorRatio } = await analyzeImage(dataUrl)

    // Check minimum dimensions for grid (should be larger than single images)
    const minDim = Math.max(cols, rows) * 48
    if (width < minDim || height < minDim) {
      return {
        passed: false,
        issue: `${partType} grid too small (${width}x${height}px). Expected at least ${minDim}x${minDim}px for a ${cols}x${rows} grid.`,
        severity: 'error',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    // For grids, high transparency is normal (each cell has transparent bg after chroma removal)
    // But >98% means almost no content
    if (transparentRatio > 0.98) {
      return {
        passed: false,
        issue: `${partType} grid is ${Math.round(transparentRatio * 100)}% transparent — cells appear empty.`,
        severity: 'error',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    // Check for empty cells by sampling
    const emptyCells = await countEmptyCells(dataUrl, cols, rows)
    const totalCells = cols * rows
    const emptyRatio = emptyCells / totalCells

    if (emptyRatio > 0.5) {
      return {
        passed: false,
        issue: `${partType} grid has ${emptyCells}/${totalCells} empty cells (${Math.round(emptyRatio * 100)}%).`,
        severity: 'error',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    if (emptyRatio > 0.2) {
      return {
        passed: true,
        issue: `${partType} grid has ${emptyCells}/${totalCells} empty cells.`,
        severity: 'warning',
        metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
      }
    }

    return {
      passed: true,
      metrics: { transparentRatio, contentRatio: 1 - transparentRatio, width, height, dominantColorRatio },
    }
  } catch {
    return { passed: true, issue: `Could not validate ${partType} grid` }
  }
}

// ── Internal Helpers ──────────────────────────────────────────────────

interface ImageAnalysis {
  width: number
  height: number
  transparentRatio: number
  dominantColorRatio: number
}

function analyzeImage(dataUrl: string): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      const pixels = imageData.data
      const totalPixels = img.width * img.height

      let transparentPixels = 0
      const colorBuckets: Record<string, number> = {}

      // Sample every 4th pixel for performance on large images
      const step = totalPixels > 250000 ? 4 : 1

      let sampledPixels = 0
      let sampledTransparent = 0

      for (let i = 0; i < totalPixels; i += step) {
        const offset = i * 4
        const a = pixels[offset + 3]
        sampledPixels++

        if (a < 30) {
          sampledTransparent++
        } else {
          // Bucket colors into 32-value bins for dominant color detection
          const r = (pixels[offset] >> 5) << 5
          const g = (pixels[offset + 1] >> 5) << 5
          const b = (pixels[offset + 2] >> 5) << 5
          const key = `${r},${g},${b}`
          colorBuckets[key] = (colorBuckets[key] || 0) + 1
        }
      }

      transparentPixels = sampledTransparent
      const opaquePixels = sampledPixels - transparentPixels
      const transparentRatio = sampledPixels > 0 ? transparentPixels / sampledPixels : 0

      // Find dominant non-transparent color
      let maxCount = 0
      for (const count of Object.values(colorBuckets)) {
        if (count > maxCount) maxCount = count
      }
      const dominantColorRatio = opaquePixels > 0 ? maxCount / opaquePixels : 0

      resolve({
        width: img.width,
        height: img.height,
        transparentRatio,
        dominantColorRatio,
      })
    }
    img.onerror = () => reject(new Error('Failed to load image for analysis'))
    img.src = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`
  })
}

/**
 * Count how many cells in a grid image are mostly empty (>90% transparent).
 */
function countEmptyCells(dataUrl: string, cols: number, rows: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cellW = Math.floor(img.width / cols)
      const cellH = Math.floor(img.height / rows)

      const canvas = document.createElement('canvas')
      canvas.width = cellW
      canvas.height = cellH
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }

      let emptyCount = 0
      const cellPixels = cellW * cellH

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.clearRect(0, 0, cellW, cellH)
          ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH)

          const data = ctx.getImageData(0, 0, cellW, cellH).data
          let transparent = 0

          // Sample every 3rd pixel for speed
          for (let i = 0; i < cellPixels; i += 3) {
            if (data[i * 4 + 3] < 30) transparent++
          }

          const sampledCount = Math.ceil(cellPixels / 3)
          if (transparent / sampledCount > 0.9) {
            emptyCount++
          }
        }
      }

      resolve(emptyCount)
    }
    img.onerror = () => reject(new Error('Failed to load grid for cell analysis'))
    img.src = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`
  })
}
