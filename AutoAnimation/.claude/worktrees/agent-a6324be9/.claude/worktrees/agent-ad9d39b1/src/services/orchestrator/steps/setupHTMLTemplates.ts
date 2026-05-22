/**
 * Step Executor: Setup HTML Templates + findBuiltinTemplate
 */

import type { ClipPlan } from '@/types/orchestrator'
import { BUILTIN_TEMPLATES, getTemplateContent } from '@/data/builtinTemplates'
import { parseTemplateConfig } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { snapFrameToBeat } from '@/services/musicAnalyzer'
import { logger } from '@/utils/logger'
import { ASPECT_RATIO_DIMENSIONS, type ExecutionContext } from '../constants'

/**
 * Theme keywords mapped to template category/tag preferences.
 * Used for context-aware scoring when the query alone doesn't match well.
 */
const THEME_TAG_AFFINITY: Record<string, string[]> = {
  business: ['corporate', 'business', 'professional', 'presentation', 'report'],
  education: ['educational', 'learning', 'tutorial', 'infographic', 'chart'],
  science: ['data', 'chart', 'infographic', 'terminal', 'code', 'tech'],
  entertainment: ['social', 'viral', 'gaming', 'fun', 'collage', 'kinetic'],
  news: ['news', 'breaking', 'headline', 'ticker', 'lower-third'],
  travel: ['map', 'globe', 'world', 'travel', 'location'],
  cooking: ['recipe', 'food', 'cooking', 'ingredients'],
  fitness: ['sport', 'fitness', 'health', 'timer', 'countdown'],
  finance: ['chart', 'stock', 'finance', 'bar', 'line', 'data'],
  product: ['product', 'showcase', 'ecommerce', 'price', 'feature'],
}

/**
 * Find a built-in template by ID, or fuzzy-match by query against title, tags, and
 * content theme context for smarter selection.
 */
