/**
 * AI Eye Contact Correction Service
 *
 * Uses MediaPipe Face Mesh to detect eye regions in character sprites,
 * then applies canvas-based warping to redirect gaze direction toward
 * the camera or a specified target point.
 *
 * Two-stage approach:
 * 1. Eye region detection via MediaPipe Face Mesh (468 landmarks)
 * 2. Canvas warping of the iris/pupil region toward the target direction
 */

import type {
  EyeDetectionResult,
  EyeRegionBox,
  EyeCorrectedSprite,
  GazeTarget,
  EyeCorrectionBatchStatus,
} from '@/types/eyeContact'

// MediaPipe Face Mesh landmark indices for eye regions
const LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
const RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
const LEFT_IRIS_CENTER = 468
const RIGHT_IRIS_CENTER = 473

// Lazy-loaded MediaPipe module reference
let faceLandmarkerInstance: import('@mediapipe/tasks-vision').FaceLandmarker | null = null

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

/** Track whether MediaPipe initialization has been attempted and failed */
let mediaPipeUnavailable = false

/**
 * Lazily initialize the MediaPipe FaceLandmarker for eye detection.
 * Falls back gracefully if MediaPipe is not available.
 */
async function getFaceLandmarker(): Promise<import('@mediapipe/tasks-vision').FaceLandmarker | null> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance
  if (mediaPipeUnavailable) return null

  try {
    const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
    const vision = await FilesetResolver.forVisionTasks(WASM_URL)
    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU',
      },
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
      runningMode: 'IMAGE',
      numFaces: 1,
    })
    return faceLandmarkerInstance
  } catch (err) {
    console.warn('[EyeContactCorrection] MediaPipe FaceLandmarker unavailable, using heuristic fallback:', err)
    mediaPipeUnavailable = true
    return null
  }
}

/**
 * Load an image from a data URL into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.src = src
  })
}

/**
 * Compute a bounding box from a set of landmark indices.
 */
function computeEyeBox(
  landmarks: Array<{ x: number; y: number; z: number }>,
  indices: number[],
): EyeRegionBox | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  let validCount = 0

  for (const idx of indices) {
    const lm = landmarks[idx]
    if (!lm) continue
    minX = Math.min(minX, lm.x)
    minY = Math.min(minY, lm.y)
    maxX = Math.max(maxX, lm.x)
    maxY = Math.max(maxY, lm.y)
    validCount++
  }

  if (validCount < 4) return null

  // Add padding (20% of eye size)
  const padX = (maxX - minX) * 0.2
  const padY = (maxY - minY) * 0.2

  return {
    x: Math.max(0, minX - padX),
    y: Math.max(0, minY - padY),
    width: Math.min(1, maxX - minX + padX * 2),
    height: Math.min(1, maxY - minY + padY * 2),
  }
}

/**
 * Heuristic-based eye region estimation for when MediaPipe is unavailable.
 * Uses standard face proportions to estimate eye positions from the image center.
 * Assumes a forward-facing character/face sprite.
 */
function heuristicEyeDetection(_imgWidth: number, _imgHeight: number): EyeDetectionResult {
  // Standard face proportions: eyes are roughly at 40% from top,
  // left eye at ~35% from left, right eye at ~65% from left
  const eyeY = 0.38
  const eyeW = 0.12
  const eyeH = 0.06
  const leftEyeX = 0.30
  const rightEyeX = 0.58

  const leftEye: EyeRegionBox = {
    x: leftEyeX,
    y: eyeY,
    width: eyeW,
    height: eyeH,
  }

  const rightEye: EyeRegionBox = {
    x: rightEyeX,
    y: eyeY,
    width: eyeW,
    height: eyeH,
  }

  return {
    leftEye,
    rightEye,
    gazeDirection: { x: 0, y: 0 }, // Assume forward gaze for heuristic
    confidence: 0.3, // Low confidence since this is a guess
  }
}

/**
 * Detect eye regions in a character sprite image.
 *
 * Uses MediaPipe Face Mesh (468 landmarks + iris) when available.
 * Falls back to heuristic face-proportion estimation when MediaPipe
 * cannot be loaded (e.g., WASM unavailable, offline, or unsupported browser).
 */
