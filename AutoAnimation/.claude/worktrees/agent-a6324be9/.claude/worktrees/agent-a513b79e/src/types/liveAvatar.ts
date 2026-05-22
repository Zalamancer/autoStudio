/**
 * Live Avatar Streaming Type Definitions
 *
 * Types for real-time character rendering + WebRTC/canvas stream output
 * for use in video conferencing tools and live streaming platforms.
 */

/** Stream output target */
export type StreamTarget =
  | { type: 'virtual-camera' }
  | { type: 'webrtc'; peerId?: string }
  | { type: 'obs-browser-source' }
  | { type: 'screen-share' }

/** Stream quality preset */
export type StreamQuality = 'low' | 'medium' | 'high'

/** Stream quality configuration */
export interface StreamQualityConfig {
  width: number
  height: number
  fps: number
  bitrate: number
}

/** Predefined quality configurations */
export const STREAM_QUALITY_CONFIGS: Record<StreamQuality, StreamQualityConfig> = {
  low: { width: 640, height: 480, fps: 24, bitrate: 1_000_000 },
  medium: { width: 1280, height: 720, fps: 30, bitrate: 2_500_000 },
  high: { width: 1920, height: 1080, fps: 30, bitrate: 5_000_000 },
}

/** Background mode for the live avatar stream */
export type StreamBackground =
  | { type: 'transparent' }
  | { type: 'solid'; color: string }
  | { type: 'image'; src: string }
  | { type: 'blur'; strength: number }
  | { type: 'scene' }

/** Settings for live avatar streaming */
export interface LiveAvatarSettings {
  /** Stream quality preset */
  quality: StreamQuality
  /** Stream target */
  target: StreamTarget
  /** Background mode */
  background: StreamBackground
  /** Whether to show captions/subtitles overlay */
  showCaptions: boolean
  /** Whether to mirror the output horizontally */
  mirrorOutput: boolean
  /** Whether to include audio in the stream */
  includeAudio: boolean
  /** Latency mode: 'low' for live, 'balanced' for quality */
  latencyMode: 'low' | 'balanced'
  /** Custom canvas dimensions override (null = use quality preset) */
  customDimensions: { width: number; height: number } | null
}

/** Status of the live avatar stream */
export type LiveStreamStatus =
  | 'idle'
  | 'initializing'
  | 'streaming'
  | 'paused'
  | 'error'

/** Stats for the active stream */
export interface LiveStreamStats {
  /** Current output FPS */
  fps: number
  /** Total time streaming in seconds */
  uptime: number
  /** Frames dropped due to performance */
  droppedFrames: number
  /** Average render time per frame in ms */
  avgRenderTime: number
  /** Current bitrate in bits/sec */
  bitrate: number
}

/** Default live avatar settings */
export const DEFAULT_LIVE_AVATAR_SETTINGS: LiveAvatarSettings = {
  quality: 'medium',
  target: { type: 'screen-share' },
  background: { type: 'solid', color: '#00FF00' },
  showCaptions: false,
  mirrorOutput: false,
  includeAudio: true,
  latencyMode: 'low',
  customDimensions: null,
}

/** Create empty stream stats */
export function createEmptyStreamStats(): LiveStreamStats {
  return {
    fps: 0,
    uptime: 0,
    droppedFrames: 0,
    avgRenderTime: 0,
    bitrate: 0,
  }
}
