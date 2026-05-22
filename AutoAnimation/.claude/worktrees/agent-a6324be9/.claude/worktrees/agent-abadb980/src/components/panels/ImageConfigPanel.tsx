import { useState, useCallback } from 'react'
import { X, Grid3X3, Square, Scissors, Save, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { IconButton } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useCharacterConfigStore, type CharacterPartTab } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'

export function ImageConfigPanel() {
  const {
    uploadedImages,
    currentConfigTab,
    isConfigPanelOpen,
    cuttingMode,
    gridRows,
    gridColumns,
    pixelWidth,
    pixelHeight,
    tempSlices,
    savedImages,
    setCuttingMode,
    setGridSettings,
    setPixelSettings,
    setTempSlices,
    addSavedImages,
    closeConfigPanel,
    clearTempSlices,
    setSpriteLabel,
    autoMapVisemesFromLabels,
  } = useCharacterConfigStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [cutError, setCutError] = useState<string | null>(null)
  const [autoNames, setAutoNames] = useState('')

  // Default viseme names for quick entry
  const defaultVisemeNames = 'Aa, D, Ee, F, L, M, O, R, S, U, W, Rest'

  const uploadedImage = currentConfigTab ? uploadedImages[currentConfigTab] : null

  // Detect if the uploaded image is an SVG data URL
  const isSvgInput = uploadedImage?.startsWith('data:image/svg+xml')

  // SVG-preserving slice: uses viewBox cropping instead of canvas rasterization
  const sliceSvgSheet = useCallback((svgDataUrl: string, rows: number, cols: number): string[] => {
    // Decode SVG string from data URL
    let svgString: string
    const commaIdx = svgDataUrl.indexOf(',')
    const meta = svgDataUrl.slice(0, commaIdx)
    const payload = svgDataUrl.slice(commaIdx + 1)
    if (meta.includes('base64')) {
      svgString = decodeURIComponent(escape(atob(payload)))
    } else {
      svgString = decodeURIComponent(payload)
    }

    // Parse SVG to extract dimensions
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const svgEl = doc.documentElement

    // Determine the coordinate space dimensions
    let origWidth = 0
    let origHeight = 0
    let vbMinX = 0
    let vbMinY = 0

    const viewBox = svgEl.getAttribute('viewBox')
    if (viewBox) {
      const parts = viewBox
        .trim()
        .split(/[\s,]+/)
        .map(Number)
      vbMinX = parts[0] || 0
      vbMinY = parts[1] || 0
      origWidth = parts[2] || 0
      origHeight = parts[3] || 0
    }
    if (!origWidth) origWidth = parseFloat(svgEl.getAttribute('width') || '0')
    if (!origHeight) origHeight = parseFloat(svgEl.getAttribute('height') || '0')

    if (!origWidth || !origHeight) {
      throw new Error('Cannot determine SVG dimensions (no width/height or viewBox)')
    }

    const cellW = origWidth / cols
    const cellH = origHeight / rows

    // Extract inner content of the root <svg> (preserves defs, styles, groups, etc.)
    const innerContent = svgEl.innerHTML

    // Collect namespace declarations from original SVG
    const nsAttrs: string[] = []
    for (const attr of Array.from(svgEl.attributes)) {
      if (attr.name.startsWith('xmlns')) {
        nsAttrs.push(`${attr.name}="${attr.value}"`)
      }
    }
    const xmlns = nsAttrs.length > 0 ? nsAttrs.join(' ') : 'xmlns="http://www.w3.org/2000/svg"'

    const slices: string[] = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = vbMinX + col * cellW
        const y = vbMinY + row * cellH
        // Create a new SVG with a viewBox that crops to this cell
        const sliceSvg = `<svg ${xmlns} width="${cellW}" height="${cellH}" viewBox="${x} ${y} ${cellW} ${cellH}">${innerContent}</svg>`
        const encoded = btoa(unescape(encodeURIComponent(sliceSvg)))
        slices.push(`data:image/svg+xml;base64,${encoded}`)
      }
    }
    return slices
  }, [])

  // Cut the image based on current settings
  const handleCut = useCallback(async () => {
    if (!uploadedImage) return

    setIsProcessing(true)
    setCutError(null)

    try {
      // SVG path: preserve vector format using viewBox slicing
      if (isSvgInput) {
        let rows: number
        let cols: number

        if (cuttingMode === 'grid') {
          rows = gridRows
          cols = gridColumns
        } else {
          // For pixel mode on SVG, parse dimensions to compute grid
          const parser = new DOMParser()
          const commaIdx = uploadedImage.indexOf(',')
          const meta = uploadedImage.slice(0, commaIdx)
          const payload = uploadedImage.slice(commaIdx + 1)
          const svgStr = meta.includes('base64')
            ? decodeURIComponent(escape(atob(payload)))
            : decodeURIComponent(payload)
          const doc = parser.parseFromString(svgStr, 'image/svg+xml')
          const el = doc.documentElement
          const vb = el.getAttribute('viewBox')
          let w = 0,
            h = 0
          if (vb) {
            const parts = vb
              .trim()
              .split(/[\s,]+/)
              .map(Number)
            w = parts[2] || 0
            h = parts[3] || 0
          }
          if (!w) w = parseFloat(el.getAttribute('width') || '0')
          if (!h) h = parseFloat(el.getAttribute('height') || '0')
          cols = Math.max(1, Math.floor(w / pixelWidth))
          rows = Math.max(1, Math.floor(h / pixelHeight))
        }

        const slices = sliceSvgSheet(uploadedImage, rows, cols)
        setTempSlices(slices)
        return
      }

      // Raster path: use canvas (PNG/JPG/WebP etc.)
      const img = new Image()
      img.src = uploadedImage

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const slices: string[] = []
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }

          let rows: number
          let cols: number
          let sliceWidth: number
          let sliceHeight: number

          if (cuttingMode === 'grid') {
            rows = gridRows
            cols = gridColumns
            sliceWidth = Math.floor(img.width / cols)
            sliceHeight = Math.floor(img.height / rows)
          } else {
            sliceWidth = pixelWidth
            sliceHeight = pixelHeight
            cols = Math.floor(img.width / sliceWidth)
            rows = Math.floor(img.height / sliceHeight)
          }

          canvas.width = sliceWidth
          canvas.height = sliceHeight

          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              ctx.clearRect(0, 0, sliceWidth, sliceHeight)
              ctx.drawImage(
                img,
                col * sliceWidth,
                row * sliceHeight,
                sliceWidth,
                sliceHeight,
                0,
                0,
                sliceWidth,
                sliceHeight,
              )
              slices.push(canvas.toDataURL('image/png'))
            }
          }

          setTempSlices(slices)
          resolve()
        }

        img.onerror = () => reject(new Error('Failed to load image'))
      })
    } catch (error) {
      console.error('Error cutting image:', error)
      setCutError(error instanceof Error ? error.message : 'Failed to cut image')
    } finally {
      setIsProcessing(false)
    }
  }, [
    uploadedImage,
    isSvgInput,
    cuttingMode,
    gridRows,
    gridColumns,
    pixelWidth,
    pixelHeight,
    setTempSlices,
    sliceSvgSheet,
  ])

  // Save the cut slices with auto-naming
  const handleSave = useCallback(() => {
    if (!currentConfigTab || tempSlices.length === 0) return

    // Get the starting index (after existing saved images)
    const startIndex = savedImages[currentConfigTab].length

    // Add the images first
    addSavedImages(currentConfigTab, tempSlices)

    // Parse auto-names and apply labels
    if (autoNames.trim()) {
      const names = autoNames
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
      names.forEach((name, i) => {
        if (i < tempSlices.length) {
          setSpriteLabel(currentConfigTab as CharacterPartTab, startIndex + i, name)
        }
      })

      // If saving viseme sprites with labels, auto-map them to visemes
      if (currentConfigTab === 'viseme') {
        // Delay to ensure labels are set first
        setTimeout(() => {
          autoMapVisemesFromLabels()
        }, 100)
      }
    }

    // Auto-persist cut sprites back to the active saved character
    // This ensures sprites survive page refreshes (since useCharacterConfigStore has no persistence)
    const { selectedCharacterId, updateCharacter, persistImages } = useSavedCharactersStore.getState()
    if (selectedCharacterId) {
      const {
        savedImages: configImages,
        spriteLabels: configLabels,
        uploadedImages: configSheets,
      } = useCharacterConfigStore.getState()
      const updatedBodyParts = {
        body: configImages.body || [],
        head: configImages.head || [],
        eye: configImages.eye || [],
        eyebrow: configImages.eyebrow || [],
        hair: configImages.hair || [],
        viseme: configImages.viseme || [],
        shirt: configImages.shirt || [],
        pants: configImages.pants || [],
        shoes: configImages.shoes || [],
      }
      updateCharacter(selectedCharacterId, {
        bodyParts: updatedBodyParts,
        spriteLabels: configLabels,
        uploadedSheets: configSheets,
      })
      // Also persist to IndexedDB so large image data isn't lost
      persistImages(selectedCharacterId).catch((err) =>
        console.warn('[ImageConfigPanel] Failed to persist images to IndexedDB:', err),
      )
    }

    clearTempSlices()
    setAutoNames('')
    closeConfigPanel()
  }, [
    currentConfigTab,
    tempSlices,
    savedImages,
    autoNames,
    addSavedImages,
    setSpriteLabel,
    clearTempSlices,
    closeConfigPanel,
    autoMapVisemesFromLabels,
  ])

  if (!isConfigPanelOpen || !currentConfigTab || !uploadedImage) {
    return null
  }

  const tabLabels: Record<string, string> = {
    viseme: 'Viseme',
    eye: 'Eye',
    eyebrow: 'Eyebrow',
    hair: 'Hair',
    body: 'Body',
    shirt: 'Shirt',
    pants: 'Pants',
    shoes: 'Shoes',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h3 className="text-lg font-medium text-zinc-200">Configure {tabLabels[currentConfigTab]} Images</h3>
          <IconButton icon={X} variant="ghost" size="sm" onClick={closeConfigPanel} tooltip="Close config panel" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preview */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Uploaded Image</label>
            <div className="relative bg-zinc-900 rounded-lg p-2 flex items-center justify-center">
              <img src={uploadedImage} alt="Uploaded" className="max-w-full max-h-48 object-contain rounded" />
            </div>
          </div>

          {/* Cutting Mode */}
          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Cutting Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCuttingMode('grid')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors',
                  cuttingMode === 'grid'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600',
                )}
              >
                <Grid3X3 size={18} />
                Grid
              </button>
              <button
                onClick={() => setCuttingMode('pixel')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-colors',
                  cuttingMode === 'pixel'
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600',
                )}
              >
                <Square size={18} />
                Pixel
              </button>
            </div>
          </div>

          {/* Settings based on mode */}
          {cuttingMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4">
              <PanelSlider
                label="Rows"
                inline
                value={gridRows}
                onChange={(v) => setGridSettings(v, gridColumns)}
                min={1}
                max={20}
                step={1}
              />
              <PanelSlider
                label="Cols"
                inline
                value={gridColumns}
                onChange={(v) => setGridSettings(gridRows, v)}
                min={1}
                max={20}
                step={1}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <PanelSlider
                label="W"
                inline
                value={pixelWidth}
                onChange={(v) => setPixelSettings(v, pixelHeight)}
                min={16}
                max={1024}
                step={16}
                suffix="px"
              />
              <PanelSlider
                label="H"
                inline
                value={pixelHeight}
                onChange={(v) => setPixelSettings(pixelWidth, v)}
                min={16}
                max={1024}
                step={16}
                suffix="px"
              />
            </div>
          )}

          {/* Cut Error */}
          {cutError && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {cutError}
            </div>
          )}

          {/* Cut Preview */}
          {tempSlices.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-zinc-400">Cut Result ({tempSlices.length} slices)</label>
                <button onClick={clearTempSlices} className="text-xs text-zinc-500 hover:text-zinc-300">
                  Clear
                </button>
              </div>

              {/* Auto-naming input — shown above grid so it's always visible */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-zinc-400 flex items-center gap-1">
                    <Tag size={14} />
                    Name sprites (comma separated)
                  </label>
                  {currentConfigTab === 'viseme' && (
                    <button
                      onClick={() => setAutoNames(defaultVisemeNames)}
                      className="text-xs text-green-400 hover:text-green-300"
                    >
                      Use viseme defaults
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={autoNames}
                  onChange={(e) => setAutoNames(e.target.value)}
                  placeholder={currentConfigTab === 'viseme' ? defaultVisemeNames : 'Name1, Name2, Name3...'}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:border-green-500 focus:outline-none text-sm"
                />
                <p className="text-xs text-zinc-500">{tempSlices.length} sprites — names will be applied in order</p>
              </div>

              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-900 rounded-lg">
                {tempSlices.map((slice: string, index: number) => {
                  // Show preview name if available
                  const names = autoNames
                    .split(',')
                    .map((n) => n.trim())
                    .filter(Boolean)
                  const previewName = names[index]
                  return (
                    <div
                      key={index}
                      className="relative aspect-square bg-zinc-800 rounded border border-zinc-700 overflow-hidden"
                    >
                      <img src={slice} alt={`Slice ${index + 1}`} className="w-full h-full object-contain" />
                      <span className="absolute bottom-0 right-0 text-[10px] bg-black/50 px-1 text-zinc-400">
                        {previewName || index + 1}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-700 bg-zinc-800/50">
          <button
            onClick={closeConfigPanel}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>

          {tempSlices.length === 0 ? (
            <button
              onClick={handleCut}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                isProcessing
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600',
              )}
            >
              <Scissors size={16} />
              {isProcessing ? 'Cutting...' : 'Cut'}
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 rounded-lg text-sm font-medium text-white hover:bg-green-600 transition-colors"
            >
              <Save size={16} />
              Save ({tempSlices.length})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
