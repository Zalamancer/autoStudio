import { lazy, Suspense } from 'react'
import { Clapperboard, Loader2 } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'

const OrchestratorPanel = lazy(() =>
  import('@/components/panels/orchestrator/OrchestratorPanel').then((m) => ({ default: m.OrchestratorPanel }))
)

export default function AIDirectorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="AI Director" icon={Clapperboard} onClose={onClose}>
      <div className="h-full overflow-hidden p-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-zinc-500" />
            </div>
          }
        >
          <OrchestratorPanel />
        </Suspense>
      </div>
    </CanvasOverlay>
  )
}
