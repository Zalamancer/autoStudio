import { useState, useCallback, useRef } from 'react'
import { useMediaStore, type MediaAsset } from '@/stores/useMediaStore'
import { getMediaBlob } from '@/services/mediaDB'
import { removeImageBackground, type BgRemovalProgress } from '@/services/backgroundRemoval'
import { useSimulatedProgress, type SimulatedProgress } from './useSimulatedProgress'
import { useSettingsStore } from '@/stores/useSettingsStore'

export interface BackgroundRemovalState {
  isProcessing: boolean
  progress: BgRemovalProgress | null
  /** Simulated smooth progress for the processing phase (0-100) */
  simulatedProgress: SimulatedProgress
  error: string | null
  /** Trigger background removal. Returns the new asset ID on success, null on failure. */
  removeBackground: (assetId: string) => Promise<string | null>
}

/**
 * Orchestrates background removal for media assets.
 * Creates a NEW transparent PNG asset (non-destructive).
 */
export function useBackgroundRemoval(): BackgroundRemovalState {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<BgRemovalProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(0)
  const simulatedProgress = useSimulatedProgress()
  const processingStartedRef = useRef(false)

  const addAsset = useMediaStore((s) => s.addAsset)

  const removeBackgroundFn = useCallback(async (assetId: string): Promise<string | null> => {
    const asset = useMediaStore.getState().assets.find((a) => a.id === assetId)
    if (!asset) {
      setError('Asset not found')
      return null
    }
    if (asset.category !== 'images') {
      setError('Background removal only works on images')
      return null
    }

    const generation = ++abortRef.current
    setIsProcessing(true)
    setProgress({ phase: 'downloading', progress: 0 })
    setError(null)
    processingStartedRef.current = false
    simulatedProgress.reset()

    try {
      // 1. Get the original blob from IndexedDB
      const originalBlob = await getMediaBlob(assetId)
      if (!originalBlob) {
        throw new Error('Image data not found in storage. Try re-importing the image.')
      }
      if (abortRef.current !== generation) return null

      // 2. Run background removal (mode from settings)
      const mode = useSettingsStore.getState().bgRemovalMode

      const runRemoval = async () => removeImageBackground(originalBlob, (p) => {
        if (abortRef.current !== generation) return
        setProgress(p)
        // Start simulated progress when entering processing phase
        if ((p.phase === 'processing' || p.phase === 'uploading') && !processingStartedRef.current) {
          processingStartedRef.current = true
          simulatedProgress.start()
        }
      }, mode)

      const resultBlob = await runRemoval()
      if (abortRef.current !== generation) return null

      // 3. Signal processing complete (plays done animation)
      simulatedProgress.complete()

      // 4. Get dimensions from the result (same as original, but let's read to be safe)
      const dimensions = await getImageDimensions(resultBlob)

      // 5. Create a new asset
      const newId = `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const blobUrl = URL.createObjectURL(resultBlob)
      const baseName = asset.name.replace(/\.[^.]+$/, '')

      const newAsset: MediaAsset = {
        id: newId,
        name: `${baseName} (no bg).png`,
        type: 'image/png',
        size: resultBlob.size,
        category: 'images',
        url: blobUrl,
        width: dimensions.width,
        height: dimensions.height,
        addedAt: Date.now(),
      }

      addAsset(newAsset, resultBlob)

      setIsProcessing(false)
      setProgress(null)
      return newId
    } catch (err) {
      if (abortRef.current !== generation) return null
      const message = err instanceof Error ? err.message : 'Background removal failed'
      console.error('[useBackgroundRemoval]', message)
      setError(message)
      setIsProcessing(false)
      setProgress(null)
      simulatedProgress.reset()
      return null
    }
  }, [addAsset, simulatedProgress])

  return { isProcessing, progress, simulatedProgress, error, removeBackground: removeBackgroundFn }
}

/** Read width/height from a blob by loading it as an Image */
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to read image dimensions'))
    }
    img.src = url
  })
}
