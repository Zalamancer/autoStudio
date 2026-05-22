/**
 * Auto-Align Character Parts After AI Generation
 *
 * Uses Gemini Vision landmarks + alpha bounding box analysis to compute
 * transform offsets that visually align generated character parts in the
 * 200x200 object-contain coordinate space used by CharacterLayer.
 *
 * The cascade system means we position:
 * - head relative to body
 * - eye/eyebrow/hair/viseme relative to head
 * All stored transforms are absolute in the 200px box space;
 * the cascade only propagates deltas during interactive drag.
 */

const BASE_CHARACTER_SIZE = 200

export interface CharacterLandmarks {
  /** Center of the face (normalized 0-1) */
  faceCenter: { x: number; y: number }
  /** Center of the mouth (normalized 0-1) */
  mouthCenter: { x: number; y: number }
  /** Midpoint between both eyes (normalized 0-1) */
  eyeCenter: { x: number; y: number }
  /** Center of the hairline / top of forehead (normalized 0-1) */
  hairlineCenter: { x: number; y: number }
  /** Top of the face/chin area — y normalized 0-1 */
  faceTop: number
  /** Bottom of face/chin — y normalized 0-1 */
  faceBottom: number
  /** Top of body (head top) — y normalized 0-1 */
  bodyTop: number
  /** Bottom of body (feet) — y normalized 0-1 */
  bodyBottom: number
}

export interface AlphaBounds {
  /** Top-left x (normalized 0-1) */
  x: number
  /** Top-left y (normalized 0-1) */
  y: number
  /** Width (normalized 0-1) */
  width: number
  /** Height (normalized 0-1) */
  height: number
  /** Center x of content (normalized 0-1) */
  centerX: number
  /** Center y of content (normalized 0-1) */
  centerY: number
  /** True if no opaque pixels found */
  isEmpty: boolean
}

export interface PartTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

const apiBase = import.meta.env.VITE_API_URL || ''

// ── Landmark Detection ────────────────────────────────────────────────

/**
 * Call the server endpoint to detect character landmarks using Gemini Vision.
 * Returns normalized (0-1) coordinates for key facial/body features.
 */
