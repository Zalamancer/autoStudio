import { useState, useRef, useCallback, useEffect } from 'react'
import { extractDominantColors, applyColorMap, type ExtractedColor, type ColorMap } from '@/services/colorExtraction'

/**
 * Color extraction + HSL recoloring for data-URL images (character sprites & sheets).
 *
 * Unlike `useImageRecolor` which works with the media store, this hook is standalone:
 *   - Takes a data URL as input
 *   - Returns extracted colors, a color map, and a recolored data URL
 *   - Calls `onRecolored(newDataUrl)` when a new recolored image is ready
 *
 * IMPORTANT: The hook internally tracks the "source" image (the one it extracted colors
 * from). When `onRecolored` fires and the parent replaces `imageDataUrl`, the hook
 * recognises its own output and does NOT re-extract. A truly new image (different upload)
 * is detected and triggers a fresh extraction.
 */
export interface SpriteRecolorState {
  extractedColors: ExtractedColor[] | null
  colorMap: ColorMap
  isExtracting: boolean
  isRecoloring: boolean
  /** Set a color mapping (debounced recolor) */
  setColor: (originalHex: string, newHex: string) => void
  /** Reset one color mapping */
  resetColor: (originalHex: string) => void
  /** Reset all color mappings */
  resetAllColors: () => void
  /** Force re-extract colors from current image */
  reExtract: () => void
}

interface UseSpriteRecolorOptions {
  /** The source data URL to extract from and recolor */
  imageDataUrl: string | null
  /** Called with the new recolored data URL whenever a recolor completes */
  onRecolored?: (newDataUrl: string) => void
  /** Auto-extract colors when imageDataUrl changes (default true) */
  autoExtract?: boolean
  /** Number of dominant colors to extract (default 8) */
  colorCount?: number
}

export function useSpriteRecolor({
  imageDataUrl,
  onRecolored,
  autoExtract = true,
  colorCount = 8,
}: UseSpriteRecolorOptions): SpriteRecolorState {
  const [extractedColors, setExtractedColors] = useState<ExtractedColor[] | null>(null)
  const [colorMap, setColorMap] = useState<ColorMap>({})
  const [isExtracting, setIsExtracting] = useState(false)
  const [isRecoloring, setIsRecoloring] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef(0)
  const onRecoloredRef = useRef(onRecolored)
  onRecoloredRef.current = onRecolored

  // Track the ORIGINAL source image (before any recoloring).
  // This prevents the "recolor → parent updates prop → re-extract" loop.
  const sourceImageRef = useRef<string | null>(null)
  // Track the last recolored output to recognise our own output
  const lastRecoloredRef = useRef<string | null>(null)

  // Detect genuinely new images vs our own recolored output
  useEffect(() => {
    if (!imageDataUrl) {
      // Image cleared
      sourceImageRef.current = null
      lastRecoloredRef.current = null
      setExtractedColors(null)
      setColorMap({})
      abortRef.current++
      return
    }

    // If the new URL matches our last recolored output, skip — it's our own output
    if (imageDataUrl === lastRecoloredRef.current) {
      return
    }

    // Genuinely new image (fresh upload or external change)
    sourceImageRef.current = imageDataUrl
    lastRecoloredRef.current = null
    setExtractedColors(null)
    setColorMap({})
    abortRef.current++
  }, [imageDataUrl])

  // ── Auto-extract colors from the source image ──
  useEffect(() => {
    const source = sourceImageRef.current
    if (!autoExtract || !source || extractedColors !== null) return

    let cancelled = false
    setIsExtracting(true)

    extractDominantColors(source, colorCount)
      .then((colors) => {
        if (!cancelled) setExtractedColors(colors)
      })
      .catch((err) => console.error('[useSpriteRecolor] extraction failed:', err))
      .finally(() => {
        if (!cancelled) setIsExtracting(false)
      })

    return () => { cancelled = true }
  }, [sourceImageRef.current, extractedColors, autoExtract, colorCount])

  // ── Debounced recoloring — always against the source image ──
  const triggerRecolor = useCallback(() => {
    const source = sourceImageRef.current
    if (!source) return

    // Read the latest colorMap via the state updater pattern
    setColorMap((currentMap) => {
      const entries = Object.entries(currentMap)
      if (entries.length === 0) {
        return currentMap
      }

      const generation = ++abortRef.current
      setIsRecoloring(true)

      applyColorMap(source, currentMap)
        .then((blob) => {
          if (abortRef.current !== generation) return

          const reader = new FileReader()
          reader.onloadend = () => {
            if (abortRef.current !== generation) return
            const result = reader.result as string
            // Track our own output so we don't re-extract when parent sets it
            lastRecoloredRef.current = result
            onRecoloredRef.current?.(result)
          }
          reader.readAsDataURL(blob)
        })
        .catch((err) => console.error('[useSpriteRecolor] recolor failed:', err))
        .finally(() => {
          if (abortRef.current === generation) setIsRecoloring(false)
        })

      return currentMap
    })
  }, [])

  // ── Public: set a single color ──
  const setColor = useCallback((originalHex: string, newHex: string) => {
    setColorMap((prev) => ({ ...prev, [originalHex]: newHex }))

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(triggerRecolor, 200)
  }, [triggerRecolor])

  // ── Public: reset one color ──
  const resetColor = useCallback((originalHex: string) => {
    setColorMap((prev) => {
      const next = { ...prev }
      delete next[originalHex]
      return next
    })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(triggerRecolor, 50)
  }, [triggerRecolor])

  // ── Public: reset all — reverts to original ──
  const resetAllColors = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setColorMap({})
    abortRef.current++
    setIsRecoloring(false)
    // Notify parent to revert to original
    const source = sourceImageRef.current
    if (source) {
      lastRecoloredRef.current = source
      onRecoloredRef.current?.(source)
    }
  }, [])

  // ── Public: force re-extract ──
  const reExtract = useCallback(() => {
    setExtractedColors(null)
  }, [])

  // Cleanup
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
    reExtract,
  }
}
