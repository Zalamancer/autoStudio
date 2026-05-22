/**
 * ThumbnailPicker — Displayed in the completion phase to let users
 * select from auto-generated thumbnail variants.
 */
import { useState, useCallback, useEffect } from 'react'
import { Image, Loader2, Download, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateThumbnailVariants, type ThumbnailVariant } from '@/services/thumbnailGenerator'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useTimelineStore } from '@/stores'
import { ASPECT_RATIO_DIMENSIONS } from '@/services/orchestrator/constants'

export function ThumbnailPicker() {
  const [variants, setVariants] = useState<ThumbnailVariant[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const plan = useOrchestratorStore((s) => s.plan)

  const handleGenerate = useCallback(async () => {
    if (!plan || isGenerating) return
    setIsGenerating(true)

    try {
      const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas.aspectRatio] || { w: 1280, h: 720 }
      const totalFrames = useTimelineStore.getState().totalFrames
      const fps = plan.canvas.fps || 30
      const settings = useOrchestratorStore.getState().settings

      const titleText =
        settings.brandContext?.tagline ||
        plan.textOverlays.find((t) => t.preset === 'title')?.content ||
        plan.dialogue[0]?.script?.replace(/\[.*?\]/g, '').trim().split('.')[0] ||
        ''

      const results = await generateThumbnailVariants({
        width: dims.w,
        height: dims.h,
        totalFrames,
        fps,
        titleText,
        brandColors: settings.brandContext?.primaryColors,
        aspectRatio: plan.canvas.aspectRatio,
      })

      setVariants(results)
      if (results.length > 0) {
        setSelectedId(results[0].id)
      }
      setGenerated(true)
    } catch {
      // Non-fatal
    } finally {
      setIsGenerating(false)
    }
  }, [plan, isGenerating])

  const handleDownload = useCallback(() => {
    const selected = variants.find((v) => v.id === selectedId)
    if (!selected) return

    const a = document.createElement('a')
    a.href = selected.dataUrl
    a.download = `thumbnail-${selected.label.toLowerCase().replace(/\s+/g, '-')}.jpg`
    a.click()
  }, [variants, selectedId])

  // Auto-generate on mount if plan exists
  useEffect(() => {
    if (plan && !generated && !isGenerating) {
      handleGenerate()
    }
  }, [plan, generated, isGenerating, handleGenerate])

  if (!plan) return null

  return (
    <div className="pt-2 border-t border-emerald-800/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Image size={12} className="text-blue-400" />
          <span className="text-[10px] text-gray-400 font-medium">Smart Thumbnails</span>
        </div>
        {!generated && (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40"
          >
            {isGenerating ? (
              <span className="flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate'
            )}
          </button>
        )}
      </div>

      {variants.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {variants.map((v, i) => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={cn(
                'relative rounded-md overflow-hidden border-2 transition-all',
                selectedId === v.id
                  ? 'border-blue-500 ring-1 ring-blue-500/30'
                  : 'border-transparent hover:border-white/20',
              )}
            >
              <img
                src={v.dataUrl}
                alt={v.label}
                className="w-full aspect-video object-cover"
              />
              {selectedId === v.id && (
                <div className="absolute top-0.5 right-0.5 bg-blue-500 rounded-full p-0.5">
                  <Check size={8} className="text-white" />
                </div>
              )}
              {i === 0 && (
                <div className="absolute top-0.5 left-0.5 bg-amber-500 rounded px-1 py-0.5">
                  <span className="text-[7px] text-white font-bold">BEST</span>
                </div>
              )}
              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center py-0.5 flex items-center justify-center gap-1">
                {v.label}
                <span className={cn(
                  'text-[7px] font-bold',
                  v.score >= 70 ? 'text-emerald-400' : v.score >= 40 ? 'text-amber-400' : 'text-red-400',
                )}>
                  {v.score}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedId && variants.length > 0 && (
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 transition-colors"
        >
          <Download size={10} />
          Download Thumbnail
        </button>
      )}
    </div>
  )
}
