import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Pencil, Eraser, FileImage, Image, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSpriteRecolor } from '@/hooks/useSpriteRecolor'
import { ColorSwatches } from '@/components/ui/ColorSwatches'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import type { CharacterPartTab } from '@/stores/useCharacterConfigStore'
import { QuickTagOverlay } from './QuickTagOverlay'
import { useIsMobile } from '@/hooks/useIsMobile'
import { removeBackgroundRecraft, vectorizeImage, isRecraftAvailable } from '@/services/recraft'
import { dataUrlToBlob, blobToDataUrl } from '@/utils/blobUtils'

interface AssetDetailsPanelProps {
  image: string
  label: string
  index: number
  tab: CharacterPartTab
  onLabelChange: (label: string) => void
  onImageChange?: (newImage: string) => void
  onClose: () => void
  anchorY: number // Y position of clicked asset in viewport
}

export function AssetDetailsPanel({
  image,
  label,
  index,
  tab,
  onLabelChange,
  onImageChange,
  onClose,
  anchorY,
}: AssetDetailsPanelProps) {
  const [editingLabel, setEditingLabel] = useState(label)
  const [isEditingName, setIsEditingName] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [recraftAvailable, setRecraftAvailable] = useState(false)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const customTags = useCharacterConfigStore((s) => s.customTags[tab])

  // Check Recraft availability
  useEffect(() => {
    isRecraftAvailable().then(setRecraftAvailable)
  }, [])

  const isSvg = image.startsWith('data:image/svg+xml')

  const handleRemoveBg = useCallback(async () => {
    setProcessingAction('bg')
    setActionError(null)
    try {
      const blob = dataUrlToBlob(image)
      const resultBlob = await removeBackgroundRecraft(blob)
      const resultDataUrl = await blobToDataUrl(resultBlob)
      onImageChange?.(resultDataUrl)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Background removal failed')
    } finally {
      setProcessingAction(null)
    }
  }, [image, onImageChange])

  const handleVectorize = useCallback(async () => {
    setProcessingAction('vectorize')
    setActionError(null)
    try {
      const svgDataUrl = await vectorizeImage(image)
      onImageChange?.(svgDataUrl)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Vectorization failed')
    } finally {
      setProcessingAction(null)
    }
  }, [image, onImageChange])

  const handleRasterize = useCallback(async () => {
    if (!isSvg) return
    setProcessingAction('rasterize')
    setActionError(null)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('Failed to load SVG'))
        el.src = image
      })
      const w = Math.min(img.naturalWidth || 1024, 4096)
      const h = Math.min(img.naturalHeight || 1024, 4096)
      const canvas = new OffscreenCanvas(w, h)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const blob = await canvas.convertToBlob({ type: 'image/png' })
      const resultDataUrl = await blobToDataUrl(blob)
      onImageChange?.(resultDataUrl)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rasterization failed')
    } finally {
      setProcessingAction(null)
    }
  }, [image, isSvg, onImageChange])

  const handleTagAssign = (newLabel: string) => {
    setEditingLabel(newLabel)
    onLabelChange(newLabel)
  }

  // Color extraction + recoloring for this individual sprite
  const {
    extractedColors,
    colorMap,
    isExtracting,
    isRecoloring,
    setColor,
    resetColor,
    resetAllColors,
  } = useSpriteRecolor({
    imageDataUrl: image,
    onRecolored: (newDataUrl) => {
      onImageChange?.(newDataUrl)
    },
    autoExtract: true,
  })

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Check if click is on the asset grid item itself
        const target = e.target as HTMLElement
        if (!target.closest('[data-asset-item]')) {
          onClose()
        }
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const handleSaveLabel = () => {
    onLabelChange(editingLabel)
    setIsEditingName(false)
  }

  // Calculate panel position - centered vertically on the anchor
  const panelTop = Math.max(100, Math.min(anchorY - 150, window.innerHeight - 400))

  // Connection line coordinates
  const rightPanelX = window.innerWidth - 280 // Right panel is 280px
  const panelRightEdge = rightPanelX - 20 - 250 + 250 // panel right edge
  const panelCenterY = panelTop + 150

  const isMobile = useIsMobile()
  const displayName = editingLabel || `Sprite ${index + 1}`

  return createPortal(
    <>
      {/* Connection Line SVG — desktop only */}
      {!isMobile && (
        <svg
          className="fixed inset-0 pointer-events-none z-[39]"
          style={{ width: '100%', height: '100%' }}
        >
          <line
            x1={panelRightEdge}
            y1={panelCenterY}
            x2={rightPanelX}
            y2={anchorY}
            stroke="url(#conn-grad)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            className={cn(
              'transition-all duration-300',
              isVisible ? 'opacity-60' : 'opacity-0'
            )}
          />
          <defs>
            <linearGradient id="conn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#6ee7b7" />
            </linearGradient>
          </defs>
          <circle
            cx={rightPanelX}
            cy={anchorY}
            r={3}
            fill="#34d399"
            className={cn(
              'transition-all duration-300',
              isVisible ? 'opacity-80' : 'opacity-0'
            )}
          />
        </svg>
      )}

      {/* Mobile: full-screen backdrop */}
      {isMobile && (
        <div
          className={cn(
            'fixed inset-0 z-[39] bg-black/60 transition-opacity duration-200',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
          onClick={onClose}
        />
      )}

      {/* Panel — full-screen on mobile, floating on desktop */}
      <div
        ref={panelRef}
        className={cn(
          'fixed z-40 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl shadow-black/40 overflow-y-auto transition-all duration-300',
          isMobile
            ? 'inset-0 rounded-none'
            : 'w-[260px] rounded-2xl',
          isVisible
            ? 'opacity-100 translate-x-0 scale-100'
            : isMobile
              ? 'opacity-0 scale-95'
              : 'opacity-0 translate-x-4 scale-95'
        )}
        style={isMobile ? undefined : { right: 300, top: panelTop }}
      >
        {/* Header — inline name with edit */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editingLabel}
              onChange={(e) => setEditingLabel(e.target.value)}
              onBlur={handleSaveLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLabel()
                if (e.key === 'Escape') setIsEditingName(false)
              }}
              placeholder={`Sprite ${index + 1}`}
              className="flex-1 bg-transparent text-sm font-medium text-zinc-100 focus:outline-none placeholder:text-zinc-600 min-w-0"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex-1 flex items-center gap-1.5 min-w-0 group/name"
            >
              <span className="text-sm font-medium text-zinc-200 truncate">{displayName}</span>
              <Pencil size={11} className="text-zinc-600 group-hover/name:text-zinc-400 transition-colors shrink-0" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Image Preview with Quick Tag Overlay */}
        <div className="p-3">
          <div
            className="relative rounded-xl overflow-hidden group"
            style={{
              backgroundImage: 'linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
              backgroundColor: '#1c1c1e',
            }}
          >
            <img
              src={image}
              alt={displayName}
              className="w-full h-auto object-contain max-h-[180px] relative z-[1]"
            />
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <QuickTagOverlay
                tab={tab}
                spriteIndex={index}
                currentLabel={editingLabel}
                onTagAssign={handleTagAssign}
                visible={true}
                customTags={customTags}
              />
            </div>
          </div>
        </div>

        {/* Recraft Actions */}
        {recraftAvailable && (
          <div className="px-3 pb-1.5 space-y-1.5">
            {actionError && (
              <div className="text-[10px] text-red-400 bg-red-500/10 rounded px-2 py-1 truncate" title={actionError}>
                {actionError}
              </div>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={handleRemoveBg}
                disabled={processingAction !== null}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg text-[10px] text-zinc-300 transition-colors"
                title="Remove background via Recraft (5 credits)"
              >
                {processingAction === 'bg' ? <Loader2 size={10} className="animate-spin" /> : <Eraser size={10} />}
                Remove BG
              </button>
              <button
                onClick={handleVectorize}
                disabled={processingAction !== null || isSvg}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg text-[10px] text-zinc-300 transition-colors"
                title="Convert to vector SVG via Recraft (5 credits)"
              >
                {processingAction === 'vectorize' ? <Loader2 size={10} className="animate-spin" /> : <FileImage size={10} />}
                Vectorize
              </button>
              <button
                onClick={handleRasterize}
                disabled={processingAction !== null || !isSvg}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-lg text-[10px] text-zinc-300 transition-colors"
                title="Convert SVG to PNG (free)"
              >
                {processingAction === 'rasterize' ? <Loader2 size={10} className="animate-spin" /> : <Image size={10} />}
                Rasterize
              </button>
            </div>
          </div>
        )}

        {/* Colors Section */}
        <div className="px-3 pb-2.5">
          <ColorSwatches
            extractedColors={extractedColors}
            colorMap={colorMap}
            isExtracting={isExtracting}
            isRecoloring={isRecoloring}
            onColorChange={setColor}
            onColorReset={resetColor}
            onResetAll={resetAllColors}
            compact
          />
        </div>
      </div>
    </>,
    document.body
  )
}
