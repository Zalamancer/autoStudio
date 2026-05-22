/**
 * Webcam Puppeteering / Motion Capture Panel
 *
 * UI for driving character animations in real-time using the webcam.
 * Provides controls for face tracking, recording takes, and settings.
 * Leverages the existing motionTracker service and useMotionTrackingStore.
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import {
  Camera, CameraOff, Circle, Square, Settings2, RotateCcw,
  Eye, Smile, Move, Gauge, Trash2, Pencil, Check, X,
} from 'lucide-react'
import { useMotionTrackingStore } from '@/stores/useMotionTrackingStore'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useTimelineStore } from '@/stores'
import type { MotionTrackingSettings } from '@/types/motionTracking'

export function WebcamPuppetPanel() {
  const {
    isActive,
    isCalibrated,
    isRecording,
    faceData,
    settings,
    takes,
    videoStream,
    error,
    startTracking,
    stopTracking,
    calibrate,
    startRecording: startRec,
    stopRecording: stopRec,
    updateSettings,
    deleteTake,
    renameTake,
  } = useMotionTrackingStore()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [editingTakeId, setEditingTakeId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [showSettings, setShowSettings] = useState(false)

  // Bind video stream to preview element
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [videoStream])

  const handleToggleTracking = useCallback(async () => {
    if (isActive) {
      stopTracking()
    } else {
      await startTracking()
    }
  }, [isActive, startTracking, stopTracking])

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRec()
    } else {
      const currentFrame = useTimelineStore.getState().currentFrame
      startRec(currentFrame)
    }
  }, [isRecording, startRec, stopRec])

  const handleSettingChange = useCallback(
    (key: keyof MotionTrackingSettings, value: number | boolean) => {
      updateSettings({ [key]: value })
    },
    [updateSettings],
  )

  const handleStartRename = useCallback((id: string, name: string) => {
    setEditingTakeId(id)
    setEditName(name)
  }, [])

  const handleConfirmRename = useCallback(() => {
    if (editingTakeId && editName.trim()) {
      renameTake(editingTakeId, editName.trim())
    }
    setEditingTakeId(null)
  }, [editingTakeId, editName, renameTake])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-medium text-white">Webcam Puppeteering</h3>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1 hover:bg-zinc-700 rounded text-zinc-400"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-zinc-400">
        Drive character animations in real-time using your webcam.
        Facial expressions control emotions, head movement controls position.
      </p>

      {/* Webcam Preview */}
      <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
        {isActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${settings.mirrorMode ? 'scale-x-[-1]' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
            <CameraOff className="w-8 h-8" />
          </div>
        )}

        {/* Status indicators */}
        {isActive && (
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-900/80 text-green-300 text-[10px] rounded">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
            {isCalibrated && (
              <span className="px-1.5 py-0.5 bg-blue-900/80 text-blue-300 text-[10px] rounded">
                Calibrated
              </span>
            )}
          </div>
        )}

        {isRecording && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-red-900/80 text-red-300 text-[10px] rounded">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Recording
          </div>
        )}
      </div>

      {/* Face data overlay (when active) */}
      {isActive && faceData && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-zinc-500">
          <span>Yaw: {(faceData.headRotation.yaw * (180/Math.PI)).toFixed(1)}</span>
          <span>Pitch: {(faceData.headRotation.pitch * (180/Math.PI)).toFixed(1)}</span>
          <span>Jaw: {faceData.jawOpen.toFixed(2)}</span>
          <span>Smile: {faceData.mouthSmile.toFixed(2)}</span>
          <span>L-Blink: {faceData.eyeBlinkLeft.toFixed(2)}</span>
          <span>R-Blink: {faceData.eyeBlinkRight.toFixed(2)}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={handleToggleTracking}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
            isActive
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'
          }`}
        >
          {isActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
          {isActive ? 'Stop' : 'Start'}
        </button>

        {isActive && (
          <>
            <button
              onClick={calibrate}
              className="flex items-center gap-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs"
              title="Calibrate rest pose"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToggleRecording}
              className={`flex items-center gap-1 px-3 py-2 rounded text-xs ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
              title={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
            </button>
          </>
        )}
      </div>

      {/* Settings (collapsible) */}
      {showSettings && (
        <div className="border border-zinc-800 rounded-lg p-2 space-y-2">
          <span className="text-xs text-zinc-400 font-medium">Tracking Settings</span>

          {/* Feature toggles */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { key: 'enableHead' as const, label: 'Head', icon: Move },
              { key: 'enableEyes' as const, label: 'Eyes', icon: Eye },
              { key: 'enableEyebrows' as const, label: 'Brows', icon: Gauge },
              { key: 'enableMouth' as const, label: 'Mouth', icon: Smile },
            ].map(({ key, label, icon: Icon }) => (
              <label key={key} className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={(e) => handleSettingChange(key, e.target.checked)}
                  className="rounded border-zinc-600 bg-zinc-800"
                />
                <Icon className="w-3 h-3" />
                {label}
              </label>
            ))}
          </div>

          {/* Smoothing slider */}
          <PanelSlider
            label="Smoothing"
            value={settings.smoothingFactor}
            onChange={(v) => handleSettingChange('smoothingFactor', v)}
            min={0}
            max={1}
            step={0.01}
            precision={2}
            compact
          />

          {/* Head rotation scale */}
          <PanelSlider
            label="Head Scale"
            value={settings.headRotationScale}
            onChange={(v) => handleSettingChange('headRotationScale', v)}
            min={0.1}
            max={3}
            step={0.1}
            precision={1}
            suffix="x"
            compact
          />

          {/* Expression scale */}
          <PanelSlider
            label="Expression Scale"
            value={settings.expressionScale}
            onChange={(v) => handleSettingChange('expressionScale', v)}
            min={0.1}
            max={3}
            step={0.1}
            precision={1}
            suffix="x"
            compact
          />

          {/* Mirror toggle */}
          <label className="flex items-center gap-1.5 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={settings.mirrorMode}
              onChange={(e) => handleSettingChange('mirrorMode', e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800"
            />
            Mirror webcam
          </label>
        </div>
      )}

      {/* Recorded Takes */}
      {takes.length > 0 && (
        <div className="border-t border-zinc-800 pt-2 space-y-1.5">
          <span className="text-xs text-zinc-400 font-medium">Recorded Takes ({takes.length})</span>
          {takes.map((take) => (
            <div key={take.id} className="flex items-center gap-2 bg-zinc-800/50 rounded px-2 py-1.5">
              {editingTakeId === take.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-zinc-700 text-white text-xs px-1 py-0.5 rounded"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename()}
                  />
                  <button onClick={handleConfirmRename} className="text-green-400 hover:text-green-300">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingTakeId(null)} className="text-zinc-500 hover:text-zinc-400">
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-xs text-zinc-300 truncate">{take.name}</span>
                  <span className="text-[10px] text-zinc-500">{take.frames.length}f</span>
                  <button
                    onClick={() => handleStartRename(take.id, take.name)}
                    className="text-zinc-500 hover:text-zinc-400"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteTake(take.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 rounded px-2 py-1.5">
          {error}
        </div>
      )}
    </div>
  )
}
