import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MotionGraphicRegistration } from '@/types/motionGraphic'

// ── Types ────────────────────────────────────────────────────────────

export type MetricName = 'quality'

export const METRICS: { key: MetricName; label: string; question: string }[] = [
  { key: 'quality', label: 'Quality', question: 'Would you ship this?' },
]

export interface TemplateScores {
  quality: number
}

export interface TemplateRating {
  verdict: 'liked' | 'disliked'
  scores: TemplateScores | null
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Shuffle array (Fisher-Yates) — used to randomize metric order per template */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function deriveVerdict(scores: TemplateScores): 'liked' | 'disliked' {
  return scores.quality >= 3 ? 'liked' : 'disliked'
}

/** Save a single rating to Supabase immediately */
async function saveToSupabase(templateId: string, verdict: string, scores: TemplateScores) {
  try {
    await fetch('/api/template-ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, verdict, scores }),
    })
  } catch (err) {
    console.warn('[Ratings] Supabase save failed, localStorage backup active:', err)
  }
}

/** Load all ratings from Supabase on startup */
async function loadFromSupabase(): Promise<Record<string, TemplateRating> | null> {
  try {
    const res = await fetch('/api/template-ratings')
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ── Calibration anchors ──────────────────────────────────────────────

export const CALIBRATION_ANCHORS = [
  { score: 1, label: '1 — Bad', description: "You'd be embarrassed to ship this. Broken timing, ugly, or boring." },
  {
    score: 2,
    label: '2 — Below avg',
    description: "It works but you wouldn't choose it. Nothing wrong, nothing memorable.",
  },
  { score: 3, label: '3 — Above avg', description: "You'd use this in a real video. Solid, well-timed, pleasant." },
  {
    score: 4,
    label: '4 — Great',
    description: "You'd show this to someone to impress them. Makes you think 'how did they do that.'",
  },
]

// ── Store ────────────────────────────────────────────────────────────

interface TemplateRatingState {
  // Rating mode
  active: boolean
  calibrating: boolean // True during anchor calibration phase
  calibrationIndex: number
  templates: MotionGraphicRegistration[]
  currentIndex: number
  metricOrder: MetricName[]
  currentMetricIdx: number
  pendingScores: Partial<TemplateScores>

  // All ratings
  ratings: Record<string, TemplateRating>

  // Actions
  startRating: (templates: MotionGraphicRegistration[]) => void
  advanceCalibration: () => void
  stopRating: () => void
  rateCurrentMetric: (score: 1 | 2 | 3 | 4) => void
  nextMetric: () => void
  prevMetric: () => void
  skipTemplate: () => void
  prevTemplate: () => void
  rateAllMetrics: (score: 1 | 2 | 3 | 4) => void
  loadRatings: (data: Record<string, TemplateRating>) => void
  exportRatings: () => Record<string, TemplateRating>
  clearAllRatings: () => Promise<void>
  hydrateFromSupabase: () => Promise<void>
}

export const useTemplateRatingStore = create<TemplateRatingState>()(
  persist(
    (set, get) => ({
      active: false,
      calibrating: false,
      calibrationIndex: 0,
      templates: [],
      currentIndex: 0,
      metricOrder: [],
      currentMetricIdx: 0,
      pendingScores: {},
      ratings: {},

      startRating: (templates) => {
        set({
          active: true,
          calibrating: true,
          calibrationIndex: 0,
          templates,
          currentIndex: 0,
          metricOrder: shuffle(METRICS.map((m) => m.key)),
          currentMetricIdx: 0,
          pendingScores: {},
        })
      },

      advanceCalibration: () => {
        const { calibrationIndex } = get()
        const nextIdx = calibrationIndex + 1
        if (nextIdx >= CALIBRATION_ANCHORS.length) {
          set({ calibrating: false, calibrationIndex: 0 })
        } else {
          set({ calibrationIndex: nextIdx })
        }
      },

      stopRating: () => {
        set({ active: false, templates: [], currentIndex: 0 })
      },

      rateCurrentMetric: (score) => {
        const { metricOrder, currentMetricIdx, pendingScores, templates, currentIndex, ratings } = get()
        const metricKey = metricOrder[currentMetricIdx]
        const newScores = { ...pendingScores, [metricKey]: score }

        // If all 5 metrics rated, save and advance to next template
        if (currentMetricIdx >= metricOrder.length - 1) {
          const fullScores = newScores as TemplateScores
          const template = templates[currentIndex]
          if (template) {
            const verdict = deriveVerdict(fullScores)
            const newRatings = {
              ...ratings,
              [template.id]: { verdict, scores: fullScores },
            }

            // Save to Supabase immediately (fire-and-forget)
            saveToSupabase(template.id, verdict, fullScores)

            const nextIdx = currentIndex + 1
            if (nextIdx >= templates.length) {
              // All templates rated
              set({ ratings: newRatings, active: false, pendingScores: {} })
            } else {
              // Next template with new randomized metric order
              set({
                ratings: newRatings,
                currentIndex: nextIdx,
                metricOrder: shuffle(METRICS.map((m) => m.key)),
                currentMetricIdx: 0,
                pendingScores: {},
              })
            }
          }
        } else {
          // Advance to next metric
          set({
            pendingScores: newScores,
            currentMetricIdx: currentMetricIdx + 1,
          })
        }
      },

      nextMetric: () => {
        const { currentMetricIdx, metricOrder } = get()
        if (currentMetricIdx < metricOrder.length - 1) {
          set({ currentMetricIdx: currentMetricIdx + 1 })
        }
      },

      prevMetric: () => {
        const { currentMetricIdx } = get()
        if (currentMetricIdx > 0) {
          set({ currentMetricIdx: currentMetricIdx - 1 })
        }
      },

      skipTemplate: () => {
        const { currentIndex, templates } = get()
        const nextIdx = currentIndex + 1
        if (nextIdx >= templates.length) {
          set({ active: false })
        } else {
          set({
            currentIndex: nextIdx,
            metricOrder: shuffle(METRICS.map((m) => m.key)),
            currentMetricIdx: 0,
            pendingScores: {},
          })
        }
      },

      prevTemplate: () => {
        const { currentIndex } = get()
        if (currentIndex > 0) {
          set({
            currentIndex: currentIndex - 1,
            metricOrder: shuffle(METRICS.map((m) => m.key)),
            currentMetricIdx: 0,
            pendingScores: {},
          })
        }
      },

      rateAllMetrics: (score) => {
        const { templates, currentIndex, ratings } = get()
        const template = templates[currentIndex]
        if (!template) return
        const fullScores: TemplateScores = { quality: score }
        const verdict = deriveVerdict(fullScores)
        const newRatings = { ...ratings, [template.id]: { verdict, scores: fullScores } }
        saveToSupabase(template.id, verdict, fullScores)
        const nextIdx = currentIndex + 1
        if (nextIdx >= templates.length) {
          set({ ratings: newRatings, active: false, pendingScores: {} })
        } else {
          set({
            ratings: newRatings,
            currentIndex: nextIdx,
            metricOrder: shuffle(METRICS.map((m) => m.key)),
            currentMetricIdx: 0,
            pendingScores: {},
          })
        }
      },

      loadRatings: (data) => {
        set({ ratings: data })
      },

      exportRatings: () => {
        return get().ratings
      },

      /** Clear all ratings (localStorage + Supabase) */
      clearAllRatings: async () => {
        set({ ratings: {}, active: false, templates: [], currentIndex: 0 })
        try {
          await fetch('/api/template-ratings', { method: 'DELETE' })
          console.log('[Ratings] All ratings cleared from Supabase + localStorage')
        } catch (err) {
          console.warn('[Ratings] Supabase clear failed:', err)
        }
      },

      /** Load ratings from Supabase (called on app init) */
      hydrateFromSupabase: async () => {
        const remote = await loadFromSupabase()
        if (remote && Object.keys(remote).length > 0) {
          set((s) => ({ ratings: { ...remote, ...s.ratings } }))
          console.log(`[Ratings] Loaded ${Object.keys(remote).length} ratings from Supabase`)
        }
      },
    }),
    {
      name: 'template-ratings-store',
      partialize: (state) => ({ ratings: state.ratings }),
    },
  ),
)

// Auto-hydrate from Supabase on load
useTemplateRatingStore.getState().hydrateFromSupabase()
