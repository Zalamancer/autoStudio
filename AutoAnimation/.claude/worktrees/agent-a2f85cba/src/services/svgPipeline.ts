/**
 * SVG Pipeline — Unified Vector Graphics API
 *
 * Single entry point for all SVG generation capabilities. The orchestrator
 * and UI components call into this pipeline rather than individual services.
 *
 * Capabilities:
 * 1. Scene backgrounds — full illustrated scenes (AI or procedural)
 * 2. Infographics — data visualization from structured data
 * 3. Text effects — gradient, outline, path, glow, glitch text
 * 4. Decorative elements — borders, dividers, badges, particles
 * 5. Icon systems — consistent icon sets (AI or built-in)
 * 6. Animation library — pre-built SVG+CSS animations
 * 7. Single objects — individual icons/symbols (existing behavior)
 */

import type { SVGObjectDefinition, SVGObjectKeyframe } from '@/types/svgObjects'

// Re-export sub-modules for direct access
export { generateSVGScene, generateStarfield, generateGradientBackground, generateMountainscape } from './svgSceneGenerator'
export type { SVGSceneRequest, SVGSceneStyle, SVGSceneResult } from './svgSceneGenerator'

export { generateInfographic } from './svgInfographicGenerator'
export type { ChartType, DataPoint, InfographicRequest, InfographicResult } from './svgInfographicGenerator'

export { generateTextEffect } from './svgTextEffects'
export type { TextEffectType, TextEffectRequest, TextEffectResult } from './svgTextEffects'

export { generateDecorative } from './svgDecorativeElements'
export type { DecorativeType, DecorativeRequest, DecorativeResult } from './svgDecorativeElements'

export { generateIconSet, getBuiltinIcon, listBuiltinIcons, BUILTIN_ICONS } from './svgIconSystem'
export type { IconStyle, IconSetRequest, IconSetResult } from './svgIconSystem'

export { searchAnimations, getAnimationsByCategory, getAnimationById, getAnimationCategories, SVG_ANIMATION_LIBRARY } from './svgAnimationLibrary'
export type { SVGAnimationEntry, SVGAnimationCategory } from './svgAnimationLibrary'

// ── Orchestrator integration types ──

/**
 * Extended SVG object spec for the orchestrator ClipPlan.
 * Adds a `generationType` field so the orchestrator can request
 * different kinds of SVG content beyond simple icons.
 */
export type SVGGenerationType =
  | 'icon'           // Single icon/symbol (existing behavior)
  | 'scene'          // Full scene background
  | 'infographic'    // Data visualization
  | 'text-effect'    // Text with special effects
  | 'decorative'     // Borders, dividers, badges, particles
  | 'icon-set'       // Consistent set of icons
  | 'library-anim'   // Pre-built animation from library

export interface SVGPipelineRequest {
  type: SVGGenerationType
  prompt: string
  width?: number
  height?: number
  startPercent?: number
  endPercent?: number
  /** Keyframe overrides */
  keyframes?: SVGObjectKeyframe[]

  // Type-specific options
  /** For 'scene': visual style */
  sceneStyle?: string
  /** For 'scene': time of day */
  timeOfDay?: string
  /** For 'scene': animate layers */
  animated?: boolean
  /** For 'infographic': chart type */
  chartType?: string
  /** For 'infographic': data points */
  chartData?: { label: string; value: number }[]
  /** For 'infographic': unit suffix */
  chartUnit?: string
  /** For 'text-effect': effect type */
  textEffect?: string
  /** For 'text-effect': display text */
  displayText?: string
  /** For 'decorative': decorative type */
  decorativeType?: string
  /** For 'decorative': label for badges */
  decorativeLabel?: string
  /** For 'icon-set': list of icon names */
  iconNames?: string[]
  /** For 'icon-set': icon style */
  iconStyle?: string
  /** For 'library-anim': animation ID */
  animationId?: string
  /** Color palette */
  colors?: string[]
}

/**
 * Execute an SVG pipeline request and return the generated objects.
 * This is the main entry point for the orchestrator.
 */
