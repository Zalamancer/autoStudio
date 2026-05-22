/**
 * ThumbnailPanel — Grid of generated thumbnail variants with download.
 */

import { useState } from 'react'
import { Download, RefreshCw, Check } from 'lucide-react'
import { useThumbnailStore } from '@/stores/useThumbnailStore'
import { generateThumbnailVariants } from '@/services/thumbnailGenerator'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'

export function ThumbnailPanel() {
  const {
    variants,
    selectedVariantId,
    isGenerating,
    setVariants,
    selectVariant,
    setIsGenerating,
  } = useThumbnailStore()

  const fps = usePlaybackStore((s) => s.fps)
  const duration = usePlaybackStore((s) => s.duration)
  const totalFrames = Math.round(duration * fps)
  const aspectRatio = useEditorStore((s) => s.aspectRatio)
  const width = useCanvasStore((s) => s.canvasWidth)
  const height = useCanvasStore((s) => s.canvasHeight)

  const [error, setError] = useState<string | null>(null)
  const [titleInput, setTitleInput] = useState('')

  // Derive title text from composition content
  const deriveTitleText = (): string => {
    if (titleInput.trim()) return titleInput.trim()

    // Try text overlays (title/subtitle)
    const overlays = useTextOverlayStore.getState().overlays
    const titleOverlay = overlays.find((o) => o.presetType === 'title' || o.presetType === 'subtitle')
    if (titleOverlay?.content) return titleOverlay.content

    // Try first dialogue line
    const dialogueLines = useMultiCharacterStore.getState().dialogueLines
    const sortedLines = [...dialogueLines].sort((a, b) => a.order - b.order)
    if (sortedLines.length > 0 && sortedLines[0].script) {
      return sortedLines[0].script.replace(/\[.*?\]/g, '').trim().split('.')[0]
    }

    // Try orchestrator plan
    const plan = useOrchestratorStore.getState().plan
    if (plan?.dialogue?.[0]?.script) {
      return plan.dialogue[0].script.replace(/\[.*?\]/g, '').trim().split('.')[0]
    }

    return ''
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const titleText = deriveTitleText()
      const brandContext = useOrchestratorStore.getState().settings.brandContext
      const brandColors = brandContext?.primaryColors?.length
        ? brandContext.primaryColors
        : ['#FFFFFF', '#6366f1']

      const results = await generateThumbnailVariants({
        width: width || 1280,
        height: height || 720,
        totalFrames,
        fps,
        titleText,
        brandColors,
        aspectRatio,
      })
      setVariants(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate thumbnails')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (dataUrl: string, label: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `thumbnail-${label.toLowerCase().replace(/\s+/g, '-')}.jpg`
    link.click()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Thumbnails</h3>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium
                     bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={12} className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Generating...' : variants.length > 0 ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {/* Title text input */}
      <input
        type="text"
        value={titleInput}
        onChange={(e) => setTitleInput(e.target.value)}
        placeholder="Title text (auto-detected if empty)"
        className="w-full px-2.5 py-1.5 rounded-md text-xs bg-[#2a2a2a] border border-white/10
                   text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {variants.length === 0 && !isGenerating && (
        <p className="text-xs text-gray-500">
          Generate thumbnails from your current composition.
        </p>
      )}

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 gap-2">
        {variants.map((variant) => (
          <div
            key={variant.id}
            onClick={() => selectVariant(variant.id)}
            className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
              selectedVariantId === variant.id
                ? 'border-indigo-500'
                : 'border-transparent hover:border-white/20'
            }`}
          >
            <img
              src={variant.dataUrl}
              alt={variant.label}
              className="w-full aspect-video object-cover"
            />
            {/* Score badge */}
            <div className="absolute top-1.5 right-1.5 bg-black/70 rounded-full px-1.5 py-0.5">
              <span className="text-[10px] font-bold text-white">{variant.score}</span>
            </div>
            {/* Selected indicator */}
            {selectedVariantId === variant.id && (
              <div className="absolute top-1.5 left-1.5 bg-indigo-500 rounded-full p-0.5">
                <Check size={10} className="text-white" />
              </div>
            )}
            {/* Label + download */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 flex items-center justify-between">
              <span className="text-[11px] font-medium text-white">{variant.label}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(variant.dataUrl, variant.label)
                }}
                className="p-0.5 rounded hover:bg-white/20 transition-colors"
              >
                <Download size={12} className="text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
