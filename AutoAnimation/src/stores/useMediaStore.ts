import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { saveMediaBlob, getMediaBlob, deleteMediaBlob, clearAllMediaBlobs } from '@/services/mediaDB'
import { applyColorMap, type ExtractedColor } from '@/services/colorExtraction'
import { useTimelineStore } from './useTimelineStore'
import { useVideoLayerStore } from './useVideoLayerStore'
import { toast } from './useToastStore'

export type MediaCategory = 'all' | 'images' | 'audio' | 'video'

export interface MediaAsset {
  id: string
  name: string
  type: string
  size: number
  category: MediaCategory
  url: string // blob URL — regenerated on rehydration
  width?: number
  height?: number
  duration?: number
  addedAt: number
}

export type MediaTransitionType =
  | 'fade'
  | 'zoom-in'
  | 'zoom-out'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'ken-burns'
  | 'none'

export interface CanvasMediaItem {
  id: string
  assetId: string
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  rotation: number
  visible: boolean
  // Timeline frame range
  startFrame: number
  endFrame: number
  // Transitions
  enterTransition: MediaTransitionType
  exitTransition: MediaTransitionType
  transitionFrames: number // number of frames for each transition (e.g. 15 frames = 0.5s at 30fps)
  // Color replacement
  extractedColors: ExtractedColor[] | null
  colorMap: Record<string, string> // originalHex → replacementHex
  recoloredUrl: string | null // blob URL of recolored image (session-scoped)
  // Audio
  muted: boolean
  volume: number
  fadeInFrames: number
  fadeOutFrames: number
  loop: boolean
  // Mesh wireframe
  showMeshWireframe: boolean
  meshGridSpacing: number // 4–64, default 16
  // Creative treatment (Stock Media Intelligence)
  treatedUrl?: string | null
  blendMode?: string
  blur?: number
  blurType?: string
  motionBlurAngle?: number
  creativeTreatment?: string
  duotoneConfig?: { dark: string; light: string } | null
  colorGradeConfig?: Record<string, unknown> | null
  kenBurnsConfig?: Record<string, unknown> | null
  videoTrim?: { startTime: number; endTime: number } | null
  videoLoop?: { similarity: number } | null
  speedRamp?: Record<string, unknown> | null
}

interface MediaState {
  // Library of imported assets
  assets: MediaAsset[]

  // Media items placed on canvas
  canvasItems: CanvasMediaItem[]

  // Selection state
  selectedAssetId: string | null
  selectedCanvasItemId: string | null

  // Filter
  activeCategory: MediaCategory

  // Rehydration flag
  _rehydrated: boolean

  // Library actions
  addAsset: (asset: MediaAsset, blob: Blob) => void
  addAssets: (assets: MediaAsset[]) => void
  updateAsset: (id: string, updates: Partial<MediaAsset>) => void
  removeAsset: (id: string) => void
  setSelectedAssetId: (id: string | null) => void
  setActiveCategory: (category: MediaCategory) => void

  // Canvas actions
  addToCanvas: (assetId: string) => void
  /** Convenience: add asset to canvas with frame range, role-based transition, and zIndex in one call */
  addToCanvasWithTiming: (
    assetId: string,
    startFrame: number,
    endFrame: number,
    role?: string,
    transition?: MediaTransitionType,
  ) => void
  removeFromCanvas: (id: string) => void
  updateCanvasItem: (id: string, updates: Partial<CanvasMediaItem>) => void
  setSelectedCanvasItemId: (id: string | null) => void
  setCanvasItemTimeRange: (id: string, startFrame: number, endFrame: number) => void

  // Mesh wireframe actions
  toggleMeshWireframe: (itemId: string) => void
  setMeshGridSpacing: (itemId: string, spacing: number) => void

  // Color replacement actions
  setExtractedColors: (itemId: string, colors: ExtractedColor[]) => void
  setColorMapEntry: (itemId: string, originalHex: string, newHex: string) => void
  resetColorMapEntry: (itemId: string, originalHex: string) => void
  resetAllColors: (itemId: string) => void
  setRecoloredUrl: (itemId: string, url: string | null) => void

  // Rehydration — regenerate blob URLs from IndexedDB
  rehydrateUrls: () => Promise<void>

  // Computed
  getFilteredAssets: () => MediaAsset[]
  getCanvasImages: () => (CanvasMediaItem & { asset: MediaAsset })[]

