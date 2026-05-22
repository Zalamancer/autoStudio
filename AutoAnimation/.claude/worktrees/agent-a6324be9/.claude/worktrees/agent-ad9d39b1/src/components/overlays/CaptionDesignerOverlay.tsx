import { Subtitles } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { CaptionsPanel } from '../panels/CaptionsPanel'

export default function CaptionDesignerOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Caption Designer" icon={Subtitles} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <CaptionsPanel />
      </div>
    </CanvasOverlay>
  )
}
