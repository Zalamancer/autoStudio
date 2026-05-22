/**
 * Whiteboard Animation Store
 *
 * Manages whiteboard mode state including strokes, hand overlay settings,
 * and drawing configuration.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  WhiteboardConfig,
  WhiteboardStroke,
  DraftingConfig,
  BackgroundCodeControl,
} from '@/services/whiteboardAnimation'
import { createDefaultWhiteboardConfig, createDefaultDraftingConfig, pointsToSvgPath } from '@/services/whiteboardAnimation'
import type { PenStyle } from '@/services/progressiveDrawing'
import { PEN_PRESETS } from '@/services/progressiveDrawing'

/** Drawing style presets for whiteboard text */
export type WhiteboardDrawStyle = 'outline' | 'handwriting'

/** A selectable, transformable text item drawn with SVG path animation */
export interface WhiteboardTextItem {
  id: string
  text: string
  fontFamily: string
  fontSize: number
  color: string
  strokeWidth: number
  /** Center X as percentage of canvas (0-100) */
  x: number
  /** Center Y as percentage of canvas (0-100) */
  y: number
  /** Scale factor */
  scale: number
  /** Rotation in degrees */
  rotation: number
  /** Per-character SVG path data */
  charPaths: string[]
  /** Total width of the text in pixels (at scale 1) */
  textWidth: number
  /** Total height of the text in pixels (at scale 1) */
  textHeight: number
  /** Frame when drawing starts */
  startFrame: number
  /** Frames per character for the drawing animation */
  framesPerChar: number
  /** Easing for the draw animation */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  /** Drawing style: 'outline' traces font outline then fills, 'handwriting' follows a single pen stroke */
  drawStyle: WhiteboardDrawStyle
  /** Which pen preset was used (chalk, pen, marker, brush, fine) */
  penPresetName?: string
  /** Pen style settings for progressive drawing */
  penStyleOverride?: {
    size: number
    thinning: number
    smoothing: number
    streamline: number
    simulatePressure: boolean
    taperStart: number
    taperEnd: number
  }
}

/** A user-uploaded custom background (image/video/SVG) */
export interface CustomBackground {
  id: string
  type: 'image' | 'video' | 'svg'
  dataUrl: string
  label: string
}

interface WhiteboardState {
  /** Whether whiteboard mode is enabled */
  enabled: boolean
  /** The whiteboard configuration (strokes, colors, hand settings) */
  config: WhiteboardConfig
  /** Selectable text items rendered with SVG path drawing */
  textItems: WhiteboardTextItem[]
  /** Currently selected text item id */
  selectedTextItemId: string | null
  /** Currently selected stroke id (for properties panel) */
  selectedStrokeId: string | null
  /** User-uploaded custom backgrounds */
  customBackgrounds: CustomBackground[]
  /** Draggable toolbar position (null = default CSS position) */
  toolbarPosition: { x: number; y: number } | null
  /** Whether the freehand drawing tool is active */
  drawingActive: boolean
  /** Active brush tool id */
  activeBrush: string
  /** Drawing color */
  drawingColor: string
  /** Active pen preset name for freehand drawing */
  drawingPenPreset: string
  /** Pen style override for freehand drawing */
  drawingPenStyle: Omit<PenStyle, 'capStart' | 'capEnd'>

