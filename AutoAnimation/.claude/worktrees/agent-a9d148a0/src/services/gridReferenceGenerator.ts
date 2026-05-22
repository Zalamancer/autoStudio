/**
 * Grid Reference Generator — creates empty grid template images for NB2 pipeline.
 *
 * Sends blank grids (white paper with gridlines) as references so the AI
 * knows the exact layout/cell structure to fill. Does NOT tile images —
 * tiling heads caused the AI to include them in output.
 *
 * Also includes post-processing utilities:
 * - removeGridLines: erases grid lines from AI output by blending neighbor pixels
 * - removeChromaKey: strips green/blue screen background to transparent
 */

/**
 * Compute grid reference dimensions that match the Gemini output aspect ratio.
 * The entire grid image will have the same AR as the generated image.
 *
 * @param aspectRatio - e.g. '1:1', '16:9', '9:16' (the AR requested from Gemini)
 * @param baseSize - base pixel size for the longer side (default 1024)
 * @returns [width, height]
 */
export function gridRefDimensionsForAR(
  aspectRatio: string = '1:1',
  baseSize = 1024,
): [number, number] {
  const [arW, arH] = aspectRatio.split(':').map(Number)
  const ratio = (arW || 1) / (arH || 1)
  if (ratio >= 1) {
    return [baseSize, Math.round(baseSize / ratio)]
  }
  return [Math.round(baseSize * ratio), baseSize]
}

/**
 * Create an empty grid reference image (white background + gridlines).
 *
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @param width - Total canvas width in pixels
 * @param height - Total canvas height in pixels
 * @param rowRatios - Optional proportional row heights (e.g. [0.4, 0.5, 0.1] for clothing).
 *                    Must have exactly `rows` entries summing to ~1.0.
 * @returns data URL (image/png) of the empty grid
 */
export function createEmptyGridReference(
  cols: number,
  rows: number,
  width: number,
  height: number,
  rowRatios?: readonly number[],
  colLabels?: readonly string[],
  rowLabels?: readonly string[],
): string {
  // Add margin for labels if provided
  const topMargin = colLabels ? 32 : 0
  const leftMargin = rowLabels ? 80 : 0

  const canvas = document.createElement('canvas')
  canvas.width = width + leftMargin
  canvas.height = height + topMargin
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context for grid reference')

  // Fill white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const cellW = width / cols

  // Draw column labels above grid
  if (colLabels) {
    ctx.fillStyle = '#555555'
    ctx.font = `bold ${Math.min(14, Math.floor(cellW / 5))}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let col = 0; col < cols && col < colLabels.length; col++) {
      const x = leftMargin + col * cellW + cellW / 2
      ctx.fillText(colLabels[col], x, topMargin / 2)
    }
  }

  // Compute row Y positions and heights for row label placement
  const rowYStarts: number[] = []
  const rowHeights: number[] = []
  if (rowRatios && rowRatios.length === rows) {
    let y = 0
    for (let row = 0; row < rows; row++) {
      rowYStarts.push(y)
      const h = height * rowRatios[row]
      rowHeights.push(h)
      y += h
    }
  } else {
    const cellH = height / rows
    for (let row = 0; row < rows; row++) {
      rowYStarts.push(row * cellH)
      rowHeights.push(cellH)
    }
  }

  // Draw row labels to the left of grid
  if (rowLabels) {
    ctx.fillStyle = '#555555'
    ctx.font = `bold ${Math.min(13, Math.floor(leftMargin / 5))}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let row = 0; row < rows && row < rowLabels.length; row++) {
      const y = topMargin + rowYStarts[row] + rowHeights[row] / 2
      ctx.fillText(rowLabels[row], leftMargin / 2, y)
    }
  }

  // Draw grid lines
  ctx.strokeStyle = 'rgba(180, 180, 180, 0.8)'
  ctx.lineWidth = 2

  // Vertical lines
  for (let col = 1; col < cols; col++) {
    const x = leftMargin + col * cellW
    ctx.beginPath()
    ctx.moveTo(x, topMargin)
    ctx.lineTo(x, topMargin + height)
    ctx.stroke()
  }

  // Horizontal lines
  for (let row = 1; row < rows; row++) {
    const y = topMargin + rowYStarts[row]
    ctx.beginPath()
    ctx.moveTo(leftMargin, y)
    ctx.lineTo(leftMargin + width, y)
    ctx.stroke()
  }

  // Draw border around grid area
  ctx.strokeRect(leftMargin, topMargin, width, height)

  return canvas.toDataURL('image/png')
}

// ── Post-processing: Grid Line Removal ──────────────────────────────

/**
 * Remove grid lines from a generated grid image by blending neighbor pixels.
 *
 * Gemini often renders visible grid lines/borders despite being told not to.
 * This function detects line-like features at expected grid positions and
 * replaces them with interpolated content from neighboring pixels.
 *
 * @param dataUrl - The generated image data URL
 * @param cols - Number of grid columns
 * @param rows - Number of grid rows
 * @param rowRatios - Optional proportional row heights (for clothing grids)
 * @param bandWidth - Half-width of the removal band in pixels (default 3)
 * @returns Promise<string> cleaned image data URL
 */
