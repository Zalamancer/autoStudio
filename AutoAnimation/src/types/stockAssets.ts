// ── Stock Asset Types ──
// AI-generated object assets (raster + vector) stored in Supabase for public marketplace use.

export type StockAssetCategory =
  | 'objects'
  | 'icons'
  | 'backgrounds'
  | 'props'
  | 'ui-elements'
  | 'nature'
  | 'food'
  | 'vehicles'
  | 'buildings'
  | 'characters'
  | 'animals'
  | 'misc'

export type StockAssetStyle =
  | 'flat'
  | 'cartoon'
  | 'realistic'
  | 'pixel-art'
  | 'watercolor'
  | 'line-art'
  | 'isometric'
  | '3d-render'
  | 'hand-drawn'
  | 'minimalist'

/** A single generated stock asset with both raster and vector formats */
export interface StockAsset {
  id: string
  name: string
  prompt: string
  category: StockAssetCategory
  style: StockAssetStyle
  /** Public URL to transparent PNG in Supabase */
  rasterUrl: string
  /** Public URL to traced SVG in Supabase */
  vectorUrl: string
  /** Small thumbnail PNG URL */
  thumbnailUrl: string
  width: number
  height: number
  /** Original grid cell index (0-based) for batch generations */
  cellIndex?: number
  createdAt: number
  creatorId?: string
  /** If published to marketplace */
  marketplaceListingId?: string
}

/** Request to generate a batch of stock assets */
export interface StockAssetGenerateRequest {
  /** Category of objects to generate */
  category: StockAssetCategory
  /** Visual style */
  style: StockAssetStyle
  /** List of object descriptions to generate */
  items: string[]
  /** Grid layout: cols x rows (default: auto-calculated from items.length) */
  gridCols?: number
  gridRows?: number
  /** Image generation model (default: fal-ai/flux/schnell) */
  model?: string
  /** Whether to publish to marketplace immediately */
  publishToMarketplace?: boolean
}

/** Server response for asset generation */
export interface StockAssetGenerateResponse {
  /** Generated assets */
  assets: StockAsset[]
  /** Grid image URL before cropping (for debugging) */
  gridImageUrl?: string
  /** Total cost in USD */
  cost: number
}

/** Progress updates during generation */
export interface StockAssetProgress {
  step: 'generating' | 'cropping' | 'removing-bg' | 'vectorizing' | 'uploading' | 'publishing'
  current: number
  total: number
  message: string
}

/** ClipPlan stock asset specification (used by orchestrator) */
export interface ClipPlanStockAsset {
  /** Description of the object (e.g. "gold coin", "wooden crate") */
  prompt: string
  /** Role in the scene */
  role: 'prop' | 'decoration' | 'foreground' | 'overlay'
  /** 0-1 fraction of total clip duration */
  startPercent: number
  endPercent: number
  /** Position as % of canvas (0-100) */
  position: { x: number; y: number }
  /** Scale factor (1 = 100%) */
  scale?: number
  /** Keyframe animation */
  keyframes?: Array<{
    time: number
    x?: number
    y?: number
    scale?: number
    opacity?: number
    rotation?: number
  }>
  /** Preferred style */
  style?: StockAssetStyle
  /** Whether to use vector (SVG) or raster (PNG). Default: 'raster' */
  format?: 'raster' | 'vector'
}
