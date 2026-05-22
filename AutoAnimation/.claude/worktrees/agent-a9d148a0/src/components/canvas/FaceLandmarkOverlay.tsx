/**
 * FaceLandmarkOverlay — Debug overlay that draws face landmarks on the webcam preview.
 * Renders the face mesh outline (jaw, eyebrows, nose, eyes, lips) as dots on a
 * <canvas> element overlaid on the <video> preview.
 */

import { useRef, useEffect } from 'react'

interface FaceLandmarkOverlayProps {
  /** The MediaStream from the webcam */
  stream: MediaStream | null
  /** Width of the video preview element */
  width: number
  /** Height of the video preview element */
  height: number
  /** Mirror horizontally */
  mirror?: boolean
}

// Key face mesh landmark indices for drawing a simplified outline
const FACE_OUTLINE = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378,
  400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
]
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33]
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362]
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61]

export function FaceLandmarkOverlay({ stream, width, height, mirror = true }: FaceLandmarkOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const faceLandmarkerRef = useRef<unknown>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!stream || !videoRef.current) return

    const video = videoRef.current
    video.srcObject = stream
    video.play()

    let active = true

    const initAndDraw = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
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

        const draw = () => {
          if (!active || !canvasRef.current || !video || video.readyState < 2) {
            if (active) rafRef.current = requestAnimationFrame(draw)
            return
          }

          const ctx = canvasRef.current.getContext('2d')
          if (!ctx) return

          const result = fl.detectForVideo(video, performance.now())
          ctx.clearRect(0, 0, width, height)

          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            const landmarks = result.faceLandmarks[0]

            ctx.save()
            if (mirror) {
              ctx.translate(width, 0)
              ctx.scale(-1, 1)
            }

            // Draw face outline
            drawPath(ctx, landmarks, FACE_OUTLINE, '#4ade80', 1.5)
            // Draw eyes
            drawPath(ctx, landmarks, LEFT_EYE, '#60a5fa', 1)
            drawPath(ctx, landmarks, RIGHT_EYE, '#60a5fa', 1)
            // Draw lips
            drawPath(ctx, landmarks, LIPS_OUTER, '#f472b6', 1)

            ctx.restore()
          }

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
        (faceLandmarkerRef.current as { close: () => void }).close()
        faceLandmarkerRef.current = null
      }
    }
  }, [stream, width, height, mirror])

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
}

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