export function removeGridLines(
  dataUrl: string,
  cols: number,
  rows: number,
  rowRatios?: readonly number[],
  bandWidth = 3,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.width
      const h = img.height
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context failed')); return }

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data

      const cellW = w / cols

      // Compute horizontal line Y positions
      const lineYs: number[] = []
      if (rowRatios && rowRatios.length === rows) {
        let y = 0
        for (let r = 0; r < rows - 1; r++) {
          y += h * rowRatios[r]
          lineYs.push(Math.round(y))
        }
      } else {
        const cellH = h / rows
        for (let r = 1; r < rows; r++) {
          lineYs.push(Math.round(r * cellH))
        }
      }

      // Compute vertical line X positions
      const lineXs: number[] = []
      for (let c = 1; c < cols; c++) {
        lineXs.push(Math.round(c * cellW))
      }

      // Helper: blend a pixel from its left/right (or top/bottom) neighbors
      const idx = (x: number, y: number) => (y * w + x) * 4

      // Remove vertical lines: for each line X, blend from left/right neighbors
      for (const lx of lineXs) {
        const x0 = Math.max(0, lx - bandWidth)
        const x1 = Math.min(w - 1, lx + bandWidth)
        const srcLeft = Math.max(0, x0 - 1)
        const srcRight = Math.min(w - 1, x1 + 1)

        for (let y = 0; y < h; y++) {
          const li = idx(srcLeft, y)
          const ri = idx(srcRight, y)
          const totalSpan = x1 - x0 + 1

          for (let x = x0; x <= x1; x++) {
            const t = totalSpan > 1 ? (x - x0) / (totalSpan - 1) : 0.5
            const pi = idx(x, y)
            data[pi] = Math.round(data[li] * (1 - t) + data[ri] * t)
            data[pi + 1] = Math.round(data[li + 1] * (1 - t) + data[ri + 1] * t)
            data[pi + 2] = Math.round(data[li + 2] * (1 - t) + data[ri + 2] * t)
            // Keep alpha unchanged
          }
        }
      }

      // Remove horizontal lines: for each line Y, blend from top/bottom neighbors
      for (const ly of lineYs) {
        const y0 = Math.max(0, ly - bandWidth)
        const y1 = Math.min(h - 1, ly + bandWidth)
        const srcTop = Math.max(0, y0 - 1)
        const srcBot = Math.min(h - 1, y1 + 1)

        for (let x = 0; x < w; x++) {
          const ti = idx(x, srcTop)
          const bi = idx(x, srcBot)
          const totalSpan = y1 - y0 + 1

          for (let y = y0; y <= y1; y++) {
            const t = totalSpan > 1 ? (y - y0) / (totalSpan - 1) : 0.5
            const pi = idx(x, y)
            data[pi] = Math.round(data[ti] * (1 - t) + data[bi] * t)
            data[pi + 1] = Math.round(data[ti + 1] * (1 - t) + data[bi + 1] * t)
            data[pi + 2] = Math.round(data[ti + 2] * (1 - t) + data[bi + 2] * t)
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image for grid line removal'))
    img.src = dataUrl
  })
}

// ── Post-processing: Chroma Key Removal ─────────────────────────────

/**
 * Detect whether green or blue chroma key is dominant in an image's background,
 * then remove it to transparent. Works for both #00FF00 green screen and
 * #0000FF blue screen backgrounds.
 *
 * @param dataUrl - The generated image data URL
 * @param tolerance - Color distance tolerance for chroma key detection (default 80)
 * @returns Promise<string> image with chroma key replaced by transparency
 */
export function removeChromaKey(
  dataUrl: string,
  tolerance = 80,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.width
      const h = img.height
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas context failed')); return }

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, w, h)
      const data = imageData.data

      // Sample corners + edges to detect which chroma key color is used
      let greenCount = 0
      let blueCount = 0
      const samplePoints = [
        [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],  // corners
        [Math.floor(w / 2), 0], [Math.floor(w / 2), h - 1],  // top/bottom center
        [0, Math.floor(h / 2)], [w - 1, Math.floor(h / 2)],  // left/right center
      ]

      for (const [sx, sy] of samplePoints) {
        const i = (sy * w + sx) * 4
        const r = data[i], g = data[i + 1], b = data[i + 2]
        // Check if pixel is green-ish (high G, low R and B)
        if (g > 150 && g > r * 1.5 && g > b * 1.5) greenCount++
        // Check if pixel is blue-ish (high B, low R and G)
        if (b > 150 && b > r * 1.5 && b > g * 1.5) blueCount++
      }

      if (greenCount === 0 && blueCount === 0) {
        // No chroma key detected — return original
        resolve(dataUrl)
        return
      }

      const isGreen = greenCount >= blueCount

      // Remove chroma key pixels
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]

        if (isGreen) {
          // Green screen: high G relative to R and B
          const greenDominance = g - Math.max(r, b)
          if (greenDominance > 30 && g > 100) {
            // Calculate how "green screen" this pixel is (0-1)
            const strength = Math.min(1, greenDominance / tolerance)
            data[i + 3] = Math.round(data[i + 3] * (1 - strength)) // fade alpha
          }
        } else {
          // Blue screen: high B relative to R and G
          const blueDominance = b - Math.max(r, g)
          if (blueDominance > 30 && b > 100) {
            const strength = Math.min(1, blueDominance / tolerance)
            data[i + 3] = Math.round(data[i + 3] * (1 - strength))
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Failed to load image for chroma key removal'))
    img.src = dataUrl
  })
}
