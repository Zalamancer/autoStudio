/**
 * DeepMotion Panel -- cloud-based motion capture via DeepMotion API.
 * Upload a video, process it in the cloud, and download the resulting GLB
 * animation to add to the 3D animation library.
 */
import { useCallback, useRef, useState } from 'react'
import { Upload, Cloud, X, Download, AlertCircle } from 'lucide-react'
import { useDeepMotionStore } from '@/stores/useDeepMotionStore'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { use3DRigStore } from '@/stores/use3DRigStore'
import {
  startDeepMotionJob,
  pollDeepMotionStatus,
  getDeepMotionDownloads,
  downloadDeepMotionGLB,
} from '@/services/deepMotionClient'
import { parseGLTF, autoRemapClip } from '@/services/gltfUtils'
import { save3DBlob } from '@/services/character3dDB'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelToggle } from '@/components/ui/panel-controls/PanelToggle'
import { PanelDropZone } from '@/components/ui/panel-controls/PanelDropZone'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { cn } from '@/lib/utils'
import { logger } from '@/utils/logger'

interface DeepMotionPanelProps {
  mode?: '2d' | '3d'
}

const POLL_INTERVAL = 3000

export function DeepMotionPanel({ mode = '3d' }: DeepMotionPanelProps) {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  // Store state
  const status = useDeepMotionStore((s) => s.status)
  const progress = useDeepMotionStore((s) => s.progress)
  const statusMessage = useDeepMotionStore((s) => s.statusMessage)
  const error = useDeepMotionStore((s) => s.error)
  const resultGlbUrl = useDeepMotionStore((s) => s.resultGlbUrl)
  const fps = useDeepMotionStore((s) => s.fps)
  const faceTracking = useDeepMotionStore((s) => s.faceTracking)
  const handTracking = useDeepMotionStore((s) => s.handTracking)

  // Store actions
  const setStatus = useDeepMotionStore((s) => s.setStatus)
  const setRid = useDeepMotionStore((s) => s.setRid)
  const setProgress = useDeepMotionStore((s) => s.setProgress)
  const setError = useDeepMotionStore((s) => s.setError)
  const setResultGlbUrl = useDeepMotionStore((s) => s.setResultGlbUrl)
  const setFps = useDeepMotionStore((s) => s.setFps)
  const setFaceTracking = useDeepMotionStore((s) => s.setFaceTracking)
  const setHandTracking = useDeepMotionStore((s) => s.setHandTracking)
  const resetStore = useDeepMotionStore((s) => s.reset)

  const activeRig = use3DRigStore((s) => s.getActiveRig())

  // ── Video selection ──────────────────────────────────────────────────

  const acceptVideo = useCallback(
    (file: File) => {
      // Revoke previous URL
      if (videoUrl) URL.revokeObjectURL(videoUrl)
      setVideoFile(file)
      setVideoUrl(URL.createObjectURL(file))
      // Reset any previous results
      resetStore()
    },
    [videoUrl, resetStore],
  )

  const handleVideoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      acceptVideo(file)
    },
    [acceptVideo],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (!file || !file.type.startsWith('video/')) return
      acceptVideo(file)
    },
    [acceptVideo],
  )

  const clearVideo = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoFile(null)
    setVideoUrl(null)
    resetStore()
  }, [videoUrl, resetStore])

  // ── Process with DeepMotion ──────────────────────────────────────────

  const handleProcess = useCallback(async () => {
    if (!videoFile || status !== 'idle') return

    setStatus('uploading')
    setError(null)
    setProgress(0, 'Uploading video...')

    try {
      // 1. Upload and start job
      const { rid } = await startDeepMotionJob(videoFile, {
        face: faceTracking,
        hand: handTracking,
        fps,
      })
      setRid(rid)
      setStatus('processing')
      setProgress(10, 'Processing motion capture...')

      // 2. Poll until done
      let done = false
      while (!done) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL))

        const jobStatus = await pollDeepMotionStatus(rid)

        if (jobStatus.status === 'SUCCESS') {
          done = true
          setProgress(80, 'Downloading result...')
        } else if (jobStatus.status === 'FAILURE') {
          throw new Error(jobStatus.message || 'DeepMotion processing failed')
        } else {
          // PROGRESS
          const pct =
            jobStatus.count && jobStatus.total ? Math.round((jobStatus.count / jobStatus.total) * 70) + 10 : progress
          setProgress(pct, jobStatus.message || 'Processing...')
        }
      }

      // 3. Download GLB
      setStatus('downloading')
      const downloads = await getDeepMotionDownloads(rid)
      const glbDownload = downloads.find((d) => d.format === 'glb')
      if (!glbDownload) throw new Error('No GLB file found in results')

      const glbBlob = await downloadDeepMotionGLB(glbDownload.url)
      const glbUrl = URL.createObjectURL(glbBlob)
      setResultGlbUrl(glbUrl)
      setStatus('done')
      setProgress(100, 'Motion capture complete')
    } catch (err) {
      logger.error('[DeepMotion] Processing error:', err)
      setError(err instanceof Error ? err.message : 'DeepMotion processing failed')
    }
  }, [
    videoFile,
    status,
    faceTracking,
    handTracking,
    fps,
    progress,
    setStatus,
    setError,
    setProgress,
    setRid,
    setResultGlbUrl,
  ])

  // ── Add to library ───────────────────────────────────────────────────

  const handleAddToLibrary = useCallback(async () => {
    if (!resultGlbUrl) return

    try {
      // Fetch the GLB blob from the object URL
      const res = await fetch(resultGlbUrl)
      const glbBlob = await res.blob()

      // Parse GLB to extract animation clips
      const buffer = await glbBlob.arrayBuffer()
      const gltf = await parseGLTF(buffer)

      if (gltf.animations.length === 0) {
        setError('No animations found in the downloaded GLB')
        return
      }

      let clip = gltf.animations[0]

      // Remap to active rig if available
      if (activeRig) {
        clip = autoRemapClip(
          clip.clone(),
          activeRig.skeletonTree.boneMapping,
          activeRig.skeletonTree.bones.map((b) => b.name),
        )
      }

      // Save GLB blob to IndexedDB
      const blobId = `deepmotion-${Date.now()}`
      await save3DBlob(blobId, glbBlob)

      // Add to 3D animation store
      const animStore = use3DAnimationStore.getState()
      animStore.addAnimation({
        id: `anim-deepmotion-${Date.now()}`,
        name: `DeepMotion Capture (${clip.duration.toFixed(1)}s)`,
        glbBlobId: blobId,
        durationSeconds: clip.duration,
        fps,
        source: 'imported',
        tags: ['deepmotion', 'mocap', 'cloud', mode],
        createdAt: Date.now(),
      })
    } catch (err) {
      logger.error('[DeepMotion] Add to library error:', err)
      setError(err instanceof Error ? err.message : 'Failed to add to library')
    }
  }, [resultGlbUrl, activeRig, fps, mode, setError])

  // ── Derived state ────────────────────────────────────────────────────

  const isProcessing = status === 'uploading' || status === 'processing' || status === 'downloading'

  return (
    <PanelLayout icon={Cloud} title="DeepMotion" iconClassName="text-violet-400">
      {/* Info */}
      <div className="p-3 bg-violet-500/5 rounded-2xl border border-violet-500/10">
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Upload a video of a person moving. DeepMotion cloud AI extracts 3D skeleton animation which can be applied to
          any {mode === '3d' ? '3D' : '2D'} character.
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

      {videoUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-panel-border">
          <video src={videoUrl} controls className="w-full max-h-40 object-contain bg-black" />
          <button
            onClick={clearVideo}
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
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            setIsDragging(false)
            handleDrop(e)
          }}
          onClick={() => videoInputRef.current?.click()}
        />
      )}

      {/* Settings */}
      {videoUrl && (
        <>
          {/* FPS selector */}
          <div className="p-3 bg-zinc-800/20 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Target FPS</span>
              <span className="text-xs font-mono text-zinc-500">{fps} fps</span>
            </div>
            <div className="flex gap-1.5">
              {[24, 30, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all border',
                    fps === f
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                      : 'bg-black/20 text-zinc-400 border-white/5 hover:border-violet-500/30',
                  )}
                >
                  {f} fps
                </button>
              ))}
            </div>
          </div>

          {/* Tracking toggles */}
          <PanelToggle label="Face Tracking" checked={faceTracking} onChange={setFaceTracking} />
          <PanelToggle label="Hand Tracking" checked={handTracking} onChange={setHandTracking} />

          {/* Active rig info */}
          {activeRig && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <Cloud size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-300">
                Target: {activeRig.skeletonTree.skeletonType} skeleton ({activeRig.skeletonTree.bones.length} bones)
              </span>
            </div>
          )}

          {/* Process button */}
          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isProcessing ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-600 text-white hover:bg-violet-500',
            )}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size={14} />
                {statusMessage || 'Processing...'}
              </>
            ) : (
              <>
                <Cloud size={14} />
                Process with DeepMotion
              </>
            )}
          </button>

          {/* Progress bar */}
          {isProcessing && (
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-violet-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          {/* Result */}
          {status === 'done' && resultGlbUrl && (
            <div className="space-y-3 bg-panel-bg rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Cloud size={14} className="text-violet-400" />
                <span className="text-xs font-medium text-zinc-300">Motion Capture Complete</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">FPS</span>
                  <div className="text-zinc-300 font-mono">{fps}</div>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-2">
                  <span className="text-zinc-500">Tracking</span>
                  <div className="text-zinc-300 font-mono">
                    {[faceTracking && 'Face', handTracking && 'Hand'].filter(Boolean).join(', ') || 'Body'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAddToLibrary}
                className="w-full py-2 rounded-lg bg-violet-600 text-xs text-white font-medium flex items-center justify-center gap-1.5 hover:bg-violet-500 transition-colors"
              >
                <Download size={12} />
                Add to Animation Library
              </button>
            </div>
          )}
        </>
      )}

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}

export default DeepMotionPanel
