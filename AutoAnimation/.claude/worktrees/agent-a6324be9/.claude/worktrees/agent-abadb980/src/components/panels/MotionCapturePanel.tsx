/**
 * Motion Capture Panel — upload a video of a person moving, extract skeleton
 * poses with MediaPipe, and save as a 2D or 3D animation.
 *
 * 2D mode: extracts poses → converts to joint deltas → injects into bonerigging engine
 * 3D mode: extracts poses → builds THREE.AnimationClip → saves to 3D animation library
 */
import { useCallback, useRef, useState, useEffect } from 'react'
import { Camera, Upload, X, Play, Eye, Loader2, Info } from 'lucide-react'
import * as THREE from 'three'
import { useMotionCaptureStore } from '@/stores/useMotionCaptureStore'
// import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { useRigStore } from '@/stores/useRigStore'
import { captureMotionFromVideo } from '@/services/motionCapture'
import { extractPosesFromVideo, poseFrameToJointPositions } from '@/services/motionTransferService'
// import { autoRemapClip } from '@/services/gltfUtils'
import { PanelDropZone } from '@/components/ui/panel-controls/PanelDropZone'
import { cn } from '@/lib/utils'
import { logger } from '@/utils/logger'

import { useEngineContext } from '@bonerigging/editor'

/** Map MediaPipe standard bone names → 2D rig joint names */
const MEDIAPIPE_TO_2D_JOINT: Record<string, string> = {
  Pelvis: 'hips',
  Spine1: 'spine',
  Neck: 'neck',
  Head: 'head',
  L_Shoulder: 'leftShoulder',
  L_Elbow: 'leftElbow',
  R_Shoulder: 'rightShoulder',
  R_Elbow: 'rightElbow',
  L_Hip: 'leftHip',
  L_Knee: 'leftKnee',
  R_Hip: 'rightHip',
  R_Knee: 'rightKnee',
}

/** Skeleton connections for preview drawing */
const SKELETON_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16], // shoulders, arms
  [11, 23],
  [12, 24],
  [23, 24], // torso
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28], // legs
  [0, 11],
  [0, 12], // nose to shoulders (proxy neck/head)
]