export async function detectEyeRegions(imageSrc: string): Promise<EyeDetectionResult> {
  const img = await loadImage(imageSrc)

  // Draw to canvas for detection
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const landmarker = await getFaceLandmarker()

  // Fallback to heuristic detection if MediaPipe is unavailable
  if (!landmarker) {
    console.info('[EyeContactCorrection] Using heuristic eye detection fallback')
    return heuristicEyeDetection(img.naturalWidth, img.naturalHeight)
  }

  const result = landmarker.detect(canvas)

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return {
      leftEye: null,
      rightEye: null,
      gazeDirection: { x: 0, y: 0 },
      confidence: 0,
    }
  }

  const landmarks = result.faceLandmarks[0]
  const leftEye = computeEyeBox(landmarks, LEFT_EYE_INDICES)
  const rightEye = computeEyeBox(landmarks, RIGHT_EYE_INDICES)

  // Estimate current gaze direction from iris position relative to eye center
  let gazeX = 0
  let gazeY = 0
  let totalVisibility = 0

  if (landmarks[LEFT_IRIS_CENTER] && leftEye) {
    const irisCenterL = landmarks[LEFT_IRIS_CENTER]
    const eyeCenterLX = leftEye.x + leftEye.width / 2
    const eyeCenterLY = leftEye.y + leftEye.height / 2
    gazeX += (irisCenterL.x - eyeCenterLX) / (leftEye.width / 2)
    gazeY += (irisCenterL.y - eyeCenterLY) / (leftEye.height / 2)
    // Use landmark visibility for confidence
    totalVisibility += irisCenterL.visibility ?? 0.5
  }

  if (landmarks[RIGHT_IRIS_CENTER] && rightEye) {
    const irisCenterR = landmarks[RIGHT_IRIS_CENTER]
    const eyeCenterRX = rightEye.x + rightEye.width / 2
    const eyeCenterRY = rightEye.y + rightEye.height / 2
    gazeX += (irisCenterR.x - eyeCenterRX) / (rightEye.width / 2)
    gazeY += (irisCenterR.y - eyeCenterRY) / (rightEye.height / 2)
    totalVisibility += irisCenterR.visibility ?? 0.5
  }

  // Average if both eyes detected
  const eyeCount = (leftEye ? 1 : 0) + (rightEye ? 1 : 0)
  if (eyeCount > 0) {
    gazeX /= eyeCount
    gazeY /= eyeCount
  }

  // Compute confidence from eye count and landmark visibility
  // Base confidence: 0.5 per eye detected, boosted by iris visibility
  const baseConfidence = eyeCount * 0.4
  const visibilityBoost = eyeCount > 0 ? (totalVisibility / eyeCount) * 0.2 : 0
  const confidence = Math.min(1, baseConfidence + visibilityBoost)

  return {
    leftEye,
    rightEye,
    gazeDirection: {
      x: Math.max(-1, Math.min(1, gazeX)),
      y: Math.max(-1, Math.min(1, gazeY)),
    },
    confidence,
  }
}

/**
 * Apply iris warping to redirect gaze in a single eye region.
 * Uses a simple pixel shift within the eye bounding box.
 */
function warpEyeRegion(
  ctx: CanvasRenderingContext2D,
  _imageData: ImageData,
  eyeBox: EyeRegionBox,
  currentGaze: { x: number; y: number },
  targetGaze: { x: number; y: number },
  strength: number,
  imgWidth: number,
  imgHeight: number,
): void {
  // Compute pixel offset needed to shift gaze
  const dx = (targetGaze.x - currentGaze.x) * strength * eyeBox.width * imgWidth * 0.15
  const dy = (targetGaze.y - currentGaze.y) * strength * eyeBox.height * imgHeight * 0.15

  // Eye region in pixel coords
  const ex = Math.round(eyeBox.x * imgWidth)
  const ey = Math.round(eyeBox.y * imgHeight)
  const ew = Math.round(eyeBox.width * imgWidth)
  const eh = Math.round(eyeBox.height * imgHeight)

  // Extract eye region
  const eyeImageData = ctx.getImageData(ex, ey, ew, eh)
  const src = new Uint8ClampedArray(eyeImageData.data)

  // Apply radial falloff pixel shift (stronger at center, zero at edges)
  const centerX = ew / 2
  const centerY = eh / 2
  const radiusX = ew / 2
  const radiusY = eh / 2

  for (let py = 0; py < eh; py++) {
    for (let px = 0; px < ew; px++) {
      // Elliptical distance from center (0 = center, 1 = edge)
      const normX = (px - centerX) / radiusX
      const normY = (py - centerY) / radiusY
      const dist = Math.sqrt(normX * normX + normY * normY)

      if (dist >= 1) continue

      // Smooth falloff from center
      const falloff = Math.cos(dist * Math.PI * 0.5)

      // Source pixel with reverse shift
      const srcX = Math.round(px - dx * falloff)
      const srcY = Math.round(py - dy * falloff)

      if (srcX >= 0 && srcX < ew && srcY >= 0 && srcY < eh) {
        const dstIdx = (py * ew + px) * 4
        const srcIdx = (srcY * ew + srcX) * 4
        eyeImageData.data[dstIdx] = src[srcIdx]
        eyeImageData.data[dstIdx + 1] = src[srcIdx + 1]
        eyeImageData.data[dstIdx + 2] = src[srcIdx + 2]
        eyeImageData.data[dstIdx + 3] = src[srcIdx + 3]
      }
    }
  }

  ctx.putImageData(eyeImageData, ex, ey)
}

