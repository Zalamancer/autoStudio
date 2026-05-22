/**
 * Step Executor: Setup Text Overlays
 */

import type { ClipPlan } from '@/types/orchestrator'
import type { TextOverlay } from '@/stores/useTextOverlayStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { logger } from '@/utils/logger'
import { TEXT_PRESET_DEFAULTS, safeFontFamily, type ExecutionContext } from '../constants'
import { getTextOverlayY, type TargetPlatform, type TextPosition } from '@/services/compositionEngine'
import { useBrandKitStore } from '@/stores/useBrandKitStore'

export async function executeSetupTextOverlays(plan: ClipPlan, ctx: ExecutionContext): Promise<void> {
  const platform = (ctx.settings?.targetPlatform || 'generic') as TargetPlatform
  const brandKit = useBrandKitStore.getState().getActiveBrandKit()

  for (let i = 0; i < plan.textOverlays.length; i++) {
    const overlay = plan.textOverlays[i]
    try {
      const defaults = TEXT_PRESET_DEFAULTS[overlay.preset] || TEXT_PRESET_DEFAULTS.title
      const startFrame = Math.round((overlay.startPercent ?? 0) * ctx.totalFrames)
      const endFrame = Math.round((overlay.endPercent ?? 1) * ctx.totalFrames)

      // Validate presetType — Gemini may return an unexpected value
      const validPresets = ['title', 'subtitle', 'lower-third', 'cta', 'quote', 'watermark']
      const safePreset = validPresets.includes(overlay.preset) ? overlay.preset : 'title'

      // Use composition engine for safe-zone-aware vertical positioning
      const textPosName = (defaults.position || 'center') as string
      const safeY = getTextOverlayY(textPosName as TextPosition, platform)

      // Apply brand kit fonts/colors if active
      const bkHeadingFont = brandKit?.headingFont
      const bkBodyFont = brandKit?.bodyFont
      const bkColor = brandKit?.primaryColor
      const isHeading = safePreset === 'title' || safePreset === 'cta'
      const brandFont = isHeading ? bkHeadingFont : bkBodyFont

      const textOverlay: TextOverlay = {
        id: `text_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        presetType: safePreset as TextOverlay['presetType'],
        content: overlay.content || '',
        fontFamily: safeFontFamily(overlay.fontFamily, brandFont || (defaults.fontFamily as string)),
        fontSize: overlay.fontSize || defaults.fontSize || 36,
        fontWeight: (defaults.fontWeight || 'normal') as TextOverlay['fontWeight'],
        color: overlay.color || bkColor || defaults.color || '#ffffff',
        align: (defaults.align || 'center') as TextOverlay['align'],
        verticalAlign: (defaults.verticalAlign || 'middle') as TextOverlay['verticalAlign'],
        position: (defaults.position || 'center') as TextOverlay['position'],
        freeX: 50,
        freeY: safeY,
        lineHeight: 1.4,
        letterSpacing: 0,
        textCase: (defaults.textCase || 'none') as TextOverlay['textCase'],
        shadow: defaults.shadow ?? true,
        background: defaults.background ?? false,
        backgroundOpacity: defaults.backgroundOpacity ?? 0.7,
        visible: true,
        opacity: defaults.opacity ?? 1,
        zIndex: 8,
        rotation: 0,
        width: null,
        height: null,
        startFrame,
        endFrame,
      }

      useTextOverlayStore.getState().addOverlay(textOverlay)
    } catch (err) {
      logger.error(`[Orchestrator:text] Failed to add overlay ${i + 1}:`, err)
    }
  }
}
