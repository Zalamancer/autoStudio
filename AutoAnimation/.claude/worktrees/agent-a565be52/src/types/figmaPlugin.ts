// ── Figma Plugin Integration Types ──

/** A Figma layer mapped to a ProAnimate character part */
export interface FigmaLayerMapping {
  /** Figma node ID */
  nodeId: string
  /** Figma layer name */
  layerName: string
  /** Mapped ProAnimate part type */
  partType: FigmaPartType
  /** Export scale (1x, 2x, 4x) */
  exportScale: number
  /** Whether to export this layer */
  enabled: boolean
}

/** ProAnimate part types that Figma layers can map to */
export type FigmaPartType =
  | 'body'
  | 'head'
  | 'hair'
  | 'viseme-rest'
  | 'viseme-ai'
  | 'viseme-e'
  | 'viseme-o'
  | 'viseme-u'
  | 'viseme-mbp'
  | 'viseme-fv'
  | 'viseme-lth'
  | 'eye'
  | 'eyebrow'
  | 'background'
  | 'overlay'
  | 'svg-object'

/** Result of importing a Figma design */
export interface FigmaImportResult {
  /** Character name derived from the frame */
  characterName: string
  /** Exported part images as data URLs */
  parts: Record<FigmaPartType, string | null>
  /** Original frame dimensions */
  dimensions: { width: number; height: number }
  /** Metadata from the Figma file */
  metadata: {
    fileName: string
    pageName: string
    frameName: string
    exportedAt: string
  }
}

/** Message sent from the Figma plugin to ProAnimate */
export interface FigmaPluginMessage {
  type: 'figma-import'
  payload: FigmaImportResult
}

/** Message sent from ProAnimate to the Figma plugin */
export interface FigmaExportMessage {
  type: 'figma-export'
  payload: {
    /** Animation format */
    format: 'gif' | 'lottie' | 'frames'
    /** Data URL or JSON */
    data: string
    /** Frame count (for sequences) */
    frameCount?: number
  }
}

/** Naming convention patterns for auto-detecting Figma layer types */
export const FIGMA_LAYER_PATTERNS: Record<FigmaPartType, RegExp> = {
  'body': /^(body|torso|trunk)/i,
  'head': /^(head|face)/i,
  'hair': /^(hair|wig)/i,
  'viseme-rest': /^(mouth[-_]?rest|mouth[-_]?closed|viseme[-_]?rest)/i,
  'viseme-ai': /^(mouth[-_]?ai|mouth[-_]?open|viseme[-_]?ai)/i,
  'viseme-e': /^(mouth[-_]?e|mouth[-_]?smile|viseme[-_]?e)/i,
  'viseme-o': /^(mouth[-_]?o|mouth[-_]?round|viseme[-_]?o)/i,
  'viseme-u': /^(mouth[-_]?u|mouth[-_]?pursed|viseme[-_]?u)/i,
  'viseme-mbp': /^(mouth[-_]?mbp|mouth[-_]?closed[-_]?tight|viseme[-_]?mbp)/i,
  'viseme-fv': /^(mouth[-_]?fv|mouth[-_]?bite|viseme[-_]?fv)/i,
  'viseme-lth': /^(mouth[-_]?lth|mouth[-_]?tongue|viseme[-_]?lth)/i,
  'eye': /^(eye|eyes)/i,
  'eyebrow': /^(eyebrow|brow)/i,
  'background': /^(bg|background|backdrop)/i,
  'overlay': /^(overlay|foreground|fg)/i,
  'svg-object': /^(icon|symbol|svg|object)/i,
}

/** Configuration for the Figma plugin */
export interface FigmaPluginConfig {
  /** ProAnimate API endpoint for uploading assets */
  apiEndpoint: string
  /** Authentication token */
  authToken?: string
  /** Default export scale */
  defaultScale: number
  /** Whether to auto-detect layer types from naming convention */
  autoDetectLayers: boolean
}
