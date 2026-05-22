import { LayoutTemplate } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { TemplatesLibraryPanel } from '../panels/TemplatesLibraryPanel'

export default function TemplateBrowserOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Template Browser" icon={LayoutTemplate} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <TemplatesLibraryPanel />
      </div>
    </CanvasOverlay>
  )
}
