/**
 * Storyboard Renderer — generates visual scene thumbnails from a ClipPlan
 * for preview in the orchestrator's plan review phase.
 */

import type { ClipPlan } from '@/types/orchestrator'

// ── Types ──

export interface StoryboardScene {
  index: number
  /** Scene label (e.g. "Scene 1", "Intro") */
  label: string
  /** Time range as fraction 0-1 */
  startPercent: number
  endPercent: number
  /** Dialogue line for this scene (if any) */
  dialogue?: { characterName: string; script: string; emotion?: string }
  /** Characters visible in this time range */
  characters: Array<{ name: string; position: { x: number; y: number }; scale: number; dimension?: '2d' | '3d' }>
  /** Text overlays visible in this time range */
  textOverlays: Array<{ preset: string; content: string }>
  /** HTML templates active in this time range */
  htmlTemplates: Array<{ templateId: string; query?: string }>
  /** Stock media in this time range */
  stockMedia: Array<{ query: string; type: 'image' | 'video'; role: string }>
  /** SVG objects in this time range */
  svgObjects: Array<{ prompt: string }>
  /** Data URL of the rendered thumbnail */
  thumbnailUrl?: string
}

const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 320, height: 180 },
  '9:16': { width: 180, height: 320 },
  '1:1': { width: 240, height: 240 },
  '4:3': { width: 280, height: 210 },
  '21:9': { width: 360, height: 154 },
}

// ── Character color palette ──
const CHAR_COLORS = [
  '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#22c55e', '#f97316',
]

// ── Scene Extraction ──

/**
 * Parse a ClipPlan into discrete visual scenes.
 * Each dialogue line becomes its own scene. If there's no dialogue, create scenes
 * from time ranges covered by templates/media/text.
 */
export function extractScenes(plan: ClipPlan): StoryboardScene[] {
  const scenes: StoryboardScene[] = []

  if (plan.dialogue.length > 0) {
    // Dialogue-driven scenes: each line = one scene
    const lineDuration = 1 / plan.dialogue.length
    for (let i = 0; i < plan.dialogue.length; i++) {
      const startP = i * lineDuration
      const endP = (i + 1) * lineDuration
      const line = plan.dialogue[i]

      // Find characters visible in this range
      const charInScene = plan.characters.filter(
        (c) => c.name === line.characterName || plan.characters.length <= 2,
      )

      scenes.push({
        index: i,
        label: `Scene ${i + 1}`,
        startPercent: startP,
        endPercent: endP,
        dialogue: line,
        characters: charInScene,
        textOverlays: (plan.textOverlays || []).filter(
          (t) => t.startPercent < endP && t.endPercent > startP,
        ),
        htmlTemplates: (plan.htmlTemplates || []).filter(
          (t) => t.startPercent < endP && t.endPercent > startP,
        ),
        stockMedia: (plan.stockMedia || []).filter(
          (m) => m.startPercent < endP && m.endPercent > startP,
        ),
        svgObjects: (plan.svgObjects || []).filter(
          (o) => o.startPercent < endP && o.endPercent > startP,
        ),
      })
    }
  } else {
    // No dialogue — create a single overview scene
    scenes.push({
      index: 0,
      label: 'Overview',
      startPercent: 0,
      endPercent: 1,
      characters: plan.characters,
      textOverlays: plan.textOverlays || [],
      htmlTemplates: plan.htmlTemplates || [],
      stockMedia: plan.stockMedia || [],
      svgObjects: plan.svgObjects || [],
    })
  }

  return scenes
}

// ── Thumbnail Rendering ──

/**
 * Render a scene thumbnail on an offscreen canvas.
 * Returns a data URL (image/png).
 */
