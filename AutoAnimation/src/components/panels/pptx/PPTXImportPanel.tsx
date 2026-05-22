/**
 * PPTXImportPanel.tsx
 *
 * PowerPoint import UI: file upload, slide carousel, per-slide settings,
 * and import/generate actions.
 */

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  Loader2,
  Presentation,
  Play,
  Import,
  Mic,
  MicOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect } from '@/components/ui/panel-controls'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { parsePPTX } from '@/services/pptxParser'
import { importPresentation } from '@/services/pptxImporter'
import { SlidePreview } from './SlidePreview'
import type { PresentationData } from '@/types/pptx'

export function PPTXImportPanel() {
  const [presentation, setPresentation] = useState<PresentationData | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [secondsPerSlide, setSecondsPerSlide] = useState(5)
  const [includeNarration, setIncludeNarration] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      setError('Please upload a .pptx file')
      return
    }

    setIsParsing(true)
    setError(null)

    try {
      const data = await parsePPTX(file)
      setPresentation(data)
      setSelectedSlide(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse PPTX file')
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!presentation) return
    setIsImporting(true)
    setError(null)

    try {
      await importPresentation(presentation, {
        secondsPerSlide,
        fps: 30,
        includeNarration,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }, [presentation, secondsPerSlide, includeNarration])

  const currentSlide = presentation?.slides[selectedSlide]
  const hasNotes = presentation?.slides.some((s) => s.speakerNotes.trim().length > 0)

  return (
    <PanelLayout title="PowerPoint Import" icon={Presentation}>
      <div className="space-y-3 p-3">
        {/* Upload */}
        {!presentation && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed border-panel-border rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors',
              isParsing && 'pointer-events-none opacity-60',
            )}
          >
            {isParsing ? (
              <Loader2 size={24} className="mx-auto mb-2 text-amber-400 animate-spin" />
            ) : (
              <Upload size={24} className="mx-auto mb-2 text-gray-500" />
            )}
            <p className="text-xs text-gray-400">
              {isParsing ? 'Parsing presentation...' : 'Upload a PowerPoint file'}
            </p>
            <p className="text-[9px] text-gray-600 mt-1">.pptx format</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="hidden"
            />
          </div>
        )}

        {/* Presentation loaded */}
        {presentation && (
          <>
            {/* Info Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white font-medium">
                  {presentation.slides.length} Slides
                </p>
                <p className="text-[9px] text-gray-500">
                  {presentation.slideWidth}x{presentation.slideHeight}px
                </p>
              </div>
              <button
                onClick={() => {
                  setPresentation(null)
                  setSelectedSlide(0)
                }}
                className="text-[10px] text-gray-400 hover:text-white"
              >
                Change File
              </button>
            </div>

            {/* Slide Carousel */}
            <div className="relative">
              {currentSlide && (
                <SlidePreview
                  slide={currentSlide}
                  width={presentation.slideWidth}
                  height={presentation.slideHeight}
                  theme={presentation.theme}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => setSelectedSlide(Math.max(0, selectedSlide - 1))}
                  disabled={selectedSlide === 0}
                  className="p-1 rounded bg-panel-surface disabled:opacity-30 hover:bg-panel-surface-hover"
                >
                  <ChevronLeft size={14} className="text-gray-400" />
                </button>
                <span className="text-[10px] text-gray-400">
                  Slide {selectedSlide + 1} of {presentation.slides.length}
                </span>
                <button
                  onClick={() => setSelectedSlide(Math.min(presentation.slides.length - 1, selectedSlide + 1))}
                  disabled={selectedSlide >= presentation.slides.length - 1}
                  className="p-1 rounded bg-panel-surface disabled:opacity-30 hover:bg-panel-surface-hover"
                >
                  <ChevronRight size={14} className="text-gray-400" />
                </button>
              </div>

              {/* Slide thumbnails strip */}
              <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                {presentation.slides.map((_slide, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlide(i)}
                    className={cn(
                      'w-10 h-7 rounded border flex-shrink-0 overflow-hidden',
                      i === selectedSlide
                        ? 'border-amber-500 ring-1 ring-amber-500/30'
                        : 'border-panel-border',
                    )}
                  >
                    <div className="w-full h-full bg-panel-surface flex items-center justify-center text-[7px] text-gray-500">
                      {i + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speaker Notes */}
            {currentSlide?.speakerNotes && (
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Speaker Notes</p>
                <p className="text-[10px] text-gray-400 bg-panel-surface rounded p-2 max-h-16 overflow-y-auto">
                  {currentSlide.speakerNotes}
                </p>
              </div>
            )}

            {/* Settings */}
            <div className="space-y-2">
              {/* Seconds per slide */}
              <PanelSelect
                label="Seconds per slide"
                value={String(secondsPerSlide)}
                onChange={(v) => setSecondsPerSlide(Number(v))}
                options={[3, 4, 5, 7, 10].map((s) => ({
                  value: String(s),
                  label: `${s}s`,
                }))}
              />

              {/* Total duration */}
              <p className="text-[9px] text-gray-500">
                Total: {presentation.slides.length * secondsPerSlide}s
                ({Math.round(presentation.slides.length * secondsPerSlide / 60 * 10) / 10} min)
              </p>

              {/* Narration toggle */}
              {hasNotes && (
                <button
                  onClick={() => setIncludeNarration(!includeNarration)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-colors w-full',
                    includeNarration
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-panel-surface text-gray-500 border border-panel-border',
                  )}
                >
                  {includeNarration ? <Mic size={10} /> : <MicOff size={10} />}
                  {includeNarration ? 'Generate narration from notes' : 'No narration'}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1.5">
              <button
                onClick={handleImport}
                disabled={isImporting}
                className={cn(
                  'flex-1 py-2 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5',
                  isImporting
                    ? 'bg-panel-surface-hover text-gray-500'
                    : 'bg-blue-600 hover:bg-blue-500 text-white',
                )}
              >
                {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Import size={14} />}
                Import
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className={cn(
                  'flex-1 py-2 rounded-md text-[11px] font-medium flex items-center justify-center gap-1.5',
                  isImporting
                    ? 'bg-panel-surface-hover text-gray-500'
                    : 'bg-amber-600 hover:bg-amber-500 text-white',
                )}
              >
                {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                Import + Generate
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <p className="text-[11px] text-red-400">{error}</p>
        )}
      </div>
    </PanelLayout>
  )
}
