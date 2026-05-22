import { useState, useCallback, useMemo } from 'react'
import {
  Sparkles,
  Wand2,
  Loader2,
  FileText,
  Clock,
  Trash2,
  RotateCcw,
  Search,
  Plus,
  Maximize2,
  SlidersHorizontal,
  Pencil,
} from 'lucide-react'
import { PanelSelect, PanelCheckbox } from '@/components/ui/panel-controls'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { cn } from '@/lib/utils'
import { useVoiceStore, useEditorStore } from '@/stores'
import { getGeminiService, hasGeminiService, type GeminiGenerateOptions } from '@/services/gemini'

// ─── Tab bar ────────────────────────────────────────────────────
const TABS = [
  { id: 'editor', label: 'Editor', icon: Pencil },
  { id: 'history', label: 'History', icon: Clock },
] as const
type TabId = (typeof TABS)[number]['id']

export function ScriptsPanel() {
  const { script, setScript, scriptHistory, addScriptHistory, removeScriptHistory } = useVoiceStore()

  const isGeminiConnected = hasGeminiService()

  // Generation options
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState<GeminiGenerateOptions['style']>('casual')
  const [duration, setDuration] = useState<GeminiGenerateOptions['duration']>('medium')
  const [includeExpressions, setIncludeExpressions] = useState(true)

  // State
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sub-tab & search
  const [activeTab, setActiveTab] = useState<TabId>('editor')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // AI generate panel toggle
  const [showGenerateForm, setShowGenerateForm] = useState(false)

  const q = search.toLowerCase().trim()

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const service = getGeminiService()
      const result = await service.generateScript({
        topic,
        style,
        duration,
        includeExpressions,
      })

      const scriptText = includeExpressions ? result.rawScript : result.text
      setScript(scriptText)

      // Add to shared history
      addScriptHistory({
        id: `script_${Date.now()}`,
        text: scriptText,
        topic,
        style: style || 'casual',
        createdAt: Date.now(),
      })

      // Collapse the generate form after success
      setShowGenerateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script')
    } finally {
      setIsGenerating(false)
    }
  }, [topic, style, duration, includeExpressions, setScript, addScriptHistory])

  const handleEnhance = useCallback(async () => {
    if (!script.trim()) {
      setError('Please enter a script to enhance')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const service = getGeminiService()
      const result = await service.enhanceScript(script)
      setScript(result.rawScript)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance script')
    } finally {
      setIsGenerating(false)
    }
  }, [script, setScript])

  const loadFromHistory = useCallback(
    (item: { id: string; text: string; topic: string; style: string; createdAt: number }) => {
      setScript(item.text)
      setActiveTab('editor')
    },
    [setScript],
  )

  // Filtered history based on search
  const filteredHistory = useMemo(() => {
    if (!q) return scriptHistory
    return scriptHistory.filter(
      (item) =>
        item.topic.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        item.style.toLowerCase().includes(q),
    )
  }, [scriptHistory, q])

  // Filter indicator: search active on history tab
  const hasActiveFilter = activeTab === 'history' && q.length > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{
                  transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
                {tab.id === 'history' && scriptHistory.length > 0 && ` (${scriptHistory.length})`}
              </span>
            </button>
          )
        })}

        {/* Trailing actions */}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={() => {
              setActiveTab('editor')
              setShowGenerateForm(true)
            }}
            disabled={!isGeminiConnected}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              !isGeminiConnected
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-gray-400 hover:text-[#4a7eff] hover:bg-[#2a2a2a]',
            )}
            title="Generate with AI"
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={() => {
              setActiveTab('editor')
              setScript('')
            }}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="New script"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('script-generator')}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Search Bar + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'history' ? 'Search scripts...' : 'Search in script...'}
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
          {activeTab === 'history' && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen ? 'bg-[#4a7eff]/20 text-[#4a7eff]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
              )}
            >
              <SlidersHorizontal size={14} />
              {hasActiveFilter && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Status banners ── */}
      {(isGenerating || (error && !isGenerating)) && (
        <div className="shrink-0 px-3 pb-2">
          {isGenerating && (
            <div className="flex items-center gap-2 p-2.5 bg-[#4a7eff]/10 border border-[#4a7eff]/30 rounded-lg">
              <Loader2 size={14} className="animate-spin text-[#4a7eff] flex-shrink-0" />
              <span className="text-xs text-[#4a7eff]">Generating...</span>
            </div>
          )}
          {error && !isGenerating && (
            <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-xs text-red-400 flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-300 hover:text-red-100 text-xs">
                x
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── Editor tab ── */}
        {activeTab === 'editor' && (
          <div className="space-y-3">
            {/* Script Textarea */}
            <div className="space-y-2">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Write your script here, or use AI to generate one..."
                className="w-full h-40 bg-[#2a2a2a] rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-[#4a7eff] placeholder:text-gray-600 border border-white/5"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">{script.includes('[') && 'Expression cues detected'}</span>
                <span className="text-xs text-gray-500">{script.length} chars</span>
              </div>
            </div>

            {/* Enhance Script Button */}
            {isGeminiConnected && script.trim() && !script.includes('[') && (
              <button
                onClick={handleEnhance}
                disabled={isGenerating}
                className={cn(
                  'w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border',
                  isGenerating
                    ? 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed border-white/5'
                    : 'bg-[#4a7eff]/10 border-[#4a7eff]/30 text-[#4a7eff] hover:bg-[#4a7eff]/20',
                )}
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Enhance with Expression Cues
              </button>
            )}

            {/* AI Generate Form (collapsible) */}
            {isGeminiConnected && showGenerateForm && (
              <div className="space-y-3 p-3 bg-[#4a7eff]/5 border border-[#4a7eff]/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-[#4a7eff]">
                    <Wand2 size={14} />
                    <span className="font-medium">Generate with AI</span>
                  </div>
                  <button
                    onClick={() => setShowGenerateForm(false)}
                    className="text-gray-500 hover:text-gray-300 text-xs"
                  >
                    x
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-500">Topic / Prompt</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., introducing a new product, telling a joke..."
                    className="w-full bg-[#2a2a2a] border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-[#4a7eff] focus:outline-none placeholder:text-gray-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <PanelSelect
                    label="Style"
                    value={style ?? 'casual'}
                    onChange={(v) => setStyle(v as GeminiGenerateOptions['style'])}
                    options={[
                      { value: 'casual', label: 'Casual' },
                      { value: 'professional', label: 'Professional' },
                      { value: 'energetic', label: 'Energetic' },
                      { value: 'calm', label: 'Calm' },
                      { value: 'dramatic', label: 'Dramatic' },
                    ]}
                    fullWidth
                  />
                  <PanelSelect
                    label="Duration"
                    value={duration ?? 'medium'}
                    onChange={(v) => setDuration(v as GeminiGenerateOptions['duration'])}
                    options={[
                      { value: 'short', label: 'Short (~10s)' },
                      { value: 'medium', label: 'Medium (~30s)' },
                      { value: 'long', label: 'Long (~60s)' },
                    ]}
                    fullWidth
                  />
                </div>

                <PanelCheckbox
                  label="Include expression cues [happy], [surprised]"
                  checked={includeExpressions}
                  onChange={(v) => setIncludeExpressions(v)}
                />
              </div>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {activeTab === 'history' && (
          <div className="space-y-1">
            {filteredHistory.length === 0 && !q ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Clock size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No scripts yet</span>
                <span className="text-xs text-gray-600 mt-1">Generated scripts will appear here</span>
              </div>
            ) : filteredHistory.length === 0 && q ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <FileText size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No presets found</span>
                <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2 group',
                    'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                  )}
                >
                  <RotateCcw size={14} className="shrink-0 text-gray-500 group-hover:text-[#4a7eff]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-200 truncate">{item.topic}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3a3a3a] text-gray-500 flex-shrink-0">
                        {item.style}
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5 truncate">{item.text}</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeScriptHistory(item.id)
                    }}
                    className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {activeTab === 'editor' && isGeminiConnected && showGenerateForm && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
              isGenerating || !topic.trim()
                ? 'bg-[#2a2a2a] text-gray-500 border border-white/5 cursor-not-allowed'
                : 'bg-[#4a7eff] text-white hover:bg-[#3a6aee]',
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={13} />
                Generate Script
                <CreditCostTag operation="gemini-script" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
