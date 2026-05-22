/**
 * Visual Quality Scorer
 *
 * Analyzes rendered composition for visual quality issues:
 * - Element overlap detection
 * - Text readability (contrast, size, safe zones)
 * - Visual balance and composition
 * - Empty space ratio
 * - Color contrast (WCAG-based)
 */

import type {
  QACheckResult,
  VisualQualityInput,
  CanvasElementBounds,
} from '@/types/qualityAssurance'

// ── Overlap Detection ──

function computeOverlap(a: CanvasElementBounds, b: CanvasElementBounds): number {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  const overlapArea = overlapX * overlapY
  const smallerArea = Math.min(a.width * a.height, b.width * b.height)
  if (smallerArea === 0) return 0
  return overlapArea / smallerArea
}

function checkElementOverlap(input: VisualQualityInput): QACheckResult {
  const { elements } = input
  const overlaps: { a: string; b: string; percentage: number }[] = []

  // Check text-on-text and text-on-important-element overlaps
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i]
      const b = elements[j]

      // Skip if they don't share any visible frames
      if (a.endFrame < b.startFrame || b.endFrame < a.startFrame) continue

      // Skip transparent elements
      if (a.opacity < 0.1 || b.opacity < 0.1) continue

      const overlap = computeOverlap(a, b)
      if (overlap > 0.3) {
        // Only care about significant overlaps involving text
        const involvesText = a.type === 'text' || b.type === 'text' || a.type === 'caption' || b.type === 'caption'
        if (involvesText || overlap > 0.6) {
          overlaps.push({ a: a.id, b: b.id, percentage: overlap })
        }
      }
    }
  }

  const worstOverlap = overlaps.length > 0 ? Math.max(...overlaps.map((o) => o.percentage)) : 0
  const score = overlaps.length === 0 ? 100 : Math.max(0, 100 - overlaps.length * 15 - worstOverlap * 30)

  return {
    id: 'visual-overlap',
    name: 'Element Overlap',
    category: 'visual',
    status: overlaps.length === 0 ? 'pass' : worstOverlap > 0.6 ? 'fail' : 'warning',
    severity: worstOverlap > 0.6 ? 'critical' : 'warning',
    score: Math.round(score),
    description: overlaps.length === 0
      ? 'No significant element overlaps detected'
      : `${overlaps.length} overlapping element pair(s) found`,
    suggestion: overlaps.length > 0
      ? 'Reposition overlapping elements to improve readability'
      : undefined,
    autoFixable: false,
    metadata: { overlaps },
  }
}

// ── Text Readability ──

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!match) return null
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) }
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  )
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function checkTextReadability(input: VisualQualityInput): QACheckResult {
  const { textOverlays, backgroundColor } = input
  if (textOverlays.length === 0) {
    return {
      id: 'visual-text-readability',
      name: 'Text Readability',
      category: 'visual',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'No text overlays to check',
      autoFixable: false,
    }
  }

  const issues: { id: string; contrast: number; fontSize: number }[] = []
  const bgColor = parseHexColor(backgroundColor)
  const bgLum = bgColor ? relativeLuminance(bgColor.r, bgColor.g, bgColor.b) : 0

  for (const overlay of textOverlays) {
    const textColor = parseHexColor(overlay.color)
    if (!textColor) continue

    // Check against background or overlay's own background
    const checkBg = overlay.backgroundColor ? parseHexColor(overlay.backgroundColor) : null
    const effectiveBgLum = checkBg
      ? relativeLuminance(checkBg.r, checkBg.g, checkBg.b)
      : bgLum

    const textLum = relativeLuminance(textColor.r, textColor.g, textColor.b)
    const ratio = contrastRatio(textLum, effectiveBgLum)

    // WCAG AA: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
    const isLargeText = overlay.fontSize >= 18
    const minRatio = isLargeText ? 3 : 4.5

    if (ratio < minRatio) {
      issues.push({ id: overlay.id, contrast: ratio, fontSize: overlay.fontSize })
    }
  }

  // Check minimum font sizes
  const tooSmall = textOverlays.filter((t) => t.fontSize < 12)

  const totalIssues = issues.length + tooSmall.length
  const score = Math.max(0, 100 - totalIssues * 20)

  return {
    id: 'visual-text-readability',
    name: 'Text Readability',
    category: 'visual',
    status: totalIssues === 0 ? 'pass' : totalIssues > 2 ? 'fail' : 'warning',
    severity: totalIssues > 2 ? 'critical' : 'warning',
    score: Math.round(score),
    description: totalIssues === 0
      ? 'All text meets readability standards'
      : `${issues.length} low-contrast text(s), ${tooSmall.length} too-small text(s)`,
    suggestion: totalIssues > 0
      ? 'Increase text contrast or add text backgrounds for better readability'
      : undefined,
    autoFixable: issues.length > 0,
    autoFixAction: 'add-text-background',
    metadata: { contrastIssues: issues, tooSmallTexts: tooSmall.map((t) => t.id) },
  }
}

// ── Visual Balance ──

