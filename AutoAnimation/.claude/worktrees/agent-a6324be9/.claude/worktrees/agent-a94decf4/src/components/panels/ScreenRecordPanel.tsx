/**
 * Screen Record Panel — Capture screen with avatar overlay.
 */

import { useRef, useEffect } from 'react'
import { MonitorPlay, Circle, Square, Trash2, Plus, Monitor, AppWindow, Globe, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShallow } from 'zustand/react/shallow'
import { useScreenRecordStore } from '@/stores/useScreenRecordStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import type { CaptureMode } from '@/services/screenRecorder'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const CAPTURE_MODES: { id: CaptureMode; label: string; icon: typeof Monitor }[] = [
  { id: 'screen', label: 'Full Screen', icon: Monitor },
  { id: 'window', label: 'Window', icon: AppWindow },
  { id: 'tab', label: 'Browser Tab', icon: Globe },
]

export function ScreenRecordPanel() {
  const {
    isRecording, captureMode, stream, recording, duration,
    setCaptureMode, startRecording, stopRecording, clearRecording,
  } = useScreenRecordStore(
    useShallow((s) => ({
      isRecording: s.isRecording,
      captureMode: s.captureMode,
      stream: s.stream,
      recording: s.recording,
      duration: s.duration,
      setCaptureMode: s.setCaptureMode,
      startRecording: s.startRecording,
      stopRecording: s.stopRecording,
      clearRecording: s.clearRecording,
    })),
  )

  const addVideo = useVideoLayerStore((s) => s.addVideo)
  const addClip = useTimelineStore((s) => s.addClip)
  const timelineFps = useTimelineStore((s) => s.fps)
  const previewRef = useRef<HTMLVideoElement>(null)

  // Attach stream to preview
  useEffect(() => {
    if (previewRef.current && stream) {
      previewRef.current.srcObject = stream
    }
  }, [stream])

  const handleAddToProject = async () => {
    if (!recording) return

    // Probe actual video dimensions from the blob
    let videoWidth = 1920
    let videoHeight = 1080
    try {
      const probeVideo = document.createElement('video')
      probeVideo.muted = true
      probeVideo.preload = 'metadata'
      probeVideo.src = recording.url
      await new Promise<void>((resolve) => {
        probeVideo.onloadedmetadata = () => {
          if (probeVideo.videoWidth > 0) videoWidth = probeVideo.videoWidth
          if (probeVideo.videoHeight > 0) videoHeight = probeVideo.videoHeight
          resolve()
        }
        probeVideo.onerror = () => resolve() // fall back to defaults
      })
    } catch {
      // keep defaults
    }

    const videoId = `screen-${Date.now()}`
    const totalFrames = Math.round(recording.duration * timelineFps)

    // Add clip to timeline so it appears as a track
    addClip('video-1', {
      id: videoId,
      trackId: 'video-1',
      startFrame: 0,
      endFrame: totalFrames,
      sourceId: recording.url,
      sourceInPoint: 0,
      sourceOutPoint: totalFrames,
      name: 'Screen Recording',
      color: '#a855f7',
    })

    // Extend timeline if the recording is longer than current duration
    const { totalFrames: currentTotal, setTotalFrames } = useTimelineStore.getState()
    if (totalFrames > currentTotal) {
      setTotalFrames(totalFrames)
    }

    // Add to canvas video layer so it renders.
    // Use the blob URL directly — clearRecording would revoke it, so we
    // clear state without revoking since the video layer now owns the URL.
    const videoUrl = recording.url
    addVideo({
      id: `canvas-${videoId}`,
      name: 'Screen Recording',
      sourceUrl: videoUrl,
      prompt: 'Screen recording',
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 0,
      visible: true,
      loop: false,
      durationSeconds: recording.duration,
      fps: 30,
      width: videoWidth,
      height: videoHeight,
    })

    // Clear recording state without revoking the blob URL (video layer owns it now)
    useScreenRecordStore.setState({ recording: null, duration: 0 })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none flex items-center justify-between min-h-[49px] px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <MonitorPlay size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Screen Record</h3>
        </div>
        <div className="flex items-center gap-1">
          {recording && (
            <button
              onClick={clearRecording}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('screen-recorder')}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Not recording, no recording saved */}
      {!isRecording && !recording && (
        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Capture mode selector */}
          <div>
            <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wider font-medium">Capture Mode</p>
            <div className="grid grid-cols-3 gap-1.5">
              {CAPTURE_MODES.map((mode) => {
                const Icon = mode.icon
                return (
                  <button
                    key={mode.id}
                    onClick={() => setCaptureMode(mode.id)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg text-[10px] transition-all border',
                      captureMode === mode.id
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                        : 'bg-zinc-800/40 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/40',
                    )}
                  >
                    <Icon size={16} />
                    {mode.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <MonitorPlay size={24} className="text-purple-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300 mb-1">Record your screen</p>
            <p className="text-[11px] text-zinc-500 max-w-[220px] leading-relaxed mb-4">
              Capture your screen, then add your animated character as a PIP overlay for tutorial videos.
            </p>
            <button
              onClick={startRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium bg-red-500 text-white hover:bg-red-400 shadow-lg shadow-red-500/20 transition-all"
            >
              <Circle size={12} className="fill-current" />
              Start Recording
            </button>
          </div>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <div className="flex-1 flex flex-col p-4">
          {/* Live preview */}
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden mb-4">
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
            {/* Recording indicator */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] text-white font-medium tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Stop button */}
          <button
            onClick={stopRecording}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-zinc-700 text-white hover:bg-zinc-600 transition-all"
          >
            <Square size={12} className="fill-current" />
            Stop Recording
          </button>
        </div>
      )}

      {/* Recording saved — preview + add to project */}
      {!isRecording && recording && (
        <div className="flex-1 flex flex-col p-4">
          {/* Playback preview */}
          <div className="flex-1 bg-black rounded-xl overflow-hidden mb-4">
            <video
              src={recording.url}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          </div>

          {/* Info */}
          <div className="flex items-center justify-between px-1 mb-3">
            <span className="text-[11px] text-zinc-400">
              Duration: {recording.duration.toFixed(1)}s
            </span>
            <span className="text-[11px] text-zinc-500">
              {(recording.blob.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>

          {/* Add to project */}
          <button
            onClick={handleAddToProject}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium bg-purple-500 text-white hover:bg-purple-400 shadow-lg shadow-purple-500/20 transition-all"
          >
            <Plus size={14} />
            Add to Project
          </button>
          <p className="text-[10px] text-zinc-600 text-center mt-2">
            Position your character in the corner for PIP overlay
          </p>
        </div>
      )}
    </div>
  )
}
