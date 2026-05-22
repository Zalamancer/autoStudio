/**
 * Figma Plugin Import Service
 *
 * Receives exported data from the Figma plugin and converts it into
 * ProAnimate character sprites, backgrounds, or SVG objects.
 * Handles the ProAnimate side of the Figma plugin bridge.
 */

import type {
  FigmaImportResult,
  FigmaPartType,
  FigmaLayerMapping,
  FigmaPluginMessage,
  FIGMA_LAYER_PATTERNS as _FigmaPatterns,
} from '@/types/figmaPlugin'
import { FIGMA_LAYER_PATTERNS } from '@/types/figmaPlugin'

/** Detect the ProAnimate part type from a Figma layer name */
export function detectPartType(layerName: string): FigmaPartType | null {
  for (const [partType, pattern] of Object.entries(FIGMA_LAYER_PATTERNS)) {
    if (pattern.test(layerName)) {
      return partType as FigmaPartType
    }
  }
  return null
}

/** Auto-map Figma layers to ProAnimate parts based on naming conventions */
export function autoMapLayers(
  layers: Array<{ nodeId: string; name: string }>,
): FigmaLayerMapping[] {
  return layers.map((layer) => {
    const detectedType = detectPartType(layer.name)
    return {
      nodeId: layer.nodeId,
      layerName: layer.name,
      partType: detectedType || 'svg-object',
      exportScale: 2,
      enabled: true,
    }
  })
}

/** Convert a Figma import result into ProAnimate character config data */
export function convertToCharacterConfig(result: FigmaImportResult): {
  name: string
  savedImages: Record<string, string[]>
  dimensions: { width: number; height: number }
} {
  const savedImages: Record<string, string[]> = {
    body: [],
    head: [],
    viseme: [],
    eye: [],
    eyebrow: [],
    hair: [],
    shirt: [],
    pants: [],
    shoes: [],
  }

  // Map Figma parts to character sprite arrays
  if (result.parts.body) savedImages.body.push(result.parts.body)
  if (result.parts.head) savedImages.head.push(result.parts.head)
  if (result.parts.hair) savedImages.hair.push(result.parts.hair)
  if (result.parts.eye) savedImages.eye.push(result.parts.eye)
  if (result.parts.eyebrow) savedImages.eyebrow.push(result.parts.eyebrow)

  // Map viseme parts into the viseme array (ordered by type)
  const visemeOrder: FigmaPartType[] = [
    'viseme-rest', 'viseme-ai', 'viseme-e', 'viseme-o',
    'viseme-u', 'viseme-mbp', 'viseme-fv', 'viseme-lth',
  ]

  for (const visemeType of visemeOrder) {
    const sprite = result.parts[visemeType]
    savedImages.viseme.push(sprite || '')
  }

  return {
    name: result.characterName,
    savedImages,
    dimensions: result.dimensions,
  }
}

/** Convert a Figma import result into SVG object data */
export function convertToSVGObjects(result: FigmaImportResult): Array<{
  name: string
  imageDataUrl: string
}> {
  const objects: Array<{ name: string; imageDataUrl: string }> = []

  if (result.parts['svg-object']) {
    objects.push({
      name: `${result.characterName} - SVG Object`,
      imageDataUrl: result.parts['svg-object'],
    })
  }

  if (result.parts.overlay) {
    objects.push({
      name: `${result.characterName} - Overlay`,
      imageDataUrl: result.parts.overlay,
    })
  }

  return objects
}

/**
 * Listen for messages from the Figma plugin iframe.
 * Returns a cleanup function to remove the listener.
 */
export function listenForFigmaMessages(
  onImport: (result: FigmaImportResult) => void,
): () => void {
  const handler = (event: MessageEvent) => {
    // Validate the message origin and type
    if (!event.data || typeof event.data !== 'object') return

    const msg = event.data as FigmaPluginMessage
    if (msg.type === 'figma-import' && msg.payload) {
      onImport(msg.payload)
    }
  }

  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}

/**
 * Send an export message to the Figma plugin iframe.
 */
export function sendToFigmaPlugin(
  iframeRef: HTMLIFrameElement | null,
  format: 'gif' | 'lottie' | 'frames',
  data: string,
  frameCount?: number,
): void {
  if (!iframeRef?.contentWindow) {
    console.warn('[FigmaImporter] No Figma plugin iframe found')
    return
  }

  iframeRef.contentWindow.postMessage(
    {
      type: 'figma-export',
      payload: { format, data, frameCount },
    },
    '*',
  )
}

/**
 * Generate a Figma plugin manifest configuration.
 * This is used by the companion Figma plugin code.
 */
export function generatePluginManifest(apiEndpoint: string): Record<string, unknown> {
  return {
    name: 'ProAnimate',
    id: 'com.proanimate.figma-plugin',
    api: '1.0.0',
    main: 'code.js',
    ui: 'ui.html',
    editorType: ['figma'],
    networkAccess: {
      allowedDomains: [new URL(apiEndpoint).hostname],
    },
    capabilities: ['exportAsync', 'currentSelection'],
  }
}
