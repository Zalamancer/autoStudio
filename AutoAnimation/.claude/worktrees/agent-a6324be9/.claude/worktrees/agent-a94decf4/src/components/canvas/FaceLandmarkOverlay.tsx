/**
 * FaceLandmarkOverlay — Debug overlay that draws face + body landmarks on the webcam preview.
 * Renders face mesh outline and body skeleton as colored lines on a <canvas> overlaid on <video>.
 */

import { useRef, useEffect, memo } from 'react'

interface FaceLandmarkOverlayProps {
  /** The MediaStream from the webcam */
  stream: MediaStream | null
  /** Width of the video preview element */
  width: number
  /** Height of the video preview element */
  height: number
  /** Mirror horizontally */
  mirror?: boolean
  /** Whether body tracking is enabled */
  showBody?: boolean
}

// Face mesh landmark indices for simplified outline
const FACE_OUTLINE = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
]
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33]
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362]
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61]

// Body skeleton connections (MediaPipe Pose 33 landmarks, excluding hand details)
const BODY_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  [27, 29],
  [27, 31],
  // Right leg
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
  // Head (nose to shoulders)
  [0, 11],
  [0, 12],
]

// Hand landmark connections (MediaPipe Hand 21 landmarks)
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // Palm
  [5, 9],
  [9, 13],
  [13, 17],
]

export const FaceLandmarkOverlay = memo(function FaceLandmarkOverlay({
  stream,
  width,
  height,
  mirror = true,
  showBody = false,
}: FaceLandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const faceLandmarkerRef = useRef<unknown>(null)
  const poseLandmarkerRef = useRef<unknown>(null)
  const handLandmarkerRef = useRef<unknown>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!stream || !videoRef.current) return

    const video = videoRef.current
    video.srcObject = stream
    video.play()

    let active = true

    const initAndDraw = async () => {
      try {
        const { FaceLandmarker, PoseLandmarker, HandLandmarker, FilesetResolver } =
          await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        )

        const fl = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
        faceLandmarkerRef.current = fl

        const pl = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        })
        poseLandmarkerRef.current = pl

        const hl = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        })
        handLandmarkerRef.current = hl

        // Alternate: even frames = face+pose, odd frames = face+hands
        // Each frame only runs 2 models (same load as before)
        let tick = 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let cachedBody: any = null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let cachedHands: any = null

        const draw = () => {
          if (!active || !canvasRef.current || !video || video.readyState < 2) {
            if (active) rafRef.current = requestAnimationFrame(draw)
            return
          }

          const ctx = canvasRef.current.getContext('2d')
          if (!ctx) return

          const now = performance.now()
          ctx.clearRect(0, 0, width, height)

          ctx.save()
          if (mirror) {
            ctx.translate(width, 0)
            ctx.scale(-1, 1)
          }

          // Face landmarks — every frame
          const faceResult = fl.detectForVideo(video, now)
          if (faceResult.faceLandmarks?.length > 0) {
            const landmarks = faceResult.faceLandmarks[0]
            drawPath(ctx, landmarks, FACE_OUTLINE, '#4ade80', 1.5)
            drawPath(ctx, landmarks, LEFT_EYE, '#60a5fa', 1)
            drawPath(ctx, landmarks, RIGHT_EYE, '#60a5fa', 1)
            drawPath(ctx, landmarks, LIPS_OUTER, '#f472b6', 1)
          }

          if (showBody) {
            const isBodyTick = tick % 2 === 0

            // Alternate: pose on even frames, hands on odd frames
            if (isBodyTick) {
              try {
                cachedBody = pl.detectForVideo(video, now)
              } catch {
                /* skip */
              }
            } else {
              try {
                cachedHands = hl.detectForVideo(video, now)
              } catch {
                /* skip */
              }
            }

            const w = ctx.canvas.width
            const h = ctx.canvas.height

            // Draw body (from cached or fresh)
            if (cachedBody?.landmarks?.length > 0) {
              const bodyLm = cachedBody.landmarks[0]

              ctx.strokeStyle = '#22d3ee'
              ctx.lineWidth = 2.5
              ctx.lineJoin = 'round'
              for (const [a, b] of BODY_CONNECTIONS) {
                const la = bodyLm[a]
                const lb = bodyLm[b]
                if (!la || !lb || (la.visibility ?? 0) < 0.3 || (lb.visibility ?? 0) < 0.3) continue
                ctx.beginPath()
                ctx.moveTo(la.x * w, la.y * h)
                ctx.lineTo(lb.x * w, lb.y * h)
                ctx.stroke()
              }
            }

            // Draw hands (from cached or fresh)
            if (cachedHands?.landmarks?.length > 0) {
              for (const handLm of cachedHands.landmarks) {
                ctx.strokeStyle = '#a78bfa'
                ctx.lineWidth = 1.5
                ctx.lineJoin = 'round'
                for (const [a, b] of HAND_CONNECTIONS) {
                  const la = handLm[a]
                  const lb = handLm[b]
                  if (!la || !lb) continue
                  ctx.beginPath()
                  ctx.moveTo(la.x * w, la.y * h)
                  ctx.lineTo(lb.x * w, lb.y * h)
                  ctx.stroke()
                }

                ctx.fillStyle = '#c4b5fd'
                for (const lm of handLm) {
                  ctx.beginPath()
                  ctx.arc(lm.x * w, lm.y * h, 2.5, 0, Math.PI * 2)
                  ctx.fill()
                }
              }
            }

            tick++
          }

          ctx.restore()
          rafRef.current = requestAnimationFrame(draw)
        }

        rafRef.current = requestAnimationFrame(draw)
      } catch {
        // MediaPipe not available for overlay — silently skip
      }
    }

    initAndDraw()

    return () => {
      active = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (faceLandmarkerRef.current) {
        ;(faceLandmarkerRef.current as { close: () => void }).close()
        faceLandmarkerRef.current = null
      }
      if (poseLandmarkerRef.current) {
        ;(poseLandmarkerRef.current as { close: () => void }).close()
        poseLandmarkerRef.current = null
      }
      if (handLandmarkerRef.current) {
        ;(handLandmarkerRef.current as { close: () => void }).close()
        handLandmarkerRef.current = null
      }
    }
  }, [stream, width, height, mirror, showBody])

  return (
    <div className="relative" style={{ width, height }}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover rounded-lg"
        style={{ transform: mirror ? 'scaleX(-1)' : undefined }}
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
      />
    </div>
  )
})

function drawPath(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number }>,
  indices: number[],
  color: string,
  lineWidth: number,
) {
  if (indices.length < 2) return

  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'

  const w = ctx.canvas.width
  const h = ctx.canvas.height

  const first = landmarks[indices[0]]
  ctx.moveTo(first.x * w, first.y * h)

  for (let i = 1; i < indices.length; i++) {
    const lm = landmarks[indices[i]]
    ctx.lineTo(lm.x * w, lm.y * h)
  }

  ctx.stroke()
}
