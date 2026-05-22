import { lazy, Suspense } from 'react'
import { Monitor, Loader2 } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'

const ScreenRecordPanel = lazy(() =>
  import('../panels/ScreenRecordPanel').then((m) => ({ default: m.ScreenRecordPanel }))
)

export default function ScreenRecorderOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Screen Recorder" icon={Monitor} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          }
        >
          <ScreenRecordPanel />
        </Suspense>
      </div>
    </CanvasOverlay>
  )
}
