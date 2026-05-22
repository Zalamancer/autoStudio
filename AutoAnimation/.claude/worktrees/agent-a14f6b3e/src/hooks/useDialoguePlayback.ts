import { useEffect, useRef, useCallback } from 'react'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { getWordFrameRange } from '@/services/transcriptSync'

/**
 * Seek the timeline playhead to the start frame of a specific word in a dialogue line.
 * Used by the transcript editor for click-to-seek.
 */
export function seekToWord(lineId: string, wordIndex: number): void {
  const range = getWordFrameRange(lineId, wordIndex)
  if (range) {
    useTimelineStore.getState().seekToFrame(range.startFrame)
  }
}

/**
 * Coordinates audio playback for multi-character dialogue lines.
 * Plays the correct character's audio at the right time based on timeline position.
 */
export function useDialoguePlayback() {
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const activeAudioRef = useRef<string | null>(null)
  /** Track whether the current active audio has actually started playing */
  const audioPlayingRef = useRef<boolean>(false)

  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const fps = useTimelineStore((s) => s.fps)
  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const characters = useMultiCharacterStore((s) => s.characters)
  const generatedVoices = useVoiceStore((s) => s.generatedVoices)
  const isMuted = usePlaybackStore((s) => s.isMuted)
  const volume = usePlaybackStore((s) => s.volume)

  const isMultiCharMode = characters.length > 0 || dialogueLines.length > 0

  // Pre-load audio for all dialogue lines
  useEffect(() => {
    if (!isMultiCharMode) return

    const map = audioMapRef.current
    let loadedCount = 0

    dialogueLines.forEach((line) => {
      if (!line.generatedVoiceId) return
      const voice = generatedVoices.find((v) => v.id === line.generatedVoiceId)
      if (!voice?.audioUrl) return

      // Only create Audio if not already cached for this line
      if (!map.has(line.id)) {
        const audio = new Audio(voice.audioUrl)
        audio.preload = 'auto'
        audio.volume = isMuted ? 0 : volume
        map.set(line.id, audio)
        loadedCount++
      }
    })

    if (loadedCount > 0) {
      console.log(`[DialoguePlayback] Pre-loaded ${loadedCount} audio elements (total: ${map.size})`)
    }

    // Clean up audio elements for removed lines
    const lineIds = new Set(dialogueLines.map((l) => l.id))
    for (const [id, audio] of map.entries()) {
      if (!lineIds.has(id)) {
        audio.pause()
        audio.src = ''
        map.delete(id)
      }
    }
  }, [dialogueLines, generatedVoices, isMultiCharMode, isMuted, volume])

  // Sync mute/volume to all cached audio elements
  useEffect(() => {
    audioMapRef.current.forEach((audio) => {
      audio.volume = isMuted ? 0 : volume
    })
  }, [isMuted, volume])

  // Stop all audio
  const stopAll = useCallback(() => {
    audioMapRef.current.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    activeAudioRef.current = null
    audioPlayingRef.current = false
    usePlaybackStore.getState().setAudioDrivingFrames(false)
  }, [])

  // Helper to start audio with retry logic
  const startAudio = useCallback((audio: HTMLAudioElement, offsetSeconds: number) => {
    audioPlayingRef.current = false

    // Sync volume before playing
    const { isMuted: muted, volume: vol } = usePlaybackStore.getState()
    audio.volume = muted ? 0 : vol
    audio.currentTime = offsetSeconds

    const tryPlay = () => {
      audio.play()
        .then(() => {
          audioPlayingRef.current = true
        })
        .catch((err) => {
          // If audio isn't loaded yet, wait for canplay and retry
          if (audio.readyState < 2) {
            console.log('[DialoguePlayback] Audio not ready (readyState:', audio.readyState, ') — waiting for canplay')
            const onCanPlay = () => {
              audio.removeEventListener('canplay', onCanPlay)
              audio.currentTime = offsetSeconds
              audio.play()
                .then(() => { audioPlayingRef.current = true })
                .catch((e) => console.warn('[DialoguePlayback] Retry play failed:', e))
            }
            audio.addEventListener('canplay', onCanPlay)
          } else {
            console.warn('[DialoguePlayback] audio.play() failed:', err)
          }
        })
    }

    tryPlay()
  }, [])

  // Playback sync loop
  useEffect(() => {
    if (!isPlaying || !isMultiCharMode || dialogueLines.length === 0) {
      stopAll()
      return
    }

    let animationId: number
    /** Track which dialogue line is currently driving frames (for audio-driven sync) */
    let activeLineForSync: typeof dialogueLines[0] | null = null

    const syncAudio = () => {
      const timelineState = useTimelineStore.getState()
      let currentFrame = timelineState.currentFrame
      const map = audioMapRef.current

      // ── Audio-driven frame correction ──
      // When audio is actively playing for a dialogue line, derive the
      // timeline frame from audio.currentTime instead of the wallclock.
      // This keeps visemes, captions, and audio perfectly in sync.
      if (activeLineForSync && activeAudioRef.current && audioPlayingRef.current) {
        const audio = map.get(activeAudioRef.current)
        if (audio && !audio.paused && audio.currentTime > 0) {
          const audioFrame = activeLineForSync.startFrame + Math.floor(audio.currentTime * fps)
          // Correct frame to match audio position
          if (audioFrame !== currentFrame) {
            timelineState.seekToFrame(audioFrame)
            currentFrame = audioFrame
          }
          // Signal that audio is driving frames (prevents PlaybackControls from double-advancing)
          if (!usePlaybackStore.getState().audioDrivingFrames) {
            usePlaybackStore.getState().setAudioDrivingFrames(true)
          }
        }
      } else {
        // No active audio driving — let PlaybackControls handle frame advancement
        if (usePlaybackStore.getState().audioDrivingFrames) {
          usePlaybackStore.getState().setAudioDrivingFrames(false)
        }
      }

      // Find which dialogue line should be playing at the current frame
      const activeLine = dialogueLines.find(
        (l) => currentFrame >= l.startFrame && currentFrame < l.endFrame && l.generatedVoiceId
      )

      if (activeLine && map.has(activeLine.id)) {
        const audio = map.get(activeLine.id)!

        if (activeAudioRef.current !== activeLine.id) {
          // New line — stop previous audio and start this one
          if (activeAudioRef.current) {
            const prev = map.get(activeAudioRef.current)
            if (prev) {
              prev.pause()
              prev.currentTime = 0
            }
          }

          // Start new audio at correct offset
          const offsetFrames = currentFrame - activeLine.startFrame
          const offsetSeconds = offsetFrames / fps
          activeAudioRef.current = activeLine.id
          activeLineForSync = activeLine
          startAudio(audio, offsetSeconds)
        } else if (!audioPlayingRef.current && audio.paused) {
          // Same line but audio isn't playing (failed to start or was paused) — retry
          const offsetFrames = currentFrame - activeLine.startFrame
          const offsetSeconds = offsetFrames / fps
          startAudio(audio, offsetSeconds)
        }
      } else {
        // No active line - stop any playing audio
        if (activeAudioRef.current) {
          const prev = map.get(activeAudioRef.current)
          if (prev) {
            prev.pause()
            prev.currentTime = 0
          }
          activeAudioRef.current = null
          activeLineForSync = null
          audioPlayingRef.current = false
        }
      }

      if (useTimelineStore.getState().isPlaying) {
        animationId = requestAnimationFrame(syncAudio)
      }
    }

    animationId = requestAnimationFrame(syncAudio)

    return () => {
      cancelAnimationFrame(animationId)
      stopAll()
    }
  }, [isPlaying, isMultiCharMode, dialogueLines, fps, stopAll, startAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioMapRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      audioMapRef.current.clear()
    }
  }, [])
}
