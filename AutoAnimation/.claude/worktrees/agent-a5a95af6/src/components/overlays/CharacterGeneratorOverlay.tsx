import { useCallback } from 'react'
import { Wand2 } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { NB2ImageViewer } from '../canvas/NB2ImageViewer'
import { useNB2Store } from '@/stores/useNB2Store'

export default function CharacterGeneratorOverlay({ onClose }: { onClose: () => void }) {
  const isRunning = useNB2Store((s) => s.isRunning)
  const prompt = useNB2Store((s) => s.prompt)

  const handleClose = useCallback(() => {
    const store = useNB2Store.getState()
    // If the pipeline was already saved (result is null after save), skip the
    // destructive configStore clear — sprites were just written there by save().
    // Only do a full reset (clearing configStore) if there's unsaved work.
    if (store.result) {
      store.reset()
    } else {
      store.resetPipelineState()
    }
    onClose()
  }, [onClose])

  const handleRetry = useCallback(() => {
    useNB2Store.getState().generate()
  }, [])

  const canRetry = !isRunning && prompt.trim().length > 0

  return (
    <CanvasOverlay
      title="AI Character Generator"
      icon={Wand2}
      onClose={handleClose}
      onRetry={handleRetry}
      retryDisabled={!canRetry}
    >
      <NB2ImageViewer />
    </CanvasOverlay>
  )
}
