import { ZoomIn, ZoomOut } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { useTimelineStore } from '@/stores'

export function ZoomControls() {
  const zoom = useTimelineStore((s) => s.zoom)
  const setZoom = useTimelineStore((s) => s.setZoom)

  const handleZoomIn = () => {
    setZoom(zoom * 1.2)
  }

  const handleZoomOut = () => {
    setZoom(zoom / 1.2)
  }

  return (
    <div className="flex items-center gap-1">
      <IconButton
        icon={ZoomOut}
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        tooltip="Zoom out"
      />
      <span className="text-xs text-zinc-500 w-12 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <IconButton
        icon={ZoomIn}
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        tooltip="Zoom in"
      />
    </div>
  )
}
