import { Film } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { VideosPanel } from '../panels/VideosPanel'

export default function VideoBrowserOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Video Browser" icon={Film} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <VideosPanel />
      </div>
    </CanvasOverlay>
  )
}
