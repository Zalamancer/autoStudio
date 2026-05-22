/**
 * RemotionStyleEffectFilters — Injects SVG filter definitions into the
 * Remotion export composition so per-character and per-object style effects
 * (woodcut, cel-shade, neon-outline, glitch, VHS, etc.) render in the final video.
 *
 * Mirrors the preview-time StyleEffectFilters.tsx component but reads from
 * export props instead of live stores. Also collects the single-character
 * store's activeStyleEffect when no dialogue characters are present.
 */

import { useMemo } from 'react'
import { generateAllStyleFilters, isSVGFilterEffect } from '@/services/styleEffectFilters'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import type { ActiveStyleEffect } from '@/types/styleEffects'
import type { DialogueCharacterData, SVGCompositionExportData } from './types'

interface RemotionStyleEffectFiltersProps {
  /** Multi-character dialogue data (each may have activeStyleEffect) */
  dialogueCharacters?: DialogueCharacterData[]
  /** SVG object composition (each object may have activeStyleEffect) */
  svgComposition?: SVGCompositionExportData
}

export function RemotionStyleEffectFilters({
  dialogueCharacters,
  svgComposition,
}: RemotionStyleEffectFiltersProps) {
  const filterXMLs = useMemo(() => {
    const allEffects: ActiveStyleEffect[] = []

    // Collect from dialogue characters
    if (dialogueCharacters) {
      for (const dChar of dialogueCharacters) {
        const fx = dChar.activeStyleEffect
        if (fx && fx.settings?.enabled && isSVGFilterEffect(fx.type)) {
          allEffects.push(fx)
        }
      }
    }

    // Collect from single-character store (when no dialogue characters)
    if (!dialogueCharacters || dialogueCharacters.length === 0) {
      const singleFx = useCharacterPartsStore.getState().activeStyleEffect
      if (singleFx && singleFx.settings?.enabled && isSVGFilterEffect(singleFx.type)) {
        allEffects.push(singleFx)
      }
    }

    // Collect from SVG objects (the SVGCompositionExportData doesn't include
    // activeStyleEffect in export data, but read from the live store for now)
    // SVG object effects are stored on each object in the composition store
    // Since the SVG composition export data doesn't include style effects,
    // we read from the live store as a fallback
    try {
      const { useSVGObjectStore } = require('@/stores/useSVGObjectStore')
      const svgComp = useSVGObjectStore.getState().composition
      if (svgComp) {
        for (const obj of svgComp.objects) {
          const fx = obj.activeStyleEffect
          if (fx && fx.settings?.enabled && isSVGFilterEffect(fx.type)) {
            allEffects.push(fx)
          }
        }
      }
    } catch {
      // SVG object store may not be available in all contexts
    }

    if (allEffects.length === 0) return []
    return generateAllStyleFilters(allEffects)
  }, [dialogueCharacters, svgComposition])

  if (filterXMLs.length === 0) return null

  return (
    <svg
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <defs dangerouslySetInnerHTML={{ __html: filterXMLs.join('') }} />
    </svg>
  )
}
