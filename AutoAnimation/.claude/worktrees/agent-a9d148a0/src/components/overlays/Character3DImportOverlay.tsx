import { Box } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { Character3DPanel } from '../panels/Character3DPanel'

export default function Character3DImportOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="3D Character Import" icon={Box} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <Character3DPanel />
      </div>
    </CanvasOverlay>
  )
}
