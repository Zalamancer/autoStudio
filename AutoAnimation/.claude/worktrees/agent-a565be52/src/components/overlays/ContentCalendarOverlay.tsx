import { Calendar } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { ContentCalendarPanel } from '../panels/ContentCalendarPanel'

export default function ContentCalendarOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Content Calendar" icon={Calendar} onClose={onClose}>
      <ContentCalendarPanel />
    </CanvasOverlay>
  )
}