function checkVisualBalance(input: VisualQualityInput): QACheckResult {
  const { elements, canvasWidth, canvasHeight } = input
  if (elements.length === 0) {
    return {
      id: 'visual-balance',
      name: 'Visual Balance',
      category: 'visual',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'No elements to check balance',
      autoFixable: false,
    }
  }

  // Compute center of mass of all visible elements
  const cx = canvasWidth / 2
  const cy = canvasHeight / 2
  let totalWeight = 0
  let weightedX = 0
  let weightedY = 0

  for (const el of elements) {
    const area = el.width * el.height
    const elCx = el.x + el.width / 2
    const elCy = el.y + el.height / 2
    const weight = area * el.opacity
    weightedX += elCx * weight
    weightedY += elCy * weight
    totalWeight += weight
  }

  if (totalWeight === 0) {
    return {
      id: 'visual-balance',
      name: 'Visual Balance',
      category: 'visual',
      status: 'pass',
      severity: 'info',
      score: 100,
      description: 'Visual balance is adequate',
      autoFixable: false,
    }
  }

  const comX = weightedX / totalWeight
  const comY = weightedY / totalWeight

  // How far from center (normalized 0-1)
  const offsetX = Math.abs(comX - cx) / cx
  const offsetY = Math.abs(comY - cy) / cy
  const totalOffset = Math.sqrt(offsetX * offsetX + offsetY * offsetY)

  // Score: centered = 100, edge = 0
  // Allow some offset (0.3 is normal for rule-of-thirds compositions)
  const score = totalOffset < 0.3 ? 100 : Math.max(0, 100 - (totalOffset - 0.3) * 140)

  return {
    id: 'visual-balance',
    name: 'Visual Balance',
    category: 'visual',
    status: score >= 60 ? 'pass' : score >= 40 ? 'warning' : 'fail',
    severity: score < 40 ? 'warning' : 'info',
    score: Math.round(score),
    description: score >= 60
      ? 'Elements are well-balanced on canvas'
      : 'Elements are clustered to one side — consider rebalancing',
    suggestion: score < 60
      ? 'Distribute elements more evenly across the canvas'
      : undefined,
    autoFixable: false,
    metadata: { centerOfMass: { x: comX, y: comY }, offset: totalOffset },
  }
}

// ── Empty Space Ratio ──

function checkEmptySpace(input: VisualQualityInput): QACheckResult {
  const { elements, canvasWidth, canvasHeight } = input
  const canvasArea = canvasWidth * canvasHeight
  if (canvasArea === 0) {
    return {
      id: 'visual-empty-space',
      name: 'Empty Space',
      category: 'visual',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'Cannot compute empty space',
      autoFixable: false,
    }
  }

  // Approximate coverage (not accounting for overlaps precisely)
  let coveredArea = 0
  for (const el of elements) {
    coveredArea += el.width * el.height * el.opacity
  }

  const coverageRatio = Math.min(1, coveredArea / canvasArea)
  const emptyRatio = 1 - coverageRatio

  // Optimal: 30-70% coverage (not too empty, not too cluttered)
  let score: number
  if (coverageRatio >= 0.3 && coverageRatio <= 0.7) {
    score = 100
  } else if (coverageRatio < 0.15) {
    score = 40 // too empty
  } else if (coverageRatio > 0.85) {
    score = 50 // too cluttered
  } else {
    score = 75
  }

  const status = coverageRatio < 0.15 ? 'warning' : coverageRatio > 0.85 ? 'warning' : 'pass'

  return {
    id: 'visual-empty-space',
    name: 'Canvas Coverage',
    category: 'visual',
    status,
    severity: 'info',
    score,
    description: `${Math.round(coverageRatio * 100)}% canvas coverage (${Math.round(emptyRatio * 100)}% empty)`,
    suggestion: coverageRatio < 0.15
      ? 'Add more visual elements — the canvas feels too empty'
      : coverageRatio > 0.85
        ? 'Reduce visual clutter — too many overlapping elements'
        : undefined,
    autoFixable: false,
    metadata: { coverageRatio, emptyRatio },
  }
}

// ── Caption Safety ──

function checkCaptionSafety(input: VisualQualityInput): QACheckResult {
  if (!input.hasCaptions) {
    return {
      id: 'visual-caption-safety',
      name: 'Caption Placement',
      category: 'visual',
      status: 'skipped',
      severity: 'info',
      score: 100,
      description: 'Captions not enabled',
      autoFixable: false,
    }
  }

  // Captions typically appear in the bottom third
  const bottomThird = input.canvasHeight * 0.67

  // Check if any non-caption elements overlap the caption zone
  const captionZoneElements = input.elements.filter(
    (e) => e.type !== 'caption' && e.y + e.height > bottomThird && e.opacity > 0.3,
  )

  const score = captionZoneElements.length === 0 ? 100 : Math.max(0, 100 - captionZoneElements.length * 25)

  return {
    id: 'visual-caption-safety',
    name: 'Caption Placement',
    category: 'visual',
    status: captionZoneElements.length === 0 ? 'pass' : 'warning',
    severity: captionZoneElements.length > 2 ? 'warning' : 'info',
    score: Math.round(score),
    description: captionZoneElements.length === 0
      ? 'Caption zone is clear'
      : `${captionZoneElements.length} element(s) may overlap captions`,
    suggestion: captionZoneElements.length > 0
      ? 'Move elements away from the bottom caption zone'
      : undefined,
    autoFixable: false,
    metadata: { captionZoneElementIds: captionZoneElements.map((e) => e.id) },
  }
}

// ── Main Visual Quality Scorer ──

export function scoreVisualQuality(input: VisualQualityInput): QACheckResult[] {
  return [
    checkElementOverlap(input),
    checkTextReadability(input),
    checkVisualBalance(input),
    checkEmptySpace(input),
    checkCaptionSafety(input),
  ]
}
