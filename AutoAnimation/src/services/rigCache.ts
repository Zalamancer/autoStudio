/**
 * rigCache — Persists a character's rig (boneriggingSerializedData) to IndexedDB
 * keyed by savedCharacterId. This allows the Animations panel to auto-load a rig
 * for a character without requiring the user to visit the Rig Editor tab first.
 *
 * Previously used localStorage, but rig data can be 1-5 MB per character which
 * exhausts the ~10 MB localStorage quota and prevents Supabase auth tokens from
 * being persisted (causing logout on refresh).
 */

import { BoneRiggingConverter } from '@bonerigging/core'
import type { SerializedRigData, SerializedAnimation, NormalizedAnimation } from '@bonerigging/core'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { createIDBStore } from '@/services/idb'
import type { RigData, BonePoseTrack, BonePose } from '@/types/rig'

// Cache version — increment to invalidate all stale entries from previous sessions.
// v2: fixes stale sourceImageUrl, wrong dimensions, deformed mesh data.
const RIG_CACHE_VERSION = 2

interface VersionedRigCache {
  version: number
  data: SerializedRigData
}

const rigIDB = createIDBStore<VersionedRigCache>('rig-cache-v2', 'rigs')
const sharedAnimIDB = createIDBStore<NormalizedAnimation[]>('rig-cache-shared', 'animations')

// One-time migration: move rig caches from localStorage to IndexedDB
let migrationDone = false
async function migrateFromLocalStorage(): Promise<void> {
  if (migrationDone) return
  migrationDone = true

  try {
    const keysToRemove: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue

      if (key.startsWith('rig-cache-')) {
        const raw = localStorage.getItem(key)
        if (raw) {
          const charId = key.replace('rig-cache-', '')
          await rigIDB.save(charId, JSON.parse(raw))
        }
        keysToRemove.push(key)
      } else if (key === 'bonerigging-shared-animations') {
        const raw = localStorage.getItem(key)
        if (raw) {
          await sharedAnimIDB.save('library', JSON.parse(raw))
        }
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key)
    }

    if (keysToRemove.length > 0) {
      console.log(`[rigCache] Migrated ${keysToRemove.length} entries from localStorage to IndexedDB`)
    }
  } catch (err) {
    console.warn('[rigCache] Migration from localStorage failed:', err)
  }
}

// Run migration on module load
migrateFromLocalStorage()

export async function cacheRigForCharacter(savedCharId: string, data: SerializedRigData): Promise<void> {
  await rigIDB.save(savedCharId, { version: RIG_CACHE_VERSION, data })
}

export async function getCachedRig(savedCharId: string): Promise<SerializedRigData | null> {
  const entry = await rigIDB.get(savedCharId)
  if (!entry) return null
  // Reject stale cache entries from previous versions
  if (entry.version !== RIG_CACHE_VERSION) {
    console.warn(`[rigCache] Stale cache for ${savedCharId} (v${entry.version} vs v${RIG_CACHE_VERSION}), ignoring`)
    return null
  }
  return entry.data
}

/**
 * Get all cached rig entries. Returns array of { charId, data } pairs.
 */
export async function getAllCachedRigs(): Promise<Array<{ charId: string; data: SerializedRigData }>> {
  const keys = await rigIDB.getAllKeys()
  const results: Array<{ charId: string; data: SerializedRigData }> = []
  for (const key of keys) {
    const entry = await rigIDB.get(key)
    if (entry && entry.version === RIG_CACHE_VERSION) {
      results.push({ charId: key, data: entry.data })
    }
  }
  return results
}

/**
 * Load a cached rig for a saved character into useRigStore and assign it to
 * the dialogue character. Returns the resolved rigId on success, null otherwise.
 */
