import { useEffect, useRef, useCallback, useMemo, memo } from 'react'
import {
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
  Circle,
  Music,
  Magnet,
  Flag,
  Repeat,
} from 'lucide-react'
import { IconButton } from '@/components/ui'
import {
  useTimelineStore,
  useVoiceStore,
  usePlaybackStore,
  formatTimecode,
  useKeyframeStore,
  useMultiCharacterStore,
  useTextOverlayStore,
  useAnimationStore,
  useHTMLTemplateLayerStore,
} from '@/stores'
import { useMediaStore } from '@/stores/useMediaStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { TemporalState } from 'zundo'
import { undo as globalUndo, redo as globalRedo, useUndoManagerStore } from '@/services/undoManager'

/** Extra padding beyond last content (seconds) — gives room to drag into. */
const TIMELINE_PADDING_SECONDS = 5

/** Stable empty array to avoid re-render loops from `?? []` creating new refs */
const EMPTY_ARRAY: readonly any[] = []

/**
 * Compute the last frame of ANY content block across all stores.
 * This is the REAL content duration — playback stops here.
 */
function useContentEndFrame(): number {
  const fps = useTimelineStore((s) => s.fps)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const generatedVoices = useVoiceStore((s) => s.generatedVoices)
  const activeVoiceId = useVoiceStore((s) => s.activeVoiceId)
  const textOverlays = useTextOverlayStore((s) => s.overlays)
  const shapes = useShapeStore((s) => s.shapes)
  const mediaCanvasItems = useMediaStore((s) => s.canvasItems)
  const activeAnimations = useAnimationStore((s) => s.activeAnimations)
  const svgObjects = useSVGObjectStore((s) => s.composition?.objects ?? EMPTY_ARRAY)
  const htmlTemplates = useHTMLTemplateLayerStore((s) => s.templates)

  return useMemo(() => {
    let maxFrame = 0

    for (const line of dialogueLines) {
      if (line.endFrame > maxFrame) maxFrame = line.endFrame
    }
    for (const overlay of textOverlays) {
      if ((overlay.endFrame ?? 0) > maxFrame) maxFrame = overlay.endFrame
    }
    for (const shape of shapes) {
      if ((shape.endFrame ?? 0) > maxFrame) maxFrame = shape.endFrame
    }
    for (const item of mediaCanvasItems) {
      if ((item.endFrame ?? 0) > maxFrame) maxFrame = item.endFrame
    }
    for (const anim of activeAnimations) {
      if ((anim.endFrame ?? 0) > maxFrame) maxFrame = anim.endFrame
    }
    for (const obj of svgObjects) {
      if ((obj.endFrame ?? 0) > maxFrame) maxFrame = obj.endFrame
    }
    for (const tpl of htmlTemplates) {
      if ((tpl.endFrame ?? 0) > maxFrame) maxFrame = tpl.endFrame
    }

    // Single voice (non-dialogue mode)
    if (maxFrame === 0 && activeVoiceId) {
      const voice = generatedVoices.find((v) => v.id === activeVoiceId)
      if (voice) {
        maxFrame = Math.ceil(voice.audioDuration * fps)
      }
    }

    // At minimum 1 second so the timeline is never completely empty
    return Math.max(maxFrame, fps)
  }, [
    dialogueLines,
    textOverlays,
    shapes,
    mediaCanvasItems,
    activeAnimations,
    svgObjects,
    htmlTemplates,
    generatedVoices,
    activeVoiceId,
    fps,
  ])
}

