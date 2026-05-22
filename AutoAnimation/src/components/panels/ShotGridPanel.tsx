/**
 * Shot Grid panel — 4x4 grid of shot type cards for quick preset application.
 */

import { Grid3X3, Film } from 'lucide-react'
import { useCinemaStore } from '@/stores/useCinemaStore'
import { useCameraStore } from '@/stores/useCameraStore'
import { usePlaybackStore } from '@/stores'
import { CINEMA_PRESETS } from '@/data/cinemaPresets'

export function ShotGridPanel() {
  const store = useCinemaStore()
  const cameraStore = useCameraStore()
  const totalFrames = usePlaybackStore((s) => Math.round(s.duration * s.fps))

  const handleApply = (presetId: string) => {
    const preset = CINEMA_PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    store.applyPreset(presetId)

    if (preset.opticalSettings) {
      store.setOptical(preset.opticalSettings)
    }

    const frames = totalFrames || 300
    const cameraKeyframes = preset.keyframes.map((kf) => ({
      frame: Math.round((kf.framePercent / 100) * (frames - 1)),
      zoom: kf.zoom,
      panX: kf.position.x,
      panY: kf.position.y,
      rotation: kf.rotation.z,
      easing: kf.easing as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out',
    }))

    cameraStore.setKeyframes(cameraKeyframes)
    cameraStore.setEnabled(true)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Grid3X3 size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-zinc-200">Shot Grid</span>
        </div>
        <p className="text-[10px] text-zinc-500 mt-1">Click a shot type to apply camera motion</p>
      </div>

      {/* 4x4 Grid */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-4 gap-1.5">
          {store.shotGridEntries.map((entry) => {
            const preset = CINEMA_PRESETS.find((p) => p.id === entry.presetId)
            const isActive = store.activePresetId === entry.presetId

            return (
              <button
                key={entry.id}
                onClick={() => handleApply(entry.presetId)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                  isActive
                    ? 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30'
                    : 'border-white/5 bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-white/10'
                }`}
                title={preset?.description ?? entry.label}
              >
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center mb-1"
                  style={{ backgroundColor: entry.thumbnailColor + '30' }}
                >
                  <Film size={14} style={{ color: entry.thumbnailColor }} />
                </div>
                <span className={`text-[9px] font-medium text-center leading-tight ${
                  isActive ? 'text-amber-300' : 'text-zinc-400'
                }`}>
                  {entry.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Preset details */}
      {store.activePresetId && (
        <div className="px-3 pb-3">
          <div className="bg-zinc-800/50 rounded-lg p-2.5 border border-white/5">
            {(() => {
              const p = CINEMA_PRESETS.find((p) => p.id === store.activePresetId)
              if (!p) return null
              return (
                <>
                  <div className="text-[12px] font-medium text-zinc-200">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{p.description}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                      {p.category}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      {p.keyframes.length} keyframes
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-3 pb-3 space-y-1.5">
        <button
          onClick={() => {
            cameraStore.clearKeyframes()
            cameraStore.setEnabled(false)
            store.clearPreset()
          }}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/5 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Reset Camera
        </button>
      </div>
    </div>
  )
}
