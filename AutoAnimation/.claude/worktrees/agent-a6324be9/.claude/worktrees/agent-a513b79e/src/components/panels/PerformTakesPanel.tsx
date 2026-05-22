/**
 * PerformTakesPanel — right panel showing recorded motion capture takes.
 * Displayed when the Perform (webcam) tool is active in the rig editor.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { Pencil, Download, Trash2, Film, Eye, Square } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useMotionTrackingStore } from '@/stores/useMotionTrackingStore'
import { useRigStore } from '@/stores/useRigStore'
import { exportTakeToKeyframes, getTakeStats } from '@/services/motionRecorder'
import { poseFrameToJointPositions } from '@/services/motionTransferService'
import { useEngineContext } from '@bonerigging/editor'
import { poseLandmarksToBonePose } from '@/services/landmarkToBone'
import type { BodyTrackingData } from '@/types/motionTracking'

/** Map MediaPipe bone names → 2D rig joint names */
const MP_TO_2D_JOINT: Record<string, string> = {
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

export function PerformTakesPanel() {
  const { takes, settings, deleteTake, renameTake } = useMotionTrackingStore(
    useShallow((s) => ({
      takes: s.takes,
      settings: s.settings,
      deleteTake: s.deleteTake,
      renameTake: s.renameTake,
    })),
  )

  const [editingTakeId, setEditingTakeId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [previewTakeId, setPreviewTakeId] = useState<string | null>(null)
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null)

  const engine = useEngineContext()
  const activeRigId2D = useRigStore((s) => s.activeRigId)
  const rigs2D = useRigStore((s) => s.rigs)
  const rig2D = activeRigId2D ? rigs2D[activeRigId2D] : null

  // Preview playback: cycle through recorded body frames and apply bone rotations to rig
  const handlePreviewTake = useCallback(
    (takeId: string) => {
      if (previewTakeId === takeId) {
        // Stop preview
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
        previewTimerRef.current = null
        setPreviewTakeId(null)
        return
      }

      const take = takes.find((t) => t.id === takeId)
      if (!take || take.frames.length === 0) return

      const rigState = useRigStore.getState()
      const rigId = rigState.activeRigId
      const rig = rigId ? rigState.rigs[rigId] : null

      // Get frames that have body data
      const bodyFrames = take.frames.filter((f) => f.bodyData?.worldLandmarks?.length)

      if (bodyFrames.length === 0 || !rig) {
        // No body data — just show skeleton canvas preview
        setPreviewTakeId(takeId)
        return
      }

      setPreviewTakeId(takeId)
      let frameIdx = 0

      const tick = () => {
        const frame = bodyFrames[frameIdx]
        if (frame?.bodyData) {
          // Convert world landmarks to bone rotations and apply to rig
          const landmarks = frame.bodyData.worldLandmarks.map((l) => ({
            x: l.x,
            y: l.y,
            z: l.z,
            visibility: l.visibility ?? 1,
          }))
          const bonePose = poseLandmarksToBonePose(landmarks, rig.skeleton, {
            sensitivity: 1.0,
            mirror: settings.mirrorMode,
            visibilityThreshold: 0.5,
          })
          rigState.setCurrentPose(bonePose)
        }

        frameIdx = (frameIdx + 1) % bodyFrames.length
        previewTimerRef.current = setTimeout(tick, 1000 / 30)
      }

      tick()
    },
    [takes, settings.mirrorMode, previewTakeId],
  )

  // Cleanup preview on unmount
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [])

  // Draw webcam skeleton preview on canvas when a take is being previewed
  useEffect(() => {
    if (!previewTakeId || !skeletonCanvasRef.current) return
    const take = takes.find((t) => t.id === previewTakeId)
    if (!take) return

    const bodyFrames = take.frames.filter((f) => f.bodyData?.landmarks?.length)
    if (bodyFrames.length === 0) return

    const canvas = skeletonCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    let frameIdx = 0
    let rafId: number

    const CONNECTIONS: [number, number][] = [
      [11, 12],
      [11, 23],
      [12, 24],
      [23, 24],
      [11, 13],
      [13, 15],
      [12, 14],
      [14, 16],
      [15, 17],
      [15, 19],
      [15, 21],
      [16, 18],
      [16, 20],
      [16, 22],
      [23, 25],
      [25, 27],
      [24, 26],
      [26, 28],
      [0, 11],
      [0, 12],
    ]

    const drawFrame = () => {
      const frame = bodyFrames[frameIdx]
      if (!frame?.bodyData) {
        rafId = requestAnimationFrame(() => setTimeout(drawFrame, 33))
        return
      }

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, w, h)

      const lm = frame.bodyData.landmarks

      // Draw connections
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      for (const [a, b] of CONNECTIONS) {
        const la = lm[a]
        const lb = lm[b]
        if (!la || !lb || (la.visibility ?? 0) < 0.3 || (lb.visibility ?? 0) < 0.3) continue
        ctx.beginPath()
        ctx.moveTo(la.x * w, la.y * h)
        ctx.lineTo(lb.x * w, lb.y * h)
        ctx.stroke()
      }

      // Draw hand landmarks (21 points per hand)
      const HAND_CONNS: [number, number][] = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [0, 5],
        [5, 6],
        [6, 7],
        [7, 8],
        [0, 9],
        [9, 10],
        [10, 11],
        [11, 12],
        [0, 13],
        [13, 14],
        [14, 15],
        [15, 16],
        [0, 17],
        [17, 18],
        [18, 19],
        [19, 20],
        [5, 9],
        [9, 13],
        [13, 17],
      ]
      if (frame.bodyData.handLandmarks) {
        for (const hand of frame.bodyData.handLandmarks) {
          ctx.strokeStyle = '#a78bfa'
          ctx.lineWidth = 1.5
          for (const [a, b] of HAND_CONNS) {
            const la = hand.landmarks[a]
            const lb = hand.landmarks[b]
            if (!la || !lb) continue
            ctx.beginPath()
            ctx.moveTo(la.x * w, la.y * h)
            ctx.lineTo(lb.x * w, lb.y * h)
            ctx.stroke()
          }
          ctx.fillStyle = '#c4b5fd'
          for (const pt of hand.landmarks) {
            ctx.beginPath()
            ctx.arc(pt.x * w, pt.y * h, 1.5, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Frame counter
      ctx.fillStyle = '#666'
      ctx.font = '9px monospace'
      ctx.fillText(`${frameIdx + 1}/${bodyFrames.length}`, 3, h - 3)

      frameIdx = (frameIdx + 1) % bodyFrames.length
      rafId = requestAnimationFrame(() => setTimeout(drawFrame, 33))
    }

    drawFrame()
    return () => cancelAnimationFrame(rafId)
  }, [previewTakeId, takes])

  const handleApplyTake = useCallback(
    (takeId: string) => {
      const take = takes.find((t) => t.id === takeId)
      if (!take || take.frames.length === 0) return

      exportTakeToKeyframes(take, {
        headRotationScale: settings.headRotationScale,
        mirrorMode: settings.mirrorMode,
      })

      const bodyFrames = take.frames.filter((f) => f.bodyData?.landmarks?.length)
      if (bodyFrames.length > 0 && engine) {
        const imgW = rig2D?.imageWidth ?? 512
        const imgH = rig2D?.imageHeight ?? 512
        const fps = 24

        const poseFrames = bodyFrames.map((f) => ({
          frameIndex: f.frame,
          timestamp: f.frame / fps,
          landmarks: f.bodyData!.landmarks,
          worldLandmarks: f.bodyData!.worldLandmarks,
        }))

        const restPos = poseFrameToJointPositions(poseFrames[0], undefined, imgW, imgH)

        const keyframes = poseFrames.map((frame, i) => {
          const positions = poseFrameToJointPositions(frame, undefined, imgW, imgH)
          const deltas: Record<string, { x: number; y: number }> = {}
          for (const [mpBone, pos] of Object.entries(positions)) {
            const rest = restPos[mpBone]
            if (!rest) continue
            const jointName = MP_TO_2D_JOINT[mpBone] ?? mpBone
            const dx = pos.x - rest.x
            const dy = pos.y - rest.y
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
              deltas[jointName] = { x: dx, y: dy }
            }
          }
          return { time: i / fps, deltas, pinned: [] }
        })

        const brAnim = {
          name: `Webcam MoCap (${keyframes.length} frames)`,
          duration: keyframes.length / fps,
          fps,
          loop: false,
          ts: Date.now(),
          keyframes,
        }

        for (let i = 0; i < 100; i++) {
          try {
            engine.handleAnimDeleteAnimation(0)
          } catch {
            break
          }
        }
        engine.handleAnimImport(JSON.stringify([brAnim]))
        engine.handleAnimLoadAnimation(0)
      }
    },
    [takes, settings.headRotationScale, settings.mirrorMode, engine, rig2D],
  )

  const handleStartRename = (takeId: string, currentName: string) => {
    setEditingTakeId(takeId)
    setEditName(currentName)
  }

  const handleFinishRename = () => {
    if (editingTakeId && editName.trim()) {
      renameTake(editingTakeId, editName.trim())
    }
    setEditingTakeId(null)
    setEditName('')
  }

  if (takes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <Film size={28} className="mb-3" />
        <span className="text-sm text-gray-400">No takes recorded</span>
        <span className="text-xs text-gray-600 mt-1">Record a performance to see takes here</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Takes ({takes.length})</h3>
      </div>
      <div className="px-3 py-2 space-y-1">
        {takes.map((take) => {
          const stats = getTakeStats(take)
          const isEditing = editingTakeId === take.id

          return (
            <div key={take.id}>
              <div className="flex items-center gap-2 px-2.5 py-2 bg-[#2a2a2a] rounded-lg border border-white/5 group">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRename()
                        if (e.key === 'Escape') setEditingTakeId(null)
                      }}
                      className="w-full bg-zinc-700 text-white text-xs px-1.5 py-0.5 rounded outline-none focus:ring-1 ring-[#4a7eff]/50"
                    />
                  ) : (
                    <>
                      <p className="text-xs text-white truncate">{take.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {stats.frameCount} frames &middot; {stats.durationSeconds.toFixed(1)}s
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePreviewTake(take.id)}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                      previewTakeId === take.id
                        ? 'text-green-400 hover:text-green-300 bg-green-500/10'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                    title={previewTakeId === take.id ? 'Stop preview' : 'Preview skeleton'}
                  >
                    {previewTakeId === take.id ? <Square size={12} /> : <Eye size={12} />}
                  </button>
                  <button
                    onClick={() => handleStartRename(take.id, take.name)}
                    className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                    title="Rename"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => handleApplyTake(take.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-[#4a7eff] hover:text-[#5a8eff] hover:bg-[#4a7eff]/10 transition-colors"
                    title="Apply to timeline"
                  >
                    <Download size={12} />
                  </button>
                  <button
                    onClick={() => deleteTake(take.id)}
                    className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              {/* Webcam skeleton preview — shows the raw recorded MediaPipe skeleton */}
              {previewTakeId === take.id && (
                <div className="px-2.5 pb-2">
                  <div className="rounded-lg overflow-hidden border border-white/5">
                    <canvas ref={skeletonCanvasRef} width={240} height={180} className="w-full bg-black" />
                    <div className="px-2 py-1 bg-[#1a1a1a] text-[9px] text-zinc-500">Webcam skeleton (recorded)</div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