  // Actions
  setToolbarPosition: (pos: { x: number; y: number } | null) => void
  setEnabled: (enabled: boolean) => void
  setDrawingActive: (active: boolean) => void
  setActiveBrush: (brush: string) => void
  setDrawingColor: (color: string) => void
  setDrawingPenPreset: (preset: string) => void
  updateDrawingPenStyle: (updates: Partial<Omit<PenStyle, 'capStart' | 'capEnd'>>) => void
  toggleEnabled: () => void
  setConfig: (config: Partial<WhiteboardConfig>) => void
  addStroke: (stroke: WhiteboardStroke) => void
  removeStroke: (id: string) => void
  updateStroke: (id: string, updates: Partial<WhiteboardStroke>) => void
  reorderStrokes: (fromIndex: number, toIndex: number) => void
  clearStrokes: () => void
  setBackgroundColor: (color: string) => void
  setBackgroundStyle: (style: string) => void
  setBackgroundType: (type: WhiteboardConfig['backgroundType']) => void
  setBackgroundImageUrl: (url: string) => void
  setBackgroundVideoUrl: (url: string) => void
  setBackgroundCode: (code: string) => void
  setBackgroundCodeControls: (controls: BackgroundCodeControl[]) => void
  updateBackgroundCodeControl: (id: string, value: string | number | boolean) => void
  addCustomBackground: (bg: CustomBackground) => void
  removeCustomBackground: (id: string) => void
  setHandType: (handType: WhiteboardConfig['handType']) => void
  setShowHand: (show: boolean) => void
  setHandScale: (scale: number) => void
  setLineCap: (cap: WhiteboardConfig['lineCap']) => void
  setLineJoin: (join: WhiteboardConfig['lineJoin']) => void
  // Drafting config
  setSelectedStrokeId: (id: string | null) => void
  updateDraftingConfig: (updates: Partial<DraftingConfig>) => void
  // Text item actions
  addTextItem: (item: WhiteboardTextItem) => void
  removeTextItem: (id: string) => void
  updateTextItem: (id: string, updates: Partial<WhiteboardTextItem>) => void
  setSelectedTextItemId: (id: string | null) => void
  clearTextItems: () => void
  /** Reset the whiteboard to default state */
  reset: () => void
  /** Load from a snapshot (for project persistence) */
  loadFromSnapshot: (data: { enabled: boolean; config: WhiteboardConfig }) => void
}