export async function loadCachedRig(savedCharId: string, dialogueCharId: string): Promise<string | null> {
  const data = await getCachedRig(savedCharId)
  if (!data) return null

  try {
    const timelineFps = useTimelineStore.getState().fps || 24
    const { rigData, poseTracks: newTracks } = BoneRiggingConverter.toAutoStudioRigData(data, 'primary', timelineFps)
    const typedRigData = rigData as unknown as RigData
    const typedTracks = newTracks as unknown as BonePoseTrack[]

    const rigDataWithBonerigging: RigData = {
      ...typedRigData,
      boneriggingSerializedData: JSON.stringify(data),
    }

    let resolvedRigId: string | null = null

    useRigStore.setState((state) => {
      // Each character gets its own rig entry. The old "reuse by sourceImageUrl"
      // logic overwrote character A's rig when character B loaded, causing
      // body asset cross-contamination in multi-character mode.
      const targetRigId = rigDataWithBonerigging.id
      state.rigs[targetRigId] = { ...rigDataWithBonerigging, id: targetRigId }
      if (!state.activeRigId) state.activeRigId = targetRigId
      resolvedRigId = targetRigId

      for (const track of typedTracks) {
        const existingIdx = state.poseTracks.findIndex((t) => t.characterId === track.characterId)
        if (existingIdx >= 0) {
          state.poseTracks[existingIdx] = track
        } else {
          state.poseTracks.push(track)
        }
      }
    })

    if (!resolvedRigId) return null

    // Dialogue character — per-character state (safe for multi-character mode)
    const multiStore = useMultiCharacterStore.getState()
    multiStore.updateDialogueCharacter(dialogueCharId, {
      renderMode: 'rigged',
      rigId: resolvedRigId,
    })

    // Global single-character store — only set if no other character already
    // owns the global rig slot, to avoid overwriting character A's body when
    // character B loads its rig.
    const partsStore = useCharacterPartsStore.getState()
    if (partsStore.renderMode !== 'rigged' || !partsStore.rigId) {
      partsStore.setRenderMode('rigged')
      partsStore.setRigId(resolvedRigId)
    }

    return resolvedRigId
  } catch (err) {
    console.error('[rigCache] Failed to load cached rig:', err)
    return null
  }
}

/**
 * Load shared animations from IndexedDB and apply them to a rig.
 * This injects animations into the rig's boneriggingSerializedData and
 * creates matching pose tracks, mirroring AnimationsPanel's applySharedAnimation.
 */
export async function loadSharedAnimationsForRig(rigId: string, characterId: string): Promise<number> {
  let sharedAnims: NormalizedAnimation[]
  try {
    sharedAnims = (await sharedAnimIDB.get('library')) ?? []
  } catch {
    return 0
  }
  if (sharedAnims.length === 0) return 0

  const rigStoreState = useRigStore.getState()
  const rig = rigStoreState.rigs[rigId]
  if (!rig?.boneriggingSerializedData) return 0

  let serialized: SerializedRigData
  try {
    serialized = JSON.parse(rig.boneriggingSerializedData) as SerializedRigData
  } catch {
    return 0
  }

  const targetHeight = Math.max(serialized.imageHeight, 1)
  const timelineFps = useTimelineStore.getState().fps || 24
  const startFrame = 0
  let applied = 0

  for (const anim of sharedAnims) {
    // Skip if already present
    if (serialized.animations.some((a) => a.name === anim.name)) continue

    const serializedAnim: SerializedAnimation = {
      name: anim.name,
      duration: anim.duration,
      fps: anim.fps || 24,
      loop: anim.loop,
      keyframes: anim.keyframes.map((kf) => ({
        time: kf.time,
        deltas: Object.fromEntries(
          Object.entries(kf.deltas).map(([jn, d]) => [jn, { x: d.x * targetHeight, y: d.y * targetHeight }]),
        ),
        pinned: kf.pinned ?? [],
      })),
    }

    serialized.animations.push(serializedAnim)

    const trackId = `track_${Date.now()}_${anim.name}_${applied}`
    const poseTrack: BonePoseTrack = {
      id: trackId,
      characterId,
      keyframes: anim.keyframes.map((kf, i) => {
        const pose: BonePose = {}
        for (const [jn, d] of Object.entries(kf.deltas)) {
          pose[jn] = { dx: d.x * targetHeight, dy: d.y * targetHeight, rotation: 0 }
        }
        return {
          id: `kf_${Date.now()}_${i}`,
          frame: startFrame + Math.round(kf.time * timelineFps),
          pose,
          easing: 'linear' as const,
        }
      }),
    }

    useRigStore.setState((state) => {
      state.rigs[rigId] = {
        ...state.rigs[rigId],
        boneriggingSerializedData: JSON.stringify(serialized),
      }
      state.poseTracks.push(poseTrack)
    })

    applied++
  }

  // Auto-select first animation for this character
  if (applied > 0) {
    const tracks = useRigStore.getState().poseTracks.filter((t) => t.characterId === characterId)
    if (tracks.length > 0) {
      useRigStore.getState().selectCharacterPoseTrack(characterId, tracks[0].id)
    }
  }

  return applied
}
