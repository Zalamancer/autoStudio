import { useMemo } from 'react'
import { Film, Eye, EyeOff, RotateCcw, Trash2 } from 'lucide-react'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { PanelSlider } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'

export function VideoPropertiesPanel() {
  const selectedVideoId = useVideoLayerStore((s) => s.selectedVideoId)
  const videos = useVideoLayerStore((s) => s.videos)
  const updateVideo = useVideoLayerStore((s) => s.updateVideo)
  const removeVideo = useVideoLayerStore((s) => s.removeVideo)

  const liveTransform = useLiveTransformStore((s) => s.active)

  const video = videos.find((v) => v.id === selectedVideoId)

  const isLiveActive = liveTransform?.type === 'video' && liveTransform?.id === video?.id
  const displayValues = useMemo(() => {
    if (!video) return null
    if (isLiveActive && liveTransform) {
      return {
        x: liveTransform.x,
        y: liveTransform.y,
        rotation: liveTransform.rotation,
        scale: liveTransform.scale,
        opacity: video.opacity,
        zIndex: video.zIndex,
      }
    }
    return {
      x: video.position.x,
      y: video.position.y,
      rotation: video.rotation,
      scale: video.scale,
      opacity: video.opacity,
      zIndex: video.zIndex,
    }
  }, [video, isLiveActive, liveTransform])

  if (!video || !displayValues) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Film size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No video selected</p>
        <p className="text-[10px] mt-1">Click a video on the canvas to edit its properties</p>
      </div>
    )
  }

  const handleReset = () => {
    updateVideo(video.id, {
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: 1,
      opacity: 1,
      zIndex: 5,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-[#2a2a2a] rounded-lg overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
            <Film size={24} className="text-[#4a7eff]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 truncate">{video.name || 'Video'}</p>
            <p className="text-[10px] text-zinc-500">{video.width} x {video.height}</p>
            <p className="text-[10px] text-zinc-600">{video.durationSeconds.toFixed(1)}s</p>
          </div>
        </div>
      </div>

      {/* ── Transform ──────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-white text-base font-semibold">Transform</h2>
            {isLiveActive && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateVideo(video.id, { visible: !video.visible })}
              className={cn(
                'p-1 rounded transition-colors',
                video.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
              )}
              title={video.visible ? 'Hide' : 'Show'}
            >
              {video.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={handleReset}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset transform"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        <div className={cn('space-y-3', !video.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <PanelSlider
            label="X"
            value={displayValues.x}
            onChange={(v) => updateVideo(video.id, { position: { ...video.position, x: v } })}
            min={-5000}
            max={5000}
            step={1}
            precision={1}
            compact
          />
          <PanelSlider
            label="Y"
            value={displayValues.y}
            onChange={(v) => updateVideo(video.id, { position: { ...video.position, y: v } })}
            min={-5000}
            max={5000}
            step={1}
            precision={1}
            compact
          />

          {/* Rotation */}
          <PanelSlider
            label="Rotation"
            value={displayValues.rotation}
            onChange={(v) => updateVideo(video.id, { rotation: v })}
            min={-180}
            max={180}
            step={1}
            suffix="°"
          />

          {/* Scale */}
          <PanelSlider
            label="Scale"
            value={displayValues.scale * 100}
            onChange={(v) => updateVideo(video.id, { scale: Math.max(0.01, v / 100) })}
            min={1}
            max={1000}
            step={1}
            suffix="%"
          />

          {/* Opacity */}
          <PanelSlider
            label="Opacity"
            value={displayValues.opacity * 100}
            onChange={(v) => updateVideo(video.id, { opacity: Math.min(1, Math.max(0, v / 100)) })}
            min={0}
            max={100}
            step={1}
            suffix="%"
          />

          {/* Z-Index */}
          <PanelSlider
            label="Z-Index"
            value={displayValues.zIndex}
            onChange={(v) => updateVideo(video.id, { zIndex: Math.round(v) })}
            min={-100}
            max={100}
            step={1}
          />
        </div>
      </div>

      {/* ── Settings ───────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Settings</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm w-20 shrink-0">Loop</span>
            <button
              onClick={() => updateVideo(video.id, { loop: !video.loop })}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors',
                video.loop ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                  video.loop && 'translate-x-4',
                )}
              />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm w-20 shrink-0">Visible</span>
            <button
              onClick={() => updateVideo(video.id, { visible: !video.visible })}
              className={cn(
                'relative w-10 h-6 rounded-full transition-colors',
                video.visible ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                  video.visible && 'translate-x-4',
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="p-4">
        <button
          onClick={() => removeVideo(video.id)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600/10 text-red-400 text-sm rounded-lg hover:bg-red-600/20 transition-colors"
        >
          <Trash2 size={14} />
          Remove Video
        </button>
      </div>
    </div>
  )
}
