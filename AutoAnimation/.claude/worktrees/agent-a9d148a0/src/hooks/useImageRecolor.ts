import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useMediaStore } from '@/stores/useMediaStore'
import { extractDominantColors, applyColorMap, type ExtractedColor } from '@/services/colorExtraction'
import { useState } from 'react'

/**
 * Orchestrates color extraction and debounced recoloring for a canvas media item.
 */
export function useImageRecolor(canvasItemId: string | null) {
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const setExtractedColors = useMediaStore((s) => s.setExtractedColors)
  const setColorMapEntry = useMediaStore((s) => s.setColorMapEntry)
  const resetColorMapEntry = useMediaStore((s) => s.resetColorMapEntry)
  const resetAllColorsAction = useMediaStore((s) => s.resetAllColors)
  const setRecoloredUrl = useMediaStore((s) => s.setRecoloredUrl)

  const [isExtracting, setIsExtracting] = useState(false)
  const [isRecoloring, setIsRecoloring] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(0) // incremented to cancel stale recolor ops

  const item = useMemo(
    () => canvasItems.find((c) => c.id === canvasItemId) ?? null,
    [canvasItems, canvasItemId]
  )
  const asset = useMemo(
    () => (item ? assets.find((a) => a.id === item.assetId) ?? null : null),
    [assets, item]
  )

  const extractedColors: ExtractedColor[] | null = item?.extractedColors ?? null
  const colorMap = item?.colorMap ?? {}

  // Resolve display URL: recolored if available, otherwise original
  const displayUrl = item?.recoloredUrl || asset?.url || ''

  // ── Auto-extract colors on first selection ──
  useEffect(() => {
    if (!item || !asset?.url || item.extractedColors !== null) return

    let cancelled = false
    setIsExtracting(true)

    extractDominantColors(asset.url, 8)
      .then((colors) => {
        if (!cancelled) {
          setExtractedColors(item.id, colors)
        }
      })
      .catch((err) => {
        console.error('Color extraction failed:', err)
      })
      .finally(() => {
        if (!cancelled) setIsExtracting(false)
      })

    return () => { cancelled = true }
  }, [item?.id, asset?.url, item?.extractedColors, setExtractedColors])

  // ── Debounced recoloring — reads fresh state from store each time ──
  const triggerRecolor = useCallback(() => {
    // Always read fresh state from the store to avoid stale closures
    const state = useMediaStore.getState()
    const freshItem = state.canvasItems.find((c) => c.id === canvasItemId)
    if (!freshItem) {
      console.warn('[useImageRecolor] triggerRecolor: item not found', canvasItemId)
      return
    }

    const freshAsset = state.assets.find((a) => a.id === freshItem.assetId)
    if (!freshAsset?.url) {
      console.warn('[useImageRecolor] triggerRecolor: asset not found or no URL', freshItem.assetId)
      return
    }

    const currentColorMap = freshItem.colorMap
    if (!currentColorMap || Object.keys(currentColorMap).length === 0) {
      console.log('[useImageRecolor] triggerRecolor: empty colorMap, reverting to original')
      setRecoloredUrl(freshItem.id, null)
      return
    }

    console.log('[useImageRecolor] triggerRecolor: applying colorMap', {
      assetUrl: freshAsset.url.slice(0, 40),
      entries: Object.keys(currentColorMap).length,
      colorMap: currentColorMap,
    })

    const generation = ++abortRef.current
    setIsRecoloring(true)

    applyColorMap(freshAsset.url, currentColorMap)
      .then((blob) => {
        if (abortRef.current !== generation) return // stale
        // Revoke the previous recolored blob URL to prevent memory leaks
        const prevUrl = useMediaStore.getState().canvasItems.find((c) => c.id === freshItem.id)?.recoloredUrl
        if (prevUrl) URL.revokeObjectURL(prevUrl)
        const url = URL.createObjectURL(blob)
        console.log('[useImageRecolor] recolor complete, new URL:', url.slice(0, 40))
        setRecoloredUrl(freshItem.id, url)
      })
      .catch((err) => {
        console.error('[useImageRecolor] Recoloring failed:', err)
      })
      .finally(() => {
        if (abortRef.current === generation) setIsRecoloring(false)
      })
  }, [canvasItemId, setRecoloredUrl])

  // ── Public: set a single color (with debounced recolor) ──
  const setColor = useCallback(
    (originalHex: string, newHex: string) => {
      if (!canvasItemId) {
        console.warn('[useImageRecolor] setColor called but no canvasItemId')
        return
      }
      console.log('[useImageRecolor] setColor', { canvasItemId, originalHex, newHex })
      setColorMapEntry(canvasItemId, originalHex, newHex)

      // Debounce the actual pixel processing
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(triggerRecolor, 200)
    },
    [canvasItemId, setColorMapEntry, triggerRecolor]
  )

  // ── Public: reset one color ──
  const resetColor = useCallback(
    (originalHex: string) => {
      if (!canvasItemId) return
      resetColorMapEntry(canvasItemId, originalHex)

      // Recolor with remaining mappings (or clear)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(triggerRecolor, 50)
    },
    [canvasItemId, resetColorMapEntry, triggerRecolor]
  )

  // ── Public: reset all colors ──
  const resetAllColors = useCallback(() => {
    if (!canvasItemId) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    resetAllColorsAction(canvasItemId)
  }, [canvasItemId, resetAllColorsAction])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return {
    extractedColors,
    colorMap,
    isExtracting,
    isRecoloring,
    setColor,
    resetColor,
    resetAllColors,
    displayUrl,
  }
}