export const TimelineControls = memo(function TimelineControls() {
  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const isLooping = useTimelineStore((s) => s.isLooping)
  const togglePlayback = useTimelineStore((s) => s.togglePlayback)
  const toggleLoop = useTimelineStore((s) => s.toggleLoop)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)
  const pause = useTimelineStore((s) => s.pause)
  const timeDisplayMode = useTimelineStore((s) => s.timeDisplayMode)
  const toggleTimeDisplayMode = useTimelineStore((s) => s.toggleTimeDisplayMode)
  const inPoint = useTimelineStore((s) => s.inPoint)
  const outPoint = useTimelineStore((s) => s.outPoint)
  const setInPoint = useTimelineStore((s) => s.setInPoint)
  const setOutPoint = useTimelineStore((s) => s.setOutPoint)
  const { isMuted, toggleMute, volume } = usePlaybackStore()
  const { activeVoiceId, generatedVoices } = useVoiceStore()
  const { isRecordMode, toggleRecordMode } = useKeyframeStore()
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const isMultiCharMode = dialogueLines.length > 0

  // Beat detection & snap
  const beatAnalysis = useBeatSyncStore((s) => s.analysis)
  const isAnalyzing = useBeatSyncStore((s) => s.isAnalyzing)
  const analyzeAudio = useBeatSyncStore((s) => s.analyzeAudio)
  const showBeatMarkers = useBeatSyncStore((s) => s.showBeatMarkers)
  const setShowBeatMarkers = useBeatSyncStore((s) => s.setShowBeatMarkers)
  const beatSnapEnabled = useTimelineStore((s) => s.beatSnapEnabled)
  const toggleBeatSnap = useTimelineStore((s) => s.toggleBeatSnap)

  // Markers
  const addMarkerAtPlayhead = useTimelineStore((s) => s.addMarkerAtPlayhead)

  const contentEndFrame = useContentEndFrame()

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number | null>(null)
  // Playback origin: rebased whenever the user seeks while playing
  const playbackOriginRef = useRef<{ time: number; frame: number } | null>(null)

  // Get the active voice audio URL (only used for single-character mode)
  const activeVoice = generatedVoices.find((v) => v.id === activeVoiceId)
  const audioUrl = activeVoice?.audioUrl

  // In single-character mode: create audio element to drive playback
  // In multi-character mode: useDialoguePlayback handles all audio, we just drive frames
  const useAudioDriven = !isMultiCharMode && !!audioUrl

  // Subscribe reactively to the temporal store for undo/redo state
  const { temporalUndo, temporalRedo, temporalCanUndo, temporalCanRedo } = useStore(
    useTimelineStore.temporal,
    useShallow((state: TemporalState<unknown>) => ({
      temporalUndo: state.undo,
      temporalRedo: state.redo,
      temporalCanUndo: state.pastStates.length > 0,
      temporalCanRedo: state.futureStates.length > 0,
    })),
  )

  // Reactive subscription to the global undo manager
  const globalCanUndoReactive = useUndoManagerStore((s) => s.canUndo)
  const globalCanRedoReactive = useUndoManagerStore((s) => s.canRedo)

  // Combined undo/redo: either global manager or timeline temporal has history
  const canUndo = globalCanUndoReactive || temporalCanUndo
  const canRedo = globalCanRedoReactive || temporalCanRedo
  const undo = useCallback(() => {
    if (!globalUndo()) temporalUndo()
  }, [temporalUndo])
  const redo = useCallback(() => {
    if (!globalRedo()) temporalRedo()
  }, [temporalRedo])

  // ── Audio engine ──────────────────────────────────────────────────────

  // Create or update audio element when URL changes
  useEffect(() => {
    if (!useAudioDriven) return

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl!)
    } else if (audioRef.current.src !== audioUrl) {
      audioRef.current.src = audioUrl!
    }
    audioRef.current.muted = isMuted
    audioRef.current.volume = volume
  }, [audioUrl, isMuted, volume, useAudioDriven])

  // Update mute/volume without recreating audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted
      audioRef.current.volume = volume
    }
  }, [isMuted, volume])

  // Sync content end → timeline store totalFrames (content + padding).
  // Only grow, never shrink — so the user can freely extend the timeline.
  useEffect(() => {
    const store = useTimelineStore.getState()
    const withPadding = contentEndFrame + Math.round(TIMELINE_PADDING_SECONDS * fps)
    if (withPadding > store.totalFrames) {
      store.setTotalFrames(withPadding)
    }
  }, [contentEndFrame, fps])

  // Main playback effect
  useEffect(() => {
    if (!isPlaying) {
      if (audioRef.current) audioRef.current.pause()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    if (useAudioDriven && audioRef.current) {
      // ── Audio-driven playback (single-character mode) ──
      const audio = audioRef.current
      const startTime = currentFrame / fps
      if (Math.abs(audio.currentTime - startTime) > 0.5) {
        audio.currentTime = startTime
      }

      audio.play().catch(console.error)

      const handleTimeUpdate = () => {
        const frame = Math.floor(audio.currentTime * fps)
        const s = useTimelineStore.getState()
        const stopFrame = s.outPoint ?? s.totalFrames - 1
        if (frame >= stopFrame) {
          if (s.isLooping) {
            const loopStart = (s.inPoint ?? 0) / fps
            audio.currentTime = loopStart
            seekToFrame(s.inPoint ?? 0)
          } else {
            audio.pause()
            audio.currentTime = stopFrame / fps
            seekToFrame(stopFrame)
            pause()
          }
        } else {
          seekToFrame(frame)
        }
      }

      const animate = () => {
        if (!useTimelineStore.getState().isPlaying) return
        const frame = Math.floor(audio.currentTime * fps)
        const s = useTimelineStore.getState()
        const stopFrame = s.outPoint ?? s.totalFrames - 1
        if (frame !== s.currentFrame) {
          if (frame >= stopFrame) {
            if (s.isLooping) {
              const loopStart = (s.inPoint ?? 0) / fps
              audio.currentTime = loopStart
              seekToFrame(s.inPoint ?? 0)
            } else {
              audio.pause()
              audio.currentTime = stopFrame / fps
              seekToFrame(stopFrame)
              pause()
              return
            }
          }
          seekToFrame(frame)
        }
        animationRef.current = requestAnimationFrame(animate)
      }

      audio.addEventListener('timeupdate', handleTimeUpdate)
      animationRef.current = requestAnimationFrame(animate)

      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.pause()
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
      }
    } else {
      // ── Frame-driven playback (multi-character mode or no audio) ──
      // Absolute-time approach: zero drift, and rebaseable on seek.
      // origin.frame + round((now - origin.time) / 1000 * fps) = targetFrame
      playbackOriginRef.current = {
        time: performance.now(),
        frame: useTimelineStore.getState().currentFrame,
      }

      const animate = (currentTime: number) => {
        const origin = playbackOriginRef.current!
        const state = useTimelineStore.getState()
        const elapsed = currentTime - origin.time
        const expectedFrame = origin.frame + Math.round((elapsed / 1000) * fps)

        // Detect external seek: if currentFrame was moved by something other than
        // this loop (user dragging the playhead), rebase the origin so playback
        // continues forward from the new position instead of snapping back.
        if (Math.abs(state.currentFrame - expectedFrame) > 1) {
          playbackOriginRef.current = { time: currentTime, frame: state.currentFrame }
        } else if (expectedFrame !== state.currentFrame) {
          const stopFrame = state.outPoint ?? state.totalFrames - 1
          if (expectedFrame >= stopFrame) {
            if (state.isLooping) {
              const loopStart = state.inPoint ?? 0
              seekToFrame(loopStart)
              playbackOriginRef.current = { time: currentTime, frame: loopStart }
            } else {
              seekToFrame(stopFrame)
              pause()
              return
            }
          } else {
            seekToFrame(expectedFrame)
          }
        }

        if (useTimelineStore.getState().isPlaying) {
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current)
      }
    }
    // NOTE: currentFrame is intentionally excluded from deps.
    // Including it causes the effect to restart every frame (since seekToFrame updates
    // currentFrame), which resets lastTime on each tick and produces 0.5x playback speed.
    // The frame-driven branch reads currentFrame via useTimelineStore.getState() directly.
    // The audio-driven branch only needs currentFrame at the moment isPlaying turns true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, fps, contentEndFrame, seekToFrame, pause, useAudioDriven])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────

  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const handlePlayPause = useCallback(() => {
    const effectiveStop = outPoint ?? totalFrames - 1
    const effectiveStart = inPoint ?? 0
    if (!isPlaying && currentFrame >= effectiveStop) {
      seekToFrame(effectiveStart)
      if (audioRef.current) audioRef.current.currentTime = effectiveStart / fps
    }
    togglePlayback()
  }, [isPlaying, currentFrame, totalFrames, inPoint, outPoint, fps, seekToFrame, togglePlayback])

  const handleRestart = useCallback(() => {
    const effectiveStart = inPoint ?? 0
    seekToFrame(effectiveStart)
    if (audioRef.current) audioRef.current.currentTime = effectiveStart / fps
  }, [seekToFrame, inPoint, fps])

  const handleSkipEnd = useCallback(() => {
    const effectiveStop = outPoint ?? totalFrames - 1
    seekToFrame(effectiveStop)
    if (useAudioDriven && audioRef.current) {
      audioRef.current.currentTime = effectiveStop / fps
    }
  }, [seekToFrame, totalFrames, outPoint, fps, useAudioDriven])

  // ── Beat detection ──────────────────────────────────────────────────

  const handleDetectBeats = useCallback(async () => {
    // Try to find an audio URL from:
    // 1. Active voice audio (single-character mode)
    // 2. Dialogue lines (multi-character mode — use first line's audio)
    // 3. Music audio from voice store
    let audioUrlToAnalyze: string | null = null

    if (activeVoice?.audioUrl) {
      audioUrlToAnalyze = activeVoice.audioUrl
    } else if (isMultiCharMode && dialogueLines.length > 0) {
      // Try to find any dialogue line with audio
      for (const line of dialogueLines) {
        if (line.audioUrl) {
          audioUrlToAnalyze = line.audioUrl
          break
        }
      }
    }

    // Also check the voice store for generated voice audio as fallback
    if (!audioUrlToAnalyze) {
      const voiceState = useVoiceStore.getState()
      const activeVoice = voiceState.generatedVoices.find((v) => v.id === voiceState.activeVoiceId)
      if (activeVoice?.audioUrl) {
        audioUrlToAnalyze = activeVoice.audioUrl
      }
    }

    if (!audioUrlToAnalyze) {
      console.warn('[TimelineControls] No audio URL available for beat detection')
      return
    }

    await analyzeAudio(audioUrlToAnalyze)
  }, [activeVoice, isMultiCharMode, dialogueLines, analyzeAudio])

  const handleAddMarker = useCallback(() => {
    addMarkerAtPlayhead()
  }, [addMarkerAtPlayhead])

  // ── Time formatting ───────────────────────────────────────────────────

  const currentTime = currentFrame / fps
  const timecode = timeDisplayMode === 'frames' ? String(currentFrame) : formatTimecode(currentTime, fps)
  const maxTimecode =
    timeDisplayMode === 'frames' ? String(contentEndFrame) : formatTimecode(contentEndFrame / fps, fps)

  return (
    <div className="flex items-center gap-2">
      {/* Undo / Redo */}
      <IconButton
        icon={Undo2}
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={() => undo()}
        tooltip="Undo (Ctrl+Z)"
      />
      <IconButton
        icon={Redo2}
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={() => redo()}
        tooltip="Redo (Ctrl+Shift+Z)"
      />

      {/* Separator */}
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Record Mode Toggle */}
      <button
        onClick={toggleRecordMode}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
          isRecordMode
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
        }`}
        title={isRecordMode ? 'Stop Recording (K)' : 'Start Recording (K)'}
        aria-label={isRecordMode ? 'Stop Recording' : 'Start Recording'}
      >
        <Circle size={14} fill={isRecordMode ? 'currentColor' : 'none'} />
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Playback Controls */}
      <IconButton icon={SkipBack} variant="ghost" size="sm" onClick={handleRestart} tooltip="Restart" />
      <IconButton
        icon={isPlaying ? Pause : Play}
        variant="solid"
        state={isPlaying ? 'active' : 'default'}
        size="sm"
        onClick={handlePlayPause}
        tooltip={isPlaying ? 'Pause' : 'Play'}
      />
      <IconButton icon={SkipForward} variant="ghost" size="sm" onClick={handleSkipEnd} tooltip="Skip to end" />
      <IconButton
        icon={Repeat}
        variant="ghost"
        size="sm"
        state={isLooping ? 'active' : 'default'}
        onClick={toggleLoop}
        tooltip={isLooping ? 'Loop: On' : 'Loop: Off'}
      />

      {/* In-point bracket + Timecode + Out-point bracket */}
      <button
        onClick={() => setInPoint(inPoint === currentFrame ? null : currentFrame)}
        className={`ml-1 px-1 py-1 rounded-l text-xs font-mono font-bold transition-colors ${
          inPoint !== null
            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={inPoint !== null ? `In-point: frame ${inPoint} — click to clear` : 'Set in-point at playhead (I)'}
        aria-label={inPoint !== null ? 'Clear in-point' : 'Set in-point'}
      >
        [
      </button>
      <div className="px-2 py-1 bg-zinc-900 text-xs font-mono text-zinc-400">
        {timecode} / {maxTimecode}
      </div>
      <button
        onClick={() => setOutPoint(outPoint === currentFrame ? null : currentFrame)}
        className={`px-1 py-1 rounded-r text-xs font-mono font-bold transition-colors ${
          outPoint !== null
            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
        }`}
        title={outPoint !== null ? `Out-point: frame ${outPoint} — click to clear` : 'Set out-point at playhead (O)'}
        aria-label={outPoint !== null ? 'Clear out-point' : 'Set out-point'}
      >
        ]
      </button>

      {/* Seconds / Frames Toggle */}
      <button
        onClick={toggleTimeDisplayMode}
        className="px-1.5 py-1 rounded text-[10px] font-mono font-medium bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
        title={timeDisplayMode === 'seconds' ? 'Switch to frames' : 'Switch to seconds'}
        aria-label={timeDisplayMode === 'seconds' ? 'Switch to frames' : 'Switch to seconds'}
      >
        {timeDisplayMode === 'seconds' ? 'SEC' : 'FRM'}
      </button>

      {/* Separator */}
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Volume Control */}
      <IconButton
        icon={isMuted ? VolumeX : Volume2}
        variant="ghost"
        size="sm"
        state={isMuted ? 'active' : 'default'}
        onClick={toggleMute}
        tooltip={isMuted ? 'Unmute' : 'Mute'}
      />

      {/* Separator */}
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Beat Detection & Snap */}
      <button
        onClick={handleDetectBeats}
        disabled={isAnalyzing}
        className={`h-7 px-2 flex items-center gap-1 rounded text-[10px] font-medium transition-colors ${
          beatAnalysis
            ? 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
        } ${isAnalyzing ? 'opacity-50 cursor-wait' : ''}`}
        title={
          beatAnalysis ? `Beats detected (${beatAnalysis.bpm} BPM) — click to re-detect` : 'Detect beats from audio'
        }
        aria-label={beatAnalysis ? 'Re-detect beats' : 'Detect beats'}
      >
        <Music size={12} />
        <span className="hidden md:inline">
          {isAnalyzing ? 'Detecting...' : beatAnalysis ? `${beatAnalysis.bpm} BPM` : 'Beats'}
        </span>
      </button>

      {/* Beat markers visibility toggle (only shown when beats are detected) */}
      {beatAnalysis && (
        <button
          onClick={() => setShowBeatMarkers(!showBeatMarkers)}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            showBeatMarkers
              ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
          }`}
          title={showBeatMarkers ? 'Hide beat markers' : 'Show beat markers'}
          aria-label={showBeatMarkers ? 'Hide beat markers' : 'Show beat markers'}
        >
          <Music size={12} />
        </button>
      )}

      {/* Beat snap toggle (only shown when beats are detected) */}
      {beatAnalysis && (
        <button
          onClick={toggleBeatSnap}
          className={`h-7 px-2 flex items-center gap-1 rounded text-[10px] font-medium transition-colors ${
            beatSnapEnabled
              ? 'bg-pink-500/20 text-pink-300 hover:bg-pink-500/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
          }`}
          title={beatSnapEnabled ? 'Disable beat snap' : 'Enable beat snap — clips snap to beat positions when dragged'}
          aria-label={beatSnapEnabled ? 'Disable beat snap' : 'Enable beat snap'}
        >
          <Magnet size={12} />
          <span className="hidden md:inline">Snap</span>
        </button>
      )}

      {/* Separator */}
      <div className="w-px h-5 bg-zinc-700 mx-1" />

      {/* Add Marker */}
      <button
        onClick={handleAddMarker}
        className="h-7 px-2 flex items-center gap-1 rounded text-[10px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50 transition-colors"
        title="Add marker at playhead (M)"
        aria-label="Add marker"
      >
        <Flag size={12} />
        <span className="hidden md:inline">Marker</span>
      </button>
    </div>
  )
})
