import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, ExternalLink, Share2, Pencil, Trash2 } from 'lucide-react'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useEditorStore, useTimelineStore } from '@/stores'
import { loadCachedRig } from '@/services/rigCache'
import { createIDBStore } from '@/services/idb'
import type { SerializedRigData, SerializedAnimation, NormalizedAnimation } from '@bonerigging/core'
import type { BonePoseTrack, BonePose } from '@/types/rig'

const sharedAnimIDB = createIDBStore<NormalizedAnimation[]>('rig-cache-shared', 'animations')

async function loadSharedLibrary(): Promise<NormalizedAnimation[]> {
  try {
    return (await sharedAnimIDB.get('library')) ?? []
  } catch {
    return []
  }
}

/**
 * Denormalize a NormalizedAnimation and inject it into both the rig's
 * boneriggingSerializedData (for the renderer) and poseTracks (for the UI index mapping).
 */
function applySharedAnimation(anim: NormalizedAnimation, rigId: string, characterId: string) {
  const rigStore = useRigStore.getState()
  const rig = rigStore.rigs[rigId]
  if (!rig?.boneriggingSerializedData) return

  let serialized: SerializedRigData
  try {
    serialized = JSON.parse(rig.boneriggingSerializedData) as SerializedRigData
  } catch {
    return
  }

  const targetHeight = Math.max(serialized.imageHeight, 1)
  const timelineFps = useTimelineStore.getState().fps || 24
  const startFrame = useTimelineStore.getState().currentFrame

  // 1. Build SerializedAnimation (raw pixel deltas) for the bonerigging renderer.
  //    Preserve the animation's original fps metadata; only the poseTrack frame
  //    encoding (step 3) uses timelineFps so the block spans the right real-time duration.
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

  // 2. Inject into serialized data
  serialized.animations.push(serializedAnim)
  const updatedJson = JSON.stringify(serialized)

  // 3. Build matching BonePoseTrack for the UI index mapping
  const trackId = `track_${Date.now()}_${anim.name}`
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
        // Encode using timelineFps so the block spans the correct real-time duration
        // (e.g. a 1s animation occupies 60 timeline frames at 60fps, not 24 frames at animFps=24)
        frame: startFrame + Math.round(kf.time * timelineFps),
        pose,
        easing: 'linear' as const,
      }
    }),
  }

  // 4. Update store atomically
  useRigStore.setState((state) => {
    state.rigs[rigId] = {
      ...state.rigs[rigId],
      boneriggingSerializedData: updatedJson,
    }
    state.poseTracks.push(poseTrack)
  })
  // Set per-character track so only this character plays the new animation
  useRigStore.getState().selectCharacterPoseTrack(characterId, trackId)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface AnimationInfo {
  trackId: string
  animIndex: number
  name: string
  keyframeCount: number
  durationFrames: number
  durationSec: number
  fps: number
  loop: boolean
}

/**
 * Extract animation metadata by correlating BonePoseTracks with
 * SerializedAnimation entries in the bonerigging serialized data.
 * The converter creates tracks in the same order as animations,
 * so we match by index.
 */
