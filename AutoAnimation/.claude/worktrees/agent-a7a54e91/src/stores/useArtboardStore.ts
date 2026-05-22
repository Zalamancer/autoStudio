/**
 * useArtboardStore — Infinite Canvas & Multi-Artboard state management.
 *
 * Manages world-space transform (pan/zoom for the infinite canvas) and
 * multiple artboards, each representing an independent composition with
 * its own dimensions, aspect ratio, and timeline settings.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Artboard, WorldTransform } from '@/types/artboard'

const ZOOM_MIN = 0.05
const ZOOM_MAX = 10.0

interface ArtboardState {
  // ── World-space transform (infinite canvas viewport) ──
  worldTransform: WorldTransform
  /** Whether infinite canvas mode is enabled */
  infiniteCanvasEnabled: boolean

  // ── Multi-artboard ──
  artboards: Artboard[]
  activeArtboardId: string | null
  /** Whether to show artboard outlines when not selected */
  showArtboardOutlines: boolean
  /** Snap to artboard edges when panning */
  snapToArtboards: boolean

  // ── World transform actions ──
  setWorldPan: (x: number, y: number) => void
  setWorldZoom: (zoom: number) => void
  panWorldBy: (dx: number, dy: number) => void
  zoomWorldAt: (centerX: number, centerY: number, delta: number) => void
  resetWorldView: () => void
  toggleInfiniteCanvas: () => void
  fitArtboardInView: (artboardId: string, viewportWidth: number, viewportHeight: number) => void
  fitAllInView: (viewportWidth: number, viewportHeight: number) => void

  // ── Artboard CRUD ──
  addArtboard: (partial?: Partial<Artboard>) => string
  removeArtboard: (id: string) => void
  updateArtboard: (id: string, updates: Partial<Artboard>) => void
  setActiveArtboard: (id: string | null) => void
  duplicateArtboard: (id: string) => string | null
  reorderArtboard: (id: string, newOrder: number) => void
  setShowArtboardOutlines: (show: boolean) => void
  setSnapToArtboards: (snap: boolean) => void

  // ── Helpers ──
  getActiveArtboard: () => Artboard | null
  screenToWorld: (screenX: number, screenY: number) => { x: number; y: number }
  worldToScreen: (worldX: number, worldY: number) => { x: number; y: number }
}

