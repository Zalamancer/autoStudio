import { useEffect, useRef, useCallback, useMemo } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { useTimelineStore, useVoiceStore, usePlaybackStore, useMultiCharacterStore, useTextOverlayStore, useShapeStore, useAnimationStore, useHTMLTemplateLayerStore } from '@/stores'
import { useMediaStore } from '@/stores/useMediaStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { useAvatarCharacterStore } from '@/stores/useAvatarCharacterStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'

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
  const tracks = useTimelineStore((s) => s.tracks)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const generatedVoices = useVoiceStore((s) => s.generatedVoices)
  const activeVoiceId = useVoiceStore((s) => s.activeVoiceId)
  const textOverlays = useTextOverlayStore((s) => s.overlays)
  const shapes = useShapeStore((s) => s.shapes)
  const mediaCanvasItems = useMediaStore((s) => s.canvasItems)
  const activeAnimations = useAnimationStore((s) => s.activeAnimations)
  const svgObjects = useSVGObjectStore((s) => s.composition?.objects ?? EMPTY_ARRAY)
  const htmlTemplates = useHTMLTemplateLayerStore((s) => s.templates)
  const motionGraphics = useMotionGraphicStore((s) => s.instances)
  const characters3D = use3DCharacterStore((s) => s.characters)
  const pixelArtCharacters = usePixelArtCharacterStore((s) => s.characters)
  const avatarCharacters = useAvatarCharacterStore((s) => s.characters)
  const videoLayers = useVideoLayerStore((s) => s.videos)

  return useMemo(() => {
    let maxFrame = 0

    for (const line of dialogueLines) {
      if (line.endFrame > maxFrame) maxFrame = line.endFrame
    }
    for (const overlay of textOverlays) {
      const ef = overlay.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const shape of shapes) {
      const ef = shape.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const item of mediaCanvasItems) {
      const ef = item.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const anim of activeAnimations) {
      const ef = anim.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const obj of svgObjects) {
      const ef = obj.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const tpl of htmlTemplates) {
      const ef = tpl.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const mg of motionGraphics) {
      const ef = mg.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const c3d of characters3D) {
      const ef = c3d.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const pac of pixelArtCharacters) {
      const ef = pac.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const avc of avatarCharacters) {
      const ef = avc.endFrame ?? 0
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    for (const vid of videoLayers) {
      const ef = Math.ceil(vid.durationSeconds * fps)
      if (ef > maxFrame && isFinite(ef)) maxFrame = ef
    }
    // Timeline track clips
    for (const track of tracks) {
      for (const clip of track.clips) {
        if (clip.endFrame > maxFrame) maxFrame = clip.endFrame
      }
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
  }, [dialogueLines, textOverlays, shapes, mediaCanvasItems, activeAnimations, svgObjects, htmlTemplates, motionGraphics, characters3D, pixelArtCharacters, avatarCharacters, videoLayers, tracks, generatedVoices, activeVoiceId, fps])
}

export function PlaybackControls() {
  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const togglePlayback = useTimelineStore((s) => s.togglePlayback)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)
  const fps = useTimelineStore((s) => s.fps)
  const pause = useTimelineStore((s) => s.pause)
  const { isMuted, toggleMute, volume } = usePlaybackStore()
  const { activeVoiceId, generatedVoices } = useVoiceStore()
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const isMultiCharMode = dialogueLines.length > 0

  const contentEndFrame = useContentEndFrame()
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animationRef = useRef<number | null>(null)

  // Get the active voice audio URL (only used for single-character mode)
  const activeVoice = generatedVoices.find(v => v.id === activeVoiceId)
  const audioUrl = activeVoice?.audioUrl

  // In single-character mode: create audio element to drive playback
  // In multi-character mode: useDialoguePlayback handles all audio, we just drive frames
  const useAudioDriven = !isMultiCharMode && !!audioUrl

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
  // Never shrink below current totalFrames so the user can freely extend the timeline.
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
        const state = useTimelineStore.getState()
        const stopFrame = state.outPoint ?? state.totalFrames - 1
        const startFrame = state.inPoint ?? 0
        const hasWorkArea = state.inPoint !== null || state.outPoint !== null
        if (frame >= stopFrame) {
          if (hasWorkArea) {
            audio.currentTime = startFrame / fps
            seekToFrame(startFrame)
          } else {
            audio.currentTime = stopFrame / fps
            seekToFrame(stopFrame)
            pause(); audio.pause()
          }
        } else {
          seekToFrame(frame)
        }
      }

      const animate = () => {
        if (!useTimelineStore.getState().isPlaying) return
        const frame = Math.floor(audio.currentTime * fps)
        const state = useTimelineStore.getState()
        const stopFrame = state.outPoint ?? state.totalFrames - 1
        const startFrame = state.inPoint ?? 0
        const hasWorkArea = state.inPoint !== null || state.outPoint !== null
        if (frame !== state.currentFrame) {
          if (frame >= stopFrame) {
            if (hasWorkArea) {
              audio.currentTime = startFrame / fps
              seekToFrame(startFrame)
            } else {
              audio.currentTime = stopFrame / fps
              seekToFrame(stopFrame)
              pause(); audio.pause(); return
            }
            animationRef.current = requestAnimationFrame(animate)
            return
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
      let lastTime = performance.now()

      const animate = (currentTime: number) => {
        // If dialogue audio is actively driving frames, skip independent frame advancement
        // to prevent double-driving / desync between audio and visemes/captions
        if (usePlaybackStore.getState().audioDrivingFrames) {
          lastTime = currentTime
          if (useTimelineStore.getState().isPlaying) {
            animationRef.current = requestAnimationFrame(animate)
          }
          return
        }

        const deltaTime = currentTime - lastTime
        const frameDelta = (deltaTime / 1000) * fps

        if (frameDelta >= 1) {
          const state = useTimelineStore.getState()
          const newFrame = state.currentFrame + Math.floor(frameDelta)
          const stopFrame = state.outPoint ?? state.totalFrames - 1
          const startFrame = state.inPoint ?? 0
          const hasWorkArea = state.inPoint !== null || state.outPoint !== null

          if (newFrame >= stopFrame) {
            if (hasWorkArea) {
              seekToFrame(startFrame)
            } else {
              seekToFrame(stopFrame)
              pause()
              return
            }
          } else {
            seekToFrame(newFrame)
          }
          lastTime = currentTime
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
  }, [isPlaying, fps, seekToFrame, pause, useAudioDriven, currentFrame])

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

  const inPoint = useTimelineStore((s) => s.inPoint)
  const outPoint = useTimelineStore((s) => s.outPoint)

  const handlePlayPause = useCallback(() => {
    const stopFrame = outPoint ?? totalFrames - 1
    const startFrame = inPoint ?? 0
    if (!isPlaying && currentFrame >= stopFrame) {
      seekToFrame(startFrame)
      if (audioRef.current) audioRef.current.currentTime = startFrame / fps
    }
    togglePlayback()
  }, [isPlaying, currentFrame, totalFrames, inPoint, outPoint, fps, seekToFrame, togglePlayback])

  const handleRestart = useCallback(() => {
    const startFrame = inPoint ?? 0
    seekToFrame(startFrame)
    if (audioRef.current) audioRef.current.currentTime = startFrame / fps
  }, [seekToFrame, inPoint, fps])

  const handleSkipEnd = useCallback(() => {
    const stopFrame = outPoint ?? totalFrames - 1
    seekToFrame(stopFrame)
    if (useAudioDriven && audioRef.current) {
      audioRef.current.currentTime = stopFrame / fps
    }
  }, [seekToFrame, totalFrames, outPoint, fps, useAudioDriven])

  const handleFullscreen = () => {
    const canvas = document.querySelector('.video-canvas-container')
    if (canvas) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        canvas.requestFullscreen()
      }
    }
  }

  const formatTime = (frames: number) => {
    const totalSeconds = frames / fps
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center justify-center gap-2 py-3 bg-zinc-800/50">
      <IconButton
        icon={SkipBack}
        variant="ghost"
        onClick={handleRestart}
        tooltip="Restart"
      />

      <IconButton
        icon={isPlaying ? Pause : Play}
        variant="solid"
        state={isPlaying ? 'active' : 'default'}
        onClick={handlePlayPause}
        tooltip={isPlaying ? 'Pause' : 'Play'}
      />

      <IconButton
        icon={SkipForward}
        variant="ghost"
        onClick={handleSkipEnd}
        tooltip="Skip to End"
      />

      {/* Time Display — uses contentEndFrame which is the REAL content end */}
      <span className="text-xs text-zinc-400 font-mono min-w-[80px] text-center">
        {formatTime(currentFrame)} / {formatTime(contentEndFrame)}
      </span>

      <IconButton
        icon={isMuted ? VolumeX : Volume2}
        variant="ghost"
        state={isMuted ? 'active' : 'default'}
        onClick={toggleMute}
        tooltip={isMuted ? 'Unmute' : 'Mute'}
      />

      <IconButton
        icon={Maximize2}
        variant="ghost"
        onClick={handleFullscreen}
        tooltip="Fullscreen"
      />
    </div>
  )
}