export const useWhiteboardStore = create<WhiteboardState>()(
  immer((set) => ({
    enabled: false,
    config: createDefaultWhiteboardConfig(),
    textItems: [],
    selectedTextItemId: null,
    selectedStrokeId: null,
    customBackgrounds: [],
    toolbarPosition: null,
    drawingActive: false,
    activeBrush: 'pen',
    drawingColor: '#ffffff',
    drawingPenPreset: 'pen',
    drawingPenStyle: {
      size: PEN_PRESETS.pen.size,
      thinning: PEN_PRESETS.pen.thinning,
      smoothing: PEN_PRESETS.pen.smoothing,
      streamline: PEN_PRESETS.pen.streamline,
      simulatePressure: PEN_PRESETS.pen.simulatePressure,
      taperStart: PEN_PRESETS.pen.taperStart,
      taperEnd: PEN_PRESETS.pen.taperEnd,
    },

    setToolbarPosition: (pos) =>
      set((state) => { state.toolbarPosition = pos }),

    setEnabled: (enabled) =>
      set((state) => {
        state.enabled = enabled
        if (!enabled) state.drawingActive = false
      }),

    setDrawingActive: (active) =>
      set((state) => { state.drawingActive = active }),

    setActiveBrush: (brush) =>
      set((state) => { state.activeBrush = brush }),

    setDrawingColor: (color) =>
      set((state) => { state.drawingColor = color }),

    setDrawingPenPreset: (preset) =>
      set((state) => {
        const p = PEN_PRESETS[preset]
        if (!p) return
        state.drawingPenPreset = preset
        state.drawingPenStyle = {
          size: p.size,
          thinning: p.thinning,
          smoothing: p.smoothing,
          streamline: p.streamline,
          simulatePressure: p.simulatePressure,
          taperStart: p.taperStart,
          taperEnd: p.taperEnd,
        }
      }),

    updateDrawingPenStyle: (updates) =>
      set((state) => {
        Object.assign(state.drawingPenStyle, updates)
        state.drawingPenPreset = 'custom'
      }),

    toggleEnabled: () =>
      set((state) => {
        state.enabled = !state.enabled
      }),

    setConfig: (updates) =>
      set((state) => {
        Object.assign(state.config, updates)
      }),

    addStroke: (stroke) =>
      set((state) => {
        state.config.strokes.push(stroke)
      }),

    removeStroke: (id) =>
      set((state) => {
        state.config.strokes = state.config.strokes.filter((s) => s.id !== id)
      }),

    updateStroke: (id, updates) =>
      set((state) => {
        const stroke = state.config.strokes.find((s) => s.id === id)
        if (stroke) {
          Object.assign(stroke, updates)
          // If pen style changed and raw points exist, regenerate the path
          if (updates.penStyle && stroke.rawPoints && stroke.rawPoints.length >= 2) {
            stroke.path = pointsToSvgPath(stroke.rawPoints)
          }
        }
      }),

    reorderStrokes: (fromIndex, toIndex) =>
      set((state) => {
        const strokes = state.config.strokes
        if (fromIndex < 0 || fromIndex >= strokes.length) return
        if (toIndex < 0 || toIndex >= strokes.length) return
        const [moved] = strokes.splice(fromIndex, 1)
        strokes.splice(toIndex, 0, moved)
      }),

    clearStrokes: () =>
      set((state) => {
        state.config.strokes = []
      }),

    setBackgroundColor: (color) =>
      set((state) => {
        state.config.backgroundColor = color
      }),

    setBackgroundStyle: (style) =>
      set((state) => {
        state.config.backgroundStyle = style
      }),

    setBackgroundType: (type) =>
      set((state) => {
        state.config.backgroundType = type
      }),

    setBackgroundImageUrl: (url) =>
      set((state) => {
        state.config.backgroundImageUrl = url
      }),

    setBackgroundVideoUrl: (url) =>
      set((state) => {
        state.config.backgroundVideoUrl = url
      }),

    setBackgroundCode: (code) =>
      set((state) => {
        state.config.backgroundCode = code
      }),

    setBackgroundCodeControls: (controls) =>
      set((state) => {
        state.config.backgroundCodeControls = controls
      }),

    updateBackgroundCodeControl: (id, value) =>
      set((state) => {
        const ctrl = state.config.backgroundCodeControls?.find((c) => c.id === id)
        if (ctrl) (ctrl as any).value = value
      }),

    addCustomBackground: (bg) =>
      set((state) => {
        state.customBackgrounds.push(bg)
      }),

    removeCustomBackground: (id) =>
      set((state) => {
        state.customBackgrounds = state.customBackgrounds.filter((b) => b.id !== id)
      }),

    setHandType: (handType) =>
      set((state) => {
        state.config.handType = handType
      }),

    setShowHand: (show) =>
      set((state) => {
        state.config.showHand = show
      }),

    setHandScale: (scale) =>
      set((state) => {
        state.config.handScale = Math.max(0.25, Math.min(3, scale))
      }),

    setLineCap: (cap) =>
      set((state) => {
        state.config.lineCap = cap
      }),

    setLineJoin: (join) =>
      set((state) => {
        state.config.lineJoin = join
      }),

    setSelectedStrokeId: (id) =>
      set((state) => { state.selectedStrokeId = id }),

    updateDraftingConfig: (updates) =>
      set((state) => {
        if (!state.config.draftingConfig) {
          state.config.draftingConfig = createDefaultDraftingConfig()
        }
        Object.assign(state.config.draftingConfig, updates)
      }),

    addTextItem: (item) =>
      set((state) => { state.textItems.push(item) }),

    removeTextItem: (id) =>
      set((state) => {
        state.textItems = state.textItems.filter((t) => t.id !== id)
        if (state.selectedTextItemId === id) state.selectedTextItemId = null
      }),

    updateTextItem: (id, updates) =>
      set((state) => {
        const item = state.textItems.find((t) => t.id === id)
        if (item) Object.assign(item, updates)
      }),

    setSelectedTextItemId: (id) =>
      set((state) => { state.selectedTextItemId = id }),

    clearTextItems: () =>
      set((state) => { state.textItems = []; state.selectedTextItemId = null }),

    reset: () =>
      set((state) => {
        state.enabled = false
        state.config = createDefaultWhiteboardConfig()
        state.textItems = []
        state.selectedTextItemId = null
        state.customBackgrounds = []
        state.toolbarPosition = null
      }),

    loadFromSnapshot: (data) =>
      set((state) => {
        state.enabled = data.enabled
        state.config = data.config
      }),
  }))
)
