import { useState, useCallback, useRef, useEffect } from 'react'
import { Loader2, Sparkles, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { PRESETS } from './constants'
import { SettingsSection } from './SettingsSection'
import { BrandDirectorSection } from './BrandDirectorSection'
import { URLInputSection } from './URLInputSection'
import type { OrchestratorSettings, URLExtractedContent } from '@/types/orchestrator'
import type { DocumentExtraction } from '@/types/document'
import { DocumentPreview } from './DocumentPreview'

interface PromptPhaseProps {
  prompt: string
  isRunning: boolean
  settings: OrchestratorSettings
  savedCharacters: Array<{
    id: string
    name: string
    referenceImage?: string | null
  }>
  saved3DCharacters: Array<{
    id: string
    name: string
    thumbnailDataUrl?: string
  }>
  setPrompt: (prompt: string) => void
  updateSettings: (updates: Partial<OrchestratorSettings>) => void
  onGeneratePlan: () => void
  // Library data
  marketplaceItems: Array<{ id: string; title: string; category: string }>
  animationLibrary: Array<{ id: string; name: string }>
  audioAssets: Array<{ id: string; name: string }>
}

export function PromptPhase({
  prompt,
  isRunning,
  settings,
  savedCharacters,
  saved3DCharacters,
  setPrompt,
  updateSettings,
  onGeneratePlan,
  marketplaceItems,
  animationLibrary,
  audioAssets,
}: PromptPhaseProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  const [documentExtraction, setDocumentExtraction] = useState<DocumentExtraction | null>(null)
  const [isParsingDocument, setIsParsingDocument] = useState(false)

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [prompt, autoResize])

  // Handle URL extraction result
  const handleURLExtracted = useCallback((content: URLExtractedContent) => {
    updateSettings({
      sourceUrl: content.url,
      extractedContent: content,
      extractedImages: content.extractedImages,
      contentType: content.contentType as OrchestratorSettings['contentType'],
    })
    if (content.suggestedPrompt) {
      setPrompt(content.suggestedPrompt)
    }
  }, [updateSettings, setPrompt])

  // Handle document upload
  const handleDocumentUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) return
    setIsParsingDocument(true)
    try {
      const { parseRichPDF } = await import('@/services/documentParser')
      const extraction = await parseRichPDF(file)
      setDocumentExtraction(extraction)
      updateSettings({ contentType: 'document', extractedDocument: extraction })
    } catch (err) {
      console.error('[PromptPhase] PDF parse error:', err)
    } finally {
      setIsParsingDocument(false)
    }
  }, [updateSettings])

  // Handle document generate
  const handleDocumentGenerate = useCallback(async (_pages: import('@/types/document').DocumentPage[], targetDuration: number, narrate: boolean) => {
    if (!documentExtraction) return
    const { buildDocumentPrompt } = await import('@/services/documentToVideo')
    const docPrompt = buildDocumentPrompt(
      documentExtraction,
      { pagesPerScene: 2, targetDuration, includePageImages: true, narrationStyle: narrate ? 'conversational' : 'formal', transitionStyle: 'fade' },
    )
    setPrompt(docPrompt)
    updateSettings({ contentType: 'document', durationSeconds: targetDuration })
    onGeneratePlan()
  }, [documentExtraction, setPrompt, updateSettings, onGeneratePlan])

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Prompt Input */}
      <div className="relative group">
        <div
          className={cn(
            'absolute -inset-px rounded-lg transition-opacity duration-300 pointer-events-none',
            'bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-amber-500/20',
            'opacity-0 group-focus-within:opacity-100',
          )}
        />
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onInput={autoResize}
            placeholder="Create a 30-second explainer video about space exploration with two characters..."
            className="w-full min-h-[7rem] bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-2.5 pr-12 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/60 transition-colors"
            disabled={isRunning}
          />
          {/* Character count */}
          <span className="absolute bottom-2 right-2 text-[10px] text-gray-600">
            {prompt.length}
          </span>
        </div>
      </div>

      {/* URL Input Section */}
      <URLInputSection
        onExtracted={handleURLExtracted}
        onUsePrompt={(suggestedPrompt) => setPrompt(suggestedPrompt)}
      />

      {/* Document Upload Button */}
      <div className="flex gap-1.5">
        <button
          onClick={() => docInputRef.current?.click()}
          disabled={isRunning || isParsingDocument}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#1e1e1e] border border-[#3a3a3a] hover:border-blue-500/40 text-gray-400 hover:text-white text-[10px] transition-colors"
        >
          {isParsingDocument ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
          Upload PDF
        </button>
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleDocumentUpload(file)
          }}
          className="hidden"
        />
      </div>

      {/* Document Preview */}
      {documentExtraction && (
        <DocumentPreview
          extraction={documentExtraction}
          onGenerate={handleDocumentGenerate}
        />
      )}

      {/* Brand Director */}
      <BrandDirectorSection setPrompt={setPrompt} updateSettings={updateSettings} />

      {/* Preset Cards */}
      <div>
        <p className="text-[10px] text-gray-500 mb-2">Quick presets</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
          {PRESETS.map((preset) => {
            const Icon = preset.icon
            return (
              <button
                key={preset.label}
                onClick={() => setPrompt(preset.prompt)}
                className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[#1e1e1e]/60 border border-[#3a3a3a]/40 hover:border-[#3a3a3a]/60 hover:bg-[#2a2a2a]/60 transition-all duration-200 group text-left hover:scale-[1.02]"
              >
                <Icon
                  size={14}
                  className="text-gray-500 group-hover:text-amber-400 transition-colors mt-0.5 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-300 group-hover:text-white transition-colors">
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-gray-600 group-hover:text-gray-500 truncate transition-colors">
                    {preset.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Settings */}
      <SettingsSection
        settings={settings}
        updateSettings={updateSettings}
        savedCharacters={savedCharacters}
        saved3DCharacters={saved3DCharacters}
        marketplaceItems={marketplaceItems}
        animationLibrary={animationLibrary}
        audioAssets={audioAssets}
      />

      {/* Generate Button */}
      <button
        onClick={onGeneratePlan}
        disabled={isRunning || !prompt.trim()}
        className={cn(
          'w-full py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
          isRunning || !prompt.trim()
            ? 'bg-[#3a3a3a] text-gray-400 cursor-not-allowed'
            : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/10 hover:shadow-amber-500/20',
        )}
      >
        {isRunning ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Planning...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Plan Clip
            <CreditCostTag operation="orchestrator-plan" />
          </>
        )}
      </button>

      <p className="text-[10px] text-gray-500 -mt-2">
        Gemini will analyze your prompt and plan every element of the clip — characters, dialogue,
        backgrounds, text, and more.
      </p>
    </div>
  )
}
