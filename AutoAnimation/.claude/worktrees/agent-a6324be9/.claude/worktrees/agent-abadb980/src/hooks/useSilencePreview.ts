/**
 * useSilencePreview — Hook that computes silence/filler regions from transcript data.
 *
 * Re-computes when mode or threshold changes.
 */

import { useMemo } from 'react'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { getSilenceRemovalService } from '@/services/silenceRemoval'
import type { RemovalMode, AnalysisResult } from '@/types/silenceRemoval'

export function useSilencePreview(mode: RemovalMode | null) {
  const editedSegments = useTranscriptStore((s) => s.editedSegments)
  const silenceThreshold = useTranscriptStore((s) => s.silenceThreshold)
  const fillerWords = useTranscriptStore((s) => s.fillerWords)
  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const result = useMemo<AnalysisResult & { isComputing: boolean; totalDurationSec: number }>(() => {
    if (!mode || editedSegments.length === 0) {
      return {
        silences: [],
        fillers: [],
        totalRemovedSec: 0,
        edits: [],
        isComputing: false,
        totalDurationSec: totalFrames / fps,
      }
    }

    const words = editedSegments.flatMap((seg) => seg.words)
    if (words.length === 0) {
      return {
        silences: [],
        fillers: [],
        totalRemovedSec: 0,
        edits: [],
        isComputing: false,
        totalDurationSec: totalFrames / fps,
      }
    }

    const service = getSilenceRemovalService()
    const analysis = service.analyzeTranscript(
      words,
      mode,
      fps,
      silenceThreshold,
      fillerWords,
    )

    return {
      ...analysis,
      isComputing: false,
      totalDurationSec: totalFrames / fps,
    }
  }, [mode, editedSegments, silenceThreshold, fillerWords, fps, totalFrames])

  return {
    silences: result.silences,
    fillers: result.fillers,
    totalSaved: result.totalRemovedSec,
    edits: result.edits,
    isComputing: result.isComputing,
    estimatedFinalDuration: result.totalDurationSec - result.totalRemovedSec,
  }
}
