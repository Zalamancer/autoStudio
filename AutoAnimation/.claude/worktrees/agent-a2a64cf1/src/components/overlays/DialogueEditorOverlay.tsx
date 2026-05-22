import { MessageSquare } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { DialoguePanel } from '../panels/DialoguePanel'

export default function DialogueEditorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Dialogue Editor" icon={MessageSquare} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <DialoguePanel />
      </div>
    </CanvasOverlay>
  )
}
