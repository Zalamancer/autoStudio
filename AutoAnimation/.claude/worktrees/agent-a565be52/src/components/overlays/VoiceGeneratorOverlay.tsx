import { Mic } from 'lucide-react'
import { CanvasOverlay } from '../canvas/CanvasOverlay'
import { VoicesPanel } from '../panels/VoicesPanel'

export default function VoiceGeneratorOverlay({ onClose }: { onClose: () => void }) {
  return (
    <CanvasOverlay title="Voice Generator" icon={Mic} onClose={onClose}>
      <div className="h-full overflow-y-auto">
        <VoicesPanel />
      </div>
    </CanvasOverlay>
  )
}
