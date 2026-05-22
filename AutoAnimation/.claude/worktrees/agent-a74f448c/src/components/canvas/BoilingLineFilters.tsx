import { memo, useMemo, useRef } from 'react'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useShallow } from 'zustand/react/shallow'
import { generateAllFilters } from '@/services/boilingLineEffect'
import type { BoilingLineSettings } from '@/types/boilingLine'

/** Value-compare two arrays of BoilingLineSettings. */
function settingsEqual(a: BoilingLineSettings[], b: BoilingLineSettings[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].intensity !== b[i].intensity ||
      a[i].detail !== b[i].detail ||
      a[i].enabled !== b[i].enabled ||
      a[i].roughenEdges !== b[i].roughenEdges ||
      a[i].strokeJitter !== b[i].strokeJitter
    ) return false
  }
  return true
}

/** Returns a stable array reference unless the content actually changed (by value). */
function useStableSettings(next: BoilingLineSettings[]): BoilingLineSettings[] {
  const ref = useRef(next)
  if (!settingsEqual(ref.current, next)) {
    ref.current = next
  }
  return ref.current
}

/**
 * Hidden SVG element that injects all needed boiling-line filter definitions.
 * Reads active settings from multi-character, single-character, and SVG object stores,
 * deduplicates by (intensity, detail), and renders 8 seed variants per combination.
 *
 * Mount once as a child of the canvas viewport.
 */
export const BoilingLineFilters = memo(function BoilingLineFilters() {
  // Collect all active boiling settings.
  // useShallow prevents infinite re-render loops from new array references
  // created by .map().filter() selectors.
  const charSettings = useStableSettings(
    useMultiCharacterStore(
      useShallow((s) =>
        s.characters.map((c) => c.boilingLine).filter((b): b is BoilingLineSettings => !!b && b.enabled)
      )
    )
  )
  const singleCharSetting = useCharacterPartsStore((s) => s.boilingLine)
  const svgSettings = useStableSettings(
    useSVGObjectStore(
      useShallow((s) => {
        const comp = s.composition
        if (!comp) return []
        return comp.objects.map((o) => o.boilingLine).filter((b): b is BoilingLineSettings => !!b && b.enabled)
      })
    )
  )

  const allSettings = useMemo(() => {
    const list = [...charSettings, ...svgSettings]
    if (singleCharSetting?.enabled) list.push(singleCharSetting)
    return list
  }, [charSettings, singleCharSetting, svgSettings])

  const filterXMLs = useMemo(() => generateAllFilters(allSettings), [allSettings])

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
