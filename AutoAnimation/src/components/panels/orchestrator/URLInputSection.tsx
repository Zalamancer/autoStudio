/**
 * URLInputSection.tsx
 *
 * URL input area for URL-to-Video extraction in the orchestrator prompt phase.
 * Supports paste detection, extraction preview, and article-specific preview.
 */

import { useState, useCallback } from 'react'
import { Link2, Loader2, ExternalLink, Image, ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractContentFromURL } from '@/services/urlExtractor'
import { isValidUrl } from '@/services/urlExtractor'
import type { ExtractedContent } from '@/types/urlToVideo'

interface URLInputSectionProps {
  onExtracted: (content: ExtractedContent) => void
  onUsePrompt: (prompt: string) => void
}

const CONTENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  product: { label: 'Product', color: 'bg-blue-500/20 text-blue-300' },
  article: { label: 'Article', color: 'bg-green-500/20 text-green-300' },
  news: { label: 'News', color: 'bg-red-500/20 text-red-300' },
  recipe: { label: 'Recipe', color: 'bg-orange-500/20 text-orange-300' },
  'social-post': { label: 'Social', color: 'bg-purple-500/20 text-purple-300' },
  generic: { label: 'Web Page', color: 'bg-gray-500/20 text-gray-300' },
}

export function URLInputSection({ onExtracted, onUsePrompt }: URLInputSectionProps) {
  const [url, setUrl] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedContent | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleExtract = useCallback(async () => {
    if (!url.trim() || !isValidUrl(url.trim())) {
      setError('Please enter a valid URL (http:// or https://)')
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const content = await extractContentFromURL(url.trim())
      setExtracted(content)
      onExtracted(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setIsExtracting(false)
    }
  }, [url, onExtracted])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted && isValidUrl(pasted.trim())) {
      setUrl(pasted.trim())
    }
  }, [])

  const handleClear = useCallback(() => {
    setUrl('')
    setExtracted(null)
    setError(null)
  }, [])

  const typeInfo = extracted ? CONTENT_TYPE_LABELS[extracted.contentType] || CONTENT_TYPE_LABELS.generic : null

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
        URL to Video
      </p>

      {/* URL Input */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => { if (e.key === 'Enter') handleExtract() }}
            placeholder="Paste any URL..."
            className="w-full bg-panel-bg border border-panel-border rounded-md pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/60"
            disabled={isExtracting}
          />
          {url && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          onClick={handleExtract}
          disabled={isExtracting || !url.trim()}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
            isExtracting || !url.trim()
              ? 'bg-panel-surface-hover text-gray-500 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white',
          )}
        >
          {isExtracting ? <Loader2 size={14} className="animate-spin" /> : 'Extract'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}

      {/* Extraction Preview */}
      {extracted && (
        <div className="bg-panel-bg border border-panel-border rounded-lg p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start gap-2">
            {extracted.primaryImageUrl && (
              <img
                src={extracted.primaryImageUrl}
                alt=""
                className="w-14 h-14 rounded object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {typeInfo && (
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full', typeInfo.color)}>
                    {typeInfo.label}
                  </span>
                )}
                {extracted.siteName && (
                  <span className="text-[9px] text-gray-500">{extracted.siteName}</span>
                )}
              </div>
              <h4 className="text-xs font-medium text-white truncate">{extracted.title}</h4>
              <p className="text-[10px] text-gray-400 line-clamp-2">{extracted.summary}</p>
            </div>
          </div>

          {/* Key Points (collapsible) */}
          {extracted.keyPoints.length > 0 && (
            <div>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-300"
              >
                {showDetails ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                {extracted.keyPoints.length} key points
              </button>
              {showDetails && (
                <ul className="mt-1 space-y-0.5">
                  {extracted.keyPoints.map((point, i) => (
                    <li key={i} className="text-[10px] text-gray-400 flex gap-1">
                      <span className="text-amber-500">-</span>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Extracted Images */}
          {extracted.extractedImages && extracted.extractedImages.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {extracted.extractedImages.slice(0, 4).map((imgUrl, i) => (
                <img
                  key={i}
                  src={imgUrl}
                  alt=""
                  className="w-10 h-10 rounded object-cover flex-shrink-0 border border-panel-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ))}
              {extracted.extractedImages.length > 0 && (
                <span className="text-[9px] text-gray-500 self-center ml-1">
                  <Image size={10} className="inline mr-0.5" />
                  {extracted.extractedImages.length} images
                </span>
              )}
            </div>
          )}

          {/* Product-specific info */}
          {extracted.productPrice && (
            <p className="text-[11px] text-green-400 font-medium">{extracted.productPrice}</p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-[9px] text-gray-500">
            <span>~{extracted.suggestedDuration}s</span>
            <span>{extracted.suggestedAspectRatio}</span>
            <span>{extracted.tone}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={() => onUsePrompt(extracted.suggestedPrompt)}
              className="flex-1 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium transition-colors"
            >
              Use as Prompt
            </button>
            <a
              href={extracted.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md bg-panel-surface hover:bg-panel-surface-hover text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
