/**
 * Tiled Renderer for 8K Export
 *
 * Divides large canvases (e.g., 8K = 7680x4320) into smaller tiles that
 * can each be rendered within browser memory limits, then composites
 * them into the final full-resolution frame.
 *
 * Strategy:
 * - Split the target canvas into NxM tiles (each max 4K = 3840x2160)
 * - Render each tile by setting CSS transform + overflow hidden
 * - Draw each tile into the final canvas at its correct offset
 *
 * This avoids the ~132MB single-frame memory allocation that would be
 * required for a single 8K canvas context.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum tile dimension (4K) to stay within GPU/browser limits */
const MAX_TILE_SIZE = 3840

/** Threshold resolution above which tiled rendering activates */
export const TILED_RENDER_THRESHOLD = 3840

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TileGrid {
  cols: number
  rows: number
  tileWidth: number
  tileHeight: number
  totalWidth: number
  totalHeight: number
  tiles: TileSpec[]
}

export interface TileSpec {
  col: number
  row: number
  x: number       // x offset in the full canvas
  y: number       // y offset in the full canvas
  width: number   // tile pixel width
  height: number  // tile pixel height
}

// ---------------------------------------------------------------------------
// Tile grid computation
// ---------------------------------------------------------------------------

/**
 * Compute the tile grid for a given target resolution.
 * Returns a grid spec with tile dimensions and positions.
 */
export function computeTileGrid(totalWidth: number, totalHeight: number): TileGrid {
  const cols = Math.ceil(totalWidth / MAX_TILE_SIZE)
  const rows = Math.ceil(totalHeight / MAX_TILE_SIZE)
  const tileWidth = Math.ceil(totalWidth / cols)
  const tileHeight = Math.ceil(totalHeight / rows)

  const tiles: TileSpec[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * tileWidth
      const y = row * tileHeight
      // Clamp last tile to canvas boundary
      const w = Math.min(tileWidth, totalWidth - x)
      const h = Math.min(tileHeight, totalHeight - y)
      tiles.push({ col, row, x, y, width: w, height: h })
    }
  }

  return { cols, rows, tileWidth, tileHeight, totalWidth, totalHeight, tiles }
}

/**
 * Determine if tiled rendering should be used for the given dimensions.
 */
export function shouldUseTiledRendering(width: number, height: number): boolean {
  return width > TILED_RENDER_THRESHOLD || height > TILED_RENDER_THRESHOLD
}

/**
 * Render a full frame using tiled approach.
 *
 * Takes a render function that draws a tile region onto a provided canvas,
 * and composites all tiles into the final full-resolution output canvas.
 *
 * @param outputCtx - The final full-resolution canvas context
 * @param grid - The tile grid spec
 * @param renderTile - Async function that renders a tile region
 *   It receives (tileCanvas, tileCtx, tile, sourceWidth, sourceHeight)
 *   where sourceWidth/sourceHeight are the original composition dimensions
 */
export async function renderTiledFrame(
  outputCtx: CanvasRenderingContext2D,
  grid: TileGrid,
  renderTile: (
    tileCanvas: HTMLCanvasElement,
    tileCtx: CanvasRenderingContext2D,
    tile: TileSpec,
  ) => Promise<void>,
): Promise<void> {
  // Create a reusable tile canvas
  const tileCanvas = document.createElement('canvas')

  for (const tile of grid.tiles) {
    // Resize tile canvas to this tile's dimensions
    tileCanvas.width = tile.width
    tileCanvas.height = tile.height
    const tileCtx = tileCanvas.getContext('2d')!

    // Clear the tile
    tileCtx.clearRect(0, 0, tile.width, tile.height)

    // Render this tile region
    await renderTile(tileCanvas, tileCtx, tile)

    // Composite tile into the output canvas
    outputCtx.drawImage(tileCanvas, tile.x, tile.y)
  }
}

/**
 * Check if WebCodecs VideoEncoder supports the given 8K resolution.
 * Returns true if hardware or software encoding is available.
 */
export async function check8KEncoderSupport(
  width: number,
  height: number,
  codec: string = 'avc1.640028'
): Promise<{ supported: boolean; hardwareAcceleration: string }> {
  if (typeof VideoEncoder === 'undefined') {
    return { supported: false, hardwareAcceleration: 'no-preference' }
  }

  try {
    // Try hardware acceleration first
    const hwResult = await VideoEncoder.isConfigSupported({
      codec,
      width,
      height,
      bitrate: 50_000_000,
      hardwareAcceleration: 'prefer-hardware',
    })

    if (hwResult.supported) {
      return { supported: true, hardwareAcceleration: 'prefer-hardware' }
    }

    // Fall back to software
    const swResult = await VideoEncoder.isConfigSupported({
      codec,
      width,
      height,
      bitrate: 50_000_000,
      hardwareAcceleration: 'prefer-software',
    })

    return {
      supported: swResult.supported ?? false,
      hardwareAcceleration: 'prefer-software',
    }
  } catch {
    return { supported: false, hardwareAcceleration: 'no-preference' }
  }
}

/**
 * Get recommended export settings for 8K output.
 * Returns adjusted bitrate and encoding parameters.
 */
export function get8KExportSettings(
  width: number,
  height: number,
  fps: number,
  quality: number
): {
  bitrate: number
  keyFrameIntervalFrames: number
  tileGrid: TileGrid | null
} {
  const useTiling = shouldUseTiledRendering(width, height)
  const tileGrid = useTiling ? computeTileGrid(width, height) : null

  // Higher bitrate for 8K to maintain quality
  // 8K needs roughly 4x the bitrate of 4K
  const pixelCount = width * height
  const bitrateMultiplier = 0.15 * quality
  const bitrate = Math.round(pixelCount * fps * bitrateMultiplier)

  // More frequent keyframes for 8K to aid seeking
  const keyFrameIntervalFrames = Math.max(fps, 30)

  return { bitrate, keyFrameIntervalFrames, tileGrid }
}
