import { useState, useCallback, useRef } from 'react'
import { Monitor, Play, Pause } from 'lucide-react'
import { VideoCanvas } from '@/components/canvas'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useEditorStore } from '@/stores'

interface PreviewNodeProps {
  zoom: number
  position: { x: number; y: number }
  onStartDrag: (e: React.MouseEvent) => void
}

export function PreviewNode({ zoom, position, onStartDrag }: PreviewNodeProps) {
  const [size, setSize] = useState({ w: 480, h: 270 })
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const togglePlayback = usePlaybackStore((s) => s.togglePlayback)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const resizingRef = useRef(false)

  // Compute the aspect ratio for sizing
  const [aw, ah] = aspectRatio.split(':').map(Number)
  const ratio = aw / ah

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    resizingRef.current = true
    const startX = e.clientX
    const startW = size.w

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const dw = (ev.clientX - startX) / zoom
      const newW = Math.max(240, Math.min(800, startW + dw))
      setSize({ w: newW, h: newW / ratio })
    }

    const onUp = () => {
      resizingRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [size.w, zoom, ratio])

  return (
    <div
      className="absolute select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: `scale(${1 / zoom})`,
        transformOrigin: 'top left',
      }}
    >
      <div
        className="relative rounded-xl overflow-hidden bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] shadow-lg"
        style={{ width: size.w, height: size.h + 36 }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 h-9 bg-zinc-800/60 border-b border-white/5 cursor-grab active:cursor-grabbing"
          onMouseDown={onStartDrag}
        >
          <Monitor size={13} className="text-zinc-400" />
          <span className="text-[11px] font-medium text-zinc-400 flex-1">Preview</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              togglePlayback()
            }}
            className="p-1 rounded hover:bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>

        {/* Canvas container */}
        <div
          className="relative overflow-hidden bg-zinc-950"
          style={{ width: size.w, height: size.h }}
        >
          <div
            style={{
              transform: `scale(${size.w / 1920})`,
              transformOrigin: 'top left',
              width: 1920,
              height: 1920 / ratio,
            }}
          >
            <VideoCanvas />
          </div>
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg viewBox="0 0 16 16" className="w-full h-full text-zinc-600">
            <path d="M14 14L6 14L14 6Z" fill="currentColor" opacity={0.4} />
          </svg>
        </div>
      </div>
    </div>
  )
}
