/**
 * Storyboard Generator — Creates visual scene breakdowns from a ClipPlan.
 *
 * Converts the flat dialogue list into a series of StoryboardScene objects
 * with visual descriptions, emotion detection, and SVG sketch thumbnails.
 */

import type { ClipPlan, StoryboardScene } from '@/types/orchestrator'
import { logger } from '@/utils/logger'

/**
 * Extract emotion from dialogue text [emotion] cues.
 */
function extractEmotion(script: string, explicitEmotion?: string): string {
  if (explicitEmotion) return explicitEmotion
  const match = script.match(/\[([^\]]+)\]/)
  return match ? match[1] : 'neutral'
}

/**
 * Clean dialogue text by removing [emotion] cues.
 */
function cleanDialogue(script: string): string {
  return script.replace(/\[.*?\]/g, '').trim()
}

/**
 * Generate a simple SVG sketch thumbnail for a scene.
 * Uses basic shapes to represent the scene layout.
 */
function generateSceneThumbnailSvg(
  scene: StoryboardScene,
  isVertical: boolean,
): string {
  const w = isVertical ? 135 : 240
  const h = isVertical ? 240 : 135

  // Background color based on emotion
  const emotionColors: Record<string, string> = {
    joy: '#fef3c7',
    anger: '#fecaca',
    sadness: '#dbeafe',
    fear: '#e0e7ff',
    surprise: '#fae8ff',
    disgust: '#d1fae5',
    neutral: '#f3f4f6',
  }

  const emotionLower = scene.emotion.toLowerCase()
  let bgColor = emotionColors.neutral
  for (const [key, color] of Object.entries(emotionColors)) {
    if (emotionLower.includes(key)) {
      bgColor = color
      break
    }
  }

  // Character stick figure position
  const charX = w * 0.5
  const charY = h * 0.55

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${bgColor}" rx="4"/>
    <!-- Character placeholder -->
    <circle cx="${charX}" cy="${charY - 18}" r="8" fill="#6b7280" opacity="0.6"/>
    <line x1="${charX}" y1="${charY - 10}" x2="${charX}" y2="${charY + 10}" stroke="#6b7280" stroke-width="2" opacity="0.6"/>
    <line x1="${charX - 8}" y1="${charY}" x2="${charX + 8}" y2="${charY}" stroke="#6b7280" stroke-width="2" opacity="0.6"/>
    <!-- Speech bubble -->
    <rect x="${charX - 25}" y="${charY - 38}" width="50" height="14" rx="7" fill="white" opacity="0.8"/>
    <text x="${charX}" y="${charY - 28}" text-anchor="middle" font-size="6" fill="#374151">💬</text>
    <!-- Emotion indicator -->
    <rect x="4" y="4" width="30" height="12" rx="6" fill="white" opacity="0.7"/>
    <text x="19" y="12" text-anchor="middle" font-size="6" fill="#6b7280">${scene.emotion.slice(0, 6)}</text>
  </svg>`
}

/**
 * Generate storyboard scenes from a ClipPlan.
 * Each dialogue line becomes a scene with visual metadata.
 */
export function generateStoryboardFromPlan(plan: ClipPlan): StoryboardScene[] {
  const scenes: StoryboardScene[] = []
  const isVertical = plan.canvas.aspectRatio === '9:16'

  const totalDuration = plan.canvas.durationSeconds
  const lineCount = plan.dialogue.length || 1
  const avgDuration = totalDuration / lineCount

  for (let i = 0; i < plan.dialogue.length; i++) {
    const line = plan.dialogue[i]
    const emotion = extractEmotion(line.script, line.emotion)
    const cleanText = cleanDialogue(line.script)

    // Build visual description from plan context
    const character = plan.characters.find((c) => c.name === line.characterName)
    const bgDesc = plan.background.type === 'lottie'
      ? `Animated background (${plan.background.lottieQuery || 'abstract'})`
      : plan.background.svgPrompt || 'Generated SVG scene'

    const visualParts: string[] = []
    if (character) {
      visualParts.push(`${character.name} at position (${character.position.x}%, ${character.position.y}%)`)
    }

    // Check for text overlays visible during this scene
    const sceneFraction = i / lineCount
    const overlays = plan.textOverlays.filter(
      (t) => t.startPercent <= sceneFraction + 1 / lineCount && t.endPercent >= sceneFraction,
    )
    if (overlays.length > 0) {
      visualParts.push(`Text: "${overlays[0].content.slice(0, 30)}"`)
    }

    // Check for stock media
    const media = plan.stockMedia?.filter(
      (m) => m.startPercent <= sceneFraction + 1 / lineCount && m.endPercent >= sceneFraction,
    )
    if (media && media.length > 0) {
      visualParts.push(`Media: ${media[0].query}`)
    }

    const scene: StoryboardScene = {
      dialogueIndex: i,
      characterName: line.characterName,
      dialogueText: cleanText,
      emotion,
      durationSeconds: +(avgDuration).toFixed(1),
      visualDescription: visualParts.join(' | ') || 'Character speaking',
      backgroundDescription: bgDesc,
    }

    scene.thumbnailSvg = generateSceneThumbnailSvg(scene, isVertical)
    scenes.push(scene)
  }

  logger.log(`[StoryboardGenerator] Generated ${scenes.length} storyboard scenes`)
  return scenes
}