function findBuiltinTemplate(
  templateId?: string,
  query?: string,
  context?: { theme?: string; aspectRatio?: string },
): typeof BUILTIN_TEMPLATES[number] | null {
  // Exact ID match first
  if (templateId) {
    const exact = BUILTIN_TEMPLATES.find((t) => t.id === templateId)
    if (exact) return exact
  }

  // Fuzzy match by query against title and tags
  const searchTerm = query || templateId || ''
  if (!searchTerm && !context?.theme) return null

  const lower = (searchTerm || '').toLowerCase()
  const words = lower ? lower.split(/\s+/) : []

  // Get theme affinity tags for bonus scoring
  const themeWords = context?.theme
    ? (THEME_TAG_AFFINITY[context.theme.toLowerCase()] || [])
    : []

  // Score each template
  let bestMatch: typeof BUILTIN_TEMPLATES[number] | null = null
  let bestScore = 0

  for (const tpl of BUILTIN_TEMPLATES) {
    let score = 0
    const titleLower = tpl.title.toLowerCase()
    const tagsLower = tpl.tags.map((t) => t.toLowerCase())
    const descLower = tpl.description.toLowerCase()

    // Query-based scoring
    for (const word of words) {
      if (titleLower.includes(word)) score += 3
      if (tagsLower.some((tag) => tag.includes(word))) score += 2
      if (descLower.includes(word)) score += 1
    }

    // Theme affinity bonus
    for (const themeWord of themeWords) {
      if (tagsLower.some((tag) => tag.includes(themeWord))) score += 1.5
      if (titleLower.includes(themeWord)) score += 1
    }

    // Aspect ratio preference bonus (templates that mention the target format)
    if (context?.aspectRatio) {
      const isVertical = context.aspectRatio === '9:16'
      if (isVertical && tagsLower.some(t => t.includes('mobile') || t.includes('vertical') || t.includes('tiktok'))) {
        score += 1
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = tpl
    }
  }

  return bestScore > 0 ? bestMatch : null
}

export async function executeSetupHTMLTemplates(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.htmlTemplates || plan.htmlTemplates.length === 0) return

  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9']

  for (let i = 0; i < plan.htmlTemplates.length; i++) {
    const tplSpec = plan.htmlTemplates[i]

    try {
      // Resolve the template from the library with context-aware scoring
      const builtinTpl = findBuiltinTemplate(tplSpec.templateId, tplSpec.query, {
        aspectRatio: plan.canvas.aspectRatio,
      })
      if (!builtinTpl) {
        logger.warn(
          `[Orchestrator:html-templates] Template "${tplSpec.templateId || tplSpec.query}" not found, skipping`,
        )
        continue
      }

      // Load the raw HTML content
      const rawHtml = getTemplateContent(builtinTpl.filename)
      if (!rawHtml) {
        logger.warn(
          `[Orchestrator:html-templates] File not found: ${builtinTpl.filename}, skipping`,
        )
        continue
      }

      // Parse editable config from the template
      const customConfig = parseTemplateConfig(rawHtml)

      // Apply config overrides from the plan — update existing AND add new keys
      if (tplSpec.config) {
        for (const [key, planValue] of Object.entries(tplSpec.config)) {
          const existing = customConfig.find((p) => p.key === key)
          if (existing) {
            existing.value = planValue
          } else {
            // New property from plan that wasn't in the template's CONFIG — add it
            // so it gets sent via CONFIG_BULK_UPDATE to the iframe
            const valType = Array.isArray(planValue)
              ? (planValue.length > 0 && typeof planValue[0] === 'object' ? 'object-array' : 'text-array')
              : typeof planValue === 'number' ? 'number'
              : typeof planValue === 'boolean' ? 'boolean' : 'text'
            customConfig.push({
              key,
              label: key,
              type: valType,
              value: planValue,
              group: 'Data',
            })
          }
        }
      }

      // For frame-synced templates (e.g. leetcode-explainer), inject timing
      // data derived from the dialogue timeline so the template's animation
      // phases (card, typing, complexity) align with the narration.
      const isFrameSynced = builtinTpl.id === 'tpl-leetcode-explainer'
        || builtinTpl.id === 'tpl-world-map'
        || builtinTpl.id === 'tpl-maptiler-map'
        || builtinTpl.id === 'tpl-maptiler-globe'
        || builtinTpl.id === 'tpl-spy-satellite'

      if (isFrameSynced) {
        const dialogueLines = useMultiCharacterStore.getState().dialogueLines

        if (dialogueLines.length > 0) {
          // Sort by order to ensure correct sequencing
          const sorted = [...dialogueLines].sort((a, b) => a.order - b.order)

          let timingOverrides: Record<string, number> = {}

          if (builtinTpl.id === 'tpl-world-map'
            || builtinTpl.id === 'tpl-maptiler-map'
            || builtinTpl.id === 'tpl-maptiler-globe'
            || builtinTpl.id === 'tpl-spy-satellite') {
            // Map templates: inject frameSyncEnabled so the template knows it's frame-synced
            // The commands come from the plan's config.commands if present
            // and are applied via CONFIG_BULK_UPDATE.
            timingOverrides = {
              frameSyncEnabled: 1,
            }
          } else {
            // LeetCode explainer timing
            const firstLine = sorted[0]
            const cardStartFrame = firstLine.startFrame
            const cardEndFrame = firstLine.endFrame

            const typingStartFrame =
              sorted.length > 1
                ? sorted[1].startFrame
                : cardEndFrame + Math.round(ctx.fps * 0.5)

            const typingEndFrame =
              sorted.length > 2
                ? sorted[sorted.length - 2].endFrame
                : sorted[sorted.length - 1].endFrame - Math.round(ctx.fps * 2)

            const complexityStartFrame =
              sorted.length > 2
                ? sorted[sorted.length - 1].startFrame
                : typingEndFrame + Math.round(ctx.fps * 1)

            timingOverrides = {
              cardStartFrame,
              cardEndFrame,
              typingStartFrame,
              typingEndFrame,
              complexityStartFrame,
            }
          }

          for (const [key, val] of Object.entries(timingOverrides)) {
            const existing = customConfig.find((p) => p.key === key)
            if (existing) {
              existing.value = val
            } else {
              customConfig.push({
                key,
                label: key,
                type: 'number',
                value: val,
                group: 'Animation',
              })
            }
          }

        }
      }

      // Inject the postMessage bridge for live updates
      const bridgedHtml = injectMessageBridge(rawHtml)

      // Calculate frame range, snapping to beats when available
      let startFrame = Math.round((tplSpec.startPercent ?? 0) * ctx.totalFrames)
      let endFrame = Math.round((tplSpec.endPercent ?? 1) * ctx.totalFrames)

      if (ctx.beatTimestamps && ctx.beatTimestamps.length > 0) {
        startFrame = snapFrameToBeat(startFrame, ctx.fps, ctx.beatTimestamps, 0.2)
        endFrame = snapFrameToBeat(endFrame, ctx.fps, ctx.beatTimestamps, 0.2)
        // Ensure endFrame > startFrame after snapping
        if (endFrame <= startFrame) endFrame = startFrame + Math.round(ctx.fps)
      }

      // Add to the HTML template layer store
      const templateId = `orch-tpl-${Date.now()}-${i}`
      useHTMLTemplateLayerStore.getState().addTemplate({
        id: templateId,
        htmlContent: bridgedHtml,
        name: builtinTpl.title,
        position: tplSpec.position || { x: 0, y: 0 },
        scale: tplSpec.scale || 1,
        opacity: 1,
        zIndex: 1, // Behind characters
        rotation: 0,
        visible: true,
        width: dims.w,
        height: dims.h,
        startFrame,
        endFrame,
        customConfig,
        frameSync: isFrameSynced,
        templateAspectRatio: tplSpec.templateAspectRatio,
      })

    } catch (err) {
      logger.error(`[Orchestrator:html-templates] Failed to add template ${i + 1}:`, err)
    }
  }
}
