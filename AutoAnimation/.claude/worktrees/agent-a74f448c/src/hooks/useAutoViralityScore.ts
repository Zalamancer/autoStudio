/**
 * useAutoViralityScore -- subscribes to relevant store changes and
 * auto-triggers virality scoring with a 2-second debounce.
 *
 * Uses hash-based deduplication to avoid re-scoring when the project
 * state hasn't meaningfully changed (e.g., undo then redo).
 */

import { useEffect, useRef } from 'react'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useViralityStore } from '@/stores/useViralityStore'
import { computeProjectStateHash } from '@/services/viralityStateHash'

export function useAutoViralityScore() {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Subscribe to store change signals (we only care that something changed, not the values)
  const dialogueCount = useMultiCharacterStore((s) => s.dialogueLines.length)
  const charCount = useMultiCharacterStore((s) => s.characters.length)
  const overlayCount = useTextOverlayStore((s) => s.overlays.length)
  const mediaCount = useMediaStore((s) => s.canvasItems.length)
  const templateCount = useHTMLTemplateLayerStore((s) => s.templates.length)
  const svgObjectCount = useSVGObjectStore((s) => s.composition?.objects.length ?? 0)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const scoringConfig = useViralityStore((s) => s.scoringConfig)
  const isScoring = useViralityStore((s) => s.isScoring)
  const lastScoredHash = useViralityStore((s) => s.lastScoredHash)

  useEffect(() => {
    if (!scoringConfig.autoScore) return

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      // Don't trigger if already scoring
      if (useViralityStore.getState().isScoring) return

      // Compute hash and check if project state actually changed
      const hash = computeProjectStateHash()
      const currentLastHash = useViralityStore.getState().lastScoredHash

      if (hash === currentLastHash) return

      // Check if we have a cached score for this hash
      const cached = useViralityStore.getState().getCachedScore(hash)
      if (cached) {
        useViralityStore.getState().setCurrentScore(cached)
        useViralityStore.getState().setLastScoredHash(hash)
        return
      }

      // Trigger scoring
      useViralityStore.getState().triggerScore()
    }, scoringConfig.debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [
    dialogueCount,
    charCount,
    overlayCount,
    mediaCount,
    templateCount,
    svgObjectCount,
    totalFrames,
    scoringConfig.autoScore,
    scoringConfig.debounceMs,
    isScoring,
    lastScoredHash,
  ])
}
