import { useState, useCallback, useRef } from 'react'
import { useCharacterConfigStore, type CharacterPartTab } from '@/stores/useCharacterConfigStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { removeImageBackground, type BgRemovalProgress } from '@/services/backgroundRemoval'
import { removeBackgroundRecraft } from '@/services/recraft'
import { useSimulatedProgress, type SimulatedProgress } from './useSimulatedProgress'
import { useSettingsStore } from '@/stores/useSettingsStore'

export interface SpriteBackgroundRemovalState {
  isProcessing: boolean
  progress: BgRemovalProgress | null
  /** Index of the sprite currently being processed (for batch) */
  currentIndex: number
  totalCount: number
  /** Simulated smooth progress for each sprite's processing phase */
  simulatedProgress: SimulatedProgress
  error: string | null
  /** Remove background from ALL sprites in a given tab */
  removeAllBackgrounds: (tab: CharacterPartTab, mode?: 'free' | 'quality') => Promise<void>
}

/**
 * Removes backgrounds from character sprite data-URLs (head, viseme, hair, body).
 * Processes each sprite in the tab through @imgly/background-removal,
 * then replaces the savedImages with transparent PNGs.
 */
export function useSpriteBackgroundRemoval(): SpriteBackgroundRemovalState {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<BgRemovalProgress | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(0)
  const simulatedProgress = useSimulatedProgress()
  const processingStartedRef = useRef(false)

  const removeAllBackgrounds = useCallback(async (tab: CharacterPartTab, mode?: 'free' | 'quality') => {
    const { savedImages, setSavedImages } = useCharacterConfigStore.getState()
    const sprites = savedImages[tab]

    if (!sprites || sprites.length === 0) {
      setError('No sprites to process')
      return
    }

    const useRecraft = mode === 'quality'
    const generation = ++abortRef.current
    setIsProcessing(true)
    setError(null)
    setCurrentIndex(0)
    setTotalCount(sprites.length)

    try {
      const processedSprites: string[] = []
      const settingsMode = useSettingsStore.getState().bgRemovalMode

      for (let i = 0; i < sprites.length; i++) {
        if (abortRef.current !== generation) return

        setCurrentIndex(i + 1)
        setProgress({ phase: 'processing', progress: 0 })
        processingStartedRef.current = false
        simulatedProgress.reset()

        const sprite = sprites[i]

        // Convert data URL to Blob
        const blob = dataUrlToBlob(sprite)

        let resultBlob: Blob

        if (useRecraft) {
          // HD mode via Recraft API (5 credits per sprite)
          simulatedProgress.start()
          resultBlob = await removeBackgroundRecraft(blob)
        } else {
          // Free local/API bg removal
          resultBlob = await removeImageBackground(blob, (p) => {
            if (abortRef.current !== generation) return
            setProgress(p)
            if ((p.phase === 'processing' || p.phase === 'uploading') && !processingStartedRef.current) {
              processingStartedRef.current = true
              simulatedProgress.start()
            }
          }, settingsMode)
        }

        if (abortRef.current !== generation) return

        // Signal this sprite done
        simulatedProgress.complete()

        // Convert result back to data URL
        const resultDataUrl = await blobToDataUrl(resultBlob)
        processedSprites.push(resultDataUrl)
      }

      if (abortRef.current !== generation) return

      // Replace all sprites in the tab with processed versions
      setSavedImages(tab, processedSprites)

      // Sync ONLY the processed tab to the saved character store so the canvas
      // picks up the transparent versions immediately.
      // Important: only update the specific tab — writing all bodyParts would
      // overwrite other characters' sprites with the config store singleton.
      const { selectedCharacterId, characters, updateCharacter, persistImages } = useSavedCharactersStore.getState()
      if (selectedCharacterId) {
        const savedChar = characters.find((c) => c.id === selectedCharacterId)
        if (savedChar) {
          updateCharacter(selectedCharacterId, {
            bodyParts: {
              ...savedChar.bodyParts,
              [tab]: processedSprites,
            } as Record<CharacterPartTab, string[]>,
          })
          persistImages(selectedCharacterId).catch(() => {})
        }
      }

      setIsProcessing(false)
      setProgress(null)
    } catch (err) {
      if (abortRef.current !== generation) return
      const message = err instanceof Error ? err.message : 'Background removal failed'
      console.error('[useSpriteBackgroundRemoval]', message)
      setError(message)
      setIsProcessing(false)
      setProgress(null)
      simulatedProgress.reset()
    }
  }, [simulatedProgress])

  return {
    isProcessing,
    progress,
    currentIndex,
    totalCount,
    simulatedProgress,
    error,
    removeAllBackgrounds,
  }
}

/** Convert a data URL (or object URL) to a Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  // Handle object URLs
  if (dataUrl.startsWith('blob:')) {
    throw new Error('Object URLs not supported, use data URLs')
  }

  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(parts[1])
  const u8arr = new Uint8Array(bstr.length)
  for (let i = 0; i < bstr.length; i++) {
    u8arr[i] = bstr.charCodeAt(i)
  }
  return new Blob([u8arr], { type: mime })
}

/** Convert a Blob to a data URL */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'))
    reader.readAsDataURL(blob)
  })
}
