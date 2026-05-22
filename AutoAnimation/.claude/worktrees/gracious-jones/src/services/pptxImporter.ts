/**
 * pptxImporter.ts
 *
 * Maps parsed PPTX data to ProAnimate stores: text overlays, shapes, media, timeline.
 */

import type { PresentationData } from '@/types/pptx'
import type { FontFamily, TextPresetType } from '@/stores/useTextOverlayStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { saveMediaBlob } from '@/services/mediaDB'

// ── Font Mapping ──

const VALID_FONTS: string[] = [
  'Inter', 'Roboto', 'Montserrat', 'Playfair Display', 'Space Mono',
  'Poppins', 'Open Sans', 'Lato', 'Oswald', 'Raleway', 'Merriweather',
  'PT Sans', 'Nunito', 'Ubuntu', 'Bebas Neue', 'Archivo Black',
  'Permanent Marker', 'Pacifico', 'Dancing Script', 'Caveat', 'Bangers',
  'Righteous', 'Abril Fatface', 'Alfa Slab One', 'Fredoka', 'Comfortaa',
]

function mapToValidFont(font: string): FontFamily {
  if (VALID_FONTS.includes(font)) return font as FontFamily
  return 'Inter'
}

// ── Shape Type Mapping ──

function mapShapeType(pptxType: string): 'rectangle' | 'circle' | 'triangle' | 'star' {
  switch (pptxType) {
    case 'ellipse': return 'circle'
    case 'triangle': return 'triangle'
    case 'star': return 'star'
    default: return 'rectangle'
  }
}

// ── Main Importer ──

export interface ImportOptions {
  secondsPerSlide: number
  fps: number
  includeNarration: boolean
}

/**
 * Import a parsed PPTX presentation into ProAnimate stores.
 */
export async function importPresentation(
  data: PresentationData,
  options: ImportOptions = { secondsPerSlide: 5, fps: 30, includeNarration: false },
): Promise<void> {
  const { secondsPerSlide, fps } = options
  const totalFrames = data.slides.length * secondsPerSlide * fps

  // Set canvas dimensions from slide size
  const canvasStore = useCanvasStore.getState()
  const editorStore = useEditorStore.getState()

  // Determine aspect ratio from slide dimensions
  const ratio = data.slideWidth / data.slideHeight
  let aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9' = '16:9'
  if (Math.abs(ratio - 16 / 9) < 0.1) aspectRatio = '16:9'
  else if (Math.abs(ratio - 9 / 16) < 0.1) aspectRatio = '9:16'
  else if (Math.abs(ratio - 1) < 0.1) aspectRatio = '1:1'
  else if (Math.abs(ratio - 4 / 3) < 0.1) aspectRatio = '4:3'

  canvasStore.setCanvasDimensions(data.slideWidth, data.slideHeight)
  editorStore.setAspectRatio(aspectRatio)

  // Set timeline
  const timelineStore = useTimelineStore.getState()
  timelineStore.setFps(fps)
  timelineStore.setTotalFrames(totalFrames)

  // Import each slide
  const textOverlayStore = useTextOverlayStore.getState()
  const shapeStore = useShapeStore.getState()
  const mediaStore = useMediaStore.getState()

  for (let i = 0; i < data.slides.length; i++) {
    const slide = data.slides[i]
    const slideStartFrame = i * secondsPerSlide * fps
    const slideEndFrame = (i + 1) * secondsPerSlide * fps

    // Import text boxes as text overlays
    for (const tb of slide.textBoxes) {
      // Determine preset type based on font size and position
      let preset: TextPresetType = 'subtitle'
      if (tb.fontSize >= 32) preset = 'title'
      else if (tb.y > data.slideHeight * 0.7) preset = 'lower-third'

      textOverlayStore.addOverlay({
        id: `pptx-text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        presetType: preset,
        content: tb.text,
        fontFamily: mapToValidFont(tb.fontFamily),
        fontSize: Math.min(tb.fontSize, 72),
        fontWeight: tb.bold ? 'bold' : 'normal',
        color: tb.fontColor,
        align: tb.alignment,
        verticalAlign: 'top',
        position: 'free',
        freeX: tb.x,
        freeY: tb.y,
        lineHeight: 1.2,
        letterSpacing: 0,
        textCase: 'none',
        shadow: false,
        background: false,
        backgroundOpacity: 0.8,
        visible: true,
        opacity: 1,
        zIndex: 0,
        rotation: tb.rotation || 0,
        width: tb.width,
        height: null,
        startFrame: slideStartFrame,
        endFrame: slideEndFrame,
      })
    }

    // Import shapes
    for (const shape of slide.shapes) {
      const type = mapShapeType(shape.type)
      shapeStore.addShape(type)
      // The addShape creates a shape with defaults; we need to update it
      const shapes = shapeStore.shapes
      const lastShape = shapes[shapes.length - 1]
      if (lastShape) {
        shapeStore.updateShape(lastShape.id, {
          position: { x: shape.x, y: shape.y },
          width: shape.width,
          height: shape.height,
          fill: shape.fillColor,
          stroke: shape.strokeColor,
          strokeWidth: shape.strokeWidth,
          rotation: shape.rotation,
        })
        shapeStore.setShapeTimeRange(lastShape.id, slideStartFrame, slideEndFrame)
      }
    }

    // Import images as media assets
    for (const img of slide.images) {
      try {
        // Convert data URL to blob
        const response = await fetch(img.dataUrl)
        const blob = await response.blob()

        // Save to media DB
        const assetId = `pptx-img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        await saveMediaBlob(assetId, blob)

        const blobUrl = URL.createObjectURL(blob)
        mediaStore.addAsset({
          id: assetId,
          name: img.filename,
          type: blob.type,
          size: blob.size,
          category: 'images',
          url: blobUrl,
          width: img.width,
          height: img.height,
          addedAt: Date.now(),
        }, blob)

        // Place on canvas
        mediaStore.addToCanvas(assetId)
      } catch (err) {
        console.warn('[PPTXImporter] Failed to import image:', img.filename, err)
      }
    }
  }

  console.log(`[PPTXImporter] Imported ${data.slides.length} slides with ${totalFrames} total frames`)
}

/**
 * Build a narration script from slide speaker notes.
 */
export function buildNarrationFromNotes(data: PresentationData): string {
  const lines: string[] = []
  for (const slide of data.slides) {
    if (slide.speakerNotes.trim()) {
      lines.push(slide.speakerNotes.trim())
    } else {
      // Fall back to slide text
      const texts = slide.textBoxes.map((tb) => tb.text).join('. ')
      if (texts.trim()) lines.push(texts.trim())
    }
  }
  return lines.join('\n\n')
}
