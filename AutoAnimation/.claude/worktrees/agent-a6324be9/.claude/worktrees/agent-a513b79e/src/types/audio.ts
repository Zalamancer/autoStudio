export type AudioTrackType = 'music' | 'voice' | 'sfx' | 'ambient'

export interface AudioClip {
  id: string
  trackId: string
  buffer: AudioBuffer | null
  sourceUrl: string
  startTime: number
  duration: number
  offset: number
  fadeIn: number
  fadeOut: number
  name: string
}

export interface AudioTrack {
  id: string
  type: AudioTrackType
  name: string
  clips: AudioClip[]
  volume: number
  pan: number
  muted: boolean
  solo: boolean
}

export interface WaveformData {
  peaks: Float32Array
  troughs: Float32Array
  rms: Float32Array
  duration: number
  sampleRate: number
}

export interface AudioState {
  tracks: AudioTrack[]
  masterVolume: number
  isMuted: boolean
}
