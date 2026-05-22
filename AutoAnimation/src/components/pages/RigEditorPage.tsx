/**
 * RigEditorPage — Glue page that renders the bonerigging editor
 * on the /rig route. Handles data conversion between AutoStudio's
 * RigData format and bonerigging's SerializedRigData format.
 */

import { useCallback, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { RiggingEditor } from '@bonerigging/editor'
import { BoneRiggingConverter } from '@bonerigging/core'
import type { SerializedRigData } from '@bonerigging/core'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { RigData, BonePoseTrack } from '@/types/rig'

export default function RigEditorPage() {
  const navigate = useNavigate()
  const { rigId } = useParams<{ rigId?: string }>()
  const location = useLocation()

  const rigStoreReady = useRigStore((s) => s._hydrated)

  // Get existing rig data if editing an existing rig
  const existingRig = useRigStore((s) => (rigId ? s.rigs[rigId] : null))
  const poseTracks = useRigStore((s) => s.poseTracks)

  // Convert existing AutoStudio rig to serialized format for the editor.
  // Returns undefined while store is hydrating, null if no rig, or data.
  const initialData = useMemo<SerializedRigData | null | undefined>(() => {
    if (!rigStoreReady) return undefined
    if (!existingRig) return null
    try {
      if (existingRig.boneriggingSerializedData) {
        return JSON.parse(existingRig.boneriggingSerializedData) as SerializedRigData
      }
      return BoneRiggingConverter.fromAutoStudioRigData(existingRig, poseTracks)
    } catch (err) {
      console.error('[RigEditorPage] Failed to convert rig data:', err)
      return null
    }
  }, [existingRig, poseTracks, rigStoreReady])

  // Get initial image URL from navigation state (for new rigs)
  const initialImageUrl = (location.state as { imageUrl?: string } | null)?.imageUrl

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

        // Cast the converter output to AutoStudio's stricter types.
        // The converter uses `string` for category/easing but the values
        // are always valid union members (e.g. 'root', 'head', 'ease-in-out').
        const typedRigData = rigData as unknown as RigData
        const typedTracks = newTracks as unknown as BonePoseTrack[]

        // Store the original serialized data for full-fidelity playback
        const rigDataWithBonerigging: RigData = {
          ...typedRigData,
          boneriggingSerializedData: JSON.stringify(data),
        }

        // Use setState so zustand (+ immer) properly notifies subscribers.
        // Don't overwrite an existing rig if the source image changed (different character).
        const newSourceUrl = data.sourceImageUrl
        let resolvedRigId: string | null = null

        useRigStore.setState((state) => {
          let targetRigId: string | null = null

          if (rigId && state.rigs[rigId]) {
            // Route param provides explicit rigId — check source image match
            let existingSourceUrl: string | null = null
            try {
              if (state.rigs[rigId].boneriggingSerializedData) {
                const parsed = JSON.parse(state.rigs[rigId].boneriggingSerializedData!) as SerializedRigData
                existingSourceUrl = parsed.sourceImageUrl || null
              }
            } catch {
              /* ignore */
            }

            if (!existingSourceUrl || !newSourceUrl || existingSourceUrl === newSourceUrl) {
              targetRigId = rigId
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

          // Merge pose tracks
          for (const track of typedTracks) {
            const existingIdx = state.poseTracks.findIndex((t) => t.characterId === track.characterId)
            if (existingIdx >= 0) {
              state.poseTracks[existingIdx] = track
            } else {
              state.poseTracks.push(track)
            }
          }
        })

        // Switch canvas to rigged render mode so the deformation renderer activates
        const savedRigId = resolvedRigId || rigDataWithBonerigging.id
        const partsStore = useCharacterPartsStore.getState()
        partsStore.setRenderMode('rigged')
        partsStore.setRigId(savedRigId)

        // Find which dialogue character(s) should receive this rig by matching
        // the rig's source image against the saved character library.
        const multiStore = useMultiCharacterStore.getState()
        const sourceImageUrl = data.sourceImageUrl
        const savedChars = useSavedCharactersStore.getState().characters

        const matchedSavedChar = savedChars.find((sc) =>
          sc.bodyParts?.body?.some((sprite) => sprite === sourceImageUrl),
        )

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
        }

        console.log('[RigEditorPage] Rig saved successfully:', rigData.id)
      } catch (err) {
        console.error('[RigEditorPage] Failed to save rig:', err)
      }

      // Navigate back to editor
      navigate('/editor')
    },
    [rigId, navigate],
  )

  const handleCancel = useCallback(() => {
    navigate('/editor')
  }, [navigate])

  return (
    <RiggingEditor
      onSave={handleSave}
      onCancel={handleCancel}
      initialData={initialData}
      initialImageUrl={initialImageUrl}
      height="100vh"
    />
  )
}
