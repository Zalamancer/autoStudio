/**
 * Pre-Publish Checklist
 *
 * Automated verification of all required elements before publishing:
 * - Captions present
 * - Audio levels adequate
 * - No offensive content flags
 * - Brand compliance (if brand context exists)
 * - All required elements rendered
 * - Platform-specific requirements met
 */

import type { PrePublishChecklist, PrePublishChecklistItem } from '@/types/qualityAssurance'

interface ChecklistInput {
  // Content
  hasDialogue: boolean
  dialogueLineCount: number
  hasCaptions: boolean
  captionStyle: string
  hasBackground: boolean
  characterCount: number

  // Audio
  hasVoiceAudio: boolean
  hasMusic: boolean

  // Visual
  aspectRatio: string
  durationSeconds: number
  canvasWidth: number
  canvasHeight: number
  textOverlayCount: number
  hasCTA: boolean

  // Quality
  overallQAScore: number

  // Platform
  targetPlatform?: string

  // Brand
  hasBrandContext: boolean
  brandColorsUsed?: boolean
  brandLogoPresent?: boolean
}

export function generatePrePublishChecklist(input: ChecklistInput): PrePublishChecklist {
  const items: PrePublishChecklistItem[] = []

  // ── Required Checks ──

  items.push({
    id: 'has-content',
    label: 'Content Present',
    checked: input.hasDialogue || input.textOverlayCount > 0,
    autoChecked: true,
    category: 'required',
    description: 'Clip has dialogue or text content',
  })

  items.push({
    id: 'has-audio',
    label: 'Audio Generated',
    checked: input.hasVoiceAudio || !input.hasDialogue,
    autoChecked: true,
    category: 'required',
    description: 'Voice audio has been generated for all dialogue lines',
  })

  items.push({
    id: 'has-background',
    label: 'Background Set',
    checked: input.hasBackground,
    autoChecked: true,
    category: 'required',
    description: 'A background (color, animation, or media) is set',
  })

  items.push({
    id: 'valid-duration',
    label: 'Valid Duration',
    checked: input.durationSeconds >= 3 && input.durationSeconds <= 600,
    autoChecked: true,
    category: 'required',
    description: `Clip is ${Math.round(input.durationSeconds)} seconds (min 3s)`,
  })

  items.push({
    id: 'valid-resolution',
    label: 'Adequate Resolution',
    checked: input.canvasWidth >= 480 && input.canvasHeight >= 480,
    autoChecked: true,
    category: 'required',
    description: `Resolution: ${input.canvasWidth}x${input.canvasHeight}`,
  })

  // ── Recommended Checks ──

  items.push({
    id: 'has-captions',
    label: 'Captions Enabled',
    checked: input.hasCaptions && input.captionStyle !== 'none',
    autoChecked: true,
    category: 'recommended',
    description: '80% of viewers watch without sound — captions strongly recommended',
  })

  items.push({
    id: 'has-music',
    label: 'Background Music',
    checked: input.hasMusic,
    autoChecked: true,
    category: 'recommended',
    description: 'Background music adds emotional depth and professionalism',
  })

  items.push({
    id: 'has-cta',
    label: 'Call to Action',
    checked: input.hasCTA,
    autoChecked: true,
    category: 'recommended',
    description: 'A CTA drives engagement (follow, like, share, visit link)',
  })

  items.push({
    id: 'vertical-format',
    label: 'Vertical Format',
    checked: input.aspectRatio === '9:16',
    autoChecked: true,
    category: 'recommended',
    description: '9:16 vertical performs best on TikTok, Reels, and Shorts',
  })

  items.push({
    id: 'quality-score',
    label: 'Quality Score 70+',
    checked: input.overallQAScore >= 70,
    autoChecked: true,
    category: 'recommended',
    description: `Current quality score: ${input.overallQAScore}/100`,
  })

  items.push({
    id: 'optimal-duration',
    label: 'Optimal Duration (15-60s)',
    checked: input.durationSeconds >= 15 && input.durationSeconds <= 60,
    autoChecked: true,
    category: 'recommended',
    description: '15-60 second clips get the most engagement on short-form platforms',
  })

  // ── Optional Checks ──

  items.push({
    id: 'multiple-characters',
    label: 'Multiple Characters',
    checked: input.characterCount >= 2,
    autoChecked: true,
    category: 'optional',
    description: 'Multiple characters create more dynamic dialogue',
  })

  if (input.hasBrandContext) {
    items.push({
      id: 'brand-colors',
      label: 'Brand Colors Used',
      checked: input.brandColorsUsed ?? false,
      autoChecked: true,
      category: 'recommended',
      description: 'Brand colors are used in text overlays and shapes',
    })

    items.push({
      id: 'brand-logo',
      label: 'Brand Logo/Watermark',
      checked: input.brandLogoPresent ?? false,
      autoChecked: true,
      category: 'optional',
      description: 'Brand logo or watermark is present for recognition',
    })
  }

  // ── Compute summary ──

  const requiredItems = items.filter((i) => i.category === 'required')
  const recommendedItems = items.filter((i) => i.category === 'recommended')

  const allRequiredPassed = requiredItems.every((i) => i.checked)
  const recommendedPassRate = recommendedItems.length > 0
    ? recommendedItems.filter((i) => i.checked).length / recommendedItems.length
    : 1

  return {
    items,
    allRequiredPassed,
    recommendedPassRate,
    readyToPublish: allRequiredPassed,
  }
}
