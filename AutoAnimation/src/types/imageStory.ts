export type ImageStoryStyle =
  | 'Cartoon'
  | 'Realistic'
  | 'Minimalist'
  | 'Watercolor'
  | 'Flat'
  | '3D Render'

export type WordRole = 'image_noun' | 'action_verb' | 'filler'

export interface ImageStoryWord {
  text: string
  role: WordRole
  searchTerm?: string
  assetType?: 'photo' | 'png' | 'illustration' | 'vector'
  linkedNoun?: string
  animation?: string
}

export interface ImageStoryScene {
  id: string
  background: {
    searchTerm: string
    assetType: 'photo' | 'illustration'
  }
  words: ImageStoryWord[]
  elements: string[]
  transition: 'crossfade' | 'slide' | 'cut' | 'zoom'
}

export interface ImageStoryPlan {
  mode: 'imageStory'
  style: ImageStoryStyle
  scenes: ImageStoryScene[]
  ttsText: string
}

export interface ImageStoryWordTiming {
  word: ImageStoryWord
  startMs: number
  endMs: number
  startFrame: number
  endFrame: number
}

export interface FreepikSearchRequest {
  query: string
  assetType: 'photo' | 'png' | 'illustration' | 'vector'
  style?: ImageStoryStyle
  limit?: number
  transparency?: boolean
}

export interface FreepikAsset {
  id: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  format: 'jpg' | 'png' | 'svg' | 'psd'
  relevanceScore: number
}

export interface CanvasRegion {
  zone: 'background' | 'center' | 'left' | 'right' | 'top' | 'bottom'
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

/**
 * Shared layout utility for noun image positioning.
 * Used by composeImageStoryScenes, RemotionImageStoryLayer, and PixiImageStoryLayer.
 */
export function computeRegion(
  index: number,
  total: number,
  canvasWidth: number,
  canvasHeight: number,
): CanvasRegion {
  if (index === 0 && total === 1) {
    const w = canvasWidth * 0.5
    const h = canvasHeight * 0.5
    return { zone: 'center', x: (canvasWidth - w) / 2, y: (canvasHeight - h) / 2, width: w, height: h, zIndex: 1 }
  }
  if (index === 0) {
    const w = canvasWidth * 0.4
    const h = canvasHeight * 0.45
    return { zone: 'left', x: canvasWidth * 0.05, y: (canvasHeight - h) / 2, width: w, height: h, zIndex: 1 }
  }
  if (index === 1) {
    const w = canvasWidth * 0.4
    const h = canvasHeight * 0.45
    return { zone: 'right', x: canvasWidth * 0.55, y: (canvasHeight - h) / 2, width: w, height: h, zIndex: 2 }
  }
  const w = canvasWidth * 0.3
  const h = canvasHeight * 0.35
  return { zone: 'center', x: (canvasWidth - w) / 2, y: canvasHeight * 0.1, width: w, height: h, zIndex: 3 }
}
