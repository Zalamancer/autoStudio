import { create } from 'zustand'

interface PlaybackState {
  // Playback state
  isPlaying: boolean
  currentTime: number // in seconds
  duration: number // in seconds
  fps: number
  /** Derived: currentTime * fps, for convenience */
  currentFrame: number

  // Volume
  volume: number
  isMuted: boolean

  /** When true, dialogue audio is actively driving the timeline frame.
   *  PlaybackControls should NOT advance frames independently. */
  audioDrivingFrames: boolean
  setAudioDrivingFrames: (driving: boolean) => void

  // Actions
  play: () => void
  pause: () => void
  togglePlayback: () => void
  seek: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  reset: () => void
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  currentFrame: 0,
  duration: 30,
  fps: 30,
  volume: 1,
  isMuted: false,
  audioDrivingFrames: false,
  setAudioDrivingFrames: (driving) => set({ audioDrivingFrames: driving }),

  // Actions
  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  seek: (time) =>
    set((state) => {
      const clamped = Math.max(0, Math.min(time, state.duration))
      return {
        currentTime: clamped,
        currentFrame: Math.round(clamped * state.fps),
      }
    }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume: Math.max(0, Math.min(volume, 1)) }),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  reset: () => set({ currentTime: 0, isPlaying: false }),
}))

// Utility: Convert time to frame
export const timeToFrame = (time: number, fps: number): number => {
  return Math.round(time * fps)
}

// Utility: Convert frame to time
export const frameToTime = (frame: number, fps: number): number => {
  return frame / fps
}

/** Formula variables exported from playback state. */
export function getPlaybackFormulaVariables(): Record<string, number> {
  const { currentTime, duration, fps } = usePlaybackStore.getState()
  const frame = Math.round(currentTime * fps)
  const totalFrames = Math.round(duration * fps)
  return {
    frame,
    fps,
    time: currentTime,
    duration,
    totalFrames,
  }
}

// Utility: Format time as MM:SS:FF
export const formatTimecode = (time: number, fps: number): string => {
  const totalFrames = Math.floor(time * fps)
  const frames = totalFrames % fps
  const totalSeconds = Math.floor(totalFrames / fps)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
}
