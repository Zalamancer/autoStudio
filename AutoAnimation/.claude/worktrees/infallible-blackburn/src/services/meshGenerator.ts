import type { MeshData, MeshVertex, MeshTriangle } from '@/types/rig'

/**
 * Generate a uniform triangle grid mesh over a rectangular image.
 * Each grid cell is split into two triangles (top-left → bottom-right diagonal).
 * UV coordinates map vertices to the source image (0..1).
 */
export function generateGridMesh(
  imageWidth: number,
  imageHeight: number,
  gridSpacing: number = 16
): MeshData {
  const spacing = Math.max(4, Math.min(gridSpacing, Math.min(imageWidth, imageHeight)))

  const cols = Math.ceil(imageWidth / spacing)
  const rows = Math.ceil(imageHeight / spacing)

  const vertices: MeshVertex[] = []
  const triangles: MeshTriangle[] = []

  // Generate vertex grid (rows+1) x (cols+1)
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const x = Math.min(c * spacing, imageWidth)
      const y = Math.min(r * spacing, imageHeight)
      vertices.push({
        restX: x,
        restY: y,
        u: x / imageWidth,
        v: y / imageHeight,
        deformedX: x,
        deformedY: y,
      })
    }
  }

  // Generate triangles — two per grid cell
  const stride = cols + 1
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = r * stride + c
      const tr = tl + 1
      const bl = (r + 1) * stride + c
      const br = bl + 1

      // Upper-left triangle
      triangles.push({ a: tl, b: tr, c: bl })
      // Lower-right triangle
      triangles.push({ a: tr, b: br, c: bl })
    }
  }

  return { vertices, triangles, imageWidth, imageHeight, gridSpacing: spacing }
}

/**
 * Generate a mesh that skips fully transparent regions.
 * Requires reading pixel alpha from an ImageData object.
 * Only creates triangles where cells actually contain opaque pixels —
 * no expansion padding, so transparent edges don't produce stretching artifacts.
 */
export function generateAlphaAwareMesh(
  imageData: ImageData,
  gridSpacing: number = 16
): MeshData {
  const { width, height, data } = imageData
  const spacing = Math.max(4, Math.min(gridSpacing, Math.min(width, height)))

  const cols = Math.ceil(width / spacing)
  const rows = Math.ceil(height / spacing)

  // Build a map of which grid cells have any opaque pixels
  const cellHasContent: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false)
  )

  for (let r = 0; r < rows; r++) {
    const yStart = r * spacing
    const yEnd = Math.min(yStart + spacing, height)
    for (let c = 0; c < cols; c++) {
      const xStart = c * spacing
      const xEnd = Math.min(xStart + spacing, width)

      outer: for (let y = yStart; y < yEnd; y += 2) {
        for (let x = xStart; x < xEnd; x += 2) {
          const alpha = data[(y * width + x) * 4 + 3]
          if (alpha > 10) {
            cellHasContent[r][c] = true
            break outer
          }
        }
      }
    }
  }

  // No expansion — only mesh cells that actually contain opaque content.
  // This prevents transparent-area triangles from stretching across body parts.

  // Collect unique vertex indices used by active cells
  const stride = cols + 1
  const usedVertexIndices = new Set<number>()
  const activeCells: [number, number][] = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!cellHasContent[r][c]) continue
      activeCells.push([r, c])
      const tl = r * stride + c
      usedVertexIndices.add(tl)
      usedVertexIndices.add(tl + 1)
      usedVertexIndices.add((r + 1) * stride + c)
      usedVertexIndices.add((r + 1) * stride + c + 1)
    }
  }

  // Build vertex array and remap old indices → new indices
  const remap = new Map<number, number>()
  const vertices: MeshVertex[] = []
  for (const oldIdx of Array.from(usedVertexIndices).sort((a, b) => a - b)) {
    const r = Math.floor(oldIdx / stride)
    const c = oldIdx % stride
    const x = Math.min(c * spacing, width)
    const y = Math.min(r * spacing, height)
    remap.set(oldIdx, vertices.length)
    vertices.push({
      restX: x,
      restY: y,
      u: x / width,
      v: y / height,
      deformedX: x,
      deformedY: y,
    })
  }

  // Build triangles using remapped indices
  const triangles: MeshTriangle[] = []
  for (const [r, c] of activeCells) {
    const tl = r * stride + c
    const tr = tl + 1
    const bl = (r + 1) * stride + c
    const br = bl + 1

    triangles.push({ a: remap.get(tl)!, b: remap.get(tr)!, c: remap.get(bl)! })
    triangles.push({ a: remap.get(tr)!, b: remap.get(br)!, c: remap.get(bl)! })
  }

  return { vertices, triangles, imageWidth: width, imageHeight: height, gridSpacing: spacing }
}

/**
 * Load an image URL and extract its ImageData for alpha-aware mesh generation.
 * Returns null if the image fails to load.
 */
export function loadImageData(imageUrl: string): Promise<ImageData | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }
      ctx.drawImage(img, 0, 0)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.onerror = () => resolve(null)
    img.src = imageUrl
  })
}