  // Duplicate
  duplicateCanvasItem: (itemId: string) => void

  // Reset all state (for new project)
  reset: () => void
  loadFromSnapshot: (assets: MediaAsset[], canvasItems: CanvasMediaItem[]) => void
}

export const useMediaStore = create<MediaState>()(
  persist(
    immer((set, get) => ({
      assets: [],
      canvasItems: [],
      selectedAssetId: null,
      selectedCanvasItemId: null,
      activeCategory: 'all',
      _rehydrated: false,

      addAsset: (asset, blob) => {
        // Store blob in IndexedDB (fire-and-forget, don't block UI)
        saveMediaBlob(asset.id, blob).catch((err) => {
          console.error(err)
          toast.error('Failed to save media to local storage')
        })
        set((state) => {
          state.assets.unshift(asset)
        })
        toast.success('Media uploaded', 2000)
      },

      addAssets: (newAssets) =>
        set((state) => {
          state.assets.unshift(...newAssets)
        }),

      updateAsset: (id, updates) =>
        set((state) => {
          const asset = state.assets.find((a) => a.id === id)
          if (asset) {
            Object.assign(asset, updates)
          }
        }),

      removeAsset: (id) => {
        const asset = get().assets.find((a) => a.id === id)
        if (asset && asset.url) {
          URL.revokeObjectURL(asset.url)
          // Also remove from VideoLayerStore if it was a video
          if (asset.category === 'video') {
            const videoStore = useVideoLayerStore.getState()
            const videoEntry = videoStore.videos.find((v) => v.sourceUrl === asset.url)
            if (videoEntry) videoStore.removeVideo(videoEntry.id)
          }
        }
        // Delete from IndexedDB
        deleteMediaBlob(id).catch((err) => {
          console.error(err)
          toast.error('Failed to remove media from local storage')
        })
        set((state) => {
          state.assets = state.assets.filter((a) => a.id !== id)
          state.canvasItems = state.canvasItems.filter((c) => c.assetId !== id)
          if (state.selectedAssetId === id) {
            state.selectedAssetId = null
          }
        })
      },

      setSelectedAssetId: (id) =>
        set((state) => {
          state.selectedAssetId = id
        }),

      setActiveCategory: (category) =>
        set((state) => {
          state.activeCategory = category
        }),

      addToCanvas: (assetId) => {
        const asset = get().assets.find((a) => a.id === assetId)
        if (!asset) return

        const totalFrames = useTimelineStore.getState().totalFrames

        // For video files, add to VideoLayerStore
        if (asset.category === 'video') {
          const videoStore = useVideoLayerStore.getState()
          // Check if already added
          const alreadyExists = videoStore.videos.some((v) => v.sourceUrl === asset.url)
          if (!alreadyExists) {
            videoStore.addVideo({
              id: `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              sourceUrl: asset.url,
              name: asset.name,
              prompt: '',
              position: { x: 0, y: 0 },
              scale: 1,
              opacity: 1,
              zIndex: 3,
              visible: true,
              loop: false,
              durationSeconds: asset.duration ?? 10,
              fps: useTimelineStore.getState().fps,
              width: asset.width ?? 1920,
              height: asset.height ?? 1080,
            })
          }
        }

        // Add to canvasItems for all categories (images, video, audio)
        // Note: Images now use a canvas-relative rendering model (scale:1 = canvas size),
        // matching how VideoLayer works. No fit-scale computation needed here.
        set((state) => {
          const fps = useTimelineStore.getState().fps || 30
          const item: CanvasMediaItem = {
            id: `canvas_media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            assetId,
            position: { x: 0, y: 0 },
            scale: 1,
            opacity: 1,
            zIndex: asset.category === 'images' ? 5 : 3,
            rotation: 0,
            visible: true,
            startFrame: 0,
            endFrame: totalFrames,
            enterTransition: 'none',
            exitTransition: 'none',
            transitionFrames: Math.round(fps * 0.5), // 0.5s default
            muted: false,
            volume: 1,
            fadeInFrames: 0,
            fadeOutFrames: 0,
            loop: false,
            extractedColors: null,
            colorMap: {},
            recoloredUrl: null,
            showMeshWireframe: false,
            meshGridSpacing: 16,
          }
          state.canvasItems.push(item)
          state.selectedCanvasItemId = item.id
        })
      },

      addToCanvasWithTiming: (assetId, startFrame, endFrame, role, transition) => {
        // Add to canvas first
        get().addToCanvas(assetId)
        // Then update the newly created item with timing and transition
        const canvasItem = get().canvasItems.find((c) => c.assetId === assetId)
        if (canvasItem) {
          const defaultTransition = role === 'cutaway' ? 'ken-burns' : 'fade'
          get().updateCanvasItem(canvasItem.id, {
            startFrame,
            endFrame,
            enterTransition: transition || defaultTransition,
            exitTransition: 'fade',
            zIndex: role === 'background' ? 1 : role === 'overlay' ? 8 : 5,
          })
        }
      },

      removeFromCanvas: (id) =>
        set((state) => {
          state.canvasItems = state.canvasItems.filter((c) => c.id !== id)
          if (state.selectedCanvasItemId === id) {
            state.selectedCanvasItemId = null
          }
        }),

      updateCanvasItem: (id, updates) =>
        set((state) => {
          const item = state.canvasItems.find((c) => c.id === id)
          if (item) {
            Object.assign(item, updates)
          }
        }),

      setSelectedCanvasItemId: (id) =>
        set((state) => {
          state.selectedCanvasItemId = id
        }),

      setCanvasItemTimeRange: (id, startFrame, endFrame) =>
        set((state) => {
          const item = state.canvasItems.find((c) => c.id === id)
          if (item) {
            item.startFrame = startFrame
            item.endFrame = endFrame
          }
        }),

      // ── Mesh wireframe actions ──

      toggleMeshWireframe: (itemId) =>
        set((state) => {
          const item = state.canvasItems.find((c) => c.id === itemId)
          if (item) item.showMeshWireframe = !item.showMeshWireframe
        }),

      setMeshGridSpacing: (itemId, spacing) =>
        set((state) => {
          const item = state.canvasItems.find((c) => c.id === itemId)
          if (item) item.meshGridSpacing = Math.max(4, Math.min(64, spacing))
        }),

      // ── Color replacement actions ──

      setExtractedColors: (itemId, colors) =>
        set((state) => {
          const item = state.canvasItems.find((c) => c.id === itemId)
          if (item) item.extractedColors = colors
        }),

      setColorMapEntry: (itemId, originalHex, newHex) =>
        set((state) => {
          const item = state.canvasItems.find((c) => c.id === itemId)
          if (!item) return
          if (!item.colorMap) item.colorMap = {}
          item.colorMap[originalHex] = newHex
        }),

      resetColorMapEntry: (itemId, originalHex) => {
        const item = get().canvasItems.find((c) => c.id === itemId)
        if (item?.recoloredUrl) URL.revokeObjectURL(item.recoloredUrl)
        set((state) => {
          const it = state.canvasItems.find((c) => c.id === itemId)
          if (!it) return
          delete it.colorMap[originalHex]
          it.recoloredUrl = null
        })
      },

      resetAllColors: (itemId) => {
        const item = get().canvasItems.find((c) => c.id === itemId)
        if (item?.recoloredUrl) URL.revokeObjectURL(item.recoloredUrl)
        set((state) => {
          const it = state.canvasItems.find((c) => c.id === itemId)
          if (!it) return
          it.colorMap = {}
          it.recoloredUrl = null
        })
      },

      setRecoloredUrl: (itemId, url) => {
        // Revoke old URL before replacing
        const item = get().canvasItems.find((c) => c.id === itemId)
        if (item?.recoloredUrl && item.recoloredUrl !== url) {
          URL.revokeObjectURL(item.recoloredUrl)
        }
        set((state) => {
          const it = state.canvasItems.find((c) => c.id === itemId)
          if (it) it.recoloredUrl = url
        })
      },

      rehydrateUrls: async () => {
        const { assets } = get()
        const updatedAssets: MediaAsset[] = []
        const toRemove: string[] = []

        for (const asset of assets) {
          const blob = await getMediaBlob(asset.id)
          if (blob) {
            const url = URL.createObjectURL(blob)
            updatedAssets.push({ ...asset, url })
          } else {
            // Blob no longer in IndexedDB — mark for cleanup
            toRemove.push(asset.id)
          }
        }

        set((state) => {
          for (const updated of updatedAssets) {
            const idx = state.assets.findIndex((a) => a.id === updated.id)
            if (idx !== -1) {
              state.assets[idx].url = updated.url
            }
          }
          if (toRemove.length > 0) {
            state.assets = state.assets.filter((a) => !toRemove.includes(a.id))
            state.canvasItems = state.canvasItems.filter((c) => !toRemove.includes(c.assetId))
          }
          state._rehydrated = true
        })

        // Recompute recolored images for items with non-empty colorMaps
        const { canvasItems, assets: rehydratedAssets } = get()
        for (const item of canvasItems) {
          if (item.colorMap && Object.keys(item.colorMap).length > 0) {
            const asset = rehydratedAssets.find((a) => a.id === item.assetId)
            if (asset?.url) {
              applyColorMap(asset.url, item.colorMap)
                .then((blob) => {
                  const url = URL.createObjectURL(blob)
                  get().setRecoloredUrl(item.id, url)
                })
                .catch((err) => {
                  console.error(err)
                  toast.error('Failed to recolor image')
                })
            }
          }
        }
      },

      getFilteredAssets: () => {
        const { assets, activeCategory } = get()
        if (activeCategory === 'all') return assets
        return assets.filter((a) => a.category === activeCategory)
      },

      getCanvasImages: () => {
        const { canvasItems, assets } = get()
        return canvasItems
          .filter((item) => {
            const asset = assets.find((a) => a.id === item.assetId)
            return asset && asset.category === 'images'
          })
          .map((item) => ({
            ...item,
            asset: assets.find((a) => a.id === item.assetId)!,
          }))
      },

      duplicateCanvasItem: (itemId) =>
        set((state) => {
          const source = state.canvasItems.find((c) => c.id === itemId)
          if (!source) return
          const clone: CanvasMediaItem = {
            ...source,
            id: `canvas_media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            position: { x: source.position.x + 20, y: source.position.y + 20 },
            extractedColors: null,
            recoloredUrl: null,
          }
          state.canvasItems.push(clone)
          state.selectedCanvasItemId = clone.id
        }),

      // Reset all state (for new project)
      reset: () => {
        // Revoke existing blob URLs before clearing
        const { assets, canvasItems } = get()
        for (const asset of assets) {
          if (asset.url) URL.revokeObjectURL(asset.url)
        }
        for (const item of canvasItems) {
          if (item.recoloredUrl) URL.revokeObjectURL(item.recoloredUrl)
        }
        // Clear all blobs from IndexedDB
        clearAllMediaBlobs().catch((err) => {
          console.error(err)
          toast.error('Failed to clear local media storage')
        })
        set((state) => {
          state.assets = []
          state.canvasItems = []
          state.selectedAssetId = null
          state.selectedCanvasItemId = null
          state.activeCategory = 'all'
        })
      },

      loadFromSnapshot: (assets, canvasItems) =>
        set((state) => {
          state.assets = assets
          state.canvasItems = canvasItems
          state.selectedAssetId = null
          state.selectedCanvasItemId = null
          state.activeCategory = 'all'
        }),
    })),
    {
      name: 'proanimate-media',
      // Only persist metadata — not blob URLs (they're session-scoped)
      partialize: (state) => ({
        assets: state.assets.map((a) => ({ ...a, url: '' })),
        canvasItems: state.canvasItems.map((c) => ({
          ...c,
          extractedColors: null, // re-extract on demand
          recoloredUrl: null, // recompute from colorMap + original blob
        })),
      }),
      onRehydrateStorage: () => {
        // After zustand restores from localStorage, regenerate blob URLs from IndexedDB
        // and migrate old canvas items that are missing color fields
        return (state?: MediaState) => {
          if (state) {
            // Migrate old canvas items that don't have color/mesh fields
            for (const item of state.canvasItems) {
              if (item.colorMap === undefined) (item as any).colorMap = {}
              if (item.extractedColors === undefined) (item as any).extractedColors = null
              if (item.recoloredUrl === undefined) (item as any).recoloredUrl = null
              if ((item as any).showMeshWireframe === undefined) (item as any).showMeshWireframe = false
              if ((item as any).meshGridSpacing === undefined) (item as any).meshGridSpacing = 16
              if ((item as any).muted === undefined) (item as any).muted = false
              if ((item as any).volume === undefined) (item as any).volume = 1
              if ((item as any).fadeInFrames === undefined) (item as any).fadeInFrames = 0
              if ((item as any).fadeOutFrames === undefined) (item as any).fadeOutFrames = 0
              if ((item as any).loop === undefined) (item as any).loop = false
            }
            state.rehydrateUrls()
          }
        }
      },
    },
  ),
)