export async function executeSVGPipeline(
  request: SVGPipelineRequest,
): Promise<SVGObjectDefinition[]> {
  const { type, width = 800, height = 600 } = request

  switch (type) {
    case 'scene': {
      const { generateSVGScene: gen } = await import('./svgSceneGenerator')
      const result = await gen({
        prompt: request.prompt,
        width,
        height,
        style: (request.sceneStyle as import('./svgSceneGenerator').SVGSceneStyle) || undefined,
        timeOfDay: (request.timeOfDay as 'day' | 'night' | 'sunset' | 'dawn') || undefined,
        animated: request.animated ?? true,
        palette: request.colors,
      })
      return result.objects
    }

    case 'infographic': {
      const { generateInfographic: gen } = await import('./svgInfographicGenerator')
      const result = gen({
        type: (request.chartType as import('./svgInfographicGenerator').ChartType) || 'bar',
        title: request.prompt,
        data: (request.chartData || []).map((d, i) => ({
          label: d.label,
          value: d.value,
          color: request.colors?.[i % (request.colors?.length || 1)],
        })),
        width,
        height,
        unit: request.chartUnit,
        showValues: true,
        animateEntrance: true,
        palette: request.colors,
      })
      return result.objects
    }

    case 'text-effect': {
      const { generateTextEffect: gen } = await import('./svgTextEffects')
      const result = gen({
        text: request.displayText || request.prompt,
        effect: (request.textEffect as import('./svgTextEffects').TextEffectType) || 'gradient',
        width,
        height,
        colors: request.colors,
        animated: request.animated ?? true,
      })
      return result.objects
    }

    case 'decorative': {
      const { generateDecorative: gen } = await import('./svgDecorativeElements')
      const result = gen({
        type: (request.decorativeType as import('./svgDecorativeElements').DecorativeType) || 'border-simple',
        width,
        height,
        label: request.decorativeLabel,
        colors: request.colors,
        animated: request.animated,
      })
      return result.objects
    }

    case 'icon-set': {
      const { generateIconSet: gen } = await import('./svgIconSystem')
      const result = await gen({
        icons: request.iconNames || [request.prompt],
        style: (request.iconStyle as import('./svgIconSystem').IconStyle) || 'outline',
        primaryColor: request.colors?.[0],
        secondaryColor: request.colors?.[1],
      })
      return result.icons
    }

    case 'library-anim': {
      // Library animations are SVG+CSS HTML pages, not SVGObjectDefinition.
      // Return a placeholder object with the animation ID for the renderer to look up.
      const { getAnimationById: get } = await import('./svgAnimationLibrary')
      const anim = get(request.animationId || '')
      if (!anim) {
        console.warn(`[SVGPipeline] Animation not found: ${request.animationId}`)
        return []
      }
      return [{
        name: anim.name,
        zIndex: 10,
        defaultColors: {},
        svgMarkup: `<!-- library-anim:${anim.id} -->`,
        keyframes: request.keyframes || [{ time: 0 }],
      }]
    }

    case 'icon':
    default: {
      // Fall through to existing generateSVGObjects behavior
      const { generateSVGObjects } = await import('./svgObjectAnimation')
      const result = await generateSVGObjects({
        prompt: request.prompt,
        width,
        height,
      })
      return result.objects
    }
  }
}

/**
 * Resolve a prompt to the best SVG generation type.
 * Used by the orchestrator to auto-classify SVG requests.
 */
export function classifySVGPrompt(prompt: string): SVGGenerationType {
  const lower = prompt.toLowerCase()

  // Scene keywords
  if (/\b(scene|landscape|cityscape|skyline|background|underwater|space|forest|mountain|sunset|sunrise|environment|panorama)\b/.test(lower)) {
    return 'scene'
  }

  // Infographic keywords
  if (/\b(chart|graph|data|statistic|percentage|comparison|funnel|progress|pie|donut|bar chart|line chart|radar|infographic|visualization)\b/.test(lower)) {
    return 'infographic'
  }

  // Text effect keywords
  if (/\b(text effect|gradient text|neon text|glitch text|outlined text|text along path|curved text|glow text)\b/.test(lower)) {
    return 'text-effect'
  }

  // Decorative keywords
  if (/\b(border|frame|divider|separator|badge|ribbon|shield|confetti|sparkle|snow|particles|underline|corner|flourish)\b/.test(lower)) {
    return 'decorative'
  }

  // Default to icon
  return 'icon'
}
