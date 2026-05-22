import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { TemplateConfigProperty } from '@/services/templateConfigParser'

// ── Template Aspect Ratio Dimension Utility ──

const TEMPLATE_ASPECT_DIMENSIONS: Record<string, { w: number; h: number }> = {
  '16:9': { w: 1920, h: 1080 },
  '9:16': { w: 1080, h: 1920 },
  '1:1': { w: 1080, h: 1080 },
  '4:3': { w: 1440, h: 1080 },
  '21:9': { w: 2560, h: 1080 },
}

export interface TemplateDimensions {
  /** Width/height the iframe should be internally (native template resolution) */
  nativeWidth: number
  nativeHeight: number
  /** Width/height of the container div on the canvas (after fitting + scale) */
  displayWidth: number
  displayHeight: number
  /** Uniform CSS scale factor to apply to the iframe (displayWidth / nativeWidth) */
  iframeScale: number
}

/**
 * Compute the native and display dimensions for a template.
 *
 * When templateAspectRatio is undefined the template fills the full canvas
 * (current behaviour). When set, the template uses its own native resolution
 * and is fitted to the canvas width (or height if width-fit would overflow).
 *
 * The `scale` parameter (1 = 100%) is applied after fitting.
 */
export function computeTemplateDimensions(
  templateAspectRatio: string | undefined,
  canvasWidth: number,
  canvasHeight: number,
  scale: number,
): TemplateDimensions {
  // Default: full canvas (backward-compatible)
  if (!templateAspectRatio) {
    return {
      nativeWidth: canvasWidth,
      nativeHeight: canvasHeight,
      displayWidth: canvasWidth,
      displayHeight: canvasHeight,
      iframeScale: 1,
    }
  }

  const native = TEMPLATE_ASPECT_DIMENSIONS[templateAspectRatio]
  if (!native) {
    // Unknown ratio — fall back to full canvas
    return {
      nativeWidth: canvasWidth,
      nativeHeight: canvasHeight,
      displayWidth: canvasWidth,
      displayHeight: canvasHeight,
      iframeScale: 1,
    }
  }

  const nativeWidth = native.w
  const nativeHeight = native.h
  const nativeRatio = nativeWidth / nativeHeight

  // Fit to canvas width first
  let fitWidth = canvasWidth
  let fitHeight = canvasWidth / nativeRatio

  // If height overflows canvas, fit to height instead
  if (fitHeight > canvasHeight) {
    fitHeight = canvasHeight
    fitWidth = canvasHeight * nativeRatio
  }

  // Apply user scale
  const displayWidth = fitWidth * scale
  const displayHeight = fitHeight * scale

  return {
    nativeWidth,
    nativeHeight,
    displayWidth,
    displayHeight,
    iframeScale: displayWidth / nativeWidth,
  }
}

export interface CanvasHTMLTemplate {
  id: string
  htmlContent: string
  name: string
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  rotation: number
  visible: boolean
  width: number
  height: number
  startFrame: number
  endFrame: number
  /** Parsed editable properties from the template's CONFIG / EDITABLE section */
  customConfig: TemplateConfigProperty[]
  /** When true, parent sends FRAME_UPDATE messages to the iframe every frame */
  frameSync?: boolean
  /**
   * Template's own aspect ratio. When undefined, the template fills the
   * full canvas (default behaviour). When set, the template renders at
   * its native resolution and is CSS-scaled to fit within the canvas.
   */
  templateAspectRatio?: string
}

interface HTMLTemplateLayerState {
  templates: CanvasHTMLTemplate[]
  selectedTemplateId: string | null

  addTemplate: (template: CanvasHTMLTemplate) => void
  removeTemplate: (id: string) => void
  updateTemplate: (id: string, updates: Partial<CanvasHTMLTemplate>) => void
  /** Update a single config property value by key */
  updateTemplateConfig: (id: string, key: string, value: unknown) => void
  setSelectedTemplateId: (id: string | null) => void
  clearAll: () => void
  loadFromSnapshot: (templates: CanvasHTMLTemplate[]) => void
}

export const useHTMLTemplateLayerStore = create<HTMLTemplateLayerState>()(
  immer((set) => ({
    templates: [],
    selectedTemplateId: null,

    addTemplate: (template) =>
      set((state) => {
        const exists = state.templates.some((t) => t.id === template.id)
        if (!exists) {
          state.templates.push(template)
        }
      }),

    removeTemplate: (id) =>
      set((state) => {
        state.templates = state.templates.filter((t) => t.id !== id)
        if (state.selectedTemplateId === id) {
          state.selectedTemplateId = null
        }
      }),

    updateTemplate: (id, updates) =>
      set((state) => {
        const template = state.templates.find((t) => t.id === id)
        if (template) {
          Object.assign(template, updates)
        }
      }),

    updateTemplateConfig: (id, key, value) =>
      set((state) => {
        const template = state.templates.find((t) => t.id === id)
        if (!template) return
        // Create a new customConfig array to guarantee a new reference for
        // downstream React.memo / useMemo consumers (e.g. HTMLTemplateLayer's
        // patchedHtml memo). Mutating the existing prop in-place sometimes
        // doesn't produce a new array reference through Immer.
        template.customConfig = template.customConfig.map((p) =>
          p.key === key ? { ...p, value } : p
        )
      }),

    setSelectedTemplateId: (id) =>
      set((state) => {
        state.selectedTemplateId = id
      }),

    clearAll: () =>
      set((state) => {
        state.templates = []
        state.selectedTemplateId = null
      }),

    loadFromSnapshot: (templates) =>
      set((state) => {
        state.templates = templates
        state.selectedTemplateId = null
      }),
  }))
)
