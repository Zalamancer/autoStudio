/**
 * AIDirectorDocumentPanel — Right panel content for PDF upload, recent files, and document preview.
 * Header is provided by AIDirectorToolSectionHeader.
 *
 * Shows:
 *  1. Upload area (drag & drop or click)
 *  2. Recent documents list (persisted across sessions)
 *  3. Document preview + generate controls when a document is active
 */

import { useState, useCallback, useRef } from 'react'
import { FileText, Upload, Loader2, Clock, Trash2, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useRecentDocumentsStore } from '@/stores/useRecentDocumentsStore'
import { DocumentPreview } from '@/components/panels/orchestrator/DocumentPreview'
import type { DocumentExtraction, DocumentPage } from '@/types/document'

export function AIDirectorDocumentPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const extraction = useOrchestratorStore(
    (s) => s.settings.extractedDocument as DocumentExtraction | undefined,
  )
  const setPrompt = useOrchestratorStore((s) => s.setPrompt)
  const updateSettings = useOrchestratorStore((s) => s.updateSettings)
  const generatePlan = useOrchestratorStore((s) => s.generatePlan)

  const recentDocs = useRecentDocumentsStore((s) => s.documents)
  const addDocument = useRecentDocumentsStore((s) => s.addDocument)
  const removeDocument = useRecentDocumentsStore((s) => s.removeDocument)

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) return
      setIsParsing(true)
      try {
        const { parseRichPDF } = await import('@/services/documentParser')
        const result = await parseRichPDF(file)
        addDocument(result)
        updateSettings({ contentType: 'document', extractedDocument: result })
      } catch (err) {
        console.error('[AIDirectorDocumentPanel] PDF parse error:', err)
      } finally {
        setIsParsing(false)
      }
    },
    [addDocument, updateSettings],
  )

  const handleSelectRecent = useCallback(
    (doc: { extraction: DocumentExtraction }) => {
      updateSettings({ contentType: 'document', extractedDocument: doc.extraction })
    },
    [updateSettings],
  )

  const handleClearActive = useCallback(() => {
    updateSettings({ contentType: undefined, extractedDocument: undefined })
  }, [updateSettings])

  const handleGenerate = useCallback(
    async (_pages: DocumentPage[], targetDuration: number, narrate: boolean) => {
      if (!extraction) return
      const { buildDocumentPrompt } = await import('@/services/documentToVideo')
      const docPrompt = buildDocumentPrompt(extraction, {
        pagesPerScene: 2,
        targetDuration,
        includePageImages: true,
        narrationStyle: narrate ? 'conversational' : 'formal',
        transitionStyle: 'fade',
      })
      setPrompt(docPrompt)
      updateSettings({ contentType: 'document', durationSeconds: targetDuration })
      generatePlan()
    },
    [extraction, setPrompt, updateSettings, generatePlan],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload],
  )

  // ── Active document view ──
  if (extraction) {
    return (
      <div className="space-y-2 p-3">
        {/* Back bar */}
        <button
          onClick={handleClearActive}
          className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={12} />
          <span>All documents</span>
        </button>

        {/* Active doc title */}
        <div className="flex items-center gap-2">
          <FileText size={12} className="text-blue-400 shrink-0" />
          <span className="text-[11px] font-medium text-white truncate">
            {extraction.title || 'Document'}
          </span>
        </div>

        <DocumentPreview extraction={extraction} onGenerate={handleGenerate} />
      </div>
    )
  }

  // ── Upload + recent files view ──
  return (
    <div className="p-3 space-y-3">
      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isParsing && fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all',
          isParsing
            ? 'border-blue-500/30 bg-blue-500/5 cursor-wait'
            : isDragOver
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]',
        )}
      >
        {isParsing ? (
          <>
            <Loader2 size={20} className="text-blue-400 animate-spin" />
            <span className="text-[11px] text-blue-400">Parsing document...</span>
          </>
        ) : (
          <>
            <Upload size={20} className="text-gray-500" />
            <span className="text-[11px] text-gray-400">
              Drop PDF here or <span className="text-blue-400">browse</span>
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
          className="hidden"
        />
      </div>

      {/* Recent Documents */}
      {recentDocs.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-gray-500" />
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Recent</span>
          </div>

          {recentDocs.map((doc) => (
            <button
              key={doc.id}
              onClick={() => handleSelectRecent(doc)}
              className="w-full group flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-left"
            >
              {/* Thumbnail */}
              {doc.previewThumbnail ? (
                <img
                  src={doc.previewThumbnail}
                  alt=""
                  className="w-9 h-12 rounded-[3px] object-cover border border-white/10 shrink-0 bg-zinc-800"
                />
              ) : (
                <div className="w-9 h-12 rounded-[3px] border border-white/10 shrink-0 bg-zinc-800 flex items-center justify-center">
                  <FileText size={14} className="text-gray-600" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white truncate">{doc.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-gray-500">{doc.pageCount} pages</span>
                  <span className="text-[9px] text-gray-600">{formatRelativeTime(doc.uploadedAt)}</span>
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeDocument(doc.id)
                }}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                title="Remove"
              >
                <Trash2 size={10} />
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
