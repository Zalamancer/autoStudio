/**
 * Type definitions for PixelLab pixel art character system ("1D" characters).
 * Based on PixelLab REST API v1 endpoints:
 *   POST /generate-image-pixflux
 *   POST /generate-image-bitforge
 *   POST /animate-with-text
 *   POST /animate-with-skeleton
 *   POST /rotate
 *   POST /inpaint
 *   POST /estimate-skeleton
 *   GET  /balance
 */

// ─── Style Enums ────────────────────────────────────────────────────────────

export type PixelArtOutline =
  | 'single color black outline'
  | 'single color outline'
  | 'selective outline'
  | 'lineless'

export type PixelArtShading =
  | 'flat shading'
  | 'basic shading'
  | 'medium shading'
  | 'detailed shading'
  | 'highly detailed shading'

export type PixelArtDetail = 'low detail' | 'medium detail' | 'highly detailed'

export type PixelArtView = 'low top-down' | 'high top-down' | 'side'

export type PixelArtDirection =
  | 'south'
  | 'south-west'
  | 'west'
  | 'north-west'
  | 'north'
  | 'north-east'
  | 'east'
  | 'south-east'

// ─── Shared API Types ───────────────────────────────────────────────────────

export interface Base64Image {
  type: 'base64'
  base64: string
}

export interface ImageSize {
  width: number
  height: number
}

export interface UsageInfo {
  type: 'usd'
  usd: number
}

export interface SkeletonKeypoint {
  x: number
  y: number
  label: string
  z_index?: number
}

// ─── Generate Image (Pixflux) ───────────────────────────────────────────────

export interface PixfluxRequest {
  description: string
  image_size: ImageSize
  negative_description?: string
  text_guidance_scale?: number
  outline?: PixelArtOutline
  shading?: PixelArtShading
  detail?: PixelArtDetail
  view?: PixelArtView
  direction?: PixelArtDirection
  isometric?: boolean
  no_background?: boolean
  init_image?: Base64Image
  init_image_strength?: number
  color_image?: Base64Image
  seed?: number
}

export interface PixfluxResponse {
  usage: UsageInfo
  image: Base64Image
}

// ─── Generate Image (Bitforge) ──────────────────────────────────────────────

export interface BitforgeRequest {
  description: string
  image_size: ImageSize
  negative_description?: string
  text_guidance_scale?: number
  style_strength?: number
  outline?: PixelArtOutline
  shading?: PixelArtShading
  detail?: PixelArtDetail
  view?: PixelArtView
  direction?: PixelArtDirection
  isometric?: boolean
  no_background?: boolean
  coverage_percentage?: number
  init_image?: Base64Image
  init_image_strength?: number
  style_image?: Base64Image
  inpainting_image?: Base64Image
  mask_image?: Base64Image
  color_image?: Base64Image
  seed?: number
}

export interface BitforgeResponse {
  usage: UsageInfo
  image: Base64Image
}

// ─── Animate with Text ──────────────────────────────────────────────────────

export interface AnimateTextRequest {
  image_size: ImageSize
  description: string
  action: string
  reference_image: Base64Image
  negative_description?: string
  text_guidance_scale?: number
  image_guidance_scale?: number
  n_frames?: number
  start_frame_index?: number
  view?: PixelArtView
  direction?: PixelArtDirection
  init_images?: (Base64Image | null)[]
  init_image_strength?: number
  color_image?: Base64Image
  seed?: number
}

export interface AnimateTextResponse {
  usage: UsageInfo
  images: Base64Image[]
}

// ─── Animate with Skeleton ──────────────────────────────────────────────────

export interface AnimateSkeletonRequest {
  image_size: ImageSize
  skeleton_keypoints: SkeletonKeypoint[][]
  reference_image: Base64Image
  guidance_scale?: number
  view?: PixelArtView
  direction?: PixelArtDirection
  isometric?: boolean
  init_images?: (Base64Image | null)[]
  init_image_strength?: number
  color_image?: Base64Image
  seed?: number
}

export interface AnimateSkeletonResponse {
  usage: UsageInfo
  images: Base64Image[]
}

// ─── Rotate ─────────────────────────────────────────────────────────────────

