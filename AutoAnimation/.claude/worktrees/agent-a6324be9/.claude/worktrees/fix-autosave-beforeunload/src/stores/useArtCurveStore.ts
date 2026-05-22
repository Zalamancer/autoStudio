import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import type { ArtCurve, ArtCurveComposition } from '@/types/artCurves'
import { generateArtCurves } from '@/services/artCurveGenerator'

interface ArtCurveState {
  compositions: ArtCurveComposition[]
  selectedCompositionId: string | null

  addComposition: (opts: {
    palette: string[]
    complexity: number
    animated: boolean
    seed: number
    globalWidthStart: number
    globalWidthMid: number
    globalWidthEnd: number
  }) => void
  removeComposition: (id: string) => void
  updateComposition: (id: string, updates: Partial<ArtCurveComposition>) => void
  updateCurve: (compositionId: string, curveId: string, updates: Partial<ArtCurve>) => void
  setSelectedCompositionId: (id: string | null) => void
  clearAll: () => void
}

export const useArtCurveStore = create<ArtCurveState>()(
  immer((set) => ({
    compositions: [],
    selectedCompositionId: null,

    addComposition: (opts) =>
      set((state) => {
        const { totalFrames } = useTimelineStore.getState()
        const id = `art-curve-${Date.now()}`
        const curves = generateArtCurves({
          style: 'swirl',
          width: 800,
          height: 600,
          palette: opts.palette,
          complexity: opts.complexity,
          seed: opts.seed,
          animated: opts.animated,
          widthStart: opts.globalWidthStart,
          widthMid: opts.globalWidthMid,
          widthEnd: opts.globalWidthEnd,
        })

        const comp: ArtCurveComposition = {
          id,
          name: 'Swirl Curve',
          curves,
          palette: opts.palette,
          animated: opts.animated,
          seed: opts.seed,
          style: 'swirl',
          complexity: opts.complexity,
          globalWidthStart: opts.globalWidthStart,
          globalWidthMid: opts.globalWidthMid,
          globalWidthEnd: opts.globalWidthEnd,
          bgColor: '#000000',
          bgTransparent: true,
          position: { x: 100, y: 100 },
          scale: 1,
          opacity: 1,
          rotation: 0,
          zIndex: 6.3,
          visible: true,
          startFrame: 0,
          endFrame: totalFrames,
        }

        state.compositions.push(comp)
        state.selectedCompositionId = id
      }),

    removeComposition: (id) =>
      set((state) => {
        state.compositions = state.compositions.filter((c) => c.id !== id)
        if (state.selectedCompositionId === id) {
          state.selectedCompositionId = null
        }
      }),

    updateComposition: (id, updates) =>
      set((state) => {
        const comp = state.compositions.find((c) => c.id === id)
        if (comp) {
          Object.assign(comp, updates)
        }
      }),

    updateCurve: (compositionId, curveId, updates) =>
      set((state) => {
        const comp = state.compositions.find((c) => c.id === compositionId)
        if (!comp) return
        const curve = comp.curves.find((c) => c.id === curveId)
        if (curve) {
          Object.assign(curve, updates)
        }
      }),

    setSelectedCompositionId: (id) =>
      set((state) => {
        state.selectedCompositionId = id
      }),

    clearAll: () =>
      set((state) => {
        state.compositions = []
        state.selectedCompositionId = null
      }),
  }))
)
