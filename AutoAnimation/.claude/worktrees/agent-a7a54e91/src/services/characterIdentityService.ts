/**
 * Character Identity Service -- resolves characters from identities,
 * creates identities from dialogue characters, and matches plan characters
 * to identities with confidence scoring.
 */

import type { CharacterIdentity } from '@/types/characterIdentity'
import type { ClipPlanCharacter } from '@/types/orchestrator'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useCharacterIdentityStore } from '@/stores/useCharacterIdentityStore'
import type { DialogueCharacter } from '@/stores/useMultiCharacterStore'

/**
 * Resolve a full saved character from an identity ID.
 * Returns the saved character data (2D or 3D) with hydrated sprites/visemes.
 */
export function resolveCharacterFromIdentity(identityId: string): {
  identity: CharacterIdentity
  savedCharacterId: string | null
  saved3DCharacterId: string | null
  voiceId: string | null
} | null {
  const identity = useCharacterIdentityStore.getState().identities.find(
    (i) => i.id === identityId
  )
  if (!identity) return null

  // Verify the linked saved character still exists
  if (identity.savedCharacterId) {
    const saved = useSavedCharactersStore.getState().characters.find(
      (c) => c.id === identity.savedCharacterId
    )
    if (!saved) {
      // Saved character was deleted -- identity is stale but still useful for voiceId
    }
  }

  if (identity.saved3DCharacterId) {
    const saved3D = useSaved3DCharactersStore.getState().characters.find(
      (c) => c.id === identity.saved3DCharacterId
    )
    if (!saved3D) {
      // 3D character was deleted
    }
  }

  return {
    identity,
    savedCharacterId: identity.savedCharacterId,
    saved3DCharacterId: identity.saved3DCharacterId,
    voiceId: identity.voiceId,
  }
}

/**
 * Auto-create an identity from a dialogue character currently on canvas.
 */
export function createIdentityFromDialogueCharacter(
  dialogueChar: DialogueCharacter,
): string {
  const store = useCharacterIdentityStore.getState()

  // Check if an identity already exists for this character
  const existing = dialogueChar.savedCharacterId
    ? store.getIdentityForSavedChar(dialogueChar.savedCharacterId)
    : null
  if (existing) return existing.id

  // Get thumbnail from saved character
  let thumbnailUrl: string | null = null
  if (dialogueChar.savedCharacterId) {
    const saved = useSavedCharactersStore.getState().characters.find(
      (c) => c.id === dialogueChar.savedCharacterId
    )
    thumbnailUrl = saved?.referenceImage || saved?.bodyParts?.body?.[0] || null
  }

  return store.createIdentity(
    dialogueChar.name,
    dialogueChar.savedCharacterId,
    dialogueChar.voiceId,
    {
      thumbnailUrl,
    },
  )
}

/**
 * Match a plan character to an identity with exact-then-fuzzy matching.
 * Returns the matched identity or null.
 */
export function matchPlanCharacterToIdentity(
  planChar: ClipPlanCharacter,
  identities: CharacterIdentity[],
): { identity: CharacterIdentity; confidence: number } | null {
  if (identities.length === 0) return null

  // 1. Exact match by identityId (if plan explicitly references one)
  if (planChar.identityId) {
    const exact = identities.find((i) => i.id === planChar.identityId)
    if (exact) return { identity: exact, confidence: 1.0 }
  }

  // 2. Exact name match
  const exactName = identities.find(
    (i) => i.name.toLowerCase() === planChar.name.toLowerCase()
  )
  if (exactName) return { identity: exactName, confidence: 0.95 }

  // 3. Exact match by savedCharacterName
  if (planChar.savedCharacterName) {
    const byName = identities.find(
      (i) => i.name.toLowerCase() === planChar.savedCharacterName!.toLowerCase()
    )
    if (byName) return { identity: byName, confidence: 0.9 }
  }

  // 4. Fuzzy match (substring)
  const fuzzy = identities.find(
    (i) =>
      i.name.toLowerCase().includes(planChar.name.toLowerCase()) ||
      planChar.name.toLowerCase().includes(i.name.toLowerCase())
  )
  if (fuzzy) return { identity: fuzzy, confidence: 0.7 }

  return null
}
