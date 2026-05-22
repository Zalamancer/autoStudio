import { useCallback, memo } from 'react'
import { useManimExplainStore } from '@/stores/useManimExplainStore'
import { useManimStore } from '@/stores/useManimStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'

/**
 * Renders clickable highlight regions over Manim video elements.
 * When clicked, opens the explain overlay with context for that element.
 */
export const ManimInteractiveElements = memo(function ManimInteractiveElements() {
  const videoMetadata = useManimStore((s) => s.videoMetadata)
  const settings = useManimStore((s) => s.settings)
  const currentTime = usePlaybackStore((s) => s.currentTime)
  const { isExplainOpen, openExplain } = useManimExplainStore()

  const handlePause = useCallback(() => {
    if (!videoMetadata || !settings?.enableInteractiveAnnotations) return

    // Find the annotation closest to the current time
    const annotation = videoMetadata.timeline.find(
      (a) => currentTime >= a.startTime && currentTime < a.endTime,
    )

    if (annotation) {
      usePlaybackStore.getState().pause()
      openExplain(annotation.context, annotation.sceneIndex)
    }
  }, [videoMetadata, settings, currentTime, openExplain])

  // Don't render anything if no metadata or annotations disabled
  if (!videoMetadata || !settings?.enableInteractiveAnnotations) return null

  // Don't render the click target if explain is already open
  if (isExplainOpen) return null

  return (
    <div
      className="absolute inset-0 z-30 cursor-help"
      onClick={handlePause}
      title="Click to pause and explore this concept"
    />
  )
})
