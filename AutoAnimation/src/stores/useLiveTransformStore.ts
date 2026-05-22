import { create } from 'zustand'

/**
 * Lightweight store for real-time transform values during canvas manipulation.
 * This avoids updating the main stores (useMediaStore / useTextOverlayStore)
 * during drag/resize/rotate, which would cause re-renders that conflict with
 * Moveable's direct DOM manipulation.
 *
 * The right panel subscribes to this store to show live values.
 * When manipulation ends, the main stores are updated as before, and this
 * store is cleared.
 */

export interface LiveTransform {
  /** The element type being manipulated */
  type: 'media' | 'text' | 'shape' | 'html-template' | 'video' | 'motion-graphic'
  /** The ID of the element being manipulated */
  id: string
  /** Position X (px for media, % for text) */
  x: number
  /** Position Y (px for media, % for text) */
  y: number
  /** Rotation in degrees */
  rotation: number
  /** Scale (1 = 100%) — only relevant for media items */
  scale: number
}

interface LiveTransformState {
  /** Current live transform being applied (null when not manipulating) */
  active: LiveTransform | null
  /** Set live transform values during manipulation */
  setLiveTransform: (transform: LiveTransform) => void
  /** Clear when manipulation ends */
  clearLiveTransform: () => void
}

export const useLiveTransformStore = create<LiveTransformState>()((set) => ({
  active: null,
  setLiveTransform: (transform) => set({ active: transform }),
  clearLiveTransform: () => set({ active: null }),
}))
