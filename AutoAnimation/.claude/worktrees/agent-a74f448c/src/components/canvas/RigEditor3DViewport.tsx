/**
 * Full 3D rig editor viewport with OrbitControls, skeleton overlay, and bone gizmo.
 * Replaces the main canvas area when rig-editor-3d tab is active.
 */
import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import { Play, Info, X, Bone, Film, Box, Cpu } from 'lucide-react'
import * as THREE from 'three'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import type { Saved3DCharacter, Character3D, Animation3D } from '@/types/character3d'
import type { RigData3D } from '@/types/rig3d'
import { RigEditor3DCharacter } from './RigEditor3DCharacter'
import { SkeletonOverlay3D } from './SkeletonOverlay3D'
import { BoneGizmo3D } from './BoneGizmo3D'
import { AnimationModal3D } from '@/components/panels/AnimationModal3D'

export function RigEditor3DViewport() {
  const [skeleton, setSkeleton] = useState<THREE.Skeleton | null>(null)
  const [showAnimModal, setShowAnimModal] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Rig store state
  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)
  const hoveredBoneName = use3DRigStore((s) => s.hoveredBoneName)
  const coordinateSpace = use3DRigStore((s) => s.coordinateSpace)
  const showSkeletonOverlay = use3DRigStore((s) => s.showSkeletonOverlay)
  const showBoneNames = use3DRigStore((s) => s.showBoneNames)
  const selectBone = use3DRigStore((s) => s.selectBone)
  const hoverBone = use3DRigStore((s) => s.hoverBone)
  const setCoordinateSpace = use3DRigStore((s) => s.setCoordinateSpace)
  const toggleSkeletonOverlay = use3DRigStore((s) => s.toggleSkeletonOverlay)
  const toggleBoneNames = use3DRigStore((s) => s.toggleBoneNames)

  // Get the active 3D character's GLB URL
  // Prefer the rig's characterId; fall back to the character store's own active selection
  const storeActiveCharId = use3DCharacterStore((s) => s.activeCharacterId)
  const firstCharId = use3DCharacterStore((s) => s.characters[0]?.id ?? null)
  const activeCharacterId = activeRig?.characterId ?? storeActiveCharId ?? firstCharId
  const character = use3DCharacterStore((s) =>
    s.characters.find((c) => c.id === activeCharacterId) ?? null
  )
  const savedCharacters = useSaved3DCharactersStore((s) => s.characters)
  const blobUrls = useSaved3DCharactersStore((s) => s.blobUrls)
  const animations = use3DAnimationStore((s) => s.animations)
  const animBlobUrls = use3DAnimationStore((s) => s.blobUrls)

  // Resolve GLB URLs
  const savedChar = character?.saved3DCharacterId
    ? savedCharacters.find((sc) => sc.id === character.saved3DCharacterId)
    : null
  const glbUrl = savedChar ? blobUrls[savedChar.glbBlobId] : null

  let animationGlbUrl: string | undefined
  if (character?.activeAnimationId) {
    const anim = animations.find((a) => a.id === character.activeAnimationId)
    if (anim) {
      animationGlbUrl = animBlobUrls[anim.glbBlobId]
    }
  }

  const updateActiveRigRestPose = use3DRigStore((s) => s.updateActiveRigRestPose)

  const handleSkeletonReady = useCallback((skel: THREE.Skeleton | null) => {
    setSkeleton(skel)
    // Sync rig store's rest pose from the viewport's actual skeleton.
    // This ensures bone names + transforms match the skeleton the gizmo operates on,
    // which may differ from the temporary skeleton used during rig creation
    // (especially for FBX-converted models).
    if (skel) {
      updateActiveRigRestPose(skel)
    }
  }, [updateActiveRigRestPose])

  const handlePointerMissed = useCallback(() => {
    selectBone(null)
  }, [selectBone])

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <Toolbar
        coordinateSpace={coordinateSpace}
        showSkeleton={showSkeletonOverlay}
        showNames={showBoneNames}
        showInfo={showInfo}
        onSetSpace={setCoordinateSpace}
        onToggleSkeleton={toggleSkeletonOverlay}
        onToggleNames={toggleBoneNames}
        onToggleInfo={() => setShowInfo((v) => !v)}
      />

      <Canvas
        style={{ width: '100%', height: '100%' }}
        camera={{ position: [0, 1.2, 3], fov: 45, near: 0.01, far: 1000 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        onCreated={(state) => {
          state.gl.setClearColor(0x1a1a1a, 1)
        }}
        onPointerMissed={handlePointerMissed}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 6, 4]} intensity={1.0} castShadow />
        <directionalLight position={[-3, 4, 2]} intensity={0.4} />
        <directionalLight position={[0, 4, -4]} intensity={0.5} />
        <hemisphereLight args={['#b1e1ff', '#b97a20', 0.25]} />

        {/* Environment */}
        <Environment preset="studio" />

        {/* Ground grid */}
        <Grid
          args={[10, 10]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#333333"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#555555"
          fadeDistance={15}
          fadeStrength={1}
          position={[0, 0, 0]}
        />

        {/* Orbit controls — rig editor allows free camera movement */}
        <OrbitControls
          makeDefault
          target={[0, 1, 0]}
          enableDamping
          dampingFactor={0.1}
        />

        {/* Character — always render at origin with identity transforms;
             canvas transforms (position/rotation/scale) are for the main
             video canvas only and should not affect the rig editor. */}
        {glbUrl && (
          <group>
            <RigEditor3DCharacter
              glbUrl={glbUrl}
              animationGlbUrl={animationGlbUrl}
              animationSpeed={character?.animationSpeed ?? 1}
              targetBoneMapping={savedChar?.boneMapping}
              onSkeletonReady={handleSkeletonReady}
            />

            {/* Skeleton overlay */}
            {showSkeletonOverlay && skeleton && activeRig && (
              <SkeletonOverlay3D
                skeleton={skeleton}
                skeletonTree={activeRig.skeletonTree}
                selectedBoneName={selectedBoneName}
                hoveredBoneName={hoveredBoneName}
                showNames={showBoneNames}
                onBoneClick={selectBone}
                onBoneHover={hoverBone}
              />
            )}

            {/* Unified bone gizmo (translate + rotate + scale in one) */}
            {skeleton && (
              <BoneGizmo3D
                skeleton={skeleton}
                selectedBoneName={selectedBoneName}
                coordinateSpace={coordinateSpace}
              />
            )}
          </group>
        )}

        {/* Empty state */}
        {!glbUrl && (
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="#555" wireframe />
          </mesh>
        )}
      </Canvas>

      {/* Floating Animations button — bottom center */}
      {activeCharacterId && !showAnimModal && (
        <button
          onClick={() => setShowAnimModal(true)}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-5 py-2.5 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/60 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:border-green-500/40 hover:bg-zinc-800/90 transition-all shadow-lg shadow-black/30 active:scale-[0.97]"
        >
          <Play size={15} className="text-green-400" />
          Animations
          {animations.length > 0 && (
            <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-full">
              {animations.length}
            </span>
          )}
        </button>
      )}

      {/* Animation modal overlay */}
      {showAnimModal && activeCharacterId && (
        <AnimationModal3D
          characterId={activeCharacterId}
          onClose={() => setShowAnimModal(false)}
        />
      )}

      {/* Info overlay — full-canvas display of rig/character data */}
      {showInfo && (
        <RigInfoOverlay
          activeRig={activeRig}
          savedChar={savedChar ?? null}
          character={character ?? null}
          skeleton={skeleton}
          activeAnimation={
            character?.activeAnimationId
              ? animations.find((a) => a.id === character.activeAnimationId) ?? null
              : null
          }
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}

// ─── Toolbar ────────────────────────────────────────────────────────────────

function Toolbar({
  coordinateSpace,
  showSkeleton,
  showNames,
  showInfo,
  onSetSpace,
  onToggleSkeleton,
  onToggleNames,
  onToggleInfo,
}: {
  coordinateSpace: string
  showSkeleton: boolean
  showNames: boolean
  showInfo: boolean
  onSetSpace: (space: 'local' | 'world') => void
  onToggleSkeleton: () => void
  onToggleNames: () => void
  onToggleInfo: () => void
}) {
  return (
    <div className="absolute top-2 left-2 z-10 flex gap-1 bg-black/75 rounded-lg p-1">
      <ToolBtn
        active={coordinateSpace === 'local'}
        onClick={() => onSetSpace(coordinateSpace === 'local' ? 'world' : 'local')}
        title="Toggle Local/World (L)"
        label={coordinateSpace === 'local' ? 'L' : 'G'}
      />
      <div className="w-px bg-zinc-600 my-0.5" />
      <ToolBtn
        active={showSkeleton}
        onClick={onToggleSkeleton}
        title="Toggle Skeleton (S)"
        label="S"
      />
      <ToolBtn
        active={showNames}
        onClick={onToggleNames}
        title="Toggle Bone Names (N)"
        label="N"
      />
      <div className="w-px bg-zinc-600 my-0.5" />
      <button
        onClick={onToggleInfo}
        title="Rig Info (I)"
        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
          showInfo
            ? 'bg-green-500 text-white'
            : 'bg-transparent text-zinc-400 hover:bg-white/10'
        }`}
      >
        <Info size={14} />
      </button>
    </div>
  )
}

function ToolBtn({
  active,
  onClick,
  title,
  label,
}: {
  active: boolean
  onClick: () => void
  title: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold transition-colors ${
        active
          ? 'bg-green-500 text-white'
          : 'bg-transparent text-zinc-400 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Info Overlay ────────────────────────────────────────────────────────────

function RigInfoOverlay({
  activeRig,
  savedChar,
  character,
  skeleton,
  activeAnimation,
  onClose,
}: {
  activeRig: RigData3D | null
  savedChar: Saved3DCharacter | null
  character: Character3D | null
  skeleton: THREE.Skeleton | null
  activeAnimation: Animation3D | null
  onClose: () => void
}) {
  const tree = activeRig?.skeletonTree
  const mappedBones = tree?.bones.filter((b) => b.standardName) ?? []
  const totalKeyframes = activeRig?.poseTracks.reduce((sum, t) => sum + t.keyframes.length, 0) ?? 0

  // Fallback: derive bone names directly from the Three.js skeleton when no rig store data exists
  const skeletonBoneNames = skeleton?.bones.map((b) => b.name) ?? []
  const totalBoneCount = tree?.bones.length ?? skeletonBoneNames.length
  const hasAnyData = activeRig || savedChar || character || skeleton

  return (
    <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-sm overflow-auto">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>

      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Info size={18} className="text-green-400" />
          Rig Information
        </h2>

        {!hasAnyData ? (
          <p className="text-sm text-zinc-500">No character or rig loaded.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Character */}
            {(savedChar || character) && (
              <InfoSection icon={<Box size={14} />} title="Character">
                <InfoRow label="Name" value={savedChar?.name ?? character?.name ?? '—'} />
                <InfoRow label="Polygons" value={savedChar?.polyCount ? savedChar.polyCount.toLocaleString() : '—'} />
                <InfoRow label="Scale" value={character?.scale?.toFixed(2) ?? '—'} />
                <InfoRow
                  label="Position"
                  value={character ? `${character.position.x.toFixed(1)}, ${character.position.y.toFixed(1)}, ${character.position.z.toFixed(1)}` : '—'}
                />
                {savedChar?.sourcePrompt && (
                  <InfoRow label="Prompt" value={savedChar.sourcePrompt} />
                )}
                {savedChar?.meshyTaskId && (
                  <InfoRow label="Meshy ID" value={savedChar.meshyTaskId} mono />
                )}
              </InfoSection>
            )}

            {/* Skeleton */}
            {(tree || skeleton) && (
              <InfoSection icon={<Bone size={14} />} title="Skeleton">
                <InfoRow label="Type" value={tree?.skeletonType ?? savedChar?.skeletonType ?? '—'} />
                <InfoRow label="Total Bones" value={String(totalBoneCount)} />
                {tree && (
                  <InfoRow label="Mapped" value={`${mappedBones.length} / ${tree.bones.length}`} />
                )}
                <InfoRow label="Root Bone" value={tree?.rootBoneName ?? skeletonBoneNames[0] ?? '—'} mono />
              </InfoSection>
            )}

            {/* Animation */}
            <InfoSection icon={<Film size={14} />} title="Animation">
              <InfoRow label="Active Clip" value={activeAnimation?.name ?? 'None'} />
              {activeAnimation && (
                <>
                  <InfoRow label="Duration" value={`${activeAnimation.durationSeconds.toFixed(1)}s`} />
                  <InfoRow label="FPS" value={String(activeAnimation.fps)} />
                  <InfoRow label="Source" value={activeAnimation.source ?? '—'} />
                  {activeAnimation.sourcePrompt && (
                    <InfoRow label="Prompt" value={activeAnimation.sourcePrompt} />
                  )}
                </>
              )}
              <InfoRow label="Playback Speed" value={`${character?.animationSpeed ?? 1}x`} />
              {activeRig && (
                <>
                  <InfoRow label="Pose Tracks" value={String(activeRig.poseTracks.length)} />
                  <InfoRow label="Keyframes" value={String(totalKeyframes)} />
                </>
              )}
            </InfoSection>

            {/* Rig Meta — only when a formal rig exists */}
            {activeRig && (
              <InfoSection icon={<Cpu size={14} />} title="Rig">
                <InfoRow label="Rig ID" value={activeRig.id.slice(0, 12) + '...'} mono />
                <InfoRow label="Spring Chains" value={String(activeRig.springChains?.length ?? 0)} />
                <InfoRow label="Squash/Stretch" value={String(activeRig.squashStretchBones?.length ?? 0)} />
                <InfoRow label="Active Clips" value={String(activeRig.activeClipIds.length)} />
                <InfoRow label="Created" value={new Date(activeRig.createdAt).toLocaleDateString()} />
              </InfoSection>
            )}

            {/* Bone Mapping — full width, only when rig has mapping data */}
            {mappedBones.length > 0 && (
              <div className="md:col-span-2">
                <InfoSection icon={<Bone size={14} />} title={`Bone Mapping (${mappedBones.length})`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-0.5">
                    {mappedBones.map((bone) => (
                      <div key={bone.name} className="flex items-center justify-between gap-2 py-0.5">
                        <span className="text-xs text-green-400 shrink-0">{bone.standardName}</span>
                        <span className="text-xs text-zinc-500 font-mono truncate">{bone.name}</span>
                      </div>
                    ))}
                  </div>
                </InfoSection>
              </div>
            )}

            {/* All Bones — full width; prefer rig tree data, fall back to Three.js skeleton */}
            {totalBoneCount > 0 && (
              <div className="md:col-span-2">
                <InfoSection icon={<Bone size={14} />} title={`All Bones (${totalBoneCount})`}>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-0.5">
                    {tree
                      ? tree.bones.map((bone) => (
                          <span
                            key={bone.name}
                            className={`text-xs truncate py-0.5 ${
                              bone.standardName ? 'text-green-400' : 'text-zinc-500'
                            }`}
                            title={bone.parentName ? `parent: ${bone.parentName}` : 'root'}
                          >
                            {bone.name}
                          </span>
                        ))
                      : skeletonBoneNames.map((name) => (
                          <span
                            key={name}
                            className="text-xs truncate py-0.5 text-zinc-400"
                            title={name}
                          >
                            {name}
                          </span>
                        ))}
                  </div>
                </InfoSection>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-green-400">{icon}</span>
        <span className="text-sm font-medium text-zinc-200">{title}</span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-zinc-500 shrink-0">{label}</span>
      <span className={`text-xs text-zinc-300 text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}
