/**
 * Dedicated keyframe timeline for the 3D rig editor.
 * Shows only 3D rig-specific tracks (bone pose keyframes) with
 * playback controls, time ruler, and playhead — no video tracks.
 *
 * Replaces the generic Timeline when the editor is in 3D rig mode.
 */
import { useRef, useCallback, useEffect, memo} from 'react'
import { SkipBack, Play, Pause, SkipForward, Plus, Circle } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { TrackShell } from './TrackShell'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { TimeRuler } from './TimeRuler'
import { Playhead } from './Playhead'
import { ZoomControls } from './ZoomControls'
import type { BonePoseKeyframe3D } from '@/types/rig3d'

export const Rig3DTimeline = memo(function Rig3DTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)

  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const zoom = useTimelineStore((s) => s.zoom)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)
  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const activeRigId = use3DRigStore((s) => s.activeRigId)
  const rigs = use3DRigStore((s) => s.rigs)
  const activeRig = activeRigId ? rigs[activeRigId] ?? null : null
  const currentPose = use3DRigStore((s) => s.currentPose)
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)

  const pixelsPerFrame = (100 * zoom) / fps
  const totalWidth = totalFrames * pixelsPerFrame

  // Playback
  const animationRef = useRef<number | null>(null)
  const togglePlayback = useTimelineStore((s) => s.togglePlayback)
  const pause = useTimelineStore((s) => s.pause)
  const { isRecordMode, toggleRecordMode } = useKeyframeStore()

  // Frame-driven playback
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      return
    }

    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      const frameDelta = (deltaTime / 1000) * fps

      if (frameDelta >= 1) {
        const state = useTimelineStore.getState()
        const newFrame = state.currentFrame + Math.floor(frameDelta)

        if (newFrame >= totalFrames - 1) {
          seekToFrame(0)
          pause()
          return
        }

        seekToFrame(newFrame)

        // During playback, apply interpolated pose at the new frame
        const rig = use3DRigStore.getState().getActiveRig()
        if (rig) {
          const interpolatedPose = use3DRigStore.getState().getInterpolatedPoseAtFrame(
            rig.characterId,
            newFrame
          )
          if (interpolatedPose) {
            use3DRigStore.getState().setCurrentPose(interpolatedPose)
          }
        }

        lastTime = currentTime
      }

      if (useTimelineStore.getState().isPlaying) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, fps, totalFrames, seekToFrame, pause])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    if (!isPlaying && currentFrame >= totalFrames - 1) {
      seekToFrame(0)
    }
    togglePlayback()
  }, [isPlaying, currentFrame, totalFrames, seekToFrame, togglePlayback])

  const handleRestart = useCallback(() => {
    seekToFrame(0)
  }, [seekToFrame])

  const handleSkipEnd = useCallback(() => {
    seekToFrame(totalFrames - 1)
  }, [seekToFrame, totalFrames])

  // Add keyframe at current frame
  const handleAddKeyframe = useCallback(() => {
    if (!activeRig || !currentPose || Object.keys(currentPose).length === 0) return
    use3DRigStore.getState().addPoseKeyframe(activeRig.characterId, currentFrame, currentPose)
  }, [activeRig, currentPose, currentFrame])

  // Compute tracks height for playhead
  const poseTracks = activeRig?.poseTracks ?? []
  const trackRowCount = Math.max(poseTracks.length, 1) // At least 1 row even if no tracks
  const tracksContentHeight = 40 + trackRowCount * 32 + 24 // ruler + tracks + padding

  // Time formatting
  const currentTime = currentFrame / fps
  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60)
    const secs = Math.floor(t % 60)
    const frames = Math.round((t % 1) * fps)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
  }

  return (
    <div className="h-[200px] flex flex-col bg-zinc-800 border-t border-zinc-700">
      {/* Timeline Header — playback controls + zoom */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-700/50 bg-zinc-800">
        <div className="flex items-center gap-2">
          {/* Record Mode */}
          <IconButton
            icon={Circle}
            variant="ghost"
            size="sm"
            state={isRecordMode ? 'active' : 'default'}
            onClick={toggleRecordMode}
            tooltip={isRecordMode ? 'Stop Recording (K)' : 'Start Recording (K)'}
            className={isRecordMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : ''}
          />

          <div className="w-px h-4 bg-zinc-700" />

          {/* Playback */}
          <IconButton icon={SkipBack} variant="ghost" size="sm" onClick={handleRestart} tooltip="Restart" />
          <IconButton
            icon={isPlaying ? Pause : Play}
            variant="solid"
            state={isPlaying ? 'active' : 'default'}
            size="sm"
            onClick={handlePlayPause}
            tooltip={isPlaying ? 'Pause' : 'Play'}
          />
          <IconButton icon={SkipForward} variant="ghost" size="sm" onClick={handleSkipEnd} tooltip="Skip to end" />

          {/* Timecode */}
          <div className="ml-1 px-2 py-0.5 bg-zinc-900 rounded-lg text-xs font-mono text-zinc-400">
            {formatTime(currentTime)} / {formatTime(totalFrames / fps)}
          </div>

          <div className="w-px h-4 bg-zinc-700" />

          {/* Add Keyframe button */}
          <button
            onClick={handleAddKeyframe}
            disabled={!activeRig || !currentPose || Object.keys(currentPose).length === 0}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30"
            title="Add pose keyframe at current frame"
          >
            <Plus size={12} />
            Keyframe
          </button>
        </div>

        <ZoomControls />
      </div>

      {/* Timeline Content */}
      <div ref={containerRef} className="flex-1 overflow-auto relative">
        {/* Playhead */}
        <div className="sticky top-0 z-20 pointer-events-none" style={{ height: 0 }}>
          <div className="absolute left-40 top-0 right-0">
            <Playhead containerHeight={tracksContentHeight} />
          </div>
        </div>

        <div className="relative" style={{ minWidth: totalWidth + 160 }}>
          {/* Time Ruler */}
          <div className="sticky top-0 z-10 flex">
            <div className="w-40 flex-shrink-0 bg-zinc-800 border-r border-zinc-700/50 border-b border-zinc-700 sticky left-0 z-10">
              <div className="flex items-center h-full px-3 py-1">
                <span className="text-xs text-zinc-500 uppercase tracking-wide">Keyframes</span>
              </div>
            </div>
            <TimeRuler onSeek={seekToFrame} />
          </div>

          {/* Pose Tracks */}
          {!activeRig ? (
            <div className="flex items-center px-4 py-3 text-xs text-zinc-600">
              No active 3D rig. Select a character to start.
            </div>
          ) : poseTracks.length === 0 ? (
            <PoseTrackRow
              label={`3D Rig: ${activeRig.characterId.slice(-5)}`}
              keyframes={[]}
              trackId={null}
              characterId={activeRig.characterId}
              pixelsPerFrame={pixelsPerFrame}
              currentFrame={currentFrame}
              selectedBoneName={selectedBoneName}
            />
          ) : (
            poseTracks.map((track) => (
              <PoseTrackRow
                key={track.id}
                label={`3D Rig: ${track.characterId.slice(-5)}`}
                keyframes={track.keyframes}
                trackId={track.id}
                characterId={track.characterId}
                pixelsPerFrame={pixelsPerFrame}
                currentFrame={currentFrame}
                selectedBoneName={selectedBoneName}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
})

// ─── Pose Track Row ───────────────────────────────────────────────────────────

interface PoseTrackRowProps {
  label: string
  keyframes: BonePoseKeyframe3D[]
  trackId: string | null
  characterId: string
  pixelsPerFrame: number
  currentFrame: number
  selectedBoneName: string | null
}

function PoseTrackRow({
  label,
  keyframes,
  trackId,
  characterId,
  pixelsPerFrame,
  currentFrame,
  selectedBoneName,
}: PoseTrackRowProps) {
  const handleAddKeyframe = useCallback(() => {
    const store = use3DRigStore.getState()
    const pose = store.currentPose
    if (!pose || Object.keys(pose).length === 0) return
    store.addPoseKeyframe(characterId, currentFrame, pose)
  }, [characterId, currentFrame])

  const handleClickKeyframe = useCallback((kf: BonePoseKeyframe3D) => {
    useTimelineStore.getState().seekToFrame(kf.frame)
    use3DRigStore.getState().setCurrentPose(kf.pose)
  }, [])

  const handleRemoveKeyframe = useCallback(
    (kfId: string) => {
      if (!trackId) return
      use3DRigStore.getState().removePoseKeyframe(trackId, kfId)
    },
    [trackId]
  )

  return (
    <TrackShell
      color="#4ade80"
      label={label}
      extraControls={
        <button
          onClick={handleAddKeyframe}
          className="p-0.5 text-zinc-500 hover:text-green-400 transition-colors flex-shrink-0"
          title="Add pose keyframe at current frame"
        >
          <Plus size={12} />
        </button>
      }
    >
      {keyframes.map((kf) => {
        const x = kf.frame * pixelsPerFrame
        const isAtCurrent = kf.frame === currentFrame

        const hasSelectedBone = selectedBoneName
          ? kf.pose[selectedBoneName] !== undefined
          : false

        return (
          <div
            key={kf.id}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: x }}
            onClick={() => handleClickKeyframe(kf)}
            onContextMenu={(e) => {
              e.preventDefault()
              handleRemoveKeyframe(kf.id)
            }}
            title={`Frame ${kf.frame} · ${Object.keys(kf.pose).length} bones (right-click to remove)`}
          >
            <div
              className={`w-3 h-3 rotate-45 border-2 transition-colors ${
                isAtCurrent
                  ? 'bg-green-400 border-green-300 shadow-sm shadow-green-400/30'
                  : hasSelectedBone
                    ? 'bg-green-500/70 border-green-400 group-hover:bg-green-400'
                    : 'bg-green-500/40 border-green-500/70 group-hover:bg-green-400'
              }`}
              style={{ marginLeft: -6, marginTop: -6 }}
            />
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 hidden group-hover:block">
              <span className="text-xs text-zinc-400 bg-zinc-900 px-1 rounded-lg whitespace-nowrap">
                {Object.keys(kf.pose).length}b
              </span>
            </div>
          </div>
        )
      })}
    </TrackShell>
  )
}
