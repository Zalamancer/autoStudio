/**
 * useRigEditorBridge — Data conversion bridge between AutoStudio's RigData
 * and bonerigging's SerializedRigData for the embedded rig editor tab.
 *
 * Reuses the same logic as RigEditorPage but without navigation.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BoneRiggingConverter } from '@bonerigging/core'
import type { SerializedRigData } from '@bonerigging/core'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { cacheRigForCharacter, getCachedRig } from '@/services/rigCache'
import type { RigData, BonePoseTrack } from '@/types/rig'

/**
 * Persist rig data to useRigStore AND assign it to matching dialogue characters.
 * Used by RigAutoSaver on unmount so work isn't lost when switching tabs.
 */
function saveRigDataOnly(data: SerializedRigData, activeRigId: string | null) {
  try {
    const timelineFps = useTimelineStore.getState().fps || 24
    const { rigData, poseTracks: newTracks } = BoneRiggingConverter.toAutoStudioRigData(data, 'primary', timelineFps)

    const typedRigData = rigData as unknown as RigData
    const typedTracks = newTracks as unknown as BonePoseTrack[]

    // Store boneriggingSerializedData for in-memory use (within-session tab switches).
    // The rig store's partialize() strips it from localStorage, so stale blob URLs
    // won't survive across sessions. At load time, InitialDataLoader patches the URL.
    const rigDataWithBonerigging: RigData = {
      ...typedRigData,
      boneriggingSerializedData: JSON.stringify(data),
    }

    const newSourceUrl = data.sourceImageUrl
    let resolvedRigId: string | null = null

    useRigStore.setState((state) => {
      // Reuse activeRigId if it exists — this is the simplest and most reliable match.
      // Previously this required sourceImageUrl comparison via boneriggingSerializedData,
      // but that field is stripped from localStorage, causing new rigs to be created on
      // every auto-save after page reload (which bloats the store past the 5MB quota).
      let targetRigId: string | null = null

      if (activeRigId && state.rigs[activeRigId]) {
        targetRigId = activeRigId
      }

      if (!targetRigId) {
        targetRigId = rigDataWithBonerigging.id
      }

      // Persist rig data
      state.rigs[targetRigId] = { ...rigDataWithBonerigging, id: targetRigId }
      state.activeRigId = targetRigId
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

    // Assign rig to matching dialogue characters (same as handleSave does).
    // This ensures the Animations panel can find the rig without requiring an explicit Save.
    const savedRigId = resolvedRigId || rigDataWithBonerigging.id
    const partsStore = useCharacterPartsStore.getState()
    partsStore.setRenderMode('rigged')
    partsStore.setRigId(savedRigId)

    const multiStore = useMultiCharacterStore.getState()
    const savedChars = useSavedCharactersStore.getState().characters

    // Match rig's sourceImageUrl to a saved character.
    // The sourceImageUrl may be a composite (all parts combined) which won't match
    // raw bodyParts.body[] sprites, so we fall back to the active dialogue character.
    let matchedSavedChar = savedChars.find((sc) => sc.bodyParts?.body?.some((sprite) => sprite === newSourceUrl))
    if (!matchedSavedChar) {
      const activeChar = multiStore.activeCharacterId
        ? multiStore.characters.find((c) => c.id === multiStore.activeCharacterId)
        : null
      if (activeChar?.savedCharacterId) {
        matchedSavedChar = savedChars.find((sc) => sc.id === activeChar.savedCharacterId)
      }
    }

    // Auto-save to IndexedDB with sourceImageUrl stripped to avoid poisoning
    // the cache with stale blob URLs. InitialDataLoader patches the URL on load.
    if (matchedSavedChar) {
      const cacheData = { ...data, sourceImageUrl: '' }
      cacheRigForCharacter(matchedSavedChar.id, cacheData).catch(() => {})
    }

    const targetCharIds: string[] = []
    if (matchedSavedChar) {
      for (const dc of multiStore.characters) {
        if (dc.savedCharacterId === matchedSavedChar.id) {
          targetCharIds.push(dc.id)
        }
      }
    }
    // Fallback: apply to the active character if no library match found
    if (targetCharIds.length === 0 && multiStore.activeCharacterId) {
      targetCharIds.push(multiStore.activeCharacterId)
    }

    for (const charId of targetCharIds) {
      multiStore.updateDialogueCharacter(charId, {
        renderMode: 'rigged',
        rigId: savedRigId,
      })
    }
  } catch (err) {
    console.error('[useRigEditorBridge] Failed to persist rig data:', err)
  }
}

export function useRigEditorBridge() {
  // _hydrated lives in zustand state so it updates in the SAME React render
  // cycle as activeRigId and existingRig. Using a separate hook caused a race
  // where rigStoreReady=true but activeRigId was still null.
  const rigStoreReady = useRigStore((s) => s._hydrated)
  const activeRigId = useRigStore((s) => s.activeRigId)
  const existingRig = useRigStore((s) => (activeRigId ? s.rigs[activeRigId] : null))
  const poseTracks = useRigStore((s) => s.poseTracks)

  // Convert existing AutoStudio rig to serialized format for the editor.
  // Returns undefined while the store is still hydrating (tri-state):
  //   undefined = still loading from localStorage
  //   null      = hydrated, no saved rig exists
  //   data      = hydrated, rig data available
  const syncData = useMemo<SerializedRigData | null | undefined>(() => {
    if (!rigStoreReady) {
      return undefined
    }
    if (!existingRig) {
      return null
    }
    try {
      // Prefer lossless bonerigging data if available (in-memory, not stripped)
      if (existingRig.boneriggingSerializedData) {
        const parsed = JSON.parse(existingRig.boneriggingSerializedData) as SerializedRigData
        return parsed
      }
      // Return undefined to signal "try IndexedDB next"
      return undefined
    } catch (err) {
      console.error('[useRigEditorBridge] Failed to parse bonerigging data:', err)
      return null
    }
  }, [existingRig, rigStoreReady])

  // Async fallback: try IndexedDB when boneriggingSerializedData was stripped
  // from localStorage by partialize(). IndexedDB has the full lossless data.
  const [idbData, setIdbData] = useState<SerializedRigData | null | undefined>(undefined)
  const needsIdbFallback = rigStoreReady && existingRig && syncData === undefined
  useEffect(() => {
    if (!needsIdbFallback) {
      setIdbData(undefined)
      return
    }
    let cancelled = false
    const tryIdb = async () => {
      // Find saved character ID for this rig
      const multiStore = useMultiCharacterStore.getState()
      const savedChars = useSavedCharactersStore.getState().characters
      for (const sc of savedChars) {
        const cached = await getCachedRig(sc.id)
        if (cached && !cancelled) {
          // Patch in-memory store so subsequent saves don't lose it again
          useRigStore.setState((state) => {
            if (activeRigId && state.rigs[activeRigId]) {
              state.rigs[activeRigId].boneriggingSerializedData = JSON.stringify(cached)
            }
          })
          setIdbData(cached)
          return
        }
      }
      // Also try the active dialogue character's savedCharacterId
      if (multiStore.activeCharacterId) {
        const dc = multiStore.characters.find((c) => c.id === multiStore.activeCharacterId)
        if (dc?.savedCharacterId) {
          const cached = await getCachedRig(dc.savedCharacterId)
          if (cached && !cancelled) {
            useRigStore.setState((state) => {
              if (activeRigId && state.rigs[activeRigId]) {
                state.rigs[activeRigId].boneriggingSerializedData = JSON.stringify(cached)
              }
            })
            setIdbData(cached)
            return
          }
        }
      }
      // No IndexedDB cache found — fall back to lossy conversion
      if (!cancelled) setIdbData(null)
    }
    tryIdb()
    return () => {
      cancelled = true
    }
  }, [needsIdbFallback, activeRigId])

  const initialData = useMemo<SerializedRigData | null | undefined>(() => {
    // Already have lossless data in memory
    if (syncData !== undefined) return syncData
    // Waiting for IndexedDB lookup
    if (needsIdbFallback && idbData === undefined) return undefined
    // IndexedDB returned data
    if (idbData) return idbData
    // Last resort: lossy conversion
    if (!existingRig) return null
    try {
      const timelineFps = useTimelineStore.getState().fps || 24
      return BoneRiggingConverter.fromAutoStudioRigData(existingRig, poseTracks, timelineFps)
    } catch (err) {
      console.error('[useRigEditorBridge] Failed to convert rig data:', err)
      return null
    }
  }, [syncData, idbData, needsIdbFallback, existingRig, poseTracks])

  /**
   * Full save: persist rig data AND assign it to the matching dialogue character.
   * Called from the bonerigging editor's explicit "Save" button.
   */
  const handleSave = useCallback(
    (data: SerializedRigData) => {
      try {
        // Convert back to AutoStudio format
        const timelineFps = useTimelineStore.getState().fps || 24
        const { rigData, poseTracks: newTracks } = BoneRiggingConverter.toAutoStudioRigData(
          data,
          'primary',
          timelineFps,
        )

        const typedRigData = rigData as unknown as RigData
        const typedTracks = newTracks as unknown as BonePoseTrack[]

        const rigDataWithBonerigging: RigData = {
          ...typedRigData,
          boneriggingSerializedData: JSON.stringify(data),
        }

        let resolvedRigId: string | null = null

        useRigStore.setState((state) => {
          let targetRigId: string | null = null

          if (activeRigId && state.rigs[activeRigId]) {
            targetRigId = activeRigId
          }

          if (!targetRigId) {
            targetRigId = rigDataWithBonerigging.id
          }

          state.rigs[targetRigId] = { ...rigDataWithBonerigging, id: targetRigId }
          state.activeRigId = targetRigId
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

        const savedRigId = resolvedRigId || rigDataWithBonerigging.id
        const partsStore = useCharacterPartsStore.getState()
        partsStore.setRenderMode('rigged')
        partsStore.setRigId(savedRigId)

        // Find which dialogue character(s) should receive this rig by matching
        // the rig's source image against the saved character library.
        // The sourceImageUrl may be a composite (all parts combined) which won't
        // match raw bodyParts.body[] sprites, so fall back to active dialogue character.
        const multiStore = useMultiCharacterStore.getState()
        const sourceImageUrl = data.sourceImageUrl
        const savedChars = useSavedCharactersStore.getState().characters

        let matchedSavedChar = savedChars.find((sc) => sc.bodyParts?.body?.some((sprite) => sprite === sourceImageUrl))
        if (!matchedSavedChar) {
          const activeChar = multiStore.activeCharacterId
            ? multiStore.characters.find((c) => c.id === multiStore.activeCharacterId)
            : null
          if (activeChar?.savedCharacterId) {
            matchedSavedChar = savedChars.find((sc) => sc.id === activeChar.savedCharacterId)
          }
        }

        // Cache rig to IndexedDB so the orchestrator and AnimationsPanel
        // can auto-load without requiring the user to revisit the Rig Editor.
        if (matchedSavedChar) {
          cacheRigForCharacter(matchedSavedChar.id, data).catch(() => {})
        }

        const targetCharIds: string[] = []
        if (matchedSavedChar) {
          for (const dc of multiStore.characters) {
            if (dc.savedCharacterId === matchedSavedChar.id) {
              targetCharIds.push(dc.id)
            }
          }
        }

        // Fallback: if no match found (e.g. custom upload), apply to active character
        if (targetCharIds.length === 0 && multiStore.activeCharacterId) {
          targetCharIds.push(multiStore.activeCharacterId)
        }

        for (const charId of targetCharIds) {
          multiStore.updateDialogueCharacter(charId, {
            renderMode: 'rigged',
            rigId: savedRigId,
          })

          useRigStore.setState((state) => {
            for (const track of state.poseTracks) {
              if (track.characterId === 'primary') {
                track.characterId = charId
              }
            }
          })
        }
      } catch (err) {
        console.error('[useRigEditorBridge] Failed to save rig:', err)
      }
    },
    [activeRigId],
  )

  /**
   * Auto-save: only persist rig data, don't assign to any character.
   * Called by RigAutoSaver on unmount (tab switch) to preserve work-in-progress.
   */
  const handleAutoSave = useCallback(
    (data: SerializedRigData) => {
      saveRigDataOnly(data, activeRigId)
    },
    [activeRigId],
  )

  return { initialData, handleSave, handleAutoSave }
}
