import { useRef, useCallback, useState, useEffect } from 'react'
import { Upload, ChevronLeft, Trash2, Eraser, Loader2, Check, Plus, Pen, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCharacterConfigStore, type CharacterPartTab } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { removeImageBackground, type BgRemovalProgress } from '@/services/backgroundRemoval'
import { vectorizeImage, removeBackgroundRecraft, isRecraftAvailable } from '@/services/recraft'
import { useSimulatedProgress } from '@/hooks/useSimulatedProgress'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useSpriteRecolor } from '@/hooks/useSpriteRecolor'
import { ColorSwatches } from '@/components/ui/ColorSwatches'

interface ImageUploadAreaProps {
  tab: CharacterPartTab
  label: string
  onRegenerate?: () => void
  isRegenerating?: boolean
}

/** Check if a data URL is an SVG image */
function isSvgDataUrl(url: string | null): boolean {
  if (!url) return false
  return url.startsWith('data:image/svg')
}

export function ImageUploadArea({ tab, label, onRegenerate, isRegenerating }: ImageUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const directInputRef = useRef<HTMLInputElement>(null)

  const {
    uploadedImages,
    setUploadedImage,
    openConfigPanel,
  } = useCharacterConfigStore()

  const uploadedImage = uploadedImages[tab]

  // SVG files should bypass all rasterization processing
  const isSvg = isSvgDataUrl(uploadedImage)

  const bgRemovalMode = useSettingsStore((s) => s.bgRemovalMode)

  // Recraft availability (for vectorize button)
  const [recraftAvailable, setRecraftAvailable] = useState(false)
  const [bgMode, setBgMode] = useState<'local' | 'api' | 'recraft'>(bgRemovalMode)

  useEffect(() => {
    isRecraftAvailable().then(setRecraftAvailable)
  }, [])

  // Color extraction + recoloring for the uploaded sheet
  // Disabled for SVGs — they should not be rasterized
  const {
    extractedColors,
    colorMap,
    isExtracting,
    isRecoloring,
    setColor: setSheetColor,
    resetColor: resetSheetColor,
    resetAllColors: resetAllSheetColors,
  } = useSpriteRecolor({
    imageDataUrl: isSvg ? null : uploadedImage,
    onRecolored: (newDataUrl) => {
      // Replace the uploaded sheet with the recolored version
      setUploadedImage(tab, newDataUrl)
    },
    autoExtract: !isSvg,
  })

  // Body-part tabs: directly add each upload as a separate sprite (no grid cutting)
  const DIRECT_UPLOAD_TABS = new Set(['body', 'hair', 'shirt', 'pants', 'shoes'])
  const isDirectUploadTab = DIRECT_UPLOAD_TABS.has(tab)

  // Direct single-sprite upload handler (for body-part tabs)
  const handleDirectFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        const { addSavedImages } = useCharacterConfigStore.getState()
        addSavedImages(tab, [dataUrl])
        // Persist only this tab to the saved character in IndexedDB
        const { selectedCharacterId, characters, updateCharacter, persistImages } = useSavedCharactersStore.getState()
        if (selectedCharacterId) {
          const savedChar = characters.find((c) => c.id === selectedCharacterId)
          if (savedChar) {
            const latestTabImages = useCharacterConfigStore.getState().savedImages[tab] || []
            updateCharacter(selectedCharacterId, {
              bodyParts: {
                ...savedChar.bodyParts,
                [tab]: latestTabImages,
              } as Record<CharacterPartTab, string[]>,
            })
            persistImages(selectedCharacterId).catch(() => {})
          }
        }
      }
      reader.readAsDataURL(file)
    })

    if (directInputRef.current) {
      directInputRef.current.value = ''
    }
  }, [tab])

  // Sheet upload handler (for config panel / grid cutting)
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        setUploadedImage(tab, dataUrl)
        // Persist the uploaded sheet to saved character
        const { selectedCharacterId, updateCharacter, persistImages } = useSavedCharactersStore.getState()
        if (selectedCharacterId) {
          const configSheets = useCharacterConfigStore.getState().uploadedImages
          updateCharacter(selectedCharacterId, { uploadedSheets: { ...configSheets, [tab]: dataUrl } })
          persistImages(selectedCharacterId).catch(() => {})
        }
      }
      reader.readAsDataURL(file)
    })

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [tab, setUploadedImage])

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setUploadedImage(tab, null)
  }

  const handleOpenConfig = (e: React.MouseEvent) => {
    e.stopPropagation()
    openConfigPanel(tab)
  }

  // Background removal for the uploaded sheet
  const [isBgRemoving, setIsBgRemoving] = useState(false)
  const [bgProgress, setBgProgress] = useState<BgRemovalProgress | null>(null)
  const simProgress = useSimulatedProgress()
  const processingStartedRef = useRef(false)

  const handleRemoveBackground = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!uploadedImage || isBgRemoving) return

    setIsBgRemoving(true)
    setProcessingError(null)
    setBgProgress(bgMode === 'recraft' ? { phase: 'processing', progress: 0 } : { phase: 'downloading', progress: 0 })
    processingStartedRef.current = false
    simProgress.reset()

    try {
      // Convert data URL to Blob
      const parts = uploadedImage.split(',')
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png'
      const bstr = atob(parts[1])
      const u8arr = new Uint8Array(bstr.length)
      for (let i = 0; i < bstr.length; i++) {
        u8arr[i] = bstr.charCodeAt(i)
      }
      const blob = new Blob([u8arr], { type: mime })

      let resultBlob: Blob

      if (bgMode === 'recraft') {
        // HD mode via Recraft API (5 credits)
        simProgress.start()
        resultBlob = await removeBackgroundRecraft(blob)
      } else {
        // Local/API mode (both free)
        const settingsMode = bgMode === 'api' ? 'api' : 'local'
        resultBlob = await removeImageBackground(blob, (p) => {
          setBgProgress(p)
          if ((p.phase === 'processing' || p.phase === 'uploading') && !processingStartedRef.current) {
            processingStartedRef.current = true
            simProgress.start()
          }
        }, settingsMode)
      }

      // Signal processing complete (plays done animation)
      simProgress.complete()

      // Convert result back to data URL
      const reader = new FileReader()
      const resultDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read result'))
        reader.readAsDataURL(resultBlob)
      })

      // Replace the uploaded image with the transparent version
      setUploadedImage(tab, resultDataUrl)
    } catch (err) {
      console.error('[ImageUploadArea] Background removal failed:', err)
      setProcessingError(err instanceof Error ? err.message : 'Background removal failed')
      simProgress.reset()
    } finally {
      setIsBgRemoving(false)
      setBgProgress(null)
    }
  }, [uploadedImage, isBgRemoving, tab, setUploadedImage, simProgress, bgMode])

  // Error feedback for processing operations
  const [processingError, setProcessingError] = useState<string | null>(null)

  // Vectorize to SVG
  const [isVectorizing, setIsVectorizing] = useState(false)

  const handleVectorize = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!uploadedImage || isVectorizing || isSvg) return

    setIsVectorizing(true)
    setProcessingError(null)
    try {
      const svgDataUrl = await vectorizeImage(uploadedImage)
      setUploadedImage(tab, svgDataUrl)
    } catch (err) {
      console.error('[ImageUploadArea] Vectorization failed:', err)
      setProcessingError(err instanceof Error ? err.message : 'Vectorization failed')
    } finally {
      setIsVectorizing(false)
    }
  }, [uploadedImage, isVectorizing, isSvg, tab, setUploadedImage])

  // ── All tabs: sheet upload + config panel flow (with optional direct-upload button) ──
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">{label}</label>
        <div className="flex items-center gap-1.5">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className={cn(
                'text-xs transition-colors flex items-center gap-1',
                isRegenerating
                  ? 'text-blue-400 cursor-wait'
                  : 'text-zinc-500 hover:text-accent',
              )}
              title="Regenerate with AI"
            >
              <RotateCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
              {isRegenerating ? 'Generating...' : 'Regen'}
            </button>
          )}
          {uploadedImage && (
            <button
              onClick={handleClear}
              className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Direct single-sprite upload (body-part tabs only) */}
      {isDirectUploadTab && (
        <>
          <input
            ref={directInputRef}
            type="file"
            accept="image/*,.svg"
            multiple
            onChange={handleDirectFileSelect}
            className="hidden"
          />
          <button
            onClick={() => directInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-lg border-2 border-dashed border-zinc-700 hover:border-green-500/50 bg-zinc-800/50 transition-all cursor-pointer flex items-center justify-center gap-2 text-zinc-400 hover:text-green-400"
          >
            <Plus size={16} />
            <span className="text-xs">Add Single Sprite</span>
          </button>
        </>
      )}

      <div className="relative">
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.svg"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload area (sheet) */}
        <div
          onClick={handleClick}
          className={cn(
            'relative h-24 rounded-lg border-2 border-dashed transition-all cursor-pointer overflow-hidden',
            uploadedImage
              ? 'border-zinc-600 hover:border-zinc-500'
              : 'border-zinc-700 hover:border-green-500/50 bg-zinc-800/50'
          )}
        >
          {uploadedImage ? (
            <>
              {/* Image Preview */}
              <img
                src={uploadedImage}
                alt={`${label} preview`}
                className="w-full h-full object-contain"
              />

              {/* Background removal overlay */}
              {(isBgRemoving || simProgress.isActive) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-10">
                  {simProgress.isDone ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <Loader2 size={18} className="animate-spin text-violet-400" />
                  )}
                  <span className="text-[10px] text-violet-300">
                    {simProgress.isDone
                      ? 'Done!'
                      : bgProgress?.phase === 'downloading'
                        ? `Downloading model... ${Math.round((bgProgress.progress || 0) * 100)}%`
                        : `Removing BG... ${Math.round(simProgress.isActive ? simProgress.value : 0)}%`}
                  </span>
                  {/* Progress bar */}
                  <div className="w-3/4 h-1 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        simProgress.isDone ? 'bg-green-500' : 'bg-violet-500'
                      )}
                      style={{
                        width: bgProgress?.phase === 'downloading'
                          ? `${Math.round((bgProgress.progress || 0) * 100)}%`
                          : `${Math.round(simProgress.isActive ? simProgress.value : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Config Button - Arrow on left */}
              <button
                onClick={handleOpenConfig}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-12 bg-white/90 hover:bg-white rounded-r-lg flex items-center justify-center text-zinc-800 shadow-lg transition-all"
                title="Configure & Cut"
              >
                <ChevronLeft size={16} />
              </button>

              {/* SVG indicator */}
              {isSvg && (
                <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-emerald-600/90 rounded text-[10px] text-white flex items-center gap-1 shadow z-10">
                  SVG
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
              <Upload size={24} className="mb-1" />
              <span className="text-xs">Upload {label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Background Removal — mode toggle + button (for uploaded sheets, not SVGs) */}
      {uploadedImage && !isSvg && (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-md border border-zinc-700 overflow-hidden shrink-0">
            <button
              onClick={() => {
                setBgMode('local')
                useSettingsStore.getState().setSetting('bgRemovalMode', 'local')
              }}
              disabled={isBgRemoving}
              className={cn(
                'px-2 py-1 text-[10px] transition-colors',
                bgMode === 'local'
                  ? 'bg-violet-600/30 text-violet-300'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
              title="Free client-side background removal"
            >
              Local
            </button>
            <button
              onClick={() => {
                setBgMode('api')
                useSettingsStore.getState().setSetting('bgRemovalMode', 'api')
              }}
              disabled={isBgRemoving}
              className={cn(
                'px-2 py-1 text-[10px] transition-colors',
                bgMode === 'api'
                  ? 'bg-amber-600/30 text-amber-300'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
              title="HD background removal via rembg server (free)"
            >
              HD
            </button>
            {recraftAvailable && (
              <button
                onClick={() => setBgMode('recraft')}
                disabled={isBgRemoving}
                className={cn(
                  'px-2 py-1 text-[10px] transition-colors',
                  bgMode === 'recraft'
                    ? 'bg-emerald-600/30 text-emerald-300'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
                title="Recraft AI background removal (5 credits)"
              >
                Recraft
              </button>
            )}
          </div>
          <button
            onClick={handleRemoveBackground}
            disabled={isBgRemoving}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors',
              isBgRemoving
                ? 'bg-violet-600/20 text-violet-300 cursor-wait'
                : 'bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 border border-violet-500/30'
            )}
          >
            {isBgRemoving ? (
              <>
                {simProgress.isDone ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <Loader2 size={12} className="animate-spin" />
                )}
                {simProgress.isDone
                  ? 'Done!'
                  : bgProgress?.phase === 'downloading'
                    ? 'Downloading model...'
                    : bgProgress?.phase === 'uploading'
                      ? 'Uploading...'
                      : `Removing BG... ${Math.round(simProgress.isActive ? simProgress.value : 0)}%`}
              </>
            ) : (
              <>
                <Eraser size={12} />
                Remove BG{bgMode === 'api' ? ' (HD)' : bgMode === 'recraft' ? ' (5cr)' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Convert to Vector (Recraft) — only for raster uploads, not SVGs */}
      {uploadedImage && !isSvg && recraftAvailable && (
        <button
          onClick={handleVectorize}
          disabled={isVectorizing || isBgRemoving}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors',
            isVectorizing
              ? 'bg-emerald-600/20 text-emerald-300 cursor-wait'
              : 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600/20 border border-emerald-500/30'
          )}
        >
          {isVectorizing ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Vectorizing...
            </>
          ) : (
            <>
              <Pen size={12} />
              Convert to Vector (5cr)
            </>
          )}
        </button>
      )}

      {/* Processing error message */}
      {processingError && (
        <div className="px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
          {processingError}
        </div>
      )}

      {/* Color swatches — auto-extracted from uploaded sheet (not for SVGs) */}
      {uploadedImage && !isSvg && (
        <ColorSwatches
          extractedColors={extractedColors}
          colorMap={colorMap}
          isExtracting={isExtracting}
          isRecoloring={isRecoloring}
          onColorChange={setSheetColor}
          onColorReset={resetSheetColor}
          onResetAll={resetAllSheetColors}
          compact
        />
      )}
    </div>
  )
}
