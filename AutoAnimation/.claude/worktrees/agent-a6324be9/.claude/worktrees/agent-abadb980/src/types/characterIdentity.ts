// ── Character Identity Types ──

/**
 * A character identity is a named binding that points to either a 2D saved character
 * or a 3D saved character (not both). It adds context: which voice, which emotion default,
 * which scenes this character appears in.
 *
 * One saved character can have multiple identities (e.g., "Young Max" and "Old Max"
 * both using the same sprite set but different voices).
 */
export interface CharacterIdentity {
  id: string
  /** Display name (e.g. "Professor Max") */
  name: string
  /** Optional description of the character's role or personality */
  description: string
  /** Reference to a 2D saved character ID (mutually exclusive with saved3DCharacterId) */
  savedCharacterId: string | null
  /** Reference to a 3D saved character ID (mutually exclusive with savedCharacterId) */
  saved3DCharacterId: string | null
  /** ElevenLabs voice ID */
  voiceId: string | null
  /** Default emotion for this character (e.g. "Joy", "Neutral") */
  defaultEmotion: string
  /** Visual art style description */
  visualStyle: string
  /** Thumbnail URL for UI display */
  thumbnailUrl: string | null
  /** ISO timestamp */
  createdAt: string
  /** ISO timestamp */
  updatedAt: string
}
