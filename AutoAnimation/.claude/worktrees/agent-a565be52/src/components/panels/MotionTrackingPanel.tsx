/**
 * MotionTrackingPanel — Real-time webcam face tracking panel ("Perform" mode).
 *
 * Features:
 * - Webcam preview with face landmark overlay
 * - Calibration (30-frame rest pose averaging)
 * - Per-feature toggles (head, eyes, eyebrows, mouth)
 * - Smoothing, head scale, expression scale sliders
 * - Recording takes with rename/delete/apply-to-timeline
 */

import { useCallback, useState } from 'react'
import {
  Camera,
  CameraOff,
  Crosshair,
  Circle,
  Square,
  Trash2,
  Pencil,
  Download,
  Check,
  Eye,
  Smile,
  Move,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useMotionTrackingStore } from '@/stores/useMotionTrackingStore'
import { useTimelineStore } from '@/stores'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelSlider, PanelCheckbox } from '@/components/ui/panel-controls'
import { FaceLandmarkOverlay } from '@/components/canvas/FaceLandmarkOverlay'
import { exportTakeToKeyframes, getTakeStats } from '@/services/motionRecorder'
import { cn } from '@/lib/utils'

export function MotionTrackingPanel() {
  const {
    isActive,
    isCalibrated,
    isRecording,
    settings,
    takes,
    videoStream,
    error,
    startTracking,
    stopTracking,
    calibrate,
    startRecording,
    stopRecording,
    updateSettings,
    deleteTake,
    renameTake,
  } = useMotionTrackingStore(
    useShallow((s) => ({
      isActive: s.isActive,
      isCalibrated: s.isCalibrated,
      isRecording: s.isRecording,
      settings: s.settings,
      takes: s.takes,
      videoStream: s.videoStream,
      error: s.error,
      startTracking: s.startTracking,
      stopTracking: s.stopTracking,
      calibrate: s.calibrate,
      startRecording: s.startRecording,
      stopRecording: s.stopRecording,
      updateSettings: s.updateSettings,
      deleteTake: s.deleteTake,
      renameTake: s.renameTake,
    })),
  )

  const [editingTakeId, setEditingTakeId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleToggleTracking = useCallback(async () => {
    if (isActive) {
      stopTracking()
    } else {
      await startTracking()
    }
  }, [isActive, startTracking, stopTracking])

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording()
    } else {
      const frame = useTimelineStore.getState().currentFrame
      startRecording(frame)
    }
  }, [isRecording, startRecording, stopRecording])

  const handleApplyTake = useCallback(
    (takeId: string) => {
      const take = takes.find((t) => t.id === takeId)
      if (!take) return
      const { keyframeCount } = exportTakeToKeyframes(take, {
        headRotationScale: settings.headRotationScale,
        mirrorMode: settings.mirrorMode,
      })
      alert(`Exported ${keyframeCount} keyframes to timeline.`)
    },
    [takes, settings.headRotationScale, settings.mirrorMode],
  )

  const handleStartRename = (takeId: string, currentName: string) => {
    setEditingTakeId(takeId)
    setEditName(currentName)
  }

  const handleFinishRename = () => {
    if (editingTakeId && editName.trim()) {
      renameTake(editingTakeId, editName.trim())
    }
    setEditingTakeId(null)
    setEditName('')
  }

  return (
    <PanelLayout icon={Camera} title="Perform" iconClassName="text-rose-400">
      {/* Error Display */}
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Webcam Preview */}
      <div className="space-y-2">
        <div className="relative bg-zinc-800 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {isActive && videoStream ? (
            <FaceLandmarkOverlay
              stream={videoStream}
              width={280}
              height={210}
              mirror={settings.mirrorMode}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500">
              <div className="text-center">
                <CameraOff size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Camera off</p>
              </div>
            </div>
          )}

          {/* Status indicators */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {isActive && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-green-400">Live</span>
              </div>
            )}
            {isCalibrated && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px]">
                <Check size={10} className="text-blue-400" />
                <span className="text-blue-400">Cal</span>
              </div>
            )}
            {isRecording && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px]">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400">REC</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleToggleTracking}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
            )}
          >
            {isActive ? <CameraOff size={14} /> : <Camera size={14} />}
            {isActive ? 'Stop' : 'Start'}
          </button>

          <button
            onClick={calibrate}
            disabled={!isActive}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Calibrate: look straight at camera and hold still"
          >
            <Crosshair size={14} />
            Calibrate
          </button>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Features</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <ToggleButton
            icon={Move}
            label="Head"
            active={settings.enableHead}
            onClick={() => updateSettings({ enableHead: !settings.enableHead })}
          />
          <ToggleButton
            icon={Eye}
            label="Eyes"
            active={settings.enableEyes}
            onClick={() => updateSettings({ enableEyes: !settings.enableEyes })}
          />
          <ToggleButton
            icon={Smile}
            label="Eyebrows"
            active={settings.enableEyebrows}
            onClick={() => updateSettings({ enableEyebrows: !settings.enableEyebrows })}
          />
          <ToggleButton
            icon={Smile}
            label="Mouth"
            active={settings.enableMouth}
            onClick={() => updateSettings({ enableMouth: !settings.enableMouth })}
          />
        </div>
      </div>

      {/* Settings Sliders */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Settings</h3>

        <PanelSlider
          label="Smoothing"
          value={settings.smoothingFactor}
          min={0.1}
          max={0.9}
          step={0.05}
          precision={2}
          onChange={(v) => updateSettings({ smoothingFactor: v })}
        />

        <PanelSlider
          label="Head Scale"
          value={settings.headRotationScale}
          min={0.3}
          max={2.5}
          step={0.1}
          precision={1}
          onChange={(v) => updateSettings({ headRotationScale: v })}
        />

        <PanelSlider
          label="Expression Scale"
          value={settings.expressionScale}
          min={0.3}
          max={2.5}
          step={0.1}
          precision={1}
          onChange={(v) => updateSettings({ expressionScale: v })}
        />

        <PanelCheckbox
          label="Mirror webcam"
          checked={settings.mirrorMode}
          onChange={(v) => updateSettings({ mirrorMode: v })}
        />
      </div>

      {/* Recording */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Record</h3>

        <button
          onClick={handleToggleRecording}
          disabled={!isActive}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isRecording
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed',
          )}
        >
          {isRecording ? (
            <>
              <Square size={12} className="fill-current" />
              Stop Recording
            </>
          ) : (
            <>
              <Circle size={12} className="fill-red-500 text-red-500" />
              Start Recording
            </>
          )}
        </button>

        {/* Takes List */}
        {takes.length > 0 && (
          <div className="space-y-1">
            {takes.map((take) => {
              const stats = getTakeStats(take)
              const isEditing = editingTakeId === take.id

              return (
                <div
                  key={take.id}
                  className="flex items-center gap-2 px-2.5 py-2 bg-zinc-800/50 rounded-lg group"
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleFinishRename()
                          if (e.key === 'Escape') setEditingTakeId(null)
                        }}
                        className="w-full bg-zinc-700 text-white text-xs px-1.5 py-0.5 rounded outline-none focus:ring-1 ring-green-500/50"
                      />
                    ) : (
                      <>
                        <p className="text-xs text-white truncate">{take.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {stats.frameCount} frames &middot; {stats.durationSeconds.toFixed(1)}s
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartRename(take.id, take.name)}
                      className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleApplyTake(take.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors"
                      title="Apply to timeline"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={() => deleteTake(take.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="text-[10px] text-zinc-600 space-y-1">
        <p>Shortcuts: Ctrl+Shift+T toggle &middot; Ctrl+Shift+C calibrate &middot; Ctrl+Shift+R record</p>
        <p>Mouth is auto-disabled during audio dialogue playback.</p>
      </div>
    </PanelLayout>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

function ToggleButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
        active
          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
          : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50',
      )}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}

