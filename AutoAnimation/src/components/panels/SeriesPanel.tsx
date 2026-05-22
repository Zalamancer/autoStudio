/**
 * SeriesPanel — Browse saved series templates, fill slots, generate episodes,
 * and create AI-generated series outlines from a topic.
 *
 * Cinema-standardized: animated tab bar, search, filter toggle, thick rows, blue accent.
 */

import { useState, useMemo, useCallback } from 'react'
import {
  Repeat,
  Trash2,
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  AlertCircle,
  Sparkles,
  Loader2,
  BookOpen,
  Users,
  Search,
  SlidersHorizontal,
  Ban,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSeriesStore } from '@/stores/useSeriesStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { PanelSelect } from '@/components/ui/panel-controls'
import type { SeriesTemplate, SeriesOutline, NarrativeArc } from '@/types/series'

// ── Tab bar ──

const SERIES_TABS = [
  { id: 'templates', label: 'Templates', icon: Repeat },
  { id: 'generate', label: 'Generate', icon: Sparkles },
] as const

type SeriesTabId = (typeof SERIES_TABS)[number]['id']

// ── Slot Editor (existing) ──

function SlotEditor({
  template,
  slotValues,
  onSlotChange,
}: {
  template: SeriesTemplate
  slotValues: Record<string, string>
  onSlotChange: (key: string, value: string) => void
}) {
  return (
    <div className="space-y-2">
      {template.slots.map((slot) => (
        <div key={slot.key} className="space-y-1">
          <label className="text-[10px] font-medium text-zinc-400 flex items-center gap-1">
            {slot.label}
            {slot.required && <span className="text-red-400">*</span>}
          </label>
          <input
            type="text"
            value={slotValues[slot.key] || ''}
            onChange={(e) => onSlotChange(slot.key, e.target.value)}
            placeholder={slot.description || slot.defaultValue || `Enter ${slot.label.toLowerCase()}...`}
            className="w-full bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-accent/30 focus:outline-none placeholder:text-zinc-600 transition-colors"
          />
        </div>
      ))}
    </div>
  )
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Outline Episode Card ──

function EpisodeOutlineCard({
  episode,
  isExecuting,
  onExecute,
}: {
  episode: { episodeNumber: number; title: string; prompt: string; hooks: string[]; cta: string; arcPosition: string }
  isExecuting: boolean
  onExecute: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const arcColors: Record<string, string> = {
    intro: 'text-blue-400 bg-blue-500/10',
    build: 'text-amber-400 bg-amber-500/10',
    climax: 'text-red-400 bg-red-500/10',
    resolution: 'text-emerald-400 bg-emerald-500/10',
  }

  return (
    <div className="bg-panel-surface rounded-lg border border-white/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-panel-surface-hover transition-colors text-left"
      >
        <span className="text-[10px] font-bold text-zinc-400 w-5">{episode.episodeNumber}</span>
        <span className="text-xs text-zinc-200 flex-1 truncate">{episode.title}</span>
        <span
          className={cn('text-[9px] px-1.5 py-0.5 rounded-full', arcColors[episode.arcPosition] || 'text-gray-400')}
        >
          {episode.arcPosition}
        </span>
        {expanded ? (
          <ChevronUp size={10} className="text-zinc-500" />
        ) : (
          <ChevronDown size={10} className="text-zinc-500" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 space-y-2 border-t border-white/5">
          <p className="text-[10px] text-zinc-400 mt-2 line-clamp-4">{episode.prompt}</p>

          {episode.hooks.length > 0 && (
            <div>
              <span className="text-[9px] text-zinc-500 uppercase">Hooks:</span>
              {episode.hooks.map((h, i) => (
                <p key={i} className="text-[10px] text-accent italic">
                  &ldquo;{h}&rdquo;
                </p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[9px] text-zinc-500">
              CTA: <span className="text-zinc-400">{episode.cta}</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onExecute()
              }}
              disabled={isExecuting}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-accent hover:bg-[#5a8eff] text-white disabled:opacity-50 transition-colors"
            >
              {isExecuting ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}
              Generate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Generate Series Tab ──

function GenerateSeriesTab() {
  const [topic, setTopic] = useState('')
  const [episodeCount, setEpisodeCount] = useState(5)
  const [arc, setArc] = useState<NarrativeArc>('progressive')
  const [error, setError] = useState<string | null>(null)
  const [executingEpisode, setExecutingEpisode] = useState<number | null>(null)

  const isGenerating = useSeriesStore((s) => s.isGeneratingOutline)
  const outlines = useSeriesStore((s) => s.outlines)
  const generateOutline = useSeriesStore((s) => s.generateOutline)
  const getOutlinePrompts = useSeriesStore((s) => s.getOutlinePrompts)

  const latestOutline = outlines.length > 0 ? outlines[outlines.length - 1] : null

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || isGenerating) return
    setError(null)
    try {
      await generateOutline(topic.trim(), episodeCount, arc)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate series outline')
    }
  }, [topic, episodeCount, arc, isGenerating, generateOutline])

  const handleExecuteEpisode = useCallback(
    async (outline: SeriesOutline, episodeIndex: number) => {
      const prompts = getOutlinePrompts(outline)
      const prompt = prompts[episodeIndex]
      if (!prompt) return

      setExecutingEpisode(episodeIndex)

      const orchStore = useOrchestratorStore.getState()
      orchStore.setPrompt(prompt)

      orchStore.updateSettings({
        seriesContext: {
          seriesTitle: outline.title,
          episodeNumber: episodeIndex + 1,
          totalEpisodes: outline.episodeCount,
          sharedCharacters: outline.sharedCharacters,
          previousEpisodeSummaries: outline.episodes
            .slice(0, episodeIndex)
            .map((ep) => `Ep${ep.episodeNumber}: ${ep.title}`),
        },
      })

      try {
        await orchStore.generatePlan()
      } catch (err) {
        console.error('[SeriesPanel] Plan generation failed:', err)
      } finally {
        setExecutingEpisode(null)
      }
    },
    [getOutlinePrompts],
  )

  return (
    <div className="space-y-3">
      {/* Topic Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-zinc-400">Topic</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. '5 AI tips for beginners', 'History of space exploration'..."
          className="w-full bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-accent/30 focus:outline-none placeholder:text-zinc-600 transition-colors resize-none min-h-[60px]"
        />
      </div>

      {/* Settings Row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <PanelSelect
            label="Episodes"
            value={String(episodeCount)}
            onChange={(v) => setEpisodeCount(Number(v))}
            options={[3, 5, 7, 10].map((n) => ({ value: String(n), label: `${n} episodes` }))}
            fullWidth
          />
        </div>
        <div className="flex-1">
          <PanelSelect
            label="Arc"
            value={arc}
            onChange={(v) => setArc(v as NarrativeArc)}
            options={[
              { value: 'standalone', label: 'Standalone' },
              { value: 'progressive', label: 'Progressive' },
              { value: 'seasonal', label: 'Seasonal' },
            ]}
            fullWidth
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!topic.trim() || isGenerating}
        className={cn(
          'w-full py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all',
          !topic.trim() || isGenerating
            ? 'bg-panel-surface text-zinc-600 cursor-not-allowed border border-white/5'
            : 'bg-accent hover:bg-[#5a8eff] text-white shadow-lg shadow-accent/20',
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generating Outline...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Generate Series Plan
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-1.5 text-[10px] text-red-400">
          <AlertCircle size={10} />
          {error}
        </div>
      )}

      {/* Outline Preview */}
      {latestOutline && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <BookOpen size={12} className="text-accent" />
            <h4 className="text-xs font-medium text-zinc-200">{latestOutline.title}</h4>
          </div>
          <p className="text-[10px] text-zinc-500">{latestOutline.theme}</p>

          {latestOutline.sharedCharacters.length > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <Users size={10} className="text-accent" />
              {latestOutline.sharedCharacters.join(', ')}
            </div>
          )}

          {/* Episode List */}
          <div className="space-y-1.5">
            {latestOutline.episodes.map((ep, i) => (
              <EpisodeOutlineCard
                key={i}
                episode={ep}
                isExecuting={executingEpisode === i}
                onExecute={() => handleExecuteEpisode(latestOutline, i)}
              />
            ))}
          </div>

          {/* Execute All */}
          <button
            onClick={() => {
              for (let i = 0; i < latestOutline.episodes.length; i++) {
                handleExecuteEpisode(latestOutline, 0)
                break
              }
            }}
            className="w-full py-2 rounded-lg text-xs font-medium bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Play size={14} />
            Execute First Episode
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main Panel ──

export function SeriesPanel() {
  const templates = useSeriesStore((s) => s.templates)
  const activeTemplateId = useSeriesStore((s) => s.activeTemplateId)
  const selectTemplate = useSeriesStore((s) => s.selectTemplate)
  const removeTemplate = useSeriesStore((s) => s.removeTemplate)
  const resolvePrompt = useSeriesStore((s) => s.resolvePrompt)
  const addEpisode = useSeriesStore((s) => s.addEpisode)

  const [activeTab, setActiveTab] = useState<SeriesTabId>(templates.length > 0 ? 'templates' : 'generate')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [slotValues, setSlotValues] = useState<Record<string, string>>({})

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || null

  const q = search.toLowerCase().trim()

  const filteredTemplates = useMemo(() => {
    if (!q) return templates
    return templates.filter((t) => t.name.toLowerCase().includes(q) || t.promptTemplate.toLowerCase().includes(q))
  }, [templates, q])

  const handleSlotChange = useCallback((key: string, value: string) => {
    setSlotValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSelectTemplate = useCallback(
    (id: string) => {
      selectTemplate(activeTemplateId === id ? null : id)
      setSlotValues({})
    },
    [activeTemplateId, selectTemplate],
  )

  const handleGenerate = useCallback(() => {
    if (!activeTemplate) return

    const resolved = resolvePrompt(activeTemplate.id, slotValues)
    if (!resolved) return

    const missing = activeTemplate.slots.filter((s) => s.required && !slotValues[s.key]?.trim())
    if (missing.length > 0) return

    addEpisode({
      templateId: activeTemplate.id,
      slotValues: { ...slotValues },
      resolvedPrompt: resolved,
      status: 'pending',
    })

    const orchestratorStore = useOrchestratorStore.getState()
    orchestratorStore.setPrompt(resolved)
    orchestratorStore.updateSettings(activeTemplate.settings)
    orchestratorStore.generatePlan()

    setSlotValues({})
  }, [activeTemplate, slotValues, resolvePrompt, addEpisode])

  const missingRequired = activeTemplate
    ? activeTemplate.slots.filter((s) => s.required && !slotValues[s.key]?.trim())
    : []

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {SERIES_TABS.map((tab) => {
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
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-panel-surface',
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
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Search Bar + Filter Toggle (templates tab only) ── */}
      {activeTab === 'templates' && (
        <div className="shrink-0 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen ? 'bg-accent/20 text-accent' : 'text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface',
              )}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* Generate Tab */}
        {activeTab === 'generate' && <GenerateSeriesTab />}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <>
            {filteredTemplates.length === 0 && templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Repeat size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No series templates yet</span>
                <span className="text-xs text-gray-600 mt-1">
                  Save a clip as series template from the completion screen
                </span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Search size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No templates found</span>
                <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
              </div>
            ) : (
              <div className="space-y-1">
                {/* None row */}
                <button
                  onClick={() => {
                    selectTemplate(null)
                    setSlotValues({})
                  }}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                    !activeTemplateId
                      ? 'bg-accent/10 border-accent/30'
                      : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                  )}
                >
                  <Ban size={14} className="shrink-0 text-gray-500" />
                  <div>
                    <div className="text-xs font-medium text-gray-200">None</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">No template selected</div>
                  </div>
                </button>

                {/* Template rows */}
                {filteredTemplates.map((template) => {
                  const isSelected = activeTemplateId === template.id
                  const relativeTime = getRelativeTime(template.createdAt)
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-left transition-colors border group',
                        isSelected
                          ? 'bg-accent/10 border-accent/30'
                          : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-200 truncate">{template.name}</div>
                          <div className="text-[9px] text-gray-500 mt-0.5 line-clamp-1">{template.promptTemplate}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTemplate(template.id)
                          }}
                          className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[9px] text-zinc-500">
                          <Hash size={8} />
                          {template.slots.length} slot{template.slots.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-zinc-500">
                          <Repeat size={8} />
                          {template.episodeCount} ep{template.episodeCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] text-zinc-500 ml-auto">
                          <Clock size={8} />
                          {relativeTime}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Slot Editor */}
            {activeTemplate && (
              <div className="space-y-3 pt-3 mt-3 border-t border-white/5">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                  Fill Slots for &ldquo;{activeTemplate.name}&rdquo;
                </span>
                <SlotEditor template={activeTemplate} slotValues={slotValues} onSlotChange={handleSlotChange} />

                {missingRequired.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
                    <AlertCircle size={10} />
                    Fill required slots: {missingRequired.map((s) => s.label).join(', ')}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      {activeTab === 'templates' && activeTemplate && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <button
            onClick={handleGenerate}
            disabled={missingRequired.length > 0}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
              missingRequired.length > 0
                ? 'bg-panel-surface text-zinc-600 cursor-not-allowed border border-white/5'
                : 'bg-accent hover:bg-[#5a8eff] text-white shadow-lg shadow-accent/20',
            )}
          >
            <Play size={14} />
            Generate Episode
          </button>
        </div>
      )}
    </div>
  )
}
