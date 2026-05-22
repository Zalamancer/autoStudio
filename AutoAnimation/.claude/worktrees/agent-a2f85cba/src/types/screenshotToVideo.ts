// ── Screenshot-to-Video Types ──

export interface ScreenshotAsset {
  id: string
  /** Original file name */
  name: string
  /** Blob URL for display */
  url: string
  /** Base64 data URL for AI analysis */
  dataUrl: string
  /** Original image dimensions */
  width: number
  height: number
  /** Order in the sequence */
  order: number
}

export interface ScreenshotAnnotation {
  /** What area/element this annotation refers to */
  region: string
  /** Descriptive text about the region */
  description: string
  /** Bounding box as percentage of image (0-100) */
  bbox: { x: number; y: number; width: number; height: number }
}

export interface ScreenshotAnalysis {
  /** Overall description of the screenshot */
  description: string
  /** Type of content detected */
  contentType: 'website' | 'app' | 'dashboard' | 'diagram' | 'presentation' | 'other'
  /** Key regions identified for narration */
  annotations: ScreenshotAnnotation[]
  /** Generated narration script */
  narrationScript: string
  /** Suggested transitions between this and the next screenshot */
  suggestedTransition: 'fade' | 'slide-left' | 'zoom-in' | 'ken-burns'
  /** Suggested duration in seconds for this screenshot */
  suggestedDuration: number
}

export interface ScreenshotToVideoConfig {
  /** All uploaded screenshots in order */
  screenshots: ScreenshotAsset[]
  /** AI analysis results per screenshot */
  analyses: Map<string, ScreenshotAnalysis>
  /** Voice for narration */
  voiceId: string
  /** Narration style */
  narrationStyle: 'professional' | 'casual' | 'tutorial' | 'energetic'
  /** Whether to show highlight boxes around regions */
  showHighlights: boolean
  /** Highlight box color */
  highlightColor: string
  /** Whether to show animated pointer/cursor */
  showPointer: boolean
  /** Target aspect ratio */
  aspectRatio: '16:9' | '9:16' | '1:1'
  /** Seconds per screenshot (0 = auto) */
  secondsPerScreenshot: number
}

export const DEFAULT_S2V_CONFIG: Omit<ScreenshotToVideoConfig, 'screenshots' | 'analyses'> = {
  voiceId: '',
  narrationStyle: 'professional',
  showHighlights: true,
  highlightColor: '#3b82f6',
  showPointer: true,
  aspectRatio: '16:9',
  secondsPerScreenshot: 0,
}
