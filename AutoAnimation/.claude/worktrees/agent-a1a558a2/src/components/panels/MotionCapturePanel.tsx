/**
 * Motion Capture Panel — upload a video of a person moving, extract skeleton
 * poses with MediaPipe, and save as a 3D animation clip.
 */
import { useCallback, useRef, useState } from 'react'
import {
  Camera,
  Upload,
  X,
  Play,
  Download,
  Bone,
} from 'lucide-react'
import * as THREE from 'three'
import { useMotionCaptureStore } from '@/stores/useMotionCaptureStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { captureMotionFromVideo } from '@/services/motionCapture'
import { autoRemapClip } from '@/services/gltfUtils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelToggle } from '@/components/ui/panel-controls/PanelToggle'
import { PanelDropZone } from '@/components/ui/panel-controls/PanelDropZone'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'
import { logger } from '@/utils/logger'

export function MotionCapturePanel() {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const sourceVideoUrl = useMotionCaptureStore((s) => s.sourceVideoUrl)
  const sourceVideoBlob = useMotionCaptureStore((s) => s.sourceVideoBlob)
  const fps = useMotionCaptureStore((s) => s.fps)
  const isProcessing = useMotionCaptureStore((s) => s.isProcessing)
  const progress = useMotionCaptureStore((s) => s.progress)
  const statusMessage = useMotionCaptureStore((s) => s.statusMessage)
  const error = useMotionCaptureStore((s) => s.error)
  const resultClip = useMotionCaptureStore((s) => s.resultClip)
  const durationSeconds = useMotionCaptureStore((s) => s.durationSeconds)
  const frameCount = useMotionCaptureStore((s) => s.frameCount)
  const showSkeletonPreview = useMotionCaptureStore((s) => s.showSkeletonPreview)

  const setSourceVideo = useMotionCaptureStore((s) => s.setSourceVideo)
  const clearSourceVideo = useMotionCaptureStore((s) => s.clearSourceVideo)
  const setFps = useMotionCaptureStore((s) => s.setFps)
  const setProcessing = useMotionCaptureStore((s) => s.setProcessing)
  const setProgress = useMotionCaptureStore((s) => s.setProgress)
  const setError = useMotionCaptureStore((s) => s.setError)
  const setResult = useMotionCaptureStore((s) => s.setResult)
  const setShowSkeletonPreview = useMotionCaptureStore((s) => s.setShowSkeletonPreview)

  const activeRig = use3DRigStore((s) => s.getActiveRig())

  const handleVideoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      setSourceVideo(file)
    },
    [setSourceVideo]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (!file || !file.type.startsWith('video/')) return
      setSourceVideo(file)
    },
    [setSourceVideo]
  )

  const handleStartCapture = useCallback(async () => {
    if (!sourceVideoBlob || isProcessing) return

    setProcessing(true)
    setError(null)

    try {
      const result = await captureMotionFromVideo(
        sourceVideoBlob,
        fps,
        activeRig?.skeletonTree.boneMapping,
        (prog, msg) => setProgress(prog, msg)
      )

      setResult(result.clip, result.landmarks, result.durationSeconds, result.frameCount)
    } catch (err) {
      logger.error('[MotionCapture] Error:', err)
      setError(err instanceof Error ? err.message : 'Motion capture failed')
    }
  }, [sourceVideoBlob, isProcessing, fps, activeRig, setProcessing, setError, setProgress, setResult])

  const handleAddToLibrary = useCallback(() => {
    if (!resultClip) return

    let clipToStore = resultClip

    // If there's an active 3D rig, remap the clip to match its skeleton
    if (activeRig) {
      clipToStore = autoRemapClip(
        resultClip.clone(),
        activeRig.skeletonTree.boneMapping,
        activeRig.skeletonTree.bones.map((b) => b.name)
      )
    }

    // Serialize the clip to a GLB-compatible format
    // Since THREE.AnimationClip is in-memory, we store the JSON representation
    const clipJson = THREE.AnimationClip.toJSON(clipToStore)
    const jsonStr = JSON.stringify(clipJson)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const blobId = `mocap-${Date.now()}`

    // Store in character3dDB
    import('@/services/character3dDB').then(({ save3DBlob }) => {
      save3DBlob(blobId, blob)
    })

    // Add to animation store
    const animStore = use3DAnimationStore.getState()
    animStore.addAnimation({
      id: `anim-mocap-${Date.now()}`,
      name: `Motion Capture (${frameCount} frames)`,
      glbBlobId: blobId,
      durationSeconds: durationSeconds ?? clipToStore.duration,
      fps,
      source: 'imported',
      tags: ['mocap', 'motion-capture', 'mediapipe'],
      createdAt: Date.now(),
    })
  }, [resultClip, activeRig, frameCount, durationSeconds, fps])

  return (
    <PanelLayout icon={Camera} title="Motion Capture" iconClassName="text-cyan-400">
      {/* Info */}
      <div className="p-3 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Upload a video of a person moving. MediaPipe extracts 3D skeleton poses
          which can be applied to any 3D character.
        </p>
      </div>

      {/* Video upload zone */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/mov"
        onChange={handleVideoSelect}
        className="hidden"
      />

      {sourceVideoUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-[#3a3a3a]">
          <video
            src={sourceVideoUrl}
            controls
            className="w-full max-h-40 object-contain bg-black"
          />
          <button
            onClick={clearSourceVideo}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-gray-300 hover:text-white"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <PanelDropZone
          icon={Upload}
          label="Drop a video or click to upload"
          sublabel="MP4, WebM, or MOV"
          isDragging={isDragging}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { setIsDragging(false); handleDrop(e) }}
          onClick={() => videoInputRef.current?.click()}
        />
      )}

      {/* Settings */}
      {sourceVideoUrl && (
        <>
          {/* FPS selector */}
          <div className="p-3 bg-zinc-800/20 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Extraction FPS</span>
              <span className="text-xs font-mono text-zinc-500">{fps} fps</span>
            </div>
            <div className="flex gap-1.5">
              {[12, 24, 30].map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                    fps === f
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : 'bg-black/20 text-zinc-400 border-white/5 hover:border-cyan-500/30'
                  )}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>

          {/* Skeleton preview toggle */}
          <PanelToggle
            label="Skeleton overlay"
            checked={showSkeletonPreview}
            onChange={setShowSkeletonPreview}
          />

          {/* Target character info */}
          {activeRig && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <Bone size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-300">
                Target: {activeRig.skeletonTree.skeletonType} skeleton ({activeRig.skeletonTree.bones.length} bones)
              </span>
            </div>
          )}

          {!activeRig && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <Bone size={12} className="text-amber-400" />
              <span className="text-[10px] text-amber-300">
                No 3D character selected. Motion will use standard bone names.
              </span>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={handleStartCapture}
            disabled={isProcessing}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isProcessing
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'bg-cyan-600 text-white hover:bg-cyan-500'
            )}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size={14} />
                {statusMessage || `${progress}%`}
              </>
            ) : (
              <>
                <Play size={14} />
                Extract Motion
              </>
            )}
          </button>

          {/* Progress bar */}
          {isProcessing && (
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          {/* Result */}
          {resultClip && !isProcessing && (
            <div className="space-y-3 bg-[#1e1e1e] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-cyan-400" />
                <span className="text-xs font-medium text-zinc-300">Capture Complete</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">Frames</span>
                  <div className="text-zinc-300 font-mono">{frameCount}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">Duration</span>
                  <div className="text-zinc-300 font-mono">
                    {durationSeconds?.toFixed(1)}s
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">Tracks</span>
                  <div className="text-zinc-300 font-mono">{resultClip.tracks.length}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">FPS</span>
                  <div className="text-zinc-300 font-mono">{fps}</div>
                </div>
              </div>

              <button
                onClick={handleAddToLibrary}
                className="w-full py-2 rounded-lg bg-cyan-600 text-xs text-white font-medium flex items-center justify-center gap-1.5 hover:bg-cyan-500 transition-colors"
              >
                <Download size={12} />
                Add to Motion Library
              </button>
            </div>
          )}
        </>
      )}

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}
