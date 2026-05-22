// ── Infinite Canvas & Multi-Artboard Types ──

export interface Artboard {
  id: string
  name: string
  /** Position in world-space (top-left corner) */
  position: { x: number; y: number }
  /** Composition dimensions in pixels */
  width: number
  height: number
  /** Aspect ratio label */
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9' | 'custom'
  /** Background color (hex) */
  backgroundColor: string
  /** FPS for this artboard's composition */
  fps: number
  /** Total duration in frames */
  totalFrames: number
  /** Whether this artboard is visible */
  visible: boolean
  /** Lock artboard from editing */
  locked: boolean
  /** Creation order for z-ordering */
  order: number
}

export interface WorldTransform {
  /** Horizontal pan offset in pixels */
  panX: number
  /** Vertical pan offset in pixels */
  panY: number
  /** Zoom level (1 = 100%) */
  zoom: number
}

export const ARTBOARD_PRESETS: Record<string, { width: number; height: number; aspectRatio: Artboard['aspectRatio'] }> = {
  'Landscape 1080p': { width: 1920, height: 1080, aspectRatio: '16:9' },
  'Portrait 1080p': { width: 1080, height: 1920, aspectRatio: '9:16' },
  'Square 1080': { width: 1080, height: 1080, aspectRatio: '1:1' },
  'Classic 4:3': { width: 1440, height: 1080, aspectRatio: '4:3' },
  'Ultrawide': { width: 2560, height: 1080, aspectRatio: '21:9' },
  'YouTube Thumbnail': { width: 1280, height: 720, aspectRatio: '16:9' },
  'Instagram Story': { width: 1080, height: 1920, aspectRatio: '9:16' },
  'Twitter Post': { width: 1200, height: 675, aspectRatio: '16:9' },
}
