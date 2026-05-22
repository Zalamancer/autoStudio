/**
 * useRigEditorBridge — Data conversion bridge between AutoStudio's RigData
 * and bonerigging's SerializedRigData for the embedded rig editor tab.
 *
 * Reuses the same logic as RigEditorPage but without navigation.
 */

import { useCallback, useMemo } from 'react'
import { BoneRiggingConverter } from '@bonerigging/core'
import type { SerializedRigData } from '@bonerigging/core'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { cacheRigForCharacter } from '@/services/rigCache'
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

    const rigDataWithBonerigging: RigData = {
      ...typedRigData,
      boneriggingSerializedData: JSON.stringify(data),
    }

    const newSourceUrl = data.sourceImageUrl
    let resolvedRigId: string | null = null

    useRigStore.setState((state) => {
      // Check if the existing rig has the same source image (same character being edited).
      // If the source image changed, the user loaded a different character in the rig editor
      // — we must NOT overwrite the previous character's rig.
      let targetRigId: string | null = null

      if (activeRigId && state.rigs[activeRigId]) {
        // Parse existing rig's sourceImageUrl to compare
        let existingSourceUrl: string | null = null
        try {
          if (state.rigs[activeRigId].boneriggingSerializedData) {
            const parsed = JSON.parse(state.rigs[activeRigId].boneriggingSerializedData!) as SerializedRigData
            existingSourceUrl = parsed.sourceImageUrl || null
          }
        } catch {
          /* ignore */
        }

        if (existingSourceUrl && newSourceUrl && existingSourceUrl === newSourceUrl) {
          targetRigId = activeRigId
        }
      }

      // If we're not updating an existing rig, search for another rig that matches
      // this source image, or create a brand new one.
      if (!targetRigId) {
        const matchingRigId = Object.keys(state.rigs).find((rid) => {
          try {
            if (!state.rigs[rid].boneriggingSerializedData) return false
            const parsed = JSON.parse(state.rigs[rid].boneriggingSerializedData!) as SerializedRigData
            return parsed.sourceImageUrl === newSourceUrl
          } catch {
            return false
          }
        })

        targetRigId = matchingRigId || rigDataWithBonerigging.id
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

    // Cache rig data to IndexedDB so the orchestrator and AnimationsPanel
    // can auto-load it without requiring the user to visit the Rig Editor again.
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
  const activeRigId = useRigStore((s) => s.activeRigId)
  const existingRig = useRigStore((s) => (activeRigId ? s.rigs[activeRigId] : null))
  const poseTracks = useRigStore((s) => s.poseTracks)

  // Convert existing AutoStudio rig to serialized format for the editor.
  const initialData = useMemo<SerializedRigData | null>(() => {
    if (!existingRig) return null
    try {
      // Prefer lossless bonerigging data if available
      if (existingRig.boneriggingSerializedData) {
        return JSON.parse(existingRig.boneriggingSerializedData) as SerializedRigData
      }
      // Fall back to lossy conversion from AutoStudio format
      const timelineFps = useTimelineStore.getState().fps || 24
      return BoneRiggingConverter.fromAutoStudioRigData(existingRig, poseTracks, timelineFps)
    } catch (err) {
      console.error('[useRigEditorBridge] Failed to convert rig data:', err)
      return null
    }
  }, [existingRig, poseTracks])

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

        const newSourceUrl = data.sourceImageUrl
        let resolvedRigId: string | null = null

        useRigStore.setState((state) => {
          // Same logic as saveRigDataOnly: don't overwrite an existing rig if
          // the source image changed (different character was loaded in editor).
          let targetRigId: string | null = null

          if (activeRigId && state.rigs[activeRigId]) {
            let existingSourceUrl: string | null = null
            try {
              if (state.rigs[activeRigId].boneriggingSerializedData) {
                const parsed = JSON.parse(state.rigs[activeRigId].boneriggingSerializedData!) as SerializedRigData
                existingSourceUrl = parsed.sourceImageUrl || null
              }
            } catch {
              /* ignore */
            }

            if (existingSourceUrl && newSourceUrl && existingSourceUrl === newSourceUrl) {
              targetRigId = activeRigId
            }
          }

          if (!targetRigId) {
            // Find existing rig for this source image, or create new
            const matchingRigId = Object.keys(state.rigs).find((rid) => {
              try {
                if (!state.rigs[rid].boneriggingSerializedData) return false
                const parsed = JSON.parse(state.rigs[rid].boneriggingSerializedData!) as SerializedRigData
                return parsed.sourceImageUrl === newSourceUrl
              } catch {
                return false
              }
            })
            targetRigId = matchingRigId || rigDataWithBonerigging.id
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