export function MotionCapturePanel({ mode = '3d' }: { mode?: '2d' | '3d' }) {
  const videoInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const previewAnimRef = useRef<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

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

  const setSourceVideo = useMotionCaptureStore((s) => s.setSourceVideo)
  const clearSourceVideo = useMotionCaptureStore((s) => s.clearSourceVideo)
  const setFps = useMotionCaptureStore((s) => s.setFps)
  const setProcessing = useMotionCaptureStore((s) => s.setProcessing)
  const setProgress = useMotionCaptureStore((s) => s.setProgress)
  const setError = useMotionCaptureStore((s) => s.setError)
  const setResult = useMotionCaptureStore((s) => s.setResult)

  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const activeRigId2D = useRigStore((s) => s.activeRigId)
  const rigs2D = useRigStore((s) => s.rigs)
  const rig2D = activeRigId2D ? rigs2D[activeRigId2D] : null

  const engine = useEngineContext()
  const [poseFrames2D, setPoseFrames2D] = useState<any[] | null>(null)

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleVideoSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      e.target.value = ''
      setSourceVideo(file)
    },
    [setSourceVideo],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (!file || !file.type.startsWith('video/')) return
      setSourceVideo(file)
    },
    [setSourceVideo],
  )

  const handleStartCapture = useCallback(async () => {
    if (!sourceVideoBlob || isProcessing) return

    setProcessing(true)
    setProgress(1, 'Initializing MediaPipe...')
    setError(null)
    setShowPreview(false)

    try {
      if (mode === '2d') {
        const file = new File([sourceVideoBlob], 'video.mp4', { type: sourceVideoBlob.type || 'video/mp4' })
        const result = await extractPosesFromVideo(
          file,
          {
            extractionFps: fps,
            smoothing: 0.3,
            visibilityThreshold: 0.5,
            includeFace: false,
            includeHands: false,
            retargetScale: 1.0,
          },
          (prog) => setProgress(prog.percentage, `Extracting frame ${prog.currentFrame}/${prog.totalFrames}`),
        )
        setPoseFrames2D(result.poseFrames)

        // Auto-apply to rig immediately after extraction
        setProgress(100, 'Applying to rig...')
        if (engine) {
          const imgW = rig2D?.imageWidth ?? 512
          const imgH = rig2D?.imageHeight ?? 512
          const frames = result.poseFrames
          const restPos = poseFrameToJointPositions(frames[0], undefined, imgW, imgH)

          const keyframes = frames.map((frame, i) => {
            const positions = poseFrameToJointPositions(frame, undefined, imgW, imgH)
            const deltas: Record<string, { x: number; y: number }> = {}
            for (const [mpBone, pos] of Object.entries(positions)) {
              const rest = restPos[mpBone]
              if (!rest) continue
              const jointName = MEDIAPIPE_TO_2D_JOINT[mpBone] ?? mpBone
              const dx = pos.x - rest.x
              const dy = pos.y - rest.y
              if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                deltas[jointName] = { x: dx, y: dy }
              }
            }
            return { time: i / fps, deltas, pinned: [] }
          })

          const brAnim = {
            name: `Video MoCap (${frames.length} frames)`,
            duration: frames.length / fps,
            fps,
            loop: false,
            ts: Date.now(),
            keyframes,
          }

          // Clear old animations
          for (let i = 0; i < 100; i++) {
            try {
              engine.handleAnimDeleteAnimation(0)
            } catch {
              break
            }
          }
          // Import and load
          engine.handleAnimImport(JSON.stringify([brAnim]))
          engine.handleAnimLoadAnimation(0)
        }

        const dummyClip = new THREE.AnimationClip('mocap-2d', result.sourceDuration, [])
        setResult(dummyClip, [], result.sourceDuration, result.totalFrames)
      } else {
        const result = await captureMotionFromVideo(
          sourceVideoBlob,
          fps,
          activeRig?.skeletonTree.boneMapping,
          (prog, msg) => setProgress(prog, msg),
        )
        setResult(result.clip, result.landmarks, result.durationSeconds, result.frameCount)
      }
    } catch (err) {
      logger.error('[MotionCapture] Error:', err)
      setError(err instanceof Error ? err.message : 'Motion capture failed')
    } finally {
      if (useMotionCaptureStore.getState().isProcessing) {
        setProcessing(false)
      }
    }
  }, [sourceVideoBlob, isProcessing, fps, activeRig, mode, setProcessing, setError, setProgress, setResult])

  // handleApplyToRig removed — 2D auto-applies during extraction, 3D handled inline

  // ── Skeleton Preview Playback ────────────────────────────────────────────

  useEffect(() => {
    if (!showPreview || !poseFrames2D?.length) return

    const canvas = previewCanvasRef.current
    const video = previewVideoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    let frameIdx = 0

    const drawFrame = () => {
      const frame = poseFrames2D[frameIdx]
      if (!frame) {
        frameIdx = 0
        return
      }

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, w, h)

      // Draw connections
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      for (const [a, b] of SKELETON_CONNECTIONS) {
        const la = frame.landmarks[a]
        const lb = frame.landmarks[b]
        if (!la || !lb || la.visibility < 0.3 || lb.visibility < 0.3) continue
        ctx.beginPath()
        ctx.moveTo(la.x * w, la.y * h)
        ctx.lineTo(lb.x * w, lb.y * h)
        ctx.stroke()
      }

      // Draw joints
      ctx.fillStyle = '#06b6d4'
      for (const lm of frame.landmarks) {
        if (lm.visibility < 0.3) continue
        ctx.beginPath()
        ctx.arc(lm.x * w, lm.y * h, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Frame counter
      ctx.fillStyle = '#666'
      ctx.font = '10px monospace'
      ctx.fillText(`${frameIdx + 1}/${poseFrames2D.length}`, 4, h - 4)

      frameIdx = (frameIdx + 1) % poseFrames2D.length
      previewAnimRef.current = requestAnimationFrame(() => {
        setTimeout(drawFrame, 1000 / fps)
      })
    }

    drawFrame()
    return () => cancelAnimationFrame(previewAnimRef.current)
  }, [showPreview, poseFrames2D, fps])

  // ── Render ───────────────────────────────────────────────────────────────

  const hasResult = !!resultClip && !isProcessing

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Info icon */}
        <div className="flex justify-end">
          <div className="relative group">
            <button className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] transition-colors">
              <Info size={14} />
            </button>
            <div className="absolute top-full right-0 mt-1.5 w-56 px-3 py-2 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl text-[10px] text-zinc-400 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
              {mode === '2d'
                ? 'Upload a video of a person moving. MediaPipe extracts body poses and applies them as keyframes to your 2D rig.'
                : 'Upload a video of a person moving. MediaPipe extracts 3D skeleton poses for your 3D character.'}
            </div>
          </div>
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
              ref={previewVideoRef}
              src={sourceVideoUrl}
              controls
              className="w-full max-h-36 object-contain bg-black"
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

        {/* FPS selector — show after upload */}
        {sourceVideoUrl && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-zinc-500">FPS</span>
            <div className="flex gap-1">
              {[12, 24, 30].map((f) => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[10px] font-medium transition-all border',
                    fps === f
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      : 'bg-black/20 text-zinc-500 border-white/5 hover:text-zinc-300',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Processing feedback */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              <span className="text-xs text-zinc-300">{statusMessage || 'Processing...'}</span>
              <span className="ml-auto text-xs font-mono text-cyan-400">{progress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <span className="text-xs text-red-400">{error}</span>
          </div>
        )}

        {/* Result summary + skeleton preview */}
        {hasResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <Camera size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-300 font-medium">
                {frameCount} frames extracted ({durationSeconds?.toFixed(1)}s)
              </span>
            </div>

            {/* Skeleton preview toggle + canvas */}
            {poseFrames2D && (
              <>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors border',
                    showPreview
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                      : 'bg-zinc-800/50 text-zinc-400 border-white/5 hover:text-zinc-200',
                  )}
                >
                  <Eye size={12} />
                  {showPreview ? 'Hide' : 'Preview'} Skeleton Playback
                </button>

                {showPreview && (
                  <div className="rounded-lg overflow-hidden border border-[#3a3a3a]">
                    <canvas ref={previewCanvasRef} width={260} height={200} className="w-full bg-black" />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Sticky action button at bottom */}
      {sourceVideoUrl && !hasResult && (
        <div className="shrink-0 p-3 border-t border-white/5 bg-zinc-900/80">
          <button
            onClick={handleStartCapture}
            disabled={isProcessing}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-colors',
              isProcessing ? 'bg-cyan-500/20 text-cyan-400 cursor-wait' : 'bg-cyan-600 text-white hover:bg-cyan-500',
            )}
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Extracting... {progress}%
              </>
            ) : (
              <>
                <Play size={14} />
                Extract &amp; Apply Motion
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