export function renderSceneThumbnail(
  scene: StoryboardScene,
  plan: ClipPlan,
): string {
  const dims = ASPECT_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_DIMENSIONS['16:9']
  const { width, height } = dims

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // ── Background ──
  if (plan.background.type === 'lottie') {
    // Gradient placeholder for Lottie background
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#16213e')
    ctx.fillStyle = grad
  } else {
    // SVG-generated background placeholder
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, '#0f3460')
    grad.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = grad
  }
  ctx.fillRect(0, 0, width, height)

  // ── Background label ──
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.font = '9px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const bgLabel = plan.background.type === 'lottie'
    ? `BG: ${plan.background.lottieQuery || 'auto'}`
    : `BG: ${(plan.background.svgPrompt || 'custom SVG').slice(0, 25)}`
  ctx.fillText(bgLabel, width / 2, 14)

  // ── Stock media indicators ──
  for (const media of scene.stockMedia) {
    const isBackground = media.role === 'background'
    if (isBackground) {
      // Draw a subtle media overlay indicator
      ctx.fillStyle = 'rgba(59,130,246,0.15)'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(59,130,246,0.6)'
      ctx.font = '8px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`[${media.type}: ${media.query}]`, width / 2, height - 8)
    } else {
      // Small indicator for non-bg media
      ctx.fillStyle = 'rgba(59,130,246,0.4)'
      ctx.font = '7px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${media.role}: ${media.query}`, 6, height - 22)
    }
  }

  // ── HTML Template indicator ──
  for (const tpl of scene.htmlTemplates) {
    ctx.strokeStyle = 'rgba(6,182,212,0.4)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.strokeRect(4, 4, width - 8, height - 8)
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(6,182,212,0.6)'
    ctx.font = '7px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`TPL: ${tpl.templateId || tpl.query || ''}`, 8, height - 8)
  }

  // ── Characters ──
  const charMap = new Map<string, number>()
  plan.characters.forEach((c, i) => charMap.set(c.name, i))

  for (const char of scene.characters) {
    const colorIdx = charMap.get(char.name) ?? 0
    const color = CHAR_COLORS[colorIdx % CHAR_COLORS.length]
    const cx = (char.position.x / 100) * width
    const cy = (char.position.y / 100) * height
    const radius = Math.max(12, 18 * char.scale)

    // Character circle
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fillStyle = color + '40'
    ctx.fill()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Character icon (simple person silhouette)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx, cy - radius * 0.2, radius * 0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, cy + radius * 0.2, radius * 0.3, radius * 0.35, 0, 0, Math.PI)
    ctx.fill()

    // Character name
    ctx.fillStyle = color
    ctx.font = 'bold 8px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(char.name, cx, cy + radius + 10)

    // 3D badge
    if (char.dimension === '3d') {
      ctx.fillStyle = '#8b5cf6'
      ctx.font = 'bold 6px system-ui, sans-serif'
      ctx.fillText('3D', cx + radius, cy - radius)
    }
  }

  // ── Dialogue ──
  if (scene.dialogue) {
    const charIdx = charMap.get(scene.dialogue.characterName) ?? 0
    const color = CHAR_COLORS[charIdx % CHAR_COLORS.length]

    // Speech bubble at bottom
    const bubbleY = height - 45
    const bubbleH = 34
    const bubbleW = width - 20
    const bubbleX = 10

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.beginPath()
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6)
    ctx.fill()

    ctx.strokeStyle = color + '60'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 6)
    ctx.stroke()

    // Character name
    ctx.fillStyle = color
    ctx.font = 'bold 8px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(scene.dialogue.characterName, bubbleX + 6, bubbleY + 11)

    // Emotion badge
    if (scene.dialogue.emotion) {
      const nameWidth = ctx.measureText(scene.dialogue.characterName).width
      ctx.fillStyle = '#8b5cf680'
      ctx.font = '6px system-ui, sans-serif'
      ctx.fillText(`[${scene.dialogue.emotion}]`, bubbleX + nameWidth + 10, bubbleY + 11)
    }

    // Script text (truncated)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '7px system-ui, sans-serif'
    const maxChars = Math.floor(bubbleW / 4)
    const scriptText = scene.dialogue.script.length > maxChars
      ? scene.dialogue.script.slice(0, maxChars) + '...'
      : scene.dialogue.script
    ctx.fillText(scriptText, bubbleX + 6, bubbleY + 24)
  }

  // ── Text Overlays ──
  for (const overlay of scene.textOverlays) {
    let ty: number
    switch (overlay.preset) {
      case 'title': ty = 30; break
      case 'subtitle': ty = 45; break
      case 'lower-third': ty = height - 55; break
      case 'cta': ty = height * 0.6; break
      case 'watermark': ty = 20; break
      default: ty = height / 2; break
    }

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = overlay.preset === 'title' ? 'bold 10px system-ui, sans-serif' : '8px system-ui, sans-serif'
    ctx.textAlign = 'center'
    const text = overlay.content.length > 30 ? overlay.content.slice(0, 30) + '...' : overlay.content
    ctx.fillText(text, width / 2, ty)
  }

  // ── SVG Object indicators ──
  for (const svg of scene.svgObjects) {
    ctx.fillStyle = 'rgba(249,115,22,0.5)'
    ctx.font = '7px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`[${svg.prompt}]`, width - 6, 26)
  }

  // ── Scene label + time ──
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.beginPath()
  ctx.roundRect(4, height - 16, 80, 14, 3)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '8px system-ui, sans-serif'
  ctx.textAlign = 'left'
  const timeLabel = `${scene.label} (${Math.round(scene.startPercent * plan.canvas.durationSeconds)}s-${Math.round(scene.endPercent * plan.canvas.durationSeconds)}s)`
  ctx.fillText(timeLabel, 8, height - 7)

  return canvas.toDataURL('image/png', 0.85)
}

// ── Batch Rendering ──

/**
 * Extract scenes from a ClipPlan and render all thumbnails.
 * Returns scenes with thumbnailUrl populated.
 */
export function generateStoryboard(plan: ClipPlan): StoryboardScene[] {
  const scenes = extractScenes(plan)
  for (const scene of scenes) {
    scene.thumbnailUrl = renderSceneThumbnail(scene, plan)
  }
  return scenes
}
