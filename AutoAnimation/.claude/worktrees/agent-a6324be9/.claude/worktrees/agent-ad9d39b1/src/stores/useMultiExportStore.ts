/**
 * Multi-Export Store — Bulk export to multiple aspect ratios.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface ExportJob {
  aspectRatio: string
  status: 'pending' | 'rendering' | 'complete' | 'error'
  progress: number
  outputUrl: string | null
  outputSize: number | null
  error: string | null
}

interface MultiExportState {
  /** Selected aspect ratios for export */
  selectedAspects: string[]
  /** Whether smart reframing is enabled */
  smartReframe: boolean
  /** Per-format export jobs */
  jobs: ExportJob[]
  /** Overall progress (0-1) */
  overallProgress: number
  /** Whether export is in progress */
  isExporting: boolean

  // Actions
  toggleAspect: (aspect: string) => void
  setSelectedAspects: (aspects: string[]) => void
  setSmartReframe: (enabled: boolean) => void
  setJobs: (jobs: ExportJob[]) => void
  updateJob: (index: number, updates: Partial<ExportJob>) => void
  setIsExporting: (exporting: boolean) => void
  setOverallProgress: (progress: number) => void
  clearJobs: () => void
  reset: () => void
}

export const useMultiExportStore = create<MultiExportState>()(
  immer((set) => ({
    selectedAspects: [],
    smartReframe: true,
    jobs: [],
    overallProgress: 0,
    isExporting: false,

    toggleAspect: (aspect) =>
      set((s) => {
        const idx = s.selectedAspects.indexOf(aspect)
        if (idx >= 0) {
          s.selectedAspects.splice(idx, 1)
        } else {
          s.selectedAspects.push(aspect)
        }
      }),

    setSelectedAspects: (aspects) =>
      set((s) => {
        s.selectedAspects = aspects
      }),

    setSmartReframe: (enabled) =>
      set((s) => {
        s.smartReframe = enabled
      }),

    setJobs: (jobs) =>
      set((s) => {
        s.jobs = jobs
      }),

    updateJob: (index, updates) =>
      set((s) => {
        if (index >= 0 && index < s.jobs.length) {
          Object.assign(s.jobs[index], updates)
        }
      }),

    setIsExporting: (exporting) =>
      set((s) => {
        s.isExporting = exporting
      }),

    setOverallProgress: (progress) =>
      set((s) => {
        s.overallProgress = progress
      }),

    clearJobs: () =>
      set((s) => {
        for (const job of s.jobs) {
          if (job.outputUrl) URL.revokeObjectURL(job.outputUrl)
        }
        s.jobs = []
        s.overallProgress = 0
      }),

    reset: () =>
      set((s) => {
        for (const job of s.jobs) {
          if (job.outputUrl) URL.revokeObjectURL(job.outputUrl)
        }
        s.selectedAspects = []
        s.smartReframe = true
        s.jobs = []
        s.overallProgress = 0
        s.isExporting = false
      }),
  }))
)
