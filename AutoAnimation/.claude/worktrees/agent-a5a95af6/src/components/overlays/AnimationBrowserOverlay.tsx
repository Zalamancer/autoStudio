import { Play } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { AnimationsPanel } from '../panels/AnimationsPanel'

export default function AnimationBrowserOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Animation Browser" icon={Play} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <AnimationsPanel />
      </div>
    </CanvasOverlay>
  )
}