/**
 * Compute the target gaze direction for a given target type.
 * 'camera' target means gaze straight at center (0, 0).
 * 'character' target uses the multi-character store to compute
 *  the relative direction toward another character's position.
 */
function computeTargetGaze(target: GazeTarget): { x: number; y: number } {
  switch (target.type) {
    case 'camera':
      return { x: 0, y: 0 }
    case 'point':
      return { x: Math.max(-1, Math.min(1, target.x)), y: Math.max(-1, Math.min(1, target.y)) }
    case 'character': {
      // Attempt to look up character positions from the multi-character store
      try {
        const { useMultiCharacterStore } = require('@/stores/useMultiCharacterStore') as {
          useMultiCharacterStore: { getState: () => {
            characters: Array<{ id: string; position?: { x: number; y: number } }>
          }}
        }
        const state = useMultiCharacterStore.getState()
        const targetChar = state.characters.find((c) => c.id === target.characterId)
        if (targetChar?.position) {
          // Normalize position to -1..1 range (assuming canvas center is 0,0)
          // This is approximate -- use the character's relative offset direction
          const nx = Math.max(-1, Math.min(1, targetChar.position.x > 0 ? 0.5 : -0.5))
          const ny = Math.max(-1, Math.min(1, targetChar.position.y > 0 ? 0.2 : -0.2))
          return { x: nx, y: ny }
        }
      } catch {
        // Store not available, fall through to default
      }
      // Default: look slightly right (common for character-to-character dialogue)
      return { x: 0.3, y: 0 }
    }
    default:
      return { x: 0, y: 0 }
  }
}

/**
 * Apply eye contact correction to a single sprite image.
 */
export async function correctEyeContact(
  imageSrc: string,
  target: GazeTarget,
  strength: number = 0.8,
): Promise<EyeCorrectedSprite> {
  const img = await loadImage(imageSrc)
  const detection = await detectEyeRegions(imageSrc)

  // If no eyes detected, return original
  if (!detection.leftEye && !detection.rightEye) {
    return {
      originalSrc: imageSrc,
      correctedSrc: imageSrc,
      detection,
      target,
    }
  }

  // Create canvas with original image
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const targetGaze = computeTargetGaze(target)

  // Warp each detected eye
  if (detection.leftEye) {
    warpEyeRegion(
      ctx, imageData, detection.leftEye,
      detection.gazeDirection, targetGaze,
      strength, canvas.width, canvas.height,
    )
  }

  if (detection.rightEye) {
    warpEyeRegion(
      ctx, imageData, detection.rightEye,
      detection.gazeDirection, targetGaze,
      strength, canvas.width, canvas.height,
    )
  }

  const correctedSrc = canvas.toDataURL('image/png')

  return {
    originalSrc: imageSrc,
    correctedSrc,
    detection,
    target,
  }
}

/**
 * Batch-process multiple sprites with eye contact correction.
 * Useful for correcting all emotion head variants consistently.
 */
export async function batchCorrectEyeContact(
  sprites: string[],
  target: GazeTarget,
  strength: number,
  onProgress?: (status: EyeCorrectionBatchStatus) => void,
): Promise<EyeCorrectedSprite[]> {
  const results: EyeCorrectedSprite[] = []
  let failed = 0

  for (let i = 0; i < sprites.length; i++) {
    try {
      const result = await correctEyeContact(sprites[i], target, strength)
      results.push(result)
    } catch {
      failed++
      results.push({
        originalSrc: sprites[i],
        correctedSrc: sprites[i],
        detection: { leftEye: null, rightEye: null, gazeDirection: { x: 0, y: 0 }, confidence: 0 },
        target,
      })
    }

    onProgress?.({
      total: sprites.length,
      processed: i + 1,
      failed,
      results: [...results],
      isProcessing: i < sprites.length - 1,
      error: null,
    })
  }

  return results
}

/**
 * Dispose the MediaPipe face landmarker instance to free resources.
 */
export function disposeEyeContactDetector(): void {
  if (faceLandmarkerInstance) {
    faceLandmarkerInstance.close()
    faceLandmarkerInstance = null
  }
}
