import { Type } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { TextPanel } from '../panels/TextPanel'

export default function TextCreatorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Text Creator" icon={Type} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <TextPanel />
      </div>
    </CanvasOverlay>
  )
}
