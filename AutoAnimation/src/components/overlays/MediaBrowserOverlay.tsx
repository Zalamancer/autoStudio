import { Image } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { MediaPanel } from '../panels/MediaPanel'

export default function MediaBrowserOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Media Browser" icon={Image} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <MediaPanel />
      </div>
    </CanvasOverlay>
  )
}
