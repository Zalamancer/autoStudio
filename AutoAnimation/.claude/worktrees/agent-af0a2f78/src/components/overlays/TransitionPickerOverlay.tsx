import { Shuffle } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { TransitionsPanel } from '../panels/TransitionsPanel'

export default function TransitionPickerOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Transition Picker" icon={Shuffle} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <TransitionsPanel />
      </div>
    </CanvasOverlay>
  )
}
