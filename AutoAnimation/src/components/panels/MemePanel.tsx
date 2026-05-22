/**
 * MemePanel.tsx
 *
 * Meme template browser and editor panel. Provides a grid of meme
 * templates, a config editor with text inputs for each editable field,
 * a live preview, and an "Add to Canvas" button.
 *
 * Memes ARE HTML templates with a specialized UI. When added to canvas,
 * they create entries in useHTMLTemplateLayerStore and are rendered by
 * the existing HTMLTemplateLayer component.
 */

import { useState, useMemo, useRef } from 'react'
import { Smile, Search, ArrowLeft, Plus, RotateCcw, Eye, Type, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemeStore } from '@/stores/useMemeStore'
import { getTemplateContent } from '@/data/builtinTemplates'
import { bakeConfigIntoHtml } from '@/services/templateBridge'

// ── Meme Card ─────────────────────────────────────────────────────────

function MemeCard({
  id,
  emoji,
  name,
  description,
  isSelected,
  onClick,
}: {
  id: string
  emoji: string
  name: string
  description: string
  isSelected: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const htmlRef = useRef<string | null>(null)

  // Resolve HTML on first hover for preview
  const tpl = useMemeStore.getState().templates.find((t) => t.id === id)
  if (hovered && htmlRef.current === null && tpl) {
    htmlRef.current = getTemplateContent(tpl.filename) ?? ''
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'rounded-lg border overflow-hidden transition-all text-left group',
        isSelected
          ? 'border-accent/60 bg-accent/10 ring-1 ring-accent/30'
          : 'border-white/5 bg-panel-surface hover:border-accent/30',
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-panel-bg relative overflow-hidden flex items-center justify-center">
        {hovered && htmlRef.current ? (
          <iframe
            srcDoc={htmlRef.current}
            sandbox="allow-scripts"
            className="absolute inset-0 w-full h-full pointer-events-none border-0 z-[1]"
            style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}
            title={name}
          />
        ) : (
          <span className="text-4xl">{emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="p-2 space-y-0.5">
        <h4 className="text-[11px] font-semibold text-white truncate">{name}</h4>
        <p className="text-[9px] text-gray-500 line-clamp-2">{description}</p>
      </div>
    </button>
  )
}

// ── Config Editor ─────────────────────────────────────────────────────

function MemeConfigEditor() {
  const selectedTemplateId = useMemeStore((s) => s.selectedTemplateId)
  const meta = useMemeStore((s) => s.meta)
  const configValues = useMemeStore((s) => s.configValues)
  const updateConfig = useMemeStore((s) => s.updateConfig)
  const resetConfig = useMemeStore((s) => s.resetConfig)
  const addMemeToCanvas = useMemeStore((s) => s.addMemeToCanvas)
  const selectMeme = useMemeStore((s) => s.selectMeme)

  if (!selectedTemplateId) return null

  const templateMeta = meta[selectedTemplateId]
  if (!templateMeta) return null

  // Build preview HTML with current config values baked in
  const tpl = useMemeStore.getState().templates.find((t) => t.id === selectedTemplateId)
  const rawHtml = tpl ? getTemplateContent(tpl.filename) : null
  const previewHtml = rawHtml
    ? bakeConfigIntoHtml(
        rawHtml,
        Object.entries(configValues).map(([key, value]) => ({ key, value })),
      )
    : null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Back header ── */}
      <div className="shrink-0 px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectMeme(null)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-panel-surface transition-colors"
          >
            <ArrowLeft size={14} />
          </button>
          <span className="text-lg mr-1">{templateMeta.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-semibold text-white truncate">{templateMeta.name}</h3>
            <p className="text-[10px] text-gray-500">{templateMeta.description}</p>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Live preview */}
        {previewHtml && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
              <Eye size={10} /> Preview
            </div>
            <div className="border border-white/5 rounded-lg overflow-hidden bg-black aspect-square">
              <iframe
                srcDoc={previewHtml}
                sandbox="allow-scripts"
                className="w-full h-full pointer-events-none border-0"
                style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                title="Meme Preview"
              />
            </div>
          </div>
        )}

        {/* Text fields */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
            <Type size={10} /> Text Fields
          </div>
          {templateMeta.fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="text-[10px] font-medium text-gray-400">{field.label}</label>
              <textarea
                value={configValues[field.key] || ''}
                onChange={(e) => updateConfig(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={2}
                className="w-full bg-panel-bg border border-white/5 rounded-lg px-3 py-2 text-[11px] text-white resize-none focus:border-accent/50 focus:outline-none placeholder:text-gray-600 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <div className="flex gap-2">
          <button
            onClick={() => {
              addMemeToCanvas()
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent hover:bg-[#5a8aff] text-white text-[12px] font-semibold transition-colors"
          >
            <Plus size={13} /> Add to Canvas
          </button>
          <button
            onClick={resetConfig}
            className="px-3 py-2.5 rounded-lg bg-panel-surface hover:bg-panel-surface-hover text-gray-400 hover:text-white transition-colors border border-white/5"
            title="Reset to defaults"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────

const MEME_TABS = [
  { id: 'browse' as const, label: 'Browse', icon: Smile },
  { id: 'favorites' as const, label: 'Favorites', icon: Heart },
]

export function MemePanel() {
  const templates = useMemeStore((s) => s.templates)
  const meta = useMemeStore((s) => s.meta)
  const selectedTemplateId = useMemeStore((s) => s.selectedTemplateId)
  const selectMeme = useMemeStore((s) => s.selectMeme)
  const searchQuery = useMemeStore((s) => s.searchQuery)
  const setSearchQuery = useMemeStore((s) => s.setSearchQuery)
  const [activeTab, setActiveTab] = useState<'browse' | 'favorites'>('browse')

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates
    const q = searchQuery.toLowerCase()
    return templates.filter((tpl) => {
      const m = meta[tpl.id]
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.tags.some((tag) => tag.includes(q)) ||
        (m && m.name.toLowerCase().includes(q))
      )
    })
  }, [templates, meta, searchQuery])

  // If a meme is selected, show the editor
  if (selectedTemplateId) {
    return <MemeConfigEditor />
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Pill Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {MEME_TABS.map((tab) => {
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
                style={{ transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms' }}
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

      {activeTab === 'favorites' ? (
        /* ── Favorites empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
          <Heart size={28} className="mb-3" />
          <span className="text-sm text-gray-400">No favorites yet</span>
          <span className="text-xs text-gray-600 mt-1">Heart memes to save them here</span>
        </div>
      ) : (
        <>
          {/* ── Search Bar ── */}
          <div className="shrink-0 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search memes..."
                  className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-zinc-500 shrink-0">{filteredTemplates.length}</span>
            </div>
          </div>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Smile size={28} className="mb-3" />
                <span className="text-sm text-gray-400">
                  {searchQuery ? 'No memes found' : 'No meme templates available'}
                </span>
                <span className="text-xs text-gray-600 mt-1">
                  {searchQuery ? 'Try a different keyword' : 'Check back soon'}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredTemplates.map((tpl) => {
                  const m = meta[tpl.id]
                  return (
                    <MemeCard
                      key={tpl.id}
                      id={tpl.id}
                      emoji={m?.emoji || '\u{1F4AC}'}
                      name={m?.name || tpl.title}
                      description={m?.description || tpl.description}
                      isSelected={selectedTemplateId === tpl.id}
                      onClick={() => selectMeme(tpl.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
