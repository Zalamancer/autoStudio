/**
 * Hidden SVG element that injects all needed style-effect filter definitions.
 * Mirrors BoilingLineFilters.tsx pattern: reads active style effects from all
 * character + SVG object stores, deduplicates, and renders seed variants for
 * animated effects.
 *
 * Mount once as a child of the canvas viewport (alongside BoilingLineFilters).
 */

import { memo, useMemo, useRef } from 'react'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useShallow } from 'zustand/react/shallow'
import { generateAllStyleFilters, isSVGFilterEffect } from '@/services/styleEffectFilters'
import type { ActiveStyleEffect } from '@/types/styleEffects'

/** Value-compare two arrays of ActiveStyleEffect by type + settings JSON. */
function effectsEqual(a: ActiveStyleEffect[], b: ActiveStyleEffect[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type) return false
    // Shallow compare settings keys
    const aKeys = Object.keys(a[i].settings)
    const bKeys = Object.keys(b[i].settings)
    if (aKeys.length !== bKeys.length) return false
    for (const k of aKeys) {
      if (a[i].settings[k] !== b[i].settings[k]) return false
    }
  }
  return true
}

/** Returns a stable array reference unless the content actually changed (by value). */
function useStableEffects(next: ActiveStyleEffect[]): ActiveStyleEffect[] {
  const ref = useRef(next)
  if (!effectsEqual(ref.current, next)) {
    ref.current = next
  }
  return ref.current
}

export const StyleEffectFilters = memo(function StyleEffectFilters() {
  // Collect all active SVG-filter-based style effects from multi-char store
  const charEffects = useStableEffects(
    useMultiCharacterStore(
      useShallow((s) =>
        s.characters
          .map((c) => c.activeStyleEffect)
          .filter((e): e is ActiveStyleEffect =>
            !!e && !!e.settings?.enabled && isSVGFilterEffect(e.type),
          ),
      ),
    ),
  )

  // Single character store
  const singleCharEffect = useCharacterPartsStore((s) => s.activeStyleEffect)

  // SVG objects
  const svgEffects = useStableEffects(
    useSVGObjectStore(
      useShallow((s) => {
        const comp = s.composition
        if (!comp) return []
        return comp.objects
          .map((o) => o.activeStyleEffect)
          .filter((e): e is ActiveStyleEffect =>
            !!e && !!e.settings?.enabled && isSVGFilterEffect(e.type),
          )
      }),
    ),
  )

  const allEffects = useMemo(() => {
    const list = [...charEffects, ...svgEffects]
    if (
      singleCharEffect &&
      singleCharEffect.settings?.enabled &&
      isSVGFilterEffect(singleCharEffect.type)
    ) {
      list.push(singleCharEffect)
    }
    return list
  }, [charEffects, singleCharEffect, svgEffects])

  const filterXMLs = useMemo(() => generateAllStyleFilters(allEffects), [allEffects])

  if (filterXMLs.length === 0) return null

  return (
    <svg
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs dangerouslySetInnerHTML={{ __html: filterXMLs.join('') }} />
    </svg>
  )
})