export async function detectCharacterLandmarks(
  conceptImageDataUrl: string,
): Promise<CharacterLandmarks> {
  const response = await fetch(`${apiBase}/api/auto-rig/character-landmarks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referenceImage: conceptImageDataUrl }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Landmark detection failed')
  }

  return response.json()
}

// ── Alpha Bounding Box ────────────────────────────────────────────────

/**
 * Compute the alpha bounding box of an image (tight crop of non-transparent pixels).
 * Returns normalized coordinates (0-1) relative to the image dimensions.
 */
export function computeAlphaBounds(imageDataUrl: string): Promise<AlphaBounds> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas unavailable'))
        return
      }

      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, img.width, img.height).data

      let minX = img.width
      let minY = img.height
      let maxX = 0
      let maxY = 0
      let found = false

      // Scan for non-transparent pixels (alpha > 10 to skip near-transparent fringes)
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const alpha = data[(y * img.width + x) * 4 + 3]
          if (alpha > 10) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
            if (y < minY) minY = y
            if (y > maxY) maxY = y
            found = true
          }
        }
      }

      if (!found) {
        resolve({
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          centerX: 0.5,
          centerY: 0.5,
          isEmpty: true,
        })
        return
      }

      const w = maxX - minX + 1
      const h = maxY - minY + 1
      resolve({
        x: minX / img.width,
        y: minY / img.height,
        width: w / img.width,
        height: h / img.height,
        centerX: (minX + w / 2) / img.width,
        centerY: (minY + h / 2) / img.height,
        isEmpty: false,
      })
    }
    img.onerror = () => reject(new Error('Failed to load image for alpha analysis'))
    img.src = imageDataUrl
  })
}

// ── Object-Contain Math ───────────────────────────────────────────────

/**
 * Compute the rendered dimensions of an image inside a box with object-contain.
 */
function computeObjectContain(imgW: number, imgH: number, boxSize: number = BASE_CHARACTER_SIZE) {
  const scale = Math.min(boxSize / imgW, boxSize / imgH)
  const rw = imgW * scale
  const rh = imgH * scale
  const ox = (boxSize - rw) / 2
  const oy = (boxSize - rh) / 2
  return { rw, rh, ox, oy, scale }
}

/**
 * Map a normalized (0-1) position to box coordinates given object-contain layout.
 */
function normalizedToBox(
  nx: number,
  ny: number,
  oc: ReturnType<typeof computeObjectContain>,
) {
  return {
    x: oc.ox + nx * oc.rw,
    y: oc.oy + ny * oc.rh,
  }
}

/**
 * Get the natural dimensions of an image from a data URL.
 */
function getImageSize(imageDataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

// ── Transform Computation ─────────────────────────────────────────────

/**
 * Compute part transforms to auto-align character parts based on landmarks
 * and alpha bounds. All values are in the 200px box coordinate space.
 *
 * The cascade system means:
 * - body stays at (0,0) — it's the anchor
 * - head is positioned relative to body
 * - eye/eyebrow/hair/viseme are positioned relative to head
 *
 * Since the store applies cascaded deltas only during interactive drag,
 * and the rendering uses absolute transforms, we need to account for
 * the head offset when computing face-part positions.
 */
export function computePartTransforms(
  landmarks: CharacterLandmarks,
  partBounds: Record<string, AlphaBounds>,
  bodyImgSize: { width: number; height: number },
  partImgSizes: Record<string, { width: number; height: number }>,
): Record<string, PartTransform> {
  const transforms: Record<string, PartTransform> = {}
  const bodyOC = computeObjectContain(bodyImgSize.width, bodyImgSize.height)

  // Face height ratio (used for scale estimates)
  const faceH = Math.max(0.05, landmarks.faceBottom - landmarks.faceTop)

  // ── Head ──
  const headBounds = partBounds['head']
  const headSize = partImgSizes['head']
  if (headBounds && !headBounds.isEmpty && headSize) {
    const headOC = computeObjectContain(headSize.width, headSize.height)

    // Target: face center on the concept, mapped to body's box space
    const target = normalizedToBox(landmarks.faceCenter.x, landmarks.faceCenter.y, bodyOC)
    // Current: head content center in its own box space
    const current = normalizedToBox(headBounds.centerX, headBounds.centerY, headOC)

    const dx = target.x - current.x
    const dy = target.y - current.y

    // Scale: make head content match expected face height
    const expectedH = faceH * bodyOC.rh
    const actualH = headBounds.height * headOC.rh
    let s = 1
    if (actualH > 5) {
      s = Math.max(0.2, Math.min(2.5, expectedH / actualH))
    }

    transforms['head'] = { x: Math.round(dx), y: Math.round(dy), scaleX: s, scaleY: s }
  }

  // For face parts (eye, eyebrow, viseme, hair), they need to align with
  // landmarks on the concept. Since the cascade applies head's delta to children
  // during drag, but rendering uses absolute positions, each face part's
  // transform is the absolute offset needed in the 200px box.
  const headTransform = transforms['head'] || { x: 0, y: 0, scaleX: 1, scaleY: 1 }

  // ── Viseme (mouth) ──
  const visemeBounds = partBounds['viseme']
  const visemeSize = partImgSizes['viseme']
  if (visemeBounds && !visemeBounds.isEmpty && visemeSize) {
    const visemeOC = computeObjectContain(visemeSize.width, visemeSize.height)
    const target = normalizedToBox(landmarks.mouthCenter.x, landmarks.mouthCenter.y, bodyOC)
    const current = normalizedToBox(visemeBounds.centerX, visemeBounds.centerY, visemeOC)

    const dx = target.x - current.x
    const dy = target.y - current.y

    // Scale: mouth is roughly 20-25% of face height
    const expectedH = faceH * 0.22 * bodyOC.rh
    const actualH = visemeBounds.height * visemeOC.rh
    let s = 1
    if (actualH > 3) {
      s = Math.max(0.15, Math.min(2.5, expectedH / actualH))
    }

    transforms['viseme'] = { x: Math.round(dx), y: Math.round(dy), scaleX: s, scaleY: s }
  }

  // ── Eye ──
  const eyeBounds = partBounds['eye']
  const eyeSize = partImgSizes['eye']
  if (eyeBounds && !eyeBounds.isEmpty && eyeSize) {
    const eyeOC = computeObjectContain(eyeSize.width, eyeSize.height)
    const target = normalizedToBox(landmarks.eyeCenter.x, landmarks.eyeCenter.y, bodyOC)
    const current = normalizedToBox(eyeBounds.centerX, eyeBounds.centerY, eyeOC)

    const dx = target.x - current.x
    const dy = target.y - current.y

    // Scale: eyes are roughly 15-20% of face height
    const expectedH = faceH * 0.18 * bodyOC.rh
    const actualH = eyeBounds.height * eyeOC.rh
    let s = 1
    if (actualH > 3) {
      s = Math.max(0.15, Math.min(2.5, expectedH / actualH))
    }

    transforms['eye'] = { x: Math.round(dx), y: Math.round(dy), scaleX: s, scaleY: s }
  }

  // ── Eyebrow ──
  const ebBounds = partBounds['eyebrow']
  const ebSize = partImgSizes['eyebrow']
  if (ebBounds && !ebBounds.isEmpty && ebSize) {
    const ebOC = computeObjectContain(ebSize.width, ebSize.height)
    // Eyebrows sit above eyes — offset eye center upward by ~8% of face height
    const eyebrowY = landmarks.eyeCenter.y - faceH * 0.08
    const target = normalizedToBox(landmarks.eyeCenter.x, eyebrowY, bodyOC)
    const current = normalizedToBox(ebBounds.centerX, ebBounds.centerY, ebOC)

    const dx = target.x - current.x
    const dy = target.y - current.y

    // Scale: eyebrows similar to eyes
    const expectedH = faceH * 0.12 * bodyOC.rh
    const actualH = ebBounds.height * ebOC.rh
    let s = 1
    if (actualH > 3) {
      s = Math.max(0.15, Math.min(2.5, expectedH / actualH))
    }

    transforms['eyebrow'] = { x: Math.round(dx), y: Math.round(dy), scaleX: s, scaleY: s }
  }

  // ── Hair ──
  const hairBounds = partBounds['hair']
  const hairSize = partImgSizes['hair']
  if (hairBounds && !hairBounds.isEmpty && hairSize) {
    const hairOC = computeObjectContain(hairSize.width, hairSize.height)
    const target = normalizedToBox(landmarks.hairlineCenter.x, landmarks.hairlineCenter.y, bodyOC)
    const current = normalizedToBox(hairBounds.centerX, hairBounds.centerY, hairOC)

    const dx = target.x - current.x
    const dy = target.y - current.y

    // Scale: hair should roughly cover the head area
    // Use head bounds width as reference if available, otherwise use face height
    let s = 1
    if (headBounds && !headBounds.isEmpty && headSize) {
      const headOC2 = computeObjectContain(headSize.width, headSize.height)
      const headContentW = headBounds.width * headOC2.rw * (headTransform.scaleX || 1)
      const hairContentW = hairBounds.width * hairOC.rw
      if (hairContentW > 3) {
        // Hair should be ~10-20% wider than the head
        s = Math.max(0.2, Math.min(2.5, (headContentW * 1.15) / hairContentW))
      }
    }

    transforms['hair'] = { x: Math.round(dx), y: Math.round(dy), scaleX: s, scaleY: s }
  }

  return transforms
}

// ── High-Level Orchestrator ───────────────────────────────────────────

/**
 * Auto-align character parts after AI generation.
 *
 * Takes the concept image and all generated part images, detects landmarks,
 * computes alpha bounds, and returns transforms ready to apply to the parts store.
 *
 * Non-fatal: returns empty record on any error (graceful degradation to defaults).
 *
 * @param conceptImage - The full-character concept image data URL
 * @param parts - Map of part type to image data URL (null = not generated)
 * @returns Map of part type to computed transform, or empty on failure
 */
export async function autoAlignCharacterParts(
  conceptImage: string,
  parts: Record<string, string | null>,
): Promise<Record<string, PartTransform>> {
  try {
    // Step 1: Detect landmarks on concept via Gemini Vision
    const landmarks = await detectCharacterLandmarks(conceptImage)

    // Step 2: Compute alpha bounds and image sizes for each part
    const partBounds: Record<string, AlphaBounds> = {}
    const partSizes: Record<string, { width: number; height: number }> = {}

    const analysisPromises = Object.entries(parts)
      .filter(([, img]) => img !== null)
      .map(async ([key, img]) => {
        try {
          const [bounds, size] = await Promise.all([
            computeAlphaBounds(img!),
            getImageSize(img!),
          ])
          partBounds[key] = bounds
          partSizes[key] = size
        } catch {
          // Skip parts that fail analysis
        }
      })
    await Promise.all(analysisPromises)

    // Step 3: Get concept image size for reference
    const conceptSize = await getImageSize(conceptImage)

    // Step 4: Compute transforms
    return computePartTransforms(landmarks, partBounds, conceptSize, partSizes)
  } catch (err) {
    console.warn('[spriteAutoAlign] Auto-alignment failed, using defaults:', err)
    return {}
  }
}
