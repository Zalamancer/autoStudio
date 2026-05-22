export type ClipSourceType =
  | 'text'
  | 'media'
  | 'lottie'
  | 'shape'
  | 'svgObject'
  | 'character3d'
  | 'htmlTemplate'
  | 'dialogue'
  | 'dialogueLine'
  | 'video'

export interface UnifiedClip {
  id: string
  sourceType: ClipSourceType
  sourceId: string // ID in the native store
  startFrame: number
  endFrame: number
  name: string
  color: string
  locked: boolean
}

export type UnifiedTrackKind = 'video' | 'audio'

export interface UnifiedTrack {
  id: string
  kind: UnifiedTrackKind
  number: number // V1, V2... or A1, A2...
  name: string
  clips: UnifiedClip[]
  visible: boolean
  locked: boolean
  muted: boolean
  height: number
  expanded: boolean // show sub-tracks (keyframes, dialogue details)
}
