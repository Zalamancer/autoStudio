import { Pen } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { SVGArtPanel } from '../panels/SVGArtPanel'

export default function SVGArtGeneratorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="SVG Art Generator" icon={Pen} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <SVGArtPanel />
      </div>
    </CanvasOverlay>
  )
}
