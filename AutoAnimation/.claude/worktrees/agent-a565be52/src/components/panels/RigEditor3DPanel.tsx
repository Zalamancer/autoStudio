/**
 * Left panel for the 3D rig editor.
 * When no rig is active: shows a character selector grid + "Create Rig" button.
 * When a rig is active: shows bone hierarchy tree.
 * Animations are accessed via a floating button on the viewport (AnimationModal3D).
 */
import { useState, useCallback, useMemo, lazy, Suspense } from 'react'
import { Bone, Loader2, Box, Wand2, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useEditorStore } from '@/stores'
import { get3DBlob, blobToUrl } from '@/services/character3dDB'
import { loadGLTF, extractSkeleton } from '@/services/gltfUtils'
import { BoneHierarchyTree } from './BoneHierarchyTree'

const MotionCapturePanel = lazy(() => import('./MotionCapturePanel').then(m => ({ default: m.MotionCapturePanel })))
const LiveAvatarPanel = lazy(() => import('./LiveAvatarPanel').then(m => ({ default: m.LiveAvatarPanel })))

export function RigEditor3DPanel() {
  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)
  const hoveredBoneName = use3DRigStore((s) => s.hoveredBoneName)
  const selectBone = use3DRigStore((s) => s.selectBone)
  const hoverBone = use3DRigStore((s) => s.hoverBone)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)

  const [motionCaptureOpen, setMotionCaptureOpen] = useState(false)
  const [liveAvatarOpen, setLiveAvatarOpen] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Back header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <button
          onClick={() => setLeftPanelActiveTab('3d-objects')}
          className="p-1 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <Bone size={14} className="text-green-400" />
        <span className="text-sm font-medium text-zinc-300">3D Rig Editor</span>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {!activeRig ? (
          <CharacterSelector />
        ) : (
          <div className="p-3">
            <BoneHierarchyTree
              skeletonTree={activeRig.skeletonTree}
              selectedBoneName={selectedBoneName}
              hoveredBoneName={hoveredBoneName}
              onSelectBone={selectBone}
              onHoverBone={hoverBone}
            />
          </div>
        )}
      </div>

      {/* Collapsible Motion Capture section */}
      <div className="shrink-0 border-t border-white/5">
        <button
          onClick={() => setMotionCaptureOpen(!motionCaptureOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {motionCaptureOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <span>Motion Capture</span>
        </button>
        {motionCaptureOpen && (
          <div className="max-h-[300px] overflow-y-auto border-t border-white/5">
            <Suspense fallback={null}><MotionCapturePanel /></Suspense>
          </div>
        )}
      </div>

      {/* Collapsible Live Avatar section */}
      <div className="shrink-0 border-t border-white/5">
        <button
          onClick={() => setLiveAvatarOpen(!liveAvatarOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {liveAvatarOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          <span>Live Avatar</span>
        </button>
        {liveAvatarOpen && (
          <div className="max-h-[300px] overflow-y-auto border-t border-white/5">
            <Suspense fallback={null}><LiveAvatarPanel /></Suspense>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Character Selector (shown when no rig is active) ────────────────────────

function CharacterSelector() {
  const savedCharacters = useSaved3DCharactersStore((s) => s.characters)
  const selectedSavedId = useSaved3DCharactersStore((s) => s.selectedCharacterId)
  const selectSavedCharacter = useSaved3DCharactersStore((s) => s.selectCharacter)

  const canvasCharacters = use3DCharacterStore((s) => s.characters)
  const add3DCharacter = use3DCharacterStore((s) => s.add3DCharacter)

  const rigs = use3DRigStore((s) => s.rigs)
  const setActiveRig = use3DRigStore((s) => s.setActiveRig)
  const createRigFromSkeleton = use3DRigStore((s) => s.createRigFromSkeleton)

  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedChar = useMemo(
    () => savedCharacters.find((c) => c.id === selectedSavedId) ?? null,
    [savedCharacters, selectedSavedId]
  )

  // List existing rigs with character names
  const existingRigs = useMemo(() => {
    return Object.values(rigs).map((rig) => {
      const canvasChar = canvasCharacters.find((c) => c.id === rig.characterId)
      return { ...rig, characterName: canvasChar?.name ?? 'Unknown' }
    })
  }, [rigs, canvasCharacters])

  const handleCreateRig = useCallback(async () => {
    if (!selectedChar) return

    setIsCreating(true)
    setError(null)

    let tmpUrl: string | null = null
    try {
      // 1. Load GLB blob from IndexedDB
      const blob = await get3DBlob(selectedChar.glbBlobId)
      if (!blob) {
        throw new Error('GLB model not found in storage. Try re-importing the character.')
      }

      // 2. Load GLTF scene
      tmpUrl = blobToUrl(blob)
      const gltf = await loadGLTF(tmpUrl)

      // 3. Extract skeleton
      const skeleton = extractSkeleton(gltf.scene)
      if (!skeleton) {
        throw new Error('No skeleton found in this model. The GLB may not be rigged.')
      }

      // 4. Ensure a canvas Character3D instance exists for this saved character
      let canvasCharId = canvasCharacters.find(
        (c) => c.saved3DCharacterId === selectedChar.id
      )?.id

      if (!canvasCharId) {
        canvasCharId = add3DCharacter({
          name: selectedChar.name,
          saved3DCharacterId: selectedChar.id,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: 1,
          zIndex: 0,
          visible: true,
          locked: false,
          activeAnimationId: null,
          animationSpeed: 1,
          voiceId: null,
          color: '',
        })
      }

      // 5. Create the rig
      createRigFromSkeleton(canvasCharId, skeleton, selectedChar.boneMapping)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rig')
    } finally {
      if (tmpUrl) URL.revokeObjectURL(tmpUrl)
      setIsCreating(false)
    }
  }, [selectedChar, canvasCharacters, add3DCharacter, createRigFromSkeleton])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wand2 size={16} className="text-green-400" />
        <span className="text-sm font-medium text-zinc-300">Create 3D Rig</span>
      </div>

      {/* Existing rigs (resume) */}
      {existingRigs.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-zinc-500 uppercase tracking-wide">
            Existing Rigs
          </span>
          {existingRigs.map((rig) => (
            <button
              key={rig.id}
              onClick={() => setActiveRig(rig.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-sm text-zinc-300 transition-colors text-left"
            >
              <Bone size={14} className="text-green-400 shrink-0" />
              <span className="truncate">{rig.characterName}</span>
              <span className="text-sm text-zinc-500 ml-auto shrink-0">
                {rig.skeletonTree.bones.length} bones
              </span>
            </button>
          ))}
          <div className="border-b border-zinc-800 mt-1" />
        </div>
      )}

      {/* Characters grid */}
      <span className="text-sm text-zinc-500 uppercase tracking-wide">
        Select a Character
      </span>

      {savedCharacters.length === 0 ? (
        <div className="text-center py-6">
          <Box size={28} className="mx-auto text-zinc-600 mb-2" />
          <p className="text-sm text-zinc-500">No saved 3D characters</p>
          <p className="text-sm text-zinc-600 mt-1">
            Import a GLB model from the Characters tab first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {savedCharacters.map((char) => (
            <button
              key={char.id}
              onClick={() => selectSavedCharacter(char.id)}
              className={`group relative rounded-lg overflow-hidden text-left border transition-colors ${
                selectedSavedId === char.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-zinc-700/50 hover:border-zinc-600 bg-zinc-800/50'
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-zinc-900/50 flex items-center justify-center">
                {char.thumbnailDataUrl ? (
                  <img
                    src={char.thumbnailDataUrl}
                    alt={char.name}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <Box size={24} className="text-zinc-600" />
                )}
              </div>

              {/* Name & Info */}
              <div className="p-2">
                <p className="text-sm font-medium text-zinc-300 truncate">
                  {char.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {char.skeletonType} &middot;{' '}
                  {(char.polyCount / 1000).toFixed(1)}k tris
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Create Rig button */}
      <button
        onClick={handleCreateRig}
        disabled={!selectedChar || isCreating}
        className="w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-500"
      >
        {isCreating ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating Rig…
          </>
        ) : (
          <>
            <Bone size={14} />
            Create Rig
          </>
        )}
      </button>

      {selectedChar && !isCreating && (
        <p className="text-sm text-zinc-600 text-center">
          This will load the skeleton from &ldquo;{selectedChar.name}&rdquo; and create an
          editable rig.
        </p>
      )}
    </div>
  )
}
