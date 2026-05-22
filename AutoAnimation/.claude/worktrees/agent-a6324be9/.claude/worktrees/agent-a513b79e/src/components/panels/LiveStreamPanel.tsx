/**
 * Live Stream Panel
 *
 * UI for real-time character rendering + stream output for video
 * conferencing tools and live streaming platforms.
 * Distinct from LiveAvatarPanel which handles ElevenLabs conversation.
 */

import { useCallback, useRef, useEffect } from 'react'
import {
  Radio, Monitor, Video, Globe, Eye, Pause, Play,
  Wifi, WifiOff, Clock, Gauge, AlertTriangle,
} from 'lucide-react'
import { PanelCheckbox } from '@/components/ui/panel-controls'
import { useLiveAvatarStore } from '@/stores/useLiveAvatarStore'
import { liveAvatarStream } from '@/services/liveAvatarStream'
import type { StreamQuality, StreamBackground } from '@/types/liveAvatar'

export function LiveStreamPanel() {
  const {
    settings,
    status,
    stats,
    puppeteeringActive,
    error,
    updateSettings,
    setQuality,
    setBackground,
    setStatus,
    setStats,
    setActiveStream,
    setError,
    reset,
  } = useLiveAvatarStore()

  const previewRef = useRef<HTMLCanvasElement>(null)

  // Update preview canvas when stream is active
  useEffect(() => {
    if (status !== 'streaming') return

    const outputCanvas = liveAvatarStream.getOutputCanvas()
    if (!outputCanvas || !previewRef.current) return

    const ctx = previewRef.current.getContext('2d')
    if (!ctx) return

    previewRef.current.width = outputCanvas.width
    previewRef.current.height = outputCanvas.height

    let rafId = 0
    const draw = () => {
      ctx.drawImage(outputCanvas, 0, 0)
      rafId = requestAnimationFrame(draw)
    }
    draw()

    return () => cancelAnimationFrame(rafId)
  }, [status])

  const handleStartStream = useCallback(() => {
    // Find the main VideoCanvas element
    const sourceCanvas = document.querySelector<HTMLCanvasElement>('[data-canvas-id="main"]')
      ?? document.querySelector<HTMLCanvasElement>('canvas')

    if (!sourceCanvas) {
      setError('No canvas element found. Open the editor first.')
      return
    }

    liveAvatarStream.init(
      sourceCanvas,
      settings,
      (s) => setStatus(s),
      (s) => setStats(s),
    )

    const stream = liveAvatarStream.start()
    if (stream) {
      setActiveStream(stream)
    }
  }, [settings, setStatus, setStats, setActiveStream, setError])

  const handleStopStream = useCallback(() => {
    liveAvatarStream.stop()
    setActiveStream(null)
    reset()
  }, [setActiveStream, reset])

  const handlePauseResume = useCallback(() => {
    if (status === 'streaming') {
      liveAvatarStream.pause()
      setStatus('paused')
    } else if (status === 'paused') {
      liveAvatarStream.resume()
      setStatus('streaming')
    }
  }, [status, setStatus])

  const handleQualityChange = useCallback((q: StreamQuality) => {
    setQuality(q)
    liveAvatarStream.updateSettings({ quality: q })
  }, [setQuality])

  const handleBackgroundChange = useCallback((type: StreamBackground['type']) => {
    let bg: StreamBackground
    switch (type) {
      case 'transparent':
        bg = { type: 'transparent' }
        break
      case 'solid':
        bg = { type: 'solid', color: '#00FF00' }
        break
      case 'blur':
        bg = { type: 'blur', strength: 10 }
        break
      case 'scene':
        bg = { type: 'scene' }
        break
      default:
        bg = { type: 'solid', color: '#00FF00' }
    }
    setBackground(bg)
    liveAvatarStream.updateSettings({ background: bg })
  }, [setBackground])

  const isStreaming = status === 'streaming' || status === 'paused'

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Radio className="w-4 h-4 text-red-400" />
        <h3 className="text-sm font-medium text-white">Live Stream</h3>
      </div>

      <p className="text-xs text-zinc-400">
        Stream your animated character in real-time to video conferencing tools
        or live streaming platforms via screen share or OBS.
      </p>

      {/* Stream Preview */}
      <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
        {isStreaming ? (
          <canvas
            ref={previewRef}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 gap-2">
            <Radio className="w-8 h-8 opacity-30" />
            <span className="text-xs">Stream not active</span>
          </div>
        )}

        {/* Status badge */}
        {isStreaming && (
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded ${
              status === 'streaming'
                ? 'bg-red-900/80 text-red-300'
                : 'bg-yellow-900/80 text-yellow-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                status === 'streaming' ? 'bg-red-400 animate-pulse' : 'bg-yellow-400'
              }`} />
              {status === 'streaming' ? 'LIVE' : 'PAUSED'}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      {isStreaming && (
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'FPS', value: stats.fps.toFixed(0), icon: Gauge },
            { label: 'Uptime', value: `${stats.uptime}s`, icon: Clock },
            { label: 'Render', value: `${stats.avgRenderTime.toFixed(1)}ms`, icon: Monitor },
            { label: 'Dropped', value: String(stats.droppedFrames), icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-zinc-800/50 rounded p-1">
              <Icon className="w-3 h-3 text-zinc-500 mx-auto mb-0.5" />
              <div className="text-[10px] text-zinc-300 font-medium">{value}</div>
              <div className="text-[9px] text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isStreaming ? (
          <button
            onClick={handleStartStream}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
          >
            <Radio className="w-3.5 h-3.5" />
            Start Stream
          </button>
        ) : (
          <>
            <button
              onClick={handlePauseResume}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded transition-colors"
            >
              {status === 'streaming' ? (
                <><Pause className="w-3.5 h-3.5" /> Pause</>
              ) : (
                <><Play className="w-3.5 h-3.5" /> Resume</>
              )}
            </button>
            <button
              onClick={handleStopStream}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
            >
              <Radio className="w-3.5 h-3.5 opacity-60" />
              Stop
            </button>
          </>
        )}
      </div>

      {/* Puppeteering indicator */}
      <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
        puppeteeringActive
          ? 'bg-green-950/30 text-green-400'
          : 'bg-zinc-800/50 text-zinc-500'
      }`}>
        {puppeteeringActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        <span>
          {puppeteeringActive
            ? 'Webcam puppeteering active'
            : 'Start webcam puppeteering for live animation'}
        </span>
      </div>

      {/* Quality settings */}
      <div className="space-y-2">
        <span className="text-xs text-zinc-400 font-medium">Quality</span>
        <div className="flex gap-1.5">
          {(['low', 'medium', 'high'] as StreamQuality[]).map((q) => (
            <button
              key={q}
              onClick={() => handleQualityChange(q)}
              className={`flex-1 px-2 py-1 rounded text-xs capitalize transition-colors ${
                settings.quality === q
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div className="space-y-2">
        <span className="text-xs text-zinc-400 font-medium">Background</span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { type: 'scene' as const, label: 'Scene', icon: Monitor },
            { type: 'solid' as const, label: 'Green Screen', icon: Video },
            { type: 'blur' as const, label: 'Blur', icon: Eye },
            { type: 'transparent' as const, label: 'Transparent', icon: Globe },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleBackgroundChange(type)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-colors ${
                settings.background.type === type
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Additional options */}
      <div className="space-y-1.5">
        <PanelCheckbox
          label="Mirror output"
          checked={settings.mirrorOutput}
          onChange={(v) => {
            updateSettings({ mirrorOutput: v })
            liveAvatarStream.updateSettings({ mirrorOutput: v })
          }}
        />
        <PanelCheckbox
          label="Include audio"
          checked={settings.includeAudio}
          onChange={(v) => updateSettings({ includeAudio: v })}
        />
        <PanelCheckbox
          label="Show captions overlay"
          checked={settings.showCaptions}
          onChange={(v) => updateSettings({ showCaptions: v })}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-950/30 rounded px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