export const useArtboardStore = create<ArtboardState>()(
  immer((set, get) => ({
    worldTransform: { panX: 0, panY: 0, zoom: 1 },
    infiniteCanvasEnabled: false,
    artboards: [],
    activeArtboardId: null,
    showArtboardOutlines: true,
    snapToArtboards: true,

    // ── World transform actions ──

    setWorldPan: (x, y) =>
      set((state) => {
        state.worldTransform.panX = x
        state.worldTransform.panY = y
      }),

    setWorldZoom: (zoom) =>
      set((state) => {
        state.worldTransform.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom))
      }),

    panWorldBy: (dx, dy) =>
      set((state) => {
        state.worldTransform.panX += dx
        state.worldTransform.panY += dy
      }),

    zoomWorldAt: (centerX, centerY, delta) =>
      set((state) => {
        const oldZoom = state.worldTransform.zoom
        const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldZoom * (1 + delta)))
        const scale = newZoom / oldZoom

        // Adjust pan so zoom centers on the cursor position
        state.worldTransform.panX = centerX - (centerX - state.worldTransform.panX) * scale
        state.worldTransform.panY = centerY - (centerY - state.worldTransform.panY) * scale
        state.worldTransform.zoom = newZoom
      }),

    resetWorldView: () =>
      set((state) => {
        state.worldTransform = { panX: 0, panY: 0, zoom: 1 }
      }),

    toggleInfiniteCanvas: () =>
      set((state) => {
        state.infiniteCanvasEnabled = !state.infiniteCanvasEnabled
        if (!state.infiniteCanvasEnabled) {
          // Reset world transform when disabling
          state.worldTransform = { panX: 0, panY: 0, zoom: 1 }
        }
      }),

    fitArtboardInView: (artboardId, viewportWidth, viewportHeight) =>
      set((state) => {
        const artboard = state.artboards.find((a) => a.id === artboardId)
        if (!artboard) return

        const padding = 80
        const availableW = viewportWidth - padding * 2
        const availableH = viewportHeight - padding * 2

        const scaleX = availableW / artboard.width
        const scaleY = availableH / artboard.height
        const zoom = Math.min(scaleX, scaleY, 2) // cap at 2x

        const centerX = artboard.position.x + artboard.width / 2
        const centerY = artboard.position.y + artboard.height / 2

        state.worldTransform.zoom = zoom
        state.worldTransform.panX = viewportWidth / 2 - centerX * zoom
        state.worldTransform.panY = viewportHeight / 2 - centerY * zoom
      }),

    fitAllInView: (viewportWidth, viewportHeight) =>
      set((state) => {
        if (state.artboards.length === 0) {
          state.worldTransform = { panX: 0, panY: 0, zoom: 1 }
          return
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const ab of state.artboards) {
          minX = Math.min(minX, ab.position.x)
          minY = Math.min(minY, ab.position.y)
          maxX = Math.max(maxX, ab.position.x + ab.width)
          maxY = Math.max(maxY, ab.position.y + ab.height)
        }

        const padding = 80
        const boundsW = maxX - minX
        const boundsH = maxY - minY
        const availableW = viewportWidth - padding * 2
        const availableH = viewportHeight - padding * 2

        const scaleX = availableW / boundsW
        const scaleY = availableH / boundsH
        const zoom = Math.min(scaleX, scaleY, 2)

        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        state.worldTransform.zoom = zoom
        state.worldTransform.panX = viewportWidth / 2 - centerX * zoom
        state.worldTransform.panY = viewportHeight / 2 - centerY * zoom
      }),

    // ── Artboard CRUD ──

    addArtboard: (partial) => {
      const id = `artboard-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        const order = state.artboards.length
        // Position new artboards to the right of existing ones
        const lastArtboard = state.artboards[state.artboards.length - 1]
        const defaultX = lastArtboard
          ? lastArtboard.position.x + lastArtboard.width + 100
          : 0

        const artboard: Artboard = {
          id,
          name: partial?.name || `Artboard ${order + 1}`,
          position: partial?.position || { x: defaultX, y: 0 },
          width: partial?.width || 1920,
          height: partial?.height || 1080,
          aspectRatio: partial?.aspectRatio || '16:9',
          backgroundColor: partial?.backgroundColor || '#000000',
          fps: partial?.fps || 30,
          totalFrames: partial?.totalFrames || 300,
          visible: partial?.visible ?? true,
          locked: partial?.locked ?? false,
          order,
        }

        state.artboards.push(artboard)
        state.activeArtboardId = id
      })
      return id
    },

    removeArtboard: (id) =>
      set((state) => {
        state.artboards = state.artboards.filter((a) => a.id !== id)
        if (state.activeArtboardId === id) {
          state.activeArtboardId = state.artboards[0]?.id || null
        }
        // Recompute order
        state.artboards.forEach((a, i) => {
          a.order = i
        })
      }),

    updateArtboard: (id, updates) =>
      set((state) => {
        const artboard = state.artboards.find((a) => a.id === id)
        if (artboard && !artboard.locked) {
          Object.assign(artboard, updates)
        }
      }),

    setActiveArtboard: (id) =>
      set((state) => {
        state.activeArtboardId = id
      }),

    duplicateArtboard: (id) => {
      const source = get().artboards.find((a) => a.id === id)
      if (!source) return null

      const newId = `artboard-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        const clone: Artboard = {
          ...JSON.parse(JSON.stringify(source)),
          id: newId,
          name: `${source.name} copy`,
          position: {
            x: source.position.x + source.width + 100,
            y: source.position.y,
          },
          order: state.artboards.length,
        }
        state.artboards.push(clone)
        state.activeArtboardId = newId
      })
      return newId
    },

    reorderArtboard: (id, newOrder) =>
      set((state) => {
        const artboard = state.artboards.find((a) => a.id === id)
        if (!artboard) return
        const clamped = Math.max(0, Math.min(state.artboards.length - 1, newOrder))
        // Remove from current position
        state.artboards = state.artboards.filter((a) => a.id !== id)
        // Insert at new position
        state.artboards.splice(clamped, 0, artboard)
        // Update all order values
        state.artboards.forEach((a, i) => {
          a.order = i
        })
      }),

    setShowArtboardOutlines: (show) =>
      set((state) => {
        state.showArtboardOutlines = show
      }),

    setSnapToArtboards: (snap) =>
      set((state) => {
        state.snapToArtboards = snap
      }),

    // ── Helpers ──

    getActiveArtboard: () => {
      const { artboards, activeArtboardId } = get()
      return artboards.find((a) => a.id === activeArtboardId) || null
    },

    screenToWorld: (screenX, screenY) => {
      const { panX, panY, zoom } = get().worldTransform
      return {
        x: (screenX - panX) / zoom,
        y: (screenY - panY) / zoom,
      }
    },

    worldToScreen: (worldX, worldY) => {
      const { panX, panY, zoom } = get().worldTransform
      return {
        x: worldX * zoom + panX,
        y: worldY * zoom + panY,
      }
    },
  }))
)
