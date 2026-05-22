// ── Avatar Character Types ──

export type AvatarStyle = 'realistic' | 'semi-realistic' | 'illustrated' | 'anime'

export interface SavedAvatarCharacter {
  id: string
  name: string
  description: string
  style: AvatarStyle
  thumbnailDataUrl: string
  /** IndexedDB blob ID for the base bust-shot image */
  baseBlobId: string
  source: 'text' | 'photo'
  sourcePhotoDataUrl?: string
  createdAt: number
}

export interface AvatarCharacter {
  id: string
  name: string
  savedAvatarCharacterId: string
  position: { x: number; y: number }
  scale: number
  zIndex: number
  visible: boolean
  locked: boolean
  opacity: number
  color: string
  startFrame?: number
  endFrame?: number
  /** Generated video URL (from image-to-video pipeline) */
  videoUrl?: string
  /** Video generation job ID for polling */
  videoJobId?: string
  videoStatus?: 'idle' | 'generating' | 'ready' | 'error'
  videoError?: string
  /** Lip-synced video URL (from lip-sync pipeline) */
  lipSyncVideoUrl?: string
  lipSyncStatus?: 'idle' | 'generating' | 'ready' | 'error'
  lipSyncError?: string
}
