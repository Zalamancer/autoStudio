import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'
import { useBrandKitStore } from '@/stores/useBrandKitStore'

export type TextPresetType = 'title' | 'subtitle' | 'lower-third' | 'cta' | 'quote' | 'watermark'
export type FontFamily =
  | 'Inter'
  | 'Roboto'
  | 'Montserrat'
  | 'Playfair Display'
  | 'Space Mono'
  | 'Poppins'
  | 'Open Sans'
  | 'Lato'
  | 'Oswald'
  | 'Raleway'
  | 'Merriweather'
  | 'PT Sans'
  | 'Nunito'
  | 'Ubuntu'
  | 'Bebas Neue'
  | 'Archivo Black'
  | 'Permanent Marker'
  | 'Pacifico'
  | 'Dancing Script'
  | 'Caveat'
  | 'Bangers'
  | 'Righteous'
  | 'Abril Fatface'
  | 'Alfa Slab One'
  | 'Fredoka'
  | 'Comfortaa'
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold' | 'black'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'
export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type TextPosition = 'top' | 'center' | 'bottom' | 'free'
export type TextCase = 'none' | 'uppercase' | 'lowercase'

export interface TextOverlay {
  id: string
  presetType: TextPresetType
  content: string
  fontFamily: FontFamily
  fontSize: number
  fontWeight: FontWeight
  color: string
  align: TextAlign
  verticalAlign: VerticalAlign
  position: TextPosition
  freeX: number
  freeY: number
  lineHeight: number
  letterSpacing: number
  textCase: TextCase
  shadow: boolean
  background: boolean
  backgroundOpacity: number
  // Custom background color (hex or rgba, default '#000000')
  backgroundColor?: string
  // Custom border radius for background box (px, default 6)
  backgroundBorderRadius?: number
  // Custom padding multiplier for background box (relative to fontSize, default auto)
  backgroundPaddingX?: number
  backgroundPaddingY?: number
  // Border for background box (CSS border string, e.g. '2px solid #ffffff')
  backgroundBorder?: string
  visible: boolean
  opacity: number
  zIndex: number
  // Transform properties for free-positioned overlays
  rotation: number
  width: number | null   // null = auto (intrinsic width)
  height: number | null  // null = auto (intrinsic height)
  // Timeline frame range
  startFrame: number
  endFrame: number
  // Animation preset
  animationPreset?: string
  // Custom text shadow (CSS textShadow string, overrides boolean shadow)
  textShadow?: string
  // Custom text stroke (CSS WebkitTextStroke string, e.g. '2px #000000')
  webkitTextStroke?: string
  // Text style preset name (for display purposes)
  textStylePreset?: string
  // Blend mode and blur
  blendMode?: BlendMode
  blur?: number
  blurType?: BlurType
  motionBlurAngle?: number
}

interface TextOverlayState {
  overlays: TextOverlay[]
  selectedId: string | null

  // Actions
  addOverlay: (overlay: TextOverlay) => void
  removeOverlay: (id: string) => void
  updateOverlay: (id: string, updates: Partial<TextOverlay>) => void
  duplicateOverlay: (id: string) => void
  toggleVisibility: (id: string) => void
  setSelectedId: (id: string | null) => void
  setOverlayTimeRange: (id: string, startFrame: number, endFrame: number) => void

  // Computed
  getVisibleOverlays: () => TextOverlay[]

  // Reset all state (for new project)
  reset: () => void
  loadFromSnapshot: (overlays: TextOverlay[]) => void
}

export const useTextOverlayStore = create<TextOverlayState>()(
  immer((set, get) => ({
    overlays: [],
    selectedId: null,

    addOverlay: (overlay) =>
      set((state) => {
        // Apply brand kit defaults if active and overlay doesn't specify custom values
        const brandKit = useBrandKitStore.getState().getActiveBrandKit()
        if (brandKit) {
          const isHeading = overlay.presetType === 'title' || overlay.presetType === 'cta'
          if (overlay.fontFamily === 'Inter') {
            overlay.fontFamily = (isHeading ? brandKit.headingFont : brandKit.bodyFont) as FontFamily
          }
          if (overlay.color === '#ffffff') {
            overlay.color = brandKit.primaryColor
          }
        }
        state.overlays.push(overlay)
        state.selectedId = overlay.id
      }),

    removeOverlay: (id) =>
      set((state) => {
        state.overlays = state.overlays.filter((o) => o.id !== id)
        if (state.selectedId === id) {
          state.selectedId = null
        }
      }),

    updateOverlay: (id, updates) =>
      set((state) => {
        const overlay = state.overlays.find((o) => o.id === id)
        if (overlay) {
          Object.assign(overlay, updates)
        }
      }),

    duplicateOverlay: (id) =>
      set((state) => {
        const source = state.overlays.find((o) => o.id === id)
        if (!source) return
        const newId = `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const duplicate: TextOverlay = {
          id: newId,
          presetType: source.presetType,
          content: source.content,
          fontFamily: source.fontFamily,
          fontSize: source.fontSize,
          fontWeight: source.fontWeight,
          color: source.color,
          align: source.align,
          verticalAlign: source.verticalAlign,
          position: source.position,
          freeX: source.freeX + 2,
          freeY: source.freeY + 2,
          lineHeight: source.lineHeight,
          letterSpacing: source.letterSpacing,
          textCase: source.textCase,
          shadow: source.shadow,
          background: source.background,
          backgroundOpacity: source.backgroundOpacity,
          backgroundColor: source.backgroundColor,
          backgroundBorderRadius: source.backgroundBorderRadius,
          backgroundPaddingX: source.backgroundPaddingX,
          backgroundPaddingY: source.backgroundPaddingY,
          backgroundBorder: source.backgroundBorder,
          visible: source.visible,
          opacity: source.opacity,
          zIndex: source.zIndex,
          rotation: source.rotation,
          width: source.width,
          height: source.height,
          startFrame: source.startFrame,
          endFrame: source.endFrame,
          animationPreset: source.animationPreset,
          textShadow: source.textShadow,
          webkitTextStroke: source.webkitTextStroke,
          textStylePreset: source.textStylePreset,
        }
        state.overlays.push(duplicate)
        state.selectedId = newId
      }),

    toggleVisibility: (id) =>
      set((state) => {
        const overlay = state.overlays.find((o) => o.id === id)
        if (overlay) {
          overlay.visible = !overlay.visible
        }
      }),

    setSelectedId: (id) =>
      set((state) => {
        state.selectedId = id
      }),

    setOverlayTimeRange: (id, startFrame, endFrame) =>
      set((state) => {
        const overlay = state.overlays.find((o) => o.id === id)
        if (overlay) {
          overlay.startFrame = startFrame
          overlay.endFrame = endFrame
        }
      }),

    getVisibleOverlays: () => {
      return get().overlays.filter((o) => o.visible)
    },

    // Reset all state (for new project)
    reset: () =>
      set((state) => {
        state.overlays = []
        state.selectedId = null
      }),

    loadFromSnapshot: (overlays) =>
      set((state) => {
        state.overlays = overlays
        state.selectedId = null
      }),
  }))
)
