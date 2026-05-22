/**
 * Silence & Filler Removal Types
 */

export interface SilenceRegion {
  startTime: number
  endTime: number
  duration: number
  type: 'silence'
}

export interface FillerRegion {
  startTime: number
  endTime: number
  word: string
  type: 'filler'
}

export type RemovalMode = 'natural' | 'fast' | 'extra-fast'

export interface TimelineEdit {
  type: 'remove'
  startFrame: number
  endFrame: number
  reason: string
}

export interface AnalysisResult {
  silences: SilenceRegion[]
  fillers: FillerRegion[]
  totalRemovedSec: number
  edits: TimelineEdit[]
}