function getAnimationInfos(
  boneriggingSerializedData: string | undefined,
  poseTracks: BonePoseTrack[],
  characterId: string,
): AnimationInfo[] {
  // Parse serialized data — this is the source of truth for animation metadata
  let serializedAnimations: SerializedAnimation[] = []
  if (boneriggingSerializedData) {
    try {
      const parsed = JSON.parse(boneriggingSerializedData) as SerializedRigData
      serializedAnimations = parsed.animations ?? []
    } catch {
      /* ignore parse errors */
    }
  }
  if (serializedAnimations.length === 0) return []

  // Get matching pose tracks for this character (for track ID mapping)
  const seen = new Set<string>()
  const charTracks = poseTracks.filter((t) => {
    if (t.characterId !== characterId && t.characterId !== 'primary') return false
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return true
  })

  // Build info from serialized animations, correlating with pose tracks by index
  return serializedAnimations.map((serializedAnim, index) => {
    const track = charTracks[index]
    const maxFrame = track?.keyframes.length
      ? Math.max(...track.keyframes.map((kf) => kf.frame))
      : Math.round(serializedAnim.duration * serializedAnim.fps)
    const fps = serializedAnim.fps || 24
    return {
      trackId: track?.id ?? `synth_${index}`,
      animIndex: index,
      name: serializedAnim.name || `Animation ${index + 1}`,
      keyframeCount: track?.keyframes.length ?? serializedAnim.keyframes.length,
      durationFrames: maxFrame,
      durationSec: maxFrame > 0 ? maxFrame / fps : 0,
      fps,
      loop: serializedAnim.loop ?? false,
    }
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimationsPanel() {
  const globalActiveRigId = useRigStore((s) => s.activeRigId)
  const rigs = useRigStore((s) => s.rigs)
  const poseTracks = useRigStore((s) => s.poseTracks)
  const activePoseTrackId = useRigStore((s) => s.activePoseTrackId)

  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const currentFrame = useTimelineStore((s) => s.currentFrame)

  // Resolve the rig from the active dialogue character (not the global activeRigId)
  const activeDialogueCharId = useMultiCharacterStore((s) => s.activeCharacterId)
  const activeDialogueChar = useMultiCharacterStore((s) => {
    const id = s.activeCharacterId
    return id ? s.characters.find((c) => c.id === id) : null
  })
  const savedCharacters = useSavedCharactersStore((s) => s.characters)

  // In multi-character mode, resolve this character's rig:
  //  1. Use explicit rigId if set
  //  2. Otherwise match by source image URL (rig's source image == character's body sprite)
  //  3. Fall back to globalActiveRigId only in single-character mode
  const activeRigId = useMemo(() => {
    if (!activeDialogueChar) return globalActiveRigId
    if (activeDialogueChar.rigId) return activeDialogueChar.rigId

    // Try to match by source image
    const savedChar = savedCharacters.find((sc) => sc.id === activeDialogueChar.savedCharacterId)
    const bodySprites = savedChar?.bodyParts?.body
    if (!bodySprites?.length) return null

    for (const [rigId, rigData] of Object.entries(rigs)) {
      if (!rigData.boneriggingSerializedData) continue
      try {
        const parsed = JSON.parse(rigData.boneriggingSerializedData) as SerializedRigData
        if (parsed.sourceImageUrl && bodySprites.includes(parsed.sourceImageUrl)) {
          return rigId
        }
      } catch {
        /* ignore */
      }
    }
    return null
  }, [activeDialogueChar, globalActiveRigId, rigs, savedCharacters])

  // Inline rename state
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Shared animation library (persisted in IndexedDB by bonerigging editor)
  const [sharedAnims, setSharedAnims] = useState<NormalizedAnimation[]>([])
  useEffect(() => {
    loadSharedLibrary().then(setSharedAnims)
    const refresh = () => {
      loadSharedLibrary().then(setSharedAnims)
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('bonerigging:shared-library-changed', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('bonerigging:shared-library-changed', refresh)
    }
  }, [])

  // Auto-load rig from cache when the active character has no rig in the store yet.
  // This means if you've rigged a character before, opening Animations tab auto-loads it.
  useEffect(() => {
    if (activeRigId) return // rig already found
    if (!activeDialogueChar?.savedCharacterId) return
    loadCachedRig(activeDialogueChar.savedCharacterId, activeDialogueChar.id).catch(() => {})
  }, [activeDialogueChar?.id, activeDialogueChar?.savedCharacterId, activeRigId])

  // Auto-select first rig if no rig resolved and rigs with serialized data exist
  const rigIds = useMemo(() => Object.keys(rigs).filter((rid) => !!rigs[rid].boneriggingSerializedData), [rigs])
  useEffect(() => {
    if (!activeRigId && rigIds.length > 0) {
      useRigStore.getState().selectRig(rigIds[0])
    }
  }, [activeRigId, rigIds.length])

  const rig = activeRigId ? rigs[activeRigId] : null

  // Auto-assign rig to the active character.
  // The useMemo above already resolved the correct rig via source-image matching,
  // so we just persist the result back onto the dialogue character.
  // Only switch to rigged mode when boneriggingSerializedData exists — otherwise
  // the canvas rendering enters a code path that can't show the body sprite.
  useEffect(() => {
    if (!rig || !activeRigId) return
    if (!rig.boneriggingSerializedData) return

    // Single-character mode: update the global parts store
    const partsStore = useCharacterPartsStore.getState()
    if (partsStore.renderMode !== 'rigged' || partsStore.rigId !== activeRigId) {
      partsStore.setRenderMode('rigged')
      partsStore.setRigId(activeRigId)
    }

    // Multi-character mode: persist rigId + renderMode onto the dialogue character
    if (!activeDialogueCharId) return
    const multiStore = useMultiCharacterStore.getState()
    const dChar = multiStore.characters.find((c: { id: string }) => c.id === activeDialogueCharId)
    if (!dChar) return

    const needsRigId = dChar.rigId !== activeRigId
    const needsRenderMode = dChar.renderMode !== 'rigged'
    if (needsRigId || needsRenderMode) {
      multiStore.updateDialogueCharacter(activeDialogueCharId, {
        rigId: activeRigId,
        renderMode: 'rigged',
      })
    }
  }, [rig, activeRigId, activeDialogueCharId])

  const updateDialogueCharacter = useMultiCharacterStore((s) => s.updateDialogueCharacter)

  // Show bones toggle — multi-character mode reads from DialogueCharacter, single-char mode from partsStore
  const singleCharShowBones = useCharacterPartsStore((s) => s.showBones)
  const showBones = activeDialogueChar ? activeDialogueChar.showBones !== false : singleCharShowBones

  const handleToggleShowBones = useCallback(() => {
    if (activeDialogueChar) {
      updateDialogueCharacter(activeDialogueChar.id, { showBones: !showBones })
    } else {
      useCharacterPartsStore.getState().setShowBones(!showBones)
    }
  }, [activeDialogueChar, showBones, updateDialogueCharacter])

  const animations = useMemo(() => {
    if (!rig) return []
    // In multi-character mode, tracks are tagged with the dialogue character ID
    const matchId = activeDialogueCharId || rig.id
    return getAnimationInfos(rig.boneriggingSerializedData, poseTracks, matchId)
  }, [rig, poseTracks, activeDialogueCharId])

  const selectedAnim = animations.find((a) => a.trackId === activePoseTrackId)

  // Auto-select first track when there's exactly one or none selected yet
  useEffect(() => {
    if (animations.length > 0 && !activePoseTrackId) {
      useRigStore.getState().selectPoseTrack(animations[0].trackId)
    }
  }, [animations, activePoseTrackId])

  const handleSelectAnimation = useCallback((trackId: string, _durationFrames: number) => {
    useRigStore.getState().selectPoseTrack(trackId)
    useTimelineStore.getState().seekToFrame(0)
    if (useTimelineStore.getState().isPlaying) {
      useTimelineStore.getState().togglePlayback()
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    useTimelineStore.getState().togglePlayback()
  }, [])

  const handleStepForward = useCallback(() => {
    useTimelineStore.getState().stepForward()
  }, [])

  const handleStepBackward = useCallback(() => {
    useTimelineStore.getState().stepBackward()
  }, [])

  const handleOpenRigEditor = useCallback(() => {
    useEditorStore.getState().setLeftPanelActiveTab('rig-editor')
  }, [])

  const handleStartRename = useCallback((trackId: string, currentName: string) => {
    setEditingTrackId(trackId)
    setEditingName(currentName)
    setTimeout(() => renameInputRef.current?.select(), 0)
  }, [])

  const handleCommitRename = useCallback(() => {
    if (!editingTrackId || !editingName.trim() || !activeRigId) {
      setEditingTrackId(null)
      return
    }
    const anim = animations.find((a) => a.trackId === editingTrackId)
    if (anim) {
      useRigStore.getState().renameAnimation(activeRigId, anim.animIndex, editingName.trim())
    }
    setEditingTrackId(null)
  }, [editingTrackId, editingName, activeRigId, animations])

  // ── Empty states ─────────────────────────────────────────────────────────

  if (!rig) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-xs text-gray-500 text-center py-8">No rig found. Open the Rig Editor to create one.</div>
        <button
          onClick={handleOpenRigEditor}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
        >
          <ExternalLink size={14} />
          Open Rig Editor
        </button>
      </div>
    )
  }

  // ── Main content ─────────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-4">
      {/* Show/Hide Bones toggle */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm w-20 shrink-0">Skeleton</span>
        <div className="flex-1 min-w-0 flex gap-1.5">
          <button
            onClick={showBones ? undefined : handleToggleShowBones}
            className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
              showBones ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
            }`}
          >
            Show
          </button>
          <button
            onClick={showBones ? handleToggleShowBones : undefined}
            className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
              !showBones ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
            }`}
          >
            Hide
          </button>
        </div>
      </div>

      {/* Animation list */}
      {animations.length === 0 ? (
        <div className="text-xs text-gray-500 text-center py-6">
          No animations yet. Create animations in the Rig Editor.
        </div>
      ) : (
        <div className="space-y-1.5">
          {animations.map((anim) => {
            const isSelected = anim.trackId === activePoseTrackId
            const isEditing = editingTrackId === anim.trackId
            return (
              <button
                key={anim.trackId}
                onClick={() => handleSelectAnimation(anim.trackId, anim.durationFrames)}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors border ${
                  isSelected
                    ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30 text-white'
                    : 'bg-[#2a2a2a] border-white/5 text-gray-300 hover:bg-[#3a3a3a]'
                }`}
              >
                {isEditing ? (
                  <input
                    ref={renameInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleCommitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename()
                      if (e.key === 'Escape') setEditingTrackId(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-[#1a1a1a] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
                    autoFocus
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="text-xs font-medium truncate"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          handleStartRename(anim.trackId, anim.name)
                        }}
                      >
                        {anim.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && (
                          <>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartRename(anim.trackId, anim.name)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleStartRename(anim.trackId, anim.name)
                              }}
                              className="p-0.5 rounded hover:bg-[#3a3a3a] text-gray-500 hover:text-white transition-colors"
                              title="Rename animation"
                            >
                              <Pencil size={11} />
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (activeRigId) {
                                  useRigStore.getState().removeAnimation(activeRigId, anim.animIndex, anim.trackId)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && activeRigId) {
                                  useRigStore.getState().removeAnimation(activeRigId, anim.animIndex, anim.trackId)
                                }
                              }}
                              className="p-0.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                              title="Delete animation"
                            >
                              <Trash2 size={11} />
                            </span>
                          </>
                        )}
                        {isSelected && isPlaying && (
                          <span className="text-[10px] text-[#4a7eff] animate-pulse">Playing</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <span>{anim.keyframeCount} keyframes</span>
                      <span>|</span>
                      <span>{anim.durationSec.toFixed(1)}s</span>
                      {anim.loop && (
                        <>
                          <span>|</span>
                          <span className="text-[#4a7eff]">Loop</span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Transport controls */}
      {animations.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500">
              Frame: {currentFrame}
              {selectedAnim ? ` / ${selectedAnim.durationFrames}` : ''}
            </span>
            {selectedAnim && <span className="text-[10px] text-gray-500">{selectedAnim.fps} fps</span>}
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleStepBackward}
              className="p-1.5 rounded-md bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white transition-colors"
              title="Step backward"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={handlePlayPause}
              className={`p-2 rounded-md transition-colors ${
                isPlaying
                  ? 'bg-[#4a7eff] text-white hover:bg-[#4a7eff]/80'
                  : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={handleStepForward}
              className="p-1.5 rounded-md bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white transition-colors"
              title="Step forward"
            >
              <SkipForward size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Shared animation library — applies to any rig */}
      {sharedAnims.length > 0 && (
        <div className="pt-3 border-t border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium">
            <Share2 size={14} />
            Shared Animations ({sharedAnims.length})
          </div>
          {sharedAnims.map((anim, i) => (
            <div
              key={`shared-${i}-${anim.name}-${anim.ts}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 bg-[#2a2a2a] border border-white/5 text-gray-300"
            >
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{anim.name}</div>
                <div className="text-[10px] text-gray-500">
                  {anim.keyframes.length} keyframes | {anim.duration.toFixed(1)}s
                  {anim.loop && <span className="text-[#4a7eff] ml-1">Loop</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!rig || !activeRigId) return
                  const charId = activeDialogueCharId || 'primary'
                  applySharedAnimation(anim, activeRigId, charId)
                }}
                className="shrink-0 ml-2 px-2 py-1 rounded text-[10px] font-medium bg-[#4a7eff]/20 text-[#4a7eff] border border-[#4a7eff]/30 hover:bg-[#4a7eff]/30 transition-colors"
                title="Apply this animation to the current rig"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rig Editor — full-width bottom button */}
      <button
        onClick={handleOpenRigEditor}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
      >
        <ExternalLink size={14} />
        Rig Editor
      </button>
    </div>
  )
}