export interface RotateRequest {
  image_size: ImageSize
  from_image: Base64Image
  image_guidance_scale?: number
  from_direction?: PixelArtDirection
  to_direction?: PixelArtDirection
  from_view?: PixelArtView
  to_view?: PixelArtView
  view_change?: number
  direction_change?: number
  isometric?: boolean
  init_image?: Base64Image
  init_image_strength?: number
  mask_image?: Base64Image
  color_image?: Base64Image
  seed?: number
}

export interface RotateResponse {
  usage: UsageInfo
  image: Base64Image
}

// ─── Inpaint ────────────────────────────────────────────────────────────────

export interface InpaintRequest {
  description: string
  image_size: ImageSize
  inpainting_image: Base64Image
  mask_image: Base64Image
  negative_description?: string
  text_guidance_scale?: number
  outline?: PixelArtOutline
  shading?: PixelArtShading
  detail?: PixelArtDetail
  view?: PixelArtView
  direction?: PixelArtDirection
  isometric?: boolean
  no_background?: boolean
  init_image?: Base64Image
  init_image_strength?: number
  color_image?: Base64Image
  seed?: number
}

export interface InpaintResponse {
  usage: UsageInfo
  image: Base64Image
}

// ─── Estimate Skeleton ──────────────────────────────────────────────────────

export interface EstimateSkeletonRequest {
  image: Base64Image
}

export interface EstimateSkeletonResponse {
  usage: UsageInfo
  keypoints: SkeletonKeypoint[]
}

// ─── Balance ────────────────────────────────────────────────────────────────

export interface BalanceResponse {
  type: 'usd'
  usd: number
}

// ─── Direction Sets ─────────────────────────────────────────────────────────

export const DIRECTIONS_4: PixelArtDirection[] = ['south', 'west', 'east', 'north']
export const DIRECTIONS_8: PixelArtDirection[] = [
  'south', 'south-west', 'west', 'north-west',
  'north', 'north-east', 'east', 'south-east',
]

// ─── Saved Pixel Art Character (Library) ────────────────────────────────────

export interface SavedPixelArtCharacter {
  id: string
  name: string
  description: string
  /** Pixel size of the generated character */
  size: number
  /** Number of direction views */
  n_directions: 4 | 8
  /** Rendered preview image (data URL) */
  thumbnailDataUrl: string
  /** Direction sprite blob IDs in IndexedDB */
  directionBlobIds: Partial<Record<PixelArtDirection, string>>
  /** Animation frame blob IDs grouped by animation name */
  animationBlobIds: Record<string, { direction: PixelArtDirection; frameBlobIds: string[] }[]>
  /** Style settings used for generation */
  style: {
    outline?: PixelArtOutline
    shading?: PixelArtShading
    detail?: PixelArtDetail
    view?: PixelArtView
  }
  /** Timestamp */
  createdAt: number
}

// ─── Pixel Art Character on Canvas ──────────────────────────────────────────

/** A single animation clip placed on the timeline */
export interface PixelArtAnimationClip {
  id: string
  /** Animation name (key into savedChar.animationBlobIds) */
  animationName: string
  /** Timeline frame where this clip starts */
  startFrame: number
  /** Timeline frame where this clip ends */
  endFrame: number
  /** Playback speed for this clip */
  speed: number
}

export interface PixelArtCharacter {
  id: string
  name: string
  /** Reference to useSavedPixelArtCharactersStore character ID */
  savedPixelArtCharacterId: string
  /** 2D position on canvas */
  position: { x: number; y: number }
  /** Scale multiplier */
  scale: number
  /** Current facing direction */
  direction: PixelArtDirection
  /** Currently playing animation name (null = static) */
  activeAnimation: string | null
  /** Animation playback speed multiplier */
  animationSpeed: number
  /** Timeline frame where the animation starts playing */
  animationStartFrame?: number
  /** Animation clips placed on the timeline */
  animationClips: PixelArtAnimationClip[]
  /** Layer order */
  zIndex: number
  visible: boolean
  locked: boolean
  /** Opacity (0-1) */
  opacity: number
  /** Display color for UI identification */
  color: string
  /** Timeline start frame (inclusive) */
  startFrame?: number
  /** Timeline end frame (exclusive) */
  endFrame?: number
}
