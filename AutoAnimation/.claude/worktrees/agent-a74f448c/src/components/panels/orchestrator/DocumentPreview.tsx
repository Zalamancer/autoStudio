/**
 * DocumentPreview.tsx
 *
 * PDF document preview with page thumbnails, type badges,
 * page enable/disable, and duration controls.
 */

import { useState, useCallback } from 'react'
import { FileText, Eye, EyeOff, Film, Mic, MicOff } from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'
import type { DocumentExtraction, DocumentPage } from '@/types/document'

const PAGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  title: { label: 'Title', color: 'bg-amber-500/20 text-amber-300' },
  text: { label: 'Text', color: 'bg-blue-500/20 text-blue-300' },
  'image-heavy': { label: 'Images', color: 'bg-green-500/20 text-green-300' },
  table: { label: 'Table', color: 'bg-purple-500/20 text-purple-300' },
  chart: { label: 'Chart', color: 'bg-red-500/20 text-red-300' },
  diagram: { label: 'Diagram', color: 'bg-cyan-500/20 text-cyan-300' },
}

interface DocumentPreviewProps {
  extraction: DocumentExtraction
  onGenerate: (pages: DocumentPage[], targetDuration: number, narrate: boolean) => void
}

export function DocumentPreview({ extraction, onGenerate }: DocumentPreviewProps) {
  const [pages, setPages] = useState<DocumentPage[]>(extraction.pages)
  const [targetDuration, setTargetDuration] = useState(
    Math.min(120, Math.max(30, extraction.pageCount * 5)),
  )
  const [narrate, setNarrate] = useState(true)

  const togglePage = useCallback((pageNumber: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, enabled: !p.enabled } : p,
      ),
    )
  }, [])

  const enabledPages = pages.filter((p) => p.enabled)

  return (
    <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-blue-400" />
          <h4 className="text-xs font-medium text-white truncate">{extraction.title}</h4>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-gray-500">
          {extraction.author && <span>By {extraction.author}</span>}
          <span>{extraction.pageCount} pages</span>
          <span>{extraction.language.toUpperCase()}</span>
        </div>
      </div>

      {/* Duration Slider */}
      <PanelSlider
        label="Video Duration"
        value={targetDuration}
        onChange={setTargetDuration}
        min={15}
        max={120}
        step={5}
        suffix="s"
      />

      {/* Narration Toggle */}
      <button
        onClick={() => setNarrate(!narrate)}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-colors',
          narrate
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            : 'bg-[#2a2a2a] text-gray-500 border border-[#3a3a3a]',
        )}
      >
        {narrate ? <Mic size={10} /> : <MicOff size={10} />}
        {narrate ? 'Narration ON' : 'Narration OFF'}
      </button>

      {/* Page Thumbnails Grid */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-400">
          {enabledPages.length}/{pages.length} pages selected
        </p>

        {extraction.pageCount > 50 && (
          <p className="text-[9px] text-amber-500">
            Large document: showing first 50 pages. Select the most relevant pages.
          </p>
        )}

        <div className="grid grid-cols-4 gap-1.5 max-h-60 overflow-y-auto pr-1">
          {pages.map((page) => {
            const typeInfo = PAGE_TYPE_LABELS[page.pageType] || PAGE_TYPE_LABELS.text
            return (
              <button
                key={page.pageNumber}
                onClick={() => togglePage(page.pageNumber)}
                className={cn(
                  'relative rounded-md border overflow-hidden transition-all',
                  page.enabled
                    ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'border-[#3a3a3a] opacity-40',
                )}
              >
                {page.thumbnailDataUrl ? (
                  <img
                    src={page.thumbnailDataUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="w-full aspect-[3/4] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[3/4] bg-[#2a2a2a] flex items-center justify-center">
                    <span className="text-gray-500 text-xs">{page.pageNumber}</span>
                  </div>
                )}

                {/* Overlay info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 flex items-center justify-between">
                  <span className="text-[8px] text-gray-300">{page.pageNumber}</span>
                  <span className={cn('text-[7px] px-1 rounded', typeInfo.color)}>
                    {typeInfo.label}
                  </span>
                </div>

                {/* Enable/disable indicator */}
                <div className="absolute top-0.5 right-0.5">
                  {page.enabled
                    ? <Eye size={10} className="text-amber-400" />
                    : <EyeOff size={10} className="text-gray-600" />
                  }
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={() => onGenerate(pages, targetDuration, narrate)}
        disabled={enabledPages.length === 0}
        className={cn(
          'w-full py-2 rounded-md text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5',
          enabledPages.length === 0
            ? 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-500 text-white',
        )}
      >
        <Film size={14} />
        Generate Document Video
      </button>
    </div>
  )
}
