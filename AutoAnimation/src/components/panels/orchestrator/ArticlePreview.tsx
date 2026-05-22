/**
 * ArticlePreview.tsx
 *
 * Article-specific preview with section management, duration slider,
 * and section enable/disable toggles.
 */

import { useState, useCallback } from 'react'
import { Clock, Eye, EyeOff, BookOpen, ChevronDown, ChevronUp, Film } from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'
import type { ArticleExtraction, ArticleSection } from '@/types/orchestrator'

interface ArticlePreviewProps {
  extraction: ArticleExtraction
  onGenerate: (sections: ArticleSection[], targetDuration: number) => void
}

export function ArticlePreview({ extraction, onGenerate }: ArticlePreviewProps) {
  const [sections, setSections] = useState<ArticleSection[]>(extraction.sections)
  const [targetDuration, setTargetDuration] = useState(extraction.suggestedVideoDuration)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleSection = useCallback((index: number) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, enabled: !s.enabled } : s,
      ),
    )
  }, [])

  const enabledSections = sections.filter((s) => s.enabled)
  const enabledWordCount = enabledSections.reduce((sum, s) => sum + s.wordCount, 0)

  return (
    <div className="bg-panel-bg border border-panel-border rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-green-400" />
          <h4 className="text-xs font-medium text-white truncate">{extraction.title}</h4>
        </div>
        <div className="flex items-center gap-3 text-[9px] text-gray-500">
          {extraction.author && <span>By {extraction.author}</span>}
          <span>{extraction.totalWordCount.toLocaleString()} words</span>
          <span>
            <Clock size={9} className="inline mr-0.5" />
            {extraction.estimatedReadingTime} min read
          </span>
        </div>
      </div>

      {/* Duration Slider */}
      <PanelSlider
        label="Video Duration"
        value={targetDuration}
        onChange={setTargetDuration}
        min={30}
        max={120}
        step={5}
        suffix="s"
      />

      {/* Sections */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-400">
          {enabledSections.length}/{sections.length} sections ({enabledWordCount.toLocaleString()} words)
        </p>
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {sections.map((section, i) => {
            const isExpanded = expandedIndex === i
            const allocatedTime = enabledWordCount > 0
              ? Math.max(3, Math.round((section.wordCount / enabledWordCount) * targetDuration))
              : 0

            return (
              <div
                key={i}
                className={cn(
                  'rounded-md border transition-colors',
                  section.enabled
                    ? 'bg-panel-surface border-panel-border'
                    : 'bg-[#1a1a1a] border-panel-surface opacity-60',
                )}
              >
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <button
                    onClick={() => toggleSection(i)}
                    className="text-gray-400 hover:text-white"
                  >
                    {section.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className="flex-1 flex items-center gap-1 text-left min-w-0"
                  >
                    <span className="text-[10px] text-white truncate flex-1">
                      {section.heading}
                    </span>
                    <span className="text-[9px] text-gray-500 flex-shrink-0">
                      {section.wordCount}w
                    </span>
                    {section.enabled && (
                      <span className="text-[9px] text-amber-500 flex-shrink-0">
                        ~{allocatedTime}s
                      </span>
                    )}
                    {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="px-2 pb-2">
                    <p className="text-[10px] text-gray-400 line-clamp-4">
                      {section.text.slice(0, 300)}{section.text.length > 300 ? '...' : ''}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={() => onGenerate(sections, targetDuration)}
        disabled={enabledSections.length === 0}
        className={cn(
          'w-full py-2 rounded-md text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5',
          enabledSections.length === 0
            ? 'bg-panel-surface-hover text-gray-500 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-500 text-white',
        )}
      >
        <Film size={14} />
        Generate Article Video
      </button>
    </div>
  )
}
