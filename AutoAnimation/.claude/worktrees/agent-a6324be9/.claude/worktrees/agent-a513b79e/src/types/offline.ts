// ── Offline Support Types ──

/** Network connectivity status */
export type NetworkStatus = 'online' | 'offline' | 'slow'

/** A queued API request for background sync */
export interface OfflineQueueItem {
  /** Unique ID for this queued request */
  id: string
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** Request URL */
  url: string
  /** Request body (serialized) */
  body?: string
  /** Request headers */
  headers?: Record<string, string>
  /** When the request was queued */
  queuedAt: number
  /** Number of retry attempts */
  retryCount: number
  /** Maximum retry attempts before dropping */
  maxRetries: number
  /** Priority (lower = higher priority) */
  priority: number
  /** Description for UI display */
  description: string
  /** Associated project ID */
  projectId?: string
}

/** Status of the offline sync queue */
export interface SyncQueueStatus {
  /** Number of items waiting to sync */
  pendingCount: number
  /** Whether sync is currently in progress */
  isSyncing: boolean
  /** Last successful sync timestamp */
  lastSyncAt: number | null
  /** Items that failed to sync */
  failedCount: number
}

/** Offline project data stored in IndexedDB */
export interface OfflineProject {
  /** Project ID */
  id: string
  /** Project name */
  name: string
  /** Serialized project state (all stores) */
  state: string
  /** Thumbnail data URL */
  thumbnailDataUrl?: string
  /** When the project was last saved locally */
  savedAt: number
  /** Whether this project has unsynced changes */
  isDirty: boolean
  /** Last synced timestamp (from server) */
  lastSyncedAt: number | null
}

/** Feature availability in offline mode */
export interface OfflineFeatureStatus {
  /** Feature name */
  feature: string
  /** Whether the feature is available offline */
  available: boolean
  /** Reason if not available */
  reason?: string
}

/** Standard features and their offline availability */
export const OFFLINE_FEATURE_MAP: Record<string, boolean> = {
  // Available offline
  'canvas-editing': true,
  'timeline-editing': true,
  'text-overlays': true,
  'shapes': true,
  'keyframes': true,
  'layer-management': true,
  'project-save-local': true,
  'undo-redo': true,
  'playback': true,

  // Not available offline (requires API)
  'ai-script-generation': false,
  'ai-character-generation': false,
  'tts-voice-generation': false,
  'ai-orchestrator': false,
  'stock-media-search': false,
  'svg-object-generation': false,
  'ai-video-generation': false,
  'social-publishing': false,
  'cloud-save': false,
  '3d-model-generation': false,
}

/** Configuration for the offline service worker */
export interface OfflineConfig {
  /** Whether offline mode is enabled */
  enabled: boolean
  /** Maximum local storage for offline projects (in MB) */
  maxStorageMB: number
  /** Whether to cache assets aggressively */
  aggressiveCache: boolean
  /** Sync retry interval in ms */
  syncRetryInterval: number
  /** Whether to show offline status indicator */
  showStatusIndicator: boolean
}
