import { FileText } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { ScriptsPanel } from '../panels/ScriptsPanel'

export default function ScriptGeneratorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Script Generator" icon={FileText} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <ScriptsPanel />
      </div>
    </CanvasOverlay>
  )
}
