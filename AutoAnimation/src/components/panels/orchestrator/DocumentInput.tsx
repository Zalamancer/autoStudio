/**
 * DocumentInput — Upload a document (PDF/TXT) and convert to video script.
 */

import { useState, useCallback, useRef } from 'react'
import { FileText, Upload, Loader2, X, Sparkles } from 'lucide-react'
import { parseDocument, summarizeForVideo, type DocumentVideoScript } from '@/services/documentParser'
import type { OrchestratorSettings } from '@/types/orchestrator'

interface DocumentInputProps {
  setPrompt: (prompt: string) => void
  updateSettings: (updates: Partial<OrchestratorSettings>) => void
}

export function DocumentInput({ setPrompt, updateSettings }: DocumentInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<DocumentVideoScript | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setResult(null)

    try {
      const doc = await parseDocument(file)
      if (doc.wordCount < 10) {
        setError('Document appears to be empty or too short')
        setIsProcessing(false)
        return
      }
      setExtractedText(doc.content.slice(0, 500) + (doc.content.length > 500 ? '...' : ''))

      const videoScript = await summarizeForVideo(doc)
      setResult(videoScript)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document')
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleApply = useCallback(() => {
    if (!result) return
    setPrompt(result.suggestedPrompt)
    if (result.suggestedDuration) {
      updateSettings({ durationSeconds: result.suggestedDuration })
    }
    setIsOpen(false)
    setResult(null)
    setExtractedText(null)
  }, [result, setPrompt, updateSettings])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-violet-400 transition-colors"
      >
        <FileText size={12} />
        Import from Document
      </button>
    )
  }

  return (
    <div className="space-y-2 p-3 bg-panel-bg/80 border border-panel-border/60 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1.5">
          <FileText size={12} className="text-violet-400" />
          Import from Document
        </span>
        <button
          onClick={() => { setIsOpen(false); setResult(null); setExtractedText(null); setError(null) }}
          className="text-gray-500 hover:text-gray-300"
        >
          <X size={12} />
        </button>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg p-4 text-center cursor-pointer transition-colors bg-zinc-800/20"
      >
        <Upload size={20} className="mx-auto mb-1.5 text-zinc-500" />
        <p className="text-xs text-zinc-400">Click to upload PDF, TXT, or HTML</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.html,.htm,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
          className="hidden"
        />
      </div>

      {/* Processing */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs text-violet-400">
          <Loader2 size={14} className="animate-spin" />
          Analyzing document...
        </div>
      )}

      {error && <p className="text-[10px] text-red-400">{error}</p>}

      {/* Extracted Preview */}
      {extractedText && !result && !isProcessing && (
        <div className="bg-black/20 rounded-md p-2.5 max-h-24 overflow-y-auto">
          <p className="text-[10px] text-zinc-400 leading-relaxed">{extractedText}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="bg-black/20 rounded-md p-2.5 space-y-1.5">
            <p className="text-xs font-medium text-white">{result.title}</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">{result.summary}</p>
            {result.keyPoints.length > 0 && (
              <ul className="space-y-0.5">
                {result.keyPoints.slice(0, 4).map((point, i) => (
                  <li key={i} className="text-[10px] text-gray-500 flex items-start gap-1">
                    <span className="text-violet-400 mt-0.5">-</span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 text-[9px] text-gray-600 pt-1">
              <span>~{result.suggestedDuration}s</span>
            </div>
          </div>
          <button
            onClick={handleApply}
            className="w-full py-2 rounded-md text-xs font-medium bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles size={12} />
            Use as Prompt
          </button>
        </div>
      )}
    </div>
  )
}
