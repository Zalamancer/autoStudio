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

import { useCallback } from 'react'
import { Camera, CameraOff, Crosshair, Circle, Square, Check, FlipHorizontal2, Info } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useMotionTrackingStore } from '@/stores/useMotionTrackingStore'
import { useTimelineStore } from '@/stores'
import { PanelSlider, PanelMultiSelect } from '@/components/ui/panel-controls'
import { FaceLandmarkOverlay } from '@/components/canvas/FaceLandmarkOverlay'
import { cn } from '@/lib/utils'

export function MotionTrackingPanel() {
  const {
    isActive,
    isCalibrated,
    isRecording,
    settings,
    videoStream,
    error,
    startTracking,
    stopTracking,
    calibrate,
    startRecording,
    stopRecording,
    updateSettings,
  } = useMotionTrackingStore(
    useShallow((s) => ({
      isActive: s.isActive,
      isCalibrated: s.isCalibrated,
      isRecording: s.isRecording,
      settings: s.settings,
      videoStream: s.videoStream,
      error: s.error,
      startTracking: s.startTracking,
      stopTracking: s.stopTracking,
      calibrate: s.calibrate,
      startRecording: s.startRecording,
      stopRecording: s.stopRecording,
      updateSettings: s.updateSettings,
    })),
  )

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

  // ── Feature multi-select ────────────────────────────────────────────
  const FEATURE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'head', label: 'Head' },
    { value: 'eyes', label: 'Eyes' },
    { value: 'eyebrows', label: 'Eyebrows' },
    { value: 'mouth', label: 'Mouth' },
    { value: 'body', label: 'Body' },
  ]

  const featureValue = (() => {
    const vals: string[] = []
    if (settings.enableHead) vals.push('head')
    if (settings.enableEyes) vals.push('eyes')
    if (settings.enableEyebrows) vals.push('eyebrows')
    if (settings.enableMouth) vals.push('mouth')
    if (settings.enableBody) vals.push('body')
    return vals
  })()

  const handleFeatureChange = useCallback(
    (ids: string[]) => {
      // "all" acts as check-all / uncheck-all
      const prevHadAll = featureValue.length === 5
      const nowHasAll = ids.includes('all')
      if (nowHasAll && !prevHadAll) {
        updateSettings({
          enableHead: true,
          enableEyes: true,
          enableEyebrows: true,
          enableMouth: true,
          enableBody: true,
        })
        return
      }
      if (!nowHasAll && prevHadAll) {
        updateSettings({
          enableHead: false,
          enableEyes: false,
          enableEyebrows: false,
          enableMouth: false,
          enableBody: false,
        })
        return
      }
      const without = ids.filter((id) => id !== 'all')
      updateSettings({
        enableHead: without.includes('head'),
        enableEyes: without.includes('eyes'),
        enableEyebrows: without.includes('eyebrows'),
        enableMouth: without.includes('mouth'),
        enableBody: without.includes('body'),
      })
    },
    [featureValue, updateSettings],
  )

  // Include 'all' in value when everything is checked
  const featureSelectValue = featureValue.length === 5 ? ['all', ...featureValue] : featureValue

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-4">
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
                showBody={settings.enableBody}
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

            {/* Mirror toggle icon */}
            <button
              onClick={() => updateSettings({ mirrorMode: !settings.mirrorMode })}
              className={cn(
                'absolute bottom-2 right-2 w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                settings.mirrorMode ? 'bg-accent/80 text-white' : 'bg-black/50 text-zinc-400 hover:text-white',
              )}
              title={settings.mirrorMode ? 'Mirror: on' : 'Mirror: off'}
            >
              <FlipHorizontal2 size={14} />
            </button>
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

        {/* Features (multi-select dropdown, "All" = check all) */}
        <PanelMultiSelect
          label="Features"
          options={FEATURE_OPTIONS}
          value={featureSelectValue}
          onChange={handleFeatureChange}
          placeholder="None"
        />

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
        </div>

        {/* Info icon with tooltip */}
        <div className="flex justify-end">
          <div className="relative group">
            <button className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] transition-colors">
              <Info size={14} />
            </button>
            <div className="absolute bottom-full right-0 mb-1.5 w-56 px-3 py-2 bg-panel-bg border border-white/10 rounded-lg shadow-xl text-[10px] text-zinc-400 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
              <p>Ctrl+Shift+T toggle · Ctrl+Shift+C calibrate · Ctrl+Shift+R record</p>
              <p className="mt-1">Mouth is auto-disabled during audio dialogue playback.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed footer: Recording action button */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={handleToggleRecording}
          disabled={!isActive}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
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
      </div>
    </div>
  )
}
