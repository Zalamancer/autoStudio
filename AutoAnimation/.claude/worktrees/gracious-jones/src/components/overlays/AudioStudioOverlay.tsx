import { lazy, Suspense } from 'react'
import { Music, Loader2 } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'

const SoundEffectsPanel = lazy(() =>
  import('../panels/SoundEffectsPanel').then((m) => ({ default: m.SoundEffectsPanel }))
)

export default function AudioStudioOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Audio Studio" icon={Music} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          }
        >
          <SoundEffectsPanel />
        </Suspense>
      </div>
    </CanvasOverlay>
  )
}
